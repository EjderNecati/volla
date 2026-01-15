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
            
            image_data = data.get('image', '')
            custom_prompt = data.get('prompt', '')
            aspect_ratio = data.get('aspectRatio', 'original')
            
            print(f"\n{'='*60}")
            print("🎯 HANDSFREE MODE - Gemini 3 Pro (OAuth2 REST)")
            print(f"   Prompt: {custom_prompt[:100]}...")
            print(f"   OAuth2: {'Available' if oauth2_token else 'Not available'}")
            print(f"{'='*60}")
            
            if not image_data:
                raise ValueError("No image provided")
            if not custom_prompt:
                raise ValueError("No prompt provided")
            
            result = None
            method_used = 'none'
            
            # Method 1: Try REST API with gemini-3-pro-image-preview
            token = get_fresh_token()
            if token and project_id:
                print("🔄 Trying Gemini 3 Pro via REST API...")
                result = generate_with_rest_api(image_data, custom_prompt, token, project_id, aspect_ratio)
                if result:
                    method_used = 'Gemini 3 Pro (REST API)'
            
            # Method 2: Fallback to gemini-2.0-flash-exp with API key
            if not result and genai_fallback:
                print("🔄 Trying Gemini 2.0 Flash Exp fallback...")
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
        aspect_instruction = f" Output aspect ratio: {aspect_ratio}."
    
    # Simplified prompt for Gemini 3
    generation_prompt = f"""{custom_prompt}{aspect_instruction}

IMPORTANT REQUIREMENTS:
1. IDENTITY: Keep the exact same face, body, hair, and clothing as the source image. Do not alter any facial features.
2. QUALITY: Generate an ultra-photorealistic image with professional DSLR quality. Natural lighting, realistic shadows, sharp details.
3. This is a view/angle change only. The subject must remain identical to the source.

⛔ TEXT/LOGO RULES (CRITICAL):
- If clothing/product HAS text/logos → PRESERVE exactly (pixel-perfect)
- If clothing/product is PLAIN (no text/logos) → keep it COMPLETELY PLAIN
- NEVER hallucinate, invent, or add text that doesn't exist in source
- A plain colored shirt MUST stay a plain colored shirt with NO added graphics

IMPERFECTION REMOVAL:
- Remove minor imperfections: scratches, scuffs, dust, fingerprints
- Make the product look pristine and new

NO NEW TEXT: Do NOT add any NEW text, labels, watermarks, or captions to the image. Only preserve existing text."""

    # Models to try
    models_to_try = [
        'gemini-3-pro-image-preview',
        'gemini-2.0-flash-exp',
    ]
    
    for model_name in models_to_try:
        try:
            print(f"   Trying {model_name} via REST API...")
            
            # Vertex AI REST endpoint
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
            
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            
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
            aspect_instruction = f" Output aspect ratio: {aspect_ratio}."
        
        # Simplified prompt for Gemini
        generation_prompt = f"""{custom_prompt}{aspect_instruction}

IMPORTANT REQUIREMENTS:
1. IDENTITY: Keep the exact same face, body, hair, and clothing as the source image. Do not alter any facial features.
2. QUALITY: Generate an ultra-photorealistic image with professional DSLR quality. Natural lighting, realistic shadows.
3. This is a view/angle change only. The subject must remain identical to the source.

⛔ TEXT/LOGO RULES (CRITICAL):
- If clothing/product HAS text/logos → PRESERVE exactly (pixel-perfect)
- If clothing/product is PLAIN (no text/logos) → keep it COMPLETELY PLAIN
- NEVER hallucinate, invent, or add text that doesn't exist in source
- A plain colored shirt MUST stay a plain colored shirt with NO added graphics

IMPERFECTION REMOVAL:
- Remove minor imperfections: scratches, scuffs, dust, fingerprints
- Make the product look pristine and new

NO NEW TEXT: Do NOT add any NEW text, labels, watermarks, or captions. Only preserve existing text."""

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


print("✅ Handsfree Mode - Gemini 3 Pro (OAuth2 REST) ready")
