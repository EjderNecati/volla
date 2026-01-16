"""
Simple API Test - Check if GOOGLE_API_KEY works
"""
from http.server import BaseHTTPRequestHandler
import json
import os

GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        # Check if API key exists
        has_key = bool(GOOGLE_API_KEY)
        key_preview = GOOGLE_API_KEY[:10] + "..." if has_key else "NOT SET"
        
        result = {
            "status": "ok",
            "google_api_key_exists": has_key,
            "key_preview": key_preview,
            "message": "API key is set!" if has_key else "GOOGLE_API_KEY not found in environment"
        }
        
        # Try a simple API call if key exists
        if has_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=GOOGLE_API_KEY)
                model = genai.GenerativeModel('gemini-2.0-flash')
                response = model.generate_content("Say 'API is working!' in 3 words or less")
                result["api_test"] = "SUCCESS"
                result["api_response"] = response.text[:100] if response.text else "No response"
            except Exception as e:
                result["api_test"] = "FAILED"
                result["api_error"] = str(e)[:200]
        
        self.wfile.write(json.dumps(result, indent=2).encode())

print("✅ API Test endpoint ready")
