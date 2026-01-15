# Test endpoint to verify environment variables are loaded
import os
import json
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Check if environment variables are loaded"""
        result = {
            "status": "ok",
            "google_api_key_set": bool(os.environ.get("GOOGLE_API_KEY")),
            "vertex_api_key_set": bool(os.environ.get("VERTEX_API_KEY")),
            "credentials_json_set": bool(os.environ.get("GOOGLE_APPLICATION_CREDENTIALS_JSON")),
            "lemonsqueezy_set": bool(os.environ.get("LEMONSQUEEZY_WEBHOOK_SECRET")),
            # Show first few characters for debugging (safe)
            "google_key_prefix": os.environ.get("GOOGLE_API_KEY", "")[:8] if os.environ.get("GOOGLE_API_KEY") else "NOT_SET",
            "vertex_key_prefix": os.environ.get("VERTEX_API_KEY", "")[:8] if os.environ.get("VERTEX_API_KEY") else "NOT_SET"
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(result, indent=2).encode())
        return
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.end_headers()
        return
