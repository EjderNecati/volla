"""
Text Analysis API - Gemini for SEO
Direct API key usage for reliability
"""
from http.server import BaseHTTPRequestHandler
import json
import base64
import os

# API Key - Try env first, fallback to direct
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '') or 'AIzaSyDb5lhi3wQQONuynWyxaxBU0mSNUt8uMEY'

print(f"🔑 API Key: {GOOGLE_API_KEY[:15]}...")

# Initialize Gemini
genai = None
try:
    import google.generativeai as genai_module
    genai_module.configure(api_key=GOOGLE_API_KEY)
    genai = genai_module
    print("✅ Gemini configured")
except Exception as e:
    print(f"❌ Gemini init error: {e}")


def analyze_image(image_bytes, mime_type, marketplace):
    """Analyze product image and generate SEO content"""
    
    if not genai:
        return {"error": "Gemini not available"}
    
    # Marketplace-specific prompts
    prompts = {
        'etsy': """You are an Etsy SEO expert. Analyze this product image and generate optimized listing content.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "title": "Keyword-rich Etsy title under 140 characters",
  "description": "2-3 paragraph compelling description",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
  "category": "Best Etsy category",
  "productType": "Product type",
  "materials": ["material1", "material2"],
  "colors": ["primary color", "secondary color"],
  "style": "Design style"
}""",

        'amazon': """You are an Amazon A9 algorithm expert. Analyze this product image and generate optimized listing content.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "title": "Amazon optimized title under 200 characters with main keywords",
  "bulletPoints": ["Feature 1 with benefit", "Feature 2 with benefit", "Feature 3 with benefit", "Feature 4 with benefit", "Feature 5 with benefit"],
  "description": "Detailed product description with keywords",
  "searchTerms": "backend search terms max 249 bytes without commas",
  "category": "Amazon category",
  "productType": "Product type"
}""",

        'shopify': """You are a Shopify SEO and Google ranking expert. Analyze this product image and generate optimized content.

Return ONLY a valid JSON object (no markdown, no explanation):
{
  "title": "SEO title under 70 characters",
  "metaTitle": "Meta title for Google under 60 characters",
  "metaDescription": "Meta description under 160 characters",
  "description": "Full HTML product description with paragraphs",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "productType": "Product type",
  "vendor": "Suggested brand name"
}"""
    }
    
    prompt = prompts.get(marketplace, prompts['etsy'])
    
    try:
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        response = model.generate_content([
            prompt,
            {"mime_type": mime_type, "data": image_bytes}
        ])
        
        text = response.text.strip()
        
        # Clean markdown if present
        if '```json' in text:
            text = text.split('```json')[1].split('```')[0]
        elif '```' in text:
            text = text.split('```')[1].split('```')[0]
        
        return json.loads(text.strip())
        
    except json.JSONDecodeError:
        return {"rawText": response.text if response else "No response"}
    except Exception as e:
        return {"error": str(e)}


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
            
            image_data = data.get('image', '')
            marketplace = data.get('marketplace', 'etsy')
            
            print(f"\n{'='*50}")
            print(f"📊 TEXT ANALYSIS - {marketplace.upper()}")
            print(f"   Image size: {len(image_data)} chars")
            print(f"{'='*50}")
            
            if not image_data:
                raise ValueError("No image provided")
            
            # Parse base64
            if 'base64,' in image_data:
                base64_clean = image_data.split('base64,')[1]
                mime_type = 'image/png' if 'png' in image_data.lower() else 'image/jpeg'
            else:
                base64_clean = image_data
                mime_type = 'image/jpeg'
            
            image_bytes = base64.b64decode(base64_clean)
            
            # Analyze
            print("   🤖 Calling Gemini...")
            result = analyze_image(image_bytes, mime_type, marketplace)
            print(f"   ✅ Analysis complete")
            
            # Response
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


print("✅ Text Analysis API ready")
