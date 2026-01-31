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

print("✅ Using Imagen 3 for image generation, Gemini for analysis")


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


def generate_with_vertex_rest(image_bytes, prompt, aspect_ratio='1:1'):
    """
    PRIMARY METHOD: Generate image using Vertex AI REST API with OAuth2
    This is the most reliable method for Imagen 3 edit operations.
    """
    global oauth2_token, project_id

    token = get_fresh_token()
    if not token or not project_id:
        print("      ⚠️ No OAuth2 token or project_id - skipping Vertex REST")
        return None

    print(f"      🔑 Using Vertex AI REST API with OAuth2...")

    # Vertex AI endpoint for Imagen 3 edit
    region = "us-central1"
    model_id = "imagen-3.0-capability-001"
    url = f"https://{region}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{region}/publishers/google/models/{model_id}:predict"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Encode image
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # Try INPAINT_INSERTION first (better for lifestyle scenes)
    edit_modes = [
        {"editMode": "EDIT_MODE_INPAINT_INSERTION", "maskMode": "MASK_MODE_BACKGROUND"},
        {"editMode": "EDIT_MODE_BGSWAP"}
    ]

    for mode_config in edit_modes:
        try:
            mode_name = mode_config.get("editMode", "UNKNOWN")
            print(f"         📸 Trying {mode_name}...")

            payload = {
                "instances": [{
                    "prompt": prompt,
                    "referenceImages": [{
                        "referenceType": 1,
                        "referenceId": 1,
                        "referenceImage": {
                            "bytesBase64Encoded": image_b64
                        }
                    }]
                }],
                "parameters": {
                    "sampleCount": 1,
                    **mode_config
                }
            }

            response = requests.post(url, headers=headers, json=payload, timeout=120)

            if response.status_code == 200:
                data = response.json()
                predictions = data.get('predictions', [])

                if predictions:
                    for pred in predictions:
                        img_b64_result = pred.get('bytesBase64Encoded')
                        if img_b64_result:
                            print(f"      ✅ Success with Vertex REST ({mode_name})!")
                            return f"data:image/png;base64,{img_b64_result}"

                print(f"         ⚠️ No images in response, trying next mode...")
            else:
                error_text = response.text[:200] if response.text else "Unknown"
                print(f"         ⚠️ Vertex API error {response.status_code}: {error_text}")

        except Exception as e:
            print(f"         ⚠️ {mode_name} error: {str(e)[:100]}")
            continue

    print("      ❌ Vertex REST API failed all modes")
    return None


def generate_with_imagen3_edit(image_bytes, prompt, api_key, aspect_ratio='1:1'):
    """
    Generate image using Imagen 3 edit_image API - PRESERVES PRODUCT!
    Uses INPAINT/BGSWAP to keep product intact while changing background/scene.

    Strategy:
    1. Try Vertex AI REST API with OAuth2 (most reliable)
    2. Fallback to genai.Client with API key
    """

    # METHOD 1: Try Vertex AI REST API with OAuth2 first
    result = generate_with_vertex_rest(image_bytes, prompt, aspect_ratio)
    if result:
        return result

    # METHOD 2: Fallback to genai.Client with API key
    if not api_key:
        print("      ⚠️ No API key provided for genai.Client fallback")
        return None

    print(f"      🔄 Trying genai.Client with API key...")

    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"      ⚠️ Failed to create genai client: {e}")
        return None

    # Try different Imagen 3 models
    models_to_try = [
        'imagen-3.0-capability-001',
        'imagen-3.0-generate-002',
    ]

    for model_name in models_to_try:
        try:
            print(f"      🔄 Trying {model_name}...")

            # Create reference image for edit - THIS IS KEY FOR PRODUCT PRESERVATION!
            reference_image = types.RawReferenceImage(
                reference_id=1,
                reference_image=types.Image(image_bytes=image_bytes)
            )

            # Try INPAINT with auto background mask FIRST
            try:
                print(f"         📸 Trying INPAINT with MASK_MODE_BACKGROUND...")
                response = client.models.edit_image(
                    model=model_name,
                    prompt=prompt,
                    reference_images=[reference_image],
                    config=types.EditImageConfig(
                        edit_mode='EDIT_MODE_INPAINT_INSERTION',
                        mask_mode='MASK_MODE_BACKGROUND',
                        number_of_images=1
                    )
                )

                if response.generated_images:
                    img_bytes = response.generated_images[0].image.image_bytes
                    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                    print(f"      ✅ Success with INPAINT!")
                    return f"data:image/png;base64,{img_b64}"
                else:
                    print(f"         ⚠️ INPAINT returned no images")

            except Exception as inpaint_error:
                print(f"         ⚠️ INPAINT failed: {str(inpaint_error)[:100]}, trying BGSWAP...")

            # Fallback to BGSWAP mode
            try:
                response = client.models.edit_image(
                    model=model_name,
                    prompt=prompt,
                    reference_images=[reference_image],
                    config=types.EditImageConfig(
                        edit_mode='EDIT_MODE_BGSWAP',
                        number_of_images=1
                    )
                )

                if response.generated_images:
                    img_bytes = response.generated_images[0].image.image_bytes
                    img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                    print(f"      ✅ Success with BGSWAP!")
                    return f"data:image/png;base64,{img_b64}"
                else:
                    print(f"         ⚠️ BGSWAP returned no images")

            except Exception as bgswap_error:
                print(f"         ⚠️ BGSWAP failed: {str(bgswap_error)[:100]}")

        except Exception as e:
            print(f"      ⚠️ {model_name} failed: {str(e)[:150]}")
            continue

    print("      ❌ All Imagen 3 methods failed")
    return None


# ===============================================
# PRODUCT ANALYSIS PROMPT - Focus on preservation details
# ===============================================

PRODUCT_ANALYSIS_PROMPT = """You are an Expert Product Photographer analyzing a product for lifestyle photography.

CRITICAL: Your analysis will be used to PRESERVE every detail of this product when placing it in a scene.
This is a UNIQUE product - it may differ from typical products in its category!

Analyze this product image and return JSON:
{
    "product_type": "Specific product name (e.g., 'crew neck t-shirt', 'ceramic coffee mug', 'action figure')",
    "category": "Category (apparel, home, electronics, toy, etc.)",

    "texture_details": {
        "surface_type": "smooth/textured/patterned/knitted/woven/glossy/matte/etc.",
        "texture_description": "Detailed texture description",
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
        "exact_shades": "describe exact color shades"
    },

    "structural_details": {
        "components": ["list ALL visible parts - ONLY what you see"],
        "transparent_parts": ["any transparent/translucent areas"],
        "special_features": ["ONLY features that are VISIBLE in the image"]
    },

    "NOT_in_this_product": {
        "missing_typical_features": ["features that TYPICAL products in this category have, but THIS product does NOT have"],
        "simple_design_notes": "describe if this product is simpler/different than typical products",
        "do_not_add": ["specific things that should NOT be added because they don't exist in original"]
    },

    "unique_characteristics": "What makes THIS product different from typical products in its category?",

    "is_wearable": true/false,
    "wear_on": "body part if wearable (torso, feet, head, etc.)",

    "lifestyle_scenes": [
        {"scene": "Specific scene description", "person_needed": true/false},
        {"scene": "Another scene", "person_needed": true/false},
        {"scene": "Third scene", "person_needed": true/false}
    ]
}

IMPORTANT: This product may be SIMPLER or DIFFERENT than typical products.
- If a baby gate has NO mounting brackets → note that it has NO mounting brackets
- If a t-shirt has NO logo → note that it has NO logo
- If a door has NO hinges visible → note that hinges are NOT visible
Capture what is MISSING compared to typical products!"""


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

    # NEW: What is NOT in this product (critical for preservation)
    not_in_product = product_analysis.get('NOT_in_this_product', {})
    missing_features = not_in_product.get('missing_typical_features', [])
    do_not_add = not_in_product.get('do_not_add', [])
    unique_chars = product_analysis.get('unique_characteristics', '')

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
- ONLY these components - nothing more, nothing less
{f"- Transparent parts: {', '.join(transparent_parts)} - keep transparency!" if transparent_parts else ""}
{f"- Special features: {', '.join(special_features)} - must be visible" if special_features else ""}
"""

    # NEW: Build "DO NOT ADD" rules - critical for unique products
    do_not_add_rules = ""
    if missing_features or do_not_add or unique_chars:
        do_not_add_rules = f"""
═══════════════════════════════════════════════════════════════════════════════
🚫 DO NOT ADD TYPICAL FEATURES - THIS PRODUCT IS UNIQUE
═══════════════════════════════════════════════════════════════════════════════
This product is DIFFERENT from typical {product_type} products!

{f"MISSING TYPICAL FEATURES (DO NOT ADD THESE!):" if missing_features else ""}
{chr(10).join([f"- ❌ NO {feat} - do not add!" for feat in missing_features]) if missing_features else ""}

{f"EXPLICITLY FORBIDDEN TO ADD:" if do_not_add else ""}
{chr(10).join([f"- ❌ {item}" for item in do_not_add]) if do_not_add else ""}

{f"UNIQUE CHARACTERISTICS: {unique_chars}" if unique_chars else ""}

⚠️ DO NOT "IMPROVE" OR "MODERNIZE" THIS PRODUCT!
⚠️ DO NOT MAKE IT LOOK LIKE AMAZON/TYPICAL PRODUCTS!
⚠️ KEEP IT EXACTLY AS SHOWN IN THE ORIGINAL IMAGE!
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
{do_not_add_rules}

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
            'shots': [],  # Dynamic array instead of fixed shot1/shot2/shot3
            'shot1': None,  # Keep for backward compatibility
            'shot2': None,
            'shot3': None,
            'shot4': None,
            'analysis': None,
            'output_count': 0,
            'error': None
        }

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            source_image = data.get('source_image', '')
            product_info = data.get('product_info', {})
            request_vertex_key = data.get('vertex_api_key', '')

            # NEW: Configurable output count and aspect ratio
            output_count = data.get('output_count', 3)  # 1-4, default 3
            aspect_ratio = data.get('aspect_ratio', '1:1')  # Default 1:1
            custom_prompt = data.get('custom_prompt', '')  # Optional extra prompt

            # Get API key
            active_api_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY

            # Validate output_count
            output_count = max(1, min(4, int(output_count)))

            print(f"   📊 Output count: {output_count}, Aspect ratio: {aspect_ratio}")

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

            # Step 2: Generate Real Life Shots using Imagen 3 edit_image (PRESERVES PRODUCT!)
            print(f"📷 Step 2: Generating {output_count} Real Life Shots (Imagen 3 - product preservation)...")

            generated_count = 0
            for i in range(output_count):
                shot_key = f'shot{i+1}'
                print(f"   📷 Generating {shot_key}...")

                # Build preservation-focused prompt
                prompt = build_reallife_prompt(product_analysis, None, i)

                # Add custom prompt if provided
                if custom_prompt:
                    prompt += f"\n\nADDITIONAL INSTRUCTIONS: {custom_prompt}"

                # Use Imagen 3 edit_image - preserves product while changing background!
                print(f"      🔍 Using Imagen 3 edit_image (product preservation)...")

                for attempt in range(3):
                    print(f"      🎨 Attempt {attempt+1}/3...")
                    shot_image = generate_with_imagen3_edit(image_bytes, prompt, active_api_key, aspect_ratio)

                    if shot_image:
                        results[shot_key] = shot_image
                        results['shots'].append({
                            'image': shot_image,
                            'label': f'Lifestyle {i+1}'
                        })
                        generated_count += 1
                        print(f"   ✅ {shot_key} complete")
                        break

                    if attempt < 2:
                        time.sleep(2)

                if not results.get(shot_key):
                    print(f"   ⚠️ {shot_key} failed")

            results['output_count'] = generated_count

            # Check success
            if generated_count > 0:
                results['success'] = True
                print(f"✅ Real Life generation complete! ({generated_count}/{output_count} shots)")
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
