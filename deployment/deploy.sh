#!/bin/bash

# Jiffy - Deployment Script
# Builds Next.js locally and deploys standalone output to Raspberry Pi

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error()   { echo -e "${RED}[ERROR]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    source "$SCRIPT_DIR/.env.deploy"
fi

PI_USER=${PI_USER:-"pi"}
PI_HOST=${PI_HOST:-"raspberrypi.local"}
DOMAIN_NAME=${DOMAIN_NAME:-"jiffy.example.com"}
RESTART_SERVICE=true
UPDATE_NGINX=false

show_usage() {
    echo "Usage: $0 [options]"
    echo ""
    echo "Options:"
    echo "  --no-restart      Don't restart the service after deployment"
    echo "  --update-nginx    Also update the nginx config"
    echo "  --help            Show this help message"
    echo ""
    echo "Environment (or .env.deploy): PI_USER, PI_HOST, DOMAIN_NAME"
}

while [[ $# -gt 0 ]]; do
    case $1 in
        --no-restart)    RESTART_SERVICE=false; shift ;;
        --update-nginx)  UPDATE_NGINX=true; shift ;;
        --help)          show_usage; exit 0 ;;
        *)               print_error "Unknown option: $1"; show_usage; exit 1 ;;
    esac
done

print_status "═══════════════════════════════════════════════"
print_status "  Jiffy - Deploy to Raspberry Pi"
print_status "═══════════════════════════════════════════════"
print_status "Target: $PI_USER@$PI_HOST"
print_status "═══════════════════════════════════════════════"
echo ""

# Test SSH connection
print_status "Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$PI_USER@$PI_HOST" exit 2>/dev/null; then
    print_error "Cannot connect to $PI_USER@$PI_HOST"
    exit 1
fi
print_success "Connection OK"

# ─── Build ───────────────────────────────────────────────────────────────

print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "  Building Next.js for production"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT"

print_status "Installing dependencies..."
npm install --silent

print_status "Building..."
npm run build
print_success "Build complete"

# ─── Package ─────────────────────────────────────────────────────────────

print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "  Packaging for deployment"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

DEPLOY_TMP=$(mktemp -d)
DEPLOY_ARCHIVE="$DEPLOY_TMP/jiffy-deploy.tar.gz"

# Copy standalone output
cp -r .next/standalone/* "$DEPLOY_TMP/app/"  2>/dev/null || true
cp -r .next/standalone/. "$DEPLOY_TMP/app/"  2>/dev/null || true

# Copy static assets (not included in standalone by default)
mkdir -p "$DEPLOY_TMP/app/.next/static"
cp -r .next/static/* "$DEPLOY_TMP/app/.next/static/" 2>/dev/null || true

# Copy public directory
if [ -d public ]; then
    mkdir -p "$DEPLOY_TMP/app/public"
    cp -r public/* "$DEPLOY_TMP/app/public/" 2>/dev/null || true
fi

# Create archive
cd "$DEPLOY_TMP"
COPYFILE_DISABLE=1 tar -czf "$DEPLOY_ARCHIVE" -C "$DEPLOY_TMP" app/

ARCHIVE_SIZE=$(du -h "$DEPLOY_ARCHIVE" | cut -f1)
print_success "Package created ($ARCHIVE_SIZE)"

# ─── Upload & Extract ────────────────────────────────────────────────────

print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
print_status "  Uploading to Raspberry Pi"
print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

scp -q "$DEPLOY_ARCHIVE" "$PI_USER@$PI_HOST":~/jiffy-deploy.tar.gz

print_status "Extracting on Pi..."
ssh "$PI_USER@$PI_HOST" << 'ENDSSH'
set -e

# Backup current deployment
if [ -f ~/jiffy/app/server.js ]; then
    echo "Backing up current deployment..."
    BACKUP_DIR=~/jiffy/backups/$(date +%Y%m%d_%H%M%S)
    mkdir -p "$BACKUP_DIR"
    cp -r ~/jiffy/app "$BACKUP_DIR/"

    # Keep only last 5 backups
    cd ~/jiffy/backups
    BACKUPS=$(ls -dt */ 2>/dev/null || true)
    if [ -n "$BACKUPS" ]; then
        count=$(echo "$BACKUPS" | wc -l)
        if [ "$count" -gt 5 ]; then
            echo "$BACKUPS" | tail -n +6 | xargs -r rm -rf
            echo "Cleaned old backups (kept 5 most recent)"
        fi
    fi
fi

# Extract new deployment
mkdir -p ~/jiffy
cd ~/jiffy
rm -rf app.new app.old
# The archive contains an `app/` directory; unpack it beside the live one.
mkdir -p app.new
tar -xzf ~/jiffy-deploy.tar.gz -C app.new --strip-components=1
if [ -d app ]; then
    mv app app.old
fi
mv app.new app
rm -rf app.old
rm ~/jiffy-deploy.tar.gz

echo "Deployment extracted successfully"
ENDSSH

# Clean up local temp
rm -rf "$DEPLOY_TMP"

print_success "Upload complete"

# ─── Update nginx (optional) ────────────────────────────────────────────

if [ "$UPDATE_NGINX" = true ]; then
    print_status "Updating nginx config..."
    scp -q "$SCRIPT_DIR/conf/nginx.conf" "$PI_USER@$PI_HOST":~/jiffy-nginx.conf
    ssh "$PI_USER@$PI_HOST" << 'ENDSSH'
sudo mv ~/jiffy-nginx.conf /etc/nginx/sites-available/jiffy
sudo nginx -t && sudo systemctl reload nginx
echo "nginx config updated"
ENDSSH
    print_success "nginx updated"
fi

# ─── Restart Service ─────────────────────────────────────────────────────

if [ "$RESTART_SERVICE" = true ]; then
    print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    print_status "  Restarting Service"
    print_status "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    ssh "$PI_USER@$PI_HOST" << 'ENDSSH'
sudo systemctl restart jiffy
sleep 2

STATUS=$(systemctl is-active jiffy 2>/dev/null || true)
case "$STATUS" in
    active)   echo "  jiffy: ● running" ;;
    inactive) echo "  jiffy: ○ inactive" ;;
    failed)   echo "  jiffy: ✗ failed (check: sudo journalctl -u jiffy -n 20)" ;;
    *)        echo "  jiffy: - unknown ($STATUS)" ;;
esac

# Also check nginx
NGINX_STATUS=$(systemctl is-active nginx 2>/dev/null || true)
echo "  nginx: $NGINX_STATUS"
ENDSSH

    print_success "Service restarted"
fi

# ─── Done ─────────────────────────────────────────────────────────────────

echo ""
print_status "═══════════════════════════════════════════════"
print_success "Deployment complete!"
print_status "═══════════════════════════════════════════════"
print_status "URL: https://$DOMAIN_NAME"
print_status "═══════════════════════════════════════════════"
echo ""
print_warning "Logs: ssh $PI_USER@$PI_HOST 'sudo journalctl -u jiffy -f'"
