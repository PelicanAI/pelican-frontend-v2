# 🐛 File Upload 500 Error - Debugging Guide

## 🚨 **ERROR IDENTIFIED**

```
api/upload:1  Failed to load resource: the server responded with a status of 500 ()
[v0] Multiple files uploaded: Array(1)
```

---

## 🔍 **ROOT CAUSE ANALYSIS**

The 500 error typically occurs due to:

### **Most Likely Causes (Check in Order):**

#### **1. Supabase Storage Not Enabled** ⭐ MOST COMMON
**Check:**
1. Go to Supabase Dashboard → **Storage**
2. Is the Storage feature enabled?
3. Do you see a "pelican" bucket?

**Fix:**
1. Enable Storage in Supabase
2. Create a bucket called "pelican"
3. Set permissions: **Public: NO**, **File Size Limit: 20MB**

#### **2. Service Role Key Has Wrong Permissions**
**Check:**
1. Settings → API → service_role key
2. This key should have **full database and storage access**

**Fix:**
1. Copy the correct service_role key
2. Update `.env.local` → `SUPABASE_SERVICE_ROLE_KEY=your_key_here`
3. Restart server: `npm run dev`

#### **3. Storage Bucket Doesn't Exist**
**The app tries to auto-create it, but if permissions are wrong, it fails.**

**Manual Fix:**
1. Go to Supabase → Storage
2. Click "Create Bucket"
3. Name: `pelican`
4. Public: **NO** (keep private)
5. File size limit: 20MB
6. MIME types: Allow all

#### **4. RLS (Row Level Security) Blocking Upload**
**Check:**
1. Storage → pelican bucket → Policies
2. Are there any RLS policies blocking service_role access?

**Fix:**
Service role should **bypass** RLS by default. If not:
1. Delete all policies on the bucket
2. Or add policy: `service_role` can do anything

---

## 🛠️ **STEP-BY-STEP FIX**

### **Step 1: Enable Supabase Storage**

```sql
-- Run this in Supabase SQL Editor to verify storage is set up
SELECT * FROM storage.buckets;
```

**Expected:** Should return list of buckets (might be empty)  
**If Error:** Storage extension not enabled

### **Step 2: Create Pelican Bucket (Manual)**

Go to Supabase Dashboard:
1. **Storage** → **Create new bucket**
2. **Name:** `pelican`
3. **Public:** ❌ NO (keep private)
4. **File size limit:** 20971520 bytes (20MB)
5. **Allowed MIME types:** Leave empty (allow all)
6. Click **Create Bucket**

### **Step 3: Verify Bucket Created**

```sql
-- Run in SQL Editor
SELECT id, name, public FROM storage.buckets WHERE name = 'pelican';
```

**Expected:**
```
id   | name    | public
-----|---------|-------
uuid | pelican | false
```

### **Step 4: Test Upload via Console**

Open browser DevTools Console and run:

```javascript
// Test if Supabase storage is accessible
fetch('/api/health')
  .then(r => r.json())
  .then(console.log)
```

**Expected:** `{ status: "ok", timestamp: "..." }`

### **Step 5: Restart Dev Server**

```powershell
# Stop server (Ctrl + C)
npm run dev
# Try uploading again
```

---

## 🔬 **DIAGNOSTIC COMMANDS**

### **Check Supabase Connection**

Add this temporary diagnostic endpoint:

**Create:** `app/api/test-storage/route.ts`

```typescript
import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
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

    return NextResponse.json({
      status: "ok",
      buckets: buckets?.map(b => b.name),
      pelicanBucketExists: !!pelicanBucket,
      envVarsSet: {
        SUPABASE_URL: !!process.env.SUPABASE_URL,
        SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      }
    })
  } catch (error) {
    return NextResponse.json({ 
      error: "Storage test failed", 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
```

**Then visit:** `http://localhost:3000/api/test-storage`

**Expected Response:**
```json
{
  "status": "ok",
  "buckets": ["pelican"],
  "pelicanBucketExists": true,
  "envVarsSet": {
    "SUPABASE_URL": true,
    "SUPABASE_SERVICE_ROLE_KEY": true
  }
}
```

---

## 📋 **QUICK CHECKLIST**

- [ ] Supabase Storage feature enabled
- [ ] "pelican" bucket exists
- [ ] Bucket is set to private (public: false)
- [ ] Service role key is correct
- [ ] Environment variables loaded (`npm run dev` restarted)
- [ ] No RLS policies blocking access
- [ ] Browser console shows actual error message

---

## 🆘 **GET THE ACTUAL ERROR MESSAGE**

The browser console should show the actual error. Please check:

1. Open DevTools (F12)
2. Go to **Console** tab
3. Look for red error messages after upload fails
4. Share the full error message (it will tell us exactly what went wrong)

**Common Error Messages:**

| Error | Cause | Fix |
|-------|-------|-----|
| "Storage service unavailable" | Can't list buckets | Check service_role key |
| "Failed to initialize storage" | Can't create bucket | Create bucket manually |
| "Failed to upload file" | Upload to bucket failed | Check bucket permissions |
| "Failed to generate access URL" | Can't create signed URL | Check storage settings |

---

## 🎯 **IMMEDIATE ACTION**

**Please share the full error message from:**
1. Browser DevTools Console (the detailed error)
2. Terminal where `npm run dev` is running (server logs)

This will help me pinpoint the exact issue!

---

## 🌍 **REGARDING LANGUAGE SETTINGS**

**We did NOT implement multi-language in this session.** That was FIX 48 in the "optional" category (5 remaining fixes not implemented).

**Would you like me to implement it now?** It would take about 30 minutes to add:
- Language selector component
- 5 language files (EN, ES, ZH, JA, PT)
- Locale detection
- Translation system

Let me know if you need this feature!

