# Real Life Photos Generator - Hyper-Realistic Lifestyle Photography
# Generates AI product photos in real-world usage contexts
# CRITICAL: Product must be preserved EXACTLY - no texture/text/detail changes

import os
import json
import base64
import requests
import time
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🌟 REAL LIFE PHOTOS GENERATOR - Product Preservation Mode")
print("=" * 60)

# Environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
VERTEX_API_KEY = os.environ.get("VERTEX_API_KEY")
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")

# OAuth2 Setup for Imagen 3 (fallback)
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

print("✅ Using REST API for all calls (Gemini PRIMARY, Imagen 3 fallback)")


def get_fresh_token():
    """Get a fresh OAuth2 token"""
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
# REST API HELPERS
# ===============================================

def call_gemini_flash(prompt, image_bytes):
    """Call Gemini 2.0 Flash via REST API for text/analysis"""
    if not GOOGLE_API_KEY:
        print("   ⚠️ GOOGLE_API_KEY not set")
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
        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"   ⚠️ Gemini Error {response.status_code}: {response.text[:200]}")
            return None

        data = response.json()
        return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    except Exception as e:
        print(f"   ⚠️ Gemini Request Error: {e}")
        return None


def call_gemini_image_generation(prompt, image_bytes):
    """Call Gemini for image generation - CAN SEE THE REFERENCE IMAGE!"""
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

            payload = {
                "contents": [{
                    "parts": [
                        {"text": prompt},
                        {"inline_data": {"mime_type": "image/jpeg", "data": image_b64}}
                    ]
                }],
                "generationConfig": {
                    "responseModalities": ["IMAGE", "TEXT"]
                }
            }

            response = requests.post(url, headers=headers, json=payload, timeout=60)

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
# PRODUCT ANALYSIS PROMPT - Focus on preservation details
# ===============================================

PRODUCT_ANALYSIS_PROMPT = """You are an Expert Product Photographer analyzing a product for lifestyle photography.

CRITICAL: Your analysis will be used to PRESERVE every detail of this product when placing it in a scene.

Analyze this product image and return JSON:
{
    "product_type": "Specific product name (e.g., 'crew neck t-shirt', 'ceramic coffee mug', 'action figure')",
    "category": "Category (apparel, home, electronics, toy, etc.)",

    "texture_details": {
        "surface_type": "smooth/textured/patterned/knitted/woven/glossy/matte/etc.",
        "texture_description": "Detailed texture description (e.g., 'ribbed cotton fabric', 'dotted rubber surface', 'brushed metal')",
        "must_preserve": ["list of texture details that MUST be preserved exactly"]
    },

    "text_and_graphics": {
        "has_text": true/false,
        "has_logos": true/false,
        "has_graphics": true/false,
        "text_content": "Exact text if any (empty string if none)",
        "text_location": "Where text is located",
        "graphic_description": "Description of any graphics/logos",
        "plain_areas": ["list of areas that are PLAIN with no text/graphics"]
    },

    "colors": {
        "primary": "main color",
        "secondary": ["other colors"],
        "exact_shades": "describe exact color shades (e.g., 'light sky blue', 'deep navy')"
    },

    "structural_details": {
        "components": ["list all visible parts/components"],
        "transparent_parts": ["any transparent/translucent areas"],
        "special_features": ["buttons, zippers, handles, hinges, etc."]
    },

    "is_wearable": true/false,
    "wear_on": "body part if wearable (torso, feet, head, etc.)",

    "lifestyle_scenes": [
        {"scene": "Specific scene description", "person_needed": true/false},
        {"scene": "Another scene", "person_needed": true/false},
        {"scene": "Third scene", "person_needed": true/false}
    ]
}"""


# ===============================================
# LIFESTYLE PROMPT BUILDER - Ultra-strict preservation
# ===============================================

def build_reallife_prompt(product_analysis, scene_info, scene_index):
    """Build a prompt that STRICTLY preserves the original product"""

    product_type = product_analysis.get('product_type', 'product')
    category = product_analysis.get('category', 'general')

    # Texture details
    texture = product_analysis.get('texture_details', {})
    texture_type = texture.get('surface_type', 'original')
    texture_desc = texture.get('texture_description', '')
    texture_preserve = texture.get('must_preserve', [])

    # Text and graphics
    text_info = product_analysis.get('text_and_graphics', {})
    has_text = text_info.get('has_text', False)
    has_logos = text_info.get('has_logos', False)
    has_graphics = text_info.get('has_graphics', False)
    text_content = text_info.get('text_content', '')
    text_location = text_info.get('text_location', '')
    plain_areas = text_info.get('plain_areas', [])

    # Colors
    colors = product_analysis.get('colors', {})
    primary_color = colors.get('primary', '')
    exact_shades = colors.get('exact_shades', '')

    # Structure
    structure = product_analysis.get('structural_details', {})
    components = structure.get('components', [])
    transparent_parts = structure.get('transparent_parts', [])
    special_features = structure.get('special_features', [])

    # Wearable info
    is_wearable = product_analysis.get('is_wearable', False)
    wear_on = product_analysis.get('wear_on', '')

    # Scene info
    scenes = product_analysis.get('lifestyle_scenes', [])
    if scene_index < len(scenes):
        scene = scenes[scene_index]
        scene_desc = scene.get('scene', 'lifestyle setting')
        person_needed = scene.get('person_needed', False)
    else:
        scene_desc = 'modern lifestyle setting'
        person_needed = is_wearable

    # Build texture preservation rules
    texture_rules = f"""
TEXTURE PRESERVATION (CRITICAL):
- Original texture: {texture_type} - {texture_desc}
- This texture MUST appear EXACTLY as in the original image
- DO NOT smooth out textures, DO NOT add textures
- If dotted → keep dotted, if ribbed → keep ribbed, if smooth → keep smooth
{f"- Must preserve: {', '.join(texture_preserve)}" if texture_preserve else ""}
"""

    # Build text/graphics rules
    if has_text or has_logos or has_graphics:
        text_rules = f"""
TEXT/LOGO PRESERVATION (CRITICAL):
- This product HAS text/logos/graphics - they MUST be preserved EXACTLY
- Text content: "{text_content}" at {text_location}
- Every letter, every line, every pixel must be IDENTICAL
- DO NOT move, resize, recolor, or modify any text/logo/graphic
"""
    else:
        text_rules = f"""
NO TEXT/LOGO RULE (CRITICAL):
- This product has NO text, NO logos, NO graphics - it is PLAIN
- The surface is clean and unmarked
- DO NOT ADD any text, logos, brand names, labels, or graphics
- Plain areas: {', '.join(plain_areas) if plain_areas else 'entire product surface'}
- Any addition of text/logos = FAILURE
"""

    # Build structure rules
    structure_rules = f"""
STRUCTURAL PRESERVATION:
- Components: {', '.join(components) if components else 'all visible parts'}
- ALL components must appear in the final image
{f"- Transparent parts: {', '.join(transparent_parts)} - keep transparency!" if transparent_parts else ""}
{f"- Special features: {', '.join(special_features)} - must be visible" if special_features else ""}
"""

    # Build color rules
    color_rules = f"""
COLOR PRESERVATION:
- Primary color: {primary_color}
- Exact shade: {exact_shades}
- Colors must be EXACT - not lighter, not darker, not different hue
"""

    # Person/wearing instructions
    if is_wearable and person_needed:
        person_instruction = f"""
WEARING INSTRUCTION:
- This {product_type} should be WORN by a person in the scene
- Person should be in a natural pose
- The {product_type} on the person must be IDENTICAL to the original
- Same color, same texture, same everything
"""
    else:
        person_instruction = """
PLACEMENT:
- Place the product naturally in the scene
- Product should be the hero/focus of the image
"""

    # Final prompt
    prompt = f"""Look at this product image VERY CAREFULLY. You must place this EXACT product in a lifestyle scene.

SCENE: {scene_desc}

═══════════════════════════════════════════════════════════════════════════════
🚫🚫🚫 ABSOLUTE RULES - PRODUCT MUST BE IDENTICAL 🚫🚫🚫
═══════════════════════════════════════════════════════════════════════════════

The product in your generated image MUST be a PERFECT COPY of the original.
NOT similar. NOT inspired by. IDENTICAL. EXACT. PIXEL-PERFECT.

{texture_rules}
{text_rules}
{color_rules}
{structure_rules}
{person_instruction}

PRODUCT: {primary_color} {product_type}

WHAT TO DO:
1. Study every detail of this product
2. Generate a lifestyle photo with this EXACT product in: {scene_desc}
3. Change ONLY the environment/background/context
4. The product itself = ZERO changes

FORBIDDEN:
- Changing texture (smooth→dotted, dotted→smooth, etc.)
- Adding text/logos to plain products
- Removing or modifying existing text/logos
- Changing colors or shades
- Adding/removing components
- Modifying any structural detail

Generate the image now with the EXACT same product in the lifestyle scene."""

    return prompt


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
        print("\n📸 REAL LIFE REQUEST - Product Preservation Mode")

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
            product_info = data.get('product_info', {})

            source_image = source_image or ""

            # Clean base64
            if 'base64,' in source_image:
                base64_clean = source_image.split('base64,')[1]
            else:
                base64_clean = source_image

            base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')

            if not base64_clean:
                raise ValueError("Empty image data")

            missing_padding = len(base64_clean) % 4
            if missing_padding:
                base64_clean += '=' * (4 - missing_padding)

            image_bytes = base64.b64decode(base64_clean)

            # Step 1: Deep Product Analysis
            print("🔍 Step 1: Deep Product Analysis for preservation...")
            analysis_text = call_gemini_flash(PRODUCT_ANALYSIS_PROMPT, image_bytes)

            product_analysis = None
            if analysis_text:
                try:
                    # Clean possible markdown
                    if '```json' in analysis_text:
                        analysis_text = analysis_text.split('```json')[1].split('```')[0]
                    elif '```' in analysis_text:
                        analysis_text = analysis_text.split('```')[1].split('```')[0]

                    product_analysis = json.loads(analysis_text.strip())
                    print(f"   📦 Product: {product_analysis.get('product_type', 'unknown')}")
                    print(f"   🎨 Texture: {product_analysis.get('texture_details', {}).get('surface_type', 'unknown')}")
                    text_info = product_analysis.get('text_and_graphics', {})
                    print(f"   📝 Has text: {text_info.get('has_text', False)}")
                except Exception as e:
                    print(f"   ⚠️ JSON parse error: {e}")

            # Fallback analysis
            if not product_analysis:
                print("   ⚠️ Using fallback analysis")
                product_analysis = {
                    'product_type': product_info.get('product_type', 'product'),
                    'category': product_info.get('category', 'general'),
                    'texture_details': {'surface_type': 'original', 'must_preserve': ['all textures']},
                    'text_and_graphics': {'has_text': False, 'plain_areas': ['entire surface']},
                    'colors': {'primary': 'original colors'},
                    'structural_details': {'components': ['all parts']},
                    'is_wearable': False,
                    'lifestyle_scenes': [
                        {'scene': 'Modern home interior', 'person_needed': False},
                        {'scene': 'Cozy lifestyle setting', 'person_needed': False},
                        {'scene': 'Professional environment', 'person_needed': False}
                    ]
                }

            results['analysis'] = product_analysis

            # Step 2: Generate 3 Real Life Shots using GEMINI (can see the product!)
            print("📷 Step 2: Generating Real Life Shots (Gemini - can see product)...")

            for i in range(3):
                shot_key = f'shot{i+1}'
                print(f"   📷 Generating {shot_key}...")

                # Build preservation-focused prompt
                prompt = build_reallife_prompt(product_analysis, None, i)

                # Use Gemini as PRIMARY - it can SEE the reference image!
                print(f"      🔍 Using Gemini (can see reference image)...")

                for attempt in range(2):
                    print(f"      🎨 Attempt {attempt+1}/2...")
                    shot_image = call_gemini_image_generation(prompt, image_bytes)

                    if shot_image:
                        results[shot_key] = shot_image
                        print(f"   ✅ {shot_key} complete")
                        break

                    if attempt < 1:
                        time.sleep(1)

                if not results[shot_key]:
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


print("✅ Real Life Generator - Product Preservation Mode ready")
