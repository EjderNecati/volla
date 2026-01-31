"""
AI Studio Mode - Vertex AI Imagen 3 Integration
Professional product photography with background swap

Uses Imagen 3's edit_image API with OAuth2 Service Account for:
- 100% product preservation (color, text, components)
- Professional studio background
- Realistic shadows
"""

import os
import base64
import json
import traceback
import requests
import time
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🚀 AI Studio - Imagen 3 Mode (OAuth2)")
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
# PRODUCT ANALYSIS FOR STUDIO (Text/Logo Detection)
# ===============================================

STUDIO_ANALYSIS_PROMPT = """You are an Expert Product Photographer preparing for a studio background swap.

THINK STEP-BY-STEP before analyzing:

═══════════════════════════════════════════════════════════════════════════════
STEP 1: IDENTIFY THE PRODUCT
- What is it exactly?
- Does it look like a HANGING object? (ornament, keychain, pendant)
- Does it look like a LEANING object? (mirror, ladder, poster)
- Does it look like a FLAT object? (paper, card, cloth)
- Does it look like a STANDARD object? (bottle, box, shoe, electronic)

STEP 2: DETECT TEXT & LOGOS (CRITICAL)
- Is there any visible text, label, or logo?
- Where is it located?
- What does it say?

STEP 3: TRANSPARENCY
- Is the object glass, plastic, or transparent liquid?
═══════════════════════════════════════════════════════════════════════════════

Return JSON:
{
    "product_type": "precise name",
    "is_hanging": true/false,
    "is_transparent": true/false,
    "has_text": true/false,
    "text_details": "description of text/logo content and location",
    "staging": "how to stage it (standing, leaning, hanging, flat lay)"
}"""


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


def analyze_product_for_studio(image_data):
    """Analyze product to enhance studio prompt"""

    # Clean base64
    base64_clean = image_data
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]

    try:
        image_bytes = base64.b64decode(base64_clean)

        # Try Gemini via REST
        text = call_gemini_flash(STUDIO_ANALYSIS_PROMPT, image_bytes)

        if text:
            try:
                # Clean possible markdown
                if '```json' in text:
                    text = text.split('```json')[1].split('```')[0]
                elif '```' in text:
                    text = text.split('```')[1].split('```')[0]

                return json.loads(text.strip())
            except Exception as e:
                print(f"   ⚠️ Studio analysis JSON parse failed: {e}")

    except Exception as e:
        print(f"   ⚠️ Validation error: {e}")

    return {
        "product_type": "product",
        "is_hanging": False,
        "is_transparent": False,
        "has_text": False,
        "text_details": "",
        "staging": "standard"
    }


# ===============================================
# PROMPT GENERATOR
# ===============================================

def get_angle_aware_prompt(camera_angle, product_placement, is_hanging_product, product_type, product_analysis=None):
    """Generate prompt dynamically based on product and angle"""

    base_prompt = """Professional e-commerce product photography studio.
BACKGROUND:
- Clean, warm beige studio backdrop (#E8DDD0)
- Completely solid, no patterns or textures
- Seamless cyclorama style
LIGHTING:
- Soft, diffused studio lighting
- Professional product photography setup
"""

    angle_instructions = {
        "OVERHEAD": """
CAMERA PERSPECTIVE: OVERHEAD / BIRD'S EYE VIEW
- Maintain the overhead camera angle (looking straight down)
- Product should be viewed from ABOVE, not from the front
- Shadow should spread OUTWARD from product center (not beneath)
- If product is flat: show it laid flat on surface
- The floor/surface should be visible around the product
""",
        "FLAT_LAY": """
CAMERA PERSPECTIVE: FLAT LAY PHOTOGRAPHY
- Camera is directly above, looking straight down
- Product must be LAID FLAT on a surface
- Surface texture visible around product
- Shadow minimal, mostly ambient occlusion around edges
- NO side shadows - this is a top-down view
""",
        "FRONT": """
CAMERA PERSPECTIVE: FRONT-FACING VIEW
- Camera at eye level, facing product directly
- Contact shadow beneath product on floor/surface
- Product standing or sitting upright on surface
- Main light from top-left at 45 degrees
""",
        "THREE_QUARTER": """
CAMERA PERSPECTIVE: THREE-QUARTER ANGLE VIEW
- Camera at ~45 degree angle to product
- Show product from slight diagonal
- Contact shadow visible beneath product
- Product grounded on surface
""",
        "SIDE": """
CAMERA PERSPECTIVE: SIDE PROFILE VIEW
- Camera viewing from pure side
- Full side profile of product visible
- Contact shadow beneath product
- Product standing on surface
""",
        "FROM_BELOW": """
CAMERA PERSPECTIVE: FROM BELOW (LOOKING UP)
- Camera looking upward at product
- Product appears above camera level
- Appropriate for hanging items
"""
    }

    placement_instructions = {
        "HANGING": """
PRODUCT STAGING: HANGING/SUSPENDED ITEM
- This product is DESIGNED to hang (ornament, decoration, keychain)
- Show product hanging from a visible hook, stand, or display
- The hanging mechanism (loop, string, hook) should be visible
- Product should hang naturally with gravity
- Use a jewelry/ornament display stand or decorative hook
""",
        "ON_SURFACE": """
PRODUCT STAGING: ON SURFACE
- Product MUST be placed on a solid surface
- Clear contact point between product and surface
- Visible contact shadow where product meets surface
- Product appears stable and grounded
""",
        "FLAT_LAY": """
PRODUCT STAGING: FLAT LAY
- Product laid flat on surface
- View from directly above
- Surface visible around product edges
""",
        "WORN": """
PRODUCT STAGING: WORN BY PERSON
- Maintain the person/model in the image
- Clean studio background behind person
""",
        "MOUNTED": """
PRODUCT STAGING: WALL MOUNTED
- Product mounted on clean wall surface
- Visible mounting mechanism
""",
        "APPAREL_HANGER": """
👕 PRODUCT STAGING: CLOTHING ON HANGER
- T-shirts, shirts, jackets MUST be shown on a CLOTHES HANGER
- Use a professional, minimal wooden or black velvet hanger
- Hanger hook visible at top, clothing hanging naturally
- Product hangs with gravity, slight natural drape
- NO floating clothing - hanger provides support
- This is how clothing is photographed in professional studios
""",
        "JEWELRY_STAND": """
💎 PRODUCT STAGING: JEWELRY ON DISPLAY STAND
- Necklaces, pendants, chains MUST be on jewelry display stand/bust
- Use elegant black velvet or white jewelry bust/stand
- Jewelry draped naturally over display form
- NO floating jewelry - display stand provides support
- This is how jewelry is photographed in professional studios
"""
    }

    # Extract text info if available
    text_rules = ""
    text_content = ""
    if product_analysis:
        text_content = product_analysis.get('text_details', '')
        if product_analysis.get('has_text'):
            text_rules = f"""
⚠️ TEXT/LOGO PRESERVATION:
- Text/Logo "{text_content}" must remain EXACTLY the same
- Text must be 100% SHARP and READABLE
- DO NOT move, change, or distort the text
"""
        else:
            text_rules = """
🚫 NO TEXT ON PRODUCT:
- This product has NO text/logos
- DO NOT add ANY text or branding
- Keep surfaces CLEAN and PLAIN
"""

    angle_inst = angle_instructions.get(camera_angle, angle_instructions["FRONT"])
    placement_inst = placement_instructions.get(product_placement, placement_instructions["ON_SURFACE"])

    full_prompt = base_prompt + angle_inst + placement_inst + text_rules
    return full_prompt


# Legacy prompt
BGSWAP_PROMPT = get_angle_aware_prompt("FRONT", "ON_SURFACE", False, "")

# ===============================================
# FALLBACK URLS
# ===============================================

FALLBACK_URLS = {
    'Kitchenware': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
    'Furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    'Other': 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=800&fit=crop'
}


def generate_with_gemini_studio(image_data, product_analysis=None, custom_prompt='', output_count=1, aspect_ratio='1:1'):
    """
    PRIMARY METHOD: Generate studio image using Gemini 2.0 Flash
    Gemini can SEE the reference image and preserve product details!
    """
    if not GOOGLE_API_KEY:
        print("   ⚠️ GOOGLE_API_KEY not set")
        return None

    print(f"   🎨 Using Gemini Studio Mode (count={output_count}, ratio={aspect_ratio})...")

    # Clean base64
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    image_bytes = base64.b64decode(base64_clean)
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # Build product preservation prompt
    text_preservation = ""
    if product_analysis and product_analysis.get('has_text'):
        text_content = product_analysis.get('text_details', '')
        text_preservation = f"""
⚠️ CRITICAL - TEXT/LOGO PRESERVATION:
The product has text/logo: "{text_content}"
- This text MUST remain EXACTLY the same - every letter, every character
- Text must be 100% SHARP and READABLE
- DO NOT blur, distort, or change ANY text on the product
"""

    staging_hint = ""
    if product_analysis:
        staging = product_analysis.get('staging', 'standard')
        if staging == 'hanging':
            staging_hint = "Display on an elegant ornament stand or hook - product should hang naturally."
        elif staging == 'leaning':
            staging_hint = "Product leaning against a small stand or prop."

    # Detailed prompt for product preservation
    studio_prompt = f"""Look at this product image VERY CAREFULLY.

YOUR TASK: Generate a NEW professional studio photograph of THIS EXACT PRODUCT.

═══════════════════════════════════════════════════════════════════════════════
🎯 PRODUCT PRESERVATION (CRITICAL - DO NOT CHANGE):
═══════════════════════════════════════════════════════════════════════════════
- The product must be IDENTICAL to the original - same shape, colors, materials
- ALL text, labels, logos must be preserved EXACTLY as they appear
- ALL product details, components, textures must be kept
- DO NOT add, remove, or modify ANY part of the product
- DO NOT change the product's proportions or design
{text_preservation}

═══════════════════════════════════════════════════════════════════════════════
📸 STUDIO SETUP:
═══════════════════════════════════════════════════════════════════════════════
BACKGROUND: Clean, warm beige/cream studio backdrop (#E8DDD0 to #F5F0E8)
- Seamless cyclorama style (no visible edges or corners)
- Subtle gradient from lighter top to slightly darker bottom
- NO patterns, NO textures, NO objects in background

LIGHTING: Professional product photography lighting
- Soft, diffused main light from upper left (45°)
- Fill light to reduce harsh shadows
- Product should be well-lit and clearly visible

PRODUCT PLACEMENT:
- Product centered in frame
- Natural contact shadow beneath product
- Product appears grounded and stable
{staging_hint}

═══════════════════════════════════════════════════════════════════════════════
🚫 DO NOT:
═══════════════════════════════════════════════════════════════════════════════
- DO NOT generate a random product - use THIS EXACT product
- DO NOT add any props, decorations, or additional objects
- DO NOT add watermarks or text overlays
- DO NOT change the product in any way
- DO NOT create a collage or multiple products

{f'ADDITIONAL INSTRUCTIONS: {custom_prompt}' if custom_prompt else ''}

Generate a professional e-commerce product photo now."""

    # Models to try (image generation capable)
    models_to_try = [
        'gemini-2.0-flash-preview-image-generation',
        'gemini-2.0-flash-exp-image-generation',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash'
    ]

    headers = {"Content-Type": "application/json"}
    generated_images = []

    for model_name in models_to_try:
        try:
            print(f"      🔄 Trying {model_name}...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GOOGLE_API_KEY}"

            # Build generation config with aspect ratio
            gen_config = {
                "responseModalities": ["IMAGE", "TEXT"]
            }
            # Add aspect ratio to generation config
            if aspect_ratio:
                gen_config["aspectRatio"] = aspect_ratio
                print(f"      📐 Using aspect ratio: {aspect_ratio}")

            payload = {
                "contents": [{
                    "parts": [
                        {"text": studio_prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
                    ]
                }],
                "generationConfig": gen_config
            }

            # Generate multiple images if requested
            for i in range(output_count):
                print(f"      📷 Generating image {i+1}/{output_count}...")

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
                                    generated_images.append(f"data:{mime_type};base64,{img_data}")
                                    print(f"      ✅ Image {len(generated_images)} generated!")
                                    break
                else:
                    error_text = response.text[:100] if response.text else "Unknown"
                    print(f"      ⚠️ {model_name}: {response.status_code} - {error_text}")
                    break

            # If we got images, return them
            if generated_images:
                print(f"   ✅ Gemini Studio success! ({len(generated_images)} images)")
                if len(generated_images) == 1:
                    return generated_images[0]
                return generated_images

        except Exception as e:
            print(f"      ⚠️ {model_name} error: {str(e)[:50]}")
            continue

    print("   ❌ All Gemini models failed")
    return None


def generate_with_imagen3(image_data, api_key_unused, custom_prompt=None, output_count=1, aspect_ratio='1:1'):
    """Generate studio image(s) using Imagen 3 via OAuth2 REST API"""

    token = get_fresh_token()
    if not token or not project_id:
        print("   ⚠️ No OAuth2 token or project_id available")
        return None

    prompt_to_use = custom_prompt or BGSWAP_PROMPT

    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)

    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Validate output_count (Imagen 3 supports 1-4)
    sample_count = max(1, min(4, int(output_count)))

    payload = {
        "instances": [{
            "prompt": prompt_to_use
        }],
        "parameters": {
            "sampleCount": sample_count,
            "aspectRatio": aspect_ratio,
            "personGeneration": "allow_adult",
            "safetyFilterLevel": "block_only_high"
        }
    }

    try:
        print(f"   🎨 Calling Imagen 3 via REST API (count={sample_count}, ratio={aspect_ratio})...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)

        if response.status_code == 200:
            result = response.json()
            predictions = result.get("predictions", [])

            if predictions:
                # Return array of images
                images = []
                for pred in predictions:
                    if pred.get("bytesBase64Encoded"):
                        img_b64 = pred["bytesBase64Encoded"]
                        images.append(f"data:image/png;base64,{img_b64}")

                if images:
                    print(f"   ✅ Imagen 3 success! Generated {len(images)} images")
                    # Return single image for backward compatibility if only 1 requested
                    if sample_count == 1:
                        return images[0]
                    return images

        print(f"   ⚠️ Imagen 3 response: {response.status_code} - {response.text[:200]}")

    except Exception as e:
        print(f"   ❌ Imagen 3 REST API error: {e}")

    return None


# HANDLER
class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        print("\n📥 AI STUDIO REQUEST - Gemini Studio Mode")

        category = 'Other'

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            category = data.get('category', 'Other')
            image_data = data.get('image', '')
            request_vertex_key = data.get('vertex_api_key', '')

            camera_angle = data.get('camera_angle', 'FRONT')
            product_placement = data.get('product_placement', 'ON_SURFACE')
            is_hanging_product = data.get('is_hanging_product', False)
            product_type = data.get('product_type', '')

            # NEW: Configurable output count and aspect ratio
            output_count = data.get('output_count', 1)  # 1-4, default 1
            aspect_ratio = data.get('aspect_ratio', '1:1')  # Default 1:1
            custom_prompt_extra = data.get('custom_prompt', '')  # Optional extra prompt

            # Validate output_count
            output_count = max(1, min(4, int(output_count)))

            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY

            print(f"📦 Category: {category}")
            print(f"🖼️ Image: {len(image_data)} chars")
            print(f"📊 Output count: {output_count}, Aspect ratio: {aspect_ratio}")

            # Analyze product for text/logo preservation
            product_analysis = None
            if image_data:
                print("🔍 Analyzing product for text/logo preservation...")
                try:
                    # Clean base64 for analysis
                    if 'base64,' in image_data:
                        analysis_base64 = image_data.split('base64,')[1]
                    else:
                        analysis_base64 = image_data
                    analysis_base64 = analysis_base64.strip().replace('\n', '').replace('\r', '')
                    missing_padding = len(analysis_base64) % 4
                    if missing_padding:
                        analysis_base64 += '=' * (4 - missing_padding)
                    analysis_bytes = base64.b64decode(analysis_base64)
                    product_analysis = analyze_product_for_studio(analysis_bytes)
                except Exception as e:
                    print(f"   ⚠️ Analysis skipped: {e}")

            # Generate dynamic prompt
            dynamic_prompt = get_angle_aware_prompt(camera_angle, product_placement, is_hanging_product, product_type, product_analysis)

            # Add custom prompt if provided
            if custom_prompt_extra:
                dynamic_prompt += f"\n\nADDITIONAL INSTRUCTIONS: {custom_prompt_extra}"

            print(f"📝 Using angle-aware prompt for: {camera_angle}")

            result = None
            results_array = []
            method_used = 'none'
            error_message = None

            if image_data:
                # PRIMARY: Use Gemini Studio Mode (can SEE and PRESERVE the product!)
                print("🎨 Using Gemini Studio Mode (product preservation)...")
                try:
                    result = generate_with_gemini_studio(
                        image_data,
                        product_analysis,
                        custom_prompt_extra,
                        output_count,
                        aspect_ratio
                    )
                    if result:
                        method_used = 'Gemini Studio'
                        # Handle array or single result
                        if isinstance(result, list):
                            results_array = result
                            result = result[0] if result else None
                        else:
                            results_array = [result] if result else []
                        print(f"✅ Gemini Studio Success! ({len(results_array)} images)")
                except Exception as e:
                    error_message = str(e)
                    print(f"⚠️ Gemini Studio error: {error_message[:100]}")

                # FALLBACK: Try Imagen 3 if Gemini failed (note: won't preserve product as well)
                if not result and active_vertex_key:
                    print("🎨 Fallback to Imagen 3...")
                    try:
                        result = generate_with_imagen3(image_data, active_vertex_key, dynamic_prompt, output_count, aspect_ratio)
                        if result:
                            method_used = 'Imagen 3'
                            if isinstance(result, list):
                                results_array = result
                                result = result[0] if result else None
                            else:
                                results_array = [result] if result else []
                            print(f"✅ Imagen 3 Fallback Success! ({len(results_array)} images)")
                    except Exception as e:
                        error_message = str(e)
                        print(f"⚠️ Imagen 3 fallback error: {error_message[:100]}")
            else:
                error_message = "No image provided"

            # Final fallback
            if not result:
                result = FALLBACK_URLS.get(category, FALLBACK_URLS['Other'])
                results_array = [result]
                method_used = 'Fallback URL'

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            response = {
                'success': method_used in ['Gemini Studio', 'Imagen 3'],
                'generated_image': result,
                'generated_images': results_array,  # NEW: Array of all generated images
                'image_url': result,
                'background_url': FALLBACK_URLS.get(category, FALLBACK_URLS['Other']),
                'category': category,
                'method_used': method_used,
                'output_count': len(results_array),
                'error_message': error_message
            }
            self.wfile.write(json.dumps(response).encode())

        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': False,
                'generated_image': FALLBACK_URLS.get(category, FALLBACK_URLS['Other']),
                'image_url': FALLBACK_URLS.get(category, FALLBACK_URLS['Other']),
                'error': str(e),
                'method_used': 'Error Fallback'
            }).encode())


print("✅ AI Studio - Imagen 3 Mode ready")
