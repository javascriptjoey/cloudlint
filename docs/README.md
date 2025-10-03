# Cloudlint Documentation

Welcome to Cloudlint - a modern YAML validation and linting tool optimized for cloud configurations.

## Overview

Cloudlint is a web-based YAML validator that provides real-time validation, syntax checking, and cloud-specific optimizations for AWS, Azure, and other cloud platforms. Built with React, TypeScript, and CodeMirror, it offers a clean, accessible interface for YAML editing and validation.

## Features

- **Real-time YAML Validation**: Instant feedback on YAML syntax and structure
- **CodeMirror Editor**: Professional code editor with syntax highlighting
- **Cloud Provider Support**: Optimized for AWS CloudFormation, Azure Resource Manager, and generic YAML
- **JSON Conversion**: Convert YAML to JSON format
- **Theme Support**: Light and dark mode themes
- **Accessibility**: WCAG 2.1 AA compliant interface
- **Mobile Responsive**: Works on desktop, tablet, and mobile devices
- **Performance Optimized**: Handles large YAML files efficiently

## Quick Start

1. Navigate to the [Playground](/playground)
2. Paste your YAML content or click "Load Sample" to try it out
3. Click "Validate" to check your YAML
4. Use "Convert to JSON" to see the JSON equivalent
5. Toggle security checks and themes as needed

## Documentation Index

### Core Features

- [API Reference](./API.md) - Backend API endpoints and usage
- [YAML Tooling](./yaml-tooling.md) - YAML processing capabilities
- [Security Features](./secure-yaml.md) - Security validation and best practices

### Development

- [Architecture](./architecture.md) - Application architecture and design decisions
- [Frontend Guide](./frontend.md) - Frontend development guide
- [Testing Strategy](./testing.md) - Comprehensive testing approach
- [Performance](./performance.md) - Performance optimization guide

### Testing

- [Testing Overview](./testing/README.md) - Complete testing documentation
- [E2E Testing](./testing/e2e-testing.md) - End-to-end testing with Playwright
- [Accessibility Testing](./testing/accessibility-testing.md) - WCAG compliance testing

## Technology Stack

### Frontend

- **React 19** - UI framework
- **TypeScript** - Type safety and developer experience
- **CodeMirror 6** - Professional code editor
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible component primitives
- **React Router** - Client-side routing
- **Sonner** - Toast notifications

### Backend

- **Node.js** - Runtime environment
- **Express** - Web framework
- **YAML** - YAML parsing and processing
- **AJV** - JSON schema validation

### Testing

- **Vitest** - Unit testing framework
- **Playwright** - End-to-end testing
- **Testing Library** - Component testing utilities
- **Axe** - Accessibility testing

### Development Tools

- **Vite** - Build tool and dev server
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript** - Static type checking

## Project Structure

```
cloudlint/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── ui/             # Base UI components (buttons, cards, etc.)
│   │   ├── CodeMirrorYamlEditor.tsx
│   │   ├── Footer.tsx
│   │   ├── Navbar.tsx
│   │   ├── Seo.tsx
│   │   └── theme-provider.tsx
│   ├── pages/              # Page components
│   │   ├── Home.tsx
│   │   ├── Contact.tsx
│   │   └── PlaygroundSimple.tsx
│   ├── lib/                # Utility libraries
│   │   ├── apiClient.ts
│   │   └── utils.ts
│   ├── backend/            # Backend logic
│   │   ├── yaml/           # YAML processing
│   │   └── server.ts
│   └── types/              # TypeScript type definitions
├── tests/                  # Test files
│   ├── e2e/               # End-to-end tests
│   ├── frontend/          # Frontend unit tests
│   ├── backend/           # Backend tests
│   ├── accessibility/     # Accessibility tests
│   ├── mobile/           # Mobile-specific tests
│   ├── performance/      # Performance tests
│   └── unit/             # Unit tests
├── docs/                  # Documentation
└── public/               # Static assets
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+

### Installation

```bash
git clone <repository-url>
cd cloudlint
npm install
```

### Development

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run test         # Run unit tests
npm run test:ui      # Run tests with UI
npm run e2e          # Run e2e tests
```

### Testing

```bash
npm run test:run     # Run all unit tests
npm run test:coverage # Run tests with coverage
npm run e2e          # Run e2e tests
npm run e2e:accessibility # Run accessibility tests
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
