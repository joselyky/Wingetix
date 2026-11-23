# 📋 Wingetix v1.2.0 — Apuntes y Hoja de Ruta (Roadmap)

Documento de planificación y notas técnicas para la próxima versión de **Wingetix**, integrando la retroalimentación directa de la comunidad de Reddit y las mejoras técnicas aprobadas.

---

## 🚨 1. PRIORIDAD CRÍTICA: Autodetección y Asistente de Activación de WinGet en 1 Clic
> **Problema reportado:** Muchos usuarios (en Windows 10 LTSC, Windows 11 Enterprise, equipos recién formateados o sin Microsoft Store) **no tienen WinGet activado ni instalado de fábrica**. Al abrir Wingetix, la app no carga programas o da error, y el usuario piensa que la app no funciona. Además, la versión Portable nunca ejecuta el instalador.

### Solución a implementar en v1.2.0:
1. **Comprobación en el Arranque de la App (`main.js` -> `renderer.js`):**
   - Comprobación rápida al iniciar: `winget --version`.
   - Si no existe: pantalla de bienvenida moderna:
     > **"¡Casi listo! Necesitamos activar el motor de Microsoft WinGet"**
     > **[ ⚡ Activar e Instalar WinGet Automáticamente (1 Clic) ]**
2. **Proceso de Instalación Visual con Barra de Progreso:**
   - Descarga en segundo plano de dependencias oficiales (`VCLibs`, `UI.Xaml`) y `Microsoft.DesktopAppInstaller.msixbundle`.
   - Barra de progreso real: *"Descargando motor oficial... (60%)"*, *"Registrando servicio en Windows..."*.
3. **Refuerzo en el Instalador (`Wingetix-Setup.iss`):**
   - Quitar `Flags: runhidden` para que muestre el progreso de activación con un mensaje claro.

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
* **Decisión:** Mantener el enfoque 100% nativo y seguro sobre Microsoft WinGet (sin dependencias de terceros ni consumo de recursos en segundo plano), y añadir una sección clara en la FAQ de la web y de la app explicando esta ventaja.

### 4.3 Demostración de Solidez Técnica y Transparencia
* **Reporte:** `u/smoke-bubble` (*escepticismo ante proyectos nuevos o sospechas de IA sin pruebas*).
* **Acción:** 
  - Añadir demostraciones visuales (GIFs/clips cortos de 5 segundos) en `README.md` mostrando la app funcionando en vivo (desinstalación silenciosa, protección de Platform Shield y puntos de restauración).
  - Insignias visibles de análisis de seguridad (**VirusTotal 0/70 limpio**).

### 4.4 Visibilidad Inmediata: 100% Gratis, Sin Anuncios y Sin Telemetría
* **Reporte:** `u/gvcggff` (*pereza para leer GitHub o la web*).
* **Acción:** Poner en la primera línea de cada post, en la cabecera del README y en la ventana de Acerca de:
  > **100% Free Forever & Open Source (GPLv3) — Zero Ads, Zero Telemetry, No Premium Tier.**

### 4.5 Guía de Colaboración Comunitaria (`CONTRIBUTING.md`)
* **Acción:** Publicar `CONTRIBUTING.md` en GitHub con pautas para que la comunidad pueda enviar sugerencias de traducción o reportes de bugs de forma ordenada, siempre con aprobación y revisión manual del creador.

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
