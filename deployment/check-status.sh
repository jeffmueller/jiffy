#!/bin/bash

# Jiffy - Remote Status Checker

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status()  { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    source "$SCRIPT_DIR/.env.deploy"
fi

PI_USER=${PI_USER:-"jm"}
PI_HOST=${PI_HOST:-"192.168.4.200"}

print_status "═══════════════════════════════════════════════"
print_status "  Jiffy - Status Check"
print_status "═══════════════════════════════════════════════"
print_status "Target: $PI_USER@$PI_HOST"
print_status "═══════════════════════════════════════════════"
echo ""

print_status "Testing connection..."
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$PI_USER@$PI_HOST" exit 2>/dev/null; then
    echo -e "${RED}[ERROR]${NC} Cannot connect to $PI_USER@$PI_HOST"
    exit 1
fi
print_success "Connected"
echo ""

ssh "$PI_USER@$PI_HOST" << 'ENDSSH'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Service Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if systemctl is-active --quiet jiffy 2>/dev/null; then
    echo -e "Jiffy:      ${GREEN}● Running${NC}"
else
    echo -e "Jiffy:      ${RED}● Stopped${NC}"
fi

if systemctl is-active --quiet nginx 2>/dev/null; then
    echo -e "Nginx:      ${GREEN}● Running${NC}"
else
    echo -e "Nginx:      ${RED}● Stopped${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  System Resources${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo -e "Disk:       ${RED}${DISK_USAGE}% used${NC} ⚠"
elif [ "$DISK_USAGE" -gt 60 ]; then
    echo -e "Disk:       ${YELLOW}${DISK_USAGE}% used${NC}"
else
    echo -e "Disk:       ${GREEN}${DISK_USAGE}% used${NC}"
fi

MEM_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEM_USAGE" -gt 80 ]; then
    echo -e "Memory:     ${RED}${MEM_USAGE}% used${NC} ⚠"
elif [ "$MEM_USAGE" -gt 60 ]; then
    echo -e "Memory:     ${YELLOW}${MEM_USAGE}% used${NC}"
else
    echo -e "Memory:     ${GREEN}${MEM_USAGE}% used${NC}"
fi

LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
echo -e "CPU Load:   ${BLUE}${LOAD}${NC}"

UPTIME=$(uptime -p | sed 's/up //')
echo -e "Uptime:     ${BLUE}${UPTIME}${NC}"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  Recent Logs${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if systemctl is-active --quiet jiffy 2>/dev/null; then
    sudo journalctl -u jiffy --no-pager -n 5 2>/dev/null | tail -5
else
    echo -e "${YELLOW}  Service not running${NC}"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  SSL Certificate${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if command -v certbot &> /dev/null; then
    CERT_INFO=$(sudo certbot certificates 2>/dev/null | grep -A2 "jiffy.fsrvr.com" | grep "Expiry Date" | head -1)
    if [ -n "$CERT_INFO" ]; then
        echo -e "${GREEN}${CERT_INFO}${NC}"
    else
        echo -e "${YELLOW}No certificate found for jiffy.fsrvr.com${NC}"
    fi
else
    echo -e "${YELLOW}Certbot not installed${NC}"
fi

echo ""
ENDSSH

print_success "Status check complete!"
