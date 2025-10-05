# ⚡ Cloudlint Quick Start

## 🚀 Start the Application

```bash
# Terminal 1: Backend
npm run dev:backend

# Terminal 2: Frontend
npm run dev
```

**Open:** http://localhost:5173/playground

---

## ✅ Quick Test (2 minutes)

1. Click **"Load Sample"**
2. Click **"Validate"**
3. Check results appear
4. Check provider badge shows "aws (90%)"

**✅ If this works, everything is working!**

---

## 🧪 Test Auto-fix (2 minutes)

Paste this messy YAML:

```yaml
name:test
version:1.0.0
services:
web:
image:nginx
```

1. Click **"Auto-fix"**
2. Check diff preview appears
3. Click **"Apply Changes"**
4. Verify YAML is fixed

---

## 🔄 Test Real-time (1 minute)

1. Toggle **"Real-time"** ON
2. Start typing
3. Wait 1.5 seconds
4. Check validation runs automatically

---

## 📊 What to Check

### **Console (F12):**

✅ Should see:

```
🚀 Starting validation...
🔍 Making API call to validate: ...
✅ API response received: {...}
📊 Validation result: {...}
```

❌ Should NOT see:

- Red error messages
- "Cannot read property" errors
- React hook warnings

### **Network Tab:**

✅ Should see:

- POST http://localhost:3001/validate → 200 OK
- POST http://localhost:3001/autofix → 200 OK

❌ Should NOT see:

- 404 errors
- 500 errors
- CORS errors

---

## 🐛 Troubleshooting

### **Backend not starting:**

```bash
netstat -ano | findstr :3001
taskkill /PID <PID> /F
npm run dev:backend
```

### **Frontend not connecting:**

- Check: http://localhost:3001/health
- Should see: "ok"

### **Validation not working:**

1. Check browser console
2. Check Network tab
3. Check backend terminal

---

## 📚 Full Documentation

- **IMPLEMENTATION_COMPLETE.md** - What was done
- **BACKEND_FRONTEND_INTEGRATION_AUDIT.md** - Complete audit
- **TESTING_GUIDE.md** - Comprehensive testing (15 scenarios)

---

## ✅ Success Criteria

- ✅ Backend running on port 3001
- ✅ Frontend loads at localhost:5173
- ✅ Sample YAML loads
- ✅ Validation works
- ✅ Provider detection shows "aws"
- ✅ Auto-fix shows diff preview
- ✅ Real-time validation works
- ✅ No console errors
- ✅ No network errors

**If all checked, you're ready to go!** 🎉

---

## 🎯 Key Features Working

- ✅ Real YAML validation (yamllint, cfn-lint, spectral)
- ✅ Real-time validation with 1.5s debounce
- ✅ Auto-fix with diff preview
- ✅ Provider detection (AWS/Azure/Generic)
- ✅ Suggestions system
- ✅ JSON conversion
- ✅ Copy to clipboard
- ✅ Theme toggle
- ✅ Security checks

---

**Need help?** Check TESTING_GUIDE.md for detailed instructions!
