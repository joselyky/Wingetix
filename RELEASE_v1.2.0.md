# Wingetix v1.2.0 🚀

> **100% Free Forever & Open Source (GPLv3) — Zero Ads, Zero Telemetry, No Premium Tier.**

¡Una de las actualizaciones más completas en la historia de **Wingetix**! La versión **v1.2.0** incorpora el nuevo estudio de **Packs de Software (`.wingetix`)**, detección **Multi-GPU (Dedicada vs Integrada)**, **Desinstalador Profundo v2** con previsualización de residuos y lista blanca configurable, **Modo Portable Puro (Zero Footprint USB)** y compatibilidad total mejorada con **Windows 10 y Windows 11**.

---

### 🌟 Novedades Principales en v1.2.0

#### 📦 1. Estudio de Packs de Software (`.wingetix` Bundle Installer)
- **Crea y Despliega Colecciones en 1 Clic**: Selecciona cualquiera de tus aplicaciones instaladas o añade paquetes por ID de WinGet para crear packs personalizados (`.wingetix`, `.json` o scripts `.bat`).
- **Conservación de Iconos Reales**: Los archivos `.wingetix` integran los iconos reales de tus aplicaciones para mostrarlas con total fidelidad visual en cualquier equipo.
- **Instalación Desatendida en Tiempo Real**: Instala todo un pack de software en un PC recién formateado con un solo clic, con detección automática de dependencias (como Steam) y actualización de estado en vivo.

#### 🎮 2. Detección Multi-GPU (Gráfica Dedicada vs Integrada)
- **Selector Dual-GPU Interactivo**: Detecta simultáneamente tarjetas gráficas dedicadas (**NVIDIA GeForce RTX/GTX**, **AMD Radeon RX**, **Intel Arc**) y gráficos integrados (**AMD Radeon Graphics**, **Intel Iris Xe / UHD**).
- **Priorización Inteligente**: Selecciona por defecto la GPU dedicada de mayor rendimiento y permite alternar en tiempo real entre adaptadores mostrando modelo, VRAM dedicada, resolución, frecuencia, temperatura y suites oficiales (*NVIDIA App, AMD Adrenalin, Intel Graphics Command Center*).

#### 🗑️ 3. Desinstalador Profundo v2 (Previsualización + Lista Blanca en Platform Shield)
- **Previsualización Desplegable de Residuos**: Antes de confirmar cualquier desinstalación, puedes desplegar la lista exacta de carpetas (`%AppData%`, `%LocalAppData%`, `ProgramData`) y claves del Registro (`HKLM` / `HKCU`) que se van a purgar, permitiendo desmarcar cualquier elemento que desees conservar.
- **Lista Blanca Configurable en Platform Shield**: Además del blindaje integrado para *Steam, Epic Games, Riot Vanguard, EA App, Ubisoft Connect, Battle.net y GOG Galaxy*, ahora puedes añadir tus propias carpetas o palabras clave protegidas.

#### ⚡ 4. Modo Portable Puro (Zero Footprint USB)
- **Cero Rastro en `%APPDATA%`**: Al ejecutarse en modo portable o desde una memoria USB, Wingetix guarda toda tu configuración en `.\data\settings.json`, tus paquetes fijados en `.\data\pinned_packages.json`, tus packs en `.\data\packs\` y el perfil en `.\data\profile\`, sin dejar carpetas residuales en el ordenador anfitrión.

#### 🚨 5. Motor Nativo de Resolución WinGet para Windows 10 y 11
- **Bypass del Bug de Alias UAC en Windows 10**: Resuelve directamente el binario físico `winget.exe` dentro de `C:\Program Files\WindowsApps\Microsoft.DesktopAppInstaller_*` e incluye un **Asistente Automático en 1 Clic** para activar WinGet en ediciones de Windows 10 LTSC / Enterprise.

#### 🎨 6. Rendimiento, UX e Internacionalización (EN / ES)
- **Auditoría Integral de Inglés Técnico**: Más de 460 cadenas revisadas con terminología nativa de Windows.
- **Buscador Instantáneo con *Debounce* (150ms)**: Filtrado fluido sin bloqueos al escribir en listas grandes.
- **Progreso en Barra de Tareas de Windows (`win.setProgressBar`) y Notificaciones Nativas del Sistema**.
- **Ventana «Acerca de Wingetix y FAQ»**: Con verificación **VirusTotal 0/70 Clean** y comparativa técnica sobre el uso exclusivo del motor oficial Microsoft WinGet.

---

### 📦 Archivos Disponibles y Verificación Criptográfica (SHA-256)

| Archivo | Tipo | SHA-256 Checksum |
| :--- | :--- | :--- |
| `Wingetix.Setup.1.2.0.exe` / `Wingetix Setup 1.2.0.exe` | Instalador Oficial (Recomendado) | `12262F4173B9B642072F8DCE43B9C587C623FD0CD3CBB1A42C36533336C001A4` |
| `Wingetix.1.2.0.exe` / `Wingetix 1.2.0.exe` | Portable Zero-Footprint USB | `323C7095DE774D2AD1FD5E5B4A3F1B733458FC5ADB8F4D222C1E960887A40039` |

### 📋 Descripción de Archivos

- **`Wingetix Setup 1.2.0.exe`** *(Recomendado)*: Instalador oficial para Windows 10 y 11 con creación de accesos directos, activación automática de WinGet y soporte para Auto-Updater.
- **`Wingetix 1.2.0.exe`**: Ejecutable portable autónomo con **Modo Zero-Footprint USB** (`.\data\settings.json`).

---

**Desarrollado con ❤️ por Jose Antonio Baeza Pineda ([@joselyky](https://github.com/joselyky))**
