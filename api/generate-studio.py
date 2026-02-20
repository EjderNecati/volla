"""
AI Studio Mode - Nano Banana Pro Integration
Professional product photography with background swap

Uses Nano Banana Pro (gemini-3-pro-image-preview) with:
- Thinking Mode for complex compositions
- 100% product preservation (color, text, components)
- Professional studio background
- 4K resolution support
- Extended aspect ratios
"""

import os
import base64
import json
import traceback
import requests
import time
from http.server import BaseHTTPRequestHandler

# Import Nano Banana Pro configuration
try:
    from nano_banana_pro import (
        MODEL_CONFIG,
        RESOLUTION_OPTIONS,
        ASPECT_RATIOS,
        build_thinking_prompt,
        calculate_credits
    )
    NANO_BANANA_LOADED = True
except ImportError:
    NANO_BANANA_LOADED = False
    MODEL_CONFIG = {"primary": "gemini-3-pro-image-preview", "fallback": "gemini-2.0-flash-exp"}
    RESOLUTION_OPTIONS = {"1K": {}, "2K": {}, "4K": {}}
    ASPECT_RATIOS = {"1:1": {}, "9:16": {}, "16:9": {}, "4:5": {}}

print("=" * 60)
print("🚀 AI Studio - Nano Banana Pro Mode")
print(f"   Config loaded: {NANO_BANANA_LOADED}")
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

STEP 4: PRODUCT ORIENTATION (VERY IMPORTANT)
- For clothing: Are we seeing the FRONT or BACK of the garment?
- For items with prints/graphics: Is the design on the visible side or the opposite side?
- Which side has the main design/print/logo?
═══════════════════════════════════════════════════════════════════════════════

Return JSON:
{
    "product_type": "precise name",
    "is_hanging": true/false,
    "is_transparent": true/false,
    "has_text": true/false,
    "text_details": "description of text/logo content and location",
    "staging": "how to stage it (standing, leaning, hanging, flat lay)",
    "visible_side": "front/back/side/unknown - which side of the product we are seeing",
    "design_location": "where is the main design/print (front side, back side, both sides, no print)"
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
        "staging": "standard",
        "visible_side": "unknown",
        "design_location": ""
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
- Seamless cyclorama style with visible floor/surface
LIGHTING:
- Soft, diffused studio lighting
- Professional product photography setup

⚠️ CRITICAL PLACEMENT RULE:
- The product MUST be physically placed ON the floor/surface
- There MUST be a visible CONTACT POINT between product and surface
- Product should appear GROUNDED and STABLE, not floating in mid-air
- Show realistic CONTACT SHADOW where product meets the surface
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
PRODUCT STAGING: ON SURFACE (NOT FLOATING!)
- Product MUST be physically resting ON a solid floor/surface
- There MUST be a CLEAR, VISIBLE contact point between product bottom and surface
- Show a realistic CONTACT SHADOW at the base where product touches surface
- Product should appear STABLE, GROUNDED, and WEIGHTED - not hovering or floating
- The floor/surface should be visible around and under the product
- Think: product placed on a studio floor, shot for e-commerce catalog
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

    # Extract text info and orientation if available
    text_rules = ""
    text_content = ""
    orientation_rules = ""

    if product_analysis:
        text_content = product_analysis.get('text_details', '')
        visible_side = product_analysis.get('visible_side', 'unknown')
        design_location = product_analysis.get('design_location', '')

        # Text preservation rules
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

        # Orientation preservation rules (CRITICAL for clothing and printed items)
        if visible_side and visible_side != 'unknown':
            orientation_rules = f"""
🔄 ORIENTATION PRESERVATION (CRITICAL):
- We are viewing the {visible_side.upper()} of this product
- The output image MUST show the SAME {visible_side.upper()} view
- DO NOT rotate or flip the product to show a different side
- If the design/print is on the {design_location}, keep showing that EXACT side
- The visible side in the output MUST match the input image orientation
"""
            # Special rules for clothing
            if 'shirt' in product_type.lower() or 'tshirt' in product_type.lower() or 't-shirt' in product_type.lower():
                if visible_side == 'back':
                    orientation_rules += """
👕 CLOTHING BACK VIEW:
- This is the BACK of the garment - keep showing the BACK
- If there's a back print/design, it stays on the BACK (visible)
- DO NOT flip to show the front of the shirt
"""
                elif visible_side == 'front':
                    orientation_rules += """
👕 CLOTHING FRONT VIEW:
- This is the FRONT of the garment - keep showing the FRONT
- Any front design stays on the visible front side
- DO NOT flip to show the back of the shirt
"""

    angle_inst = angle_instructions.get(camera_angle, angle_instructions["FRONT"])
    placement_inst = placement_instructions.get(product_placement, placement_instructions["ON_SURFACE"])

    full_prompt = base_prompt + angle_inst + placement_inst + text_rules + orientation_rules
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


def generate_studio_with_gemini(image_data, custom_prompt=None, aspect_ratio='1:1'):
    """Generate studio image using Gemini - CAN see the reference image for proper background swap"""
    if not GOOGLE_API_KEY:
        return None

    print("      🎨 Trying Gemini Studio (with reference image)...")

    # Clean base64
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)

    image_bytes = base64.b64decode(base64_clean)
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')

    # CRITICAL: Prompt that preserves the EXACT product
    studio_prompt = custom_prompt or """Look at this product image carefully.

YOUR TASK: Create a professional e-commerce studio photo of THIS EXACT PRODUCT.

CRITICAL RULES - YOU MUST FOLLOW:
1. The product must be 100% IDENTICAL to the input - same shape, colors, textures, details, labels, text
2. DO NOT change, modify, or reimagine the product in ANY way
3. DO NOT add or remove any features, logos, or text from the product
4. ONLY change the BACKGROUND to a clean, professional studio setting
5. Keep the SAME orientation - if showing back of product, output shows back

BACKGROUND:
- Clean, warm beige/cream studio backdrop (#E8DDD0 to #F5F0EB gradient)
- Seamless cyclorama style with VISIBLE FLOOR/SURFACE
- Soft contact shadows where product meets surface

LIGHTING:
- Professional soft studio lighting
- Gentle highlights, no harsh reflections
- Natural product appearance

⚠️ PLACEMENT (CRITICAL):
- Product MUST be placed ON a solid surface (not floating!)
- Show visible CONTACT POINT between product and floor/surface
- Product should appear GROUNDED and STABLE
- Include realistic contact shadow at base of product

🔄 ORIENTATION:
- Maintain the SAME view/angle as input image
- If input shows BACK of item, output shows BACK
- If input shows FRONT of item, output shows FRONT
- DO NOT rotate or flip to show different side

OUTPUT:
- High quality professional e-commerce product photo
- The product should be the clear focus
- Clean, minimal, professional aesthetic

Generate the studio photo now."""

    # Add aspect ratio instruction to prompt (more reliable than API parameter)
    if aspect_ratio and aspect_ratio != '1:1':
        aspect_map = {
            '16:9': 'wide horizontal (16:9 ratio, landscape format)',
            '9:16': 'tall vertical (9:16 ratio, portrait format, like phone screen)',
            '4:3': 'horizontal (4:3 ratio)',
            '3:4': 'vertical (3:4 ratio)',
            '3:2': 'horizontal (3:2 ratio)',
            '2:3': 'vertical (2:3 ratio)',
            '4:5': 'slightly vertical (4:5 ratio, Instagram portrait)'
        }
        aspect_desc = aspect_map.get(aspect_ratio, f'{aspect_ratio} aspect ratio')
        studio_prompt += f"\n\nIMAGE FORMAT: Generate this image in {aspect_desc}. The output image dimensions MUST match this aspect ratio."

    # Models to try
    models_to_try = [
        'gemini-2.0-flash-exp-image-generation',
        'gemini-2.0-flash-exp'
    ]

    headers = { "Content-Type": "application/json" }

    for model_name in models_to_try:
        # Try with aspect ratio first, then without if it fails
        for try_with_aspect in [True, False] if (aspect_ratio and aspect_ratio != '1:1') else [False]:
            try:
                print(f"      🎨 Trying {model_name}{'(with aspect ratio)' if try_with_aspect else ''}...")
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GOOGLE_API_KEY}"

                # Build generation config
                gen_config = {
                    "responseModalities": ["IMAGE", "TEXT"]
                }

                # Add aspect ratio if requested
                if try_with_aspect and aspect_ratio and aspect_ratio != '1:1':
                    gen_config["aspectRatio"] = aspect_ratio

                payload = {
                    "contents": [{
                        "parts": [
                            {"text": studio_prompt},
                            { "inline_data": { "mime_type": "image/jpeg", "data": image_b64 } }
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
                                    print(f"      ✅ Got studio image from {model_name}")
                                    return f"data:{mime_type};base64,{img_data}"

                    print(f"      ⚠️ {model_name}: No image in response")
                else:
                    error_text = response.text[:100] if response.text else "Unknown error"
                    print(f"      ⚠️ {model_name}: {response.status_code} - {error_text}")
                    # If aspect ratio caused the error, retry without it
                    if try_with_aspect and ('aspectRatio' in error_text or response.status_code == 400):
                        print(f"      🔄 Retrying without aspectRatio...")
                        continue

            except Exception as e:
                print(f"      ⚠️ {model_name} error: {str(e)[:50]}")
                continue

            # Break inner loop if we didn't get a retry condition
            if not (try_with_aspect and response.status_code != 200):
                break

    return None


def generate_with_imagen3_edit(image_data, custom_prompt=None, aspect_ratio='1:1'):
    """Generate studio image using Imagen 3 Edit/Capability API - WITH REFERENCE IMAGE"""

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

    # Imagen 3 CAPABILITY endpoint (supports reference images!)
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-capability-001:predict"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Build prompt with reference - [1] refers to the product image
    full_prompt = f"Generate a professional studio photo of [1] on a clean beige background. {prompt_to_use}"

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
            "aspectRatio": aspect_ratio,
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

        print(f"   ⚠️ Imagen 3 Edit response: {response.status_code} - {response.text[:300]}")

    except Exception as e:
        print(f"   ❌ Imagen 3 Edit API error: {e}")

    return None


def generate_with_gemini_3_pro(image_data, custom_prompt=None, aspect_ratio='1:1', resolution='2K', use_thinking=True):
    """Generate studio image using Nano Banana Pro via Vertex AI REST API - BEST for product preservation"""

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

    # Nano Banana Pro requires global location
    model_name = MODEL_CONFIG.get('primary', 'gemini-3-pro-image-preview')
    url = f"https://aiplatform.googleapis.com/v1/projects/{project_id}/locations/global/publishers/google/models/{model_name}:generateContent"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Thinking mode header for complex compositions
    thinking_header = ""
    if use_thinking and NANO_BANANA_LOADED:
        thinking_header = """
═══════════════════════════════════════════════════════════════════════════════
🧠 THINK STEP-BY-STEP BEFORE GENERATING
═══════════════════════════════════════════════════════════════════════════════

STEP 1: PRODUCT ANALYSIS
- Identify the exact product, its type and category
- Note all dimensions, proportions, angles
- List all visible colors with exact shades

STEP 2: TEXT/LOGO INVENTORY (CRITICAL)
- List EVERY piece of text on the product, character by character
- Note font style, color, position for each text element
- Describe all logos: shape, colors, proportions, position

STEP 3: TEXTURE & MATERIAL
- What material? (fabric, plastic, metal, glass, etc.)
- Surface texture? (matte, glossy, textured)
- Any patterns? Describe precisely.

STEP 4: COMPOSITION PLANNING
- Best placement for studio shot
- Optimal grounding on surface
- Lighting for professional look

STEP 5: QUALITY CHECK
- ALL text will be readable in output
- ALL logos preserved exactly
- Colors match original

═══════════════════════════════════════════════════════════════════════════════
NOW GENERATE THE STUDIO IMAGE
═══════════════════════════════════════════════════════════════════════════════
"""

    # Resolution hint
    resolution_hint = ""
    if NANO_BANANA_LOADED and resolution in RESOLUTION_OPTIONS:
        res_config = RESOLUTION_OPTIONS[resolution]
        resolution_hint = f"\n\nOutput at {res_config['description']} quality."

    # Enhanced prompt for studio shots with product preservation
    enhanced_prompt = f"""{thinking_header}CRITICAL: Place this EXACT product on a clean studio background.
The product MUST remain 100% IDENTICAL - same colors, textures, materials, shape, and ALL details.
DO NOT modify, change, or alter the product in ANY way. Only change the BACKGROUND.

{prompt_to_use}

ABSOLUTE RULES FOR STUDIO SHOTS:
- Product colors MUST be EXACT (same RGB values)
- Product textures MUST be IDENTICAL
- Product shape and proportions MUST NOT change
- Any text/logos/graphics MUST be preserved exactly (spell out each character)
- ONLY the background changes to clean studio setting
- Product stays PERFECTLY IDENTICAL

⚠️ PLACEMENT RULES (CRITICAL - DO NOT IGNORE):
- The product MUST be physically resting ON a solid surface (floor/table)
- There MUST be visible CONTACT between product and surface
- Product should NOT appear floating in mid-air
- Show a realistic CONTACT SHADOW where product touches the surface
- The product should look GROUNDED and STABLE

🔄 ORIENTATION RULES:
- Keep the SAME view/angle of the product as in the input image
- If we see the BACK of an item, show the BACK in output
- If we see the FRONT of an item, show the FRONT in output
- DO NOT rotate or flip the product to show a different side{resolution_hint}"""

    # Build generation config with aspect ratio
    gen_config = {
        "responseModalities": ["IMAGE", "TEXT"]
    }
    if aspect_ratio and aspect_ratio != '1:1' and aspect_ratio in ASPECT_RATIOS:
        gen_config["aspectRatio"] = aspect_ratio

    payload = {
        "contents": [{
            "role": "user",
            "parts": [
                {"text": enhanced_prompt},
                {"inlineData": {"mimeType": "image/jpeg", "data": base64_clean}}
            ]
        }],
        "generationConfig": gen_config
    }

    try:
        print(f"   🎨 Calling Nano Banana Pro (ratio={aspect_ratio}, res={resolution}, thinking={use_thinking})...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)

        if response.status_code == 200:
            result = response.json()
            if "candidates" in result:
                for candidate in result["candidates"]:
                    if "content" in candidate and "parts" in candidate["content"]:
                        for part in candidate["content"]["parts"]:
                            if "inlineData" in part:
                                img_data = part["inlineData"]["data"]
                                img_mime = part["inlineData"].get("mimeType", "image/png")
                                print(f"   ✅ Nano Banana Pro success!")
                                return f"data:{img_mime};base64,{img_data}"

        print(f"   ⚠️ Nano Banana Pro: {response.status_code} - {response.text[:200]}")

    except Exception as e:
        print(f"   ❌ Nano Banana Pro error: {e}")

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
        print("\n📥 AI STUDIO REQUEST - Imagen 3")
        
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

            # Nano Banana Pro parameters
            resolution = data.get('resolution', '2K')  # 1K, 2K, 4K
            use_thinking = data.get('use_thinking', True)  # Enable thinking mode

            # Validate output_count
            output_count = max(1, min(4, int(output_count)))

            # Validate aspect ratio
            if aspect_ratio not in ASPECT_RATIOS:
                aspect_ratio = '1:1'

            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY

            print(f"📦 Category: {category}")
            print(f"🖼️ Image: {len(image_data)} chars")
            print(f"📊 Output count: {output_count}, Aspect ratio: {aspect_ratio}")
            print(f"🧠 Resolution: {resolution}, Thinking Mode: {use_thinking}")
            
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
                # Try Gemini 3 Pro Image FIRST (PRIMARY), then fall back to Gemini 2.0 Flash
                print(f"🎨 Generating {output_count} studio image(s) (Gemini 3 Pro Image PRIMARY)...")

                for i in range(output_count):
                    try:
                        print(f"   📸 Generating image {i+1}/{output_count}...")
                        img_result = None

                        # PRIMARY: Nano Banana Pro via REST API (best product preservation)
                        print(f"      🎨 Trying Nano Banana Pro (PRIMARY)...")
                        img_result = generate_with_gemini_3_pro(image_data, dynamic_prompt, aspect_ratio, resolution, use_thinking)

                        # FALLBACK: Gemini 2.0 Flash if Gemini 3 Pro fails
                        if not img_result:
                            print(f"      🔄 Gemini 3 Pro failed, falling back to Gemini 2.0 Flash...")
                            img_result = generate_studio_with_gemini(image_data, dynamic_prompt, aspect_ratio)

                        if img_result:
                            results_array.append(img_result)
                            if not result:
                                result = img_result  # First successful result
                            print(f"   ✅ Image {i+1} generated successfully")
                        else:
                            print(f"   ⚠️ Image {i+1} failed")
                    except Exception as e:
                        error_message = str(e)
                        print(f"   ⚠️ Image {i+1} error: {str(e)[:50]}")

                if results_array:
                    method_used = 'Nano Banana Pro'
                    print(f"✅ Studio Success! Generated {len(results_array)}/{output_count} images")
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

            # Calculate credits
            credits_used = 5 * len(results_array)  # Default
            if NANO_BANANA_LOADED:
                credits_used = calculate_credits(resolution, use_thinking, count=len(results_array))

            response = {
                'success': method_used in ['Nano Banana Pro', 'Gemini 3 Pro Image', 'Gemini Studio'],
                'generated_image': result,
                'generated_images': results_array,  # Array of all generated images
                'image_url': result,
                'background_url': FALLBACK_URLS.get(category, FALLBACK_URLS['Other']),
                'category': category,
                'method_used': method_used,
                'output_count': len(results_array),
                'resolution': resolution,
                'aspect_ratio': aspect_ratio,
                'thinking_mode': use_thinking,
                'credits_used': credits_used,
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


print("✅ AI Studio ready (Nano Banana Pro PRIMARY, Thinking Mode enabled)")
print(f"   Supported aspect ratios: {', '.join(ASPECT_RATIOS.keys())}")
print(f"   Resolutions: 1K, 2K, 4K")
