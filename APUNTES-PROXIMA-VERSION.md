# 📋 Wingetix — Apuntes y Hoja de Ruta (Próxima Versión v1.2.1 / v1.3.0)

Documento activo de planificación con las mejoras y correcciones **pendientes de implementar** en la próxima versión de **Wingetix**.

> 🗂️ **Historial de versiones anteriores completadas (`v1.0.0` -> `v1.2.0`):** Archivado y organizado por versión en [docs/VERSION-HISTORY.md](file:///c:/Scripts/Winget%20Manager%20Versions/docs/VERSION-HISTORY.md) y en la carpeta [`docs/version-history/`](file:///c:/Scripts/Winget%20Manager%20Versions/docs/version-history/).

---

## 🌐 1. PRIORIDAD ALTA: Localización 100% Dinámica en Tiempo de Ejecución (GitHub Issue #1 — "Language not complete")
* **Estado:** 📝 **ANALIZADO AL 100% — PENDIENTE DE IMPLEMENTACIÓN**
* **Referencia:** GitHub Issue [#1](https://github.com/joselyky/Wingetix/issues/1) reportado por `@iTzSnicholls` (*22/11/2026*):
  > *"Was keen to test your tool out and as selecting English it all looked promising but as i clicked Update selected i noticed all the Update messages at the bottom were in Spanish not as the selected English. But everything at the top was still in English, currently running latest version at time of raising this 1.1.1"*

---

### 🔍 1.1 Diagnóstico Técnico: ¿Por qué salían textos en español teniendo *English* seleccionado?
En `v1.2.0` se completó la auditoría de las **460 claves estáticas** de `i18n.js` (menús, cabeceras, tarjetas y botones con `data-i18n`), por lo que toda la parte superior de la interfaz se muestra perfectamente en inglés. Sin embargo, el **flujo dinámico en tiempo real** (cajón inferior de la cola de descargas, barra de estado inferior, eventos IPC emitidos desde `main.js`, diálogos nativos y algunos modales dinámicos) todavía interpola cadenas directamente en español o envía textos desde `main.js` sin leer el idioma activo del usuario.

---

### 🗺️ 1.2 Mapa Completo de Archivos y Módulos Afectados en Toda la Aplicación

#### A) Cajón Inferior de Cola de Descargas y Barra de Estado (`renderer.js` — Fallo exacto de la captura del Issue #1)
1. **Inicialización de la Cola (`initQueueUI`, líneas 600–689):**
   - `statusQueueLabel`: `"Cola: 0/${items.length}"` -> usar `i18n.t('queue_status_counter', { done, total })` (`Queue: 0/X`).
   - `queueSummaryText`: `"0 de ${items.length} completados"` -> `0 of X completed`.
   - Versión destino por defecto: `item.available || 'nueva'` -> `'latest' / 'new'`.
   - Badge inicial de cada tarjeta (línea 640): `"En cola"` -> `Queued`.
   - Toasts de acciones rápidas en tarjetas (líneas 674–685): `"Solicitando autorización de Administrador para..."`, `"Cerrando procesos de..."`, `"Reintentando actualización de..."`.
2. **Actualización en Vivo de Tarjetas y Barra Inferior (`updateQueueUI`, líneas 691–860):**
   - Tamaño total calculándose (línea 715): `'Calculando...'` -> `Calculating...`.
   - Estado `starting` (líneas 721–723): `'Conectando...'`, `'Iniciando descarga...'`.
   - Estado `downloading` (líneas 730–740): Badge `'Descargando'` y `setStatusBar('Descargando: ${pName}', '${downloadedMB} MB de ${totalMbText}...')` *(al llevar variables interpoladas, no coincidía con el diccionario estático `statusDict` de `getTranslatedStatusText` y se quedaba en español en la barra inferior)*.
   - Estado `installing` (líneas 746–758): `'Instalando...'`, `'Descarga completada (...) • Ejecutando instalador'`, `'Paso 2/2: Instalando'`, `setStatusBar('Instalando: ...', 'Ejecutando instalador oficial de Windows')`.
   - Estado `completed` (líneas 774–783): `'Completado ✔'`, `'(Descargado)'`, `'Listo'`, `'Completado con éxito'`.
   - Estados de error / cancelación y botones de recuperación (líneas 789–858):
     - Badges: `'Cancelado ⏹'`, `'Requiere Admin 🛡'`, `'App en uso ⚠'`, `'Detenido'`.
     - Botones dinámicos (respetando la **regla estricta de cero emojis en botones**): `'Reintentar'`, `'Instalar como Administrador'`, `'Cerrar app y Reintentar'`, `'Probar como Administrador'`.
3. **Funciones Auxiliares de Progreso y Confirmación Masiva (`renderer.js`, líneas 509–565, 1318–1486, 2380–2543):**
   - `showCancelButton`: `'Cancelar Desinstalación'` / `'Cancelar Actualización'`.
   - `setupProgressTracking` / `updateProgress` / `hideProgress`: `'0 de ${total} paquetes'`, `'Procesando actualizaciones...'`, `'Todas las tareas han finalizado'`.
   - `handleUpgradeAll` (línea 1455): Modal de advertencia al pulsar *Update All* (`"Vas a actualizar todas las aplicaciones y juegos detectados..."`) hardcoded en español.
   - `getTranslatedStatusText` (líneas 2310–2440): Pasar directamente claves `i18n.t(...)` en origen en lugar de depender solo de traducciones por regex a posteriori.

---

#### B) Proceso Principal Backend (`main.js` — Mensajes IPC, Consola, Errores y Diálogos Nativos de Windows)
Crear un helper ligero `tMain(key, params)` en `main.js` sincronizado con `loadAppSettings().language` (actualizado automáticamente cuando el renderer cambia el selector EN/ES):

1. **Motor de Actualizaciones WinGet (`winget:upgrade-packages` & `winget:upgrade-package-elevated`, líneas 2150–2760):**
   - Mensajes `data.message` enviados a las tarjetas de la cola inferior:
     - `'Iniciando descarga...'` (L2241)
     - `'Iniciando instalador oficial de Windows...'`, `'Extrayendo y verificando archivos...'`, `'Aplicando actualización en el sistema...'`, `'Registrando componentes y librerías...'`, `'Finalizando configuración de instalación...'` (L2303–2307)
     - `'Descargando: X MB / Y MB (Z%)'` (L2362, L2391)
     - `'Completado ✔ (Reinicio requerido)'` / `'Completado con éxito'` (L2488)
     - `'Esperando autorización de Administrador (UAC)...'` (L2510, L2699)
     - `'Completado con éxito (como Administrador)'` / `'Permisos de Administrador cancelados por el usuario'` (L2522–2523, L2708–2709)
     - `'Error al iniciar el proceso: ...'` (L2581)
   - Función `getFriendlyErrorMessage(code, output)` (líneas 2600–2635): Traducir todos los diagnósticos amigables de error de WinGet (`'Ya se encuentra en la versión más reciente'`, `'Requiere permisos de Administrador para instalarse'`, `'La aplicación está abierta en Windows. Ciérrala para continuar'`, `'Hay otra instalación de Windows en curso'`, `'Error de conexión al descargar el instalador'`, etc.).
   - Logs en vivo del cajón de consola (`winget:log`): `'▶ Iniciando actualización de X paquete(s)...'`, `'📦 Actualizando: ...'`, `'🛑 Actualización cancelada por el usuario.'`, `'✅ Todas las actualizaciones completadas.'`.
2. **Diálogos Nativos de Abrir/Guardar de Windows (`dialog.showSaveDialog` / `dialog.showOpenDialog`, líneas 1307–1369):**
   - `'Exportar lista de paquetes WinGet'`, `'Importar lista de paquetes WinGet'`, filtro `'Archivo JSON de WinGet'`, y mensaje de error de WinGet ausente (L1245).
3. **Fallback de Editor Desconocido (`attachIconsToPackages`, líneas 1183, 1189):**
   - Sustituir `'Desconocido'` literal en backend por valor neutro formateado en UI con `i18n.t('publisher_unknown')` (`Unknown` / `Desconocido`).
4. **Motor de Desinstalación Segura y Platform Shield (`apps:uninstall-clean`, líneas 3235–3850):**
   - Cabecera y fases de log (`[PHASE 2/3/4]`, `[SHIELD]`, `[RESTORE POINT]`) y avisos interactivos para juegos de Steam y Epic Games.
5. **Logs de Instalación de Suites GPU (`gpu:install-package`, líneas 4021–4092):**
   - Internacionalizar mensajes de inicio, éxito y error en el log de instalación de drivers/suites.
6. **Backend de Puntos de Restauración (`restore:list`, `restore:create`, `restore:delete`, líneas 4125–4500):**
   - Internacionalizar tipos y mensajes de éxito/cancelación UAC devueltos por PowerShell.
7. **Backend del Auto-Updater (`checkAppUpdatesCore` / `downloadUpdateAsset`, líneas 4565–4750):**
   - Internacionalizar errores HTTP, timeouts y texto de notas vacías.

---

#### C) Resto de Vistas en `renderer.js` con Cadenas Hardcoded Residuales (Bidireccional EN <-> ES)
1. **Vista Updates — Pinning / Pausar actualizaciones (líneas 1958–2118):**
   - Badges y tooltips en filas fijadas (`'Pausada'`, `title` de botones fijar/desanclar) y toasts de error.
2. **Vista Uninstaller (líneas 3529–3850):**
   - Mensaje de tabla vacía por categoría (L3530–3531), badge `'Fijada'` (L3562), editor `'Desconocido'` (L3567) y textos de progreso individual/lotes.
3. **Vista Graphics & Control (líneas 3887–4005):**
   - `'Adaptador de pantalla genérico'` cuando no hay GPU detectada (L4003) y textos de comprobación online.
4. **Vista Restore Points (líneas 4768–5200):**
   - Nombre sugerido al crear punto manual (`Wingetix - Manual Restore Point` en EN / `Wingetix - Punto manual` en ES) y toasts de progreso/error.
5. **Modal de Auto-Actualización de Wingetix (`initAppUpdater`, líneas 5265–5465):**
   - Textos dinámicos de fecha de publicación, botones (`Remind me later`, `Cancel download`, `Close window`), diálogo de confirmación al cerrar descarga activa y toasts manuales.
6. **Vista Software Packs — Bidireccionalidad al Español (líneas 6222, 6352–6362, 6501, 6509, 6800–6954):**
   - Traducir al español cuando `currentLang === 'es'` las cadenas dinámicas nuevas escritas en inglés (`Scanning installed applications...`, `X of Y apps selected`, `X Installed on PC`, `Preparing installation of X app(s)...`).

---

#### D) Hidratación Inicial de `index.html` sin Parpadeo (Zero-Flash English Default)
- Pasar a inglés el texto base inicial de los ~30 elementos del panel GPU en `index.html` (líneas 860–1155) y el atributo `title` de `#btn-cancel-operation` (L1552) para evitar cualquier micro-parpadeo en español antes de ejecutarse `i18n.js`.

---

### 🛠️ 1.3 Plan de Ejecución Paso a Paso
1. **`i18n.js`:** Añadir las ~95 claves dinámicas estructuradas (`queue_*`, `status_*`, `err_winget_*`, `restore_progress_*`, `updater_*`, `bundles_live_*`) en `en` y `es` (cero emojis en botones).
2. **`main.js`:** Implementar `MAIN_I18N` + `tMain(key, vars)` sincronizado con el idioma activo para internacionalizar cola WinGet, errores amigables, desinstalador, GPU, restauración, auto-updater y diálogos nativos.
3. **`renderer.js`:** Conectar todas las vistas y re-renderizar en vivo tarjetas/badges activos al cambiar el idioma desde la barra superior.
4. **`index.html`:** Dejar todos los textos fallback iniciales 100% en inglés.
5. **Verificación y GitHub Issue #1:** Validar todos los flujos en `EN` y `ES`, publicar release y responder/cerrar el Issue #1 de `@iTzSnicholls`.
