"""
Business DNA Analyzer - Website Crawler & Brand Extraction
Extracts brand identity from websites: colors, fonts, logo, tagline, tone, products

Features:
- Website crawling with intelligent content extraction
- Brand color palette detection
- Logo detection and extraction
- Tagline and value proposition extraction
- Brand tone analysis (professional, playful, luxury, etc.)
- Product image detection
"""

import os
import base64
import json
import traceback
import requests
import re
from http.server import BaseHTTPRequestHandler
from urllib.parse import urljoin, urlparse
from collections import Counter

print("=" * 60)
print("🧬 Business DNA Analyzer")
print("=" * 60)

# Environment
GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY")

# ===============================================
# COLOR EXTRACTION
# ===============================================

def extract_colors_from_css(css_text):
    """Extract colors from CSS text"""
    colors = []

    # Hex colors
    hex_pattern = r'#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b'
    hex_matches = re.findall(hex_pattern, css_text)
    for match in hex_matches:
        if len(match) == 3:
            color = f"#{match[0]*2}{match[1]*2}{match[2]*2}"
        else:
            color = f"#{match}"
        colors.append(color.upper())

    # RGB/RGBA colors
    rgb_pattern = r'rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)'
    rgb_matches = re.findall(rgb_pattern, css_text)
    for r, g, b in rgb_matches:
        hex_color = f"#{int(r):02X}{int(g):02X}{int(b):02X}"
        colors.append(hex_color)

    return colors


def analyze_color_palette(colors):
    """Analyze colors and extract primary/secondary/accent"""
    if not colors:
        return {
            "primary": "#000000",
            "secondary": "#666666",
            "accent": "#0066CC",
            "background": "#FFFFFF",
            "text": "#333333"
        }

    # Count color frequency
    color_counts = Counter(colors)
    most_common = color_counts.most_common(10)

    # Filter out common defaults (white, black, gray)
    brand_colors = []
    for color, count in most_common:
        # Skip very light colors (likely backgrounds)
        if color.upper() in ['#FFFFFF', '#FFF', '#FAFAFA', '#F5F5F5', '#EEEEEE']:
            continue
        # Skip pure black
        if color.upper() in ['#000000', '#000']:
            continue
        brand_colors.append(color)

    # Assign roles
    primary = brand_colors[0] if len(brand_colors) > 0 else "#0066CC"
    secondary = brand_colors[1] if len(brand_colors) > 1 else "#333333"
    accent = brand_colors[2] if len(brand_colors) > 2 else primary

    return {
        "primary": primary,
        "secondary": secondary,
        "accent": accent,
        "background": "#FFFFFF",
        "text": "#333333",
        "all_colors": brand_colors[:6]
    }


# ===============================================
# WEBSITE CONTENT EXTRACTION
# ===============================================

def fetch_website_content(url):
    """Fetch website HTML content"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
        }

        response = requests.get(url, headers=headers, timeout=30, allow_redirects=True)
        response.raise_for_status()

        return {
            "success": True,
            "html": response.text,
            "final_url": response.url,
            "status_code": response.status_code
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


def extract_meta_info(html):
    """Extract meta information from HTML"""
    meta_info = {
        "title": "",
        "description": "",
        "keywords": [],
        "og_title": "",
        "og_description": "",
        "og_image": ""
    }

    # Title
    title_match = re.search(r'<title[^>]*>([^<]+)</title>', html, re.IGNORECASE)
    if title_match:
        meta_info["title"] = title_match.group(1).strip()

    # Meta description
    desc_match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if not desc_match:
        desc_match = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*name=["\']description["\']', html, re.IGNORECASE)
    if desc_match:
        meta_info["description"] = desc_match.group(1).strip()

    # Keywords
    keywords_match = re.search(r'<meta[^>]*name=["\']keywords["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if keywords_match:
        meta_info["keywords"] = [k.strip() for k in keywords_match.group(1).split(',')]

    # Open Graph
    og_title_match = re.search(r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if og_title_match:
        meta_info["og_title"] = og_title_match.group(1).strip()

    og_desc_match = re.search(r'<meta[^>]*property=["\']og:description["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if og_desc_match:
        meta_info["og_description"] = og_desc_match.group(1).strip()

    og_image_match = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html, re.IGNORECASE)
    if og_image_match:
        meta_info["og_image"] = og_image_match.group(1).strip()

    return meta_info


def extract_logo_candidates(html, base_url):
    """Find potential logo images"""
    logos = []

    # Look for images with "logo" in src, alt, or class
    logo_patterns = [
        r'<img[^>]*(?:src|data-src)=["\']([^"\']*logo[^"\']*)["\']',
        r'<img[^>]*class=["\'][^"\']*logo[^"\']*["\'][^>]*(?:src|data-src)=["\']([^"\']+)["\']',
        r'<img[^>]*alt=["\'][^"\']*logo[^"\']*["\'][^>]*(?:src|data-src)=["\']([^"\']+)["\']',
        r'<link[^>]*rel=["\']icon["\'][^>]*href=["\']([^"\']+)["\']',
        r'<link[^>]*rel=["\']apple-touch-icon["\'][^>]*href=["\']([^"\']+)["\']',
    ]

    for pattern in logo_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE)
        for match in matches:
            full_url = urljoin(base_url, match)
            if full_url not in logos:
                logos.append(full_url)

    return logos[:5]  # Return top 5 candidates


def extract_product_images(html, base_url):
    """Find product images on the page"""
    products = []

    # Look for images in product-related containers
    product_patterns = [
        r'<img[^>]*class=["\'][^"\']*product[^"\']*["\'][^>]*(?:src|data-src)=["\']([^"\']+)["\']',
        r'<img[^>]*(?:src|data-src)=["\']([^"\']*product[^"\']*)["\']',
        r'<div[^>]*class=["\'][^"\']*product[^"\']*["\'][^>]*>.*?<img[^>]*(?:src|data-src)=["\']([^"\']+)["\']',
    ]

    for pattern in product_patterns:
        matches = re.findall(pattern, html, re.IGNORECASE | re.DOTALL)
        for match in matches:
            full_url = urljoin(base_url, match)
            if full_url not in products and not any(x in full_url.lower() for x in ['icon', 'logo', 'avatar', 'placeholder']):
                products.append(full_url)

    return products[:10]  # Return top 10 product images


def extract_inline_styles(html):
    """Extract inline styles and style tags"""
    styles = []

    # Style tags
    style_matches = re.findall(r'<style[^>]*>(.*?)</style>', html, re.IGNORECASE | re.DOTALL)
    styles.extend(style_matches)

    # Inline styles
    inline_matches = re.findall(r'style=["\']([^"\']+)["\']', html, re.IGNORECASE)
    styles.extend(inline_matches)

    return '\n'.join(styles)


# ===============================================
# AI-POWERED BRAND ANALYSIS
# ===============================================

def analyze_brand_with_ai(website_content, meta_info):
    """Use Gemini to analyze brand tone and values"""
    if not GOOGLE_API_KEY:
        return {
            "brandTone": ["professional"],
            "brandValues": ["quality"],
            "brandAesthetic": ["modern"],
            "tagline": meta_info.get("description", "")[:100],
            "targetAudience": "general"
        }

    # Prepare content for analysis
    content_for_analysis = f"""
Website Title: {meta_info.get('title', '')}
Meta Description: {meta_info.get('description', '')}
Keywords: {', '.join(meta_info.get('keywords', []))}

Analyze this brand and provide:
1. Brand Tone (choose 2-3): professional, playful, luxury, minimalist, bold, friendly, innovative, traditional, youthful, sophisticated, trustworthy, energetic
2. Brand Values (choose 2-3): quality, innovation, sustainability, affordability, craftsmanship, customer-focus, authenticity, creativity, reliability, excellence
3. Brand Aesthetic (choose 2-3): modern, classic, minimalist, bold, elegant, rustic, futuristic, organic, industrial, artistic
4. Suggested Tagline (based on the brand, max 10 words)
5. Target Audience (one phrase)

Return JSON only:
{{"brandTone": ["tone1", "tone2"], "brandValues": ["value1", "value2"], "brandAesthetic": ["aesthetic1", "aesthetic2"], "tagline": "tagline here", "targetAudience": "audience description"}}
"""

    try:
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GOOGLE_API_KEY}"

        payload = {
            "contents": [{"parts": [{"text": content_for_analysis}]}],
            "generationConfig": {"temperature": 0.7, "maxOutputTokens": 500}
        }

        response = requests.post(url, json=payload, timeout=30)

        if response.status_code == 200:
            data = response.json()
            text = data.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')

            # Parse JSON from response
            if '{' in text and '}' in text:
                json_str = text[text.find('{'):text.rfind('}')+1]
                return json.loads(json_str)
    except Exception as e:
        print(f"   ⚠️ AI analysis failed: {e}")

    return {
        "brandTone": ["professional"],
        "brandValues": ["quality"],
        "brandAesthetic": ["modern"],
        "tagline": meta_info.get("description", "")[:100],
        "targetAudience": "general"
    }


# ===============================================
# MAIN ANALYZER FUNCTION
# ===============================================

def analyze_website(url):
    """Main function to analyze a website and extract Business DNA"""
    print(f"🔍 Analyzing: {url}")

    # Ensure URL has protocol
    if not url.startswith('http'):
        url = 'https://' + url

    # Fetch website
    result = fetch_website_content(url)
    if not result["success"]:
        return {
            "success": False,
            "error": f"Failed to fetch website: {result.get('error')}"
        }

    html = result["html"]
    final_url = result["final_url"]
    base_url = f"{urlparse(final_url).scheme}://{urlparse(final_url).netloc}"

    print(f"   ✅ Fetched {len(html)} bytes from {final_url}")

    # Extract meta information
    meta_info = extract_meta_info(html)
    print(f"   📝 Title: {meta_info['title'][:50]}...")

    # Extract styles and colors
    styles = extract_inline_styles(html)
    all_colors = extract_colors_from_css(styles)
    color_palette = analyze_color_palette(all_colors)
    print(f"   🎨 Found {len(all_colors)} colors, primary: {color_palette['primary']}")

    # Find logo candidates
    logos = extract_logo_candidates(html, base_url)
    print(f"   🖼️ Found {len(logos)} logo candidates")

    # Find product images
    products = extract_product_images(html, base_url)
    print(f"   📦 Found {len(products)} product images")

    # AI-powered brand analysis
    brand_analysis = analyze_brand_with_ai(html[:5000], meta_info)
    print(f"   🧠 Brand tone: {', '.join(brand_analysis.get('brandTone', []))}")

    # Compile Business DNA
    business_dna = {
        "success": True,
        "websiteUrl": final_url,
        "domain": urlparse(final_url).netloc,

        # Brand Identity
        "brandName": meta_info["title"].split('|')[0].split('-')[0].strip() if meta_info["title"] else "",
        "tagline": brand_analysis.get("tagline", meta_info.get("description", "")[:100]),
        "description": meta_info.get("description", ""),

        # Visual Identity
        "colors": color_palette,
        "logoUrl": logos[0] if logos else None,
        "logoCandidates": logos,

        # Brand Personality
        "brandTone": brand_analysis.get("brandTone", ["professional"]),
        "brandValues": brand_analysis.get("brandValues", ["quality"]),
        "brandAesthetic": brand_analysis.get("brandAesthetic", ["modern"]),
        "targetAudience": brand_analysis.get("targetAudience", "general"),

        # Products
        "productImages": products,

        # Metadata
        "keywords": meta_info.get("keywords", []),
        "ogImage": meta_info.get("og_image", ""),

        # For template matching
        "suggestedTemplateStyles": determine_template_styles(brand_analysis),
    }

    return business_dna


def determine_template_styles(brand_analysis):
    """Determine which template styles match the brand"""
    tones = brand_analysis.get("brandTone", [])
    aesthetics = brand_analysis.get("brandAesthetic", [])

    styles = []

    # Map tones to template styles
    if "luxury" in tones or "sophisticated" in aesthetics or "elegant" in aesthetics:
        styles.append("premium")
    if "playful" in tones or "youthful" in tones or "energetic" in tones:
        styles.append("vibrant")
    if "minimalist" in aesthetics or "modern" in aesthetics:
        styles.append("minimal")
    if "bold" in tones or "bold" in aesthetics:
        styles.append("bold")
    if "traditional" in tones or "classic" in aesthetics:
        styles.append("classic")
    if "organic" in aesthetics or "rustic" in aesthetics:
        styles.append("natural")

    if not styles:
        styles = ["modern"]  # Default

    return styles


# ===============================================
# HTTP HANDLER
# ===============================================

class handler(BaseHTTPRequestHandler):

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_POST(self):
        print("\n📥 Business DNA Analysis Request")

        try:
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))

            url = data.get('url', '')

            if not url:
                raise ValueError("No URL provided")

            print(f"🌐 Analyzing: {url}")

            # Analyze website
            result = analyze_website(url)

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps(result).encode())

            if result.get("success"):
                print(f"✅ Analysis complete: {result.get('brandName')}")
            else:
                print(f"⚠️ Analysis failed: {result.get('error')}")

        except Exception as e:
            print(f"❌ ERROR: {e}")
            traceback.print_exc()

            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ Business DNA Analyzer ready")
print("   POST /api/business-dna-analyzer with {url: 'https://example.com'}")
