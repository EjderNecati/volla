// =====================================================
// VOLLA - MULTI-MARKETPLACE E-COMMERCE ANALYZER
// Supports: Etsy + Amazon (A9) + Shopify (Google SEO)
// =====================================================

// DEBUG MODE - Set to false for production (disables console logs)
const DEBUG_MODE = false;
const log = (...args) => { if (DEBUG_MODE) log(...args); };
const warn = (...args) => { if (DEBUG_MODE) warn(...args); };
const error = (...args) => console.error(...args); // Always show errors

// Default API Key fallback (used when user hasn't set their own key)
const DEFAULT_API_KEY = 'AIzaSyDb5lhi3wQQONuynWyxaxBU0mSNUt8uMEY';

// Platform rules
export const PLATFORM_RULES = {
  etsy: { titleMaxChars: 140, keywordsCount: 13 },
  amazon: { titleMaxChars: 200, bulletsCount: 5, searchTermsBytes: 249 },
  shopify: { titleMaxChars: 70, metaTitleMax: 60, metaDescMax: 160 }
};

let lastApiStatus = 'Waiting for scan...';
export const getLastApiStatus = () => lastApiStatus;

// Helper: File to Base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) { reject(new Error('No file provided')); return; }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
};

// Helper: Compress image to reduce payload size (for 413 errors)
export const compressImage = async (base64Image, maxSizeKB = 1500, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if image is too large
        const maxDimension = 2000;
        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.floor(width * ratio);
          height = Math.floor(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to JPEG with quality
        const compressed = canvas.toDataURL('image/jpeg', quality);

        // Check size and reduce quality if needed
        const sizeKB = (compressed.length * 3) / 4 / 1024;
        if (sizeKB > maxSizeKB && quality > 0.3) {
          // Recursively compress with lower quality
          compressImage(base64Image, maxSizeKB, quality - 0.1).then(resolve).catch(reject);
        } else {
          console.log(`📸 Image compressed: ${Math.round(sizeKB)}KB (quality: ${quality})`);
          resolve(compressed);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = base64Image;
    } catch (e) {
      reject(e);
    }
  });
};

// RETRY HELPER FOR 429 RATE LIMIT ERRORS
const fetchWithRetry = async (url, options, maxRetries = 3) => {
  let lastError;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);

      // If 429 Rate Limit, wait and retry
      if (response.status === 429) {
        const waitTime = Math.pow(2, attempt + 1) * 1000; // 2s, 4s, 8s
        console.warn(`⚠️ Rate limited (429). Waiting ${waitTime / 1000}s before retry ${attempt + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // If 503 Service Unavailable, also retry
      if (response.status === 503) {
        const waitTime = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`⚠️ Service unavailable (503). Waiting ${waitTime / 1000}s before retry...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Fetch error on attempt ${attempt + 1}:`, error.message);

      // Wait before retry on network errors
      if (attempt < maxRetries - 1) {
        const waitTime = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  throw lastError || new Error('Max retries exceeded');
};

// ROBUST JSON PARSER
const safeParseJSON = (text) => {
  if (!text || typeof text !== 'string') throw new Error('Empty response from API');
  const trimmedText = text.trim();
  if (trimmedText === '') throw new Error('Empty response from API');

  let cleanText = trimmedText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON object found');

  cleanText = jsonMatch[0]
    .replace(/\r\n/g, ' ')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
    .replace(/\t/g, ' ')
    .replace(/,(\s*[}\]])/g, '$1')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  try {
    return JSON.parse(cleanText);
  } catch (e) {
    const aggressive = cleanText.replace(/[\x00-\x1F\x7F]/g, ' ').replace(/\s+/g, ' ');
    return JSON.parse(aggressive);
  }
};

// Filter marketplace URLs
const filterUrls = (groundingChunks, domain) => {
  if (!groundingChunks || !Array.isArray(groundingChunks)) return [];
  return groundingChunks
    .filter(chunk => chunk.web?.uri?.includes(domain))
    .map(chunk => ({ url: chunk.web.uri, title: chunk.web.title || 'Listing' }));
};

// =====================================================
// STEP 1: IDENTIFY PRODUCT TYPE + CAMERA ANGLE
// =====================================================
const identifyProductType = async (cleanBase64, mimeType, apiKey, marketplace) => {
  log('🔍 STEP 1: Identifying product and camera angle...');

  const marketplaceHints = {
    etsy: 'Best Etsy search query for similar handmade/vintage products',
    amazon: 'Best Amazon search query for similar products',
    shopify: 'Best Google search query for similar e-commerce products'
  };

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Analyze this product image CAREFULLY. Return JSON only:
{
  "product_type": "Specific product name",
  "category": "One of: Kitchenware, Furniture, Pet Supplies, Jewelry, Clothing, Electronics, Art, Decor, Other",
  "search_query": "${marketplaceHints[marketplace] || marketplaceHints.shopify}",
  "brand_suggestion": "Suggested brand name if applicable",
  "camera_angle": "CRITICAL - Detect the CAMERA PERSPECTIVE used to take this photo:
    - OVERHEAD: Camera looking STRAIGHT DOWN from above (bird's eye view, top-down)
    - FRONT: Camera at eye level, facing product directly
    - THREE_QUARTER: Camera at ~45 degree angle
    - SIDE: Camera viewing from pure side profile
    - FROM_BELOW: Camera looking upward at product
    - FLAT_LAY: Product laid flat, photographed from directly above",
  "product_placement": "How is the product positioned:
    - ON_SURFACE: Product sitting/standing on a table, floor, or platform
    - HANGING: Product suspended/hanging (ornaments, decorations with hooks/strings)
    - WORN: Product being worn by a person
    - MOUNTED: Product attached to wall/surface
    - HELD_IN_HAND: Product held by someone's hand
    - FLAT_LAY: Product laid flat on surface",
  "is_hanging_product": "true if product has a hook, string, loop, or is designed to hang (like Christmas ornaments, decorations, keychains)",
  "surface_visible": "true/false - is the supporting surface visible in photo?"
}

IMPORTANT DETECTION RULES:
- If you see the TOP of the product more than the front = OVERHEAD
- If product has a hanging loop/hook/string = is_hanging_product: true
- Christmas decorations, ornaments, keychains are typically HANGING products
- If photo is taken from above looking down = OVERHEAD or FLAT_LAY` },
        { inline_data: { mime_type: mimeType, data: cleanBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 512 }
  };

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Step 1 API Error: ${response.status} - ${errorText}`);
  }
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Step 1');

  const parsed = safeParseJSON(text);

  // Ensure camera_angle has a default
  if (!parsed.camera_angle) parsed.camera_angle = 'FRONT';
  if (!parsed.product_placement) parsed.product_placement = 'ON_SURFACE';
  if (parsed.is_hanging_product === undefined) parsed.is_hanging_product = false;

  log('📐 Detected camera angle:', parsed.camera_angle);
  log('📍 Product placement:', parsed.product_placement);

  return parsed;
};

// =====================================================
// STEP 2: MARKET SEARCH (Etsy, Amazon, or Google/Shopify)
// =====================================================
const searchMarket = async (searchQuery, apiKey, marketplace) => {
  log(`🔎 STEP 2: Searching ${marketplace}...`);

  const domainMap = {
    etsy: 'etsy.com',
    amazon: 'amazon.com',
    shopify: '' // No site restriction for Shopify - search whole web for Google SEO
  };

  const domain = domainMap[marketplace] || '';
  const siteSearch = domain ? `site:${domain} ${searchQuery}` : `${searchQuery} buy online shop`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `You are a ${marketplace} market researcher. Search: "${siteSearch}"

Extract from REAL search results:
1. Competitor titles (exact)
2. Price range
3. Top keywords from titles

Return JSON:
{
  "competitorListings": [{"title": "Real title", "price": "$XX.XX"}],
  "priceRange": {"min": "$XX.XX", "max": "$XX.XX"},
  "topKeywords": ["keyword1", "keyword2"],
  "searchInsights": "Brief analysis"
}`
      }]
    }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
  };

  const response = await fetchWithRetry(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
  let urls = groundingMetadata?.groundingChunks ? filterUrls(groundingMetadata.groundingChunks, domain || 'shop') : [];

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const marketData = safeParseJSON(text);
    marketData._urls = urls;
    marketData._isGrounded = urls.length > 0 || (groundingMetadata?.groundingChunks?.length > 0);
    return marketData;
  } catch (e) {
    return null;
  }
};

// =====================================================
// ETSY SEO GENERATION
// =====================================================
const generateEtsySEO = async (productType, marketData, cleanBase64, mimeType, apiKey) => {
  log('📝 Generating Etsy SEO...');

  const competitorContext = marketData ? `
REAL COMPETITOR DATA:
${marketData.competitorListings?.map(l => `- "${l.title}" at ${l.price}`).join('\n') || 'None'}
PRICE RANGE: ${marketData.priceRange?.min || '?'} - ${marketData.priceRange?.max || '?'}
TOP KEYWORDS: ${marketData.topKeywords?.join(', ') || 'None'}
` : 'No competitor data available.';

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `You are an Etsy SEO expert. Generate optimized listing.

PRODUCT: ${productType}
${competitorContext}

RULES:
- TITLE: Max 140 chars, unique (don't copy competitors), use their keywords
- DESCRIPTION: 200+ words, emotional hook, features, benefits, CTA
- KEYWORDS: Exactly 13 tags, no generic terms
- PRICE: Based on competitor range

Return JSON:
{
  "title": "Unique SEO title under 140 chars",
  "description": "Full 200+ word description",
  "keywords": ["13", "keywords", "here", "based", "on", "research", "data", "proven", "terms", "long", "tail", "etsy", "seo"],
  "price": "$XX.XX - $YY.YY",
  "competitorAnalysis": "How this compares to competition"
}` },
        { inline_data: { mime_type: mimeType, data: cleanBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 3072 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) throw new Error(`Etsy SEO API Error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Etsy SEO');
  return safeParseJSON(text);
};

// =====================================================
// AMAZON A9 ALGORITHM SEO GENERATION
// =====================================================
const generateAmazonSEO = async (productType, brandSuggestion, marketData, cleanBase64, mimeType, apiKey) => {
  log('📦 Generating Amazon A9 SEO...');

  const competitorContext = marketData ? `
REAL AMAZON COMPETITOR DATA:
${marketData.competitorListings?.map(l => `- "${l.title}" at ${l.price}`).join('\n') || 'None'}
PRICE RANGE: ${marketData.priceRange?.min || '?'} - ${marketData.priceRange?.max || '?'}
TOP KEYWORDS: ${marketData.topKeywords?.join(', ') || 'None'}
` : 'No competitor data available.';

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `You are an Amazon A9 Algorithm SEO expert. Generate optimized Amazon listing.

PRODUCT: ${productType}
BRAND: ${brandSuggestion || 'Generic Brand'}
${competitorContext}

═══════════════════════════════════════════════════════
AMAZON A9 ALGORITHM RULES - FOLLOW EXACTLY
═══════════════════════════════════════════════════════

TITLE (Max 200 characters):
- Format: [Brand Name] + [Core Product Type] + [Key Feature/Material] + [Dimensions/Color] + [Use Case]
- NO emotional words (NO: "Gift for mom", "Perfect for", "Best", "Amazing")
- Be TECHNICAL and NET
- Include primary keywords
- Example: "HomeStyle Glass Stair Gate 30-34 inch Width Safety Baby Pet Barrier White Steel Frame"

BULLET POINTS (Exactly 5):
- Each bullet MUST start with "KEY BENEFIT:" in CAPS
- Follow with clear explanation
- Focus on features, not emotions
- Format: "KEY BENEFIT: [Explanation of the benefit and feature]"
- Example: "EASY INSTALLATION: Comes with all mounting hardware and step-by-step instructions for quick setup"

SEARCH TERMS (Backend Keywords - MUST USE 230-249 bytes):
- MAXIMIZE byte usage - use as close to 249 bytes as possible
- NO commas - use only SPACES between words
- NO words that are already in the title (Amazon ignores duplicates)
- Include ALL of these:
  * Synonyms (e.g., "sofa" → "couch settee loveseat")
  * Common misspellings (e.g., "jewelry" → "jewlery jewellry")
  * Singular AND plural forms
  * Related terms (e.g., "coffee mug" → "tea cup drinking vessel")
  * Use cases (e.g., "gift birthday present housewarming")
  * Materials and features as single words
- NO brand names, no competitor names
- NO subjective claims (best, amazing, top-rated, etc.)
- Example (high byte usage): "infant toddler child baby pet dog cat safety barrier gate door mount pressure fit adjustable expandable retractable tension white black gray metal steel wide narrow tall short indoor outdoor stairway hallway doorway"

PRICE: Based on competitor data

═══════════════════════════════════════════════════════

Return JSON only:
{
  "title": "Amazon A9 optimized title under 200 chars",
  "bullets": [
    "KEY BENEFIT: First bullet point explanation",
    "KEY BENEFIT: Second bullet point explanation",
    "KEY BENEFIT: Third bullet point explanation",
    "KEY BENEFIT: Fourth bullet point explanation",
    "KEY BENEFIT: Fifth bullet point explanation"
  ],
  "search_terms": "space separated keywords no commas max 249 bytes no duplicates from title",
  "price": "$XX.XX - $YY.YY",
  "competitorAnalysis": "How this compares to Amazon competition"
}` },
        { inline_data: { mime_type: mimeType, data: cleanBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.3, maxOutputTokens: 3072 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) throw new Error(`Amazon SEO API Error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Amazon SEO');

  const result = safeParseJSON(text);

  // Validate search_terms
  if (result.search_terms) {
    result.search_terms = result.search_terms
      .replace(/,/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 249);
  }

  if (result.bullets && result.bullets.length > 5) {
    result.bullets = result.bullets.slice(0, 5);
  }

  return result;
};

// =====================================================
// SHOPIFY (GOOGLE SEO) GENERATION
// =====================================================
const generateShopifySEO = async (productType, brandSuggestion, marketData, cleanBase64, mimeType, apiKey) => {
  log('🛒 Generating Shopify (Google SEO)...');

  const competitorContext = marketData ? `
REAL COMPETITOR DATA:
${marketData.competitorListings?.map(l => `- "${l.title}" at ${l.price}`).join('\n') || 'None'}
PRICE RANGE: ${marketData.priceRange?.min || '?'} - ${marketData.priceRange?.max || '?'}
TOP KEYWORDS: ${marketData.topKeywords?.join(', ') || 'None'}
` : 'No competitor data available.';

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `You are a Shopify and Google SEO expert. Generate a fully optimized product listing.

PRODUCT: ${productType}
BRAND: ${brandSuggestion || ''}
${competitorContext}

═══════════════════════════════════════════════════════
SHOPIFY GOOGLE SEO STRATEGY - FOLLOW EXACTLY
═══════════════════════════════════════════════════════

PRODUCT TITLE (H1 Tag):
- Clean, readable, elegant title
- Include primary keyword naturally
- NOT robotic like Amazon, NOT cluttered like Etsy
- Max 70 characters
- Example: "Handcrafted Ceramic Coffee Mug - Minimalist Design"

SEO META TITLE (For Google SERP - Max 60 chars):
- Compelling, click-worthy headline
- Include primary keyword at the beginning
- Add brand at the end if space allows
- Example: "Artisan Ceramic Mug | Handmade Pottery | BrandName"

SEO META DESCRIPTION (For Google SERP - Max 160 chars):
- Compelling summary that drives clicks
- Include 1-2 keywords naturally
- End with a CTA (Shop now, Discover, Order today)
- Example: "Experience your morning coffee in our handcrafted ceramic mug. Unique minimalist design, microwave safe. Free shipping over $50. Shop now!"

HTML DESCRIPTION (Shopify Product Description):
- Use actual HTML tags for rich formatting
- Structure:
  1. Opening paragraph (emotional hook, story)
  2. <h3>Key Features</h3> with <ul><li> bullet points
  3. <h3>Why You'll Love It</h3> short closing paragraph with CTA
- Make it scannable and engaging

IMAGE ALT TEXT:
- Describe what's in the image for SEO and accessibility
- Include product name and key visual details
- Example: "Blue ceramic coffee mug with minimalist design on wooden table"

TAGS:
- 5-10 tags for Shopify internal filtering
- Mix of category, style, and use-case tags

PRICE: Based on competitor data

═══════════════════════════════════════════════════════

Return JSON only:
{
  "title": "Clean product title under 70 chars",
  "meta_title": "SEO meta title under 60 chars for Google",
  "meta_description": "Meta description under 160 chars with CTA",
  "html_description": "<p>Opening paragraph...</p><h3>Key Features</h3><ul><li>Feature 1</li><li>Feature 2</li><li>Feature 3</li></ul><h3>Why You'll Love It</h3><p>Closing paragraph with CTA...</p>",
  "alt_text": "Descriptive image alt text for SEO",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "price": "$XX.XX - $YY.YY",
  "competitorAnalysis": "How this compares to competitors"
}` },
        { inline_data: { mime_type: mimeType, data: cleanBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.5, maxOutputTokens: 4096 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) throw new Error(`Shopify SEO API Error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Shopify SEO');

  const result = safeParseJSON(text);

  // Validate limits
  if (result.meta_title && result.meta_title.length > 60) {
    result.meta_title = result.meta_title.substring(0, 57) + '...';
  }
  if (result.meta_description && result.meta_description.length > 160) {
    result.meta_description = result.meta_description.substring(0, 157) + '...';
  }
  if (result.tags && result.tags.length > 10) {
    result.tags = result.tags.slice(0, 10);
  }

  return result;
};

// =====================================================
// MARKET INSIGHTS (Competition, Trend, Score)
// =====================================================
const analyzeMarketInsights = async (title, productType, apiKey, marketplace) => {
  log('📊 Analyzing market insights...');

  const domainMap = {
    etsy: 'etsy.com',
    amazon: 'amazon.com',
    shopify: '' // Google-wide search
  };

  const domain = domainMap[marketplace] || '';
  const searchQuery = domain ? `site:${domain} ${productType}` : `${productType} buy online`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `Analyze the ${marketplace} market for: "${productType}"

Search "${searchQuery}" to get REAL current data.

Analyze:
1. COMPETITION LEVEL: LOW (<100 listings), MEDIUM (100-1000), HIGH (>1000)
2. TREND DIRECTION: DECREASING, STABLE, or INCREASING
3. OPPORTUNITY SCORE: 0-100 based on demand, competition, price potential

Return JSON:
{
  "competitionLevel": "LOW" or "MEDIUM" or "HIGH",
  "competitionReason": "Brief explanation",
  "trendDirection": "DECREASING" or "STABLE" or "INCREASING",
  "trendReason": "Brief explanation",
  "opportunityScore": 75,
  "opportunityReason": "Brief explanation"
}`
      }]
    }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 1024 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) {
    return { competitionLevel: 'MEDIUM', trendDirection: 'STABLE', opportunityScore: 50 };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return { competitionLevel: 'MEDIUM', trendDirection: 'STABLE', opportunityScore: 50 };

  try {
    return safeParseJSON(text);
  } catch (e) {
    return { competitionLevel: 'MEDIUM', trendDirection: 'STABLE', opportunityScore: 50 };
  }
};

// =====================================================
// MAIN API CALL - 3 MARKETPLACE SUPPORT
// Now uses backend /api/analyze-seo to avoid browser CORS/referrer issues
// =====================================================
export const callGeminiAPI = async (base64ImageDataUrl, marketplace, apiKey) => {
  log(`🚀 Starting ${marketplace.toUpperCase()} Analysis via backend...`);
  lastApiStatus = `🔍 Analyzing product for ${marketplace}...`;

  try {
    // Compress image to avoid 413 Payload Too Large error
    let compressedImage = base64ImageDataUrl;
    if (base64ImageDataUrl && base64ImageDataUrl.length > 200000) {
      log('🗜️ Compressing image for SEO analysis...');
      compressedImage = await compressImageForAPI(base64ImageDataUrl);
      log(`📦 Compressed: ${Math.round(compressedImage.length / 1024)}KB`);
    }

    // Call backend API instead of direct Gemini API
    const response = await fetch('/api/analyze-seo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: compressedImage,
        marketplace: marketplace
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API Error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Analysis failed');
    }

    // Transform backend response to expected format
    const data = result.data;

    // Build response based on marketplace
    let seoData = {
      marketplace: marketplace,
      category: data.category || data.productType || 'General',
      title: data.title || '',
      description: data.description || '',
      _productInfo: { product_type: data.productType || 'product' },
      _grounded: false,
      _urls: []
    };

    // Add marketplace-specific fields
    if (marketplace === 'etsy') {
      seoData.tags = data.keywords || data.tags || [];
      seoData.keywords = data.keywords || data.tags || [];
      seoData.materials = data.materials || [];
      seoData.colors = data.colors || [];
      seoData.occasion = data.occasion || '';
      seoData.style = data.style || '';
      seoData.price = data.price || data.suggestedPrice || data.priceRange || '$0.00';
    } else if (marketplace === 'amazon') {
      seoData.bulletPoints = data.bulletPoints || data.bullets || [];
      seoData.bullets = data.bulletPoints || data.bullets || [];
      seoData.searchTerms = data.searchTerms || data.search_terms || '';
      seoData.search_terms = data.searchTerms || data.search_terms || '';
      seoData.price = data.price || data.suggestedPrice || '$0.00';
    } else if (marketplace === 'shopify') {
      seoData.metaTitle = data.metaTitle || data.meta_title || data.title || '';
      seoData.metaDescription = data.metaDescription || data.meta_description || '';
      seoData.meta_title = data.metaTitle || data.meta_title || data.title || '';
      seoData.meta_description = data.metaDescription || data.meta_description || '';
      seoData.tags = data.tags || [];
      seoData.vendor = data.vendor || '';
      seoData.price = data.price || data.suggestedPrice || '$0.00';
    }

    lastApiStatus = `✅ ${marketplace} analysis complete!`;
    log('🎉 FINAL RESULT:', seoData);
    return seoData;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    lastApiStatus = `❌ Error: ${error.message}`;
    throw error;
  }
};

// =====================================================
// SMART AI STUDIO MODE (Context-Aware Photography)
// =====================================================

// Helper: Compress image for API (max 800x800, 70% quality JPEG)
const compressImageForAPI = (base64Image) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 800;

      let width = img.width;
      let height = img.height;

      // Scale down to max 800x800
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG at 70% quality (much smaller than PNG)
      const compressed = canvas.toDataURL('image/jpeg', 0.7);
      resolve(compressed);
    };

    // Handle both data URL and raw base64
    if (base64Image.startsWith('data:')) {
      img.src = base64Image;
    } else {
      img.src = `data:image/jpeg;base64,${base64Image}`;
    }
  });
};

// SCENE MAPPING DICTIONARY (Akıllı Sahne Eşleştirme)
export const SCENE_MAPPINGS = {
  'Kitchenware': {
    prompt: 'marble kitchen countertop, morning sunlight, fresh croissants nearby, photorealistic, 8k',
    keywords: 'marble,kitchen,countertop,morning,breakfast'
  },
  'Furniture': {
    prompt: 'modern scandinavian living room, large window, soft daylight, interior design magazine style',
    keywords: 'scandinavian,living,room,interior,modern,furniture'
  },
  'Pet Supplies': {
    prompt: 'cozy home garden with green grass, sunny day, shallow depth of field, vibrant colors',
    keywords: 'pet,garden,grass,outdoor,sunny,dogs'
  },
  'Jewelry': {
    prompt: 'dark velvet texture, dramatic studio lighting, macro shot, sparkling reflection, luxury',
    keywords: 'jewelry,velvet,luxury,macro,gold,diamond'
  },
  'Clothing': {
    prompt: 'minimalist fashion studio, neutral background, soft professional lighting, high fashion',
    keywords: 'fashion,studio,clothing,minimalist,model'
  },
  'Electronics': {
    prompt: 'sleek modern desk setup, neon ambient lighting, tech reviewer style, clean composition',
    keywords: 'tech,electronics,desk,modern,gadget,workspace'
  },
  'Art': {
    prompt: 'art gallery wall, gallery track lighting, museum quality display, white wall background',
    keywords: 'art,gallery,museum,wall,minimal,white'
  },
  'Other': {
    prompt: 'minimalist concrete podium, soft shadows, studio lighting, product photography',
    keywords: 'product,studio,minimal,concrete,podium'
  }
};

// Generate AI Studio Image (Backend Integration with Gemini)
export const generateStudioImage = async (category, imageBase64 = null, productInfo = {}, outputCount = 1, aspectRatio = '1:1', customPrompt = '') => {
  log(`✨ Smart AI Studio: Generating scene for ${category}...`);
  log(`📐 Camera angle: ${productInfo.camera_angle || 'FRONT'}`);
  log(`📍 Placement: ${productInfo.product_placement || 'ON_SURFACE'}`);
  log(`📊 Output Count: ${outputCount}, Aspect Ratio: ${aspectRatio}`);

  const sceneConfig = SCENE_MAPPINGS[category] || SCENE_MAPPINGS['Other'];
  log(`🎨 Scene: "${sceneConfig.prompt}"`);

  try {
    // Compress image to reduce payload size (max 800x800, 70% quality)
    let compressedImage = null;
    if (imageBase64) {
      log('🗜️ Compressing image for API...');
      compressedImage = await compressImageForAPI(imageBase64);
      log(`📦 Compressed: ${Math.round(compressedImage.length / 1024)}KB`);
    }

    // Call Python backend serverless function
    log('📡 Calling backend API...');

    // Get Vertex API key from localStorage
    const vertexApiKey = localStorage.getItem('volla_vertex_api_key') || '';

    const response = await fetch('/api/generate-studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: category,
        image: compressedImage, // Send compressed image
        edit_mode: 'background_swap',
        vertex_api_key: vertexApiKey, // Send Vertex API key for Imagen 3
        // Camera angle detection info
        camera_angle: productInfo.camera_angle || 'FRONT',
        product_placement: productInfo.product_placement || 'ON_SURFACE',
        is_hanging_product: productInfo.is_hanging_product || false,
        product_type: productInfo.product_type || '',
        // NEW: Output configuration
        output_count: outputCount,
        aspect_ratio: aspectRatio,
        custom_prompt: customPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`Backend HTTP error: ${response.status}`);
    }

    const data = await response.json();
    log('📦 Backend response:', data);

    // Log any backend error message
    if (data.error_message) {
      warn('⚠️ Backend warning:', data.error_message);
    }

    // Check for generated image(s) and background
    const imageUrl = data.generated_image || data.image_url;
    const imagesArray = data.generated_images || (imageUrl ? [imageUrl] : []);
    const backgroundUrl = data.background_url;

    if (imageUrl || backgroundUrl || imagesArray.length > 0) {
      log(`✅ Studio data received from backend (${imagesArray.length} images)`);
      log(`   Method: ${data.method_used}`);
      // Return object with both image and background for composite
      return {
        image: imageUrl,
        images: imagesArray,  // NEW: Array of generated images
        background: backgroundUrl,
        method: data.method_used,
        supportsComposite: data.supports_composite,
        output_count: data.output_count || imagesArray.length
      };
    } else {
      warn('⚠️ No image in backend response, using fallback');
      throw new Error('No generated image in response');
    }

  } catch (error) {
    console.error('❌ Backend failed:', error.message);
    log('🔄 Falling back to demo mode...');

    // Fallback: Return background URL for composite
    const sceneConfig = SCENE_MAPPINGS[category] || SCENE_MAPPINGS['Other'];
    await new Promise(resolve => setTimeout(resolve, 300));
    return {
      image: null,
      images: [],
      background: `https://source.unsplash.com/800x800/?${sceneConfig.keywords}`,
      method: 'Fallback',
      supportsComposite: true,
      output_count: 0
    };
  }
};

// =====================================================
// MULTI-ANGLE SHOT GENERATOR v3.0 (Dynamic Detection)
// Analyzes input angle, generates OPPOSITE angles
// =====================================================

export const generateProductAngles = async (sourceImage, sourceContext = 'STUDIO', aspectRatio = '1:1', outputCount = 3) => {
  log('🎬 Multi-Angle Generator v3.0 (Dynamic Detection): Starting...');
  log(`   Source Context: ${sourceContext}`);
  log(`   Aspect Ratio: ${aspectRatio}`);
  log(`   Output Count: ${outputCount}`);

  if (!sourceImage) {
    throw new Error('No source image provided');
  }

  try {
    // Compress source image if needed
    let compressedImage = sourceImage;
    if (sourceImage.length > 500000) {
      log('🗜️ Compressing source image...');
      compressedImage = await compressImageForAPI(sourceImage);
    }

    log('📡 Calling multi-angle backend v3.0...');

    // Get Vertex API key from localStorage
    const vertexApiKey = localStorage.getItem('volla_vertex_api_key') || '';

    const response = await fetch('/api/generate-angles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_image: compressedImage,
        source_context: sourceContext, // 'STUDIO' or 'LIFE' - tells backend to preserve scene
        vertex_api_key: vertexApiKey, // Send Vertex API key for Imagen 3
        aspect_ratio: aspectRatio, // Aspect ratio support
        output_count: outputCount // Output count support (1-4)
      })
    });

    if (!response.ok) {
      throw new Error(`Backend HTTP error: ${response.status}`);
    }

    const data = await response.json();
    log('📦 Multi-angle v3.0 response:', data);

    if (data.detected_angle) {
      log(`📐 Detected angle: ${data.detected_angle}`);
    }

    if (data.error) {
      warn('⚠️ Backend error:', data.error);
      throw new Error(data.error);
    }

    if (data.success) {
      log('✅ Dynamic multi-angle generation complete!');

      // v3.0 returns shot1/2/3/4 with dynamic labels
      return {
        success: true,
        // Map shots to display format
        shot1: data.shot1,
        shot2: data.shot2,
        shot3: data.shot3,
        shot4: data.shot4,
        // Dynamic labels based on detected angle
        labels: data.shot_names || {
          shot1: 'Rotation',
          shot2: 'Context',
          shot3: 'Detail',
          shot4: 'Close-up'
        },
        detectedAngle: data.detected_angle,
        baseDescription: data.base_description,
        generatedCount: data.generated_count || outputCount
      };
    } else {
      throw new Error('Generation failed');
    }

  } catch (err) {
    error('❌ Multi-angle generation failed:', err.message);
    throw err;
  }
};

// =====================================================
// REAL LIFE PHOTOS GENERATOR - Hyper-Realistic Lifestyle
// Generates product photos in real-world usage contexts
// =====================================================

export const generateRealLifePhotos = async (sourceImage, productInfo = {}, outputCount = 3, aspectRatio = '1:1', customPrompt = '') => {
  log('🌟 Real Life Photos Generator: Starting...');
  log(`   Product: ${productInfo.product_type || 'unknown'}`);
  log(`   Category: ${productInfo.category || 'unknown'}`);
  log(`   Output Count: ${outputCount}, Aspect Ratio: ${aspectRatio}`);

  if (!sourceImage) {
    throw new Error('No source image provided');
  }

  try {
    // Compress source image if needed (Always compress if > 200KB)
    let compressedImage = sourceImage;
    if (sourceImage.length > 200000) {
      log('🗜️ Compressing source image...');
      compressedImage = await compressImageForAPI(sourceImage);
      log(`📦 Compressed: ${Math.round(compressedImage.length / 1024)}KB`);
    }

    log('📡 Calling Real Life backend...');

    // Get Vertex API key from localStorage
    const vertexApiKey = localStorage.getItem('volla_vertex_api_key') || '';

    const response = await fetch('/api/generate-reallife', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_image: compressedImage,
        product_info: productInfo,
        vertex_api_key: vertexApiKey,
        output_count: outputCount,
        aspect_ratio: aspectRatio,
        custom_prompt: customPrompt
      })
    });

    if (!response.ok) {
      throw new Error(`Backend HTTP error: ${response.status}`);
    }

    const data = await response.json();
    log('📦 Real Life response:', data);

    if (data.error) {
      warn('⚠️ Backend error:', data.error);
      throw new Error(data.error);
    }

    if (data.success) {
      log(`✅ Real Life generation complete! (${data.output_count || outputCount} shots)`);
      log(`   📦 Analysis: ${data.analysis?.product_type || 'N/A'}`);

      // Build dynamic response based on actual output count
      const result = {
        success: true,
        shots: data.shots || [],  // NEW: Array of shots
        analysis: data.analysis,
        output_count: data.output_count || 0,
        labels: {}
      };

      // Add legacy shot1/shot2/shot3/shot4 for backward compatibility
      for (let i = 1; i <= 4; i++) {
        if (data[`shot${i}`]) {
          result[`shot${i}`] = data[`shot${i}`];
          result.labels[`shot${i}`] = data.analysis?.lifestyle_contexts?.[i-1]?.scene?.substring(0, 30) || `Lifestyle ${i}`;
        }
      }

      return result;
    } else {
      throw new Error('Generation failed');
    }

  } catch (err) {
    error('❌ Real Life generation failed:', err.message);
    throw err;
  }
};

// Main analyze function - IMAGE MODE (PRESERVED)
export const analyzeImage = async (base64Image, marketplace, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No API key');
  }

  log(`🔍 Starting ${marketplace.toUpperCase()} IMAGE analysis...`);
  lastApiStatus = `⏳ Analyzing image for ${marketplace}...`;

  return await callGeminiAPI(base64Image, marketplace, apiKey);
};

// =====================================================
// TEXT MODE - SPIN/REWRITE & GENERATE SEO
// =====================================================

// TEXT MODE: Rewrite text and generate marketplace-specific SEO
const generateSEOFromText = async (inputText, marketplace, apiKey) => {
  log(`📝 TEXT MODE: Generating ${marketplace} SEO from text...`);

  // Build marketplace-specific prompt
  let marketplacePrompt = '';

  if (marketplace === 'etsy') {
    marketplacePrompt = `
═══════════════════════════════════════════════════════
ETSY SEO RULES
═══════════════════════════════════════════════════════
- TITLE: Max 140 chars, unique, keyword-rich
- DESCRIPTION: 200+ words, emotional hook, features, benefits, CTA
- KEYWORDS: Exactly 13 tags, no generic terms
- PRICE: Suggest based on market

Return JSON:
{
  "title": "Unique SEO title under 140 chars",
  "description": "Full 200+ word description",
  "keywords": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6", "tag7", "tag8", "tag9", "tag10", "tag11", "tag12", "tag13"],
  "price": "$XX.XX - $YY.YY",
  "competitorAnalysis": "Market positioning analysis"
}`;
  } else if (marketplace === 'amazon') {
    marketplacePrompt = `
═══════════════════════════════════════════════════════
AMAZON A9 ALGORITHM RULES
═══════════════════════════════════════════════════════
- TITLE: Max 200 chars, format: [Brand] + [Product] + [Feature] + [Size/Color] + [Use]
- BULLETS: Exactly 5, each starting with "KEY BENEFIT:" in CAPS
- SEARCH TERMS: 230-249 bytes, NO commas, NO title duplicates, synonyms + misspellings
- PRICE: Suggest based on market

Return JSON:
{
  "title": "Amazon A9 optimized title under 200 chars",
  "bullets": [
    "KEY BENEFIT: First point",
    "KEY BENEFIT: Second point",
    "KEY BENEFIT: Third point",
    "KEY BENEFIT: Fourth point",
    "KEY BENEFIT: Fifth point"
  ],
  "search_terms": "space separated keywords 230-249 bytes",
  "price": "$XX.XX - $YY.YY",
  "competitorAnalysis": "Amazon market analysis"
}`;
  } else if (marketplace === 'shopify') {
    marketplacePrompt = `
═══════════════════════════════════════════════════════
SHOPIFY GOOGLE SEO RULES
═══════════════════════════════════════════════════════
- TITLE: Clean, readable, max 70 chars
- META TITLE: Google SERP, max 60 chars, click-worthy
- META DESCRIPTION: Max 160 chars, include CTA
- HTML DESCRIPTION: Use <h3>, <ul>, <li> tags, structured content
- ALT TEXT: For image SEO
- TAGS: 5-10 for filtering

Return JSON:
{
  "title": "Product title under 70 chars",
  "meta_title": "SEO meta title under 60 chars",
  "meta_description": "Meta description under 160 chars with CTA",
  "html_description": "<p>Opening...</p><h3>Key Features</h3><ul><li>Feature 1</li></ul><h3>Why You'll Love It</h3><p>Closing...</p>",
  "alt_text": "Image alt text",
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "price": "$XX.XX - $YY.YY",
  "competitorAnalysis": "Market analysis"
}`;
  }

  const requestBody = {
    contents: [{
      parts: [{
        text: `You are an e-commerce SEO expert. The user has provided a product description or title. Your job is to:

1. REWRITE/SPIN the text to make it unique and original (don't copy directly)
2. Generate optimized ${marketplace.toUpperCase()} listing content
3. Extract the product type and key features from the text

USER INPUT TEXT:
"""
${inputText}
"""

${marketplacePrompt}`
      }]
    }],
    generationConfig: { temperature: 0.6, maxOutputTokens: 4096 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) throw new Error(`Text SEO API Error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Text SEO');

  const result = safeParseJSON(text);

  // Validate limits based on marketplace
  if (marketplace === 'amazon' && result.search_terms) {
    result.search_terms = result.search_terms.replace(/,/g, ' ').replace(/\s+/g, ' ').trim().substring(0, 249);
    if (result.bullets && result.bullets.length > 5) result.bullets = result.bullets.slice(0, 5);
  }
  if (marketplace === 'shopify') {
    if (result.meta_title && result.meta_title.length > 60) result.meta_title = result.meta_title.substring(0, 57) + '...';
    if (result.meta_description && result.meta_description.length > 160) result.meta_description = result.meta_description.substring(0, 157) + '...';
  }

  return result;
};

// TEXT MODE: Search market for context
const searchMarketForText = async (inputText, apiKey, marketplace) => {
  log(`🔎 TEXT MODE: Searching ${marketplace} market...`);

  const domainMap = {
    etsy: 'etsy.com',
    amazon: 'amazon.com',
    shopify: ''
  };

  const domain = domainMap[marketplace] || '';
  // Extract key product terms from input text (first 50 chars)
  const searchTerms = inputText.substring(0, 100).replace(/[^\w\s]/g, ' ').trim();
  const siteSearch = domain ? `site:${domain} ${searchTerms}` : `${searchTerms} buy online`;

  const requestBody = {
    contents: [{
      parts: [{
        text: `Search for similar products: "${siteSearch}"

Return JSON with competitor data:
{
  "competitorListings": [{"title": "Real title", "price": "$XX.XX"}],
  "priceRange": {"min": "$XX.XX", "max": "$XX.XX"},
  "topKeywords": ["keyword1", "keyword2"],
  "searchInsights": "Brief analysis"
}`
      }]
    }],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 2048 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) return null;

  const data = await response.json();
  const groundingMetadata = data.candidates?.[0]?.groundingMetadata;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) return null;

  try {
    const marketData = safeParseJSON(text);
    marketData._isGrounded = (groundingMetadata?.groundingChunks?.length > 0);
    return marketData;
  } catch (e) {
    return null;
  }
};

// Main TEXT MODE function - Now uses backend to avoid 403
export const analyzeText = async (inputText, marketplace, apiKey) => {
  if (!inputText || inputText.trim().length < 10) {
    throw new Error('Please enter at least 10 characters of product description');
  }

  log(`📝 Starting ${marketplace.toUpperCase()} TEXT analysis via backend...`);
  lastApiStatus = `⏳ Processing text for ${marketplace}...`;

  try {
    // Call backend API
    const response = await fetch('/api/text-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: inputText,
        marketplace: marketplace
      })
    });

    if (!response.ok) {
      throw new Error(`Backend API Error: ${response.status}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Text analysis failed');
    }

    // Transform backend response
    const data = result.data;

    const seoResult = {
      marketplace: marketplace,
      inputMode: 'text',
      title: data.title || '',
      description: data.description || '',
      keywords: data.tags || data.keywords || [],
      price: data.suggestedPrice || data.price || '$0.00',
      _grounded: false,
      _originalText: inputText
    };

    // Add marketplace-specific fields
    if (marketplace === 'amazon') {
      seoResult.bullets = data.bulletPoints || data.bullets || [];
      seoResult.search_terms = data.searchTerms || data.search_terms || '';
    } else if (marketplace === 'shopify') {
      seoResult.meta_title = data.metaTitle || data.meta_title || '';
      seoResult.meta_description = data.metaDescription || data.meta_description || '';
      seoResult.html_description = data.html_description || data.description || '';
    }

    lastApiStatus = `✅ ${marketplace} text analysis complete!`;
    log('🎉 TEXT MODE RESULT:', seoResult);
    return seoResult;

  } catch (error) {
    console.error('❌ Text analysis failed:', error);
    lastApiStatus = `❌ Error: ${error.message}`;
    throw error;
  }
};

// =====================================================
// HANDSFREE MODE - AI-Powered Product Analysis & Generation
// =====================================================

/**
 * Analyze product image for Handsfree mode
 * Detects product type, camera angle, and generates context
 */
export const analyzeProductForHandsfree = async (imageBase64, apiKey) => {
  log('🤖 Handsfree: Analyzing product...');

  try {
    // Compress image to avoid 413 Payload Too Large
    const compressedImage = await compressImage(imageBase64, 1500, 0.8);

    // Call backend API for analysis
    const response = await fetch('/api/generate-handsfree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'analyze',
        image: compressedImage
      })
    });

    if (!response.ok) {
      throw new Error(`Analysis failed: ${response.status}`);
    }

    const data = await response.json();
    log('✅ Handsfree analysis complete:', data);
    return data;

  } catch (error) {
    console.error('❌ Handsfree analysis failed:', error);
    throw error;
  }
};

/**
 * Generate image using Handsfree mode
 * Uses AI to automatically select best background and settings
 */
export const generateHandsfreeImage = async (imageBase64, analysisContext = {}, mode = 'studio') => {
  log('🎨 Handsfree: Generating image...', { mode });

  try {
    // Compress image to avoid 413 Payload Too Large
    const compressedImage = await compressImage(imageBase64, 1500, 0.8);

    // Call backend API for generation
    const response = await fetch('/api/generate-handsfree', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'generate',
        image: compressedImage,
        prompt: analysisContext?.prompt || '',
        isEditMode: analysisContext?.isEditMode || false,
        aspectRatio: analysisContext?.aspect_ratio_value || 'original',
        mode: mode
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Generation failed: ${response.status}`);
    }

    const data = await response.json();
    log('✅ Handsfree generation complete');
    return data;

  } catch (error) {
    console.error('❌ Handsfree generation failed:', error);
    throw error;
  }
};


// =====================================================
// MOTION MODE - Video Generation with Veo 3.1
// =====================================================

/**
 * Get AI-powered shot recommendations for a product image
 * @param {string} imageBase64 - Source image as base64
 * @returns {Promise<{success: boolean, category: string, recommended_shots: array, reasoning: string}>}
 */
export const getSmartRecommendation = async (imageBase64) => {
  log('🧠 Getting smart shot recommendations...');

  try {
    const compressedImage = await compressImage(imageBase64, 1500, 0.8);

    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'recommend',
        image: compressedImage
      })
    });

    if (!response.ok) {
      throw new Error(`Recommendation failed: ${response.status}`);
    }

    const data = await response.json();
    log('🧠 Smart recommendation result:', data);
    return data;

  } catch (error) {
    console.error('❌ Smart recommendation failed:', error);
    return {
      success: false,
      category: 'default',
      recommended_shots: [],
      reasoning: 'Could not analyze product'
    };
  }
};

/**
 * Get available shot types, sequences, and music library
 * @returns {Promise<{shot_types: object, sequences: object, music_library: object}>}
 */
export const getMotionLibrary = async () => {
  log('📚 Getting motion library...');

  try {
    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_shot_types' })
    });

    if (!response.ok) {
      throw new Error(`Library fetch failed: ${response.status}`);
    }

    return await response.json();

  } catch (error) {
    console.error('❌ Motion library fetch failed:', error);
    return { shot_types: {}, sequences: {}, music_library: {} };
  }
};

/**
 * Start video generation with Veo 3.1
 * Returns operation name for polling
 * @param {string} imageBase64 - Source image as base64
 * @param {object} motionOptions - Motion settings
 * @returns {Promise<{success: boolean, operation_name?: string, model_id?: string, error?: string}>}
 */
export const startMotionGeneration = async (imageBase64, motionOptions) => {
  log('🎬 Motion: Starting video generation...');

  try {
    // Compress image to avoid 413 Payload Too Large
    const compressedImage = await compressImage(imageBase64, 1500, 0.8);

    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'start',
        image: compressedImage,
        shotType: motionOptions.cameraMovement || 'hero_reveal',  // v2.0 shot type
        cameraMovement: motionOptions.cameraMovement || 'hero_reveal',  // Legacy support
        speed: motionOptions.speed || 'normal',
        duration: motionOptions.duration || 6,
        qualityMode: motionOptions.qualityMode || 'fast',
        aspectRatio: motionOptions.aspectRatio || '16:9',
        customDirective: motionOptions.customDirective || '',
        useDirector: true,  // Enable Gemini 3 Pro Director AI
        retryCount: motionOptions.retryCount || 0  // Quality Gate retry count
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Start failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎬 Motion: Generation started', data);
    return data;

  } catch (error) {
    console.error('❌ Motion start failed:', error);
    throw error;
  }
};

/**
 * Poll for video generation completion
 * @param {string} operationName - The operation name from startMotionGeneration
 * @param {string} modelId - The model ID used for generation
 * @param {boolean} cropToSquare - Whether to crop video to 1:1 when complete
 * @returns {Promise<{success: boolean, status: string, progress?: number, video_url?: string, error?: string}>}
 */
export const pollMotionGeneration = async (operationName, modelId, cropToSquare = false) => {
  log('🎬 Motion: Polling for completion...');

  try {
    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'poll',
        operationName: operationName,
        modelId: modelId,
        cropToSquare: cropToSquare
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Poll failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎬 Motion: Poll result', data);
    return data;

  } catch (error) {
    console.error('❌ Motion poll failed:', error);
    throw error;
  }
};

/**
 * Quality Gate: Analyze generated video with Gemini 3 Pro Vision
 * Checks if product was preserved correctly (no distortion, movement, etc.)
 * @param {string} videoUrl - The generated video URL
 * @param {string} originalImageBase64 - Original product image for comparison
 * @param {string} shotType - The shot type used for generation
 * @param {number} retryCount - Current retry count for backend tracking
 * @returns {Promise<{success: boolean, approved: boolean, score: number, issues: string[], should_retry: boolean}>}
 */
export const qualityCheckMotion = async (videoUrl, originalImageBase64, shotType, retryCount = 0) => {
  log('🎬 Quality Gate: Analyzing video quality...');

  try {
    // Compress original image
    const compressedImage = await compressImage(originalImageBase64, 1500, 0.8);

    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'quality_check',
        videoUrl: videoUrl,
        originalImage: compressedImage,
        shotType: shotType,
        retryCount: retryCount
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Quality check failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎬 Quality Gate result:', data);

    // Parse backend response structure
    // Backend returns: { success, quality: {passed, score, issues, ...}, should_retry, retry_count, max_retries }
    const quality = data.quality || {};
    const score = Math.round((quality.score || 0) * 100); // Convert 0-1 to 0-100

    return {
      success: data.success,
      approved: quality.passed ?? true,
      score: score,
      issues: quality.issues || [],
      should_retry: data.should_retry || false,
      retryCount: data.retry_count || 0,
      maxRetries: data.max_retries || 2,
      productStability: quality.product_stability,
      motionQuality: quality.motion_quality,
      productIntegrity: quality.product_integrity,
      recommendation: quality.recommendation
    };

  } catch (error) {
    console.error('❌ Quality Gate failed:', error);
    // On error, assume video is acceptable (don't block user)
    return {
      success: false,
      approved: true,
      score: 50,
      issues: ['Quality check unavailable'],
      should_retry: false,
      error: error.message
    };
  }
};

/**
 * Add background music to a completed video
 * @param {string} videoUrl - The video URL (base64 data URL or HTTP)
 * @param {string} musicId - The music track ID
 * @param {boolean} musicEnabled - Whether to add music
 * @returns {Promise<{success: boolean, video_url: string, music_added: boolean}>}
 */
export const addMusicToVideo = async (videoUrl, musicId, musicEnabled = true) => {
  log('🎵 Adding music to video...');

  try {
    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'add_music',
        videoUrl: videoUrl,
        musicId: musicId,
        musicEnabled: musicEnabled
      })
    });

    if (!response.ok) {
      throw new Error(`Add music failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎵 Music result:', data);
    return data;

  } catch (error) {
    console.error('❌ Add music failed:', error);
    return {
      success: false,
      video_url: videoUrl,
      music_added: false,
      error: error.message
    };
  }
};

/**
 * Stitch multiple videos into a sequence with optional music
 * @param {string[]} videoUrls - Array of video URLs to stitch
 * @param {string} musicId - The music track ID
 * @param {boolean} musicEnabled - Whether to add music
 * @returns {Promise<{success: boolean, video_url: string, videos_stitched: number}>}
 */
export const stitchVideoSequence = async (videoUrls, musicId, musicEnabled = true) => {
  log('🎬 Stitching video sequence...');

  try {
    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'stitch_sequence',
        videoUrls: videoUrls,
        musicId: musicId,
        musicEnabled: musicEnabled
      })
    });

    if (!response.ok) {
      throw new Error(`Stitch failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎬 Stitch result:', data);
    return data;

  } catch (error) {
    console.error('❌ Stitch failed:', error);
    return {
      success: false,
      video_url: null,
      videos_stitched: 0,
      error: error.message
    };
  }
};

/**
 * Start video editing with Veo 3.1
 * Generates a new video with edit instructions applied
 * @param {string} imageBase64 - Source image as base64
 * @param {string} editPrompt - Edit instructions
 * @param {object} options - Video options (duration, qualityMode, aspectRatio)
 * @returns {Promise<{success: boolean, operation_name?: string, model_id?: string, error?: string}>}
 */
export const startMotionEdit = async (imageBase64, editPrompt, options = {}) => {
  log('🎬 Motion Edit: Starting video edit...');

  try {
    // Compress image to avoid 413 Payload Too Large
    const compressedImage = await compressImage(imageBase64, 1500, 0.8);

    const response = await fetch('/api/generate-motion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'edit',
        image: compressedImage,
        editPrompt: editPrompt,
        duration: options.duration || 6,
        qualityMode: options.qualityMode || 'fast',
        aspectRatio: options.aspectRatio || '16:9'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Edit start failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎬 Motion Edit: Edit started', data);
    return data;

  } catch (error) {
    console.error('❌ Motion edit failed:', error);
    throw error;
  }
};


// =====================================================
// CREATIVE STUDIO - Promotional Image Generation
// =====================================================

/**
 * Generate promotional/marketing images with themes
 * CREATIVE STUDIO v4.0 - ULTIMATE WORLD-CLASS Features:
 * - Trust Badges (Rating, Shipping, Sold Count with dynamic values)
 * - Urgency Elements (Timer with hours/minutes, Stock Warning)
 * - Social Proof Badges (Best Seller, Top Rated, Limited Edition, etc.)
 * - Price Tag with Original/Sale price display
 * - Seasonal Decorations (Snowflakes, Hearts, Confetti, Pumpkins)
 * - 3D Badge Effects (Gradient, Glow, Shadows)
 * - Product Effects (Sparkles, Glow, Reflection)
 * - AI Auto-detect product category
 * - Custom CTA text support
 * @param {string} imageBase64 - Source image as base64
 * @param {object} creativeOptions - Creative settings
 * @returns {Promise<{success: boolean, images?: string[], error?: string}>}
 */
export const generateCreativeImage = async (imageBase64, creativeOptions) => {
  log('🎨 Creative Studio v4.0: Starting ULTIMATE generation...');

  try {
    // Compress image to avoid 413 Payload Too Large
    const compressedImage = await compressImage(imageBase64, 1500, 0.8);

    const response = await fetch('/api/generate-creative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: compressedImage,
        mode: creativeOptions.mode || 'auto',
        theme: creativeOptions.theme || 'black_friday',
        discount: creativeOptions.discount || null,
        customNote: creativeOptions.customNote || '',
        manualPrompt: creativeOptions.manualPrompt || '',
        outputCount: creativeOptions.outputCount || 2,
        aspectRatio: creativeOptions.aspectRatio || '1:1',
        isEdit: creativeOptions.isEdit || false,
        // v4.0 Trust Badges
        showTrustBadges: creativeOptions.showTrustBadges !== false,
        showRating: creativeOptions.showRating !== false,
        showShipping: creativeOptions.showShipping !== false,
        showSoldCount: creativeOptions.showSoldCount || false,
        soldCount: creativeOptions.soldCount || '1000+',
        rating: creativeOptions.rating || 4.9,
        // v4.0 Urgency
        showUrgency: creativeOptions.showUrgency !== false,
        timerHours: creativeOptions.timerHours || 6,
        timerMinutes: creativeOptions.timerMinutes || 30,
        stockLeft: creativeOptions.stockLeft || 5,
        // v4.0 Product Effects
        showProductGlow: creativeOptions.showProductGlow !== false,
        showSparkles: creativeOptions.showSparkles !== false,
        showReflection: creativeOptions.showReflection || false,
        showDecorations: creativeOptions.showDecorations !== false,
        // v4.0 Social Proof
        showSocialProof: creativeOptions.showSocialProof || false,
        socialProofType: creativeOptions.socialProofType || 'best_seller',
        // v4.0 Price Tag
        showPriceTag: creativeOptions.showPriceTag || false,
        originalPrice: creativeOptions.originalPrice || '',
        salePrice: creativeOptions.salePrice || '',
        // v4.0 Custom CTA
        ctaText: creativeOptions.ctaText || '',
        // v4.0 AI Auto-detect
        autoDetect: creativeOptions.autoDetect || false
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Generation failed: ${response.status}`);
    }

    const data = await response.json();
    log('🎨 Creative Studio v4.0: ULTIMATE generation complete', data);
    return data;

  } catch (error) {
    console.error('❌ Creative Studio generation failed:', error);
    throw error;
  }
};

// =====================================================
// REAL SEO MARKET DATA FUNCTIONS (100% Legal - No Scraping)
// =====================================================

/**
 * Search Etsy market for keyword statistics
 * Requires ETSY_API_KEY environment variable on server
 * @param {string} keyword - Search keyword
 * @param {number} limit - Max results (default 25)
 * @returns {Promise} - Market data (avgPrice, minPrice, maxPrice, topTags)
 */
export const searchEtsyMarket = async (keyword, limit = 25) => {
  try {
    log('🔍 Searching Etsy market for:', keyword);

    const response = await fetch('/api/etsy-market-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keyword, limit })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to search Etsy market');
    }

    log('✅ Etsy market search successful:', data.data);
    return data;
  } catch (error) {
    console.error('❌ Etsy market search failed:', error);
    throw error;
  }
};

/**
 * Get Google Trends data for keywords
 * @param {string[]} keywords - Array of keywords (max 5)
 * @returns {Promise} - Trends data (trend, risingKeywords)
 */
export const getGoogleTrends = async (keywords) => {
  try {
    log('📈 Getting Google Trends for:', keywords);

    const response = await fetch('/api/google-trends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ keywords: keywords.slice(0, 5) })
    });

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to get Google Trends');
    }

    log('✅ Google Trends successful:', data.data);
    return data;
  } catch (error) {
    console.error('❌ Google Trends failed:', error);
    throw error;
  }
};

/**
 * Fetch all market data in parallel for a marketplace
 * Uses only official APIs - no scraping
 * @param {string} marketplace - 'etsy', 'shopify', or 'amazon'
 * @param {string} keyword - Product keyword for market search
 * @returns {Promise} - Combined market data
 */
export const fetchMarketData = async (marketplace, keyword) => {
  const results = {
    market: null,
    trends: null,
    errors: []
  };

  const promises = [];

  // Market search (Etsy only - requires API key)
  if (marketplace === 'etsy' && keyword) {
    promises.push(
      searchEtsyMarket(keyword)
        .then(data => { results.market = data.data; })
        .catch(err => { results.errors.push(`Market: ${err.message}`); })
    );
  }

  // Google Trends (if keyword provided)
  if (keyword) {
    promises.push(
      getGoogleTrends([keyword])
        .then(data => { results.trends = data.data; })
        .catch(err => { results.errors.push(`Trends: ${err.message}`); })
    );
  }

  await Promise.all(promises);

  return results;
};
