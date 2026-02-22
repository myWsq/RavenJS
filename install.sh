#!/bin/sh
set -e

# RavenJS Install Script
# Installs the RavenJS CLI binary

GITHUB_REPO="myWsq/RavenJS"
BINARY_NAME="raven"
INSTALL_DIR="$HOME/.local/bin"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}info${NC}: $1"
}

log_warn() {
    echo -e "${YELLOW}warn${NC}: $1"
}

log_error() {
    echo -e "${RED}error${NC}: $1" >&2
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*) echo "linux" ;;
        Darwin*) echo "darwin" ;;
        *)
            log_error "unsupported OS: $(uname -s)"
            exit 1
            ;;
    esac
}

# Detect architecture
detect_arch() {
    case "$(uname -m)" in
        x86_64|amd64) echo "x64" ;;
        arm64|aarch64) echo "arm64" ;;
        *)
            log_error "unsupported architecture: $(uname -m)"
            exit 1
            ;;
    esac
}

# Get latest stable version from GitHub Releases
get_latest_version() {
    local releases_json
    if command -v curl >/dev/null 2>&1; then
        releases_json=$(curl -sL "https://api.github.com/repos/$GITHUB_REPO/releases")
    elif command -v wget >/dev/null 2>&1; then
        releases_json=$(wget -qO- "https://api.github.com/repos/$GITHUB_REPO/releases")
    else
        log_error "neither curl nor wget is installed"
        exit 1
    fi

    echo "$releases_json" | grep '"tag_name":' |
        sed -E 's/.*"([^"]+)".*/\1/' |
        grep -v -E -- '-[a-zA-Z]' |
        head -n1 |
        sed 's/^v//'
}

# Download file
download_file() {
    local url="$1"
    local output="$2"

    if command -v curl >/dev/null 2>&1; then
        curl -sL -o "$output" "$url"
    elif command -v wget >/dev/null 2>&1; then
        wget -qO "$output" "$url"
    else
        log_error "neither curl nor wget is installed"
        exit 1
    fi
}

# Cleanup on error
cleanup() {
    if [ -n "$TEMP_FILE" ] && [ -f "$TEMP_FILE" ]; then
        rm -f "$TEMP_FILE"
    fi
}

trap cleanup EXIT

# Main
main() {
    local OS=$(detect_os)
    local ARCH=$(detect_arch)
    local VERSION="$1"

    if [ -z "$VERSION" ]; then
        log_info "fetching latest version"
        VERSION=$(get_latest_version)
        if [ -z "$VERSION" ]; then
            log_error "failed to get latest version"
            exit 1
        fi
    fi

    # Remove 'v' prefix if present
    VERSION=$(echo "$VERSION" | sed 's/^v//')

    local EXTENSION=""
    if [ "$OS" = "windows" ]; then
        EXTENSION=".exe"
    fi

    local FILE_NAME="${BINARY_NAME}-${VERSION}-${OS}-${ARCH}${EXTENSION}"
    local DOWNLOAD_URL="https://github.com/$GITHUB_REPO/releases/download/v${VERSION}/${FILE_NAME}"

    log_info "detected system: ${OS}-${ARCH}"
    log_info "installing version: v${VERSION}"
    log_info "downloading from: ${DOWNLOAD_URL}"

    # Create temp file
    TEMP_FILE=$(mktemp 2>/dev/null || mktemp -t raven)

    # Download
    download_file "$DOWNLOAD_URL" "$TEMP_FILE"

    if [ ! -s "$TEMP_FILE" ]; then
        log_error "download failed - file is empty"
        log_error "please check if version v${VERSION} exists and supports ${OS}-${ARCH}"
        exit 1
    fi

    # Create install directory
    mkdir -p "$INSTALL_DIR"

    # Install binary
    local INSTALL_PATH="$INSTALL_DIR/$BINARY_NAME"
    mv "$TEMP_FILE" "$INSTALL_PATH"
    chmod +x "$INSTALL_PATH"

    log_info "installed successfully to: ${INSTALL_PATH}"

    # Check if in PATH
    if ! echo "$PATH" | tr ':' '\n' | grep -q "^${INSTALL_DIR}$"; then
        log_warn "${INSTALL_DIR} is not in your PATH"
        log_warn "add it to your shell config (e.g., ~/.bashrc, ~/.zshrc):"
        log_warn "  export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi

    log_info "done! run '${BINARY_NAME} --help' to get started"
}

main "$@"
