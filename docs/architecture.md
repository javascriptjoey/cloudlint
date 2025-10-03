# Cloudlint Architecture

## Overview

Cloudlint is built as a modern single-page application (SPA) with a clean separation between frontend and backend concerns. The architecture emphasizes performance, accessibility, and maintainability.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React SPA)   │◄──►│   (Express API) │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Frontend Architecture

### Component Hierarchy

```
App
├── ThemeProvider
├── BrowserRouter
├── Navbar
├── Routes
│   ├── Home
│   ├── PlaygroundSimple
│   └── Contact
├── Footer
└── Toaster
```

### Key Design Decisions

#### CodeMirror Integration

- **Why**: Professional code editing experience with syntax highlighting
- **Implementation**: Custom wrapper component with accessibility features
- **Benefits**: Better performance than textarea, syntax highlighting, extensible

#### React 19 Features

- **Concurrent Features**: Improved performance with automatic batching
- **Suspense**: Lazy loading of route components
- **Error Boundaries**: Graceful error handling

#### State Management

- **Local State**: React useState for component-specific state
- **Context**: Theme provider for global theme state
- **No External State Library**: Keeps bundle size small and complexity low

### Performance Optimizations

#### Code Splitting

```typescript
// Lazy loading of route components
const Home = lazy(() => import("@/pages/Home"));
const Contact = lazy(() => import("@/pages/Contact"));
const Playground = lazy(() => import("@/pages/PlaygroundSimple"));
```

#### Memoization

```typescript
// Memoized handlers to prevent unnecessary re-renders
const handleValidate = useCallback(() => {
  // validation logic
}, [yaml]);

// Memoized sample data
const sampleYaml = useMemo(() => `...`, []);
```

#### Bundle Optimization

- Tree shaking for unused code elimination
- Dynamic imports for route-based code splitting
- Optimized build with Vite

## Backend Architecture

### API Structure

```
/api/
├── /yaml/
│   ├── /validate     # YAML validation endpoint
│   ├── /convert      # YAML to JSON conversion
│   ├── /suggest      # Provider-specific suggestions
│   └── /autofix      # Automatic YAML fixes
├── /health           # Health check endpoint
└── /metrics          # Performance metrics
```

### YAML Processing Pipeline

```
Input YAML
    ↓
Parse & Validate Syntax
    ↓
Provider Detection (AWS/Azure/Generic)
    ↓
Schema Validation
    ↓
Security Checks (if enabled)
    ↓
Generate Response
```

### Key Components

#### YAML Parser

- **Library**: js-yaml
- **Features**: Safe parsing, custom schema support
- **Error Handling**: Detailed error messages with line numbers

#### Provider Detection

- **AWS**: CloudFormation template detection
- **Azure**: ARM template detection
- **Generic**: Standard YAML validation

#### Security Validation

- **Secret Detection**: Identifies potential secrets in YAML
- **Best Practices**: Enforces cloud security best practices
- **Configurable**: Can be enabled/disabled per request

## Data Flow

### Validation Flow

```
User Input (YAML)
    ↓
CodeMirror Editor
    ↓
React State Update
    ↓
API Request (/api/yaml/validate)
    ↓
Backend Processing
    ↓
Response (validation results)
    ↓
UI Update (success/error display)
```

### Conversion Flow

```
User Input (YAML)
    ↓
API Request (/api/yaml/convert)
    ↓
YAML → JSON Conversion
    ↓
Response (JSON output)
    ↓
Display in JSON Tab
```

## Security Architecture

### Input Validation

- **Size Limits**: Maximum file size restrictions
- **Content Filtering**: Malicious content detection
- **Rate Limiting**: API request throttling

### CORS Configuration

```typescript
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
    ],
    credentials: true,
  })
);
```

### Security Headers

- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## Error Handling

### Frontend Error Boundaries

```typescript
class ErrorBoundary extends Component {
  componentDidCatch(error, errorInfo) {
    // Log error and show fallback UI
  }
}
```

### API Error Responses

```typescript
{
  "error": true,
  "message": "Human-readable error message",
  "code": "ERROR_CODE",
  "details": {
    "line": 5,
    "column": 10,
    "context": "..."
  }
}
```

## Accessibility Architecture

### WCAG 2.1 AA Compliance

- **Semantic HTML**: Proper heading hierarchy, landmarks
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: Meets contrast requirements
- **Focus Management**: Visible focus indicators

### CodeMirror Accessibility

```typescript
// Hidden textarea for screen readers
<textarea
  aria-label="YAML input"
  className="sr-only"
  value={value}
  onChange={onChange}
/>
```

## Testing Architecture

### Test Pyramid

```
    E2E Tests (Playwright)
         ↑
    Integration Tests
         ↑
    Unit Tests (Vitest)
```

### Test Categories

- **Unit Tests**: Component and utility function testing
- **Integration Tests**: API endpoint testing
- **E2E Tests**: Full user workflow testing
- **Accessibility Tests**: WCAG compliance testing
- **Performance Tests**: Load and response time testing

## Deployment Architecture

### Build Process

```bash
npm run build
    ↓
TypeScript Compilation
    ↓
Vite Bundle Generation
    ↓
Asset Optimization
    ↓
Static Files Output
```

### Production Considerations

- **Static Hosting**: Can be deployed to CDN
- **API Hosting**: Node.js server deployment
- **Environment Variables**: Configuration management
- **Monitoring**: Error tracking and performance monitoring

## Scalability Considerations

### Frontend Scaling

- **CDN Distribution**: Static asset caching
- **Code Splitting**: Reduced initial bundle size
- **Lazy Loading**: On-demand resource loading

### Backend Scaling

- **Horizontal Scaling**: Multiple server instances
- **Caching**: Response caching for common validations
- **Rate Limiting**: Prevents abuse and ensures fair usage

## Future Architecture Considerations

### Potential Enhancements

- **WebAssembly**: For heavy YAML processing
- **Service Workers**: Offline functionality
- **Real-time Collaboration**: Multi-user editing
- **Plugin System**: Extensible validation rules

### Migration Paths

- **Microservices**: Split validation logic into separate services
- **Database Integration**: Store validation history
- **Authentication**: User accounts and preferences
