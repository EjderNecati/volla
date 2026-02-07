"""
Creative Studio Mode - PROFESSIONAL AD GENERATOR v5.0
=================================================================
Complete rewrite focused on OUTPUT QUALITY over features.

DESIGN PHILOSOPHY:
- Clean, minimalist backgrounds (PIL-generated, not AI)
- Modern badge designs (pill shapes, subtle gradients)
- Professional typography
- Proper composition (rule of thirds, breathing room)
- Subtle effects (no sparkle bombardment)
- Premium product integration

Product is 100% preserved - we never modify the product image.
"""

import os
import io
import json
import base64
import traceback
import random
import math
from http.server import BaseHTTPRequestHandler
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

print("=" * 60)
print("🎨 Creative Studio v5.0 - PROFESSIONAL Ad Generator")
print("=" * 60)

# Get credentials
GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("VERTEX_API_KEY") or os.environ.get("GOOGLE_API_KEY")

_last_errors = []

# ═══════════════════════════════════════════════════════════════════════════════
# ASPECT RATIO DIMENSIONS
# ═══════════════════════════════════════════════════════════════════════════════

ASPECT_DIMENSIONS = {
    '1:1': (1080, 1080),
    '4:5': (1080, 1350),
    '9:16': (1080, 1920)
}

# ═══════════════════════════════════════════════════════════════════════════════
# MODERN THEME CONFIGURATIONS - Clean, Professional
# ═══════════════════════════════════════════════════════════════════════════════

THEMES = {
    'black_friday': {
        'name': 'Black Friday',
        'bg_gradient': [(15, 15, 18), (25, 25, 30)],
        'accent': (255, 215, 0),  # Gold
        'accent_dark': (218, 165, 32),
        'text_primary': (255, 255, 255),
        'text_secondary': (180, 180, 180),
        'badge_bg': (255, 215, 0),
        'badge_text': (0, 0, 0),
        'cta_bg': (255, 215, 0),
        'cta_text': (0, 0, 0),
        'cta_label': 'SHOP NOW',
        'glow_color': (255, 215, 0, 30),
        'pattern': 'diagonal_lines'
    },
    'valentines': {
        'name': "Valentine's Day",
        'bg_gradient': [(255, 240, 245), (255, 220, 230)],
        'accent': (219, 39, 119),  # Pink
        'accent_dark': (190, 24, 93),
        'text_primary': (60, 30, 40),
        'text_secondary': (120, 80, 90),
        'badge_bg': (219, 39, 119),
        'badge_text': (255, 255, 255),
        'cta_bg': (219, 39, 119),
        'cta_text': (255, 255, 255),
        'cta_label': 'GIFT NOW',
        'glow_color': (219, 39, 119, 25),
        'pattern': 'none'
    },
    'christmas': {
        'name': 'Christmas',
        'bg_gradient': [(25, 45, 35), (45, 25, 25)],
        'accent': (255, 215, 0),  # Gold
        'accent_dark': (200, 160, 0),
        'text_primary': (255, 255, 255),
        'text_secondary': (200, 200, 200),
        'badge_bg': (180, 30, 30),
        'badge_text': (255, 255, 255),
        'cta_bg': (34, 139, 34),
        'cta_text': (255, 255, 255),
        'cta_label': 'GET YOURS',
        'glow_color': (255, 215, 0, 25),
        'pattern': 'none'
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'bg_gradient': [(0, 180, 216), (255, 200, 87)],
        'accent': (255, 107, 53),  # Orange
        'accent_dark': (220, 80, 30),
        'text_primary': (255, 255, 255),
        'text_secondary': (255, 255, 255, 200),
        'badge_bg': (255, 107, 53),
        'badge_text': (255, 255, 255),
        'cta_bg': (255, 255, 255),
        'cta_text': (0, 150, 180),
        'cta_label': 'COOL DEALS',
        'glow_color': (255, 255, 255, 40),
        'pattern': 'none'
    },
    'new_year': {
        'name': 'New Year',
        'bg_gradient': [(10, 15, 40), (25, 25, 60)],
        'accent': (255, 215, 0),  # Gold
        'accent_dark': (200, 170, 0),
        'text_primary': (255, 255, 255),
        'text_secondary': (180, 180, 200),
        'badge_bg': (255, 215, 0),
        'badge_text': (20, 20, 50),
        'cta_bg': (255, 215, 0),
        'cta_text': (20, 20, 50),
        'cta_label': 'CELEBRATE',
        'glow_color': (255, 215, 0, 30),
        'pattern': 'subtle_sparkle'
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'bg_gradient': [(220, 38, 38), (239, 68, 68)],
        'accent': (255, 235, 59),  # Yellow
        'accent_dark': (230, 210, 40),
        'text_primary': (255, 255, 255),
        'text_secondary': (255, 255, 255, 200),
        'badge_bg': (255, 235, 59),
        'badge_text': (180, 30, 30),
        'cta_bg': (255, 255, 255),
        'cta_text': (220, 38, 38),
        'cta_label': 'BUY NOW',
        'glow_color': (255, 235, 59, 40),
        'pattern': 'none'
    },
    'mothers_day': {
        'name': "Mother's Day",
        'bg_gradient': [(245, 230, 245), (255, 220, 235)],
        'accent': (147, 51, 234),  # Purple
        'accent_dark': (124, 40, 200),
        'text_primary': (60, 30, 60),
        'text_secondary': (100, 70, 100),
        'badge_bg': (147, 51, 234),
        'badge_text': (255, 255, 255),
        'cta_bg': (219, 39, 119),
        'cta_text': (255, 255, 255),
        'cta_label': 'FOR MOM',
        'glow_color': (147, 51, 234, 25),
        'pattern': 'none'
    },
    'easter': {
        'name': 'Easter',
        'bg_gradient': [(240, 253, 244), (254, 243, 199)],
        'accent': (74, 222, 128),  # Green
        'accent_dark': (34, 197, 94),
        'text_primary': (40, 60, 40),
        'text_secondary': (80, 100, 80),
        'badge_bg': (251, 191, 36),
        'badge_text': (60, 40, 0),
        'cta_bg': (74, 222, 128),
        'cta_text': (255, 255, 255),
        'cta_label': 'SPRING DEALS',
        'glow_color': (74, 222, 128, 30),
        'pattern': 'none'
    },
    'halloween': {
        'name': 'Halloween',
        'bg_gradient': [(20, 10, 30), (40, 20, 50)],
        'accent': (249, 115, 22),  # Orange
        'accent_dark': (234, 88, 12),
        'text_primary': (255, 255, 255),
        'text_secondary': (200, 180, 200),
        'badge_bg': (249, 115, 22),
        'badge_text': (0, 0, 0),
        'cta_bg': (147, 51, 234),
        'cta_text': (255, 255, 255),
        'cta_label': 'SPOOKY DEALS',
        'glow_color': (249, 115, 22, 30),
        'pattern': 'none'
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'bg_gradient': [(10, 15, 25), (20, 30, 50)],
        'accent': (0, 255, 255),  # Cyan
        'accent_dark': (0, 200, 200),
        'text_primary': (255, 255, 255),
        'text_secondary': (150, 200, 220),
        'badge_bg': (0, 255, 255),
        'badge_text': (0, 30, 50),
        'cta_bg': (0, 255, 255),
        'cta_text': (0, 30, 50),
        'cta_label': 'TECH DEALS',
        'glow_color': (0, 255, 255, 30),
        'pattern': 'grid'
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'bg_gradient': [(240, 253, 250), (236, 254, 255)],
        'accent': (20, 184, 166),  # Teal
        'accent_dark': (13, 148, 136),
        'text_primary': (30, 60, 60),
        'text_secondary': (70, 100, 100),
        'badge_bg': (20, 184, 166),
        'badge_text': (255, 255, 255),
        'cta_bg': (244, 114, 182),
        'cta_text': (255, 255, 255),
        'cta_label': 'FRESH DEALS',
        'glow_color': (20, 184, 166, 30),
        'pattern': 'none'
    },
    'back_to_school': {
        'name': 'Back to School',
        'bg_gradient': [(30, 58, 138), (59, 130, 246)],
        'accent': (251, 191, 36),  # Yellow
        'accent_dark': (245, 158, 11),
        'text_primary': (255, 255, 255),
        'text_secondary': (200, 220, 255),
        'badge_bg': (251, 191, 36),
        'badge_text': (30, 50, 100),
        'cta_bg': (255, 255, 255),
        'cta_text': (30, 58, 138),
        'cta_label': 'LEARN MORE',
        'glow_color': (251, 191, 36, 30),
        'pattern': 'none'
    }
}

# Social proof types
SOCIAL_PROOF = {
    'best_seller': {'label': 'BEST SELLER', 'icon': '★'},
    'top_rated': {'label': 'TOP RATED', 'icon': '★'},
    'limited_edition': {'label': 'LIMITED', 'icon': '◆'},
    'trending': {'label': 'TRENDING', 'icon': '↗'},
    'new_arrival': {'label': 'NEW', 'icon': '✦'},
    'editor_choice': {'label': "EDITOR'S PICK", 'icon': '♛'}
}


# ═══════════════════════════════════════════════════════════════════════════════
# FONT LOADING
# ═══════════════════════════════════════════════════════════════════════════════

def load_font(size, bold=True):
    """Load font with fallbacks"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/System/Library/Fonts/Helvetica.ttc",
        "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/arialbd.ttf"
    ]

    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue

    return ImageFont.load_default()


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND GENERATION - Clean, Professional PIL-based
# ═══════════════════════════════════════════════════════════════════════════════

def create_gradient_background(theme_config, dimensions):
    """Create a clean gradient background"""
    width, height = dimensions
    image = Image.new('RGBA', (width, height))
    draw = ImageDraw.Draw(image)

    start_color = theme_config['bg_gradient'][0]
    end_color = theme_config['bg_gradient'][1]

    # Smooth gradient
    for y in range(height):
        ratio = y / height
        r = int(start_color[0] + (end_color[0] - start_color[0]) * ratio)
        g = int(start_color[1] + (end_color[1] - start_color[1]) * ratio)
        b = int(start_color[2] + (end_color[2] - start_color[2]) * ratio)
        draw.line([(0, y), (width, y)], fill=(r, g, b, 255))

    return image


def add_subtle_pattern(image, pattern_type, theme_config):
    """Add subtle background patterns"""
    if pattern_type == 'none':
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size
    accent = theme_config['accent']

    if pattern_type == 'diagonal_lines':
        # Subtle diagonal lines
        for i in range(-height, width + height, 80):
            draw.line([(i, 0), (i + height, height)],
                     fill=(*accent[:3], 8), width=1)

    elif pattern_type == 'grid':
        # Tech grid pattern
        for x in range(0, width, 60):
            draw.line([(x, 0), (x, height)], fill=(*accent[:3], 12), width=1)
        for y in range(0, height, 60):
            draw.line([(0, y), (width, y)], fill=(*accent[:3], 12), width=1)

    elif pattern_type == 'subtle_sparkle':
        # Very subtle sparkles (only a few)
        for _ in range(8):
            x = random.randint(50, width - 50)
            y = random.randint(50, height - 50)
            size = random.randint(2, 4)
            draw.ellipse([x-size, y-size, x+size, y+size],
                        fill=(*accent[:3], random.randint(30, 60)))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT PLACEMENT - Professional Integration
# ═══════════════════════════════════════════════════════════════════════════════

def create_soft_shadow(product_image, blur=30, opacity=80, offset_y=20):
    """Create a professional soft shadow"""
    width, height = product_image.size

    # Create shadow from alpha channel
    if product_image.mode != 'RGBA':
        product_image = product_image.convert('RGBA')

    # Create shadow layer
    shadow = Image.new('RGBA', (width + blur*2, height + blur*2 + offset_y), (0, 0, 0, 0))

    # Get alpha channel and create shadow
    alpha = product_image.split()[3]
    shadow_base = Image.new('RGBA', product_image.size, (0, 0, 0, opacity))
    shadow_base.putalpha(alpha)

    # Paste shadow with offset
    shadow.paste(shadow_base, (blur, blur + offset_y), shadow_base)

    # Blur the shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur))

    return shadow, blur


def create_product_glow(product_image, glow_color, glow_size=40):
    """Create subtle glow around product"""
    if product_image.mode != 'RGBA':
        product_image = product_image.convert('RGBA')

    width, height = product_image.size
    glow = Image.new('RGBA', (width + glow_size*2, height + glow_size*2), (0, 0, 0, 0))

    # Create glow from alpha
    alpha = product_image.split()[3]
    glow_base = Image.new('RGBA', product_image.size, glow_color)
    glow_base.putalpha(alpha)

    glow.paste(glow_base, (glow_size, glow_size), glow_base)
    glow = glow.filter(ImageFilter.GaussianBlur(glow_size))

    return glow


def place_product(background, product_image, theme_config, options, layout_variant):
    """Place product with professional effects"""
    width, height = background.size

    # Product sizing - different for each layout variant
    scale_factors = [0.45, 0.42, 0.48, 0.40, 0.44, 0.46]
    scale = scale_factors[layout_variant % len(scale_factors)]

    product_max = int(min(width, height) * scale)
    ratio = min(product_max / product_image.width, product_max / product_image.height)

    new_w = int(product_image.width * ratio)
    new_h = int(product_image.height * ratio)

    product_resized = product_image.resize((new_w, new_h), Image.Resampling.LANCZOS)

    # Position variants
    positions = [
        (0.5, 0.48),   # Center
        (0.35, 0.50),  # Left
        (0.65, 0.50),  # Right
        (0.5, 0.42),   # Top-center
        (0.5, 0.55),   # Bottom-center
        (0.45, 0.48),  # Slight left
    ]
    pos = positions[layout_variant % len(positions)]

    product_x = int(width * pos[0] - new_w / 2)
    product_y = int(height * pos[1] - new_h / 2)

    # Clamp to safe area
    margin = 40
    product_x = max(margin, min(product_x, width - new_w - margin))
    product_y = max(margin, min(product_y, height - new_h - margin))

    # Add subtle glow if enabled
    if options.get('showProductGlow', True):
        glow_color = theme_config['glow_color']
        glow = create_product_glow(product_resized, glow_color, glow_size=35)
        background.paste(glow, (product_x - 35, product_y - 35), glow)

    # Add soft shadow
    shadow, blur = create_soft_shadow(product_resized, blur=25, opacity=60, offset_y=15)
    background.paste(shadow, (product_x - blur, product_y - blur), shadow)

    # Add white background/frame for product
    frame_padding = 12
    frame = Image.new('RGBA', (new_w + frame_padding*2, new_h + frame_padding*2), (255, 255, 255, 250))
    frame_draw = ImageDraw.Draw(frame)

    # Rounded corners for frame
    radius = 16
    frame_draw.rounded_rectangle([0, 0, new_w + frame_padding*2, new_h + frame_padding*2],
                                  radius=radius, fill=(255, 255, 255, 250))

    background.paste(frame, (product_x - frame_padding, product_y - frame_padding), frame)

    # Paste product
    if product_resized.mode == 'RGBA':
        background.paste(product_resized, (product_x, product_y), product_resized)
    else:
        background.paste(product_resized, (product_x, product_y))

    return background, (product_x, product_y, new_w, new_h)


# ═══════════════════════════════════════════════════════════════════════════════
# MODERN BADGE DESIGN - Pill Shape, Clean
# ═══════════════════════════════════════════════════════════════════════════════

def draw_discount_badge(image, discount, theme_config, position='top_right'):
    """Draw modern pill-shaped discount badge"""
    if not discount:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    badge_text = f"-{discount}%"
    font = load_font(32)

    bbox = draw.textbbox((0, 0), badge_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    # Pill dimensions
    padding_x = 24
    padding_y = 14
    badge_w = text_w + padding_x * 2
    badge_h = text_h + padding_y * 2

    # Position
    margin = 30
    positions = {
        'top_right': (width - badge_w - margin, margin),
        'top_left': (margin, margin),
        'top_center': ((width - badge_w) / 2, margin)
    }
    x, y = positions.get(position, positions['top_right'])

    # Shadow
    shadow_offset = 4
    draw.rounded_rectangle(
        [x + shadow_offset, y + shadow_offset, x + badge_w + shadow_offset, y + badge_h + shadow_offset],
        radius=badge_h // 2,
        fill=(0, 0, 0, 40)
    )

    # Main badge
    badge_color = theme_config['badge_bg']
    draw.rounded_rectangle(
        [x, y, x + badge_w, y + badge_h],
        radius=badge_h // 2,
        fill=badge_color
    )

    # Subtle highlight
    draw.rounded_rectangle(
        [x + 2, y + 2, x + badge_w - 4, y + badge_h // 2],
        radius=badge_h // 4,
        fill=(*badge_color[:3], 80) if len(badge_color) == 3 else (255, 255, 255, 40)
    )

    # Text
    text_color = theme_config['badge_text']
    text_x = x + (badge_w - text_w) / 2
    text_y = y + (badge_h - text_h) / 2 - 2
    draw.text((text_x, text_y), badge_text, font=font, fill=text_color)

    return image


def draw_social_proof_badge(image, badge_type, theme_config, position='top_left'):
    """Draw modern social proof badge"""
    if badge_type not in SOCIAL_PROOF:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    badge_info = SOCIAL_PROOF[badge_type]
    label = badge_info['label']
    icon = badge_info['icon']

    font = load_font(14)
    icon_font = load_font(12)

    full_text = f"{icon} {label}"
    bbox = draw.textbbox((0, 0), full_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    padding_x = 16
    padding_y = 10
    badge_w = text_w + padding_x * 2
    badge_h = text_h + padding_y * 2

    margin = 30
    x = margin
    y = margin + 80  # Below discount badge

    # Dark semi-transparent background
    draw.rounded_rectangle(
        [x, y, x + badge_w, y + badge_h],
        radius=6,
        fill=(0, 0, 0, 180)
    )

    # Text
    text_x = x + padding_x
    text_y = y + padding_y - 2
    draw.text((text_x, text_y), full_text, font=font, fill=(255, 255, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# CTA BUTTON - Modern, Clean
# ═══════════════════════════════════════════════════════════════════════════════

def draw_cta_button(image, theme_config, custom_text=None, position='bottom_center'):
    """Draw modern CTA button"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    cta_text = custom_text if custom_text else theme_config['cta_label']
    font = load_font(18)

    bbox = draw.textbbox((0, 0), cta_text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    padding_x = 32
    padding_y = 16
    btn_w = text_w + padding_x * 2
    btn_h = text_h + padding_y * 2

    margin = 40
    positions = {
        'bottom_center': ((width - btn_w) / 2, height - btn_h - margin),
        'bottom_right': (width - btn_w - margin, height - btn_h - margin),
        'bottom_left': (margin, height - btn_h - margin)
    }
    x, y = positions.get(position, positions['bottom_center'])

    # Shadow
    shadow_offset = 4
    draw.rounded_rectangle(
        [x + shadow_offset, y + shadow_offset, x + btn_w + shadow_offset, y + btn_h + shadow_offset],
        radius=btn_h // 2,
        fill=(0, 0, 0, 50)
    )

    # Button background
    btn_color = theme_config['cta_bg']
    draw.rounded_rectangle(
        [x, y, x + btn_w, y + btn_h],
        radius=btn_h // 2,
        fill=btn_color
    )

    # Highlight
    draw.rounded_rectangle(
        [x + 3, y + 3, x + btn_w - 6, y + btn_h // 2],
        radius=btn_h // 4,
        fill=(255, 255, 255, 50)
    )

    # Text
    text_color = theme_config['cta_text']
    text_x = x + (btn_w - text_w) / 2
    text_y = y + (btn_h - text_h) / 2 - 2
    draw.text((text_x, text_y), cta_text, font=font, fill=text_color)

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# TRUST BADGES - Minimal, Clean
# ═══════════════════════════════════════════════════════════════════════════════

def draw_trust_badges(image, theme_config, options):
    """Draw minimal trust badges"""
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

    font = load_font(12)
    margin = 30
    y = height - 35

    # Calculate total width
    total_width = 0
    badge_data = []
    for badge_text in badges:
        bbox = draw.textbbox((0, 0), badge_text, font=font)
        w = bbox[2] - bbox[0] + 20
        badge_data.append((badge_text, w))
        total_width += w + 8

    # Center the badges
    x = (width - total_width) / 2

    for badge_text, badge_w in badge_data:
        # Background
        draw.rounded_rectangle(
            [x, y, x + badge_w, y + 24],
            radius=4,
            fill=(0, 0, 0, 150)
        )

        # Text
        bbox = draw.textbbox((0, 0), badge_text, font=font)
        text_w = bbox[2] - bbox[0]
        draw.text((x + (badge_w - text_w) / 2, y + 5), badge_text, font=font, fill=(255, 255, 255))

        x += badge_w + 8

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRICE TAG - Clean Design
# ═══════════════════════════════════════════════════════════════════════════════

def draw_price_tag(image, theme_config, original_price, sale_price, position='bottom_right'):
    """Draw clean price tag"""
    if not original_price and not sale_price:
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    price_font = load_font(28)
    small_font = load_font(14)

    # Determine display
    if sale_price and original_price:
        main_text = f"${sale_price}"
        strike_text = f"${original_price}"
    else:
        main_text = f"${original_price or sale_price}"
        strike_text = None

    bbox = draw.textbbox((0, 0), main_text, font=price_font)
    main_w = bbox[2] - bbox[0]
    main_h = bbox[3] - bbox[1]

    tag_w = main_w + 40
    tag_h = 70 if strike_text else 50

    margin = 30
    x = width - tag_w - margin
    y = height - tag_h - 70

    # Background
    draw.rounded_rectangle(
        [x, y, x + tag_w, y + tag_h],
        radius=12,
        fill=(0, 0, 0, 200)
    )

    if strike_text:
        # Original price with strikethrough
        bbox2 = draw.textbbox((0, 0), strike_text, font=small_font)
        strike_w = bbox2[2] - bbox2[0]
        strike_x = x + (tag_w - strike_w) / 2
        draw.text((strike_x, y + 8), strike_text, font=small_font, fill=(180, 180, 180))
        draw.line([(strike_x - 2, y + 18), (strike_x + strike_w + 2, y + 18)],
                  fill=(180, 180, 180), width=1)

        # Sale price
        draw.text((x + (tag_w - main_w) / 2, y + 28), main_text, font=price_font,
                  fill=theme_config['accent'])
    else:
        draw.text((x + (tag_w - main_w) / 2, y + (tag_h - main_h) / 2),
                  main_text, font=price_font, fill=(255, 255, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# URGENCY TIMER - Minimal
# ═══════════════════════════════════════════════════════════════════════════════

def draw_urgency_timer(image, theme_config, options):
    """Draw minimal urgency timer"""
    if not options.get('showUrgency', False):
        return image

    draw = ImageDraw.Draw(image)
    width, height = image.size

    hours = options.get('timerHours', 6)
    mins = options.get('timerMinutes', 30)

    timer_text = f"⏱ {hours:02d}:{mins:02d}:00"
    font = load_font(14)

    bbox = draw.textbbox((0, 0), timer_text, font=font)
    text_w = bbox[2] - bbox[0]

    x = (width - text_w - 24) / 2
    y = 30

    # Background
    draw.rounded_rectangle(
        [x, y, x + text_w + 24, y + 28],
        radius=14,
        fill=(220, 38, 38, 220)
    )

    draw.text((x + 12, y + 6), timer_text, font=font, fill=(255, 255, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN GENERATION PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_creative_v5(image_data, theme, discount, custom_note, aspect_ratio, layout_index, options):
    """Main v5 generation pipeline - focused on quality"""
    global _last_errors

    theme_config = THEMES.get(theme, THEMES['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])

    print(f"\n   ═══════════════════════════════════════")
    print(f"   🎨 CREATIVE v5.0 - Layout {layout_index + 1}")
    print(f"   Theme: {theme_config['name']}")
    print(f"   ═══════════════════════════════════════")

    # Decode product image
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    product_bytes = base64.b64decode(base64_clean)
    product_image = Image.open(io.BytesIO(product_bytes)).convert('RGBA')

    # Step 1: Create clean gradient background
    print("   📍 Step 1: Creating background...")
    background = create_gradient_background(theme_config, dimensions)

    # Step 2: Add subtle pattern
    pattern = theme_config.get('pattern', 'none')
    background = add_subtle_pattern(background, pattern, theme_config)

    # Step 3: Place product
    print("   📍 Step 2: Placing product...")
    composite, product_bounds = place_product(background, product_image, theme_config, options, layout_index)

    # Step 4: Add discount badge
    print("   📍 Step 3: Adding elements...")
    if discount:
        badge_positions = ['top_right', 'top_left', 'top_right', 'top_center', 'top_right', 'top_left']
        composite = draw_discount_badge(composite, discount, theme_config,
                                        badge_positions[layout_index % len(badge_positions)])

    # Step 5: Add social proof
    if options.get('showSocialProof', False):
        composite = draw_social_proof_badge(composite, options.get('socialProofType', 'best_seller'),
                                            theme_config)

    # Step 6: Add urgency timer
    composite = draw_urgency_timer(composite, theme_config, options)

    # Step 7: Add price tag
    if options.get('showPriceTag', False):
        composite = draw_price_tag(composite, theme_config,
                                   options.get('originalPrice', ''),
                                   options.get('salePrice', ''))

    # Step 8: Add trust badges
    composite = draw_trust_badges(composite, theme_config, options)

    # Step 9: Add CTA button
    cta_positions = ['bottom_center', 'bottom_right', 'bottom_left', 'bottom_center', 'bottom_center', 'bottom_right']
    composite = draw_cta_button(composite, theme_config,
                                options.get('ctaText', '') or None,
                                cta_positions[layout_index % len(cta_positions)])

    # Convert to base64
    buffer = io.BytesIO()
    composite = composite.convert('RGB')
    composite.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    result_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    print(f"   ✅ Layout {layout_index + 1} complete")
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

            # v5 options
            options = {
                'showTrustBadges': data.get('showTrustBadges', True),
                'showRating': data.get('showRating', True),
                'showShipping': data.get('showShipping', True),
                'showSoldCount': data.get('showSoldCount', False),
                'soldCount': data.get('soldCount', '1000+'),
                'rating': data.get('rating', 4.9),
                'showUrgency': data.get('showUrgency', False),
                'timerHours': data.get('timerHours', 6),
                'timerMinutes': data.get('timerMinutes', 30),
                'stockLeft': data.get('stockLeft', 5),
                'showProductGlow': data.get('showProductGlow', True),
                'showSocialProof': data.get('showSocialProof', False),
                'socialProofType': data.get('socialProofType', 'best_seller'),
                'showPriceTag': data.get('showPriceTag', False),
                'originalPrice': data.get('originalPrice', ''),
                'salePrice': data.get('salePrice', ''),
                'ctaText': data.get('ctaText', '')
            }

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO v5.0 - Professional Ad Generator")
            print(f"   Theme: {theme}")
            print(f"   Discount: {discount}")
            print(f"   Output Count: {output_count}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            generated_images = []

            for i in range(output_count):
                print(f"\n📸 Generating image {i+1}/{output_count}...")

                result = generate_creative_v5(
                    image_data=image_data,
                    theme=theme,
                    discount=discount,
                    custom_note=custom_note,
                    aspect_ratio=aspect_ratio,
                    layout_index=i,
                    options=options
                )

                if result:
                    generated_images.append(result)

            if generated_images:
                print(f"\n✅ Generated {len(generated_images)} professional creatives")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                self.wfile.write(json.dumps({
                    'success': True,
                    'images': generated_images,
                    'output_count': len(generated_images),
                    'theme': theme,
                    'method_used': 'Creative Studio v5.0 - Professional'
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
                'error': str(e),
                'method_used': 'Error'
            }).encode())
