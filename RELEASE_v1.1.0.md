## Wingetix v1.1.0 🚀

This major update introduces full bilingual support (English & Spanish), setup installer language selection, system component shielding, and comprehensive System Restore Point integration.

---

### 🌟 What's New & Key Highlights

#### 🌐 Full Bilingual Internationalization (English & Spanish)
- **Installer Language Selection**: You can now select your preferred language (English or Spanish) directly when running the installer. Wingetix will automatically configure itself in that language on its very first launch.
- **Header Brand Menu & Dynamic Language Switcher**: A sleek, new dropdown menu on the top-left title bar allows you to switch between English and Spanish instantly without restarting the application.
- **100% Comprehensive Translations**: All views, GPU telemetry, system health stats, software tables, modals, error dialogs, and progress bars now render seamlessly in both languages.

#### 🛡️ Windows System Component Shielding
- **Automatic Exclusion of Sensitive Runtimes**: To prevent accidental OS corruption or software crashes, critical Windows system libraries (.NET Framework, Visual C++ Redistributables, DirectX, and hardware drivers) are automatically protected and excluded from batch updates.
- **Special Clean Uninstaller Warnings**: System components are clearly marked with a security badge in the uninstaller. A strict countdown confirmation modal is enforced before attempting any removal.

#### 🔄 System Restore Points Enhancements
- Real-time detection and badge display of Windows System Protection status (**Active** / **Disabled**).
- Fast creation of custom manual restore points before applying major driver updates or uninstalling apps.
- Dynamic table rendering with translated snapshot types (System Checkpoints, Installations, Uninstallations, Drivers) and one-click restore / delete actions.

---

### 📦 Release Assets

- **`Wingetix Setup 1.1.0.exe`** *(Recommended)*: Official modern installer with language selector, desktop shortcut creation, and automatic WinGet terminal registration.
- **`Wingetix 1.1.0.exe`**: Portable standalone executable that runs without installation.

---

**Crafted with ❤️ by Jose Antonio Baeza Pineda ([@joselyky](https://github.com/joselyky))**
