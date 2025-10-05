# Testing Guide

This project uses **Vitest** for unit testing, which is the perfect testing framework for Vite-based projects.

## 🧪 **Why Vitest?**

- ✅ **Native Vite Integration** - Built specifically for Vite projects
- ✅ **Fast HMR** - Instant test feedback during development  
- ✅ **TypeScript Support** - First-class TypeScript integration
- ✅ **Jest Compatible** - Familiar API if you know Jest
- ✅ **React Testing** - Excellent React component testing support

## 📦 **Testing Stack**

- **Vitest** - Test runner and framework
- **@testing-library/react** - React component testing utilities
- **@testing-library/jest-dom** - Custom Jest matchers for DOM assertions
- **@testing-library/user-event** - User interaction simulation
- **jsdom** - DOM environment for Node.js testing

## 🚀 **Available Scripts**

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once (CI/production)
npm run test:run

# Run tests with UI interface
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## 📁 **Test Structure**

```
tests/
├── __tests__/           # App-level tests
├── components/          # Component tests
└── ui/                  # UI component tests
```

## 🔧 **Configuration**

### Vitest Configuration
Tests are configured in `vite.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,           // Enable global test functions
    environment: 'jsdom',    // DOM environment for React testing
    setupFiles: ['./tests/setup.ts'], // Test setup file
    css: true,              // Process CSS imports
  },
})
```

### TypeScript Configuration
Test types are configured in `tsconfig.app.json`:

```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

## 📝 **Writing Tests**

### Basic Component Test

```typescript
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument()
  })

  it('handles click events', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    
    render(<Button onClick={handleClick}>Click me</Button>)
    
    await user.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
```

### Testing with Theme Provider

```typescript
import { render, screen } from '@testing-library/react'
import { ThemeProvider } from '@/components/theme-provider'
import { ModeToggle } from '@/components/mode-toggle'

const renderWithTheme = (component: React.ReactElement) => {
  return render(
    <ThemeProvider defaultTheme="light" storageKey="test-theme">
      {component}
    </ThemeProvider>
  )
}

describe('ModeToggle', () => {
  it('renders theme toggle', () => {
    renderWithTheme(<ModeToggle />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })
})
```

## 🎯 **Testing Best Practices**

### 1. **Test Behavior, Not Implementation**
```typescript
// ✅ Good - tests user behavior
it('shows error message when form is invalid', async () => {
  render(<LoginForm />)
  await user.click(screen.getByRole('button', { name: /submit/i }))
  expect(screen.getByText(/email is required/i)).toBeInTheDocument()
})

// ❌ Bad - tests implementation details
it('calls validateEmail function', () => {
  const validateEmailSpy = vi.spyOn(utils, 'validateEmail')
  render(<LoginForm />)
  expect(validateEmailSpy).toHaveBeenCalled()
})
```

### 2. **Use Accessible Queries**
```typescript
// ✅ Good - accessible queries
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
screen.getByText(/welcome/i)

// ❌ Bad - implementation-dependent queries
screen.getByClassName('submit-btn')
screen.getByTestId('email-input')
```

### 3. **Mock External Dependencies**
```typescript
// Mock API calls
vi.mock('@/lib/api', () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: 'John' })
}))

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)
```

### 4. **Test Edge Cases**
```typescript
describe('Button', () => {
  it('handles disabled state', () => {
    render(<Button disabled>Submit</Button>)
    expect(screen.getByRole('button')).toBeDisabled()
  })

  it('handles loading state', () => {
    render(<Button loading>Submit</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true')
  })
})
```

## 🔍 **Common Testing Patterns**

### User Interactions
```typescript
import userEvent from '@testing-library/user-event'

const user = userEvent.setup()

// Click
await user.click(screen.getByRole('button'))

// Type
await user.type(screen.getByLabelText(/email/i), 'test@example.com')

// Select
await user.selectOptions(screen.getByRole('combobox'), 'option1')

// Hover
await user.hover(screen.getByText('Tooltip trigger'))
```

### Async Testing
```typescript
// Wait for element to appear
await waitFor(() => {
  expect(screen.getByText('Success!')).toBeInTheDocument()
})

// Wait for element to disappear
await waitForElementToBeRemoved(screen.getByText('Loading...'))

// Find elements (built-in waiting)
const button = await screen.findByRole('button', { name: /submit/i })
```

### Form Testing
```typescript
it('submits form with valid data', async () => {
  const onSubmit = vi.fn()
  render(<ContactForm onSubmit={onSubmit} />)
  
  await user.type(screen.getByLabelText(/name/i), 'John Doe')
  await user.type(screen.getByLabelText(/email/i), 'john@example.com')
  await user.click(screen.getByRole('button', { name: /submit/i }))
  
  expect(onSubmit).toHaveBeenCalledWith({
    name: 'John Doe',
    email: 'john@example.com'
  })
})
```

## 🚨 **Troubleshooting**

### Common Issues

#### 1. **"Cannot find module" errors**
Make sure all testing dependencies are installed:
```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

#### 2. **TypeScript errors in tests**
Add Vitest types to your `tsconfig.json`:
```json
{
  "compilerOptions": {
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  }
}
```

#### 3. **DOM not available**
Ensure jsdom environment is configured:
```typescript
// vite.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom'
  }
})
```

#### 4. **CSS imports failing**
Enable CSS processing in Vitest:
```typescript
export default defineConfig({
  test: {
    css: true
  }
})
```

## 📊 **Coverage Reports**

Generate coverage reports:
```bash
npm run test:coverage
```

Coverage files are generated in `coverage/` directory:
- `coverage/index.html` - Interactive HTML report
- `coverage/lcov.info` - LCOV format for CI tools

## 🔄 **CI Integration**

Tests run automatically in GitHub Actions:

```yaml
- name: Run tests
  run: npm run test:run
```

The CI pipeline will fail if:
- Any tests fail
- Coverage drops below thresholds (if configured)
- TypeScript compilation errors in tests

## 📚 **Resources**

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)