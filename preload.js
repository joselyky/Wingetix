/**
 * preload.js — Context Bridge
 * Exposes only the necessary APIs to the renderer process securely.
 */
const { contextBridge, ipcRenderer } = require('electron');

const api = {
  // Window controls, Taskbar Progress & Native OS Notifications
  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow:    () => ipcRenderer.send('window:close'),
  setTaskbarProgress: (value, mode = 'normal') => ipcRenderer.send('window:set-progress', { value, mode }),
  sendNativeNotification: (title, body, silent = false) => ipcRenderer.send('app:notify', { title, body, silent }),

  // WinGet operations
  listUpgrades:             ()    => ipcRenderer.invoke('winget:list-upgrades'),
  upgradePackages:          (ids) => ipcRenderer.send('winget:upgrade-packages', ids),
  upgradeAll:               ()    => ipcRenderer.send('winget:upgrade-all'),
  cancelUpgrade:            ()    => ipcRenderer.send('winget:cancel-upgrade'),
  enableWinGetInTerminal:   ()    => ipcRenderer.invoke('winget:enable-in-terminal'),
  checkWinGetStatus:        ()    => ipcRenderer.invoke('winget:check-status'),
  exportPackages:           ()    => ipcRenderer.invoke('winget:export-packages'),
  importPackages:           ()    => ipcRenderer.invoke('winget:import-packages'),

  // Software Packs / Bundle Studio
  bundlesSavePack:          (packData) => ipcRenderer.invoke('bundles:save-pack', packData),
  bundlesLoadPack:          ()         => ipcRenderer.invoke('bundles:load-pack'),
  bundlesInstallPack:       (packages) => ipcRenderer.send('bundles:install-pack', packages),
  bundlesCancelInstall:     ()         => ipcRenderer.send('bundles:cancel-install'),
  onBundleInstallProgress:  (cb)       => ipcRenderer.on('bundles:install-progress', (_e, data) => cb(data)),
  onBundleInstallDone:      (cb)       => ipcRenderer.on('bundles:install-done', (_e, data) => cb(data)),

  // WinGet Pinning / Pausing operations
  listPinned:               ()    => ipcRenderer.invoke('winget:pin-list'),
  pinPackage:               (pkg) => ipcRenderer.invoke('winget:pin-add', pkg),
  unpinPackage:             (id)  => ipcRenderer.invoke('winget:pin-remove', id),

  // WinGet live output listeners
  onLog:         (cb) => ipcRenderer.on('winget:log',          (_e, data) => cb(data)),
  onDone:        (cb) => ipcRenderer.on('winget:done',         (_e, data) => cb(data)),
  onQueueInit:   (cb) => ipcRenderer.on('winget:queue-init',   (_e, data) => cb(data)),
  onQueueUpdate: (cb) => ipcRenderer.on('winget:queue-update', (_e, data) => cb(data)),
  onQueueCancel: (cb) => ipcRenderer.on('winget:queue-cancel', (_e, data) => cb(data)),

  // Remove listeners (cleanup)
  removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

  // System info & Zero-Footprint Portable Settings (.\data\settings.json)
  getSystemInfo: () => ipcRenderer.invoke('system:info'),
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (partial) => ipcRenderer.invoke('settings:save', partial),
  openDataFolder: () => ipcRenderer.invoke('settings:open-data-folder'),

  // Clean Uninstaller & Deep Uninstaller v2 (Residual Preview + Platform Shield Whitelist)
  listInstalledApps: () => ipcRenderer.invoke('apps:list-installed'),
  previewUninstallResiduals: (apps) => ipcRenderer.invoke('apps:preview-residuals', apps),
  getPlatformShieldWhitelist: () => ipcRenderer.invoke('shield:get-whitelist'),
  savePlatformShieldWhitelist: (list) => ipcRenderer.invoke('shield:save-whitelist', list),
  pickShieldFolder: () => ipcRenderer.invoke('shield:pick-folder'),
  uninstallAppClean: (app) => ipcRenderer.send('apps:uninstall-clean', app),
  cancelUninstall: () => ipcRenderer.send('apps:cancel-uninstall'),
  forceProceedCleanup: () => ipcRenderer.send('apps:force-proceed-cleanup'),
  onUninstallLog: (cb) => ipcRenderer.on('apps:uninstall-log', (_e, data) => cb(data)),
  onUninstallDone: (cb) => ipcRenderer.on('apps:uninstall-done', (_e, data) => cb(data)),

  // GPU & Control Panel APIs
  getGpuInfo: () => ipcRenderer.invoke('gpu:detect-info'),
  installGpuPackage: (data) => ipcRenderer.send('gpu:install-package', data),
  launchGpuApp: (appIdOrPath) => ipcRenderer.invoke('gpu:launch-app', appIdOrPath),
  onGpuLog: (cb) => ipcRenderer.on('gpu:install-log', (_e, data) => cb(data)),
  onGpuDone: (cb) => ipcRenderer.on('gpu:install-done', (_e, data) => cb(data)),

  // Error recovery APIs
  killProcess: (nameOrId) => ipcRenderer.invoke('apps:kill-process', nameOrId),
  upgradePackageElevated: (pkg) => ipcRenderer.send('winget:upgrade-package-elevated', pkg),

  // System Restore Points APIs
  listRestorePoints: (opts) => ipcRenderer.invoke('restore:list', opts),
  createRestorePoint: (desc) => ipcRenderer.invoke('restore:create', desc),
  deleteRestorePoint: (sequenceNumber) => ipcRenderer.invoke('restore:delete', sequenceNumber),
  deleteAllRestorePoints: () => ipcRenderer.invoke('restore:delete-all'),
  openSystemRestoreWizard: () => ipcRenderer.invoke('restore:open-wizard'),
  openSystemRestoreSettings: () => ipcRenderer.invoke('restore:open-settings'),
  enableSystemRestore: () => ipcRenderer.invoke('restore:enable'),

  // Storage Cleaner APIs
  scanCleaner: () => ipcRenderer.invoke('cleaner:scan'),
  cleanStorage: (categoryIds) => ipcRenderer.invoke('cleaner:clean', categoryIds),
  onCleanerProgress: (cb) => ipcRenderer.on('cleaner:progress', (_e, data) => cb(data)),
  openCleanerFolder: (folderPath) => ipcRenderer.invoke('cleaner:open-folder', folderPath),

  // App Self-Updater APIs
  checkForAppUpdates: (opts) => ipcRenderer.invoke('app:check-for-updates', opts),
  downloadAppUpdate: (data) => ipcRenderer.invoke('app:download-update', data),
  installAppUpdate: (filePath) => ipcRenderer.invoke('app:install-update', filePath),
  onAppUpdateAvailable: (cb) => ipcRenderer.on('app:update-available', (_e, data) => cb(data)),
  onAppUpdateDownloadProgress: (cb) => ipcRenderer.on('app:update-download-progress', (_e, data) => cb(data)),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  openExternalUrl: (url) => ipcRenderer.invoke('app:open-external', url),
  getInstallerLanguage: () => ipcRenderer.invoke('app:get-installer-language'),

  // Software Packs (Bundles)
  bundlesSavePack: (packData) => ipcRenderer.invoke('bundles:save-pack', packData),
  bundlesLoadPack: () => ipcRenderer.invoke('bundles:load-pack'),
  bundlesInstallPack: (packages) => ipcRenderer.send('bundles:install-pack', packages),
  bundlesCancelInstall: () => ipcRenderer.send('bundles:cancel-install'),
  onBundleInstallProgress: (cb) => ipcRenderer.on('bundles:install-progress', (_e, data) => cb(data)),
  onBundleInstallDone: (cb) => ipcRenderer.on('bundles:install-done', (_e, data) => cb(data)),

  // Visual Glassmorphism Installer APIs
  installerGetInfo: () => ipcRenderer.invoke('installer:get-info'),
  installerSelectPath: () => ipcRenderer.invoke('installer:select-path'),
  installerStartInstall: (options) => ipcRenderer.send('installer:run-install', options),
  onInstallerProgress: (cb) => ipcRenderer.on('installer:progress', (_e, data) => cb(data)),
  onInstallerDone: (cb) => ipcRenderer.on('installer:done', (_e, data) => cb(data)),
  installerLaunchApp: () => ipcRenderer.send('installer:launch-app'),
  installerClose: () => ipcRenderer.send('installer:close'),
  installerMinimize: () => ipcRenderer.send('installer:minimize'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
contextBridge.exposeInMainWorld('wingetAPI', api);
