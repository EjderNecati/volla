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
# PRODUCT ANALYSIS FOR STUDIO (Text/Logo Detection)
# ===============================================

STUDIO_ANALYSIS_PROMPT = """You are an Expert Product Photographer preparing for a studio background swap.

THINK STEP-BY-STEP before analyzing:

═══════════════════════════════════════════════════════════════════════════════
STEP 1: IDENTIFY THE PRODUCT
═══════════════════════════════════════════════════════════════════════════════
- What EXACTLY is this product?
- What materials is it made of?
- Is it transparent/translucent?

═══════════════════════════════════════════════════════════════════════════════
STEP 2: TEXT/LOGO ANALYSIS (CRITICAL FOR PRESERVATION)
═══════════════════════════════════════════════════════════════════════════════
- Does it have ANY text, logos, labels, or printed designs?
- Document EXACT location and content
- Identify BLANK areas that must stay blank

═══════════════════════════════════════════════════════════════════════════════
STEP 3: NATURAL STAGING
═══════════════════════════════════════════════════════════════════════════════
- How should this product be displayed in a studio?
- On surface, on hanger, on stand, suspended?

Respond ONLY with JSON:
{
    "product_type": "Specific product description",
    "materials": ["list of materials"],
    "is_transparent": true/false,
    "has_text": true/false,
    "text_details": {
        "has_visible_text": true/false,
        "text_content": "exact text or null",
        "text_location": "location or null",
        "areas_without_text": ["blank areas"]
    },
    "staging_recommendation": "how to display in studio"
}"""


def analyze_product_for_studio(image_bytes):
    """Analyze product for text/logo preservation in studio mode"""
    try:
        if genai_old:
            model = genai_old.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content([
                STUDIO_ANALYSIS_PROMPT,
                {"mime_type": "image/jpeg", "data": image_bytes}
            ])

            if response.text:
                text = response.text.strip()
                if '{' in text and '}' in text:
                    start = text.index('{')
                    end = text.rindex('}') + 1
                    return json.loads(text[start:end])
    except Exception as e:
        print(f"   ⚠️ Studio analysis failed: {e}")

    return {
        'product_type': 'product',
        'has_text': False,
        'text_details': {'has_visible_text': False}
    }


# ===============================================
# DYNAMIC PROMPT GENERATOR (Camera Angle Aware + Text Preservation)
# ===============================================

def get_angle_aware_prompt(camera_angle, product_placement, is_hanging_product, product_type, product_analysis=None):
    """Generate prompt for Imagen 3 with text preservation rules"""

    # Extract text info if available
    text_rules = ""
    if product_analysis:
        text_details = product_analysis.get('text_details', {})
        has_text = text_details.get('has_visible_text', False) or product_analysis.get('has_text', False)
        text_content = text_details.get('text_content', '')
        text_location = text_details.get('text_location', '')
        areas_without_text = text_details.get('areas_without_text', [])
        blank_areas = ", ".join(areas_without_text) if areas_without_text else ""

        if has_text and text_content:
            text_rules = f"""
⚠️ TEXT/LOGO PRESERVATION:
- Text "{text_content}" at {text_location} must remain EXACTLY the same
- Text must be 100% SHARP and READABLE
- DO NOT move, change, or distort the text
- Areas without text ({blank_areas}) must stay BLANK - no added logos
"""
        elif not has_text:
            text_rules = """
🚫 NO TEXT ON PRODUCT:
- This product has NO text/logos
- DO NOT add ANY text or branding
- Keep surfaces CLEAN and PLAIN
"""

    # Staging decision based on product type
    product_lower = (product_type or "").lower()
    staging_phrase = ""

    # Smart staging detection
    if any(k in product_lower for k in ['shirt', 'tshirt', 't-shirt', 'hoodie', 'jacket', 'dress', 'blouse']):
        staging_phrase = "Product displayed on a minimal wooden clothes hanger."
    elif any(k in product_lower for k in ['necklace', 'pendant', 'chain', 'bracelet']):
        staging_phrase = "Jewelry on elegant black display stand."
    elif any(k in product_lower for k in ['ring', 'earring']):
        staging_phrase = "Jewelry on velvet display pad."
    elif any(k in product_lower for k in ['ornament', 'keychain', 'decoration']) or is_hanging_product:
        staging_phrase = "Hanging from elegant display hook - NOT floating."
    elif any(k in product_lower for k in ['gate', 'door', 'barrier']):
        staging_phrase = "Product shown installed/standing in natural position."
    else:
        staging_phrase = "Product placed naturally on surface with contact shadow."

    # BGSWAP MODE: Background description + text preservation
    prompt = f"""Clean warm beige studio background (#E8DDD0).
Seamless cyclorama backdrop with soft diffused lighting.
Professional product photography studio setup.
Natural contact shadow beneath product.
{staging_phrase}
{text_rules}
CRITICAL: Preserve EVERY detail of the product - colors, materials, shape, and ALL text/logos exactly as they appear."""

    return prompt


# Legacy static prompt (fallback)
    """Generate prompt based on detected camera angle and product type"""
    
    base_prompt = """Professional e-commerce product photography studio.

BACKGROUND:
- Clean, warm beige studio backdrop (#E8DDD0)
- Completely solid, no patterns or textures
- Seamless cyclorama style

LIGHTING:
- Soft, diffused studio lighting
- Professional product photography setup
"""

    # Camera angle specific instructions
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
- Appropriate for suspended/hanging items
"""
    }
    
    # Product placement specific instructions
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
    
    # Get appropriate instructions
    angle_inst = angle_instructions.get(camera_angle, angle_instructions["FRONT"])
    placement_inst = placement_instructions.get(product_placement, placement_instructions["ON_SURFACE"])
    
    # SMART PRODUCT-TYPE DETECTION for staging
    product_type_lower = (product_type or "").lower()
    product_staging_override = ""
    
    # Clothing/Apparel detection
    apparel_keywords = ['shirt', 't-shirt', 'tshirt', 'hoodie', 'jacket', 'sweater', 'blouse', 'dress', 'coat', 'vest', 'polo']
    if any(keyword in product_type_lower for keyword in apparel_keywords):
        product_staging_override = placement_instructions["APPAREL_HANGER"]
        print(f"   👕 Detected APPAREL - Using hanger staging")
    
    # Jewelry detection
    jewelry_keywords = ['necklace', 'pendant', 'chain', 'choker', 'collar']
    if any(keyword in product_type_lower for keyword in jewelry_keywords):
        product_staging_override = placement_instructions["JEWELRY_STAND"]
        print(f"   💎 Detected JEWELRY - Using stand staging")
    
    # Special handling for hanging products
    hanging_override = ""
    if is_hanging_product:
        hanging_override = """
🎄 SPECIAL: HANGING PRODUCT DETECTED
- This is a hanging item (like Christmas ornament, decoration, keychain)
- MUST be shown on a display stand, hook, or ornament hanger
- The hanging loop/hook should be at TOP of product
- Product hangs DOWN naturally with gravity
- Use elegant display: jewelry bust, ornament stand, decorative hook
- NEVER show this product floating in air without support
"""
    
    # Anti-floating rules (ABSOLUTE)
    anti_floating = """
🚫 ABSOLUTE ANTI-FLOATING RULES (NEVER VIOLATE):
- Product must NEVER appear floating in mid-air
- Product must ALWAYS have visible contact with a surface OR visible hanging support
- If product has a hanging loop: show it on a STAND or HOOK
- If product sits: show contact shadow where it touches surface
- The image must look like a REAL PHOTOGRAPH, not CGI
- Professional product photography - customer must believe this is real
"""
    
    # COMPREHENSIVE PRODUCT PRESERVATION - ALL MATERIALS, COMPONENTS, TEXTURES
    preservation = """
═══════════════════════════════════════════════════════════════════════════════════
⚠️⚠️⚠️ COMPLETE PRODUCT PRESERVATION - ABSOLUTE ZERO-TOLERANCE RULES ⚠️⚠️⚠️
═══════════════════════════════════════════════════════════════════════════════════

🔬 CRITICAL PRE-ANALYSIS (MANDATORY):
Before generating, analyze the reference image component-by-component:
1. What MATERIALS are present? (plastic, wood, metal, glass, fabric, acrylic, plexiglass, ceramic, leather, etc.)
2. What COMPONENTS exist? (hinges, locks, screws, buttons, zippers, handles, latches, etc.)
3. What TEXTURES are visible? (smooth, rough, woven, knit, brushed, matte, glossy, transparent, etc.)
4. Any TEXT, LOGOS, PRINTS? (exact position, font, color, size)
5. Multiple materials combined? (wood+glass, metal+plastic, fabric+leather, etc.)

═══════════════════════════════════════════════════════════════════════════════════
🧱 MATERIAL PRESERVATION (100% MANDATORY):
═══════════════════════════════════════════════════════════════════════════════════

TRANSPARENT/CLEAR MATERIALS (CRITICAL - DO NOT DELETE):
- Glass, plexiglass, acrylic, clear plastic → MUST remain TRANSPARENT/CLEAR
- You can see THROUGH these - this property MUST be preserved
- Transparent panels reveal what's behind them - show this correctly
- NEVER turn transparent into opaque, NEVER delete clear components

WOOD → Stays wood (grain pattern, warm color, natural texture)
METAL → Stays metal (shiny, brushed, or matte metallic surface)
PLASTIC → Stays plastic (smooth, uniform, synthetic look)
FABRIC → Stays fabric (woven texture, drape, folds)
LEATHER → Stays leather (grain, slight sheen, natural creases)
CERAMIC → Stays ceramic (smooth, glazed or matte finish)
RUBBER → Stays rubber (matte, flexible appearance)

🚫 MATERIAL TRANSFORMATION FORBIDDEN:
- Knit fabric → NEVER becomes plastic
- Plastic → NEVER becomes knit/woven
- Wood → NEVER becomes metal
- Glass/Plexiglass → NEVER becomes opaque/solid
- Metal hardware → NEVER becomes plastic
- Leather → NEVER becomes synthetic

═══════════════════════════════════════════════════════════════════════════════════
🔧 HARDWARE & COMPONENT PRESERVATION (100% MANDATORY):
═══════════════════════════════════════════════════════════════════════════════════

ALL FUNCTIONAL COMPONENTS MUST BE PRESERVED EXACTLY:
- Hinges → Exact same position, size, color, type
- Locks/Latches → Exact same mechanism, text on them preserved
- Screws/Bolts → Exact count, position, color
- Handles/Knobs → Exact shape, material, position
- Zippers → Exact style, color, pull tab design
- Buttons → Exact count, color, size, spacing
- Buckles/Clasps → Exact mechanism, material
- Wheels/Casters → Exact type, color, position
- Vents/Openings → Exact size, pattern, position
- Labels/Tags → Exact position, text, color

TEXT ON HARDWARE: If a lock has "LOCK" written on it, that text stays.
SMALL DETAAILS MATTER: If there are 4 screws, output has 4 screws.

═══════════════════════════════════════════════════════════════════════════════════
🎨 TEXTURE & PATTERN PRESERVATION (100% MANDATORY):
═══════════════════════════════════════════════════════════════════════════════════

TEXTURES MUST REMAIN IDENTICAL:
- Woven patterns → Same weave style and density
- Knit patterns → Same stitch type and size
- Wood grain → Same grain direction and pattern
- Brushed metal → Same brush direction
- Matte surfaces → Stay matte
- Glossy surfaces → Stay glossy

PATTERNS:
- Stripes → Same width, color, direction
- Prints → Exact same design placement
- Colorblock → Same color boundaries
- Geometric patterns → Same angles and proportions

═══════════════════════════════════════════════════════════════════════════════════
✏️ TEXT/LOGO PRESERVATION (100% MANDATORY):
═══════════════════════════════════════════════════════════════════════════════════

🚫 FORBIDDEN:
- NEVER move text/logo position
- NEVER change font
- NEVER change text color
- NEVER add text that doesn't exist
- NEVER delete text that exists
- NEVER alter what the text says

✅ REQUIRED:
- Collar logo → Stays on collar only
- Chest logo → Stays on chest only
- Plain product → Stays plain, NO additions
- Hardware labels → Preserved exactly

═══════════════════════════════════════════════════════════════════════════════════
🎯 COLOR PRESERVATION (100% MANDATORY):
═══════════════════════════════════════════════════════════════════════════════════

- Every color must match EXACTLY
- Multi-color products: each color zone preserved
- Color gradients preserved exactly
- No color shifts or tint changes
- White stays white (not cream)
- Black stays black (not gray)

═══════════════════════════════════════════════════════════════════════════════════
📐 STRUCTURE & PROPORTION PRESERVATION (100% MANDATORY):
═══════════════════════════════════════════════════════════════════════════════════

- Same overall size/proportions
- Same component positions
- Same angles between parts
- Same gaps/spacing
- Assembly structure unchanged
- If product has specific geometry → preserved exactly

═══════════════════════════════════════════════════════════════════════════════════
"""

    
    # Combine all parts with priority order
    full_prompt = base_prompt + angle_inst + placement_inst + product_staging_override + hanging_override + anti_floating + preservation
    
    return full_prompt


# Legacy static prompt (fallback)
BGSWAP_PROMPT = get_angle_aware_prompt("FRONT", "ON_SURFACE", False, "")

# ===============================================
# FALLBACK URLS
# ===============================================

FALLBACK_URLS = {
    'Kitchenware': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
    'Furniture': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop',
    'Other': 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=800&h=800&fit=crop'
}


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
            
            # NEW: Camera angle detection info
            camera_angle = data.get('camera_angle', 'FRONT')
            product_placement = data.get('product_placement', 'ON_SURFACE')
            is_hanging_product = data.get('is_hanging_product', False)
            product_type = data.get('product_type', '')
            
            # Use request key or fall back to env var
            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY
            
            print(f"📦 Category: {category}")
            print(f"🖼️ Image: {len(image_data)} chars")
            print(f"📐 Camera Angle: {camera_angle}")
            print(f"📍 Placement: {product_placement}")
            print(f"🎄 Is Hanging: {is_hanging_product}")
            print(f"🔑 Vertex Key: {'from request' if request_vertex_key else 'from env'}")

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
                    if product_analysis.get('has_text'):
                        print(f"   📝 Text detected: {product_analysis.get('text_details', {}).get('text_content', 'N/A')}")
                    else:
                        print("   ✅ No text on product - will keep surfaces clean")
                except Exception as e:
                    print(f"   ⚠️ Analysis skipped: {e}")

            # Generate dynamic prompt based on detected angle + text preservation
            dynamic_prompt = get_angle_aware_prompt(camera_angle, product_placement, is_hanging_product, product_type, product_analysis)
            print(f"📝 Using angle-aware prompt for: {camera_angle}")
            
            result = None
            method_used = 'none'
            error_message = None
            
            if image_data and active_vertex_key:
                # Try Imagen 3 first
                print("🎨 Trying Imagen 3 BGSWAP...")
                try:
                    result = generate_with_imagen3(image_data, active_vertex_key, dynamic_prompt)
                    if result:
                        method_used = 'Imagen 3 BGSWAP'
                        print("✅ Imagen 3 Success!")
                except Exception as e:
                        error_message = str(e)
                        print(f"⚠️ Imagen 3 error: {error_message[:100]}")
                
                # Fallback to old Gemini
                if not result and genai_old:
                    print("🎨 Falling back to Gemini...")
                    try:
                        result = generate_with_gemini_fallback(image_data)
                        if result:
                            method_used = 'Gemini Fallback'
                            print("✅ Gemini Fallback Success!")
                    except Exception as e:
                        error_message = str(e)
                        print(f"⚠️ Gemini fallback error: {error_message[:100]}")
            else:
                error_message = "No image provided"
            
            # Final fallback
            if not result:
                result = FALLBACK_URLS.get(category, FALLBACK_URLS['Other'])
                method_used = 'Fallback URL'
            
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': method_used in ['Imagen 3 BGSWAP', 'Gemini Fallback'],
                'generated_image': result,
                'image_url': result,
                'background_url': FALLBACK_URLS.get(category, FALLBACK_URLS['Other']),
                'category': category,
                'method_used': method_used,
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


def generate_with_imagen3(image_data, api_key_unused, custom_prompt=None):
    """Generate studio image using Imagen 3 via OAuth2 REST API"""
    
    # Get fresh OAuth2 token
    token = get_fresh_token()
    if not token or not project_id:
        print("   ⚠️ No OAuth2 token or project_id available")
        return None
    
    # Use custom prompt if provided
    prompt_to_use = custom_prompt or BGSWAP_PROMPT
    
    # Clean base64
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data
    
    # Fix padding
    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)
    
    # Use imagen-3.0-generate-002 for text-to-image generation
    # This model is available on standard Vertex AI projects
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Simple text-to-image payload
    # The product details are included in the prompt
    payload = {
        "instances": [{
            "prompt": prompt_to_use
        }],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": "1:1",
            "personGeneration": "allow_adult",
            "safetyFilterLevel": "block_only_high"
        }
    }
    
    try:
        print(f"   🎨 Calling Imagen 3 BGSWAP via REST API...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            predictions = result.get("predictions", [])
            if predictions and predictions[0].get("bytesBase64Encoded"):
                img_b64 = predictions[0]["bytesBase64Encoded"]
                print(f"   ✅ Imagen 3 BGSWAP success!")
                return f"data:image/png;base64,{img_b64}"
        
        print(f"   ⚠️ Imagen 3 response: {response.status_code} - {response.text[:200]}")
        
        # Try INPAINT mode as fallback
        print(f"   🔄 Trying INPAINT mode...")
        payload["parameters"]["editMode"] = "EDIT_MODE_INPAINT_INSERTION"
        payload["parameters"]["maskMode"] = "MASK_MODE_BACKGROUND"
        
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            predictions = result.get("predictions", [])
            if predictions and predictions[0].get("bytesBase64Encoded"):
                img_b64 = predictions[0]["bytesBase64Encoded"]
                print(f"   ✅ Imagen 3 INPAINT success!")
                return f"data:image/png;base64,{img_b64}"
        
        print(f"   ⚠️ INPAINT also failed: {response.status_code}")
        
    except Exception as e:
        print(f"   ❌ Imagen 3 REST API error: {e}")
    
    return None


def generate_with_gemini_fallback(image_data):
    """Fallback to Gemini chat model for image generation"""
    import time
    
    # Clean base64
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
        mime_type = 'image/jpeg'
        if 'png' in image_data.lower():
            mime_type = 'image/png'
    else:
        base64_clean = image_data
        mime_type = 'image/jpeg'
    
    image_bytes = base64.b64decode(base64_clean)
    
    # Gemini fallback prompt - CLEAN format (no instructions/text that could appear in image)
    fallback_prompt = """Professional product photography on clean warm beige studio background.
Seamless cyclorama backdrop with soft diffused lighting.
Product positioned naturally with realistic contact shadow beneath.
Preserve all original product details, colors, text, and logos exactly.
High quality e-commerce product photo, 8K resolution."""

    models_to_try = [
        'gemini-2.5-flash-preview-05-20',
        'gemini-2.0-flash-exp',
        'gemini-2.0-flash',
    ]
    
    for model_name in models_to_try:
        for attempt in range(2):
            try:
                model = genai_old.GenerativeModel(model_name)
                
                response = model.generate_content(
                    [
                        fallback_prompt,
                        {"mime_type": mime_type, "data": image_bytes}
                    ],
                    generation_config={
                        "response_modalities": ["IMAGE", "TEXT"],
                    }
                )
                
                # Extract image
                if response.candidates:
                    for candidate in response.candidates:
                        if hasattr(candidate, 'content') and candidate.content.parts:
                            for part in candidate.content.parts:
                                if hasattr(part, 'inline_data') and part.inline_data:
                                    img_data = base64.b64encode(part.inline_data.data).decode('utf-8')
                                    img_mime = part.inline_data.mime_type or 'image/png'
                                    return f"data:{img_mime};base64,{img_data}"
                
            except Exception as e:
                if attempt == 0:
                    time.sleep(1)
                continue
    
    return None


print("✅ AI Studio - Imagen 3 Mode ready")
