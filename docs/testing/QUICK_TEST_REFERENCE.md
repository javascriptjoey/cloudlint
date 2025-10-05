# ⚡ Quick Test Reference Card

**Print this or keep it open while testing!**

---

## 🚀 **STARTUP COMMANDS**

### **Kill Everything:**

```powershell
taskkill /F /IM node.exe
```

### **Start Backend (Terminal 1):**

```bash
npm run dev:backend
```

**Check:** http://localhost:3001/health → should show "ok"

### **Start Frontend (Terminal 2):**

```bash
npm run dev
```

**Check:** http://localhost:5173/playground → should load

---

## ✅ **QUICK SMOKE TEST** (2 minutes)

1. Open http://localhost:5173/playground
2. Click "Load Sample"
3. Click "Validate"
4. **Expected:**
   - Toast appears (blue info message)
   - Auto-scrolls to results
   - "View Results" button appears
   - Results show 1 info message

**If this works → Proceed with full testing**

---

## 📋 **TEST CATEGORIES** (25 total)

- **Phase 1:** Core Functionality (3 tests)
- **Phase 2:** Real-time Validation (2 tests)
- **Phase 3:** Auto-fix (2 tests)
- **Phase 4:** Error Handling (3 tests)
- **Phase 5:** Provider Detection (3 tests)
- **Phase 6:** JSON Conversion (1 test)
- **Phase 7:** Performance (3 tests)
- **Phase 8:** Console Checks (2 tests)
- **Phase 9:** Accessibility (2 tests)
- **Phase 10:** Mobile (1 test)

---

## 🎯 **WHAT TO MARK**

For each test:

- [ ] PASS - Works as expected
- [ ] FAIL - Doesn't work, note issue
- [ ] SKIP - Can't test, note reason

---

## 🔍 **WHAT TO CHECK**

### **Every Test:**

- ✅ No console errors (F12)
- ✅ Expected behavior happens
- ✅ No crashes or freezes
- ✅ Toast messages accurate

### **Performance Tests:**

- ⏱️ Note actual time in seconds
- 📊 Compare to target time
- 🚀 Check if feels responsive

---

## 🐛 **COMMON ISSUES**

| Issue                  | Solution                       |
| ---------------------- | ------------------------------ |
| Backend not responding | Restart: `npm run dev:backend` |
| Frontend not loading   | Hard refresh: Ctrl+Shift+R     |
| Network errors         | Check backend terminal         |
| Validation slow        | Check backend for errors       |
| Console errors         | Note them, continue testing    |

---

## 📊 **PERFORMANCE TARGETS**

- **Validation:** < 2 seconds
- **Cache hit:** Instant (< 100ms)
- **Large file:** < 10 seconds
- **Auto-fix:** < 3 seconds
- **JSON convert:** < 1 second

---

## 🎨 **EXPECTED UX**

### **Sticky Buttons:**

- Always visible at bottom
- Backdrop blur effect
- Shadow for depth

### **Auto-scroll:**

- Smooth animation
- Scrolls to results after validation
- Not jarring or instant

### **View Results Button:**

- Appears after validation
- Shows badge with count
- Primary color (stands out)

---

## 📝 **QUICK NOTES TEMPLATE**

```
Test #: _____
Status: PASS / FAIL / SKIP
Time: _____ seconds (if applicable)
Issue: _____________________
Notes: _____________________
```

---

## 🚨 **STOP TESTING IF:**

1. ❌ Backend won't start (fix first)
2. ❌ Frontend won't load (fix first)
3. ❌ More than 5 tests fail (report issues)
4. ❌ Browser keeps crashing (restart everything)

**Otherwise, continue and document all issues!**

---

## ✅ **COMPLETION CHECKLIST**

After all 25 tests:

- [ ] All tests marked (PASS/FAIL/SKIP)
- [ ] Performance metrics noted
- [ ] Issues documented
- [ ] Summary filled out
- [ ] Ready to report results

---

## 📞 **REPORT FORMAT**

```
TESTING COMPLETE

Passed: _____ / 25
Failed: _____ / 25
Skipped: _____ / 25

Performance:
- Validation: _____ seconds
- Cache: _____ seconds
- Large file: _____ seconds

Critical Issues:
1. _____________________
2. _____________________

Minor Issues:
1. _____________________
2. _____________________

Overall Status: READY / NEEDS FIXES
```

---

**Keep this open while testing!** 📌

**Main Checklist:** COMPREHENSIVE_TESTING_CHECKLIST.md
