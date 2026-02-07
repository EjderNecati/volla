"""
Creative Studio v8.0 - GEMINI 3 PRO IMAGE EDITION
==================================================
World-class promotional image generation using:
1. Gemini 3 Pro (Thinking) - Analyzes product & plans design
2. Gemini 3 Pro Image - Generates professional creative

Two-stage AI process for Canva-quality results.
"""

import os
import io
import json
import base64
import traceback
from http.server import BaseHTTPRequestHandler
from PIL import Image

print("=" * 60)
print("Creative Studio v8.0 - GEMINI 3 PRO IMAGE")
print("=" * 60)

# ═══════════════════════════════════════════════════════════════════════════════
# GOOGLE GENAI CLIENT SETUP
# ═══════════════════════════════════════════════════════════════════════════════

GOOGLE_CREDENTIALS_JSON = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON", "")
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY", "")

genai_client = None

try:
    from google import genai

    # Try API key first (simpler)
    if GOOGLE_API_KEY:
        genai_client = genai.Client(api_key=GOOGLE_API_KEY)
        print(f"Gemini client ready (API Key)")
    elif GOOGLE_CREDENTIALS_JSON:
        # Use service account
        creds_dict = json.loads(GOOGLE_CREDENTIALS_JSON)
        project_id = creds_dict.get("project_id", "")
        genai_client = genai.Client(
            vertexai=True,
            project=project_id,
            location="us-central1"
        )
        print(f"Gemini client ready (Vertex AI: {project_id})")
    else:
        print("WARNING: No Google credentials found!")

except Exception as e:
    print(f"Gemini client setup failed: {e}")
    traceback.print_exc()


# ═══════════════════════════════════════════════════════════════════════════════
# THEME CONFIGURATIONS
# ═══════════════════════════════════════════════════════════════════════════════

THEMES = {
    'black_friday': {
        'name': 'Black Friday',
        'style': 'dark, luxurious, premium feel with gold accents',
        'colors': 'black background, gold text and badges, white accents',
        'mood': 'exclusive, urgent, premium deals',
        'typical_elements': 'gold sparkles, elegant typography, dark gradient'
    },
    'flash_sale': {
        'name': 'Flash Sale',
        'style': 'energetic, urgent, eye-catching',
        'colors': 'red and yellow, high contrast, vibrant',
        'mood': 'urgent, exciting, limited time',
        'typical_elements': 'lightning bolts, countdown feel, bold fonts'
    },
    'valentines': {
        'name': "Valentine's Day",
        'style': 'romantic, soft, lovely',
        'colors': 'pink, red, rose gold, soft pastels',
        'mood': 'romantic, warm, gift-giving',
        'typical_elements': 'hearts, roses, soft gradients'
    },
    'christmas': {
        'name': 'Christmas',
        'style': 'festive, warm, holiday spirit',
        'colors': 'red, green, gold, white snow accents',
        'mood': 'joyful, festive, gift season',
        'typical_elements': 'snowflakes, ornaments, warm lighting'
    },
    'summer_sale': {
        'name': 'Summer Sale',
        'style': 'bright, sunny, fresh',
        'colors': 'yellow, orange, bright blue, sunny tones',
        'mood': 'fun, refreshing, vacation vibes',
        'typical_elements': 'sun rays, beach elements, tropical feel'
    },
    'new_year': {
        'name': 'New Year',
        'style': 'celebratory, elegant, fresh start',
        'colors': 'navy blue, gold, silver, sparkles',
        'mood': 'celebration, new beginnings, premium',
        'typical_elements': 'confetti, fireworks, champagne feel'
    },
    'mothers_day': {
        'name': "Mother's Day",
        'style': 'elegant, soft, appreciative',
        'colors': 'lavender, pink, soft purple, rose',
        'mood': 'loving, appreciative, elegant',
        'typical_elements': 'flowers, soft textures, elegant fonts'
    },
    'easter': {
        'name': 'Easter',
        'style': 'spring fresh, playful, cheerful',
        'colors': 'pastel green, yellow, pink, light blue',
        'mood': 'spring, renewal, family',
        'typical_elements': 'easter eggs, flowers, spring elements'
    },
    'halloween': {
        'name': 'Halloween',
        'style': 'spooky, fun, mysterious',
        'colors': 'purple, orange, black, neon green',
        'mood': 'spooky fun, mysterious, playful scary',
        'typical_elements': 'pumpkins, bats, gothic fonts'
    },
    'cyber_monday': {
        'name': 'Cyber Monday',
        'style': 'tech, futuristic, digital',
        'colors': 'dark blue, cyan, neon accents, matrix feel',
        'mood': 'tech deals, digital age, modern',
        'typical_elements': 'circuit patterns, neon glow, digital elements'
    },
    'spring_sale': {
        'name': 'Spring Sale',
        'style': 'fresh, blooming, renewal',
        'colors': 'light green, pink blossoms, fresh white',
        'mood': 'fresh start, nature, renewal',
        'typical_elements': 'cherry blossoms, leaves, fresh feel'
    },
    'back_to_school': {
        'name': 'Back to School',
        'style': 'academic, youthful, organized',
        'colors': 'blue, yellow, red accents, clean whites',
        'mood': 'educational, preparation, student life',
        'typical_elements': 'notebooks, pencils, clean layout'
    }
}

ASPECT_DIMENSIONS = {
    '1:1': (1080, 1080),
    '4:5': (1080, 1350),
    '9:16': (1080, 1920)
}


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 1: DESIGN THINKING WITH GEMINI 3 PRO
# ═══════════════════════════════════════════════════════════════════════════════

def analyze_and_plan_design(product_image_b64, theme_name, discount, aspect_ratio, options):
    """
    Use Gemini 3 Pro to analyze the product and create a detailed design plan.
    This ensures thoughtful placement of all elements.
    """
    if not genai_client:
        raise Exception("Gemini client not initialized")

    theme = THEMES.get(theme_name, THEMES['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, (1080, 1080))

    # Decode image for analysis
    if 'base64,' in product_image_b64:
        b64 = product_image_b64.split('base64,')[1]
    else:
        b64 = product_image_b64

    image_bytes = base64.b64decode(b64)
    product_image = Image.open(io.BytesIO(image_bytes))

    # Build the analysis prompt
    analysis_prompt = f"""You are an expert promotional graphic designer. Analyze this product image and create a detailed design plan for a {theme['name']} promotional banner.

PRODUCT IMAGE: [Attached]

THEME: {theme['name']}
- Style: {theme['style']}
- Colors: {theme['colors']}
- Mood: {theme['mood']}
- Typical elements: {theme['typical_elements']}

BANNER SPECS:
- Dimensions: {dimensions[0]}x{dimensions[1]} pixels
- Aspect ratio: {aspect_ratio}
- Discount: {discount}% OFF (if provided)

ADDITIONAL OPTIONS:
- Show free shipping: {options.get('showShipping', False)}
- Show rating: {options.get('showRating', False)} (Rating: {options.get('rating', 4.9)})
- Social proof badge: {options.get('socialProofType', 'none')}
- Original price: {options.get('originalPrice', '')}
- Sale price: {options.get('salePrice', '')}
- CTA text: {options.get('ctaText', 'SHOP NOW')}

YOUR TASK:
Analyze the product and create a specific design plan. Consider:

1. PRODUCT ANALYSIS:
   - What type of product is this?
   - What are its key visual features?
   - What colors dominate the product?

2. LAYOUT DECISION:
   - Where should the product be placed? (center, right side, left side)
   - How large should the product be? (percentage of canvas)
   - Should product have shadow, glow, or reflection?

3. DISCOUNT BADGE PLACEMENT:
   - Where exactly should the "{discount}% OFF" badge go?
   - What size and style? (circle, rectangle, starburst)
   - Consider: not covering important product features

4. TEXT HIERARCHY:
   - Main headline placement and size
   - Subheadline if needed
   - Where should "FREE SHIPPING" text go (if enabled)?
   - CTA button placement

5. BACKGROUND DESIGN:
   - Gradient direction and colors
   - Decorative elements that complement (not distract)
   - How to make product stand out

6. COLOR HARMONY:
   - How do theme colors work with product colors?
   - Any adjustments needed for contrast?

Respond with a detailed, specific design brief that can be used to generate the final image. Be precise about positions (top-left, center-right, bottom, etc.) and sizes (large, medium, small).

FORMAT YOUR RESPONSE AS A CLEAR DESIGN BRIEF."""

    print("   Step 1: Analyzing product & planning design...")

    try:
        # Call Gemini 3 Pro for analysis
        response = genai_client.models.generate_content(
            model="gemini-3-pro-preview",
            contents=[analysis_prompt, product_image]
        )

        design_plan = response.text
        print(f"   Design plan created ({len(design_plan)} chars)")
        return design_plan, product_image

    except Exception as e:
        print(f"   Design analysis failed: {e}")
        # Fallback to a generic plan
        return create_fallback_plan(theme, discount, options), product_image


def create_fallback_plan(theme, discount, options):
    """Fallback design plan if AI analysis fails"""
    return f"""
DESIGN BRIEF (Fallback):
- Theme: {theme['name']}
- Layout: Product centered-right (60% of canvas), text on left
- Discount badge: Top-left corner, circular, {discount}% OFF
- Headline: Bold {theme['name'].upper()} text, left side
- Background: Diagonal gradient using {theme['colors']}
- CTA: Bottom-left, prominent button style
- Free shipping: Below CTA if enabled
"""


# ═══════════════════════════════════════════════════════════════════════════════
# STEP 2: IMAGE GENERATION WITH GEMINI 3 PRO IMAGE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_promotional_image(product_image, design_plan, theme_name, discount, aspect_ratio, options, variation_idx):
    """
    Use Gemini 3 Pro Image to generate the final promotional banner.
    The product is preserved while adding promotional elements around it.
    """
    if not genai_client:
        raise Exception("Gemini client not initialized")

    theme = THEMES.get(theme_name, THEMES['black_friday'])
    dimensions = ASPECT_DIMENSIONS.get(aspect_ratio, (1080, 1080))

    # Build variation instructions
    variation_styles = [
        "classic and balanced layout",
        "bold and dramatic with larger text",
        "minimal and elegant with more whitespace",
        "dynamic with angled elements"
    ]
    variation_style = variation_styles[variation_idx % len(variation_styles)]

    # Build the generation prompt
    generation_prompt = f"""Create a professional {theme['name']} promotional banner image.

CRITICAL INSTRUCTION: The product in the attached image must be PRESERVED EXACTLY as it appears. Do not modify, distort, or alter the product in any way. Only add promotional design elements AROUND the product.

DESIGN BRIEF FROM ART DIRECTOR:
{design_plan}

SPECIFIC REQUIREMENTS:
1. PRODUCT PRESERVATION:
   - Keep the product image EXACTLY as provided
   - Product should be the hero - large and prominent
   - Add subtle shadow beneath product for depth
   - Product must be clearly visible and recognizable

2. THEME: {theme['name']}
   - Style: {theme['style']}
   - Color palette: {theme['colors']}
   - Mood: {theme['mood']}

3. PROMOTIONAL ELEMENTS TO ADD:
   - Main headline: "{theme['name'].upper()}" in bold, stylish typography
   {"- Discount badge: '" + str(discount) + "% OFF' - prominent circular or starburst badge" if discount else ""}
   {"- 'FREE SHIPPING' text badge" if options.get('showShipping') else ""}
   {"- Rating stars: " + str(options.get('rating', 4.9)) + " stars" if options.get('showRating') else ""}
   {"- Price: Was $" + str(options.get('originalPrice')) + " Now $" + str(options.get('salePrice')) if options.get('originalPrice') and options.get('salePrice') else ""}
   - CTA button: "{options.get('ctaText', 'SHOP NOW')}"

4. CANVAS:
   - Dimensions: {dimensions[0]}x{dimensions[1]} pixels
   - Aspect ratio: {aspect_ratio}

5. STYLE VARIATION:
   - This is variation #{variation_idx + 1}: {variation_style}

6. QUALITY STANDARDS:
   - Professional Canva-template quality
   - Clean, readable typography
   - Proper visual hierarchy
   - Text must be spelled correctly
   - No cluttered or amateur look
   - Balanced composition

Generate a stunning, professional promotional image that could be used for Instagram, Facebook ads, or e-commerce banners."""

    print(f"   Step 2: Generating image (variation {variation_idx + 1})...")

    try:
        # Call Gemini 3 Pro Image for generation
        response = genai_client.models.generate_content(
            model="gemini-3-pro-image-preview",
            contents=[generation_prompt, product_image]
        )

        # Extract generated image from response
        for part in response.parts:
            if hasattr(part, 'inline_data') and part.inline_data is not None:
                # Get raw image bytes from inline_data
                image_bytes = part.inline_data.data
                mime_type = part.inline_data.mime_type

                print(f"   Got image: {mime_type}, {len(image_bytes)} bytes")

                # Convert to PIL Image
                pil_image = Image.open(io.BytesIO(image_bytes))

                # Resize to exact dimensions if needed
                if pil_image.size != dimensions:
                    pil_image = pil_image.resize(dimensions, Image.Resampling.LANCZOS)

                # Convert to base64
                buffer = io.BytesIO()
                pil_image.save(buffer, format='PNG', quality=95)
                buffer.seek(0)
                result_b64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

                print(f"   Variation {variation_idx + 1} generated successfully")
                return f"data:image/png;base64,{result_b64}"

        # Check for text-only response (no image generated)
        if response.text:
            print(f"   Model returned text instead of image: {response.text[:200]}...")

        raise Exception("No image in response")

    except Exception as e:
        print(f"   Generation failed: {e}")
        traceback.print_exc()
        return None


# ═══════════════════════════════════════════════════════════════════════════════
# MAIN PIPELINE
# ═══════════════════════════════════════════════════════════════════════════════

def generate_creative_v8(image_data, theme_name, discount, aspect_ratio, output_count, options):
    """
    Main v8.0 generation pipeline:
    1. Analyze product with Gemini 3 Pro
    2. Generate variations with Gemini 3 Pro Image
    """
    print(f"\n{'='*60}")
    print(f"CREATIVE STUDIO v8.0 - GEMINI 3 PRO IMAGE")
    print(f"Theme: {theme_name}, Discount: {discount}%, Count: {output_count}")
    print(f"{'='*60}")

    # Step 1: Analyze and plan
    design_plan, product_image = analyze_and_plan_design(
        image_data, theme_name, discount, aspect_ratio, options
    )

    # Step 2: Generate variations
    generated_images = []
    for i in range(output_count):
        print(f"\n   Generating variation {i + 1}/{output_count}...")
        result = generate_promotional_image(
            product_image, design_plan, theme_name, discount,
            aspect_ratio, options, i
        )
        if result:
            generated_images.append(result)

    print(f"\n{'='*60}")
    print(f"Generated {len(generated_images)}/{output_count} images")
    print(f"{'='*60}")

    return generated_images


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
                'ctaText': data.get('ctaText', 'SHOP NOW'),
            }

            if not image_data:
                raise ValueError("No image provided")

            # Generate with v8.0 pipeline
            generated = generate_creative_v8(
                image_data, theme, discount, aspect_ratio, output_count, options
            )

            if generated:
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    'success': True,
                    'images': generated,
                    'theme': theme,
                    'version': '8.0-gemini3'
                }).encode())
            else:
                raise Exception("Generation failed - no images produced")

        except Exception as e:
            print(f"ERROR: {e}")
            traceback.print_exc()
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e),
                'version': '8.0-gemini3'
            }).encode())
