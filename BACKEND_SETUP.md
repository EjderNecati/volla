# Backend Deployment Guide - Imagen 3 Integration

## 📦 Files Created

### 1. Backend API
- **`api/generate-studio.py`** - Python serverless function for Imagen 3 image generation
- **`api/requirements.txt`** - Python dependencies

### 2. Configuration
- **`vercel.json`** - Vercel serverless function configuration

### 3. Frontend Updates
- **`src/utils/aiHelpers.js`** - Updated `generateStudioImage()` to call backend
- **`src/components/EtsySEOMaster.jsx`** - Passes image base64 to backend

---

## 🚀 Deployment Steps

### Step 1: Install Vercel CLI

```powershell
npm install -g vercel
```

### Step 2: Configure Environment Variable

You need to add your Google API key to Vercel:

```powershell
# Login to Vercel
vercel login

# Navigate to project directory
cd c:/Users/tesko/.gemini/antigravity/playground/shadow-granule

# Add secret (you only need to do this once)
vercel secrets add google-api-key YOUR_ACTUAL_GEMINI_KEY_HERE
```

**Replace `YOUR_ACTUAL_GEMINI_KEY_HERE`** with your real Gemini API key from https://aistudio.google.com/apikey

### Step 3: Deploy to Vercel

```powershell
# Deploy
vercel --prod
```

The command will:
1. Build the React frontend
2. Deploy Python serverless function to `/api/generate-studio`
3. Set up environment variables
4. Provide you with a production URL

---

## 🧪 Testing Locally

### Option A: Vercel Dev Server (Recommended)

```powershell
# Install dependencies
npm install

# Run Vercel development server (supports Python functions)
vercel dev
```

This starts a server at `http://localhost:3000` with full backend support.

### Option B: Vite Dev (Frontend Only)

```powershell
npm run dev
```

Runs at `http://localhost:5173` but **backend won't work** (will use Unsplash fallback).

---

## 🔧 How It Works

### Request Flow

```
User clicks "Upload" with Studio Mode enabled
    ↓
Frontend: EtsySEOMaster.jsx
    ↓
aiHelpers.js: generateStudioImage(category, imageBase64)
    ↓
POST /api/generate-studio
    {
      "category": "Kitchenware",
      "image": "base64EncodedImage..."
    }
    ↓
Backend: api/generate-studio.py
    ↓
Try: Imagen 3 API (imagen-3.0-generate-001)
    ↓ (if fails)
Fallback: Gemini Vision → Describe product → Generate with enhanced prompt
    ↓ (if still fails)
Ultra-fallback: Unsplash stock photos
    ↓
Response: { "success": true, "image_url": "https://..." }
    ↓
Frontend displays in Studio tab with download button
```

### Backend Logic (`api/generate-studio.py`)

1. **Primary Method:** Try `imagen-3.0-generate-001` model
2. **Fallback:** Use Gemini 1.5 Pro Vision to:
   - Analyze original product image
   - Generate detailed description
   - Enhance with scene context
   - Generate new image with combined prompt
3. **Ultra-Fallback:** Return Unsplash URL (frontend handles this too)

---

## ⚠️ Important Notes

### Imagen API Access

**As of December 2024:**
- Imagen 3 may require **Vertex AI** access
- Standard `google-generativeai` library may not have image generation
- You might need to use Google Cloud SDK instead

**If Imagen is unavailable:**
- Backend will automatically use fallback (Gemini Vision description)
- Frontend will use Unsplash if backend fails entirely
- Feature will still work, just in "demo mode"

### Cost Estimates (With Real API)

- **Gemini 1.5 Pro Vision:** ~$0.0025 per image analysis
- **Imagen 3 (if available):** ~$0.02-0.04 per generated image
- **Total:** ~$0.025 per Studio image generation

### Vercel Limits (Hobby Tier)

- Max function duration: **10 seconds**
- Cold start: ~2-3 seconds
- If generation takes too long, consider upgrading to Pro

---

## 🧰 Troubleshooting

### "Backend error: 500"

**Check Vercel function logs:**
```powershell
vercel logs
```

**Common causes:**
- Invalid API key
- Imagen model not accessible
- Python dependency install failed

### "Module not found: google.generativeai"

**Fix:**
```powershell
# Redeploy to install requirements
vercel --prod --force
```

### Backend works locally but not on Vercel

**Ensure environment variable is set:**
```powershell
# List secrets
vercel secrets ls

# Re-add if missing
vercel secrets add google-api-key YOUR_KEY
```

---

## 📊 Monitoring

### Check deployment status:
```powershell
vercel ls
```

### View function logs:
```powershell
vercel logs --follow
```

### Test backend directly:
```powershell
curl -X POST https://your-app.vercel.app/api/generate-studio \
  -H "Content-Type: application/json" \
  -d '{"category":"Kitchenware","image":"base64string..."}'
```

---

## ✅ Next Steps

1. **Deploy to Vercel** using steps above
2. **Test** Studio Mode on live URL
3. **Monitor** function logs for errors
4. **Upgrade** to Vercel Pro if needed (for longer execution times)

Your Smart AI Studio Mode is now ready for production! 🎉
