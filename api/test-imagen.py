# Diagnostic endpoint to test Imagen 3 API directly
import os
import json
import base64
from http.server import BaseHTTPRequestHandler

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Test Imagen 3 API availability"""
        result = {
            "status": "testing",
            "tests": {}
        }
        
        # Test 1: Environment variables
        GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")
        VERTEX_API_KEY = os.environ.get("VERTEX_API_KEY")
        API_KEY = VERTEX_API_KEY or GOOGLE_API_KEY
        
        result["tests"]["env_vars"] = {
            "google_api_key": bool(GOOGLE_API_KEY),
            "vertex_api_key": bool(VERTEX_API_KEY),
            "active_key": "vertex" if VERTEX_API_KEY else ("google" if GOOGLE_API_KEY else "none")
        }
        
        # Test 2: google-genai import
        try:
            from google import genai
            from google.genai import types
            result["tests"]["genai_import"] = "SUCCESS"
            
            # Test 3: Client creation
            try:
                client = genai.Client(api_key=API_KEY)
                result["tests"]["client_creation"] = "SUCCESS"
                
                # Test 4: List available models
                try:
                    models = []
                    for model in client.models.list():
                        if 'imagen' in model.name.lower():
                            models.append(model.name)
                    result["tests"]["imagen_models"] = models[:5] if models else "No Imagen models found"
                except Exception as e:
                    result["tests"]["imagen_models"] = f"ERROR: {str(e)[:100]}"
                    
            except Exception as e:
                result["tests"]["client_creation"] = f"ERROR: {str(e)[:150]}"
                
        except ImportError as e:
            result["tests"]["genai_import"] = f"IMPORT_ERROR: {str(e)}"
        
        # Test 5: old genai SDK
        try:
            import google.generativeai as genai_old
            if GOOGLE_API_KEY:
                genai_old.configure(api_key=GOOGLE_API_KEY)
            result["tests"]["old_genai_import"] = "SUCCESS"
        except ImportError as e:
            result["tests"]["old_genai_import"] = f"IMPORT_ERROR: {str(e)}"
        
        result["status"] = "complete"
        
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
