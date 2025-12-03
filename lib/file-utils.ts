import { ACCEPTED_FILE_TYPES } from "@/lib/constants"

export interface UploadedFile {
  id: string
  file: File
  url: string
  type: "image" | "spreadsheet" | "document"
  uploadedAt: Date
}

export function createUploadedFile(file: File): UploadedFile {
  return {
    id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    file,
    url: URL.createObjectURL(file),
    type: getFileTypeCategory(file),
    uploadedAt: new Date(),
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/")
}

export function getFileExtension(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() || ""
}

export async function convertFileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result)
      } else {
        reject(new Error("Failed to convert file to base64"))
      }
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function cleanupFileUrl(url: string): void {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url)
  }
}

export function isAcceptedFileType(file: File): boolean {
  const fileExtension = getFileExtension(file.name)

  // Check by MIME type first
  if (file.type && ACCEPTED_FILE_TYPES[file.type as keyof typeof ACCEPTED_FILE_TYPES]) {
    return true
  }

  // Fallback to extension check
  const acceptedExtensions = Object.values(ACCEPTED_FILE_TYPES).flat()
  return acceptedExtensions.includes(`.${fileExtension}` as typeof acceptedExtensions[number])
}

export function getFileTypeCategory(file: File): "image" | "spreadsheet" | "document" {
  if (file.type.startsWith("image/")) {
    return "image"
  }

  const extension = getFileExtension(file.name)
  if (extension === "xlsx" || extension === "xls" || extension === "csv") {
    return "spreadsheet"
  }

  return "document"
}

export function getAcceptedFileTypesString(): string {
  return Object.values(ACCEPTED_FILE_TYPES).flat().join(",")
}
