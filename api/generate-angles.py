"""
MULTI-ANGLE SHOT GENERATOR - Imagen 3 Integration
Advanced Multi-Angle Generator with Reference Image Consistency

Features:
- Imagen 3 with reference images for 95%+ consistency (OAuth2)
- Physics Classification (7 categories)
- Staging Logic Mapping per category
- Product preservation across all angles
- REST API calls (no SDK required)
"""

import os
import base64
import json
import time
import traceback
import requests
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🎬 MULTI-ANGLE GENERATOR - Imagen 3 Mode (REST API)")
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
# REST API HELPERS (No SDK Required)
# ===============================================

def call_gemini_flash(prompt, image_bytes):
    """Call Gemini 2.0 Flash via REST API for text/analysis"""
    if not GOOGLE_API_KEY:
        print("   ⚠️ GOOGLE_API_KEY not set for Gemini call")
        return None

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"

    headers = {"Content-Type": "application/json"}
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
            ]
        }],
        "generationConfig": {"temperature": 0.5, "maxOutputTokens": 4096}
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


def call_gemini_image_generation(prompt, image_bytes, aspect_ratio='1:1'):
    """Call Gemini for image generation via REST API (can see reference image!)"""
    if not GOOGLE_API_KEY:
        print("      ⚠️ GOOGLE_API_KEY not set")
        return None

    # Models that support image generation
    models_to_try = [
        'gemini-2.0-flash-preview-image-generation',
        'gemini-2.0-flash-exp-image-generation',
        'gemini-2.0-flash'
    ]

    headers = {"Content-Type": "application/json"}
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    for model_name in models_to_try:
        try:
            print(f"      🎨 Trying {model_name}...")
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GOOGLE_API_KEY}"

            # Build generation config with aspect ratio
            gen_config = {
                "responseModalities": ["IMAGE", "TEXT"]
            }
            if aspect_ratio and aspect_ratio != '1:1':
                gen_config["aspectRatio"] = aspect_ratio

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
                    ]
                }],
                "generationConfig": gen_config
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

                print(f"      ⚠️ {model_name}: No image in response")
            else:
                error_text = response.text[:100] if response.text else "Unknown error"
                print(f"      ⚠️ {model_name}: {response.status_code} - {error_text}")

        except Exception as e:
            print(f"      ⚠️ {model_name} error: {str(e)[:50]}")
            continue

    return None


# ===============================================
# PHYSICS CLASSIFICATION PROMPT
# ===============================================

PHYSICS_CLASSIFICATION_PROMPT = """You are an Expert Product Photographer.

Analyze this product and classify how to photograph it.

CATEGORIES:
- APPAREL_HANGER: T-shirts, shirts, jackets, dresses (show on HANGER, never on mannequin)
- APPAREL_FLAT: Pants, shorts, folded items (show as flat lay)
- WALL_MOUNTED: Wall-mounted items (signs, shelves, frames)
- SUSPENDED: Large hanging items (chandeliers, hanging plants)
- HANGING_ORNAMENT: Items with hooks/loops (ornaments, keychains, pendants)
- SMALL_IRREGULAR: Small items (jewelry, controllers, gadgets)
- STANDARD_GROUND: Standing items (bottles, furniture, boxes, appliances)

IMPORTANT:
- ALL clothing = APPAREL_HANGER or APPAREL_FLAT (NEVER on mannequin/person)
- Items with hanging loops = HANGING_ORNAMENT

Respond ONLY with JSON:
{
    "category": "CATEGORY_NAME",
    "detected_object": "Detailed description: color, material, type, key features",
    "has_hanging_loop": true/false,
    "colors": ["main colors"],
    "material": "primary material"
}"""

# ===============================================
# STAGING LOGIC MAP
# ===============================================

STAGING_MAP = {
    "APPAREL_HANGER": {
        "angles": ["front view on hanger", "side view on hanger", "back view on hanger"],
        "staging": "Clothing hanging on wooden hanger, natural drape, NO mannequin, NO person"
    },
    "APPAREL_FLAT": {
        "angles": ["top-down flat lay", "slightly angled overhead", "detail closeup"],
        "staging": "Flat lay on clean surface, neatly arranged, NO mannequin"
    },
    "JEWELRY_STAND": {
        "angles": ["front view on display stand", "side view", "three-quarter view"],
        "staging": "Jewelry on elegant display stand or velvet surface"
    },
    "WALL_MOUNTED": {
        "angles": ["straight-on front", "angled left view", "angled right view"],
        "staging": "Mounted on clean wall with visible mounting hardware"
    },
    "SUSPENDED": {
        "angles": ["view from below", "side view", "three-quarter view"],
        "staging": "Hanging from visible ceiling mount/chain/hook"
    },
    "HANGING_ORNAMENT": {
        "angles": ["front view on ornament stand", "side view on display hook", "three-quarter on jewelry bust"],
        "staging": "Hanging from elegant ornament stand or display hook, hanging loop visible at top, product hanging down naturally"
    },
    "SMALL_IRREGULAR": {
        "angles": ["front on display riser", "three-quarter on platform", "side profile on stand"],
        "staging": "Placed on geometric riser/podium, product base touching platform surface"
    },
    "STANDARD_GROUND": {
        "angles": ["front view standing on floor", "side view on surface", "back view grounded"],
        "staging": "Standing firmly on studio floor, base touching ground"
    }
}


# ===============================================
# SCENE ANALYSIS FOR LIFE CONTEXT
# ===============================================

SCENE_ANALYSIS_PROMPT = """You are an expert scene analyst for product photography.

Analyze this Real Life / Lifestyle product image and describe the scene:

Respond ONLY with JSON:
{
    "scene_type": "indoor" or "outdoor",
    "location": "Brief location description (living room, office, garden, cafe, etc.)",
    "lighting": "Lighting type (natural daylight, warm indoor, golden hour, professional studio)",
    "atmosphere": "Color mood (warm, cool, neutral, vibrant)",
    "key_elements": "Main environmental elements visible (furniture, plants, architecture, nature)"
}"""


def classify_physics(image_bytes):
    """Classify product physics category using REST API"""
    try:
        text = call_gemini_flash(PHYSICS_CLASSIFICATION_PROMPT, image_bytes)

        if text:
            # Parse JSON from response
            if '{' in text and '}' in text:
                start = text.index('{')
                end = text.rindex('}') + 1
                return json.loads(text[start:end])
    except Exception as e:
        print(f"   ⚠️ Classification failed: {e}")

    return {'category': 'STANDARD_GROUND', 'detected_object': 'Product'}


def analyze_scene(image_bytes):
    """Analyze the scene/environment of a Real Life image using REST API"""
    try:
        text = call_gemini_flash(SCENE_ANALYSIS_PROMPT, image_bytes)

        if text:
            if '{' in text and '}' in text:
                start = text.index('{')
                end = text.rindex('}') + 1
                return json.loads(text[start:end])
    except Exception as e:
        print(f"   ⚠️ Scene analysis failed: {e}")

    return {
        'scene_type': 'indoor',
        'location': 'lifestyle setting',
        'lighting': 'natural',
        'atmosphere': 'neutral',
        'key_elements': 'environmental context'
    }


def generate_angle_shot(image_bytes, angle_description, staging, product_desc, api_key=None, is_hanging_product=False, source_context='STUDIO', scene_info=None, aspect_ratio='1:1'):
    """Generate a single angle shot using Gemini (can see reference image!)"""

    # Special staging for hanging products
    hanging_instruction = ""
    if is_hanging_product:
        hanging_instruction = """
🎄 THIS IS A HANGING PRODUCT (ornament, decoration, keychain):
- Product MUST be shown on a display stand, hook, or ornament hanger
- The hanging loop/hook at the top should be visible
- Product hangs DOWN naturally with gravity
- Use elegant display: jewelry bust, ornament stand, decorative hook on wall
- NEVER EVER show this product floating in mid-air without visible support
- The display/stand/hook must be clearly visible in the image
"""

    # ═══════════════════════════════════════════════════════════════════
    # CONTEXT-AWARE PROMPT BUILDING
    # ═══════════════════════════════════════════════════════════════════

    if source_context == 'LIFE' and scene_info:
        # LIFE MODE: Different angle in same scene
        scene_type = scene_info.get('scene_type', 'indoor')
        location = scene_info.get('location', 'lifestyle setting')
        lighting = scene_info.get('lighting', 'natural')
        atmosphere = scene_info.get('atmosphere', 'neutral')
        key_elements = scene_info.get('key_elements', 'environmental context')

        prompt = f"""Look at the product in this image carefully.

Generate a NEW photo showing the EXACT SAME product from: {angle_description}

KEEP THE SAME SCENE: {location} ({scene_type})
LIGHTING: {lighting}
ATMOSPHERE: {atmosphere}
BACKGROUND ELEMENTS: {key_elements}

🚫 CRITICAL RULES:
1. The product must be IDENTICAL - same colors, shape, materials, details
2. DO NOT change ANYTHING about the product
3. DO NOT add logos, text, or branding
4. If it's clothing, show it the same way (flat/folded/placed) - NOT on a person/mannequin
5. Only change the CAMERA ANGLE to: {angle_description}
{hanging_instruction}

Generate the image now."""

    else:
        # STUDIO MODE - Different angles on clean background
        prompt = f"""Look at the product in this image carefully.

Generate a NEW photo showing the EXACT SAME product from: {angle_description}

STAGING: {staging}
BACKGROUND: Clean beige/white studio gradient

🚫 CRITICAL RULES:
1. The product must be IDENTICAL - same colors, shape, materials, details
2. DO NOT change ANYTHING about the product
3. DO NOT add logos, text, or branding
4. If it's clothing, show it on hanger or flat lay - NOT on a person/mannequin
5. Only change the CAMERA ANGLE to: {angle_description}
{hanging_instruction}

PHOTO STYLE: Professional e-commerce photography, soft studio lighting, no harsh shadows.

Generate the image now."""

    # Use Gemini REST API for image generation (can see reference image!)
    print(f"      🔍 Using Gemini REST API (can see reference image)...")

    for attempt in range(3):
        print(f"      🎨 Attempt {attempt+1}/3...")
        result = call_gemini_image_generation(prompt, image_bytes, aspect_ratio)

        if result:
            print(f"      ✅ Angle shot success!")
            return result

        # Wait before retry
        if attempt < 2:
            time.sleep(2)

    print(f"      ❌ All attempts failed for angle shot")
    return None


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
        print("\n📥 MULTI-ANGLE REQUEST - REST API Mode")

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            source_image = data.get('image', '') or data.get('source_image', '')
            product_desc = data.get('productDescription', 'Product item')
            request_vertex_key = data.get('vertex_api_key', '')
            # Source context from frontend (STUDIO or LIFE)
            source_context = data.get('source_context', 'STUDIO')
            # NEW: Aspect ratio support
            aspect_ratio = data.get('aspect_ratio', '1:1')

            # Use request key or fall back to env var
            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY

            print(f"🖼️ Image: {len(source_image)} chars")
            print(f"📦 Product: {product_desc[:50]}...")
            print(f"🎬 Source Context: {source_context}")
            print(f"📐 Aspect Ratio: {aspect_ratio}")
            print(f"🔑 API Key: {'from request' if request_vertex_key else 'from env'}")

            results = {
                'success': False,
                'shot1': None,
                'shot2': None,
                'shot3': None,
                'shot_names': {
                    'shot1': 'Front View',
                    'shot2': 'Side View',
                    'shot3': 'Back View'
                },
                'physics_category': None,
                'error': None
            }

            if not source_image:
                results['error'] = 'No source image'
                self._send_response(results)
                return

            # Clean base64
            if 'base64,' in source_image:
                base64_clean = source_image.split('base64,')[1]
            else:
                base64_clean = source_image

            base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
            missing_padding = len(base64_clean) % 4
            if missing_padding:
                base64_clean += '=' * (4 - missing_padding)

            image_bytes = base64.b64decode(base64_clean)

            # Step 1: Classify physics and get product description
            print("⚛️ Classifying product physics...")
            physics = classify_physics(image_bytes)
            category = physics.get('category', 'STANDARD_GROUND')
            has_hanging_loop = physics.get('has_hanging_loop', False)

            # Use detected_object for better product description
            detected_desc = physics.get('detected_object', '')
            colors = physics.get('colors', [])
            material = physics.get('material', '')

            # Build enhanced product description
            if detected_desc and detected_desc != 'Brief description':
                product_desc = detected_desc
                if colors:
                    product_desc = f"{', '.join(colors)} {product_desc}"
                if material:
                    product_desc = f"{material} {product_desc}"
            print(f"   📦 Enhanced desc: {product_desc[:60]}...")

            # Determine if this is a hanging product
            is_hanging_product = (category == 'HANGING_ORNAMENT' or
                                  category == 'SUSPENDED' or
                                  has_hanging_loop)

            results['physics_category'] = category
            results['is_hanging_product'] = is_hanging_product
            print(f"   🎯 Category: {category}")
            print(f"   🎄 Is Hanging Product: {is_hanging_product}")

            # Step 1b: Analyze scene if LIFE context
            scene_info = None
            if source_context == 'LIFE':
                print("🏞️ Analyzing Real Life scene...")
                scene_info = analyze_scene(image_bytes)
                print(f"   🌍 Scene: {scene_info.get('location', 'Unknown')}")

            # Get staging config
            config = STAGING_MAP.get(category, STAGING_MAP['STANDARD_GROUND'])
            angles = config['angles']
            staging = config['staging']

            # Update shot names
            results['shot_names'] = {
                'shot1': angles[0][:30],
                'shot2': angles[1][:30],
                'shot3': angles[2][:30]
            }

            # Step 2: Generate shots
            print("📷 Generating multi-angle shots...")

            for i, angle in enumerate(angles):
                shot_key = f'shot{i+1}'
                print(f"   📷 Generating {shot_key}: {angle}...")

                shot_image = generate_angle_shot(
                    image_bytes=image_bytes,
                    angle_description=angle,
                    staging=staging,
                    product_desc=product_desc,
                    api_key=active_vertex_key,
                    is_hanging_product=is_hanging_product,
                    source_context=source_context,
                    scene_info=scene_info,
                    aspect_ratio=aspect_ratio
                )

                if shot_image:
                    results[shot_key] = shot_image
                    print(f"   ✅ {shot_key} complete")
                else:
                    print(f"   ⚠️ {shot_key} failed")

            # Check success
            if results['shot1'] or results['shot2'] or results['shot3']:
                results['success'] = True
                print("✅ Multi-angle generation complete!")
            else:
                results['error'] = 'All shots failed'

            self._send_response(results)

        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()
            self._send_response({
                'success': False,
                'error': str(e)
            })

    def _send_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())


print("✅ Multi-Angle Generator - REST API Mode ready")
