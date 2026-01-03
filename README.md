# VOLLA - Multi-Marketplace E-Commerce Analyzer

> AI-powered product photography and SEO optimization for Etsy, Amazon & Shopify

## 🏗️ Project Structure

```
shadow-granule/
├── 📁 api/                          # Backend API (Vercel Serverless)
│   ├── generate-studio.py           # Gemini AI Studio image generation
│   └── requirements.txt             # Python dependencies
│
├── 📁 src/                          # Frontend Source
│   ├── 📁 components/               # React Components
│   │   ├── EtsySEOMaster.jsx       # Main app component
│   │   ├── ListingResults.jsx      # Results display
│   │   ├── ResultsScreen.jsx       # Results screen layout
│   │   ├── ScanningMode.jsx        # Scanning animation
│   │   └── ...                     # Other components
│   │
│   ├── 📁 utils/                   # Utility Functions
│   │   └── aiHelpers.js            # Gemini API integration
│   │
│   ├── 📁 assets/                  # Static assets
│   ├── 📁 data/                    # Static data files
│   │
│   ├── App.jsx                     # App entry point
│   ├── main.jsx                    # React root
│   └── index.css                   # Global styles
│
├── 📁 dist/                         # Production build output
├── 📁 node_modules/                 # Node dependencies
│
├── 📄 index.html                    # HTML entry point
├── 📄 package.json                  # Node.js configuration
├── 📄 vite.config.js               # Vite bundler config
├── 📄 tailwind.config.js           # Tailwind CSS config
├── 📄 postcss.config.js            # PostCSS config
│
├── 📄 README.md                     # This file
├── 📄 BACKEND_SETUP.md             # Backend setup guide
└── 📄 öneriler.md                   # Development notes (Turkish)
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Vercel CLI (for deployment)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GOOGLE_API_KEY` | Gemini API Key | ✅ Yes |
| `GOOGLE_CREDENTIALS_JSON` | Service Account (optional) | ❌ No |

## 🎯 Features

- **AI Studio Mode** - Professional product photography with Gemini 3
- **Multi-Marketplace SEO** - Etsy, Amazon, Shopify optimization
- **Image Analysis** - Automatic product categorization
- **Text Mode** - SEO from product descriptions
- **History** - Save and restore previous analyses

## 🔧 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Backend | Python (Vercel Serverless) |
| AI | Google Gemini 3 |
| Deployment | Vercel |

## 📦 Deployment

```bash
# Deploy to Vercel
vercel --prod
```

## 📄 License

Private - All rights reserved
