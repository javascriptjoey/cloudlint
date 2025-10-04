# 👻 Awesome Ghost Terminal Setup Guide

## Overview

This guide documents the custom PowerShell terminal configuration with colorful prompts, emojis, and git integration for an enhanced developer experience.

---

## ✨ Features

### Visual Enhancements

- **👻 Ghost emoji** - Appears when you have uncommitted changes in your git branch
- **✨ Sparkle emoji** - Appears when your branch is clean (no uncommitted changes)
- **🚀 Colorful prompt** - Shows username, computer name, current path, git branch, and time
- **✅/❌ Status indicators** - Visual feedback for command success/failure
- **📁 Smart path display** - Home directory shown as `~` for cleaner display
- **🕐 Real-time clock** - Current time displayed in prompt

### Prompt Layout

```
╭─ 🚀 username @ computername 📁 ~/path/to/directory 👻 (branch-name) 🕐 11:45:30 ✅
╰─❯
```

---

## 🚀 Quick Commands Reference

### Git Commands with Emojis

| Command | Description                          | Emoji |
| ------- | ------------------------------------ | ----- |
| `gst`   | Git status with styled output        | 👻    |
| `glog`  | Git log with graph (last 10 commits) | 📜    |
| `gbr`   | Git branches (all branches)          | 🌿    |
| `gadd`  | Git add files                        | ➕    |
| `gcom`  | Git commit                           | 💾    |
| `gpush` | Git push                             | 🚀    |
| `gpull` | Git pull                             | ⬇️    |

### Navigation Commands

| Command | Description             | Emoji  |
| ------- | ----------------------- | ------ |
| `..`    | Go up one directory     | ⬆️     |
| `...`   | Go up two directories   | ⬆️⬆️   |
| `....`  | Go up three directories | ⬆️⬆️⬆️ |

### Utility Commands

| Command | Description                                       | Emoji |
| ------- | ------------------------------------------------- | ----- |
| `ll`    | List all files (including hidden) in table format | 📋    |
| `la`    | List all files (including hidden)                 | 📋    |
| `c`     | Clear screen and show command reference           | 🧹    |

---

## 📦 Installation

### Prerequisites

- Windows PowerShell 5.1 or later
- Git installed and configured
- PowerShell execution policy set to allow scripts

### Setup Steps

1. **Check PowerShell Profile Location**

   ```powershell
   $PROFILE
   ```

   This will show your profile path (usually `C:\Users\YourName\OneDrive\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`)

2. **Verify Profile Exists**

   ```powershell
   Test-Path $PROFILE
   ```

   If it returns `False`, create it:

   ```powershell
   New-Item -Path $PROFILE -Type File -Force
   ```

3. **Edit Profile**
   The profile is already configured with the ghost theme. To view it:

   ```powershell
   notepad $PROFILE
   ```

4. **Reload Profile**
   After making changes, reload the profile:
   ```powershell
   . $PROFILE
   ```
   Or simply restart your terminal.

---

## 🎨 Customization

### Changing Colors

The prompt uses these PowerShell colors:

- `Cyan` - Emojis and decorative elements
- `Green` - Username
- `Yellow` - Computer name
- `Blue` - Current path
- `Magenta` - Git branch
- `DarkGray` - Time and borders
- `White` - Status emoji

To change colors, edit the `prompt` function in your `$PROFILE` file and modify the `-ForegroundColor` parameters.

### Changing Emojis

To customize emojis, edit these sections in your `$PROFILE`:

```powershell
# Git status emojis
$emoji = if ($status) { "👻" } else { "✨" }

# Status emojis
$statusEmoji = if ($lastSuccess) { "✅" } else { "❌" }
```

### Adding Custom Aliases

Add new aliases at the end of your profile:

```powershell
function my-custom-command {
    Write-Host "🎯 My Custom Command:" -ForegroundColor Cyan
    # Your command here
}
Set-Alias -Name myalias -Value my-custom-command
```

---

## 🔧 Troubleshooting

### Error: "Execution Policy Restricted"

If you see an error about execution policy, run PowerShell as Administrator and execute:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Error: "Alias is not writeable"

Some aliases like `gc` and `gp` are reserved by PowerShell. The ghost theme uses alternative names:

- Use `gcom` instead of `gc` for git commit
- Use `gpush` instead of `gp` for git push

### Git Branch Not Showing

Ensure you're in a git repository. The branch will only show when you're inside a git-tracked directory.

### Colors Not Displaying

Ensure your terminal supports ANSI colors. Windows Terminal, PowerShell 7, and modern terminals support this by default.

---

## 📸 Examples

### Clean Branch (No Changes)

```
╭─ 🚀 javas @ PYSHELL 📁 ~/Development/kiro-projects/cloudlint ✨ (main) 🕐 11:45:30 ✅
╰─❯
```

### Dirty Branch (Uncommitted Changes)

```
╭─ 🚀 javas @ PYSHELL 📁 ~/Development/kiro-projects/cloudlint 👻 (feature/new-feature) 🕐 11:45:30 ✅
╰─❯
```

### After Failed Command

```
╭─ 🚀 javas @ PYSHELL 📁 ~/Development/kiro-projects/cloudlint ✨ (main) 🕐 11:45:30 ❌
╰─❯
```

### Git Status Output

```
👻 Git Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
On branch feature/phase7-documentation-polish
Changes not staged for commit:
  modified:   README.md
```

### Git Log Output

```
📜 Git Log:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
* 6d57236 (HEAD -> feature/phase7-documentation-polish) feat: Integrate comprehensive gap checklist
* 1c8b8b8 docs: Mark Phase 7 as COMPLETE
* 49a82cb docs: Update all documentation files
```

---

## 🎯 Best Practices

### Using Quick Commands

1. **Check status before committing**

   ```powershell
   gst
   ```

2. **Add files**

   ```powershell
   gadd .
   ```

3. **Commit with message**

   ```powershell
   gcom -m "feat: Add new feature"
   ```

4. **Push to remote**
   ```powershell
   gpush origin branch-name
   ```

### Navigation Tips

- Use `..` to quickly go up directories instead of typing `cd ..`
- Use `ll` to see all files including hidden ones
- Use `c` to clear and see the command reference

### Git Workflow

The ghost emoji (👻) reminds you when you have uncommitted changes, helping you maintain a clean git workflow.

---

## 🔄 Updates and Maintenance

### Updating the Profile

To update your profile:

1. Edit the profile file:

   ```powershell
   notepad $PROFILE
   ```

2. Make your changes

3. Save and reload:
   ```powershell
   . $PROFILE
   ```

### Backing Up Your Profile

It's a good idea to back up your profile:

```powershell
Copy-Item $PROFILE -Destination "$HOME\Desktop\PowerShell_Profile_Backup.ps1"
```

### Version Control

Consider adding your PowerShell profile to version control:

```powershell
# Create a symlink or copy to your dotfiles repo
Copy-Item $PROFILE -Destination "C:\path\to\dotfiles\PowerShell_profile.ps1"
```

---

## 📚 Additional Resources

- [PowerShell Documentation](https://docs.microsoft.com/en-us/powershell/)
- [Windows Terminal Documentation](https://docs.microsoft.com/en-us/windows/terminal/)
- [Git Documentation](https://git-scm.com/doc)
- [PowerShell Prompt Customization](https://docs.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_prompts)

---

## 🎉 Enjoy Your Awesome Ghost Terminal!

Your terminal is now supercharged with colors, emojis, and productivity shortcuts. Happy coding! 👻✨

---

**Last Updated:** January 4, 2025  
**Version:** 1.0.0  
**Maintained by:** Kiro Development Team
