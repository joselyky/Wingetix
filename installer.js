/**
 * Wingetix v1.2.0 — Visual Glassmorphism Installer Client
 */

(function () {
  'use strict';

  // ─── Translations Dictionary ──────────────────────────────────────────────
  const i18n = {
    es: {
      tagline: 'El Panel de Control Visual Definitivo para Windows',
      btnStart: 'Comenzar Instalación',
      optionsTitle: 'Opciones de Instalación',
      optionsSubtitle: 'Personaliza cómo se integrará Wingetix en tu sistema',
      optDesktopLabel: 'Acceso directo en el escritorio',
      optDesktopDesc: 'Crea un acceso directo en tu escritorio para abrir Wingetix rápidamente.',
      optWingetLabel: 'Verificar y activar motor oficial WinGet',
      recommendedBadge: 'Recomendado',
      optWingetDesc: 'Registra DesktopAppInstaller, repara alias y asegura soporte nativo en Windows 10 y 11.',
      optPathLabel: 'Ubicación de instalación',
      btnBrowse: 'Examinar...',
      btnBack: 'Atrás',
      btnInstallNow: 'Instalar Ahora',
      installingTitle: 'Instalando Wingetix...',
      statusStarting: 'Preparando el entorno de instalación...',
      statusOptimized: 'Optimizado para Windows',
      mileExtract: 'Archivos del sistema',
      mileWinget: 'Motor WinGet',
      mileShortcuts: 'Accesos directos',
      finishedTitle: '¡Instalación completada con éxito!',
      finishedDesc: 'Wingetix está listo para gestionar y mantener todo tu software de forma visual, limpia y rápida.',
      btnLaunch: 'Abrir Wingetix'
    },
    en: {
      tagline: 'The Ultimate Visual Control Panel for Windows',
      btnStart: 'Start Installation',
      optionsTitle: 'Installation Options',
      optionsSubtitle: 'Customize how Wingetix integrates with your system',
      optDesktopLabel: 'Create desktop shortcut',
      optDesktopDesc: 'Create a shortcut on your desktop to open Wingetix quickly.',
      optWingetLabel: 'Verify and enable official WinGet engine',
      recommendedBadge: 'Recommended',
      optWingetDesc: 'Registers DesktopAppInstaller, fixes execution aliases, and ensures full Windows 10 & 11 support.',
      optPathLabel: 'Installation directory',
      btnBrowse: 'Browse...',
      btnBack: 'Back',
      btnInstallNow: 'Install Now',
      installingTitle: 'Installing Wingetix...',
      statusStarting: 'Preparing installation environment...',
      statusOptimized: 'Optimized for Windows',
      mileExtract: 'System files',
      mileWinget: 'WinGet engine',
      mileShortcuts: 'Shortcuts',
      finishedTitle: 'Installation Successfully Completed!',
      finishedDesc: 'Wingetix is ready to manage, update, and clean your software with a modern, high-speed interface.',
      btnLaunch: 'Launch Wingetix'
    }
  };

  let currentLang = 'en';

  // ─── DOM Elements ─────────────────────────────────────────────────────────
  const screenWelcome = document.getElementById('screen-welcome');
  const screenOptions = document.getElementById('screen-options');
  const screenInstalling = document.getElementById('screen-installing');
  const screenFinished = document.getElementById('screen-finished');

  const btnStart = document.getElementById('btn-start');
  const btnBackToSplash = document.getElementById('btn-back-to-splash');
  const btnInstallNow = document.getElementById('btn-install-now');
  const btnLaunchApp = document.getElementById('btn-launch-app');
  const btnBrowsePath = document.getElementById('btn-browse-path');

  const inputInstallPath = document.getElementById('input-install-path');
  const chkDesktop = document.getElementById('chk-desktop');
  const chkWinget = document.getElementById('chk-winget');

  const progressBarFill = document.getElementById('progress-bar-fill');
  const progressStepText = document.getElementById('progress-step-text');
  const installStatusMsg = document.getElementById('install-status-msg');

  const mileExtract = document.getElementById('mile-extract');
  const mileWinget = document.getElementById('mile-winget');
  const mileShortcuts = document.getElementById('mile-shortcuts');

  const ctrlMinimize = document.getElementById('ctrl-minimize');
  const ctrlClose = document.getElementById('ctrl-close');

  const langButtons = document.querySelectorAll('.lang-btn');

  // ─── Screen Transition Management ─────────────────────────────────────────
  function showScreen(screen) {
    [screenWelcome, screenOptions, screenInstalling, screenFinished].forEach(s => {
      s.classList.remove('active');
    });
    screen.classList.add('active');
  }

  // ─── Language Switching ───────────────────────────────────────────────────
  function setLanguage(lang) {
    if (!i18n[lang]) return;
    currentLang = lang;

    langButtons.forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) {
        el.textContent = i18n[lang][key];
      }
    });
  }

  langButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const lang = btn.getAttribute('data-lang');
      setLanguage(lang);
    });
  });

  // ─── Window Controls ──────────────────────────────────────────────────────
  if (ctrlMinimize) {
    ctrlMinimize.addEventListener('click', () => {
      window.electronAPI?.installerMinimize?.();
    });
  }

  if (ctrlClose) {
    ctrlClose.addEventListener('click', () => {
      window.electronAPI?.installerClose?.();
    });
  }

  // ─── Navigation Flow ──────────────────────────────────────────────────────
  btnStart.addEventListener('click', () => {
    showScreen(screenOptions);
  });

  btnBackToSplash.addEventListener('click', () => {
    showScreen(screenWelcome);
  });

  if (btnBrowsePath) {
    btnBrowsePath.addEventListener('click', async () => {
      if (window.electronAPI?.installerSelectPath) {
        const selected = await window.electronAPI.installerSelectPath();
        if (selected) {
          inputInstallPath.value = selected;
        }
      }
    });
  }

  // ─── Installation Execution ───────────────────────────────────────────────
  btnInstallNow.addEventListener('click', () => {
    showScreen(screenInstalling);

    const installConfig = {
      lang: currentLang,
      createDesktopShortcut: chkDesktop.checked,
      enableWinget: chkWinget.checked,
      targetPath: inputInstallPath.value
    };

    if (window.electronAPI?.installerStartInstall) {
      window.electronAPI.installerStartInstall(installConfig);
    } else {
      // Fallback preview mode
      simulateProgress();
    }
  });

  btnLaunchApp.addEventListener('click', () => {
    if (window.electronAPI?.installerLaunchApp) {
      window.electronAPI.installerLaunchApp();
    } else {
      window.close();
    }
  });

  // ─── Progress Updates ─────────────────────────────────────────────────────
  if (window.electronAPI?.onInstallerProgress) {
    window.electronAPI.onInstallerProgress(data => {
      const percent = data.percent || 0;
      progressBarFill.style.width = `${percent}%`;
      progressStepText.textContent = `${percent}%`;

      if (data.message) {
        installStatusMsg.textContent = data.message;
      }

      if (data.milestone) {
        if (data.milestone === 'extract') {
          mileExtract.className = 'milestone-badge done';
          mileWinget.className = 'milestone-badge in-progress';
        } else if (data.milestone === 'winget') {
          mileExtract.className = 'milestone-badge done';
          mileWinget.className = 'milestone-badge done';
          mileShortcuts.className = 'milestone-badge in-progress';
        } else if (data.milestone === 'shortcuts') {
          mileExtract.className = 'milestone-badge done';
          mileWinget.className = 'milestone-badge done';
          mileShortcuts.className = 'milestone-badge done';
        }
      }
    });
  }

  if (window.electronAPI?.onInstallerDone) {
    window.electronAPI.onInstallerDone(result => {
      progressBarFill.style.width = '100%';
      progressStepText.textContent = '100%';
      mileExtract.className = 'milestone-badge done';
      mileWinget.className = 'milestone-badge done';
      mileShortcuts.className = 'milestone-badge done';

      setTimeout(() => {
        showScreen(screenFinished);
      }, 650);
    });
  }

  // ─── Simulation for UI Testing / Standalone Browser ───────────────────────
  function simulateProgress() {
    let pct = 0;
    const interval = setInterval(() => {
      pct += 15;
      if (pct > 100) pct = 100;
      progressBarFill.style.width = `${pct}%`;
      progressStepText.textContent = `${pct}%`;

      if (pct <= 35) {
        installStatusMsg.textContent = currentLang === 'es' 
          ? 'Desempaquetando archivos del sistema... (35%)' 
          : 'Extracting system files... (35%)';
        mileExtract.className = 'milestone-badge in-progress';
      } else if (pct <= 70) {
        installStatusMsg.textContent = currentLang === 'es' 
          ? 'Verificando y registrando motor WinGet... (70%)' 
          : 'Verifying and registering WinGet engine... (70%)';
        mileExtract.className = 'milestone-badge done';
        mileWinget.className = 'milestone-badge in-progress';
      } else if (pct < 100) {
        installStatusMsg.textContent = currentLang === 'es' 
          ? 'Creando accesos directos y registrando... (90%)' 
          : 'Creating shortcuts and registering... (90%)';
        mileWinget.className = 'milestone-badge done';
        mileShortcuts.className = 'milestone-badge in-progress';
      } else {
        installStatusMsg.textContent = currentLang === 'es' 
          ? '¡Instalación completada con éxito! (100%)' 
          : 'Installation completed successfully! (100%)';
        mileShortcuts.className = 'milestone-badge done';
        clearInterval(interval);
        setTimeout(() => {
          showScreen(screenFinished);
        }, 700);
      }
    }, 450);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────
  async function init() {
    setLanguage('en'); // Always default to English
    try {
      if (window.electronAPI?.installerGetInfo) {
        const info = await window.electronAPI.installerGetInfo();
        if (info.defaultPath) {
          inputInstallPath.value = info.defaultPath;
        }
      }
    } catch (_) {}
  }

  init();
})();
