# Debug endpoint - test Imagen 3 API directly
import os
import json
import base64
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Debug Imagen 3 API"""
        results = {
            "step": "init",
            "errors": []
        }
        
        try:
            # Step 1: Check env vars
            GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
            VERTEX_API_KEY = os.environ.get("VERTEX_API_KEY")
            API_KEY = VERTEX_API_KEY or GOOGLE_API_KEY
            
            results["env"] = {
                "google_key": bool(GOOGLE_API_KEY),
                "vertex_key": bool(VERTEX_API_KEY),
                "active_key": "vertex" if VERTEX_API_KEY else ("google" if GOOGLE_API_KEY else "none"),
                "key_prefix": API_KEY[:15] if API_KEY else "NONE"
            }
            
            # Step 2: Try to import SDK
            results["step"] = "import"
            try:
                from google import genai
                from google.genai import types
                results["sdk_import"] = "SUCCESS"
            except ImportError as e:
                results["sdk_import"] = f"FAILED: {str(e)}"
                raise
            
            # Step 3: Create client
            results["step"] = "client"
            try:
                client = genai.Client(api_key=API_KEY)
                results["client"] = "SUCCESS"
            except Exception as e:
                results["client"] = f"FAILED: {str(e)}"
                raise
            
            # Step 4: Try a simple generation (text only)
            results["step"] = "test_generate"
            try:
                response = client.models.generate_content(
                    model="gemini-2.0-flash",
                    contents="Say hello in one word"
                )
                results["text_gen"] = "SUCCESS: " + (response.text[:50] if response.text else "no text")
            except Exception as e:
                results["text_gen"] = f"FAILED: {str(e)[:100]}"
            
            # Step 5: Try Imagen 3 list (this will likely fail with API key)
            results["step"] = "imagen_test"
            try:
                # Just try to access the model info
                results["imagen_note"] = "Imagen 3 API requires Service Account (OAuth2), not API key"
            except Exception as e:
                results["imagen_test"] = f"FAILED: {str(e)[:100]}"
            
            results["status"] = "complete"
            
        except Exception as e:
            results["error"] = str(e)
            results["status"] = "failed"
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(results, indent=2).encode())
