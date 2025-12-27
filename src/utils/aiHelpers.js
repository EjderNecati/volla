// =====================================================
// VOLLA - MULTI-MARKETPLACE E-COMMERCE ANALYZER
// Supports: Etsy + Amazon (A9) + Shopify (Google SEO)
// =====================================================

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
// STEP 1: IDENTIFY PRODUCT TYPE
// =====================================================
const identifyProductType = async (cleanBase64, mimeType, apiKey, marketplace) => {
  console.log('🔍 STEP 1: Identifying product...');

  const marketplaceHints = {
    etsy: 'Best Etsy search query for similar handmade/vintage products',
    amazon: 'Best Amazon search query for similar products',
    shopify: 'Best Google search query for similar e-commerce products'
  };

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Analyze this product image. Return JSON only:
{
  "product_type": "Specific product name",
  "search_query": "${marketplaceHints[marketplace] || marketplaceHints.shopify}",
  "brand_suggestion": "Suggested brand name if applicable"
}` },
        { inline_data: { mime_type: mimeType, data: cleanBase64 } }
      ]
    }],
    generationConfig: { temperature: 0.1, maxOutputTokens: 256 }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(requestBody) }
  );

  if (!response.ok) throw new Error(`Step 1 API Error: ${response.status}`);
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Step 1');
  return safeParseJSON(text);
};

// =====================================================
// STEP 2: MARKET SEARCH (Etsy, Amazon, or Google/Shopify)
// =====================================================
const searchMarket = async (searchQuery, apiKey, marketplace) => {
  console.log(`🔎 STEP 2: Searching ${marketplace}...`);

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

  const response = await fetch(
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
  console.log('📝 Generating Etsy SEO...');

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
  console.log('📦 Generating Amazon A9 SEO...');

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
  console.log('🛒 Generating Shopify (Google SEO)...');

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
  console.log('📊 Analyzing market insights...');

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
// =====================================================
export const callGeminiAPI = async (base64ImageDataUrl, marketplace, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API key required');
  }

  console.log(`🚀 Starting ${marketplace.toUpperCase()} Analysis...`);

  const cleanBase64 = base64ImageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mimeTypeMatch = base64ImageDataUrl.match(/data:([^;]+);/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

  try {
    // STEP 1: Identify product
    lastApiStatus = `🔍 Step 1/4: Identifying product...`;
    const productInfo = await identifyProductType(cleanBase64, mimeType, apiKey, marketplace);

    // STEP 2: Search market
    lastApiStatus = `🔎 Step 2/4: Searching ${marketplace}...`;
    const marketData = await searchMarket(productInfo.search_query, apiKey, marketplace);

    // STEP 3: Generate SEO (marketplace-specific)
    lastApiStatus = `📝 Step 3/4: Generating ${marketplace} SEO...`;

    let seoData;
    if (marketplace === 'amazon') {
      seoData = await generateAmazonSEO(
        productInfo.product_type,
        productInfo.brand_suggestion,
        marketData,
        cleanBase64,
        mimeType,
        apiKey
      );
    } else if (marketplace === 'shopify') {
      seoData = await generateShopifySEO(
        productInfo.product_type,
        productInfo.brand_suggestion,
        marketData,
        cleanBase64,
        mimeType,
        apiKey
      );
    } else {
      seoData = await generateEtsySEO(
        productInfo.product_type,
        marketData,
        cleanBase64,
        mimeType,
        apiKey
      );
    }

    // STEP 4: Market Insights
    lastApiStatus = '📊 Step 4/4: Analyzing market trends...';
    const marketInsights = await analyzeMarketInsights(
      seoData.title,
      productInfo.product_type,
      apiKey,
      marketplace
    );

    // Build response based on marketplace
    const result = {
      marketplace: marketplace,
      ...seoData,
      marketInsights: marketInsights,
      _productInfo: productInfo,
      _marketData: marketData,
      _grounded: marketData?._isGrounded || false,
      _urls: marketData?._urls || []
    };

    lastApiStatus = result._grounded
      ? `✅ Complete with REAL ${marketplace} data!`
      : '✅ Complete (AI-based)';

    console.log('🎉 FINAL RESULT:', result);
    return result;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    lastApiStatus = `❌ Error: ${error.message}`;
    throw error;
  }
};

// Main analyze function - IMAGE MODE (PRESERVED)
export const analyzeImage = async (base64Image, marketplace, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No API key');
  }

  console.log(`🔍 Starting ${marketplace.toUpperCase()} IMAGE analysis...`);
  lastApiStatus = `⏳ Analyzing image for ${marketplace}...`;

  return await callGeminiAPI(base64Image, marketplace, apiKey);
};

// =====================================================
// TEXT MODE - SPIN/REWRITE & GENERATE SEO
// =====================================================

// TEXT MODE: Rewrite text and generate marketplace-specific SEO
const generateSEOFromText = async (inputText, marketplace, apiKey) => {
  console.log(`📝 TEXT MODE: Generating ${marketplace} SEO from text...`);

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
  console.log(`🔎 TEXT MODE: Searching ${marketplace} market...`);

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

// Main TEXT MODE function
export const analyzeText = async (inputText, marketplace, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('No API key');
  }

  if (!inputText || inputText.trim().length < 10) {
    throw new Error('Please enter at least 10 characters of product description');
  }

  console.log(`📝 Starting ${marketplace.toUpperCase()} TEXT analysis...`);
  lastApiStatus = `⏳ Processing text for ${marketplace}...`;

  try {
    // STEP 1: Search market for context (optional grounding)
    lastApiStatus = `🔎 Step 1/3: Researching ${marketplace} market...`;
    const marketData = await searchMarketForText(inputText, apiKey, marketplace);

    // STEP 2: Generate SEO from text
    lastApiStatus = `📝 Step 2/3: Generating ${marketplace} SEO...`;
    const seoData = await generateSEOFromText(inputText, marketplace, apiKey);

    // STEP 3: Market Insights
    lastApiStatus = '📊 Step 3/3: Analyzing market trends...';
    const marketInsights = await analyzeMarketInsights(
      seoData.title,
      inputText.substring(0, 50),
      apiKey,
      marketplace
    );

    // Build response
    const result = {
      marketplace: marketplace,
      inputMode: 'text',
      ...seoData,
      marketInsights: marketInsights,
      _marketData: marketData,
      _grounded: marketData?._isGrounded || false,
      _originalText: inputText
    };

    lastApiStatus = result._grounded
      ? `✅ Complete with REAL ${marketplace} data!`
      : '✅ Complete (AI-based)';

    console.log('🎉 TEXT MODE RESULT:', result);
    return result;

  } catch (error) {
    console.error('❌ Text analysis failed:', error);
    lastApiStatus = `❌ Error: ${error.message}`;
    throw error;
  }
};
