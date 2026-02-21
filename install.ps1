# RavenJS Install Script (PowerShell)
# Installs the RavenJS CLI binary on Windows

$ErrorActionPreference = "Stop"

$GitHubRepo = "ravenjs/ravenjs"
$BinaryName = "raven"
$InstallDir = Join-Path $env:LOCALAPPDATA "raven"

function Log-Info {
    param([string]$Message)
    Write-Host "info: $Message" -ForegroundColor Green
}

function Log-Warn {
    param([string]$Message)
    Write-Host "warn: $Message" -ForegroundColor Yellow
}

function Log-Error {
    param([string]$Message)
    Write-Host "error: $Message" -ForegroundColor Red
    exit 1
}

# Detect OS
function Detect-OS {
    if ($env:OS -eq "Windows_NT") {
        return "windows"
    }
    Log-Error "unsupported OS: $($env:OS)"
}

# Detect architecture
function Detect-Arch {
    $arch = [System.Environment]::GetEnvironmentVariable("PROCESSOR_ARCHITECTURE")
    switch ($arch) {
        "AMD64" { return "x64" }
        "ARM64" { return "arm64" }
        default { Log-Error "unsupported architecture: $arch" }
    }
}

# Get latest version from GitHub Releases
function Get-LatestVersion {
    try {
        $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$GitHubRepo/releases/latest"
        return $response.tag_name
    }
    catch {
        Log-Error "failed to get latest version: $_"
    }
}

# Cleanup on error
$TempFile = $null
function Cleanup {
    if ($TempFile -and (Test-Path $TempFile)) {
        Remove-Item $TempFile -Force -ErrorAction SilentlyContinue
    }
}

# Main
function Main {
    param([string]$Version)

    try {
        $OS = Detect-OS
        $Arch = Detect-Arch

        if (-not $Version) {
            Log-Info "fetching latest version"
            $Version = Get-LatestVersion
            if (-not $Version) {
                Log-Error "failed to get latest version"
            }
        }

        # Remove 'v' prefix if present
        $Version = $Version -replace '^v', ''

        $Extension = if ($OS -eq "windows") { ".exe" } else { "" }
        $FileName = "$BinaryName-$Version-$OS-$Arch$Extension"
        $DownloadUrl = "https://github.com/$GitHubRepo/releases/download/v$Version/$FileName"

        Log-Info "detected system: $OS-$Arch"
        Log-Info "installing version: v$Version"
        Log-Info "downloading from: $DownloadUrl"

        # Create temp file
        $TempFile = [System.IO.Path]::GetTempFileName()

        # Download
        try {
            Invoke-WebRequest -Uri $DownloadUrl -OutFile $TempFile -UseBasicParsing
        }
        catch {
            Log-Error "download failed: $_"
        }

        if ((Get-Item $TempFile).Length -eq 0) {
            Log-Error "download failed - file is empty"
            Log-Error "please check if version v$Version exists and supports $OS-$Arch"
        }

        # Create install directory
        if (-not (Test-Path $InstallDir)) {
            New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
        }

        # Install binary
        $InstallPath = Join-Path $InstallDir "$BinaryName.exe"
        Move-Item -Path $TempFile -Destination $InstallPath -Force
        $TempFile = $null  # Clear so cleanup doesn't remove it

        Log-Info "installed successfully to: $InstallPath"

        # Check if in PATH
        $PathDirs = $env:PATH -split ';'
        if ($PathDirs -notcontains $InstallDir) {
            Log-Warn "$InstallDir is not in your PATH"
            Log-Warn "add it to your system PATH or user PATH environment variable"
            Log-Warn "you can add it for the current session with:"
            Log-Warn "  `$env:PATH += `";$InstallDir`""
        }

        Log-Info "done! run '$BinaryName --help' to get started"
    }
    finally {
        Cleanup
    }
}

Main @args
