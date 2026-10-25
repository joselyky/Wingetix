; Script de Inno Setup para Wingetix
; Permite empaquetar la carpeta compilada 'Wingetix-win32-x64' con activador de WinGet integrado y selector de idioma

#define MyAppName "Wingetix"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "Wingetix"
#define MyAppExeName "Wingetix.exe"

[Setup]
AppId={{E67A20B7-996D-4BC7-8D29-A76F32A3CB91}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=.\installer-output
OutputBaseFilename=Wingetix-Setup-{#MyAppVersion}
Compression=lzma2/ultra64
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesInstallIn64BitMode=x64

; Configuración para solicitar selección de idioma al inicio del instalador
ShowLanguageDialog=yes
UsePreviousLanguage=no

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"
Name: "spanish"; MessagesFile: "compiler:Languages\Spanish.isl"

[CustomMessages]
english.CreateDesktopIcon=Create a &desktop shortcut
english.AdditionalIcons=Additional shortcuts:
english.EnableWinGetDesc=Enable and register WinGet in Windows Terminal (Recommended)
english.SysConfigGroup=System Configuration:
english.ActivatingWinGet=Activating and registering WinGet in Windows Terminal...

spanish.CreateDesktopIcon=Crear un acceso directo en el &escritorio
spanish.AdditionalIcons=Accesos directos adicionales:
spanish.EnableWinGetDesc=Activar y registrar WinGet en la terminal de Windows (Recomendado)
spanish.SysConfigGroup=Configuración del Sistema:
spanish.ActivatingWinGet=Activando y registrando WinGet en la terminal de Windows...

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "enablewinget"; Description: "{cm:EnableWinGetDesc}"; GroupDescription: "{cm:SysConfigGroup}"; Flags: checkedonce

[Files]
Source: "Wingetix-win32-x64\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "Wingetix-win32-x64\resources\scripts\enable-winget.ps1"; DestDir: "{app}\resources\scripts"; Flags: ignoreversion
Source: "Wingetix-win32-x64\resources\scripts\list-installed.ps1"; DestDir: "{app}\resources\scripts"; Flags: ignoreversion

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon

[Run]
; Ejecuta la activación de WinGet si la casilla está marcada (marcada por defecto)
Filename: "powershell.exe"; Parameters: "-NoProfile -NonInteractive -ExecutionPolicy Bypass -File ""{app}\resources\scripts\enable-winget.ps1"""; StatusMsg: "{cm:ActivatingWinGet}"; Tasks: enablewinget; Flags: runhidden

; Ejecutar la aplicación al finalizar pasando el idioma elegido en el instalador
Filename: "{app}\{#MyAppExeName}"; Parameters: "--lang={code:GetLangParam}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
function GetLangParam(Param: string): string;
begin
  if ActiveLanguage = 'spanish' then
    Result := 'es'
  else
    Result := 'en';
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  SelectedLangCode: string;
begin
  if CurStep = ssPostInstall then
  begin
    SelectedLangCode := GetLangParam('');
    SaveStringToFile(ExpandConstant('{app}\resources\installed_lang.txt'), SelectedLangCode, False);
  end;
end;
