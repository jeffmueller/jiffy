#!/bin/bash

# Jiffy - Quick Deploy (Interactive Menu)

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

if [ -f "$SCRIPT_DIR/.env.deploy" ]; then
    source "$SCRIPT_DIR/.env.deploy"
fi

PI_HOST=${PI_HOST:-"192.168.4.200"}

clear
echo -e "${CYAN}╔═══════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                               ║${NC}"
echo -e "${CYAN}║           Jiffy - Quick Deploy                ║${NC}"
echo -e "${CYAN}║                                               ║${NC}"
echo -e "${CYAN}╚═══════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Target:${NC} $PI_HOST"
echo ""
echo "What would you like to do?"
echo ""
echo -e "${GREEN}1)${NC} Deploy app                       ${BLUE}[~3 min]${NC}"
echo -e "${GREEN}2)${NC} Deploy app + update nginx        ${BLUE}[~3 min]${NC}"
echo ""
echo -e "${YELLOW}3)${NC} Check remote status"
echo -e "${YELLOW}4)${NC} View remote logs"
echo ""
echo -e "${RED}0)${NC} Exit"
echo ""
read -p "Enter your choice [0-4]: " choice

case $choice in
    1)
        echo ""
        echo -e "${CYAN}→ Deploying...${NC}"
        "$SCRIPT_DIR/deploy.sh"
        ;;
    2)
        echo ""
        echo -e "${CYAN}→ Deploying with nginx update...${NC}"
        "$SCRIPT_DIR/deploy.sh" --update-nginx
        ;;
    3)
        echo ""
        "$SCRIPT_DIR/check-status.sh"
        ;;
    4)
        echo ""
        echo -e "${CYAN}→ Connecting to view logs (Ctrl+C to exit)...${NC}"
        sleep 1
        ssh ${PI_USER:-jm}@$PI_HOST 'sudo journalctl -u jiffy -f'
        ;;
    0)
        echo "Goodbye!"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac
