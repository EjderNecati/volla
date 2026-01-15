"""
LemonSqueezy Checkout API
Creates checkout sessions for subscription purchases
"""
from http.server import BaseHTTPRequestHandler
import json
import urllib.request
import urllib.parse
import os

# LemonSqueezy configuration
LEMONSQUEEZY_API_KEY = os.environ.get('LEMONSQUEEZY_API_KEY', '')
STORE_ID = 271817

# Variant IDs
VARIANTS = {
    'starter_monthly': 1210536,
    'starter_yearly': 1210594,
    'pro_monthly': 1210603,
    'pro_yearly': 1210606,
    'business_monthly': 1210608,
    'business_yearly': 1210610
}

# Plan credits
PLAN_CREDITS = {
    'starter': 100,
    'pro': 400,
    'business': 1200
}

class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_POST(self):
        try:
            # Parse request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body) if body else {}
            
            plan_id = data.get('planId', 'pro')
            billing = data.get('billing', 'monthly')
            email = data.get('email', '')
            user_id = data.get('userId', '')
            
            # Get variant ID
            variant_key = f"{plan_id}_{billing}"
            variant_id = VARIANTS.get(variant_key)
            
            if not variant_id:
                self.send_error_response(400, f"Invalid plan: {plan_id} {billing}")
                return
            
            # Build direct checkout URL (no API call needed)
            checkout_url = f"https://volla.lemonsqueezy.com/checkout/buy/{variant_id}"
            
            # Add query params
            params = []
            if email:
                params.append(f"checkout[email]={urllib.parse.quote(email)}")
                params.append(f"checkout[custom][user_email]={urllib.parse.quote(email)}")
            if user_id:
                params.append(f"checkout[custom][user_id]={urllib.parse.quote(user_id)}")
            
            # Add success URL
            params.append(f"checkout[success_url]={urllib.parse.quote('https://www.volla.app/?payment=success')}")
            
            if params:
                checkout_url += "?" + "&".join(params)
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'success': True,
                'checkoutUrl': checkout_url,
                'variantId': variant_id,
                'plan': plan_id,
                'billing': billing
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            print(f"❌ Checkout error: {str(e)}")
            self.send_error_response(500, str(e))
    
    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({
            'success': False,
            'error': message
        }).encode())
