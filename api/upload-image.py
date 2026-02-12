"""
Image Compression Endpoint
Compresses large images server-side using PIL (more efficient than canvas)
Returns compressed image that fits within Vercel payload limits
"""

import io
import base64
import json
from http.server import BaseHTTPRequestHandler
from PIL import Image

def compress_image(image_data, target_size_kb=400):
    """Compress image using PIL - much more efficient than browser canvas."""
    try:
        # Decode base64
        if 'base64,' in image_data:
            b64 = image_data.split('base64,')[1]
        else:
            b64 = image_data

        image_bytes = base64.b64decode(b64)
        img = Image.open(io.BytesIO(image_bytes))

        # Convert to RGB if needed
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        original_size = len(image_bytes) / 1024
        print(f"📦 Original: {original_size:.0f}KB, Target: <{target_size_kb}KB")

        # Progressive compression - start high quality, reduce until target met
        attempts = [
            (1280, 85),  # High quality
            (1280, 75),
            (1024, 75),
            (1024, 65),
            (800, 65),
            (800, 55),
            (640, 55),
            (640, 45),
            (512, 45),
            (512, 35),  # Last resort
        ]

        for max_dim, quality in attempts:
            # Resize if needed
            width, height = img.size
            if max(width, height) > max_dim:
                ratio = max_dim / max(width, height)
                new_size = (int(width * ratio), int(height * ratio))
                resized = img.resize(new_size, Image.Resampling.LANCZOS)
            else:
                resized = img

            # Compress to JPEG
            buffer = io.BytesIO()
            resized.save(buffer, format='JPEG', quality=quality, optimize=True)
            compressed_bytes = buffer.getvalue()
            size_kb = len(compressed_bytes) / 1024

            # Base64 is ~33% larger, so check base64 size too
            b64_result = base64.b64encode(compressed_bytes).decode('utf-8')
            b64_size_kb = len(b64_result) / 1024

            if b64_size_kb <= target_size_kb:
                print(f"✅ Compressed: {original_size:.0f}KB → {b64_size_kb:.0f}KB (b64) [{resized.size[0]}x{resized.size[1]}, q={quality}]")
                return f"data:image/jpeg;base64,{b64_result}", resized.size, b64_size_kb

        # Absolute minimum
        width, height = img.size
        ratio = 512 / max(width, height)
        new_size = (int(width * ratio), int(height * ratio))
        resized = img.resize(new_size, Image.Resampling.LANCZOS)
        buffer = io.BytesIO()
        resized.save(buffer, format='JPEG', quality=30, optimize=True)
        b64_result = base64.b64encode(buffer.getvalue()).decode('utf-8')
        print(f"⚠️ Max compression: {len(b64_result)/1024:.0f}KB")
        return f"data:image/jpeg;base64,{b64_result}", resized.size, len(b64_result)/1024

    except Exception as e:
        print(f"❌ Compression error: {e}")
        raise

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
            if not image_data:
                raise ValueError("No image provided")

            # Compress image server-side with PIL
            compressed_image, dimensions, size_kb = compress_image(image_data, target_size_kb=400)

            result = {
                'success': True,
                'image': compressed_image,
                'dimensions': dimensions,
                'sizeKB': round(size_kb)
            }

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())

        except Exception as e:
            print(f"❌ Error: {e}")
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())

print("✅ Image Compression endpoint ready")
