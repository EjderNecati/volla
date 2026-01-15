"""
LemonSqueezy Webhook Handler
Processes payment confirmations and updates user credits
"""
from http.server import BaseHTTPRequestHandler
import json
import hmac
import hashlib
import os

# Webhook signing secret (set in Vercel environment variables)
WEBHOOK_SECRET = os.environ.get('LEMONSQUEEZY_WEBHOOK_SECRET', '')

# Plan credits
PLAN_CREDITS = {
    'starter': 100,
    'pro': 400,
    'business': 1200
}

# Variant to plan mapping
VARIANT_TO_PLAN = {
    '1210536': ('starter', 'monthly'),
    '1210594': ('starter', 'yearly'),
    '1210603': ('pro', 'monthly'),
    '1210606': ('pro', 'yearly'),
    '1210608': ('business', 'monthly'),
    '1210610': ('business', 'yearly')
}

class handler(BaseHTTPRequestHandler):
    def do_POST(self):
        try:
            # Read body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            
            # Verify signature (if secret is set)
            if WEBHOOK_SECRET:
                signature = self.headers.get('X-Signature', '')
                expected = hmac.new(
                    WEBHOOK_SECRET.encode(),
                    body,
                    hashlib.sha256
                ).hexdigest()
                
                if not hmac.compare_digest(signature, expected):
                    print("❌ Invalid webhook signature")
                    self.send_response(401)
                    self.end_headers()
                    return
            
            # Parse webhook data
            data = json.loads(body)
            event_name = data.get('meta', {}).get('event_name', '')
            
            print(f"📨 Webhook received: {event_name}")
            
            # Handle different event types
            if event_name == 'order_created':
                self.handle_order_created(data)
            elif event_name == 'subscription_created':
                self.handle_subscription_created(data)
            elif event_name == 'subscription_updated':
                self.handle_subscription_updated(data)
            elif event_name == 'subscription_cancelled':
                self.handle_subscription_cancelled(data)
            
            # Always return 200 to acknowledge receipt
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'received': True}).encode())
            
        except Exception as e:
            print(f"❌ Webhook error: {str(e)}")
            self.send_response(500)
            self.end_headers()
    
    def handle_order_created(self, data):
        """Handle new order - add credits to user"""
        try:
            attributes = data.get('data', {}).get('attributes', {})
            
            # Extract order info
            order_id = data.get('data', {}).get('id')
            email = attributes.get('user_email', '')
            total = attributes.get('total_formatted', '')
            status = attributes.get('status', '')
            
            # Get variant ID from first order item
            first_order_item = attributes.get('first_order_item', {})
            variant_id = str(first_order_item.get('variant_id', ''))
            
            # Get custom data (user_id, user_email)
            custom_data = data.get('meta', {}).get('custom_data', {})
            user_id = custom_data.get('user_id', '')
            user_email = custom_data.get('user_email', email)
            
            # Map variant to plan
            plan_info = VARIANT_TO_PLAN.get(variant_id, ('unknown', 'unknown'))
            plan_name, billing = plan_info
            credits = PLAN_CREDITS.get(plan_name, 0)
            
            print(f"✅ Order created:")
            print(f"   Order ID: {order_id}")
            print(f"   Email: {user_email}")
            print(f"   Plan: {plan_name} ({billing})")
            print(f"   Credits: {credits}")
            print(f"   Total: {total}")
            print(f"   Status: {status}")
            
            # TODO: Add credits to user in database
            # For now, credits are managed client-side in localStorage
            # In production, you'd want to:
            # 1. Look up user by email/user_id
            # 2. Update their subscription in database
            # 3. Add credits to their account
            
        except Exception as e:
            print(f"❌ Error handling order: {str(e)}")
    
    def handle_subscription_created(self, data):
        """Handle new subscription"""
        try:
            attributes = data.get('data', {}).get('attributes', {})
            variant_id = str(attributes.get('variant_id', ''))
            user_email = attributes.get('user_email', '')
            
            plan_info = VARIANT_TO_PLAN.get(variant_id, ('unknown', 'unknown'))
            print(f"✅ Subscription created: {user_email} -> {plan_info[0]} ({plan_info[1]})")
            
        except Exception as e:
            print(f"❌ Error handling subscription: {str(e)}")
    
    def handle_subscription_updated(self, data):
        """Handle subscription update (upgrade/downgrade)"""
        try:
            attributes = data.get('data', {}).get('attributes', {})
            variant_id = str(attributes.get('variant_id', ''))
            user_email = attributes.get('user_email', '')
            status = attributes.get('status', '')
            
            plan_info = VARIANT_TO_PLAN.get(variant_id, ('unknown', 'unknown'))
            print(f"📝 Subscription updated: {user_email} -> {plan_info[0]} ({status})")
            
        except Exception as e:
            print(f"❌ Error handling subscription update: {str(e)}")
    
    def handle_subscription_cancelled(self, data):
        """Handle subscription cancellation"""
        try:
            attributes = data.get('data', {}).get('attributes', {})
            user_email = attributes.get('user_email', '')
            
            print(f"🚫 Subscription cancelled: {user_email}")
            
            # TODO: Downgrade user to free plan in database
            
        except Exception as e:
            print(f"❌ Error handling cancellation: {str(e)}")
