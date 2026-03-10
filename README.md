<p align="center">
  <img src="public/icons/icon-256.png" width="96" alt="MD to Lark Docs" />
</p>

<h1 align="center">MD to Lark Docs</h1>

<p align="center">
  <strong>A Chrome Extension that converts Markdown files into Lark (Feishu) documents — with diagram rendering, image embedding, and multi-language support.</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#installation">Installation</a> •
  <a href="#usage">Usage</a> •
  <a href="#development">Development</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  <img alt="Chrome Manifest V3" src="https://img.shields.io/badge/Manifest-V3-blue?logo=googlechrome&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white" />
  <img alt="License" src="https://img.shields.io/badge/License-MIT-green" />
</p>

---

## ✨ Features

- **📄 Markdown → Lark Docs** — Import `.md` files or paste raw Markdown directly into any Lark/Feishu document
- **📊 Diagram Rendering** — Automatically converts Mermaid and PlantUML code blocks into PNG images
- **🖼️ Image Embedding** — Fetches external images and converts them to inline data URIs so Lark can display them
<!-- - **📤 Export to Markdown** — Extract the current Lark document content back to a `.md` file (reverse conversion) -->
- **👁️ Live Preview** — Full-screen preview overlay before inserting content
- **🎨 Theme Support** — Light, Dark, and System-follow modes
- **🌐 Multi-language** — English, Tiếng Việt, 中文
- **⚡ Sidebar UI** — Opens as a sleek slide-in sidebar on Lark pages (no popup jank)
- **📋 Smart Paste** — Simulates native paste events for seamless insertion into Lark's editor
- **🏷️ Auto Title** — Optionally uses the first heading as the document title

---

## 📦 Installation

### From Source (Developer Mode)

1. Clone the repository:
   ```bash
   git clone https://github.com/riki449/chrome-ext-lark-md-to-docs.git
   cd chrome-ext-lark-md-to-docs
   ```

2. Install dependencies and build:
   ```bash
   npm install
   npm run build
   ```

3. Load in Chrome:
   - Navigate to `chrome://extensions/`
   - Enable **Developer mode** (top-right toggle)
   - Click **Load unpacked**
   - Select the `dist/` folder

---

## 🚀 Usage

1. Open any **Lark / Feishu** document (e.g. `https://xxx.larksuite.com/docx/...`)
2. Click the **MD to Lark** extension icon in the toolbar
3. A sidebar will slide in from the right
4. Choose your input method:
   - **Upload File** — Drag & drop or browse for a `.md` file
   - **Paste Markdown** — Write or paste Markdown content directly
5. Click **Preview** to see the rendered output, or **Convert** to insert it into the document
<!-- 6. To export, click **Export to MD** to download the current Lark document as Markdown -->

> [!TIP]
> If you're not on a Lark page, clicking the icon will show a friendly toast notification guiding you to open a Lark document first.

### Settings

Access settings via the ⚙️ gear icon:

| Setting | Options | Description |
|---------|---------|-------------|
| **Appearance** | Light / Dark / System | UI theme for the sidebar |
| **Diagrams** | Render as Image / Keep as Code | How to handle Mermaid & PlantUML blocks |
| **First line as title** | On / Off | Use the first `# Heading` as the Lark document title |
| **Language** | 🇬🇧 EN / 🇻🇳 VI / 🇨🇳 ZH | Interface language |

---

## 🛠️ Development

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9

### Setup

```bash
# Install dependencies
npm install

# Start development build (watch mode)
npm run dev

# Production build
npm run build
```

The `npm run dev` command watches for file changes and rebuilds automatically. After each rebuild, go to `chrome://extensions/` and click the refresh ↻ button on the extension card.

### Tech Stack

| Technology | Purpose |
|-----------|---------|
| **Vite 6** | Build tool with custom plugins for multi-entry Chrome Extension |
| **React 18** | Sidebar popup UI |
| **TypeScript 5.6** | Type-safe source code |
<!-- | **Turndown** | HTML → Markdown conversion (for Export feature) | -->
| **Marked** | Markdown → HTML parsing |
| **Chrome Extension Manifest V3** | Service worker, content scripts, scripting API |

---

## 🏗️ Architecture

```
chrome-ext-lark-md-to-docs/
├── manifest.json            # Chrome Extension manifest (V3)
├── vite.config.ts           # Vite config with custom plugins
├── package.json
├── tsconfig.json
├── public/
│   └── icons/               # Extension icons (16, 32, 48, 128)
├── src/
│   ├── background.ts        # Service worker — handles icon click & script injection
│   ├── content-script.ts    # Injected into Lark pages — manages sidebar iframe
│   └── popup/               # React app rendered inside the sidebar
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx           # Main app component with convert/preview logic
│       ├── index.css         # Complete styling
│       ├── types.ts
│       ├── components/
│       │   ├── Header.tsx
│       │   ├── DropZone.tsx       # File upload drag & drop
│       │   ├── PasteZone.tsx      # Markdown text input
│       │   ├── Preview.tsx        # HTML preview renderer
│       │   ├── StatusView.tsx     # Success/error status display
│       │   └── SettingsPanel.tsx   # Settings dropdown menu
│       ├── hooks/
│       │   ├── useConverter.ts    # Core conversion logic (MD→HTML, paste injection)
│       │   └── useTheme.ts        # Theme management (light/dark/system)
│       ├── i18n/
│       │   ├── index.tsx          # i18n context provider
│       │   └── messages.ts        # EN, VI, ZH translations
│       └── utils/
│           ├── markdown.ts        # Markdown parsing wrapper
│           ├── diagrams.ts        # PlantUML & Mermaid → PNG rendering
│           ├── htmlToMarkdown.ts   # Lark HTML → clean Markdown (Turndown rules)
│           └── imageEmbed.ts      # External images → data URI embedding
└── dist/                    # Build output (load this in Chrome)
```

### How It Works

```
┌────────────┐   click    ┌──────────────┐   inject    ┌────────────────┐
│  User      │ ────────── │  background  │ ──────────  │ content-script │
│  (toolbar) │            │  .ts         │             │ .ts            │
└────────────┘            └──────────────┘             └───────┬────────┘
                                                               │
                                                         creates sidebar
                                                          (iframe)
                                                               │
                                                               ▼
                                                      ┌────────────────┐
                                                      │   popup/       │
                                                      │   React App    │
                                                      │                │
                                                      │  ┌──────────┐  │
                                                      │  │ Upload / │  │
                                                      │  │ Paste MD │  │
                                                      │  └────┬─────┘  │
                                                      │       │        │
                                                      │   parse MD     │
                                                      │   render HTML  │
                                                      │   embed imgs   │
                                                      │       │        │
                                                      │  ┌────▼─────┐  │
                                                      │  │ Inject   │  │
                                                      │  │ → Lark   │  │
                                                      │  │  Editor  │  │
                                                      │  └──────────┘  │
                                                      └────────────────┘
```

### Build System

The Vite config uses two custom plugins:

1. **`copyExtFiles`** — Copies `manifest.json` and icons to `dist/`
2. **`buildExtraScripts`** — Separately builds `background.ts` (ES module) and `content-script.ts` (IIFE) alongside the main React popup build

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test the extension locally (see [Development](#development))
5. Commit your changes: `git commit -m "feat: add amazing feature"`
6. Push to your branch: `git push origin feature/amazing-feature`
7. Open a **Pull Request**

### Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/):

| Prefix | Usage |
|--------|-------|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation only |
| `refactor:` | Code refactoring |
| `chore:` | Build process, dependencies |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/riki449">riki449</a>
</p>
