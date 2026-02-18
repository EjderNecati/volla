"""
Etsy Market Search API
Uses Etsy Open API v3 to get market data
Requires ETSY_API_KEY environment variable
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import requests

ETSY_API_KEY = os.environ.get('ETSY_API_KEY', '')

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

            keyword = data.get('keyword', '')
            limit = data.get('limit', 25)

            print(f"\n{'='*50}")
            print(f"🔍 ETSY MARKET SEARCH")
            print(f"   Keyword: {keyword}")
            print(f"   Limit: {limit}")
            print(f"{'='*50}")

            if not ETSY_API_KEY:
                # Return mock data if no API key
                print("   ⚠️ No ETSY_API_KEY - returning limited data")
                result = {
                    'totalCount': 0,
                    'avgPrice': 0,
                    'minPrice': 0,
                    'maxPrice': 0,
                    'topTags': [],
                    'sampleListings': [],
                    'apiKeyMissing': True
                }
            else:
                # Etsy Open API v3
                url = "https://openapi.etsy.com/v3/application/listings/active"
                headers = {
                    'x-api-key': ETSY_API_KEY
                }
                params = {
                    'keywords': keyword,
                    'limit': min(limit, 100),
                    'sort_on': 'score'
                }

                response = requests.get(url, headers=headers, params=params, timeout=15)

                if response.status_code != 200:
                    raise ValueError(f"Etsy API error: {response.status_code} - {response.text[:200]}")

                api_data = response.json()
                results = api_data.get('results', [])

                # Calculate statistics
                prices = []
                all_tags = []

                for item in results:
                    if 'price' in item:
                        price_amount = item['price'].get('amount', 0)
                        price_divisor = item['price'].get('divisor', 100)
                        prices.append(price_amount / price_divisor)
                    if 'tags' in item:
                        all_tags.extend(item['tags'])

                # Tag frequency
                tag_counts = {}
                for tag in all_tags:
                    tag_counts[tag] = tag_counts.get(tag, 0) + 1
                top_tags = sorted(tag_counts.items(), key=lambda x: x[1], reverse=True)[:15]

                result = {
                    'totalCount': api_data.get('count', 0),
                    'avgPrice': round(sum(prices) / len(prices), 2) if prices else 0,
                    'minPrice': round(min(prices), 2) if prices else 0,
                    'maxPrice': round(max(prices), 2) if prices else 0,
                    'topTags': [tag[0] for tag in top_tags],
                    'sampleListings': [
                        {
                            'title': item.get('title', ''),
                            'price': item.get('price', {}).get('amount', 0) / item.get('price', {}).get('divisor', 100) if item.get('price') else 0,
                            'views': item.get('views', 0),
                            'numFavorers': item.get('num_favorers', 0)
                        }
                        for item in results[:5]
                    ]
                }

            print(f"   ✅ Found {result.get('totalCount', 0)} listings")
            print(f"   💰 Price range: ${result.get('minPrice', 0)} - ${result.get('maxPrice', 0)}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': True,
                'data': result
            }).encode())

        except Exception as e:
            print(f"❌ MARKET SEARCH ERROR: {e}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ Etsy Market Search API ready")
