import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_TYPES,
  TEMPLATE_LIBRARY,
  SEASONAL_TEMPLATES,
  ASPECT_RATIO_PRESETS,
  getTemplatesForCategory,
  detectCategory,
  buildPromptFromTemplate,
} from '../config/templates';

/**
 * TemplateLibrary Component - Visual Template Selection
 *
 * Features:
 * - Category-based filtering (Fashion, Beauty, Home, etc.)
 * - Type-based filtering (Model Try On, Flatlay, Studio, etc.)
 * - Seasonal templates
 * - Aspect ratio presets
 * - Template preview with placement zones
 * - Integration with Business DNA for brand styling
 */

const TemplateLibrary = ({
  onSelect,
  onClose,
  productDescription = '',
  businessDNA = null,
  initialCategory = null,
}) => {
  const { t } = useTranslation();

  // Auto-detect category from product description
  const detectedCategory = useMemo(() => {
    return initialCategory || detectCategory(productDescription);
  }, [productDescription, initialCategory]);

  const [selectedCategory, setSelectedCategory] = useState(detectedCategory);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [showSeasonal, setShowSeasonal] = useState(false);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);

  // Get templates for current category
  const categoryTemplates = useMemo(() => {
    return getTemplatesForCategory(selectedCategory);
  }, [selectedCategory]);

  // Get available types for current category
  const availableTypes = useMemo(() => {
    return Object.entries(TEMPLATE_TYPES).filter(([typeId, type]) =>
      type.categories.includes(selectedCategory)
    );
  }, [selectedCategory]);

  // Filter templates by type
  const filteredTemplates = useMemo(() => {
    if (!selectedType) {
      // Show all templates for category
      const all = [];
      Object.entries(categoryTemplates).forEach(([typeId, templates]) => {
        all.push(...templates.map(t => ({ ...t, type: typeId })));
      });
      return all;
    }
    return (categoryTemplates[selectedType] || []).map(t => ({ ...t, type: selectedType }));
  }, [categoryTemplates, selectedType]);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    const promptText = buildPromptFromTemplate(template, '{PRODUCT}', businessDNA);

    onSelect({
      template,
      prompt: promptText,
      aspectRatio: selectedAspectRatio,
      category: selectedCategory,
      type: template.type,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center">
              <span className="text-xl">🎨</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Template Library</h2>
              <p className="text-sm text-gray-500">Choose a template for your product photoshoot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white shadow hover:bg-gray-50 flex items-center justify-center transition-colors"
          >
            <span className="text-gray-500">✕</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex flex-1 overflow-hidden">

          {/* Left Sidebar - Categories & Filters */}
          <div className="w-64 border-r border-gray-100 overflow-y-auto p-4 bg-gray-50">

            {/* Categories */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Categories</h3>
              <div className="space-y-1">
                {Object.values(TEMPLATE_CATEGORIES).map(category => (
                  <button
                    key={category.id}
                    onClick={() => {
                      setSelectedCategory(category.id);
                      setSelectedType(null);
                    }}
                    className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                      selectedCategory === category.id
                        ? 'bg-white shadow text-gray-800'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="font-medium">{category.name}</span>
                    {selectedCategory === category.id && (
                      <span className="ml-auto text-purple-500">●</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Template Types */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Shot Types</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedType(null)}
                  className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                    !selectedType
                      ? 'bg-white shadow text-gray-800'
                      : 'text-gray-600 hover:bg-white/50'
                  }`}
                >
                  <span>📷</span>
                  <span className="font-medium">All Types</span>
                </button>
                {availableTypes.map(([typeId, type]) => (
                  <button
                    key={typeId}
                    onClick={() => setSelectedType(typeId)}
                    className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                      selectedType === typeId
                        ? 'bg-white shadow text-gray-800'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <span>{type.icon}</span>
                    <span className="font-medium">{type.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Seasonal Templates Toggle */}
            <div className="mb-6">
              <button
                onClick={() => setShowSeasonal(!showSeasonal)}
                className={`w-full px-3 py-2 rounded-lg text-left flex items-center gap-2 transition-all ${
                  showSeasonal
                    ? 'bg-gradient-to-r from-red-100 to-green-100 text-gray-800'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <span>🎄</span>
                <span className="font-medium">Seasonal</span>
                <span className="ml-auto text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                  {Object.keys(SEASONAL_TEMPLATES).length}
                </span>
              </button>
            </div>

            {/* Aspect Ratio */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Aspect Ratio</h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ASPECT_RATIO_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAspectRatio(preset.ratio)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedAspectRatio === preset.ratio
                        ? 'bg-purple-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    title={preset.name}
                  >
                    <div className="text-lg">{preset.icon}</div>
                    <div className="text-xs mt-1">{preset.ratio}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Content - Template Grid */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Business DNA Badge */}
            {businessDNA && (
              <div className="mb-4 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                  <span className="text-white">🧬</span>
                </div>
                <div>
                  <div className="font-medium text-gray-800">{businessDNA.brandName || 'Your Brand'}</div>
                  <div className="text-xs text-gray-500">
                    Templates will use your brand colors and style
                  </div>
                </div>
                {businessDNA.colors?.primary && (
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow ml-auto"
                    style={{ backgroundColor: businessDNA.colors.primary }}
                  />
                )}
              </div>
            )}

            {/* Category Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{TEMPLATE_CATEGORIES[selectedCategory]?.icon}</span>
                <h3 className="text-lg font-bold text-gray-800">
                  {TEMPLATE_CATEGORIES[selectedCategory]?.name} Templates
                </h3>
                <span className="text-sm text-gray-400">
                  ({filteredTemplates.length} templates)
                </span>
              </div>
            </div>

            {/* Seasonal Templates Section */}
            {showSeasonal && (
              <div className="mb-8">
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span>🎄</span> Seasonal & Holiday
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {Object.values(SEASONAL_TEMPLATES).map(season => (
                    <div key={season.id} className="bg-gradient-to-br from-red-50 to-green-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{season.icon}</span>
                        <span className="font-medium text-gray-800">{season.name}</span>
                      </div>
                      <div className="space-y-2">
                        {season.templates.map(template => (
                          <button
                            key={template.id}
                            onClick={() => handleSelectTemplate({ ...template, type: 'seasonal' })}
                            className="w-full text-left px-3 py-2 bg-white/80 rounded-lg text-sm text-gray-600 hover:bg-white hover:shadow transition-all"
                          >
                            {template.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredTemplates.map(template => (
                <div
                  key={template.id}
                  className="group relative bg-gray-100 rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1"
                  onMouseEnter={() => setHoveredTemplate(template.id)}
                  onMouseLeave={() => setHoveredTemplate(null)}
                  onClick={() => handleSelectTemplate(template)}
                >
                  {/* Template Preview */}
                  <div className="aspect-square relative">
                    {/* Placeholder - in real app, would show actual template image */}
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                      <span className="text-4xl opacity-30">
                        {TEMPLATE_TYPES[template.type]?.icon || '📷'}
                      </span>
                    </div>

                    {/* Placement Zone Indicator */}
                    {template.placementZone && hoveredTemplate === template.id && (
                      <div
                        className="absolute border-2 border-dashed border-purple-400 bg-purple-100/30 rounded-lg transition-all"
                        style={{
                          left: `${template.placementZone.x * 100}%`,
                          top: `${template.placementZone.y * 100}%`,
                          width: `${template.placementZone.width * 100}%`,
                          height: `${template.placementZone.height * 100}%`,
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center text-purple-600 text-xs font-medium">
                          Product Zone
                        </div>
                      </div>
                    )}

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                      <button className="opacity-0 group-hover:opacity-100 px-4 py-2 bg-white rounded-lg font-medium text-gray-800 shadow-lg transition-all transform scale-90 group-hover:scale-100">
                        Use Template
                      </button>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-3">
                    <div className="font-medium text-gray-800 text-sm">{template.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {TEMPLATE_TYPES[template.type]?.name}
                      </span>
                      <div className="flex gap-1">
                        {(template.aspectRatios || ['1:1']).slice(0, 3).map(ratio => (
                          <span
                            key={ratio}
                            className={`text-xs px-1.5 py-0.5 rounded ${
                              ratio === selectedAspectRatio
                                ? 'bg-purple-100 text-purple-600'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                          >
                            {ratio}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="text-4xl mb-3">🔍</div>
                <div className="text-gray-500">No templates found for this combination</div>
                <button
                  onClick={() => setSelectedType(null)}
                  className="mt-3 text-purple-500 hover:text-purple-600"
                >
                  Show all types
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50">
          <div className="text-sm text-gray-500">
            Selected: <span className="font-medium text-gray-800">{selectedAspectRatio}</span> aspect ratio
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};

export default TemplateLibrary;
