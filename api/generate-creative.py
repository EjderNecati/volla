"""
Creative Studio v6.0 - PROFESSIONAL AD CREATIVE GENERATOR
==========================================================
Complete redesign focused on IMPACTFUL, PROFESSIONAL output.

KEY PRINCIPLES:
1. AI-generated BEAUTIFUL backgrounds (not flat gradients)
2. BIG, impactful headline text
3. LARGE discount badges that grab attention
4. Professional product integration
5. Clear call-to-action

Product image is 100% preserved.
"""

import os
import io
import json
import base64
import traceback
import requests
import random
import math
from http.server import BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

print("=" * 60)
print("🎨 Creative Studio v6.0 - PROFESSIONAL Ad Generator")
print("=" * 60)

# Credentials
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("VERTEX_API_KEY") or os.environ.get("GOOGLE_API_KEY")

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
        print(f"✅ OAuth2 ready: {project_id}")
except Exception as e:
    print(f"⚠️ OAuth2 failed: {e}")

_last_errors = []

# ═══════════════════════════════════════════════════════════════════════════════
# DIMENSIONS
# ═══════════════════════════════════════════════════════════════════════════════

ASPECT_DIMENSIONS = {
    '1:1': (1080, 1080),
    '4:5': (1080, 1350),
    '9:16': (1080, 1920)
}

# ═══════════════════════════════════════════════════════════════════════════════
# THEME CONFIGURATIONS - Professional Ad Styles
# ═══════════════════════════════════════════════════════════════════════════════

THEMES = {
    'black_friday': {
        'name': 'Black Friday',
        'headline': 'BLACK FRIDAY',
        'subheadline': 'MEGA SALE',
        'bg_prompt': 'Luxurious Black Friday sale background. Deep black with elegant gold particle effects, bokeh lights, and subtle golden shimmer. Premium luxury brand aesthetic. Professional advertising photography backdrop. Rich dark velvet texture with gold dust particles floating. 8K quality, studio lighting. Empty center for product placement. No text, no products.',
        'bg_fallback': [(10, 10, 12), (25, 22, 15)],
        'headline_color': (255, 215, 0),
        'badge_bg': (255, 215, 0),
        'badge_text': (0, 0, 0),
        'cta_bg': (255, 215, 0),
        'cta_text': (0, 0, 0),
        'cta_label': 'SHOP NOW',
        'accent': (255, 215, 0),
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'headline': '⚡ FLASH SALE',
        'subheadline': 'LIMITED TIME',
        'bg_prompt': 'Dynamic Flash Sale background. Bold red gradient with energetic lightning bolt effects, speed lines, and electric sparks. High energy, urgent feeling. Modern e-commerce advertisement style. Vibrant red to orange gradient with motion blur effects. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(200, 30, 30), (255, 100, 50)],
        'headline_color': (255, 255, 255),
        'badge_bg': (255, 235, 59),
        'badge_text': (200, 30, 30),
        'cta_bg': (255, 255, 255),
        'cta_text': (200, 30, 30),
        'cta_label': 'BUY NOW',
        'accent': (255, 235, 59),
    },
    'valentines': {
        'name': "Valentine's Day",
        'headline': "VALENTINE'S",
        'subheadline': 'SPECIAL',
        'bg_prompt': 'Romantic Valentine sale background. Soft pink and rose gradient with floating hearts bokeh, gentle sparkles, and romantic atmosphere. Luxury perfume advertisement style. Blush pink silk texture with soft lighting. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(255, 220, 230), (255, 180, 200)],
        'headline_color': (190, 30, 90),
        'badge_bg': (219, 39, 119),
        'badge_text': (255, 255, 255),
        'cta_bg': (219, 39, 119),
        'cta_text': (255, 255, 255),
        'cta_label': 'GIFT NOW',
        'accent': (219, 39, 119),
    },
    'christmas': {
        'name': 'Christmas',
        'headline': '🎄 CHRISTMAS',
        'subheadline': 'SALE',
        'bg_prompt': 'Magical Christmas sale background. Rich red and green with golden bokeh lights, snowflakes, and festive sparkle. Warm cozy holiday atmosphere. Coca-Cola advertisement quality. Deep red velvet with gold accents. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(120, 20, 20), (20, 80, 40)],
        'headline_color': (255, 215, 0),
        'badge_bg': (180, 30, 30),
        'badge_text': (255, 255, 255),
        'cta_bg': (34, 139, 34),
        'cta_text': (255, 255, 255),
        'cta_label': 'GET YOURS',
        'accent': (255, 215, 0),
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'headline': '☀️ SUMMER',
        'subheadline': 'SALE',
        'bg_prompt': 'Fresh Summer sale background. Bright turquoise to sunny yellow gradient with tropical vibes, palm leaf shadows, and beach atmosphere. Resort advertisement quality. Ocean blue meets sunshine yellow. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(0, 180, 210), (255, 200, 100)],
        'headline_color': (255, 255, 255),
        'badge_bg': (255, 107, 53),
        'badge_text': (255, 255, 255),
        'cta_bg': (255, 255, 255),
        'cta_text': (0, 150, 180),
        'cta_label': 'COOL DEALS',
        'accent': (255, 107, 53),
    },
    'new_year': {
        'name': 'New Year',
        'headline': '🎆 NEW YEAR',
        'subheadline': 'SALE',
        'bg_prompt': 'Glamorous New Year celebration background. Midnight blue with gold confetti, champagne bubbles, and firework sparkles. Luxury party atmosphere. Premium celebration aesthetic. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(10, 15, 45), (30, 30, 80)],
        'headline_color': (255, 215, 0),
        'badge_bg': (255, 215, 0),
        'badge_text': (20, 20, 60),
        'cta_bg': (255, 215, 0),
        'cta_text': (20, 20, 60),
        'cta_label': 'CELEBRATE',
        'accent': (255, 215, 0),
    },
    'mothers_day': {
        'name': "Mother's Day",
        'headline': "💐 MOTHER'S DAY",
        'subheadline': 'SPECIAL',
        'bg_prompt': 'Elegant Mother Day background. Soft lavender to blush pink gradient with delicate flower petals, gentle bokeh, and warm loving atmosphere. Luxury gift brand aesthetic. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(240, 220, 245), (255, 210, 230)],
        'headline_color': (120, 40, 140),
        'badge_bg': (147, 51, 234),
        'badge_text': (255, 255, 255),
        'cta_bg': (219, 39, 119),
        'cta_text': (255, 255, 255),
        'cta_label': 'FOR MOM',
        'accent': (147, 51, 234),
    },
    'easter': {
        'name': 'Easter',
        'headline': '🐣 EASTER',
        'subheadline': 'SALE',
        'bg_prompt': 'Fresh Easter spring background. Soft pastel green and yellow gradient with subtle flower patterns, spring sunshine, and fresh atmosphere. Light and airy feeling. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(230, 250, 240), (255, 250, 220)],
        'headline_color': (50, 120, 80),
        'badge_bg': (251, 191, 36),
        'badge_text': (60, 40, 0),
        'cta_bg': (74, 222, 128),
        'cta_text': (255, 255, 255),
        'cta_label': 'SPRING DEALS',
        'accent': (74, 222, 128),
    },
    'halloween': {
        'name': 'Halloween',
        'headline': '🎃 HALLOWEEN',
        'subheadline': 'SALE',
        'bg_prompt': 'Spooky Halloween sale background. Deep purple and black with orange accents, mysterious fog, subtle bat silhouettes. Fun spooky atmosphere, not scary. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(30, 15, 45), (50, 25, 60)],
        'headline_color': (249, 115, 22),
        'badge_bg': (249, 115, 22),
        'badge_text': (0, 0, 0),
        'cta_bg': (147, 51, 234),
        'cta_text': (255, 255, 255),
        'cta_label': 'SPOOKY DEALS',
        'accent': (249, 115, 22),
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'headline': '💻 CYBER MONDAY',
        'subheadline': 'TECH DEALS',
        'bg_prompt': 'Futuristic Cyber Monday background. Dark blue tech aesthetic with neon cyan grid lines, digital particles, and holographic effects. Matrix-style modern technology vibe. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(10, 20, 35), (20, 40, 60)],
        'headline_color': (0, 255, 255),
        'badge_bg': (0, 255, 255),
        'badge_text': (0, 30, 50),
        'cta_bg': (0, 255, 255),
        'cta_text': (0, 30, 50),
        'cta_label': 'TECH DEALS',
        'accent': (0, 255, 255),
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'headline': '🌸 SPRING',
        'subheadline': 'SALE',
        'bg_prompt': 'Fresh Spring sale background. Light mint green to soft pink gradient with cherry blossom petals, fresh morning dew feeling. Clean and refreshing atmosphere. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(235, 250, 245), (255, 240, 245)],
        'headline_color': (20, 150, 140),
        'badge_bg': (20, 184, 166),
        'badge_text': (255, 255, 255),
        'cta_bg': (244, 114, 182),
        'cta_text': (255, 255, 255),
        'cta_label': 'FRESH DEALS',
        'accent': (244, 114, 182),
    },
    'back_to_school': {
        'name': 'Back to School',
        'headline': '📚 BACK TO SCHOOL',
        'subheadline': 'SALE',
        'bg_prompt': 'Fun Back to School background. Bright blue with yellow accents, subtle notebook paper texture, pencil and ruler patterns. Educational but exciting feeling. 8K quality. Empty center. No text, no products.',
        'bg_fallback': [(40, 80, 160), (80, 140, 220)],
        'headline_color': (255, 255, 255),
        'badge_bg': (251, 191, 36),
        'badge_text': (30, 50, 100),
        'cta_bg': (255, 255, 255),
        'cta_text': (40, 80, 160),
        'cta_label': 'LEARN MORE',
        'accent': (251, 191, 36),
    }
}

SOCIAL_PROOF = {
    'best_seller': '🏆 BEST SELLER',
    'top_rated': '⭐ TOP RATED',
    'limited_edition': '💎 LIMITED EDITION',
    'trending': '🔥 TRENDING',
    'new_arrival': '✨ NEW ARRIVAL',
    'editor_choice': '👑 EDITOR\'S PICK'
}


# ═══════════════════════════════════════════════════════════════════════════════
# FONT LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def load_font(size, bold=True):
    """Load a font with fallbacks"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue
    return ImageFont.load_default()


def get_fresh_token():
    """Get fresh OAuth2 token"""
    global oauth2_token
    try:
        if GOOGLE_CREDENTIALS_JSON:
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
    except:
        pass
    return oauth2_token


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND GENERATION - AI + Fallback
# ═══════════════════════════════════════════════════════════════════════════════

def generate_ai_background(theme_config, dimensions, token, proj_id):
    """Generate beautiful background using Gemini"""
    width, height = dimensions
    prompt = theme_config['bg_prompt']

    print(f"   🎨 Generating AI background...")

    if not token or not proj_id:
        print(f"   ⚠️ No credentials, using fallback")
        return create_fallback_background(theme_config, dimensions)

    url = f"https://us-central1-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/us-central1/publishers/google/models/imagen-3.0-generate-002:predict"

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Adjust aspect ratio hint
    if width == height:
        aspect = "1:1"
    elif width < height:
        aspect = "9:16" if height / width > 1.5 else "3:4"
    else:
        aspect = "16:9"

    payload = {
        "instances": [{"prompt": prompt}],
        "parameters": {
            "sampleCount": 1,
            "aspectRatio": aspect,
            "safetyFilterLevel": "block_few",
            "personGeneration": "dont_allow"
        }
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)

        if response.status_code == 200:
            result = response.json()
            if "predictions" in result and len(result["predictions"]) > 0:
                img_b64 = result["predictions"][0].get("bytesBase64Encoded")
                if img_b64:
                    img_bytes = base64.b64decode(img_b64)
                    bg = Image.open(io.BytesIO(img_bytes)).convert('RGBA')
                    bg = bg.resize(dimensions, Image.Resampling.LANCZOS)
                    print(f"   ✅ AI background generated")
                    return bg

        print(f"   ⚠️ AI failed ({response.status_code}), using fallback")
    except Exception as e:
        print(f"   ⚠️ AI error: {e}")

    return create_fallback_background(theme_config, dimensions)


def create_fallback_background(theme_config, dimensions):
    """Create gradient fallback background"""
    width, height = dimensions
    image = Image.new('RGBA', (width, height))
    draw = ImageDraw.Draw(image)

    colors = theme_config['bg_fallback']
    start = colors[0]
    end = colors[1]

    for y in range(height):
        ratio = y / height
        r = int(start[0] + (end[0] - start[0]) * ratio)
        g = int(start[1] + (end[1] - start[1]) * ratio)
        b = int(start[2] + (end[2] - start[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    # Add subtle noise/texture
    accent = theme_config['accent']
    for _ in range(50):
        x = random.randint(0, width)
        y = random.randint(0, height)
        size = random.randint(2, 5)
        opacity = random.randint(10, 40)
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(*accent, opacity))

    print(f"   ✅ Fallback background created")
    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT PLACEMENT
# ═══════════════════════════════════════════════════════════════════════════════

def place_product(background, product_image, theme_config, layout_idx):
    """Place product with professional shadow and frame"""
    width, height = background.size

    # Scale based on layout
    scales = [0.38, 0.40, 0.42, 0.36, 0.38, 0.40]
    scale = scales[layout_idx % len(scales)]

    product_max = int(min(width, height) * scale)
    ratio = min(product_max / product_image.width, product_max / product_image.height)

    new_w = int(product_image.width * ratio)
    new_h = int(product_image.height * ratio)

    product_resized = product_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Position - center-bottom area (leave top for headline)
    product_x = (width - new_w) // 2
    product_y = int(height * 0.35)  # Lower position to leave room for headline

    # Create shadow
    shadow_blur = 30
    shadow_opacity = 80
    shadow = Image.new('RGBA', (new_w + shadow_blur*2, new_h + shadow_blur*2 + 20), (0, 0, 0, 0))

    if product_resized.mode == 'RGBA':
        alpha = product_resized.split()[3]
        shadow_base = Image.new('RGBA', product_resized.size, (0, 0, 0, shadow_opacity))
        shadow_base.putalpha(alpha)
        shadow.paste(shadow_base, (shadow_blur, shadow_blur + 20), shadow_base)
        shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_blur))

    # Paste shadow
    background.paste(shadow, (product_x - shadow_blur, product_y - shadow_blur), shadow)

    # White frame/card behind product
    frame_padding = 15
    frame = Image.new('RGBA', (new_w + frame_padding*2, new_h + frame_padding*2), (0, 0, 0, 0))
    frame_draw = ImageDraw.Draw(frame)
    frame_draw.rounded_rectangle(
        [0, 0, new_w + frame_padding*2, new_h + frame_padding*2],
        radius=20,
        fill=(255, 255, 255, 250)
    )
    background.paste(frame, (product_x - frame_padding, product_y - frame_padding), frame)

    # Paste product
    if product_resized.mode == 'RGBA':
        background.paste(product_resized, (product_x, product_y), product_resized)
    else:
        background.paste(product_resized, (product_x, product_y))

    return background, (product_x, product_y, new_w, new_h)


# ═══════════════════════════════════════════════════════════════════════════════
# HEADLINE TEXT - BIG AND IMPACTFUL
# ═══════════════════════════════════════════════════════════════════════════════

def draw_headline(image, theme_config, discount):
    """Draw BIG headline at top"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    headline = theme_config['headline']
    subheadline = theme_config['subheadline']
    color = theme_config['headline_color']

    # Main headline - BIG
    headline_size = int(width * 0.09)  # 9% of width = BIG
    headline_font = load_font(headline_size)

    bbox = draw.textbbox((0, 0), headline, font=headline_font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    x = (width - text_w) // 2
    y = int(height * 0.06)

    # Text shadow
    shadow_offset = 3
    draw.text((x + shadow_offset, y + shadow_offset), headline, font=headline_font, fill=(0, 0, 0, 100))

    # Main text
    draw.text((x, y), headline, font=headline_font, fill=color)

    # Subheadline
    sub_size = int(width * 0.05)
    sub_font = load_font(sub_size)

    bbox2 = draw.textbbox((0, 0), subheadline, font=sub_font)
    sub_w = bbox2[2] - bbox2[0]

    sub_x = (width - sub_w) // 2
    sub_y = y + text_h + 10

    draw.text((sub_x + 2, sub_y + 2), subheadline, font=sub_font, fill=(0, 0, 0, 80))
    draw.text((sub_x, sub_y), subheadline, font=sub_font, fill=color)

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# DISCOUNT BADGE - LARGE AND PROMINENT
# ═══════════════════════════════════════════════════════════════════════════════

def draw_discount_badge(image, discount, theme_config, layout_idx):
    """Draw LARGE discount badge"""
    if not discount:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    badge_text = f"-{discount}%"

    # LARGE badge font
    badge_size = int(width * 0.07)
    font = load_font(badge_size)

    bbox = draw.textbbox((0, 0), badge_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Badge dimensions
    padding = 25
    badge_w = text_w + padding * 2
    badge_h = text_h + padding * 2

    # Position - top right area but visible
    positions = [
        (width - badge_w - 30, int(height * 0.22)),
        (30, int(height * 0.22)),
        (width - badge_w - 30, int(height * 0.18)),
    ]
    x, y = positions[layout_idx % len(positions)]

    badge_bg = theme_config['badge_bg']
    badge_text_color = theme_config['badge_text']

    # Shadow
    draw.ellipse([x + 4, y + 4, x + badge_w + 4, y + badge_h + 4], fill=(0, 0, 0, 60))

    # Badge circle
    draw.ellipse([x, y, x + badge_w, y + badge_h], fill=badge_bg)

    # Highlight
    highlight_size = badge_w * 0.7
    draw.ellipse([x + 5, y + 5, x + highlight_size, y + highlight_size * 0.5],
                 fill=(255, 255, 255, 80))

    # Text
    text_x = x + (badge_w - text_w) // 2
    text_y = y + (badge_h - text_h) // 2 - 3
    draw.text((text_x, text_y), badge_text, font=font, fill=badge_text_color)

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# CTA BUTTON
# ═══════════════════════════════════════════════════════════════════════════════

def draw_cta_button(image, theme_config, custom_text=None):
    """Draw CTA button at bottom"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    cta_text = custom_text if custom_text else theme_config['cta_label']

    # Font size
    font_size = int(width * 0.035)
    font = load_font(font_size)

    bbox = draw.textbbox((0, 0), cta_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Button dimensions
    padding_x = 40
    padding_y = 18
    btn_w = text_w + padding_x * 2
    btn_h = text_h + padding_y * 2

    # Position - bottom center
    x = (width - btn_w) // 2
    y = height - btn_h - 50

    cta_bg = theme_config['cta_bg']
    cta_text_color = theme_config['cta_text']

    # Shadow
    draw.rounded_rectangle([x + 3, y + 3, x + btn_w + 3, y + btn_h + 3],
                          radius=btn_h // 2, fill=(0, 0, 0, 60))

    # Button
    draw.rounded_rectangle([x, y, x + btn_w, y + btn_h],
                          radius=btn_h // 2, fill=cta_bg)

    # Highlight
    draw.rounded_rectangle([x + 3, y + 3, x + btn_w - 6, y + btn_h // 2],
                          radius=btn_h // 4, fill=(255, 255, 255, 60))

    # Text
    text_x = x + (btn_w - text_w) // 2
    text_y = y + (btn_h - text_h) // 2 - 2
    draw.text((text_x, text_y), cta_text, font=font, fill=cta_text_color)

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# TRUST BADGES
# ═══════════════════════════════════════════════════════════════════════════════

def draw_trust_badges(image, theme_config, options):
    """Draw trust badges at bottom"""
    if not options.get('showTrustBadges', True):
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    badges = []
    if options.get('showRating', True):
        rating = options.get('rating', 4.9)
        badges.append(f"★ {rating}")
    if options.get('showShipping', True):
        badges.append("Free Shipping")
    if options.get('showSoldCount', False):
        sold = options.get('soldCount', '1000+')
        badges.append(f"{sold} Sold")

    if not badges:
        return image

    font = load_font(14)
    y = height - 30

    total_w = 0
    badge_data = []
    for text in badges:
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0] + 24
        badge_data.append((text, w))
        total_w += w + 10

    x = (width - total_w) // 2

    for text, w in badge_data:
        draw.rounded_rectangle([x, y, x + w, y + 22], radius=4, fill=(0, 0, 0, 180))
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        draw.text((x + (w - tw) // 2, y + 4), text, font=font, fill=(255, 255, 255))
        x += w + 10

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# SOCIAL PROOF BADGE
# ═══════════════════════════════════════════════════════════════════════════════

def draw_social_proof(image, badge_type, theme_config):
    """Draw social proof badge"""
    if badge_type not in SOCIAL_PROOF:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    text = SOCIAL_PROOF[badge_type]
    font = load_font(14)

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]

    badge_w = text_w + 24
    badge_h = 30

    x = 30
    y = int(height * 0.28)

    # Dark background
    draw.rounded_rectangle([x, y, x + badge_w, y + badge_h], radius=6, fill=(0, 0, 0, 200))

    # Text
    draw.text((x + 12, y + 7), text, font=font, fill=(255, 255, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRICE TAG
# ═══════════════════════════════════════════════════════════════════════════════

def draw_price_tag(image, theme_config, orig_price, sale_price):
    """Draw price tag"""
    if not orig_price and not sale_price:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    price_font = load_font(32)
    small_font = load_font(16)
    accent = theme_config['accent']

    if sale_price and orig_price:
        main_text = f"${sale_price}"
        strike_text = f"${orig_price}"
    else:
        main_text = f"${orig_price or sale_price}"
        strike_text = None

    bbox = draw.textbbox((0, 0), main_text, font=price_font)
    main_w = bbox[2] - bbox[0]

    tag_w = main_w + 50
    tag_h = 75 if strike_text else 55

    x = width - tag_w - 30
    y = height - tag_h - 90

    # Background
    draw.rounded_rectangle([x, y, x + tag_w, y + tag_h], radius=12, fill=(0, 0, 0, 220))

    if strike_text:
        bbox2 = draw.textbbox((0, 0), strike_text, font=small_font)
        sw = bbox2[2] - bbox2[0]
        sx = x + (tag_w - sw) // 2
        draw.text((sx, y + 8), strike_text, font=small_font, fill=(150, 150, 150))
        draw.line([(sx - 2, y + 18), (sx + sw + 2, y + 18)], fill=(150, 150, 150), width=1)
        draw.text((x + (tag_w - main_w) // 2, y + 30), main_text, font=price_font, fill=accent)
    else:
        draw.text((x + (tag_w - main_w) // 2, y + (tag_h - 32) // 2), main_text, font=price_font, fill=(255, 255, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_creative_v6(image_data, theme, discount, aspect_ratio, layout_idx, options, token, proj_id):
    """Main v6 generation pipeline"""
    theme_config = THEMES.get(theme, THEMES['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])

    print(f"\n   ═══════════════════════════════════════")
    print(f"   🎨 CREATIVE v6.0 - {theme_config['name']}")
    print(f"   Layout: {layout_idx + 1}")
    print(f"   ═══════════════════════════════════════")

    # Decode product
    if 'base64,' in image_data:
        b64 = image_data.split('base64,')[1]
    else:
        b64 = image_data

    product_bytes = base64.b64decode(b64)
    product_image = Image.open(io.BytesIO(product_bytes)).convert('RGBA')

    # Step 1: Generate background
    print("\n   📍 Step 1: Background")
    background = generate_ai_background(theme_config, dimensions, token, proj_id)

    # Step 2: Draw headline
    print("   📍 Step 2: Headline")
    background = draw_headline(background, theme_config, discount)

    # Step 3: Place product
    print("   📍 Step 3: Product")
    composite, bounds = place_product(background, product_image, theme_config, layout_idx)

    # Step 4: Discount badge
    print("   📍 Step 4: Badge")
    if discount:
        composite = draw_discount_badge(composite, discount, theme_config, layout_idx)

    # Step 5: Social proof
    if options.get('showSocialProof', False):
        composite = draw_social_proof(composite, options.get('socialProofType', 'best_seller'), theme_config)

    # Step 6: Price tag
    if options.get('showPriceTag', False):
        composite = draw_price_tag(composite, theme_config,
                                   options.get('originalPrice', ''),
                                   options.get('salePrice', ''))

    # Step 7: Trust badges
    composite = draw_trust_badges(composite, theme_config, options)

    # Step 8: CTA
    print("   📍 Step 5: CTA")
    composite = draw_cta_button(composite, theme_config, options.get('ctaText', '') or None)

    # Convert to base64
    buffer = io.BytesIO()
    composite = composite.convert('RGB')
    composite.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    result_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    print(f"   ✅ Layout {layout_idx + 1} complete")
    return f"data:image/png;base64,{result_b64}"


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

            image_data = data.get('image', '')
            theme = data.get('theme', 'black_friday')
            discount = data.get('discount')
            output_count = min(4, max(1, int(data.get('outputCount', 2))))
            aspect_ratio = data.get('aspectRatio', '1:1')

            options = {
                'showTrustBadges': data.get('showTrustBadges', True),
                'showRating': data.get('showRating', True),
                'showShipping': data.get('showShipping', True),
                'showSoldCount': data.get('showSoldCount', False),
                'soldCount': data.get('soldCount', '1000+'),
                'rating': data.get('rating', 4.9),
                'showSocialProof': data.get('showSocialProof', False),
                'socialProofType': data.get('socialProofType', 'best_seller'),
                'showPriceTag': data.get('showPriceTag', False),
                'originalPrice': data.get('originalPrice', ''),
                'salePrice': data.get('salePrice', ''),
                'ctaText': data.get('ctaText', '')
            }

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO v6.0")
            print(f"   Theme: {theme}")
            print(f"   Discount: {discount}")
            print(f"   Count: {output_count}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            token = get_fresh_token()

            generated = []
            for i in range(output_count):
                print(f"\n📸 Generating {i+1}/{output_count}...")
                result = generate_creative_v6(
                    image_data, theme, discount, aspect_ratio, i, options, token, project_id
                )
                if result:
                    generated.append(result)

            if generated:
                print(f"\n✅ Generated {len(generated)} creatives")
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'images': generated,
                    'output_count': len(generated),
                    'theme': theme,
                    'method_used': 'Creative Studio v6.0'
                }).encode())
            else:
                raise Exception("Generation failed")

        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())
