# Kiro Integrated Terminal Guide

## ✅ What Works in Kiro's Terminal

Your awesome PowerShell customizations work perfectly in Kiro's integrated terminal!

### Features Active in Kiro Terminal:

✅ **Colorful Prompt**

- 🚀 Username and computer name with colors
- 📁 Current directory path
- 👻 Git branch with status emoji (👻 for changes, ✨ for clean)
- 🕐 Current time
- ✅/❌ Command status indicators

✅ **Quick Git Commands**

- `gst` - Git status with styled output
- `glog` - Git log with graph
- `gbr` - Git branches
- `gadd` - Git add
- `gcom` - Git commit
- `gpush` - Git push
- `gpull` - Git pull

✅ **Navigation Shortcuts**

- `..` - Go up one directory
- `...` - Go up two directories
- `....` - Go up three directories

✅ **Utility Commands**

- `ll` - List all files in table format
- `la` - List all files
- `c` - Clear screen with command reference

## ❌ What Doesn't Work in Kiro Terminal

❌ **Background Image**

- The ghost background image is specific to Windows Terminal
- Kiro's integrated terminal doesn't support background images
- This is a limitation of most IDE integrated terminals

## 🎨 How to Use

### In Kiro's Terminal:

1. Open terminal in Kiro (Ctrl+` or View > Terminal)
2. Your colorful prompt loads automatically
3. Use all the quick commands (gst, glog, etc.)
4. Enjoy the git branch indicators

### In Windows Terminal:

1. Open Windows Terminal
2. Get colorful prompt + ghost background image
3. Same commands work here too

## 💡 Best of Both Worlds

**Use Kiro Terminal for:**

- Quick git commands while coding
- Navigating your project
- Running builds and tests
- Seeing git status at a glance

**Use Windows Terminal for:**

- Full terminal experience with background
- Longer terminal sessions
- Multiple tabs/panes
- When you want the full aesthetic experience

## 🔧 Troubleshooting

### Prompt Not Showing Colors in Kiro?

1. Check if PowerShell profile is loaded:

   ```powershell
   Test-Path $PROFILE
   ```

2. Reload profile manually:

   ```powershell
   . $PROFILE
   ```

3. Restart Kiro terminal (close and reopen terminal pane)

### Commands Not Working?

Make sure you're using PowerShell, not CMD:

- Check terminal type in Kiro settings
- Default should be PowerShell

## 📚 Summary

Your PowerShell customizations are **universal** - they work everywhere PowerShell runs:

- ✅ Kiro integrated terminal
- ✅ Windows Terminal
- ✅ VS Code terminal
- ✅ PowerShell ISE
- ✅ Any PowerShell window

The only difference is the background image, which is exclusive to Windows Terminal.

**Enjoy your colorful terminal in Kiro!** 👻✨
