"""
Text Analysis API - SEO from Text or Image
Supports both text-based and image-based product analysis
"""
from http.server import BaseHTTPRequestHandler
import json
import base64
import os
import re

# API Key from Vercel environment
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')

# Initialize Gemini
genai = None
try:
    import google.generativeai as genai_module
    if GOOGLE_API_KEY:
        genai_module.configure(api_key=GOOGLE_API_KEY)
        genai = genai_module
        print("✅ Gemini configured for Text Analysis")
    else:
        print("⚠️ GOOGLE_API_KEY not set")
except Exception as e:
    print(f"❌ Gemini init error: {e}")


def safe_parse_json(text):
    """Robust JSON parser with control character handling"""
    if not text:
        raise ValueError("Empty response")
    
    clean_text = text.strip()
    if '```json' in clean_text:
        clean_text = clean_text.split('```json')[1].split('```')[0]
    elif '```' in clean_text:
        clean_text = clean_text.split('```')[1].split('```')[0]
    
    json_match = re.search(r'\{[\s\S]*\}', clean_text)
    if json_match:
        clean_text = json_match.group(0)
    
    # Remove control characters (except newline, tab) that break JSON parsing
    import unicodedata
    clean_text = ''.join(
        char for char in clean_text 
        if unicodedata.category(char) != 'Cc' or char in '\n\r\t'
    )
    # Also remove any remaining problematic characters
    clean_text = clean_text.replace('\x00', '').replace('\x1f', '')
    
    return json.loads(clean_text)


def analyze_text_content(text_input, marketplace):
    """Analyze text description and generate SEO content"""
    
    if not genai:
        raise ValueError("Gemini API not configured")
    
    prompts = {
        'etsy': f"""You are a Senior Etsy SEO Expert. Analyze this product description and generate optimized listing content.

PRODUCT DESCRIPTION:
{text_input}

══════════════════════════════════════════════════════════════════
GENERATE:
1. TITLE (max 140 chars): Front-load best keywords
2. DESCRIPTION (200+ words): Emotional hook + features + CTA
3. TAGS: Exactly 13 long-tail keywords (2-4 words each)
4. PRICE: Estimated price based on product type
══════════════════════════════════════════════════════════════════

Return ONLY valid JSON:
{{
  "title": "SEO-optimized Etsy title under 140 chars",
  "description": "Full 200+ word description with emotional hook, features, benefits, CTA",
  "tags": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8", "keyword 9", "keyword 10", "keyword 11", "keyword 12", "keyword 13"],
  "suggestedPrice": "$XX.XX",
  "productType": "Product type",
  "category": "Etsy category"
}}""",

        'amazon': f"""You are an Amazon A9 Algorithm Expert. Analyze this product description.

PRODUCT DESCRIPTION:
{text_input}

══════════════════════════════════════════════════════════════════
GENERATE:
1. TITLE (max 200 chars): Brand + Product + Features
2. BULLET POINTS (5): Start each with CAPS keyword
3. DESCRIPTION: A+ content style
4. SEARCH TERMS (max 249 bytes): Space-separated, no commas
5. PRICE: Estimated based on product type
══════════════════════════════════════════════════════════════════

Return ONLY valid JSON:
{{
  "title": "Amazon A9 optimized title under 200 chars",
  "bulletPoints": [
    "KEY BENEFIT: Description",
    "QUALITY MATERIALS: Description",
    "PERFECT SIZE: Description",
    "EASY TO USE: Description",
    "GREAT GIFT: Description"
  ],
  "description": "Detailed A+ content description",
  "searchTerms": "space separated keywords max 249 bytes",
  "suggestedPrice": "$XX.XX",
  "productType": "Product type",
  "category": "Amazon category"
}}""",

        'shopify': f"""You are a Shopify and Google SEO Expert. Analyze this product description.

PRODUCT DESCRIPTION:
{text_input}

══════════════════════════════════════════════════════════════════
GENERATE:
1. TITLE (max 70 chars): Clean, keyword-rich
2. META TITLE (max 60 chars): Google SERP optimized
3. META DESCRIPTION (max 160 chars): Click-worthy with CTA
4. HTML DESCRIPTION: With <p>, <h3>, <ul> tags
5. TAGS: 5-10 keywords
6. PRICE: Estimated
══════════════════════════════════════════════════════════════════

Return ONLY valid JSON:
{{
  "title": "SEO title under 70 chars",
  "metaTitle": "Google meta title under 60 chars",
  "metaDescription": "Meta description under 160 chars with CTA",
  "description": "<p>Opening paragraph...</p><h3>Features</h3><ul><li>Feature 1</li></ul>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedPrice": "$XX.XX",
  "productType": "Product type"
}}"""
    }
    
    prompt = prompts.get(marketplace, prompts['etsy'])
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    generation_config = genai.GenerationConfig(
        temperature=0.1,
        max_output_tokens=4096
    )
    
    response = model.generate_content(
        prompt,
        generation_config=generation_config
    )
    
    return safe_parse_json(response.text)


def analyze_image_content(image_bytes, mime_type, marketplace):
    """Analyze product image and generate SEO content"""
    
    if not genai:
        raise ValueError("Gemini API not configured")
    
    prompts = {
        'etsy': """You are a Senior Etsy SEO Expert. Analyze this product image.

GENERATE:
1. TITLE (max 140 chars): Front-load best keywords
2. DESCRIPTION (200+ words): Emotional hook + features + CTA
3. TAGS: Exactly 13 long-tail keywords (2-4 words each)
4. PRICE: Estimated based on product

Return ONLY valid JSON:
{
  "title": "SEO-optimized Etsy title under 140 chars",
  "description": "Full 200+ word description",
  "tags": ["keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8", "keyword 9", "keyword 10", "keyword 11", "keyword 12", "keyword 13"],
  "suggestedPrice": "$XX.XX",
  "productType": "Product type",
  "category": "Etsy category"
}""",

        'amazon': """You are an Amazon A9 Algorithm Expert. Analyze this product image.

Return ONLY valid JSON:
{
  "title": "Amazon A9 optimized title under 200 chars",
  "bulletPoints": ["KEY BENEFIT: Desc", "QUALITY: Desc", "SIZE: Desc", "EASY: Desc", "GIFT: Desc"],
  "description": "Detailed A+ content description",
  "searchTerms": "space separated keywords max 249 bytes",
  "suggestedPrice": "$XX.XX",
  "productType": "Product type"
}""",

        'shopify': """You are a Shopify SEO Expert. Analyze this product image.

Return ONLY valid JSON:
{
  "title": "SEO title under 70 chars",
  "metaTitle": "Meta title under 60 chars",
  "metaDescription": "Meta description under 160 chars",
  "description": "<p>Description with HTML</p>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedPrice": "$XX.XX"
}"""
    }
    
    prompt = prompts.get(marketplace, prompts['etsy'])
    
    model = genai.GenerativeModel('gemini-2.0-flash')
    
    generation_config = genai.GenerationConfig(
        temperature=0.1,
        max_output_tokens=4096
    )
    
    response = model.generate_content(
        [prompt, {"mime_type": mime_type, "data": image_bytes}],
        generation_config=generation_config
    )
    
    return safe_parse_json(response.text)


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))
            
            text_input = data.get('text', '')
            image_data = data.get('image', '')
            marketplace = data.get('marketplace', 'etsy')
            
            print(f"\n{'='*60}")
            print(f"📊 TEXT/IMAGE ANALYSIS - {marketplace.upper()}")
            print(f"   Text: {len(text_input)} chars")
            print(f"   Image: {len(image_data)} chars")
            print(f"   Gemini: {'Ready' if genai else 'Not available'}")
            print(f"{'='*60}")
            
            if not genai:
                raise ValueError("Gemini API not configured - check GOOGLE_API_KEY")
            
            result = None
            
            # Text-based analysis
            if text_input and len(text_input) >= 10:
                print("   📝 Analyzing text...")
                result = analyze_text_content(text_input, marketplace)
            
            # Image-based analysis
            elif image_data:
                print("   🖼️ Analyzing image...")
                if 'base64,' in image_data:
                    base64_clean = image_data.split('base64,')[1]
                    mime_type = 'image/png' if 'png' in image_data.lower() else 'image/jpeg'
                else:
                    base64_clean = image_data
                    mime_type = 'image/jpeg'
                
                image_bytes = base64.b64decode(base64_clean)
                result = analyze_image_content(image_bytes, mime_type, marketplace)
            
            else:
                raise ValueError("No text or image provided")
            
            print(f"   ✅ Analysis complete!")
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': True,
                'data': result,
                'marketplace': marketplace
            }).encode())
            
        except Exception as e:
            print(f"❌ Error: {e}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ Text/Image Analysis API ready")
