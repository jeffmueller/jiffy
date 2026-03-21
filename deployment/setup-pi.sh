#!/bin/bash

# Jiffy - One-time Raspberry Pi Setup
# Creates systemd service and nginx config on the Pi.
# Prerequisites: nginx and Node.js already installed.

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
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    source "$SCRIPT_DIR/.env.deploy"
fi

PI_USER=${PI_USER:-"jm"}
PI_HOST=${PI_HOST:-"192.168.4.200"}
DOMAIN_NAME=${DOMAIN_NAME:-"jiffy.fsrvr.com"}
APP_PORT=3003

print_status "═══════════════════════════════════════════════"
print_status "  Jiffy - Raspberry Pi Setup"
print_status "═══════════════════════════════════════════════"
print_status "Target: $PI_USER@$PI_HOST"
print_status "Domain: $DOMAIN_NAME"
print_status "App port: $APP_PORT"
print_status "═══════════════════════════════════════════════"
echo ""

print_warning "This will create a systemd service and nginx config on the Pi."
read -p "Continue? (y/N): " confirm
if [[ ! $confirm =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

print_status "Connecting to Pi..."

# Upload nginx config
print_status "Uploading nginx config..."
scp -q "$SCRIPT_DIR/conf/nginx.conf" "$PI_USER@$PI_HOST":~/jiffy-nginx.conf

ssh "$PI_USER@$PI_HOST" "bash -s" << ENDSSH
set -e

echo "Creating directory structure..."
mkdir -p ~/jiffy/app
mkdir -p ~/jiffy/app/public
mkdir -p ~/jiffy/app/.next/static

# ─── Create systemd service ─────────────────────────────────────────────

echo "Creating jiffy systemd service..."
sudo tee /etc/systemd/system/jiffy.service > /dev/null << 'EOF'
[Unit]
Description=Jiffy - GIF Search
After=network.target

[Service]
Type=simple
User=$PI_USER
WorkingDirectory=/home/$PI_USER/jiffy/app
EnvironmentFile=/home/$PI_USER/jiffy/.env
Environment=NODE_ENV=production
Environment=PORT=$APP_PORT
Environment=HOSTNAME=127.0.0.1
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# ─── Install nginx config ───────────────────────────────────────────────

echo "Installing nginx config..."
sudo mv ~/jiffy-nginx.conf /etc/nginx/sites-available/jiffy

# Enable site
if [ ! -L /etc/nginx/sites-enabled/jiffy ]; then
    sudo ln -s /etc/nginx/sites-available/jiffy /etc/nginx/sites-enabled/jiffy
fi

# Test nginx config
echo "Testing nginx configuration..."
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx

# Reload systemd
sudo systemctl daemon-reload
sudo systemctl enable jiffy

echo ""
echo "Setup complete!"
echo ""
echo "Before first deploy, create ~/jiffy/.env with:"
echo "  KLIPY_APP_KEY=your_klipy_key"
echo "  GIPHY_API_KEY=your_giphy_key"
echo ""
echo "Then run deploy.sh to deploy the app."
echo ""
echo "After deploying, set up SSL:"
echo "  sudo certbot --nginx -d $DOMAIN_NAME"
ENDSSH

print_success "Pi setup complete!"
print_warning "See the output above for remaining manual steps."
