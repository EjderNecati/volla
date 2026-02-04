"""
Creative Studio Mode - Promotional Image Generation with Themes
Uses Gemini 2.0 Flash Exp for theme-based product marketing images
Supports: Black Friday, Valentine's Day, Christmas, and more themes
"""

import os
import base64
import json
import traceback
import requests
from http.server import BaseHTTPRequestHandler

print("=" * 60)
print("🎨 Creative Studio Mode - Promotional Image Generation")
print("=" * 60)

# Get Service Account credentials from environment
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("VERTEX_API_KEY") or os.environ.get("GOOGLE_API_KEY")

# Parse credentials and setup OAuth2
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

_last_errors = []

# Theme configurations with detailed prompts
THEME_CONFIGS = {
    'black_friday': {
        'name': 'Black Friday',
        'background': 'dark dramatic black background with subtle gold sparkles',
        'text_style': 'bold white and gold "BLACK FRIDAY" text with glowing effect',
        'mood': 'urgent, exciting, premium sale atmosphere',
        'colors': 'black, gold, white accents'
    },
    'valentines': {
        'name': "Valentine's Day",
        'background': 'romantic soft pink and red gradient with floating hearts',
        'text_style': 'elegant script font in deep red or rose gold',
        'mood': 'romantic, warm, loving, gift-giving atmosphere',
        'colors': 'pink, red, rose gold, white'
    },
    'christmas': {
        'name': 'Christmas',
        'background': 'festive red and green with snow, Christmas lights, pine branches',
        'text_style': 'classic Christmas font with snow effect',
        'mood': 'magical, warm, festive, holiday celebration',
        'colors': 'red, green, gold, white, silver'
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'background': 'bright sunny beach vibes with palm trees, blue sky',
        'text_style': 'fun bold letters in tropical colors',
        'mood': 'vibrant, energetic, refreshing, vacation feel',
        'colors': 'yellow, orange, turquoise, coral'
    },
    'new_year': {
        'name': 'New Year',
        'background': 'midnight blue with gold fireworks and confetti',
        'text_style': 'glamorous gold metallic text',
        'mood': 'celebratory, elegant, new beginnings',
        'colors': 'navy blue, gold, silver, white'
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'background': 'dynamic red/orange gradient with lightning bolts',
        'text_style': 'bold impact font with electric glow effect',
        'mood': 'urgent, fast, exciting, limited time',
        'colors': 'red, orange, yellow, electric blue'
    },
    'mothers_day': {
        'name': "Mother's Day",
        'background': 'soft floral arrangement with pastel colors',
        'text_style': 'elegant flowing script in soft pink or lavender',
        'mood': 'warm, loving, appreciation, gentle',
        'colors': 'soft pink, lavender, peach, cream'
    },
    'easter': {
        'name': 'Easter',
        'background': 'spring meadow with Easter eggs and flowers',
        'text_style': 'playful spring colors with subtle pattern',
        'mood': 'fresh, spring, joyful, renewal',
        'colors': 'pastel yellow, pink, green, lavender'
    },
    'halloween': {
        'name': 'Halloween',
        'background': 'spooky purple/orange with bats and pumpkins',
        'text_style': 'creepy dripping font in orange or green',
        'mood': 'fun spooky, mysterious, playful scary',
        'colors': 'orange, purple, black, green'
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'background': 'digital matrix style with neon blue circuits',
        'text_style': 'futuristic tech font with neon glow',
        'mood': 'digital, tech-savvy, modern, online deals',
        'colors': 'neon blue, cyan, black, white'
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'background': 'fresh blooming flowers with soft sunlight',
        'text_style': 'fresh green and floral themed text',
        'mood': 'fresh, renewal, bright, blooming',
        'colors': 'green, pink, yellow, white'
    },
    'back_to_school': {
        'name': 'Back to School',
        'background': 'chalkboard or notebook paper with school supplies',
        'text_style': 'chalk or pencil style handwriting',
        'mood': 'academic, fresh start, organized, youthful',
        'colors': 'navy, red, yellow, green, white'
    }
}


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


def build_creative_prompt(mode, theme, discount, custom_note, manual_prompt):
    """Build promotional image generation prompt"""

    preservation_rules = """
═══════════════════════════════════════════════════════════════════════════════
⚠️ ABSOLUTE PRODUCT PRESERVATION - ZERO TOLERANCE FOR ANY CHANGES ⚠️
═══════════════════════════════════════════════════════════════════════════════

THE PRODUCT IN THIS IMAGE IS SACRED AND UNTOUCHABLE:

1. TEXT PRESERVATION (CRITICAL):
   - Every letter, number, symbol MUST be PIXEL-PERFECT identical
   - Font style, size, weight, color MUST NOT change
   - If text says "ABC123" it MUST remain "ABC123" exactly

2. LOGO & BRANDING:
   - Logos MUST be copied exactly as they appear
   - Logo colors MUST NOT shift

3. TEXTURE & MATERIAL:
   - Every detail, pattern MUST be preserved
   - Surface textures MUST NOT change

4. COLOR:
   - Exact product colors MUST be maintained
   - No color correction on the product

5. SHAPE & GEOMETRY:
   - Dimensions, proportions MUST be exactly the same
   - No stretching, warping on product

═══════════════════════════════════════════════════════════════════════════════
"""

    # Manual mode - user provides full prompt
    if mode == 'manual':
        return f"""{preservation_rules}

═══════════════════════════════════════════════════════════════════════════════
🎨 CREATIVE STUDIO - CUSTOM PROMOTIONAL IMAGE
═══════════════════════════════════════════════════════════════════════════════

USER'S CREATIVE REQUEST: {manual_prompt}

INSTRUCTIONS:
1. PRESERVE THE PRODUCT EXACTLY - pixel-perfect identical to source
2. Create promotional/marketing image based on user's description
3. Make it look professional, ready for social media advertisement
4. High quality, e-commerce ready, eye-catching design

OUTPUT: Professional promotional product photograph"""

    # Auto mode - theme-based generation
    theme_config = THEME_CONFIGS.get(theme, THEME_CONFIGS['black_friday'])

    # Build discount text
    discount_text = ''
    if discount:
        discount_text = f"""
DISCOUNT BADGE:
- Display "{discount}% OFF" prominently in the image
- Use bold, readable text with high contrast
- Position the badge where it's clearly visible but doesn't cover the product
- Make it look like a professional sale badge/sticker"""
    elif custom_note:
        discount_text = f"""
CUSTOM TEXT/BADGE:
- Display "{custom_note}" prominently in the image
- Use bold, readable text with high contrast
- Position where clearly visible but doesn't cover the product"""

    return f"""{preservation_rules}

═══════════════════════════════════════════════════════════════════════════════
🎨 CREATIVE STUDIO - {theme_config['name'].upper()} PROMOTIONAL IMAGE
═══════════════════════════════════════════════════════════════════════════════

THEME: {theme_config['name']}

BACKGROUND DESIGN:
{theme_config['background']}

COLOR PALETTE:
{theme_config['colors']}

MOOD & ATMOSPHERE:
{theme_config['mood']}

TEXT STYLING (for any promotional text):
{theme_config['text_style']}
{discount_text}

INSTRUCTIONS:
1. PRESERVE THE PRODUCT EXACTLY - pixel-perfect identical to source
2. Create a {theme_config['name']} themed promotional background
3. The product should be the hero - centered and prominent
4. Add appropriate {theme_config['name']} decorative elements around the product
5. Make it look like a professional e-commerce promotional image
6. Ready for Instagram, TikTok, or other social media advertisement

OUTPUT: Professional {theme_config['name']} promotional product photograph
The result should look like a high-budget marketing campaign image."""


def generate_with_gemini(image_data, prompt):
    """Generate image using Gemini 2.0 Flash Exp"""
    global _last_errors

    if not GOOGLE_API_KEY:
        _last_errors.append("No API key available")
        return None

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

    # Use Gemini API directly
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key={GOOGLE_API_KEY}"

    headers = {"Content-Type": "application/json"}

    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": base64_clean
                    }
                }
            ]
        }],
        "generationConfig": {
            "responseModalities": ["IMAGE", "TEXT"]
        }
    }

    try:
        print("   Making request to Gemini API...")
        response = requests.post(url, headers=headers, json=payload, timeout=120)

        print(f"   Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            if "candidates" in result:
                for candidate in result["candidates"]:
                    if "content" in candidate and "parts" in candidate["content"]:
                        for part in candidate["content"]["parts"]:
                            inline_data = part.get("inlineData") or part.get("inline_data")
                            if inline_data:
                                img_data = inline_data.get("data")
                                img_mime = inline_data.get("mimeType", "image/png")
                                if img_data:
                                    return f"data:{img_mime};base64,{img_data}"

            _last_errors.append("Gemini: No image in response")
        else:
            error_text = response.text[:300]
            _last_errors.append(f"Gemini: {response.status_code} - {error_text}")
            print(f"   ⚠️ Gemini error: {response.status_code}")

    except Exception as e:
        _last_errors.append(f"Gemini: {str(e)[:200]}")
        print(f"   ⚠️ Gemini error: {e}")

    return None


def generate_with_vertex(image_data, prompt, token, project_id):
    """Generate using Vertex AI REST API with OAuth2"""
    global _last_errors

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

    models_to_try = [
        ('gemini-2.0-flash-exp', 'us-central1'),
    ]

    for model_name, location in models_to_try:
        try:
            print(f"   Trying {model_name} via Vertex AI...")

            url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{project_id}/locations/{location}/publishers/google/models/{model_name}:generateContent"

            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json"
            }

            payload = {
                "contents": [{
                    "role": "user",
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": mime_type,
                                "data": base64_clean
                            }
                        }
                    ]
                }],
                "generationConfig": {
                    "responseModalities": ["IMAGE", "TEXT"]
                }
            }

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
                                    print(f"   ✅ Vertex AI success!")
                                    return f"data:{img_mime};base64,{img_data}"

                _last_errors.append(f"{model_name}: No image in response")
            else:
                error_text = response.text[:300]
                _last_errors.append(f"{model_name}: {response.status_code} - {error_text}")

        except Exception as e:
            _last_errors.append(f"{model_name}: {str(e)[:200]}")

    return None


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        global _last_errors
        _last_errors = []

        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            image_data = data.get('image', '')
            mode = data.get('mode', 'auto')
            theme = data.get('theme', 'black_friday')
            discount = data.get('discount')
            custom_note = data.get('customNote', '')
            manual_prompt = data.get('manualPrompt', '')
            output_count = min(4, max(1, int(data.get('outputCount', 2))))
            is_edit = data.get('isEdit', False)

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO - Promotional Image Generation")
            print(f"   Mode: {mode}")
            print(f"   Theme: {theme}")
            print(f"   Discount: {discount}")
            print(f"   Custom Note: {custom_note[:50] if custom_note else '(none)'}")
            print(f"   Output Count: {output_count}")
            print(f"   Is Edit: {is_edit}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            if mode == 'manual' and not manual_prompt:
                raise ValueError("No prompt provided for manual mode")

            # Build the creative prompt
            prompt = build_creative_prompt(mode, theme, discount, custom_note, manual_prompt)

            # Generate images
            generated_images = []

            for i in range(output_count):
                print(f"\n📸 Generating image {i+1}/{output_count}...")

                result = None

                # Try Gemini API first
                result = generate_with_gemini(image_data, prompt)

                # Fallback to Vertex AI
                if not result:
                    token = get_fresh_token()
                    if token and project_id:
                        result = generate_with_vertex(image_data, prompt, token, project_id)

                if result:
                    generated_images.append(result)
                    print(f"   ✅ Image {i+1} generated successfully")
                else:
                    print(f"   ⚠️ Image {i+1} failed")

            if generated_images:
                print(f"\n✅ Generated {len(generated_images)}/{output_count} images")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                self.wfile.write(json.dumps({
                    'success': True,
                    'images': generated_images,
                    'output_count': len(generated_images),
                    'theme': theme,
                    'method_used': 'Gemini Creative Studio'
                }).encode())
            else:
                error_details = " | ".join(_last_errors) if _last_errors else "Unknown error"
                raise Exception(f"All generation attempts failed: {error_details[:500]}")

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
                'model_errors': _last_errors if _last_errors else [],
                'method_used': 'Error'
            }).encode())
