# Cloudlint

A modern React application built with Vite, TypeScript, and shadcn/ui components.

## 🚀 Features

- ⚡ **Vite** - Fast build tool and development server
- ⚛️ **React 19** - Latest React with TypeScript
- 🎨 **shadcn/ui** - Beautiful, accessible UI components
- 🌙 **Dark Mode** - Built-in theme switching
- 🎯 **Tailwind CSS v4** - Modern utility-first CSS
- 🔧 **MCP Integration** - Model Context Protocol for AI tools
- 📱 **Responsive Design** - Mobile-first approach
- 🧪 **Vitest Testing** - Comprehensive test suite with 19 tests

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Icons**: Lucide React
- **Testing**: Vitest, React Testing Library
- **Development**: ESLint, Hot Module Replacement
- **AI Integration**: MCP servers for enhanced development

## 🚀 Getting Started

### Prerequisites

- **Node.js 20.x** (LTS) - Required for optimal compatibility
- **npm 10+** or yarn

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

4. **Start the development server:**
```bash
npm run dev
```

5. **Open [http://localhost:5174](http://localhost:5174) in your browser**

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run tests in watch mode
- `npm run test:run` - Run tests once
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Run tests with coverage
- `npm run type-check` - TypeScript type checking
- `npm run type-check:test` - TypeScript check for tests

## 🧪 Testing

This project uses **Vitest** with React Testing Library:

- **19 tests** covering all components
- **Test isolation** with proper cleanup
- **localStorage mocking** for theme tests
- **CI/CD integration** with GitHub Actions

```bash
# Run tests
npm run test

# Run tests once (CI mode)
npm run test:run

# Run with coverage
npm run test:coverage
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

## 🤖 MCP Integration

Configured MCP servers:
- **shadcn**: UI component management
- **GitHub**: Repository operations and automation
- **Context7**: Documentation and library support
- **Spectral**: OpenAPI linting

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── __tests__/      # Component tests
│   ├── theme-provider.tsx
│   └── mode-toggle.tsx
├── lib/                # Utility functions
└── App.tsx             # Main application

tests/
├── setup.ts            # Test configuration
├── basic.test.ts       # Basic test suite
└── __tests__/          # Additional tests

.kiro/
└── settings/
    └── mcp.json        # MCP server configuration
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