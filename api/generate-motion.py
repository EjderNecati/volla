"""
Motion Studio v2.0 - WORLD-CLASS VIDEO GENERATION
==================================================
Two-stage AI pipeline for professional product videos:
1. Gemini 3 Pro "Director" - Analyzes product & creates shot plan
2. Veo 3.1 - Executes with precise cinematographic prompts

Professional cinematography techniques that look REAL, not AI-generated.
"""

import os
import io
import base64
import json
import traceback
import requests
from http.server import BaseHTTPRequestHandler
from PIL import Image

print("=" * 60)
print("🎬 Motion Studio v2.0 - WORLD-CLASS VIDEO")
print("=" * 60)

# ═══════════════════════════════════════════════════════════════════════════════
# CREDENTIALS SETUP
# ═══════════════════════════════════════════════════════════════════════════════

GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

oauth2_token = None
project_id = None
genai_client = None

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

        print(f"✅ OAuth2 ready: {project_id}")

    # Setup Gemini client for Director AI
    from google import genai
    if GOOGLE_API_KEY:
        genai_client = genai.Client(api_key=GOOGLE_API_KEY)
        print("✅ Gemini Director AI ready (API Key)")
    elif GOOGLE_CREDENTIALS_JSON:
        genai_client = genai.Client(
            vertexai=True,
            project=project_id,
            location="us-central1"
        )
        print("✅ Gemini Director AI ready (Vertex)")

except Exception as e:
    print(f"⚠️ Setup error: {e}")


def get_fresh_token():
    """Get fresh OAuth2 token"""
    global oauth2_token
    if not GOOGLE_CREDENTIALS_JSON:
        return None
    try:
        from google.oauth2 import service_account
        import google.auth.transport.requests
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token
        return oauth2_token
    except Exception as e:
        print(f"⚠️ Token refresh failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# PROFESSIONAL SHOT TYPES - Real Cinematography
# ═══════════════════════════════════════════════════════════════════════════════

SHOT_TYPES = {
    # === HERO SHOTS ===
    'hero_reveal': {
        'name': 'Hero Reveal',
        'category': 'hero',
        'description': 'Dramatic product reveal from shadow to light',
        'camera_instruction': '''
CAMERA: Start with product in soft shadow/silhouette.
Gradually increase lighting from one side (rim light sweep).
Very subtle push-in (2-3% zoom over duration).
Product must remain PERFECTLY STILL - only lighting changes.
NO camera shake, NO product rotation.
Final frame: product fully lit, hero composition.
STYLE: Apple product reveal, premium commercial.
'''
    },
    'hero_spotlight': {
        'name': 'Hero Spotlight',
        'category': 'hero',
        'description': 'Product with moving spotlight effect',
        'camera_instruction': '''
CAMERA: Completely static camera position.
Product DOES NOT MOVE at all.
Lighting effect: spotlight slowly moves across product surface.
Highlights different textures and details as light passes.
Clean studio background with subtle gradient.
STYLE: Luxury watch commercial, jewelry advertisement.
'''
    },

    # === DETAIL SHOTS ===
    'detail_explorer': {
        'name': 'Detail Explorer',
        'category': 'detail',
        'description': 'Quick zooms to different product details',
        'camera_instruction': '''
CAMERA: Series of quick push-ins with ease-out (slow at end).
Pattern: Wide shot → fast zoom to detail 1 → hold → fast zoom to detail 2 → hold → zoom out.
Each zoom should feel like a photographer rapidly focusing on interesting features.
Target details: buttons, textures, logos, edges, unique features.
STYLE: Tech review B-roll, product unboxing highlight reel.
'''
    },
    'macro_texture': {
        'name': 'Macro Texture',
        'category': 'detail',
        'description': 'Extreme close-up on surface texture',
        'camera_instruction': '''
CAMERA: Start extremely close on product surface texture.
Very slow pull-out revealing more of the product.
Focus on: material quality, fabric weave, metal finish, glass reflection.
Shallow depth of field - only texture in focus.
STYLE: Fashion editorial, luxury material showcase.
'''
    },

    # === MOVEMENT SHOTS ===
    'cinematic_orbit': {
        'name': 'Cinematic Orbit',
        'category': 'movement',
        'description': 'Professional 180° orbit around product',
        'camera_instruction': '''
CAMERA: Smooth 180-degree orbit around product.
Product stays PERFECTLY CENTERED and STATIC on turntable.
Camera moves, NOT the product.
Consistent speed throughout, no acceleration/deceleration.
Eye-level angle, professional studio lighting follows.
STYLE: E-commerce 360 view, product configurator.
'''
    },
    'dolly_showcase': {
        'name': 'Dolly Showcase',
        'category': 'movement',
        'description': 'Smooth dolly movement revealing product',
        'camera_instruction': '''
CAMERA: Smooth dolly-in starting from medium-wide to close-up.
Product remains completely stationary.
Camera glides forward on invisible track.
Professional parallax effect with background.
End on hero close-up composition.
STYLE: High-end commercial, automotive advertisement.
'''
    },

    # === CINEMATIC TECHNIQUES ===
    'rack_focus': {
        'name': 'Rack Focus',
        'category': 'cinematic',
        'description': 'Focus shift from foreground to product',
        'camera_instruction': '''
CAMERA: Static camera position throughout.
Start with foreground element in focus, product blurred.
Smooth rack focus transition - foreground blurs, product becomes sharp.
Hold on sharp product for 60% of duration.
Optional: reverse rack at end.
STYLE: Film cinematography, narrative product shot.
'''
    },
    'vertigo_zoom': {
        'name': 'Vertigo Effect',
        'category': 'cinematic',
        'description': 'Dolly zoom creating dramatic depth change',
        'camera_instruction': '''
CAMERA: Dolly-in while zooming out (or vice versa).
Product stays same size in frame while background perspective shifts dramatically.
Creates unsettling/dramatic visual effect.
Product must remain SHARP and UNDISTORTED throughout.
STYLE: Film technique, dramatic reveal, premium brand statement.
'''
    },

    # === PRODUCT-SAFE SHOTS ===
    'static_breathe': {
        'name': 'Static Breathe',
        'category': 'safe',
        'description': 'Subtle motion, product 100% static',
        'camera_instruction': '''
CAMERA: Product is COMPLETELY FROZEN - zero movement.
Very subtle camera "breathing" effect (1-2% scale oscillation).
Or: very subtle lighting pulse/shift.
This is for when product integrity is CRITICAL.
NO rotation, NO morphing, NO distortion allowed.
STYLE: Minimal, Japanese aesthetic, product purity.
'''
    },
    'environment_motion': {
        'name': 'Environment Motion',
        'category': 'safe',
        'description': 'Product static, only background moves',
        'camera_instruction': '''
CAMERA: Product is LOCKED in position - absolutely static.
Background/environment has subtle motion:
- Soft particles floating
- Light rays shifting
- Shadows moving slowly
- Bokeh lights in background shifting
Product untouched, environment alive.
STYLE: Lifestyle context, ambient product shot.
'''
    },

    # === DYNAMIC SHOTS ===
    'whip_pan_multi': {
        'name': 'Whip Pan Multi',
        'category': 'dynamic',
        'description': 'Fast transitions between angles',
        'camera_instruction': '''
CAMERA: Series of whip pans (fast horizontal swipes with motion blur).
Pattern: Angle 1 → whip → Angle 2 → whip → Angle 3.
Each angle holds for 1-2 seconds before whip transition.
Product can be shown from different perspectives.
High energy, modern editing feel.
STYLE: Social media ad, TikTok product video, hype content.
'''
    },
    'crash_zoom': {
        'name': 'Crash Zoom',
        'category': 'dynamic',
        'description': 'Dramatic fast zoom to product',
        'camera_instruction': '''
CAMERA: Start wide/medium shot.
Sudden fast zoom-in to product detail (crash zoom).
Hold on detail.
Optional: crash zoom out to reveal.
Creates dramatic emphasis and energy.
STYLE: Action trailer, product launch, hype reveal.
'''
    }
}

SHOT_CATEGORIES = {
    'hero': {'name': 'Hero Shots', 'description': 'Dramatic reveals and showcases'},
    'detail': {'name': 'Detail Shots', 'description': 'Close-ups and texture focus'},
    'movement': {'name': 'Movement', 'description': 'Orbit and dolly techniques'},
    'cinematic': {'name': 'Cinematic', 'description': 'Film techniques'},
    'safe': {'name': 'Product Safe', 'description': 'Zero product distortion'},
    'dynamic': {'name': 'Dynamic', 'description': 'High energy, fast cuts'}
}


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 1: GEMINI 3 PRO "DIRECTOR" - Shot Planning
# ═══════════════════════════════════════════════════════════════════════════════

def director_analyze_and_plan(image_data, shot_type, speed, duration, custom_directive):
    """
    Gemini 3 Pro analyzes the product and creates an optimized shot plan.
    This ensures the video prompt is tailored to the specific product.
    """
    if not genai_client:
        print("   ⚠️ Director AI not available, using standard prompt")
        return None

    shot_config = SHOT_TYPES.get(shot_type, SHOT_TYPES['hero_reveal'])

    # Decode image for analysis
    if 'base64,' in image_data:
        b64 = image_data.split('base64,')[1]
    else:
        b64 = image_data

    try:
        image_bytes = base64.b64decode(b64)
        product_image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print(f"   ⚠️ Image decode failed: {e}")
        return None

    analysis_prompt = f"""You are an expert video director specializing in product commercials.
Analyze this product image and create a precise shot plan.

PRODUCT IMAGE: [Attached]

SELECTED SHOT TYPE: {shot_config['name']}
BASE CAMERA INSTRUCTION:
{shot_config['camera_instruction']}

VIDEO SPECS:
- Duration: {duration} seconds
- Speed: {speed}
- Custom direction: {custom_directive or 'None'}

YOUR TASK:
1. Identify what type of product this is
2. Note key visual features that should be highlighted
3. Identify any areas to AVOID (logos that shouldn't be distorted, delicate details)
4. Create a PRECISE shot-by-shot breakdown

OUTPUT FORMAT:
Return a detailed prompt for the video AI that:
- Describes exact camera movements with timing
- Specifies which product features to focus on
- Includes STRICT instructions to preserve product integrity
- Uses professional cinematography terminology

CRITICAL RULES:
- Product must NEVER morph, distort, or change shape
- All textures, colors, logos must remain IDENTICAL
- Camera moves, product stays true to source image
- No AI-generated artifacts on the product itself

Write the final video generation prompt:"""

    print("   📍 Director AI analyzing product...")

    try:
        response = genai_client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=[analysis_prompt, product_image]
        )

        director_plan = response.text
        print(f"   ✅ Director plan created ({len(director_plan)} chars)")
        return director_plan

    except Exception as e:
        print(f"   ⚠️ Director analysis failed: {e}")
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# STAGE 2: BUILD VEO PROMPT
# ═══════════════════════════════════════════════════════════════════════════════

def build_motion_prompt(shot_type, speed, duration, custom_directive, director_plan=None):
    """
    Build the final Veo prompt, optionally enhanced by Director AI plan.
    """
    shot_config = SHOT_TYPES.get(shot_type, SHOT_TYPES['hero_reveal'])

    speed_modifiers = {
        'slow': 'in elegant slow motion, each movement deliberate and cinematic',
        'normal': 'at natural cinematic pace, professional timing',
        'fast': 'with dynamic energy, quick professional movements'
    }
    speed_text = speed_modifiers.get(speed, speed_modifiers['normal'])

    # Base prompt with shot type instructions
    base_prompt = f"""Professional product video, {speed_text}.

SHOT TYPE: {shot_config['name']}

{shot_config['camera_instruction']}

DURATION: {duration} seconds

ABSOLUTE REQUIREMENTS (NON-NEGOTIABLE):
1. The product must remain PIXEL-PERFECT identical to the source image
2. NO morphing, warping, or shape changes to the product
3. NO texture changes - materials must look exactly as photographed
4. NO color shifts on the product itself
5. All logos, text, and branding must remain crisp and unchanged
6. The product is SACRED - only camera/lighting can change

QUALITY STANDARDS:
- Professional studio lighting
- Clean composition
- Smooth motion with proper easing
- No jitter, no artifacts
- Broadcast/commercial quality output

{f'DIRECTOR NOTES: {director_plan[:1000]}' if director_plan else ''}

{f'ADDITIONAL DIRECTION: {custom_directive}' if custom_directive else ''}

OUTPUT: Premium product advertisement suitable for Apple-level brand campaigns."""

    return base_prompt


def build_edit_prompt(edit_instruction):
    """Build prompt for video editing/regeneration."""
    return f"""Professional product video with specific modifications.

EDIT INSTRUCTION:
{edit_instruction}

CRITICAL REQUIREMENTS:
- Product must remain IDENTICAL - no morphing or distortion
- Apply the edit while maintaining commercial quality
- Smooth, professional camera work
- Studio lighting quality

STYLE: Premium product advertisement, luxury brand aesthetic."""


# ═══════════════════════════════════════════════════════════════════════════════
# VEO 3.1 VIDEO GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def start_video_generation(image_data, prompt, model_id, aspect_ratio, duration, token, proj_id):
    """Start Veo 3.1 video generation."""

    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
        mime_type = 'image/png' if 'png' in image_data.lower() else 'image/jpeg'
    else:
        base64_clean = image_data
        mime_type = 'image/jpeg'

    base64_clean = base64_clean.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    missing_padding = len(base64_clean) % 4
    if missing_padding:
        base64_clean += '=' * (4 - missing_padding)

    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/us-central1/publishers/google/models/{model_id}:predictLongRunning"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "instances": [{
            "prompt": prompt,
            "image": {
                "bytesBase64Encoded": base64_clean,
                "mimeType": mime_type
            }
        }],
        "parameters": {
            "aspectRatio": aspect_ratio,
            "durationSeconds": int(duration),
            "sampleCount": 1
        }
    }

    print(f"   🎬 Starting Veo 3.1 generation...")
    print(f"   Model: {model_id}")
    print(f"   Aspect: {aspect_ratio}, Duration: {duration}s")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)

        if response.status_code == 200:
            result = response.json()
            operation_name = result.get('name')

            if operation_name:
                print(f"   ✅ Operation started: {operation_name[:50]}...")
                return {
                    'success': True,
                    'operation_name': operation_name,
                    'model_id': model_id,
                    'status': 'PENDING'
                }

        error_text = response.text[:500]
        print(f"   ⚠️ API Error: {response.status_code}")
        return {'success': False, 'error': f"API Error: {response.status_code} - {error_text}"}

    except Exception as e:
        print(f"   ⚠️ Request error: {e}")
        return {'success': False, 'error': str(e)}


def poll_operation(operation_name, model_id, token, proj_id):
    """Poll for video generation completion."""

    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/us-central1/publishers/google/models/{model_id}:fetchPredictOperation"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {"operationName": operation_name}

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()

            if result.get('done'):
                print("   ✅ Video generation complete!")

                resp = result.get('response', {})
                videos = resp.get('videos', [])

                if videos:
                    video_data = videos[0]
                    if video_data.get('gcsUri'):
                        return {
                            'success': True,
                            'status': 'COMPLETE',
                            'video_url': video_data['gcsUri'],
                            'mime_type': video_data.get('mimeType', 'video/mp4')
                        }
                    elif video_data.get('bytesBase64Encoded'):
                        mime = video_data.get('mimeType', 'video/mp4')
                        b64 = video_data['bytesBase64Encoded']
                        return {
                            'success': True,
                            'status': 'COMPLETE',
                            'video_url': f"data:{mime};base64,{b64}",
                            'mime_type': mime
                        }

                predictions = resp.get('predictions', [])
                if predictions:
                    pred = predictions[0]
                    if pred.get('videoUri'):
                        return {
                            'success': True,
                            'status': 'COMPLETE',
                            'video_url': pred['videoUri'],
                            'mime_type': 'video/mp4'
                        }
                    elif pred.get('bytesBase64Encoded'):
                        mime = pred.get('mimeType', 'video/mp4')
                        b64 = pred['bytesBase64Encoded']
                        return {
                            'success': True,
                            'status': 'COMPLETE',
                            'video_url': f"data:{mime};base64,{b64}",
                            'mime_type': mime
                        }

                return {'success': False, 'status': 'FAILED', 'error': 'No video in response'}
            else:
                metadata = result.get('metadata', {})
                progress = metadata.get('progressPercent', 0)
                print(f"   ⏳ Processing... {progress}%")
                return {'success': True, 'status': 'PROCESSING', 'progress': progress}
        else:
            return {'success': False, 'status': 'ERROR', 'error': f"Poll Error: {response.status_code}"}

    except Exception as e:
        return {'success': False, 'status': 'ERROR', 'error': str(e)}


# ═══════════════════════════════════════════════════════════════════════════════
# HTTP HANDLER
# ═══════════════════════════════════════════════════════════════════════════════

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            action = data.get('action', 'start')

            print(f"\n{'='*60}")
            print(f"🎬 MOTION STUDIO v2.0 - Action: {action}")
            print(f"{'='*60}")

            if action == 'get_shot_types':
                # Return available shot types for frontend
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'shot_types': {k: {'name': v['name'], 'category': v['category'], 'description': v['description']} for k, v in SHOT_TYPES.items()},
                    'categories': SHOT_CATEGORIES
                }).encode())
                return

            elif action == 'start':
                image_data = data.get('image', '')
                shot_type = data.get('shotType', data.get('cameraMovement', 'hero_reveal'))
                speed = data.get('speed', 'normal')
                duration = data.get('duration', 6)
                quality_mode = data.get('qualityMode', 'fast')
                aspect_ratio = data.get('aspectRatio', '16:9')
                custom_directive = data.get('customDirective', '')
                use_director = data.get('useDirector', True)

                print(f"   Shot: {shot_type}, Speed: {speed}")
                print(f"   Duration: {duration}s, Quality: {quality_mode}")
                print(f"   Director AI: {'Enabled' if use_director else 'Disabled'}")

                if not image_data:
                    raise ValueError("No image provided")

                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 authentication not available")

                # Stage 1: Director AI analysis (optional but recommended)
                director_plan = None
                if use_director and genai_client:
                    director_plan = director_analyze_and_plan(
                        image_data, shot_type, speed, duration, custom_directive
                    )

                # Stage 2: Build optimized prompt
                prompt = build_motion_prompt(
                    shot_type, speed, duration, custom_directive, director_plan
                )
                print(f"   Prompt: {prompt[:150]}...")

                # Select model
                model_id = 'veo-3.1-generate-001' if quality_mode == 'pro' else 'veo-3.1-fast-generate-001'

                # Start generation
                result = start_video_generation(
                    image_data, prompt, model_id, aspect_ratio, duration, token, project_id
                )

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'edit':
                image_data = data.get('image', '')
                edit_prompt_text = data.get('editPrompt', '')
                duration = data.get('duration', 6)
                quality_mode = data.get('qualityMode', 'fast')
                aspect_ratio = data.get('aspectRatio', '16:9')

                if not image_data or not edit_prompt_text:
                    raise ValueError("Missing image or edit prompt")

                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 authentication not available")

                prompt = build_edit_prompt(edit_prompt_text)
                model_id = 'veo-3.1-generate-001' if quality_mode == 'pro' else 'veo-3.1-fast-generate-001'

                result = start_video_generation(
                    image_data, prompt, model_id, aspect_ratio, duration, token, project_id
                )

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'poll':
                operation_name = data.get('operationName', '')
                model_id = data.get('modelId', 'veo-3.1-fast-generate-001')

                if not operation_name:
                    raise ValueError("No operation name provided")

                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 authentication not available")

                result = poll_operation(operation_name, model_id, token, project_id)

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            else:
                raise ValueError(f"Unknown action: {action}")

        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e),
                'status': 'ERROR'
            }).encode())


print("✅ Motion Studio v2.0 ready")
