param(
    [string]$InputJsonPath
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing
$wscript = New-Object -ComObject WScript.Shell

if (![string]::IsNullOrWhiteSpace($InputJsonPath) -and (Test-Path -LiteralPath $InputJsonPath)) {
    $raw = Get-Content -LiteralPath $InputJsonPath -Raw -Encoding UTF8
    $items = ConvertFrom-Json $raw
} else {
    Write-Output "[]"
    exit
}

if (!$items -or $items.Count -eq 0) {
    Write-Output "[]"
    exit
}

$startMenuPaths = @(
    'C:\ProgramData\Microsoft\Windows\Start Menu\Programs',
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
    'C:\Users\Public\Desktop',
    [Environment]::GetFolderPath('Desktop')
)
$allLnks = Get-ChildItem -Path $startMenuPaths -Filter '*.lnk' -Recurse -File -ErrorAction SilentlyContinue

$appPaths = Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\*', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\*' -ErrorAction SilentlyContinue |
    Where-Object { $_.'(default)' }

$wingetLinksDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Links"

$paths = @(
  "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
)
$regApps = Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -ne $null }

$iconCache = @{}
$genericWords = @('launcher', 'client', 'desktop', 'app', 'application', 'software', 'tool', 'tools', 'manager', 'edition', 'community', 'pro', 'setup', 'installer', 'helper', 'service', 'engine')

function Clean-Name([string]$n) {
    if ([string]::IsNullOrWhiteSpace($n)) { return "" }
    $n = $n -replace '\(.*?\)', '' -replace '\[.*?\]', ''
    $n = $n -replace '(\d+\.[\d\.]+)', ''
    $n = $n -replace '(?i)(64-bit|32-bit|x64|x86|redistributable)', ''
    $n = $n.Trim().ToLower()
    return $n
}

function Clean-Path([string]$p) {
    if ([string]::IsNullOrWhiteSpace($p)) { return "" }
    $p = [System.Environment]::ExpandEnvironmentVariables($p).Trim().Trim('"').Trim("'")
    if ($p -match '^"?(.*?\.(?:exe|ico|dll))"?') {
        $p = $matches[1]
    }
    return $p.Trim().Trim('"').Trim("'")
}

function Safe-FileExists([string]$p) {
    if ([string]::IsNullOrWhiteSpace($p)) { return $false }
    try { return [System.IO.File]::Exists($p) } catch { return $false }
}

function Safe-DirExists([string]$p) {
    if ([string]::IsNullOrWhiteSpace($p)) { return $false }
    try { return [System.IO.Directory]::Exists($p) } catch { return $false }
}

function Resolve-LnkTarget([string]$lnkPath) {
    if (!(Safe-FileExists $lnkPath)) { return "" }
    try {
        $sc = $wscript.CreateShortcut($lnkPath)
        if ($sc.TargetPath -and (Safe-FileExists $sc.TargetPath)) {
            return $sc.TargetPath
        }
        if ($sc.IconLocation) {
            $il = ($sc.IconLocation -split ',')[0].Trim('"')
            if (Safe-FileExists $il) { return $il }
        }
    } catch {}
    return ""
}

function Get-IconBase64([string]$filePath) {
    if (!(Safe-FileExists $filePath)) { return "" }
    # Never extract directly from a .lnk shortcut to avoid Windows shortcut overlay badges
    if ($filePath.EndsWith('.lnk', [System.StringComparison]::OrdinalIgnoreCase)) { return "" }

    $norm = $filePath.ToLower()
    if ($iconCache.ContainsKey($norm)) { return $iconCache[$norm] }
    try {
        if ($filePath.EndsWith('.png', [System.StringComparison]::OrdinalIgnoreCase) -or $filePath.EndsWith('.jpg', [System.StringComparison]::OrdinalIgnoreCase)) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $b64 = [Convert]::ToBase64String($bytes)
            $iconCache[$norm] = $b64
            return $b64
        }
        $icon = [System.Drawing.Icon]::ExtractAssociatedIcon($filePath)
        if ($icon) {
            $bmp = $icon.ToBitmap()
            $ms = New-Object System.IO.MemoryStream
            $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
            $bytes = $ms.ToArray()
            $b64 = [Convert]::ToBase64String($bytes)
            $ms.Dispose()
            $bmp.Dispose()
            $icon.Dispose()
            $iconCache[$norm] = $b64
            return $b64
        }
    } catch {
        try {
            if ($filePath -match '(?i)\.ico$') {
                $icon = [System.Drawing.Icon]::new($filePath)
                $bmp = $icon.ToBitmap()
                $ms = New-Object System.IO.MemoryStream
                $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
                $bytes = $ms.ToArray()
                $b64 = [Convert]::ToBase64String($bytes)
                $ms.Dispose()
                $bmp.Dispose()
                $icon.Dispose()
                $iconCache[$norm] = $b64
                return $b64
            }
        } catch {}
    }
    $iconCache[$norm] = ""
    return ""
}

function Find-BestExe([string]$dirPath, [string]$appName) {
    if (!(Safe-DirExists $dirPath)) { return "" }
    $cleanApp = Clean-Name $appName
    $firstWord = ($cleanApp -split '\s+')[0]
    $exes = Get-ChildItem -LiteralPath $dirPath -Filter "*.exe" -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -notmatch '(?i)(uninstall|unins\d*|setup|update|crash|helper|elevate)' }
    if (!$exes) {
        $exes = Get-ChildItem -LiteralPath $dirPath -Filter "*.exe" -File -ErrorAction SilentlyContinue
    }
    if (!$exes) { return "" }
    if ($firstWord.Length -ge 3) {
        $m = $exes | Where-Object { $_.BaseName.ToLower() -eq $firstWord -or $_.BaseName.ToLower().Contains($firstWord) } | Select-Object -First 1
        if ($m) { return $m.FullName }
    }
    return $exes[0].FullName
}

function Find-ShortcutIcon([string]$appName, [string]$id) {
    if (!$allLnks -or $allLnks.Count -eq 0) { return "" }
    $cleanApp = Clean-Name $appName
    $firstWord = ($cleanApp -split '\s+')[0]
    $idSegments = $id -split '\.'
    $idLast = if ($idSegments.Count -gt 1) { $idSegments[-1].ToLower() } else { $id.ToLower() }

    # 1. Exact match on clean name
    if ($cleanApp.Length -ge 2) {
        $m = $allLnks | Where-Object { (Clean-Name $_.BaseName) -eq $cleanApp } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }

    # 2. Both words match (e.g. "python" AND "launcher")
    if ($firstWord.Length -ge 3 -and $firstWord -notin $genericWords) {
        $m = $allLnks | Where-Object {
            $b = $_.BaseName.ToLower()
            $b.Contains($firstWord) -and ($cleanApp -split '\s+' | Where-Object { $_.Length -ge 3 -and $b.Contains($_) }).Count -ge 2
        } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }

    # 3. Match on package ID last segment only if NOT generic
    if ($idLast.Length -ge 3 -and $idLast -notin $genericWords) {
        $m = $allLnks | Where-Object {
            $b = Clean-Name $_.BaseName
            $b -eq $idLast -or $b.Contains($idLast)
        } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }

    # 4. Primary word prefix match BUT shortcut MUST belong to that brand
    if ($firstWord.Length -ge 4 -and $firstWord -notin $genericWords) {
        $m = $allLnks | Where-Object {
            $b = $_.BaseName.ToLower()
            $b.StartsWith($firstWord) -or $b.Contains($firstWord)
        } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }
    return ""
}

$results = @()
foreach ($item in $items) {
    $pkgName = ($item.name + '').Trim()
    $pkgId = ($item.id + '').Trim()
    $pkgNameLower = $pkgName.ToLower()
    $cleanPkg = Clean-Name $pkgName
    $firstWord = ($cleanPkg -split '\s+')[0]
    $idSegments = $pkgId -split '\.'
    $idLast = if ($idSegments.Count -gt 1) { $idSegments[-1].ToLower() } else { $pkgId.ToLower() }
    $idFirst = if ($idSegments.Count -gt 1) { $idSegments[0] } else { '' }

    $iconPath = ""

    # ── Special dedicated rules for common runtimes & tools ───────────────────
    if ($pkgId -eq "Python.Launcher" -or $cleanPkg -eq "python launcher") {
        if (Safe-FileExists "C:\Windows\py.exe") { $iconPath = "C:\Windows\py.exe" }
    } elseif ($cleanPkg.StartsWith("python 3.")) {
        $pyVer = ($cleanPkg -replace '[^\d]', '').Substring(0, 2)
        $cand = "$env:LOCALAPPDATA\Programs\Python\Python$pyVer\python.exe"
        if (Safe-FileExists $cand) { $iconPath = $cand }
    } elseif ($cleanPkg -match '(?i)winget\s*manager' -or $cleanPkg -match '(?i)wingetix' -or $pkgId -match '(?i)wingetix') {
        $wingetCandidates = @(
            (Join-Path $PSScriptRoot '..\logo.png'),
            (Join-Path $PSScriptRoot '..\icon.png'),
            (Join-Path $PSScriptRoot '..\..\logo.png'),
            (Join-Path $PSScriptRoot '..\..\resources\app-unpacked\icon.png'),
            (Join-Path $PSScriptRoot '..\..\..\logo.png'),
            'C:\Scripts\Winget Manager Versions\wingetix 1.1.1\logo.png',
            'C:\Scripts\Winget Manager Versions\logo.png'
        )
        foreach ($wc in $wingetCandidates) {
            if (Safe-FileExists $wc) {
                $iconPath = $wc
                break
            }
        }
    }

    # Find matching registry entry
    $match = $regApps | Where-Object {
        $dn = ($_.DisplayName + '').ToLower()
        $ps = ($_.PSChildName + '').ToLower()
        ($dn -and $dn -eq $pkgNameLower) -or
        ($dn -and $cleanPkg.Length -ge 3 -and (Clean-Name $_.DisplayName) -eq $cleanPkg) -or
        ($dn -and $cleanPkg.Length -ge 3 -and $dn.Contains($cleanPkg)) -or
        ($dn -and $cleanPkg.Length -ge 3 -and $cleanPkg.Contains($dn)) -or
        ($ps -and $ps -eq $pkgId.ToLower()) -or
        ($ps -and $idLast.Length -ge 4 -and $idLast -notin $genericWords -and $ps.Contains($idLast))
    } | Select-Object -First 1

    if (!(Safe-FileExists $iconPath) -and $match -and $match.DisplayIcon) {
        $clean = Clean-Path $match.DisplayIcon
        # Ignore installer package cache wrappers
        if ($clean -notmatch '(?i)(package cache|\\installer\\|bootstrapper)') {
            if (Safe-FileExists $clean) { $iconPath = $clean }
        }
    }

    if (!(Safe-FileExists $iconPath) -and $match -and $match.InstallLocation) {
        $exe = Find-BestExe $match.InstallLocation $pkgName
        if ($exe) { $iconPath = $exe }
    }

    if (!(Safe-FileExists $iconPath)) {
        $lnk = Find-ShortcutIcon $pkgName $pkgId
        if ($lnk) { $iconPath = $lnk }
    }

    if (!(Safe-FileExists $iconPath)) {
        if ($firstWord.Length -ge 3 -and $firstWord -notin $genericWords -and $appPaths) {
            $ap = $appPaths | Where-Object { $_.PSChildName.ToLower().StartsWith($firstWord) } | Select-Object -First 1
            if ($ap) {
                $apPath = Clean-Path $ap.'(default)'
                if (Safe-FileExists $apPath) { $iconPath = $apPath }
            }
        }
    }

    if (!(Safe-FileExists $iconPath) -and $match -and $match.UninstallString) {
        $uPath = Clean-Path $match.UninstallString
        if (Safe-FileExists $uPath -and $uPath -notmatch '(?i)(package cache|\\installer\\)') {
            $parent = Split-Path -Parent $uPath
            $exe = Find-BestExe $parent $pkgName
            if ($exe) { $iconPath = $exe }
            else { $iconPath = $uPath }
        }
    }

    if (!(Safe-FileExists $iconPath)) {
        if ($firstWord.Length -ge 3 -and $firstWord -notin $genericWords) {
            $linkCandidate = Join-Path $wingetLinksDir "$firstWord.exe"
            if (Safe-FileExists $linkCandidate) {
                $iconPath = $linkCandidate
            } else {
                $cmd = Get-Command $firstWord -ErrorAction SilentlyContinue | Where-Object { $_.CommandType -eq 'Application' } | Select-Object -First 1
                if ($cmd -and (Safe-FileExists $cmd.Source)) {
                    $iconPath = $cmd.Source
                }
            }
        }
    }

    $b64 = if (![string]::IsNullOrWhiteSpace($iconPath)) { Get-IconBase64 $iconPath } else { "" }

    $pub = ""
    if ($match -and $match.Publisher) {
        $pub = ($match.Publisher + '').Trim()
    }
    if ([string]::IsNullOrWhiteSpace($pub)) {
        $pub = if ($idFirst) { $idFirst } else { "Desconocido" }
    }

    [double]$sizeMb = 0
    if ($match -and $match.EstimatedSize -and [int64]$match.EstimatedSize -gt 0) {
        $sizeMb = [math]::Round([int64]$match.EstimatedSize / 1024, 2)
    }

    $results += [PSCustomObject]@{
        id = $item.id
        iconBase64 = $b64
        publisher = $pub
        sizeMb = $sizeMb
    }
}
$results | ConvertTo-Json -Compress
