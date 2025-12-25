// =====================================================
// VOLLA - EVIDENCE-BASED E-COMMERCE ANALYZER
// Using site:etsy.com for REAL marketplace data
// Now with Market Insights: Competition, Trends, Score
// =====================================================

// Platform rules
export const PLATFORM_RULES = {
  etsy: { titleMaxChars: 140, keywordsCount: 13 },
  ebay: { titleMaxChars: 80, keywordsMin: 10, keywordsMax: 15 },
  redbubble: { titleMaxChars: 80, keywordsCount: 15 },
  depop: { titleMaxChars: 100, keywordsMin: 5, keywordsMax: 7 }
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
  console.log('🔧 safeParseJSON called, input length:', text?.length || 0);

  if (!text || typeof text !== 'string') {
    throw new Error('Empty response from API');
  }

  const trimmedText = text.trim();
  if (trimmedText === '') {
    throw new Error('Empty response from API');
  }

  console.log('🔧 Raw input (first 300 chars):', trimmedText.substring(0, 300));

  let cleanText = trimmedText
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('❌ No JSON found in:', cleanText.substring(0, 500));
    throw new Error('No JSON object found in API response');
  }

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

// Filter Etsy URLs
const filterEtsyUrls = (groundingChunks) => {
  if (!groundingChunks || !Array.isArray(groundingChunks)) return [];
  return groundingChunks
    .filter(chunk => chunk.web?.uri?.includes('etsy.com'))
    .map(chunk => ({ url: chunk.web.uri, title: chunk.web.title || 'Etsy Listing' }));
};

// Validate Response
const validateResponse = (data) => {
  const validated = { ...data };
  if (validated.etsy) {
    if (validated.etsy.title) {
      validated.etsy.title = validated.etsy.title.replace(/\s*\(\d+\s*chars?\)\s*$/i, '').trim();
    }
    if (validated.etsy.title && validated.etsy.title.length > 140) {
      validated.etsy.title = validated.etsy.title.substring(0, 137) + '...';
    }
    if (validated.etsy.keywords && validated.etsy.keywords.length > 13) {
      validated.etsy.keywords = validated.etsy.keywords.slice(0, 13);
    }
  }
  return validated;
};

// =====================================================
// STEP 1: IDENTIFY PRODUCT TYPE
// =====================================================
const identifyProductType = async (cleanBase64, mimeType, apiKey) => {
  console.log('🔍 STEP 1: Identifying product...');

  const requestBody = {
    contents: [{
      parts: [
        {
          text: `Analyze this product image. Return JSON only:
{
  "product_type": "Specific product name",
  "search_query": "Best Etsy search query for similar products"
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
// STEP 2: REAL ETSY SEARCH
// =====================================================
const searchEtsyMarket = async (searchQuery, apiKey) => {
  console.log('🔎 STEP 2: Searching Etsy with site:etsy.com...');

  const requestBody = {
    contents: [{
      parts: [{
        text: `You are an Etsy market researcher. Search: "site:etsy.com ${searchQuery}"

Extract from REAL search results:
1. Competitor titles (exact)
2. Price range
3. Top keywords from titles

Return JSON:
{
  "competitorListings": [{"title": "Real title", "price": "$XX.XX"}],
  "priceRange": {"min": "$XX.XX", "max": "$XX.XX", "average": "$XX.XX"},
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
  let etsyUrls = groundingMetadata?.groundingChunks ? filterEtsyUrls(groundingMetadata.groundingChunks) : [];

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    const marketData = safeParseJSON(text);
    marketData._etsyUrls = etsyUrls;
    marketData._isGrounded = etsyUrls.length > 0;
    return marketData;
  } catch (e) {
    return null;
  }
};

// =====================================================
// STEP 3: GENERATE SEO
// =====================================================
const generateEtsySEO = async (productType, marketData, cleanBase64, mimeType, apiKey) => {
  console.log('📝 STEP 3: Generating SEO...');

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

  if (!response.ok) throw new Error(`Step 3 API Error: ${response.status}`);

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No response from Step 3');

  return safeParseJSON(text);
};

// =====================================================
// STEP 4: MARKET INSIGHTS (Competition, Trend, Score)
// =====================================================
const analyzeMarketInsights = async (generatedTitle, productType, apiKey) => {
  console.log('📊 STEP 4: Analyzing market insights for:', generatedTitle);

  const requestBody = {
    contents: [{
      parts: [{
        text: `You are an Etsy market analyst. Analyze the market for this product:

PRODUCT: ${productType}
TITLE: "${generatedTitle}"

Search "site:etsy.com ${productType}" to get REAL current data.

Based on your search results, analyze:

1. COMPETITION LEVEL: How many sellers are selling similar products?
   - LOW: Less than 100 similar listings
   - MEDIUM: 100-1000 similar listings
   - HIGH: More than 1000 similar listings

2. TREND DIRECTION: Based on Etsy search trends and listing activity
   - DECREASING: Less interest than before
   - STABLE: Consistent demand
   - INCREASING: Growing popularity

3. OPPORTUNITY SCORE: 0-100 based on:
   - Demand (are buyers searching for this?)
   - Competition (how saturated is the market?)
   - Price potential (can you profit?)
   - Niche potential (is there a gap you can fill?)

IMPORTANT: Base your analysis on REAL Etsy search data, not assumptions.

Return JSON only:
{
  "competitionLevel": "LOW" or "MEDIUM" or "HIGH",
  "competitionReason": "Brief explanation of why this level",
  "trendDirection": "DECREASING" or "STABLE" or "INCREASING",
  "trendReason": "Brief explanation based on search data",
  "opportunityScore": 75,
  "opportunityReason": "Brief explanation of the score",
  "listingsFound": "Approximate number of similar listings found"
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
    console.log('⚠️ Market insights failed, returning defaults');
    return {
      competitionLevel: 'MEDIUM',
      competitionReason: 'Unable to analyze - using default',
      trendDirection: 'STABLE',
      trendReason: 'Unable to analyze - using default',
      opportunityScore: 50,
      opportunityReason: 'Unable to analyze - using default',
      listingsFound: 'Unknown'
    };
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    return {
      competitionLevel: 'MEDIUM',
      trendDirection: 'STABLE',
      opportunityScore: 50,
      competitionReason: 'Analysis unavailable',
      trendReason: 'Analysis unavailable',
      opportunityReason: 'Analysis unavailable'
    };
  }

  try {
    const insights = safeParseJSON(text);
    console.log('✅ Market insights extracted:', insights);
    return insights;
  } catch (e) {
    console.log('⚠️ Could not parse market insights:', e.message);
    return {
      competitionLevel: 'MEDIUM',
      trendDirection: 'STABLE',
      opportunityScore: 50
    };
  }
};

// =====================================================
// MAIN API CALL: 4-STEP PROCESS
// =====================================================
export const callGeminiAPI = async (base64ImageDataUrl, platform, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    alert('❌ API key required. Add in Settings.');
    throw new Error('API key required');
  }

  console.log('🚀 Starting 4-STEP Analysis...');

  const cleanBase64 = base64ImageDataUrl.replace(/^data:image\/\w+;base64,/, "");
  const mimeTypeMatch = base64ImageDataUrl.match(/data:([^;]+);/);
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : 'image/jpeg';

  try {
    // STEP 1: Identify product
    lastApiStatus = '🔍 Step 1/4: Identifying product...';
    const productInfo = await identifyProductType(cleanBase64, mimeType, apiKey);

    // STEP 2: Search real Etsy market
    lastApiStatus = '🔎 Step 2/4: Searching Etsy market...';
    const marketData = await searchEtsyMarket(productInfo.search_query, apiKey);

    // STEP 3: Generate SEO
    lastApiStatus = '📝 Step 3/4: Generating SEO...';
    const etsySEO = await generateEtsySEO(productInfo.product_type, marketData, cleanBase64, mimeType, apiKey);

    // STEP 4: Market Insights
    lastApiStatus = '📊 Step 4/4: Analyzing market trends...';
    const marketInsights = await analyzeMarketInsights(etsySEO.title, productInfo.product_type, apiKey);

    // Build final response
    const result = {
      etsy: {
        ...etsySEO,
        marketInsights: marketInsights,
        _validated: true,
        _rules: { titleLimit: 140, keywordLimit: 13 }
      },
      ebay: {
        title: `${productInfo.product_type} - Coming Soon`,
        description: 'eBay optimization coming soon',
        keywords: [],
        price: etsySEO.price || '$0.00'
      },
      redbubble: {
        title: `${productInfo.product_type} Design`,
        description: 'Redbubble optimization coming soon',
        keywords: [],
        price: '$15.00 - $25.00'
      },
      depop: {
        title: `${productInfo.product_type} ✨`,
        description: 'Depop optimization coming soon',
        keywords: [],
        price: etsySEO.price || '$0.00'
      },
      _productInfo: productInfo,
      _marketData: marketData,
      _grounded: marketData?._isGrounded || false,
      _etsyUrls: marketData?._etsyUrls || []
    };

    const validated = validateResponse(result);

    lastApiStatus = validated._grounded
      ? '✅ Complete with REAL Etsy data!'
      : '✅ Complete (AI-based)';

    console.log('🎉 FINAL RESULT:', validated);
    return validated;

  } catch (error) {
    console.error('❌ Analysis failed:', error);
    lastApiStatus = `❌ Error: ${error.message}`;
    throw error;
  }
};

// Main analyze function
export const analyzeImage = async (base64Image, platform, apiKey) => {
  if (!apiKey || apiKey.trim() === '') {
    lastApiStatus = '⚠️ No API key';
    alert('⚠️ No API key. Add in Settings.');
    throw new Error('No API key');
  }

  console.log('🔍 Starting 4-STEP Etsy analysis...');
  lastApiStatus = '⏳ Analyzing with real market data...';

  return await callGeminiAPI(base64Image, platform, apiKey);
};
