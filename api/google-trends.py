"""
Google Trends API
Fetches search trend data for keywords using pytrends
No API key required
"""
from http.server import BaseHTTPRequestHandler
import json

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

            keywords = data.get('keywords', [])[:5]  # Max 5 keywords

            print(f"\n{'='*50}")
            print(f"📈 GOOGLE TRENDS REQUEST")
            print(f"   Keywords: {keywords}")
            print(f"{'='*50}")

            if not keywords:
                raise ValueError("No keywords provided")

            # Import pytrends here to avoid slow startup
            from pytrends.request import TrendReq

            pytrends = TrendReq(hl='en-US', tz=360, timeout=(10, 25))

            # Build payload for last 3 months
            pytrends.build_payload(keywords, timeframe='today 3-m')

            # Interest over time
            trend_data = []
            rising_keywords = []

            try:
                interest_df = pytrends.interest_over_time()

                if not interest_df.empty:
                    # Sample every week to reduce data points
                    sampled = interest_df.iloc[::7] if len(interest_df) > 12 else interest_df

                    for date, row in sampled.iterrows():
                        point = {
                            'date': date.strftime('%Y-%m-%d'),
                            'values': {}
                        }
                        for kw in keywords:
                            if kw in row:
                                point['values'][kw] = int(row[kw])
                        trend_data.append(point)

                print(f"   ✅ Got {len(trend_data)} trend data points")
            except Exception as trend_err:
                print(f"   ⚠️ Interest over time failed: {trend_err}")

            # Related queries (rising keywords)
            try:
                related = pytrends.related_queries()

                for kw in keywords:
                    if kw in related and related[kw].get('rising') is not None:
                        rising_df = related[kw]['rising']
                        if not rising_df.empty:
                            top_rising = rising_df.head(5).to_dict('records')
                            rising_keywords.extend([r['query'] for r in top_rising if 'query' in r])

                rising_keywords = list(set(rising_keywords))[:10]
                print(f"   ✅ Found {len(rising_keywords)} rising keywords")
            except Exception as related_err:
                print(f"   ⚠️ Related queries failed: {related_err}")

            result = {
                'trend': trend_data[-12:],  # Last 12 data points
                'risingKeywords': rising_keywords,
                'keywords': keywords,
                'timeframe': 'Last 3 months'
            }

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': True,
                'data': result
            }).encode())

        except Exception as e:
            print(f"❌ GOOGLE TRENDS ERROR: {e}")

            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()

            self.wfile.write(json.dumps({
                'success': False,
                'error': str(e)
            }).encode())


print("✅ Google Trends API ready")
