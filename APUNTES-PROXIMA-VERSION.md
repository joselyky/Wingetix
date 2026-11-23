# 📋 Wingetix v1.2.0 — Apuntes y Hoja de Ruta (Roadmap)

Documento de planificación y notas técnicas para la próxima versión de **Wingetix**, integrando la retroalimentación directa de la comunidad de Reddit y las mejoras técnicas aprobadas.

---

## 🚨 1. PRIORIDAD CRÍTICA: Compatibilidad Total con Windows 10 y Resolución de WinGet
> **Problema reportado en Reddit:** *"La app no funciona en Windows 10"*.

### Causa técnica identificada del fallo en Windows 10:
1. **El bug de los "App Execution Aliases" elevados en Windows 10:**
   - Wingetix se ejecuta con permisos de Administrador (`requireAdministrator`).
   - En **Windows 10**, el subsistema UAC bloquea o no resuelve los alias de ejecución de la tienda (`%LOCALAPPDATA%\Microsoft\WindowsApps\winget.exe`) cuando un proceso corre con privilegios elevados. (Windows 11 corrigió esto internamente, pero Windows 10 falla con *"Acceso denegado"* o *"El sistema no puede encontrar el archivo"*).
   - Por esta razón, comandos directos `spawn('winget', ..., { shell: false })` fallan en Windows 10 con error `ENOENT`.
2. **WinGet no viene de serie en muchas ediciones de Windows 10:**
   - Windows 10 LTSC, Enterprise, o usuarios que no actualizan la Microsoft Store no tienen `winget.exe` en su sistema.
   - Sin el motor, la app queda congelada o no muestra ningún paquete.

### Solución técnica a implementar en v1.2.0 para Windows 10:
1. **Resolución de la ruta binaria real en `buildEnv()` (`main.js`):**
   - No depender solo del alias simbólico de `WindowsApps`.
   - Localizar la ruta física del ejecutable real en:
     `C:\Program Files\WindowsApps\Microsoft.DesktopAppInstaller_*_x64__8wekyb3d8bbwe\winget.exe`.
   - Inyectar esta carpeta directamente en la variable `PATH` del entorno en `buildEnv()`.
2. **Uso consistente de `shell: true` o envoltura en `cmd.exe /c`:**
   - Unificar todas las llamadas de `spawn('winget')` para que ninguna use `shell: false`, permitiendo a `cmd.exe` resolver el comando sin restricciones en Windows 10.
3. **Asistente de Autodetección y Activación de WinGet:**
   - Si Windows 10 no tiene WinGet instalado, mostrar la pantalla de activación en 1 clic que descarga e instala `Microsoft.DesktopAppInstaller` y sus dependencias (`VCLibs` y `UI.Xaml`).

---

## 🌟 2. Feature Estrella: Creador de Packs y Perfiles de Software (Bundle Installer)
> **Inspiración:** Sugerencia de la comunidad (`u/joshuas_79` en Reddit) y utilidad estilo *Ninite / winget export*.

### Especificaciones funcionales:
1. **Exportar Configuración Actual:**
   - Botón *"Exportar mis Apps a un Pack (.json / .wingetix)"*.
2. **Importar y Desplegar:**
   - Botón *"Cargar Pack de Software"* y botón *"Instalar todo el Pack en 1 Clic"* (silencioso).
3. **Packs Predefinidos de Fábrica:**
   - *Pack Básico / Oficina*, *Pack Gaming*, *Pack Desarrollador*.
4. **Compatibilidad USB / Modo Portable:**
   - Funciona idénticamente en instalable y en **Portable USB**.

---

## 🎮 3. Detección Multi-GPU (Gráfica Integrada vs Gráfica Dedicada)
> **Problema reportado:** En ordenadores con procesador con gráficos integrados (Intel UHD/Iris Xe o AMD Radeon Graphics) y tarjeta gráfica dedicada (NVIDIA RTX/GTX, AMD RX o Intel Arc), la app a veces muestra la integrada o no permite ver ambas.

### Solución a implementar en v1.2:
1. **Selector Dual-GPU en la UI (Tabs / Píldoras):**
   - `[ 🎮 GPU 1: NVIDIA RTX / AMD RX (Dedicada) ]`
   - `[ ⚡ GPU 2: Intel UHD / AMD Graphics (Integrada) ]`
2. **Priorización inteligente de la GPU Dedicada por defecto.**

---

## 🌐 4. Mejoras Aprobadas de la Comunidad de Reddit

### 4.1 Auditoría y Pulido Integral del Inglés (`i18n.js`)
* **Reporte:** `u/mondychan` (*"english translation in the app is funky dory, needs a polish"*).
* **Acción:** Reescribir y pulir todas las cadenas en inglés en `i18n.js` y plantillas HTML con terminología técnica estándar (*clean uninstallation*, *residual registry purge*, *version pinning*, *restore point creation*).

### 4.2 Posicionamiento Oficial: ¿Por qué WinGet y no Chocolatey/Scoop?
* **Reporte:** `u/TomHale` preguntó por soporte para `choco` y `scoop`.
* **Decisión:** Mantener el enfoque 100% nativo y seguro sobre Microsoft WinGet, y añadir una sección clara en la FAQ de la web y de la app explicando esta ventaja.

### 4.3 Demostración de Solidez Técnica y Transparencia
* **Reporte:** `u/smoke-bubble` (*escepticismo ante proyectos nuevos*).
* **Acción:** Añadir demostraciones visuales (GIFs/clips) en `README.md` mostrando la app funcionando en vivo e insignia de **VirusTotal 0/70 limpio**.

### 4.4 Visibilidad Inmediata: 100% Gratis, Sin Anuncios y Sin Telemetría
* **Reporte:** `u/gvcggff` (*pereza para leer GitHub o la web*).
* **Acción:** Poner en la primera línea de cada post, en la cabecera del README y en la ventana de Acerca de:
  > **100% Free Forever & Open Source (GPLv3) — Zero Ads, Zero Telemetry, No Premium Tier.**

### 4.5 Guía de Colaboración Comunitaria (`CONTRIBUTING.md`)
* **Estado:** Ya redactada, integrada y publicada en GitHub.

---

## ⚡ 5. Modo Portable Puro (Zero Footprint USB)
- Configuración en `.\data\settings.json` en vez de `%APPDATA%\Wingetix` al ejecutarse desde pendrive USB.

---

## 🗑️ 6. Mejoras en el Desinstalador Profundo (Deep Uninstaller v2)
- Previsualización desplegable de las carpetas y claves del registro exactas que se van a purgar antes de borrarlas.
- Lista blanca configurable por el usuario en el *Platform Shield*.

---

## 🎨 7. Ajustes de Rendimiento y UX
- Buscador instantáneo con *debounce* (150ms).
- Barra de progreso de descargas en la barra de tareas de Windows (`win.setProgressBar`).
- Notificaciones nativas del sistema operativo.
