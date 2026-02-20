/**
 * Volla Professional Template System
 *
 * Pomelli-level + Volla Exclusive Features:
 * - 7 Shot Types: Studio, Floating, Ingredient, In-Use, Lifestyle, Seasonal, Platform
 * - Professional Prompt Engineering with Metadata
 * - Business DNA Integration
 * - Auto Shot Suggestions
 * - Natural Language Refinement Support
 *
 * @version 2.0 - Pomelli Parity + Extras
 */

// =============================================================================
// VOLLA THEME COLORS
// =============================================================================
export const VOLLA_COLORS = {
  primary: '#E06847',      // Coral/Orange
  secondary: '#C85A3D',    // Darker coral
  accent: '#F59E0B',       // Amber
  gradient: {
    primary: 'linear-gradient(135deg, #E06847, #C85A3D)',
    secondary: 'linear-gradient(135deg, #F59E0B, #EAB308)',
    purple: 'linear-gradient(135deg, #8B5CF6, #7C3AED)',
    emerald: 'linear-gradient(135deg, #10B981, #059669)',
  }
};

// =============================================================================
// SHOT TYPES (Pomelli 5 + Volla 2 Exclusive)
// =============================================================================
export const SHOT_TYPES = {
  // Pomelli Core 5
  studio: {
    id: 'studio',
    name: 'Studio',
    icon: '📸',
    emoji: '⬜',
    description: 'Clean professional studio shot with controlled lighting',
    color: '#6366F1',
    gradient: 'from-indigo-500 to-violet-500',
    promptBase: 'Professional studio photography, clean background, perfect lighting, commercial quality',
    bestFor: ['e-commerce', 'amazon', 'marketplace'],
    metadata: {
      lighting: 'three-point studio',
      background: 'pure white or gradient',
      shadows: 'soft, controlled',
      resolution: '4K native',
    }
  },
  floating: {
    id: 'floating',
    name: 'Floating',
    icon: '🎈',
    emoji: '✨',
    description: 'Product suspended/levitating with dramatic shadows',
    color: '#8B5CF6',
    gradient: 'from-violet-500 to-purple-500',
    promptBase: 'Product levitating in space, dramatic shadow below, dynamic angle, premium tech aesthetic',
    bestFor: ['tech', 'electronics', 'luxury'],
    metadata: {
      lighting: 'dramatic rim light',
      background: 'gradient or dark',
      shadows: 'dramatic drop shadow',
      resolution: '4K native',
    }
  },
  ingredient: {
    id: 'ingredient',
    name: 'Ingredient',
    icon: '🌿',
    emoji: '🍃',
    description: 'Product with ingredients/components displayed around it',
    color: '#10B981',
    gradient: 'from-emerald-500 to-teal-500',
    promptBase: 'Product surrounded by raw ingredients and components, flat lay composition, natural styling',
    bestFor: ['beauty', 'food', 'supplements', 'organic'],
    metadata: {
      lighting: 'soft natural',
      background: 'marble or wood surface',
      shadows: 'subtle',
      resolution: '4K native',
    }
  },
  inUse: {
    id: 'inUse',
    name: 'In Use',
    icon: '👆',
    emoji: '🤳',
    description: 'Product being used by AI model in context',
    color: '#F59E0B',
    gradient: 'from-amber-500 to-orange-500',
    promptBase: 'Product being used by person, natural interaction, lifestyle context, authentic feel',
    bestFor: ['fashion', 'beauty', 'lifestyle', 'wearables'],
    metadata: {
      lighting: 'natural or studio',
      background: 'contextual environment',
      shadows: 'natural',
      resolution: '4K native',
    }
  },
  lifestyle: {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: '🏠',
    emoji: '🛋️',
    description: 'Product placed in aspirational real-world environment',
    color: '#EC4899',
    gradient: 'from-pink-500 to-rose-500',
    promptBase: 'Product in beautiful lifestyle setting, aspirational environment, editorial quality',
    bestFor: ['home', 'decor', 'premium', 'gift'],
    metadata: {
      lighting: 'golden hour or ambient',
      background: 'curated environment',
      shadows: 'environmental',
      resolution: '4K native',
    }
  },

  // Volla Exclusive 2
  seasonal: {
    id: 'seasonal',
    name: 'Seasonal',
    icon: '🎄',
    emoji: '🌸',
    description: 'Holiday and seasonal themed shots',
    color: '#EF4444',
    gradient: 'from-red-500 to-rose-500',
    promptBase: 'Seasonal themed product photography, holiday decorations, festive atmosphere',
    bestFor: ['gifts', 'promotions', 'campaigns'],
    isVollaExclusive: true,
    metadata: {
      lighting: 'warm festive',
      background: 'seasonal decorations',
      shadows: 'soft warm',
      resolution: '4K native',
    }
  },
  platform: {
    id: 'platform',
    name: 'Platform',
    icon: '📱',
    emoji: '🛒',
    description: 'Optimized for specific marketplace requirements',
    color: '#06B6D4',
    gradient: 'from-cyan-500 to-blue-500',
    promptBase: 'Marketplace-optimized product photography, platform-specific requirements',
    bestFor: ['amazon', 'etsy', 'shopify', 'social'],
    isVollaExclusive: true,
    metadata: {
      lighting: 'per platform spec',
      background: 'per platform spec',
      shadows: 'per platform spec',
      resolution: '4K native',
    }
  },
};

// =============================================================================
// PRODUCT CATEGORIES
// =============================================================================
export const TEMPLATE_CATEGORIES = {
  fashion: {
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    description: 'Clothing, accessories, jewelry',
    color: '#E91E63',
    gradient: 'from-pink-500 to-rose-500',
    suggestedShots: ['studio', 'inUse', 'lifestyle', 'floating'],
    keywords: ['shirt', 'dress', 'pants', 'jacket', 'shoes', 'bag', 'hat', 'scarf', 'jewelry', 'watch', 'ring', 'necklace', 'bracelet', 'earring', 'clothing', 'apparel', 'fashion', 'wear', 'outfit'],
  },
  beauty: {
    id: 'beauty',
    name: 'Beauty',
    icon: '💄',
    description: 'Cosmetics, skincare, haircare',
    color: '#9C27B0',
    gradient: 'from-purple-500 to-violet-500',
    suggestedShots: ['studio', 'ingredient', 'inUse', 'floating'],
    keywords: ['makeup', 'cosmetic', 'skincare', 'serum', 'cream', 'lipstick', 'mascara', 'foundation', 'perfume', 'beauty', 'lotion', 'shampoo', 'conditioner', 'nail', 'hair', 'moisturizer'],
  },
  home: {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    description: 'Furniture, decor, kitchenware',
    color: '#795548',
    gradient: 'from-amber-600 to-orange-600',
    suggestedShots: ['lifestyle', 'studio', 'inUse'],
    keywords: ['furniture', 'chair', 'table', 'lamp', 'decor', 'pillow', 'blanket', 'rug', 'vase', 'candle', 'kitchen', 'home', 'living', 'bedroom', 'bathroom', 'sofa', 'curtain'],
  },
  food: {
    id: 'food',
    name: 'Food & Beverage',
    icon: '🍽️',
    description: 'Food, drinks, supplements',
    color: '#4CAF50',
    gradient: 'from-green-500 to-emerald-500',
    suggestedShots: ['ingredient', 'inUse', 'studio', 'lifestyle'],
    keywords: ['food', 'drink', 'beverage', 'snack', 'coffee', 'tea', 'chocolate', 'supplement', 'vitamin', 'protein', 'organic', 'natural', 'gourmet', 'recipe'],
  },
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    description: 'Gadgets, tech accessories',
    color: '#2196F3',
    gradient: 'from-blue-500 to-indigo-500',
    suggestedShots: ['floating', 'studio', 'inUse', 'lifestyle'],
    keywords: ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'charger', 'cable', 'tech', 'gadget', 'electronic', 'device', 'smart', 'wireless', 'earbuds', 'watch'],
  },
  general: {
    id: 'general',
    name: 'General',
    icon: '📦',
    description: 'Multi-purpose templates',
    color: '#607D8B',
    gradient: 'from-slate-500 to-gray-500',
    suggestedShots: ['studio', 'lifestyle', 'floating'],
    keywords: [],
  },
};

// =============================================================================
// PLATFORM SPECS (Volla Exclusive)
// =============================================================================
export const PLATFORM_SPECS = {
  amazon: {
    id: 'amazon',
    name: 'Amazon',
    icon: '🛒',
    color: '#FF9900',
    requirements: {
      background: 'pure white (RGB 255,255,255)',
      minResolution: '1000x1000',
      aspectRatio: '1:1',
      productFill: '85% minimum',
    },
    promptAddition: 'pure white background RGB 255 255 255, product fills 85% of frame, no props, e-commerce ready',
  },
  shopify: {
    id: 'shopify',
    name: 'Shopify',
    icon: '🛍️',
    color: '#96BF48',
    requirements: {
      background: 'white or lifestyle',
      minResolution: '2048x2048',
      aspectRatio: '1:1 or 4:3',
      productFill: '70-80%',
    },
    promptAddition: 'clean professional background, high resolution detail, web-optimized',
  },
  instagram: {
    id: 'instagram',
    name: 'Instagram',
    icon: '📸',
    color: '#E1306C',
    requirements: {
      background: 'lifestyle or styled',
      minResolution: '1080x1080',
      aspectRatio: '1:1, 4:5, or 9:16',
      productFill: '60-80%',
    },
    promptAddition: 'Instagram-worthy, aesthetically pleasing, scroll-stopping visual, lifestyle context',
  },
  tiktok: {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    color: '#000000',
    requirements: {
      background: 'dynamic or trending',
      minResolution: '1080x1920',
      aspectRatio: '9:16',
      productFill: '50-70%',
    },
    promptAddition: 'TikTok viral aesthetic, bold colors, Gen-Z appeal, trendy composition',
  },
  pinterest: {
    id: 'pinterest',
    name: 'Pinterest',
    icon: '📌',
    color: '#E60023',
    requirements: {
      background: 'aspirational lifestyle',
      minResolution: '1000x1500',
      aspectRatio: '2:3',
      productFill: '60-80%',
    },
    promptAddition: 'Pinterest-worthy, aspirational lifestyle, save-worthy aesthetic, vertical composition',
  },
  etsy: {
    id: 'etsy',
    name: 'Etsy',
    icon: '🎨',
    color: '#F56400',
    requirements: {
      background: 'authentic, handmade feel',
      minResolution: '2000x2000',
      aspectRatio: '4:3 or 1:1',
      productFill: '70-85%',
    },
    promptAddition: 'handcrafted aesthetic, authentic feel, artisan quality, natural textures',
  },
};

// =============================================================================
// SEASONAL THEMES (Volla Exclusive)
// =============================================================================
export const SEASONAL_THEMES = {
  spring: {
    id: 'spring',
    name: 'Spring',
    icon: '🌸',
    color: '#F472B6',
    gradient: 'from-pink-400 to-rose-400',
    promptAddition: 'spring aesthetic, cherry blossoms, pastel colors, fresh and light atmosphere, new beginnings',
    months: [3, 4, 5],
  },
  summer: {
    id: 'summer',
    name: 'Summer',
    icon: '☀️',
    color: '#FBBF24',
    gradient: 'from-yellow-400 to-orange-400',
    promptAddition: 'summer vibes, bright sunshine, beach aesthetic, tropical colors, vacation mood',
    months: [6, 7, 8],
  },
  autumn: {
    id: 'autumn',
    name: 'Autumn',
    icon: '🍂',
    color: '#F97316',
    gradient: 'from-orange-500 to-amber-600',
    promptAddition: 'autumn aesthetic, fall leaves, warm earth tones, cozy atmosphere, harvest mood',
    months: [9, 10, 11],
  },
  winter: {
    id: 'winter',
    name: 'Winter',
    icon: '❄️',
    color: '#60A5FA',
    gradient: 'from-blue-400 to-cyan-400',
    promptAddition: 'winter aesthetic, snow, cool blue tones, cozy warmth, holiday spirit',
    months: [12, 1, 2],
  },
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    icon: '🎄',
    color: '#DC2626',
    gradient: 'from-red-600 to-green-600',
    promptAddition: 'Christmas decorations, red and gold accents, festive lights, gift-giving aesthetic',
    months: [11, 12],
  },
  valentines: {
    id: 'valentines',
    name: "Valentine's Day",
    icon: '💕',
    color: '#EC4899',
    gradient: 'from-pink-500 to-red-500',
    promptAddition: 'romantic Valentine aesthetic, red roses, hearts, love and gift theme',
    months: [2],
  },
  blackFriday: {
    id: 'blackFriday',
    name: 'Black Friday',
    icon: '🏷️',
    color: '#1F2937',
    gradient: 'from-gray-900 to-yellow-500',
    promptAddition: 'Black Friday sale aesthetic, dramatic dark background, gold accents, premium deal vibe',
    months: [11],
  },
  newYear: {
    id: 'newYear',
    name: 'New Year',
    icon: '🎉',
    color: '#8B5CF6',
    gradient: 'from-purple-500 to-gold-500',
    promptAddition: 'New Year celebration, confetti, champagne aesthetic, fresh start, party vibe',
    months: [12, 1],
  },
};

// =============================================================================
// ASPECT RATIO PRESETS
// =============================================================================
export const ASPECT_RATIO_PRESETS = {
  '1:1': {
    ratio: '1:1',
    name: 'Square',
    icon: '⬜',
    dimensions: '1024x1024',
    platforms: ['instagram', 'facebook', 'etsy', 'amazon'],
    use: 'Feed posts, marketplace listings'
  },
  '4:5': {
    ratio: '4:5',
    name: 'Portrait',
    icon: '📱',
    dimensions: '1024x1280',
    platforms: ['instagram', 'pinterest'],
    use: 'Instagram feed, Pinterest'
  },
  '9:16': {
    ratio: '9:16',
    name: 'Story/Reel',
    icon: '📲',
    dimensions: '1024x1820',
    platforms: ['instagram', 'tiktok', 'youtube'],
    use: 'Stories, Reels, TikTok'
  },
  '16:9': {
    ratio: '16:9',
    name: 'Landscape',
    icon: '🖼️',
    dimensions: '1820x1024',
    platforms: ['youtube', 'web'],
    use: 'YouTube, website banners'
  },
  '2:3': {
    ratio: '2:3',
    name: 'Pinterest',
    icon: '📌',
    dimensions: '1024x1536',
    platforms: ['pinterest'],
    use: 'Pinterest pins'
  },
  '3:4': {
    ratio: '3:4',
    name: 'Product',
    icon: '🛍️',
    dimensions: '1024x1365',
    platforms: ['shopify', 'etsy'],
    use: 'Product listings'
  },
};

// =============================================================================
// PROFESSIONAL PROMPT TEMPLATES
// =============================================================================
export const PROMPT_TEMPLATES = {
  // Studio Shots
  studioClean: {
    id: 'studioClean',
    shotType: 'studio',
    name: 'Clean White Studio',
    icon: '⬜',
    prompt: `Professional studio product photography of {product}.
Clean pure white background.
Three-point lighting setup with soft key light, fill light, and rim light.
Sharp focus on product details.
Soft natural shadows.
8K resolution, commercial e-commerce quality.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1', '4:5', '3:4'],
  },
  studioGradient: {
    id: 'studioGradient',
    shotType: 'studio',
    name: 'Gradient Studio',
    icon: '🌈',
    prompt: `Professional studio product photography of {product}.
Elegant gradient background transitioning from light to subtle color.
Premium studio lighting with soft shadows.
Product centered, high detail.
8K resolution, luxury brand aesthetic.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1', '16:9'],
  },
  studioMinimal: {
    id: 'studioMinimal',
    shotType: 'studio',
    name: 'Minimal Scandinavian',
    icon: '🪶',
    prompt: `Minimalist Scandinavian product photography of {product}.
Clean neutral background with subtle texture.
Soft diffused lighting.
Negative space composition.
Modern, clean, premium feel.
8K resolution.
{brandContext}`,
    categories: ['home', 'beauty', 'fashion'],
    aspectRatios: ['1:1', '4:5'],
  },

  // Floating Shots
  floatingDramatic: {
    id: 'floatingDramatic',
    shotType: 'floating',
    name: 'Dramatic Float',
    icon: '✨',
    prompt: `Dynamic floating product shot of {product}.
Product levitating with dramatic drop shadow below.
Dark gradient background.
Rim lighting creating glow effect.
Futuristic tech aesthetic.
8K resolution, Apple-style premium.
{brandContext}`,
    categories: ['electronics', 'beauty', 'fashion'],
    aspectRatios: ['1:1', '16:9'],
  },
  floatingColorful: {
    id: 'floatingColorful',
    shotType: 'floating',
    name: 'Colorful Float',
    icon: '🎨',
    prompt: `Vibrant floating product shot of {product}.
Product suspended in colorful gradient environment.
Dynamic angle, playful composition.
Bold, eye-catching aesthetic.
8K resolution, Gen-Z appeal.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1', '9:16'],
  },

  // Ingredient Shots
  ingredientFlatlay: {
    id: 'ingredientFlatlay',
    shotType: 'ingredient',
    name: 'Ingredient Flatlay',
    icon: '🌿',
    prompt: `Flat lay product photography of {product}.
Product surrounded by natural raw ingredients.
Marble or wooden surface.
Soft overhead lighting.
Natural, organic aesthetic.
8K resolution, beauty/wellness brand style.
{brandContext}`,
    categories: ['beauty', 'food', 'health'],
    aspectRatios: ['1:1', '4:5'],
  },
  ingredientExploded: {
    id: 'ingredientExploded',
    shotType: 'ingredient',
    name: 'Exploded View',
    icon: '💥',
    prompt: `Creative exploded view photography of {product}.
Product with components and ingredients floating around.
Clean background.
Dynamic composition showing what's inside.
Educational yet beautiful.
8K resolution.
{brandContext}`,
    categories: ['beauty', 'food', 'electronics'],
    aspectRatios: ['1:1', '16:9'],
  },

  // In-Use Shots
  inUseHands: {
    id: 'inUseHands',
    shotType: 'inUse',
    name: 'Hands Interaction',
    icon: '🤲',
    prompt: `Lifestyle product photography showing {product} being held by elegant hands.
Natural interaction, authentic feel.
Soft background blur.
Warm, inviting lighting.
Relatable, human connection.
8K resolution.
{brandContext}`,
    categories: ['beauty', 'electronics', 'food'],
    aspectRatios: ['1:1', '4:5'],
  },
  inUseModel: {
    id: 'inUseModel',
    shotType: 'inUse',
    name: 'Model Using',
    icon: '👤',
    prompt: `Fashion/lifestyle photography showing model using {product}.
Natural, candid moment.
Professional model, diverse representation.
Lifestyle context.
Magazine editorial quality.
8K resolution.
{brandContext}`,
    categories: ['fashion', 'beauty', 'electronics'],
    aspectRatios: ['4:5', '9:16'],
  },
  inUseWearing: {
    id: 'inUseWearing',
    shotType: 'inUse',
    name: 'Model Wearing',
    icon: '👗',
    prompt: `Fashion photography of model wearing {product}.
Professional fashion model.
Clean studio or lifestyle setting.
Perfect fit showcase.
High fashion editorial quality.
8K resolution.
{brandContext}`,
    categories: ['fashion'],
    aspectRatios: ['4:5', '9:16', '2:3'],
  },

  // Lifestyle Shots
  lifestyleModern: {
    id: 'lifestyleModern',
    shotType: 'lifestyle',
    name: 'Modern Living',
    icon: '🏠',
    prompt: `Lifestyle product photography of {product} in modern living space.
Contemporary interior design setting.
Natural window lighting.
Aspirational home environment.
Editorial home decor quality.
8K resolution.
{brandContext}`,
    categories: ['home', 'electronics', 'general'],
    aspectRatios: ['16:9', '4:3', '1:1'],
  },
  lifestyleCozy: {
    id: 'lifestyleCozy',
    shotType: 'lifestyle',
    name: 'Cozy Atmosphere',
    icon: '☕',
    prompt: `Cozy lifestyle photography featuring {product}.
Warm, inviting atmosphere.
Soft textures, warm lighting.
Hygge aesthetic.
Emotionally appealing.
8K resolution.
{brandContext}`,
    categories: ['home', 'food', 'beauty'],
    aspectRatios: ['1:1', '4:5'],
  },
  lifestyleOutdoor: {
    id: 'lifestyleOutdoor',
    shotType: 'lifestyle',
    name: 'Outdoor Scene',
    icon: '🌳',
    prompt: `Outdoor lifestyle photography of {product}.
Beautiful natural environment.
Golden hour lighting.
Adventure or relaxation mood.
Nature-connected aesthetic.
8K resolution.
{brandContext}`,
    categories: ['fashion', 'food', 'electronics'],
    aspectRatios: ['16:9', '4:5', '9:16'],
  },

  // Seasonal Shots
  seasonalChristmas: {
    id: 'seasonalChristmas',
    shotType: 'seasonal',
    name: 'Christmas Magic',
    icon: '🎄',
    prompt: `Christmas themed product photography of {product}.
Festive holiday decorations.
Red, gold, and green color palette.
Warm string lights bokeh.
Gift-giving aesthetic.
8K resolution.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1', '4:5'],
    seasonal: 'christmas',
  },
  seasonalSummer: {
    id: 'seasonalSummer',
    shotType: 'seasonal',
    name: 'Summer Vibes',
    icon: '☀️',
    prompt: `Summer themed product photography of {product}.
Bright sunshine, beach or poolside aesthetic.
Vibrant summer colors.
Vacation mood.
Refreshing, energetic feel.
8K resolution.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1', '9:16'],
    seasonal: 'summer',
  },

  // Platform-Specific
  platformAmazon: {
    id: 'platformAmazon',
    shotType: 'platform',
    name: 'Amazon Ready',
    icon: '🛒',
    prompt: `Amazon product listing photography of {product}.
Pure white background RGB 255,255,255.
Product fills 85% of frame.
No props or distractions.
All product details visible.
Sharp focus, e-commerce optimized.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1'],
    platform: 'amazon',
  },
  platformInstagram: {
    id: 'platformInstagram',
    shotType: 'platform',
    name: 'Instagram Perfect',
    icon: '📸',
    prompt: `Instagram-optimized product photography of {product}.
Scroll-stopping visual appeal.
Trendy aesthetic, cohesive feed style.
Lifestyle context with product focus.
Highly shareable composition.
8K resolution.
{brandContext}`,
    categories: ['all'],
    aspectRatios: ['1:1', '4:5'],
    platform: 'instagram',
  },
};

// =============================================================================
// AUTO SHOT SUGGESTIONS
// =============================================================================
export const SHOT_SUGGESTIONS = {
  // Returns optimal 5-shot set for a product category
  getSuggestedShots: (categoryId, businessDNA = null) => {
    const category = TEMPLATE_CATEGORIES[categoryId] || TEMPLATE_CATEGORIES.general;
    const baseShots = category.suggestedShots || ['studio', 'lifestyle', 'floating'];

    // Build a comprehensive shot list
    const shotList = [
      {
        type: 'hero',
        shotType: baseShots[0],
        name: 'Hero Shot',
        description: 'Main product image for listings',
        priority: 1,
      },
      {
        type: 'detail',
        shotType: 'studio',
        name: 'Detail Shot',
        description: 'Close-up showing key features',
        priority: 2,
      },
      {
        type: 'lifestyle',
        shotType: baseShots.includes('lifestyle') ? 'lifestyle' : 'inUse',
        name: 'Lifestyle Shot',
        description: 'Product in real-world context',
        priority: 3,
      },
      {
        type: 'angle',
        shotType: baseShots[0],
        name: '3/4 Angle',
        description: 'Dynamic angle showing depth',
        priority: 4,
      },
      {
        type: 'scale',
        shotType: 'inUse',
        name: 'Scale Reference',
        description: 'Size context with human element',
        priority: 5,
      },
    ];

    // Add seasonal if current month matches
    const currentMonth = new Date().getMonth() + 1;
    const activeSeason = Object.values(SEASONAL_THEMES).find(s => s.months.includes(currentMonth));
    if (activeSeason) {
      shotList.push({
        type: 'seasonal',
        shotType: 'seasonal',
        name: `${activeSeason.name} Special`,
        description: `Seasonal ${activeSeason.name.toLowerCase()} themed shot`,
        priority: 6,
        seasonal: activeSeason.id,
      });
    }

    return shotList;
  },
};

// =============================================================================
// PROMPT BUILDER
// =============================================================================
export function buildPromptFromTemplate(template, productName, businessDNA = null, options = {}) {
  let prompt = template.prompt || template.promptBase || '';

  // Replace product placeholder
  prompt = prompt.replace(/{product}/g, productName);

  // Build brand context
  let brandContext = '';
  if (businessDNA) {
    const contextParts = [];

    if (businessDNA.brandName) {
      contextParts.push(`Brand: ${businessDNA.brandName}`);
    }
    if (businessDNA.brandTone?.length > 0) {
      contextParts.push(`Tone: ${businessDNA.brandTone.join(', ')}`);
    }
    if (businessDNA.visualAesthetic?.length > 0) {
      contextParts.push(`Aesthetic: ${businessDNA.visualAesthetic.join(', ')}`);
    }
    if (businessDNA.colors?.primary) {
      contextParts.push(`Brand color: ${businessDNA.colors.primary}`);
    }

    if (contextParts.length > 0) {
      brandContext = `\n\nBRAND IDENTITY:\n${contextParts.join('\n')}`;
    }
  }

  prompt = prompt.replace(/{brandContext}/g, brandContext);

  // Add seasonal theme if specified
  if (options.seasonalTheme && SEASONAL_THEMES[options.seasonalTheme]) {
    prompt += `\n\n${SEASONAL_THEMES[options.seasonalTheme].promptAddition}`;
  }

  // Add platform requirements if specified
  if (options.platform && PLATFORM_SPECS[options.platform]) {
    prompt += `\n\n${PLATFORM_SPECS[options.platform].promptAddition}`;
  }

  // Add quality suffix
  prompt += '\n\nTechnical: 8K resolution, sharp focus, professional color grading, commercial quality.';

  return prompt.trim();
}

// =============================================================================
// NATURAL LANGUAGE REFINEMENT
// =============================================================================
export const NL_REFINEMENTS = {
  // Common refinement patterns
  patterns: {
    'warmer': 'warmer color temperature, golden tones',
    'cooler': 'cooler color temperature, blue tones',
    'brighter': 'increased brightness, more light',
    'darker': 'decreased brightness, moodier lighting',
    'more dramatic': 'dramatic lighting, stronger shadows, high contrast',
    'softer': 'soft diffused lighting, gentle shadows',
    'minimalist': 'clean minimal composition, negative space',
    'luxurious': 'premium luxury aesthetic, high-end feel',
    'playful': 'fun playful energy, vibrant colors',
    'professional': 'corporate professional look, business aesthetic',
  },

  // Apply refinement to prompt
  applyRefinement: (basePrompt, refinementText) => {
    const lower = refinementText.toLowerCase();
    let additions = [];

    Object.entries(NL_REFINEMENTS.patterns).forEach(([pattern, addition]) => {
      if (lower.includes(pattern)) {
        additions.push(addition);
      }
    });

    if (additions.length > 0) {
      return `${basePrompt}\n\nStyle adjustments: ${additions.join(', ')}`;
    }

    // If no pattern matched, add the text directly
    return `${basePrompt}\n\nAdditional styling: ${refinementText}`;
  },
};

// =============================================================================
// CATEGORY DETECTION
// =============================================================================
export function detectCategory(productDescription) {
  const desc = productDescription.toLowerCase();

  for (const [categoryId, category] of Object.entries(TEMPLATE_CATEGORIES)) {
    if (category.keywords?.some(keyword => desc.includes(keyword))) {
      return categoryId;
    }
  }

  return 'general';
}

// =============================================================================
// EXPORTS
// =============================================================================
export default {
  VOLLA_COLORS,
  SHOT_TYPES,
  TEMPLATE_CATEGORIES,
  PLATFORM_SPECS,
  SEASONAL_THEMES,
  ASPECT_RATIO_PRESETS,
  PROMPT_TEMPLATES,
  SHOT_SUGGESTIONS,
  NL_REFINEMENTS,
  buildPromptFromTemplate,
  detectCategory,
};
