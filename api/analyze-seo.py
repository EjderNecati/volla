"""
PROFESSIONAL SEO Analysis API v2.0
100% Professional Grade - Real Market Intelligence
"""
from http.server import BaseHTTPRequestHandler
import json
import os
import base64
import requests
import re

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
            "inline_data": {
                "mime_type": "image/jpeg",
                "data": image_b64
            }
        })

    payload = {
        "contents": [{"parts": parts}],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 4096
        }
    }

    response = requests.post(url, json=payload, timeout=60)
    if response.status_code != 200:
        raise ValueError(f"Gemini error: {response.status_code}")

    data = response.json()
    return data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')


def detect_product(image_bytes):
    """Quick product detection with multiple search keywords"""
    prompt = """Analyze this product image carefully.

Return ONLY valid JSON with:
{
  "productType": "very specific product type (e.g., 'handmade ceramic coffee mug with handle' not just 'mug')",
  "searchKeywords": ["primary keyword", "secondary keyword", "tertiary keyword"],
  "category": "main Etsy category",
  "attributes": {
    "material": "main material",
    "style": "design style",
    "color": "primary color",
    "useCase": "primary use"
  }
}

Be SPECIFIC - the keywords will be used to search Etsy for market data."""

    response = call_gemini(prompt, image_bytes)

    if '```json' in response:
        response = response.split('```json')[1].split('```')[0]
    elif '```' in response:
        response = response.split('```')[1].split('```')[0]

    json_match = re.search(r'\{[\s\S]*\}', response)
    if json_match:
        return json.loads(json_match.group(0))

    return {
        "productType": "handmade item",
        "searchKeywords": ["handmade", "gift", "unique"],
        "category": "Other",
        "attributes": {}
    }


def fetch_etsy_market_data_multi(keywords):
    """Fetch market data for MULTIPLE keywords and combine results"""
    if not ETSY_API_KEY:
        print("   ⚠️ No ETSY_API_KEY")
        return None

    all_prices = []
    all_tags = {}
    all_titles = []
    total_listings = 0
    top_performers = []  # Listings with high favorites/views

    for keyword in keywords[:3]:  # Search top 3 keywords
        try:
            url = "https://openapi.etsy.com/v3/application/listings/active"
            headers = {'x-api-key': ETSY_API_KEY}
            params = {
                'keywords': keyword,
                'limit': 100,
                'sort_on': 'score',
                'includes': 'Images'
            }

            response = requests.get(url, headers=headers, params=params, timeout=15)

            if response.status_code != 200:
                print(f"   ⚠️ Etsy API error for '{keyword}': {response.status_code}")
                continue

            api_data = response.json()
            results = api_data.get('results', [])
            total_listings += api_data.get('count', 0)

            for item in results:
                # Price
                if 'price' in item:
                    price = item['price'].get('amount', 0) / item['price'].get('divisor', 100)
                    all_prices.append(price)

                # Tags - with frequency counting
                if 'tags' in item:
                    for tag in item['tags']:
                        if len(tag) <= 20:  # Only valid Etsy tags
                            tag_lower = tag.lower()
                            all_tags[tag_lower] = all_tags.get(tag_lower, 0) + 1

                # Titles
                if 'title' in item:
                    all_titles.append(item['title'][:120])

                # Top performers (high favorites)
                favorites = item.get('num_favorers', 0)
                views = item.get('views', 0)
                if favorites > 50 or views > 500:
                    top_performers.append({
                        'title': item.get('title', '')[:100],
                        'price': item['price'].get('amount', 0) / item['price'].get('divisor', 100) if 'price' in item else 0,
                        'favorites': favorites,
                        'views': views,
                        'tags': item.get('tags', [])[:5]
                    })

            print(f"   📊 '{keyword}': {len(results)} listings analyzed")

        except Exception as e:
            print(f"   ⚠️ Error for '{keyword}': {e}")
            continue

    if not all_prices:
        return None

    # Sort tags by frequency
    sorted_tags = sorted(all_tags.items(), key=lambda x: x[1], reverse=True)
    top_tags = [tag[0] for tag in sorted_tags[:30]]

    # Sort top performers by favorites
    top_performers.sort(key=lambda x: x['favorites'], reverse=True)

    # Price analysis
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
        'topTags': top_tags,
        'tagFrequency': dict(sorted_tags[:20]),
        'topTitles': all_titles[:10],
        'topPerformers': top_performers[:5],
        'competitionLevel': 'HIGH' if total_listings > 50000 else 'MEDIUM' if total_listings > 10000 else 'LOW'
    }


def fetch_google_trends(keywords):
    """Fetch Google Trends with rising queries"""
    try:
        from pytrends.request import TrendReq

        pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))
        pytrends.build_payload(keywords[:5], timeframe='today 3-m')

        # Related queries
        related = pytrends.related_queries()
        rising_keywords = []
        top_keywords = []

        for kw in keywords[:5]:
            if kw in related:
                if related[kw].get('rising') is not None and not related[kw]['rising'].empty:
                    rising = related[kw]['rising'].head(5).to_dict('records')
                    rising_keywords.extend([r['query'] for r in rising if 'query' in r])
                if related[kw].get('top') is not None and not related[kw]['top'].empty:
                    top = related[kw]['top'].head(5).to_dict('records')
                    top_keywords.extend([t['query'] for t in top if 'query' in t])

        return {
            'risingKeywords': list(set(rising_keywords))[:10],
            'topKeywords': list(set(top_keywords))[:10]
        }
    except Exception as e:
        print(f"   ⚠️ Google Trends error: {e}")
        return None


def truncate_tags(tags):
    """Ensure all tags are max 20 characters"""
    result = []
    for tag in tags:
        if len(tag) <= 20:
            result.append(tag)
        else:
            # Try to intelligently truncate
            words = tag.split()
            truncated = ""
            for word in words:
                if len(truncated) + len(word) + 1 <= 20:
                    truncated = f"{truncated} {word}".strip()
                else:
                    break
            if truncated and len(truncated) <= 20:
                result.append(truncated)
            else:
                result.append(tag[:20])
    return result


def generate_fallback_result(product_type, attributes, market_data, marketplace):
    """Generate a fallback SEO result when AI parsing fails"""
    print(f"   🔄 Generating fallback SEO for: {product_type}")

    # Build title from product info
    material = attributes.get('material', '')
    style = attributes.get('style', '')
    color = attributes.get('color', '')

    title_parts = []
    if style:
        title_parts.append(style.title())
    if material:
        title_parts.append(material.title())
    title_parts.append(product_type.title())
    if color:
        title_parts.append(f"- {color.title()}")

    title = ' '.join(title_parts)[:140]

    # Generate basic description
    description = f"""Discover this beautiful {product_type.lower()}.

This carefully crafted item features premium quality and attention to detail. {f'Made with {material.lower()} materials,' if material else ''} this piece showcases {style.lower() if style else 'unique'} design elements.

Perfect for personal use or as a thoughtful gift, this {product_type.lower()} is sure to delight. Each item is made with care and precision.

Order now and enjoy fast shipping and excellent customer service!"""

    # Generate tags from market data or fallback
    tags = []
    if market_data and market_data.get('topTags'):
        tags = market_data['topTags'][:13]
    else:
        # Fallback tags from product attributes
        if product_type:
            tags.append(product_type.lower()[:20])
        if material:
            tags.append(material.lower()[:20])
        if style:
            tags.append(style.lower()[:20])
        if color:
            tags.append(color.lower()[:20])

        # Add generic tags to reach 13
        generic_tags = ['handmade', 'gift idea', 'unique gift', 'home decor', 'special gift',
                        'birthday gift', 'for her', 'for him', 'custom', 'personalized']
        for gt in generic_tags:
            if len(tags) >= 13:
                break
            if gt not in tags:
                tags.append(gt)

    # Ensure tags are max 20 chars
    tags = [t[:20] for t in tags][:13]

    # Suggested price from market data
    suggested_price = "$15.00 - $35.00"
    if market_data:
        p25 = market_data.get('price25th', 15)
        p75 = market_data.get('price75th', 35)
        suggested_price = f"${p25:.2f} - ${p75:.2f}"

    result = {
        "title": title,
        "description": description,
        "tags": tags,
        "category": attributes.get('category', 'Handmade'),
        "productType": product_type,
        "materials": [material] if material else ["mixed materials"],
        "colors": [color] if color else ["multicolor"],
        "occasion": "Gift Giving",
        "style": style or "Modern",
        "suggestedPrice": suggested_price,
        "marketPosition": "Competitive pricing based on market data",
        "_fallbackGenerated": True
    }

    return result


def validate_and_fix_result(result, market_data):
    """Post-process AI result to ensure quality"""

    # Fix tags - ensure 13 tags, all under 20 chars
    if 'tags' in result:
        tags = result['tags']

        # Truncate long tags
        tags = truncate_tags(tags)

        # Remove duplicates
        seen = set()
        unique_tags = []
        for tag in tags:
            tag_lower = tag.lower()
            if tag_lower not in seen:
                seen.add(tag_lower)
                unique_tags.append(tag)

        # If less than 13, add from market data
        if len(unique_tags) < 13 and market_data and 'topTags' in market_data:
            for mt in market_data['topTags']:
                if mt.lower() not in seen and len(mt) <= 20:
                    unique_tags.append(mt)
                    seen.add(mt.lower())
                if len(unique_tags) >= 13:
                    break

        result['tags'] = unique_tags[:13]

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
            post_data = self.rfile.read(content_length) if content_length > 0 else b'{}'
            data = json.loads(post_data.decode('utf-8'))

            image_data = data.get('image', '')
            marketplace = data.get('marketplace', 'etsy')

            print(f"\n{'='*70}")
            print(f"🚀 PROFESSIONAL SEO ANALYSIS v2.0")
            print(f"   Marketplace: {marketplace}")
            print(f"   Image: {len(image_data)} chars")
            print(f"   APIs: Etsy={'✅' if ETSY_API_KEY else '❌'} | Gemini={'✅' if GOOGLE_API_KEY else '❌'}")
            print(f"{'='*70}")

            if not image_data:
                raise ValueError("No image provided")

            # Clean base64
            if 'base64,' in image_data:
                base64_clean = image_data.split('base64,')[1]
            else:
                base64_clean = image_data

            image_bytes = base64.b64decode(base64_clean)

            # ═══════════════════════════════════════════════════════════════
            # STEP 1: PRODUCT DETECTION
            # ═══════════════════════════════════════════════════════════════
            print("   📸 STEP 1: Product Detection...")
            product_info = detect_product(image_bytes)
            product_type = product_info.get('productType', 'handmade item')
            search_keywords = product_info.get('searchKeywords', ['handmade'])
            attributes = product_info.get('attributes', {})
            print(f"   ✅ Product: {product_type}")
            print(f"   🔑 Keywords: {search_keywords}")

            # ═══════════════════════════════════════════════════════════════
            # STEP 2: MULTI-KEYWORD MARKET ANALYSIS
            # ═══════════════════════════════════════════════════════════════
            market_data = None
            trends_data = None

            if marketplace == 'etsy':
                print(f"\n   📊 STEP 2: Multi-Keyword Market Analysis...")
                market_data = fetch_etsy_market_data_multi(search_keywords)

                if market_data:
                    print(f"\n   ══════════════════════════════════════")
                    print(f"   📈 MARKET INTELLIGENCE REPORT")
                    print(f"   ══════════════════════════════════════")
                    print(f"   Total Listings: {market_data['totalListings']:,}")
                    print(f"   Competition: {market_data['competitionLevel']}")
                    print(f"   Price Range: ${market_data['minPrice']} - ${market_data['maxPrice']}")
                    print(f"   Sweet Spot: ${market_data['price25th']} - ${market_data['price75th']}")
                    print(f"   Top Tags: {market_data['topTags'][:5]}")
                    if market_data['topPerformers']:
                        print(f"   🏆 Top Performer: {market_data['topPerformers'][0]['favorites']} favorites")

                # Google Trends
                print(f"\n   📈 STEP 3: Google Trends Analysis...")
                trends_data = fetch_google_trends(search_keywords)
                if trends_data:
                    print(f"   Rising: {trends_data.get('risingKeywords', [])[:3]}")

            # ═══════════════════════════════════════════════════════════════
            # STEP 3: AI ANALYSIS WITH FULL MARKET INTELLIGENCE
            # ═══════════════════════════════════════════════════════════════
            print(f"\n   🤖 STEP 4: AI Analysis with Market Intelligence...")

            if marketplace == 'etsy':
                # Build comprehensive market intelligence
                market_intel = ""
                if market_data:
                    top_performer_info = ""
                    if market_data['topPerformers']:
                        tp = market_data['topPerformers'][0]
                        top_performer_info = f"""
TOP PERFORMING LISTING (for reference):
- Title: {tp['title']}
- Price: ${tp['price']}
- Favorites: {tp['favorites']}
- Tags: {', '.join(tp['tags'])}
"""

                    market_intel = f"""
════════════════════════════════════════════════════════════════════════
📊 REAL ETSY MARKET DATA - USE THIS TO OPTIMIZE!
════════════════════════════════════════════════════════════════════════
MARKET SIZE: {market_data['totalListings']:,} active listings
COMPETITION LEVEL: {market_data['competitionLevel']}

PRICE INTELLIGENCE:
- Full Range: ${market_data['minPrice']} - ${market_data['maxPrice']}
- Average: ${market_data['avgPrice']}
- Median: ${market_data['medianPrice']}
- SWEET SPOT (25th-75th percentile): ${market_data['price25th']} - ${market_data['price75th']}
→ Price your product in the sweet spot for best results!

TOP 20 PROVEN TAGS (from successful listings - USE THESE!):
{', '.join(market_data['topTags'][:20])}

TAG USAGE FREQUENCY:
{', '.join([f"{tag}({count})" for tag, count in list(market_data['tagFrequency'].items())[:10]])}

COMPETITOR TITLE PATTERNS:
{chr(10).join(['→ ' + t for t in market_data['topTitles'][:5]])}
{top_performer_info}
════════════════════════════════════════════════════════════════════════
"""

                trends_intel = ""
                if trends_data:
                    if trends_data.get('risingKeywords'):
                        trends_intel += f"\n🔥 RISING SEARCH TRENDS (include for visibility):\n{', '.join(trends_data['risingKeywords'])}\n"
                    if trends_data.get('topKeywords'):
                        trends_intel += f"\n⭐ TOP SEARCH KEYWORDS:\n{', '.join(trends_data['topKeywords'])}\n"

                prompt = f"""You are an ELITE Etsy SEO specialist with access to REAL-TIME market data.
Your task is to create the MOST COMPETITIVE listing possible.

PRODUCT DETECTED: {product_type}
ATTRIBUTES: {json.dumps(attributes)}
{market_intel}
{trends_intel}

═══════════════════════════════════════════════════════════════════════
YOUR TASK: Create a listing that will OUTPERFORM the competition
═══════════════════════════════════════════════════════════════════════

TITLE (max 140 characters):
- Front-load with the highest-traffic keywords from market data
- Include product type + key differentiator
- Match successful competitor patterns but be unique

DESCRIPTION (400+ words):
- Opening hook that creates immediate desire
- Detailed craftsmanship and quality description
- Materials and their benefits
- Exact dimensions/sizing (estimate if needed)
- Care instructions
- Perfect occasions (gifts, personal use)
- Urgency/scarcity element
- Strong call-to-action
- NO EMOJIS - professional tone

TAGS (exactly 13):
- CRITICAL: Each tag MUST be 20 characters or less!
- USE the proven tags from market data above
- Include rising trend keywords
- Mix: 5 high-traffic + 5 medium-traffic + 3 specific long-tail
- No single generic words

PRICE:
- Base on the SWEET SPOT range from market data
- Position competitively but profitably

Return ONLY this JSON structure:
{{
  "title": "Exactly optimized title under 140 chars",
  "description": "Full 400+ word professional description",
  "tags": ["tag1max20", "tag2max20", "tag3max20", "tag4max20", "tag5max20", "tag6max20", "tag7max20", "tag8max20", "tag9max20", "tag10max20", "tag11max20", "tag12max20", "tag13max20"],
  "category": "Best Etsy category",
  "productType": "{product_type}",
  "materials": ["material1", "material2"],
  "colors": ["primary color", "secondary color"],
  "occasion": "Best gift/use occasion",
  "style": "Design style",
  "suggestedPrice": "$XX.XX - $YY.YY",
  "marketPosition": "Brief competitive positioning note"
}}"""

            elif marketplace == 'amazon':
                prompt = f"""You are an Amazon A9 algorithm expert.
Create an optimized Amazon listing for this product.

PRODUCT: {product_type}

Requirements:
1. TITLE (max 200 chars): [Brand] + Product + Key Features
2. BULLET POINTS (5): Each starts with CAPS benefit keyword
3. DESCRIPTION: A+ content style, rich and detailed
4. SEARCH TERMS (max 249 bytes): Space-separated backend keywords
5. PRICE: Realistic market range

Return ONLY JSON:
{{
  "title": "Amazon optimized title",
  "bulletPoints": ["BENEFIT: Desc", "QUALITY: Desc", "PERFECT FOR: Desc", "EASY TO: Desc", "GREAT GIFT: Desc"],
  "description": "Detailed A+ content",
  "searchTerms": "backend keywords max 249 bytes no commas",
  "category": "Amazon category",
  "productType": "{product_type}",
  "suggestedPrice": "$XX.XX - $YY.YY"
}}"""

            else:  # shopify
                prompt = f"""You are a Shopify/Google SEO expert.
Create an optimized Shopify listing for this product.

PRODUCT: {product_type}

Requirements:
1. TITLE (max 70 chars): Clean, keyword-rich
2. META TITLE (max 60 chars): Google SERP optimized
3. META DESCRIPTION (max 160 chars): Click-worthy CTA
4. HTML DESCRIPTION: Proper <p>, <h3>, <ul> formatting
5. TAGS: 5-10 relevant keywords

Return ONLY JSON:
{{
  "title": "SEO title under 70 chars",
  "metaTitle": "Meta title under 60 chars",
  "metaDescription": "Meta description under 160 chars",
  "description": "<p>Rich HTML description</p>",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "productType": "{product_type}",
  "suggestedPrice": "$XX.XX - $YY.YY"
}}"""

            # Call Gemini
            response_text = call_gemini(prompt, image_bytes)

            # Parse JSON with robust cleaning
            if '```json' in response_text:
                response_text = response_text.split('```json')[1].split('```')[0]
            elif '```' in response_text:
                response_text = response_text.split('```')[1].split('```')[0]

            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                json_str = json_match.group(0)

                # Clean control characters that break JSON parsing
                import unicodedata
                json_str = ''.join(
                    char for char in json_str
                    if unicodedata.category(char) != 'Cc' or char in '\n\r\t'
                )
                # Remove specific problematic characters
                json_str = json_str.replace('\x00', '').replace('\x1f', '')
                json_str = json_str.replace('\r\n', '\\n').replace('\r', '\\n')
                # Fix unescaped newlines in strings
                json_str = re.sub(r'(?<!\\)\n(?=[^"]*"[^"]*(?:"[^"]*"[^"]*)*$)', '\\n', json_str)

                try:
                    result = json.loads(json_str)
                except json.JSONDecodeError as e:
                    print(f"   ⚠️ JSON parse error: {e}")
                    # Try more aggressive cleaning
                    json_str = re.sub(r'[\x00-\x1f\x7f-\x9f]', '', json_str)
                    try:
                        result = json.loads(json_str)
                    except json.JSONDecodeError as e2:
                        print(f"   ⚠️ Second JSON parse error: {e2}")
                        # Generate fallback result using product detection data
                        result = generate_fallback_result(product_type, attributes, market_data, marketplace)
            else:
                # No JSON found - generate fallback result
                print(f"   ⚠️ No JSON found in AI response, using fallback")
                result = generate_fallback_result(product_type, attributes, market_data, marketplace)

            # ═══════════════════════════════════════════════════════════════
            # STEP 4: POST-PROCESSING & VALIDATION
            # ═══════════════════════════════════════════════════════════════
            print(f"\n   ✨ STEP 5: Validating & Optimizing Results...")
            result = validate_and_fix_result(result, market_data)

            # Verify tags
            if 'tags' in result:
                valid_tags = [t for t in result['tags'] if len(t) <= 20]
                invalid_tags = [t for t in result['tags'] if len(t) > 20]
                if invalid_tags:
                    print(f"   ⚠️ Fixed {len(invalid_tags)} oversized tags")
                print(f"   ✅ Final tags: {len(valid_tags)} valid tags")

            # Add market data to response
            if market_data:
                result['_marketData'] = market_data
            if trends_data:
                result['_trendsData'] = trends_data
            result['_searchKeywords'] = search_keywords

            print(f"\n   ✅ ANALYSIS COMPLETE!")
            print(f"{'='*70}\n")

            # Send response
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
            print(f"❌ ERROR: {e}")
            import traceback
            traceback.print_exc()

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ Professional SEO Analysis API v2.0 ready")
