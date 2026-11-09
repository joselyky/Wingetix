# Wingetix v1.1.1 🚀

¡Una actualización de gran impacto que expande **Wingetix** con nuevas herramientas de optimización, control total sobre versiones y limpieza profunda de almacenamiento!

---

### 🌟 Cambios y Novedades Principales

#### 🧹 1. Limpiador de Caché y Residuos de Instalación ("Storage Cleaner")
- **Recuperación Masiva de Espacio**: Escaneo y limpieza profunda de gigabytes de archivos temporales que Windows y WinGet acumulan tras actualizar o instalar software.
- **Categorías Seguras e Inteligentes**:
  - 📦 **Caché de Instaladores WinGet** (`%LOCALAPPDATA%\Microsoft\WinGet\Packages`): Eliminación de paquetes `.msi`, `.exe` y `.msix` que quedan abandonados tras la instalación.
  - ⚡ **Archivos Temporales y Setup Logs** (`%TEMP%`): Carpetas de extracción y archivos residuales de instaladores.
  - 💥 **Volcados de Memoria y Crash Dumps** (`CrashDumps` y `WER`): Archivos `.dmp` e informes diagnósticos generados por fallos de aplicaciones.
  - 🗄️ **Temporales del Sistema Windows** (`C:\Windows\Temp`): Residuos y logs del sistema.
- **🛡️ Escudo de Seguridad Activo**: Cada archivo en uso o bloqueado por una aplicación activa se protege y omite de forma transparente sin interrumpir el proceso de limpieza.
- **Telemetría en Vivo**: Barra de progreso animada, archivo en eliminación en tiempo real, recuento de archivos eliminados vs. protegidos y botón para abrir la ubicación en el Explorador.

#### 📌 2. Bloqueo y Pausa de Versiones ("Package Pinning")
- **Control Total de Versiones**: ¿Una actualización da fallos o prefieres mantener una versión concreta? Ahora puedes pausar o fijar la versión de cualquier aplicación con un solo clic.
- **Integración Nativa**: Utiliza el comando oficial `winget pin` de Microsoft para silenciar de forma permanente las notificaciones de actualización no deseadas.
- **Pestaña Dedicada "Fijadas / Pausadas"**: Visualiza rápidamente qué aplicaciones tienes excluidas y desbloquéalas cuando lo desees con el botón "Desfijar".

#### ⏹️ 3. Cancelación Dinámica de Actualizaciones y Descargas
- Botón interactivo de **Cancelar** que aparece únicamente mientras hay una operación por lotes en curso.
- Permite detener de forma segura la cola de descargas y actualizaciones en cualquier momento sin dejar el sistema en un estado inestable.

#### 🌐 4. Selector de Idioma con Banderas Nacionales (EN / ES)
- Selector de idioma en tiempo real (Inglés / Español) accesible desde el menú de la barra de título.
- Badges visuales con banderas nacionales (`🇺🇸` / `🇪🇸`) para una identificación instantánea.
- Detección automática del idioma elegido durante el instalador oficial.

#### 🖥️ 5. Ventana Optimizada y Mejoras de Interfaz
- Ancho inicial ampliado a `1280x800` para garantizar que todas las columnas de la tabla (incluyendo botones de fijado y tamaño) sean visibles sin recorte desde el arranque.
- Corrección de visualización de iconos de aplicaciones y tooltips mejorados.

---

### 📦 Archivos Disponibles en este Release

- **`Wingetix Setup 1.1.1.exe`** *(Recomendado)*: Instalador interactivo oficial para Windows 10/11 con accesos directos, activación automática de WinGet en la terminal y desinstalador completo.
- **`Wingetix 1.1.1.exe`**: Versión portable lista para ejecutar sin requerir instalación previa.

---

**Desarrollado con ❤️ por Jose Antonio Baeza Pineda ([@joselyky](https://github.com/joselyky))**
