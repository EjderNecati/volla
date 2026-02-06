"""
Motion Mode - Veo 3.1 Video Generation with OAuth2 (REST API)
Uses Service Account + REST API for veo-3.1-fast-generate-001 / veo-3.1-generate-001
ONLY for Motion Mode - does not affect other features
"""

import os
import base64
import json
import traceback
import requests
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🎬 Motion Mode - Veo 3.1 (OAuth2 REST)")
print("=" * 60)

# Get Service Account credentials from environment
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")

# Parse credentials and setup OAuth2
oauth2_token = None
project_id = None

try:
    if GOOGLE_CREDENTIALS_JSON:
        from google.oauth2 import service_account
        import google.auth.transport.requests

        # Parse the JSON credentials
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        project_id = creds_dict.get("project_id", "")

        # Create credentials from service account info
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict,
            scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )

        # Refresh to get token
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


def build_edit_prompt(edit_instruction):
    """
    Build Veo prompt for video editing.
    Takes the original video context and adds edit instructions.
    """
    prompt = f"""Professional product video showcase with smooth cinematic camera movement.

CRITICAL REQUIREMENTS:
- The product must remain IDENTICAL throughout the entire video
- Preserve all textures, colors, logos, and details exactly as shown
- Maintain perfect product integrity - no morphing, distortion, or alterations
- Professional studio lighting with soft shadows
- Clean, elegant composition
- Smooth, cinematic camera motion
- High-end commercial quality suitable for e-commerce

EDIT INSTRUCTION (APPLY THIS CHANGE):
{edit_instruction}

The scene should stay exactly the same except for the requested edit above.
Maintain the same camera movement and timing as a professional product video.

STYLE: Premium product advertisement, luxury brand aesthetic, professional photography in motion."""

    return prompt


def build_motion_prompt(user_options, custom_directive=''):
    """
    Build Veo prompt from user selections.
    This acts as the 'translator' - converting simple UI choices into detailed cinematic prompts.
    """
    camera_movement = user_options.get('cameraMovement', 'static')
    speed = user_options.get('speed', 'normal')

    # Detailed movement descriptions for Veo
    movement_descriptions = {
        'static': 'stationary camera with subtle natural motion, keeping the product as the focal point',
        'pan_left': 'smooth cinematic horizontal pan from right to left, revealing the product details',
        'pan_right': 'smooth cinematic horizontal pan from left to right, showcasing the product',
        'tilt_up': 'gradual upward tilt movement, revealing the product from bottom to top',
        'tilt_down': 'gradual downward tilt movement, scanning the product from top to bottom',
        'zoom_in': 'slow cinematic zoom in, focusing on the product details and textures',
        'zoom_out': 'slow cinematic zoom out, revealing the product in its environment',
        'dolly_in': 'smooth dolly movement toward the product, creating depth and dimension',
        'dolly_out': 'smooth dolly movement away from the product, establishing context',
        'orbit_cw': 'elegant orbital movement clockwise around the product, 360-degree showcase',
        'orbit_ccw': 'elegant orbital movement counter-clockwise around the product, full rotation view',
        'crane_up': 'vertical crane shot moving upward, revealing the product from a rising perspective',
        'crane_down': 'vertical crane shot moving downward, descending view of the product'
    }

    # Speed modifiers
    speed_descriptions = {
        'slow': 'in smooth slow motion with cinematic pacing, emphasizing elegance',
        'normal': 'at natural fluid speed with professional timing',
        'fast': 'with dynamic energetic movement, creating excitement'
    }

    movement_text = movement_descriptions.get(camera_movement, 'smooth camera movement')
    speed_text = speed_descriptions.get(speed, 'at natural speed')

    prompt = f"""Professional product video showcase with {movement_text}, {speed_text}.

CRITICAL REQUIREMENTS:
- The product must remain IDENTICAL to the source image throughout the entire video
- Preserve all textures, colors, logos, and details exactly as shown
- Maintain perfect product integrity - no morphing, distortion, or alterations
- Professional studio lighting with soft shadows
- Clean, elegant composition
- Smooth, cinematic camera motion
- High-end commercial quality suitable for e-commerce

STYLE: Premium product advertisement, luxury brand aesthetic, professional photography in motion.

{f'ADDITIONAL DIRECTION: {custom_directive}' if custom_directive else ''}"""

    return prompt


def start_video_generation(image_data, prompt, model_id, aspect_ratio, duration, token, project_id):
    """Start long-running video generation operation with Veo 3.1"""

    # Clean base64
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

    # Veo 3.1 endpoint for long-running operations
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/{model_id}:predictLongRunning"

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

    print(f"   Starting video generation with {model_id}...")
    print(f"   Aspect ratio: {aspect_ratio}, Duration: {duration}s")

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)

        print(f"   Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            operation_name = result.get('name')

            if operation_name:
                print(f"   ✅ Operation started: {operation_name}")
                return {
                    'success': True,
                    'operation_name': operation_name,
                    'model_id': model_id,
                    'status': 'PENDING'
                }
            else:
                return {
                    'success': False,
                    'error': 'No operation name in response'
                }
        else:
            error_text = response.text[:500]
            print(f"   ⚠️ API Error: {response.status_code} - {error_text}")
            return {
                'success': False,
                'error': f"API Error: {response.status_code} - {error_text}"
            }

    except Exception as e:
        print(f"   ⚠️ Request error: {e}")
        return {
            'success': False,
            'error': str(e)
        }


def poll_operation(operation_name, model_id, token, project_id):
    """Poll for video generation operation completion"""

    # Veo fetchPredictOperation endpoint
    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{project_id}/locations/us-central1/publishers/google/models/{model_id}:fetchPredictOperation"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    payload = {
        "operationName": operation_name
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()

            if result.get('done'):
                # Video generation complete
                print("   ✅ Video generation complete!")

                # Extract video from response
                resp = result.get('response', {})
                videos = resp.get('videos', [])

                if videos:
                    video_data = videos[0]

                    # Check for GCS URI or base64 data
                    if video_data.get('gcsUri'):
                        return {
                            'success': True,
                            'status': 'COMPLETE',
                            'video_url': video_data['gcsUri'],
                            'mime_type': video_data.get('mimeType', 'video/mp4')
                        }
                    elif video_data.get('bytesBase64Encoded'):
                        # Return as data URL
                        mime = video_data.get('mimeType', 'video/mp4')
                        b64 = video_data['bytesBase64Encoded']
                        return {
                            'success': True,
                            'status': 'COMPLETE',
                            'video_url': f"data:{mime};base64,{b64}",
                            'mime_type': mime
                        }

                # Check for predictions format
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

                # No video found in response
                return {
                    'success': False,
                    'status': 'FAILED',
                    'error': 'No video in response'
                }
            else:
                # Still processing
                metadata = result.get('metadata', {})
                progress = metadata.get('progressPercent', 0)

                print(f"   ⏳ Processing... {progress}%")

                return {
                    'success': True,
                    'status': 'PROCESSING',
                    'progress': progress
                }
        else:
            error_text = response.text[:300]
            print(f"   ⚠️ Poll error: {response.status_code}")
            return {
                'success': False,
                'status': 'ERROR',
                'error': f"Poll Error: {response.status_code} - {error_text}"
            }

    except Exception as e:
        print(f"   ⚠️ Poll request error: {e}")
        return {
            'success': False,
            'status': 'ERROR',
            'error': str(e)
        }


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
            print("🎬 MOTION MODE - Veo 3.1 (OAuth2 REST)")
            print(f"   Action: {action}")
            print(f"   OAuth2: {'Available' if oauth2_token else 'Not available'}")
            print(f"{'='*60}")

            if action == 'start':
                # Start video generation
                image_data = data.get('image', '')
                camera_movement = data.get('cameraMovement', 'static')
                speed = data.get('speed', 'normal')
                duration = data.get('duration', 6)
                quality_mode = data.get('qualityMode', 'fast')
                aspect_ratio = data.get('aspectRatio', '16:9')
                custom_directive = data.get('customDirective', '')

                print(f"   Camera: {camera_movement}, Speed: {speed}")
                print(f"   Duration: {duration}s, Quality: {quality_mode}")
                print(f"   Aspect: {aspect_ratio}")

                if not image_data:
                    raise ValueError("No image provided")

                # Get fresh token
                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 authentication not available")

                # Build prompt using our translator
                user_options = {
                    'cameraMovement': camera_movement,
                    'speed': speed
                }
                prompt = build_motion_prompt(user_options, custom_directive)
                print(f"   Generated prompt: {prompt[:100]}...")

                # Select model based on quality mode
                if quality_mode == 'pro':
                    model_id = 'veo-3.1-generate-001'
                else:
                    model_id = 'veo-3.1-fast-generate-001'

                # Start the generation
                result = start_video_generation(
                    image_data, prompt, model_id, aspect_ratio, duration, token, project_id
                )

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'edit':
                # Edit video - generates new video with edit instructions
                image_data = data.get('image', '')
                edit_prompt = data.get('editPrompt', '')
                duration = data.get('duration', 6)
                quality_mode = data.get('qualityMode', 'fast')
                aspect_ratio = data.get('aspectRatio', '16:9')

                print(f"   Edit prompt: {edit_prompt[:50]}...")
                print(f"   Duration: {duration}s, Quality: {quality_mode}")
                print(f"   Aspect: {aspect_ratio}")

                if not image_data:
                    raise ValueError("No image provided")
                if not edit_prompt:
                    raise ValueError("No edit prompt provided")

                # Get fresh token
                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 authentication not available")

                # Build edit prompt
                prompt = build_edit_prompt(edit_prompt)
                print(f"   Generated edit prompt: {prompt[:100]}...")

                # Select model based on quality mode
                if quality_mode == 'pro':
                    model_id = 'veo-3.1-generate-001'
                else:
                    model_id = 'veo-3.1-fast-generate-001'

                # Start the generation with edit prompt
                result = start_video_generation(
                    image_data, prompt, model_id, aspect_ratio, duration, token, project_id
                )

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(result).encode())

            elif action == 'poll':
                # Poll for completion
                operation_name = data.get('operationName', '')
                model_id = data.get('modelId', 'veo-3.1-fast-generate-001')

                if not operation_name:
                    raise ValueError("No operation name provided")

                # Get fresh token
                token = get_fresh_token()
                if not token or not project_id:
                    raise ValueError("OAuth2 authentication not available")

                # Poll the operation
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


print("✅ Motion Mode - Veo 3.1 (OAuth2 REST) ready")
