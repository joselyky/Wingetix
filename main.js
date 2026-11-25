const { app, BrowserWindow, ipcMain, dialog, shell, Notification } = require('electron');
const { spawn } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const https = require('https');
const http = require('http');

// Set Windows AppUserModelId for native Windows 10/11 OS Toast Notifications & Taskbar grouping
try {
  app.setAppUserModelId('com.joselyky.wingetix');
} catch (_) {}

// ─── Globals ──────────────────────────────────────────────────────────────────
let mainWindow;
const isDev = process.argv.includes('--dev');

// ─── Visual Glassmorphism Installer & Uninstaller Mode Detection ─────────────
function detectInstallerMode() {
  if (process.argv.includes('--app-mode') || process.argv.includes('--uninstall')) {
    return false;
  }
  if (process.argv.includes('--installer') || process.argv.includes('--setup')) {
    return true;
  }
  try {
    const resDir = process.resourcesPath || path.join(path.dirname(process.execPath), 'resources');
    if (fs.existsSync(path.join(resDir, 'installed_mode.txt'))) {
      return false;
    }
    if (
      fs.existsSync(path.join(resDir, 'installer_mode.txt')) ||
      fs.existsSync(path.join(resDir, 'scripts', 'installer_mode.txt'))
    ) {
      return true;
    }
  } catch (_) {}

  const outerExe = path.basename(process.env.PORTABLE_EXECUTABLE_FILE || process.execPath || '').toLowerCase();
  if (outerExe.includes('setup') || outerExe.includes('installer') || outerExe.includes('instalador')) {
    return true;
  }
  return false;
}

let isInstallerMode = detectInstallerMode();
let installerWindow = null;
let lastInstalledTargetDir = null;
let lastInstalledLang = 'en';

// ─── Zero-Footprint USB Portable Mode & .\data\settings.json Engine ───────────
// When executed from a USB flash drive or standalone portable directory (outside
// Program Files, or when .\data / portable.txt / --portable is present), Wingetix
// stores all configuration in .\data\settings.json, software packs in .\data\packs,
// and redirects Electron's Chromium profile to .\data\profile so zero footprint
// is left in %APPDATA%\Wingetix on the host computer.
function resolvePortableBaseDir() {
  if (process.env.PORTABLE_EXECUTABLE_DIR) {
    return process.env.PORTABLE_EXECUTABLE_DIR;
  }
  const exeName = path.basename(process.execPath || '').toLowerCase();
  if (exeName && exeName !== 'electron.exe') {
    return path.dirname(process.execPath);
  }
  return __dirname;
}

const portableBaseDir = resolvePortableBaseDir();
const portableDataDir = path.join(portableBaseDir, 'data');

function detectPortableMode() {
  if (isInstallerMode || process.argv.includes('--uninstall')) {
    return false;
  }
  try {
    if (process.argv.includes('--portable')) {
      return true;
    }
    const resDir = process.resourcesPath || path.join(path.dirname(process.execPath), 'resources');
    if (fs.existsSync(path.join(resDir, 'installed_mode.txt'))) {
      return false;
    }
    if (process.env.PORTABLE_EXECUTABLE_DIR) {
      return true;
    }
    if (
      fs.existsSync(path.join(portableBaseDir, 'portable.txt')) ||
      fs.existsSync(path.join(portableBaseDir, '.portable')) ||
      fs.existsSync(path.join(portableDataDir, 'settings.json')) ||
      fs.existsSync(portableDataDir)
    ) {
      return true;
    }

    const normBase = portableBaseDir.toLowerCase();
    const progFiles = (process.env.ProgramFiles || 'C:\\Program Files').toLowerCase();
    const progFilesX86 = (process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)').toLowerCase();
    const localPrograms = path.join(process.env.LOCALAPPDATA || '', 'Programs').toLowerCase();

    const isInsideStandardInstallDir =
      normBase.startsWith(progFiles) ||
      normBase.startsWith(progFilesX86) ||
      (localPrograms && normBase.startsWith(localPrograms)) ||
      fs.existsSync(path.join(portableBaseDir, 'unins000.exe'));

    if (!isInsideStandardInstallDir) {
      // Check directory writability for standalone/USB execution
      fs.accessSync(portableBaseDir, fs.constants.W_OK);
      return true;
    }
  } catch (_) {}
  return false;
}

const isPortableMode = detectPortableMode();
let activeDataDir = '';
let settingsFilePath = '';

if (isPortableMode) {
  try {
    const profileDir = path.join(portableDataDir, 'profile');
    const packsDir = path.join(portableDataDir, 'packs');
    fs.mkdirSync(profileDir, { recursive: true });
    fs.mkdirSync(packsDir, { recursive: true });
    app.setPath('userData', profileDir);
    app.setPath('sessionData', path.join(portableDataDir, 'session'));
    activeDataDir = portableDataDir;
    settingsFilePath = path.join(portableDataDir, 'settings.json');
  } catch (err) {
    console.warn('[PortableMode] Fallback to default userData:', err.message);
    activeDataDir = app.getPath('userData');
    settingsFilePath = path.join(activeDataDir, 'settings.json');
  }
} else {
  activeDataDir = app.getPath('userData');
  settingsFilePath = path.join(activeDataDir, 'settings.json');
}

const DEFAULT_APP_SETTINGS = {
  version: '1.2.0',
  portableMode: isPortableMode,
  language: 'en',
  userSelectedLanguage: false,
  defaultSortPackages: 'name-asc',
  defaultSortInstalled: 'name-asc',
  createRestorePointBeforeUninstall: false,
  platformShieldWhitelist: []
};

function loadAppSettings() {
  try {
    if (fs.existsSync(settingsFilePath)) {
      const raw = fs.readFileSync(settingsFilePath, 'utf8');
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_APP_SETTINGS, ...parsed, portableMode: isPortableMode };
    } else if (isPortableMode) {
      const initial = { ...DEFAULT_APP_SETTINGS, lastUpdated: new Date().toISOString() };
      fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
      fs.writeFileSync(settingsFilePath, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
  } catch (err) {
    console.warn('[loadAppSettings] Failed to read settings.json:', err.message);
  }
  return { ...DEFAULT_APP_SETTINGS };
}

function saveAppSettings(partial = {}) {
  try {
    const current = loadAppSettings();
    const updated = {
      ...current,
      ...partial,
      portableMode: isPortableMode,
      lastUpdated: new Date().toISOString()
    };
    fs.mkdirSync(path.dirname(settingsFilePath), { recursive: true });
    fs.writeFileSync(settingsFilePath, JSON.stringify(updated, null, 2), 'utf8');
    return updated;
  } catch (err) {
    console.error('[saveAppSettings] Failed to write settings.json:', err.message);
    return null;
  }
}

// Ensure .\data\settings.json exists immediately when running in Portable Mode
if (isPortableMode) {
  loadAppSettings();
}

// ─── Windows 10 & 11 WinGet Resolution Engine ────────────────────────────────
// In Windows 10 elevated processes (UAC), App Execution Aliases in %LOCALAPPDATA%\Microsoft\WindowsApps
// fail with ENOENT / Access Denied. We resolve the physical binary in C:\Program Files\WindowsApps
// and inject its directory directly into PATH, ensuring 100% reliable execution.
let cachedWingetBinary = null;

function resolveWingetBinary() {
  if (cachedWingetBinary && fs.existsSync(cachedWingetBinary)) {
    return cachedWingetBinary;
  }

  // 1. Direct physical WindowsApps DesktopAppInstaller directory (bypasses Windows 10 UAC alias bug)
  try {
    const winAppsBase = 'C:\\Program Files\\WindowsApps';
    if (fs.existsSync(winAppsBase)) {
      const dirs = fs.readdirSync(winAppsBase);
      const matches = dirs.filter(d => 
        d.startsWith('Microsoft.DesktopAppInstaller_') && 
        (d.includes('_x64__') || d.includes('_neutral__') || d.includes('_arm64__'))
      ).sort().reverse();

      for (const m of matches) {
        const candidate = path.join(winAppsBase, m, 'winget.exe');
        if (fs.existsSync(candidate)) {
          cachedWingetBinary = candidate;
          return candidate;
        }
      }
    }
  } catch (_) {}

  // 2. Current user AppData WindowsApps execution alias
  const userAlias = path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps', 'winget.exe');
  if (fs.existsSync(userAlias)) {
    cachedWingetBinary = userAlias;
    return userAlias;
  }

  // 3. Other users AppData execution aliases
  try {
    const users = fs.readdirSync('C:\\Users');
    for (const u of users) {
      const p = `C:\\Users\\${u}\\AppData\\Local\\Microsoft\\WindowsApps\\winget.exe`;
      if (fs.existsSync(p)) {
        cachedWingetBinary = p;
        return p;
      }
    }
  } catch (_) {}

  // 4. Fallback to command name 'winget.exe' (relying on PATH)
  return 'winget.exe';
}

function buildEnv() {
  const cur = process.env.PATH || '';
  const dirs = [];

  // Inject physical WindowsApps directories first so elevated processes resolve the real binary
  try {
    const winAppsBase = 'C:\\Program Files\\WindowsApps';
    if (fs.existsSync(winAppsBase)) {
      const allDirs = fs.readdirSync(winAppsBase);
      const matches = allDirs.filter(d => 
        d.startsWith('Microsoft.DesktopAppInstaller_') && 
        (d.includes('_x64__') || d.includes('_neutral__') || d.includes('_arm64__'))
      ).sort().reverse();
      for (const m of matches) {
        dirs.push(path.join(winAppsBase, m));
      }
    }
  } catch (_) {}

  dirs.push(path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'WindowsApps'));

  try {
    fs.readdirSync('C:\\Users').forEach(u =>
      dirs.push(`C:\\Users\\${u}\\AppData\\Local\\Microsoft\\WindowsApps`)
    );
  } catch (_) {}

  const toAdd = dirs.filter(d => !cur.includes(d)).join(';');
  return { ...process.env, PATH: toAdd ? `${toAdd};${cur}` : cur };
}

function spawnWinget(args, customOptions = {}) {
  const bin = resolveWingetBinary();
  const env = customOptions.env || buildEnv();
  const options = {
    env,
    shell: true,
    windowsHide: true,
    ...customOptions
  };

  const executable = bin.includes(' ') ? `"${bin}"` : bin;
  return spawn(executable, args, options);
}

// ─── Resolve Physical Script Path ─────────────────────────────────────────────
// External processes like powershell.exe cannot access files packed inside app.asar.
function getScriptPath(scriptName) {
  // 1. Check resources/scripts outside asar (production standard)
  if (process.resourcesPath) {
    const resPath = path.join(process.resourcesPath, 'scripts', scriptName);
    try {
      if (fs.existsSync(resPath) && !resPath.toLowerCase().includes('.asar')) {
        return resPath;
      }
    } catch (_) {}
  }

  // 2. Check development folder if not packaged in asar
  const devPath = path.join(__dirname, 'scripts', scriptName);
  try {
    if (fs.existsSync(devPath) && !devPath.toLowerCase().includes('.asar')) {
      return devPath;
    }
  } catch (_) {}

  // 3. If packed in asar, extract to os.tmpdir so external processes can access it
  const tmpPath = path.join(os.tmpdir(), `winget_mgr_${scriptName}`);
  try {
    const content = fs.readFileSync(devPath, 'utf8');
    fs.writeFileSync(tmpPath, '\ufeff' + content, 'utf8');
    return tmpPath;
  } catch (err) {
    console.error(`[getScriptPath] Failed to extract ${scriptName} from asar:`, err.message);
  }

  return devPath;
}

// ─── Window ───────────────────────────────────────────────────────────────────
function createWindow() {
  const winIconPath = fs.existsSync(path.join(__dirname, 'icon.ico'))
    ? path.join(__dirname, 'icon.ico')
    : path.join(__dirname, 'icon.png');
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 960, minHeight: 640,
    frame: false, transparent: true, backgroundColor: '#00000000',
    icon: winIconPath,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });
  mainWindow.loadFile('index.html');
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Silent check for app updates 3.5 seconds after launch
    setTimeout(async () => {
      try {
        const updateInfo = await checkAppUpdatesCore({ silent: true });
        if (updateInfo && updateInfo.updateAvailable && mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('app:update-available', updateInfo);
        }
      } catch (_) { }
    }, 3500);
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── Visual Glassmorphism Installer Window ──────────────────────────────────
function createInstallerWindow() {
  installerWindow = new BrowserWindow({
    width: 760,
    height: 540,
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    resizable: false,
    maximizable: false,
    center: true,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  });

  installerWindow.loadFile('installer.html');
  installerWindow.once('ready-to-show', () => {
    installerWindow.show();
  });
  installerWindow.on('closed', () => {
    installerWindow = null;
  });
}

function handleSelfUninstall() {
  const appDir = path.dirname(process.execPath);
  const psCleanup = `
    Start-Sleep -Milliseconds 900
    $desktop = [Environment]::GetFolderPath('Desktop')
    $startMenu = [Environment]::GetFolderPath('CommonPrograms')
    $userStart = [Environment]::GetFolderPath('Programs')
    Remove-Item -LiteralPath "$desktop\\Wingetix.lnk" -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath "$startMenu\\Wingetix.lnk" -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath "$userStart\\Wingetix.lnk" -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Wingetix" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Wingetix" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -LiteralPath "${appDir.replace(/\\/g, '\\\\')}" -Recurse -Force -ErrorAction SilentlyContinue
  `;
  try {
    spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-Command', psCleanup], {
      detached: true,
      stdio: 'ignore',
      windowsHide: true
    }).unref();
  } catch (_) {}
  app.quit();
}

app.whenReady().then(() => {
  if (process.argv.includes('--uninstall')) {
    handleSelfUninstall();
    return;
  }
  if (isInstallerMode) {
    createInstallerWindow();
  } else {
    createWindow();
  }
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    if (isInstallerMode) createInstallerWindow();
    else createWindow();
  }
});

// ─── Window Controls, Taskbar Progress Bar & Native OS Notifications ──────────
function setTaskbarProgress(value, mode = 'normal') {
  try {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    if (value === null || value === undefined || value < 0) {
      mainWindow.setProgressBar(-1);
      return;
    }
    if (mode === 'indeterminate') {
      mainWindow.setProgressBar(2, { mode: 'indeterminate' });
      return;
    }
    const num = Number(value);
    if (isNaN(num) || num < 0) {
      mainWindow.setProgressBar(-1);
      return;
    }
    const fraction = num > 1 ? Math.min(1, Math.max(0, num / 100)) : Math.min(1, Math.max(0, num));
    mainWindow.setProgressBar(fraction, { mode: mode || 'normal' });
  } catch (_) {}
}

function showNativeOsNotification({ title, body, silent = false } = {}) {
  try {
    if (!Notification || !Notification.isSupported()) return false;
    const iconPath = path.join(__dirname, 'icon.png');
    const notif = new Notification({
      title: title || 'Wingetix',
      body: body || '',
      icon: fs.existsSync(iconPath) ? iconPath : undefined,
      silent: !!silent
    });
    notif.on('click', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
      }
    });
    notif.show();
    return true;
  } catch (_) {
    return false;
  }
}

ipcMain.on('window:minimize', () => mainWindow?.minimize());
ipcMain.on('window:maximize', () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window:close',    () => mainWindow?.close());
ipcMain.on('window:set-progress', (_e, data = {}) => {
  setTaskbarProgress(data.value, data.mode);
});
ipcMain.on('app:notify', (_e, payload = {}) => {
  showNativeOsNotification(payload);
});

// ─── Installer Window Controls & Logic ────────────────────────────────────────
ipcMain.on('installer:minimize', () => {
  if (installerWindow && !installerWindow.isDestroyed()) {
    installerWindow.minimize();
  }
});

ipcMain.on('installer:close', () => {
  app.quit();
});

ipcMain.handle('installer:get-info', async () => {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const defaultDir = path.join(localAppData, 'Programs', 'Wingetix');
  return {
    defaultPath: defaultDir,
    systemLang: 'en',
    isAdmin: true
  };
});

ipcMain.handle('installer:select-path', async () => {
  if (!installerWindow || installerWindow.isDestroyed()) return null;
  const res = await dialog.showOpenDialog(installerWindow, {
    title: 'Select installation directory',
    properties: ['openDirectory', 'createDirectory']
  });
  if (!res.canceled && res.filePaths.length > 0) {
    return res.filePaths[0];
  }
  return null;
});

function resolveInstallerSourceDir() {
  const execDir = path.dirname(process.execPath);
  if (fs.existsSync(path.join(execDir, 'Wingetix.exe'))) {
    return execDir;
  }
  // Fallback if launched via electron.exe in development workspace
  const candidates = [
    path.join(__dirname, '..', '..'),
    path.join(__dirname, 'Wingetix-win32-x64')
  ];
  for (const c of candidates) {
    if (fs.existsSync(path.join(c, 'Wingetix.exe'))) {
      return c;
    }
  }
  return execDir;
}

async function copyAppRuntimeToTarget(sourceDir, targetDir, onProgress) {
  // CRITICAL: Electron's patched `fs` treats `.asar` files as virtual directories,
  // causing `fs.copyFile('.../app.asar', ...)` to fail with `ENOENT, '' not found in app.asar`!
  // Using `original-fs` bypasses ASAR virtualization and copies `app.asar` as a raw binary file!
  let rawFs = fs;
  try {
    rawFs = require('original-fs');
  } catch (_) {
    rawFs = fs;
  }

  const skipNames = new Set([
    'installer_mode.txt',
    'app-unpacked',
    'data',
    'release-output',
    'installer-output',
    'dist',
    'node_modules',
    '.git'
  ]);

  const filesToCopy = [];
  function collectFiles(curSrc, curDst) {
    let entries = [];
    try {
      entries = rawFs.readdirSync(curSrc, { withFileTypes: true });
    } catch (_) { return; }
    for (const ent of entries) {
      if (skipNames.has(ent.name.toLowerCase())) continue;
      const srcPath = path.join(curSrc, ent.name);
      const dstPath = path.join(curDst, ent.name);
      if (ent.isDirectory()) {
        collectFiles(srcPath, dstPath);
      } else if (ent.isFile()) {
        filesToCopy.push({ srcPath, dstPath });
      }
    }
  }

  collectFiles(sourceDir, targetDir);
  const total = filesToCopy.length || 1;

  for (let i = 0; i < filesToCopy.length; i++) {
    const { srcPath, dstPath } = filesToCopy[i];
    const dstFolder = path.dirname(dstPath);
    try {
      if (!rawFs.existsSync(dstFolder)) {
        rawFs.mkdirSync(dstFolder, { recursive: true });
      }
      try {
        await rawFs.promises.copyFile(srcPath, dstPath);
      } catch (_) {
        await new Promise((resCopy, rejCopy) => {
          const rs = rawFs.createReadStream(srcPath);
          const ws = rawFs.createWriteStream(dstPath);
          rs.on('error', rejCopy);
          ws.on('error', rejCopy);
          ws.on('finish', resCopy);
          rs.pipe(ws);
        });
      }
    } catch (copyErr) {
      console.warn('[Installer] File copy warning:', srcPath, copyErr.message);
    }

    if (i % 8 === 0 || i === filesToCopy.length - 1) {
      const pct = Math.round(15 + ((i + 1) / total) * 38);
      if (onProgress) onProgress(pct);
      await new Promise(r => setTimeout(r, 6));
    }
  }
}

function createShortcutSafe(shortcutPath, options) {
  try {
    const dir = path.dirname(shortcutPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (typeof shell.writeShortcutLink === 'function') {
      const ok = shell.writeShortcutLink(shortcutPath, 'replace', options);
      if (ok && fs.existsSync(shortcutPath)) {
        return true;
      }
    }
  } catch (err) {
    console.warn('[Installer] shell.writeShortcutLink warning:', err.message);
  }
  return false;
}

ipcMain.on('installer:run-install', async (event, config) => {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const fallbackUserDir = path.join(localAppData, 'Programs', 'Wingetix');
  const targetDir = config.targetPath || fallbackUserDir;
  const lang = config.lang || 'en';
  const createDesktop = !!config.createDesktopShortcut;
  const enableWinget = !!config.enableWinget;

  lastInstalledTargetDir = targetDir;
  lastInstalledLang = lang;

  function sendProgress(percent, message, milestone) {
    if (installerWindow && !installerWindow.isDestroyed()) {
      installerWindow.webContents.send('installer:progress', { percent, message, milestone });
    }
  }

  try {
    sendProgress(10, lang === 'es' ? 'Preparando entorno de instalación...' : 'Preparing installation environment...');
    
    let finalTargetDir = targetDir;
    let canWriteDirectly = false;
    try {
      if (!fs.existsSync(finalTargetDir)) {
        fs.mkdirSync(finalTargetDir, { recursive: true });
      }
      const probeFile = path.join(finalTargetDir, `.wingetix_write_test_${Date.now()}`);
      fs.writeFileSync(probeFile, 'ok', 'utf8');
      fs.unlinkSync(probeFile);
      canWriteDirectly = true;
    } catch (_) {
      canWriteDirectly = false;
    }

    const appSourceDir = resolveInstallerSourceDir();
    const isSameDir = path.resolve(appSourceDir).toLowerCase() === path.resolve(finalTargetDir).toLowerCase();

    if (!isSameDir) {
      if (canWriteDirectly) {
        await copyAppRuntimeToTarget(appSourceDir, finalTargetDir, (pct) => {
          sendProgress(
            pct,
            lang === 'es' ? `Desempaquetando archivos del sistema... (${pct}%)` : `Extracting system files... (${pct}%)`,
            'extract'
          );
        });
      } else {
        // Target directory requires Administrator permissions (e.g. C:\Program Files\Wingetix)
        sendProgress(25, lang === 'es' ? 'Desempaquetando archivos del sistema... (35%)' : 'Extracting system files... (35%)', 'extract');
        const elevatedCopyScript = `
          $src = '${appSourceDir.replace(/'/g, "''")}'
          $dst = '${finalTargetDir.replace(/'/g, "''")}'
          if (!(Test-Path -LiteralPath $dst)) { New-Item -ItemType Directory -Path $dst -Force | Out-Null }
          Get-ChildItem -LiteralPath $src -Force | Where-Object { $_.Name -notin @('installer_mode.txt','app-unpacked','data','release-output','installer-output','dist','node_modules','.git') } | ForEach-Object {
            Copy-Item -LiteralPath $_.FullName -Destination $dst -Recurse -Force -ErrorAction SilentlyContinue
          }
          $resDir = Join-Path $dst 'resources'
          if (!(Test-Path -LiteralPath $resDir)) { New-Item -ItemType Directory -Path $resDir -Force | Out-Null }
          [System.IO.File]::WriteAllText((Join-Path $resDir 'installed_mode.txt'), 'installed', [System.Text.Encoding]::UTF8)
          [System.IO.File]::WriteAllText((Join-Path $resDir 'installed_lang.txt'), '${lang}', [System.Text.Encoding]::UTF8)
          Remove-Item -LiteralPath (Join-Path $resDir 'installer_mode.txt') -Force -ErrorAction SilentlyContinue
          Remove-Item -LiteralPath (Join-Path $resDir 'scripts\\installer_mode.txt') -Force -ErrorAction SilentlyContinue
        `;
        const encodedCmd = Buffer.from(elevatedCopyScript, 'utf16le').toString('base64');
        const elevatedOk = await new Promise((resolve) => {
          const ps = spawn('powershell.exe', [
            '-NoProfile', '-NonInteractive', '-Command',
            `try { $p = Start-Process powershell.exe -ArgumentList '-NoProfile -NonInteractive -WindowStyle Hidden -EncodedCommand ${encodedCmd}' -Verb RunAs -Wait -PassThru; exit $p.ExitCode } catch { exit 1 }`
          ], { windowsHide: true });
          ps.on('close', (code) => resolve(code === 0 && fs.existsSync(path.join(finalTargetDir, 'Wingetix.exe'))));
          ps.on('error', () => resolve(false));
        });

        if (!elevatedOk) {
          // Seamless fallback to standard user Programs directory (%LOCALAPPDATA%\Programs\Wingetix)
          finalTargetDir = fallbackUserDir;
          lastInstalledTargetDir = finalTargetDir;
          if (!fs.existsSync(finalTargetDir)) {
            fs.mkdirSync(finalTargetDir, { recursive: true });
          }
          await copyAppRuntimeToTarget(appSourceDir, finalTargetDir, (pct) => {
            sendProgress(
              pct,
              lang === 'es' ? `Desempaquetando archivos del sistema... (${pct}%)` : `Extracting system files... (${pct}%)`,
              'extract'
            );
          });
        }
      }
    } else {
      sendProgress(35, lang === 'es' ? 'Desempaquetando archivos del sistema... (35%)' : 'Extracting system files... (35%)', 'extract');
      await new Promise(r => setTimeout(r, 350));
    }

    // Verify Wingetix.exe exists in finalTargetDir; if not, fallback to user Programs directory
    if (!fs.existsSync(path.join(finalTargetDir, 'Wingetix.exe'))) {
      if (finalTargetDir !== fallbackUserDir) {
        finalTargetDir = fallbackUserDir;
      }
      if (!fs.existsSync(finalTargetDir)) {
        fs.mkdirSync(finalTargetDir, { recursive: true });
      }
      await copyAppRuntimeToTarget(appSourceDir, finalTargetDir);
    }

    lastInstalledTargetDir = finalTargetDir;

    // Mark target installation as installed_mode (and remove installer_mode.txt if present)
    try {
      const targetResDir = path.join(finalTargetDir, 'resources');
      if (!fs.existsSync(targetResDir)) fs.mkdirSync(targetResDir, { recursive: true });
      fs.writeFileSync(path.join(targetResDir, 'installed_mode.txt'), 'installed', 'utf8');
      fs.writeFileSync(path.join(targetResDir, 'installed_lang.txt'), lang, 'utf8');
      const leftoverInstallerFlag = path.join(targetResDir, 'installer_mode.txt');
      if (fs.existsSync(leftoverInstallerFlag)) {
        fs.unlinkSync(leftoverInstallerFlag);
      }
      const leftoverScriptFlag = path.join(targetResDir, 'scripts', 'installer_mode.txt');
      if (fs.existsSync(leftoverScriptFlag)) {
        fs.unlinkSync(leftoverScriptFlag);
      }
    } catch (_) {}

    // Write installation diagnostic trace
    try {
      const traceInfo = {
        timestamp: new Date().toISOString(),
        appSourceDir,
        requestedTargetDir: targetDir,
        finalTargetDir,
        exeExists: fs.existsSync(path.join(finalTargetDir, 'Wingetix.exe')),
        lang
      };
      fs.writeFileSync(
        path.join(os.tmpdir(), 'wingetix_last_install.json'),
        JSON.stringify(traceInfo, null, 2),
        'utf8'
      );
    } catch (_) {}

    sendProgress(55, lang === 'es' ? 'Archivos del sistema instalados y verificados (55%)' : 'System files installed and verified (55%)', 'extract');

    // WinGet Registration / PATH fix & auto-accept source agreements if requested
    if (enableWinget) {
      sendProgress(65, lang === 'es' ? 'Verificando y activando motor WinGet... (70%)' : 'Verifying and enabling WinGet engine... (70%)', 'winget');
      const scriptPath = getScriptPath('enable-winget.ps1');
      if (fs.existsSync(scriptPath)) {
        await new Promise((resolve) => {
          const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
            windowsHide: true
          });
          ps.on('close', () => resolve());
          ps.on('error', () => resolve());
          setTimeout(resolve, 25000);
        });
      }
      // Guarantee msstore & winget source agreements are permanently accepted for the current user
      try {
        await new Promise((resolve) => {
          const wg = spawnWinget(['list', '--name', 'WingetixInit', '--exact', '--accept-source-agreements', '--disable-interactivity']);
          wg.on('close', () => resolve());
          wg.on('error', () => resolve());
          setTimeout(resolve, 8000);
        });
      } catch (_) {}
    }

    sendProgress(80, lang === 'es' ? 'Creando accesos directos y registrando... (90%)' : 'Creating shortcuts and registering... (90%)', 'shortcuts');

    // Copy icon.ico to installed folder so shortcuts and Uninstall registry always display the crisp Wingetix icon
    const targetIconPath = path.join(finalTargetDir, 'icon.ico');
    try {
      const bundledIco = path.join(__dirname, 'icon.ico');
      if (fs.existsSync(bundledIco)) {
        fs.writeFileSync(targetIconPath, fs.readFileSync(bundledIco));
      }
    } catch (_) {}

    const targetExe = path.join(finalTargetDir, 'Wingetix.exe');
    const exePathForShortcut = fs.existsSync(targetExe) ? targetExe : path.join(appSourceDir, 'Wingetix.exe');
    const iconForShortcut = fs.existsSync(targetIconPath) ? targetIconPath : exePathForShortcut;
    const shortcutArgs = `--app-mode --lang=${lang}`;

    const shortcutOpts = {
      target: exePathForShortcut,
      cwd: finalTargetDir,
      args: shortcutArgs,
      description: 'Wingetix - The Ultimate Visual Control Panel for Windows',
      icon: iconForShortcut,
      iconIndex: 0,
      appUserModelId: 'com.joselyky.wingetix'
    };

    // Resolve true Windows Desktop & Start Menu paths via Electron's native Known Folder API
    let desktopDir = '';
    try {
      desktopDir = app.getPath('desktop');
    } catch (_) {
      desktopDir = path.join(os.homedir(), 'Desktop');
    }
    const startMenuProgramsDir = path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'Microsoft', 'Windows', 'Start Menu', 'Programs'
    );

    const desktopLnkPath = path.join(desktopDir, 'Wingetix.lnk');
    const startMenuLnkPath = path.join(startMenuProgramsDir, 'Wingetix.lnk');

    let desktopCreated = !createDesktop;
    if (createDesktop) {
      desktopCreated = createShortcutSafe(desktopLnkPath, shortcutOpts);
    }
    const startMenuCreated = createShortcutSafe(startMenuLnkPath, shortcutOpts);

    // Fallback to PowerShell WScript.Shell ONLY if native shell.writeShortcutLink returned false
    if (!desktopCreated || !startMenuCreated) {
      let shortcutPsScript = '';
      if (createDesktop && !desktopCreated) {
        shortcutPsScript += `
          $s1 = (New-Object -COM WScript.Shell).CreateShortcut('${desktopLnkPath.replace(/'/g, "''")}')
          $s1.TargetPath = '${exePathForShortcut.replace(/'/g, "''")}'
          $s1.Arguments = '${shortcutArgs}'
          $s1.WorkingDirectory = '${finalTargetDir.replace(/'/g, "''")}'
          $s1.IconLocation = '${iconForShortcut.replace(/'/g, "''")},0'
          $s1.Description = 'Wingetix - Visual Control Panel'
          $s1.Save()
        `;
      }
      if (!startMenuCreated) {
        shortcutPsScript += `
          $s2 = (New-Object -COM WScript.Shell).CreateShortcut('${startMenuLnkPath.replace(/'/g, "''")}')
          $s2.TargetPath = '${exePathForShortcut.replace(/'/g, "''")}'
          $s2.Arguments = '${shortcutArgs}'
          $s2.WorkingDirectory = '${finalTargetDir.replace(/'/g, "''")}'
          $s2.IconLocation = '${iconForShortcut.replace(/'/g, "''")},0'
          $s2.Description = 'Wingetix - Visual Control Panel'
          $s2.Save()
        `;
      }
    if (shortcutPsScript) {
        try {
          const encodedPs = Buffer.from(shortcutPsScript, 'utf16le').toString('base64');
          await new Promise((resolve) => {
            const ps = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedPs], {
              windowsHide: true
            });
            ps.on('close', () => resolve());
            ps.on('error', () => resolve());
            setTimeout(resolve, 6000);
          });
        } catch (_) {}
      }
    }

    // Registry Uninstall entry (encoded UTF-16LE so spaces/accents in paths never break)
    try {
      const regCmd = `
        $regPath = 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\Wingetix'
        if (!(Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
        Set-ItemProperty -Path $regPath -Name 'DisplayName' -Value 'Wingetix' -Force
        Set-ItemProperty -Path $regPath -Name 'DisplayVersion' -Value '1.2.0' -Force
        Set-ItemProperty -Path $regPath -Name 'Publisher' -Value 'Wingetix' -Force
        Set-ItemProperty -Path $regPath -Name 'InstallLocation' -Value '${finalTargetDir.replace(/'/g, "''")}' -Force
        Set-ItemProperty -Path $regPath -Name 'DisplayIcon' -Value '${iconForShortcut.replace(/'/g, "''")},0' -Force
        Set-ItemProperty -Path $regPath -Name 'UninstallString' -Value '"${exePathForShortcut.replace(/'/g, "''")}" --uninstall' -Force
      `;
      const encodedReg = Buffer.from(regCmd, 'utf16le').toString('base64');
      const psReg = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-EncodedCommand', encodedReg], { windowsHide: true });
      psReg.on('close', () => {});
    } catch (_) {}

    // Save language
    try {
      const langFilePath = path.join(finalTargetDir, 'resources', 'installed_lang.txt');
      const langDir = path.dirname(langFilePath);
      if (!fs.existsSync(langDir)) fs.mkdirSync(langDir, { recursive: true });
      fs.writeFileSync(langFilePath, lang, 'utf8');
    } catch (_) {}

    sendProgress(100, lang === 'es' ? '¡Instalación completada con éxito! (100%)' : 'Installation completed successfully! (100%)', 'shortcuts');

    setTimeout(() => {
      if (installerWindow && !installerWindow.isDestroyed()) {
        installerWindow.webContents.send('installer:done', {
          success: true,
          targetExe: exePathForShortcut,
          lang
        });
      }
    }, 400);

  } catch (err) {
    console.error('[Installer] Installation error:', err);
    sendProgress(100, 'Error: ' + err.message);
  }
});

ipcMain.on('installer:launch-app', async () => {
  const localAppData = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
  const defaultUserDir = path.join(localAppData, 'Programs', 'Wingetix');
  const progFilesDir = path.join(process.env.ProgramFiles || 'C:\\Program Files', 'Wingetix');

  let exeToRun = null;
  const candidateDirs = [
    lastInstalledTargetDir,
    defaultUserDir,
    progFilesDir,
    resolveInstallerSourceDir()
  ].filter(Boolean);

  for (const dir of candidateDirs) {
    const candidateExe = path.join(dir, 'Wingetix.exe');
    if (fs.existsSync(candidateExe)) {
      exeToRun = candidateExe;
      break;
    }
  }

  // Never fall back to a temporary NSIS extraction directory that gets deleted on quit!
  if (!exeToRun || exeToRun.toLowerCase().includes('\\appdata\\local\\temp\\')) {
    try {
      if (!fs.existsSync(defaultUserDir)) {
        fs.mkdirSync(defaultUserDir, { recursive: true });
      }
      await copyAppRuntimeToTarget(resolveInstallerSourceDir(), defaultUserDir);
      const resDir = path.join(defaultUserDir, 'resources');
      if (!fs.existsSync(resDir)) fs.mkdirSync(resDir, { recursive: true });
      fs.writeFileSync(path.join(resDir, 'installed_mode.txt'), 'installed', 'utf8');
      fs.writeFileSync(path.join(resDir, 'installed_lang.txt'), lastInstalledLang || 'en', 'utf8');
      const flag1 = path.join(resDir, 'installer_mode.txt');
      const flag2 = path.join(resDir, 'scripts', 'installer_mode.txt');
      if (fs.existsSync(flag1)) fs.unlinkSync(flag1);
      if (fs.existsSync(flag2)) fs.unlinkSync(flag2);
      const copiedExe = path.join(defaultUserDir, 'Wingetix.exe');
      if (fs.existsSync(copiedExe)) {
        exeToRun = copiedExe;
      }
    } catch (_) {}
  }

  if (!exeToRun) {
    exeToRun = process.execPath;
  }

  // Ensure installed_mode.txt is present in the target exe's resources folder
  // so launching Wingetix.exe directly (even via explorer.exe / shell.openPath without args)
  // ALWAYS boots into the main Wingetix application and NEVER into the installer!
  const workDir = path.dirname(exeToRun);
  const langVal = lastInstalledLang || 'en';
  try {
    const resDir = path.join(workDir, 'resources');
    if (fs.existsSync(resDir)) {
      fs.writeFileSync(path.join(resDir, 'installed_mode.txt'), 'installed', 'utf8');
      fs.writeFileSync(path.join(resDir, 'installed_lang.txt'), langVal, 'utf8');
      const f1 = path.join(resDir, 'installer_mode.txt');
      const f2 = path.join(resDir, 'scripts', 'installer_mode.txt');
      if (fs.existsSync(f1)) fs.unlinkSync(f1);
      if (fs.existsSync(f2)) fs.unlinkSync(f2);
    }
  } catch (_) {}

  // Switch active instance from Installer Mode to App Mode and open the main window immediately!
  // This guarantees 100% instant opening without NSIS/Portable wrapper teardown races.
  isInstallerMode = false;
  if (!process.argv.includes('--app-mode')) {
    process.argv.push('--app-mode');
  }
  if (!process.argv.some(a => typeof a === 'string' && a.startsWith('--lang='))) {
    process.argv.push(`--lang=${langVal}`);
  }
  try {
    saveAppSettings({ language: langVal });
  } catch (_) {}

  try {
    createWindow();
    if (installerWindow && !installerWindow.isDestroyed()) {
      installerWindow.close();
      installerWindow = null;
    }
    return;
  } catch (err) {
    console.error('[Installer] In-process window switch failed, falling back to external spawn:', err);
  }

  // Fallback external spawn if createWindow ever throws
  try {
    if (installerWindow && !installerWindow.isDestroyed()) {
      installerWindow.hide();
    }
  } catch (_) {}

  const cleanEnv = { ...process.env };
  delete cleanEnv.ELECTRON_RUN_AS_NODE;
  delete cleanEnv.PORTABLE_EXECUTABLE_FILE;
  delete cleanEnv.PORTABLE_EXECUTABLE_DIR;
  delete cleanEnv.PORTABLE_EXECUTABLE_APP_FILENAME;

  try {
    spawn('explorer.exe', [exeToRun], {
      cwd: workDir,
      env: cleanEnv,
      detached: true,
      stdio: 'ignore',
      windowsHide: false
    }).unref();
  } catch (_) {}

  setTimeout(() => {
    app.quit();
  }, 900);
});

// ═══════════════════════════════════════════════════════════════════════════════
// WINGET OUTPUT PARSER
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Robust locale-independent parser for `winget upgrade` plain-text output.
 *
 * STRATEGY — Separator-anchored column mapping:
 *  1. Find the separator line (long run of dashes) — this is the structural anchor.
 *  2. Read the header line immediately above it.
 *  3. Split the header by 2+ consecutive spaces to get column tokens in order.
 *  4. Record the CHARACTER POSITION of each token in the header line.
 *  5. For every data row, slice each column using those fixed character positions.
 *
 * WHY THIS IS MORE ROBUST THAN SPLITTING BY SPACES:
 *  - Package names contain spaces ("Microsoft Visual Studio Code") — split() breaks them.
 *  - Version strings may have unusual characters.
 *  - Locale doesn't matter: we never match by column name ("Name" vs "Nombre").
 *  - The separator line guarantees the column widths are exactly as rendered.
 *
 * COLUMN ORDER (winget always outputs in this order regardless of language):
 *  0: Name  1: Id  2: Version  3: Available  4: Source
 */
function parseWingetOutput(raw) {
  const packages = [];

  // 1. Normalize: strip BOM, ANSI escape codes, unify CRLF → LF
  const cleaned = raw
    .replace(/^\uFEFF/, '')
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = cleaned.split('\n');

  // 2. Find the separator line (only dashes/box chars, length > 10)
  let sepIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].replace(/\s/g, '');
    if (stripped.length > 10 && /^[-─\u2500\u2015]+$/.test(stripped)) {
      sepIdx = i;
      break;
    }
  }
  if (sepIdx < 1) return packages;

  // 3. Find the header line: first non-empty line above the separator
  let headerLine = '';
  for (let i = sepIdx - 1; i >= 0; i--) {
    if (lines[i].trim()) { headerLine = lines[i]; break; }
  }
  if (!headerLine) return packages;

  // 4. Map column token positions in the header line
  //    Split by 2+ spaces to find tokens, then locate each in the header string
  const tokens = headerLine.split(/  +/).map(s => s.trim()).filter(Boolean);
  if (tokens.length < 2) return packages;

  const colStarts = [];
  let searchFrom = 0;
  for (const tok of tokens) {
    const idx = headerLine.indexOf(tok, searchFrom);
    if (idx === -1) break;
    colStarts.push(idx);
    searchFrom = idx + tok.length;
  }
  if (colStarts.length < 2) return packages;

  // 5. Helper: extract cell at column index using fixed character positions
  const cell = (line, colIdx) => {
    if (colIdx >= colStarts.length) return '';
    const start = colStarts[colIdx];
    const end   = colIdx + 1 < colStarts.length ? colStarts[colIdx + 1] : line.length;
    if (start >= line.length) return '';
    return line.slice(start, end).trim();
  };

  // 6. Parse data rows (skip separator, summary lines, short lines)
  const seen = new Set(); // deduplicate by ID
  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (/^[-─\u2500]{5,}/.test(trimmed)) continue;        // another separator
    if (/^\d+\s+\w/.test(trimmed)) continue;              // "2 actualizaciones disponibles."
    if (line.length < colStarts[1] + 1) continue;         // too short to have an ID column

    const name      = cell(line, 0);
    const id        = cell(line, 1);
    const version   = cell(line, 2);
    const available = cell(line, 3);
    const source    = cell(line, 4) || 'winget';

    // Require both name and a valid-looking ID (must contain a dot or be non-empty)
    if (!name || !id) continue;
    if (seen.has(id)) continue; // if multiple rows same ID, keep first (highest priority)
    seen.add(id);

    packages.push({ name, id, version, available, source });
  }

  return packages;
}

// Helper to attach icons to Winget upgrade packages
async function attachIconsToPackages(packages) {
  if (!packages || packages.length === 0) return packages;
  
  return new Promise((resolve) => {
    const targetScript = getScriptPath('attach-icons.ps1');
    if (!fs.existsSync(targetScript) || targetScript.toLowerCase().includes('.asar')) {
      console.warn('[attachIconsToPackages] Script not found:', targetScript);
      return resolve(packages);
    }

    const tmpInput = path.join(os.tmpdir(), `winget_icons_in_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.json`);
    try {
      fs.writeFileSync(tmpInput, JSON.stringify(packages.map(p => ({ name: p.name, id: p.id }))), 'utf8');
    } catch (_) {
      return resolve(packages);
    }

    const proc = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-File', targetScript,
      '-InputJsonPath', tmpInput
    ], {
      windowsHide: true,
      maxBuffer: 50 * 1024 * 1024
    });

    const chunks = [];
    proc.stdout.on('data', d => chunks.push(d));
    proc.on('close', () => {
      try { if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput); } catch (_) {}
      const output = Buffer.concat(chunks).toString('utf8').trim();
      try {
        const parsed = JSON.parse(output);
        const iconList = Array.isArray(parsed) ? parsed : [parsed].filter(Boolean);
        const map = new Map(iconList.map(i => [i.id, i]));
        packages.forEach(pkg => {
          const info = map.get(pkg.id);
          pkg.iconBase64 = (info && info.iconBase64) || '';
          pkg.publisher = (info && info.publisher) || (pkg.id.includes('.') ? pkg.id.split('.')[0] : 'Desconocido');
          pkg.sizeMb = (info && info.sizeMb) ? Number(info.sizeMb) : 0;
        });
        resolve(packages);
      } catch (_) {
        packages.forEach(pkg => {
          if (!pkg.publisher) pkg.publisher = pkg.id.includes('.') ? pkg.id.split('.')[0] : 'Desconocido';
          if (pkg.sizeMb === undefined) pkg.sizeMb = 0;
        });
        resolve(packages);
      }
    });
    proc.on('error', () => {
      try { if (fs.existsSync(tmpInput)) fs.unlinkSync(tmpInput); } catch (_) {}
      resolve(packages);
    });
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// IPCMAIN: LIST UPGRADES
// ═══════════════════════════════════════════════════════════════════════════════
ipcMain.handle('winget:list-upgrades', async () => {
  return new Promise((resolve) => {
    const env = buildEnv();
    const proc = spawnWinget(['upgrade', '--accept-source-agreements', '--disable-interactivity'], { env });

    const chunks = [], errChunks = [];
    proc.stdout.on('data', d => chunks.push(d));
    proc.stderr.on('data', d => errChunks.push(d));

    proc.on('close', async code => {
      const raw    = Buffer.concat(chunks).toString('utf8');
      const stderr = Buffer.concat(errChunks).toString('utf8');

      const isMissing = code === 9009 || 
        stderr.toLowerCase().includes('not recognized') || 
        stderr.toLowerCase().includes('no se reconoce') ||
        raw.toLowerCase().includes('not recognized') ||
        raw.toLowerCase().includes('no se reconoce');

      if (isMissing) {
        return resolve({
          success: false,
          wingetMissing: true,
          error: 'WinGet engine is not installed or enabled in this Windows edition.',
          raw, stderr, code
        });
      }

      try {
        let packages = parseWingetOutput(raw);
        packages = await attachIconsToPackages(packages);
        resolve({ success: true, packages, raw, stderr, code });
      } catch (err) {
        resolve({ success: false, error: err.message, raw, stderr, code });
      }
    });

    proc.on('error', err => resolve({
      success: false,
      wingetMissing: true,
      error: `No se pudo ejecutar winget: ${err.message}\n\nInstala "App Installer" desde la Microsoft Store o activa WinGet en la terminal.`,
      raw: '', stderr: '', code: -1,
    }));
  });
});

ipcMain.handle('winget:check-status', async () => {
  const bin = resolveWingetBinary();
  const physicalFound = fs.existsSync(bin);
  return new Promise((resolve) => {
    try {
      const proc = spawnWinget(['--version']);
      let out = '';
      proc.stdout?.on('data', d => { out += d.toString('utf8'); });
      proc.on('close', code => {
        resolve({
          available: code === 0,
          version: out.trim() || null,
          path: bin,
          physicalFound
        });
      });
      proc.on('error', () => {
        resolve({
          available: false,
          version: null,
          path: bin,
          physicalFound
        });
      });
      setTimeout(() => {
        resolve({
          available: physicalFound,
          version: null,
          path: bin,
          physicalFound
        });
      }, 3500);
    } catch (_) {
      resolve({ available: physicalFound, version: null, path: bin, physicalFound });
    }
  });
});

// ─── IPCMAIN: ENABLE WINGET IN TERMINAL ───────────────────────────────────────
ipcMain.handle('winget:enable-in-terminal', async () => {
  return new Promise((resolve) => {
    const targetScript = getScriptPath('enable-winget.ps1');

    if (!fs.existsSync(targetScript) || targetScript.toLowerCase().includes('.asar')) {
      return resolve({
        success: false,
        error: `No se encontro el script de activacion en ${targetScript}`,
      });
    }

    const proc = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-File', targetScript,
    ], { windowsHide: true });

    let stdout = '', stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });

    proc.on('close', code => {
      try {
        const wg = spawnWinget(['list', '--name', 'WingetixInit', '--exact', '--accept-source-agreements', '--disable-interactivity']);
        wg.on('close', () => resolve({ success: code === 0, stdout, stderr, code }));
        wg.on('error', () => resolve({ success: code === 0, stdout, stderr, code }));
        setTimeout(() => resolve({ success: code === 0, stdout, stderr, code }), 6000);
      } catch (_) {
        resolve({ success: code === 0, stdout, stderr, code });
      }
    });

    proc.on('error', err => {
      resolve({ success: false, error: err.message, code: -1 });
    });
  });
});

// ─── IPCMAIN: EXPORT & IMPORT WINGET PACKAGES ─────────────────────────────────
ipcMain.handle('winget:export-packages', async () => {
  if (!mainWindow) return { success: false, error: 'Ventana no disponible' };
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Exportar lista de paquetes WinGet',
    defaultPath: 'winget-packages.json',
    filters: [{ name: 'Archivo JSON de WinGet', extensions: ['json'] }]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  return new Promise((resolve) => {
    const env = buildEnv();
    const proc = spawnWinget(['export', '-o', `"${filePath}"`, '--include-versions', '--accept-source-agreements'], {
      env
    });

    let stderr = '';
    proc.stderr.on('data', d => { stderr += d.toString('utf8'); });
    proc.on('close', code => {
      resolve({ success: code === 0, filePath, code, error: stderr });
    });
    proc.on('error', err => {
      resolve({ success: false, error: err.message });
    });
  });
});

ipcMain.handle('winget:import-packages', async () => {
  if (!mainWindow) return { success: false, error: 'Ventana no disponible' };
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Importar lista de paquetes WinGet',
    properties: ['openFile'],
    filters: [{ name: 'Archivo JSON de WinGet', extensions: ['json'] }]
  });

  if (canceled || !filePaths?.length) return { success: false, canceled: true };

  const filePath = filePaths[0];
  return new Promise((resolve) => {
    const env = buildEnv();
    const proc = spawnWinget(['import', '--import-file', `"${filePath}"`, '--accept-package-agreements', '--accept-source-agreements'], {
      env
    });

    let stdout = '', stderr = '';
    proc.stdout.on('data', d => {
      const text = d.toString('utf8');
      stdout += text;
      mainWindow?.webContents.send('winget:log', { type: 'output', text });
    });
    proc.stderr.on('data', d => {
      const text = d.toString('utf8');
      stderr += text;
      mainWindow?.webContents.send('winget:log', { type: 'warning', text });
    });
    proc.on('close', code => {
      resolve({ success: code === 0, filePath, code, stdout, stderr });
    });
    proc.on('error', err => {
      resolve({ success: false, error: err.message });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// SOFTWARE PACKS & BUNDLE STUDIO ENGINE (1-Click Deployment)
// ═══════════════════════════════════════════════════════════════════════════════
let activeBundleProc = null;
let isBundleCancelled = false;

ipcMain.handle('bundles:save-pack', async (_e, packData) => {
  if (!mainWindow) return { success: false, error: 'Window not available' };

  let defaultDir = '';
  const portableDataPacks = path.join(activeDataDir, 'packs');
  if (isPortableMode) {
    try { fs.mkdirSync(portableDataPacks, { recursive: true }); } catch (_) {}
  }
  if (fs.existsSync(portableDataPacks)) {
    defaultDir = portableDataPacks;
  }

  const cleanName = (packData?.name || 'My-Software-Pack').replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '-');
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    title: 'Create Software Pack',
    defaultPath: path.join(defaultDir, `${cleanName}.wingetix`),
    filters: [
      { name: 'Wingetix Software Pack (*.wingetix)', extensions: ['wingetix'] },
      { name: '1-Click Batch Installer Script (*.bat)', extensions: ['bat'] },
      { name: 'JSON Package Manifest (*.json)', extensions: ['json'] }
    ]
  });

  if (canceled || !filePath) return { success: false, canceled: true };

  try {
    if (filePath.toLowerCase().endsWith('.bat')) {
      let bat = `@echo off\r\n`;
      bat += `title Installing ${packData?.name || 'Software Pack'}\r\n`;
      bat += `echo ======================================================\r\n`;
      bat += `echo   Wingetix - 1-Click Software Pack Installer\r\n`;
      bat += `echo   Pack: ${packData?.name || 'Software Pack'}\r\n`;
      bat += `echo ======================================================\r\n\r\n`;
      if (Array.isArray(packData?.packages)) {
        packData.packages.forEach((pkg, idx) => {
          const id = pkg.id;
          const name = pkg.name || id;
          bat += `echo [${idx + 1}/${packData.packages.length}] Installing ${name} (${id})...\r\n`;
          bat += `winget install --id "${id}" --exact --accept-source-agreements --accept-package-agreements\r\n\r\n`;
        });
      }
      bat += `echo ======================================================\r\n`;
      bat += `echo Installation completed!\r\n`;
      bat += `pause\r\n`;
      fs.writeFileSync(filePath, bat, 'utf8');
    } else {
      packData.format = 'wingetix-pack';
      packData.version = '1.0';
      const jsonContent = JSON.stringify(packData, null, 2);
      fs.writeFileSync(filePath, jsonContent, 'utf8');
    }
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('bundles:load-pack', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' };

  let defaultDir = '';
  const portableDataPacks = path.join(activeDataDir, 'packs');
  if (isPortableMode) {
    try { fs.mkdirSync(portableDataPacks, { recursive: true }); } catch (_) {}
  }
  if (fs.existsSync(portableDataPacks)) {
    defaultDir = portableDataPacks;
  }

  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    title: 'Load Software Pack',
    defaultPath: defaultDir || undefined,
    properties: ['openFile'],
    filters: [
      { name: 'Software Packs (*.wingetix, *.json)', extensions: ['wingetix', 'json'] }
    ]
  });

  if (canceled || !filePaths?.length) return { success: false, canceled: true };

  const filePath = filePaths[0];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    let packages = [];
    let packName = path.basename(filePath, path.extname(filePath));
    let packDescription = '';

    // Wingetix Pack format or any pack containing packages array
    if (Array.isArray(parsed.packages)) {
      packages = parsed.packages;
      packName = parsed.name || packName;
      packDescription = parsed.description || '';
    }
    // Official WinGet export schema
    else if (Array.isArray(parsed.Sources)) {
      for (const src of parsed.Sources) {
        if (Array.isArray(src.Packages)) {
          for (const pkg of src.Packages) {
            const id = pkg.PackageIdentifier || pkg.Id || '';
            if (id) {
              packages.push({
                id,
                name: id,
                version: pkg.Version || 'latest',
                source: src.SourceDetails?.Name || 'winget'
              });
            }
          }
        }
      }
    }
    // Generic array format
    else if (Array.isArray(parsed)) {
      packages = parsed.map(item => {
        if (typeof item === 'string') return { id: item, name: item, version: 'latest', source: 'winget' };
        return {
          id: item.id || item.PackageIdentifier || '',
          name: item.name || item.id || '',
          version: item.version || 'latest',
          source: item.source || 'winget'
        };
      }).filter(p => !!p.id);
    }

    const packObj = {
      name: packName,
      description: packDescription,
      packages
    };

    return {
      success: true,
      filePath,
      pack: packObj,
      name: packName,
      description: packDescription,
      packages
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.on('bundles:cancel-install', () => {
  isBundleCancelled = true;
  if (activeBundleProc) {
    try { activeBundleProc.kill(); } catch (_) {}
    activeBundleProc = null;
  }
});

ipcMain.on('bundles:install-pack', async (event, packages) => {
  if (!Array.isArray(packages) || packages.length === 0) {
    event.sender.send('bundles:install-done', { success: false, error: 'No packages provided' });
    return;
  }

  isBundleCancelled = false;
  activeBundleProc = null;
  const results = [];
  const total = packages.length;

  for (let i = 0; i < total; i++) {
    if (isBundleCancelled) {
      event.sender.send('bundles:install-progress', {
        index: i,
        total,
        status: 'cancelled',
        message: 'Pack installation cancelled by user.'
      });
      break;
    }

    const pkg = packages[i];
    const pkgId = pkg.id;
    const pkgName = pkg.name || pkgId;
    const pkgSource = pkg.source || 'winget';

    event.sender.send('bundles:install-progress', {
      index: i + 1,
      total,
      pkgId,
      pkgName,
      status: 'installing',
      percent: Math.round((i / total) * 100),
      message: `Installing ${pkgName} (${i + 1} of ${total})...`
    });

    const runSingleBundleInstall = (args) => new Promise((resolve) => {
      const proc = spawnWinget(args);
      activeBundleProc = proc;

      let stdout = '', stderr = '';
      proc.stdout?.on('data', d => {
        const text = d.toString('utf8');
        stdout += text;
        event.sender.send('winget:log', { type: 'output', text });

        if (isBundleCancelled) return;

        // Parse download MB / GB and percentage
        const mbMatch = text.match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)\s*[\/|de]\s*(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
        if (mbMatch) {
          const cur = parseFloat(mbMatch[1]);
          const unit1 = mbMatch[2].toUpperCase();
          const tot = parseFloat(mbMatch[3]);
          const unit2 = mbMatch[4].toUpperCase();
          const curMB = unit1 === 'GB' ? cur * 1024 : (unit1 === 'KB' ? cur / 1024 : cur);
          const totMB = unit2 === 'GB' ? tot * 1024 : (unit2 === 'KB' ? tot / 1024 : tot);
          if (totMB > 0) {
            const subPct = Math.min(99, Math.round((curMB / totMB) * 100));
            const overallPct = Math.min(99, Math.round(((i + (subPct / 100)) / total) * 100));
            event.sender.send('bundles:install-progress', {
              index: i + 1,
              current: i + 1,
              total,
              pkgId,
              pkgName,
              status: 'downloading',
              percent: overallPct,
              message: `Downloading ${pkgName}: ${curMB.toFixed(1)} MB / ${totMB.toFixed(1)} MB (${subPct}%)`
            });
          }
        } else {
          const tLower = text.toLowerCase();
          if (tLower.includes('iniciando la instalaci') || tLower.includes('starting package install')) {
            const overallPct = Math.min(99, Math.round(((i + 0.85) / total) * 100));
            event.sender.send('bundles:install-progress', {
              index: i + 1,
              current: i + 1,
              total,
              pkgId,
              pkgName,
              status: 'installing',
              percent: overallPct,
              message: `Installing ${pkgName}...`
            });
          } else if (tLower.includes('hash') && (tLower.includes('comprob') || tLower.includes('verif') || tLower.includes('success'))) {
            const overallPct = Math.min(99, Math.round(((i + 0.75) / total) * 100));
            event.sender.send('bundles:install-progress', {
              index: i + 1,
              current: i + 1,
              total,
              pkgId,
              pkgName,
              status: 'verifying',
              percent: overallPct,
              message: `Verifying ${pkgName}...`
            });
          }
        }
      });
      proc.stderr?.on('data', d => {
        const text = d.toString('utf8');
        stderr += text;
        event.sender.send('winget:log', { type: 'warning', text });
      });

      proc.on('close', code => {
        activeBundleProc = null;
        const outLower = (stdout + ' ' + stderr).toLowerCase();
        let isSuccess = code === 0 ||
                        code === 3010 ||
                        code === -1978236883 ||
                        code === 2316632109 ||
                        code === -1978335189 ||
                        code === 2316632107;
        const isAlreadyInstalled = code === 2316632109 ||
                                   code === -1978236883 ||
                                   code === -1978335189 ||
                                   code === 2316632107 ||
                                   outLower.includes('ya instalado') ||
                                   outLower.includes('already installed') ||
                                   outLower.includes('no se ha encontrado ninguna actualización') ||
                                   outLower.includes('no newer package versions');

        if (isAlreadyInstalled ||
            outLower.includes('correctamente') ||
            outLower.includes('successfully installed') ||
            outLower.includes('completada con éxito')) {
          isSuccess = true;
        }

        resolve({
          pkgId,
          pkgName,
          code,
          success: isSuccess,
          alreadyInstalled: isAlreadyInstalled,
          stdout,
          stderr
        });
      });

      proc.on('error', err => {
        activeBundleProc = null;
        resolve({
          pkgId,
          pkgName,
          code: -1,
          success: false,
          error: err.message,
          stdout,
          stderr
        });
      });
    });

    const isNamespacedId = pkgId.includes('.') && !pkgId.includes(' ') && !pkgId.startsWith('{');
    let installArgs = [];
    if (isNamespacedId) {
      installArgs = [
        'install',
        '--id', pkgId,
        '--exact',
        '--source', 'winget',
        '--force',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity'
      ];
    } else {
      installArgs = [
        'install',
        pkgName || pkgId,
        '--source', 'winget',
        '--force',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity'
      ];
    }

    let outcome = await runSingleBundleInstall(installArgs);

    // If first attempt failed and we used --source winget, fallback without source filter
    if (!outcome.success && !isBundleCancelled) {
      const fallbackQuery = pkgName || pkgId;
      event.sender.send('winget:log', { type: 'output', text: `Retrying installation for ${pkgName} without source restriction...\n` });
      const fallbackArgs = [
        'install',
        fallbackQuery,
        '--force',
        '--accept-package-agreements',
        '--accept-source-agreements',
        '--disable-interactivity'
      ];
      outcome = await runSingleBundleInstall(fallbackArgs);
    }

    results.push(outcome);

    event.sender.send('bundles:install-progress', {
      index: i + 1,
      total,
      pkgId,
      pkgName,
      status: outcome.success ? 'success' : 'failed',
      percent: Math.round(((i + 1) / total) * 100),
      message: outcome.success ? `Successfully installed ${pkgName}.` : `Failed to install ${pkgName}.`
    });
  }

  event.sender.send('bundles:install-done', {
    success: results.every(r => r.success),
    results
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// WINGET PINNING & PAUSING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════
const pinnedStorePath = path.join(activeDataDir, 'pinned_packages.json');

function loadPinnedStore() {
  try {
    if (fs.existsSync(pinnedStorePath)) {
      const data = fs.readFileSync(pinnedStorePath, 'utf8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('[loadPinnedStore] Error reading pinned store:', err.message);
  }
  return [];
}

function savePinnedStore(list) {
  try {
    fs.writeFileSync(pinnedStorePath, JSON.stringify(list, null, 2), 'utf8');
  } catch (err) {
    console.error('[savePinnedStore] Error saving pinned store:', err.message);
  }
}

function parseWingetPinOutput(raw) {
  const pins = [];
  if (!raw || typeof raw !== 'string') return pins;

  const cleaned = raw
    .replace(/^\uFEFF/, '')
    .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n');

  const lines = cleaned.split('\n');
  let sepIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    const stripped = lines[i].replace(/\s/g, '');
    if (stripped.length > 5 && /^[-─\u2500\u2015]+$/.test(stripped)) {
      sepIdx = i;
      break;
    }
  }
  if (sepIdx < 1) return pins;

  let headerLine = '';
  for (let i = sepIdx - 1; i >= 0; i--) {
    if (lines[i].trim()) { headerLine = lines[i]; break; }
  }
  if (!headerLine) return pins;

  const tokens = headerLine.split(/  +/).map(s => s.trim()).filter(Boolean);
  if (tokens.length < 2) return pins;

  const colStarts = [];
  let searchFrom = 0;
  for (const tok of tokens) {
    const idx = headerLine.indexOf(tok, searchFrom);
    if (idx === -1) break;
    colStarts.push(idx);
    searchFrom = idx + tok.length;
  }
  if (colStarts.length < 2) return pins;

  const cell = (line, colIdx) => {
    if (colIdx >= colStarts.length) return '';
    const start = colStarts[colIdx];
    const end = colIdx + 1 < colStarts.length ? colStarts[colIdx + 1] : line.length;
    if (start >= line.length) return '';
    return line.slice(start, end).trim();
  };

  for (let i = sepIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed || /^[-─\u2500]{5,}/.test(trimmed)) continue;
    if (line.length < colStarts[1] + 1) continue;

    const name = cell(line, 0);
    const id = cell(line, 1);
    const version = cell(line, 2);
    const source = cell(line, 3) || 'winget';
    const pinType = cell(line, 4) || 'Blocking';

    if (!name || !id) continue;
    pins.push({ name, id, version, source, pinType });
  }

  return pins;
}

ipcMain.handle('winget:pin-list', async () => {
  return new Promise((resolve) => {
    const localPins = loadPinnedStore();
    const env = buildEnv();
    const proc = spawnWinget(['pin', 'list', '--accept-source-agreements', '--disable-interactivity'], {
      env
    });

    let stdout = '';
    proc.stdout.on('data', d => { stdout += d.toString('utf8'); });
    proc.on('close', async () => {
      const cliPins = parseWingetPinOutput(stdout);
      
      const map = new Map();
      localPins.forEach(p => map.set(p.id, p));
      cliPins.forEach(cp => {
        if (!map.has(cp.id)) {
          map.set(cp.id, {
            id: cp.id,
            name: cp.name || cp.id,
            version: cp.version || '—',
            source: cp.source || 'winget',
            pinType: cp.pinType || 'Blocking',
            pinnedAt: new Date().toISOString()
          });
        } else {
          const existing = map.get(cp.id);
          existing.version = cp.version || existing.version;
          existing.pinType = cp.pinType || existing.pinType;
        }
      });

      const merged = Array.from(map.values());
      savePinnedStore(merged);

      const needIcons = merged.filter(p => !p.iconBase64);
      if (needIcons.length > 0) {
        try {
          await attachIconsToPackages(merged);
        } catch (_) {}
      }

      resolve(merged);
    });

    proc.on('error', () => {
      resolve(localPins);
    });
  });
});

ipcMain.handle('winget:pin-add', async (_e, pkg) => {
  const pkgId = typeof pkg === 'string' ? pkg : pkg?.id;
  if (!pkgId) return { success: false, error: 'ID de paquete no proporcionado' };

  return new Promise((resolve) => {
    const env = buildEnv();
    const proc = spawnWinget(['pin', 'add', '--id', `"${pkgId}"`, '--blocking', '--accept-source-agreements', '--disable-interactivity'], {
      env
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', d => { stderr += d.toString('utf8'); });

    proc.on('close', (code) => {
      const localPins = loadPinnedStore();
      const existingIdx = localPins.findIndex(p => p.id === pkgId);
      const newPin = {
        id: pkgId,
        name: (typeof pkg === 'object' && pkg?.name) ? pkg.name : pkgId,
        version: (typeof pkg === 'object' && pkg?.version) ? pkg.version : '—',
        available: (typeof pkg === 'object' && pkg?.available) ? pkg.available : '',
        publisher: (typeof pkg === 'object' && pkg?.publisher) ? pkg.publisher : '',
        iconBase64: (typeof pkg === 'object' && pkg?.iconBase64) ? pkg.iconBase64 : '',
        source: (typeof pkg === 'object' && pkg?.source) ? pkg.source : 'winget',
        pinType: 'Blocking',
        pinnedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        localPins[existingIdx] = { ...localPins[existingIdx], ...newPin };
      } else {
        localPins.push(newPin);
      }
      savePinnedStore(localPins);

      resolve({ success: code === 0, id: pkgId, code, stdout, stderr });
    });

    proc.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
});

ipcMain.handle('winget:pin-remove', async (_e, pkgId) => {
  if (!pkgId) return { success: false, error: 'ID de paquete no proporcionado' };

  return new Promise((resolve) => {
    const env = buildEnv();
    const proc = spawnWinget(['pin', 'remove', '--id', `"${pkgId}"`, '--accept-source-agreements', '--disable-interactivity'], {
      env
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', d => { stderr += d.toString('utf8'); });

    proc.on('close', (code) => {
      const localPins = loadPinnedStore().filter(p => p.id !== pkgId);
      savePinnedStore(localPins);
      resolve({ success: true, id: pkgId, code, stdout, stderr });
    });

    proc.on('error', (err) => {
      const localPins = loadPinnedStore().filter(p => p.id !== pkgId);
      savePinnedStore(localPins);
      resolve({ success: true, id: pkgId, error: err.message });
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IPCMAIN: UPGRADE SELECTED PACKAGES
// ═══════════════════════════════════════════════════════════════════════════════
/**
 * Upgrades each package by its exact ID.
 *
 * COMMAND: winget upgrade --id "<ID>" --silent --force --accept-package-agreements --accept-source-agreements
 *
 * WHY --force:
 *   Apps like Chrome and VS Code have their own auto-updaters. When they update
 *   themselves, winget's installed-version registry becomes stale. Without --force,
 *   winget compares the stale record with the available version, finds no difference,
 *   and returns error 0x8A150014 ("no applicable update"). --force bypasses this
 *   version comparison and installs the latest version unconditionally.
 *
 * WHY --silent:
 *   Same behaviour as `winget upgrade --all` — prevents installer UI dialogs from
 *   blocking the process. Chrome and VSCode both support silent installation.
 *
 * WHY quoted ID:
 *   While winget IDs don't normally contain spaces, quoting is defensive programming
 *   and prevents shell word-splitting on unusual IDs.
 */
// Helper to query remote Content-Length via HTTP HEAD following redirects
function getTotalSizeFromUrl(url, maxRedirects = 5) {
  return new Promise(resolve => {
    if (!url || maxRedirects <= 0) return resolve(0);
    try {
      const client = url.startsWith('https:') ? https : http;
      const req = client.request(url, { method: 'HEAD', headers: { 'User-Agent': 'Wingetix/1.1.1' } }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          try {
            const nextUrl = new URL(res.headers.location, url).href;
            return getTotalSizeFromUrl(nextUrl, maxRedirects - 1).then(resolve);
          } catch (_) {
            return resolve(0);
          }
        }
        const len = parseInt(res.headers['content-length'] || '0', 10);
        resolve(isNaN(len) ? 0 : len);
      });
      req.on('error', () => resolve(0));
      req.setTimeout(4000, () => { req.destroy(); resolve(0); });
      req.end();
    } catch (_) {
      resolve(0);
    }
  });
}

// Real-time tracker for active download files in Temp\WinGet
function trackActiveDownload(pkgId, totalBytes, onProgress) {
  const wingetDir = path.join(process.env.LOCALAPPDATA || '', 'Temp', 'WinGet');
  let lastBytes = 0;
  let lastTime = Date.now();
  let maxBytesSeen = 0;
  let stopped = false;

  const interval = setInterval(() => {
    if (stopped) return;
    try {
      if (!fs.existsSync(wingetDir)) return;
      const subdirs = fs.readdirSync(wingetDir);
      let currentBytes = 0;
      let foundTmp = false;

      // 1. Check folder matching pkgId
      const targetSub = subdirs.find(s => s.toLowerCase().includes(pkgId.toLowerCase()));
      if (targetSub) {
        const fullSub = path.join(wingetDir, targetSub);
        try {
          if (fs.statSync(fullSub).isDirectory()) {
            const files = fs.readdirSync(fullSub).filter(f => f.endsWith('.tmp'));
            for (const f of files) {
              const tmpPath = path.join(fullSub, f);
              try {
                const fd = fs.openSync(tmpPath, 'r');
                const sz = fs.fstatSync(fd).size;
                fs.closeSync(fd);
                if (sz > currentBytes) currentBytes = sz;
                foundTmp = true;
              } catch (_) {}
            }
          }
        } catch (_) {}
      }

      // 2. If not found in subfolder, inspect .tmp files modified recently in WinGet root
      if (!foundTmp) {
        const rootTmps = subdirs.filter(f => f.endsWith('.tmp'));
        for (const f of rootTmps) {
          const tmpPath = path.join(wingetDir, f);
          try {
            const stat = fs.statSync(tmpPath);
            if (Date.now() - stat.mtimeMs < 20000) {
              const fd = fs.openSync(tmpPath, 'r');
              const sz = fs.fstatSync(fd).size;
              fs.closeSync(fd);
              if (sz > currentBytes) currentBytes = sz;
            }
          } catch (_) {}
        }
      }

      if (currentBytes > maxBytesSeen) maxBytesSeen = currentBytes;

      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      let speedMBs = '0.0';
      if (dt >= 0.5) {
        const speed = (maxBytesSeen - lastBytes) / dt;
        speedMBs = Math.max(0, speed / (1024 * 1024)).toFixed(1);
        lastBytes = maxBytesSeen;
        lastTime = now;
      }

      const downloadedMB = (maxBytesSeen / (1024 * 1024)).toFixed(1);
      const totalMB = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : '—';
      const percent = totalBytes > 0 ? Math.min(99.5, Number(((maxBytesSeen / totalBytes) * 100).toFixed(1))) : 0;

      onProgress({
        downloadedBytes: maxBytesSeen,
        totalBytes,
        downloadedMB,
        totalMB,
        percent,
        speedMBs
      });
    } catch (_) {}
  }, 200);

  return {
    stop: () => {
      stopped = true;
      clearInterval(interval);
    },
    getMaxBytes: () => maxBytesSeen,
    getSpeed: () => speedMBs
  };
}

let activeUpgradeProc = null;
let isUpgradeCancelled = false;
let activeCleanupTimers = null;
let activeUninstallProc = null;
let isUninstallCancelled = false;

function killProcessTree(proc) {
  if (!proc || !proc.pid) return;
  try {
    spawn('taskkill', ['/pid', proc.pid.toString(), '/T', '/F'], { windowsHide: true });
  } catch (e) {
    try { proc.kill('SIGKILL'); } catch (_) {}
  }
}

ipcMain.on('winget:cancel-upgrade', (event) => {
  isUpgradeCancelled = true;
  if (activeCleanupTimers) {
    try { activeCleanupTimers(); } catch (_) {}
    activeCleanupTimers = null;
  }
  if (activeUpgradeProc) {
    killProcessTree(activeUpgradeProc);
    activeUpgradeProc = null;
  }
  event.sender.send('winget:log', {
    type: 'warning',
    text: '\n🛑 Actualización cancelada por el usuario.\n'
  });
  event.sender.send('winget:queue-cancel', { message: 'Cancelado por el usuario' });
  event.sender.send('winget:done', { success: false, cancelled: true });
});

ipcMain.on('apps:cancel-uninstall', (event) => {
  isUninstallCancelled = true;
  if (activeUninstallProc) {
    killProcessTree(activeUninstallProc);
    activeUninstallProc = null;
  }
  event.sender.send('apps:uninstall-log', {
    type: 'warning',
    text: '\n🛑 Desinstalación cancelada por el usuario.\n'
  });
  event.sender.send('apps:uninstall-done', { success: false, cancelled: true });
});

ipcMain.on('winget:upgrade-packages', (event, packages) => {
  if (!packages?.length) {
    event.sender.send('winget:log', { type: 'error', text: 'No se seleccionaron paquetes.' });
    event.sender.send('winget:done', { success: false });
    return;
  }

  isUpgradeCancelled = false;
  activeUpgradeProc = null;
  activeCleanupTimers = null;

  const env = buildEnv();
  event.sender.send('winget:log', {
    type: 'info',
    text: `▶ Iniciando actualización de ${packages.length} paquete(s)...\n`,
  });

  // Initialize UI Queue
  const queueItems = packages.map((p, idx) => ({
    id: p.id,
    name: p.name || p.id,
    version: p.version || '',
    available: p.available || '',
    source: p.source || 'winget',
    iconBase64: p.iconBase64 || '',
    status: 'pending',
    downloadedMB: '0.0',
    totalMB: '—',
    percent: 0,
    speedMBs: '0.0',
    index: idx,
    total: packages.length
  }));
  event.sender.send('winget:queue-init', { queue: queueItems });

  let index = 0;
  const upgradeNext = () => {
    if (isUpgradeCancelled) return;
    if (index >= packages.length) {
      activeUpgradeProc = null;
      activeCleanupTimers = null;
      event.sender.send('winget:log', { type: 'success', text: '\n✅ Todas las actualizaciones completadas.' });
      event.sender.send('winget:done', { success: true });
      return;
    }

    const currentIdx = index++;
    const pkg = packages[currentIdx];
    const pkgId = pkg.id;
    const pkgName = pkg.name || pkgId;
    const pkgSource = pkg.source || 'winget';

    event.sender.send('winget:log', {
      type: 'info',
      text: `\n📦 Actualizando: ${pkgId} (${pkgSource})\n${'─'.repeat(50)}\n`,
    });

    // Notify queue that package is preparing / starting
    event.sender.send('winget:queue-update', {
      pkgId,
      status: 'starting',
      downloadedMB: '0.0',
      totalMB: '—',
      percent: 0,
      speedMBs: '0.0',
      message: 'Iniciando descarga...',
      index: currentIdx,
      total: packages.length
    });

    const args = [
      'upgrade',
      '--id', pkgId,
      '--exact',
      '--source', pkgSource,
      '--silent',
      '--force',
      '--accept-package-agreements',
      '--accept-source-agreements',
      '--disable-interactivity'
    ];

    const proc = spawnWinget(args, {
      env
    });

    let procOutput = '';
    let targetUrl = '';
    let totalBytes = 0;
    let tracker = null;
    let installStarted = false;
    let installInterval = null;
    let autoInstallTimer = null;
    let isTerminated = false;

    const cleanupTimers = () => {
      isTerminated = true;
      if (tracker) {
        try { tracker.stop(); } catch (_) {}
        tracker = null;
      }
      if (autoInstallTimer) {
        clearTimeout(autoInstallTimer);
        autoInstallTimer = null;
      }
      if (installInterval) {
        clearInterval(installInterval);
        installInterval = null;
      }
    };

    activeUpgradeProc = proc;
    activeCleanupTimers = cleanupTimers;

    const triggerInstallation = () => {
      if (installStarted || isTerminated) return;
      installStarted = true;
      if (tracker) {
        try { tracker.stop(); } catch (_) {}
      }
      if (autoInstallTimer) { clearTimeout(autoInstallTimer); autoInstallTimer = null; }

      let installSec = 0;
      const finalMB = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : (tracker ? (tracker.getMaxBytes() / (1024 * 1024)).toFixed(1) : '—');

      const sendInstallUpdate = (sec) => {
        if (isTerminated) return;
        let stepMsg = 'Iniciando instalador oficial de Windows...';
        if (sec >= 3 && sec < 10) stepMsg = 'Extrayendo y verificando archivos...';
        else if (sec >= 10 && sec < 22) stepMsg = 'Aplicando actualización en el sistema...';
        else if (sec >= 22 && sec < 40) stepMsg = 'Registrando componentes y librerías...';
        else if (sec >= 40) stepMsg = 'Finalizando configuración de instalación...';

        event.sender.send('winget:queue-update', {
          pkgId,
          status: 'installing',
          downloadedMB: finalMB,
          totalMB: finalMB,
          percent: 100,
          elapsedSeconds: sec,
          speedMBs: '0.0',
          message: stepMsg,
          index: currentIdx,
          total: packages.length
        });
      };

      sendInstallUpdate(0);
      installInterval = setInterval(() => {
        if (isTerminated) {
          if (installInterval) {
            clearInterval(installInterval);
            installInterval = null;
          }
          return;
        }
        installSec++;
        sendInstallUpdate(installSec);
      }, 1000);
    };

    proc.stdout.on('data', d => {
      if (isTerminated) return;
      const text = d.toString('utf8');
      procOutput += text;
      event.sender.send('winget:log', { type: 'output', text });

      // Detect download URL in output stream
      const urlMatch = text.match(/https?:\/\/[^\s\r\n"']+/i);
      if (urlMatch && !targetUrl) {
        targetUrl = urlMatch[0];
        getTotalSizeFromUrl(targetUrl).then(size => {
          totalBytes = size;
          if (!installStarted && !isTerminated) {
            if (tracker) {
              try { tracker.stop(); } catch (_) {}
            }
            tracker = trackActiveDownload(pkgId, totalBytes, prog => {
              if (installStarted || isTerminated) return;
              event.sender.send('winget:queue-update', {
                pkgId,
                status: 'downloading',
                downloadedMB: prog.downloadedMB,
                totalMB: prog.totalMB,
                percent: prog.percent,
                speedMBs: prog.speedMBs,
                message: `Descargando: ${prog.downloadedMB} MB / ${prog.totalMB} MB (${prog.percent}%)`,
                index: currentIdx,
                total: packages.length
              });
            });
          }
        });
      }

      const textLower = text.toLowerCase();

      // Native Winget progress parsing from stdout (e.g. 15.2 MB / 45.0 MB)
      const mbMatch = text.match(/(\d+(?:\.\d+)?)\s*(MB|KB|GB)\s*[\/|de]\s*(\d+(?:\.\d+)?)\s*(MB|KB|GB)/i);
      if (mbMatch && !installStarted && !isTerminated) {
        const cur = parseFloat(mbMatch[1]);
        const unit1 = mbMatch[2].toUpperCase();
        const tot = parseFloat(mbMatch[3]);
        const unit2 = mbMatch[4].toUpperCase();
        const curMB = unit1 === 'GB' ? cur * 1024 : (unit1 === 'KB' ? cur / 1024 : cur);
        const totMB = unit2 === 'GB' ? tot * 1024 : (unit2 === 'KB' ? tot / 1024 : tot);
        if (totMB > 0) {
          const pct = Math.min(99.5, Number(((curMB / totMB) * 100).toFixed(1)));
          event.sender.send('winget:queue-update', {
            pkgId,
            status: 'downloading',
            downloadedMB: curMB.toFixed(1),
            totalMB: totMB.toFixed(1),
            percent: pct,
            speedMBs: tracker && tracker.getSpeed ? tracker.getSpeed() : '—',
            message: `Descargando: ${curMB.toFixed(1)} MB / ${totMB.toFixed(1)} MB (${pct}%)`,
            index: currentIdx,
            total: packages.length
          });
          if (pct >= 99) {
            if (!autoInstallTimer && !installStarted && !isTerminated) {
              autoInstallTimer = setTimeout(() => {
                if (!installStarted && !isTerminated) triggerInstallation();
              }, 1200);
            }
          }
        }
      }

      // Robust installer verification / installation start detection
      const hasHash = textLower.includes('hash') && (textLower.includes('comprob') || textLower.includes('verif') || textLower.includes('succes') || textLower.includes('correct'));
      const hasInstall = textLower.includes('iniciando la actualizaci') ||
                         textLower.includes('iniciando la instalaci') ||
                         textLower.includes('iniciando instalaci') ||
                         textLower.includes('iniciando actualizaci') ||
                         textLower.includes('instalando paquete') ||
                         textLower.includes('instalando...') ||
                         textLower.includes('starting package install') ||
                         textLower.includes('installing package') ||
                         textLower.includes('installing...');

      if ((hasHash || hasInstall) && !installStarted && !isTerminated) {
        triggerInstallation();
      }
    });

    proc.stderr.on('data', d => { procOutput += d.toString('utf8'); });

    proc.on('close', code => {
      cleanupTimers();
      activeUpgradeProc = null;
      activeCleanupTimers = null;
      if (isUpgradeCancelled) {
        event.sender.send('winget:queue-update', {
          pkgId,
          status: 'cancelled',
          downloadedMB: '—',
          totalMB: '—',
          percent: 0,
          speedMBs: '0.0',
          message: 'Cancelado por el usuario',
          index: currentIdx,
          total: packages.length
        });
        return;
      }
      const outputLower = procOutput.toLowerCase();
      const unsignedCode = (typeof code === 'number') ? (code >>> 0) : 0;
      const hexCode = '0x' + unsignedCode.toString(16).toLowerCase();

      const fileInUse = unsignedCode === 2316632107 ||
                        hexCode === '0x8a15002b' ||
                        unsignedCode === 32 ||
                        hexCode === '0x80070020' ||
                        outputLower.includes('0x80070020') ||
                        outputLower.includes('being used by another process') ||
                        outputLower.includes('en uso por otro proceso') ||
                        outputLower.includes('abierta');

      const needsAdmin = unsignedCode === 2147958056 ||
                         hexCode === '0x80073d28' ||
                         unsignedCode === 2147942405 ||
                         hexCode === '0x80070005' ||
                         unsignedCode === 5 ||
                         outputLower.includes('0x80073d28') ||
                         outputLower.includes('0x80070005') ||
                         outputLower.includes('privilegios de administrador') ||
                         outputLower.includes('administrator') ||
                         outputLower.includes('run as administrator');

      // Treat successful reboot codes and up-to-date codes as OK
      const isRebootOrUpToDate = unsignedCode === 3010 ||
                                 unsignedCode === 1641 ||
                                 unsignedCode === 2316632084 ||
                                 hexCode === '0x8a150014' ||
                                 outputLower.includes('no applicable update') ||
                                 outputLower.includes('ninguna actualización aplicable');
      const ok = code === 0 || isRebootOrUpToDate;

      const finalMB = totalBytes > 0 ? (totalBytes / (1024 * 1024)).toFixed(1) : (tracker ? (tracker.getMaxBytes() / (1024*1024)).toFixed(1) : '—');

      if (ok) {
        const msg = (unsignedCode === 3010 || unsignedCode === 1641)
          ? `✔ ${pkgId} actualizado correctamente (Reinicio pendiente).\n`
          : `✔ ${pkgId} actualizado correctamente.\n`;
        event.sender.send('winget:queue-update', {
          pkgId,
          status: 'completed',
          downloadedMB: finalMB,
          totalMB: finalMB,
          percent: 100,
          speedMBs: '0.0',
          message: (unsignedCode === 3010 || unsignedCode === 1641) ? 'Completado ✔ (Reinicio requerido)' : 'Completado con éxito',
          index: currentIdx,
          total: packages.length
        });
        event.sender.send('winget:log', { type: 'success', text: msg });
        upgradeNext();
        return;
      }

      // If installation failed because it needs Admin, automatically prompt with elevation!
      if (needsAdmin) {
        event.sender.send('winget:log', {
          type: 'warning',
          text: `⚠ ${pkgId} requiere permisos de Administrador para instalarse. Solicitando autorización del sistema (UAC)...\n`
        });
        event.sender.send('winget:queue-update', {
          pkgId,
          status: 'installing',
          downloadedMB: finalMB,
          totalMB: finalMB,
          percent: 100,
          speedMBs: '0.0',
          message: 'Esperando autorización de Administrador (UAC)...',
          index: currentIdx,
          total: packages.length
        });

        runElevatedUpgrade(pkgId, pkgSource, (elevatedCode, elevatedOut) => {
          cleanupTimers();
          const elUnsigned = (typeof elevatedCode === 'number') ? (elevatedCode >>> 0) : 0;
          const elOk = elevatedCode === 0 || elUnsigned === 3010 || elUnsigned === 1641;
          const userCancel = elevatedCode === 1223 || elUnsigned === 1223;
          const status = elOk ? 'completed' : (userCancel ? 'admin-needed' : 'error');
          const friendlyMsg = elOk
            ? 'Completado con éxito (como Administrador)'
            : (userCancel ? 'Permisos de Administrador cancelados por el usuario' : getFriendlyErrorMessage(elevatedCode, elevatedOut));

          event.sender.send('winget:queue-update', {
            pkgId,
            status,
            downloadedMB: finalMB,
            totalMB: finalMB,
            percent: elOk ? 100 : 0,
            speedMBs: '0.0',
            message: friendlyMsg,
            errorType: userCancel ? 'admin' : 'general',
            index: currentIdx,
            total: packages.length
          });

          event.sender.send('winget:log', {
            type: elOk ? 'success' : 'warning',
            text: elOk ? `✔ ${pkgId} actualizado correctamente con permisos de Administrador.\n` : `✖ Falló con permisos de Administrador (${friendlyMsg}).\n`
          });
          upgradeNext();
        });
        return;
      }

      // Other errors or app in use
      const friendlyMsg = getFriendlyErrorMessage(code, procOutput);
      const status = fileInUse ? 'in-use' : (needsAdmin ? 'admin-needed' : 'error');

      event.sender.send('winget:queue-update', {
        pkgId,
        status,
        downloadedMB: finalMB,
        totalMB: finalMB,
        percent: 0,
        speedMBs: '0.0',
        message: friendlyMsg,
        errorType: needsAdmin ? 'admin' : (fileInUse ? 'in-use' : 'general'),
        index: currentIdx,
        total: packages.length
      });

      event.sender.send('winget:log', {
        type: 'warning',
        text: `⚠ ${pkgId}: ${friendlyMsg} (código ${hexCode !== '0x0' ? hexCode : code}).\n`
      });

      upgradeNext();
    });

    proc.on('error', err => {
      cleanupTimers();
      event.sender.send('winget:queue-update', {
        pkgId,
        status: 'error',
        downloadedMB: '0.0',
        totalMB: '—',
        percent: 0,
        speedMBs: '0.0',
        message: `Error al iniciar el proceso: ${err.message}`,
        errorType: 'general',
        index: currentIdx,
        total: packages.length
      });
      event.sender.send('winget:log', { type: 'error', text: `✖ Error: ${err.message}\n` });
      upgradeNext();
    });
  };

  upgradeNext();
});

// Helper for error message translation
function getFriendlyErrorMessage(code, output = '') {
  const unsignedCode = (typeof code === 'number') ? (code >>> 0) : 0;
  const hexCode = '0x' + unsignedCode.toString(16).toLowerCase();
  const lower = (output || '').toLowerCase();

  if (code === 0) return 'Completado con éxito';
  if (unsignedCode === 3010 || unsignedCode === 1641) return 'Completado ✔ (Reinicio requerido)';
  if (unsignedCode === 2316632084 || hexCode === '0x8a150014' || lower.includes('no applicable update') || lower.includes('ninguna actualización aplicable')) {
    return 'Ya se encuentra en la versión más reciente';
  }
  if (unsignedCode === 2147958056 || hexCode === '0x80073d28' || unsignedCode === 2147942405 || hexCode === '0x80070005' || unsignedCode === 5 ||
      lower.includes('0x80073d28') || lower.includes('0x80070005') || lower.includes('privilegios de administrador') || lower.includes('administrator')) {
    return 'Requiere permisos de Administrador para instalarse';
  }
  if (unsignedCode === 1223 || hexCode === '0x800704c7' || unsignedCode === 1602 || hexCode === '0x80070642' || lower.includes('cancelada por el usuario')) {
    return 'Instalación cancelada por el usuario';
  }
  if (unsignedCode === 2316632107 || hexCode === '0x8a15002b' || unsignedCode === 32 || hexCode === '0x80070020' ||
      lower.includes('0x80070020') || lower.includes('en uso') || lower.includes('in use') || lower.includes('another process')) {
    return 'La aplicación está abierta en Windows. Ciérrala para continuar';
  }
  if (unsignedCode === 2316632081 || hexCode === '0x8a150011' || lower.includes('hash')) {
    return 'Fallo de integridad: El hash del instalador no coincide con el repositorio oficial';
  }
  if (unsignedCode === 1618 || hexCode === '0x80070652') {
    return 'Hay otra instalación de Windows en curso (espera unos segundos)';
  }
  if (unsignedCode === 1603 || hexCode === '0x80070643') {
    return 'Error del instalador (1603): Puede requerir permisos de Administrador o cerrar la app';
  }
  if (unsignedCode === 2316632066 || hexCode === '0x8a150002') {
    return 'Paquete no encontrado en el origen';
  }
  if (lower.includes('download') && (lower.includes('failed') || lower.includes('falló') || lower.includes('error'))) {
    return 'Error de conexión al descargar el instalador';
  }
  if (hexCode !== '0x0') {
    return `Error en la instalación (${hexCode})`;
  }
  return `Error en la instalación (${code})`;
}

// Executes an upgrade with administrator elevation via PowerShell UAC
function runElevatedUpgrade(pkgId, pkgSource, callback) {
  const sourceArg = pkgSource ? `'--source', '${pkgSource}',` : '';
  const psScript = `
try {
  $p = Start-Process winget -ArgumentList @('upgrade', '--id', '${pkgId}', '--exact', ${sourceArg} '--silent', '--force', '--accept-package-agreements', '--accept-source-agreements') -Verb RunAs -PassThru -Wait -WindowStyle Hidden
  if ($p) {
    exit $p.ExitCode
  } else {
    exit 1
  }
} catch {
  if ($_.Exception.NativeErrorCode -eq 1223) {
    exit 1223
  }
  Write-Output $_.Exception.Message
  exit 1
}
`;
  const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
    windowsHide: true
  });
  let out = '';
  proc.stdout.on('data', d => { out += d.toString('utf8'); });
  proc.stderr.on('data', d => { out += d.toString('utf8'); });
  proc.on('close', code => {
    callback(code, out);
  });
  proc.on('error', err => {
    callback(-1, err.message);
  });
}

// IPC: Kill process for package
ipcMain.handle('apps:kill-process', async (_e, nameOrId) => {
  return new Promise(resolve => {
    const term = (nameOrId || '').split('.').pop() || nameOrId;
    const psScript = `
Get-Process -Name "*${term}*" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
`;
    const proc = spawn('powershell.exe', ['-NoProfile', '-Command', psScript], { windowsHide: true });
    proc.on('close', () => resolve({ success: true }));
  });
});

// IPC: Manually trigger elevated upgrade for a single package
ipcMain.on('winget:upgrade-package-elevated', (event, pkg) => {
  const pkgId = pkg.id;
  const pkgSource = pkg.source || 'winget';

  event.sender.send('winget:log', {
    type: 'info',
    text: `\n🛡 Reintentando con permisos de Administrador: ${pkgId}...\n`
  });

  event.sender.send('winget:queue-update', {
    pkgId,
    status: 'installing',
    downloadedMB: '—',
    totalMB: '—',
    percent: 100,
    speedMBs: '0.0',
    message: 'Esperando autorización de Administrador (UAC)...'
  });

  runElevatedUpgrade(pkgId, pkgSource, (code, out) => {
    const unsignedCode = (typeof code === 'number') ? (code >>> 0) : 0;
    const ok = code === 0 || unsignedCode === 3010 || unsignedCode === 1641;
    const userCancel = code === 1223 || unsignedCode === 1223;
    const status = ok ? 'completed' : (userCancel ? 'admin-needed' : 'error');
    const friendlyMsg = ok
      ? 'Completado con éxito (como Administrador)'
      : (userCancel ? 'Permisos de Administrador cancelados por el usuario' : getFriendlyErrorMessage(code, out));

    event.sender.send('winget:queue-update', {
      pkgId,
      status,
      downloadedMB: '—',
      totalMB: '—',
      percent: ok ? 100 : 0,
      speedMBs: '0.0',
      message: friendlyMsg,
      errorType: userCancel ? 'admin' : 'general'
    });

    event.sender.send('winget:log', {
      type: ok ? 'success' : 'warning',
      text: ok ? `✔ ${pkgId} actualizado con permisos de Administrador.\n` : `✖ Falló (${friendlyMsg}).\n`
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IPCMAIN: UPGRADE ALL
// ═══════════════════════════════════════════════════════════════════════════════
ipcMain.on('winget:upgrade-all', (event) => {
  isUpgradeCancelled = false;
  const env = buildEnv();
  event.sender.send('winget:log', { type: 'info', text: '▶ Ejecutando winget upgrade --all ...\n' });

  const proc = spawn('cmd', [
    '/c',
    'winget upgrade --all --silent --accept-package-agreements --accept-source-agreements',
  ], { env, shell: false, windowsHide: true });
  activeUpgradeProc = proc;

  proc.stdout.on('data', d => event.sender.send('winget:log', { type: 'output', text: d.toString('utf8') }));
  proc.stderr.on('data', d => event.sender.send('winget:log', { type: 'error',  text: d.toString('utf8') }));

  proc.on('close', code => {
    activeUpgradeProc = null;
    if (isUpgradeCancelled) return;
    event.sender.send('winget:log', {
      type: code === 0 ? 'success' : 'warning',
      text: code === 0
        ? '\n✅ Todas las aplicaciones actualizadas correctamente.'
        : `\n⚠ Proceso finalizado con código: ${code}`,
    });
    event.sender.send('winget:done', { success: code === 0 });
  });

  proc.on('error', err => {
    activeUpgradeProc = null;
    if (isUpgradeCancelled) return;
    event.sender.send('winget:log', { type: 'error', text: `\n✖ Error: ${err.message}` });
    event.sender.send('winget:done', { success: false });
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// IPCMAIN: SYSTEM INFO
// ═══════════════════════════════════════════════════════════════════════════════
ipcMain.handle('system:info', async () => {
  const release = os.release();
  const parts = release.split('.');
  const build = parseInt(parts[2] || '0', 10);
  let osName = 'Windows';
  if (parts[0] === '10' && parts[1] === '0') {
    osName = build >= 22000 ? 'Windows 11' : 'Windows 10';
  } else if (release.startsWith('6.3')) {
    osName = 'Windows 8.1';
  } else if (release.startsWith('6.2')) {
    osName = 'Windows 8';
  } else if (release.startsWith('6.1')) {
    osName = 'Windows 7';
  } else {
    osName = `Windows ${release}`;
  }

  return {
    hostname:     process.env.COMPUTERNAME || os.hostname(),
    osName:       osName,
    platform:     os.platform(),
    release:      os.release(),
    arch:         os.arch(),
    uptime:       os.uptime(),
    totalMemory:  os.totalmem(),
    freeMemory:   os.freemem(),
    isPortable:   isPortableMode,
    dataDir:      activeDataDir,
    settingsPath: settingsFilePath
  };
});

// ─── Portable & Persistent Settings IPC (.\data\settings.json) ────────────────
ipcMain.handle('settings:get', async () => {
  return {
    success: true,
    isPortable: isPortableMode,
    dataDir: activeDataDir,
    settingsPath: settingsFilePath,
    settings: loadAppSettings()
  };
});

ipcMain.handle('settings:save', async (_e, partial = {}) => {
  const updated = saveAppSettings(partial);
  return {
    success: !!updated,
    isPortable: isPortableMode,
    dataDir: activeDataDir,
    settingsPath: settingsFilePath,
    settings: updated
  };
});

ipcMain.handle('settings:open-data-folder', async () => {
  try {
    if (!fs.existsSync(activeDataDir)) {
      fs.mkdirSync(activeDataDir, { recursive: true });
    }
    await shell.openPath(activeDataDir);
    return { success: true, path: activeDataDir };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// IPCMAIN: CLEAN UNINSTALLER
// ═══════════════════════════════════════════════════════════════════════════════
ipcMain.handle('apps:list-installed', async () => {
  return new Promise((resolve) => {
    const targetScript = getScriptPath('list-installed.ps1');

    if (!fs.existsSync(targetScript) || targetScript.toLowerCase().includes('.asar')) {
      console.error('[apps:list-installed] Accessible physical script not found:', targetScript);
      return resolve([]);
    }

    const proc = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-File', targetScript
    ], {
      windowsHide: true,
      maxBuffer: 50 * 1024 * 1024
    });

    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString('utf8'); });
    proc.stderr.on('data', d => { stderr += d.toString('utf8'); });

    proc.on('close', code => {
      try {
        const text = stdout.trim();
        if (!text) {
          console.warn('[apps:list-installed] Empty stdout. Stderr:', stderr);
          return resolve([]);
        }
        const apps = JSON.parse(text);
        const appsArray = Array.isArray(apps) ? apps : [apps].filter(Boolean);
        resolve(appsArray);
      } catch (err) {
        console.error('[apps:list-installed] JSON parse error:', err.message);
        resolve([]);
      }
    });

    proc.on('error', (err) => {
      console.error('[apps:list-installed] Process spawn error:', err);
      resolve([]);
    });
  });
});

// ─── Deep Uninstaller v2: Platform Shield Whitelist & Residual Preview IPC ────
const CORE_PROTECTED_ECOSYSTEMS = [
  'epic games', 'epicgames', 'epicgameslauncher', 'epic', 'epic online services',
  'steam', 'valve', 'steamapps', 'common',
  'ubisoft', 'ubisoft game launcher', 'ubisoftconnect', 'upc',
  'electronic arts', 'ea desktop', 'origin', 'ea games', 'origin games',
  'riot games', 'riot client',
  'battle.net', 'blizzard', 'blizzard entertainment',
  'gog galaxy', 'gog.com',
  'microsoft', 'windows', 'windows nt', 'windowsapps', 'package cache', 'common files',
  'system32', 'syswow64', 'program files', 'program files (x86)', 'programdata',
  'adobe', 'google', 'mozilla', 'apple', 'nvidia', 'nvidia corporation', 'amd', 'intel',
  'saved games', 'my games', 'documents', 'downloads', 'desktop'
];

const UNINSTALL_STOPWORDS = new Set([
  'setup', 'install', 'installer', 'uninstaller', 'update', 'updater',
  'windows', 'microsoft', 'corporation', 'inc', 'ltd', 'gmbh', 'llc',
  'software', 'app', 'application', 'tool', 'tools', 'utility', 'utilities',
  'x64', 'x86', 'win64', 'win32', 'v1', 'v2', 'v3', 'edition', 'version',
  'free', 'pro', 'desktop', 'client', 'service', 'services', 'manager', 'management',
  'games', 'game', 'gaming', 'player', 'play', 'studio', 'studios', 'system', 'systems',
  'center', 'centre', 'hub', 'suite', 'online', 'live', 'code', 'open', 'web', 'net',
  'file', 'files', 'data', 'base', 'core', 'pack', 'package', 'portable', 'classic',
  'launcher', 'store', 'portal', 'community', 'standard', 'ultimate', 'deluxe'
]);

ipcMain.handle('shield:get-whitelist', async () => {
  const cfg = loadAppSettings();
  const customList = Array.isArray(cfg.platformShieldWhitelist) ? cfg.platformShieldWhitelist : [];
  return {
    success: true,
    whitelist: customList,
    coreProtected: [
      'Steam / Valve (steamapps)',
      'Epic Games Launcher',
      'Riot Games & Vanguard',
      'EA App / Origin',
      'Ubisoft Connect',
      'Blizzard Battle.net',
      'GOG Galaxy',
      'Windows System32 & Drivers'
    ]
  };
});

ipcMain.handle('shield:save-whitelist', async (_e, newList) => {
  const cleanList = Array.isArray(newList)
    ? Array.from(new Set(newList.map(x => String(x || '').trim()).filter(Boolean)))
    : [];
  const updated = saveAppSettings({ platformShieldWhitelist: cleanList });
  return {
    success: !!updated,
    whitelist: cleanList
  };
});

ipcMain.handle('shield:pick-folder', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return { canceled: true };
  const res = await dialog.showOpenDialog(mainWindow, {
    title: 'Select Folder to Protect in Platform Shield Whitelist',
    properties: ['openDirectory']
  });
  if (!res.canceled && res.filePaths && res.filePaths.length > 0) {
    return { canceled: false, folderPath: res.filePaths[0] };
  }
  return { canceled: true };
});

ipcMain.handle('apps:preview-residuals', async (_e, appsInput) => {
  try {
    const appsList = Array.isArray(appsInput) ? appsInput : (appsInput ? [appsInput] : []);
    if (appsList.length === 0) {
      return { success: true, folders: [], registryKeys: [], shieldedItems: [] };
    }

    const cfg = loadAppSettings();
    const customWhitelist = Array.isArray(cfg.platformShieldWhitelist)
      ? cfg.platformShieldWhitelist.map(x => String(x).trim().toLowerCase()).filter(Boolean)
      : [];
    const protectedSet = new Set([
      ...CORE_PROTECTED_ECOSYSTEMS,
      ...customWhitelist,
      ...customWhitelist.map(w => path.basename(w))
    ]);

    const isWhitelistedPath = (candidatePath) => {
      if (!candidatePath) return false;
      const cLow = candidatePath.toLowerCase();
      const base = path.basename(candidatePath).toLowerCase();
      if (protectedSet.has(base) || protectedSet.has(cLow)) return true;
      for (const cw of customWhitelist) {
        if (cw && (cLow === cw || cLow.startsWith(cw + '\\') || cLow.includes('\\' + cw + '\\') || cLow.endsWith('\\' + cw))) {
          return true;
        }
      }
      return false;
    };

    const foldersMap = new Map();
    const shieldedMap = new Map();
    const regKeysMap = new Map();

    const commonBases = [
      process.env.ProgramData,
      process.env.LOCALAPPDATA,
      process.env.APPDATA,
      process.env.USERPROFILE ? path.join(process.env.USERPROFILE, 'AppData', 'LocalLow') : '',
      process.env.APPDATA ? path.join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs') : '',
      process.env.ProgramData ? path.join(process.env.ProgramData, 'Microsoft', 'Windows', 'Start Menu', 'Programs') : '',
      os.tmpdir()
    ].filter(p => p && fs.existsSync(p));

    const progFilesBases = [
      process.env.ProgramFiles,
      process.env['ProgramFiles(x86)']
    ].filter(p => p && fs.existsSync(p));

    const appTargets = [];

    for (const appObj of appsList) {
      const name = appObj.name || '';
      const id = appObj.id || '';
      const installLocation = appObj.installLocation || '';
      const uninstallString = appObj.uninstallString || '';

      const uninstLower = uninstallString.toLowerCase();
      const idLower = id.toLowerCase();
      const locLower = installLocation.toLowerCase();

      const isLauncherManaged =
        uninstLower.includes('steam://') || uninstLower.includes('steam.exe') || idLower.startsWith('steam app ') ||
        uninstLower.includes('com.epicgames.launcher') || locLower.includes('\\epic games\\') || idLower.startsWith('epicgames.') ||
        locLower.includes('ubisoft game launcher') || uninstLower.includes('uplay') ||
        locLower.includes('ea desktop') || locLower.includes('origin games') || locLower.includes('ea games') ||
        locLower.includes('riot games') || uninstLower.includes('riotclient') ||
        locLower.includes('battle.net') || uninstLower.includes('battlenet://') ||
        locLower.includes('gog galaxy');

      const cleanName = name
        .replace(/\(.*?\)/g, '')
        .replace(/\[.*?\]/g, '')
        .replace(/\bv?\d+(\.\d+)*\b/g, '')
        .trim();
      const normApp = cleanName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      const rawTokens = [];
      cleanName.split(/[\s\-_\.]+/).forEach(w => {
        const low = w.toLowerCase().trim();
        if (low.length >= 3 && !UNINSTALL_STOPWORDS.has(low)) rawTokens.push(low);
      });

      if (installLocation && fs.existsSync(installLocation)) {
        const baseFolder = path.basename(installLocation).toLowerCase().trim();
        if (isWhitelistedPath(installLocation)) {
          shieldedMap.set(installLocation.toLowerCase(), {
            type: 'folder',
            path: installLocation,
            appName: name
          });
        } else if (baseFolder.length >= 3 && !UNINSTALL_STOPWORDS.has(baseFolder)) {
          rawTokens.push(baseFolder);
          foldersMap.set(installLocation.toLowerCase(), {
            type: 'folder',
            path: installLocation,
            appName: name
          });
        }
      }

      const tokens = Array.from(new Set(rawTokens));
      appTargets.push({ name, id, cleanName, normApp, tokens });

      const scanBases = isLauncherManaged ? commonBases : [...commonBases, ...progFilesBases];
      const escapedClean = cleanName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const prefixRegex = cleanName.length >= 4 ? new RegExp(`^${escapedClean}([\\s\\-_\\.]|$)`, 'i') : null;

      for (const base of scanBases) {
        let entries = [];
        try {
          entries = fs.readdirSync(base, { withFileTypes: true });
        } catch (_) { continue; }

        for (const entry of entries) {
          if (!entry.isDirectory()) continue;
          const eName = entry.name.trim();
          const eLow = eName.toLowerCase();
          const eNorm = eName.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
          const fullPath = path.join(base, entry.name);

          let matched = false;
          if (normApp && eNorm === normApp) {
            matched = true;
          } else if (prefixRegex && prefixRegex.test(eName)) {
            matched = true;
          } else if (tokens.length >= 2 && tokens.every(t => eLow.includes(t))) {
            matched = true;
          }

          if (matched) {
            if (isWhitelistedPath(fullPath)) {
              shieldedMap.set(fullPath.toLowerCase(), {
                type: 'folder',
                path: fullPath,
                appName: name
              });
            } else {
              foldersMap.set(fullPath.toLowerCase(), {
                type: 'folder',
                path: fullPath,
                appName: name
              });
            }
          }
        }
      }
    }

    // Fast PowerShell Registry residual preview
    const psPayload = JSON.stringify(appTargets.map(a => ({
      name: a.name,
      id: a.id,
      normApp: a.normApp
    })));
    const psProtected = JSON.stringify(Array.from(protectedSet));

    const psRegScript = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$targets = '${psPayload.replace(/'/g, "''")}' | ConvertFrom-Json
$protectedList = '${psProtected.replace(/'/g, "''")}' | ConvertFrom-Json
$regRoots = @(
    "HKLM:\\SOFTWARE",
    "HKCU:\\Software",
    "HKLM:\\SOFTWARE\\WOW6432Node",
    "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths"
)
$found = @()
foreach ($t in $targets) {
    $normApp = $t.normApp
    $appId = $t.id
    $appName = $t.name
    if (![string]::IsNullOrWhiteSpace($appId)) {
        $uPaths = @(
            "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\$appId",
            "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\$appId",
            "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\$appId"
        )
        foreach ($up in $uPaths) {
            if (Test-Path -LiteralPath $up) {
                $cleanK = $up.Replace('HKLM:\\', 'HKEY_LOCAL_MACHINE\\').Replace('HKCU:\\', 'HKEY_CURRENT_USER\\')
                $found += [PSCustomObject]@{ path = $cleanK; appName = $appName; shielded = $false }
            }
        }
    }
    if ([string]::IsNullOrWhiteSpace($normApp)) { continue }
    foreach ($root in $regRoots) {
        if (Test-Path -LiteralPath $root) {
            $subKeys = Get-ChildItem -LiteralPath $root -ErrorAction SilentlyContinue
            foreach ($sk in $subKeys) {
                $kName = $sk.PSChildName
                $kLow = $kName.ToLower()
                $kNorm = ($kName -replace '[^a-zA-Z0-9]', '').ToLower()
                if ($protectedList -contains $kLow) {
                    $childKeys = Get-ChildItem -LiteralPath $sk.PSPath -ErrorAction SilentlyContinue
                    foreach ($ck in $childKeys) {
                        $ckName = $ck.PSChildName
                        $ckNorm = ($ckName -replace '[^a-zA-Z0-9]', '').ToLower()
                        if ($ckNorm -eq $normApp -or ($normApp.Length -ge 4 -and $ckNorm.StartsWith($normApp))) {
                            $isChildShielded = ($protectedList -contains $ckName.ToLower())
                            $found += [PSCustomObject]@{ path = $ck.Name; appName = $appName; shielded = $isChildShielded }
                        }
                    }
                    continue
                }
                if ($kNorm -eq $normApp -or ($normApp.Length -ge 5 -and $kNorm.StartsWith($normApp))) {
                    $found += [PSCustomObject]@{ path = $sk.Name; appName = $appName; shielded = $false }
                }
            }
        }
    }
}
$found | ConvertTo-Json -Compress
`;

    const regResults = await new Promise((resolve) => {
      const proc = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', psRegScript], {
        windowsHide: true
      });
      let out = '';
      proc.stdout.on('data', d => { out += d.toString('utf8'); });
      proc.on('close', () => {
        try {
          const trimmed = out.trim();
          if (!trimmed) return resolve([]);
          const parsed = JSON.parse(trimmed);
          resolve(Array.isArray(parsed) ? parsed : [parsed]);
        } catch (_) {
          resolve([]);
        }
      });
      proc.on('error', () => resolve([]));
      setTimeout(() => { try { proc.kill(); } catch (_) {} resolve([]); }, 4500);
    });

    for (const item of regResults) {
      if (!item || !item.path) continue;
      const keyLower = item.path.toLowerCase();
      if (item.shielded || isWhitelistedPath(item.path)) {
        shieldedMap.set(keyLower, {
          type: 'registry',
          path: item.path,
          appName: item.appName
        });
      } else {
        regKeysMap.set(keyLower, {
          type: 'registry',
          path: item.path,
          appName: item.appName
        });
      }
    }

    return {
      success: true,
      folders: Array.from(foldersMap.values()),
      registryKeys: Array.from(regKeysMap.values()),
      shieldedItems: Array.from(shieldedMap.values())
    };
  } catch (err) {
    return {
      success: false,
      error: err.message,
      folders: [],
      registryKeys: [],
      shieldedItems: []
    };
  }
});

ipcMain.on('apps:uninstall-clean', (event, appInfo) => {
  isUninstallCancelled = false;
  activeUninstallProc = null;
  const { name, publisher, uninstallString, installLocation, id, createRestorePoint, excludedResiduals } = appInfo;
  const userExcludedSet = new Set(Array.isArray(excludedResiduals) ? excludedResiduals.map(x => String(x).toLowerCase()) : []);
  const customWhitelist = Array.isArray(loadAppSettings().platformShieldWhitelist)
    ? loadAppSettings().platformShieldWhitelist.map(x => String(x).trim().toLowerCase()).filter(Boolean)
    : [];

  if (!uninstallString) {
    event.sender.send('apps:uninstall-log', { type: 'error', text: '✖ No se encontró comando de desinstalación para esta aplicación.\n' });
    event.sender.send('apps:uninstall-done', { success: false });
    return;
  }

  // ─── FASE 1: Identificación y Extracción Segura de Tokens y Plataforma ───────────────
  const stopwords = new Set([
    'setup', 'install', 'installer', 'uninstaller', 'update', 'updater',
    'windows', 'microsoft', 'corporation', 'inc', 'ltd', 'gmbh', 'llc',
    'software', 'app', 'application', 'tool', 'tools', 'utility', 'utilities',
    'x64', 'x86', 'win64', 'win32', 'v1', 'v2', 'v3', 'edition', 'version',
    'free', 'pro', 'desktop', 'client', 'service', 'services', 'manager', 'management',
    'games', 'game', 'gaming', 'player', 'play', 'studio', 'studios', 'system', 'systems',
    'center', 'centre', 'hub', 'suite', 'online', 'live', 'code', 'open', 'web', 'net',
    'file', 'files', 'data', 'base', 'core', 'pack', 'package', 'portable', 'classic',
    'launcher', 'store', 'portal', 'community', 'standard', 'ultimate', 'deluxe'
  ]);

  // Lista de plataformas y directorios estrictamente protegidos (ESCUDO DE PROTECCIÓN)
  const protectedEcosystems = [
    'epic games', 'epicgames', 'epicgameslauncher', 'epic', 'epic online services',
    'steam', 'valve', 'steamapps', 'common',
    'ubisoft', 'ubisoft game launcher', 'ubisoftconnect', 'upc',
    'electronic arts', 'ea desktop', 'origin', 'ea games', 'origin games',
    'riot games', 'riot client',
    'battle.net', 'blizzard', 'blizzard entertainment',
    'gog galaxy', 'gog.com',
    'microsoft', 'windows', 'windows nt', 'windowsapps', 'package cache', 'common files',
    'system32', 'syswow64', 'program files', 'program files (x86)', 'programdata',
    'adobe', 'google', 'mozilla', 'apple', 'nvidia', 'nvidia corporation', 'amd', 'intel',
    'saved games', 'my games',
    ...customWhitelist,
    ...customWhitelist.map(w => path.basename(w))
  ];

  const uninstLower = (uninstallString || '').toLowerCase();
  const idLower = (id || '').toLowerCase();
  const locLower = (installLocation || '').toLowerCase();

  // Detección de tienda / lanzador de juegos
  const isSteam = uninstLower.includes('steam://') || uninstLower.includes('steam.exe') || idLower.startsWith('steam app ');
  const isEpic = uninstLower.includes('com.epicgames.launcher') || locLower.includes('\\epic games\\') || locLower.includes('/epic games/') || idLower.startsWith('epicgames.');
  const isUbisoft = locLower.includes('ubisoft game launcher') || uninstLower.includes('uplay');
  const isEA = locLower.includes('ea desktop') || locLower.includes('origin games') || locLower.includes('ea games') || locLower.includes('electronic arts');
  const isRiot = locLower.includes('riot games') || uninstLower.includes('riotclient');
  const isBattleNet = locLower.includes('battle.net') || uninstLower.includes('battlenet://');
  const isGOG = locLower.includes('gog galaxy') || uninstLower.includes('gog galaxy');

  const isLauncherManaged = isSteam || isEpic || isUbisoft || isEA || isRiot || isBattleNet || isGOG;

  // Extracción de tokens limpia: SÓLO a partir del nombre del programa, NUNCA del editor/publisher
  const rawTokens = [];
  const cleanName = (name || '')
    .replace(/\(.*?\)/g, '')
    .replace(/\[.*?\]/g, '')
    .replace(/\bv?\d+(\.\d+)*\b/g, '')
    .trim();

  cleanName.split(/[\s\-_\.]+/).forEach(w => {
    const low = w.toLowerCase().trim();
    if (low.length >= 3 && !stopwords.has(low)) rawTokens.push(low);
  });

  // Si installLocation apunta a una carpeta específica del juego (no la raíz del lanzador)
  let safeInstallLoc = '';
  if (installLocation) {
    const baseFolder = path.basename(installLocation).toLowerCase().trim();
    const isProtectedFolder = protectedEcosystems.includes(baseFolder);
    if (!isProtectedFolder && baseFolder.length >= 3 && !stopwords.has(baseFolder)) {
      rawTokens.push(baseFolder);
      safeInstallLoc = installLocation;
    }
  }

  const tokens = Array.from(new Set(rawTokens));

  event.sender.send('apps:uninstall-log', {
    type: 'info',
    text: `\n┌─────────────────────────────────────────────────────────────┐\n` +
          `│ 🛡️ MOTOR DE DESINSTALACIÓN SEGURA Y RESIDUAL (SHIELD ENGINE) │\n` +
          `└─────────────────────────────────────────────────────────────┘\n` +
          `📦 Aplicación: ${name}\n` +
          `🏢 Editor: ${publisher || 'Desconocido'}\n` +
          `${isLauncherManaged ? `🎮 Plataforma de Juegos: ${isEpic ? 'Epic Games' : isSteam ? 'Steam' : isUbisoft ? 'Ubisoft Connect' : isEA ? 'EA App / Origin' : isRiot ? 'Riot Games' : isBattleNet ? 'Battle.net' : 'GOG Galaxy'} (Protección de cliente activa)\n` : ''}` +
          `🔍 Tokens de comprobación residual: [${tokens.join(', ')}]\n\n`
  });

  function fixUninstallString(str) {
    if (!str) return '';
    let s = str.trim();
    s = s.replace(/^(msiexec(?:\.exe)?\s+)\/i/i, '$1/x');
    if (s.toLowerCase().startsWith('msiexec') && !s.includes('/qn') && !s.includes('/passive') && !s.includes('/qr')) {
      s += ' /passive /norestart';
    }
    if (s.startsWith('"')) return s;
    const match = s.match(/^(.*\.exe)(\s+.*)?$/i);
    if (match) {
      return `"${match[1]}"${match[2] || ''}`;
    }
    return s;
  }

  const fixedUninstallString = fixUninstallString(uninstallString);
  let isFinished = false;

  // ─── FASE 3 & 4: Escaneo Heurístico Protegido y Purga Segura ─────────────────
  const runDeepHeuristicPurge = () => {
    if (isUninstallCancelled) return;
    if (isFinished) return;
    isFinished = true;

    event.sender.send('apps:uninstall-log', {
      type: 'info',
      text: `\n[FASE 3] Iniciando escaneo residual seguro en Registro y Almacenamiento...\n`
    });

    // PowerShell script con Escudo de Protección Absoluto y ejecución ultrarrápida
    const psScript = `
$OutputEncoding = [System.Text.Encoding]::UTF8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$appName = ${JSON.stringify(name)}
$cleanName = ${JSON.stringify(cleanName)}
$appId = ${JSON.stringify(id || '')}
$safeInstallLoc = ${JSON.stringify(safeInstallLoc || '')}
$tokens = @(${tokens.map(t => JSON.stringify(t)).join(', ')})
$isLauncherManaged = ${isLauncherManaged ? '$true' : '$false'}
$createRestorePoint = ${createRestorePoint ? '$true' : '$false'}
$userExcluded = @(${Array.from(userExcludedSet).map(x => JSON.stringify(x)).join(', ')})
$customWhitelistPaths = @(${customWhitelist.map(x => JSON.stringify(x)).join(', ')})

$deletedDirs = 0
$purgedKeys = 0
$rebootFiles = 0
$stoppedServices = 0
$killedProcs = 0

# ─── ESCUDO DE PROTECCIÓN: NUNCA TOCAR ESTOS ELEMENTOS ────────────────────────
$protectedNames = @(
    "epic games", "epic", "epicgames", "epicgameslauncher", "epic online services",
    "steam", "valve", "steamapps", "common",
    "ubisoft", "ubisoft game launcher", "ubisoftconnect", "upc",
    "electronic arts", "ea desktop", "origin", "ea games", "origin games",
    "riot games", "riot client",
    "battle.net", "blizzard", "blizzard entertainment",
    "gog galaxy", "gog.com",
    "microsoft", "windows", "windows nt", "windowsapps", "package cache", "common files",
    "system32", "syswow64", "system", "policies", "classes",
    "adobe", "google", "mozilla", "apple", "nvidia", "nvidia corporation", "amd", "intel",
    "saved games", "my games", "documents", "downloads", "desktop"
)
foreach ($cw in $customWhitelistPaths) {
    if (![string]::IsNullOrWhiteSpace($cw)) {
        $protectedNames += $cw.ToLower()
        $cwBase = [System.IO.Path]::GetFileName($cw).ToLower()
        if ($cwBase) { $protectedNames += $cwBase }
    }
}

function Test-IsExcludedOrWhitelisted([string]$candidatePath) {
    if ([string]::IsNullOrWhiteSpace($candidatePath)) { return $true }
    $cLow = $candidatePath.ToLower()
    $cClean = $cLow.Replace('microsoft.powershell.core\\registry::', '').Replace('hklm:\\', 'hklm\\').Replace('hkcu:\\', 'hkcu\\')
    if ($userExcluded -contains $cLow -or $userExcluded -contains $cClean) { return $true }
    foreach ($cw in $customWhitelistPaths) {
        if (![string]::IsNullOrWhiteSpace($cw)) {
            if ($cLow -eq $cw -or $cClean -eq $cw -or $cLow.StartsWith($cw + "\\") -or $cLow.IndexOf("\\" + $cw + "\\") -ge 0 -or $cLow.EndsWith("\\" + $cw)) {
                return $true
            }
        }
    }
    return $false
}

$protectedProcs = @(
    'epicgameslauncher', 'epiconlineservices', 'steam', 'steamwebhelper', 'steamservice',
    'ubisoftconnect', 'upc', 'ubisoftgamelauncher', 'eadesktop', 'origin', 'riotclientservices',
    'battle.net', 'agent', 'explorer', 'svchost', 'powershell', 'cmd', 'electron', 'wingetix', 'taskmgr'
)

# ─── FASE 4A: Cierre Seguro de Procesos Bloqueadores ──────────────────────────
if (![string]::IsNullOrWhiteSpace($safeInstallLoc) -and (Test-Path -LiteralPath $safeInstallLoc)) {
    $locBase = [System.IO.Path]::GetFileName($safeInstallLoc).ToLower()
    if ($protectedNames -notcontains $locBase) {
        $procs = Get-Process -ErrorAction SilentlyContinue | Where-Object {
            try {
                if ($_.Path -and ($_.Path.StartsWith($safeInstallLoc, [System.StringComparison]::OrdinalIgnoreCase))) {
                    $pName = $_.ProcessName.ToLower()
                    if ($protectedProcs -notcontains $pName) { return $true }
                }
            } catch {}
            $false
        }
        foreach ($p in $procs) {
            Write-Output "LOG:warning|  [FASE 4] Proceso bloqueador detectado: $($p.ProcessName) (PID: $($p.Id)). Finalizando..."
            Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue
            $killedProcs++
        }
    }
}

# ─── FASE 4B: Detención Segura de Servicios Propios ───────────────────────────
if (![string]::IsNullOrWhiteSpace($safeInstallLoc)) {
    try {
        $services = Get-CimInstance -ClassName Win32_Service -ErrorAction SilentlyContinue | Where-Object {
            try {
                if ($_.PathName -and $_.PathName.IndexOf($safeInstallLoc, [System.StringComparison]::OrdinalIgnoreCase) -ge 0) {
                    $sName = $_.Name.ToLower()
                    $isProt = $false
                    foreach ($pn in $protectedNames) { if ($sName.IndexOf($pn) -ge 0) { $isProt = $true; break } }
                    return !$isProt
                }
            } catch {}
            $false
        }
        foreach ($svc in $services) {
            Write-Output "LOG:warning|  [FASE 4] Servicio propio detectado: $($svc.Name). Deteniendo y eliminando..."
            Stop-Service -Name $svc.Name -Force -ErrorAction SilentlyContinue
            & sc.exe delete $($svc.Name) | Out-Null
            $stoppedServices++
        }
    } catch {}
}

# ─── FASE 3A & 4C: Punto de Restauración y Respaldo .REG ─────────────────────────
$backupDir = Join-Path $env:LOCALAPPDATA "Wingetix\\RegistryBackups"
try {
    if (!(Test-Path -LiteralPath $backupDir)) {
        New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    }
} catch {}

function Backup-RegKey([string]$psPath, [string]$label) {
    try {
        $cleanKey = $psPath.Replace('Microsoft.PowerShell.Core\\Registry::', '').Replace('HKLM:\\', 'HKLM\\').Replace('HKCU:\\', 'HKCU\\')
        $timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
        $safeName = ($cleanName + "_" + $label + "_" + $timestamp) -replace '[\\\\/:*?"<>|\\s]', '_'
        $backupFile = Join-Path $backupDir "$safeName.reg"
        & reg.exe export "$cleanKey" "$backupFile" /y 2>$null | Out-Null
        if (Test-Path -LiteralPath $backupFile) {
            Write-Output "LOG:output|  [RESPALDO .REG] Clave respaldada de forma segura en: $backupFile"
        }
    } catch {}
}

# Comprobar y crear Punto de Restauración del Sistema en Windows (Opcional)
if ($createRestorePoint) {
    try {
        Write-Output "LOG:info|  [PUNTO DE RESTAURACIÓN] Creando Punto de Restauración del Sistema en Windows..."
        $null = Checkpoint-Computer -Description "Wingetix - Limpieza $cleanName" -RestorePointType "APPLICATION_UNINSTALL" -ErrorAction Stop
        Write-Output "LOG:success|  [PUNTO DE RESTAURACIÓN] Punto de Restauración del Sistema creado con éxito."
    } catch {
        Write-Output "LOG:output|  [PUNTO DE RESTAURACIÓN] Punto del sistema gestionado por directiva de Windows o intervalo de 24h."
    }
} else {
    Write-Output "LOG:info|  [PUNTO DE RESTAURACIÓN] Omitido por configuración de usuario (Ahorro de espacio en disco)."
}

Write-Output "LOG:info|[FASE 3] Inspeccionando registro de forma segura..."

$regRoots = @(
    "HKLM:\\SOFTWARE",
    "HKCU:\\Software",
    "HKLM:\\SOFTWARE\\WOW6432Node",
    "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\App Paths"
)

$normApp = ($cleanName -replace '[^a-zA-Z0-9]', '').ToLower()

foreach ($regRoot in $regRoots) {
    if (Test-Path -LiteralPath $regRoot) {
        $subKeys = Get-ChildItem -LiteralPath $regRoot -ErrorAction SilentlyContinue
        foreach ($sk in $subKeys) {
            $kName = $sk.PSChildName
            $kLow = $kName.ToLower()

            # NUNCA eliminar una clave de editor o plataforma compartida
            if ($protectedNames -contains $kLow) {
                # Si es una clave de plataforma (ej. Epic Games o Valve), inspeccionar hijos para el juego específico
                $childKeys = Get-ChildItem -LiteralPath $sk.PSPath -ErrorAction SilentlyContinue
                foreach ($ck in $childKeys) {
                    $ckName = $ck.PSChildName
                    $ckNorm = ($ckName -replace '[^a-zA-Z0-9]', '').ToLower()
                    if ($ckNorm -eq $normApp -or ($normApp.Length -ge 4 -and $ckNorm.StartsWith($normApp))) {
                        Backup-RegKey $ck.PSPath $ckName
                        Write-Output "LOG:output|  [FASE 4] Purgando clave residual del juego en $($sk.Name): $ckName"
                        Remove-Item -LiteralPath $ck.PSPath -Recurse -Force -ErrorAction SilentlyContinue
                        $purgedKeys++
                    }
                }
                continue
            }

            # Para claves no protegidas, comprobar coincidencia exacta o normalizada con el nombre de la app
            $kNorm = ($kName -replace '[^a-zA-Z0-9]', '').ToLower()
            $isMatch = $false
            if ($kNorm -eq $normApp) {
                $isMatch = $true
            } elseif ($normApp.Length -ge 5 -and $kNorm.StartsWith($normApp)) {
                $isMatch = $true
            }

            if ($isMatch) {
                if (Test-IsExcludedOrWhitelisted $sk.Name) {
                    Write-Output "LOG:warning|  [ESCUDO LISTA BLANCA] Omitiendo clave protegida por el usuario: $($sk.Name)"
                    continue
                }
                Backup-RegKey $sk.PSPath $kName
                Write-Output "LOG:output|  [FASE 4] Purgando clave de registro residual: $($sk.Name)"
                Remove-Item -LiteralPath $sk.PSPath -Recurse -Force -ErrorAction SilentlyContinue
                $purgedKeys++
            }
        }
    }
}

# Limpiar entrada de Desinstalación (Uninstall) para eliminar registros fantasma
if (![string]::IsNullOrWhiteSpace($appId)) {
    $uninstallRegPaths = @(
        "HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\$appId",
        "HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\$appId",
        "HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\$appId"
    )
    foreach ($urp in $uninstallRegPaths) {
        if (Test-Path -LiteralPath $urp) {
            Backup-RegKey $urp "UninstallEntry"
            Write-Output "LOG:output|  [FASE 4] Limpiando registro de desinstalación de Windows..."
            Remove-Item -LiteralPath $urp -Recurse -Force -ErrorAction SilentlyContinue
            $purgedKeys++
        }
    }
}

# ─── FASE 3B & 4D: Escaneo y Purga de Disco con Protección Total ───────────────
Write-Output "LOG:info|[FASE 3] Inspeccionando almacenamiento y carpetas residuales..."

$scanBases = @(
    [System.Environment]::GetFolderPath('CommonApplicationData'),
    [System.Environment]::GetFolderPath('LocalApplicationData'),
    [System.Environment]::GetFolderPath('ApplicationData'),
    (Join-Path $env:USERPROFILE "AppData\\LocalLow"),
    (Join-Path $env:APPDATA "Microsoft\\Windows\\Start Menu\\Programs"),
    (Join-Path ([System.Environment]::GetFolderPath('CommonApplicationData')) "Microsoft\\Windows\\Start Menu\\Programs"),
    [System.IO.Path]::GetTempPath()
) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }

# Program Files sólo si no está gestionado por un launcher como Epic o Steam
if (!$isLauncherManaged) {
    $scanBases += @(
        [System.Environment]::GetFolderPath('ProgramFiles'),
        [System.Environment]::GetFolderPath('ProgramFilesX86')
    ) | Where-Object { $_ -and (Test-Path -LiteralPath $_) }
}

$dirsToPurge = [System.Collections.Generic.HashSet[string]]::new([System.StringComparer]::OrdinalIgnoreCase)

# Si hay una carpeta de instalación confirmada propia del programa (no raíz del lanzador)
if (![string]::IsNullOrWhiteSpace($safeInstallLoc) -and (Test-Path -LiteralPath $safeInstallLoc)) {
    $bName = [System.IO.Path]::GetFileName($safeInstallLoc).ToLower()
    if ($protectedNames -notcontains $bName) {
        $null = $dirsToPurge.Add($safeInstallLoc)
    }
}

foreach ($base in $scanBases) {
    $entries = Get-ChildItem -LiteralPath $base -Directory -ErrorAction SilentlyContinue
    foreach ($entry in $entries) {
        $eName = $entry.Name.Trim()
        $eLow = $eName.ToLower()

        # ESCUDO: Si es una carpeta de launcher o compartida, omitir
        if ($protectedNames -contains $eLow) { continue }

        $eNorm = ($eName -replace '[^a-zA-Z0-9]', '').ToLower()
        $matched = $false

        # Coincidencia estricta: nombre exacto normalizado o prefijo con separador
        if ($eNorm -eq $normApp) {
            $matched = $true
        } elseif ($cleanName.Length -ge 4 -and $eName -match "^(?i)$([regex]::Escape($cleanName))([\s\-_\.]|$)") {
            $matched = $true
        } elseif ($tokens.Count -ge 2) {
            # Si hay múltiples tokens específicos, deben estar presentes todos
            $allPresent = $true
            foreach ($t in $tokens) {
                if ($eLow.IndexOf($t) -lt 0) { $allPresent = $false; break }
            }
            if ($allPresent) { $matched = $true }
        }

        if ($matched) {
            $null = $dirsToPurge.Add($entry.FullName)
        }
    }
}

foreach ($target in $dirsToPurge) {
    # Doble verificación antes de borrar (incluyendo Lista Blanca de Platform Shield y exclusiones del usuario)
    $tBase = [System.IO.Path]::GetFileName($target).ToLower()
    if (($protectedNames -contains $tBase) -or (Test-IsExcludedOrWhitelisted $target)) {
        Write-Output "LOG:warning|  [ESCUDO] Protección o Lista Blanca activada: Omitiendo carpeta: $target"
        continue
    }

    Write-Output "LOG:output|  [FASE 4] Eliminando residuo seguro en disco: $target"
    try {
        [System.IO.Directory]::Delete($target, $true)
        $deletedDirs++
    } catch {
        try {
            Remove-Item -LiteralPath $target -Recurse -Force -ErrorAction Stop
            $deletedDirs++
        } catch {
            Write-Output "LOG:warning|  [FASE 4] No se pudo eliminar de inmediato (en uso): $target"
        }
    }
}

Write-Output "SUMMARY|$deletedDirs|$purgedKeys|$rebootFiles|$killedProcs|$stoppedServices"
`;

    const tmpCleanPath = path.join(os.tmpdir(), `winget_clean_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.ps1`);
    fs.writeFileSync(tmpCleanPath, '\ufeff' + psScript, 'utf8');

    const cleanProc = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-File', tmpCleanPath
    ], {
      windowsHide: true,
    });
    activeUninstallProc = cleanProc;

    let summaryData = null;

    cleanProc.stdout.on('data', (d) => {
      const text = d.toString('utf8');
      const lines = text.split(/\r?\n/).filter(Boolean);
      for (const line of lines) {
        if (line.startsWith('LOG:')) {
          const firstPipe = line.indexOf('|');
          const type = line.substring(4, firstPipe);
          const msg = line.substring(firstPipe + 1);
          event.sender.send('apps:uninstall-log', { type, text: msg + '\n' });
        } else if (line.startsWith('SUMMARY|')) {
          const parts = line.split('|');
          summaryData = {
            deletedDirs: parseInt(parts[1] || '0', 10),
            purgedKeys: parseInt(parts[2] || '0', 10),
            rebootFiles: parseInt(parts[3] || '0', 10),
            killedProcs: parseInt(parts[4] || '0', 10),
            stoppedServices: parseInt(parts[5] || '0', 10)
          };
        }
      }
    });

    cleanProc.stderr.on('data', (d) => {
      const errText = d.toString('utf8').trim();
      if (errText) {
        event.sender.send('apps:uninstall-log', { type: 'warning', text: `[PowerShell] ${errText}\n` });
      }
    });

    let isCleanDone = false;
    const finalizeClean = () => {
      if (isCleanDone) return;
      isCleanDone = true;
      activeUninstallProc = null;
      try { if (fs.existsSync(tmpCleanPath)) fs.unlinkSync(tmpCleanPath); } catch (_) {}
      if (isUninstallCancelled) return;

      const s = summaryData || { deletedDirs: 0, purgedKeys: 0, rebootFiles: 0, killedProcs: 0, stoppedServices: 0 };
      event.sender.send('apps:uninstall-log', {
        type: 'success',
        text: `\n✅ LIMPIEZA SEGURA COMPLETADA:\n` +
              `  • Directorios y carpetas eliminados: ${s.deletedDirs}\n` +
              `  • Claves y registros purgados: ${s.purgedKeys}\n` +
              `  • Procesos propios cerrados: ${s.killedProcs}\n` +
              `  • Servicios propios eliminados: ${s.stoppedServices}\n` +
              `  • Protección de plataformas (Epic Games / Steam / Otros): ACTIVA Y RESPETADA 🛡️\n`
      });

      event.sender.send('apps:uninstall-done', { success: true, summary: s });
    };

    cleanProc.on('exit', finalizeClean);
    cleanProc.on('close', finalizeClean);

    cleanProc.on('error', (err) => {
      activeUninstallProc = null;
      try { if (fs.existsSync(tmpCleanPath)) fs.unlinkSync(tmpCleanPath); } catch (_) {}
      if (isUninstallCancelled) return;
      event.sender.send('apps:uninstall-log', { type: 'error', text: `✖ Error al ejecutar motor de limpieza: ${err.message}\n` });
      event.sender.send('apps:uninstall-done', { success: false });
    });
  };

  // ─── FASE 2: Ejecución Inteligente del Desinstalador Oficial ────────────────
  let purgeStarted = false;
  const triggerPurge = (reason, code) => {
    if (isUninstallCancelled) return;
    if (purgeStarted) return;
    purgeStarted = true;
    ipcMain.removeAllListeners('apps:force-proceed-cleanup');
    if (code !== undefined && code !== null) {
      event.sender.send('apps:uninstall-log', { type: 'info', text: `\n[FASE 2] Desinstalador oficial finalizado (código: ${code}). Iniciando limpieza segura...\n` });
    }
    runDeepHeuristicPurge();
  };

  ipcMain.removeAllListeners('apps:force-proceed-cleanup');
  ipcMain.once('apps:force-proceed-cleanup', () => {
    event.sender.send('apps:uninstall-log', { type: 'info', text: `\n[AVISO] Confirmación recibida: procediendo con el escaneo y purga segura...\n` });
    triggerPurge('manual');
  });

  // CASO A: EPIC GAMES
  if (isEpic) {
    event.sender.send('apps:uninstall-log', {
      type: 'info',
      text: `[FASE 2] Detectado juego de Epic Games.\n` +
            `▶ Abriendo desinstalador oficial en Epic Games Launcher...\n` +
            `ℹ Confirma la desinstalación en la ventana de Epic Games si aparece.\n` +
            `🛡️ El cliente y resto de juegos de Epic Games permanecerán intactos.\n`
    });

    const epicMatch = uninstallString.match(/com\.epicgames\.launcher:\/\/apps\/[^\s"']+/i);
    const epicUrl = epicMatch ? epicMatch[0] : null;
    const cmd = epicUrl ? `Start-Process '${epicUrl}'` : fixedUninstallString;

    activeUninstallProc = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });

    // Para juegos de launcher, el cliente de Epic gestiona la desinstalación
    setTimeout(() => {
      if (!purgeStarted && !isUninstallCancelled) {
        event.sender.send('apps:uninstall-log', {
          type: 'info',
          text: `\nℹ Cuando la desinstalación en Epic Games termine, pulsa en la barra inferior 'El desinstalador ya terminó' para limpiar residuos de este juego.\n`
        });
      }
    }, 4000);
    return;
  }

  // CASO B: STEAM
  if (isSteam) {
    event.sender.send('apps:uninstall-log', {
      type: 'info',
      text: `[FASE 2] Detectado juego de Steam.\n` +
            `▶ Abriendo protocolo oficial de desinstalación de Steam...\n` +
            `ℹ Confirma la desinstalación en la ventana de Steam.\n` +
            `🛡️ El cliente de Steam y el resto de la biblioteca permanecerán intactos.\n`
    });
    const steamMatch = uninstallString.match(/steam:\/\/uninstall\/\d+/i);
    const steamUrl = steamMatch ? steamMatch[0] : null;
    const cmd = steamUrl ? `Start-Process '${steamUrl}'` : fixedUninstallString;

    activeUninstallProc = spawn('powershell.exe', ['-NoProfile', '-Command', cmd], { windowsHide: true });

    setTimeout(() => {
      if (!purgeStarted && !isUninstallCancelled) {
        event.sender.send('apps:uninstall-log', {
          type: 'info',
          text: `\nℹ Cuando la desinstalación en Steam termine, pulsa en la barra inferior 'El desinstalador ya terminó' para limpiar residuos de este juego.\n`
        });
      }
    }, 4000);
    return;
  }

  // CASO C: APLICACIONES ESTÁNDAR
  try {
    event.sender.send('apps:uninstall-log', { type: 'info', text: `[FASE 2] Ejecutando desinstalador oficial: ${fixedUninstallString}\n` });

    const proc = spawn(fixedUninstallString, [], {
      shell: true,
      windowsHide: false,
      stdio: 'ignore'
    });
    activeUninstallProc = proc;

    proc.on('exit', (code) => {
      activeUninstallProc = null;
      triggerPurge('exit', code);
    });

    proc.on('close', (code) => {
      activeUninstallProc = null;
      triggerPurge('close', code);
    });

    proc.on('error', (err) => {
      activeUninstallProc = null;
      if (isUninstallCancelled) return;
      event.sender.send('apps:uninstall-log', { type: 'warning', text: `[FASE 2] Aviso al ejecutar desinstalador: ${err.message}. Continuando con purga segura...\n` });
      triggerPurge('error');
    });

    // Timeout de seguridad amplio (4 minutos) en caso de que el desinstalador quede en espera
    setTimeout(() => {
      if (!purgeStarted) {
        event.sender.send('apps:uninstall-log', { type: 'info', text: `⏱ Tiempo de espera superado. Procediendo con el escaneo y purga segura...\n` });
        triggerPurge('timeout');
      }
    }, 240000);

  } catch (err) {
    event.sender.send('apps:uninstall-log', { type: 'error', text: `[FASE 2] Error al lanzar desinstalador: ${err.message}. Procediendo con purga directa...\n` });
    triggerPurge('spawn_error');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// GPU & GRAPHICS CONTROL PANEL HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

ipcMain.handle('gpu:detect-info', async () => {
  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

$nvidiaSmiDetails = $null
try {
    $smi = & 'nvidia-smi' --query-gpu=name,driver_version,memory.total,memory.used,utilization.gpu,temperature.gpu,power.draw,power.limit --format=csv,noheader,nounits 2>$null
    if ($smi) {
        $parts = $smi -split ','
        if ($parts.Length -ge 8) {
            $nvidiaSmiDetails = [PSCustomObject]@{
                Name = $parts[0].Trim()
                DriverVersion = $parts[1].Trim()
                MemoryTotalMb = [int64]$parts[2].Trim()
                MemoryUsedMb = [int64]$parts[3].Trim()
                GpuUtilPct = [int]$parts[4].Trim()
                TemperatureC = [int]$parts[5].Trim()
                PowerDrawW = [double]$parts[6].Trim()
                PowerLimitW = [double]$parts[7].Trim()
            }
        }
    }
} catch {}

$cimVideo = @(Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue)
$regAdapters = @(Get-ItemProperty 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\Class\\{4d36e968-e325-11ce-bfc1-08002be10318}\\000*' -ErrorAction SilentlyContinue | Where-Object { $_.DriverDesc })

$gpus = @($regAdapters | ForEach-Object {
    $desc = $_.DriverDesc
    $qwMem = $_.'HardwareInformation.qwMemorySize'
    $mem32 = $_.'HardwareInformation.MemorySize'
    $drvVer = $_.DriverVersion
    $drvDate = $_.DriverDate
    
    $vramBytes = 0
    if ($qwMem -and [int64]$qwMem -gt 0) {
        $vramBytes = [int64]$qwMem
    } elseif ($mem32 -and [int64]$mem32 -gt 0) {
        $vramBytes = [int64]$mem32
    }

    $cimMatch = $cimVideo | Where-Object { $_.Name -eq $desc -or $_.DriverVersion -eq $drvVer } | Select-Object -First 1

    $refreshRate = $null
    $resX = $null
    $resY = $null
    if ($cimMatch) {
        $refreshRate = $cimMatch.CurrentRefreshRate
        $resX = $cimMatch.CurrentHorizontalResolution
        $resY = $cimMatch.CurrentVerticalResolution
        if (-not $drvDate) { $drvDate = $cimMatch.DriverDate }
    }

    $nvDriverDisplay = $drvVer
    if ($desc -like '*NVIDIA*' -and $nvidiaSmiDetails) {
        $nvDriverDisplay = "$($nvidiaSmiDetails.DriverVersion) ($drvVer)"
    }
    
    [PSCustomObject]@{
        Name = $desc
        DriverVersion = $nvDriverDisplay
        RawDriverVersion = $drvVer
        DriverDate = $drvDate
        Status = "OK"
        AdapterRAM = $vramBytes
        VideoProcessor = $desc
        RefreshRate = $refreshRate
        ResolutionX = $resX
        ResolutionY = $resY
        NvidiaSmi = if ($desc -like '*NVIDIA*') { $nvidiaSmiDetails } else { $null }
    }
})

$startApps = @(Get-StartApps | Where-Object { 
    $_.Name -match 'NVIDIA|GeForce|Radeon|AMD|Intel.*Arc|Graphics Command' -or
    $_.AppID -match 'NVIDIA|GeForce|Radeon|AMD|Intel'
} | Select-Object Name, AppID)

$appxList = @(Get-AppxPackage | Select-Object Name, Version, PackageFamilyName)

$nvcplInstalled = $false
$nvAppInstalled = $false
$gfeInstalled = $false
$nvcleanInstalled = $false
$nvpiInstalled = $false
$amdInstalled = $false
$intelInstalled = $false

$nvcplAppId = ""
$nvAppAppId = ""
$nvcplVer = ""
$nvAppVer = ""

$nvcplAppx = $appxList | Where-Object { $_.Name -like "*NVIDIAControlPanel*" }
if ($nvcplAppx) {
    $nvcplVer = $nvcplAppx.Version
    $nvcplInstalled = $true
    $nvcplAppId = "$($nvcplAppx.PackageFamilyName)!NVIDIACorp.NVIDIAControlPanel"
}

$nvAppAppx = $appxList | Where-Object { $_.Name -like "*NVIDIAapp*" -or $_.Name -like "*XP8CLZL93F5Z4P*" }
if ($nvAppAppx) {
    $nvAppVer = $nvAppAppx.Version
    $nvAppInstalled = $true
    $nvAppAppId = "$($nvAppAppx.PackageFamilyName)!NVIDIA.app"
}

foreach ($app in $startApps) {
    if ($app.Name -like "*NVIDIA Control Panel*" -or $app.AppID -like "*NVIDIAControlPanel*") { 
        $nvcplInstalled = $true
        if (-not $nvcplAppId) { $nvcplAppId = $app.AppID }
    }
    if ($app.Name -like "*NVIDIA App*" -or $app.AppID -like "*XP8CLZL93F5Z4P*" -or $app.AppID -like "*NVIDIAapp*") { 
        $nvAppInstalled = $true
        if (-not $nvAppAppId) { $nvAppAppId = $app.AppID }
    }
    if ($app.Name -like "*GeForce Experience*") { $gfeInstalled = $true }
    if ($app.Name -like "*NVCleanstall*") { $nvcleanInstalled = $true }
    if ($app.Name -like "*Profile Inspector*") { $nvpiInstalled = $true }
    if ($app.Name -like "*AMD Software*" -or $app.Name -like "*Radeon*") { $amdInstalled = $true }
    if ($app.Name -like "*Intel Arc*" -or $app.Name -like "*Graphics Command*") { $intelInstalled = $true }
}

# Check Program Files paths if not registered in start menu
if (-not $nvcplInstalled) {
    if (Test-Path "C:\\Program Files\\NVIDIA Corporation\\Control Panel Client\\nvcplui.exe") { 
        $nvcplInstalled = $true
        $nvcplAppId = "C:\\Program Files\\NVIDIA Corporation\\Control Panel Client\\nvcplui.exe"
    }
}
if (-not $nvAppInstalled) {
    if (Test-Path "C:\\Program Files\\NVIDIA Corporation\\NVIDIA App\\NVIDIA App.exe") { 
        $nvAppInstalled = $true
        $nvAppAppId = "C:\\Program Files\\NVIDIA Corporation\\NVIDIA App\\NVIDIA App.exe"
    }
}
if (-not $gfeInstalled) {
    if (Test-Path "C:\\Program Files\\NVIDIA Corporation\\NVIDIA GeForce Experience\\NVIDIA GeForce Experience.exe") { $gfeInstalled = $true }
}

$result = [PSCustomObject]@{
    GPUs = $gpus
    StartApps = $startApps
    InstalledStatus = [PSCustomObject]@{
        NvidiaControlPanel = $nvcplInstalled
        NvidiaControlPanelVersion = $nvcplVer
        NvidiaControlPanelAppId = $nvcplAppId
        NvidiaApp = $nvAppInstalled
        NvidiaAppVersion = $nvAppVer
        NvidiaAppAppId = $nvAppAppId
        GeForceExperience = $gfeInstalled
        NVCleanstall = $nvcleanInstalled
        ProfileInspector = $nvpiInstalled
        AmdRadeonSoftware = $amdInstalled
        IntelArcControl = $intelInstalled
    }
}

$result | ConvertTo-Json -Depth 4
`;

  return new Promise((resolve) => {
    const tmp = path.join(os.tmpdir(), `winget_gpu_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.ps1`);
    fs.writeFileSync(tmp, '\ufeff' + psScript, 'utf8');

    const ps = spawn('powershell.exe', [
      '-NoProfile',
      '-NonInteractive',
      '-ExecutionPolicy', 'Bypass',
      '-File', tmp
    ], {
      windowsHide: true,
    });

    let out = '';
    ps.stdout.on('data', d => out += d);
    ps.on('close', () => {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      try {
        const data = JSON.parse(out.trim());
        resolve({ success: true, data });
      } catch (err) {
        resolve({ success: false, error: err.message });
      }
    });
    ps.on('error', (err) => {
      try { if (fs.existsSync(tmp)) fs.unlinkSync(tmp); } catch (_) {}
      resolve({ success: false, error: err.message });
    });
  });
});

ipcMain.on('gpu:install-package', (event, { pkgId, source, name }) => {
  event.sender.send('gpu:install-log', { type: 'info', text: `▶ Iniciando proceso para ${name || pkgId}...\n` });

  let args = ['install', '--id', pkgId, '--exact', '--accept-package-agreements', '--accept-source-agreements', '--disable-interactivity'];
  if (source) {
    args.push('--source', source);
  } else {
    args.push('--silent');
  }

  const wingetProc = spawnWinget(args, { env: buildEnv() });

  wingetProc.stdout.on('data', (d) => {
    event.sender.send('gpu:install-log', { type: 'output', text: d.toString() });
  });

  wingetProc.stderr.on('data', (d) => {
    event.sender.send('gpu:install-log', { type: 'warning', text: d.toString() });
  });

  wingetProc.on('close', (code) => {
    const isUpToDate = (code === 2316632107 || code === -1978236885 || code === 2316632084 || code === -1978236908);
    const isAlreadyInstalled = (code === 2316632109 || code === -1978236883);
    const isSuccess = (code === 0 || code === 3010 || isUpToDate || isAlreadyInstalled);

    if (isSuccess) {
      if (isUpToDate) {
        event.sender.send('gpu:install-log', { type: 'success', text: `\n✔ ${name || pkgId} ya está instalado y actualizado a la última versión disponible.\n` });
        event.sender.send('gpu:install-done', { success: true, pkgId, alreadyUpToDate: true });
      } else {
        event.sender.send('gpu:install-log', { type: 'success', text: `\n✔ Operación completada con éxito para ${name || pkgId}.\n` });
        event.sender.send('gpu:install-done', { success: true, pkgId });
      }
    } else {
      event.sender.send('gpu:install-log', { type: 'error', text: `\n✖ Error durante la instalación (Código: ${code}).\n` });
      event.sender.send('gpu:install-done', { success: false, pkgId, code });
    }
  });

  wingetProc.on('error', (err) => {
    event.sender.send('gpu:install-log', { type: 'error', text: `✖ No se pudo iniciar el instalador: ${err.message}\n` });
    event.sender.send('gpu:install-done', { success: false, error: err.message });
  });
});

ipcMain.handle('gpu:launch-app', async (event, appIdOrPath) => {
  if (!appIdOrPath) return { success: false, error: 'No se especificó la aplicación a ejecutar' };

  return new Promise((resolve) => {
    let cmd = '';
    if (appIdOrPath.includes('!')) {
      cmd = `Start-Process 'explorer.exe' 'shell:AppsFolder\\${appIdOrPath}'`;
    } else {
      cmd = `Start-Process '${appIdOrPath}'`;
    }

    const ps = spawn('powershell.exe', ['-NoProfile', '-Command', cmd]);
    ps.on('close', (code) => resolve({ success: code === 0 }));
    ps.on('error', (err) => resolve({ success: false, error: err.message }));
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Restore Points Handlers
// ═══════════════════════════════════════════════════════════════════════════════

function runElevatedPsScript(scriptContent) {
  return new Promise((resolve) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const tmpScript = path.join(os.tmpdir(), `wg_elev_${id}.ps1`);
    const tmpLauncher = path.join(os.tmpdir(), `wg_launch_${id}.ps1`);
    const tmpJson = path.join(os.tmpdir(), `wg_out_${id}.json`);

    const actualElevatedScript = scriptContent.replace(/__OUT_JSON__/g, tmpJson.replace(/'/g, "''"));

    const launcherContent = `
$ErrorActionPreference = 'Stop'
try {
  $p = Start-Process powershell.exe -ArgumentList @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', '${tmpScript.replace(/'/g, "''")}') -Verb RunAs -Wait -PassThru -WindowStyle Hidden
} catch {
  $json = @{ success = $false; error = "Operación cancelada o rechazada en el diálogo de Administrador (UAC)." } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('${tmpJson.replace(/'/g, "''")}', $json, [System.Text.Encoding]::UTF8)
}
`;

    try {
      fs.writeFileSync(tmpScript, '\ufeff' + actualElevatedScript, 'utf8');
      fs.writeFileSync(tmpLauncher, '\ufeff' + launcherContent, 'utf8');
    } catch (err) {
      return resolve({ success: false, error: `Error creando script temporal: ${err.message}` });
    }

    const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpLauncher], {
      windowsHide: true
    });

    proc.on('close', () => {
      try { fs.unlinkSync(tmpLauncher); } catch (_) {}
      try { fs.unlinkSync(tmpScript); } catch (_) {}

      try {
        if (fs.existsSync(tmpJson)) {
          let content = fs.readFileSync(tmpJson, 'utf8');
          try { fs.unlinkSync(tmpJson); } catch (_) {}
          // Strip BOM if present
          if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
          }
          const data = JSON.parse(content.trim());
          return resolve(data);
        }
      } catch (e) {
        return resolve({ success: false, error: `Error procesando resultado: ${e.message}` });
      }

      resolve({ success: false, error: 'No se pudo completar la operación con permisos de administrador.' });
    });

    proc.on('error', (e) => {
      try { fs.unlinkSync(tmpLauncher); } catch (_) {}
      try { fs.unlinkSync(tmpScript); } catch (_) {}
      resolve({ success: false, error: e.message });
    });
  });
}

function runElevatedRestoreList(resolve) {
  const psElevated = `
$ErrorActionPreference = 'SilentlyContinue'
$points = @()
try {
  $raw = Get-ComputerRestorePoint
  foreach ($p in $raw) {
    $cDate = ""
    try {
      $cDate = ([System.Management.ManagementDateTimeConverter]::ToDateTime($p.CreationTime)).ToString("dd/MM/yyyy HH:mm:ss")
    } catch {
      try {
        $cDate = ([datetime]$p.CreationTime).ToString("dd/MM/yyyy HH:mm:ss")
      } catch {
        $cDate = [string]$p.CreationTime
      }
    }
    $typeName = switch ($p.RestorePointType) {
      0 { "Instalación de aplicación" }
      1 { "Desinstalación de aplicación" }
      10 { "Instalación de dispositivo" }
      12 { "Modificación de configuración" }
      13 { "Punto de control del sistema" }
      default { "Punto del sistema" }
    }
    $points += @{
      sequenceNumber = [int]$p.SequenceNumber
      description = [string]$p.Description
      creationTime = $cDate
      restorePointType = [int]$p.RestorePointType
      typeName = $typeName
      eventType = [int]$p.EventType
    }
  }
} catch {}

$regKey = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore'
$srEnabled = $true
try {
  $prop = Get-ItemProperty -Path $regKey -ErrorAction SilentlyContinue
  if ($prop -and $prop.DisableSR -eq 1) { $srEnabled = $false }
} catch {}

$json = @{ success = $true; enabled = $srEnabled; points = $points } | ConvertTo-Json -Depth 4 -Compress
[System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
`;
  runElevatedPsScript(psElevated).then(resolve);
}

function runElevatedRestoreCreate(description, resolve) {
  const cleanDesc = (description || 'Wingetix - Punto manual').replace(/['"]/g, '').trim();
  const psElevated = `
$ErrorActionPreference = 'Stop'
try {
  $regPath = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore'
  if (-not (Test-Path -LiteralPath $regPath)) {
    New-Item -Path $regPath -Force | Out-Null
  }
  Set-ItemProperty -Path $regPath -Name 'SystemRestorePointCreationFrequency' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue

  Set-Service -Name 'vss' -StartupType Manual -ErrorAction SilentlyContinue
  Start-Service -Name 'vss' -ErrorAction SilentlyContinue

  $drive = $env:SystemDrive
  if ($drive) {
    Enable-ComputerRestore -Drive "$drive\\" -ErrorAction SilentlyContinue
  }

  Checkpoint-Computer -Description '${cleanDesc.replace(/'/g, "''")}' -RestorePointType "APPLICATION_INSTALL" -ErrorAction Stop

  $json = @{ success = $true; message = "Punto de restauración creado con éxito." } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
} catch {
  $json = @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
}
`;
  runElevatedPsScript(psElevated).then(resolve);
}

ipcMain.handle('restore:list', async (_event, opts = {}) => {
  return new Promise((resolve) => {
    if (opts && opts.elevate) {
      return runElevatedRestoreList(resolve);
    }
    const psScript = `
$ErrorActionPreference = 'Stop'
try {
    $sysDrive = $env:SystemDrive
    $srEnabled = $true
    try {
        $regKey = 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore'
        $prop = Get-ItemProperty -Path $regKey -ErrorAction SilentlyContinue
        if ($prop -and $prop.DisableSR -eq 1) {
            $srEnabled = $false
        }
    } catch {}

    $points = @()
    $raw = Get-ComputerRestorePoint
    foreach ($p in $raw) {
        $cDate = ""
        try {
            $cDate = ([System.Management.ManagementDateTimeConverter]::ToDateTime($p.CreationTime)).ToString("dd/MM/yyyy HH:mm:ss")
        } catch {
            try {
                $cDate = ([datetime]$p.CreationTime).ToString("dd/MM/yyyy HH:mm:ss")
            } catch {
                $cDate = [string]$p.CreationTime
            }
        }
        $typeName = switch ($p.RestorePointType) {
            0 { "Instalación de aplicación" }
            1 { "Desinstalación de aplicación" }
            10 { "Instalación de dispositivo" }
            12 { "Modificación de configuración" }
            13 { "Punto de control del sistema" }
            default { "Punto del sistema" }
        }
        $points += @{
            sequenceNumber = [int]$p.SequenceNumber
            description = [string]$p.Description
            creationTime = $cDate
            restorePointType = [int]$p.RestorePointType
            typeName = $typeName
            eventType = [int]$p.EventType
        }
    }

    @{
        success = $true
        enabled = $srEnabled
        points = $points
    } | ConvertTo-Json -Depth 4 -Compress
} catch {
    $isDenied = ($_.Exception.Message -like "*Acceso denegado*" -or $_.Exception.Message -like "*Access is denied*" -or $_.FullyQualifiedErrorId -like "*PermissionDenied*" -or $_.FullyQualifiedErrorId -like "*GetWMIManagementException*")
    @{
        success = $false
        requiresAdmin = $isDenied
        error = $_.Exception.Message
    } | ConvertTo-Json -Depth 3 -Compress
}
`;

    const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], {
      windowsHide: true
    });

    let out = '';
    let err = '';
    proc.stdout.on('data', d => { out += d.toString('utf8'); });
    proc.stderr.on('data', d => { err += d.toString('utf8'); });

    proc.on('close', () => {
      try {
        let jsonMatch = out.trim();
        if (jsonMatch.charCodeAt(0) === 0xFEFF) {
          jsonMatch = jsonMatch.slice(1);
        }
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch.trim());
          if (parsed.success) {
            return resolve(parsed);
          }
          if (parsed.requiresAdmin && opts.elevate) {
            return runElevatedRestoreList(resolve);
          }
          return resolve(parsed);
        }
      } catch (_) {}
      if (opts.elevate) {
        return runElevatedRestoreList(resolve);
      }
      resolve({ success: false, requiresAdmin: true, error: err || 'Acceso denegado' });
    });

    proc.on('error', (e) => {
      resolve({ success: false, error: e.message });
    });
  });
});

ipcMain.handle('restore:create', async (_event, description) => {
  const cleanDesc = (description || 'Wingetix - Punto manual').replace(/["`$'\\]/g, '').trim();
  return new Promise((resolve) => {
    // 1. First try direct Checkpoint-Computer in case process is already elevated
    const directScript = `
$ErrorActionPreference = 'Stop'
try {
  Set-ItemProperty -Path 'HKLM:\\SOFTWARE\\Microsoft\\Windows NT\\CurrentVersion\\SystemRestore' -Name 'SystemRestorePointCreationFrequency' -Value 0 -Type DWord -Force -ErrorAction SilentlyContinue
  Enable-ComputerRestore -Drive "$($env:SystemDrive)\\" -ErrorAction SilentlyContinue
  Checkpoint-Computer -Description "${cleanDesc}" -RestorePointType "APPLICATION_INSTALL" -ErrorAction Stop
  @{ success = $true; message = "Punto de restauración creado con éxito." } | ConvertTo-Json -Compress
} catch {
  @{ success = $false; requiresAdmin = $true; error = $_.Exception.Message } | ConvertTo-Json -Compress
}
`;

    const proc = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', directScript], {
      windowsHide: true
    });
    let out = '';
    proc.stdout.on('data', d => { out += d.toString('utf8'); });

    proc.on('close', () => {
      try {
        let directOut = out.trim();
        if (directOut.charCodeAt(0) === 0xFEFF) {
          directOut = directOut.slice(1);
        }
        if (directOut) {
          const parsed = JSON.parse(directOut.trim());
          if (parsed.success) return resolve(parsed);
        }
      } catch (_) {}
      // If direct attempt failed (needs elevation), request UAC elevation via launcher .ps1
      runElevatedRestoreCreate(cleanDesc, resolve);
    });

    proc.on('error', () => {
      runElevatedRestoreCreate(cleanDesc, resolve);
    });
  });
});

ipcMain.handle('restore:open-wizard', async () => {
  try {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const rstruiPath = path.join(sysRoot, 'System32', 'rstrui.exe');
    // Using PowerShell Start-Process invokes ShellExecuteEx which handles UAC without throwing EACCES
    const p = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process -FilePath '${rstruiPath.replace(/'/g, "''")}'`], {
      windowsHide: true
    });
    p.on('error', () => {});
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('restore:open-settings', async () => {
  try {
    const sysRoot = process.env.SystemRoot || 'C:\\Windows';
    const sysPropPath = path.join(sysRoot, 'System32', 'SystemPropertiesProtection.exe');
    const p = spawn('powershell.exe', ['-NoProfile', '-Command', `Start-Process -FilePath '${sysPropPath.replace(/'/g, "''")}'`], {
      windowsHide: true
    });
    p.on('error', () => {});
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

function runElevatedRestoreDelete(sequenceNumber, resolve) {
  const seq = parseInt(sequenceNumber, 10);
  if (isNaN(seq) || seq <= 0) {
    return resolve({ success: false, error: 'Número de secuencia de punto de restauración inválido.' });
  }

  const psElevated = `
$ErrorActionPreference = 'Stop'
try {
  $code = @'
using System;
using System.Runtime.InteropServices;
public class SrRemover {
    [DllImport("srclient.dll", SetLastError = true)]
    public static extern int SRRemoveRestorePoint(int sequenceNumber);
}
'@
  if (-not ([System.Management.Automation.PSTypeName]'SrRemover').Type) {
    Add-Type -TypeDefinition $code -Language CSharp
  }

  $ret = [SrRemover]::SRRemoveRestorePoint(${seq})
  if ($ret -eq 0) {
    $json = @{ success = $true; message = "Punto de restauración #${seq} eliminado con éxito." } | ConvertTo-Json -Compress
  } else {
    $stillExists = $false
    try {
      $pts = Get-ComputerRestorePoint
      $match = $pts | Where-Object { [int]$_.SequenceNumber -eq ${seq} }
      if ($match) { $stillExists = $true }
    } catch {}

    if (-not $stillExists) {
      $json = @{ success = $true; message = "Punto de restauración #${seq} eliminado con éxito." } | ConvertTo-Json -Compress
    } else {
      $json = @{ success = $false; error = "Windows devolvió el código de error $ret al eliminar el punto #${seq}." } | ConvertTo-Json -Compress
    }
  }
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
} catch {
  $json = @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
}
`;
  runElevatedPsScript(psElevated).then(resolve);
}

function runElevatedRestoreDeleteAll(resolve) {
  const psElevated = `
$ErrorActionPreference = 'SilentlyContinue'
try {
  $code = @'
using System;
using System.Runtime.InteropServices;
public class SrRemoverAll {
    [DllImport("srclient.dll", SetLastError = true)]
    public static extern int SRRemoveRestorePoint(int sequenceNumber);
}
'@
  if (-not ([System.Management.Automation.PSTypeName]'SrRemoverAll').Type) {
    Add-Type -TypeDefinition $code -Language CSharp
  }

  $raw = Get-ComputerRestorePoint
  foreach ($p in $raw) {
    $s = [int]$p.SequenceNumber
    if ($s -gt 0) {
      [SrRemoverAll]::SRRemoveRestorePoint($s) | Out-Null
    }
  }

  & vssadmin.exe delete shadows /all /quiet | Out-Null

  $json = @{ success = $true; message = "Se han eliminado todos los puntos de restauración con éxito." } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
} catch {
  $json = @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
}
`;
  runElevatedPsScript(psElevated).then(resolve);
}

ipcMain.handle('restore:enable', async () => {
  const script = `
$ErrorActionPreference = 'Stop'
try {
  $drive = $env:SystemDrive
  if ($drive) {
    Enable-ComputerRestore -Drive "$drive\\" -ErrorAction Stop
  }
  $json = @{ success = $true } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
} catch {
  $json = @{ success = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
  [System.IO.File]::WriteAllText('__OUT_JSON__', $json, [System.Text.Encoding]::UTF8)
}
`;
  return runElevatedPsScript(script);
});

ipcMain.handle('restore:delete', async (_event, sequenceNumber) => {
  return new Promise((resolve) => {
    runElevatedRestoreDelete(sequenceNumber, resolve);
  });
});

ipcMain.handle('restore:delete-all', async () => {
  return new Promise((resolve) => {
    runElevatedRestoreDeleteAll(resolve);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// APP SELF-UPDATER (GitHub Releases)
// ═══════════════════════════════════════════════════════════════════════════════
const GITHUB_OWNER = 'joselyky';
const GITHUB_REPO = 'Wingetix';
const APP_CURRENT_VERSION = app.getVersion() || '1.2.0';

/**
 * Compare two semver version strings.
 * Returns true if remote is strictly greater than local.
 */
function isNewerVersion(remote, local) {
  try {
    const semver = require('semver');
    const rClean = semver.clean(remote) || semver.valid(semver.coerce(remote));
    const lClean = semver.clean(local) || semver.valid(semver.coerce(local));
    if (rClean && lClean && semver.gt(rClean, lClean)) {
      return true;
    }
  } catch (_) { }

  // Robust segment-by-segment comparison (handles 1.0.3 vs 1.0.2, 1.0.2.1 vs 1.0.2, etc.)
  const rNums = (remote || '').replace(/^[^\d]*/, '').split(/[.-]/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  const lNums = (local || '').replace(/^[^\d]*/, '').split(/[.-]/).map(n => parseInt(n, 10)).filter(n => !isNaN(n));
  const maxLen = Math.max(rNums.length, lNums.length);
  for (let i = 0; i < maxLen; i++) {
    const r = rNums[i] || 0;
    const l = lNums[i] || 0;
    if (r > l) return true;
    if (r < l) return false;
  }
  return false;
}

/**
 * Fetch JSON from an HTTP/HTTPS endpoint following redirects.
 */
function fetchJson(url, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) return reject(new Error('Demasiadas redirecciones HTTP'));
    const parsed = new URL(url);
    const client = parsed.protocol === 'https:' ? https : http;
    const req = client.get(url, {
      headers: {
        'User-Agent': 'Wingetix-AutoUpdater',
        'Accept': 'application/vnd.github.v3+json'
      }
    }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const nextUrl = new URL(res.headers.location, url).href;
        return fetchJson(nextUrl, maxRedirects - 1).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`GitHub API HTTP ${res.statusCode}: ${res.statusMessage || ''}`));
      }
      let raw = '';
      res.setEncoding('utf8');
      res.on('data', chunk => { raw += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          reject(new Error('Respuesta inválida de GitHub API'));
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(12000, () => {
      req.destroy();
      reject(new Error('Tiempo de espera agotado al consultar el repositorio'));
    });
  });
}

/**
 * Find the most suitable installer executable in release assets.
 */
function selectReleaseAsset(assets = []) {
  if (!Array.isArray(assets) || assets.length === 0) return null;
  // 1. Prefer setup/installer executable
  const setup = assets.find(a => /\.exe$/i.test(a.name) && /setup|installer/i.test(a.name));
  if (setup) return setup;
  // 2. Any executable
  const anyExe = assets.find(a => /\.exe$/i.test(a.name));
  if (anyExe) return anyExe;
  // 3. First asset
  return assets[0] || null;
}

/**
 * Check for updates against GitHub Releases.
 */
async function checkAppUpdatesCore(opts = {}) {
  const currentVersion = APP_CURRENT_VERSION;
  try {
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/releases/latest`;
    const release = await fetchJson(url);

    if (!release || !release.tag_name) {
      return { updateAvailable: false, currentVersion, message: 'No se encontraron versiones en el repositorio.' };
    }

    const latestVersion = (release.tag_name || '').replace(/^v/i, '').trim();
    const isNewer = isNewerVersion(latestVersion, currentVersion);

    const asset = selectReleaseAsset(release.assets);

    const result = {
      updateAvailable: isNewer,
      currentVersion,
      latestVersion,
      releaseTag: release.tag_name,
      releaseName: release.name || release.tag_name,
      releaseNotes: release.body || 'Sin notas de la versión proporcionadas.',
      publishedAt: release.published_at,
      htmlUrl: release.html_url,
      assetName: asset ? asset.name : null,
      assetSize: asset ? asset.size : 0,
      downloadUrl: asset ? asset.browser_download_url : null
    };

    return result;
  } catch (err) {
    return {
      updateAvailable: false,
      currentVersion,
      error: err.message
    };
  }
}

/**
 * Download update asset stream with progress events.
 */
function downloadUpdateAsset(downloadUrl, assetName, onProgress) {
  return new Promise((resolve, reject) => {
    const updateDir = path.join(os.tmpdir(), 'WingetixUpdate');
    if (!fs.existsSync(updateDir)) {
      fs.mkdirSync(updateDir, { recursive: true });
    }

    const safeName = assetName ? path.basename(assetName) : `Wingetix-Update-${Date.now()}.exe`;
    const destPath = path.join(updateDir, safeName);

    const makeRequest = (currentUrl, redirectsLeft = 5) => {
      if (redirectsLeft <= 0) return reject(new Error('Demasiadas redirecciones durante la descarga'));

      const parsed = new URL(currentUrl);
      const client = parsed.protocol === 'https:' ? https : http;

      const req = client.get(currentUrl, {
        headers: {
          'User-Agent': 'Wingetix-AutoUpdater',
          'Accept': 'application/octet-stream'
        }
      }, res => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const nextUrl = new URL(res.headers.location, currentUrl).href;
          return makeRequest(nextUrl, redirectsLeft - 1);
        }

        if (res.statusCode !== 200) {
          return reject(new Error(`Fallo en la descarga HTTP ${res.statusCode}: ${res.statusMessage || ''}`));
        }

        const total = parseInt(res.headers['content-length'] || '0', 10);
        let transferred = 0;
        let lastTime = Date.now();
        let lastTransferred = 0;
        let speed = 0;

        const fileStream = fs.createWriteStream(destPath);

        res.on('data', chunk => {
          transferred += chunk.length;
          const now = Date.now();
          if (now - lastTime >= 350) {
            speed = (transferred - lastTransferred) / ((now - lastTime) / 1000);
            lastTime = now;
            lastTransferred = transferred;
            const percent = total > 0 ? Math.min(100, Math.round((transferred / total) * 100)) : null;
            if (onProgress) {
              onProgress({ transferred, total, percent, speed });
            }
          }
        });

        res.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close(() => {
            if (onProgress) {
              onProgress({ transferred, total, percent: 100, speed: 0 });
            }
            resolve(destPath);
          });
        });

        fileStream.on('error', err => {
          try { fs.unlinkSync(destPath); } catch (_) { }
          reject(err);
        });
      });

      req.on('error', reject);
      req.setTimeout(120000, () => {
        req.destroy();
        reject(new Error('Tiempo de espera agotado al descargar la actualización'));
      });
    };

    makeRequest(downloadUrl);
  });
}

// ─── IPC Handlers for Self-Update ─────────────────────────────────────────────
ipcMain.handle('app:get-version', () => APP_CURRENT_VERSION);

ipcMain.handle('app:check-for-updates', async (_event, opts = {}) => {
  const result = await checkAppUpdatesCore(opts);
  return result;
});

ipcMain.handle('app:download-update', async (_event, data = {}) => {
  const { downloadUrl, assetName } = data;
  if (!downloadUrl) {
    return { success: false, error: 'URL de descarga no proporcionada' };
  }

  try {
    const filePath = await downloadUpdateAsset(downloadUrl, assetName, (progress) => {
      try {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('app:update-download-progress', progress);
        }
      } catch (_) { }
    });
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('app:install-update', async (_event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, error: 'El archivo descargado no existe en disco.' };
  }

  try {
    // Launch installer detached so it continues after app exits
    const child = spawn(filePath, [], {
      detached: true,
      stdio: 'ignore'
    });
    child.unref();

    // Close current app smoothly after a short pause
    setTimeout(() => {
      try {
        app.isQuitting = true;
        app.quit();
      } catch (_) { }
    }, 600);

    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
ipcMain.handle('app:open-external', async (_event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://'))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, error: 'Invalid URL' };
});

ipcMain.handle('app:get-installer-language', async () => {
  try {
    // 1. Check command line parameters (--lang=es / --lang=en)
    if (Array.isArray(process.argv)) {
      for (const arg of process.argv) {
        if (typeof arg === 'string' && arg.startsWith('--lang=')) {
          const val = arg.split('=')[1].toLowerCase().trim();
          if (val === 'es' || val === 'spanish') return 'es';
          if (val === 'en' || val === 'english') return 'en';
        }
      }
    }

    // 2. Check installed_lang.txt written by Inno Setup installer
    const possiblePaths = [
      path.join(process.resourcesPath, 'installed_lang.txt'),
      path.join(app.getAppPath(), 'installed_lang.txt'),
      path.join(path.dirname(app.getPath('exe')), 'resources', 'installed_lang.txt'),
      path.join(path.dirname(app.getPath('exe')), 'installed_lang.txt')
    ];
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        const content = fs.readFileSync(p, 'utf8').trim().toLowerCase();
        if (content === 'es' || content === 'spanish') return 'es';
        if (content === 'en' || content === 'english') return 'en';
      }
    }
  } catch (_) {}
  return null;
});

// ─── Storage & Installer Cleaner Module ───────────────────────────────────────
const CLEANER_CATEGORIES_DEF = [
  {
    id: 'winget-cache',
    nameKey: 'cleaner_cat_winget_title',
    descKey: 'cleaner_cat_winget_desc',
    icon: 'package',
    riskLevel: 'safe',
    paths: () => [
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Packages'),
      path.join(process.env.LOCALAPPDATA || '', 'Packages', 'Microsoft.DesktopAppInstaller_8wekyb3d8bbwe', 'LocalCache')
    ]
  },
  {
    id: 'user-temp',
    nameKey: 'cleaner_cat_temp_title',
    descKey: 'cleaner_cat_temp_desc',
    icon: 'flame',
    riskLevel: 'safe',
    paths: () => [
      os.tmpdir()
    ]
  },
  {
    id: 'crash-dumps',
    nameKey: 'cleaner_cat_dumps_title',
    descKey: 'cleaner_cat_dumps_desc',
    icon: 'activity',
    riskLevel: 'safe',
    paths: () => [
      path.join(process.env.LOCALAPPDATA || '', 'CrashDumps'),
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'WER', 'ReportArchive'),
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'WER', 'ReportQueue'),
      path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'Windows', 'WER', 'Temp')
    ]
  },
  {
    id: 'system-temp',
    nameKey: 'cleaner_cat_system_title',
    descKey: 'cleaner_cat_system_desc',
    icon: 'layers',
    riskLevel: 'safe',
    paths: () => [
      path.join(process.env.SystemRoot || 'C:\\Windows', 'Temp')
    ]
  }
];

function formatCleanerBytes(bytes) {
  if (!bytes || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return (bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

function scanFolderRecursive(dirPath, maxDepth = 4) {
  let size = 0;
  let count = 0;
  const files = [];
  if (!dirPath || !fs.existsSync(dirPath)) return { size, count, files };

  function recurse(current, depth) {
    if (depth > maxDepth) return;
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const full = path.join(current, entry.name);
        try {
          if (entry.isDirectory()) {
            recurse(full, depth + 1);
          } else if (entry.isFile()) {
            const st = fs.statSync(full);
            size += st.size;
            count++;
            files.push({ path: full, size: st.size });
          }
        } catch (_) {}
      }
    } catch (_) {}
  }

  recurse(dirPath, 0);
  return { size, count, files };
}

function removeEmptyDirs(dirPath, isRoot = true) {
  try {
    if (!fs.existsSync(dirPath)) return;
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const ent of entries) {
      if (ent.isDirectory()) {
        removeEmptyDirs(path.join(dirPath, ent.name), false);
      }
    }
    if (!isRoot) {
      const remaining = fs.readdirSync(dirPath);
      if (remaining.length === 0) {
        try { fs.rmdirSync(dirPath); } catch (_) {}
      }
    }
  } catch (_) {}
}

let lastScanResults = null;

ipcMain.handle('cleaner:scan', async () => {
  try {
    const categories = [];
    let overallSize = 0;
    let overallCount = 0;

    for (const catDef of CLEANER_CATEGORIES_DEF) {
      const targetPaths = catDef.paths().filter(p => p && fs.existsSync(p));
      let catSize = 0;
      let catCount = 0;
      const catFiles = [];

      for (const p of targetPaths) {
        const res = scanFolderRecursive(p);
        catSize += res.size;
        catCount += res.count;
        catFiles.push(...res.files);
      }

      overallSize += catSize;
      overallCount += catCount;

      categories.push({
        id: catDef.id,
        nameKey: catDef.nameKey,
        descKey: catDef.descKey,
        icon: catDef.icon,
        riskLevel: catDef.riskLevel,
        primaryPath: targetPaths[0] || '',
        allPaths: targetPaths,
        size: catSize,
        sizeFormatted: formatCleanerBytes(catSize),
        count: catCount,
        files: catFiles
      });
    }

    lastScanResults = {
      categories,
      totalSize: overallSize,
      totalSizeFormatted: formatCleanerBytes(overallSize),
      totalCount: overallCount,
      scanTime: Date.now()
    };

    return {
      success: true,
      data: lastScanResults
    };
  } catch (err) {
    return {
      success: false,
      error: err.message
    };
  }
});

ipcMain.handle('cleaner:clean', async (event, categoryIds) => {
  try {
    if (!lastScanResults || !Array.isArray(categoryIds) || categoryIds.length === 0) {
      return { success: false, error: 'No categories selected or scan expired' };
    }

    const selectedCategories = lastScanResults.categories.filter(c => categoryIds.includes(c.id));
    const allFiles = [];
    for (const c of selectedCategories) {
      allFiles.push(...c.files);
    }

    const totalFiles = allFiles.length;
    let deletedCount = 0;
    let skippedCount = 0;
    let freedBytes = 0;
    const startTime = Date.now();

    for (let i = 0; i < totalFiles; i++) {
      const file = allFiles[i];
      try {
        fs.unlinkSync(file.path);
        freedBytes += file.size;
        deletedCount++;
      } catch (_) {
        skippedCount++;
      }

      if (i % 25 === 0 || i === totalFiles - 1) {
        const percent = Math.min(100, Math.round(((i + 1) / totalFiles) * 100));
        event.sender.send('cleaner:progress', {
          current: i + 1,
          total: totalFiles,
          percent,
          freedBytes,
          freedFormatted: formatCleanerBytes(freedBytes),
          deletedCount,
          skippedCount,
          currentFile: path.basename(file.path)
        });
      }
    }

    for (const c of selectedCategories) {
      for (const p of c.allPaths) {
        removeEmptyDirs(p, true);
      }
    }

    lastScanResults = null;

    return {
      success: true,
      freedBytes,
      freedFormatted: formatCleanerBytes(freedBytes),
      deletedCount,
      skippedCount,
      elapsedMs: Date.now() - startTime
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

ipcMain.handle('cleaner:open-folder', async (_e, folderPath) => {
  try {
    if (folderPath && fs.existsSync(folderPath)) {
      await shell.openPath(folderPath);
      return { success: true };
    }
    return { success: false, error: 'Folder does not exist' };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
