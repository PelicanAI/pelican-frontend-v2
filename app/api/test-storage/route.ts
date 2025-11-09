// Temporary diagnostic endpoint - DELETE after debugging
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    // Check if env vars are set
    if (!process.env.SUPABASE_URL) {
      return NextResponse.json({ 
        error: "SUPABASE_URL not set" 
      }, { status: 500 })
    }

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ 
        error: "SUPABASE_SERVICE_ROLE_KEY not set" 
      }, { status: 500 })
    }

    const supabase = createClient(
      process.env.SUPABASE_URL, 
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    // Test 1: List buckets
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      return NextResponse.json({ 
        error: "Cannot list buckets", 
        details: listError.message
      }, { status: 500 })
    }

    // Test 2: Check pelican bucket exists
    const pelicanBucket = buckets?.find(b => b.name === 'pelican')

    // Test 3: If bucket exists, try to list files
    let canListFiles = false
    let listFilesError = null
    if (pelicanBucket) {
      const { error: filesError } = await supabase.storage
        .from('pelican')
        .list('uploads', { limit: 1 })
      
      canListFiles = !filesError
      listFilesError = filesError?.message
    }

    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      buckets: buckets?.map(b => ({ name: b.name, public: b.public })),
      pelicanBucketExists: !!pelicanBucket,
      canListFiles,
      listFilesError,
      envVarsSet: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        urlValue: process.env.SUPABASE_URL, // Show actual URL for verification
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Storage test failed", 
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}

