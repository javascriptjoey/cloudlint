# Cloudlint

A modern YAML validation and linting platform with enterprise-grade backend and React frontend.

> **Latest Update**: Complete backend consolidation with production-ready validation engine.

## 🚀 Features

### Frontend
- ⚡ **Vite** - Fast build tool and development server
- ⚛️ **React 19** - Latest React with TypeScript
- 🎨 **shadcn/ui** - Beautiful, accessible UI components
- 🌙 **Dark Mode** - Built-in theme switching
- 🎯 **Tailwind CSS v4** - Modern utility-first CSS
- 📱 **Responsive Design** - Mobile-first approach
- 🔄 **Real-time Validation** - Smart debounced YAML validation
- 📝 **CodeMirror 6 Editor** - Advanced YAML editor with syntax highlighting

### Backend
- 🏗️ **Enterprise-Grade Validation** - Multi-tool orchestration (yamllint, cfn-lint, spectral)
- ☁️ **Provider-Aware** - AWS CloudFormation, Azure Pipelines, Generic YAML support
- 🔒 **Security-First** - Content filtering, rate limiting, request logging
- 🐳 **Docker Integration** - Containerized external tools with fallbacks
- 🛠️ **Auto-Fix** - Intelligent YAML repair with diff preview
- 📊 **Schema Validation** - JSON Schema validation support
- 🔧 **MCP Integration** - Model Context Protocol for AI tools
- 🧪 **Comprehensive Testing** - 145+ tests covering all functionality

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7.x
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Editor**: CodeMirror 6 with YAML support
- **Icons**: Lucide React
- **State Management**: React hooks with custom validation hooks

### Backend
- **Runtime**: Node.js 20+ with Express
- **Validation**: Multi-tool orchestration (yamllint, cfn-lint, spectral, prettier)
- **Security**: Rate limiting, CORS, security headers, content filtering
- **Containerization**: Docker for external tool isolation
- **Provider Detection**: AWS, Azure, Generic YAML analysis

### Testing & Development
- **Unit Testing**: Vitest with React Testing Library
- **E2E Testing**: Playwright across Chromium, Firefox, WebKit
- **Linting**: ESLint with TypeScript support
- **Type Checking**: Strict TypeScript configuration
- **AI Integration**: MCP servers for enhanced development

## 🚀 Getting Started

### Prerequisites

- **Node.js 20.x** (LTS) - Required for optimal compatibility
- **npm 10+** or yarn
- **Docker** (optional) - For external validation tools (yamllint, cfn-lint)
- **Python 3.x** (optional) - For yamllint if not using Docker

### Installation

1. **Clone the repository:**
```bash
git clone <repository-url>
cd cloudlint
```

2. **Use the correct Node.js version** (if using nvm):
```bash
nvm use
# or
nvm install 20
nvm use 20
```

3. **Install dependencies:**
```bash
npm install
```

4. **Setup external tools (optional):**
```bash
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/setup-tools.ps1

# Or manually install Docker images
docker pull cytopia/yamllint:latest
docker pull giammbo/cfn-lint:latest
```

5. **Start the backend server:**
```bash
npm run dev:backend
```

6. **Start the frontend (in another terminal):**
```bash
npm run dev
```

7. **Open [http://localhost:5173](http://localhost:5173) in your browser**

## 📦 Available Scripts

### Frontend
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Backend
- `npm run dev:backend` - Start backend server (port 3001)
- `npm run start:server` - Start production backend server
- `npm run start:prod:8787` - Start backend on port 8787 (production)

### YAML CLI Tools
- `npm run yaml:validate` - Validate YAML files via CLI
- `npm run yaml:fix` - Auto-fix YAML files via CLI
- `npm run yaml:suggest` - Get provider-specific suggestions
- `npm run schemas:fetch` - Fetch latest schema definitions

### Testing & Quality
- `npm run test` - Run unit tests in watch mode
- `npm run test:run` - Run all tests once
- `npm run e2e` - Run Playwright E2E tests
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run type-check` - TypeScript type checking
- `npm run type-check:test` - TypeScript check for tests

## 🧪 Testing

Comprehensive testing with **145+ tests** across multiple layers:

### Unit Tests (Vitest + React Testing Library)
- **Frontend components** - All UI components and hooks
- **Backend validation** - YAML processing, security, provider detection
- **API integration** - Client-server communication
- **Real-time validation** - Debounced validation logic
- **Theme system** - Dark/light mode persistence

### E2E Tests (Playwright)
- **Cross-browser testing** - Chromium, Firefox, WebKit
- **Playground functionality** - Complete user workflows
- **Validation flows** - End-to-end YAML processing
- **Accessibility** - Keyboard navigation, ARIA compliance

```bash
# Unit tests
npm run test                # Watch mode
npm run test:run           # Single run
npm run test:coverage      # With coverage

# E2E tests
npm run e2e                # Full Playwright suite

# Backend validation
npm run yaml:validate file.yaml  # CLI validation
```

## 🎨 UI Components

This project uses [shadcn/ui](https://ui.shadcn.com/) for components:

- Add new components: `npx shadcn@latest add [component-name]`
- Browse components: [shadcn/ui components](https://ui.shadcn.com/docs/components)

## 🌙 Theme Support

- Light/Dark mode toggle
- System preference detection
- Persistent theme selection
- Zinc color scheme

## 🤖 SDK and MCP Integration

### SDK
- Import from `@/backend/sdk` for app/service integration:
  - `validateYaml(content, options)`
  - `autoFixYaml(content, options)`
  - `suggest(content, provider?)` → returns `provider`, `suggestions`, `messages`
  - `applySuggestions(content, indexes, provider?)` → returns modified content

Configured MCP servers:
- **shadcn**: UI component management
- **GitHub**: Repository operations and automation
- **Context7**: Documentation and library support
- **Spectral**: OpenAPI linting

## 📁 Project Structure

```
src/
├── backend/                 # Enterprise validation engine
│   ├── yaml/               # YAML processing core
│   │   ├── validate.ts     # Multi-tool orchestration
│   │   ├── autofix.ts      # Intelligent repair
│   │   ├── security.ts     # Content filtering
│   │   ├── detect.ts       # Provider detection
│   │   ├── cfnSuggest.ts   # AWS CloudFormation support
│   │   ├── azureSuggest.ts # Azure Pipelines support
│   │   └── types.ts        # Type definitions
│   ├── sdk.ts              # Public SDK interface
│   └── diff.ts             # Unified diff generation
├── components/             # React components
│   ├── ui/                # shadcn/ui components
│   ├── YAMLEditor.tsx     # CodeMirror 6 integration
│   ├── RealTimeValidationSettings.tsx
│   └── theme-provider.tsx
├── pages/                  # Route components
│   ├── Playground.tsx     # Main YAML validation UI
│   ├── Home.tsx           # Landing page
│   └── About.tsx          # About page
├── hooks/                  # Custom React hooks
│   └── useDebouncedValidation.ts
├── lib/                    # Utilities
│   └── apiClient.ts       # Typed API client
└── server.ts               # Express backend server

tests/
├── backend/                # Backend validation tests
├── frontend/               # React component tests
├── e2e/                    # Playwright E2E tests
├── hooks/                  # Custom hook tests
├── mocks/                  # MSW mock handlers
└── setup.ts                # Test configuration

scripts/
└── setup-tools.ps1         # External tools setup
```

## 🔧 Configuration

- **Vite**: `vite.config.ts`
- **Vitest**: `vitest.config.ts`
- **TypeScript**: `tsconfig.json`, `tsconfig.app.json`, `tsconfig.test.json`
- **Tailwind**: Configured via Vite plugin
- **shadcn/ui**: `components.json`
- **Node.js**: `.nvmrc` (version 20)

## 🚀 Deployment

The project automatically deploys to GitHub Pages when pushed to the main branch:

- **CI/CD**: GitHub Actions workflow
- **Build**: Optimized production build
- **Tests**: All tests must pass before deployment
- **Pages**: Available at GitHub Pages URL

## 📄 License

This project is private and not licensed for public use.