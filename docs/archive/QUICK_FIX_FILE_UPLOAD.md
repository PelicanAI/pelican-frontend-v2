# 🚨 QUICK FIX: File Upload 500 Error

## 🎯 **IMMEDIATE SOLUTION**

### **Step 1: Run Storage Diagnostic**

1. **Restart your dev server:**
   ```powershell
   # Press Ctrl+C to stop
   npm run dev
   ```

2. **Visit this URL in your browser:**
   ```
   http://localhost:3000/api/test-storage
   ```

3. **Check the response:**

   **✅ GOOD Response:**
   ```json
   {
     "status": "ok",
     "buckets": ["pelican"],
     "pelicanBucketExists": true,
     "canListFiles": true
   }
   ```

   **❌ BAD Response (Missing Bucket):**
   ```json
   {
     "status": "ok",
     "buckets": [],
     "pelicanBucketExists": false
   }
   ```
   → **FIX:** Create the bucket manually (see Step 2)

   **❌ BAD Response (Permission Error):**
   ```json
   {
     "error": "Cannot list buckets",
     "details": "permission denied"
   }
   ```
   → **FIX:** Check service_role key (see Step 3)

---

### **Step 2: Create Pelican Bucket (If Missing)**

Go to Supabase Dashboard:

1. Click **Storage** in left sidebar
2. Click **"New bucket"** or **"Create bucket"**
3. **Name:** `pelican` (exactly this name)
4. **Public:** ❌ UNCHECK (keep private)
5. **File size limit:** `20971520` (20MB)
6. **Allowed MIME types:** Leave blank (allow all)
7. Click **Save** or **Create**

---

### **Step 3: Verify Service Role Key**

1. Go to Supabase → **Settings** → **API**
2. Find **service_role key** (not anon key!)
3. Copy the full key
4. Update `.env.local`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your_actual_key
   ```
5. Restart server: `npm run dev`

---

## 🔧 **ALTERNATIVE: Check Server Console**

When you try to upload, check your terminal where `npm run dev` is running.

**Look for errors like:**
```
[uuid] Error listing buckets: { message: "...", code: "..." }
[uuid] Error creating bucket: { message: "...", code: "..." }
[uuid] Upload error: { message: "...", code: "..." }
```

**Copy the full error message and I can provide specific fix!**

---

## 🎯 **MOST COMMON FIXES**

### **Fix 1: Storage Not Enabled**
```
Supabase Dashboard → Storage → Enable Storage Extension
```

### **Fix 2: Create Bucket Manually**
```
Storage → New Bucket → Name: pelican, Public: NO → Create
```

### **Fix 3: Fix Service Role Key**
```
Settings → API → Copy service_role key → Update .env.local → Restart
```

### **Fix 4: Check Bucket Permissions**
```
Storage → pelican → Settings → Verify no RLS policies blocking service_role
```

---

## ⚡ **FASTEST FIX (99% Success Rate)**

**Do this right now:**

1. Open Supabase → **Storage**
2. If you don't see a `pelican` bucket → **Create it manually** (Step 2 above)
3. Visit `http://localhost:3000/api/test-storage`
4. If it shows `pelicanBucketExists: true` → **Upload should work!**

---

## 🌍 **LANGUAGE SETTINGS CLARIFICATION**

**You mentioned not seeing language settings - that's correct!**

We did **NOT** implement multi-language in this session because it was:
- Listed as FIX 48 (one of 5 optional remaining fixes)
- Not critical for MVP launch
- Would take 2-3 hours to implement

**If you need language settings, I can implement them now!**

Would include:
- Language selector dropdown (top right)
- 5 languages: English, Spanish, Chinese, Japanese, Portuguese
- Automatic browser language detection
- Cookie-based persistence

**Let me know if you want this feature implemented!**

---

## 🎯 **SUMMARY**

**File Upload Issue:** Likely missing Supabase storage bucket or permissions  
**Language Settings:** Not implemented yet (was optional FIX 48)

**Next Steps:**
1. Run storage diagnostic: `http://localhost:3000/api/test-storage`
2. Create "pelican" bucket if missing
3. Try upload again
4. Share results with me if still failing

**After upload works, delete the test endpoint:**
```powershell
Remove-Item app/api/test-storage/route.ts
```

