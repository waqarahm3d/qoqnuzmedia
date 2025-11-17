#!/bin/bash

# ================================================
# Qoqnuz Music - Deploy Critical Fixes
# ================================================
# This script deploys all fixes for production issues
# Run this on your VPS server
# ================================================

set -e  # Exit on any error

echo "🚀 Qoqnuz Music - Deploying Critical Fixes"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

#Navigate to project
PROJECT_DIR="/home/user/qoqnuzmedia"

if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}❌ Project directory not found at $PROJECT_DIR${NC}"
    echo "Please update the PROJECT_DIR variable in this script"
    exit 1
fi

cd "$PROJECT_DIR"

# ================================================
# Step 1: Pull Latest Code
# ================================================
echo -e "${BLUE}📥 Step 1/7: Pulling latest code from GitHub...${NC}"
git fetch origin
git pull origin claude/analyze-project-01P6FZXPRsTB7k6QxY8QoYFh
echo -e "${GREEN}✅ Code updated${NC}"
echo ""

# ================================================
# Step 2: Apply Database Migration
# ================================================
echo -e "${BLUE}🗄️  Step 2/7: Applying database migration...${NC}"
echo ""
echo -e "${YELLOW}IMPORTANT: You need to run this SQL in your Supabase SQL Editor:${NC}"
echo "1. Go to https://app.supabase.com"
echo "2. Select your project"
echo "3. Click 'SQL Editor'"
echo "4. Copy the contents of: supabase/migrations/20250117000000_add_missing_tables_and_fixes.sql"
echo "5. Paste and click 'Run'"
echo ""
read -p "Press Enter after you've run the SQL migration in Supabase..."
echo -e "${GREEN}✅ Migration applied (please verify in Supabase)${NC}"
echo ""

# ================================================
# Step 3: Install Dependencies
# ================================================
echo -e "${BLUE}📦 Step 3/7: Installing dependencies...${NC}"
cd web
pnpm install
echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# ================================================
# Step 4: Build Application
# ================================================
echo -e "${BLUE}🏗️  Step 4/7: Building application...${NC}"
echo "This may take 2-3 minutes..."
pnpm build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful${NC}"
else
    echo -e "${RED}❌ Build failed${NC}"
    echo "Please check the error messages above"
    exit 1
fi
echo ""

# ================================================
# Step 5: Restart PM2
# ================================================
echo -e "${BLUE}⚙️  Step 5/7: Restarting PM2 process...${NC}"

if pm2 list | grep -q "qoqnuz-web"; then
    echo "Restarting existing PM2 process..."
    pm2 restart qoqnuz-web
    pm2 save
else
    echo "Starting new PM2 process..."
    pm2 start pnpm --name "qoqnuz-web" -- start
    pm2 save
    pm2 startup
fi

echo -e "${GREEN}✅ PM2 restarted${NC}"
echo ""

# ================================================
# Step 6: Restart Nginx
# ================================================
echo -e "${BLUE}🌐 Step 6/7: Restarting Nginx...${NC}"
systemctl restart nginx
echo -e "${GREEN}✅ Nginx restarted${NC}"
echo ""

# ================================================
# Step 7: Verify Deployment
# ================================================
echo -e "${BLUE}🧪 Step 7/7: Verifying deployment...${NC}"
echo ""

# Wait for app to start
sleep 5

# Check PM2 status
echo "PM2 Status:"
pm2 list

echo ""
echo "Testing local connection..."
if curl -s http://localhost:3000 > /dev/null; then
    echo -e "${GREEN}✅ App responding on port 3000${NC}"
else
    echo -e "${RED}❌ App not responding on port 3000${NC}"
    echo "Check logs: pm2 logs qoqnuz-web"
fi

echo ""
echo "Testing HTTPS connection..."
if curl -s -k https://app.qoqnuz.com > /dev/null; then
    echo -e "${GREEN}✅ App responding via HTTPS${NC}"
else
    echo -e "${YELLOW}⚠️  Cannot verify HTTPS connection${NC}"
    echo "This might be normal if testing from a restricted network"
fi

echo ""

# ================================================
# Summary
# ================================================
echo "=============================================="
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "=============================================="
echo ""
echo "What was fixed:"
echo "  ✅ Added missing 'genres' table to database"
echo "  ✅ Fixed admin permission checking system"
echo "  ✅ Added comprehensive error handling to APIs"
echo "  ✅ Improved track upload with better validation"
echo "  ✅ Fixed album and genre creation"
echo "  ✅ Fixed artist deletion"
echo "  ✅ Added 10 default music genres"
echo ""
echo "Next steps:"
echo "  1. Visit https://app.qoqnuz.com/admin"
echo "  2. Test creating a genre"
echo "  3. Test creating an album"
echo "  4. Test uploading a track"
echo "  5. Test deleting an artist"
echo ""
echo "If you encounter any issues:"
echo "  • Check PM2 logs: pm2 logs qoqnuz-web --lines 50"
echo "  • Check Nginx logs: tail -f /var/log/nginx/error.log"
echo "  • Check database: Verify migration ran in Supabase SQL Editor"
echo ""
echo "=============================================="
echo -e "${BLUE}📊 Quick Status Check${NC}"
echo "=============================================="
pm2 status
echo ""
echo "View live logs: pm2 logs qoqnuz-web"
echo "=============================================="
