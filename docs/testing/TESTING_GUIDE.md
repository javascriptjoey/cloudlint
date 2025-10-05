# 🧪 Cloudlint Testing Guide

## Quick Start Testing

### 1. Start the Application

```bash
# Terminal 1: Start backend
npm run dev:backend

# Terminal 2: Start frontend
npm run dev
```

**Expected Output:**

- Backend: `[server] listening on http://localhost:3001`
- Frontend: `Local: http://localhost:5173/`

---

## 2. Test Basic Validation

### **Step 1: Load Sample YAML**

1. Navigate to http://localhost:5173/playground
2. Click **"Load Sample"** button
3. ✅ **Expected:** CloudFormation template loads in editor
4. ✅ **Expected:** Provider badge shows "aws (90%)" or similar

### **Step 2: Validate YAML**

1. Click **"Validate"** button
2. ✅ **Expected:** Button shows "Validating..." with spinner
3. ✅ **Expected:** After ~1-2 seconds, validation results appear
4. ✅ **Expected:** Toast notification shows success/error message
5. ✅ **Expected:** Validation tab shows detailed results

### **What to Check:**

- ✅ Provider detection badge updates
- ✅ Error/warning/info counts are correct
- ✅ Validation messages show line numbers
- ✅ Messages are color-coded (red=error, yellow=warning, blue=info)

---

## 3. Test Real-time Validation

### **Step 1: Enable Real-time**

1. Toggle **"Real-time"** switch to ON
2. ✅ **Expected:** Validate button shows "Real-time Active"
3. ✅ **Expected:** Validate button is disabled

### **Step 2: Edit YAML**

1. Start typing in the editor
2. ✅ **Expected:** After 1.5 seconds of no typing, validation runs automatically
3. ✅ **Expected:** Results update without clicking Validate

### **Step 3: Test Debouncing**

1. Type quickly for 5 seconds
2. Stop typing
3. ✅ **Expected:** Only ONE validation request after you stop
4. ✅ **Expected:** Check browser Network tab - should see single request

---

## 4. Test Auto-fix Feature

### **Step 1: Create Messy YAML**

Paste this intentionally messy YAML:

```yaml
# Badly formatted YAML
name:test
version:1.0.0
services:
web:
image:nginx
ports:
-80:80
database:
image:postgres
```

### **Step 2: Run Auto-fix**

1. Click **"Auto-fix"** button
2. ✅ **Expected:** Button shows "Fixing..." with spinner
3. ✅ **Expected:** Toast shows "Auto-fix complete! Applied X fixes"
4. ✅ **Expected:** Diff preview section appears below

### **Step 3: Review Diff**

1. Check the diff preview section
2. ✅ **Expected:** Shows unified diff with + and - lines
3. ✅ **Expected:** Badge shows "X fixes available"
4. ✅ **Expected:** Lists fixes applied (e.g., "prettier", "indent")

### **Step 4: Apply Fixes**

1. Click **"Apply Changes"** button
2. ✅ **Expected:** Editor content updates with fixed YAML
3. ✅ **Expected:** Diff preview section disappears
4. ✅ **Expected:** Toast shows "Auto-fix applied successfully!"

---

## 5. Test JSON Conversion

### **Step 1: Convert to JSON**

1. Load sample YAML or enter your own
2. Click **"Convert to JSON"** button
3. ✅ **Expected:** Button shows "Converting..." with spinner
4. ✅ **Expected:** JSON Output tab shows converted JSON
5. ✅ **Expected:** Toast shows "YAML converted to JSON successfully!"

### **Step 2: Copy JSON**

1. Switch to **"JSON Output"** tab
2. Click the copy button (clipboard icon)
3. ✅ **Expected:** Button turns green with checkmark
4. ✅ **Expected:** Toast shows "JSON copied to clipboard!"
5. ✅ **Expected:** Paste in text editor to verify

---

## 6. Test Suggestions System

### **Step 1: Load CloudFormation with Typos**

Paste this YAML with intentional typos:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Resources:
  MyBucket:
    Type: AWS::S3::Buckets # Wrong: should be "Bucket"
    Properties:
      BucketnName: my-bucket # Wrong: should be "BucketName"
```

### **Step 2: Load Suggestions**

1. Click **"Suggestions"** button
2. ✅ **Expected:** Button shows "Loading..." with spinner
3. ✅ **Expected:** Toast shows "Found X suggestions (Y high confidence)"
4. ✅ **Expected:** Suggestions section appears below

### **Step 3: Review Suggestions**

1. Check the suggestions section
2. ✅ **Expected:** Shows provider (AWS)
3. ✅ **Expected:** Lists suggestions with confidence scores
4. ✅ **Expected:** Categorized by type (add, rename, type)

---

## 7. Test Error Handling

### **Test 1: Empty Content**

1. Clear the editor
2. Click **"Validate"**
3. ✅ **Expected:** Toast shows "Please enter some YAML content to validate"

### **Test 2: Invalid YAML**

Paste this broken YAML:

```yaml
invalid: yaml: [
broken syntax
```

1. Click **"Validate"**
2. ✅ **Expected:** Validation fails
3. ✅ **Expected:** Error message shows "document is not well-formed"
4. ✅ **Expected:** Shows line and column numbers

### **Test 3: Network Error**

1. Stop the backend server (Ctrl+C in backend terminal)
2. Click **"Validate"**
3. ✅ **Expected:** Toast shows "Network error" or "Request timeout"
4. ✅ **Expected:** Error is handled gracefully (no crash)

### **Test 4: Large File**

1. Paste a very large YAML file (> 2MB)
2. Click **"Validate"**
3. ✅ **Expected:** Toast shows "File too large (max 2MB)"

---

## 8. Test Provider Detection

### **Test 1: AWS CloudFormation**

Paste this:

```yaml
AWSTemplateFormatVersion: "2010-09-09"
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
```

✅ **Expected:** Provider badge shows "aws" with high confidence (>80%)

### **Test 2: Azure Pipelines**

Paste this:

```yaml
trigger:
  - main

jobs:
  - job: Build
    steps:
      - script: echo "Hello Azure"
```

✅ **Expected:** Provider badge shows "azure" with high confidence

### **Test 3: Generic YAML**

Paste this:

```yaml
name: my-app
version: 1.0.0
config:
  debug: true
```

✅ **Expected:** Provider badge shows "generic" with low confidence

---

## 9. Test UI Features

### **Test 1: Theme Toggle**

1. Click **"Dark Mode"** button
2. ✅ **Expected:** UI switches to dark theme
3. ✅ **Expected:** Button changes to "Light Mode"
4. ✅ **Expected:** CodeMirror editor theme updates

### **Test 2: Security Checks**

1. Toggle **"Security Checks"** to ON
2. Validate YAML with potential secrets
3. ✅ **Expected:** Validation includes security warnings

### **Test 3: Copy YAML**

1. Enter some YAML
2. Click copy button next to "YAML Editor"
3. ✅ **Expected:** Button turns green with checkmark
4. ✅ **Expected:** Toast shows "YAML copied to clipboard!"

### **Test 4: Reset**

1. Load sample, validate, convert to JSON
2. Click **"Reset"** button
3. ✅ **Expected:** Editor clears
4. ✅ **Expected:** JSON output clears
5. ✅ **Expected:** Validation results clear
6. ✅ **Expected:** Toast shows "Reset complete"

---

## 10. Test Performance

### **Test 1: Validation Speed**

1. Load sample YAML (~100 lines)
2. Click **"Validate"**
3. ✅ **Expected:** Completes in < 2 seconds

### **Test 2: Large File Performance**

1. Paste 1000+ lines of YAML
2. Click **"Validate"**
3. ✅ **Expected:** Completes in < 10 seconds
4. ✅ **Expected:** UI remains responsive

### **Test 3: Cache Performance**

1. Validate the same YAML twice
2. ✅ **Expected:** Second validation is instant (cached)
3. ✅ **Expected:** Check console for cache hit logs

### **Test 4: Real-time Performance**

1. Enable real-time validation
2. Type continuously for 10 seconds
3. ✅ **Expected:** Only validates after you stop typing
4. ✅ **Expected:** No lag or freezing

---

## 11. Browser Console Checks

### **What to Look For:**

✅ **Validation Logs:**

```
🚀 Starting validation... {yaml: '...'}
🔍 Making API call to validate: ...
✅ API response received: {ok: false, messages: Array(1)}
📊 Validation result: {ok: false, messages: Array(1)}
📋 Current validation state: {isValidating: false, results: {...}}
```

✅ **Auto-fix Logs:**

```
🔍 Making API call to autofix: ...
✅ Autofix response received: {content: '...', fixesApplied: Array(5)}
🔄 Generating diff preview...
📊 Diff result: {diff: '...', before: '...', after: '...'}
🎯 Auto-fix state updated: {hasChanges: true, fixesApplied: Array(5), diff: 'present'}
```

❌ **No Errors:**

- No red error messages
- No "Cannot read property" errors
- No "undefined is not a function" errors
- No React hook warnings

---

## 12. Network Tab Checks

### **Open DevTools → Network Tab**

✅ **Validation Request:**

- Method: POST
- URL: http://localhost:3001/validate
- Status: 200 OK
- Response: JSON with validation results

✅ **Auto-fix Request:**

- Method: POST
- URL: http://localhost:3001/autofix
- Status: 200 OK
- Response: JSON with fixed content

✅ **Diff Preview Request:**

- Method: POST
- URL: http://localhost:3001/diff-preview
- Status: 200 OK
- Response: JSON with diff

✅ **No Failed Requests:**

- No 404 errors
- No 500 errors
- No CORS errors
- No timeout errors

---

## 13. Accessibility Testing

### **Keyboard Navigation:**

1. Press Tab to navigate through UI
2. ✅ **Expected:** Focus indicators visible
3. ✅ **Expected:** Can reach all interactive elements
4. ✅ **Expected:** Can activate buttons with Enter/Space

### **Screen Reader:**

1. Enable screen reader (NVDA/JAWS/VoiceOver)
2. ✅ **Expected:** All buttons have labels
3. ✅ **Expected:** Form controls have labels
4. ✅ **Expected:** Status messages are announced

### **Color Contrast:**

1. Check error messages (red)
2. Check warning messages (yellow)
3. Check info messages (blue)
4. ✅ **Expected:** All text meets WCAG AA contrast ratio

---

## 14. Mobile Testing

### **Responsive Design:**

1. Resize browser to mobile width (375px)
2. ✅ **Expected:** Layout adapts to mobile
3. ✅ **Expected:** Buttons stack vertically
4. ✅ **Expected:** Editor remains usable

### **Touch Interactions:**

1. Use touch events (or Chrome DevTools touch emulation)
2. ✅ **Expected:** Buttons respond to tap
3. ✅ **Expected:** Editor responds to touch
4. ✅ **Expected:** Scrolling works smoothly

---

## 15. Edge Cases

### **Test 1: Rapid Clicking**

1. Click **"Validate"** 10 times rapidly
2. ✅ **Expected:** Only one request sent (deduplication)
3. ✅ **Expected:** No duplicate results

### **Test 2: Concurrent Operations**

1. Click **"Validate"** and immediately click **"Auto-fix"**
2. ✅ **Expected:** Both operations complete
3. ✅ **Expected:** No race conditions

### **Test 3: Special Characters**

1. Paste YAML with emojis, unicode, special chars
2. ✅ **Expected:** Handles gracefully
3. ✅ **Expected:** No encoding errors

### **Test 4: Empty Lines**

1. Paste YAML with many empty lines
2. ✅ **Expected:** Validates correctly
3. ✅ **Expected:** Line numbers accurate

---

## 🎯 Success Criteria

### **All Tests Pass:**

- ✅ Basic validation working
- ✅ Real-time validation working
- ✅ Auto-fix with diff preview working
- ✅ JSON conversion working
- ✅ Suggestions system working
- ✅ Error handling working
- ✅ Provider detection working
- ✅ UI features working
- ✅ Performance acceptable
- ✅ No console errors
- ✅ No network errors
- ✅ Accessibility compliant
- ✅ Mobile responsive
- ✅ Edge cases handled

### **Ready for Production:**

- ✅ All features functional
- ✅ No critical bugs
- ✅ Performance meets targets
- ✅ Security measures in place
- ✅ Error handling comprehensive
- ✅ User experience polished

---

## 🐛 Troubleshooting

### **Backend Not Starting:**

```bash
# Check if port 3001 is in use
netstat -ano | findstr :3001

# Kill process if needed
taskkill /PID <PID> /F

# Restart backend
npm run dev:backend
```

### **Frontend Not Connecting:**

1. Check backend is running: http://localhost:3001/health
2. Check CORS configuration in server.ts
3. Check API_CONFIG.baseURL in src/lib/config.ts

### **Validation Not Working:**

1. Check browser console for errors
2. Check Network tab for failed requests
3. Check backend terminal for errors
4. Verify backend is on port 3001

### **Auto-fix Diff Not Showing:**

1. Check console for auto-fix logs
2. Verify `autoFix.canApply` is true
3. Check if `autoFix.diff` has content
4. Refresh page and try again

---

## 📊 Performance Benchmarks

### **Target Metrics:**

- Initial page load: < 3 seconds
- Validation (small file): < 2 seconds
- Validation (large file): < 15 seconds
- Auto-fix: < 3 seconds
- JSON conversion: < 1 second
- Real-time debounce: 1.5 seconds

### **How to Measure:**

1. Open DevTools → Performance tab
2. Click "Record"
3. Perform action
4. Stop recording
5. Check timing

---

**Happy Testing!** 🎉

If you encounter any issues, check the console logs and network tab first. Most issues can be diagnosed from the detailed logging we've added.
