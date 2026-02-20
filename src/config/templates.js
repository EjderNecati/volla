/**
 * Template System Configuration
 * Pomelli-level template library with categories, types, and placement zones
 *
 * Categories:
 * - Fashion: Clothing, accessories, jewelry
 * - Beauty: Cosmetics, skincare, haircare
 * - Home: Furniture, decor, kitchenware
 * - Consumables: Food, beverages, supplements
 * - Electronics: Gadgets, accessories
 * - General: Multi-purpose templates
 */

// Template Categories
export const TEMPLATE_CATEGORIES = {
  fashion: {
    id: 'fashion',
    name: 'Fashion',
    icon: '👗',
    description: 'Clothing, accessories, jewelry',
    color: '#E91E63',
  },
  beauty: {
    id: 'beauty',
    name: 'Beauty',
    icon: '💄',
    description: 'Cosmetics, skincare, haircare',
    color: '#9C27B0',
  },
  home: {
    id: 'home',
    name: 'Home',
    icon: '🏠',
    description: 'Furniture, decor, kitchenware',
    color: '#795548',
  },
  consumables: {
    id: 'consumables',
    name: 'Consumables',
    icon: '🍽️',
    description: 'Food, beverages, supplements',
    color: '#4CAF50',
  },
  electronics: {
    id: 'electronics',
    name: 'Electronics',
    icon: '📱',
    description: 'Gadgets, tech accessories',
    color: '#2196F3',
  },
  general: {
    id: 'general',
    name: 'General',
    icon: '📦',
    description: 'Multi-purpose templates',
    color: '#607D8B',
  },
};

// Template Types (Shot Styles)
export const TEMPLATE_TYPES = {
  model_try_on: {
    id: 'model_try_on',
    name: 'Model Try On',
    icon: '👤',
    description: 'Product worn or held by model',
    categories: ['fashion', 'beauty', 'electronics'],
  },
  in_use: {
    id: 'in_use',
    name: 'In Use',
    icon: '✋',
    description: 'Product being used in context',
    categories: ['beauty', 'home', 'electronics', 'consumables'],
  },
  flatlay: {
    id: 'flatlay',
    name: 'Flat Lay',
    icon: '📐',
    description: 'Top-down arranged composition',
    categories: ['fashion', 'beauty', 'consumables', 'electronics'],
  },
  studio: {
    id: 'studio',
    name: 'Studio',
    icon: '📸',
    description: 'Clean professional studio shot',
    categories: ['fashion', 'beauty', 'home', 'electronics', 'consumables', 'general'],
  },
  contextual: {
    id: 'contextual',
    name: 'Contextual',
    icon: '🏞️',
    description: 'Product in natural environment',
    categories: ['home', 'consumables', 'electronics', 'general'],
  },
  seasonal: {
    id: 'seasonal',
    name: 'Seasonal',
    icon: '🎄',
    description: 'Holiday and seasonal themes',
    categories: ['fashion', 'beauty', 'home', 'consumables', 'general'],
  },
  lifestyle: {
    id: 'lifestyle',
    name: 'Lifestyle',
    icon: '🌟',
    description: 'Aspirational lifestyle settings',
    categories: ['fashion', 'beauty', 'home', 'electronics'],
  },
  hero: {
    id: 'hero',
    name: 'Hero Shot',
    icon: '🏆',
    description: 'Dramatic featured product shot',
    categories: ['electronics', 'beauty', 'fashion'],
  },
};

// Aspect Ratio Presets
export const ASPECT_RATIO_PRESETS = {
  square: { ratio: '1:1', name: 'Square', icon: '⬜', platforms: ['instagram', 'facebook', 'etsy'] },
  portrait: { ratio: '4:5', name: 'Portrait', icon: '📱', platforms: ['instagram', 'pinterest'] },
  story: { ratio: '9:16', name: 'Story/Reel', icon: '📲', platforms: ['instagram', 'tiktok', 'youtube'] },
  landscape: { ratio: '16:9', name: 'Landscape', icon: '🖼️', platforms: ['youtube', 'web'] },
  pinterest: { ratio: '2:3', name: 'Pinterest', icon: '📌', platforms: ['pinterest'] },
  wide: { ratio: '21:9', name: 'Ultra-wide', icon: '🎬', platforms: ['web', 'banner'] },
};

// Template Library - Organized by Category and Type
export const TEMPLATE_LIBRARY = {
  fashion: {
    model_try_on: [
      {
        id: 'fashion_model_casual',
        name: 'Casual Model',
        thumbnail: '/templates/fashion/model_casual.jpg',
        prompt: 'Professional fashion photography, model wearing {product}, casual lifestyle setting, soft natural lighting, clean minimal background, magazine quality',
        placementZone: { x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
        aspectRatios: ['1:1', '4:5', '2:3'],
      },
      {
        id: 'fashion_model_elegant',
        name: 'Elegant Model',
        thumbnail: '/templates/fashion/model_elegant.jpg',
        prompt: 'High-end fashion photography, model wearing {product}, elegant studio setting, dramatic lighting, luxury brand aesthetic',
        placementZone: { x: 0.25, y: 0.15, width: 0.5, height: 0.7 },
        aspectRatios: ['1:1', '4:5', '9:16'],
      },
      {
        id: 'fashion_model_street',
        name: 'Street Style',
        thumbnail: '/templates/fashion/model_street.jpg',
        prompt: 'Urban street style photography, model wearing {product}, city background, golden hour lighting, trendy influencer aesthetic',
        placementZone: { x: 0.2, y: 0.1, width: 0.6, height: 0.8 },
        aspectRatios: ['4:5', '9:16'],
      },
    ],
    flatlay: [
      {
        id: 'fashion_flatlay_minimal',
        name: 'Minimal Flatlay',
        thumbnail: '/templates/fashion/flatlay_minimal.jpg',
        prompt: 'Minimalist flat lay photography, {product} arranged on white marble surface, clean styling, negative space, editorial quality',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['1:1', '4:5'],
      },
      {
        id: 'fashion_flatlay_styled',
        name: 'Styled Flatlay',
        thumbnail: '/templates/fashion/flatlay_styled.jpg',
        prompt: 'Styled flat lay photography, {product} with complementary accessories, cohesive color palette, Instagram-worthy composition',
        placementZone: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        aspectRatios: ['1:1'],
      },
    ],
    studio: [
      {
        id: 'fashion_studio_clean',
        name: 'Clean Studio',
        thumbnail: '/templates/fashion/studio_clean.jpg',
        prompt: 'Professional studio photography, {product} on clean white background, perfect lighting, e-commerce quality, sharp details',
        placementZone: { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
        aspectRatios: ['1:1', '4:3', '3:4'],
      },
      {
        id: 'fashion_studio_hanger',
        name: 'On Hanger',
        thumbnail: '/templates/fashion/studio_hanger.jpg',
        prompt: 'Fashion photography, {product} on professional wooden hanger, clean studio background, professional lighting',
        placementZone: { x: 0.25, y: 0.1, width: 0.5, height: 0.8 },
        aspectRatios: ['3:4', '4:5'],
      },
    ],
  },

  beauty: {
    in_use: [
      {
        id: 'beauty_hands_product',
        name: 'Hands with Product',
        thumbnail: '/templates/beauty/hands_product.jpg',
        prompt: 'Beauty product photography, elegant hands holding {product}, soft lighting, clean background, luxury brand aesthetic',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['1:1', '4:5'],
      },
      {
        id: 'beauty_application',
        name: 'Application Shot',
        thumbnail: '/templates/beauty/application.jpg',
        prompt: 'Beauty product being applied, {product} in use, close-up detail, soft focus background, aspirational beauty photography',
        placementZone: { x: 0.35, y: 0.35, width: 0.3, height: 0.3 },
        aspectRatios: ['1:1', '9:16'],
      },
    ],
    flatlay: [
      {
        id: 'beauty_flatlay_marble',
        name: 'Marble Surface',
        thumbnail: '/templates/beauty/flatlay_marble.jpg',
        prompt: 'Luxury beauty flat lay, {product} on white marble surface, gold accents, botanical elements, high-end aesthetic',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['1:1'],
      },
      {
        id: 'beauty_flatlay_pink',
        name: 'Pink Aesthetic',
        thumbnail: '/templates/beauty/flatlay_pink.jpg',
        prompt: 'Feminine beauty flat lay, {product} on soft pink background, delicate styling, roses and petals, dreamy aesthetic',
        placementZone: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        aspectRatios: ['1:1', '4:5'],
      },
    ],
    hero: [
      {
        id: 'beauty_hero_glow',
        name: 'Glowing Hero',
        thumbnail: '/templates/beauty/hero_glow.jpg',
        prompt: 'Hero beauty shot, {product} with dramatic glow effect, dark background, spotlight lighting, premium brand feel',
        placementZone: { x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
        aspectRatios: ['1:1', '16:9'],
      },
    ],
  },

  home: {
    contextual: [
      {
        id: 'home_living_room',
        name: 'Living Room',
        thumbnail: '/templates/home/living_room.jpg',
        prompt: 'Interior design photography, {product} in modern living room setting, natural lighting, cozy atmosphere, lifestyle home decor',
        placementZone: { x: 0.2, y: 0.3, width: 0.6, height: 0.5 },
        aspectRatios: ['16:9', '4:3', '1:1'],
      },
      {
        id: 'home_kitchen',
        name: 'Kitchen Scene',
        thumbnail: '/templates/home/kitchen.jpg',
        prompt: 'Kitchen product photography, {product} in modern kitchen setting, marble countertop, natural light from window, lifestyle aesthetic',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['16:9', '1:1'],
      },
      {
        id: 'home_bedroom',
        name: 'Bedroom Setting',
        thumbnail: '/templates/home/bedroom.jpg',
        prompt: 'Bedroom lifestyle photography, {product} in cozy bedroom setting, soft morning light, linen textures, calming atmosphere',
        placementZone: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        aspectRatios: ['16:9', '4:5'],
      },
    ],
    studio: [
      {
        id: 'home_studio_minimal',
        name: 'Minimal Studio',
        thumbnail: '/templates/home/studio_minimal.jpg',
        prompt: 'Minimalist product photography, {product} on clean background, soft shadows, scandinavian aesthetic, e-commerce ready',
        placementZone: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        aspectRatios: ['1:1', '4:3'],
      },
    ],
  },

  consumables: {
    in_use: [
      {
        id: 'consumables_table_setting',
        name: 'Table Setting',
        thumbnail: '/templates/consumables/table.jpg',
        prompt: 'Food photography, {product} on styled table setting, restaurant quality, appetizing presentation, natural lighting',
        placementZone: { x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
        aspectRatios: ['1:1', '4:5'],
      },
      {
        id: 'consumables_hands_holding',
        name: 'Hands Holding',
        thumbnail: '/templates/consumables/hands.jpg',
        prompt: 'Lifestyle food photography, hands holding {product}, casual setting, relatable presentation, Instagram aesthetic',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['1:1', '9:16'],
      },
    ],
    flatlay: [
      {
        id: 'consumables_flatlay_ingredients',
        name: 'With Ingredients',
        thumbnail: '/templates/consumables/flatlay_ingredients.jpg',
        prompt: 'Food flat lay photography, {product} surrounded by fresh ingredients, rustic wooden surface, natural styling',
        placementZone: { x: 0.35, y: 0.35, width: 0.3, height: 0.3 },
        aspectRatios: ['1:1'],
      },
    ],
    studio: [
      {
        id: 'consumables_studio_clean',
        name: 'Clean Product Shot',
        thumbnail: '/templates/consumables/studio.jpg',
        prompt: 'Professional food product photography, {product} on clean background, perfect lighting, packaging detail visible',
        placementZone: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
        aspectRatios: ['1:1', '4:3'],
      },
    ],
  },

  electronics: {
    hero: [
      {
        id: 'electronics_hero_tech',
        name: 'Tech Hero',
        thumbnail: '/templates/electronics/hero_tech.jpg',
        prompt: 'Tech product hero shot, {product} with dramatic lighting, dark gradient background, futuristic aesthetic, premium brand feel',
        placementZone: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
        aspectRatios: ['16:9', '1:1'],
      },
      {
        id: 'electronics_hero_floating',
        name: 'Floating Product',
        thumbnail: '/templates/electronics/hero_floating.jpg',
        prompt: 'Tech product photography, {product} floating with dynamic shadows, colorful gradient background, modern Apple-style aesthetic',
        placementZone: { x: 0.3, y: 0.2, width: 0.4, height: 0.6 },
        aspectRatios: ['16:9', '1:1'],
      },
    ],
    in_use: [
      {
        id: 'electronics_desk_setup',
        name: 'Desk Setup',
        thumbnail: '/templates/electronics/desk.jpg',
        prompt: 'Tech lifestyle photography, {product} on modern desk setup, minimalist workspace, natural lighting, productivity aesthetic',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['16:9', '4:3'],
      },
      {
        id: 'electronics_hands_using',
        name: 'Hands Using',
        thumbnail: '/templates/electronics/hands.jpg',
        prompt: 'Tech product in use, hands using {product}, clean background, focus on product interaction, lifestyle tech photography',
        placementZone: { x: 0.25, y: 0.25, width: 0.5, height: 0.5 },
        aspectRatios: ['1:1', '4:5'],
      },
    ],
    studio: [
      {
        id: 'electronics_studio_minimal',
        name: 'Minimal Studio',
        thumbnail: '/templates/electronics/studio.jpg',
        prompt: 'Tech product studio shot, {product} on clean white background, perfect lighting, all details visible, e-commerce ready',
        placementZone: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
        aspectRatios: ['1:1', '4:3'],
      },
    ],
  },

  general: {
    studio: [
      {
        id: 'general_studio_white',
        name: 'White Background',
        thumbnail: '/templates/general/studio_white.jpg',
        prompt: 'Professional product photography, {product} on clean white background, soft shadows, e-commerce quality, sharp focus',
        placementZone: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
        aspectRatios: ['1:1', '4:3', '3:4'],
      },
      {
        id: 'general_studio_warm',
        name: 'Warm Studio',
        thumbnail: '/templates/general/studio_warm.jpg',
        prompt: 'Product photography, {product} on warm beige background, soft natural lighting, premium feel, marketplace ready',
        placementZone: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
        aspectRatios: ['1:1', '4:3'],
      },
    ],
    contextual: [
      {
        id: 'general_lifestyle_table',
        name: 'Table Top',
        thumbnail: '/templates/general/table.jpg',
        prompt: 'Lifestyle product photography, {product} on styled wooden table, natural lighting, cozy atmosphere, lifestyle aesthetic',
        placementZone: { x: 0.3, y: 0.3, width: 0.4, height: 0.4 },
        aspectRatios: ['1:1', '4:5'],
      },
    ],
  },
};

// Seasonal Templates
export const SEASONAL_TEMPLATES = {
  christmas: {
    id: 'christmas',
    name: 'Christmas',
    icon: '🎄',
    templates: [
      {
        id: 'christmas_cozy',
        name: 'Cozy Christmas',
        prompt: 'Christmas product photography, {product} with cozy holiday decorations, warm string lights, red and gold accents, festive atmosphere',
        aspectRatios: ['1:1', '4:5'],
      },
      {
        id: 'christmas_elegant',
        name: 'Elegant Holiday',
        prompt: 'Elegant holiday photography, {product} with sophisticated Christmas styling, white and silver palette, premium gift aesthetic',
        aspectRatios: ['1:1', '16:9'],
      },
    ],
  },
  valentines: {
    id: 'valentines',
    name: "Valentine's Day",
    icon: '💕',
    templates: [
      {
        id: 'valentines_romantic',
        name: 'Romantic',
        prompt: "Valentine's product photography, {product} with romantic styling, red roses, soft pink tones, love and gift aesthetic",
        aspectRatios: ['1:1', '4:5'],
      },
    ],
  },
  summer: {
    id: 'summer',
    name: 'Summer',
    icon: '☀️',
    templates: [
      {
        id: 'summer_beach',
        name: 'Beach Vibes',
        prompt: 'Summer product photography, {product} with beach aesthetic, sandy textures, bright sunshine, vacation mood',
        aspectRatios: ['1:1', '9:16'],
      },
      {
        id: 'summer_poolside',
        name: 'Poolside',
        prompt: 'Summer lifestyle photography, {product} poolside setting, turquoise water, tropical vibes, refreshing aesthetic',
        aspectRatios: ['1:1', '4:5'],
      },
    ],
  },
  halloween: {
    id: 'halloween',
    name: 'Halloween',
    icon: '🎃',
    templates: [
      {
        id: 'halloween_spooky',
        name: 'Spooky',
        prompt: 'Halloween product photography, {product} with spooky decorations, orange and black palette, pumpkins and cobwebs',
        aspectRatios: ['1:1'],
      },
    ],
  },
  black_friday: {
    id: 'black_friday',
    name: 'Black Friday',
    icon: '🏷️',
    templates: [
      {
        id: 'black_friday_deal',
        name: 'Deal Alert',
        prompt: 'Black Friday sale photography, {product} with dramatic dark background, gold accents, premium sale aesthetic',
        aspectRatios: ['1:1', '16:9'],
      },
    ],
  },
};

// Helper function to get templates for a category
export function getTemplatesForCategory(categoryId) {
  return TEMPLATE_LIBRARY[categoryId] || TEMPLATE_LIBRARY.general;
}

// Helper function to get all templates of a specific type
export function getTemplatesByType(typeId) {
  const results = [];
  Object.entries(TEMPLATE_LIBRARY).forEach(([category, types]) => {
    if (types[typeId]) {
      results.push(...types[typeId].map(t => ({ ...t, category })));
    }
  });
  return results;
}

// Helper function to detect category from product description
export function detectCategory(productDescription) {
  const desc = productDescription.toLowerCase();

  const keywords = {
    fashion: ['shirt', 'dress', 'pants', 'jacket', 'shoes', 'bag', 'hat', 'scarf', 'jewelry', 'watch', 'ring', 'necklace', 'bracelet', 'earring', 'clothing', 'apparel', 'fashion', 'wear'],
    beauty: ['makeup', 'cosmetic', 'skincare', 'serum', 'cream', 'lipstick', 'mascara', 'foundation', 'perfume', 'beauty', 'lotion', 'shampoo', 'conditioner', 'nail', 'hair'],
    home: ['furniture', 'chair', 'table', 'lamp', 'decor', 'pillow', 'blanket', 'rug', 'vase', 'candle', 'kitchen', 'home', 'living', 'bedroom', 'bathroom'],
    consumables: ['food', 'drink', 'beverage', 'snack', 'coffee', 'tea', 'chocolate', 'supplement', 'vitamin', 'protein', 'organic', 'natural'],
    electronics: ['phone', 'laptop', 'tablet', 'headphone', 'speaker', 'charger', 'cable', 'tech', 'gadget', 'electronic', 'device', 'smart', 'wireless'],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some(word => desc.includes(word))) {
      return category;
    }
  }

  return 'general';
}

// Helper function to build final prompt from template
export function buildPromptFromTemplate(template, productName, businessDNA = null) {
  let prompt = template.prompt.replace('{product}', productName);

  // Add business DNA styling if available
  if (businessDNA) {
    const brandContext = [];

    if (businessDNA.brandTone?.length > 0) {
      brandContext.push(`Brand tone: ${businessDNA.brandTone.join(', ')}`);
    }
    if (businessDNA.brandAesthetic?.length > 0) {
      brandContext.push(`Visual aesthetic: ${businessDNA.brandAesthetic.join(', ')}`);
    }
    if (businessDNA.colors?.primary) {
      brandContext.push(`Primary brand color: ${businessDNA.colors.primary}`);
    }

    if (brandContext.length > 0) {
      prompt += `\n\nBRAND STYLING:\n${brandContext.join('\n')}`;
    }
  }

  return prompt;
}

export default {
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  TEMPLATE_LIBRARY,
  SEASONAL_TEMPLATES,
  ASPECT_RATIO_PRESETS,
  getTemplatesForCategory,
  getTemplatesByType,
  detectCategory,
  buildPromptFromTemplate,
};
