"""
MULTI-ANGLE SHOT GENERATOR - Imagen 3 Integration
Advanced Multi-Angle Generator with Reference Image Consistency

Features:
- Imagen 3 with reference images for 95%+ consistency
- Physics Classification (7 categories)
- Staging Logic Mapping per category
- Product preservation across all angles
"""

import os
import base64
import json
import time
import traceback
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🎬 MULTI-ANGLE GENERATOR - Imagen 3 Mode")
print("=" * 60)

# Environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
VERTEX_API_KEY = os.environ.get("VERTEX_API_KEY")
API_KEY = VERTEX_API_KEY or GOOGLE_API_KEY

# Try to import google-genai (new SDK for Imagen 3)
genai_client = None
try:
    from google import genai
    from google.genai import types
    if API_KEY:
        genai_client = genai.Client(api_key=API_KEY)
        print("✅ google-genai Client initialized")
except ImportError as e:
    print(f"⚠️ google-genai not available: {e}")

# Fallback to old SDK
genai_old = None
try:
    import google.generativeai as genai_module
    genai_old = genai_module
    if GOOGLE_API_KEY:
        genai_old.configure(api_key=GOOGLE_API_KEY)
        print("✅ google-generativeai (fallback) configured")
except ImportError as e:
    print(f"⚠️ google-generativeai not available: {e}")

# ===============================================
# PHYSICS CLASSIFICATION PROMPT
# ===============================================

PHYSICS_CLASSIFICATION_PROMPT = """You are an Expert Industrial Designer.

Analyze this product image and classify its "Natural Stance" for photography.

CATEGORIES:
- APPAREL_WORN: Clothing on a person/model
- APPAREL_FLAT: Folded clothing, flat lay
- APPAREL_GHOST: Ghost mannequin style
- WALL_MOUNTED: Wall-mounted items (signs, shelves)
- SUSPENDED: Large hanging items (chandeliers, hanging plants)
- HANGING_ORNAMENT: Small hanging items with hooks/loops (Christmas ornaments, decorations, keychains, jewelry pendants, bag charms)
- SMALL_IRREGULAR: Small items that sit on surfaces (jewelry boxes, controllers, small gadgets)
- STANDARD_GROUND: Standing items (bottles, furniture, boxes)

IMPORTANT DETECTION RULES:
- If product has a hanging loop, hook, string, or ribbon at top = HANGING_ORNAMENT
- Christmas stockings, ornaments, decorations with loops = HANGING_ORNAMENT
- Keychains, bag charms, pendants = HANGING_ORNAMENT
- These products should be shown on display stands or hooks, NOT floating

Respond ONLY with JSON:
{
    "category": "CATEGORY_NAME",
    "detected_object": "Brief description",
    "has_human_model": true/false,
    "has_hanging_loop": true/false
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
            
            # Use request key or fall back to env var
            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY
            
            print(f"🖼️ Image: {len(source_image)} chars")
            print(f"📦 Product: {product_desc[:50]}...")
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
                
                shot_image = generate_angle_shot(
                    image_bytes=image_bytes,
                    angle_description=angle,
                    staging=staging,
                    product_desc=product_desc,
                    api_key=active_vertex_key,
                    is_hanging_product=is_hanging_product
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


def generate_angle_shot(image_bytes, angle_description, staging, product_desc, api_key=None, is_hanging_product=False):
    """Generate a single angle shot using Imagen 3 with reference image"""
    
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
    
    # Build the prompt
    prompt = f"""Professional product photography - {angle_description}

REFERENCE IMAGE:
Use the provided reference image as the EXACT product to show.
The product must remain 100% IDENTICAL:
- Same color (exact shade)
- Same design (all text, logos, prints preserved)
- Same texture and material appearance
- Same components (hardware, details)

CAMERA ANGLE:
Show the product from: {angle_description}
This is like rotating a camera around a frozen product.

STAGING:
{staging}
{hanging_instruction}

BACKGROUND:
Clean, warm beige studio backdrop (#E8DDD0)
Professional product photography lighting
Soft, realistic contact shadow

🚫 ABSOLUTE ANTI-FLOATING RULES (NEVER VIOLATE):
- Product must NEVER appear floating in mid-air
- Product must ALWAYS have visible contact with a surface OR visible hanging support
- If it's a hanging product: MUST show on a STAND, HOOK, or DISPLAY
- If it sits on surface: MUST show contact point and shadow
- The image MUST look like a REAL PHOTOGRAPH, not CGI
- NO FLOATING OBJECTS - this is CRITICAL for professional quality
- Customer must believe this is a real photo taken by a professional photographer

PRODUCT: {product_desc}

OUTPUT: The IDENTICAL product from the specified camera angle, properly grounded or displayed with professional studio styling."""

    # Try Imagen 3 first if we have an API key
    if api_key:
        try:
            from google import genai
            from google.genai import types
            
            client = genai.Client(api_key=api_key)
            
            reference_image = types.RawReferenceImage(
                reference_id=1,
                reference_image=types.Image(image_bytes=image_bytes)
            )
            
            # Try different models
            for model_name in ['imagen-3.0-capability-001', 'imagen-3.0-generate-002']:
                try:
                    response = client.models.edit_image(
                        model=model_name,
                        prompt=prompt,
                        reference_images=[reference_image],
                        config=types.EditImageConfig(
                            edit_mode='EDIT_MODE_DEFAULT',
                            number_of_images=1
                        )
                    )
                    
                    if response.generated_images:
                        img_bytes = response.generated_images[0].image.image_bytes
                        img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                        return f"data:image/png;base64,{img_b64}"
                        
                except Exception as e:
                    print(f"      ⚠️ {model_name}: {str(e)[:60]}")
                    continue
                    
        except Exception as e:
            print(f"      ⚠️ Imagen 3 failed: {str(e)[:60]}")
    
    # Fallback to Gemini
    if genai_old:
        try:
            models = ['gemini-2.5-flash-preview-05-20', 'gemini-2.0-flash-exp', 'gemini-2.0-flash']
            
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


print("✅ Multi-Angle Generator - Imagen 3 Mode ready")
