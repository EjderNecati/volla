# Volla 3.0 - Pomelli-Level Implementation Plan

## Executive Summary
Complete overhaul of Volla to match/exceed Google Pomelli's capabilities while maintaining our unique advantages (SEO, Video, Global reach, 10 languages).

**Estimated Timeline:** 15-25 hours of implementation
**Complexity:** Very High
**Risk Level:** High (major architectural changes)

---

## Phase 1: Model Infrastructure Upgrade (2-3 hours)

### 1.1 Switch to Nano Banana Pro
- [ ] Update `api/gemini-generate.py` to use `gemini-3-pro-image-preview`
- [ ] Implement "Thinking" mode for complex compositions
- [ ] Add 4K resolution support (1K, 2K, 4K options)
- [ ] Update aspect ratio support: 1:1, 2:3, 3:2, 3:4, 4:3, 4:5, 5:4, 9:16, 16:9, 21:9
- [ ] Implement proper text rendering parameters
- [ ] Add SynthID watermark handling

### 1.2 API Cost Optimization
- [ ] Implement Batch API for non-realtime workloads
- [ ] Add quality/speed toggle (Nano Banana vs Nano Banana Pro)
- [ ] Update credit costs based on new pricing ($0.134/image 2K, $0.24/image 4K)

---

## Phase 2: Business DNA System (4-5 hours)

### 2.1 Database Schema
```javascript
BusinessDNA {
  id: string,
  userId: string,
  websiteUrl: string,
  companyName: string,
  logo: string (base64/url),
  colors: {
    primary: string,
    secondary: string,
    accent: string,
    background: string
  },
  fonts: {
    heading: string,
    body: string
  },
  tagline: string,
  brandValues: string[],
  brandAesthetic: string[],
  brandTone: string[],
  businessOverview: string,
  productImages: string[],
  createdAt: Date,
  updatedAt: Date
}
```

### 2.2 Backend API
- [ ] `POST /api/business-dna/analyze` - Crawl website and extract brand info
- [ ] `GET /api/business-dna/:id` - Get stored DNA
- [ ] `PUT /api/business-dna/:id` - Update DNA
- [ ] `DELETE /api/business-dna/:id` - Delete DNA

### 2.3 Website Crawler
- [ ] Create `api/business-dna-analyzer.py`
- [ ] Extract: logo, favicon, colors from CSS/images
- [ ] Extract: fonts from CSS
- [ ] Extract: meta description, tagline, about text
- [ ] Extract: product images from pages
- [ ] Use Gemini to analyze and generate:
  - Brand values
  - Brand aesthetic tags
  - Brand tone of voice
  - Business overview

### 2.4 Frontend Components
- [ ] `BusinessDNASetup.jsx` - Onboarding wizard
- [ ] `BusinessDNAReview.jsx` - Review & edit extracted data
- [ ] `BusinessDNACard.jsx` - Sidebar display
- [ ] Color picker for manual editing
- [ ] Font selector
- [ ] Tag editor for values/aesthetic/tone

### 2.5 i18n Translations
- [ ] Add Business DNA translations to all 10 languages:
  - businessDna.title, businessDna.analyze, businessDna.colors, etc.

---

## Phase 3: Template System (5-6 hours)

### 3.1 Template Library Structure
```javascript
Template {
  id: string,
  name: string,
  category: 'fashion' | 'beauty' | 'home' | 'consumables' | 'electronics' | 'general',
  type: 'model_try_on' | 'in_use' | 'flatlay' | 'studio' | 'contextual' | 'seasonal',
  seasonalTheme?: 'easter' | 'christmas' | 'summer' | 'valentines' | etc,
  previewImage: string,
  promptTemplate: string,
  supportedAspectRatios: string[],
  recommendedFor: string[] // product types
}
```

### 3.2 Template Categories & Types
**Fashion:**
- Model Try On (person wearing)
- In Use (action shot)
- Flatlay (flat surface)
- Studio (clean background)
- Seasonal variants

**Beauty:**
- Hand holding
- Face application
- Flatlay with ingredients
- Minimalist studio
- Lifestyle bathroom

**Home:**
- Room setting
- Close-up detail
- Lifestyle context
- Multiple angles

**Consumables:**
- Kitchen context
- Ingredients composition
- Minimalist
- Action shot (pouring, etc.)

**Electronics:**
- Tech setup
- Hand holding
- Workspace context
- Clean studio

### 3.3 Template Selection UI
- [ ] `TemplateSelector.jsx` - Grid of template previews
- [ ] Category tabs/filters
- [ ] "Select up to 4 templates" functionality
- [ ] Template preview with product mockup
- [ ] Aspect ratio toggle per template

### 3.4 Template Prompt Engineering
- [ ] Create optimized prompts for each template type
- [ ] Include Business DNA variables in prompts
- [ ] Product category detection for recommendations
- [ ] "Thinking" mode prompts for complex compositions

---

## Phase 4: Photoshoot Mode (3-4 hours)

### 4.1 Photoshoot Flow
```
1. Select/Upload Product Image
2. (Optional) Select from Business DNA catalog
3. Choose Aspect Ratio (Story 9:16, Square 1:1, Feed 4:5)
4. Select Templates (up to 4)
5. Generate Photoshoot
6. Review Results (4 images)
7. Actions: Create Campaign, Add to DNA, Download All
```

### 4.2 Components
- [ ] `PhotoshootMode.jsx` - Main component (replaces/enhances Handsfree)
- [ ] `ProductImageSelector.jsx` - Upload or select from DNA
- [ ] `AspectRatioSelector.jsx` - Visual ratio picker
- [ ] `PhotoshootResults.jsx` - Grid of generated images
- [ ] `PhotoshootActions.jsx` - CTA buttons

### 4.3 Generation Logic
- [ ] Parallel generation of 4 images (one per template)
- [ ] Use Nano Banana Pro with Thinking mode
- [ ] Apply Business DNA styling
- [ ] Progress indicator per image

---

## Phase 5: Campaign System (4-5 hours)

### 5.1 Campaign Structure
```javascript
Campaign {
  id: string,
  businessDnaId: string,
  title: string,
  description: string,
  theme: string,
  creatives: Creative[],
  createdAt: Date
}

Creative {
  id: string,
  campaignId: string,
  type: 'image' | 'video',
  imageUrl: string,
  header: { text, font, color, size },
  description: { text, font, color, size },
  cta: { text, font, color, size },
  aspectRatio: string,
  version: number
}
```

### 5.2 Campaign Ideas Generator
- [ ] Use Gemini to generate campaign ideas based on:
  - Business DNA
  - Product catalog
  - Current season/trends
  - Marketing best practices
- [ ] Generate 3-5 campaign suggestions with titles and descriptions

### 5.3 Campaign Builder
- [ ] `CampaignsView.jsx` - List of campaigns
- [ ] `CampaignBuilder.jsx` - Create/edit campaign
- [ ] `CampaignIdeas.jsx` - AI-suggested campaigns
- [ ] `CreativeGrid.jsx` - Display creatives in campaign

### 5.4 Creative Editor (Professional)
- [ ] `CreativeEditor.jsx` - Full-featured editor
- [ ] Sidebar panels:
  - Image (swap product image)
  - Header (text, font, color, size, visibility)
  - Description (text, font, color, size, visibility)
  - Call To Action (text, generate CTA)
- [ ] Version History (previous edits)
- [ ] Live preview
- [ ] Export options (PNG, JPG, different sizes)

### 5.5 Animate Feature (Future/Placeholder)
- [ ] "Animate" button on creatives
- [ ] Integrate with existing Veo 3.1 for video generation
- [ ] Campaign → Video conversion

---

## Phase 6: UI/UX Overhaul (3-4 hours)

### 6.1 New Navigation Structure
```
Sidebar:
├── Business DNA
├── Campaigns
├── Photoshoot
├── Motion (Video)
├── SEO Analysis (our unique feature)
├── History
├── Library
└── Settings
```

### 6.2 Design System Updates
- [ ] Keep Volla brand colors: #FAF9F6, #1A1A1A, cyan-500, emerald-500
- [ ] Update card designs to match Pomelli's clean aesthetic
- [ ] Dark mode panels for editing (like Pomelli's sidebar)
- [ ] Consistent button styles
- [ ] Better loading states

### 6.3 Responsive Design
- [ ] Mobile-first approach
- [ ] Tablet optimization
- [ ] Desktop full experience

### 6.4 Onboarding Flow
```
1. Welcome to Volla
2. Enter your website URL
3. We'll analyze your brand
4. Review your Business DNA
5. Start creating!
```

---

## Phase 7: Integration & Polish (2-3 hours)

### 7.1 Feature Integration
- [ ] Business DNA → Campaigns flow
- [ ] Photoshoot → Campaign conversion
- [ ] Keep SEO Analysis working with new structure
- [ ] Motion mode integration with campaigns

### 7.2 i18n Completion
- [ ] Add all new translations to 10 language files
- [ ] Test RTL if needed

### 7.3 Credit System Update
- [ ] Update credit costs for new features:
  - Business DNA Analysis: 5 credits
  - Photoshoot (4 images): 20 credits (5 each)
  - Campaign Generation: 10 credits
  - Creative Edit: 2 credits

### 7.4 Testing & QA
- [ ] Test all flows end-to-end
- [ ] Cross-browser testing
- [ ] Mobile testing
- [ ] Error handling

---

## File Structure Changes

```
src/
├── components/
│   ├── businessDna/
│   │   ├── BusinessDNASetup.jsx
│   │   ├── BusinessDNAReview.jsx
│   │   ├── BusinessDNACard.jsx
│   │   └── BrandColorPicker.jsx
│   ├── campaigns/
│   │   ├── CampaignsView.jsx
│   │   ├── CampaignBuilder.jsx
│   │   ├── CampaignIdeas.jsx
│   │   ├── CreativeGrid.jsx
│   │   └── CreativeEditor.jsx
│   ├── photoshoot/
│   │   ├── PhotoshootMode.jsx
│   │   ├── TemplateSelector.jsx
│   │   ├── ProductImageSelector.jsx
│   │   └── PhotoshootResults.jsx
│   ├── templates/
│   │   ├── TemplateLibrary.jsx
│   │   └── TemplateCard.jsx
│   └── shared/
│       ├── AspectRatioSelector.jsx
│       ├── FontSelector.jsx
│       └── VersionHistory.jsx
├── utils/
│   ├── businessDnaManager.js
│   ├── campaignManager.js
│   └── templateEngine.js
└── i18n/
    └── (update all 10 files)

api/
├── business-dna-analyzer.py (NEW)
├── campaign-generator.py (NEW)
├── gemini-generate.py (UPDATE - Nano Banana Pro)
└── template-photoshoot.py (NEW)
```

---

## Success Metrics

1. **Consistency:** 95%+ output quality (up from 80%)
2. **User Flow:** < 5 clicks from start to generated content
3. **Template Coverage:** 50+ templates across 5 categories
4. **Business DNA Accuracy:** 90%+ brand extraction accuracy
5. **Performance:** < 10s for single image generation

---

## Risk Mitigation

1. **Backup:** Git + Desktop backup created
2. **Rollback:** Can revert to pre-refactor commit
3. **Incremental Deploy:** Deploy phase by phase
4. **Feature Flags:** Can disable new features if issues

---

## Implementation Order

1. ✅ Backup complete
2. [ ] Phase 1: Model upgrade (foundation)
3. [ ] Phase 2: Business DNA (core feature)
4. [ ] Phase 3: Templates (visual library)
5. [ ] Phase 4: Photoshoot (main workflow)
6. [ ] Phase 5: Campaigns (marketing suite)
7. [ ] Phase 6: UI polish
8. [ ] Phase 7: Integration & testing

---

## Let's Begin!
