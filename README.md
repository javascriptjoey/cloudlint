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

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Icons**: Lucide React
- **Development**: ESLint, Hot Module Replacement
- **AI Integration**: MCP servers for enhanced development

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cloudlint
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:5174](http://localhost:5174) in your browser

## 📦 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

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

## 📁 Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components
│   ├── theme-provider.tsx
│   └── mode-toggle.tsx
├── lib/                # Utility functions
└── App.tsx             # Main application

.kiro/
└── settings/
    └── mcp.json        # MCP server configuration
```

## 🔧 Configuration

- **Vite**: `vite.config.ts`
- **TypeScript**: `tsconfig.json`, `tsconfig.app.json`
- **Tailwind**: Configured via Vite plugin
- **shadcn/ui**: `components.json`

## 📄 License

This project is private and not licensed for public use.