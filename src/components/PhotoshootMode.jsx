import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TemplateLibrary from './TemplateLibrary';
import BusinessDNA from './BusinessDNA';
import {
  VOLLA_COLORS,
  SHOT_TYPES,
  TEMPLATE_CATEGORIES,
  ASPECT_RATIO_PRESETS,
  SHOT_SUGGESTIONS,
  PROMPT_TEMPLATES,
  NL_REFINEMENTS,
  buildPromptFromTemplate,
  detectCategory,
} from '../config/templates';

/**
 * PhotoshootMode Component - Pomelli-Level Product Photography
 *
 * Features:
 * - 7 Shot Types: Studio, Floating, Ingredient, In-Use, Lifestyle, Seasonal, Platform
 * - Template-first workflow
 * - Business DNA integration
 * - Natural Language Editing
 * - Auto shot suggestions
 * - Volla coral/orange theme
 */

const PhotoshootMode = ({ onBack }) => {
  const { t } = useTranslation();

  // State
  const [step, setStep] = useState(1);
  const [productImage, setProductImage] = useState(null);
  const [productImagePreview, setProductImagePreview] = useState(null);
  const [productDescription, setProductDescription] = useState('');
  const [detectedCategory, setDetectedCategory] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [resolution, setResolution] = useState('2K');
  const [outputCount, setOutputCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  const [showBusinessDNA, setShowBusinessDNA] = useState(false);
  const [businessDNA, setBusinessDNA] = useState(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [refinementText, setRefinementText] = useState('');
  const [showNLEditor, setShowNLEditor] = useState(false);

  // Load Business DNA
  useEffect(() => {
    const savedDNA = localStorage.getItem('businessDNA');
    if (savedDNA) {
      try {
        setBusinessDNA(JSON.parse(savedDNA));
      } catch (e) {
        console.error('Failed to load Business DNA:', e);
      }
    }
  }, []);

  // Get suggested shots
  const suggestedShots = SHOT_SUGGESTIONS.getSuggestedShots(selectedCategory || 'general', businessDNA);

  // Handle image upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setProductImage(event.target.result);
      setProductImagePreview(event.target.result);
      const detected = detectCategory(file.name);
      setDetectedCategory(detected);
      setSelectedCategory(detected);
      setStep(2);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload({ target: { files: [file] } });
    }
  }, [handleImageUpload]);

  // Handle template selection
  const handleTemplateSelect = (templateData) => {
    setSelectedTemplate(templateData);
    setAspectRatio(templateData.aspectRatio);
    setCustomPrompt(templateData.prompt);
    setShowTemplateLibrary(false);
    setStep(4);
  };

  // Handle quick shot selection
  const handleQuickShotSelect = (shotType) => {
    const templates = Object.values(PROMPT_TEMPLATES).filter(t => t.shotType === shotType);
    if (templates.length > 0) {
      const template = templates[0];
      const prompt = buildPromptFromTemplate(
        template,
        productDescription || 'product',
        businessDNA
      );
      setSelectedTemplate({ template, shotType, prompt });
      setCustomPrompt(prompt);
      setStep(4);
    }
  };

  // Apply NL refinement
  const applyRefinement = () => {
    if (!refinementText.trim()) return;
    const refined = NL_REFINEMENTS.applyRefinement(customPrompt, refinementText);
    setCustomPrompt(refined);
    setRefinementText('');
    setShowNLEditor(false);
  };

  // Generate images
  const handleGenerate = async () => {
    if (!productImage || !customPrompt) return;

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      const results = [];
      for (let i = 0; i < outputCount; i++) {
        try {
          const response = await fetch('/api/generate-studio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: productImage,
              custom_prompt: customPrompt,
              aspect_ratio: aspectRatio,
              resolution: resolution,
              use_thinking: true,
              output_count: 1,
            }),
          });

          const data = await response.json();

          if (data.success && data.generated_image) {
            results.push({
              id: `gen_${Date.now()}_${i}`,
              url: data.generated_image,
              template: selectedTemplate?.template?.name || 'Custom',
              aspectRatio: aspectRatio,
            });
            setGeneratedImages([...results]);
          }
        } catch (err) {
          console.error(`Generation ${i + 1} failed:`, err);
        }
      }
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset
  const handleReset = () => {
    setStep(1);
    setProductImage(null);
    setProductImagePreview(null);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setGeneratedImages([]);
    setCustomPrompt('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-orange-50/30">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="w-10 h-10 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <span>←</span>
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: VOLLA_COLORS.gradient.primary }}>
                  <span className="text-white">📸</span>
                </div>
                Photoshoot Mode
              </h1>
              <p className="text-sm text-gray-500 flex items-center gap-2">
                Professional AI Photography
                <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 text-[9px] font-bold rounded animate-pulse">
                  VOLLA PRO
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowBusinessDNA(true)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all font-medium ${
                businessDNA
                  ? 'text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={businessDNA ? { background: VOLLA_COLORS.gradient.primary } : {}}
            >
              <span>🧬</span>
              {businessDNA ? businessDNA.brandName || 'Brand Set' : 'Set Brand'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100 px-6 py-3 sticky top-[72px] z-30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: 'Upload', icon: '📤' },
              { num: 2, label: 'Category', icon: '📦' },
              { num: 3, label: 'Template', icon: '🎨' },
              { num: 4, label: 'Generate', icon: '✨' },
            ].map((s, i) => (
              <React.Fragment key={s.num}>
                <div
                  className={`flex items-center gap-2 cursor-pointer ${
                    step >= s.num ? '' : 'opacity-50'
                  }`}
                  onClick={() => step > s.num && setStep(s.num)}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                      step >= s.num ? 'text-white shadow-md' : 'bg-gray-200 text-gray-400'
                    }`}
                    style={step >= s.num ? { background: VOLLA_COLORS.gradient.primary } : {}}
                  >
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className={`font-medium hidden sm:block ${step >= s.num ? 'text-gray-800' : 'text-gray-400'}`}>
                    {s.label}
                  </span>
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 rounded-full ${
                      step > s.num ? '' : 'bg-gray-200'
                    }`}
                    style={step > s.num ? { background: VOLLA_COLORS.primary } : {}}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Step 1: Upload */}
        {step === 1 && (
          <div className="max-w-2xl mx-auto">
            <div
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-orange-400 transition-colors cursor-pointer bg-white shadow-sm"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => document.getElementById('product-upload').click()}
            >
              <input
                id="product-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="w-20 h-20 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: VOLLA_COLORS.gradient.primary }}>
                <span className="text-4xl">📸</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Your Product</h3>
              <p className="text-gray-500 mb-4">
                Drag and drop or click to upload
              </p>
              <p className="text-sm text-gray-400">
                PNG, JPG, WEBP up to 10MB
              </p>
            </div>

            {/* Shot Type Preview */}
            <div className="mt-8">
              <h4 className="text-sm font-semibold text-gray-600 mb-4">Available Shot Types</h4>
              <div className="grid grid-cols-4 gap-3">
                {Object.values(SHOT_TYPES).slice(0, 8).map(shot => (
                  <div
                    key={shot.id}
                    className="p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-all text-center"
                  >
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-2 flex items-center justify-center bg-gradient-to-br ${shot.gradient}`}>
                      <span className="text-2xl text-white">{shot.emoji}</span>
                    </div>
                    <div className="text-sm font-medium text-gray-700">{shot.name}</div>
                    {shot.isVollaExclusive && (
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-bold rounded">
                        VOLLA
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Category Selection */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 gap-8">
              {/* Product Preview */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-600 mb-4">Your Product</h3>
                {productImagePreview && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100 mb-4">
                    <img
                      src={productImagePreview}
                      alt="Product"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <input
                  type="text"
                  value={productDescription}
                  onChange={(e) => {
                    setProductDescription(e.target.value);
                    const detected = detectCategory(e.target.value);
                    setDetectedCategory(detected);
                    if (!selectedCategory) setSelectedCategory(detected);
                  }}
                  placeholder="Describe your product..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none transition-all"
                />
              </div>

              {/* Category Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-600 mb-4">
                  Product Category
                  {detectedCategory && (
                    <span className="text-sm ml-2" style={{ color: VOLLA_COLORS.primary }}>
                      (Detected: {TEMPLATE_CATEGORIES[detectedCategory]?.name})
                    </span>
                  )}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.values(TEMPLATE_CATEGORIES).map(category => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`p-4 rounded-xl text-left transition-all ${
                        selectedCategory === category.id
                          ? 'text-white ring-2 ring-offset-2 shadow-lg'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      style={selectedCategory === category.id
                        ? { background: VOLLA_COLORS.gradient.primary, ringColor: VOLLA_COLORS.primary }
                        : {}
                      }
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="font-medium">{category.name}</div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedCategory}
                  className="w-full mt-6 py-3 text-white rounded-xl font-medium transition-all disabled:bg-gray-300 shadow-md hover:shadow-lg"
                  style={selectedCategory ? { background: VOLLA_COLORS.gradient.primary } : {}}
                >
                  Continue to Templates →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Template Selection */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto">
            {/* Quick Shot Suggestions */}
            <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
              <h3 className="font-medium text-gray-800 mb-4 flex items-center gap-2">
                <span>⚡</span>
                Quick Select - Suggested Shots
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {suggestedShots.slice(0, 6).map((shot, i) => {
                  const shotType = SHOT_TYPES[shot.shotType];
                  return (
                    <button
                      key={shot.type}
                      onClick={() => handleQuickShotSelect(shot.shotType)}
                      className="p-4 rounded-xl border-2 border-gray-100 hover:border-orange-200 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center bg-gradient-to-br ${shotType?.gradient}`}>
                          <span className="text-xl text-white">{shotType?.emoji}</span>
                        </div>
                        <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-sm flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-600">
                          {i + 1}
                        </span>
                      </div>
                      <div className="font-medium text-gray-800">{shot.name}</div>
                      <div className="text-xs text-gray-400">{shot.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full Library Button */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-800">Full Template Library</h3>
                  <p className="text-sm text-gray-500">
                    Browse all templates with advanced filters
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="px-6 py-3 text-white rounded-xl font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2"
                  style={{ background: VOLLA_COLORS.gradient.primary }}
                >
                  <span>🎨</span>
                  Open Library
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 4 && (
          <div className="grid grid-cols-3 gap-8">
            {/* Left Panel */}
            <div className="space-y-6">
              {/* Product Preview */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Product</h4>
                {productImagePreview && (
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img src={productImagePreview} alt="Product" className="w-full h-full object-contain" />
                  </div>
                )}
              </div>

              {/* Template Info */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Shot Type</h4>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${
                    SHOT_TYPES[selectedTemplate?.shotType]?.gradient || 'from-gray-200 to-gray-300'
                  }`}>
                    <span className="text-xl text-white">
                      {SHOT_TYPES[selectedTemplate?.shotType]?.emoji || '📸'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">
                      {selectedTemplate?.template?.name || SHOT_TYPES[selectedTemplate?.shotType]?.name || 'Custom'}
                    </div>
                    <div className="text-sm text-gray-400">
                      {SHOT_TYPES[selectedTemplate?.shotType]?.name || 'Studio'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-3 py-2 text-orange-600 hover:bg-orange-50 rounded-lg text-sm transition-colors"
                >
                  Change Template
                </button>
              </div>

              {/* Natural Language Editor */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-medium text-gray-500">Prompt Refinement</h4>
                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[10px] font-bold rounded">
                    VOLLA EXCLUSIVE
                  </span>
                </div>

                {showNLEditor ? (
                  <div className="space-y-3">
                    <textarea
                      value={refinementText}
                      onChange={(e) => setRefinementText(e.target.value)}
                      placeholder="e.g., 'make it warmer', 'more dramatic lighting', 'add luxury feel'..."
                      className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm resize-none h-20 focus:ring-2 focus:ring-orange-200 focus:border-orange-400 outline-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={applyRefinement}
                        className="flex-1 py-2 text-white rounded-lg text-sm font-medium"
                        style={{ background: VOLLA_COLORS.gradient.primary }}
                      >
                        Apply
                      </button>
                      <button
                        onClick={() => setShowNLEditor(false)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['warmer', 'cooler', 'dramatic', 'minimal', 'luxurious'].map(tag => (
                        <button
                          key={tag}
                          onClick={() => setRefinementText(tag)}
                          className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded text-xs"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowNLEditor(true)}
                    className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-gray-500 hover:border-orange-300 hover:text-orange-600 transition-all text-sm"
                  >
                    ✨ Refine with natural language
                  </button>
                )}
              </div>

              {/* Settings */}
              <div className="bg-white rounded-2xl p-4 shadow-sm space-y-4">
                <h4 className="text-sm font-medium text-gray-500">Settings</h4>

                {/* Aspect Ratio */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Aspect Ratio</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1:1', '4:5', '9:16'].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          aspectRatio === ratio ? 'text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={aspectRatio === ratio ? { background: VOLLA_COLORS.gradient.primary } : {}}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Resolution</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['1K', '2K', '4K'].map(res => (
                      <button
                        key={res}
                        onClick={() => setResolution(res)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          resolution === res ? 'text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={resolution === res ? { background: VOLLA_COLORS.gradient.primary } : {}}
                      >
                        {res}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Output Count */}
                <div>
                  <label className="block text-xs text-gray-400 mb-2">Output Count</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[1, 2, 4, 8].map(count => (
                      <button
                        key={count}
                        onClick={() => setOutputCount(count)}
                        className={`py-2 rounded-lg text-sm font-medium transition-all ${
                          outputCount === count ? 'text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                        style={outputCount === count ? { background: VOLLA_COLORS.gradient.primary } : {}}
                      >
                        {count}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 text-white rounded-xl font-bold transition-all disabled:from-gray-400 disabled:to-gray-500 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                style={{ background: isGenerating ? '#9CA3AF' : VOLLA_COLORS.gradient.primary }}
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating {generatedImages.length}/{outputCount}...
                  </>
                ) : (
                  <>
                    <span>✨</span>
                    Generate {outputCount} Image{outputCount > 1 ? 's' : ''}
                  </>
                )}
              </button>
            </div>

            {/* Right Panel - Generated Images */}
            <div className="col-span-2">
              <div className="bg-white rounded-2xl p-6 shadow-sm min-h-[600px]">
                <h3 className="font-medium text-gray-800 mb-4">Generated Images</h3>

                {generatedImages.length > 0 ? (
                  <div className="grid grid-cols-2 gap-4">
                    {generatedImages.map((img, i) => (
                      <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={img.url}
                          alt={`Generated ${i + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex gap-2">
                            <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-100">📥</button>
                            <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-100">🔍</button>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs">
                          {img.template} • {img.aspectRatio}
                        </div>
                      </div>
                    ))}

                    {isGenerating && Array.from({ length: outputCount - generatedImages.length }).map((_, i) => (
                      <div key={`placeholder-${i}`} className="aspect-square rounded-xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 animate-pulse flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" style={{ animation: 'shimmer 1.5s infinite' }}></div>
                        <span className="text-3xl mb-2 animate-bounce">✨</span>
                        <span className="text-gray-500 text-sm font-medium">Creating magic...</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-4"
                      style={{ background: `linear-gradient(135deg, #FEF3F0 0%, #FFF7ED 100%)` }}>
                      <span className="text-4xl">✨</span>
                    </div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Ready to Generate</h4>
                    <p className="text-gray-500 max-w-sm">
                      Click generate to create {outputCount} professional product images
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Template Library Modal */}
      {showTemplateLibrary && (
        <TemplateLibrary
          onSelect={handleTemplateSelect}
          onClose={() => setShowTemplateLibrary(false)}
          productDescription={productDescription}
          businessDNA={businessDNA}
          initialCategory={selectedCategory}
        />
      )}

      {/* Business DNA Modal */}
      {showBusinessDNA && (
        <BusinessDNA
          onClose={() => setShowBusinessDNA(false)}
          onSave={(dna) => {
            setBusinessDNA(dna);
            setShowBusinessDNA(false);
          }}
          existingDNA={businessDNA}
        />
      )}
    </div>
  );
};

export default PhotoshootMode;
