# Real Life Photos Generator - Hyper-Realistic Lifestyle Photography
# Generates AI product photos in real-world usage contexts

import os
import json
import base64
import requests
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
    "product_type": "Specific product name (e.g., 'gold ring with diamond', 'wooden door', 'ceramic mug')",
    "product_category": "Category (jewelry, furniture, kitchenware, clothing, electronics, decor, accessory, etc.)",
    "material": "Primary materials (gold, wood, ceramic, fabric, plastic, metal, etc.)",
    "colors": ["list of main colors"],
    "key_details_to_preserve": ["list of critical details that must not change - text, logos, patterns, engravings, etc."],
    
    "usage_type": "How is this product used? (worn, held, placed, mounted, hung, etc.)",
    "typical_users": ["who typically uses this - women, men, children, professionals, homeowners, etc."],
    "body_part_if_worn": "If worn/held, which body part? (finger, wrist, neck, hand, arm, foot, etc.) or null",
    
    "lifestyle_contexts": [
        {
            "scene": "Detailed description of realistic lifestyle scene 1",
            "environment": "Indoor/outdoor, specific location type",
            "lighting": "Natural/artificial, time of day",
            "human_element": "How human interacts with product (holding, wearing, using)"
        },
        {
            "scene": "Detailed description of realistic lifestyle scene 2 - DIFFERENT from scene 1",
            "environment": "Different location type",
            "lighting": "Different lighting condition",
            "human_element": "Different interaction"
        },
        {
            "scene": "Detailed description of realistic lifestyle scene 3 - DIFFERENT from scenes 1 and 2",
            "environment": "Another different location",
            "lighting": "Another lighting condition",
            "human_element": "Another interaction type"
        }
    ],
    
    "photography_style": "Best photo style for this product (macro, portrait, environmental, flat lay, etc.)",
    "risk_areas": ["areas where AI might make mistakes - hands, text, reflections, etc."]
}

IMPORTANT RULES FOR CONTEXT GENERATION:
1. Each scene must be COMPLETELY DIFFERENT from others
2. Scenes must be realistic and photographable in real life
3. Consider the product's actual use case - don't put a door on someone's hand!
4. If product is worn: vary the person, pose, and environment
5. If product is placed: vary the room, style, and surrounding objects
6. Think like a professional product photographer planning a lifestyle shoot
7. Scenes should feel authentic, not staged or AI-typical"""

# ===============================================
# HYPER-REALISM PROMPT BUILDER
# ===============================================

def build_reallife_prompt(product_analysis, context_index):
    """Build a hyper-realistic prompt for lifestyle photography with STRICT rules"""
    
    contexts = product_analysis.get('lifestyle_contexts', [])
    if context_index >= len(contexts):
        return None
        
    context = contexts[context_index]
    product_type = product_analysis.get('product_type', 'product')
    key_details = product_analysis.get('key_details_to_preserve', [])
    usage_type = product_analysis.get('usage_type', 'placed')
    body_part = product_analysis.get('body_part_if_worn')
    risk_areas = product_analysis.get('risk_areas', [])
    
    # Build preservation rules
    preservation_rules = "\n".join([f"- {detail}" for detail in key_details]) if key_details else "- All visible details, colors, and patterns"
    
    # Build risk warnings
    risk_warnings = "\n".join([f"- CHECK: {risk}" for risk in risk_areas]) if risk_areas else ""
    
    # Human element specifics
    human_instructions = ""
    if body_part:
        human_instructions = f"""
HUMAN ELEMENT - CRITICAL:
- Product is {usage_type} on {body_part}
- Photorealistic human skin with natural texture (pores, subtle lines)
- CORRECT NUMBER OF FINGERS - count them: 5 per hand!
- Natural, relaxed pose - not stiff or artificial
- Appropriate skin tone with realistic lighting
- If hands visible: natural nail appearance, realistic proportions
- No extra limbs, no merged fingers, no distorted anatomy
"""
    
    prompt = f"""HYPER-REALISTIC LIFESTYLE PRODUCT PHOTOGRAPHY

═══════════════════════════════════════════════════════════
REFERENCE PRODUCT - PIXEL-PERFECT PRESERVATION REQUIRED
═══════════════════════════════════════════════════════════

Use the provided reference image as THE EXACT product to show.
This is the MOST CRITICAL requirement - the product must be IDENTICAL:

MUST PRESERVE:
{preservation_rules}

The product ({product_type}) must look EXACTLY the same as in the reference:
- Same colors (exact RGB values, not approximations)
- Same textures and materials
- Same shape and proportions
- Same details, text, logos, patterns
- Same shine/matte finish
- NO modifications, NO artistic interpretation

═══════════════════════════════════════════════════════════
SCENE DESCRIPTION
═══════════════════════════════════════════════════════════

{context.get('scene', 'Professional lifestyle setting')}

Environment: {context.get('environment', 'Indoor')}
Lighting: {context.get('lighting', 'Natural soft light')}
Human Interaction: {context.get('human_element', 'Product in use')}

═══════════════════════════════════════════════════════════
PHOTOGRAPHY SPECIFICATIONS
═══════════════════════════════════════════════════════════

CAMERA SETTINGS (simulate these):
- Camera: Canon EOS R5 or Sony A7R IV
- Lens: 85mm f/1.4 for portraits, 35mm f/2 for environmental
- Natural shallow depth of field
- Sharp focus on product, gentle background blur

LIGHTING:
- Natural ambient light preferred
- Window light or golden hour outdoor
- Soft shadows, no harsh contrast
- Realistic light falloff

STYLE:
- Editorial/magazine quality
- Authentic, not over-processed
- No HDR look, no excessive saturation
- Colors true to life
{human_instructions}

═══════════════════════════════════════════════════════════
ENVIRONMENT REQUIREMENTS
═══════════════════════════════════════════════════════════

- Real, lived-in environment (not sterile/AI-typical)
- Authentic interior design with realistic details
- Proper perspective and depth
- Consistent shadow direction with lighting
- Background elements should be real objects, not generic shapes
- Subtle imperfections that real environments have

═══════════════════════════════════════════════════════════
🚫 ABSOLUTELY FORBIDDEN - WILL CAUSE REJECTION
═══════════════════════════════════════════════════════════

- Extra fingers, missing fingers, merged fingers
- Distorted hands or limbs
- Text/logo distortion or blur on product
- Product color shift or modification
- Floating product without support
- Uncanny valley faces or skin
- AI-typical smooth textures
- Unrealistic reflections
- Inconsistent lighting direction
- Generic/sterile environments

{f"SPECIAL RISK AREAS TO CHECK:{chr(10)}{risk_warnings}" if risk_warnings else ""}

═══════════════════════════════════════════════════════════
OUTPUT GOAL
═══════════════════════════════════════════════════════════

Create a photograph SO REALISTIC that:
1. Viewers cannot tell it was AI-generated
2. It could be published in a lifestyle magazine
3. The product looks like it was actually photographed in this scene
4. A customer would believe this is a real product photo"""

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
        print("\n📸 REAL LIFE PHOTOS REQUEST")
        
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
            
            # Use request key or fall back to env
            active_vertex_key = request_vertex_key or VERTEX_API_KEY or GOOGLE_API_KEY
            
            print(f"🖼️ Image: {len(source_image)} chars")
            print(f"🔑 Key: {'from request' if request_vertex_key else 'from env'}")
            
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
            
            # Step 1: Deep Product Analysis
            print("🔍 Step 1: Deep Product Analysis...")
            product_analysis = analyze_product_for_lifestyle(image_bytes, product_info)
            results['analysis'] = product_analysis
            print(f"   📦 Product: {product_analysis.get('product_type', 'unknown')}")
            print(f"   🎯 Contexts: {len(product_analysis.get('lifestyle_contexts', []))}")
            
            # Step 2: Generate 3 Real Life Shots
            print("📷 Step 2: Generating Real Life Shots...")
            
            contexts = product_analysis.get('lifestyle_contexts', [])
            
            for i in range(min(3, len(contexts))):
                shot_key = f'shot{i+1}'
                print(f"   📷 Generating {shot_key}: {contexts[i].get('scene', 'Scene')[:50]}...")
                
                # Build hyper-realistic prompt
                prompt = build_reallife_prompt(product_analysis, i)
                
                if not prompt:
                    print(f"   ⚠️ {shot_key}: Failed to build prompt")
                    continue
                
                print(f"   📝 Prompt length: {len(prompt)} chars")
                
                # Generate with Imagen 3
                shot_image = generate_reallife_shot(
                    image_bytes=image_bytes,
                    prompt=prompt,
                    api_key=active_vertex_key
                )
                
                if shot_image:
                    results[shot_key] = shot_image
                    print(f"   ✅ {shot_key} complete")
                else:
                    print(f"   ⚠️ {shot_key} failed - no image returned")
            
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


def analyze_product_for_lifestyle(image_bytes, existing_info=None):
    """Deep product analysis for lifestyle context generation"""
    
    # Try to use Gemini for analysis
    if genai_old:
        try:
            model = genai_old.GenerativeModel('gemini-2.0-flash')
            
            response = model.generate_content([
                PRODUCT_ANALYSIS_PROMPT,
                {"mime_type": "image/jpeg", "data": base64.b64encode(image_bytes).decode()}
            ])
            
            text = response.text
            if '{' in text and '}' in text:
                start = text.index('{')
                end = text.rindex('}') + 1
                return json.loads(text[start:end])
                
        except Exception as e:
            print(f"   ⚠️ Analysis error: {e}")
    
    # Fallback: use existing info or defaults
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
            {'scene': 'Modern home interior setting', 'environment': 'Indoor living room', 'lighting': 'Natural daylight', 'human_element': 'Product in natural use'},
            {'scene': 'Cozy lifestyle environment', 'environment': 'Indoor bedroom or study', 'lighting': 'Warm ambient light', 'human_element': 'Product displayed naturally'},
            {'scene': 'Contemporary setting', 'environment': 'Modern space', 'lighting': 'Soft natural light', 'human_element': 'Product in context'}
        ],
        'photography_style': 'lifestyle',
        'risk_areas': ['product preservation', 'realistic environment']
    }


def generate_reallife_shot(image_bytes, prompt, api_key=None):
    """Generate a single real life shot using Imagen 3 via OAuth2 REST API"""
    
    # Get fresh OAuth2 token
    token = get_fresh_token()
    if not token or not project_id:
        print("   ⚠️ No OAuth2 token or project_id available")
        # Fall back to Gemini
        return _gemini_fallback(image_bytes, prompt)
    
    print(f"   🎨 Using OAuth2 for project: {project_id[:20]}...")
    
    # Encode image to base64
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    # Imagen 3 edit endpoint - using capability model for image editing
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/imagen-3.0-capability-001:predict"
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    # Request body with subjectReferenceImages format for subject reference
    # The prompt must include [1] to reference the subject image
    prompt_with_ref = f"Generate a photo of the product [1] in the following scene: {prompt}"
    
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
    
    try:
        print(f"   🌟 Calling Imagen 3 Real Life via REST API...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)
        
        if response.status_code == 200:
            result = response.json()
            predictions = result.get("predictions", [])
            if predictions and predictions[0].get("bytesBase64Encoded"):
                img_b64 = predictions[0]["bytesBase64Encoded"]
                print(f"   ✅ Imagen 3 Real Life success!")
                return f"data:image/png;base64,{img_b64}"
        
        print(f"   ⚠️ Imagen 3 response: {response.status_code} - {response.text[:200]}")
        
    except Exception as e:
        print(f"   ❌ Imagen 3 REST API error: {e}")
    
    # Fallback to Gemini
    return _gemini_fallback(image_bytes, prompt)


def _gemini_fallback(image_bytes, prompt):
    """Fallback to Gemini for image generation"""
    if not genai_old:
        return None
    
    try:
        print("      Trying Gemini fallback...")
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
                                        print(f"      ✅ Got image from Gemini {model_name}")
                                        return f"data:{img_mime};base64,{img_data}"
                except:
                    if attempt == 0:
                        import time
                        time.sleep(1)
                    continue
    except Exception as e:
        print(f"      ⚠️ Gemini fallback failed: {str(e)[:60]}")
    
    return None
