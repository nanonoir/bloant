[CmdletBinding()]
param(
    [switch]$DryRun,
    [switch]$InstallDeps
)

$ErrorActionPreference = 'Stop'
$RepoRoot = Split-Path -Parent $PSScriptRoot
$UserHome = $env:USERPROFILE
$UserHomeFwd = $UserHome -replace '\\', '/'
$OpenCodeTarget = Join-Path $UserHome '.config\opencode'
$PiTarget = Join-Path $UserHome '.pi\agent'
$AgyTarget = Join-Path $UserHome '.gemini\config'
$SkillsTarget = Join-Path $UserHome '.agents\skills'
$NpmGlobalFwd = ($env:APPDATA -replace '\\', '/') + '/npm'

function Ensure-Dir([string]$Path) {
    if (-not (Test-Path $Path)) {
        if ($DryRun) {
            Write-Host "[DryRun] mkdir $Path"
        } else {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
        }
    }
}

function Copy-Tree([string]$Source, [string]$Target) {
    Ensure-Dir $Target
    Get-ChildItem -Path $Source -Recurse -Force | ForEach-Object {
        $rel = $_.FullName.Substring($Source.Length).TrimStart('\', '/')
        $destPath = Join-Path $Target $rel
        if ($_.PSIsContainer) {
            Ensure-Dir $destPath
        } else {
            Ensure-Dir (Split-Path -Parent $destPath)
            if ($DryRun) {
                Write-Host "[DryRun] copy $rel -> $destPath"
            } else {
                Copy-Item -Path $_.FullName -Destination $destPath -Force
            }
        }
    }
}

function Expand-Template([string]$SourceFile, [string]$DestFile) {
    $content = [System.IO.File]::ReadAllText($SourceFile)
    $content = $content.Replace('{{OPENCODE_CONFIG_DIR}}', ($OpenCodeTarget -replace '\\', '/'))
    $content = $content.Replace('{{NPM_GLOBAL_BIN_DIR}}', $NpmGlobalFwd)
    $content = $content.Replace('{{SKILLS_DIR}}', ($SkillsTarget -replace '\\', '/'))
    if ($content.Contains('{{GITHUB_PERSONAL_ACCESS_TOKEN}}')) {
        $ghToken = $env:GITHUB_PERSONAL_ACCESS_TOKEN
        if (-not $ghToken) {
            Write-Warning "GITHUB_PERSONAL_ACCESS_TOKEN is not set; leaving placeholder in $DestFile"
        } else {
            $content = $content.Replace('{{GITHUB_PERSONAL_ACCESS_TOKEN}}', $ghToken)
        }
    }
    Ensure-Dir (Split-Path -Parent $DestFile)
    if ($DryRun) {
        Write-Host "[DryRun] template $SourceFile -> $DestFile"
    } else {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
        [System.IO.File]::WriteAllText($DestFile, $content, $utf8NoBom)
    }
}

Write-Host "Deploying bloant harnesses..."
Write-Host "  OpenCode -> $OpenCodeTarget"
Write-Host "  Pi       -> $PiTarget"
Write-Host "  AGY      -> $AgyTarget"
Write-Host "  Skills   -> $SkillsTarget"

# 1. OpenCode
$OcRepo = Join-Path $RepoRoot 'opencode'
foreach ($dir in @('agents', 'commands', 'opencode-quota', 'vendor')) {
    $srcDir = Join-Path $OcRepo $dir
    if (Test-Path $srcDir) {
        Copy-Tree $srcDir (Join-Path $OpenCodeTarget $dir)
    }
}
foreach ($file in @('AGENTS.md', 'package.json', 'tui-preferences.jsonc')) {
    $srcFile = Join-Path $OcRepo $file
    if (Test-Path $srcFile) {
        if ($DryRun) {
            Write-Host "[DryRun] copy $file -> $(Join-Path $OpenCodeTarget $file)"
        } else {
            Ensure-Dir $OpenCodeTarget
            Copy-Item -Path $srcFile -Destination (Join-Path $OpenCodeTarget $file) -Force
        }
    }
}
Expand-Template (Join-Path $OcRepo 'opencode.json') (Join-Path $OpenCodeTarget 'opencode.json')
Expand-Template (Join-Path $OcRepo 'cli.json') (Join-Path $OpenCodeTarget 'cli.json')
$qtSrc = Join-Path $OcRepo 'opencode-quota\quota-toast.jsonc'
if (Test-Path $qtSrc) {
    Expand-Template $qtSrc (Join-Path $OpenCodeTarget 'opencode-quota\quota-toast.jsonc')
}

# 2. Pi (preserves existing deviceId if settings.json already exists)
$PiRepo = Join-Path $RepoRoot 'pi'
foreach ($dir in @('agents', 'extensions', 'prompts', 'modes', 'themes')) {
    $srcDir = Join-Path $PiRepo $dir
    if (Test-Path $srcDir) {
        Copy-Tree $srcDir (Join-Path $PiTarget $dir)
    }
}
foreach ($file in @('AGENTS.md', 'APPEND_SYSTEM.md', 'mcp.json', 'pi-atelier.json', 'profile-cycler.json', 'subscription-panel.json')) {
    $srcFile = Join-Path $PiRepo $file
    if (Test-Path $srcFile) {
        if ($DryRun) {
            Write-Host "[DryRun] copy $file -> $(Join-Path $PiTarget $file)"
        } else {
            Ensure-Dir $PiTarget
            Copy-Item -Path $srcFile -Destination (Join-Path $PiTarget $file) -Force
        }
    }
}
$piSettingsSrc = Join-Path $PiRepo 'settings.json'
$piSettingsDst = Join-Path $PiTarget 'settings.json'
if ($DryRun) {
    Write-Host "[DryRun] sync settings.json -> $piSettingsDst (preserving local deviceId if present)"
} else {
    Ensure-Dir $PiTarget
    $newSettings = Get-Content $piSettingsSrc -Raw -Encoding UTF8 | ConvertFrom-Json
    if (Test-Path $piSettingsDst) {
        try {
            $oldSettings = Get-Content $piSettingsDst -Raw -Encoding UTF8 | ConvertFrom-Json
            if ($oldSettings.deviceId) {
                $newSettings | Add-Member -NotePropertyName 'deviceId' -NotePropertyValue $oldSettings.deviceId -Force
            }
        } catch {}
    }
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    [System.IO.File]::WriteAllText($piSettingsDst, ($newSettings | ConvertTo-Json -Depth 10) + "`n", $utf8NoBom)
}

# 3. Antigravity CLI (preserves config.json, hooks.json, and projects/)
$AgyRepo = Join-Path $RepoRoot 'agy'
if (Test-Path $AgyRepo) {
    foreach ($sub in @('agents', 'skills')) {
        $agySub = Join-Path $AgyRepo $sub
        if (Test-Path $agySub) {
            Copy-Tree $agySub (Join-Path $AgyTarget $sub)
        }
    }
    foreach ($file in @('AGENTS.md')) {
        $srcFile = Join-Path $AgyRepo $file
        if (Test-Path $srcFile) {
            if ($DryRun) {
                Write-Host "[DryRun] copy $file -> $(Join-Path $AgyTarget $file)"
            } else {
                Ensure-Dir $AgyTarget
                Copy-Item -Path $srcFile -Destination (Join-Path $AgyTarget $file) -Force
            }
        }
    }
    foreach ($tpl in @('skills.json', 'mcp_config.json')) {
        $srcTpl = Join-Path $AgyRepo $tpl
        if (Test-Path $srcTpl) {
            Expand-Template $srcTpl (Join-Path $AgyTarget $tpl)
        }
    }
    $slSrc = Join-Path $AgyRepo 'statusline.mjs'
    $AgyCliDir = Join-Path $UserHome '.gemini\antigravity-cli'
    $slDst = Join-Path $AgyCliDir 'statusline.mjs'
    if (Test-Path $slSrc) {
        if ($DryRun) {
            Write-Host "[DryRun] copy statusline.mjs -> $slDst (and enable statusLine in settings.json)"
        } else {
            Ensure-Dir $AgyCliDir
            Copy-Item -Path $slSrc -Destination $slDst -Force
            $agySettingsPath = Join-Path $AgyCliDir 'settings.json'
            $agySettings = if (Test-Path $agySettingsPath) { Get-Content $agySettingsPath -Raw -Encoding UTF8 | ConvertFrom-Json } else { [pscustomobject]@{} }
            $slCfg = [pscustomobject]@{
                type = 'command'
                command = "node $($slDst -replace '\\', '/')"
                enabled = $true
                padding = 0
                stack_with_default = $false
            }
            $agySettings | Add-Member -NotePropertyName 'statusLine' -NotePropertyValue $slCfg -Force
            $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
            [System.IO.File]::WriteAllText($agySettingsPath, ($agySettings | ConvertTo-Json -Depth 10) + "`n", $utf8NoBom)
        }
    }
}

# 4. Skills
Copy-Tree (Join-Path $RepoRoot 'skills') $SkillsTarget

# 4. Optional dependency install
if ($InstallDeps -and -not $DryRun) {
    Write-Host "Installing OpenCode root dependencies..."
    Push-Location $OpenCodeTarget
    try { npm install } finally { Pop-Location }
}

Write-Host "Done. Existing secrets, auth files, and sessions were not modified."
