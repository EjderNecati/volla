# Real Life Photos Generator - Hyper-Realistic Lifestyle Photography
# Generates AI product photos in real-world usage contexts

import os
import json
import base64
import requests
import time
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🌟 REAL LIFE PHOTOS GENERATOR - Imagen 3 Mode (OAuth2)")
print("=" * 60)

# Environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
VERTEX_API_KEY = os.environ.get("VERTEX_API_KEY")
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")

# OAuth2 Setup for Imagen 3
oauth2_token = None
project_id = None

try:
    if GOOGLE_CREDENTIALS_JSON:
        from google.oauth2 import service_account
        import google.auth.transport.requests
        
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        project_id = creds_dict.get("project_id", "")
        
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token
        
        print(f"✅ OAuth2 token obtained for project: {project_id}")
    else:
        print("⚠️ No GOOGLE_APPLICATION_CREDENTIALS_JSON found")
except Exception as e:
    print(f"⚠️ OAuth2 setup failed: {e}")

# Fallback to old SDK for Gemini analysis
genai_old = None
try:
    import google.generativeai as genai_module
    genai_old = genai_module
    if GOOGLE_API_KEY:
        genai_old.configure(api_key=GOOGLE_API_KEY)
        print("✅ google-generativeai (fallback) configured")
except ImportError as e:
    print(f"⚠️ google-generativeai not available: {e}")


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

# ===============================================
# DEEP PRODUCT ANALYSIS PROMPT
# ===============================================

PRODUCT_ANALYSIS_PROMPT = """You are an Expert Product Photographer and E-commerce Specialist.

Analyze this product image DEEPLY and return a comprehensive analysis for lifestyle photography.

RETURN JSON ONLY:
{
    "product_type": "Specific product name",
    "product_category": "Category",
    "material": "Primary materials",
    "colors": ["list of main colors"],
    "key_details_to_preserve": ["list of critical details"],

    "has_text": true/false,
    "text_details": {
        "has_visible_text": true/false,
        "text_content": "Exact text visible",
        "text_location": "Where is the text located",
        "text_colors": ["color of text"],
        "text_size": "small/medium/large",
        "areas_WITHOUT_text": ["list of areas that are blank/plain"]
    },

    "natural_placement": {
        "belongs_to": "Where does this naturally belong? (e.g., kitchen counter, office desk, bathroom shelf, garden)",
        "mounting_method": "How is it placed? (standing, hanging, lying flat, stuck to wall)"
    },

    "lifestyle_contexts": [
        {
            "scene": "Specific, realistic scene description (e.g., 'Modern minimalist kitchen counter with morning sunlight')",
            "environment": "General environment (e.g., 'Indoor Kitchen')",
            "lighting": "Lighting type (e.g., 'Soft morning window light')",
            "background_elements": ["List of relevant background items"],
            "product_position": "How the product is placed",
            "reasoning": "Why this scene fits the product"
        },
        { "scene": "...", "environment": "...", "lighting": "...", "background_elements": [], "product_position": "...", "reasoning": "..." },
        { "scene": "...", "environment": "...", "lighting": "...", "background_elements": [], "product_position": "...", "reasoning": "..." }
    ]
}"""

# ===============================================
# HYPER-REALISM PROMPT BUILDER
# ===============================================

def build_reallife_prompt(product_analysis, context_index):
    """Build an optimized prompt for Imagen 3 lifestyle photography - V4 (Enhanced Reasoning)"""

    contexts = product_analysis.get('lifestyle_contexts', [])
    if context_index >= len(contexts):
        return None

    context = contexts[context_index]
    product_type = product_analysis.get('product_type', 'product')
    key_details = product_analysis.get('key_details_to_preserve', [])
    materials = product_analysis.get('material', '')
    colors = product_analysis.get('colors', [])
    is_transparent = product_analysis.get('is_transparent', False)
    body_part = product_analysis.get('body_part_if_worn')
    
    # Natural placement info
    natural_placement = product_analysis.get('natural_placement', {})
    belongs_to = natural_placement.get('belongs_to', '')
    mounting_method = natural_placement.get('mounting_method', '')
    
    # Context fields
    reasoning = context.get('reasoning', '')
    scene = context.get('scene', 'Professional lifestyle setting')
    environment = context.get('environment', '')
    background_elements = context.get('background_elements', [])
    lighting = context.get('lighting', 'Natural soft light')
    product_position = context.get('product_position', '')

    # Text detection
    text_details = product_analysis.get('text_details', {})
    has_text = text_details.get('has_visible_text', False) or product_analysis.get('has_text', False)
    text_content = text_details.get('text_content', '')
    text_size = text_details.get('text_size', 'medium')
    text_location = text_details.get('text_location', '')
    text_colors = text_details.get('text_colors', [])
    areas_without_text = text_details.get('areas_WITHOUT_text', [])
    
    # Build summaries
    details_summary = ", ".join(key_details[:5]) if key_details else "all visible details"
    colors_summary = ", ".join(colors[:3]) if colors else ""
    bg_elements_summary = ", ".join(background_elements[:5]) if background_elements else ""
    blank_areas = ", ".join(areas_without_text) if areas_without_text else ""
    text_colors_str = ", ".join(text_colors) if text_colors else ""

    # TEXT RULES (Ultra-strict)
    if has_text:
        text_rules = f"""
═══════════════════════════════════════════════════════════════════════════════
⚠️ TEXT/LOGO PRESERVATION - ULTRA-CRITICAL
═══════════════════════════════════════════════════════════════════════════════
EXISTING TEXT: "{text_content}" at {text_location}
DETAILS: {text_size} size, colors: {text_colors_str}

MANDATORY RULES:
1. The text "{text_content}" MUST appear EXACTLY as written
2. Text MUST be 100% SHARP and READABLE
3. Text MUST face the camera directly
4. DO NOT change text color, font, size, or spacing
5. DO NOT move text to a different location

🚫 AREAS THAT MUST STAY BLANK (NO TEXT):
{f"- These areas have NO text in original: {blank_areas}" if blank_areas else "- All other areas of product are text-free"}
- DO NOT add any text, logo, or branding to blank areas
"""
    else:
        text_rules = """
═══════════════════════════════════════════════════════════════════════════════
🚫 NO TEXT/LOGO ON THIS PRODUCT
═══════════════════════════════════════════════════════════════════════════════
- The original product has ZERO text, logos, or branding
- DO NOT add ANY text, logo, brand name, label, or writing
- ALL surfaces must remain PLAIN and CLEAN as in original
"""

    # Natural placement context
    placement_context = ""
    if belongs_to or mounting_method:
        placement_context = f"""
NATURAL PLACEMENT:
- Belongs: {belongs_to}
- Position: {mounting_method}
- Product MUST be shown in this natural context
"""

    # Human element
    human_part = ""
    if body_part:
        human_part = f"""
HUMAN ELEMENT:
- Realistic {body_part}, natural skin texture
- EXACTLY 5 fingers on each hand
- Natural relaxed pose
"""

    # Transparency handling
    transparency_note = ""
    if is_transparent:
        transparency_note = """
TRANSPARENCY:
- Product is transparent/translucent - show realistic light passing through
- Maintain proper reflections and highlights
"""

    # Build strict product description
    product_desc = f"{colors_summary} {materials} {product_type}".strip()

    prompt = f"""E-commerce lifestyle photo: {product_desc} placed naturally in {scene}.

🚫 ABSOLUTE RULES - NEVER VIOLATE:
1. DO NOT put clothing on mannequins or people - show flat/folded/hanging
2. DO NOT add ANY text, logo, label, or branding
3. DO NOT modify the product shape, color, or details
4. DO NOT add accessories or props touching the product
5. The product must look EXACTLY like the original - only the BACKGROUND changes

SCENE: {scene}
ENVIRONMENT: {environment}
LIGHTING: {lighting}
PLACEMENT: {product_position if product_position else f"{product_type} placed naturally on surface"}

PRODUCT DETAILS (preserve exactly):
- Type: {product_type}
- Colors: {colors_summary}
- Material: {materials}
- Key features: {details_summary}
{f"- Text on product: '{text_content}' at {text_location} - keep EXACTLY" if has_text else "- NO text on product - keep it clean"}

PHOTO STYLE: Professional product photography, 85mm lens, shallow depth of field, product sharp, background softly blurred, natural lighting, magazine quality.

FORBIDDEN: Mannequins wearing clothes, added logos/text, modified product, floating products, unrealistic placement."""

    return prompt


# ===============================================
# HELPER FUNCTIONS (Gemini via REST)
# ===============================================

def call_gemini_flash(prompt, image_bytes):
    """Call Gemini 2.0 Flash via REST API (No SDK)"""
    if not GOOGLE_API_KEY:
        print("⚠️ GOOGLE_API_KEY not set for Gemini call")
        return None
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"
    
    headers = { "Content-Type": "application/json" }
    
    # Encode image
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                { "inline_data": { "mime_type": "image/jpeg", "data": image_b64 } }
            ]
        }],
        "generationConfig": { "temperature": 0.5, "maxOutputTokens": 4096 }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        
        if response.status_code != 200:
            print(f"   ⚠️ Gemini Error {response.status_code}: {response.text[:200]}")
            return None
            
        data = response.json()
        return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    except Exception as e:
        print(f"   ⚠️ Gemini Request Error: {e}")
        return None


def analyze_product_for_lifestyle(image_bytes, existing_info=None):
    """Deep product analysis for lifestyle context generation"""
    
    # Try Gemini via REST
    text = call_gemini_flash(PRODUCT_ANALYSIS_PROMPT, image_bytes)
    
    if text:
        try:
            # Clean possible markdown
            if '```json' in text:
                text = text.split('```json')[1].split('```')[0]
            elif '```' in text:
                text = text.split('```')[1].split('```')[0]
            
            return json.loads(text.strip())
        except Exception as e:
            print(f"   ⚠️ valid JSON not found in analysis: {e}")
    
    # Fallback: use existing info or defaults
    print("   ⚠️ Using fallback analysis data")
    product_type = existing_info.get('product_type', 'product') if existing_info else 'product'
    category = existing_info.get('category', 'Other') if existing_info else 'Other'
    
    return {
        'product_type': product_type,
        'product_category': category,
        'material': 'mixed',
        'key_details_to_preserve': ['all visible details', 'colors', 'textures'],
        'usage_type': 'placed',
        'typical_users': ['general'],
        'body_part_if_worn': None,
        'lifestyle_contexts': [
            {'scene': 'Modern home interior setting', 'environment': 'Indoor living room', 'lighting': 'Natural daylight', 'reasoning': 'General context'},
            {'scene': 'Cozy lifestyle environment', 'environment': 'Indoor bedroom', 'lighting': 'Warm ambient light', 'reasoning': 'Relaxed context'},
            {'scene': 'Contemporary setting', 'environment': 'Modern space', 'lighting': 'Soft natural light', 'reasoning': 'Clean context'}
        ],
        'photography_style': 'lifestyle',
        'risk_areas': ['product preservation']
    }


def _gemini_fallback(image_bytes, prompt):
    """Fallback to Gemini for image generation via REST"""
    if not GOOGLE_API_KEY:
        print("      ⚠️ No API key for Gemini fallback")
        return None

    print("      🔄 Trying Gemini image generation fallback...")

    # Try multiple models that support image generation
    models_to_try = [
        'gemini-2.0-flash-preview-image-generation',
        'gemini-2.0-flash-exp',
        'imagen-3.0-generate-001'
    ]

    headers = { "Content-Type": "application/json" }
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    for model_name in models_to_try:
        try:
            print(f"      Trying {model_name}...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GOOGLE_API_KEY}"

            payload = {
                "contents": [{
                    "parts": [
                        {"text": f"Generate a photorealistic lifestyle product photo: {prompt[:500]}"},
                        { "inline_data": { "mime_type": "image/jpeg", "data": image_b64 } }
                    ]
                }],
                "generationConfig": { "responseModalities": ["IMAGE", "TEXT"] }
            }

            response = requests.post(url, headers=headers, json=payload, timeout=90)

            if response.status_code == 200:
                data = response.json()
                candidates = data.get('candidates', [])
                if candidates:
                    parts = candidates[0].get('content', {}).get('parts', [])
                    for part in parts:
                        inline_data = part.get('inline_data') or part.get('inlineData')
                        if inline_data:
                            img_data = inline_data.get('data')
                            mime_type = inline_data.get('mime_type', 'image/png')
                            if img_data:
                                print(f"      ✅ Got image from {model_name}")
                                return f"data:{mime_type};base64,{img_data}"
            else:
                print(f"      ⚠️ {model_name}: {response.status_code}")

        except Exception as e:
            print(f"      ⚠️ {model_name} error: {str(e)[:50]}")
            continue

    print("      ❌ All Gemini fallback models failed")
    return None


def generate_reallife_shot(image_bytes, prompt, api_key=None):
    """Generate a single real life shot using Imagen 3 via OAuth2 REST API with Retry"""
    
    # Get fresh OAuth2 token
    token = get_fresh_token()
    if not token or not project_id:
        print("   ⚠️ No OAuth2 token or project_id available")
        return _gemini_fallback(image_bytes, prompt)
    
    print(f"   🎨 Using OAuth2 for project: {project_id[:20]}...")
    
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "instances": [{ "prompt": prompt }],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "1:1",
            "personGeneration": "allow_adult",
            "safetyFilterLevel": "block_only_high"
        }
    }
    
    # Retry Logic for 429 and 500
    retries = 3
    backoff = 2 # Starts at 2s, then 4s, 8s
    
    for attempt in range(retries):
        try:
            print(f"   🌟 Calling Imagen 3 (Attempt {attempt+1}/{retries})...")
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                predictions = result.get("predictions", [])
                
                if predictions and predictions[0].get("bytesBase64Encoded"):
                    img_b64 = predictions[0]["bytesBase64Encoded"]
                    print(f"   ✅ Imagen 3 Real Life success!")
                    return f"data:image/png;base64,{img_b64}"
                else:
                    # Capture empty 200 OK response
                    print(f"   ⚠️ Empty response (200 OK): {json.dumps(result)[:500]}")
                    
            elif response.status_code == 429:
                print(f"   ⏳ Quota/Rate Limit (429). Waiting {backoff}s...")
                time.sleep(backoff)
                backoff *= 2
                continue
                
            else:
                print(f"   ⚠️ Imagen 3 Error {response.status_code}: {response.text[:200]}")
                
        except Exception as e:
            print(f"   ❌ Imagen 3 Request Error: {e}")
            
    # Fallback to Gemini if all retries failed
    return _gemini_fallback(image_bytes, prompt)


# ===============================================
# HANDLER
# ===============================================

class handler(BaseHTTPRequestHandler):
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        print("\n📸 REAL LIFE PHOTOS REQUEST (REST API)")
        
        results = {
            'success': False,
            'shot1': None,
            'shot2': None,
            'shot3': None,
            'analysis': None,
            'error': None
        }
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            source_image = data.get('source_image', '')
            request_vertex_key = data.get('vertex_api_key', '')
            product_info = data.get('product_info', {})
            
            source_image = source_image or ""
            
            # Clean base64
            if 'base64,' in source_image:
                base64_clean = source_image.split('base64,')[1]
            else:
                base64_clean = source_image
            
            base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
            
            # Prevent decoding errors on empty string
            if not base64_clean:
                raise ValueError("Empty image data")
                
            missing_padding = len(base64_clean) % 4
            if missing_padding:
                base64_clean += '=' * (4 - missing_padding)
            
            image_bytes = base64.b64decode(base64_clean)
            
            # Step 1: Deep Product Analysis
            print("🔍 Step 1: Deep Product Analysis...")
            product_analysis = analyze_product_for_lifestyle(image_bytes, product_info)
            results['analysis'] = product_analysis
            print(f"   📦 Product: {product_analysis.get('product_type', 'unknown')}")
            
            # Step 2: Generate 3 Real Life Shots
            print("📷 Step 2: Generating Real Life Shots...")
            
            contexts = product_analysis.get('lifestyle_contexts', [])
            
            # Ensure we have contexts
            if not contexts:
                contexts = [{'scene':'Default product showcase'}]
            
            # Force 3 shots
            target_shot_count = 3
            context_count = len(contexts)
            
            for i in range(target_shot_count):
                shot_key = f'shot{i+1}'
                
                # Cycle through contexts if we have fewer than target shots
                context_idx = i % context_count
                
                # Build hyper-realistic prompt
                prompt = build_reallife_prompt(product_analysis, context_idx)
                
                if not prompt:
                    print(f"   ⚠️ {shot_key}: Failed to build prompt")
                    continue
                
                # Generate with Imagen 3
                shot_image = generate_reallife_shot(
                    image_bytes=image_bytes,
                    prompt=prompt
                )
                
                if shot_image:
                    results[shot_key] = shot_image
                    print(f"   ✅ {shot_key} complete")
                else:
                    print(f"   ⚠️ {shot_key} failed")
            
            # Check success
            if results['shot1'] or results['shot2'] or results['shot3']:
                results['success'] = True
                print("✅ Real Life generation complete!")
            else:
                results['error'] = 'All shots failed'
                print("❌ All shots failed")
            
        except Exception as e:
            results['error'] = str(e)
            print(f"❌ Error: {e}")
            import traceback
            traceback.print_exc()
        
        # Send response
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(results).encode())
