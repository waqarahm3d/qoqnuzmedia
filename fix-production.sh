#!/bin/bash

# ================================================
# Qoqnuz Music - Production Quick Fix Script
# ================================================
# Run this on your VPS server to fix common issues
# Usage: bash fix-production.sh
# ================================================

echo "🔧 Qoqnuz Music - Production Quick Fix"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Navigate to project
cd /home/user/qoqnuzmedia/web || {
    echo -e "${RED}❌ Cannot find project at /home/user/qoqnuzmedia/web${NC}"
    echo "Please check the path and try again"
    exit 1
}

echo -e "${GREEN}✅ Found project directory${NC}"
echo ""

# ================================================
# 1. Pull latest changes
# ================================================
echo "📥 Step 1: Pulling latest changes from GitHub..."
cd ..
git pull origin claude/analyze-project-01P6FZXPRsTB7k6QxY8QoYFh
cd web
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# ================================================
# 2. Install dependencies
# ================================================
echo "📦 Step 2: Installing dependencies..."
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ================================================
# 3. Build the application
# ================================================
echo "🏗️  Step 3: Building application..."
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed - please check errors above${NC}"
    exit 1
fi
echo ""

# ================================================
# 4. Restart PM2
# ================================================
echo "⚙️  Step 4: Restarting PM2 process..."

# Check if qoqnuz-web exists in PM2
if pm2 list | grep -q "qoqnuz-web"; then
    echo "Restarting existing PM2 process..."
    pm2 restart qoqnuz-web
else
    echo "Starting new PM2 process..."
    pm2 start pnpm --name "qoqnuz-web" -- start
    pm2 save
fi

echo -e "${GREEN}✅ PM2 process restarted${NC}"
echo ""

# ================================================
# 5. Restart Nginx
# ================================================
echo "🌐 Step 5: Restarting Nginx..."
systemctl restart nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"
echo ""

# ================================================
# 6. Check status
# ================================================
echo "📊 Step 6: Checking status..."
echo ""
echo "PM2 Status:"
pm2 status
echo ""

echo "Nginx Status:"
systemctl status nginx --no-pager | head -n 5
echo ""

# ================================================
# 7. Test the application
# ================================================
echo "🧪 Step 7: Testing application..."
echo ""

# Wait a few seconds for app to start
sleep 3

# Test local connection
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ App responding on port 3000${NC}"
else
    echo -e "${RED}❌ App not responding on port 3000${NC}"
    echo "Check PM2 logs: pm2 logs qoqnuz-web"
fi

# Test nginx proxy
if curl -s -k https://app.qoqnuz.com > /dev/null; then
    echo -e "${GREEN}✅ App responding via Nginx (HTTPS)${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot reach app via HTTPS${NC}"
    echo "This might be normal if testing from a different network"
fi

echo ""

# ================================================
# Summary
# ================================================
echo "========================================"
echo "✅ FIXES COMPLETED"
echo "========================================"
echo ""
echo "What was fixed:"
echo "  ✅ Updated code from GitHub"
echo "  ✅ Reinstalled dependencies"
echo "  ✅ Rebuilt application"
echo "  ✅ Restarted PM2 process"
echo "  ✅ Restarted Nginx"
echo ""
echo "Next steps:"
echo "  1. Visit: https://app.qoqnuz.com"
echo "  2. Test sign in/sign up"
echo "  3. Test music playback"
echo ""
echo "If issues persist:"
echo "  • Check environment variables: cat .env.local"
echo "  • Check PM2 logs: pm2 logs qoqnuz-web"
echo "  • Check Nginx logs: tail -f /var/log/nginx/error.log"
echo ""
echo "========================================"
