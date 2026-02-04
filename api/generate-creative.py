"""
Creative Studio Mode - Promotional Image Generation with Themes
Uses Gemini 2.0 Flash Exp for theme-based product marketing images
Supports: Black Friday, Valentine's Day, Christmas, and more themes
"""

import os
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

# Theme configurations with IMPROVED detailed prompts for high-quality output
THEME_CONFIGS = {
    'black_friday': {
        'name': 'Black Friday',
        'scene': 'Luxurious black velvet surface with scattered gold confetti and subtle smoke effects. Premium studio lighting with dramatic shadows.',
        'decorations': 'elegant gold ribbons, premium shopping bags in background, subtle sparkle effects',
        'typography': 'BLACK FRIDAY in bold metallic gold 3D letters with glossy reflection',
        'mood': 'luxury, exclusivity, premium shopping event',
        'style': 'high-end fashion advertisement, Vogue magazine quality'
    },
    'valentines': {
        'name': "Valentine's Day",
        'scene': 'Soft blush pink silk fabric background with gentle bokeh heart lights. Romantic soft-focus photography style.',
        'decorations': 'red rose petals scattered around, small heart confetti, soft pink feathers',
        'typography': 'elegant rose gold script lettering with subtle shine',
        'mood': 'romantic, tender, gift of love',
        'style': 'luxury perfume advertisement, romantic cinema aesthetic'
    },
    'christmas': {
        'name': 'Christmas',
        'scene': 'Cozy Christmas setting with warm golden fairy lights bokeh, snow-dusted pine branches framing the edges.',
        'decorations': 'red and gold ornaments, cinnamon sticks, pine cones, subtle snowflakes',
        'typography': 'classic serif Christmas font in deep red with gold outline',
        'mood': 'magical, warm, festive joy, gift-giving spirit',
        'style': 'Coca-Cola Christmas ad quality, heartwarming holiday catalogue'
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'scene': 'Bright tropical paradise with turquoise water reflection, palm leaf shadows, golden hour sunlight.',
        'decorations': 'tropical flowers (hibiscus, plumeria), citrus slices, beach sand texture at edges',
        'typography': 'bold playful font in coral and turquoise gradient',
        'mood': 'refreshing, vacation vibes, carefree summer energy',
        'style': 'travel magazine cover, resort advertisement quality'
    },
    'new_year': {
        'name': 'New Year',
        'scene': 'Elegant midnight blue backdrop with golden firework bursts frozen in time, champagne bubble effects.',
        'decorations': 'gold and silver confetti, champagne glasses, clock showing midnight, streamers',
        'typography': 'glamorous art deco style gold metallic numbers',
        'mood': 'celebration, elegance, new beginnings, luxury party',
        'style': 'Times Square celebration advertisement, luxury brand New Year campaign'
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'scene': 'Dynamic gradient from deep red to orange with motion blur effects suggesting speed and urgency.',
        'decorations': 'lightning bolt graphics, timer/clock elements, speed lines',
        'typography': 'bold impactful sans-serif with electric glow and shadow',
        'mood': 'urgent, exciting, limited time opportunity, act now',
        'style': 'tech product launch, gaming advertisement energy'
    },
    'mothers_day': {
        'name': "Mother's Day",
        'scene': 'Dreamy soft focus with fresh peonies and garden roses, gentle morning light filtering through.',
        'decorations': 'delicate flower petals, soft ribbon bows, pearl accents, lace texture hints',
        'typography': 'elegant calligraphy script in dusty rose or lavender',
        'mood': 'tender love, appreciation, gentle warmth, gratitude',
        'style': 'luxury gift brand advertisement, elegant greeting card quality'
    },
    'easter': {
        'name': 'Easter',
        'scene': 'Fresh spring garden setting with soft morning dew, pastel colored Easter eggs in grass.',
        'decorations': 'spring flowers (tulips, daffodils), cute bunny silhouettes, butterfly accents',
        'typography': 'playful rounded font in pastel rainbow colors',
        'mood': 'joyful spring, renewal, family celebration, fresh start',
        'style': 'premium chocolate brand Easter campaign, spring catalogue'
    },
    'halloween': {
        'name': 'Halloween',
        'scene': 'Atmospheric purple and orange gradient with mysterious fog, full moon glow in background.',
        'decorations': 'carved pumpkins with candle glow, bat silhouettes, spider webs with dew drops',
        'typography': 'spooky dripping font in bright orange with green glow',
        'mood': 'fun spooky, mysterious excitement, playful scary',
        'style': 'Disney Halloween special advertisement, premium candy brand campaign'
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'scene': 'Futuristic digital space with neon blue circuit board patterns, holographic grid effects.',
        'decorations': 'floating digital particles, matrix-style code rain, glowing data streams',
        'typography': 'futuristic tech font with cyan neon glow and digital glitch effect',
        'mood': 'digital innovation, tech-savvy, modern online shopping',
        'style': 'Apple product launch aesthetic, tech startup advertisement'
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'scene': 'Fresh blooming garden with cherry blossoms falling, soft natural daylight, green grass bokeh.',
        'decorations': 'butterflies, fresh green leaves, flower buds, dewdrops',
        'typography': 'fresh modern font in spring green with floral accents',
        'mood': 'renewal, fresh energy, blooming opportunities, new season',
        'style': 'organic beauty brand campaign, lifestyle magazine cover'
    },
    'back_to_school': {
        'name': 'Back to School',
        'scene': 'Clean modern desk setup with organized school supplies, warm study lamp lighting.',
        'decorations': 'colorful pencils, notebooks, apples, graduation cap hints, ABC letters',
        'typography': 'friendly bold font resembling chalk or marker writing',
        'mood': 'fresh start, organized, youthful energy, academic success',
        'style': 'Apple education campaign, premium stationery brand advertisement'
    }
}

# Aspect ratio configurations
ASPECT_RATIO_CONFIGS = {
    '1:1': {
        'name': 'Square (1:1)',
        'description': 'perfect square format, Instagram feed style',
        'composition': 'centered product with equal spacing on all sides'
    },
    '4:5': {
        'name': 'Portrait (4:5)',
        'description': 'vertical portrait format, Instagram post optimal',
        'composition': 'product centered with more vertical space for text above/below'
    },
    '9:16': {
        'name': 'Story (9:16)',
        'description': 'vertical story format for Instagram/TikTok stories',
        'composition': 'product in center-lower area, promotional text at top, ample vertical space'
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


def build_creative_prompt(mode, theme, discount, custom_note, manual_prompt, aspect_ratio='1:1'):
    """Build promotional image generation prompt - IMPROVED FOR HIGH QUALITY OUTPUT"""

    aspect_config = ASPECT_RATIO_CONFIGS.get(aspect_ratio, ASPECT_RATIO_CONFIGS['1:1'])

    # Manual mode - user provides full prompt
    if mode == 'manual':
        return f"""You are a world-class advertising photographer and digital artist.

TASK: Create a stunning promotional product image based on user's request.

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: PRODUCT PRESERVATION RULES
═══════════════════════════════════════════════════════════════════════════════
The product in the reference image MUST be preserved EXACTLY:
- Keep ALL text/labels on product PIXEL-PERFECT (every letter, number, symbol)
- Keep ALL logos and branding IDENTICAL
- Keep ALL colors, textures, materials UNCHANGED
- Keep ALL shapes, proportions, dimensions EXACT
- DO NOT modify, enhance, or alter the product in ANY way
- The product should look like a professional studio photo of the EXACT same item
═══════════════════════════════════════════════════════════════════════════════

USER'S CREATIVE REQUEST:
{manual_prompt}

OUTPUT FORMAT: {aspect_config['name']} - {aspect_config['description']}
COMPOSITION: {aspect_config['composition']}

QUALITY STANDARD:
- Professional advertising photography quality
- Sharp, well-lit product photography
- Premium brand advertisement level
- Ready for Instagram, TikTok, or e-commerce hero image

Create the image now."""

    # Auto mode - theme-based generation
    theme_config = THEME_CONFIGS.get(theme, THEME_CONFIGS['black_friday'])

    # Build discount/badge section
    badge_text = ''
    if discount:
        badge_text = f"""
PROMOTIONAL BADGE (IMPORTANT):
Add a professional "{discount}% OFF" badge/sticker that:
- Is prominently visible but doesn't cover the product
- Uses the theme's color palette
- Looks like a real premium sale tag (glossy, 3D effect)
- Positioned at a corner or edge strategically"""
    elif custom_note:
        badge_text = f"""
CUSTOM PROMOTIONAL TEXT:
Add "{custom_note}" as elegant promotional text that:
- Complements the theme design
- Is clearly readable with good contrast
- Positioned where it enhances the composition"""

    return f"""You are a world-class advertising photographer working for a premium brand.

═══════════════════════════════════════════════════════════════════════════════
🎨 CREATIVE BRIEF: {theme_config['name'].upper()} PROMOTIONAL CAMPAIGN
═══════════════════════════════════════════════════════════════════════════════

CAMPAIGN THEME: {theme_config['name']}
REFERENCE STYLE: {theme_config['style']}

═══════════════════════════════════════════════════════════════════════════════
⚠️ CRITICAL: PRODUCT PRESERVATION RULES
═══════════════════════════════════════════════════════════════════════════════
The product in the reference image MUST be preserved EXACTLY:
- Keep ALL text/labels on product PIXEL-PERFECT (every letter, number, symbol)
- Keep ALL logos and branding IDENTICAL
- Keep ALL colors, textures, materials UNCHANGED
- Keep ALL shapes, proportions, dimensions EXACT
- DO NOT modify, enhance, or alter the product in ANY way
- The product should look like it was photographed in this new setting
═══════════════════════════════════════════════════════════════════════════════

SCENE SETUP:
{theme_config['scene']}

DECORATIVE ELEMENTS (around the product, NOT on it):
{theme_config['decorations']}

TYPOGRAPHY STYLE (if text needed):
{theme_config['typography']}

MOOD & ATMOSPHERE:
{theme_config['mood']}
{badge_text}

OUTPUT FORMAT: {aspect_config['name']} - {aspect_config['description']}
COMPOSITION: {aspect_config['composition']}

EXECUTION:
1. Place the EXACT product from reference image as the hero/center
2. Build the {theme_config['name']} themed environment AROUND the product
3. Use professional studio lighting that matches the theme mood
4. Add decorative elements that frame/complement without covering product
5. Ensure premium advertising quality - this is for a major brand campaign

The final image should look like it belongs in a high-budget advertising campaign for {theme_config['name']}.

Create the image now."""


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
            aspect_ratio = data.get('aspectRatio', '1:1')
            is_edit = data.get('isEdit', False)

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO - Promotional Image Generation")
            print(f"   Mode: {mode}")
            print(f"   Theme: {theme}")
            print(f"   Discount: {discount}")
            print(f"   Aspect Ratio: {aspect_ratio}")
            print(f"   Custom Note: {custom_note[:50] if custom_note else '(none)'}")
            print(f"   Output Count: {output_count}")
            print(f"   Is Edit: {is_edit}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            if mode == 'manual' and not manual_prompt:
                raise ValueError("No prompt provided for manual mode")

            # Build the creative prompt
            prompt = build_creative_prompt(mode, theme, discount, custom_note, manual_prompt, aspect_ratio)

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
