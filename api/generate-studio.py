"""
AI Studio Mode - Vertex AI Imagen 3 Integration
Professional product photography with background swap

Uses Imagen 3's edit_image API with EDIT_MODE_BGSWAP for:
- 100% product preservation (color, text, components)
- Professional studio background
- Realistic shadows
"""

import os
import base64
import json
import traceback
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🚀 AI Studio - Imagen 3 Mode")
print("=" * 60)

# Environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
VERTEX_API_KEY = os.environ.get("VERTEX_API_KEY")

# Use whichever key is available
API_KEY = VERTEX_API_KEY or GOOGLE_API_KEY

# Try to import google-genai (new SDK for Imagen 3)
genai_client = None
try:
    from google import genai
    from google.genai import types
    if API_KEY:
        genai_client = genai.Client(api_key=API_KEY)
        print("✅ google-genai Client initialized")
    else:
        print("⚠️ No API key found")
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
# DYNAMIC PROMPT GENERATOR (Camera Angle Aware)
# ===============================================

def get_angle_aware_prompt(camera_angle, product_placement, is_hanging_product, product_type):
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
"""
    }
    
    # Get appropriate instructions
    angle_inst = angle_instructions.get(camera_angle, angle_instructions["FRONT"])
    placement_inst = placement_instructions.get(product_placement, placement_instructions["ON_SURFACE"])
    
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
    
    # Product preservation
    preservation = """
PRODUCT PRESERVATION (CRITICAL):
- Product must remain COMPLETELY UNCHANGED
- Same color (exact shade)
- Same design (all text, logos, prints preserved)
- Same texture and material appearance
- Same size and proportions
"""
    
    # Combine all parts
    full_prompt = base_prompt + angle_inst + placement_inst + hanging_override + anti_floating + preservation
    
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
            
            # Generate dynamic prompt based on detected angle
            dynamic_prompt = get_angle_aware_prompt(camera_angle, product_placement, is_hanging_product, product_type)
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


def generate_with_imagen3(image_data, api_key, custom_prompt=None):
    """Generate studio image using Imagen 3 edit_image with BGSWAP"""
    
    # Use custom prompt if provided, otherwise fall back to default
    prompt_to_use = custom_prompt or BGSWAP_PROMPT
    
    # Create client with the provided API key
    try:
        from google import genai
        from google.genai import types
        client = genai.Client(api_key=api_key)
    except Exception as e:
        print(f"   ⚠️ Failed to create genai client: {e}")
        return None
    
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
    
    image_bytes = base64.b64decode(base64_clean)
    
    # Try different Imagen 3 models
    models_to_try = [
        'imagen-3.0-capability-001',
        'imagen-3.0-generate-002',
    ]
    
    for model_name in models_to_try:
        try:
            print(f"   Trying {model_name}...")
            
            # Create reference image for edit
            reference_image = types.RawReferenceImage(
                reference_id=1,
                reference_image=types.Image(image_bytes=image_bytes)
            )
            
            # Edit with BGSWAP mode
            response = client.models.edit_image(
                model=model_name,
                prompt=prompt_to_use,
                reference_images=[reference_image],
                config=types.EditImageConfig(
                    edit_mode='EDIT_MODE_BGSWAP',
                    number_of_images=1
                )
            )
            
            # Extract generated image
            if response.generated_images:
                img_bytes = response.generated_images[0].image.image_bytes
                img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                print(f"   ✅ Success with {model_name}")
                return f"data:image/png;base64,{img_b64}"
                
        except Exception as e:
            print(f"   ⚠️ {model_name} failed: {str(e)[:80]}")
            continue
    
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
