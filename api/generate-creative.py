"""
Creative Studio Mode - HYBRID APPROACH (Lightweight)
=====================================================
Professional promotional image generation using:
1. AI background generation - Create themed backgrounds only
2. Product placement with frame/shadow - Professional presentation
3. Text overlay (Pillow) - Add badges and text programmatically

Product is 100% preserved - we never ask AI to modify it.
"""

import os
import io
import json
import base64
import traceback
import requests
from http.server import BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps

print("=" * 60)
print("🎨 Creative Studio Mode - HYBRID APPROACH (Lightweight)")
print("=" * 60)

# Get credentials
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("VERTEX_API_KEY") or os.environ.get("GOOGLE_API_KEY")

# OAuth2 setup
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

# ═══════════════════════════════════════════════════════════════════════════════
# THEME CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════════════════════

THEME_BACKGROUNDS = {
    'black_friday': {
        'name': 'Black Friday',
        'prompt': 'Ultra premium Black Friday sale background. Luxurious black velvet texture with elegant gold sparkles and shimmer effects scattered around edges. Rich dark gradient. High-end fashion photography backdrop. 8K quality, professional studio lighting. Empty center space. No products, no text.',
        'badge_color': '#FFD700',
        'badge_bg': '#000000',
        'frame_color': '#FFD700',
        'gradient': [(20, 20, 20), (40, 35, 25)]
    },
    'valentines': {
        'name': "Valentine's Day",
        'prompt': 'Romantic Valentine sale background. Soft blush pink silk texture with gentle bokeh heart lights, scattered red rose petals at edges. Dreamy romantic atmosphere with soft glow. Premium perfume ad style. 8K quality. Empty center. No products, no text.',
        'badge_color': '#FFFFFF',
        'badge_bg': '#E91E63',
        'frame_color': '#E91E63',
        'gradient': [(255, 220, 230), (255, 180, 200)]
    },
    'christmas': {
        'name': 'Christmas',
        'prompt': 'Magical Christmas sale background. Rich deep red velvet with golden bokeh fairy lights, subtle snowflakes, pine branches at corners. Warm cozy holiday atmosphere. Coca-Cola ad quality. 8K. Empty center. No products, no text.',
        'badge_color': '#FFFFFF',
        'badge_bg': '#C62828',
        'frame_color': '#FFD700',
        'gradient': [(139, 20, 20), (20, 80, 20)]
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'prompt': 'Fresh vibrant summer sale background. Bright gradient from turquoise ocean to sunny yellow, palm leaf shadows at edges, tropical beach vibes. Resort advertisement quality. 8K. Empty center. No products, no text.',
        'badge_color': '#000000',
        'badge_bg': '#FFEB3B',
        'frame_color': '#00BCD4',
        'gradient': [(0, 200, 200), (255, 220, 0)]
    },
    'new_year': {
        'name': 'New Year',
        'prompt': 'Glamorous New Year celebration background. Sophisticated midnight blue with gold confetti explosion, champagne bubble effects, firework sparkles. Luxury party atmosphere. 8K quality. Empty center. No products, no text.',
        'badge_color': '#000000',
        'badge_bg': '#FFD700',
        'frame_color': '#FFD700',
        'gradient': [(10, 20, 50), (30, 30, 80)]
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'prompt': 'Dynamic urgent flash sale background. Bold red to orange gradient with lightning bolt effects, speed lines, energetic motion blur. Tech product launch energy. 8K quality. Empty center. No products, no text.',
        'badge_color': '#FFFFFF',
        'badge_bg': '#FF5722',
        'frame_color': '#FFEB3B',
        'gradient': [(255, 80, 0), (255, 150, 0)]
    },
    'mothers_day': {
        'name': "Mother's Day",
        'prompt': 'Elegant Mother\'s Day background. Soft lavender to blush pink gradient, delicate peony petals floating, gentle warm lighting. Luxury gift brand aesthetic. 8K quality. Empty center. No products, no text.',
        'badge_color': '#FFFFFF',
        'badge_bg': '#9C27B0',
        'frame_color': '#E91E63',
        'gradient': [(230, 200, 230), (255, 200, 220)]
    },
    'easter': {
        'name': 'Easter',
        'prompt': 'Joyful Easter spring background. Fresh pastel gradient with mint, pink, yellow. Decorated Easter eggs at corners, spring flowers, butterfly accents. Premium chocolate brand style. 8K. Empty center. No products, no text.',
        'badge_color': '#000000',
        'badge_bg': '#81C784',
        'frame_color': '#7B1FA2',
        'gradient': [(200, 255, 220), (255, 220, 240)]
    },
    'halloween': {
        'name': 'Halloween',
        'prompt': 'Fun spooky Halloween background. Purple to orange gradient with mysterious fog, carved pumpkin glow at edges, bat silhouettes, spider web accents. Playful scary atmosphere. 8K. Empty center. No products, no text.',
        'badge_color': '#000000',
        'badge_bg': '#FF9800',
        'frame_color': '#7B1FA2',
        'gradient': [(80, 0, 120), (255, 140, 0)]
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'prompt': 'Futuristic Cyber Monday background. Dark blue with neon cyan circuit board patterns, digital matrix effects, holographic grid, tech aesthetic. Apple launch style. 8K quality. Empty center. No products, no text.',
        'badge_color': '#000000',
        'badge_bg': '#00E5FF',
        'frame_color': '#00E5FF',
        'gradient': [(10, 20, 60), (0, 60, 80)]
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'prompt': 'Fresh spring renewal background. Clean gradient from fresh green to white, cherry blossom petals floating, natural daylight glow. Lifestyle brand aesthetic. 8K quality. Empty center. No products, no text.',
        'badge_color': '#FFFFFF',
        'badge_bg': '#4CAF50',
        'frame_color': '#E91E63',
        'gradient': [(200, 255, 200), (255, 255, 255)]
    },
    'back_to_school': {
        'name': 'Back to School',
        'prompt': 'Clean organized back to school background. Bright gradient from white to light blue, subtle pencil and notebook illustrations at edges. Academic energy. 8K quality. Empty center. No products, no text.',
        'badge_color': '#FFFFFF',
        'badge_bg': '#2196F3',
        'frame_color': '#FF9800',
        'gradient': [(255, 255, 255), (200, 220, 255)]
    }
}

# Aspect ratio dimensions
ASPECT_DIMENSIONS = {
    '1:1': (1024, 1024),
    '4:5': (1024, 1280),
    '9:16': (1024, 1820)
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


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: GENERATE THEMED BACKGROUND (NO PRODUCT)
# ═══════════════════════════════════════════════════════════════════════════════

def generate_themed_background(theme, aspect_ratio, token, proj_id):
    """Generate a themed background using AI - NO PRODUCT"""
    global _last_errors

    theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])

    prompt = f"""{theme_config['prompt']}

Image dimensions: {dimensions[0]}x{dimensions[1]} pixels
Style: Ultra high quality, 8K resolution, professional product photography background
CRITICAL: Leave clear empty space in the center (60% of frame) for product placement
CRITICAL: Generate ONLY the background - absolutely NO product, NO text, NO logos"""

    print(f"   🎨 Generating {theme_config['name']} background...")

    # Try Vertex AI Gemini
    if token and proj_id:
        location = 'us-central1'
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/{location}/publishers/google/models/gemini-2.0-flash-exp:generateContent"

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        payload = {
            "contents": [{
                "role": "user",
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "responseModalities": ["IMAGE", "TEXT"]
            }
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)

            if response.status_code == 200:
                result = response.json()

                if "candidates" in result:
                    for candidate in result["candidates"]:
                        if "content" in candidate and "parts" in candidate["content"]:
                            for part in candidate["content"]["parts"]:
                                if "inlineData" in part:
                                    img_data = part["inlineData"]["data"]
                                    img_bytes = base64.b64decode(img_data)
                                    bg_image = Image.open(io.BytesIO(img_bytes))
                                    print("   ✅ AI Background generated")
                                    return bg_image.convert('RGBA')

            error_msg = f"Background gen failed: {response.status_code}"
            _last_errors.append(error_msg)
            print(f"   ⚠️ {error_msg}")

        except Exception as e:
            _last_errors.append(f"Background error: {str(e)[:100]}")
            print(f"   ⚠️ Background error: {e}")

    # Fallback: Create gradient background
    print("   ↪ Using gradient fallback...")
    return create_gradient_background(theme, dimensions)


def create_gradient_background(theme, dimensions):
    """Create a gradient background as fallback"""
    width, height = dimensions
    theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])

    start_color = theme_config['gradient'][0]
    end_color = theme_config['gradient'][1]

    image = Image.new('RGBA', (width, height))
    draw = ImageDraw.Draw(image)

    for y in range(height):
        ratio = y / height
        r = int(start_color[0] + (end_color[0] - start_color[0]) * ratio)
        g = int(start_color[1] + (end_color[1] - start_color[1]) * ratio)
        b = int(start_color[2] + (end_color[2] - start_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: PLACE PRODUCT ON BACKGROUND WITH PROFESSIONAL STYLING
# ═══════════════════════════════════════════════════════════════════════════════

def place_product_on_background(background, product_image, theme, aspect_ratio):
    """Place product on background with professional frame and shadow"""
    global _last_errors

    try:
        theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])
        dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])
        width, height = dimensions

        # Resize background
        background = background.resize((width, height), Image.Resampling.LANCZOS)

        # Calculate product size (55% of frame for good visibility)
        product_max_size = int(min(width, height) * 0.55)

        # Resize product maintaining aspect ratio
        product_ratio = min(product_max_size / product_image.width,
                           product_max_size / product_image.height)

        new_width = int(product_image.width * product_ratio)
        new_height = int(product_image.height * product_ratio)

        product_resized = product_image.resize(
            (new_width, new_height),
            Image.Resampling.LANCZOS
        )

        # Create shadow effect
        shadow_offset = 15
        shadow_blur = 20

        # Create shadow image
        shadow = Image.new('RGBA', (new_width + shadow_blur*2, new_height + shadow_blur*2), (0, 0, 0, 0))
        shadow_draw = ImageDraw.Draw(shadow)
        shadow_draw.rounded_rectangle(
            [shadow_blur, shadow_blur, new_width + shadow_blur, new_height + shadow_blur],
            radius=20,
            fill=(0, 0, 0, 100)
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))

        # Calculate center position
        product_x = (width - new_width) // 2
        product_y = (height - new_height) // 2

        # Paste shadow
        shadow_x = product_x - shadow_blur + shadow_offset
        shadow_y = product_y - shadow_blur + shadow_offset
        background.paste(shadow, (shadow_x, shadow_y), shadow)

        # Add white/light frame around product
        frame_padding = 8
        frame_radius = 15

        # Create frame
        frame = Image.new('RGBA', (new_width + frame_padding*2, new_height + frame_padding*2), (0, 0, 0, 0))
        frame_draw = ImageDraw.Draw(frame)
        frame_draw.rounded_rectangle(
            [0, 0, new_width + frame_padding*2, new_height + frame_padding*2],
            radius=frame_radius + frame_padding,
            fill=(255, 255, 255, 240)
        )

        # Paste frame
        frame_x = product_x - frame_padding
        frame_y = product_y - frame_padding
        background.paste(frame, (frame_x, frame_y), frame)

        # Paste product
        if product_resized.mode == 'RGBA':
            background.paste(product_resized, (product_x, product_y), product_resized)
        else:
            background.paste(product_resized, (product_x, product_y))

        print("   ✅ Product placed with professional styling")
        return background

    except Exception as e:
        print(f"   ⚠️ Product placement error: {e}")
        _last_errors.append(f"Placement: {str(e)[:100]}")
        return background


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 3: ADD PROMOTIONAL TEXT/BADGES
# ═══════════════════════════════════════════════════════════════════════════════

def add_promotional_elements(image, theme, discount, custom_note, theme_name_display=False):
    """Add discount badges and promotional text"""
    global _last_errors

    try:
        theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])
        draw = ImageDraw.Draw(image)
        width, height = image.size

        badge_color = theme_config.get('badge_color', '#FFFFFF')
        badge_bg = theme_config.get('badge_bg', '#FF0000')

        # Load fonts
        font_size_large = max(52, width // 14)
        font_size_medium = max(36, width // 20)

        try:
            font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_large)
            font_medium = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size_medium)
        except:
            try:
                font_large = ImageFont.truetype("arial.ttf", font_size_large)
                font_medium = ImageFont.truetype("arial.ttf", font_size_medium)
            except:
                font_large = ImageFont.load_default()
                font_medium = ImageFont.load_default()

        # Add discount badge
        if discount:
            badge_text = f"{discount}%"
            off_text = "OFF"

            # Badge dimensions
            text_bbox = draw.textbbox((0, 0), badge_text, font=font_large)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            off_bbox = draw.textbbox((0, 0), off_text, font=font_medium)
            off_width = off_bbox[2] - off_bbox[0]

            padding_x = 35
            padding_y = 25
            badge_width = max(text_width, off_width) + padding_x * 2
            badge_height = text_height + 50 + padding_y * 2

            # Position top-right
            badge_x = width - badge_width - 40
            badge_y = 40

            # Draw badge background with slight rotation effect
            draw.rounded_rectangle(
                [badge_x, badge_y, badge_x + badge_width, badge_y + badge_height],
                radius=20,
                fill=badge_bg
            )

            # Draw percentage
            text_x = badge_x + (badge_width - text_width) // 2
            text_y = badge_y + padding_y
            draw.text((text_x, text_y), badge_text, font=font_large, fill=badge_color)

            # Draw "OFF"
            off_x = badge_x + (badge_width - off_width) // 2
            off_y = text_y + text_height + 5
            draw.text((off_x, off_y), off_text, font=font_medium, fill=badge_color)

            print(f"   ✅ Added {discount}% OFF badge")

        # Add custom note at bottom
        if custom_note and not discount:
            text_bbox = draw.textbbox((0, 0), custom_note, font=font_medium)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]

            padding = 20
            box_width = text_width + padding * 2
            box_height = text_height + padding

            box_x = (width - box_width) // 2
            box_y = height - box_height - 50

            # Draw background box
            draw.rounded_rectangle(
                [box_x, box_y, box_x + box_width, box_y + box_height],
                radius=10,
                fill=(0, 0, 0, 180)
            )

            # Draw text
            text_x = box_x + padding
            text_y = box_y + padding // 2
            draw.text((text_x, text_y), custom_note, font=font_medium, fill='#FFFFFF')

            print(f"   ✅ Added custom note")

        # Add theme name if no discount and no custom note
        if theme_name_display and not discount and not custom_note:
            theme_display = theme_config.get('name', '').upper()
            text_bbox = draw.textbbox((0, 0), theme_display, font=font_large)
            text_width = text_bbox[2] - text_bbox[0]

            text_x = (width - text_width) // 2
            text_y = 50

            # Draw with shadow
            draw.text((text_x + 3, text_y + 3), theme_display, font=font_large, fill=(0, 0, 0, 100))
            draw.text((text_x, text_y), theme_display, font=font_large, fill=badge_bg)

        return image

    except Exception as e:
        print(f"   ⚠️ Text error: {e}")
        _last_errors.append(f"Text: {str(e)[:100]}")
        return image


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN HYBRID PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_creative_hybrid(image_data, theme, discount, custom_note, aspect_ratio, token, proj_id):
    """Main hybrid generation pipeline"""
    global _last_errors

    print("\n   ═══════════════════════════════════════")
    print("   🎨 HYBRID CREATIVE PIPELINE")
    print("   ═══════════════════════════════════════")

    # Decode product image
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    product_bytes = base64.b64decode(base64_clean)
    product_image = Image.open(io.BytesIO(product_bytes)).convert('RGBA')

    # Step 1: Generate themed background
    print("\n   📍 Step 1: Background Generation")
    background = generate_themed_background(theme, aspect_ratio, token, proj_id)

    # Step 2: Place product on background
    print("\n   📍 Step 2: Product Placement")
    composite = place_product_on_background(background, product_image, theme, aspect_ratio)

    # Step 3: Add promotional elements
    print("\n   📍 Step 3: Text Overlay")
    final = add_promotional_elements(composite, theme, discount, custom_note, theme_name_display=True)

    # Convert to base64
    buffer = io.BytesIO()
    final = final.convert('RGB')
    final.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    result_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    print("\n   ✅ HYBRID PIPELINE COMPLETE")
    return f"data:image/png;base64,{result_base64}"


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
        global _last_errors
        _last_errors = []

        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            image_data = data.get('image', '')
            theme = data.get('theme', 'black_friday')
            discount = data.get('discount')
            custom_note = data.get('customNote', '')
            output_count = min(4, max(1, int(data.get('outputCount', 2))))
            aspect_ratio = data.get('aspectRatio', '1:1')

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO - HYBRID MODE")
            print(f"   Theme: {theme}")
            print(f"   Discount: {discount}")
            print(f"   Aspect Ratio: {aspect_ratio}")
            print(f"   Output Count: {output_count}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            # Get fresh token
            token = get_fresh_token()

            # Generate images
            generated_images = []

            for i in range(output_count):
                print(f"\n📸 Generating image {i+1}/{output_count}...")

                result = generate_creative_hybrid(
                    image_data=image_data,
                    theme=theme,
                    discount=discount,
                    custom_note=custom_note,
                    aspect_ratio=aspect_ratio,
                    token=token,
                    proj_id=project_id
                )

                if result:
                    generated_images.append(result)
                    print(f"   ✅ Image {i+1} done")
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
                    'method_used': 'Hybrid Creative Studio'
                }).encode())
            else:
                error_details = " | ".join(_last_errors) if _last_errors else "Unknown error"
                raise Exception(f"Generation failed: {error_details[:500]}")

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
