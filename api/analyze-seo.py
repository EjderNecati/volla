"""
Simple SEO/Text Analysis API using Gemini
Uses GOOGLE_API_KEY for authentication
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import requests

# API Key from Vercel environment
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')

def call_gemini_flash(prompt, image_bytes):
    """Call Gemini 2.0 Flash via REST API"""
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not set")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"
    
    headers = {
        "Content-Type": "application/json"
    }
    
    # Encode image
    image_b64 = base64.b64encode(image_bytes).decode('utf-8')
    
    payload = {
        "contents": [{
            "parts": [
                {"text": prompt},
                {
                    "inline_data": {
                        "mime_type": "image/jpeg",
                        "data": image_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "temperature": 0.5,
            "maxOutputTokens": 4096
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
        if response.status_code != 200:
            return f"Error: {response.status_code} - {response.text}"
            
        data = response.json()
        return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
    except Exception as e:
        return f"Error: {str(e)}"


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
            
            # Read body safely
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
            else:
                data = {}
            
            image_data = data.get('image', '')
            marketplace = data.get('marketplace', 'etsy')
            
            print(f"\n{'='*50}")
            print(f"📊 SEO ANALYSIS REQUEST (REST API)")
            print(f"   Marketplace: {marketplace}")
            print(f"   Image: {len(image_data)} chars")
            print(f"{'='*50}")
            
            if not image_data:
                raise ValueError("No image provided")
            
            # Clean base64
            if 'base64,' in image_data:
                base64_clean = image_data.split('base64,')[1]
            else:
                base64_clean = image_data
            
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
            
            # Call Gemini via REST
            print("   🤖 Calling Gemini via REST...")
            response_text = call_gemini_flash(prompt, image_bytes)
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
