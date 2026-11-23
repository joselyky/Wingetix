# 🤝 Contributing to Wingetix

Thank you for your interest in contributing to **Wingetix**! We welcome community contributions, bug reports, feature suggestions, and community translations.

Wingetix is a 100% Free and Open Source Software (FOSS) project released under the **GNU General Public License v3.0 (GPLv3)**.

---

## 🛡️ Our Development Philosophy

1. **Safety First:** Never introduce operations that could harm user systems or wipe unrelated files. All uninstall operations must respect `Platform Shield`.
2. **Zero Telemetry & Zero Ads:** Wingetix contains zero analytics, tracking beacons, or adware. Any pull request adding telemetry or third-party tracking will be rejected.
3. **Native & Clean:** We prioritize the official Microsoft WinGet repository and native Windows APIs to maintain a lightweight, zero-background-daemon footprint.

---

## 🌐 Helping with Translations (i18n)

One of the easiest and most valuable ways to help is by improving English strings or adding new languages (e.g., French, German, Portuguese, Italian, Japanese, etc.).

### How to add or improve strings:
1. Fork the repository on GitHub.
2. Open `i18n.js`.
3. If you want to fix an existing string (e.g. improve natural English phrasing), locate the corresponding key under the `en` object and propose your correction.
4. If you want to add a new language:
   - Add your language code (e.g. `fr`, `de`, `it`) alongside the existing `en` and `es` objects.
   - Translate the keys matching the semantic identifiers.
5. Submit a **Pull Request**. The project maintainer will review your suggested changes before merging.

---

## 🐛 Reporting Bugs

If you encounter an issue or an unexpected behavior:
1. Check the [Issues tab](https://github.com/joselyky/Wingetix/issues) to ensure it hasn't already been reported.
2. If opening a new issue, please include:
   - **Windows Version & Build** (e.g., Windows 11 23H2 / 24H2, or Windows 10 LTSC).
   - **Wingetix Version** (e.g., v1.1.1).
   - **Steps to Reproduce** the error.
   - **Expected vs Actual behavior**.
   - Optional: Relevant terminal or debug log output.

---

## 💡 Feature Suggestions & Enhancements

Have an idea to make Wingetix better?
- Open an issue tagged with `[Feature Request]`.
- Explain the practical use case and how it improves daily software management on Windows.

---

## 🔒 Pull Request Review Process

Every proposed Pull Request is:
- **Audited for Security:** Verified to ensure no malicious code, unvetted binaries, or tracking scripts are introduced.
- **Tested on Windows 10 & 11:** Checked for compatibility across both standard user and elevated administrator privileges.
- **Reviewed by the Project Maintainer:** Merged exclusively after passing manual inspection.

Thank you for helping keep Windows software management clean, fast, and open source!
