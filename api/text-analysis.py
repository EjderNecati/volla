"""
PROFESSIONAL Text-Based SEO Analysis API v2.0
100% Professional Grade - Real Market Intelligence
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import re
import requests
import base64

# API Keys
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY', '')
ETSY_API_KEY = os.environ.get('ETSY_API_KEY', '')


def call_gemini(prompt, image_bytes=None):
    """Call Gemini 2.0 Flash via REST API"""
    if not GOOGLE_API_KEY:
        raise ValueError("GOOGLE_API_KEY not set")

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"

    parts = [{"text": prompt}]

    if image_bytes:
        image_b64 = base64.b64encode(image_bytes).decode('utf-8')
        parts.append({
            "inline_data": {"mime_type": "image/jpeg", "data": image_b64}
        })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {"temperature": 0.2, "maxOutputTokens": 4096}
    }

    response = requests.post(url, json=payload, timeout=60)
    if response.status_code != 200:
        raise ValueError(f"Gemini error: {response.status_code}")

    data = response.json()
    return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')


def extract_keywords_from_text(text_input):
    """Extract product info and search keywords from text"""
    prompt = f"""Analyze this product description carefully.

Product description:
{text_input}

Extract:
1. Specific product type
2. Best 3 Etsy search keywords
3. Key attributes

Return ONLY JSON:
{{"productType": "specific type", "searchKeywords": ["kw1", "kw2", "kw3"], "attributes": {{"material": "", "style": "", "color": ""}}}}"""

    response = call_gemini(prompt)

    if '```json' in response:
        response = response.split('```json')[1].split('```')[0]
    elif '```' in response:
        response = response.split('```')[1].split('```')[0]

    json_match = re.search(r'\{[\s\S]*\}', response)
    if json_match:
        return json.loads(json_match.group(0))

    return {"productType": "handmade item", "searchKeywords": ["handmade", "gift"]}


def fetch_etsy_market_data_multi(keywords):
    """Fetch market data for multiple keywords"""
    if not ETSY_API_KEY:
        return None

    all_prices = []
    all_tags = {}
    all_titles = []
    total_listings = 0
    top_performers = []

    for keyword in keywords[:3]:
        try:
            url = "https://openapi.etsy.com/v3/application/listings/active"
            headers = {'x-api-key': ETSY_API_KEY}
            params = {'keywords': keyword, 'limit': 100, 'sort_on': 'score'}

            response = requests.get(url, headers=headers, params=params, timeout=15)
            if response.status_code != 200:
                continue

            api_data = response.json()
            results = api_data.get('results', [])
            total_listings += api_data.get('count', 0)

            for item in results:
                if 'price' in item:
                    price = item['price'].get('amount', 0) / item['price'].get('divisor', 100)
                    all_prices.append(price)

                if 'tags' in item:
                    for tag in item['tags']:
                        if len(tag) <= 20:
                            tag_lower = tag.lower()
                            all_tags[tag_lower] = all_tags.get(tag_lower, 0) + 1

                if 'title' in item:
                    all_titles.append(item['title'][:120])

                favorites = item.get('num_favorers', 0)
                if favorites > 50:
                    top_performers.append({
                        'title': item.get('title', '')[:100],
                        'price': item['price'].get('amount', 0) / item['price'].get('divisor', 100) if 'price' in item else 0,
                        'favorites': favorites,
                        'tags': item.get('tags', [])[:5]
                    })

            print(f"   📊 '{keyword}': {len(results)} listings")

        except Exception as e:
            continue

    if not all_prices:
        return None

    sorted_tags = sorted(all_tags.items(), key=lambda x: x[1], reverse=True)
    top_performers.sort(key=lambda x: x['favorites'], reverse=True)

    all_prices.sort()
    price_25 = all_prices[len(all_prices)//4] if len(all_prices) > 4 else all_prices[0]
    price_75 = all_prices[3*len(all_prices)//4] if len(all_prices) > 4 else all_prices[-1]

    return {
        'totalListings': total_listings,
        'avgPrice': round(sum(all_prices) / len(all_prices), 2),
        'minPrice': round(min(all_prices), 2),
        'maxPrice': round(max(all_prices), 2),
        'medianPrice': round(all_prices[len(all_prices)//2], 2),
        'price25th': round(price_25, 2),
        'price75th': round(price_75, 2),
        'topTags': [tag[0] for tag in sorted_tags[:30]],
        'tagFrequency': dict(sorted_tags[:20]),
        'topTitles': all_titles[:10],
        'topPerformers': top_performers[:5],
        'competitionLevel': 'HIGH' if total_listings > 50000 else 'MEDIUM' if total_listings > 10000 else 'LOW'
    }


def fetch_google_trends(keywords):
    """Fetch Google Trends"""
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
        pytrends.build_payload(keywords[:5], timeframe='today 3-m')

        related = pytrends.related_queries()
        rising = []
        top = []

        for kw in keywords[:5]:
            if kw in related:
                if related[kw].get('rising') is not None and not related[kw]['rising'].empty:
                    rising.extend([r['query'] for r in related[kw]['rising'].head(5).to_dict('records') if 'query' in r])
                if related[kw].get('top') is not None and not related[kw]['top'].empty:
                    top.extend([t['query'] for t in related[kw]['top'].head(5).to_dict('records') if 'query' in t])

        return {'risingKeywords': list(set(rising))[:10], 'topKeywords': list(set(top))[:10]}
    except:
        return None


def truncate_tags(tags):
    """Ensure all tags are max 20 characters"""
    result = []
    for tag in tags:
        if len(tag) <= 20:
            result.append(tag)
        else:
            words = tag.split()
            truncated = ""
            for word in words:
                if len(truncated) + len(word) + 1 <= 20:
                    truncated = f"{truncated} {word}".strip()
                else:
                    break
            result.append(truncated if truncated else tag[:20])
    return result


def validate_result(result, market_data):
    """Post-process and validate"""
    if 'tags' in result:
        tags = truncate_tags(result['tags'])
        seen = set()
        unique = []
        for tag in tags:
            if tag.lower() not in seen:
                seen.add(tag.lower())
                unique.append(tag)

        if len(unique) < 13 and market_data and 'topTags' in market_data:
            for mt in market_data['topTags']:
                if mt.lower() not in seen and len(mt) <= 20:
                    unique.append(mt)
                    seen.add(mt.lower())
                if len(unique) >= 13:
                    break

        result['tags'] = unique[:13]

    return result


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
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            text_input = data.get('text', '')
            marketplace = data.get('marketplace', 'etsy')

            print(f"\n{'='*70}")
            print(f"🚀 PROFESSIONAL TEXT SEO ANALYSIS v2.0")
            print(f"   Marketplace: {marketplace}")
            print(f"   Text: {len(text_input)} chars")
            print(f"{'='*70}")

            if not GOOGLE_API_KEY:
                raise ValueError("GOOGLE_API_KEY not set")

            if not text_input or len(text_input) < 10:
                raise ValueError("Text too short (min 10 chars)")

            # Step 1: Extract keywords
            print("   🔍 Step 1: Extracting keywords...")
            product_info = extract_keywords_from_text(text_input)
            product_type = product_info.get('productType', 'handmade item')
            search_keywords = product_info.get('searchKeywords', ['handmade'])
            print(f"   ✅ Product: {product_type}")
            print(f"   🔑 Keywords: {search_keywords}")

            # Step 2: Market data
            market_data = None
            trends_data = None

            if marketplace == 'etsy':
                print(f"\n   📊 Step 2: Market Analysis...")
                market_data = fetch_etsy_market_data_multi(search_keywords)

                if market_data:
                    print(f"   ✅ {market_data['totalListings']:,} listings analyzed")
                    print(f"   💰 Sweet spot: ${market_data['price25th']} - ${market_data['price75th']}")

                print(f"\n   📈 Step 3: Google Trends...")
                trends_data = fetch_google_trends(search_keywords)

            # Step 3: AI Analysis
            print(f"\n   🤖 Step 4: AI Analysis...")

            if marketplace == 'etsy':
                market_intel = ""
                if market_data:
                    market_intel = f"""
════════════════════════════════════════════════════════════════════════
📊 REAL ETSY MARKET DATA
════════════════════════════════════════════════════════════════════════
MARKET: {market_data['totalListings']:,} listings | Competition: {market_data['competitionLevel']}
PRICES: ${market_data['minPrice']} - ${market_data['maxPrice']} | Sweet Spot: ${market_data['price25th']} - ${market_data['price75th']}

TOP PROVEN TAGS:
{', '.join(market_data['topTags'][:20])}

COMPETITOR TITLES:
{chr(10).join(['→ ' + t for t in market_data['topTitles'][:5]])}
════════════════════════════════════════════════════════════════════════
"""

                trends_intel = ""
                if trends_data:
                    if trends_data.get('risingKeywords'):
                        trends_intel = f"\n🔥 RISING: {', '.join(trends_data['risingKeywords'])}\n"

                prompt = f"""You are an ELITE Etsy SEO specialist. Transform this product description into a TOP-PERFORMING listing.

ORIGINAL DESCRIPTION:
{text_input}

PRODUCT TYPE: {product_type}
{market_intel}
{trends_intel}

CREATE:
1. TITLE (max 140 chars): Front-load keywords from market data
2. DESCRIPTION (400+ words): Professional, compelling, detailed
3. TAGS (exactly 13): EACH MAX 20 CHARS - use proven tags from data!
4. PRICE: Based on market sweet spot

Return ONLY JSON:
{{
  "title": "Optimized title under 140 chars",
  "description": "Full 400+ word professional description",
  "tags": ["max20char1", "max20char2", "max20char3", "max20char4", "max20char5", "max20char6", "max20char7", "max20char8", "max20char9", "max20char10", "max20char11", "max20char12", "max20char13"],
  "suggestedPrice": "$XX.XX - $YY.YY",
  "productType": "{product_type}",
  "category": "Etsy category"
}}"""

            elif marketplace == 'amazon':
                prompt = f"""Transform this into an Amazon listing.

ORIGINAL: {text_input}

Return JSON:
{{
  "title": "Amazon title max 200 chars",
  "bulletPoints": ["BENEFIT: Desc", "QUALITY: Desc", "PERFECT: Desc", "EASY: Desc", "GIFT: Desc"],
  "description": "A+ content",
  "searchTerms": "backend keywords",
  "suggestedPrice": "$XX.XX",
  "productType": "{product_type}"
}}"""

            else:
                prompt = f"""Transform this into a Shopify listing.

ORIGINAL: {text_input}

Return JSON:
{{
  "title": "SEO title max 70 chars",
  "metaTitle": "Meta max 60 chars",
  "metaDescription": "Meta max 160 chars",
  "description": "<p>HTML description</p>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "suggestedPrice": "$XX.XX",
  "productType": "{product_type}"
}}"""

            response_text = call_gemini(prompt)

            # Parse
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0]

            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                result = json.loads(json_match.group(0))
            else:
                raise ValueError("Failed to parse response")

            # Validate
            print(f"\n   ✨ Step 5: Validating...")
            result = validate_result(result, market_data)

            if market_data:
                result['_marketData'] = market_data
            if trends_data:
                result['_trendsData'] = trends_data

            print(f"   ✅ COMPLETE!\n")

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
            print(f"❌ Error: {e}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ Professional Text SEO Analysis API v2.0 ready")
