"""
Creative Studio v7.0 - CANVA-QUALITY AD GENERATOR
==================================================
Professional promotional images like Canva templates.

DESIGN PRINCIPLES (from Canva analysis):
1. Split layout: Text on left, product on right
2. LARGE product (50-60% of canvas)
3. Bold typography hierarchy
4. Clean backgrounds with decorative shapes
5. Prominent discount badges
6. Clear CTA buttons

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
from PIL import Image, ImageDraw, ImageFont, ImageFilter

print("=" * 60)
print("🎨 Creative Studio v7.0 - CANVA-QUALITY Generator")
print("=" * 60)

# Credentials
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
oauth2_token = None
project_id = None

try:
    if GOOGLE_CREDENTIALS_JSON:
        from google.oauth2 import service_account
        import google.auth.transport.requests
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        project_id = creds_dict.get("project_id", "")
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=["https://www.googleapis.com/auth/cloud-platform"]
        )
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)
        oauth2_token = credentials.token
        print(f"✅ OAuth2 ready: {project_id}")
except Exception as e:
    print(f"⚠️ OAuth2 failed: {e}")


ASPECT_DIMENSIONS = {
    '1:1': (1080, 1080),
    '4:5': (1080, 1350),
    '9:16': (1080, 1920)
}

# ═══════════════════════════════════════════════════════════════════════════════
# THEME CONFIGURATIONS - Canva-style
# ═══════════════════════════════════════════════════════════════════════════════

THEMES = {
    'black_friday': {
        'name': 'Black Friday',
        'headline': 'BLACK',
        'headline2': 'FRIDAY',
        'subheadline': 'MEGA SALE',
        'bg_color': (15, 15, 18),
        'bg_color2': (25, 25, 30),
        'accent': (255, 215, 0),  # Gold
        'text_color': (255, 255, 255),
        'badge_bg': (255, 215, 0),
        'badge_text': (0, 0, 0),
        'cta_bg': (255, 215, 0),
        'cta_text': (0, 0, 0),
        'cta_label': 'SHOP NOW',
        'decoration': 'sparkle',
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'headline': 'FLASH',
        'headline2': 'SALE',
        'subheadline': 'LIMITED TIME OFFER',
        'bg_color': (220, 53, 69),
        'bg_color2': (255, 107, 107),
        'accent': (255, 235, 59),
        'text_color': (255, 255, 255),
        'badge_bg': (255, 235, 59),
        'badge_text': (220, 53, 69),
        'cta_bg': (255, 255, 255),
        'cta_text': (220, 53, 69),
        'cta_label': 'BUY NOW',
        'decoration': 'lightning',
    },
    'valentines': {
        'name': "Valentine's Day",
        'headline': "VALENTINE'S",
        'headline2': 'SPECIAL',
        'subheadline': 'GIFT OF LOVE',
        'bg_color': (255, 182, 193),
        'bg_color2': (255, 105, 180),
        'accent': (255, 255, 255),
        'text_color': (139, 0, 78),
        'badge_bg': (139, 0, 78),
        'badge_text': (255, 255, 255),
        'cta_bg': (139, 0, 78),
        'cta_text': (255, 255, 255),
        'cta_label': 'GIFT NOW',
        'decoration': 'hearts',
    },
    'christmas': {
        'name': 'Christmas',
        'headline': 'CHRISTMAS',
        'headline2': 'SALE',
        'subheadline': 'HOLIDAY DEALS',
        'bg_color': (165, 42, 42),
        'bg_color2': (139, 0, 0),
        'accent': (255, 215, 0),
        'text_color': (255, 255, 255),
        'badge_bg': (255, 215, 0),
        'badge_text': (139, 0, 0),
        'cta_bg': (34, 139, 34),
        'cta_text': (255, 255, 255),
        'cta_label': 'GET YOURS',
        'decoration': 'snow',
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'headline': 'SUMMER',
        'headline2': 'SALE',
        'subheadline': 'HOT DEALS',
        'bg_color': (255, 200, 87),
        'bg_color2': (255, 165, 0),
        'accent': (255, 255, 255),
        'text_color': (0, 0, 0),
        'badge_bg': (0, 0, 0),
        'badge_text': (255, 255, 255),
        'cta_bg': (0, 0, 0),
        'cta_text': (255, 255, 255),
        'cta_label': 'COOL DEALS',
        'decoration': 'sun',
    },
    'new_year': {
        'name': 'New Year',
        'headline': 'NEW YEAR',
        'headline2': 'SALE',
        'subheadline': 'FRESH START',
        'bg_color': (25, 25, 112),
        'bg_color2': (0, 0, 80),
        'accent': (255, 215, 0),
        'text_color': (255, 255, 255),
        'badge_bg': (255, 215, 0),
        'badge_text': (25, 25, 112),
        'cta_bg': (255, 215, 0),
        'cta_text': (25, 25, 112),
        'cta_label': 'CELEBRATE',
        'decoration': 'confetti',
    },
    'mothers_day': {
        'name': "Mother's Day",
        'headline': "MOTHER'S",
        'headline2': 'DAY',
        'subheadline': 'SPECIAL GIFT',
        'bg_color': (230, 190, 230),
        'bg_color2': (255, 182, 193),
        'accent': (128, 0, 128),
        'text_color': (75, 0, 75),
        'badge_bg': (128, 0, 128),
        'badge_text': (255, 255, 255),
        'cta_bg': (219, 39, 119),
        'cta_text': (255, 255, 255),
        'cta_label': 'FOR MOM',
        'decoration': 'flowers',
    },
    'easter': {
        'name': 'Easter',
        'headline': 'EASTER',
        'headline2': 'SALE',
        'subheadline': 'SPRING DEALS',
        'bg_color': (144, 238, 144),
        'bg_color2': (255, 255, 200),
        'accent': (255, 165, 0),
        'text_color': (0, 100, 0),
        'badge_bg': (255, 165, 0),
        'badge_text': (255, 255, 255),
        'cta_bg': (0, 128, 0),
        'cta_text': (255, 255, 255),
        'cta_label': 'SPRING DEALS',
        'decoration': 'eggs',
    },
    'halloween': {
        'name': 'Halloween',
        'headline': 'HALLOWEEN',
        'headline2': 'SALE',
        'subheadline': 'SPOOKY DEALS',
        'bg_color': (30, 0, 50),
        'bg_color2': (75, 0, 130),
        'accent': (255, 140, 0),
        'text_color': (255, 255, 255),
        'badge_bg': (255, 140, 0),
        'badge_text': (0, 0, 0),
        'cta_bg': (138, 43, 226),
        'cta_text': (255, 255, 255),
        'cta_label': 'SPOOKY DEALS',
        'decoration': 'bats',
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'headline': 'CYBER',
        'headline2': 'MONDAY',
        'subheadline': 'TECH DEALS',
        'bg_color': (0, 20, 40),
        'bg_color2': (0, 40, 80),
        'accent': (0, 255, 255),
        'text_color': (255, 255, 255),
        'badge_bg': (0, 255, 255),
        'badge_text': (0, 20, 40),
        'cta_bg': (0, 255, 255),
        'cta_text': (0, 20, 40),
        'cta_label': 'TECH DEALS',
        'decoration': 'grid',
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'headline': 'SPRING',
        'headline2': 'SALE',
        'subheadline': 'FRESH ARRIVALS',
        'bg_color': (200, 255, 200),
        'bg_color2': (255, 228, 225),
        'accent': (255, 105, 180),
        'text_color': (0, 100, 0),
        'badge_bg': (255, 105, 180),
        'badge_text': (255, 255, 255),
        'cta_bg': (0, 128, 0),
        'cta_text': (255, 255, 255),
        'cta_label': 'FRESH DEALS',
        'decoration': 'petals',
    },
    'back_to_school': {
        'name': 'Back to School',
        'headline': 'BACK TO',
        'headline2': 'SCHOOL',
        'subheadline': 'STUDENT DEALS',
        'bg_color': (65, 105, 225),
        'bg_color2': (30, 144, 255),
        'accent': (255, 215, 0),
        'text_color': (255, 255, 255),
        'badge_bg': (255, 215, 0),
        'badge_text': (65, 105, 225),
        'cta_bg': (255, 255, 255),
        'cta_text': (65, 105, 225),
        'cta_label': 'LEARN MORE',
        'decoration': 'pencils',
    }
}

SOCIAL_PROOF = {
    'best_seller': 'BEST SELLER',
    'top_rated': 'TOP RATED',
    'limited_edition': 'LIMITED EDITION',
    'trending': 'TRENDING NOW',
    'new_arrival': 'NEW ARRIVAL',
    'editor_choice': "EDITOR'S PICK"
}


# ═══════════════════════════════════════════════════════════════════════════════
# FONT LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def load_font(size):
    """Load font with fallbacks"""
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "C:/Windows/Fonts/arialbd.ttf",
        "C:/Windows/Fonts/arial.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except:
            continue
    return ImageFont.load_default()


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND CREATION - Clean gradient with decorative elements
# ═══════════════════════════════════════════════════════════════════════════════

def create_background(theme, dimensions):
    """Create clean gradient background like Canva"""
    width, height = dimensions
    img = Image.new('RGBA', (width, height))
    draw = ImageDraw.Draw(img)

    c1 = theme['bg_color']
    c2 = theme['bg_color2']

    # Diagonal gradient
    for y in range(height):
        for x in range(width):
            # Diagonal blend
            ratio = (x / width * 0.5 + y / height * 0.5)
            r = int(c1[0] + (c2[0] - c1[0]) * ratio)
            g = int(c1[1] + (c2[1] - c1[1]) * ratio)
            b = int(c1[2] + (c2[2] - c1[2]) * ratio)
            draw.point((x, y), fill=(r, g, b, 255))

    # Add decorative shapes
    accent = theme['accent']

    # Large circle decoration (top right)
    circle_size = int(width * 0.4)
    draw.ellipse([width - circle_size // 2, -circle_size // 3,
                  width + circle_size // 2, circle_size * 2 // 3],
                 fill=(*accent, 30))

    # Small decorative circles
    for _ in range(5):
        cx = random.randint(int(width * 0.6), width - 50)
        cy = random.randint(50, int(height * 0.4))
        size = random.randint(10, 40)
        draw.ellipse([cx - size, cy - size, cx + size, cy + size],
                    fill=(*accent, random.randint(20, 50)))

    return img


# ═══════════════════════════════════════════════════════════════════════════════
# TEXT DRAWING - Bold, Professional
# ═══════════════════════════════════════════════════════════════════════════════

def draw_text_block(image, theme, discount, layout_idx):
    """Draw text on left side - Canva style"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    text_color = theme['text_color']
    accent = theme['accent']

    # Text area: left 45% of canvas
    text_area_width = int(width * 0.45)
    margin_left = int(width * 0.06)

    # Starting Y position
    y = int(height * 0.15)

    # Main headline - VERY LARGE
    headline_size = int(width * 0.12)  # 12% of width = HUGE
    headline_font = load_font(headline_size)

    # Draw headline line 1
    headline1 = theme['headline']
    draw.text((margin_left, y), headline1, font=headline_font, fill=text_color)

    bbox = draw.textbbox((0, 0), headline1, font=headline_font)
    y += bbox[3] - bbox[1] + 5

    # Draw headline line 2 (with accent underline)
    headline2 = theme['headline2']
    draw.text((margin_left, y), headline2, font=headline_font, fill=text_color)

    bbox2 = draw.textbbox((0, 0), headline2, font=headline_font)
    h2_width = bbox2[2] - bbox2[0]
    y += bbox2[3] - bbox2[1]

    # Accent underline
    underline_y = y + 5
    draw.rectangle([margin_left, underline_y, margin_left + h2_width, underline_y + 8],
                  fill=accent)
    y += 30

    # Subheadline
    sub_size = int(width * 0.035)
    sub_font = load_font(sub_size)
    subheadline = theme['subheadline']
    draw.text((margin_left, y), subheadline, font=sub_font, fill=text_color)

    bbox3 = draw.textbbox((0, 0), subheadline, font=sub_font)
    y += bbox3[3] - bbox3[1] + 40

    # CTA Button
    cta_text = theme['cta_label']
    cta_font = load_font(int(width * 0.032))
    cta_bbox = draw.textbbox((0, 0), cta_text, font=cta_font)
    cta_w = cta_bbox[2] - cta_bbox[0] + 50
    cta_h = cta_bbox[3] - cta_bbox[1] + 28

    cta_x = margin_left
    cta_y = y

    # CTA shadow
    draw.rounded_rectangle([cta_x + 3, cta_y + 3, cta_x + cta_w + 3, cta_y + cta_h + 3],
                          radius=8, fill=(0, 0, 0, 50))
    # CTA button
    draw.rounded_rectangle([cta_x, cta_y, cta_x + cta_w, cta_y + cta_h],
                          radius=8, fill=theme['cta_bg'])
    # CTA text
    draw.text((cta_x + 25, cta_y + 12), cta_text, font=cta_font, fill=theme['cta_text'])

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT PLACEMENT - LARGE, Right side
# ═══════════════════════════════════════════════════════════════════════════════

def place_product(background, product_image, theme, layout_idx):
    """Place LARGE product on right side"""
    width, height = background.size

    # Product should be LARGE - 55% of canvas height
    product_max_h = int(height * 0.55)
    product_max_w = int(width * 0.50)

    # Scale product
    ratio = min(product_max_w / product_image.width, product_max_h / product_image.height)
    new_w = int(product_image.width * ratio)
    new_h = int(product_image.height * ratio)

    product_resized = product_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Position: Right side, vertically centered
    product_x = width - new_w - int(width * 0.05)  # 5% margin from right
    product_y = (height - new_h) // 2

    # Create shadow
    shadow_size = 25
    shadow = Image.new('RGBA', (new_w + shadow_size*2, new_h + shadow_size*2), (0, 0, 0, 0))

    if product_resized.mode == 'RGBA':
        alpha = product_resized.split()[3]
        shadow_base = Image.new('RGBA', product_resized.size, (0, 0, 0, 60))
        shadow_base.putalpha(alpha)
        shadow.paste(shadow_base, (shadow_size + 10, shadow_size + 15), shadow_base)
        shadow = shadow.filter(ImageFilter.GaussianBlur(shadow_size))
        background.paste(shadow, (product_x - shadow_size, product_y - shadow_size), shadow)

    # Paste product (no white frame - looks more professional)
    if product_resized.mode == 'RGBA':
        background.paste(product_resized, (product_x, product_y), product_resized)
    else:
        background.paste(product_resized, (product_x, product_y))

    return background, (product_x, product_y, new_w, new_h)


# ═══════════════════════════════════════════════════════════════════════════════
# DISCOUNT BADGE - Prominent circle
# ═══════════════════════════════════════════════════════════════════════════════

def draw_discount_badge(image, discount, theme, product_bounds):
    """Draw prominent discount badge near product"""
    if not discount:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size
    px, py, pw, ph = product_bounds

    # Badge size - prominent but not overwhelming
    badge_size = int(min(width, height) * 0.14)

    # Position: overlapping product top-left
    badge_x = px - badge_size // 3
    badge_y = py - badge_size // 4

    # Ensure badge stays in bounds
    badge_x = max(20, badge_x)
    badge_y = max(20, badge_y)

    badge_bg = theme['badge_bg']
    badge_text_color = theme['badge_text']

    # Shadow
    draw.ellipse([badge_x + 4, badge_y + 4,
                  badge_x + badge_size + 4, badge_y + badge_size + 4],
                fill=(0, 0, 0, 60))

    # Main badge
    draw.ellipse([badge_x, badge_y, badge_x + badge_size, badge_y + badge_size],
                fill=badge_bg)

    # Highlight
    highlight_size = badge_size * 0.7
    draw.ellipse([badge_x + 5, badge_y + 5,
                  badge_x + highlight_size, badge_y + highlight_size * 0.6],
                fill=(255, 255, 255, 70))

    # Text
    badge_text = f"{discount}%"
    text_size = int(badge_size * 0.32)
    font = load_font(text_size)

    bbox = draw.textbbox((0, 0), badge_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    text_x = badge_x + (badge_size - text_w) // 2
    text_y = badge_y + (badge_size - text_h) // 2 - 8

    draw.text((text_x, text_y), badge_text, font=font, fill=badge_text_color)

    # "OFF" text below
    off_size = int(badge_size * 0.18)
    off_font = load_font(off_size)
    off_bbox = draw.textbbox((0, 0), "OFF", font=off_font)
    off_w = off_bbox[2] - off_bbox[0]

    draw.text((badge_x + (badge_size - off_w) // 2, text_y + text_h + 2),
              "OFF", font=off_font, fill=badge_text_color)

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# SOCIAL PROOF BADGE
# ═══════════════════════════════════════════════════════════════════════════════

def draw_social_proof(image, badge_type, theme):
    """Draw social proof badge at top"""
    if badge_type not in SOCIAL_PROOF:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    text = SOCIAL_PROOF[badge_type]
    font = load_font(int(width * 0.022))

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    badge_w = text_w + 30
    badge_h = text_h + 16

    x = width - badge_w - 30
    y = 25

    # Background
    draw.rounded_rectangle([x, y, x + badge_w, y + badge_h],
                          radius=badge_h // 2, fill=theme['accent'])

    # Text
    draw.text((x + 15, y + 7), text, font=font, fill=theme['badge_text'])

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# TRUST BADGES
# ═══════════════════════════════════════════════════════════════════════════════

def draw_trust_badges(image, theme, options):
    """Draw trust badges at bottom left"""
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
        badges.append(f"{options.get('soldCount', '1000+')} Sold")

    if not badges:
        return image

    font = load_font(int(width * 0.02))
    margin_left = int(width * 0.06)
    y = height - 50

    x = margin_left
    for text in badges:
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0] + 20

        draw.rounded_rectangle([x, y, x + w, y + 26], radius=4, fill=(0, 0, 0, 150))
        draw.text((x + 10, y + 5), text, font=font, fill=(255, 255, 255))
        x += w + 10

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRICE TAG
# ═══════════════════════════════════════════════════════════════════════════════

def draw_price_tag(image, theme, orig_price, sale_price, product_bounds):
    """Draw price tag near product"""
    if not orig_price and not sale_price:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size
    px, py, pw, ph = product_bounds

    price_font = load_font(int(width * 0.04))
    small_font = load_font(int(width * 0.02))

    if sale_price and orig_price:
        main_text = f"${sale_price}"
        strike_text = f"${orig_price}"
    else:
        main_text = f"${orig_price or sale_price}"
        strike_text = None

    bbox = draw.textbbox((0, 0), main_text, font=price_font)
    main_w = bbox[2] - bbox[0]

    tag_w = main_w + 40
    tag_h = 70 if strike_text else 50

    # Position below product
    x = px + (pw - tag_w) // 2
    y = py + ph + 15

    # Background
    draw.rounded_rectangle([x, y, x + tag_w, y + tag_h], radius=10, fill=(0, 0, 0, 200))

    if strike_text:
        bbox2 = draw.textbbox((0, 0), strike_text, font=small_font)
        sw = bbox2[2] - bbox2[0]
        sx = x + (tag_w - sw) // 2
        draw.text((sx, y + 8), strike_text, font=small_font, fill=(180, 180, 180))
        draw.line([(sx - 2, y + 18), (sx + sw + 2, y + 18)], fill=(180, 180, 180), width=1)
        draw.text((x + (tag_w - main_w) // 2, y + 28), main_text, font=price_font, fill=theme['accent'])
    else:
        draw.text((x + (tag_w - main_w) // 2, y + (tag_h - 40) // 2 + 5),
                  main_text, font=price_font, fill=(255, 255, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_creative_v7(image_data, theme_name, discount, aspect_ratio, layout_idx, options):
    """Main v7 generation - Canva-quality output"""
    theme = THEMES.get(theme_name, THEMES['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])

    print(f"\n   ═══════════════════════════════════════")
    print(f"   🎨 CREATIVE v7.0 - {theme['name']}")
    print(f"   Layout: {layout_idx + 1}")
    print(f"   ═══════════════════════════════════════")

    # Decode product
    if 'base64,' in image_data:
        b64 = image_data.split('base64,')[1]
    else:
        b64 = image_data

    product_bytes = base64.b64decode(b64)
    product_image = Image.open(io.BytesIO(product_bytes)).convert('RGBA')

    # Step 1: Create background
    print("   📍 Step 1: Background")
    background = create_background(theme, dimensions)

    # Step 2: Draw text block (left side)
    print("   📍 Step 2: Text")
    background = draw_text_block(background, theme, discount, layout_idx)

    # Step 3: Place LARGE product (right side)
    print("   📍 Step 3: Product (LARGE)")
    composite, product_bounds = place_product(background, product_image, theme, layout_idx)

    # Step 4: Discount badge
    print("   📍 Step 4: Badge")
    if discount:
        composite = draw_discount_badge(composite, discount, theme, product_bounds)

    # Step 5: Social proof
    if options.get('showSocialProof', False):
        composite = draw_social_proof(composite, options.get('socialProofType', 'best_seller'), theme)

    # Step 6: Price tag
    if options.get('showPriceTag', False):
        composite = draw_price_tag(composite, theme,
                                   options.get('originalPrice', ''),
                                   options.get('salePrice', ''),
                                   product_bounds)

    # Step 7: Trust badges
    composite = draw_trust_badges(composite, theme, options)

    # Convert to base64
    buffer = io.BytesIO()
    composite = composite.convert('RGB')
    composite.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    result = base64.b64encode(buffer.getvalue()).decode('utf-8')

    print(f"   ✅ Layout {layout_idx + 1} complete")
    return f"data:image/png;base64,{result}"


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
            }

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO v7.0 - CANVA QUALITY")
            print(f"   Theme: {theme}, Discount: {discount}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            generated = []
            for i in range(output_count):
                print(f"\n📸 Generating {i+1}/{output_count}...")
                result = generate_creative_v7(image_data, theme, discount, aspect_ratio, i, options)
                if result:
                    generated.append(result)

            if generated:
                print(f"\n✅ Generated {len(generated)} Canva-quality creatives")
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'images': generated,
                    'theme': theme
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
            self.wfile.write(json.dumps({'success': False, 'error': str(e)}).encode())
