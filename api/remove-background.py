"""
VOLLA - Quick Background Removal API
Uses Imagen 3 to put product on PURE WHITE background (no studio effects)
"""

from http.server import BaseHTTPRequestHandler
import json
import base64
import os

# Import google genai
from google import genai
from google.genai import types

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        """Handle background removal request"""
        print("\n📥 BACKGROUND REMOVAL REQUEST")
        
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            image_data = data.get('image', '')
            vertex_api_key = data.get('vertex_api_key', '')
            
            if not image_data:
                self._send_error(400, 'No image provided')
                return
            
            # Get API key from request or environment
            api_key = vertex_api_key or os.environ.get('VERTEX_API_KEY', '') or os.environ.get('GOOGLE_API_KEY', '')
            
            if not api_key:
                self._send_error(401, 'Vertex API key required. Please add it in Settings.')
                return
            
            print(f"🖼️ Image size: {len(image_data)} chars")
            print(f"🔑 API Key: {'provided' if vertex_api_key else 'from env'}")
            
            # Clean base64 data
            if 'base64,' in image_data:
                image_data = image_data.split('base64,')[1]
            
            # Decode image bytes
            image_bytes = base64.b64decode(image_data)
            
            # Initialize client
            client = genai.Client(api_key=api_key)
            
            # STRICT PURE WHITE BACKGROUND PROMPT - No studio effects!
            prompt = """PURE SOLID WHITE BACKGROUND ONLY.
Hex color: #FFFFFF (pure white, no gray, no cream, no beige).
No shadows. No gradients. No studio lighting effects.
No floor. No surface. Just flat solid white.
Keep the product/subject EXACTLY as is - preserve all details.
The background must be completely uniform white like a PNG cutout."""
            
            # Try Imagen 3 - INPAINT with MASK_MODE_BACKGROUND first (better for removal)
            result = None
            models = ['imagen-3.0-capability-001', 'imagen-3.0-generate-002']
            
            for model_name in models:
                try:
                    print(f"   Trying {model_name}...")
                    
                    reference_image = types.RawReferenceImage(
                        reference_id=1,
                        reference_image=types.Image(image_bytes=image_bytes)
                    )
                    
                    # Method 1: Try INPAINT with background mask (cleaner result)
                    try:
                        print("   Trying INPAINT + MASK_MODE_BACKGROUND...")
                        response = client.models.edit_image(
                            model=model_name,
                            prompt=prompt,
                            reference_images=[reference_image],
                            config=types.EditImageConfig(
                                edit_mode='EDIT_MODE_INPAINT_INSERTION',
                                mask_mode='MASK_MODE_BACKGROUND',
                                number_of_images=1
                            )
                        )
                        
                        if response.generated_images:
                            img_bytes = response.generated_images[0].image.image_bytes
                            img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                            result = f"data:image/png;base64,{img_b64}"
                            print(f"   ✅ Success with INPAINT + MASK_MODE_BACKGROUND")
                            break
                    except Exception as inpaint_err:
                        print(f"   ⚠️ INPAINT failed: {str(inpaint_err)[:60]}, trying BGSWAP...")
                    
                    # Method 2: Fallback to BGSWAP
                    response = client.models.edit_image(
                        model=model_name,
                        prompt=prompt,
                        reference_images=[reference_image],
                        config=types.EditImageConfig(
                            edit_mode='EDIT_MODE_BGSWAP',
                            number_of_images=1
                        )
                    )
                    
                    if response.generated_images:
                        img_bytes = response.generated_images[0].image.image_bytes
                        img_b64 = base64.b64encode(img_bytes).decode('utf-8')
                        result = f"data:image/png;base64,{img_b64}"
                        print(f"   ✅ Success with BGSWAP")
                        break
                        
                except Exception as e:
                    print(f"   ⚠️ {model_name} failed: {str(e)[:80]}")
                    continue
            
            if result:
                self._send_json(200, {
                    'success': True,
                    'result_image': result,
                    'method': 'imagen-bgremove'
                })
            else:
                # Return original if all methods fail
                self._send_json(200, {
                    'success': True,
                    'result_image': f'data:image/jpeg;base64,{image_data}',
                    'method': 'fallback',
                    'note': 'AI processing failed, returned original'
                })
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self._send_error(500, str(e))
    
    def _send_json(self, status, data):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _send_error(self, status, message):
        """Send error response"""
        self._send_json(status, {'success': False, 'error': message})
