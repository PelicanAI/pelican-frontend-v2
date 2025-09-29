import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { createHash } from "crypto"
import { sanitizeFilename } from "@/lib/sanitize"
import { captureException, addBreadcrumb } from "@/lib/sentry"

const MAX_FILE_SIZE = 15 * 1024 * 1024 // 15MB in bytes

const ALLOWED_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "application/pdf",
  "text/csv",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]

const MAGIC_BYTES = {
  "image/png": [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  "image/jpeg": [0xff, 0xd8, 0xff],
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // %PDF
  "text/csv": [], // CSV has no magic bytes, will skip validation
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [0x50, 0x4b, 0x03, 0x04], // ZIP signature (XLSX is ZIP-based)
}

function validateMagicBytes(buffer: ArrayBuffer, mimeType: string): boolean {
  const magicBytes = MAGIC_BYTES[mimeType as keyof typeof MAGIC_BYTES]
  if (!magicBytes || magicBytes.length === 0) return true // Skip validation for types without magic bytes

  const fileBytes = new Uint8Array(buffer.slice(0, Math.max(8, magicBytes.length)))
  return magicBytes.every((byte, index) => fileBytes[index] === byte)
}

function computeChecksum(buffer: ArrayBuffer): string {
  const hash = createHash("sha256")
  hash.update(new Uint8Array(buffer))
  return hash.digest("hex")
}

export async function POST(request: NextRequest) {
  const requestId = uuidv4()
  let userId: string | undefined
  let guestId: string | undefined
  let fileMeta: { name: string; type: string; size: number; checksum?: string } | undefined

  try {
    addBreadcrumb("Upload request started", { requestId })
    console.log(`[${requestId}] Upload request started`)

    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

    const authHeader = request.headers.get("authorization")
    if (authHeader) {
      const {
        data: { user },
      } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""))
      userId = user?.id
    }
    if (!userId) {
      const forwarded = request.headers.get("x-forwarded-for")
      const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown"
      guestId = `guest_${ip}`
    }

    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error(`[${requestId}] Error listing buckets:`, listError)
      captureException(new Error(`Failed to list buckets: ${listError.message}`), {
        reqId: requestId,
        userId,
        guestId,
      })
      return NextResponse.json({ error: "Storage service unavailable" }, { status: 500 })
    }

    const pelicanBucket = buckets?.find((bucket) => bucket.name === "pelican")

    if (!pelicanBucket) {
      console.log(`[${requestId}] Creating pelican bucket`)
      addBreadcrumb("Creating pelican bucket", { requestId })
      const { error: createError } = await supabase.storage.createBucket("pelican", {
        public: false,
        fileSizeLimit: "20mb",
      })

      if (createError) {
        console.error(`[${requestId}] Error creating bucket:`, createError)
        captureException(new Error(`Failed to create bucket: ${createError.message}`), {
          reqId: requestId,
          userId,
          guestId,
        })
        return NextResponse.json({ error: "Failed to initialize storage" }, { status: 500 })
      }
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      console.log(`[${requestId}] No file provided`)
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const sanitizedFilename = sanitizeFilename(file.name)

    fileMeta = {
      name: sanitizedFilename,
      type: file.type,
      size: file.size,
    }

    addBreadcrumb("File received", { requestId, fileMeta })

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      console.log(`[${requestId}] Unsupported MIME type: ${file.type}`)
      return NextResponse.json(
        {
          error: "Unsupported file type",
          code: "unsupported_type",
        },
        { status: 400 },
      )
    }

    if (file.size > MAX_FILE_SIZE) {
      console.log(`[${requestId}] File too large: ${file.size} bytes`)
      return NextResponse.json({ error: "File size exceeds 15MB limit" }, { status: 413 })
    }

    const fileBuffer = await file.arrayBuffer()

    if (!validateMagicBytes(fileBuffer, file.type)) {
      console.log(`[${requestId}] MIME type mismatch for ${file.type}`)
      return NextResponse.json(
        {
          error: "File content doesn't match declared type",
          code: "mime_mismatch",
        },
        { status: 400 },
      )
    }

    const checksum = computeChecksum(fileBuffer)
    fileMeta.checksum = checksum
    console.log(`[${requestId}] File checksum: ${checksum}`)

    addBreadcrumb("File validated and checksum computed", { requestId, checksum })

    // const existingFile = await getByChecksum(checksum, file.type, file.size)

    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, "0")
    const uuid = uuidv4()
    const fileExtension = sanitizedFilename.split(".").pop() || "bin"
    const storageKey = `uploads/${year}/${month}/${uuid}.${fileExtension}`

    console.log(`[${requestId}] Uploading new file: ${file.name} (${file.size} bytes) as ${storageKey}`)
    addBreadcrumb("Uploading new file", { requestId, storageKey })

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("pelican")
      .upload(storageKey, fileBuffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      })

    if (uploadError) {
      console.error(`[${requestId}] Upload error:`, uploadError)
      captureException(new Error(`File upload failed: ${uploadError.message}`), {
        reqId: requestId,
        userId,
        guestId,
        fileMeta,
      })
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 })
    }

    const fileId = uuidv4()
    addBreadcrumb("File uploaded successfully", { requestId, fileId })

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("pelican")
      .createSignedUrl(storageKey, 7 * 24 * 60 * 60) // 7 days in seconds

    if (signedUrlError) {
      console.error(`[${requestId}] Signed URL error:`, signedUrlError)
      captureException(new Error(`Failed to generate signed URL: ${signedUrlError.message}`), {
        reqId: requestId,
        userId,
        guestId,
        fileMeta,
      })
      return NextResponse.json({ error: "Failed to generate access URL" }, { status: 500 })
    }

    console.log(`[${requestId}] Upload successful: ${storageKey}`)
    addBreadcrumb("Upload completed successfully", { requestId, storageKey })

    return NextResponse.json({
      id: fileId,
      url: signedUrlData.signedUrl,
      key: storageKey,
      name: file.name,
      type: file.type,
      size: file.size,
      checksum,
      public: false,
    })
  } catch (error) {
    console.error(`[${requestId}] Upload API error:`, error)
    captureException(error instanceof Error ? error : new Error(String(error)), {
      reqId: requestId,
      userId,
      guestId,
      fileMeta,
    })
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
