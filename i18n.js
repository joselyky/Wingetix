/**
 * i18n.js — Internationalization & Multi-language Support for Wingetix
 * Supported languages: English ('en') [DEFAULT] and Spanish ('es')
 */

const translations = {
  en: {
    // Titlebar
    app_title: "Wingetix — Control & Cleaner Panel",
    app_subtitle: "Control & Cleaner Panel",
    menu_titlebar_tooltip: "Wingetix Menu / Language & Options",
    menu_language_section: "LANGUAGE / IDIOMA",
    menu_check_updates: "Check for Wingetix Updates",
    menu_github_repo: "GitHub Repository",
    menu_lang_en_sub: "Default",
    menu_lang_es_sub: "Spanish",
    check_app_update_title: "Check for new Wingetix version on GitHub",
    titlebar_version_tooltip: "Installed version: v1.1.0. Click to check for updates on GitHub",
    titlebar_min: "Minimize",
    titlebar_max: "Maximize",
    titlebar_close: "Close",

    // Sidebar Navigation
    nav_updates: "Updates",
    nav_uninstaller: "Uninstaller",
    nav_gpu: "Graphics & Control",
    nav_restore: "Restore Points",

    // Sidebar System Info Card
    sys_title: "System",
    sys_host: "Host",
    sys_os: "OS",
    sys_ram_free: "{amount} free",

    // Sidebar Controls: Updates
    stat_updates_available: "Available Updates",
    stat_updates_selected: "Selected to Update",
    btn_scan: "Scan",
    btn_update_selected: "Update Selected",
    btn_update_tab: "Update Tab",
    btn_update_everything: "Update All (Complete)",
    btn_export: "Export List",
    btn_import: "Import List",
    btn_clean_junk: "Clean Temp Files",

    // Sidebar Controls: Uninstaller
    stat_installed_total: "Installed",
    stat_installed_size: "Total Space",
    btn_scan_installed: "Scan System",
    btn_uninstall_selected_label: "Uninstall Selected ({count})",
    restore_point_toggle_title: "Restore Point",
    restore_point_toggle_desc: "OS snapshot (Uses disk)",
    restore_point_toggle_tooltip: "Enable to create a Windows System Restore Point before uninstalling",

    // Sidebar Controls: GPU
    stat_gpu_vendor: "Vendor",
    stat_gpu_vram: "VRAM",
    btn_detect_gpu: "Check GPU",

    // Sidebar Controls: Restore
    stat_restore_total: "Points Created",
    stat_restore_status: "OS Protection",
    btn_scan_restore: "Refresh List",
    btn_create_restore_sidebar: "Create Point Now",
    btn_open_rstrui: "Windows Recovery Wizard",

    // Main Updates View
    search_updates_placeholder: "Filter applications... (Ctrl+F)",
    sort_dropdown_title: "Sort application list",
    sort_group_title: "SORT BY",
    sort_name_asc: "Name (A - Z)",
    sort_name_desc: "Name (Z - A)",
    sort_creator_asc: "Creator (A - Z)",
    sort_creator_desc: "Creator (Z - A)",
    sort_size_desc: "Size (Largest first)",
    sort_size_asc: "Size (Smallest first)",
    sort_id_asc: "Package ID (A - Z)",
    btn_select_all: "Select all",
    btn_deselect_all: "Deselect",

    // Empty / Loading States: Updates
    state_idle_title: "Ready to scan",
    state_idle_desc: "Click <strong>Scan</strong> to check for available updates on your system.",
    state_loading_title: "Checking for updates...",
    state_loading_desc: "Querying WinGet repositories. This may take a few seconds.",
    state_empty_title: "Everything is up to date",
    state_empty_desc: "No pending updates were found for your applications.",

    // Tabs & Table Headers
    tab_everyday: "Everyday Apps",
    tab_games: "Games",
    tab_installed_system: "System Components",
    col_app: "Application",
    col_id: "Package ID",
    col_version: "Current Version",
    col_available: "Available",
    col_size: "Size",
    col_publisher: "Publisher",

    // Main Uninstaller View
    search_installed_placeholder: "Search installed applications... (Ctrl+F)",
    sort_installed_dropdown_title: "Sort installed applications",
    sort_installed_name_asc: "Name (A - Z)",
    sort_installed_name_desc: "Name (Z - A)",
    sort_installed_publisher_asc: "Publisher (A - Z)",
    sort_installed_publisher_desc: "Publisher (Z - A)",
    sort_installed_size_desc: "Size (Largest first)",
    sort_installed_size_asc: "Size (Smallest first)",
    btn_uninstall_top: "Uninstall ({count})",

    // Empty / Loading States: Uninstaller
    state_installed_idle_title: "Ready to scan",
    state_installed_idle_desc: "Click <strong>Scan System</strong> to load installed applications on your computer.",
    state_installed_loading_title: "Scanning system...",
    state_installed_loading_desc: "Querying registry and analyzing directory storage. This may take a few seconds.",
    state_installed_empty_title: "No applications found",

    // Uninstaller Warning Banner
    installed_system_warning_title: "⚠️ Critical System Components & Drivers",
    installed_system_warning_desc: "This section contains shared libraries (Visual C++, .NET, DirectX) and essential Windows drivers. Uninstalling them may cause applications, games, or Windows itself to crash or corrupt. Modify with extreme caution.",

    // GPU View
    gpu_view_title: "Graphics & Performance Center",
    gpu_detecting: "Detecting hardware...",
    btn_refresh_gpu: "Refresh Status",
    gpu_loading_title: "Analyzing graphics card and drivers...",
    gpu_loading_desc: "Inspecting hardware, driver versions, and real-time performance telemetry.",
    gpu_detail_vendor_tag: "Graphics Adapter",
    gpu_status_driver: "Driver Status",
    btn_launch_cpl: "Open Control Panel",
    btn_check_gpu_updates: "Check for Updates",
    gpu_driver_ver_title: "Driver Version:",
    gpu_driver_status_subtext: "Driver installed and active in Windows",
    gpu_metrics_title: "Hardware & Performance Metrics",
    gpu_metrics_sub: "Video subsystem monitoring",
    metric_vram_label: "VRAM Video Memory",
    metric_vram_unit: "Dedicated",
    metric_vram_status: "Available",
    metric_temp_label: "GPU Temperature",
    metric_temp_unit: "Core",
    metric_temp_footer: "Thermal limit: 88 °C",
    metric_power_label: "Power Consumption",
    metric_power_unit: "Real-time",
    metric_power_footer: "PCIe & auxiliary supply",
    metric_pcie_label: "PCIe Bus Link",
    metric_pcie_unit: "Interface",
    metric_pcie_footer: "Direct GPU bandwidth",
    metric_clock_label: "Core Clock Frequency",
    metric_clock_unit: "Graphics Engine",
    metric_clock_footer: "Dynamic clock speed",
    metric_fan_label: "Active Cooling Fan",
    metric_fan_unit: "Rotation",
    metric_fan_footer: "Fan speed",
    gpu_tools_title: "Quick Controls & Diagnostic Utilities",
    btn_launch_dxdiag: "DirectX Diagnostics (dxdiag)",
    btn_launch_devmgmt: "Device Manager",
    btn_launch_disp_settings: "Windows Display Settings",
    btn_refresh_gpu_aria: "Refresh GPU status",
    gpu_detecting_adapter: "Detecting video adapter...",
    gpu_querying_arch: "Querying architecture and drivers...",
    gpu_checking_date: "Checking date...",
    metric_active: "Active",
    metric_util_label: "GPU Load",
    metric_util_unit: "Usage",
    metric_util_footer: "Hardware acceleration active",
    metric_display_label: "Display & Refresh Rate",
    metric_display_footer: "Primary video output",
    metric_cpl_label: "Active Control Panel",
    btn_open: "Open",
    gpu_optional_suites_toggle: "Optional software tools & advanced suites",
    gpu_update_avail_badge: "New Graphics Driver Update Available!",
    comparator_current_ver: "Currently Installed Version",
    comparator_new_ver: "New Version Available",
    update_highlights_title: "Included improvements and optimizations:",
    update_highlight_1: "Optimized Game Ready support and profiles for the newest games.",
    update_highlight_2: "Ray Tracing performance improvements and system latency reduction.",
    update_highlight_3: "Security patches and stability certified by Microsoft (WHQL).",
    btn_update_driver_now: "Download & Install Official Update",
    btn_view_gpu_details: "View GPU details & telemetry",
    no_driver_tag: "Official Driver Not Detected",
    no_driver_detected_title: "Your graphics card is running on basic generic drivers",
    no_driver_detected_desc: "Windows is using a basic display adapter. To unlock 3D acceleration for gaming, maximum resolution, high refresh rates, and the official control panel, install the recommended suite below.",
    no_driver_suites_heading: "Recommended Official Suites for your GPU",
    no_driver_suites_desc: "Select an option to download and install certified drivers directly on your system.",
    suite_open_panel: "Open Panel",
    suite_reinstall: "Reinstall",
    suite_install: "Install",
    suite_installed_badge: "Installed",
    suite_not_installed_badge: "Not installed",

    // Restore Points View
    restore_view_title: "System Restore Points",
    restore_view_sub: "Protect your operating system against unexpected issues with Windows snapshots",
    search_restore_placeholder: "Search by name, type, or date... (Ctrl+F)",
    btn_open_rstrui_topbar: "System Restore",
    btn_open_rstrui_title: "Open official Windows System Restore wizard (rstrui.exe)",
    btn_create_restore_modal: "Create Restore Point",
    btn_sys_settings: "Configure System Protection",
    btn_delete_all_restore: "Delete All Points",
    btn_delete_all_restore_title: "Delete all restore points to free up disk space",
    restore_hero_title: "Windows System Protection",
    restore_badge_active: "Active",
    restore_badge_inactive: "Disabled",
    restore_hero_desc: "Allows you to roll back your PC to a previous state if an update or driver change causes issues. You can create manual snapshots or restore the system at any time.",
    btn_protection_settings_title: "Open System Protection settings in Windows",
    btn_configure_disk: "Configure Disk",
    state_restore_idle_title: "System Restore Points",
    state_restore_idle_desc: "Click <strong>Refresh List</strong> to load recovery snapshots saved in Windows.",
    state_restore_loading_title: "Querying system snapshots...",
    state_restore_loading_desc: "Fetching registered restore points in Windows.",
    restore_state_loading_title: "Scanning Restore Points...",
    restore_state_loading_desc: "Accessing Windows VSS (Volume Shadow Copy) snapshots.",
    state_restore_admin_title: "Administrator Privileges Required",
    state_restore_admin_desc: "Windows requires Administrator rights to list and manage recovery snapshots.",
    btn_request_admin: "Load with Administrator Rights (UAC)",
    state_restore_empty_title: "No restore points found",
    state_restore_empty_desc: "No recovery snapshots were found on this system. You can create one right now.",
    restore_state_empty_title: "No Restore Points Found",
    restore_state_empty_desc: "Create a restore point now to easily revert changes if any problem occurs.",
    col_restore_id: "# ID",
    col_restore_desc: "Point Description",
    col_restore_datetime: "Date and Time",
    col_restore_date: "Creation Date",
    col_restore_type: "Type",
    col_restore_num: "Sequence #",
    col_restore_action: "Actions",
    col_restore_actions: "Actions",
    restore_type_system: "System Point",
    restore_type_checkpoint: "System Checkpoint",
    restore_type_install: "Installation",
    restore_type_uninstall: "Uninstallation",
    restore_type_driver: "Driver Update",
    btn_restore_point_action: "Restore",
    btn_restore_point_tooltip: "Open Windows recovery wizard at this point",
    btn_delete_point_action: "Delete",
    btn_delete_point_tooltip: "Delete this restore point to free space",
    btn_create_restore_sidebar: "Create Point Now",
    stat_restore_total: "Points Created",
    stat_restore_status: "OS Protection",
    btn_scan_restore: "Refresh List",
    btn_open_rstrui: "Windows Recovery Wizard",
    restore_point_toggle_tooltip: "Enable to create a Windows System Restore Point before uninstalling",
    restore_point_toggle_title: "Restore Point",
    restore_point_toggle_desc: "OS snapshot (Uses disk)",
    modal_restore_desc_prompt: "Enter a description to identify this point later (e.g., Before driver updates):",
    modal_restore_desc_placeholder: "e.g. Wingetix - Manual snapshot",
    btn_create_point_confirm: "Create Point",

    // Modals & General Buttons
    confirm_modal_title: "Action Confirmation",
    btn_cancel: "Cancel",
    confirm_btn_update: "Confirm and Proceed",
    modal_security_title: "Security Warning",
    modal_confirm: "Confirm",
    modal_confirm_uninstall: "Confirm Uninstallation",
    modal_confirm_uninstall_sys: "Uninstall Component",
    modal_create_restore_title: "Create System Restore Point",
    modal_create_restore_desc: "Enter a description to identify this point in the future (e.g. Before updating drivers):",
    input_restore_placeholder: "e.g.: Wingetix - Manual installation",
    btn_create_point: "Create Point",

    // Queue Drawer & Status Bar
    queue_title: "Update & Download Queue",
    queue_label: "Queue",
    queue_word: "Queue",
    queue_summary_default: "0 in progress",
    queue_summary_progress: "{done} of {total} completed",
    status_ready: "Ready",
    status_prepared: "System ready",
    status_operation_completed: "Operation completed",
    status_all_done: "All tasks completed successfully",
    status_completed: "Completed ✔",
    status_downloading: "Downloading",
    status_installing: "Installing...",
    status_connecting: "Connecting...",
    status_starting: "Starting download...",
    status_retry: "Retry",
    status_admin: "Try as Administrator",
    status_kill_retry: "Close App & Retry",
    status_admin_needed: "Admin Required 🛡",
    status_in_use: "App in Use ⚠",
    status_error: "Error ✖",
    btn_force_clean: "Uninstaller finished → Deep clean",
    btn_force_clean_label: "Uninstaller finished → Deep clean",

    // Self-updater Modal
    app_update_title: "Wingetix Update",
    app_update_subtitle: "New official version detected on GitHub",
    app_update_cur_ver: "Current Version",
    app_update_cur_ver_label: "Current Version",
    app_update_new_ver: "New Version",
    app_update_new_ver_label: "New Version",
    app_update_banner_date: "Available on GitHub",
    app_update_github_available: "Available on GitHub",
    app_update_notes_title: "Changelog & Improvements:",
    app_update_notes_heading: "Release notes & changelog:",
    app_update_auto_close_note: "<strong>Note:</strong> To apply this update, Wingetix will close and run the official installer.",
    app_update_auto_notice: "Automatic update notice:",
    app_update_auto_notice_desc: "The official setup package will be downloaded from your GitHub repository. Before replacing files, you will be prompted for final confirmation.",
    app_update_ready_title: "Download completed successfully!",
    app_update_ready_text: "<strong>Important note:</strong> To apply the update, <strong>Wingetix will close safely</strong> and start the installer. Proceed now?",
    app_update_downloading: "Downloading official update...",
    app_update_download_success: "Download completed successfully!",
    app_update_important_warning: "Important Notice:",
    app_update_remind_later: "Remind Me Later",
    app_update_download_install: "Download & Install Now",
    app_update_close_and_install: "Close & Install Update",
    btn_update_cancel: "Remind me later",
    btn_update_download: "Download & Install Now",
    btn_update_install_now: "Close & Install Update",

    // Installed apps
    state_installed_empty_desc: "No applications found matching the current search criteria.",

    // Uninstaller confirmations & messages
    confirm_uninstall_btn: "Confirm Uninstallation",
    confirm_uninstall_single_sys_msg: "⚠️ CRITICAL SYSTEM COMPONENT WARNING\n\nYou are about to uninstall:\n\"{name}\"\n\nThis is a critical Windows system component or driver (Visual C++, .NET, DirectX, or hardware driver). Removing it may corrupt or break installed software, games, or the Windows operating system itself.\n\nAre you absolutely sure you want to proceed?",
    confirm_uninstall_sys_btn: "Uninstall Component",
    confirm_uninstall_single_epic_msg: "⚠️ EPIC GAMES STORE APP\n\nAre you sure you want to uninstall \"{name}\"?\n\nWingetix will trigger the Epic Games launcher to uninstall this title cleanly.",
    confirm_uninstall_single_steam_msg: "⚠️ STEAM APPLICATION\n\nAre you sure you want to uninstall \"{name}\"?\n\nWingetix will send the uninstall command to the Steam client.",
    toast_uninstall_success: "\"{name}\" was uninstalled successfully.",
    toast_uninstall_failed: "Uninstallation failed or was cancelled.",
    confirm_uninstall_more_count: "\n... and {count} more applications",
    confirm_uninstall_batch_single_msg: "⚠️ CLEAN UNINSTALLATION\n\nAre you sure you want to cleanly uninstall \"{name}\"?",
    confirm_uninstall_batch_multi_msg: "⚠️ BATCH CLEAN UNINSTALLATION\n\nYou have selected {count} applications for clean uninstallation:\n\n{list}{more}\n\nWingetix will run each official uninstaller sequentially and safely clean residual files. Do you want to proceed?",
    confirm_uninstall_batch_sys_btn: "Uninstall System Components",

    // Dynamic Notifications & Dialogs
    no_apps_available_tab: "No {tabName} available to update.",
    no_apps_found_tab: "No {tabName} found in this category.",
    toast_system_uptodate: "Your system is up to date.",
    toast_updates_found: "{count} update(s) found.",
    toast_scan_error: "Scan failed. Is WinGet installed?",
    toast_select_at_least_one: "Select at least one application.",
    toast_select_at_least_one_uninst: "Select at least one application to uninstall.",
    toast_updates_completed: "Updates completed successfully.",
    toast_updates_failed: "Some updates failed. Check console.",
    toast_app_uninstalled: "{name} uninstalled successfully.",
    toast_app_uninstall_failed: "Uninstallation failed or was canceled.",
    toast_batch_uninstalled: "{count} application(s) cleanly uninstalled.",
    toast_restore_created: "Restore point created successfully.",
    toast_restore_create_failed: "Could not create restore point: {err}",
    toast_restore_deleted: "Restore point removed.",
    toast_restore_delete_all: "All restore points removed.",
    toast_junk_cleaned: "Temporary junk files cleaned ({amount} freed).",
    toast_junk_none: "No junk files found. Cache is clean.",
    toast_export_success: "List exported to {path}",
    toast_import_success: "{count} applications imported to queue.",
    status_scanning_updates: "Checking for updates...",
    status_scanning_sub: "Querying WinGet repository...",
    status_scan_done: "Scan completed",
    status_updating_pkg: "Updating: {name}",
    status_progress_sub: "Progress: {done} of {total}",
    status_updating_multi: "Processing updates...",
    status_updating_done: "Updates completed",
    status_updating_done_sub: "All selected packages were updated.",
    status_uninstalling_pkg: "Uninstalling {name}...",
    status_cleaning_leftovers: "Cleaning leftovers for {name}...",
    status_cleaning_step: "Cleaning: {name}",
    confirm_update_all_msg: "You are about to update all detected applications and games ({count}).\n\n🛡️ ACTIVE PROTECTION:\nAll system runtimes and drivers are automatically excluded to protect Windows stability.\n\nDo you want to continue?",
    confirm_uninstall_single_msg: "⚠️ SECURITY WARNING\n\nAre you sure you want to cleanly uninstall \"{name}\"?\n\n• The official program uninstaller will run.\n• Specific leftover orphan files and registry keys will be safely cleaned.",
    confirm_uninstall_sys_single_msg: "🔴 CRITICAL WARNING: SYSTEM COMPONENT UNINSTALLATION\n\nYou are about to uninstall a system component or driver:\n\"{name}\"\n\n⚠️ RISK OF SYSTEM INSTABILITY OR CORRUPTION:\nThis element (like Visual C++, .NET, DirectX, or drivers) is required by multiple applications, games, and essential Windows services.\n\n• Uninstalling it may cause programs to crash, fail to start, or corrupt Windows.\n• It is strongly recommended NOT to remove it unless strictly necessary.\n\nAre you sure you want to proceed at your own risk?",
    confirm_uninstall_batch_msg: "⚠️ BATCH UNINSTALLATION WARNING (5s)\n\nAre you sure you want to cleanly uninstall the following {count} selected applications?\n\n{list}{more}\n\n• Program uninstallers will run sequentially.\n• 🛡️ ACTIVE SHIELD: All launchers and shared components are protected.\n• Only specific orphaned leftovers will be purged.",
    confirm_uninstall_batch_sys_msg: "🔴 CRITICAL WARNING: SYSTEM COMPONENTS SELECTED\n\nYou have selected one or more essential system components or Windows drivers to uninstall:\n\n{list}{more}\n\n⚠️ RISK OF INSTABILITY:\nUninstalling system libraries or drivers can break applications and cause severe issues or corruption in Windows.\n\nDo you confirm you want to proceed at your own risk?",
    confirm_delete_restore_single_msg: "Are you sure you want to delete restore point #{seq}?\n\n\"{desc}\" ({date})\n\nThis will remove the Windows system snapshot to free up disk space and cannot be undone.",
    confirm_delete_restore_single_btn: "Delete Restore Point",
    confirm_delete_restore_all_msg: "Are you sure you want to delete ALL restore points ({count} point(s))?\n\nAll Windows recovery snapshots will be purged, freeing up disk space. This action cannot be undone.",
    confirm_delete_restore_all_btn: "Delete All Points",
    toast_no_restore_points: "No restore points loaded to delete.",
    toast_opening_rstrui: "Opening official Windows System Restore wizard (rstrui)...",
    toast_opening_rstrui_item: "Opening official Windows System Restore wizard for point #{seq}...",
    toast_opening_protection_settings: "Opening System Protection Settings..."
  },

  es: {
    // Titlebar
    app_title: "Wingetix — Panel de Control y Limpieza",
    app_subtitle: "Panel de control y limpieza",
    menu_titlebar_tooltip: "Menú de Wingetix / Idioma y Opciones",
    menu_language_section: "IDIOMA / LANGUAGE",
    menu_check_updates: "Comprobar Actualizaciones de Wingetix",
    menu_github_repo: "Repositorio en GitHub",
    menu_lang_en_sub: "Inglés (Predeterminado)",
    menu_lang_es_sub: "Español",
    check_app_update_title: "Comprobar si hay una nueva versión de Wingetix en tu repositorio",
    titlebar_version_tooltip: "Versión instalada: v1.1.0. Clic para comprobar si hay actualizaciones en GitHub",
    titlebar_min: "Minimizar",
    titlebar_max: "Maximizar",
    titlebar_close: "Cerrar",

    // Sidebar Navigation
    nav_updates: "Actualizaciones",
    nav_uninstaller: "Desinstalador",
    nav_gpu: "Gráficos & Control",
    nav_restore: "Puntos de Restauración",

    // Sidebar System Info Card
    sys_title: "Sistema",
    sys_host: "Host",
    sys_os: "SO",
    sys_ram_free: "{amount} libre",

    // Sidebar Controls: Updates
    stat_updates_available: "Actualizaciones Disponibles",
    stat_updates_selected: "Seleccionadas para Actualizar",
    btn_scan: "Escanear",
    btn_update_selected: "Actualizar Seleccionados",
    btn_update_tab: "Actualizar Pestaña",
    btn_update_everything: "Actualizar Todo (Completo)",
    btn_export: "Exportar Lista",
    btn_import: "Importar Lista",
    btn_clean_junk: "Limpiar Temporales",

    // Sidebar Controls: Uninstaller
    stat_installed_total: "Instaladas",
    stat_installed_size: "Espacio Total",
    btn_scan_installed: "Escanear Equipo",
    btn_uninstall_selected_label: "Desinstalar Seleccionadas ({count})",
    restore_point_toggle_title: "Punto de Restauración",
    restore_point_toggle_desc: "Copia del SO (Ocupa disco)",
    restore_point_toggle_tooltip: "Activar para crear un Punto de Restauración del Sistema en Windows antes de desinstalar",

    // Sidebar Controls: GPU
    stat_gpu_vendor: "Fabricante",
    stat_gpu_vram: "VRAM",
    btn_detect_gpu: "Comprobar GPU",

    // Sidebar Controls: Restore
    stat_restore_total: "Puntos Creados",
    stat_restore_status: "Protección SO",
    btn_scan_restore: "Actualizar Lista",
    btn_create_restore_sidebar: "Crear Punto Ahora",
    btn_open_rstrui: "Asistente de Windows",

    // Main Updates View
    search_updates_placeholder: "Filtrar aplicaciones... (Ctrl+F)",
    sort_dropdown_title: "Ordenar lista de aplicaciones",
    sort_group_title: "ORDENAR POR",
    sort_name_asc: "Nombre (A - Z)",
    sort_name_desc: "Nombre (Z - A)",
    sort_creator_asc: "Creador (A - Z)",
    sort_creator_desc: "Creador (Z - A)",
    sort_size_desc: "Tamaño (Mayor primero)",
    sort_size_asc: "Tamaño (Menor primero)",
    sort_id_asc: "ID del Paquete (A - Z)",
    btn_select_all: "Seleccionar todo",
    btn_deselect_all: "Deseleccionar",

    // Empty / Loading States: Updates
    state_idle_title: "Listo para escanear",
    state_idle_desc: "Haz clic en <strong>Escanear</strong> para buscar actualizaciones disponibles en tu sistema.",
    state_loading_title: "Buscando actualizaciones...",
    state_loading_desc: "Consultando los repositorios de winget. Esto puede tardar unos segundos.",
    state_empty_title: "Todo está actualizado",
    state_empty_desc: "No se encontraron actualizaciones disponibles para tus aplicaciones.",

    // Tabs & Table Headers
    tab_everyday: "Aplicaciones Cotidianas",
    tab_games: "Juegos",
    tab_installed_system: "Componentes del Sistema",
    col_app: "Aplicación",
    col_id: "ID del Paquete",
    col_version: "Versión Actual",
    col_available: "Disponible",
    col_size: "Tamaño",
    col_publisher: "Editor",

    // Main Uninstaller View
    search_installed_placeholder: "Buscar aplicaciones instaladas... (Ctrl+F)",
    sort_installed_dropdown_title: "Ordenar aplicaciones instaladas",
    sort_installed_name_asc: "Nombre (A - Z)",
    sort_installed_name_desc: "Nombre (Z - A)",
    sort_installed_publisher_asc: "Editor (A - Z)",
    sort_installed_publisher_desc: "Editor (Z - A)",
    sort_installed_size_desc: "Tamaño (Mayor primero)",
    sort_installed_size_asc: "Tamaño (Menor primero)",
    btn_uninstall_top: "Desinstalar ({count})",

    // Empty / Loading States: Uninstaller
    state_installed_idle_title: "Listo para escanear",
    state_installed_idle_desc: "Haz clic en <strong>Escanear Equipo</strong> para cargar la lista de aplicaciones instaladas en tu sistema.",
    state_installed_loading_title: "Escaneando el equipo...",
    state_installed_loading_desc: "Consultando el registro y analizando almacenamiento de directorios. Esto puede tardar unos segundos.",
    state_installed_empty_title: "No se encontraron aplicaciones",

    // Uninstaller Warning Banner
    installed_system_warning_title: "⚠️ Componentes y Controladores Críticos del Sistema",
    installed_system_warning_desc: "Esta sección contiene librerías compartidas (Visual C++, .NET, DirectX) y controladores esenciales de Windows. Desinstalarlos puede provocar que aplicaciones, juegos o el propio sistema operativo fallen o se corrompan. Modifícalos con extrema precaución.",

    // GPU View
    gpu_view_title: "Centro de Rendimiento y Gráficos",
    gpu_detecting: "Detectando hardware...",
    btn_refresh_gpu: "Actualizar Estado",
    gpu_loading_title: "Analizando tarjeta gráfica y controladores...",
    gpu_loading_desc: "Inspeccionando hardware, versiones de controladores y telemetría de rendimiento en tiempo real.",
    gpu_detail_vendor_tag: "Adaptador Gráfico",
    gpu_status_driver: "Estado del Controlador",
    btn_launch_cpl: "Abrir Panel de Control",
    btn_check_gpu_updates: "Comprobar Actualizaciones",
    gpu_driver_ver_title: "Versión del Controlador:",
    gpu_driver_status_subtext: "Controlador instalado y activo en Windows",
    gpu_metrics_title: "Métricas de Rendimiento y Hardware",
    gpu_metrics_sub: "Monitorización del subsistema de vídeo",
    metric_vram_label: "Memoria Gráfica VRAM",
    metric_vram_unit: "Dedicada",
    metric_vram_status: "Disponible",
    metric_temp_label: "Temperatura GPU",
    metric_temp_unit: "Núcleo",
    metric_temp_footer: "Límite térmico: 88 °C",
    metric_power_label: "Consumo de Energía",
    metric_power_unit: "En tiempo real",
    metric_power_footer: "Alimentación PCIe y auxiliar",
    metric_pcie_label: "Enlace Bus PCIe",
    metric_pcie_unit: "Interfaz",
    metric_pcie_footer: "Ancho de banda directo",
    metric_clock_label: "Frecuencia de Reloj",
    metric_clock_unit: "Motor Gráfico",
    metric_clock_footer: "Velocidad de reloj dinámica",
    metric_fan_label: "Ventilación Activa",
    metric_fan_unit: "Rotación",
    metric_fan_footer: "Velocidad de ventiladores",
    gpu_tools_title: "Accesos Rápidos y Diagnóstico",
    btn_launch_dxdiag: "Diagnóstico DirectX (dxdiag)",
    btn_launch_devmgmt: "Administrador de Dispositivos",
    btn_launch_disp_settings: "Configuración de Pantalla",
    btn_refresh_gpu_aria: "Refrescar estado de GPU",
    gpu_detecting_adapter: "Detectando adaptador de vídeo...",
    gpu_querying_arch: "Consultando arquitectura y controladores...",
    gpu_checking_date: "Comprobando fecha...",
    metric_active: "Activo",
    metric_util_label: "Carga de GPU",
    metric_util_unit: "Uso",
    metric_util_footer: "Aceleración activa",
    metric_display_label: "Pantalla y Frecuencia",
    metric_display_footer: "Salida de vídeo principal",
    metric_cpl_label: "Panel de Control Activo",
    btn_open: "Abrir",
    gpu_optional_suites_toggle: "Herramientas opcionales de software y suites avanzadas",
    gpu_update_avail_badge: "¡Nueva Actualización de Controlador Gráfico Disponible!",
    comparator_current_ver: "Versión Actual Instalada",
    comparator_new_ver: "Nueva Versión Disponible",
    update_highlights_title: "Mejoras y optimizaciones incluidas:",
    update_highlight_1: "Soporte y perfiles Game Ready optimizados para los juegos más recientes.",
    update_highlight_2: "Mejoras en el rendimiento de Ray Tracing y reducción de latencia del sistema.",
    update_highlight_3: "Parches de seguridad y estabilidad certificados por Microsoft (WHQL).",
    btn_update_driver_now: "Descargar e Instalar Actualización Oficial",
    btn_view_gpu_details: "Ver detalles y telemetría de la GPU",
    no_driver_tag: "Controlador Oficial No Detectado",
    no_driver_detected_title: "Tu tarjeta gráfica está funcionando con controladores genéricos básicos",
    no_driver_detected_desc: "Windows está utilizando un adaptador de pantalla genérico. Para disfrutar de aceleración 3D en videojuegos, máxima resolución, tasas de refresco altas y el panel de control oficial, instala la suite recomendada para tu hardware a continuación.",
    no_driver_suites_heading: "Suites Oficiales Recomendadas para tu GPU",
    no_driver_suites_desc: "Selecciona una opción para descargar e instalar los controladores certificados directamente en tu equipo.",
    suite_open_panel: "Abrir Panel",
    suite_reinstall: "Reinstalar",
    suite_install: "Instalar",
    suite_installed_badge: "Instalado",
    suite_not_installed_badge: "No instalado",

    // Restore Points View
    restore_view_title: "Puntos de Restauración del Sistema",
    restore_view_sub: "Protege tu sistema operativo ante cambios inestables con copias del estado de Windows",
    search_restore_placeholder: "Buscar por nombre, tipo o fecha... (Ctrl+F)",
    btn_open_rstrui_topbar: "Restaurar Sistema",
    btn_open_rstrui_title: "Abrir el Asistente oficial de Restauración del Sistema de Windows (rstrui.exe)",
    btn_create_restore_modal: "Crear Punto de Restauración",
    btn_sys_settings: "Configurar Protección del Sistema",
    btn_delete_all_restore: "Eliminar Todos los Puntos",
    btn_delete_all_restore_title: "Eliminar todos los puntos de restauración para liberar espacio en disco",
    restore_hero_title: "Protección del Sistema de Windows",
    restore_badge_active: "Activa",
    restore_badge_inactive: "Desactivada",
    restore_hero_desc: "Permite revertir tu equipo a un estado anterior si una actualización o controlador causa fallos. Puedes crear instantáneas manuales o restaurar el sistema en cualquier momento.",
    btn_protection_settings_title: "Abrir configuración de Protección del Sistema en Windows",
    btn_configure_disk: "Configurar Disco",
    state_restore_idle_title: "Puntos de Restauración del Sistema",
    state_restore_idle_desc: "Haz clic en <strong>Actualizar Lista</strong> para cargar las instantáneas guardadas en Windows.",
    state_restore_loading_title: "Consultando instantáneas del sistema...",
    state_restore_loading_desc: "Obteniendo puntos de restauración registrados en Windows.",
    restore_state_loading_title: "Consultando puntos de restauración...",
    restore_state_loading_desc: "Accediendo a la instantánea de volumen VSS de Windows.",
    state_restore_admin_title: "Se requieren permisos de Administrador",
    state_restore_admin_desc: "Windows requiere privilegios de Administrador para listar y gestionar instantáneas de recuperación.",
    btn_request_admin: "Cargar con derechos de Administrador (UAC)",
    state_restore_empty_title: "No se encontraron puntos de restauración",
    state_restore_empty_desc: "No se encontraron instantáneas de recuperación en este equipo. Puedes crear una ahora mismo.",
    restore_state_empty_title: "No hay puntos de restauración creados",
    restore_state_empty_desc: "Crea uno ahora para poder revertir cambios en tu equipo si surge algún problema.",
    col_restore_id: "# ID",
    col_restore_desc: "Descripción / Evento",
    col_restore_datetime: "Fecha y Hora",
    col_restore_date: "Fecha de Creación",
    col_restore_type: "Tipo",
    col_restore_num: "Nº Secuencia",
    col_restore_action: "Acciones",
    col_restore_actions: "Acciones",
    restore_type_system: "Punto del sistema",
    restore_type_checkpoint: "Punto de comprobación",
    restore_type_install: "Instalación",
    restore_type_uninstall: "Desinstalación",
    restore_type_driver: "Controlador",
    btn_restore_point_action: "Restaurar",
    btn_restore_point_tooltip: "Abrir asistente de recuperación en este punto",
    btn_delete_point_action: "Eliminar",
    btn_delete_point_tooltip: "Eliminar este punto de restauración para liberar espacio",
    btn_create_restore_sidebar: "Crear Punto Ahora",
    stat_restore_total: "Puntos Creados",
    stat_restore_status: "Protección SO",
    btn_scan_restore: "Actualizar Lista",
    btn_open_rstrui: "Asistente de Windows",
    restore_point_toggle_tooltip: "Activar para crear un Punto de Restauración de Windows antes de desinstalar",
    restore_point_toggle_title: "Punto de Restauración",
    restore_point_toggle_desc: "Instantánea SO (Usa disco)",
    modal_restore_desc_prompt: "Introduce una descripción para identificar este punto en el futuro (ej. Antes de actualizar controladores):",
    modal_restore_desc_placeholder: "ej. Wingetix - Instantánea manual",
    btn_create_point_confirm: "Crear Punto",

    // Modals & General Buttons
    confirm_modal_title: "Confirmación de Acción",
    btn_cancel: "Cancelar",
    confirm_btn_update: "Confirmar y Continuar",
    modal_security_title: "Advertencia de Seguridad",
    modal_confirm: "Confirmar",
    modal_confirm_uninstall: "Confirmar Desinstalación",
    modal_confirm_uninstall_sys: "Desinstalar Componente",
    modal_create_restore_title: "Crear Punto de Restauración",
    modal_create_restore_desc: "Introduce una descripción para identificar este punto en el futuro (ej. Antes de actualizar controladores):",
    input_restore_placeholder: "Ej: Wingetix - Instalación manual",
    btn_create_point: "Crear Punto",

    // Queue Drawer & Status Bar
    queue_title: "Cola de Actualizaciones y Descargas",
    queue_label: "Cola",
    queue_word: "Cola",
    queue_summary_default: "0 en proceso",
    queue_summary_progress: "{done} de {total} completados",
    status_ready: "Listo",
    status_prepared: "Sistema preparado",
    status_operation_completed: "Operación completada",
    status_all_done: "Todas las tareas han finalizado",
    status_completed: "Completado ✔",
    status_downloading: "Descargando",
    status_installing: "Instalando...",
    status_connecting: "Conectando...",
    status_starting: "Iniciando descarga...",
    status_retry: "Reintentar",
    status_admin: "Probar como Administrador",
    status_kill_retry: "Cerrar app y Reintentar",
    status_admin_needed: "Requiere Admin 🛡",
    status_in_use: "App en uso ⚠",
    status_error: "Error ✖",
    btn_force_clean: "El desinstalador ya terminó → Limpieza profunda",
    btn_force_clean_label: "Desinstalador finalizado → Limpieza profunda",

    // Self-updater Modal
    app_update_title: "Actualización de Wingetix",
    app_update_subtitle: "Nueva versión oficial detectada en el repositorio",
    app_update_cur_ver: "Versión Actual",
    app_update_cur_ver_label: "Versión Actual",
    app_update_new_ver: "Nueva Versión",
    app_update_new_ver_label: "Nueva Versión",
    app_update_banner_date: "Disponible en GitHub",
    app_update_github_available: "Disponible en GitHub",
    app_update_notes_title: "Novedades y mejoras incluidas:",
    app_update_notes_heading: "Notas de la versión y cambios:",
    app_update_auto_close_note: "<strong>Nota:</strong> Para aplicar la actualización, Wingetix se cerrará e iniciará el instalador oficial automáticamente.",
    app_update_auto_notice: "Aviso de actualización automática:",
    app_update_auto_notice_desc: "El paquete oficial de instalación se descargará del repositorio en GitHub. Antes de reemplazar los archivos, se te solicitará confirmación.",
    app_update_ready_title: "¡Descarga completada con éxito!",
    app_update_ready_text: "<strong>Advertencia importante:</strong> Para aplicar la actualización, <strong>Wingetix se cerrará de forma segura</strong> e iniciará el instalador automáticamente para actualizar los archivos. ¿Deseas proceder ahora?",
    app_update_downloading: "Descargando actualización oficial...",
    app_update_download_success: "¡Descarga completada con éxito!",
    app_update_important_warning: "Aviso Importante:",
    app_update_remind_later: "Recordármelo más tarde",
    app_update_download_install: "Descargar e Instalar Ahora",
    app_update_close_and_install: "Cerrar e Instalar Actualización",
    btn_update_cancel: "Recordar más tarde",
    btn_update_download: "Descargar e Instalar Ahora",
    btn_update_install_now: "Cerrar e Instalar Actualización",

    // Installed apps
    state_installed_empty_desc: "No se encontraron aplicaciones que coincidan con la búsqueda.",

    // Uninstaller confirmations & messages
    confirm_uninstall_btn: "Confirmar Desinstalación",
    confirm_uninstall_single_sys_msg: "⚠️ ADVERTENCIA DE COMPONENTE CRÍTICO DEL SISTEMA\n\nEstás a punto de desinstalar:\n\"{name}\"\n\nEste es un componente crítico o controlador de Windows (Visual C++, .NET, DirectX o controlador de hardware). Su eliminación puede dañar o corromper aplicaciones instaladas, juegos o el propio sistema operativo.\n\n¿Estás absolutamente seguro de que deseas continuar?",
    confirm_uninstall_sys_btn: "Desinstalar Componente",
    confirm_uninstall_single_epic_msg: "⚠️ JUEGO O APP DE EPIC GAMES\n\n¿Seguro que deseas desinstalar \"{name}\"?\n\nWingetix solicitará al lanzador de Epic Games que proceda con la desinstalación limpia.",
    confirm_uninstall_single_steam_msg: "⚠️ APLICACIÓN DE STEAM\n\n¿Seguro que deseas desinstalar \"{name}\"?\n\nWingetix enviará la orden de desinstalación al cliente de Steam.",
    toast_uninstall_success: "Se desinstaló \"{name}\" correctamente.",
    toast_uninstall_failed: "La desinstalación falló o fue cancelada.",
    confirm_uninstall_more_count: "\n... y {count} aplicaciones más",
    confirm_uninstall_batch_single_msg: "⚠️ DESINSTALACIÓN LIMPIA\n\n¿Estás seguro de que deseas desinstalar de forma limpia \"{name}\"?",
    confirm_uninstall_batch_multi_msg: "⚠️ DESINSTALACIÓN LIMPIA POR LOTES\n\nHas seleccionado {count} aplicaciones para desinstalar:\n\n{list}{more}\n\nWingetix ejecutará cada desinstalador oficial en secuencia y limpiará los archivos residuales. ¿Deseas continuar?",
    confirm_uninstall_batch_sys_btn: "Desinstalar Componentes del Sistema",

    // Dynamic Notifications & Dialogs
    no_apps_available_tab: "No se encontraron {tabName} disponibles para actualizar.",
    no_apps_found_tab: "No se encontraron {tabName} en esta categoría.",
    toast_system_uptodate: "Tu sistema está al día.",
    toast_updates_found: "{count} actualizaciones encontradas.",
    toast_scan_error: "Error al escanear. ¿Está winget instalado?",
    toast_select_at_least_one: "Selecciona al menos una aplicación.",
    toast_select_at_least_one_uninst: "Selecciona al menos una aplicación para desinstalar.",
    toast_updates_completed: "Actualizaciones completadas.",
    toast_updates_failed: "Algunas actualizaciones fallaron. Revisa la consola.",
    toast_app_uninstalled: "Se desinstaló {name} correctamente.",
    toast_app_uninstall_failed: "La desinstalación falló o fue cancelada.",
    toast_batch_uninstalled: "Se han desinstalado {count} aplicación(es) limpiamente.",
    toast_restore_created: "Punto de restauración creado con éxito.",
    toast_restore_create_failed: "No se pudo crear el punto: {err}",
    toast_restore_deleted: "Punto de restauración eliminado.",
    toast_restore_delete_all: "Se eliminaron todos los puntos de restauración.",
    toast_junk_cleaned: "Archivos temporales eliminados ({amount} liberados).",
    toast_junk_none: "No se encontraron archivos temporales para limpiar.",
    toast_export_success: "Lista exportada a {path}",
    toast_import_success: "{count} aplicaciones importadas a la cola.",
    status_scanning_updates: "Buscando actualizaciones...",
    status_scanning_sub: "Consultando repositorio de winget...",
    status_scan_done: "Escaneo finalizado",
    status_updating_pkg: "Actualizando: {name}",
    status_progress_sub: "Progreso: {done} de {total}",
    status_updating_multi: "Procesando actualizaciones...",
    status_updating_done: "Actualizaciones completadas",
    status_updating_done_sub: "Todos los paquetes seleccionados fueron actualizados.",
    status_uninstalling_pkg: "Desinstalando {name}...",
    status_cleaning_leftovers: "Limpiando residuos de {name}...",
    status_cleaning_step: "Limpiando: {name}",
    confirm_update_all_msg: "Vas a actualizar todas las aplicaciones y juegos detectados ({count}).\n\n🛡️ PROTECCIÓN ACTIVA:\nTodos los componentes y librerías del sistema se omiten automáticamente para evitar riesgos de corrupción en Windows.\n\n¿Deseas continuar?",
    confirm_uninstall_single_msg: "⚠️ ADVERTENCIA DE SEGURIDAD\n\n¿Estás seguro de que deseas desinstalar de forma limpia \"{name}\"?\n\n• Se ejecutará el desinstalador oficial del programa.\n• Se buscarán y limpiarán de forma segura los residuos huérfanos específicos de esta aplicación.",
    confirm_uninstall_sys_single_msg: "🔴 ADVERTENCIA CRÍTICA: DESINSTALACIÓN DE COMPONENTE DEL SISTEMA\n\nEstás a punto de desinstalar un componente o librería del sistema:\n\"{name}\"\n\n⚠️ PELIGRO DE INESTABILIDAD O CORRUPCIÓN:\nEste elemento (como Microsoft Visual C++, .NET, DirectX, librerías o controladores) puede ser requerido por múltiples aplicaciones, juegos y servicios esenciales de Windows.\n\n• Desinstalarlo podría hacer que otros programas fallen, no inicien o que Windows se corrompa.\n• Se recomienda encarecidamente NO eliminarlo salvo que sea estrictamente necesario.\n\n¿Estás seguro de que deseas proceder bajo tu propia responsabilidad?",
    confirm_uninstall_batch_msg: "⚠️ ADVERTENCIA DE DESINSTALACIÓN EN LOTE (5s)\n\n¿Estás seguro de que deseas desinstalar de forma limpia las siguientes {count} aplicaciones seleccionadas?\n\n{list}{more}\n\n• Se ejecutarán los desinstaladores de cada programa de forma secuencial.\n• 🛡️ ESCUDO ACTIVO: Todos los lanzadores (Epic Games, Steam, EA, Ubisoft) y componentes compartidos están blindados.\n• Se limpiarán únicamente los residuos huérfanos específicos de cada aplicación.",
    confirm_uninstall_batch_sys_msg: "🔴 ADVERTENCIA CRÍTICA: COMPONENTES DEL SISTEMA SELECCIONADOS\n\nHas seleccionado uno o más componentes esenciales o controladores de Windows para desinstalar:\n\n{list}{more}\n\n⚠️ PELIGRO DE INESTABILIDAD:\nDesinstalar librerías del sistema (como Microsoft Visual C++, .NET, DirectX o drivers) puede romper aplicaciones y causar fallos graves o corrupción en Windows.\n\n¿Confirmas que deseas desinstalar estos componentes bajo tu propia responsabilidad?",
    confirm_delete_restore_single_msg: "¿Estás seguro de que deseas eliminar el punto de restauración #{seq}?\n\n\"{desc}\" ({date})\n\nEsta acción eliminará la instantánea del sistema liberando espacio en disco y no se puede deshacer.",
    confirm_delete_restore_single_btn: "Eliminar Punto",
    confirm_delete_restore_all_msg: "¿Estás seguro de que deseas eliminar TODOS los puntos de restauración ({count} punto(s))?\n\nSe eliminarán todas las instantáneas de recuperación de Windows liberando espacio en el disco. Esta acción no se puede deshacer.",
    confirm_delete_restore_all_btn: "Eliminar Todos los Puntos",
    toast_no_restore_points: "No hay puntos de restauración cargados para eliminar.",
    toast_opening_rstrui: "Abriendo Asistente de Recuperación de Windows (rstrui)...",
    toast_opening_rstrui_item: "Abriendo Asistente de Recuperación para el punto #{seq}...",
    toast_opening_protection_settings: "Abriendo Configuración de Protección del Sistema..."
  }
};

// Default language: ENGLISH ('en')
let currentLang = localStorage.getItem('wingetix_lang') || 'en';

function t(key, params = {}) {
  const dict = translations[currentLang] || translations.en;
  let text = dict[key] !== undefined ? dict[key] : (translations.en[key] !== undefined ? translations.en[key] : key);

  if (typeof text === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach(k => {
      text = text.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
    });
  }
  return text;
}

function setLanguage(lang, isUserChoice = false) {
  if (lang !== 'en' && lang !== 'es') lang = 'en';
  currentLang = lang;
  try {
    localStorage.setItem('wingetix_lang', lang);
    if (isUserChoice) {
      localStorage.setItem('wingetix_user_selected_lang', 'true');
    }
  } catch (_) {}

  document.documentElement.lang = lang;

  // Update switcher UI buttons
  const btnEn = document.getElementById('btn-lang-en');
  const btnEs = document.getElementById('btn-lang-es');
  if (btnEn) btnEn.classList.toggle('active', lang === 'en');
  if (btnEs) btnEs.classList.toggle('active', lang === 'es');

  // Update dropdown menu items & checkmarks
  const menuEn = document.getElementById('menu-lang-en');
  const menuEs = document.getElementById('menu-lang-es');
  if (menuEn) menuEn.classList.toggle('active', lang === 'en');
  if (menuEs) menuEs.classList.toggle('active', lang === 'es');

  const checkEn = document.querySelector('.check-en');
  const checkEs = document.querySelector('.check-es');
  if (checkEn) checkEn.classList.toggle('hidden', lang !== 'en');
  if (checkEs) checkEs.classList.toggle('hidden', lang !== 'es');

  // Translate all DOM elements with data-i18n
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (val) {
      if (key.endsWith('_html') || key === 'state_idle_desc' || key === 'state_installed_idle_desc' || key === 'state_restore_idle_desc' || key === 'app_update_auto_close_note' || key === 'app_update_ready_text') {
        el.innerHTML = val;
      } else {
        el.textContent = val;
      }
    }
  });

  // Translate placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    const val = t(key);
    if (val) el.placeholder = val;
  });

  // Translate titles
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    const val = t(key);
    if (val) el.title = val;
  });

  // Translate aria-labels
  document.querySelectorAll('[data-i18n-aria]').forEach(el => {
    const key = el.getAttribute('data-i18n-aria');
    const val = t(key);
    if (val) el.setAttribute('aria-label', val);
  });

  // Dispatch custom event for dynamic JS components
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

// Global expose
window.i18n = {
  get currentLang() { return currentLang; },
  t,
  setLanguage,
  translations
};
