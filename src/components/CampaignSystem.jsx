import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * CampaignSystem Component - AI-Powered Marketing Suite
 *
 * Features:
 * - AI-generated campaign ideas based on Business DNA
 * - Seasonal and trending campaign suggestions
 * - Creative brief generator
 * - Copy and CTA suggestions
 * - Multi-platform optimization (Instagram, Facebook, Pinterest, etc.)
 */

// Campaign Types
const CAMPAIGN_TYPES = {
  seasonal: {
    id: 'seasonal',
    name: 'Seasonal',
    icon: '📅',
    description: 'Holiday and seasonal campaigns',
  },
  product_launch: {
    id: 'product_launch',
    name: 'Product Launch',
    icon: '🚀',
    description: 'New product announcements',
  },
  sale: {
    id: 'sale',
    name: 'Sale & Promo',
    icon: '🏷️',
    description: 'Discounts and promotions',
  },
  brand_awareness: {
    id: 'brand_awareness',
    name: 'Brand Awareness',
    icon: '💡',
    description: 'Build brand recognition',
  },
  engagement: {
    id: 'engagement',
    name: 'Engagement',
    icon: '💬',
    description: 'Drive interactions and community',
  },
  ugc: {
    id: 'ugc',
    name: 'User Generated',
    icon: '📸',
    description: 'Encourage customer content',
  },
};

// Platforms
const PLATFORMS = {
  instagram: { id: 'instagram', name: 'Instagram', icon: '📷', formats: ['Feed', 'Story', 'Reel'] },
  facebook: { id: 'facebook', name: 'Facebook', icon: '👍', formats: ['Feed', 'Story', 'Ad'] },
  pinterest: { id: 'pinterest', name: 'Pinterest', icon: '📌', formats: ['Pin', 'Idea Pin'] },
  tiktok: { id: 'tiktok', name: 'TikTok', icon: '🎵', formats: ['Video', 'Live'] },
  etsy: { id: 'etsy', name: 'Etsy', icon: '🛒', formats: ['Listing', 'Banner'] },
  amazon: { id: 'amazon', name: 'Amazon', icon: '📦', formats: ['A+ Content', 'Storefront'] },
};

// Sample AI-generated campaign ideas
const SAMPLE_CAMPAIGN_IDEAS = [
  {
    id: 'spring_refresh',
    type: 'seasonal',
    name: 'Spring Refresh Collection',
    description: 'Showcase products with fresh spring aesthetics - pastels, florals, and renewal themes.',
    platforms: ['instagram', 'pinterest'],
    suggestedHashtags: ['#SpringVibes', '#NewSeason', '#FreshStart'],
    copyIdeas: [
      'Fresh looks for a fresh season 🌸',
      'Spring into style with our new collection',
      'Bloom where you are planted 🌷'
    ],
    ctaOptions: ['Shop Spring Collection', 'Explore New Arrivals', 'Get the Look'],
    visualStyle: 'Light, airy, pastel colors with natural elements',
    bestTime: 'March - May',
  },
  {
    id: 'flash_sale',
    type: 'sale',
    name: '48-Hour Flash Sale',
    description: 'Create urgency with limited-time offers and countdown timers.',
    platforms: ['instagram', 'facebook', 'etsy'],
    suggestedHashtags: ['#FlashSale', '#LimitedTime', '#DealAlert'],
    copyIdeas: [
      '⏰ 48 HOURS ONLY! Dont miss out',
      'The clock is ticking... Sale ends soon!',
      'Your wishlist is calling 📞 50% OFF'
    ],
    ctaOptions: ['Shop Now', 'Grab the Deal', 'Limited Stock'],
    visualStyle: 'Bold, urgent, countdown timers, red/orange accents',
    bestTime: 'Any time, best mid-week',
  },
  {
    id: 'behind_scenes',
    type: 'brand_awareness',
    name: 'Behind the Scenes',
    description: 'Show the human side of your brand with process and studio content.',
    platforms: ['instagram', 'tiktok'],
    suggestedHashtags: ['#BehindTheScenes', '#MakerLife', '#SmallBusinessLife'],
    copyIdeas: [
      'Ever wonder how its made? 👀',
      'A peek into our studio ✨',
      'Meet the hands behind the craft 🙌'
    ],
    ctaOptions: ['Follow for More', 'Join Our Journey', 'Learn More'],
    visualStyle: 'Authentic, candid, warm tones, real moments',
    bestTime: 'Weekdays, lunch time',
  },
  {
    id: 'customer_spotlight',
    type: 'ugc',
    name: 'Customer Spotlight',
    description: 'Feature real customers using your products for social proof.',
    platforms: ['instagram', 'facebook'],
    suggestedHashtags: ['#CustomerLove', '#RealPeople', '#ShareYourStyle'],
    copyIdeas: [
      'Our amazing customers 💕',
      'You styled it, you nailed it! 🎯',
      'Real people, real style ✨'
    ],
    ctaOptions: ['Share Your Photo', 'Tag Us', 'Get Featured'],
    visualStyle: 'User-generated, authentic, diverse',
    bestTime: 'Weekends',
  },
  {
    id: 'new_arrival',
    type: 'product_launch',
    name: 'New Arrival Announcement',
    description: 'Build anticipation and excitement for new products.',
    platforms: ['instagram', 'pinterest', 'etsy'],
    suggestedHashtags: ['#NewArrival', '#JustLanded', '#NewIn'],
    copyIdeas: [
      '🆕 JUST DROPPED: Your new favorite',
      'Introducing... something special ✨',
      'Ive been working on something... and its finally here!'
    ],
    ctaOptions: ['Shop New', 'Be First to Get It', 'See Whats New'],
    visualStyle: 'Clean, hero shots, spotlight on product',
    bestTime: 'Tuesday - Thursday mornings',
  },
];

const CampaignSystem = ({ onClose, businessDNA = null, onSelectCampaign }) => {
  const { t } = useTranslation();

  const [selectedType, setSelectedType] = useState(null);
  const [selectedPlatforms, setSelectedPlatforms] = useState([]);
  const [generatedIdeas, setGeneratedIdeas] = useState([]);
  const [expandedIdea, setExpandedIdea] = useState(null);
  const [customGoal, setCustomGoal] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Filter ideas based on selection
  useEffect(() => {
    let filtered = [...SAMPLE_CAMPAIGN_IDEAS];

    if (selectedType) {
      filtered = filtered.filter(idea => idea.type === selectedType);
    }

    if (selectedPlatforms.length > 0) {
      filtered = filtered.filter(idea =>
        idea.platforms.some(p => selectedPlatforms.includes(p))
      );
    }

    setGeneratedIdeas(filtered);
  }, [selectedType, selectedPlatforms]);

  // Toggle platform selection
  const togglePlatform = (platformId) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  // Generate AI campaign ideas (simulated)
  const generateAIIdeas = async () => {
    setIsGenerating(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));

    // In real implementation, this would call the AI to generate ideas based on:
    // - Business DNA
    // - Selected type
    // - Selected platforms
    // - Custom goal

    setIsGenerating(false);
  };

  // Use campaign idea
  const useCampaignIdea = (idea) => {
    if (onSelectCampaign) {
      onSelectCampaign(idea);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-orange-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center">
              <span className="text-xl">📣</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Campaign Ideas</h2>
              <p className="text-sm text-gray-500">AI-powered marketing campaign generator</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white shadow hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Sidebar - Filters */}
          <div className="w-72 border-r border-gray-100 overflow-y-auto p-4 bg-gray-50">

            {/* Business DNA Status */}
            {businessDNA ? (
              <div className="mb-6 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <span>🧬</span>
                  <span className="font-medium text-gray-800">{businessDNA.brandName || 'Your Brand'}</span>
                </div>
                <p className="text-xs text-gray-500">Ideas will be tailored to your brand</p>
              </div>
            ) : (
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-xl">
                <p className="text-sm text-yellow-700">
                  💡 Set up Business DNA for personalized campaign ideas
                </p>
              </div>
            )}

            {/* Campaign Type */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Campaign Type
              </h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                    !selectedType ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <span>🎯</span>
                  <span className="font-medium">All Types</span>
                </button>
                {Object.values(CAMPAIGN_TYPES).map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                      selectedType === type.id ? 'bg-white shadow text-gray-800' : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Platforms */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Platforms
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.values(PLATFORMS).map(platform => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`px-3 py-1.5 rounded-full text-sm flex items-center gap-1 transition-all ${
                      selectedPlatforms.includes(platform.id)
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span>{platform.icon}</span>
                    {platform.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Goal */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Custom Goal
              </h3>
              <textarea
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                placeholder="e.g., Increase summer sales, promote new collection, build email list..."
                className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-orange-500 outline-none text-sm resize-none h-20"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generateAIIdeas}
              disabled={isGenerating}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <span>✨</span>
                  Generate AI Ideas
                </>
              )}
            </button>

          </div>

          {/* Right Content - Campaign Ideas */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">
                {generatedIdeas.length} Campaign Ideas
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {generatedIdeas.map(idea => (
                <div
                  key={idea.id}
                  className={`bg-white rounded-xl border transition-all ${
                    expandedIdea === idea.id ? 'border-orange-300 shadow-lg' : 'border-gray-200 hover:shadow-md'
                  }`}
                >
                  {/* Card Header */}
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => setExpandedIdea(expandedIdea === idea.id ? null : idea.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl flex items-center justify-center">
                          <span className="text-xl">{CAMPAIGN_TYPES[idea.type]?.icon}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-800">{idea.name}</h4>
                          <p className="text-sm text-gray-500">{idea.description}</p>
                        </div>
                      </div>
                      <span className={`text-gray-400 transition-transform ${expandedIdea === idea.id ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>

                    {/* Platform badges */}
                    <div className="flex gap-1 mt-3">
                      {idea.platforms.map(p => (
                        <span key={p} className="text-xs px-2 py-0.5 bg-gray-100 rounded-full">
                          {PLATFORMS[p]?.icon} {PLATFORMS[p]?.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {expandedIdea === idea.id && (
                    <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                      {/* Copy Ideas */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Copy Ideas</h5>
                        <div className="space-y-1">
                          {idea.copyIdeas.map((copy, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                              <span className="text-gray-400">💬</span>
                              "{copy}"
                              <button
                                onClick={() => navigator.clipboard.writeText(copy)}
                                className="ml-auto text-gray-400 hover:text-gray-600"
                              >
                                📋
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Hashtags */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Suggested Hashtags</h5>
                        <div className="flex flex-wrap gap-1">
                          {idea.suggestedHashtags.map(tag => (
                            <span key={tag} className="text-sm px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* CTA Options */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">CTA Options</h5>
                        <div className="flex flex-wrap gap-2">
                          {idea.ctaOptions.map(cta => (
                            <span key={cta} className="text-sm px-3 py-1 bg-orange-100 text-orange-600 rounded-full">
                              {cta}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Visual Style */}
                      <div>
                        <h5 className="text-xs font-semibold text-gray-400 uppercase mb-2">Visual Style</h5>
                        <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                          🎨 {idea.visualStyle}
                        </p>
                      </div>

                      {/* Best Time */}
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="text-xs font-semibold text-gray-400 uppercase mb-1">Best Time</h5>
                          <p className="text-sm text-gray-600">⏰ {idea.bestTime}</p>
                        </div>
                        <button
                          onClick={() => useCampaignIdea(idea)}
                          className="px-4 py-2 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-xl font-medium hover:from-orange-600 hover:to-pink-600 transition-all"
                        >
                          Use This Campaign
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {generatedIdeas.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <p className="text-gray-500">No campaigns match your filters</p>
                <button
                  onClick={() => {
                    setSelectedType(null);
                    setSelectedPlatforms([]);
                  }}
                  className="mt-3 text-orange-500 hover:text-orange-600"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <p className="text-sm text-gray-500">
            💡 Pro tip: Connect your Business DNA for personalized campaign suggestions
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default CampaignSystem;
