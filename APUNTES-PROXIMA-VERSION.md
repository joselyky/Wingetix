# 📋 Wingetix v1.2.0 — Apuntes y Hoja de Ruta (Roadmap)

Documento de planificación y notas técnicas para la próxima versión de **Wingetix**, integrando la retroalimentación directa de la comunidad de Reddit y las mejoras técnicas aprobadas.

---

## 🎨 1. NUEVA EXPERIENCIA: Instalador Visual Glassmorphism (Estilo Web / Discord / Spotify)
* **Estado:** ✅ **COMPLETADO AL 100%**
> **Objetivo:** Sustituir las típicas ventanas grises de instalación estilo "Windows 98/XP" por un instalador moderno, sin marcos clásicos (`frameless`), con esquinas redondeadas y con el diseño exacto de la página web (`wingetix.com`).

### Flujo de Pantallas de la Instalación:
1. **🌌 Pantalla 1: Bienvenida Cósmica (Hero Splash):**
   - **Fondo:** El degradado cósmico profundo de la web con el manto de estrellas (`.stars-layer`).
   - **Centro:** El logo atómico grande de Wingetix flotando en el medio con su resplandor aura en verde esmeralda y cian brillante.
   - **Texto:** *"Wingetix — The Ultimate Visual Control Panel for Windows"*.
   - **Botón:** Botón personalizado brillante con efecto cristal: **`[ Comenzar Instalación → ]`**.
2. **⚙️ Pantalla 2: Opciones con Tarjetas Glassmorphism:**
   - Transición suave donde el logo sube a la cabecera y aparece una tarjeta oscura traslúcida.
   - Selector de idioma (`🇪🇸 Español` / `🇬🇧 English`).
   - Interruptores modernos para: *Crear acceso directo en el escritorio* y *Verificar/activar motor oficial WinGet*.
   - Botón `[ Atrás ]` y botón brillante `[ Instalar Ahora ]`.
3. **⚡ Pantalla 3: Instalación con Barra de Progreso Neón:**
   - Barra de progreso fina con gradiente cian (`#6ee7b7` a `#38bdf8`) con resplandor animado.
   - Mensajes dinámicos en tiempo real:
     * *"Desempaquetando archivos del sistema... (35%)"*
     * *"Verificando y registrando motor WinGet... (70%)"*
     * *"Creando accesos directos... (100%)"*
4. **🎉 Pantalla 4: Finalización:**
   - Checkmark verde brillante: *"¡Instalación completada con éxito!"*.
   - Botón destacado gigante: **`[ 🚀 Abrir Wingetix ]`**.

---

## 🚨 2. PRIORIDAD CRÍTICA: Compatibilidad Total con Windows 10 y Resolución de WinGet
* **Estado:** ✅ **COMPLETADO AL 100%**
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
   - Localizar la ruta física del ejecutable real en:
     `C:\Program Files\WindowsApps\Microsoft.DesktopAppInstaller_*_x64__8wekyb3d8bbwe\winget.exe`.
   - Inyectar esta carpeta directamente en la variable `PATH` del entorno en `buildEnv()`.
2. **Uso consistente de `shell: true` o envoltura en `cmd.exe /c`:**
   - Unificar todas las llamadas de `spawn('winget')` para que ninguna use `shell: false`.
3. **Asistente de Autodetección y Activación de WinGet:**
   - Si Windows 10 no tiene WinGet instalado, ofrecer la activación en 1 clic descargando `Microsoft.DesktopAppInstaller` y sus dependencias (`VCLibs` y `UI.Xaml`).

---

## 🌟 3. Feature Estrella: Creador de Packs y Perfiles de Software (Bundle Installer)
* **Estado:** ✅ **COMPLETADO AL 100%**
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

## 🎮 4. Detección Multi-GPU (Gráfica Integrada vs Gráfica Dedicada)
* **Estado:** ✅ **COMPLETADO AL 100%**
> **Problema reportado:** En ordenadores con procesador con gráficos integrados (Intel UHD/Iris Xe o AMD Radeon Graphics) y tarjeta gráfica dedicada (NVIDIA RTX/GTX, AMD RX o Intel Arc), la app a veces muestra la integrada o no permite ver ambas.

### Solución implementada en v1.2.0:
1. **Selector Dual-GPU en la UI (Píldoras interactivas con estética Glassmorphism):**
   - Selector dinámico `#gpu-selector-container` con píldoras individuales para cada GPU detectada.
   - Distintivos visuales y colores de fabricante automáticos:
     - `🎮 GPU 1: NVIDIA GeForce RTX (Dedicada)` en verde neón (`#76b900`).
     - `⚡ GPU 2: AMD Radeon Graphics / Intel UHD (Integrada)` en cian (`#38bdf8`) o rojo (`#f87171`).
2. **Priorización inteligente de la GPU Dedicada por defecto:** La app detecta y muestra inicialmente la tarjeta dedicada con mayor potencia/VRAM, permitiendo alternar al instante con un clic.
3. **Métricas y suites dinámicas por adaptador:** Al seleccionar la GPU integrada o dedicada se refrescan en tiempo real el modelo, la memoria VRAM (GB/MB), resolución, frecuencia, telemetría y suites oficiales correspondientes (NVIDIA App / AMD Adrenalin / Intel Arc Control).

---

## 🌐 5. Mejoras Aprobadas de la Comunidad de Reddit

### 5.1 Auditoría y Pulido Integral del Inglés (`i18n.js`)
* **Estado:** ✅ **COMPLETADO AL 100%**
* **Reporte:** `u/mondychan` (*"english translation in the app is funky dory, needs a polish"*).
* **Acción realizada:** Auditoría integral de las 460 cadenas en inglés. Se pulieron 44 términos clave reemplazando traducciones literales por terminología técnica estándar de Windows y desarrollo de software (*clean uninstallation*, *residual registry purge*, *version pinning*, *restore point creation*, *dedicated video memory*, *reclaimable disk space*, etc.), además de unificar las opciones ocultas de ordenación en `index.html`.

### 5.2 Posicionamiento Oficial: ¿Por qué WinGet y no Chocolatey/Scoop?
* **Estado:** ✅ **COMPLETADO AL 100%**
* **Reporte:** `u/TomHale` preguntó por soporte para `choco` y `scoop`.
* **Decisión y Acción realizada:** Se mantuvo el enfoque 100% nativo y seguro sobre Microsoft WinGet y se integró una sección dedicada de FAQ tanto en la aplicación de escritorio (ventana modal *Acerca de Wingetix y FAQ* accesible desde el menú principal), como en la web oficial (`wingetix.com`) y en el `README.md` de GitHub explicando los 3 pilares: integración nativa sin wrappers, descargas directas del CDN oficial del autor con verificación SHA-256 y cero redundancia de cachés/PATH.

### 5.3 Demostración de Solidez Técnica y Transparencia
* **Estado:** ✅ **COMPLETADO AL 100%**
* **Reporte:** `u/smoke-bubble` (*escepticismo ante proyectos nuevos*).
* **Acción realizada:** Se añadieron las insignias de verificación **VirusTotal 0/70 Clean**, validación criptográfica **SHA-256** y ejecución **100% Local & Zero Tracking** tanto en la cabecera y sección de seguridad de `README.md` como en la ventana modal *Acerca de Wingetix* dentro de la aplicación.

### 5.4 Visibilidad Inmediata: 100% Gratis, Sin Anuncios y Sin Telemetría
* **Estado:** ✅ **COMPLETADO AL 100%**
* **Reporte:** `u/gvcggff` (*pereza para leer GitHub o la web*).
* **Acción realizada:** Se integró de forma destacada en la primera línea de `README.md`, en la FAQ de la web y en el banner principal de la ventana *Acerca de Wingetix*:
  > **100% Free Forever & Open Source (GPLv3) — Zero Ads, Zero Telemetry, No Premium Tier.**

### 5.5 Guía de Colaboración Comunitaria (`CONTRIBUTING.md`)
* **Estado:** ✅ **COMPLETADO AL 100%** (Ya redactada, integrada y publicada en GitHub).

---

## ⚡ 6. Modo Portable Puro (Zero Footprint USB)
* **Estado:** ✅ **COMPLETADO AL 100%**
- **Solución implementada:**
  1. **Detección automática de ejecución Portable / USB (`detectPortableMode` en `main.js`):** Al ejecutarse fuera de `C:\Program Files` (en pendrive USB o carpeta portable autónoma) o con `.\data` / `portable.txt` / `--portable`, Wingetix activa automáticamente el **Modo Portable Puro**.
  2. **Persistencia en `.\data\settings.json` y `.\data\pinned_packages.json`:** Guarda el idioma, las preferencias del usuario y los paquetes fijados directamente en `.\data\settings.json` y los packs en `.\data\packs\`.
  3. **Cero rastro en el PC anfitrión (`Zero Footprint`):** Redirige `userData` y `sessionData` de Electron a `.\data\profile` y `.\data\session` antes de `app.whenReady()`, evitando crear carpetas residuales en `%APPDATA%\Wingetix`.
  4. **Distintivo interactivo en la UI:** Indicador `Portable (.\data)` en la tarjeta de Sistema y acceso directo en el menú principal para abrir la carpeta `.\data` en 1 clic.

---

## 🗑️ 7. Mejoras en el Desinstalador Profundo (Deep Uninstaller v2)
* **Estado:** ✅ **COMPLETADO AL 100%**
- **Solución implementada:**
  1. **Previsualización desplegable de carpetas y claves del registro (`apps:preview-residuals`):** Antes de confirmar la desinstalación, el modal de seguridad incluye un cajón desplegable interactivo que lista con precisión las carpetas residuales (`%AppData%`, `%LocalAppData%`, `ProgramData`, ruta de instalación) y las claves del Registro (`HKLM` / `HKCU`) que se van a purgar, permitiendo desmarcar cualquier elemento que el usuario desee conservar.
  2. **Lista blanca configurable en el *Platform Shield* (`#modal-platform-shield`):** Nuevo gestor visual accesible desde la barra lateral del Desinstalador para añadir o elegir carpetas personalizadas y palabras clave protegidas (persistidas en `.\data\settings.json`), que se blindan junto con Steam, Epic Games, Riot, EA, Ubisoft, Battle.net y GOG.

---

## 🎨 8. Ajustes de Rendimiento y UX
* **Estado:** ✅ **COMPLETADO AL 100%**
- **Solución implementada:**
  1. **Buscador instantáneo con *debounce* (150ms):** Todos los buscadores de la aplicación (Actualizaciones, Desinstalador, Puntos de Restauración, Packs de Software y selector de aplicaciones instaladas) procesan el filtrado con un *debounce* de 150ms para eliminar bloqueos de renderizado al escribir rápido.
  2. **Barra de progreso en la barra de tareas de Windows (`win.setProgressBar`):** Sincronización automática en tiempo real entre la barra de estado/descargas de Wingetix y el icono de la barra de tareas de Windows 10/11 (modos normal `0..1`, indeterminado y error, limpiándose a `-1` al finalizar).
  3. **Notificaciones nativas del sistema operativo (`Notification` de Electron):** Integración con el Centro de Actividades de Windows (`AppUserModelId: com.joselyky.wingetix`) que muestra notificaciones nativas con el icono oficial al finalizar actualizaciones por lotes, instalaciones de packs, desinstalaciones profundas, limpiezas de espacio y creación de puntos de restauración (con clic para restaurar y enfocar la ventana).
