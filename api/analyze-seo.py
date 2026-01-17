"""
Simple SEO/Text Analysis API using Gemini
Uses GOOGLE_API_KEY for authentication
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import base64

# API Key from Vercel environment
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')

# Initialize Gemini
genai = None
try:
    import google.generativeai as genai_module
    if GOOGLE_API_KEY:
        genai_module.configure(api_key=GOOGLE_API_KEY)
        genai = genai_module
        print(f"✅ Gemini configured with API key")
    else:
        print("⚠️ GOOGLE_API_KEY not set")
except Exception as e:
    print(f"⚠️ Gemini init error: {e}")


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
            print(f"📊 SEO ANALYSIS REQUEST")
            print(f"   Marketplace: {marketplace}")
            print(f"   Image: {len(image_data)} chars")
            print(f"   Gemini: {'Ready' if genai else 'Not available'}")
            print(f"{'='*50}")
            
            if not image_data:
                raise ValueError("No image provided")
            
            if not genai:
                raise ValueError("Gemini API not configured - check GOOGLE_API_KEY")
            
            # Clean base64
            if 'base64,' in image_data:
                base64_clean = image_data.split('base64,')[1]
                mime_type = 'image/jpeg'
                if 'png' in image_data.lower():
                    mime_type = 'image/png'
            else:
                base64_clean = image_data
                mime_type = 'image/jpeg'
            
            image_bytes = base64.b64decode(base64_clean)
            
            # Build prompt based on marketplace
            if marketplace == 'etsy':
                prompt = """Analyze this product image and generate optimized Etsy listing content.

Return a JSON object with:
{
  "title": "Optimized Etsy title (max 140 chars, keyword-rich)",
  "description": "Compelling 2-3 paragraph description",
  "tags": ["tag1", "tag2", ... up to 13 tags],
  "category": "Suggested category",
  "productType": "What type of product this is",
  "materials": ["material1", "material2"],
  "colors": ["color1", "color2"],
  "occasion": "Gift occasion if applicable",
  "style": "Design style (modern, vintage, etc)"
}

Focus on SEO-optimized keywords that Etsy shoppers would search for."""

            elif marketplace == 'amazon':
                prompt = """Analyze this product image and generate optimized Amazon listing content.

Return a JSON object with:
{
  "title": "Amazon optimized title (max 200 chars)",
  "bulletPoints": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5"],
  "description": "Detailed product description",
  "searchTerms": "backend search terms (max 249 bytes)",
  "category": "Suggested Amazon category",
  "productType": "What type of product this is"
}

Focus on A9 algorithm optimization with relevant keywords."""

            else:  # shopify
                prompt = """Analyze this product image and generate optimized Shopify/Google SEO content.

Return a JSON object with:
{
  "title": "SEO optimized title (max 70 chars)",
  "metaTitle": "Meta title for Google (max 60 chars)",
  "metaDescription": "Meta description (max 160 chars)",
  "description": "Full product description with HTML formatting",
  "tags": ["tag1", "tag2", ...],
  "productType": "Product type",
  "vendor": "Suggested vendor/brand name"
}

Focus on Google SEO best practices."""
            
            # Call Gemini
            print("   🤖 Calling Gemini...")
            model = genai.GenerativeModel('gemini-2.0-flash')
            
            response = model.generate_content([
                prompt,
                {"mime_type": mime_type, "data": image_bytes}
            ])
            
            response_text = response.text
            print(f"   ✅ Gemini response: {len(response_text)} chars")
            
            # Try to parse JSON from response
            try:
                # Clean markdown if present
                if '```json' in response_text:
                    response_text = response_text.split('```json')[1].split('```')[0]
                elif '```' in response_text:
                    response_text = response_text.split('```')[1].split('```')[0]
                
                result = json.loads(response_text.strip())
            except:
                # Return raw text if not valid JSON
                result = {"rawResponse": response_text}
            
            # Send success response
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
            print(f"❌ ERROR: {e}")
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ SEO Analysis API ready")
