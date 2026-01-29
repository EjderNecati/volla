"""
MULTI-ANGLE SHOT GENERATOR - Imagen 3 Integration
Advanced Multi-Angle Generator with Reference Image Consistency

Features:
- Imagen 3 with reference images for 95%+ consistency (OAuth2)
- Physics Classification (7 categories)
- Staging Logic Mapping per category
- Product preservation across all angles
"""

import os
import base64
import json
import time
import traceback
import requests
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🎬 MULTI-ANGLE GENERATOR - Imagen 3 Mode (OAuth2)")
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

# Fallback to old SDK for Gemini
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
# PHYSICS CLASSIFICATION PROMPT (Enhanced with Reasoning)
# ===============================================

PHYSICS_CLASSIFICATION_PROMPT = """You are an Expert Industrial Designer and Product Photographer.

THINK STEP-BY-STEP about this product before classifying:

═══════════════════════════════════════════════════════════════════════════════
STEP 1: IDENTIFY THE PRODUCT
═══════════════════════════════════════════════════════════════════════════════
- What EXACTLY is this product? Be very specific.
- What materials is it made of?
- Does it have ANY text, logos, labels, or printed designs?

═══════════════════════════════════════════════════════════════════════════════
STEP 2: WHERE DOES IT NATURALLY BELONG?
═══════════════════════════════════════════════════════════════════════════════
Think like a visual merchandiser:
- A baby gate belongs INSTALLED IN A DOORWAY - not floating!
- A dog house belongs IN A BACKYARD - not held by someone
- A door belongs IN A WALL FRAME
- A t-shirt belongs ON A PERSON or ON A HANGER
- A ring belongs ON A FINGER or IN A JEWELRY BOX
- An ornament belongs HANGING FROM A HOOK or STAND

═══════════════════════════════════════════════════════════════════════════════
STEP 3: TEXT/LOGO ANALYSIS (CRITICAL FOR MULTI-ANGLE)
═══════════════════════════════════════════════════════════════════════════════
If product has ANY text or logo:
- Document EXACT location (front, back, collar, chest, side, etc.)
- Document EXACT content (what does it say?)
- Identify which angles will SHOW the text and which will HIDE it
- Plan how to keep text VISIBLE in different angle shots

═══════════════════════════════════════════════════════════════════════════════
STEP 4: CLASSIFY PHYSICS CATEGORY
═══════════════════════════════════════════════════════════════════════════════
CATEGORIES:
- APPAREL_WORN: Clothing on a person/model
- APPAREL_FLAT: Folded clothing, flat lay
- APPAREL_GHOST: Ghost mannequin style
- WALL_MOUNTED: Wall-mounted items (signs, shelves, gates in doorways)
- SUSPENDED: Large hanging items (chandeliers, hanging plants)
- HANGING_ORNAMENT: Small hanging items with hooks/loops (ornaments, keychains, pendants)
- SMALL_IRREGULAR: Small items on surfaces (jewelry boxes, controllers, gadgets)
- STANDARD_GROUND: Standing items (bottles, furniture, boxes)

Respond ONLY with JSON:
{
    "reasoning": "I'm analyzing this [product]. It naturally belongs [where]. Text/logo is [location or none]. For multi-angle shots, I need to [consideration].",
    "category": "CATEGORY_NAME",
    "detected_object": "Specific product description",
    "natural_placement": "Where this product naturally belongs/how it's used",
    "has_human_model": true/false,
    "has_hanging_loop": true/false,
    "has_text": true/false,
    "text_details": {
        "has_visible_text": true/false,
        "text_content": "exact text or null",
        "text_location": "front/back/collar/chest/side/etc or null",
        "text_size": "large/medium/small/tiny or null",
        "areas_without_text": ["list of blank areas"]
    },
    "angle_recommendations": {
        "best_angles": ["angles that show product and text well"],
        "avoid_angles": ["angles that would hide or distort text"],
        "text_visibility_notes": "How to keep text visible across angles"
    }
}"""

# ===============================================
# STAGING LOGIC MAP
# ===============================================

STAGING_MAP = {
    "APPAREL_WORN": {
        "angles": ["front view of person wearing it", "three-quarter side view", "back view"],
        "staging": "Person wearing the clothing in professional studio, feet touching floor"
    },
    "APPAREL_FLAT": {
        "angles": ["top-down flat lay", "slightly angled overhead", "detail closeup"],
        "staging": "Flat lay on clean solid surface, fabric touching surface completely"
    },
    "APPAREL_GHOST": {
        "angles": ["front view ghost mannequin", "side view", "back view"],
        "staging": "Ghost mannequin 3D effect, bottom hem touching floor/surface"
    },
    "APPAREL_HANGER": {
        "angles": ["front view on hanger", "side view on hanger", "back view on hanger"],
        "staging": "Clothing hanging on minimal wooden or black velvet clothes hanger, hanger hook visible at top, natural drape with gravity"
    },
    "JEWELRY_STAND": {
        "angles": ["front view on display stand", "side view on bust", "three-quarter on jewelry form"],
        "staging": "Jewelry displayed on elegant black velvet or white jewelry bust/stand, draped naturally over display form"
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
        print("\n📥 MULTI-ANGLE REQUEST - Imagen 3")
        
        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            source_image = data.get('image', '') or data.get('source_image', '')
            product_desc = data.get('productDescription', 'Product item')
            request_vertex_key = data.get('vertex_api_key', '')
            # NEW: Source context from frontend (STUDIO or LIFE)
            source_context = data.get('source_context', 'STUDIO')
            
            # Use request key or fall back to env var
            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY
            
            print(f"🖼️ Image: {len(source_image)} chars")
            print(f"📦 Product: {product_desc[:50]}...")
            print(f"🎬 Source Context: {source_context}")
            print(f"🔑 Vertex Key: {'from request' if request_vertex_key else 'from env'}")
            
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
            
            # Step 1: Classify physics
            print("⚛️ Classifying product physics...")
            physics = classify_physics(image_bytes)
            category = physics.get('category', 'STANDARD_GROUND')
            has_hanging_loop = physics.get('has_hanging_loop', False)
            
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
            
            # Step 2: Generate shots with Imagen 3
            print("📷 Generating multi-angle shots...")
            
            for i, angle in enumerate(angles):
                shot_key = f'shot{i+1}'
                print(f"   📷 Generating {shot_key}: {angle}...")

                # Retry logic - try up to 3 times for each shot
                shot_image = None
                for attempt in range(3):
                    shot_image = generate_angle_shot(
                        image_bytes=image_bytes,
                        angle_description=angle,
                        staging=staging,
                        product_desc=product_desc,
                        api_key=active_vertex_key,
                        is_hanging_product=is_hanging_product,
                        source_context=source_context,
                        scene_info=scene_info,
                        physics_info=physics  # Pass physics info for text detection
                    )
                    
                    if shot_image:
                        results[shot_key] = shot_image
                        print(f"   ✅ {shot_key} complete (attempt {attempt+1})")
                        break
                    else:
                        if attempt < 2:
                            print(f"   🔄 {shot_key} failed, retrying (attempt {attempt+2}/3)...")
                            time.sleep(1)  # Wait 1 second between retries
                        else:
                            print(f"   ⚠️ {shot_key} failed after 3 attempts")
            
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


def classify_physics(image_bytes):
    """Classify product physics category"""
    try:
        if genai_old:
            model = genai_old.GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content([
                PHYSICS_CLASSIFICATION_PROMPT,
                {"mime_type": "image/jpeg", "data": image_bytes}
            ])
            
            if response.text:
                text = response.text.strip()
                if '{' in text and '}' in text:
                    start = text.index('{')
                    end = text.rindex('}') + 1
                    return json.loads(text[start:end])
    except Exception as e:
        print(f"   ⚠️ Classification failed: {e}")
    
    return {'category': 'STANDARD_GROUND', 'detected_object': 'Product'}


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


def analyze_scene(image_bytes):
    """Analyze the scene/environment of a Real Life image"""
    try:
        if genai_old:
            model = genai_old.GenerativeModel('gemini-2.0-flash-exp')
            response = model.generate_content([
                SCENE_ANALYSIS_PROMPT,
                {"mime_type": "image/jpeg", "data": image_bytes}
            ])
            
            if response.text:
                text = response.text.strip()
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


def generate_angle_shot(image_bytes, angle_description, staging, product_desc, api_key=None, is_hanging_product=False, source_context='STUDIO', scene_info=None, physics_info=None):
    """Generate a single angle shot using Imagen 3 with reference image - V2 Enhanced"""

    # Extract text info from physics analysis
    text_details = {}
    if physics_info:
        text_details = physics_info.get('text_details', {})
    has_text = text_details.get('has_visible_text', False)
    text_content = text_details.get('text_content', '')
    text_location = text_details.get('text_location', '')
    areas_without_text = text_details.get('areas_without_text', [])
    blank_areas = ", ".join(areas_without_text) if areas_without_text else ""

    # Build text preservation rules
    text_rules = ""
    if has_text and text_content:
        text_rules = f"""
═══════════════════════════════════════════════════════════════════════════════
⚠️ TEXT/LOGO PRESERVATION - ULTRA-CRITICAL
═══════════════════════════════════════════════════════════════════════════════
EXISTING TEXT ON PRODUCT:
- Location: {text_location}
- Content: "{text_content}"

MANDATORY RULES:
1. The text "{text_content}" MUST appear EXACTLY as written - same font, size, position
2. Text MUST be 100% SHARP and READABLE
3. DO NOT change text color, font, or spacing
4. DO NOT move text to a different location
5. If this angle would hide the text, position product to keep text partially visible

🚫 AREAS THAT MUST STAY BLANK:
{f"- These areas have NO text: {blank_areas}" if blank_areas else "- All other areas are text-free"}
- DO NOT add any text/logo to blank areas
- DO NOT hallucinate or duplicate any branding
"""
    elif physics_info and not has_text:
        text_rules = """
🚫 NO TEXT/LOGO ON THIS PRODUCT:
- Product has ZERO text, logos, or branding
- DO NOT add ANY text or branding
- Keep ALL surfaces PLAIN and CLEAN
"""

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
        # LIFE MODE: Preserve the Real Life scene environment
        scene_type = scene_info.get('scene_type', 'indoor')
        location = scene_info.get('location', 'lifestyle setting')
        lighting = scene_info.get('lighting', 'natural')
        atmosphere = scene_info.get('atmosphere', 'neutral')
        key_elements = scene_info.get('key_elements', 'environmental context')

        prompt = f"""LIFESTYLE SCENE PRODUCT PHOTOGRAPHY - {angle_description}
{text_rules}
🏞️ SCENE PRESERVATION MODE (CRITICAL):
You are showing the product from a different angle WITHIN THE SAME REAL-LIFE SCENE.
This is NOT a studio shot - preserve the EXACT environment!

REFERENCE IMAGE:
Use the provided reference image. Preserve BOTH:
1. The EXACT product (100% identical: color, design, texture, details)
2. The EXACT scene environment (location, lighting, atmosphere)

SCENE CONTEXT TO PRESERVE:
- Scene type: {scene_type}
- Location: {location}
- Lighting: {lighting}
- Atmosphere: {atmosphere}
- Key elements: {key_elements}

CAMERA ANGLE:
Show the product from: {angle_description}
Rotate camera around the product, but keep it in the SAME SCENE.
{hanging_instruction}

⚠️ CRITICAL RULES:
- Product must remain 100% IDENTICAL in appearance
- Scene/environment must remain the SAME as the reference
- Only change is the viewing angle of the product
- Lighting and color grading must match the original scene
- If there are people, props, or environmental elements, maintain consistent context
- NO studio background - this is a REAL LIFE scene

PRODUCT: {product_desc}

OUTPUT: The IDENTICAL product from {angle_description}, naturally placed in the SAME lifestyle scene."""
    
    else:
        # STUDIO MODE - Clean background with text preservation
        prompt = f"""Show this exact product from {angle_description} on clean beige studio background.
{text_rules}
CRITICAL: The product must remain EXACTLY the same:
- Same shape and structure
- Same components (all bars, doors, panels, hardware)
- Same colors
- Same proportions
- Same materials (transparent stays transparent)

Do NOT change the product. Do NOT redesign it. Do NOT simplify it.
Only change the viewing angle and background.

STAGING: {staging}
{hanging_instruction}

Product: {product_desc}"""

    # Try Imagen 3 with OAuth2 REST API
    token = get_fresh_token()
    if token and project_id:
        try:
            print(f"      🎨 Trying Imagen 3 via OAuth2...")
            
            # Encode image to base64
            image_b64 = base64.b64encode(image_bytes).decode('utf-8')
            
            # Imagen 3 edit endpoint (generate-002 - capability-001 is deprecated)
            url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }
            
            # The prompt must include [1] to reference the subject image
            prompt_with_ref = f"Product photography of [1] from the following angle: {prompt}"
            
            payload = {
                "instances": [{
                    "prompt": prompt_with_ref,
                    "subjectReferenceImages": [{
                        "subjectDescription": "[1]",
                        "subjectImage": {
                            "bytesBase64Encoded": image_b64
                        }
                    }]
                }],
                "parameters": {
                    "sampleCount": 1
                }
            }
            
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            
            if response.status_code == 200:
                result = response.json()
                predictions = result.get("predictions", [])
                if predictions and predictions[0].get("bytesBase64Encoded"):
                    img_b64 = predictions[0]["bytesBase64Encoded"]
                    print(f"      ✅ Imagen 3 angle shot success!")
                    return f"data:image/png;base64,{img_b64}"
            
            print(f"      ⚠️ Imagen 3 response: {response.status_code}")
                    
        except Exception as e:
            print(f"      ⚠️ Imagen 3 OAuth2 failed: {str(e)[:60]}")
    
    # Fallback to Gemini
    if genai_old:
        try:
            models = ['gemini-2.0-flash-exp', 'gemini-2.0-flash']
            
            for model_name in models:
                for attempt in range(2):
                    try:
                        model = genai_old.GenerativeModel(model_name)
                        
                        response = model.generate_content(
                            [prompt, {"mime_type": "image/jpeg", "data": image_bytes}],
                            generation_config={"response_modalities": ["IMAGE", "TEXT"]}
                        )
                        
                        if response.candidates:
                            for candidate in response.candidates:
                                if hasattr(candidate, 'content') and candidate.content.parts:
                                    for part in candidate.content.parts:
                                        if hasattr(part, 'inline_data') and part.inline_data:
                                            img_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                                            img_mime = part.inline_data.mime_type or 'image/png'
                                            return f"data:{img_mime};base64,{img_data}"
                    except:
                        if attempt == 0:
                            time.sleep(1)
                        continue
        except Exception as e:
            print(f"      ⚠️ Gemini fallback failed: {str(e)[:60]}")
    
    return None


print("✅ Multi-Angle Generator - Imagen 3 Mode (OAuth2) ready")
