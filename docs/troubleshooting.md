# 🔧 Troubleshooting Guide

## Common Issues and Solutions

---

## Issue #1: Double Page Load / Flash on Startup

**Symptoms:**

- Two different pages flash when loading `http://localhost:5173/`
- First shows gray box or loading state
- Then shows actual page content
- Jarring visual experience

**Root Cause:**
React Suspense fallback showing while lazy-loaded components load. The Home page was being lazy-loaded, causing a visible delay.

**Solution:**

1. **Eager load the Home page** (remove lazy loading)
2. **Improve Suspense fallback** (small spinner instead of gray box)
3. **Clear Vite cache** if changes don't take effect

**Code Fix:**

```tsx
// src/App.tsx

// BEFORE: Lazy loaded (caused flash)
const Home = lazy(() => import("@/pages/Home"));

// AFTER: Eager loaded (instant display)
import Home from "@/pages/Home";

// BEFORE: Large gray box fallback
<Suspense fallback={
  <div className="container mx-auto px-4 py-8">
    <div className="animate-pulse h-32 bg-muted rounded"></div>
  </div>
}>

// AFTER: Small centered spinner
<Suspense fallback={
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
  </div>
}>
```

**If Changes Don't Take Effect:**

```bash
# Clear Vite cache
Remove-Item -Path "node_modules/.vite" -Recurse -Force

# Restart frontend
npm run dev
```

**Prevention:**

- Eager load critical pages (Home, Playground)
- Lazy load secondary pages (Contact, About)
- Use subtle loading indicators
- Test with hard refresh (Ctrl+Shift+R)

---

## Issue #2: Backend Serving Static Files in Development

**Symptoms:**

- Backend logs show "serving static from dist/"
- Conflicts with Vite dev server
- Potential routing issues

**Root Cause:**
Backend configured to serve static files whenever `dist/` folder exists, regardless of environment.

**Solution:**
Only serve static files in production mode.

**Code Fix:**

```typescript
// src/server.ts

// BEFORE: Always served if dist exists
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
}

// AFTER: Only in production
if (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "1") {
  app.use(express.static(distDir));
} else {
  console.log("[server] development mode - static file serving disabled");
}
```

**Verification:**
Backend should log: `[server] development mode - static file serving disabled`

**Prevention:**

- Don't run `npm run build` during development
- Delete `dist/` folder if accidentally created
- Check backend logs on startup

---

## Issue #3: Stale Node Processes

**Symptoms:**

- Code changes don't take effect
- Old behavior persists after fixes
- Multiple Node processes running

**Root Cause:**
Old Node processes still running with old code.

**Solution:**
Kill all Node processes and restart.

**Commands:**

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Verify they're gone
Get-Process -Name node -ErrorAction SilentlyContinue

# Restart servers
# Terminal 1: npm run dev:backend
# Terminal 2: npm run dev
```

**Prevention:**

- Always stop servers properly (Ctrl+C)
- Use the restart-clean.ps1 script
- Check for orphaned processes periodically

---

## Issue #4: Vite Cache Issues

**Symptoms:**

- Changes to imports don't take effect
- Hot module reload not working
- Stale components loading

**Root Cause:**
Vite's cache contains old module information.

**Solution:**
Clear Vite cache and restart.

**Commands:**

```powershell
# Clear Vite cache
Remove-Item -Path "node_modules/.vite" -Recurse -Force

# Restart frontend
npm run dev
```

**Prevention:**

- Hard refresh browser (Ctrl+Shift+R)
- Clear cache when changing imports
- Restart dev server after major changes

---

## Issue #5: TypeScript Errors Not Showing

**Symptoms:**

- IDE shows errors but compilation passes
- Type errors in editor but app runs

**Root Cause:**
IDE TypeScript server out of sync with actual compilation.

**Solution:**
Restart TypeScript server or run type check.

**Commands:**

```bash
# Run type check
npm run type-check

# In VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

---

## Issue #6: Port Already in Use

**Symptoms:**

- "EADDRINUSE" error
- Server won't start
- Port conflict

**Root Cause:**
Another process using the port.

**Solution:**
Find and kill the process using the port.

**Commands:**

```powershell
# Find process on port 3001
netstat -ano | findstr :3001

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or kill all Node processes
taskkill /F /IM node.exe
```

---

## Issue #7: CORS Errors

**Symptoms:**

- "CORS policy" errors in console
- API requests blocked
- Network errors

**Root Cause:**
CORS not configured properly or wrong origin.

**Solution:**
Check CORS configuration in backend.

**Code Check:**

```typescript
// src/server.ts
app.use(
  cors({
    origin: process.env.NODE_ENV === "production" ? false : true,
    credentials: false,
    maxAge: 86400,
  })
);
```

**Verification:**

- Development: CORS should allow all origins
- Production: Configure specific origins

---

## Issue #8: Validation Not Working

**Symptoms:**

- Click "Validate" but nothing happens
- No results appear
- No errors in console

**Root Cause:**
Backend not running or API client misconfigured.

**Solution:**

1. Check backend is running: http://localhost:3001/health
2. Check browser Network tab for failed requests
3. Check console for errors
4. Verify API_CONFIG.baseURL in src/lib/config.ts

**Verification:**

```typescript
// src/lib/config.ts
export const API_CONFIG = {
  baseURL:
    process.env.NODE_ENV === "production" ? "/api" : "http://localhost:3001",
  // ...
};
```

---

## Issue #9: Auto-fix Diff Not Showing

**Symptoms:**

- Click "Auto-fix" but no diff preview
- Toast shows fixes applied but no UI
- canApply is true but section not visible

**Root Cause:**
Conditional rendering not triggering or state not updating.

**Solution:**
Check auto-fix state and conditional logic.

**Debug:**

```typescript
// Add temporary logging
console.log("AutoFix state:", {
  diff: autoFix.diff ? "present" : "null",
  canApply: autoFix.canApply,
  fixCount: autoFix.fixCount,
});
```

**Verification:**
Diff preview section should appear when `autoFix.canApply || autoFix.diff` is true.

---

## Issue #10: Real-time Validation Not Working

**Symptoms:**

- Toggle real-time ON but validation doesn't run
- No automatic validation after typing
- Debouncing not working

**Root Cause:**
Debounce function not set up correctly or useEffect not triggering.

**Solution:**
Check useValidation hook implementation.

**Verification:**

- Debounce delay: 1.5 seconds
- Should validate after stopping typing
- Check console for validation logs

---

## General Debugging Steps

### **1. Check Browser Console (F12)**

- Look for red error messages
- Check for React warnings
- Verify API responses

### **2. Check Network Tab**

- Verify requests going to correct URLs
- Check response status codes
- Verify response content

### **3. Check Backend Terminal**

- Look for error messages
- Verify requests being received
- Check response times

### **4. Check Frontend Terminal**

- Look for build errors
- Check for hot reload messages
- Verify no compilation errors

### **5. Hard Refresh**

- Press Ctrl+Shift+R
- Clears browser cache
- Forces fresh load

### **6. Restart Everything**

```bash
# Kill all processes
taskkill /F /IM node.exe

# Start fresh
npm run dev:backend  # Terminal 1
npm run dev          # Terminal 2
```

---

## Performance Issues

### **Slow Validation:**

- Check backend terminal for errors
- Verify file size within limits (< 2MB)
- Check system resources
- Try smaller YAML first

### **Memory Leaks:**

- Check browser Task Manager
- Look for growing memory usage
- Restart browser if needed
- Check for unclosed connections

### **Slow Page Load:**

- Check bundle size: `npm run build -- --analyze`
- Verify code splitting working
- Check network throttling in DevTools
- Test on fast connection

---

## Quick Reference Commands

### **Development:**

```bash
npm run dev:backend    # Start backend
npm run dev            # Start frontend
npm run type-check     # Check TypeScript
npm run lint           # Check linting
```

### **Testing:**

```bash
npm run test:run       # Unit tests
npm run e2e            # E2E tests
npm run e2e:accessibility  # Accessibility tests
```

### **Cleanup:**

```powershell
taskkill /F /IM node.exe  # Kill all Node
Remove-Item -Path "node_modules/.vite" -Recurse -Force  # Clear Vite cache
Remove-Item -Path "dist" -Recurse -Force  # Remove old build
```

### **Production:**

```bash
npm run build          # Build for production
npm run preview        # Preview production build
```

---

## Getting Help

### **If Stuck:**

1. Check this troubleshooting guide
2. Review error messages carefully
3. Check browser console and Network tab
4. Verify both servers running
5. Try restarting everything
6. Document the issue and ask for help

### **Useful Resources:**

- `TESTING_GUIDE.md` - Comprehensive testing examples
- `QUICK_TEST_REFERENCE.md` - Quick reference card
- `docs/architecture.md` - System architecture
- `docs/frontend.md` - Frontend guide

---

**Last Updated:** January 4, 2025  
**Maintained By:** Cloudlint Team
