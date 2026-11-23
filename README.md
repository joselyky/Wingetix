<div align="center">

  > **100% Free Forever & Open Source (GPLv3) — Zero Ads, Zero Telemetry, No Premium Tier.**

  <br />

  <img src="logo.png" alt="Wingetix Logo" width="120" height="120" style="border-radius: 50%; box-shadow: 0 8px 32px rgba(110, 231, 183, 0.4);" />

  # Wingetix

  ### *The Ultimate Visual Control Panel for Windows Software & Modern WinGet GUI*

  [![GitHub Release](https://img.shields.io/github/v/release/joselyky/Wingetix?color=6ee7b7&label=Release&style=for-the-badge)](https://github.com/joselyky/Wingetix/releases/latest)
  [![GitHub Downloads](https://img.shields.io/github/downloads/joselyky/Wingetix/total?color=38bdf8&label=Downloads&style=for-the-badge&logo=github)](https://github.com/joselyky/Wingetix/releases)
  [![GitHub Stars](https://img.shields.io/github/stars/joselyky/Wingetix?style=for-the-badge&color=fbbf24&logo=github)](https://github.com/joselyky/Wingetix/stargazers)
  [![VirusTotal](https://img.shields.io/badge/VirusTotal-0%2F70%20Clean-10b981?style=for-the-badge&logo=virustotal&logoColor=white)](https://github.com/joselyky/Wingetix/releases/latest)
  [![Zero Telemetry](https://img.shields.io/badge/Privacy-Zero%20Ads%20%7C%20Zero%20Telemetry-8b5cf6?style=for-the-badge)](#-security-trust--guaranteed-privacy)
  [![AlternativeTo](https://img.shields.io/badge/AlternativeTo-Vote%20for%20Wingetix-0072C6?style=for-the-badge&logo=alternativeto&logoColor=white)](https://alternativeto.net/software/wingetix/)
  [![Website](https://img.shields.io/badge/Website-wingetix.com-10b981?style=for-the-badge&logo=googlechrome&logoColor=white)](https://wingetix.com)
  [![Platform](https://img.shields.io/badge/Platform-Windows%2010%20%7C%2011-0078d4?style=for-the-badge&logo=windows)](https://github.com/joselyky/Wingetix)
  [![License](https://img.shields.io/badge/License-GPLv3-34d399?style=for-the-badge)](LICENSE)

  <br />

  <p align="center">
    <b>Wingetix</b> transforms the official Microsoft Windows Package Manager (<code>winget</code>) into a sleek, responsive, and intuitive desktop experience. Scan installed programs in seconds, 1-click batch update all outdated software, deeply uninstall bloatware without leaving registry residue, and safeguard your PC with native system restore points and launcher armor.
  </p>

  <p align="center">
    <a href="https://wingetix.com"><strong>Official Website »</strong></a> •
    <a href="#-download--installation"><strong>Download App »</strong></a> •
    <a href="#-interface-showcase--visual-tour">Screenshots</a> •
    <a href="#-key-features">Key Features</a> •
    <a href="#-why-wingetix-comparison">Comparison</a> •
    <a href="#-security--guaranteed-privacy">Security & Trust</a> •
    <a href="#-build-from-source">Build from Source</a>
  </p>

  <br />

  <p align="center">
    <a href="screenshot-v1.1.1-hd.png" title="Click to view full-resolution preview">
    <img src="screenshot-v1.1.1-hd.png" alt="Wingetix Interface Preview" width="940" style="max-width: 100%; border-radius: 12px; box-shadow: 0 12px 36px rgba(0, 0, 0, 0.6);" />
  </a>
  </p>

</div>

---

## ⚡ Quick Install via Windows Terminal

You can install Wingetix with a single terminal command via Microsoft WinGet:

```powershell
winget install wingetix
```

*(Or download the standalone GUI installer from [Releases](https://github.com/joselyky/Wingetix/releases/latest) or [wingetix.com](https://wingetix.com)).*

---

## 💡 What is Wingetix?

Microsoft WinGet is powerful, but running PowerShell, remembering command flags, and inspecting silent installer parameters can be intimidating or time-consuming.

**Wingetix** bridges that gap by offering:
1. **Centralized Software Hub:** Manage all your desktop software inside a fluid *Windows 11 Glassmorphism* dark interface with GPU acceleration.
2. **Automated Update Discovery:** Scans installed software and cross-references against Microsoft's official verified catalog of 12,000+ packages in seconds.
3. **Deep Residual Cleaner:** Traces and purges orphaned directories in `%AppData%`, `%LocalAppData%`, `ProgramData`, and leftover Windows Registry keys.
4. **Platform Shield:** Armors game launchers (**Steam, Epic Games, Riot, EA App, Ubisoft Connect**) to prevent accidental file deletion or library corruption.
5. **Storage & Cache Cleaner:** Reclaims wasted disk space by sweeping WinGet installer caches, crash dumps, and setup residue.
6. **Package Pinning:** Locks specific applications to their current version to prevent unwanted upgrades.
7. **Built-in Auto-Updater:** Checks for updates securely via GitHub Releases with 1-click upgrade and live download telemetry.


---

## 🖼️ Interface Showcase & Visual Tour

Click on any screenshot to inspect the full-resolution uncompressed interface.

<div align="center">
  <table>
    <tr>
      <td width="50%" align="center">
        <b>🔄 Updates & WinGet Hub</b><br/>
        <sub>1-Click batch scans, category filters (Apps, Games, Dev), and pending upgrade queues</sub><br/><br/>
        <a href="docs/screenshots/01-updates.png"><img src="docs/screenshots/01-updates.png" alt="Updates Dashboard" width="100%" style="border-radius: 8px;" /></a>
      </td>
      <td width="50%" align="center">
        <b>🗑️ Deep Uninstaller & Platform Shield</b><br/>
        <sub>Residual registry scrubbing with automatic Steam, Epic, and EA game library protection</sub><br/><br/>
        <a href="docs/screenshots/02-uninstaller.png"><img src="docs/screenshots/02-uninstaller.png" alt="Uninstaller and Platform Shield" width="100%" style="border-radius: 8px;" /></a>
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>🎮 Graphics & Performance Center</b><br/>
        <sub>NVIDIA, AMD & Intel GPU telemetry, real-time VRAM/thermals, and official driver updates</sub><br/><br/>
        <a href="docs/screenshots/03-graphics.png"><img src="docs/screenshots/03-graphics.png" alt="GPU & Graphics Center" width="100%" style="border-radius: 8px;" /></a>
      </td>
      <td width="50%" align="center">
        <b>🧹 Storage & WinGet Cache Cleaner</b><br/>
        <sub>Reclaim wasted disk gigabytes by purging WinGet installer caches, crash dumps, and temp files</sub><br/><br/>
        <a href="docs/screenshots/05-storage-cleaner.png"><img src="docs/screenshots/05-storage-cleaner.png" alt="Storage and Cache Cleaner" width="100%" style="border-radius: 8px;" /></a>
      </td>
    </tr>
    <tr>
      <td width="50%" align="center">
        <b>💾 Windows System Restore Points</b><br/>
        <sub>Instant pre-update OS snapshots, restore point manager, and direct recovery launch</sub><br/><br/>
        <a href="docs/screenshots/04-restore-points.png"><img src="docs/screenshots/04-restore-points.png" alt="System Restore Points" width="100%" style="border-radius: 8px;" /></a>
      </td>
      <td width="50%" align="center">
        <b>🌐 Bilingual UI & Quick Settings</b><br/>
        <sub>Seamless 1-click toggle between English and Spanish, update checker, and repository shortcuts</sub><br/><br/>
        <a href="docs/screenshots/06-quick-menu.png"><img src="docs/screenshots/06-quick-menu.png" alt="Language & Quick Menu" width="60%" style="border-radius: 8px;" /></a>
      </td>
    </tr>
  </table>
</div>

---

## 🌟 Key Features

### 🔄 1. Batch Upgrades & Real-Time Queue
- **Rapid System Scan:** Evaluates all installed programs against the official repository in under 5 seconds.
- **1-Click Bulk Updates:** Upgrade individual apps or queue every outdated application simultaneously.
- **Cancel Anytime:** Dynamic cancel button safely halts active batch operations or downloads.
- **Smart Filtering:** Instant search bar and category filters (Apps, Games, Developer tools).
- **Live Output Stream:** Expandable terminal log displaying raw WinGet console streams in real time.

### 🧹 2. Storage & Cache Cleaner
- **WinGet Installer Scrubbing:** Automatically detects and purges cached `.exe`, `.msi`, and `.msix` setup packages.
- **Crash Dumps & Temp Files:** Sweeps user `%TEMP%`, Windows Error Reporting dumps (`.dmp`), and setup leftovers.
- **🛡️ Active Process Shield:** Safely skips files locked by active background processes to avoid system locks or crashes.
- **Visual Disk Telemetry:** Real-time reclaimed byte counters, cleanup animations, and direct "Open Folder" explorer links.

### 📌 3. Package Pinning & Version Freezing
- **Version Lock:** Exclude specific packages from update notifications via native `winget pin`.
- **Preserve Compatibility:** Perfect for enterprise software, specialized plugins, or graphics drivers that require fixed versions.
- **Dedicated Pinned Manager:** Easily inspect and unfreeze pinned software at any time.

### 🗑️ 4. Clean Uninstaller with Platform Shield
- **Deep Orphan Purge:** Analyzes `%ProgramFiles%`, `%AppData%`, `%LocalAppData%`, and the Windows Registry (`HKLM` / `HKCU`).
- **Platform Shield Integration:** Protects **Steam, Epic Games, Ubisoft Connect, EA App, Riot Vanguard, Battle.net, and GOG Galaxy**. Safely uninstall games without risking launcher corruption or collateral damage to your game library.

### 🎮 5. GPU Telemetry & Official Driver Suites
- **Adapter Detection:** Automatic hardware recognition for **NVIDIA GeForce**, **AMD Radeon**, and **Intel Arc / Iris** GPUs.
- **Live Hardware Sensors:** Real-time VRAM allocation, GPU core temperatures, display resolution, and power metrics.
- **Official Driver Shortcuts:** Direct access to manufacturer suites (GeForce Experience / NVIDIA App, AMD Software Adrenalin, Intel Graphics Command Center).

### 💾 6. Windows System Restore Points
- **Pre-emptive OS Snapshots:** Create complete Windows System Restore points before installing drivers or removing software.
- **Snapshot Manager:** Review existing restore points, clean older snapshots to reclaim disk space, or launch `rstrui.exe` directly.

---

## 📊 Why Wingetix? (Comparison)

| Feature | Wingetix | WinGet CLI | Generic Cleaners (CCleaner, etc.) |
| :--- | :---: | :---: | :---: |
| **User Interface** | Modern Windows 11 Glassmorphism | Console / PowerShell only | Dated, ad-heavy UI |
| **Official Microsoft Sources** | ✅ 100% Verified Catalog | ✅ Yes | ❌ Proprietary / Unknown mirrors |
| **Package Catalog** | 12,000+ Packages | 12,000+ Packages | Limited curated catalog |
| **1-Click Bulk Updates** | ✅ Yes (Interactive Queue) | ⚠️ Manual `upgrade --all` | Paid / Premium paywall |
| **Platform Shield (Game Protection)** | ✅ Built-in | ❌ None | ❌ None (Risks wiping games) |
| **Storage & Installer Cleaner** | ✅ Built-in | ❌ None | ⚠️ Aggressive / Deletes valid keys |
| **Package Pinning (Freeze Versions)** | ✅ Visual Tab | ⚠️ CLI flag only | ❌ None |
| **System Restore Integration** | ✅ Native `rstrui.exe` | ❌ None | ⚠️ Paid version only |
| **Privacy & Telemetry** | 🔒 100% Local (Zero Tracking) | 🔒 Microsoft Telemetry | ❌ Aggressive ad tracking |
| **License & Price** | 🆓 **100% Free & Open Source (GPLv3)** | 🆓 Free | 💰 Adware / Subscription nag screens |

---

## 🛡️ Security, Trust & Guaranteed Privacy

Wingetix is engineered under a **zero-malware tolerance, full transparency, and local-first** standard:

- 🔒 **SHA-256 Hash Verification:** Every installer downloaded is verified against official cryptographic hashes before execution.
- 🌐 **Zero Middlemen:** Binaries are fetched directly from official developer CDNs and Microsoft infrastructure (no repackaged installers).
- 🛡️ **Explicit User Consent:** Nothing updates or deletes silently in the background. Every action requires your explicit confirmation.
- 💻 **100% Local Execution:** No user accounts, no passwords collected, and no analytics harvesting. Everything runs locally on your PC.
- ✅ **VirusTotal 0/70 Clean & Auditable:** All release binaries pass 70+ antivirus engines on VirusTotal with zero detections and verifiable SHA-256 checksums.
- 📜 **GNU GPLv3 Open Source:** All source code is completely public and auditable by the community.

---

## ❓ Why Exclusively Microsoft WinGet (Instead of Chocolatey or Scoop)?

A common question from the community is why Wingetix is purpose-built around **Microsoft WinGet** rather than bundling third-party package managers like Chocolatey or Scoop:

1. **100% Native Windows 10 & 11 Engine:** `winget` is engineered and maintained directly by Microsoft as part of modern Windows. It requires zero third-party frameworks, no custom environment shims, and no relaxing of global PowerShell execution policies.
2. **Direct Manufacturer CDNs & Cryptographic Trust:** Unlike third-party community repositories that repackage binaries on intermediate mirrors, WinGet fetches untouched installers directly from the software publisher's official servers (Microsoft, Valve, Mozilla, Google, etc.) and verifies every binary against cryptographic **SHA-256 hashes** and Microsoft SmartScreen.
3. **Zero System Bloat & Single-Engine Purity:** Maintaining a single official package engine eliminates duplicate download caches, conflicting `PATH` variables, and background wrapper daemons—delivering maximum speed with zero footprint.

---

## 🖥️ Interface Modules

| Module | Icon | Purpose |
| :--- | :---: | :--- |
| **Updates Hub** | 🔄 | Scan outdated software, apply filters, and trigger 1-click batch upgrades. |
| **Clean Uninstaller** | 🗑️ | Detailed software registry with deep leftover folder and registry key cleaner. |
| **Storage Cleaner** | 🧹 | Scan and purge installer caches, temporary setup files, and crash dumps. |
| **Package Pinning** | 📌 | Freeze versions and exclude specific packages from update notifications. |
| **GPU Telemetry** | 🎮 | Live Multi-GPU hardware monitor (Dedicated & Integrated selector), thermals, VRAM, and driver suites. |
| **Software Packs** | 📦 | Create, export, and deploy custom `.wingetix` software bundles in 1 click across PCs. |
| **Restore Points** | 💾 | Create and manage native Windows System Restore snapshots (`rstrui.exe`). |
| **Auto-Updater** | 🚀 | Seamlessly downloads and applies new official releases from GitHub. |

---

## 📥 Download & Installation

### Option 1: Microsoft WinGet (Terminal) — Fastest
```powershell
winget install wingetix
```

### Option 2: Guided Installer (.exe) — Recommended
Download **`Wingetix.Setup.1.2.0.exe`** from [**GitHub Releases**](https://github.com/joselyky/Wingetix/releases/latest) or [**wingetix.com**](https://wingetix.com).
- Guided setup wizard with desktop shortcut creation.
- Automatically configures `winget` in your terminal if absent.
- Full clean uninstallation support from the Windows Control Panel.

### Option 3: Portable Standalone (.exe) — Zero-Footprint USB
Download **`Wingetix.1.2.0.exe`** for standalone execution without installation (stores settings in `.\data\settings.json` with zero `%APPDATA%` footprint—ideal for IT maintenance flash drives).

---

## ⚙️ System Requirements

- **Operating System:** Windows 10 (version 1809+) or Windows 11 (64-bit).
- **WinGet CLI:** Built into modern Windows 10 & 11 *(automatically enabled if absent)*.
- **Permissions:** Standard user privileges for scanning/updates; Administrator elevation (UAC) only when cleaning system-wide registry keys or creating restore points.

---

## 🛠️ Build from Source

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [Git](https://git-scm.com/)

### Steps
```bash
# Clone the repository
git clone https://github.com/joselyky/Wingetix.git

# Navigate to directory
cd Wingetix

# Install dependencies
npm install

# Run application in development mode
npm start

# Build production installer & portable binaries
npm run build
```

---

## 🤝 Contributing

Contributions, bug reports, and feature requests are welcome!
1. Fork the Project.
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3. Commit your Changes (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push to the Branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## 📜 License

This project is licensed under the **GNU General Public License v3.0 (GPLv3)**. You are free to inspect, run, modify, and contribute to the code. Any derivative work or redistribution must remain open source under the same GPLv3 license and preserve original author attribution. See the [LICENSE](LICENSE) file for complete details.

<div align="center">
  <sub>Developed with ❤️ by <b><a href="https://github.com/joselyky">Jose Antonio Baeza Pineda (@joselyky)</a></b></sub>
</div>
