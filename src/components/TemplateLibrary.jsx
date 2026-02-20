import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  VOLLA_COLORS,
  SHOT_TYPES,
  TEMPLATE_CATEGORIES,
  PLATFORM_SPECS,
  SEASONAL_THEMES,
  ASPECT_RATIO_PRESETS,
  PROMPT_TEMPLATES,
  SHOT_SUGGESTIONS,
  buildPromptFromTemplate,
  detectCategory,
} from '../config/templates';

/**
 * TemplateLibrary Component - Volla Professional Template System
 *
 * Pomelli-level features + Volla exclusives:
 * - 7 Shot Types with visual previews
 * - Platform-specific optimization
 * - Seasonal themes
 * - Auto shot suggestions
 * - Business DNA integration
 * - Volla coral/orange theme
 */

const TemplateLibrary = ({
  onSelect,
  onClose,
  productDescription = '',
  businessDNA = null,
  initialCategory = null,
}) => {
  const { t } = useTranslation();

  // Auto-detect category
  const detectedCategory = useMemo(() => {
    return initialCategory || detectCategory(productDescription);
  }, [productDescription, initialCategory]);

  // State
  const [selectedCategory, setSelectedCategory] = useState(detectedCategory);
  const [selectedShotType, setSelectedShotType] = useState(null);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState('1:1');
  const [selectedPlatform, setSelectedPlatform] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [hoveredTemplate, setHoveredTemplate] = useState(null);
  const [view, setView] = useState('shots'); // 'shots', 'platforms', 'seasonal'

  // Get suggested shots for category
  const suggestedShots = useMemo(() => {
    return SHOT_SUGGESTIONS.getSuggestedShots(selectedCategory, businessDNA);
  }, [selectedCategory, businessDNA]);

  // Filter templates by shot type
  const filteredTemplates = useMemo(() => {
    let templates = Object.values(PROMPT_TEMPLATES);

    // Filter by shot type
    if (selectedShotType) {
      templates = templates.filter(t => t.shotType === selectedShotType);
    }

    // Filter by category
    templates = templates.filter(t =>
      t.categories.includes('all') || t.categories.includes(selectedCategory)
    );

    // Filter by platform
    if (selectedPlatform) {
      templates = templates.filter(t => t.platform === selectedPlatform);
    }

    // Filter by season
    if (selectedSeason) {
      templates = templates.filter(t => t.seasonal === selectedSeason);
    }

    return templates;
  }, [selectedShotType, selectedCategory, selectedPlatform, selectedSeason]);

  // Handle template selection
  const handleSelectTemplate = (template) => {
    const prompt = buildPromptFromTemplate(
      template,
      productDescription || '{PRODUCT}',
      businessDNA,
      {
        seasonalTheme: selectedSeason,
        platform: selectedPlatform,
      }
    );

    onSelect({
      template,
      prompt,
      aspectRatio: selectedAspectRatio,
      category: selectedCategory,
      shotType: template.shotType,
      platform: selectedPlatform,
      season: selectedSeason,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header - Volla Theme */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, #FEF3F0 0%, #FFF7ED 100%)` }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ background: VOLLA_COLORS.gradient.primary }}>
              <span className="text-2xl">🎨</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Template Library</h2>
              <p className="text-sm text-gray-500">
                Professional templates for stunning product photos
              </p>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-2 mr-4">
            {[
              { id: 'shots', label: 'Shot Types', icon: '📸' },
              { id: 'platforms', label: 'Platforms', icon: '📱', exclusive: true },
              { id: 'seasonal', label: 'Seasonal', icon: '🎄', exclusive: true },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => {
                  setView(v.id);
                  setSelectedShotType(null);
                  setSelectedPlatform(null);
                  setSelectedSeason(null);
                }}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                  view === v.id
                    ? 'text-white shadow-md'
                    : 'bg-white/50 text-gray-600 hover:bg-white'
                }`}
                style={view === v.id ? { background: VOLLA_COLORS.gradient.primary } : {}}
              >
                <span>{v.icon}</span>
                <span>{v.label}</span>
                {v.exclusive && (
                  <span className="ml-1 px-1.5 py-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded">
                    VOLLA
                  </span>
                )}
              </button>
            ))}
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

          {/* Left Sidebar */}
          <div className="w-72 border-r border-gray-100 overflow-y-auto p-4 bg-gray-50/50">

            {/* Product Category */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Product Category
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(TEMPLATE_CATEGORIES).map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`p-3 rounded-xl text-left transition-all ${
                      selectedCategory === category.id
                        ? 'bg-white shadow-md ring-2'
                        : 'bg-white/50 hover:bg-white hover:shadow'
                    }`}
                    style={{
                      ringColor: selectedCategory === category.id ? VOLLA_COLORS.primary : 'transparent',
                    }}
                  >
                    <div className="text-xl mb-1">{category.icon}</div>
                    <div className="text-xs font-medium text-gray-700">{category.name}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Shot Types (when in shots view) */}
            {view === 'shots' && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Shot Type
                </h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setSelectedShotType(null)}
                    className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-3 transition-all ${
                      !selectedShotType
                        ? 'bg-white shadow text-gray-800'
                        : 'text-gray-600 hover:bg-white/50'
                    }`}
                  >
                    <span className="text-lg">📷</span>
                    <span className="font-medium text-sm">All Shot Types</span>
                  </button>

                  {Object.values(SHOT_TYPES).map(shot => (
                    <button
                      key={shot.id}
                      onClick={() => setSelectedShotType(shot.id)}
                      className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-3 transition-all ${
                        selectedShotType === shot.id
                          ? 'bg-white shadow text-gray-800'
                          : 'text-gray-600 hover:bg-white/50'
                      }`}
                    >
                      <span className="text-lg">{shot.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm flex items-center gap-1.5">
                          {shot.name}
                          {shot.isVollaExclusive && (
                            <span className="px-1 py-0.5 bg-yellow-100 text-yellow-700 text-[8px] font-bold rounded">
                              VOLLA
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-400 truncate">{shot.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Platforms (when in platforms view) */}
            {view === 'platforms' && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Marketplace
                </h3>
                <div className="space-y-1">
                  {Object.values(PLATFORM_SPECS).map(platform => (
                    <button
                      key={platform.id}
                      onClick={() => setSelectedPlatform(
                        selectedPlatform === platform.id ? null : platform.id
                      )}
                      className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-3 transition-all ${
                        selectedPlatform === platform.id
                          ? 'bg-white shadow ring-2'
                          : 'bg-white/50 hover:bg-white'
                      }`}
                      style={{
                        ringColor: selectedPlatform === platform.id ? platform.color : 'transparent',
                      }}
                    >
                      <span className="text-lg">{platform.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium text-sm">{platform.name}</div>
                        <div className="text-xs text-gray-400">
                          {platform.requirements.aspectRatio}
                        </div>
                      </div>
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: platform.color }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Seasonal Themes (when in seasonal view) */}
            {view === 'seasonal' && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Seasonal Theme
                </h3>
                <div className="space-y-1">
                  {Object.values(SEASONAL_THEMES).map(season => (
                    <button
                      key={season.id}
                      onClick={() => setSelectedSeason(
                        selectedSeason === season.id ? null : season.id
                      )}
                      className={`w-full px-3 py-2.5 rounded-lg text-left flex items-center gap-3 transition-all ${
                        selectedSeason === season.id
                          ? 'bg-white shadow ring-2'
                          : 'bg-white/50 hover:bg-white'
                      }`}
                      style={{
                        ringColor: selectedSeason === season.id ? season.color : 'transparent',
                      }}
                    >
                      <span className="text-xl">{season.icon}</span>
                      <span className="font-medium text-sm">{season.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Aspect Ratio */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Aspect Ratio
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(ASPECT_RATIO_PRESETS).map(([key, preset]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedAspectRatio(preset.ratio)}
                    className={`p-2 rounded-lg text-center transition-all ${
                      selectedAspectRatio === preset.ratio
                        ? 'text-white shadow-md'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                    style={selectedAspectRatio === preset.ratio
                      ? { background: VOLLA_COLORS.gradient.primary }
                      : {}
                    }
                    title={`${preset.name} - ${preset.use}`}
                  >
                    <div className="text-sm">{preset.icon}</div>
                    <div className="text-xs mt-0.5 font-medium">{preset.ratio}</div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right Content - Template Grid */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* Business DNA Badge */}
            {businessDNA && (
              <div className="mb-4 p-3 rounded-xl flex items-center gap-3"
                style={{ background: `linear-gradient(135deg, #FEF3F0 0%, #FFF7ED 100%)` }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: VOLLA_COLORS.gradient.primary }}>
                  <span className="text-white text-lg">🧬</span>
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-800">
                    {businessDNA.brandName || 'Your Brand'}
                  </div>
                  <div className="text-xs text-gray-500">
                    Templates styled with your brand identity
                  </div>
                </div>
                {businessDNA.colors?.primary && (
                  <div className="flex gap-1">
                    {Object.values(businessDNA.colors || {}).filter(Boolean).slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="w-6 h-6 rounded-full border-2 border-white shadow"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Shot Suggestions (Quick Select) */}
            {view === 'shots' && !selectedShotType && (
              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-600 mb-3 flex items-center gap-2">
                  <span>⚡</span>
                  Suggested for {TEMPLATE_CATEGORIES[selectedCategory]?.name}
                </h4>
                <div className="flex gap-2 flex-wrap">
                  {suggestedShots.slice(0, 5).map((shot, i) => (
                    <button
                      key={shot.type}
                      onClick={() => setSelectedShotType(shot.shotType)}
                      className="px-3 py-2 rounded-xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow transition-all flex items-center gap-2"
                    >
                      <span className="text-lg">{SHOT_TYPES[shot.shotType]?.icon}</span>
                      <div className="text-left">
                        <div className="text-sm font-medium text-gray-700">{shot.name}</div>
                        <div className="text-xs text-gray-400">{shot.description}</div>
                      </div>
                      <span className="ml-2 w-5 h-5 rounded-full bg-gray-100 text-gray-500 text-xs flex items-center justify-center">
                        {i + 1}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                {selectedShotType && (
                  <span className="text-2xl">{SHOT_TYPES[selectedShotType]?.icon}</span>
                )}
                <h3 className="text-lg font-bold text-gray-800">
                  {selectedShotType
                    ? SHOT_TYPES[selectedShotType]?.name
                    : selectedPlatform
                    ? PLATFORM_SPECS[selectedPlatform]?.name
                    : selectedSeason
                    ? SEASONAL_THEMES[selectedSeason]?.name
                    : 'All Templates'}
                </h3>
                <span className="text-sm text-gray-400">
                  ({filteredTemplates.length} templates)
                </span>
              </div>
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredTemplates.map(template => {
                const shotType = SHOT_TYPES[template.shotType];
                const isHovered = hoveredTemplate === template.id;

                return (
                  <div
                    key={template.id}
                    className="group relative bg-gray-100 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                    onMouseEnter={() => setHoveredTemplate(template.id)}
                    onMouseLeave={() => setHoveredTemplate(null)}
                    onClick={() => handleSelectTemplate(template)}
                  >
                    {/* Template Preview */}
                    <div className="aspect-square relative overflow-hidden">
                      {/* Gradient Background based on shot type */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${shotType?.gradient || 'from-gray-200 to-gray-300'} transition-all duration-300`}
                        style={{ opacity: isHovered ? 0.9 : 0.6 }}
                      />

                      {/* Icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-5xl transition-all duration-300 ${isHovered ? 'scale-110' : ''}`}>
                          {template.icon || shotType?.emoji || '📸'}
                        </span>
                      </div>

                      {/* Volla Exclusive Badge */}
                      {shotType?.isVollaExclusive && (
                        <div className="absolute top-2 right-2">
                          <span className="px-2 py-1 bg-yellow-400 text-yellow-900 text-[10px] font-bold rounded-full shadow">
                            VOLLA EXCLUSIVE
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className={`absolute inset-0 bg-black/0 transition-all duration-300 flex items-center justify-center ${
                        isHovered ? 'bg-black/40' : ''
                      }`}>
                        <button
                          className={`px-5 py-2.5 rounded-xl font-medium text-white shadow-lg transition-all duration-300 transform ${
                            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
                          }`}
                          style={{ background: VOLLA_COLORS.gradient.primary }}
                        >
                          Use Template
                        </button>
                      </div>
                    </div>

                    {/* Template Info */}
                    <div className="p-4 bg-white">
                      <div className="font-semibold text-gray-800 mb-1">{template.name}</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          {shotType?.name}
                        </span>
                        {(template.aspectRatios || ['1:1']).slice(0, 2).map(ratio => (
                          <span
                            key={ratio}
                            className={`text-xs px-2 py-0.5 rounded-full ${
                              ratio === selectedAspectRatio
                                ? 'text-white'
                                : 'bg-gray-100 text-gray-400'
                            }`}
                            style={ratio === selectedAspectRatio
                              ? { background: VOLLA_COLORS.primary }
                              : {}
                            }
                          >
                            {ratio}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty State */}
            {filteredTemplates.length === 0 && (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">🔍</div>
                <div className="text-xl font-medium text-gray-800 mb-2">
                  No templates found
                </div>
                <div className="text-gray-500 mb-4">
                  Try adjusting your filters or selecting a different category
                </div>
                <button
                  onClick={() => {
                    setSelectedShotType(null);
                    setSelectedPlatform(null);
                    setSelectedSeason(null);
                  }}
                  className="px-4 py-2 rounded-xl font-medium text-white"
                  style={{ background: VOLLA_COLORS.gradient.primary }}
                >
                  Clear Filters
                </button>
              </div>
            )}

          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-500">
              Aspect Ratio: <span className="font-medium text-gray-800">{selectedAspectRatio}</span>
            </div>
            {selectedPlatform && (
              <div className="text-sm text-gray-500">
                Platform: <span className="font-medium text-gray-800">
                  {PLATFORM_SPECS[selectedPlatform]?.name}
                </span>
              </div>
            )}
            {selectedSeason && (
              <div className="text-sm text-gray-500">
                Theme: <span className="font-medium text-gray-800">
                  {SEASONAL_THEMES[selectedSeason]?.name}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default TemplateLibrary;
