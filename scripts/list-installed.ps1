[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Drawing
$wscript = New-Object -ComObject WScript.Shell

$paths = @(
  "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKLM:\SOFTWARE\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*",
  "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*"
)
$apps = Get-ItemProperty -Path $paths -ErrorAction SilentlyContinue |
    Where-Object { $_.DisplayName -ne $null -and $_.SystemComponent -ne 1 -and $_.ParentKeyName -eq $null }

# Pre-cache Start Menu & Desktop shortcuts (.lnk)
$startMenuPaths = @(
    'C:\ProgramData\Microsoft\Windows\Start Menu\Programs',
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs",
    'C:\Users\Public\Desktop',
    [Environment]::GetFolderPath('Desktop')
)
$allLnks = Get-ChildItem -Path $startMenuPaths -Filter '*.lnk' -Recurse -File -ErrorAction SilentlyContinue

# Pre-cache App Paths from Registry
$appPaths = Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\*', 'HKCU:\Software\Microsoft\Windows\CurrentVersion\App Paths\*' -ErrorAction SilentlyContinue |
    Where-Object { $_.'(default)' }

# Pre-cache WinGet Links folder
$wingetLinksDir = "$env:LOCALAPPDATA\Microsoft\WinGet\Links"

$result = @()
$seen = [System.Collections.Generic.HashSet[string]]::new()
$dirSizeCache = @{}
$iconCache = @{}
$systemRoots = @("c:", "c:\", "c:\windows", "c:\windows\system32", "c:\program files", "c:\program files (x86)", "c:\programdata")
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

function Safe-DirExists([string]$p) {
    if ([string]::IsNullOrWhiteSpace($p)) { return $false }
    try { return [System.IO.Directory]::Exists($p) } catch { return $false }
}

function Safe-FileExists([string]$p) {
    if ([string]::IsNullOrWhiteSpace($p)) { return $false }
    try { return [System.IO.File]::Exists($p) } catch { return $false }
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
    if (! (Safe-FileExists $filePath)) { return "" }
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
    if (! (Safe-DirExists $dirPath)) { return "" }
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

function Find-ShortcutIcon([string]$appName) {
    if (!$allLnks -or $allLnks.Count -eq 0) { return "" }
    $cleanApp = Clean-Name $appName
    $firstWord = ($cleanApp -split '\s+')[0]

    # 1. Exact match on clean name
    if ($cleanApp.Length -ge 2) {
        $m = $allLnks | Where-Object { (Clean-Name $_.BaseName) -eq $cleanApp } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }

    # 2. Both words match
    if ($firstWord.Length -ge 3 -and $firstWord -notin $genericWords) {
        $m = $allLnks | Where-Object {
            $b = $_.BaseName.ToLower()
            $b.Contains($firstWord) -and ($cleanApp -split '\s+' | Where-Object { $_.Length -ge 3 -and $b.Contains($_) }).Count -ge 2
        } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }

    # 3. First significant word prefix (non-generic)
    if ($firstWord.Length -ge 4 -and $firstWord -notin $genericWords) {
        $m = $allLnks | Where-Object {
            $b = Clean-Name $_.BaseName
            $b -and ($b.StartsWith($firstWord) -or $b.Contains($firstWord))
        } | Select-Object -First 1
        if ($m) { return (Resolve-LnkTarget $m.FullName) }
    }
    return ""
}

function Get-DirectorySizeFast([string]$dirPath) {
    if (! (Safe-DirExists $dirPath)) { return 0 }
    $norm = $dirPath.TrimEnd('\').ToLower()
    if ($norm -in $systemRoots) { return 0 }
    if ($dirSizeCache.ContainsKey($norm)) { return $dirSizeCache[$norm] }

    [int64]$totalBytes = 0
    try {
        $di = [System.IO.DirectoryInfo]::new($dirPath)
        $fileCount = 0
        foreach ($file in $di.EnumerateFiles('*', [System.IO.SearchOption]::AllDirectories)) {
            $totalBytes += $file.Length
            $fileCount++
            if ($fileCount -ge 2000) { break }
        }
    } catch {
        try {
            $di = [System.IO.DirectoryInfo]::new($dirPath)
            foreach ($file in $di.EnumerateFiles('*', [System.IO.SearchOption]::TopDirectoryOnly)) {
                $totalBytes += $file.Length
            }
        } catch {}
    }
    $mb = [math]::Round($totalBytes / 1MB, 2)
    $dirSizeCache[$norm] = $mb
    return $mb
}

foreach ($app in $apps) {
    $name = $app.DisplayName.Trim()
    if ([string]::IsNullOrWhiteSpace($name)) { continue }
    
    $ver = if ($app.DisplayVersion) { $app.DisplayVersion.Trim() } else { "" }
    $key = "$name|$ver"
    if ($seen.Contains($key)) { continue }
    $null = $seen.Add($key)

    $sizeMb = 0
    if ($app.EstimatedSize -and $app.EstimatedSize -gt 0) {
        $sizeMb = [math]::round($app.EstimatedSize / 1024, 2)
    }

    $iconPath = ""
    $cleanName = Clean-Name $name
    $firstWord = ($cleanName -split '\s+')[0]

    # Special dedicated overrides for known tools
    if ($cleanName -eq "python launcher") {
        if (Safe-FileExists "C:\Windows\py.exe") { $iconPath = "C:\Windows\py.exe" }
    } elseif ($cleanName.StartsWith("python 3.")) {
        $pyVer = ($cleanName -replace '[^\d]', '').Substring(0, 2)
        $cand = "$env:LOCALAPPDATA\Programs\Python\Python$pyVer\python.exe"
        if (Safe-FileExists $cand) { $iconPath = $cand }
    } elseif ($cleanName -match '(?i)winget\s*manager' -or $cleanName -match '(?i)wingetix') {
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

    if (!(Safe-FileExists $iconPath) -and $app.DisplayIcon) {
        $clean = Clean-Path $app.DisplayIcon
        if ($clean -notmatch '(?i)(package cache|\\installer\\|bootstrapper)' -and (Safe-FileExists $clean)) {
            $iconPath = $clean
        }
    }

    $installLoc = if ($app.InstallLocation) { $app.InstallLocation.Trim().Trim('"') } else { "" }

    if ($sizeMb -eq 0) {
        if (Safe-DirExists $installLoc) {
            $sizeMb = Get-DirectorySizeFast $installLoc
        }
        
        if ($sizeMb -eq 0 -and (Safe-FileExists $iconPath)) {
            $parent = Split-Path -Parent $iconPath
            if (![string]::IsNullOrWhiteSpace($parent) -and !(($parent.TrimEnd('\').ToLower()) -in $systemRoots) -and (Safe-DirExists $parent)) {
                $sizeMb = Get-DirectorySizeFast $parent
                if ([string]::IsNullOrWhiteSpace($installLoc)) { $installLoc = $parent }
            }
        }

        if ($sizeMb -eq 0 -and $app.UninstallString) {
            $uninstClean = Clean-Path $app.UninstallString
            if (Safe-FileExists $uninstClean) {
                $parent = Split-Path -Parent $uninstClean
                if (![string]::IsNullOrWhiteSpace($parent) -and !(($parent.TrimEnd('\').ToLower()) -in $systemRoots) -and (Safe-DirExists $parent)) {
                    $sizeMb = Get-DirectorySizeFast $parent
                    if ([string]::IsNullOrWhiteSpace($installLoc)) { $installLoc = $parent }
                }
            }
        }
    }

    # ── Multi-Tier Icon Resolution ──────────────────────────────────────────
    if (! (Safe-FileExists $iconPath)) {
        if (Safe-DirExists $installLoc) {
            $exe = Find-BestExe $installLoc $name
            if ($exe) { $iconPath = $exe }
        }
    }

    if (! (Safe-FileExists $iconPath)) {
        $lnk = Find-ShortcutIcon $name
        if ($lnk) { $iconPath = $lnk }
    }

    if (! (Safe-FileExists $iconPath)) {
        if ($firstWord.Length -ge 3 -and $firstWord -notin $genericWords -and $appPaths) {
            $ap = $appPaths | Where-Object { $_.PSChildName.ToLower().StartsWith($firstWord) } | Select-Object -First 1
            if ($ap) {
                $apPath = Clean-Path $ap.'(default)'
                if (Safe-FileExists $apPath) { $iconPath = $apPath }
            }
        }
    }

    if (! (Safe-FileExists $iconPath) -and $app.UninstallString) {
        $uPath = Clean-Path $app.UninstallString
        if (Safe-FileExists $uPath -and $uPath -notmatch '(?i)(package cache|\\installer\\)') {
            $parent = Split-Path -Parent $uPath
            $exe = Find-BestExe $parent $name
            if ($exe) { $iconPath = $exe }
            else { $iconPath = $uPath }
        }
    }

    if (! (Safe-FileExists $iconPath)) {
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

    $iconBase64 = if (![string]::IsNullOrWhiteSpace($iconPath)) { Get-IconBase64 $iconPath } else { "" }

    if ($sizeMb -eq 0) { $sizeMb = 1.0 }

    $result += [PSCustomObject]@{
        name = $name
        version = $ver
        publisher = if ($app.Publisher) { $app.Publisher.Trim() } else { "Desconocido" }
        sizeMb = $sizeMb
        installLocation = $installLoc
        iconBase64 = $iconBase64
        uninstallString = $app.UninstallString
        id = $app.PSChildName
    }
}
$result | ConvertTo-Json -Compress
