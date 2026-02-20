import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * BusinessDNA Component - Brand Identity Management
 *
 * Features:
 * - Website URL input for automatic brand extraction
 * - Manual brand configuration
 * - Color palette management
 * - Logo upload/URL
 * - Brand tone & values selection
 * - Template style preferences
 */

const BusinessDNA = ({ onClose, onSave, existingDNA = null }) => {
  const { t } = useTranslation();

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('auto'); // 'auto' or 'manual'
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [analysisError, setAnalysisError] = useState('');

  // Business DNA State
  const [dna, setDna] = useState({
    brandName: '',
    tagline: '',
    description: '',
    websiteUrl: '',

    // Colors
    colors: {
      primary: '#0066CC',
      secondary: '#333333',
      accent: '#FF6B00',
      background: '#FFFFFF',
      text: '#333333'
    },

    // Logo
    logoUrl: '',
    logoFile: null,

    // Brand Personality
    brandTone: [],
    brandValues: [],
    brandAesthetic: [],
    targetAudience: '',

    // Products
    productImages: [],

    // Template preferences
    suggestedTemplateStyles: [],

    // Timestamps
    createdAt: null,
    updatedAt: null
  });

  // Load existing DNA if provided
  useEffect(() => {
    if (existingDNA) {
      setDna(existingDNA);
    }
  }, [existingDNA]);

  // Available options for brand characteristics
  const toneOptions = [
    { id: 'professional', label: 'Professional', icon: '👔' },
    { id: 'playful', label: 'Playful', icon: '🎉' },
    { id: 'luxury', label: 'Luxury', icon: '💎' },
    { id: 'minimalist', label: 'Minimalist', icon: '◻️' },
    { id: 'bold', label: 'Bold', icon: '💪' },
    { id: 'friendly', label: 'Friendly', icon: '😊' },
    { id: 'innovative', label: 'Innovative', icon: '💡' },
    { id: 'traditional', label: 'Traditional', icon: '🏛️' },
    { id: 'youthful', label: 'Youthful', icon: '✨' },
    { id: 'sophisticated', label: 'Sophisticated', icon: '🎩' },
    { id: 'trustworthy', label: 'Trustworthy', icon: '🤝' },
    { id: 'energetic', label: 'Energetic', icon: '⚡' },
  ];

  const valueOptions = [
    { id: 'quality', label: 'Quality', icon: '⭐' },
    { id: 'innovation', label: 'Innovation', icon: '🚀' },
    { id: 'sustainability', label: 'Sustainability', icon: '🌿' },
    { id: 'affordability', label: 'Affordability', icon: '💰' },
    { id: 'craftsmanship', label: 'Craftsmanship', icon: '🔨' },
    { id: 'customer-focus', label: 'Customer Focus', icon: '❤️' },
    { id: 'authenticity', label: 'Authenticity', icon: '✓' },
    { id: 'creativity', label: 'Creativity', icon: '🎨' },
    { id: 'reliability', label: 'Reliability', icon: '🛡️' },
    { id: 'excellence', label: 'Excellence', icon: '🏆' },
  ];

  const aestheticOptions = [
    { id: 'modern', label: 'Modern', icon: '🔷' },
    { id: 'classic', label: 'Classic', icon: '📜' },
    { id: 'minimal', label: 'Minimal', icon: '○' },
    { id: 'bold', label: 'Bold', icon: '■' },
    { id: 'elegant', label: 'Elegant', icon: '✧' },
    { id: 'rustic', label: 'Rustic', icon: '🪵' },
    { id: 'futuristic', label: 'Futuristic', icon: '🔮' },
    { id: 'organic', label: 'Organic', icon: '🍃' },
    { id: 'industrial', label: 'Industrial', icon: '⚙️' },
    { id: 'artistic', label: 'Artistic', icon: '🖼️' },
  ];

  // Analyze website
  const analyzeWebsite = async () => {
    if (!websiteUrl) {
      setAnalysisError('Please enter a website URL');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError('');

    try {
      const response = await fetch('/api/business-dna-analyzer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: websiteUrl })
      });

      const data = await response.json();

      if (data.success) {
        setDna(prev => ({
          ...prev,
          brandName: data.brandName || prev.brandName,
          tagline: data.tagline || prev.tagline,
          description: data.description || prev.description,
          websiteUrl: data.websiteUrl || websiteUrl,
          colors: data.colors || prev.colors,
          logoUrl: data.logoUrl || prev.logoUrl,
          brandTone: data.brandTone || prev.brandTone,
          brandValues: data.brandValues || prev.brandValues,
          brandAesthetic: data.brandAesthetic || prev.brandAesthetic,
          targetAudience: data.targetAudience || prev.targetAudience,
          productImages: data.productImages || prev.productImages,
          suggestedTemplateStyles: data.suggestedTemplateStyles || prev.suggestedTemplateStyles,
        }));
        setActiveTab('manual'); // Switch to manual for review/edit
      } else {
        setAnalysisError(data.error || 'Failed to analyze website');
      }
    } catch (error) {
      setAnalysisError(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Toggle selection in array
  const toggleSelection = (field, value) => {
    setDna(prev => {
      const current = prev[field] || [];
      const newValue = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value].slice(0, 3); // Max 3 selections
      return { ...prev, [field]: newValue };
    });
  };

  // Update color
  const updateColor = (key, value) => {
    setDna(prev => ({
      ...prev,
      colors: { ...prev.colors, [key]: value }
    }));
  };

  // Handle save
  const handleSave = () => {
    const finalDna = {
      ...dna,
      updatedAt: new Date().toISOString(),
      createdAt: dna.createdAt || new Date().toISOString()
    };

    // Save to localStorage
    localStorage.setItem('businessDNA', JSON.stringify(finalDna));

    if (onSave) {
      onSave(finalDna);
    }
    if (onClose) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🧬</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Business DNA</h2>
              <p className="text-sm text-gray-500">Define your brand identity for consistent creatives</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 py-3 border-b border-gray-100 flex gap-2">
          <button
            onClick={() => setActiveTab('auto')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'auto'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            🔍 Auto-Detect
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              activeTab === 'manual'
                ? 'bg-purple-500 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            ✏️ Manual Setup
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* Auto-Detect Tab */}
          {activeTab === 'auto' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-800 mb-2">🌐 Website Analysis</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter your website URL and we'll automatically extract your brand colors, logo, tone, and more.
                </p>

                <div className="flex gap-3">
                  <input
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://your-website.com"
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 outline-none transition-all"
                  />
                  <button
                    onClick={analyzeWebsite}
                    disabled={isAnalyzing}
                    className="px-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-purple-300 text-white rounded-xl font-medium transition-all flex items-center gap-2"
                  >
                    {isAnalyzing ? (
                      <>
                        <span className="animate-spin">⏳</span>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <span>🔍</span>
                        Analyze
                      </>
                    )}
                  </button>
                </div>

                {analysisError && (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {analysisError}
                  </div>
                )}
              </div>

              <div className="text-center text-gray-400 py-4">
                — or —
              </div>

              <button
                onClick={() => setActiveTab('manual')}
                className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-400 hover:text-purple-500 transition-all"
              >
                ✏️ Set up manually without website analysis
              </button>
            </div>
          )}

          {/* Manual Setup Tab */}
          {activeTab === 'manual' && (
            <div className="space-y-8">

              {/* Basic Info */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">1</span>
                  Brand Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Brand Name</label>
                    <input
                      type="text"
                      value={dna.brandName}
                      onChange={(e) => setDna(prev => ({ ...prev, brandName: e.target.value }))}
                      placeholder="Your Brand Name"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">Website</label>
                    <input
                      type="url"
                      value={dna.websiteUrl}
                      onChange={(e) => setDna(prev => ({ ...prev, websiteUrl: e.target.value }))}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-600 mb-1">Tagline</label>
                    <input
                      type="text"
                      value={dna.tagline}
                      onChange={(e) => setDna(prev => ({ ...prev, tagline: e.target.value }))}
                      placeholder="Your brand tagline or slogan"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Colors */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">2</span>
                  Brand Colors
                </h3>
                <div className="grid grid-cols-5 gap-4">
                  {Object.entries(dna.colors).filter(([key]) => key !== 'all_colors').map(([key, value]) => (
                    <div key={key} className="text-center">
                      <label className="block text-xs font-medium text-gray-500 mb-2 capitalize">{key}</label>
                      <div className="relative">
                        <input
                          type="color"
                          value={value}
                          onChange={(e) => updateColor(key, e.target.value)}
                          className="w-full h-12 rounded-lg cursor-pointer border-2 border-gray-200"
                        />
                        <span className="block text-xs text-gray-400 mt-1">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Logo */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">3</span>
                  Logo
                </h3>
                <div className="flex items-center gap-4">
                  {dna.logoUrl && (
                    <div className="w-20 h-20 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                      <img src={dna.logoUrl} alt="Logo" className="max-w-full max-h-full object-contain" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="url"
                      value={dna.logoUrl}
                      onChange={(e) => setDna(prev => ({ ...prev, logoUrl: e.target.value }))}
                      placeholder="Logo URL (https://...)"
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none"
                    />
                  </div>
                </div>
              </section>

              {/* Brand Tone */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">4</span>
                  Brand Tone
                  <span className="text-xs text-gray-400 font-normal">(Select up to 3)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {toneOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleSelection('brandTone', option.id)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        dna.brandTone.includes(option.id)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Brand Values */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">5</span>
                  Brand Values
                  <span className="text-xs text-gray-400 font-normal">(Select up to 3)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {valueOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleSelection('brandValues', option.id)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        dna.brandValues.includes(option.id)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Brand Aesthetic */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">6</span>
                  Visual Aesthetic
                  <span className="text-xs text-gray-400 font-normal">(Select up to 3)</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {aestheticOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => toggleSelection('brandAesthetic', option.id)}
                      className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
                        dna.brandAesthetic.includes(option.id)
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <span>{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </section>

              {/* Target Audience */}
              <section>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center text-sm">7</span>
                  Target Audience
                </h3>
                <input
                  type="text"
                  value={dna.targetAudience}
                  onChange={(e) => setDna(prev => ({ ...prev, targetAudience: e.target.value }))}
                  placeholder="e.g., Young professionals aged 25-35, fashion-conscious women, small business owners"
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-purple-500 outline-none"
                />
              </section>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-all flex items-center gap-2"
          >
            <span>💾</span>
            Save Business DNA
          </button>
        </div>

      </div>
    </div>
  );
};

export default BusinessDNA;
