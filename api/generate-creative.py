"""
Creative Studio Mode - ULTIMATE AD CREATIVE GENERATOR v4.0
=================================================================
The most comprehensive promotional image generator with:

CORE FEATURES:
1. 6 Layout Variations - Different compositions per output
2. 12 Theme Presets - Holiday and sale themes
3. Premium Badge System - 8 styles with 3D effects

NEW IN v4.0:
4. AI Product Detection - Auto-detect category for smart styling
5. Social Proof Badges - Best Seller, Top Rated, Limited Edition
6. Price Tag Element - Professional price display
7. Brand Color System - Custom brand colors
8. Seasonal Decorations - Theme-specific decorative elements
9. Multiple CTA Styles - Pill, rounded, sharp, gradient
10. Outlined Text Effects - Professional typography
11. Perspective Shadows - Realistic product shadows
12. Dynamic Inputs - Custom rating, sold count, timer

Product is 100% preserved - we never ask AI to modify it.
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
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps, ImageEnhance

print("=" * 60)
print("🎨 Creative Studio v4.0 - ULTIMATE Ad Generator")
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
# LAYOUT VARIATIONS - 6 Different Compositions
# ═══════════════════════════════════════════════════════════════════════════════

LAYOUT_VARIATIONS = [
    {
        'id': 'center_classic',
        'name': 'Classic Center',
        'product_position': (0.5, 0.48),
        'product_scale': 0.42,
        'badge_position': 'top_right',
        'cta_position': 'bottom_center',
        'headline_position': 'top_left',
        'trust_position': 'bottom_left',
        'urgency_position': 'top_center',
        'price_position': 'bottom_right',
        'social_proof_position': 'top_left'
    },
    {
        'id': 'left_hero',
        'name': 'Left Hero',
        'product_position': (0.32, 0.5),
        'product_scale': 0.45,
        'badge_position': 'top_right',
        'cta_position': 'bottom_right',
        'headline_position': 'top_right',
        'trust_position': 'bottom_right',
        'urgency_position': 'top_center',
        'price_position': 'right_center',
        'social_proof_position': 'top_right'
    },
    {
        'id': 'right_showcase',
        'name': 'Right Showcase',
        'product_position': (0.68, 0.5),
        'product_scale': 0.45,
        'badge_position': 'top_left',
        'cta_position': 'bottom_left',
        'headline_position': 'top_left',
        'trust_position': 'bottom_left',
        'urgency_position': 'top_center',
        'price_position': 'left_center',
        'social_proof_position': 'top_left'
    },
    {
        'id': 'top_feature',
        'name': 'Top Feature',
        'product_position': (0.5, 0.38),
        'product_scale': 0.40,
        'badge_position': 'top_right',
        'cta_position': 'bottom_center',
        'headline_position': 'bottom_left',
        'trust_position': 'bottom_right',
        'urgency_position': 'top_left',
        'price_position': 'bottom_center',
        'social_proof_position': 'top_left'
    },
    {
        'id': 'bottom_anchor',
        'name': 'Bottom Anchor',
        'product_position': (0.5, 0.55),
        'product_scale': 0.44,
        'badge_position': 'top_center',
        'cta_position': 'top_left',
        'headline_position': 'top_right',
        'trust_position': 'bottom_center',
        'urgency_position': 'top_center',
        'price_position': 'top_right',
        'social_proof_position': 'top_left'
    },
    {
        'id': 'dynamic_diagonal',
        'name': 'Dynamic Diagonal',
        'product_position': (0.42, 0.48),
        'product_scale': 0.43,
        'badge_position': 'top_right',
        'cta_position': 'bottom_right',
        'headline_position': 'top_left',
        'trust_position': 'bottom_left',
        'urgency_position': 'top_center',
        'price_position': 'bottom_right',
        'social_proof_position': 'top_left'
    }
]

# ═══════════════════════════════════════════════════════════════════════════════
# CTA BUTTON STYLES
# ═══════════════════════════════════════════════════════════════════════════════

CTA_STYLES = {
    'pill': {'radius_factor': 0.5, 'padding_x': 45, 'padding_y': 18},
    'rounded': {'radius_factor': 0.25, 'padding_x': 40, 'padding_y': 16},
    'sharp': {'radius_factor': 0.1, 'padding_x': 35, 'padding_y': 14},
    'wide': {'radius_factor': 0.5, 'padding_x': 60, 'padding_y': 20}
}

# ═══════════════════════════════════════════════════════════════════════════════
# SOCIAL PROOF BADGES
# ═══════════════════════════════════════════════════════════════════════════════

SOCIAL_PROOF_TYPES = {
    'best_seller': {'text': 'BEST SELLER', 'icon': '🏆', 'color': '#FFD700'},
    'top_rated': {'text': 'TOP RATED', 'icon': '⭐', 'color': '#FF6B35'},
    'limited_edition': {'text': 'LIMITED EDITION', 'icon': '💎', 'color': '#9C27B0'},
    'trending': {'text': 'TRENDING', 'icon': '🔥', 'color': '#F44336'},
    'new_arrival': {'text': 'NEW ARRIVAL', 'icon': '✨', 'color': '#4CAF50'},
    'editor_choice': {'text': "EDITOR'S CHOICE", 'icon': '👑', 'color': '#2196F3'}
}

# ═══════════════════════════════════════════════════════════════════════════════
# SEASONAL DECORATIONS
# ═══════════════════════════════════════════════════════════════════════════════

def draw_snowflakes(image, count=20):
    """Draw snowflake decorations for Christmas/Winter themes"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    for _ in range(count):
        x = random.randint(0, width)
        y = random.randint(0, height // 3)
        size = random.randint(3, 12)
        opacity = random.randint(100, 200)

        # Draw 6-point snowflake
        for i in range(6):
            angle = i * math.pi / 3
            x2 = x + size * math.cos(angle)
            y2 = y + size * math.sin(angle)
            draw.line([(x, y), (x2, y2)], fill=(255, 255, 255, opacity), width=1)


def draw_hearts(image, count=15):
    """Draw heart decorations for Valentine's themes"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    for _ in range(count):
        cx = random.randint(50, width - 50)
        cy = random.randint(50, height - 50)
        size = random.randint(8, 25)
        opacity = random.randint(60, 150)

        # Simple heart shape
        points = []
        for t in range(0, 360, 10):
            rad = math.radians(t)
            hx = size * 0.3 * (16 * math.sin(rad)**3) / 16
            hy = -size * 0.3 * (13 * math.cos(rad) - 5 * math.cos(2*rad) - 2 * math.cos(3*rad) - math.cos(4*rad)) / 16
            points.append((cx + hx, cy + hy))

        if len(points) > 2:
            draw.polygon(points, fill=(255, 100, 150, opacity))


def draw_confetti(image, count=30):
    """Draw confetti for celebration themes"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    colors = [
        (255, 215, 0),   # Gold
        (255, 100, 100), # Red
        (100, 200, 255), # Blue
        (150, 255, 150), # Green
        (255, 150, 255), # Pink
        (255, 200, 100)  # Orange
    ]

    for _ in range(count):
        x = random.randint(0, width)
        y = random.randint(0, height // 2)
        w = random.randint(3, 8)
        h = random.randint(8, 20)
        angle = random.randint(-45, 45)
        color = random.choice(colors)
        opacity = random.randint(150, 255)

        # Rotated rectangle (simplified as line)
        draw.rectangle([x, y, x + w, y + h], fill=(*color, opacity))


def draw_sparkle_stars(image, count=25):
    """Draw sparkle stars for luxury themes"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    for _ in range(count):
        x = random.randint(20, width - 20)
        y = random.randint(20, height - 20)
        size = random.randint(4, 15)
        opacity = random.randint(150, 255)

        # 4-point star
        points = []
        for i in range(8):
            angle = i * math.pi / 4 - math.pi / 2
            r = size if i % 2 == 0 else size * 0.3
            px = x + r * math.cos(angle)
            py = y + r * math.sin(angle)
            points.append((px, py))

        draw.polygon(points, fill=(255, 255, 255, opacity))


def draw_pumpkins(image, count=5):
    """Draw small pumpkin decorations for Halloween"""
    draw = ImageDraw.Draw(image)
    width, height = image.size

    for _ in range(count):
        x = random.randint(50, width - 50)
        y = random.randint(height - 150, height - 50)
        size = random.randint(15, 30)

        # Simple pumpkin
        draw.ellipse([x - size, y - size*0.8, x + size, y + size*0.8],
                    fill=(255, 140, 0, 200))
        # Stem
        draw.rectangle([x - 3, y - size - 8, x + 3, y - size + 2],
                      fill=(100, 80, 50, 255))


def apply_seasonal_decorations(image, theme):
    """Apply theme-specific seasonal decorations"""
    theme_decorations = {
        'christmas': lambda img: draw_snowflakes(img, 25),
        'valentines': lambda img: draw_hearts(img, 20),
        'mothers_day': lambda img: draw_hearts(img, 15),
        'new_year': lambda img: draw_confetti(img, 35),
        'black_friday': lambda img: draw_sparkle_stars(img, 20),
        'cyber_monday': lambda img: draw_sparkle_stars(img, 15),
        'halloween': lambda img: draw_pumpkins(img, 4),
        'flash_sale': lambda img: draw_sparkle_stars(img, 18)
    }

    if theme in theme_decorations:
        theme_decorations[theme](image)

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# THEME CONFIGURATIONS - Enhanced with all v4.0 features
# ═══════════════════════════════════════════════════════════════════════════════

THEME_BACKGROUNDS = {
    'black_friday': {
        'name': 'Black Friday',
        'prompt': 'Ultra premium Black Friday sale background. Luxurious black velvet texture with elegant gold sparkles and shimmer effects scattered around edges. Rich dark gradient. High-end fashion photography backdrop. 8K quality, professional studio lighting. Empty center space. No products, no text.',
        'badge_text_color': '#000000',
        'badge_bg_color': '#FFD700',
        'badge_gradient': ['#FFD700', '#FFA000'],
        'badge_style': 'starburst',
        'badge_glow_color': (255, 215, 0, 100),
        'frame_color': (255, 215, 0, 255),
        'frame_style': 'gold_glow',
        'cta_text': 'SHOP NOW',
        'cta_bg': '#FFD700',
        'cta_gradient': ['#FFD700', '#FF8C00'],
        'cta_text_color': '#000000',
        'cta_style': 'pill',
        'headline_color': '#FFD700',
        'gradient': [(15, 15, 15), (35, 30, 20)],
        'accent_color': '#FFD700',
        'product_glow': (255, 215, 0, 60),
        'sparkle_color': (255, 215, 0),
        'show_urgency': True,
        'urgency_style': 'flash',
        'trust_style': 'gold',
        'price_style': 'premium',
        'decoration': 'sparkles'
    },
    'valentines': {
        'name': "Valentine's Day",
        'prompt': 'Romantic Valentine sale background. Soft blush pink silk texture with gentle bokeh heart lights, scattered red rose petals at edges. Dreamy romantic atmosphere with soft glow. Premium perfume ad style. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#FFFFFF',
        'badge_bg_color': '#E91E63',
        'badge_gradient': ['#E91E63', '#C2185B'],
        'badge_style': 'heart',
        'badge_glow_color': (233, 30, 99, 80),
        'frame_color': (233, 30, 99, 200),
        'frame_style': 'colored_border',
        'cta_text': 'GIFT NOW',
        'cta_bg': '#E91E63',
        'cta_gradient': ['#E91E63', '#AD1457'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'rounded',
        'headline_color': '#880E4F',
        'gradient': [(255, 230, 240), (255, 200, 220)],
        'accent_color': '#E91E63',
        'product_glow': (233, 30, 99, 50),
        'sparkle_color': (255, 182, 193),
        'show_urgency': False,
        'trust_style': 'pink',
        'price_style': 'elegant',
        'decoration': 'hearts'
    },
    'christmas': {
        'name': 'Christmas',
        'prompt': 'Magical Christmas sale background. Rich deep red velvet with golden bokeh fairy lights, subtle snowflakes, pine branches at corners. Warm cozy holiday atmosphere. Coca-Cola ad quality. 8K. Empty center. No products, no text.',
        'badge_text_color': '#FFFFFF',
        'badge_bg_color': '#B71C1C',
        'badge_gradient': ['#D32F2F', '#B71C1C'],
        'badge_style': 'ribbon',
        'badge_glow_color': (183, 28, 28, 80),
        'frame_color': (255, 215, 0, 255),
        'frame_style': 'gold_glow',
        'cta_text': 'UNWRAP DEAL',
        'cta_bg': '#1B5E20',
        'cta_gradient': ['#2E7D32', '#1B5E20'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'rounded',
        'headline_color': '#FFD700',
        'gradient': [(120, 15, 15), (15, 60, 15)],
        'accent_color': '#FFD700',
        'product_glow': (255, 215, 0, 50),
        'sparkle_color': (255, 255, 255),
        'show_urgency': True,
        'urgency_style': 'gift',
        'trust_style': 'gold',
        'price_style': 'festive',
        'decoration': 'snowflakes'
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'prompt': 'Fresh vibrant summer sale background. Bright gradient from turquoise ocean to sunny yellow, palm leaf shadows at edges, tropical beach vibes. Resort advertisement quality. 8K. Empty center. No products, no text.',
        'badge_text_color': '#000000',
        'badge_bg_color': '#FFEB3B',
        'badge_gradient': ['#FFEB3B', '#FFC107'],
        'badge_style': 'circle',
        'badge_glow_color': (255, 235, 59, 100),
        'frame_color': (255, 255, 255, 240),
        'frame_style': 'white_clean',
        'cta_text': 'COOL DEALS',
        'cta_bg': '#00BCD4',
        'cta_gradient': ['#00BCD4', '#0097A7'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'pill',
        'headline_color': '#006064',
        'gradient': [(0, 188, 212), (255, 235, 59)],
        'accent_color': '#FF9800',
        'product_glow': (0, 188, 212, 50),
        'sparkle_color': (255, 255, 255),
        'show_urgency': True,
        'urgency_style': 'hot',
        'trust_style': 'cyan',
        'price_style': 'fresh',
        'decoration': 'none'
    },
    'new_year': {
        'name': 'New Year',
        'prompt': 'Glamorous New Year celebration background. Sophisticated midnight blue with gold confetti explosion, champagne bubble effects, firework sparkles. Luxury party atmosphere. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#1A237E',
        'badge_bg_color': '#FFD700',
        'badge_gradient': ['#FFD700', '#FFC107'],
        'badge_style': 'starburst',
        'badge_glow_color': (255, 215, 0, 100),
        'frame_color': (255, 215, 0, 255),
        'frame_style': 'gold_glow',
        'cta_text': 'NEW YEAR DEAL',
        'cta_bg': '#FFD700',
        'cta_gradient': ['#FFD700', '#FFA000'],
        'cta_text_color': '#1A237E',
        'cta_style': 'wide',
        'headline_color': '#FFD700',
        'gradient': [(10, 15, 45), (25, 25, 70)],
        'accent_color': '#FFD700',
        'product_glow': (255, 215, 0, 60),
        'sparkle_color': (255, 215, 0),
        'show_urgency': True,
        'urgency_style': 'countdown',
        'trust_style': 'gold',
        'price_style': 'premium',
        'decoration': 'confetti'
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'prompt': 'Dynamic urgent flash sale background. Bold red to orange gradient with lightning bolt effects, speed lines, energetic motion blur. Tech product launch energy. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#FFFFFF',
        'badge_bg_color': '#D32F2F',
        'badge_gradient': ['#F44336', '#C62828'],
        'badge_style': 'explosion',
        'badge_glow_color': (211, 47, 47, 120),
        'frame_color': (255, 255, 255, 240),
        'frame_style': 'white_clean',
        'cta_text': 'BUY NOW',
        'cta_bg': '#FFEB3B',
        'cta_gradient': ['#FFEB3B', '#FFC107'],
        'cta_text_color': '#D32F2F',
        'cta_style': 'sharp',
        'headline_color': '#FFFFFF',
        'gradient': [(211, 47, 47), (255, 152, 0)],
        'accent_color': '#FFEB3B',
        'product_glow': (255, 235, 59, 70),
        'sparkle_color': (255, 235, 59),
        'show_urgency': True,
        'urgency_style': 'timer',
        'trust_style': 'urgent',
        'price_style': 'bold',
        'decoration': 'sparkles'
    },
    'mothers_day': {
        'name': "Mother's Day",
        'prompt': 'Elegant Mother\'s Day background. Soft lavender to blush pink gradient, delicate peony petals floating, gentle warm lighting. Luxury gift brand aesthetic. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#FFFFFF',
        'badge_bg_color': '#7B1FA2',
        'badge_gradient': ['#9C27B0', '#7B1FA2'],
        'badge_style': 'heart',
        'badge_glow_color': (156, 39, 176, 80),
        'frame_color': (156, 39, 176, 180),
        'frame_style': 'colored_border',
        'cta_text': 'FOR MOM',
        'cta_bg': '#E91E63',
        'cta_gradient': ['#E91E63', '#C2185B'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'rounded',
        'headline_color': '#4A148C',
        'gradient': [(230, 200, 230), (255, 200, 220)],
        'accent_color': '#E91E63',
        'product_glow': (156, 39, 176, 50),
        'sparkle_color': (255, 182, 193),
        'show_urgency': False,
        'trust_style': 'pink',
        'price_style': 'elegant',
        'decoration': 'hearts'
    },
    'easter': {
        'name': 'Easter',
        'prompt': 'Joyful Easter spring background. Fresh pastel gradient with mint, pink, yellow. Decorated Easter eggs at corners, spring flowers, butterfly accents. Premium chocolate brand style. 8K. Empty center. No products, no text.',
        'badge_text_color': '#1B5E20',
        'badge_bg_color': '#C8E6C9',
        'badge_gradient': ['#A5D6A7', '#81C784'],
        'badge_style': 'circle',
        'badge_glow_color': (129, 199, 132, 80),
        'frame_color': (255, 255, 255, 240),
        'frame_style': 'white_clean',
        'cta_text': 'SPRING DEAL',
        'cta_bg': '#81C784',
        'cta_gradient': ['#81C784', '#66BB6A'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'rounded',
        'headline_color': '#2E7D32',
        'gradient': [(200, 255, 220), (255, 220, 240)],
        'accent_color': '#7B1FA2',
        'product_glow': (129, 199, 132, 50),
        'sparkle_color': (255, 255, 200),
        'show_urgency': False,
        'trust_style': 'spring',
        'price_style': 'fresh',
        'decoration': 'none'
    },
    'halloween': {
        'name': 'Halloween',
        'prompt': 'Fun spooky Halloween background. Purple to orange gradient with mysterious fog, carved pumpkin glow at edges, bat silhouettes, spider web accents. Playful scary atmosphere. 8K. Empty center. No products, no text.',
        'badge_text_color': '#000000',
        'badge_bg_color': '#FF9800',
        'badge_gradient': ['#FF9800', '#F57C00'],
        'badge_style': 'tag',
        'badge_glow_color': (255, 152, 0, 100),
        'frame_color': (255, 152, 0, 200),
        'frame_style': 'colored_border',
        'cta_text': 'SPOOKY DEAL',
        'cta_bg': '#FF9800',
        'cta_gradient': ['#FF9800', '#EF6C00'],
        'cta_text_color': '#000000',
        'cta_style': 'sharp',
        'headline_color': '#FF9800',
        'gradient': [(74, 20, 140), (255, 152, 0)],
        'accent_color': '#FF9800',
        'product_glow': (255, 152, 0, 60),
        'sparkle_color': (255, 152, 0),
        'show_urgency': True,
        'urgency_style': 'spooky',
        'trust_style': 'dark',
        'price_style': 'bold',
        'decoration': 'pumpkins'
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'prompt': 'Futuristic Cyber Monday background. Dark blue with neon cyan circuit board patterns, digital matrix effects, holographic grid, tech aesthetic. Apple launch style. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#000000',
        'badge_bg_color': '#00E5FF',
        'badge_gradient': ['#00E5FF', '#00B8D4'],
        'badge_style': 'tech',
        'badge_glow_color': (0, 229, 255, 120),
        'frame_color': (0, 229, 255, 200),
        'frame_style': 'neon_glow',
        'cta_text': 'CYBER DEAL',
        'cta_bg': '#00E5FF',
        'cta_gradient': ['#00E5FF', '#00ACC1'],
        'cta_text_color': '#0D47A1',
        'cta_style': 'sharp',
        'headline_color': '#00E5FF',
        'gradient': [(10, 25, 60), (0, 50, 80)],
        'accent_color': '#00E5FF',
        'product_glow': (0, 229, 255, 70),
        'sparkle_color': (0, 229, 255),
        'show_urgency': True,
        'urgency_style': 'digital',
        'trust_style': 'tech',
        'price_style': 'tech',
        'decoration': 'sparkles'
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'prompt': 'Fresh spring renewal background. Clean gradient from fresh green to white, cherry blossom petals floating, natural daylight glow. Lifestyle brand aesthetic. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#FFFFFF',
        'badge_bg_color': '#4CAF50',
        'badge_gradient': ['#66BB6A', '#43A047'],
        'badge_style': 'circle',
        'badge_glow_color': (76, 175, 80, 80),
        'frame_color': (255, 255, 255, 240),
        'frame_style': 'white_clean',
        'cta_text': 'BLOOM DEAL',
        'cta_bg': '#E91E63',
        'cta_gradient': ['#E91E63', '#C2185B'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'pill',
        'headline_color': '#2E7D32',
        'gradient': [(200, 255, 200), (255, 255, 255)],
        'accent_color': '#E91E63',
        'product_glow': (129, 199, 132, 50),
        'sparkle_color': (255, 182, 193),
        'show_urgency': False,
        'trust_style': 'spring',
        'price_style': 'fresh',
        'decoration': 'none'
    },
    'back_to_school': {
        'name': 'Back to School',
        'prompt': 'Clean organized back to school background. Bright gradient from white to light blue, subtle pencil and notebook illustrations at edges. Academic energy. 8K quality. Empty center. No products, no text.',
        'badge_text_color': '#FFFFFF',
        'badge_bg_color': '#1976D2',
        'badge_gradient': ['#2196F3', '#1565C0'],
        'badge_style': 'tag',
        'badge_glow_color': (33, 150, 243, 80),
        'frame_color': (255, 255, 255, 240),
        'frame_style': 'white_clean',
        'cta_text': 'STUDY DEAL',
        'cta_bg': '#FF9800',
        'cta_gradient': ['#FF9800', '#F57C00'],
        'cta_text_color': '#FFFFFF',
        'cta_style': 'rounded',
        'headline_color': '#1565C0',
        'gradient': [(255, 255, 255), (187, 222, 251)],
        'accent_color': '#FF9800',
        'product_glow': (33, 150, 243, 50),
        'sparkle_color': (255, 255, 255),
        'show_urgency': True,
        'urgency_style': 'limited',
        'trust_style': 'blue',
        'price_style': 'clean',
        'decoration': 'none'
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


def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple"""
    if isinstance(hex_color, tuple):
        return hex_color[:3]
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(rgb):
    """Convert RGB tuple to hex color"""
    return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])


def interpolate_color(color1, color2, factor):
    """Interpolate between two RGB colors"""
    return tuple(int(color1[i] + (color2[i] - color1[i]) * factor) for i in range(3))


def load_font(size, bold=True):
    """Load font with fallbacks"""
    font_paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf" if bold else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "arial.ttf",
        "Arial Bold.ttf" if bold else "Arial.ttf"
    ]

    for path in font_paths:
        try:
            return ImageFont.truetype(path, size)
        except:
            continue

    return ImageFont.load_default()


# ═══════════════════════════════════════════════════════════════════════════════
# AI PRODUCT CATEGORY DETECTION
# ═══════════════════════════════════════════════════════════════════════════════

def detect_product_category(image_base64, token, proj_id):
    """Use Gemini to detect product category for smart styling"""
    if not token or not proj_id:
        return {'category': 'general', 'style_hints': []}

    try:
        location = 'us-central1'
        url = f"https://{location}-aiplatform.googleapis.com/v1/projects/{proj_id}/locations/{location}/publishers/google/models/gemini-2.0-flash-exp:generateContent"

        # Clean base64
        if 'base64,' in image_base64:
            clean_base64 = image_base64.split('base64,')[1]
        else:
            clean_base64 = image_base64

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

        payload = {
            "contents": [{
                "role": "user",
                "parts": [
                    {"text": """Analyze this product image and return JSON only:
{
    "category": "one of: fashion, electronics, beauty, food, home, sports, jewelry, toys, automotive, general",
    "product_type": "specific product name",
    "luxury_level": "budget, mid-range, or premium",
    "target_audience": "men, women, unisex, kids, all",
    "style_hints": ["modern", "vintage", "minimalist", "colorful", etc],
    "suggested_badge": "best_seller, top_rated, limited_edition, trending, new_arrival, or none"
}"""},
                    {"inline_data": {"mime_type": "image/jpeg", "data": clean_base64}}
                ]
            }],
            "generationConfig": {"temperature": 0.1, "maxOutputTokens": 512}
        }

        response = requests.post(url, headers=headers, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            if "candidates" in result:
                text = result["candidates"][0]["content"]["parts"][0].get("text", "")
                # Parse JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', text)
                if json_match:
                    return json.loads(json_match.group())

        return {'category': 'general', 'style_hints': []}

    except Exception as e:
        print(f"⚠️ Product detection failed: {e}")
        return {'category': 'general', 'style_hints': []}


# ═══════════════════════════════════════════════════════════════════════════════
# BACKGROUND GENERATION
# ═══════════════════════════════════════════════════════════════════════════════

def generate_themed_background(theme, aspect_ratio, layout, token, proj_id):
    """Generate a themed background using AI"""
    global _last_errors

    theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])

    product_pos = layout['product_position']
    if product_pos[0] < 0.45:
        space_hint = "Leave more empty space on the LEFT side for product placement."
    elif product_pos[0] > 0.55:
        space_hint = "Leave more empty space on the RIGHT side for product placement."
    else:
        space_hint = "Leave clear empty space in the CENTER for product placement."

    prompt = f"""{theme_config['prompt']}

Image dimensions: {dimensions[0]}x{dimensions[1]} pixels
Style: Ultra high quality, 8K resolution, professional product photography background
Layout hint: {space_hint}
CRITICAL: Generate ONLY the background - absolutely NO product, NO text, NO logos"""

    print(f"   🎨 Generating {theme_config['name']} background...")

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

    print("   ↪ Using gradient fallback...")
    return create_gradient_background(theme, dimensions)


def create_gradient_background(theme, dimensions):
    """Create a premium gradient background"""
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

    # Add subtle sparkles
    sparkle_color = theme_config.get('sparkle_color', (255, 255, 255))
    for _ in range(int(width * height / 8000)):
        x = random.randint(0, width - 1)
        y = random.randint(0, height - 1)
        size = random.randint(1, 3)
        opacity = random.randint(20, 80)
        draw.ellipse([x-size, y-size, x+size, y+size], fill=(*sparkle_color, opacity))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# PRODUCT PLACEMENT WITH PREMIUM EFFECTS
# ═══════════════════════════════════════════════════════════════════════════════

def create_perspective_shadow(product_image, offset_y=20, blur_amount=25, opacity=100):
    """Create a realistic perspective shadow"""
    width, height = product_image.size

    # Create shadow base from alpha
    if product_image.mode != 'RGBA':
        product_image = product_image.convert('RGBA')

    alpha = product_image.split()[3]

    # Create shadow layer (wider and shorter for perspective)
    shadow_width = int(width * 1.1)
    shadow_height = int(height * 0.3)

    shadow = Image.new('RGBA', (shadow_width + blur_amount * 2, shadow_height + blur_amount * 2), (0, 0, 0, 0))

    # Draw elliptical shadow
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.ellipse([
        blur_amount,
        blur_amount,
        shadow_width + blur_amount,
        shadow_height + blur_amount
    ], fill=(0, 0, 0, opacity))

    # Blur the shadow
    shadow = shadow.filter(ImageFilter.GaussianBlur(blur_amount))

    return shadow, (shadow_width, shadow_height)


def create_product_glow(product_image, glow_color, glow_size=30):
    """Create a glowing aura around the product"""
    if product_image.mode != 'RGBA':
        product_image = product_image.convert('RGBA')

    alpha = product_image.split()[3]

    glow_layer = Image.new('RGBA', (
        product_image.width + glow_size * 2,
        product_image.height + glow_size * 2
    ), (0, 0, 0, 0))

    glow_mask = Image.new('RGBA', product_image.size, glow_color)
    glow_mask.putalpha(alpha)

    glow_layer.paste(glow_mask, (glow_size, glow_size), glow_mask)
    glow_layer = glow_layer.filter(ImageFilter.GaussianBlur(glow_size))

    return glow_layer


def create_sparkle_effect(width, height, sparkle_color, count=15):
    """Create sparkle effects"""
    sparkle_layer = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(sparkle_layer)

    for _ in range(count):
        x = random.randint(20, width - 20)
        y = random.randint(20, height - 20)
        size = random.randint(3, 12)

        points = []
        for i in range(4):
            angle = i * math.pi / 2
            px = x + size * 2 * math.cos(angle)
            py = y + size * 2 * math.sin(angle)
            points.append((px, py))
            inner_angle = angle + math.pi / 4
            ipx = x + size * 0.5 * math.cos(inner_angle)
            ipy = y + size * 0.5 * math.sin(inner_angle)
            points.append((ipx, ipy))

        opacity = random.randint(100, 200)
        color = (*sparkle_color, opacity)
        draw.polygon(points, fill=color)

    return sparkle_layer


def place_product_on_background(background, product_image, theme, aspect_ratio, layout, options):
    """Place product with premium effects"""
    global _last_errors

    try:
        theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])
        dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, ASPECT_DIMENSIONS['1:1'])
        width, height = dimensions

        background = background.resize((width, height), Image.Resampling.LANCZOS)

        # Calculate product size
        product_max_size = int(min(width, height) * layout['product_scale'])
        product_ratio = min(product_max_size / product_image.width,
                           product_max_size / product_image.height)

        new_width = int(product_image.width * product_ratio)
        new_height = int(product_image.height * product_ratio)

        product_resized = product_image.resize(
            (new_width, new_height),
            Image.Resampling.LANCZOS
        )

        # Calculate position
        pos_x, pos_y = layout['product_position']
        product_x = int(width * pos_x - new_width / 2)
        product_y = int(height * pos_y - new_height / 2)

        product_x = max(30, min(product_x, width - new_width - 30))
        product_y = max(30, min(product_y, height - new_height - 30))

        # === PRODUCT GLOW ===
        if options.get('showProductGlow', True):
            glow_color = theme_config.get('product_glow', (255, 255, 255, 50))
            glow = create_product_glow(product_resized, glow_color, glow_size=25)
            background.paste(glow, (product_x - 25, product_y - 25), glow)

        # === SPARKLES ===
        if options.get('showSparkles', True) and random.random() > 0.3:
            sparkle_color = theme_config.get('sparkle_color', (255, 255, 255))
            sparkles = create_sparkle_effect(new_width + 100, new_height + 100, sparkle_color, count=12)
            background.paste(sparkles, (product_x - 50, product_y - 50), sparkles)

        # === PERSPECTIVE SHADOW ===
        shadow, (shadow_w, shadow_h) = create_perspective_shadow(product_resized, opacity=80)
        shadow_x = product_x + (new_width - shadow_w) // 2 - 25
        shadow_y = product_y + new_height - 10
        if shadow_y + shadow_h < height:
            background.paste(shadow, (shadow_x, shadow_y), shadow)

        # === FRAME STYLE ===
        frame_style = theme_config.get('frame_style', 'white_clean')
        frame_color = theme_config.get('frame_color', (255, 255, 255, 240))
        frame_padding = 8
        frame_radius = 15

        if frame_style == 'gold_glow':
            glow = Image.new('RGBA', (new_width + 50, new_height + 50), (0, 0, 0, 0))
            glow_draw = ImageDraw.Draw(glow)
            glow_draw.rounded_rectangle([0, 0, new_width + 50, new_height + 50],
                radius=frame_radius + 25, fill=(255, 215, 0, 50))
            glow = glow.filter(ImageFilter.GaussianBlur(18))
            background.paste(glow, (product_x - 25, product_y - 25), glow)

            frame = Image.new('RGBA', (new_width + frame_padding*2, new_height + frame_padding*2), (0, 0, 0, 0))
            frame_draw = ImageDraw.Draw(frame)
            frame_draw.rounded_rectangle([0, 0, new_width + frame_padding*2, new_height + frame_padding*2],
                radius=frame_radius, fill=(255, 255, 255, 250), outline=(255, 215, 0, 255), width=3)
            background.paste(frame, (product_x - frame_padding, product_y - frame_padding), frame)

        elif frame_style == 'neon_glow':
            for i in range(3):
                glow_size = 35 - i * 10
                glow = Image.new('RGBA', (new_width + glow_size*2, new_height + glow_size*2), (0, 0, 0, 0))
                glow_draw = ImageDraw.Draw(glow)
                glow_color_local = (*frame_color[:3], 40 + i * 20)
                glow_draw.rounded_rectangle([0, 0, new_width + glow_size*2, new_height + glow_size*2],
                    radius=frame_radius + glow_size, fill=glow_color_local)
                glow = glow.filter(ImageFilter.GaussianBlur(glow_size // 2))
                background.paste(glow, (product_x - glow_size, product_y - glow_size), glow)

            frame = Image.new('RGBA', (new_width + frame_padding*2, new_height + frame_padding*2), (0, 0, 0, 0))
            frame_draw = ImageDraw.Draw(frame)
            frame_draw.rounded_rectangle([0, 0, new_width + frame_padding*2, new_height + frame_padding*2],
                radius=frame_radius, fill=(20, 20, 30, 240), outline=frame_color, width=2)
            background.paste(frame, (product_x - frame_padding, product_y - frame_padding), frame)

        elif frame_style == 'colored_border':
            frame = Image.new('RGBA', (new_width + frame_padding*2, new_height + frame_padding*2), (0, 0, 0, 0))
            frame_draw = ImageDraw.Draw(frame)
            frame_draw.rounded_rectangle([0, 0, new_width + frame_padding*2, new_height + frame_padding*2],
                radius=frame_radius, fill=(255, 255, 255, 245), outline=frame_color, width=4)
            background.paste(frame, (product_x - frame_padding, product_y - frame_padding), frame)

        else:  # white_clean
            frame = Image.new('RGBA', (new_width + frame_padding*2, new_height + frame_padding*2), (0, 0, 0, 0))
            frame_draw = ImageDraw.Draw(frame)
            frame_draw.rounded_rectangle([0, 0, new_width + frame_padding*2, new_height + frame_padding*2],
                radius=frame_radius, fill=(255, 255, 255, 250))
            background.paste(frame, (product_x - frame_padding, product_y - frame_padding), frame)

        # === PASTE PRODUCT ===
        if product_resized.mode == 'RGBA':
            background.paste(product_resized, (product_x, product_y), product_resized)
        else:
            background.paste(product_resized, (product_x, product_y))

        print(f"   ✅ Product placed with effects")
        return background, (product_x, product_y, new_width, new_height)

    except Exception as e:
        print(f"   ⚠️ Product placement error: {e}")
        traceback.print_exc()
        _last_errors.append(f"Placement: {str(e)[:100]}")
        return background, (0, 0, 0, 0)


# ═══════════════════════════════════════════════════════════════════════════════
# PREMIUM BADGE DRAWING
# ═══════════════════════════════════════════════════════════════════════════════

def draw_outlined_text(draw, position, text, font, fill_color, outline_color, outline_width=2):
    """Draw text with outline effect"""
    x, y = position
    fill_rgb = hex_to_rgb(fill_color) if isinstance(fill_color, str) else fill_color
    outline_rgb = hex_to_rgb(outline_color) if isinstance(outline_color, str) else outline_color

    # Draw outline
    for dx in range(-outline_width, outline_width + 1):
        for dy in range(-outline_width, outline_width + 1):
            if dx != 0 or dy != 0:
                draw.text((x + dx, y + dy), text, font=font, fill=outline_rgb)

    # Draw main text
    draw.text((x, y), text, font=font, fill=fill_rgb)


def draw_3d_badge(image, center_x, center_y, radius, gradient_colors, glow_color, text, text_color, sub_text, badge_style):
    """Draw premium 3D badge based on style"""
    draw = ImageDraw.Draw(image)

    color1 = hex_to_rgb(gradient_colors[0]) if isinstance(gradient_colors[0], str) else gradient_colors[0]
    color2 = hex_to_rgb(gradient_colors[1]) if isinstance(gradient_colors[1], str) else gradient_colors[1]
    main_color = interpolate_color(color1, color2, 0.3)
    text_color_rgb = hex_to_rgb(text_color) if isinstance(text_color, str) else text_color

    # Glow effect
    for i in range(4, 0, -1):
        glow_r = radius + i * 8
        glow_opacity = glow_color[3] // (i + 1)

        if badge_style in ['starburst', 'explosion']:
            points = []
            num_points = 16 if badge_style == 'starburst' else 20
            for j in range(num_points * 2):
                angle = (j * math.pi / num_points) - math.pi / 2
                r = glow_r if j % 2 == 0 else glow_r * (0.7 if badge_style == 'starburst' else 0.55)
                points.append((center_x + r * math.cos(angle), center_y + r * math.sin(angle)))
            draw.polygon(points, fill=(*glow_color[:3], glow_opacity))
        else:
            draw.ellipse([center_x - glow_r, center_y - glow_r,
                         center_x + glow_r, center_y + glow_r],
                        fill=(*glow_color[:3], glow_opacity))

    # Main badge shape
    if badge_style == 'starburst':
        points = []
        for i in range(32):
            angle = (i * math.pi / 16) - math.pi / 2
            r = radius if i % 2 == 0 else radius * 0.7
            points.append((center_x + r * math.cos(angle), center_y + r * math.sin(angle)))
        draw.polygon(points, fill=(*main_color, 255))

        # Highlight
        highlight_points = []
        for i in range(32):
            angle = (i * math.pi / 16) - math.pi / 2
            r = (radius * 0.85) if i % 2 == 0 else (radius * 0.6)
            highlight_points.append((center_x + r * math.cos(angle) - 2, center_y + r * math.sin(angle) - 2))
        draw.polygon(highlight_points, fill=(*color1, 80))

    elif badge_style == 'explosion':
        points = []
        for i in range(40):
            angle = (i * math.pi / 20) - math.pi / 2
            r = radius if i % 2 == 0 else radius * 0.55
            points.append((center_x + r * math.cos(angle), center_y + r * math.sin(angle)))
        draw.polygon(points, fill=(*main_color, 255))

    elif badge_style == 'heart':
        points = []
        for t in range(0, 360, 3):
            rad = math.radians(t)
            hx = radius * 0.5 * (16 * math.sin(rad)**3) / 16
            hy = -radius * 0.5 * (13 * math.cos(rad) - 5 * math.cos(2*rad) - 2 * math.cos(3*rad) - math.cos(4*rad)) / 16
            points.append((center_x + hx, center_y + hy))
        draw.polygon(points, fill=(*main_color, 255))

    elif badge_style == 'ribbon':
        w, h = radius * 2.4, radius * 1.6
        x, y = center_x - w/2, center_y - h/2

        # Shadow
        draw.polygon([
            (x + 4, y + 15 + 4), (x + 15 + 4, y + 4), (x + w - 15 + 4, y + 4),
            (x + w + 4, y + 15 + 4), (x + w + 4, y + h - 15 + 4),
            (x + w - 15 + 4, y + h + 4), (x + 15 + 4, y + h + 4), (x + 4, y + h - 15 + 4)
        ], fill=(0, 0, 0, 60))

        # Main
        draw.polygon([
            (x, y + 15), (x + 15, y), (x + w - 15, y), (x + w, y + 15),
            (x + w, y + h - 15), (x + w - 15, y + h), (x + 15, y + h), (x, y + h - 15)
        ], fill=(*main_color, 255))

        # Folds
        fold_color = tuple(max(0, c - 50) for c in main_color)
        draw.polygon([(x, y + 15), (x + 15, y), (x + 15, y + 15)], fill=(*fold_color, 255))
        draw.polygon([(x + w - 15, y), (x + w, y + 15), (x + w - 15, y + 15)], fill=(*fold_color, 255))

    elif badge_style == 'tech':
        w, h = radius * 2.6, radius * 1.4
        x, y = center_x - w/2, center_y - h/2

        # Neon glow
        for i in range(3, 0, -1):
            offset = i * 4
            draw.rounded_rectangle([x - offset, y - offset, x + w + offset, y + h + offset],
                radius=8 + offset, fill=(*glow_color[:3], glow_color[3] // (i + 1)))

        # Main body
        for i in range(int(h)):
            ratio = i / h
            color = interpolate_color(color1, color2, ratio)
            draw.line([(x, y + i), (x + w, y + i)], fill=(*color, 255))

        draw.rounded_rectangle([x, y, x + w, y + h], radius=8, outline=(*color1, 255), width=2)

    elif badge_style == 'tag':
        w, h = radius * 2.6, radius * 1.4
        x, y = center_x - w/2, center_y - h/2

        draw.rounded_rectangle([x + 3, y + 3, x + w + 3, y + h + 3], radius=8, fill=(0, 0, 0, 60))
        draw.rounded_rectangle([x, y, x + w, y + h], radius=8, fill=(*main_color, 255))
        draw.rounded_rectangle([x + 2, y + 2, x + w - 10, y + h // 3], radius=6, fill=(*color1, 60))

        hole_x, hole_y = x + 18, y + h / 2
        draw.ellipse([hole_x - 7, hole_y - 7, hole_x + 7, hole_y + 7], fill=(255, 255, 255, 255))
        draw.ellipse([hole_x - 4, hole_y - 4, hole_x + 4, hole_y + 4], fill=(*main_color, 255))

    else:  # circle
        for i in range(int(radius), 0, -1):
            ratio = (radius - i) / radius
            color = interpolate_color(color1, color2, ratio * 0.5)
            draw.ellipse([center_x - i, center_y - i, center_x + i, center_y + i],
                        fill=(*color, 255))

        draw.ellipse([center_x - radius * 0.8 - 3, center_y - radius * 0.8 - 3,
                     center_x + radius * 0.8 - 3, center_y + radius * 0.8 - 3],
                    fill=(*color1, 60))

    # Text
    font_size = int(radius * 0.45)
    font = load_font(font_size)

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    text_y_offset = -10 if sub_text else 0

    # Text shadow
    draw.text((center_x - text_w/2 + 1, center_y - text_h/2 + text_y_offset + 1),
              text, font=font, fill=(0, 0, 0, 80))
    draw.text((center_x - text_w/2, center_y - text_h/2 + text_y_offset),
              text, font=font, fill=text_color_rgb)

    if sub_text:
        small_font = load_font(int(font_size * 0.55))
        bbox2 = draw.textbbox((0, 0), sub_text, font=small_font)
        sub_w = bbox2[2] - bbox2[0]
        draw.text((center_x - sub_w/2, center_y + text_h/2 - 3),
                  sub_text, font=small_font, fill=text_color_rgb)


# ═══════════════════════════════════════════════════════════════════════════════
# SOCIAL PROOF BADGES
# ═══════════════════════════════════════════════════════════════════════════════

def draw_social_proof_badge(image, x, y, badge_type, theme_config):
    """Draw a social proof badge (Best Seller, Top Rated, etc.)"""
    if badge_type not in SOCIAL_PROOF_TYPES:
        return

    draw = ImageDraw.Draw(image)
    badge_info = SOCIAL_PROOF_TYPES[badge_type]

    text = badge_info['text']
    icon = badge_info['icon']
    color = hex_to_rgb(badge_info['color'])

    font = load_font(12)
    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]

    badge_w = text_w + 45
    badge_h = 28

    # Shadow
    draw.rounded_rectangle([x + 2, y + 2, x + badge_w + 2, y + badge_h + 2],
        radius=badge_h // 2, fill=(0, 0, 0, 60))

    # Main badge
    draw.rounded_rectangle([x, y, x + badge_w, y + badge_h],
        radius=badge_h // 2, fill=(*color, 240))

    # Highlight
    draw.rounded_rectangle([x + 2, y + 2, x + badge_w - 5, y + badge_h // 2],
        radius=badge_h // 4, fill=(255, 255, 255, 60))

    # Icon and text
    draw.text((x + 10, y + 6), icon, font=font, fill=(255, 255, 255))
    draw.text((x + 28, y + 7), text, font=font, fill=(255, 255, 255))


# ═══════════════════════════════════════════════════════════════════════════════
# PRICE TAG ELEMENT
# ═══════════════════════════════════════════════════════════════════════════════

def draw_price_tag(image, x, y, original_price, sale_price, theme_config, style='premium'):
    """Draw a professional price tag"""
    draw = ImageDraw.Draw(image)

    accent_color = hex_to_rgb(theme_config.get('accent_color', '#FFD700'))

    if style == 'premium':
        bg_color = (20, 20, 20, 230)
        text_color = (255, 255, 255)
        sale_color = accent_color
    elif style == 'bold':
        bg_color = (*accent_color, 240)
        text_color = (0, 0, 0)
        sale_color = (0, 0, 0)
    elif style == 'tech':
        bg_color = (10, 20, 40, 230)
        text_color = accent_color
        sale_color = (255, 255, 255)
    elif style == 'festive':
        bg_color = (180, 20, 20, 230)
        text_color = (255, 255, 255)
        sale_color = (255, 215, 0)
    else:  # clean, fresh, elegant
        bg_color = (255, 255, 255, 240)
        text_color = (50, 50, 50)
        sale_color = hex_to_rgb(theme_config.get('badge_bg_color', '#E91E63'))

    # Fonts
    price_font = load_font(28)
    small_font = load_font(14)

    # Calculate sizes
    sale_text = f"${sale_price}" if sale_price else ""
    orig_text = f"${original_price}" if original_price and sale_price else f"${original_price or sale_price}"

    bbox = draw.textbbox((0, 0), sale_text if sale_text else orig_text, font=price_font)
    price_w = bbox[2] - bbox[0]

    tag_w = price_w + 50
    tag_h = 70 if sale_price and original_price else 50

    # Shadow
    draw.rounded_rectangle([x + 3, y + 3, x + tag_w + 3, y + tag_h + 3],
        radius=12, fill=(0, 0, 0, 80))

    # Main tag
    draw.rounded_rectangle([x, y, x + tag_w, y + tag_h],
        radius=12, fill=bg_color)

    if sale_price and original_price:
        # Original price with strikethrough
        orig_bbox = draw.textbbox((0, 0), f"${original_price}", font=small_font)
        orig_w = orig_bbox[2] - orig_bbox[0]
        draw.text((x + (tag_w - orig_w) / 2, y + 8), f"${original_price}",
                  font=small_font, fill=(*text_color, 150))
        # Strikethrough
        draw.line([(x + (tag_w - orig_w) / 2 - 2, y + 18),
                   (x + (tag_w + orig_w) / 2 + 2, y + 18)],
                  fill=(*text_color, 150), width=1)

        # Sale price
        draw.text((x + (tag_w - price_w) / 2, y + 28), sale_text,
                  font=price_font, fill=sale_color)
    else:
        # Single price
        draw.text((x + (tag_w - price_w) / 2, y + (tag_h - 28) / 2),
                  orig_text, font=price_font, fill=text_color)


# ═══════════════════════════════════════════════════════════════════════════════
# TRUST BADGES
# ═══════════════════════════════════════════════════════════════════════════════

def draw_trust_badges(image, layout, width, height, theme_config, options):
    """Draw trust badges with custom values"""
    if not options.get('showTrustBadges', True):
        return image

    draw = ImageDraw.Draw(image)
    trust_style = theme_config.get('trust_style', 'gold')

    styles = {
        'gold': {'bg': (40, 40, 40, 220), 'text': (255, 215, 0), 'icon': (255, 215, 0)},
        'pink': {'bg': (60, 30, 40, 220), 'text': (255, 182, 193), 'icon': (233, 30, 99)},
        'cyan': {'bg': (10, 50, 60, 220), 'text': (0, 229, 255), 'icon': (0, 188, 212)},
        'tech': {'bg': (10, 20, 40, 230), 'text': (0, 229, 255), 'icon': (0, 229, 255)},
        'spring': {'bg': (30, 50, 30, 220), 'text': (129, 199, 132), 'icon': (76, 175, 80)},
        'blue': {'bg': (20, 40, 70, 220), 'text': (100, 180, 255), 'icon': (33, 150, 243)},
        'urgent': {'bg': (60, 20, 20, 230), 'text': (255, 235, 59), 'icon': (255, 235, 59)},
        'dark': {'bg': (30, 20, 40, 230), 'text': (255, 152, 0), 'icon': (255, 152, 0)}
    }

    style = styles.get(trust_style, styles['gold'])
    badges = []

    # Use custom values from options
    if options.get('showRating', True):
        rating = options.get('rating', 4.9)
        badges.append(('star', f'{rating}', 'Rating'))

    if options.get('showShipping', True):
        badges.append(('truck', 'Free', 'Shipping'))

    if options.get('showSoldCount', False):
        sold = options.get('soldCount', '1000+')
        badges.append(('check', str(sold), 'Sold'))

    if len(badges) == 0:
        return image

    trust_pos = layout.get('trust_position', 'bottom_left')
    margin = 25

    badge_height = 32
    badge_spacing = 8
    total_width = 0
    badge_widths = []

    font = load_font(11)

    for icon, value, label in badges:
        text = f"{value} {label}"
        bbox = draw.textbbox((0, 0), text, font=font)
        w = bbox[2] - bbox[0] + 45
        badge_widths.append(w)
        total_width += w + badge_spacing

    total_width -= badge_spacing

    if 'right' in trust_pos:
        start_x = width - total_width - margin
    elif 'center' in trust_pos:
        start_x = (width - total_width) / 2
    else:
        start_x = margin

    if 'bottom' in trust_pos:
        y_pos = height - badge_height - margin - 50
    else:
        y_pos = margin + 60

    x = start_x
    for i, (icon, value, label) in enumerate(badges):
        w = badge_widths[i]

        draw.rounded_rectangle([x, y_pos, x + w, y_pos + badge_height],
            radius=badge_height // 2, fill=style['bg'])

        icon_x = x + 16
        icon_y = y_pos + badge_height // 2
        draw.ellipse([icon_x - 10, icon_y - 10, icon_x + 10, icon_y + 10],
            fill=(*style['icon'], 255))

        if icon == 'star':
            star_points = []
            for j in range(5):
                angle = j * 2 * math.pi / 5 - math.pi / 2
                star_points.append((icon_x + 6 * math.cos(angle), icon_y + 6 * math.sin(angle)))
                inner_angle = angle + math.pi / 5
                star_points.append((icon_x + 3 * math.cos(inner_angle), icon_y + 3 * math.sin(inner_angle)))
            draw.polygon(star_points, fill=(255, 255, 255))
        elif icon == 'truck':
            draw.rectangle([icon_x - 5, icon_y - 2, icon_x + 3, icon_y + 4], fill=(255, 255, 255))
            draw.rectangle([icon_x + 2, icon_y, icon_x + 6, icon_y + 4], fill=(255, 255, 255))
        elif icon == 'check':
            draw.line([(icon_x - 4, icon_y), (icon_x - 1, icon_y + 4)], fill=(255, 255, 255), width=2)
            draw.line([(icon_x - 1, icon_y + 4), (icon_x + 5, icon_y - 3)], fill=(255, 255, 255), width=2)

        text = f"{value} {label}"
        draw.text((x + 32, y_pos + badge_height // 2 - 6), text, font=font, fill=style['text'])

        x += w + badge_spacing

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# URGENCY ELEMENTS
# ═══════════════════════════════════════════════════════════════════════════════

def draw_urgency_elements(image, layout, width, height, theme_config, options):
    """Draw urgency elements with custom timer"""
    if not options.get('showUrgency', False):
        return image

    if not theme_config.get('show_urgency', False):
        return image

    draw = ImageDraw.Draw(image)
    urgency_style = theme_config.get('urgency_style', 'timer')
    urgency_pos = layout.get('urgency_position', 'top_center')
    margin = 30

    # Get custom timer values
    timer_hours = options.get('timerHours', random.randint(1, 12))
    timer_mins = options.get('timerMinutes', random.randint(10, 59))
    timer_secs = random.randint(10, 59)

    if urgency_style == 'timer':
        timer_text = f"{timer_hours:02d}:{timer_mins:02d}:{timer_secs:02d}"
        label = "ENDS IN"

        font = load_font(28)
        small_font = load_font(12)

        bbox = draw.textbbox((0, 0), timer_text, font=font)
        timer_w = bbox[2] - bbox[0]

        total_w = timer_w + 40
        total_h = 60

        if 'center' in urgency_pos:
            x = (width - total_w) / 2
        elif 'right' in urgency_pos:
            x = width - total_w - margin
        else:
            x = margin

        y = margin if 'top' in urgency_pos else height - total_h - margin

        # Glow
        glow_color = theme_config.get('badge_glow_color', (255, 0, 0, 100))
        for i in range(3, 0, -1):
            draw.rounded_rectangle(
                [x - i*3, y - i*3, x + total_w + i*3, y + total_h + i*3],
                radius=12 + i*2, fill=(*glow_color[:3], glow_color[3] // (i + 1)))

        draw.rounded_rectangle([x, y, x + total_w, y + total_h], radius=12, fill=(180, 30, 30, 240))
        draw.text((x + total_w/2 - 25, y + 8), label, font=small_font, fill=(255, 255, 255, 200))

        segment_w = timer_w // 3
        tx = x + 20
        ty = y + 25

        for idx, segment in enumerate(timer_text.split(':')):
            draw.rounded_rectangle([tx - 2, ty - 2, tx + segment_w - 8, ty + 28],
                radius=4, fill=(100, 20, 20, 200))
            draw.text((tx + 2, ty), segment, font=font, fill=(255, 255, 255))
            tx += segment_w + 5
            if idx < 2:
                draw.text((tx - 12, ty), ':', font=font, fill=(255, 255, 255, 150))

    elif urgency_style == 'flash':
        text = "⚡ FLASH SALE"
        font = load_font(16)

        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]

        total_w = text_w + 30
        total_h = 36

        x = (width - total_w) / 2 if 'center' in urgency_pos else margin
        y = margin

        draw.rounded_rectangle([x, y, x + total_w, y + total_h],
            radius=total_h // 2, fill=(255, 215, 0, 240))
        draw.text((x + 15, y + 9), text, font=font, fill=(0, 0, 0))

    elif urgency_style == 'limited':
        stock = options.get('stockLeft', random.randint(3, 15))
        text = f"🔥 Only {stock} left!"
        font = load_font(14)

        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]

        total_w = text_w + 25
        total_h = 32

        x = (width - total_w) / 2
        y = margin

        draw.rounded_rectangle([x, y, x + total_w, y + total_h],
            radius=total_h // 2, fill=(211, 47, 47, 230))
        draw.text((x + 12, y + 8), text, font=font, fill=(255, 255, 255))

    elif urgency_style == 'digital':
        time_left = f"{timer_hours:02d}H {timer_mins:02d}M"
        text = f"OFFER EXPIRES: {time_left}"
        font = load_font(13)

        bbox = draw.textbbox((0, 0), text, font=font)
        text_w = bbox[2] - bbox[0]

        total_w = text_w + 30
        total_h = 30

        x = (width - total_w) / 2
        y = margin

        for i in range(3, 0, -1):
            draw.rounded_rectangle([x - i*2, y - i*2, x + total_w + i*2, y + total_h + i*2],
                radius=6, fill=(0, 229, 255, 40 * i))

        draw.rounded_rectangle([x, y, x + total_w, y + total_h], radius=6, fill=(10, 20, 40, 240))
        draw.rounded_rectangle([x, y, x + total_w, y + total_h], radius=6, outline=(0, 229, 255), width=1)
        draw.text((x + 15, y + 7), text, font=font, fill=(0, 229, 255))

    return image


# ═══════════════════════════════════════════════════════════════════════════════
# CTA BUTTON
# ═══════════════════════════════════════════════════════════════════════════════

def draw_cta_button(image, x, y, width, height, gradient_colors, text, text_color, style='pill'):
    """Draw premium CTA button"""
    draw = ImageDraw.Draw(image)
    style_config = CTA_STYLES.get(style, CTA_STYLES['pill'])

    color1 = hex_to_rgb(gradient_colors[0]) if isinstance(gradient_colors[0], str) else gradient_colors[0]
    color2 = hex_to_rgb(gradient_colors[1]) if isinstance(gradient_colors[1], str) else gradient_colors[1]

    radius = int(height * style_config['radius_factor'])

    # Shadow
    draw.rounded_rectangle([x + 4, y + 4, x + width + 4, y + height + 4],
        radius=radius, fill=(0, 0, 0, 80))

    # Gradient fill
    for i in range(int(height)):
        ratio = i / height
        color = interpolate_color(color1, color2, ratio)
        y_pos = y + i

        if i < radius:
            dx = math.sqrt(radius**2 - (radius - i)**2)
            x_start = x + radius - dx
            x_end = x + width - radius + dx
        elif i > height - radius:
            di = i - (height - radius)
            dx = math.sqrt(radius**2 - di**2)
            x_start = x + radius - dx
            x_end = x + width - radius + dx
        else:
            x_start = x
            x_end = x + width

        draw.line([(x_start, y_pos), (x_end, y_pos)], fill=(*color, 255))

    # Highlight
    for i in range(height // 3):
        opacity = int(60 * (1 - i / (height // 3)))
        draw.line([(x + radius, y + i + 2), (x + width - radius, y + i + 2)],
            fill=(255, 255, 255, opacity))

    # Border
    draw.rounded_rectangle([x, y, x + width, y + height], radius=radius, outline=(*color1, 100), width=1)

    # Text
    text_color_rgb = hex_to_rgb(text_color) if isinstance(text_color, str) else text_color
    font = load_font(int(height * 0.4))

    bbox = draw.textbbox((0, 0), text, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]

    draw.text((x + (width - text_w) / 2 + 1, y + (height - text_h) / 2 + 1),
        text, font=font, fill=(0, 0, 0, 60))
    draw.text((x + (width - text_w) / 2, y + (height - text_h) / 2),
        text, font=font, fill=text_color_rgb)


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PROMOTIONAL ELEMENTS
# ═══════════════════════════════════════════════════════════════════════════════

def add_promotional_elements(image, theme, discount, custom_note, layout, aspect_ratio, product_bounds, options):
    """Add all promotional elements"""
    global _last_errors

    try:
        theme_config = THEME_BACKGROUNDS.get(theme, THEME_BACKGROUNDS['black_friday'])
        draw = ImageDraw.Draw(image)
        width, height = image.size

        # === SEASONAL DECORATIONS ===
        if options.get('showDecorations', True):
            apply_seasonal_decorations(image, theme)

        # === DISCOUNT BADGE ===
        if discount:
            badge_text = f"{discount}%"
            sub_text = "OFF"

            badge_size = int(min(width, height) * 0.18)
            if aspect_ratio == '9:16':
                badge_size = int(min(width, height) * 0.12)

            pos = layout['badge_position']
            margin = 35

            positions = {
                'top_right': (width - badge_size - margin, margin),
                'top_left': (margin, margin),
                'top_center': ((width - badge_size) / 2, margin)
            }

            badge_x, badge_y = positions.get(pos, positions['top_right'])

            draw_3d_badge(
                image,
                badge_x + badge_size/2,
                badge_y + badge_size/2,
                badge_size/2,
                theme_config.get('badge_gradient', ['#FFD700', '#FFA000']),
                theme_config.get('badge_glow_color', (255, 215, 0, 100)),
                badge_text,
                theme_config.get('badge_text_color', '#000000'),
                sub_text,
                theme_config.get('badge_style', 'starburst')
            )

            print(f"   ✅ Added {discount}% badge")

        # === SOCIAL PROOF BADGE ===
        if options.get('showSocialProof', False):
            social_type = options.get('socialProofType', 'best_seller')
            sp_pos = layout.get('social_proof_position', 'top_left')
            sp_margin = 25

            if 'right' in sp_pos:
                sp_x = width - 150 - sp_margin
            else:
                sp_x = sp_margin

            sp_y = sp_margin + (80 if discount else 0)

            draw_social_proof_badge(image, sp_x, sp_y, social_type, theme_config)
            print(f"   ✅ Added {social_type} badge")

        # === PRICE TAG ===
        if options.get('showPriceTag', False):
            original_price = options.get('originalPrice', '')
            sale_price = options.get('salePrice', '')

            if original_price or sale_price:
                price_pos = layout.get('price_position', 'bottom_right')
                price_margin = 30

                if 'right' in price_pos:
                    price_x = width - 150 - price_margin
                elif 'center' in price_pos:
                    price_x = (width - 120) / 2
                else:
                    price_x = price_margin

                if 'bottom' in price_pos:
                    price_y = height - 100 - price_margin
                else:
                    price_y = height / 2 - 35

                draw_price_tag(image, price_x, price_y, original_price, sale_price,
                              theme_config, theme_config.get('price_style', 'premium'))
                print(f"   ✅ Added price tag")

        # === CTA BUTTON ===
        cta_text = options.get('ctaText', theme_config.get('cta_text', 'SHOP NOW'))
        cta_gradient = theme_config.get('cta_gradient', ['#000000', '#333333'])
        cta_text_color = theme_config.get('cta_text_color', '#FFFFFF')
        cta_style = theme_config.get('cta_style', 'pill')

        cta_font_size = int(min(width, height) * 0.035)
        if aspect_ratio == '9:16':
            cta_font_size = int(min(width, height) * 0.025)
        cta_font = load_font(cta_font_size)

        bbox = draw.textbbox((0, 0), cta_text, font=cta_font)
        cta_text_w = bbox[2] - bbox[0]
        cta_text_h = bbox[3] - bbox[1]

        style_config = CTA_STYLES.get(cta_style, CTA_STYLES['pill'])
        cta_width = cta_text_w + style_config['padding_x'] * 2
        cta_height = cta_text_h + style_config['padding_y'] * 2

        cta_pos = layout['cta_position']
        cta_margin = 40

        positions = {
            'bottom_center': ((width - cta_width) / 2, height - cta_height - cta_margin),
            'bottom_right': (width - cta_width - cta_margin, height - cta_height - cta_margin),
            'bottom_left': (cta_margin, height - cta_height - cta_margin)
        }

        cta_x, cta_y = positions.get(cta_pos, positions['bottom_center'])

        draw_cta_button(image, cta_x, cta_y, cta_width, cta_height,
                       cta_gradient, cta_text, cta_text_color, cta_style)
        print(f"   ✅ Added CTA: {cta_text}")

        # === CUSTOM NOTE ===
        if custom_note:
            note_font_size = int(min(width, height) * 0.028)
            note_font = load_font(note_font_size, bold=False)

            bbox = draw.textbbox((0, 0), custom_note, font=note_font)
            note_w = bbox[2] - bbox[0]
            note_h = bbox[3] - bbox[1]

            note_padding = 15
            note_box_w = note_w + note_padding * 2
            note_box_h = note_h + note_padding

            note_x = (width - note_box_w) / 2
            note_y = cta_y - note_box_h - 15

            draw.rounded_rectangle([note_x, note_y, note_x + note_box_w, note_y + note_box_h],
                radius=8, fill=(0, 0, 0, 180))
            draw.text((note_x + note_padding, note_y + note_padding/2),
                custom_note, font=note_font, fill='#FFFFFF')
            print(f"   ✅ Added custom note")

        # === URGENCY ===
        image = draw_urgency_elements(image, layout, width, height, theme_config, options)

        # === TRUST BADGES ===
        image = draw_trust_badges(image, layout, width, height, theme_config, options)

        return image

    except Exception as e:
        print(f"   ⚠️ Promo elements error: {e}")
        traceback.print_exc()
        _last_errors.append(f"Promo: {str(e)[:100]}")
        return image


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_creative_v4(image_data, theme, discount, custom_note, aspect_ratio, layout_index, token, proj_id, options):
    """Main v4 generation pipeline"""
    global _last_errors

    layout = LAYOUT_VARIATIONS[layout_index % len(LAYOUT_VARIATIONS)]

    print(f"\n   ═══════════════════════════════════════")
    print(f"   🎨 CREATIVE v4.0 - {layout['name']}")
    print(f"   ═══════════════════════════════════════")

    # Decode product image
    if 'base64,' in image_data:
        base64_clean = image_data.split('base64,')[1]
    else:
        base64_clean = image_data

    product_bytes = base64.b64decode(base64_clean)
    product_image = Image.open(io.BytesIO(product_bytes)).convert('RGBA')

    # AI Product Detection
    if options.get('autoDetect', False):
        print("\n   📍 Step 0: AI Product Detection")
        product_info = detect_product_category(image_data, token, proj_id)
        print(f"   📦 Detected: {product_info.get('category', 'general')}")

        # Auto-select social proof based on detection
        if product_info.get('suggested_badge') and product_info['suggested_badge'] != 'none':
            options['showSocialProof'] = True
            options['socialProofType'] = product_info['suggested_badge']

    # Step 1: Generate background
    print("\n   📍 Step 1: Background Generation")
    background = generate_themed_background(theme, aspect_ratio, layout, token, proj_id)

    # Step 2: Place product
    print("\n   📍 Step 2: Product Placement")
    composite, product_bounds = place_product_on_background(
        background, product_image, theme, aspect_ratio, layout, options)

    # Step 3: Add promotional elements
    print("\n   📍 Step 3: Promotional Elements")
    final = add_promotional_elements(
        composite, theme, discount, custom_note, layout, aspect_ratio, product_bounds, options)

    # Convert to base64
    buffer = io.BytesIO()
    final = final.convert('RGB')
    final.save(buffer, format='PNG', quality=95)
    buffer.seek(0)
    result_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    print(f"\n   ✅ Layout '{layout['name']}' complete")
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

            # v4 options
            options = {
                # Trust Badges
                'showTrustBadges': data.get('showTrustBadges', True),
                'showRating': data.get('showRating', True),
                'showShipping': data.get('showShipping', True),
                'showSoldCount': data.get('showSoldCount', False),
                'soldCount': data.get('soldCount', '1000+'),
                'rating': data.get('rating', 4.9),
                # Urgency
                'showUrgency': data.get('showUrgency', True),
                'timerHours': data.get('timerHours', None),
                'timerMinutes': data.get('timerMinutes', None),
                'stockLeft': data.get('stockLeft', None),
                # Effects
                'showProductGlow': data.get('showProductGlow', True),
                'showSparkles': data.get('showSparkles', True),
                'showReflection': data.get('showReflection', False),
                'showDecorations': data.get('showDecorations', True),
                # Social Proof
                'showSocialProof': data.get('showSocialProof', False),
                'socialProofType': data.get('socialProofType', 'best_seller'),
                # Price Tag
                'showPriceTag': data.get('showPriceTag', False),
                'originalPrice': data.get('originalPrice', ''),
                'salePrice': data.get('salePrice', ''),
                # CTA
                'ctaText': data.get('ctaText', ''),
                # AI Detection
                'autoDetect': data.get('autoDetect', False)
            }

            print(f"\n{'='*60}")
            print("🎨 CREATIVE STUDIO v4.0 - ULTIMATE Ad Generator")
            print(f"   Theme: {theme}")
            print(f"   Discount: {discount}")
            print(f"   Aspect Ratio: {aspect_ratio}")
            print(f"   Output Count: {output_count}")
            print(f"{'='*60}")

            if not image_data:
                raise ValueError("No image provided")

            token = get_fresh_token()

            generated_images = []
            layout_indices = list(range(len(LAYOUT_VARIATIONS)))
            random.shuffle(layout_indices)

            for i in range(output_count):
                print(f"\n📸 Generating image {i+1}/{output_count}...")

                result = generate_creative_v4(
                    image_data=image_data,
                    theme=theme,
                    discount=discount,
                    custom_note=custom_note,
                    aspect_ratio=aspect_ratio,
                    layout_index=layout_indices[i % len(layout_indices)],
                    token=token,
                    proj_id=project_id,
                    options=options
                )

                if result:
                    generated_images.append(result)
                    print(f"   ✅ Image {i+1} done")

            if generated_images:
                print(f"\n✅ Generated {len(generated_images)}/{output_count} ULTIMATE creatives")

                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()

                self.wfile.write(json.dumps({
                    'success': True,
                    'images': generated_images,
                    'output_count': len(generated_images),
                    'theme': theme,
                    'method_used': 'Creative Studio v4.0 - Ultimate'
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
