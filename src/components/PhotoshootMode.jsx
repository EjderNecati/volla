import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import TemplateLibrary from './TemplateLibrary';
import BusinessDNA from './BusinessDNA';
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  ASPECT_RATIO_PRESETS,
  detectCategory,
  buildPromptFromTemplate,
} from '../config/templates';

/**
 * PhotoshootMode Component - Template-First Product Photography
 *
 * This is the main new feature that integrates:
 * - Business DNA (brand identity)
 * - Template System (category-based templates)
 * - Nano Banana Pro generation (thinking mode, 4K)
 *
 * Workflow:
 * 1. Upload product image
 * 2. Select/confirm product category
 * 3. Choose template from library
 * 4. Customize settings (aspect ratio, resolution, output count)
 * 5. Generate professional images
 */

const PhotoshootMode = ({ onBack }) => {
  const { t } = useTranslation();

  // State
  const [step, setStep] = useState(1); // 1: Upload, 2: Category, 3: Template, 4: Generate
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

  // Load Business DNA from localStorage
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

  // Handle image upload
  const handleImageUpload = useCallback((e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setProductImage(event.target.result);
      setProductImagePreview(event.target.result);

      // Auto-detect category based on file name (basic heuristic)
      const detected = detectCategory(file.name);
      setDetectedCategory(detected);
      setSelectedCategory(detected);

      // Move to next step
      setStep(2);
    };
    reader.readAsDataURL(file);
  }, []);

  // Handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const fakeEvent = { target: { files: [file] } };
      handleImageUpload(fakeEvent);
    }
  }, [handleImageUpload]);

  // Handle template selection
  const handleTemplateSelect = (templateData) => {
    setSelectedTemplate(templateData);
    setAspectRatio(templateData.aspectRatio);
    setShowTemplateLibrary(false);
    setStep(4); // Move to generate step
  };

  // Generate images
  const handleGenerate = async () => {
    if (!productImage || !selectedTemplate) return;

    setIsGenerating(true);
    setGeneratedImages([]);

    try {
      // Build the final prompt
      const finalPrompt = buildPromptFromTemplate(
        selectedTemplate.template,
        productDescription || 'product',
        businessDNA
      );

      // Generate images one by one
      const results = [];
      for (let i = 0; i < outputCount; i++) {
        try {
          const response = await fetch('/api/generate-studio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: productImage,
              custom_prompt: finalPrompt,
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
              template: selectedTemplate.template.name,
              aspectRatio: aspectRatio,
            });
            setGeneratedImages([...results]);
          }
        } catch (err) {
          console.error(`Generation ${i + 1} failed:`, err);
        }
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Reset and start over
  const handleReset = () => {
    setStep(1);
    setProductImage(null);
    setProductImagePreview(null);
    setSelectedCategory(null);
    setSelectedTemplate(null);
    setGeneratedImages([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
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
                <span className="text-2xl">📸</span>
                Photoshoot Mode
              </h1>
              <p className="text-sm text-gray-500">Template-first professional product photography</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Business DNA Button */}
            <button
              onClick={() => setShowBusinessDNA(true)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                businessDNA
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <span>🧬</span>
              {businessDNA ? businessDNA.brandName || 'Brand Set' : 'Set Brand'}
            </button>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-100 px-6 py-3">
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
                  className={`flex items-center gap-2 ${
                    step >= s.num ? 'text-purple-600' : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step >= s.num
                        ? 'bg-purple-500 text-white'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {step > s.num ? '✓' : s.num}
                  </div>
                  <span className="font-medium hidden sm:block">{s.label}</span>
                </div>
                {i < 3 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      step > s.num ? 'bg-purple-500' : 'bg-gray-200'
                    }`}
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
              className="border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center hover:border-purple-400 transition-colors cursor-pointer bg-white"
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
              <div className="text-6xl mb-4">📸</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">Upload Your Product</h3>
              <p className="text-gray-500 mb-4">
                Drag and drop or click to upload your product image
              </p>
              <p className="text-sm text-gray-400">
                Supports PNG, JPG, WEBP up to 10MB
              </p>
            </div>

            {/* Tips */}
            <div className="mt-6 bg-blue-50 rounded-xl p-4">
              <h4 className="font-medium text-blue-800 mb-2">📝 Tips for best results:</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Use a high-quality, clear image of your product</li>
                <li>• Plain or transparent background works best</li>
                <li>• Ensure good lighting and focus on the product</li>
                <li>• Include the full product without cropping</li>
              </ul>
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
                  <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                    <img
                      src={productImagePreview}
                      alt="Product"
                      className="w-full h-full object-contain"
                    />
                  </div>
                )}
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Product Description (optional)
                  </label>
                  <input
                    type="text"
                    value={productDescription}
                    onChange={(e) => {
                      setProductDescription(e.target.value);
                      const detected = detectCategory(e.target.value);
                      setDetectedCategory(detected);
                    }}
                    placeholder="e.g., Cotton T-shirt, Gold necklace, Coffee mug..."
                    className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              {/* Category Selection */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <h3 className="font-medium text-gray-600 mb-4">
                  Select Product Category
                  {detectedCategory && (
                    <span className="text-sm text-purple-500 ml-2">
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
                          ? 'bg-purple-500 text-white ring-2 ring-purple-300'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="text-2xl mb-2">{category.icon}</div>
                      <div className="font-medium">{category.name}</div>
                      <div className={`text-xs ${selectedCategory === category.id ? 'text-purple-200' : 'text-gray-400'}`}>
                        {category.description}
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setStep(3)}
                  disabled={!selectedCategory}
                  className="w-full mt-6 py-3 bg-purple-500 hover:bg-purple-600 disabled:bg-gray-300 text-white rounded-xl font-medium transition-colors"
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
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-medium text-gray-800">Choose a Template</h3>
                  <p className="text-sm text-gray-500">
                    Select from {TEMPLATE_CATEGORIES[selectedCategory]?.name} templates
                  </p>
                </div>
                <button
                  onClick={() => setShowTemplateLibrary(true)}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
                >
                  <span>🎨</span>
                  Open Template Library
                </button>
              </div>

              {selectedTemplate ? (
                <div className="bg-purple-50 rounded-xl p-4 flex items-center gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-xl flex items-center justify-center">
                    <span className="text-2xl">{TEMPLATE_TYPES[selectedTemplate.type]?.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{selectedTemplate.template.name}</div>
                    <div className="text-sm text-gray-500">
                      {TEMPLATE_TYPES[selectedTemplate.type]?.name} • {selectedTemplate.aspectRatio}
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTemplateLibrary(true)}
                    className="text-purple-500 hover:text-purple-600"
                  >
                    Change
                  </button>
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <div className="text-4xl mb-3">🎨</div>
                  <p className="text-gray-500">No template selected</p>
                  <button
                    onClick={() => setShowTemplateLibrary(true)}
                    className="mt-3 text-purple-500 hover:text-purple-600"
                  >
                    Browse Templates
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Generate */}
        {step === 4 && (
          <div className="grid grid-cols-3 gap-8">
            {/* Left Panel - Settings */}
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

              {/* Template */}
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Template</h4>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                    <span className="text-xl">{TEMPLATE_TYPES[selectedTemplate?.type]?.icon}</span>
                  </div>
                  <div>
                    <div className="font-medium text-gray-800">{selectedTemplate?.template.name}</div>
                    <div className="text-sm text-gray-400">{TEMPLATE_TYPES[selectedTemplate?.type]?.name}</div>
                  </div>
                </div>
                <button
                  onClick={() => setStep(3)}
                  className="w-full mt-3 py-2 text-purple-500 hover:bg-purple-50 rounded-lg text-sm transition-colors"
                >
                  Change Template
                </button>
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
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          aspectRatio === ratio
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
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
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          resolution === res
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
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
                        className={`py-2 rounded-lg text-sm font-medium transition-colors ${
                          outputCount === count
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
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
                className="w-full py-4 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 disabled:from-gray-400 disabled:to-gray-500 text-white rounded-xl font-bold transition-all flex items-center justify-center gap-2"
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
                            <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-100">
                              📥
                            </button>
                            <button className="p-2 bg-white rounded-lg shadow hover:bg-gray-100">
                              🔍
                            </button>
                          </div>
                        </div>
                        <div className="absolute bottom-2 left-2 right-2 bg-black/50 backdrop-blur-sm rounded-lg px-2 py-1 text-white text-xs">
                          {img.template} • {img.aspectRatio}
                        </div>
                      </div>
                    ))}

                    {/* Placeholders for remaining */}
                    {isGenerating && Array.from({ length: outputCount - generatedImages.length }).map((_, i) => (
                      <div key={`placeholder-${i}`} className="aspect-square rounded-xl bg-gray-100 animate-pulse flex items-center justify-center">
                        <span className="text-gray-400">Generating...</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="text-6xl mb-4">✨</div>
                    <h4 className="text-lg font-medium text-gray-800 mb-2">Ready to Generate</h4>
                    <p className="text-gray-500 max-w-sm">
                      Click the generate button to create {outputCount} professional product images using your selected template
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
