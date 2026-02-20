"""
Nano Banana Pro Configuration - gemini-3-pro-image-preview
Professional image generation with Thinking mode, 4K support, and text rendering

Model Reference:
- Nano Banana: gemini-2.5-flash-image (fast, high-volume)
- Nano Banana Pro: gemini-3-pro-image-preview (professional quality, text rendering, 4K, Thinking mode)
"""

# ===============================================
# MODEL CONFIGURATION
# ===============================================

MODEL_CONFIG = {
    "primary": "gemini-3-pro-image-preview",
    "fallback": "gemini-2.0-flash-exp",
    "fast": "gemini-2.5-flash-image",  # For batch/quick generation
}

# ===============================================
# RESOLUTION OPTIONS
# ===============================================

RESOLUTION_OPTIONS = {
    "1K": {
        "description": "Standard (1024px)",
        "max_dimension": 1024,
        "cost_multiplier": 1.0
    },
    "2K": {
        "description": "High (2048px)",
        "max_dimension": 2048,
        "cost_multiplier": 1.0  # $0.134/image
    },
    "4K": {
        "description": "Ultra (4096px)",
        "max_dimension": 4096,
        "cost_multiplier": 1.8  # $0.24/image
    }
}

# ===============================================
# ASPECT RATIO OPTIONS (Pomelli-level support)
# ===============================================

ASPECT_RATIOS = {
    # Square
    "1:1": {"description": "Square", "category": "square"},

    # Portrait (vertical)
    "2:3": {"description": "Portrait Standard", "category": "portrait"},
    "3:4": {"description": "Portrait 3:4", "category": "portrait"},
    "4:5": {"description": "Instagram Portrait", "category": "portrait"},
    "5:4": {"description": "Portrait 5:4", "category": "portrait"},
    "9:16": {"description": "Story/Reel", "category": "portrait"},

    # Landscape (horizontal)
    "3:2": {"description": "Landscape Standard", "category": "landscape"},
    "4:3": {"description": "Landscape 4:3", "category": "landscape"},
    "16:9": {"description": "Wide/Banner", "category": "landscape"},
    "21:9": {"description": "Ultra-wide", "category": "landscape"},
}

# Group aspect ratios by use case
ASPECT_RATIO_PRESETS = {
    "instagram": ["1:1", "4:5", "9:16"],
    "facebook": ["1:1", "4:5", "16:9"],
    "pinterest": ["2:3", "9:16"],
    "twitter": ["16:9", "1:1"],
    "linkedin": ["1:1", "4:3", "16:9"],
    "web": ["16:9", "3:2", "4:3"],
    "print": ["3:2", "4:3", "2:3", "3:4"],
}

# ===============================================
# THINKING MODE (for complex compositions)
# ===============================================

def build_thinking_prompt(base_prompt, product_info=None, complexity="standard"):
    """
    Build a prompt that triggers Gemini's "Thinking" mode for better text rendering
    and complex composition handling.

    Thinking mode prompts use step-by-step reasoning to ensure:
    - Perfect text/logo preservation
    - Correct product placement
    - Accurate brand colors
    - Natural composition
    """

    thinking_header = """
═══════════════════════════════════════════════════════════════════════════════
🧠 THINK STEP-BY-STEP BEFORE GENERATING
═══════════════════════════════════════════════════════════════════════════════

Before creating the image, carefully analyze and plan:

STEP 1: PRODUCT ANALYSIS
- What exactly is this product?
- What are its exact dimensions and proportions?
- What colors are present (note exact RGB values if visible)?
- Are there any text, logos, or graphics? If so, read them character by character.

STEP 2: TEXT/LOGO INVENTORY (CRITICAL)
- List EVERY piece of text visible on the product
- For each text element:
  * What does it say? (spell it out letter by letter)
  * What font style is it? (serif, sans-serif, script, etc.)
  * What color is it?
  * Where exactly is it positioned?
- For logos: describe shape, colors, and position

STEP 3: TEXTURE & MATERIAL ANALYSIS
- What material is the product made of?
- What is the surface texture? (matte, glossy, rough, smooth, etc.)
- Are there any patterns? Describe them.

STEP 4: COMPOSITION PLANNING
- Where should the product be placed in the final image?
- What angle shows the product best while preserving all text/logos?
- What lighting will make the product look professional?

STEP 5: QUALITY CHECK (Before generating)
- Will ALL text be readable in the output?
- Will ALL logos be preserved exactly?
- Will colors match the original exactly?

═══════════════════════════════════════════════════════════════════════════════
NOW GENERATE THE IMAGE FOLLOWING YOUR ANALYSIS
═══════════════════════════════════════════════════════════════════════════════
"""

    # Add product-specific context if available
    product_context = ""
    if product_info:
        product_context = f"""
KNOWN PRODUCT INFORMATION:
- Type: {product_info.get('product_type', 'Unknown')}
- Has Text: {product_info.get('has_text', False)}
- Text Content: {product_info.get('text_details', 'None detected')}
- Visible Side: {product_info.get('visible_side', 'Unknown')}
"""

    # Text rendering emphasis for complex mode
    text_rendering_rules = """
⚠️ TEXT RENDERING RULES (ABSOLUTE PRIORITY):
1. Every character must be PIXEL-PERFECT identical to the source
2. Font style, weight, and size must NOT change
3. Text positioning must NOT shift
4. If you're unsure about a character, look at the source image again
5. NO hallucinated or invented text - only render what exists
6. Logos must maintain exact proportions and colors
"""

    if complexity == "high":
        return thinking_header + product_context + text_rendering_rules + "\n\n" + base_prompt
    elif complexity == "standard":
        return product_context + text_rendering_rules + "\n\n" + base_prompt
    else:  # "fast"
        return base_prompt


# ===============================================
# GENERATION CONFIG BUILDER
# ===============================================

def build_generation_config(
    aspect_ratio="1:1",
    resolution="2K",
    enable_thinking=True,
    response_modalities=None
):
    """
    Build the generation config for Gemini API calls.

    Args:
        aspect_ratio: One of the supported aspect ratios
        resolution: "1K", "2K", or "4K"
        enable_thinking: Whether to use thinking mode prompts
        response_modalities: Override response types (default: IMAGE, TEXT)

    Returns:
        dict: Generation config for API call
    """

    config = {
        "responseModalities": response_modalities or ["IMAGE", "TEXT"]
    }

    # Add aspect ratio if not 1:1
    if aspect_ratio and aspect_ratio != "1:1":
        config["aspectRatio"] = aspect_ratio

    # Resolution is typically handled by the model, but we can hint at quality
    resolution_config = RESOLUTION_OPTIONS.get(resolution, RESOLUTION_OPTIONS["2K"])

    # For 4K, we might need additional quality parameters
    if resolution == "4K":
        # These are hints - actual 4K support depends on the model
        config["candidateCount"] = 1  # Focus on quality over quantity

    return config


# ===============================================
# TEMPLATE PROMPT BUILDER (for Phase 3)
# ===============================================

def build_template_prompt(template_type, product_info=None, business_dna=None):
    """
    Build prompts optimized for specific template types.
    This will be expanded in Phase 3.
    """

    base_templates = {
        "studio": """Professional studio product photography.
Clean, warm beige background (#E8DDD0).
Soft diffused lighting.
Product centered, grounded on surface.
Sharp focus, photorealistic quality.""",

        "model_try_on": """Fashion product on model/mannequin.
Professional fashion photography style.
Model wearing/holding the product naturally.
Studio or lifestyle setting.
Product details clearly visible.""",

        "flatlay": """Flat lay product photography.
Top-down perspective.
Clean, minimal background.
Product laid flat, styled with complementary props.
Balanced composition.""",

        "lifestyle": """Lifestyle product photography.
Product in natural use context.
Authentic, relatable setting.
Natural lighting.
Product as hero while showing real-world use.""",

        "contextual": """Contextual product photography.
Product in its natural environment.
Setting matches product category.
Tells a story about product use.
Professional quality, natural feel.""",
    }

    base = base_templates.get(template_type, base_templates["studio"])

    # Add business DNA styling if available
    if business_dna:
        brand_context = f"""
BRAND STYLING:
- Primary Color: {business_dna.get('colors', {}).get('primary', '#000000')}
- Brand Tone: {', '.join(business_dna.get('brandTone', ['professional']))}
- Aesthetic: {', '.join(business_dna.get('brandAesthetic', ['modern']))}
"""
        base = brand_context + "\n" + base

    return base


# ===============================================
# SYNTHID WATERMARK HANDLING
# ===============================================

SYNTHID_INFO = """
Note: Images generated by Gemini models include SynthID digital watermarks.
These are invisible to humans but can be detected by Google's tools.
This helps identify AI-generated content while maintaining image quality.
"""

def get_synthid_status():
    """Return information about SynthID watermarking."""
    return {
        "enabled": True,
        "info": "SynthID digital watermark is automatically embedded",
        "visibility": "Invisible to humans",
        "detection": "Detectable by Google's SynthID tools"
    }


# ===============================================
# CREDIT COST CALCULATOR
# ===============================================

CREDIT_COSTS = {
    "1K": 3,
    "2K": 5,
    "4K": 8,
    "thinking_mode": 2,  # Extra credits for thinking mode
    "template_generation": 5,
    "batch_discount": 0.5,  # 50% discount for batch API
}

def calculate_credits(resolution="2K", use_thinking=True, count=1, is_batch=False):
    """
    Calculate credit cost for image generation.

    Args:
        resolution: "1K", "2K", or "4K"
        use_thinking: Whether thinking mode is enabled
        count: Number of images to generate
        is_batch: Whether using batch API (50% discount)

    Returns:
        int: Total credits required
    """
    base_cost = CREDIT_COSTS.get(resolution, 5)

    if use_thinking:
        base_cost += CREDIT_COSTS["thinking_mode"]

    total = base_cost * count

    if is_batch:
        total = int(total * CREDIT_COSTS["batch_discount"])

    return total


print("✅ Nano Banana Pro configuration loaded")
print(f"   Primary model: {MODEL_CONFIG['primary']}")
print(f"   Aspect ratios: {len(ASPECT_RATIOS)} supported")
print(f"   Resolutions: 1K, 2K, 4K")
