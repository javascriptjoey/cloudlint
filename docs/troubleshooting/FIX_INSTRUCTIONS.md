# 🔧 IMMEDIATE FIX INSTRUCTIONS

**Issue:** Double page load still happening  
**Cause:** Old Node processes still running with old code

---

## ⚡ **QUICK FIX (Do This Now)**

### **Option 1: Use PowerShell Script (Easiest)**

```powershell
# In PowerShell, run:
.\restart-clean.ps1
```

This will kill all Node processes automatically.

### **Option 2: Manual Kill (If script doesn't work)**

```powershell
# Kill all Node processes
taskkill /F /IM node.exe

# Wait 3 seconds
Start-Sleep -Seconds 3

# Verify they're gone
Get-Process -Name node -ErrorAction SilentlyContinue
# Should show nothing
```

---

## 🚀 **THEN START FRESH**

### **Terminal 1: Start Backend**

```bash
npm run dev:backend
```

**✅ MUST SEE THIS LINE:**

```
[server] development mode - static file serving disabled (use Vite dev server)
```

**❌ If you see this, the fix didn't work:**

```
[server] serving static from C:\Users\...
```

### **Terminal 2: Start Frontend**

```bash
npm run dev
```

---

## 🧪 **TEST THE FIX**

1. Open: `http://localhost:5173/`
2. Watch carefully as page loads
3. **Expected:** Single smooth page load, no flash
4. **If still flashing:** Backend is still serving static files

---

## 🔍 **TROUBLESHOOTING**

### **Problem: Backend still shows "serving static from"**

**Solution:**

1. Check backend terminal output carefully
2. Make sure you see "development mode" message
3. If not, the old process is still running
4. Kill ALL Node processes again
5. Restart backend

### **Problem: Can't kill Node processes**

**Solution:**

```powershell
# Force kill with admin rights
# Run PowerShell as Administrator, then:
Get-Process -Name node | Stop-Process -Force
```

### **Problem: Still seeing double page load**

**Checklist:**

- [ ] All Node processes killed?
- [ ] Backend restarted?
- [ ] Backend shows "development mode" message?
- [ ] Frontend restarted?
- [ ] Browser hard refresh (Ctrl+Shift+R)?
- [ ] Browser cache cleared?

---

## 📊 **VERIFICATION CHECKLIST**

Before testing, verify:

- [ ] Killed all Node processes
- [ ] Backend terminal shows: "development mode - static file serving disabled"
- [ ] Backend does NOT show: "serving static from"
- [ ] Frontend running on port 5173
- [ ] Browser at `http://localhost:5173/`
- [ ] Single page load, no flash

---

## 🆘 **IF STILL NOT WORKING**

### **Check 1: Backend Terminal Output**

Copy and paste the EXACT output from your backend terminal, especially these lines:

```
[server] starting...
[server] env: { ... }
[server] ??? <- What does this line say?
[server] listening on http://localhost:3001
```

### **Check 2: Node Process Count**

```powershell
Get-Process -Name node | Measure-Object | Select-Object Count
```

Should show: **Count: 2** (one for backend, one for frontend)

If more than 2, kill all and restart.

### **Check 3: Browser Cache**

1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Try again

---

## 📝 **WHAT THE FIX DOES**

### **Code Change in `src/server.ts`:**

**Before:**

```typescript
// Always served static if dist exists
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir)); // ❌ Wrong!
}
```

**After:**

```typescript
// Only serve static in production
if (process.env.NODE_ENV === "production" || process.env.SERVE_STATIC === "1") {
  app.use(express.static(distDir)); // ✅ Correct!
} else {
  console.log("[server] development mode - static file serving disabled");
}
```

---

## ✅ **SUCCESS CRITERIA**

You'll know it's fixed when:

1. ✅ Backend shows "development mode" message
2. ✅ Single page loads smoothly
3. ✅ No page flash or flicker
4. ✅ Consistent page title
5. ✅ Professional appearance

---

**DO THIS NOW:**

1. Run: `taskkill /F /IM node.exe`
2. Wait 3 seconds
3. Start backend: `npm run dev:backend`
4. Check for "development mode" message
5. Start frontend: `npm run dev`
6. Test: `http://localhost:5173/`

**Report back:** Does backend show "development mode" message? YES/NO
