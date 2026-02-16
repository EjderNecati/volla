"""
Handsfree Mode - Gemini 3 Pro Image Preview with OAuth2 (REST API)
Uses Service Account + REST API for gemini-3-pro-image-preview
ONLY for Handsfree Mode - does not affect Real Life or Shots
"""

import os
import base64
import json
import traceback
import time
import requests
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🎯 Handsfree Mode - Gemini 3 Pro (OAuth2 REST)")
print("=" * 60)

# Get Service Account credentials from environment
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")

# Parse credentials and setup OAuth2
oauth2_token = None
project_id = None

try:
    if GOOGLE_CREDENTIALS_JSON:
        from google.oauth2 import service_account
        import google.auth.transport.requests
        
        # Parse the JSON credentials
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        project_id = creds_dict.get("project_id", "")
        
        # Create credentials from service account info
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        
        # Refresh to get token
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token
        
        print(f"✅ OAuth2 token obtained for project: {project_id}")
    else:
        print("⚠️ No GOOGLE_APPLICATION_CREDENTIALS_JSON found")
except Exception as e:
    print(f"⚠️ OAuth2 setup failed: {e}")

# Fallback to regular genai (for gemini-2.0-flash)
genai_fallback = None
FALLBACK_API_KEY = os.environ.get("VERTEX_API_KEY") or os.environ.get("GOOGLE_API_KEY")
try:
    import google.generativeai as genai_module
    genai_fallback = genai_module
    if FALLBACK_API_KEY:
        genai_fallback.configure(api_key=FALLBACK_API_KEY)
        print("✅ Fallback genai configured")
except ImportError as e:
    print(f"⚠️ Fallback genai not available: {e}")


_last_errors = []


def generate_with_imagen3_edit(image_data, prompt, aspect_ratio='1:1'):
    """Generate image using Imagen 3 Edit/Capability API - WITH REFERENCE IMAGE"""
    global _last_errors

    token = get_fresh_token()
    if not token or not project_id:
        _last_errors.append("Imagen 3: No OAuth2 token or project_id")
        print("   ⚠️ No OAuth2 token or project_id available for Imagen 3")
        return None

    # Clean base64
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)

    # Imagen 3 CAPABILITY endpoint (supports reference images!)
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-capability-001:predict"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Build prompt with reference - [1] refers to the product image
    full_prompt = f"Generate a professional photo of [1]. {prompt}"

    payload = {
        "instances": [{
            "prompt": full_prompt,
            "referenceImages": [{
                "referenceType": "REFERENCE_TYPE_SUBJECT",
                "referenceId": 1,
                "referenceImage": {
                    "bytesBase64Encoded": base64_clean
                },
                "subjectImageConfig": {
                    "subjectType": "SUBJECT_TYPE_PRODUCT"
                }
            }]
        }],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect_ratio if aspect_ratio != 'original' else '1:1',
            "personGeneration": "allow_adult",
            "safetyFilterLevel": "block_only_high"
        }
    }

    try:
        print(f"   🎨 Calling Imagen 3 Edit API (ratio={aspect_ratio})...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)

        if response.status_code == 200:
            result = response.json()
            predictions = result.get("predictions", [])

            if predictions and predictions[0].get("bytesBase64Encoded"):
                img_b64 = predictions[0]["bytesBase64Encoded"]
                print(f"   ✅ Imagen 3 Edit success!")
                return f"data:image/png;base64,{img_b64}"

        error_text = response.text[:300] if response.text else "Unknown error"
        _last_errors.append(f"Imagen 3 Edit: {response.status_code} - {error_text}")
        print(f"   ⚠️ Imagen 3 Edit response: {response.status_code} - {error_text}")

    except Exception as e:
        _last_errors.append(f"Imagen 3 Edit: {str(e)[:150]}")
        print(f"   ❌ Imagen 3 Edit API error: {e}")

    return None


def get_fresh_token():
    """Get a fresh OAuth2 token (tokens expire after 1 hour)"""
    global oauth2_token
    
    if not GOOGLE_CREDENTIALS_JSON:
        return None
    
    try:
        from google.oauth2 import service_account
        import google.auth.transport.requests
        
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token
        return oauth2_token
    except Exception as e:
        print(f"⚠️ Token refresh failed: {e}")
        return None


def build_handsfree_prompt(user_prompt, is_edit_mode=False):
    """Build the full prompt with product preservation rules"""

    preservation_rules = """
═══════════════════════════════════════════════════════════════════════════════
⚠️ ABSOLUTE PRODUCT PRESERVATION - ZERO TOLERANCE FOR ANY CHANGES ⚠️
═══════════════════════════════════════════════════════════════════════════════

THE PRODUCT IN THIS IMAGE IS SACRED AND UNTOUCHABLE:

1. TEXT PRESERVATION (CRITICAL):
   - Every letter, number, symbol MUST be PIXEL-PERFECT identical
   - Font style, size, weight, color MUST NOT change
   - Text positioning MUST NOT shift even 1 pixel
   - If text says "ABC123" it MUST remain "ABC123" exactly

2. LOGO & BRANDING:
   - Logos MUST be copied exactly as they appear
   - Logo colors MUST NOT shift even 1% in hue/saturation
   - Logo proportions MUST NOT change at all

3. TEXTURE & MATERIAL:
   - Every thread, stitch, weave pattern MUST be visible
   - Surface textures (matte, glossy, rough, smooth) MUST be preserved
   - Material appearance MUST NOT change

4. COLOR:
   - Exact RGB values MUST be maintained
   - No color correction on the product
   - Shadows and highlights on product MUST match original

5. SHAPE & GEOMETRY:
   - Dimensions, proportions MUST be exactly the same
   - No stretching, warping, or perspective changes on product

═══════════════════════════════════════════════════════════════════════════════
🎯 PHOTOREALISTIC OUTPUT REQUIREMENTS
═══════════════════════════════════════════════════════════════════════════════

OUTPUT MUST LOOK LIKE A REAL PHOTOGRAPH:
- Shot with professional DSLR camera (Canon 5D, Sony A7, Nikon D850)
- NOT AI-generated looking, NOT rendered, NOT illustrated
- Natural depth of field, authentic bokeh
- Professional studio or natural lighting
- Realistic shadows and highlights
- Sharp focus on product
- Natural color grading like professional product photography

⛔ FORBIDDEN:
- DO NOT add text/logos that don't exist in source
- DO NOT change product colors/patterns/textures
- DO NOT make it look AI-generated or artistic
- DO NOT use unrealistic lighting
"""

    if is_edit_mode:
        return f"""{preservation_rules}

═══════════════════════════════════════════════════════════════════════════════
🔧 EDIT MODE - MODIFY BACKGROUND/ENVIRONMENT ONLY
═══════════════════════════════════════════════════════════════════════════════

USER'S EDIT REQUEST: {user_prompt}

INSTRUCTIONS:
1. The PRODUCT must remain 100% IDENTICAL - copy it pixel by pixel
2. Only modify the BACKGROUND/ENVIRONMENT as requested
3. Output should look like the same product photographed in a modified environment"""
    else:
        return f"""{preservation_rules}

═══════════════════════════════════════════════════════════════════════════════
🎨 GENERATE NEW PROFESSIONAL PRODUCT PHOTOGRAPH
═══════════════════════════════════════════════════════════════════════════════

USER'S REQUEST: {user_prompt}

INSTRUCTIONS:
1. PRESERVE THE PRODUCT EXACTLY - pixel-perfect identical to source
2. Create new background/environment based on user's request
3. This is like professional product photography - same product, different backdrop
4. Make it look like a REAL photograph, not AI-generated"""


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        global _last_errors
        _last_errors = []
        
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            action = data.get('action', 'generate')
            image_data = data.get('image', '')
            user_prompt = data.get('prompt', '')
            is_edit_mode = data.get('isEditMode', False)
            aspect_ratio = data.get('aspectRatio', 'original')

            print(f"\n{'='*60}")
            print("🎯 HANDSFREE MODE - Gemini 3 Pro (OAuth2 REST)")
            print(f"   Action: {action}")
            print(f"   Edit Mode: {is_edit_mode}")
            print(f"   User Prompt: {user_prompt[:100] if user_prompt else '(none)'}...")
            print(f"   OAuth2: {'Available' if oauth2_token else 'Not available'}")
            print(f"{'='*60}")

            # Build full prompt with preservation rules
            custom_prompt = build_handsfree_prompt(user_prompt, is_edit_mode)
            
            if not image_data:
                raise ValueError("No image provided")
            
            # Only require prompt for 'generate' action, not 'analyze'
            if action == 'generate' and not user_prompt:
                raise ValueError("No prompt provided")
            
            # Handle 'analyze' action - just return basic analysis
            if action == 'analyze':
                # Return dummy analysis for now (frontend handles the logic)
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'shape_description': 'product',
                    'primary_colors': ['various'],
                    'patterns': 'none'
                }).encode())
                return
            
            result = None
            method_used = 'none'

            # Method 1: Try Gemini 3 Pro Image FIRST (PRIMARY) - best for image generation
            token = get_fresh_token()
            if token and project_id:
                print("🔄 Trying Gemini 3 Pro Image via REST API (PRIMARY)...")
                result = generate_with_rest_api(image_data, custom_prompt, token, project_id, aspect_ratio)
                if result:
                    method_used = 'Gemini 3 Pro Image'

            # Method 2: Fallback to gemini-2.0-flash-exp with API key
            if not result and genai_fallback:
                print("🔄 Gemini 3 Pro failed, trying Gemini 2.0 Flash Exp fallback...")
                result = generate_with_fallback(image_data, custom_prompt, aspect_ratio)
                if result:
                    method_used = 'Gemini 2.0 Flash Exp'
            
            if result:
                print(f"✅ Success with {method_used}!")
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                self.wfile.write(json.dumps({
                    'success': True,
                    'generated_image': result,
                    'image_url': result,
                    'method_used': method_used
                }).encode())
            else:
                error_details = " | ".join(_last_errors) if _last_errors else "Unknown error"
                raise Exception(f"All models failed: {error_details[:500]}")
            
        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e),
                'error_message': str(e),
                'model_errors': _last_errors if _last_errors else [],
                'method_used': 'Error'
            }).encode())


def generate_with_rest_api(image_data, custom_prompt, token, project_id, aspect_ratio='original'):
    """Generate using Vertex AI REST API with OAuth2 token"""
    global _last_errors
    
    # Clean base64
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
        mime_type = 'image/png' if 'png' in image_data.lower() else 'image/jpeg'
    else:
        base64_clean = image_data
        mime_type = 'image/jpeg'
    
    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)
    
    # Build aspect ratio instruction
    aspect_instruction = ''
    if aspect_ratio and aspect_ratio != 'original':
        aspect_instruction = f"\n\nOutput aspect ratio: {aspect_ratio}."

    # Full prompt (custom_prompt already contains preservation rules from build_handsfree_prompt)
    generation_prompt = f"""{custom_prompt}{aspect_instruction}

QUALITY: Ultra-photorealistic, professional DSLR photograph, natural lighting, sharp focus."""

    # Models to try via Vertex AI OAuth2
    # Same as old working code from fb09286
    models_to_try = [
        'gemini-3-pro-image-preview',
        'gemini-2.0-flash-exp',
    ]
    
    for model_name in models_to_try:
        try:
            print(f"   Trying {model_name} via REST API...")

            # Vertex AI REST endpoint
            # gemini-3-pro-image-preview requires global location
            if model_name == 'gemini-3-pro-image-preview':
                url = f"https://aiplatform.googleapis.com/v1/projects/{project_id}/locations/global/publishers/google/models/{model_name}:generateContent"
            else:
                url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/{model_name}:generateContent"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "contents": [
                    {
                        "role": "user",
                        "parts": [
                            {"text": generation_prompt},
                            {
                                "inlineData": {
                                    "mimeType": mime_type,
                                    "data": base64_clean
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "responseModalities": ["IMAGE", "TEXT"]
                }
            }
            
            print(f"   Making request to Vertex AI...")
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            
            print(f"   Response status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                
                # Extract image from response
                if "candidates" in result:
                    for candidate in result["candidates"]:
                        if "content" in candidate and "parts" in candidate["content"]:
                            for part in candidate["content"]["parts"]:
                                if "inlineData" in part:
                                    img_data = part["inlineData"]["data"]
                                    img_mime = part["inlineData"].get("mimeType", "image/png")
                                    print(f"   ✅ REST API success with {model_name}!")
                                    return f"data:{img_mime};base64,{img_data}"
                
                _last_errors.append(f"{model_name} (REST): No image in response")
            else:
                error_text = response.text[:300]
                _last_errors.append(f"{model_name} (REST): {response.status_code} - {error_text}")
                print(f"   ⚠️ {model_name} REST error: {response.status_code}")
                
        except Exception as e:
            _last_errors.append(f"{model_name} (REST): {str(e)[:200]}")
            print(f"   ⚠️ {model_name} error: {e}")
    
    return None


def generate_with_fallback(image_data, custom_prompt, aspect_ratio='original'):
    """Fallback to regular genai with API key"""
    global _last_errors
    
    if not genai_fallback:
        _last_errors.append("Fallback genai not available")
        return None
    
    try:
        # Clean base64
        if 'base64,' in image_data:
            base64_clean = image_data.split('base64,')[1]
            mime_type = 'image/png' if 'png' in image_data.lower() else 'image/jpeg'
        else:
            base64_clean = image_data
            mime_type = 'image/jpeg'
        
        base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
        missing_padding = len(base64_clean) % 4
        if missing_padding:
            base64_clean += '=' * (4 - missing_padding)
        
        image_bytes = base64.b64decode(base64_clean)
        
        # Build aspect ratio instruction
        aspect_instruction = ''
        if aspect_ratio and aspect_ratio != 'original':
            aspect_instruction = f"\n\nOutput aspect ratio: {aspect_ratio}."

        # Full prompt (custom_prompt already contains preservation rules)
        generation_prompt = f"""{custom_prompt}{aspect_instruction}

QUALITY: Ultra-photorealistic, professional DSLR photograph, natural lighting."""

        models_to_try = ['gemini-2.0-flash-exp', 'gemini-2.0-flash']
        
        for model_name in models_to_try:
            for attempt in range(2):
                try:
                    print(f"   Trying {model_name} (fallback, attempt {attempt + 1})...")
                    model = genai_fallback.GenerativeModel(model_name)
                    
                    response = model.generate_content(
                        [
                            generation_prompt,
                            {"mime_type": mime_type, "data": image_bytes}
                        ],
                        generation_config={
                            "response_modalities": ["IMAGE", "TEXT"],
                        }
                    )
                    
                    if response.candidates:
                        for candidate in response.candidates:
                            if hasattr(candidate, 'content') and candidate.content.parts:
                                for part in candidate.content.parts:
                                    if hasattr(part, 'inline_data') and part.inline_data:
                                        img_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                                        img_mime = part.inline_data.mime_type or 'image/png'
                                        print(f"   ✅ Fallback success with {model_name}")
                                        return f"data:{img_mime};base64,{img_data}"
                    
                    _last_errors.append(f"{model_name} (fallback): No image")
                    
                except Exception as e:
                    _last_errors.append(f"{model_name} (fallback): {str(e)[:150]}")
                    if attempt == 0:
                        time.sleep(1)
                    continue
        
    except Exception as e:
        _last_errors.append(f"Fallback error: {str(e)[:150]}")
    
    return None


print("✅ Handsfree Mode ready (Gemini 3 Pro Image PRIMARY, Gemini 2.0 Flash fallback)")
