# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project: cloudlint (React 19 + TypeScript + Vite + Tailwind v4 + shadcn/ui)

Common commands (Windows PowerShell, Node ≥ 20, npm ≥ 10)
- Install deps: npm install
- Start dev server: npm run dev
- Build (type-check + bundle): npm run build
- Preview production build: npm run preview
- Lint all files: npm run lint
- Type-check app: npm run type-check
- Type-check tests: npm run type-check:test
- Run tests (watch): npm run test
- Run tests once (CI): npm run test:run
- Run tests with coverage: npm run test:coverage
- Run a single test file (watch): npm run test -- tests/ui/button.test.tsx
- Run a single test by name: npm run test -- -t "renders the main application"

Notes
- GitHub Pages base path: vite.config.ts switches base when GITHUB_PAGES='true'. To build for Pages in PowerShell: $env:GITHUB_PAGES='true'; npm run build
- Path alias @ resolves to ./src/ in both Vite and Vitest.
- Engines enforced via package.json: Node ≥ 20, npm ≥ 10.

High-level architecture
- Tooling and configuration
  - Vite (vite.config.ts):
    - Plugins: @vitejs/plugin-react, @tailwindcss/vite (Tailwind v4 integration)
    - Alias: '@' → ./src
    - base: '/' locally; '/cloudlint/' when building with GITHUB_PAGES=true (for GitHub Pages)
    - build: dist output with sourcemaps
  - TypeScript (tsconfig.json with project refs → tsconfig.app.json, tsconfig.test.json, tsconfig.node.json):
    - Bundler moduleResolution, strict settings, JSX: react-jsx
    - Paths: '@/*' → 'src/*'
  - ESLint (eslint.config.js):
    - @eslint/js + typescript-eslint + react-hooks + react-refresh (Vite)
    - Ignores dist
  - Testing (vitest.config.ts):
    - Environment: jsdom, globals enabled
    - setupFiles: tests/setup.ts (global DOM/localStorage/matchMedia mocks + cleanup)
    - Includes tests in tests/**/* and src/**/*

- Application layout (src/)
  - Entry: src/main.tsx renders <App /> into #root with React StrictMode.
  - App shell: src/App.tsx wraps content in ThemeProvider and uses shadcn/ui Button and a ModeToggle control.
  - Theming: src/components/theme-provider.tsx
    - Supports 'light' | 'dark' | 'system'; persists to localStorage; applies the theme class to document.documentElement.
  - UI controls:
    - src/components/mode-toggle.tsx: Radix Dropdown-based theme switcher using lucide-react icons and shadcn/ui Button.
    - src/components/ui/*: shadcn/ui primitives (e.g., button, dropdown-menu).
  - Utilities: src/lib/utils.ts exports cn(...) combining clsx + tailwind-merge for className composition.
  - Types: src/types/global.d.ts adds CSS module declarations.

- Testing structure
  - Global setup: tests/setup.ts provides jsdom/Jest DOM matchers, localStorage and matchMedia mocks, cleanup hooks; exported mocks are reused by component tests.
  - Test locations: both tests/** and src/** are included. Example suites:
    - tests/__tests__/App.test.tsx (app rendering and layout)
    - tests/ui/button.test.tsx (shadcn/ui Button behavior)
    - src/components/__tests__/* (component-scoped tests including ThemeProvider and ModeToggle)
  - Running a single test:
    - By file: npm run test -- src/components/__tests__/mode-toggle.test.tsx
    - By name: npm run test -- -t "shows theme options when clicked"

shadcn/ui usage
- Add a component: npx shadcn@latest add <component-name>
- Components live under src/components/ui and integrate with Tailwind v4.

Important from README
- Tech stack: React 19, TypeScript, Vite, Tailwind CSS v4, shadcn/ui, Lucide icons, Vitest + Testing Library, ESLint.
- Development targets Node 20.x.
- The repo mentions GitHub Pages deployment; base path logic is already encoded in vite.config.ts.
