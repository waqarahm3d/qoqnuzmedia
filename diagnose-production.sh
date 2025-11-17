#!/bin/bash

# ================================================
# Qoqnuz Music - Production Diagnostic Script
# ================================================
# Run this on your VPS server to diagnose issues
# Usage: bash diagnose-production.sh
# ================================================

echo "🔍 Qoqnuz Music - Production Diagnostic Report"
echo "================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track issues
ISSUES_FOUND=0

# ================================================
# 1. Check if we're in the right directory
# ================================================
echo "📁 Checking project directory..."
if [ ! -d "/home/user/qoqnuzmedia/web" ]; then
    echo -e "${RED}❌ Project not found at /home/user/qoqnuzmedia/web${NC}"
    echo "   Please adjust the path or clone the project first"
    ((ISSUES_FOUND++))
else
    echo -e "${GREEN}✅ Project directory found${NC}"
fi

cd /home/user/qoqnuzmedia/web 2>/dev/null || {
    echo -e "${RED}❌ Cannot navigate to project directory${NC}"
    exit 1
}

echo ""

# ================================================
# 2. Check Node.js and pnpm
# ================================================
echo "🔧 Checking Node.js and pnpm..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not installed${NC}"
    ((ISSUES_FOUND++))
fi

if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✅ pnpm: $PNPM_VERSION${NC}"
else
    echo -e "${RED}❌ pnpm not installed${NC}"
    ((ISSUES_FOUND++))
fi

echo ""

# ================================================
# 3. Check PM2 status
# ================================================
echo "⚙️  Checking PM2 process..."
if command -v pm2 &> /dev/null; then
    echo -e "${GREEN}✅ PM2 installed${NC}"
    echo ""
    pm2 list
    echo ""

    # Check if qoqnuz-web is running
    if pm2 list | grep -q "qoqnuz-web"; then
        if pm2 list | grep "qoqnuz-web" | grep -q "online"; then
            echo -e "${GREEN}✅ qoqnuz-web is ONLINE${NC}"
        else
            echo -e "${RED}❌ qoqnuz-web is NOT ONLINE${NC}"
            echo "   Run: pm2 restart qoqnuz-web"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${RED}❌ qoqnuz-web not found in PM2${NC}"
        echo "   Run: pm2 start pnpm --name \"qoqnuz-web\" -- start"
        ((ISSUES_FOUND++))
    fi
else
    echo -e "${RED}❌ PM2 not installed${NC}"
    ((ISSUES_FOUND++))
fi

echo ""

# ================================================
# 4. Check Environment Variables
# ================================================
echo "🔐 Checking environment variables..."
if [ -f ".env.local" ]; then
    echo -e "${GREEN}✅ .env.local file exists${NC}"
    echo ""
    echo "Environment variables present:"

    # Check critical env vars
    if grep -q "NEXT_PUBLIC_SUPABASE_URL" .env.local; then
        URL=$(grep "NEXT_PUBLIC_SUPABASE_URL" .env.local | cut -d'=' -f2)
        if [ "$URL" != "https://your-project.supabase.co" ] && [ -n "$URL" ]; then
            echo -e "${GREEN}  ✅ NEXT_PUBLIC_SUPABASE_URL: Set${NC}"
        else
            echo -e "${RED}  ❌ NEXT_PUBLIC_SUPABASE_URL: Not configured${NC}"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${RED}  ❌ NEXT_PUBLIC_SUPABASE_URL: Missing${NC}"
        ((ISSUES_FOUND++))
    fi

    if grep -q "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local; then
        KEY=$(grep "NEXT_PUBLIC_SUPABASE_ANON_KEY" .env.local | cut -d'=' -f2)
        if [ "$KEY" != "your-anon-key-here" ] && [ -n "$KEY" ]; then
            echo -e "${GREEN}  ✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Set${NC}"
        else
            echo -e "${RED}  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: Not configured${NC}"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${RED}  ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: Missing${NC}"
        ((ISSUES_FOUND++))
    fi

    if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env.local; then
        KEY=$(grep "SUPABASE_SERVICE_ROLE_KEY" .env.local | cut -d'=' -f2)
        if [ "$KEY" != "your-service-role-key-here" ] && [ -n "$KEY" ]; then
            echo -e "${GREEN}  ✅ SUPABASE_SERVICE_ROLE_KEY: Set${NC}"
        else
            echo -e "${RED}  ❌ SUPABASE_SERVICE_ROLE_KEY: Not configured${NC}"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${RED}  ❌ SUPABASE_SERVICE_ROLE_KEY: Missing${NC}"
        ((ISSUES_FOUND++))
    fi

    if grep -q "R2_ACCESS_KEY_ID" .env.local; then
        KEY=$(grep "R2_ACCESS_KEY_ID" .env.local | cut -d'=' -f2)
        if [ "$KEY" != "your-r2-access-key-id" ] && [ -n "$KEY" ]; then
            echo -e "${GREEN}  ✅ R2_ACCESS_KEY_ID: Set${NC}"
        else
            echo -e "${RED}  ❌ R2_ACCESS_KEY_ID: Not configured${NC}"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${RED}  ❌ R2_ACCESS_KEY_ID: Missing${NC}"
        ((ISSUES_FOUND++))
    fi

    if grep -q "R2_SECRET_ACCESS_KEY" .env.local; then
        KEY=$(grep "R2_SECRET_ACCESS_KEY" .env.local | cut -d'=' -f2)
        if [ "$KEY" != "your-r2-secret-access-key" ] && [ -n "$KEY" ]; then
            echo -e "${GREEN}  ✅ R2_SECRET_ACCESS_KEY: Set${NC}"
        else
            echo -e "${RED}  ❌ R2_SECRET_ACCESS_KEY: Not configured${NC}"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${RED}  ❌ R2_SECRET_ACCESS_KEY: Missing${NC}"
        ((ISSUES_FOUND++))
    fi

    if grep -q "NEXT_PUBLIC_APP_URL" .env.local; then
        URL=$(grep "NEXT_PUBLIC_APP_URL" .env.local | cut -d'=' -f2)
        if [ -n "$URL" ]; then
            echo -e "${GREEN}  ✅ NEXT_PUBLIC_APP_URL: $URL${NC}"
        else
            echo -e "${YELLOW}  ⚠️  NEXT_PUBLIC_APP_URL: Not set${NC}"
            echo "     This should be: https://app.qoqnuz.com"
            ((ISSUES_FOUND++))
        fi
    else
        echo -e "${YELLOW}  ⚠️  NEXT_PUBLIC_APP_URL: Missing${NC}"
        echo "     Add: NEXT_PUBLIC_APP_URL=https://app.qoqnuz.com"
        ((ISSUES_FOUND++))
    fi

else
    echo -e "${RED}❌ .env.local file NOT FOUND${NC}"
    echo "   You must create this file with your credentials"
    ((ISSUES_FOUND++))
fi

echo ""

# ================================================
# 5. Check if build exists
# ================================================
echo "🏗️  Checking Next.js build..."
if [ -d ".next" ]; then
    echo -e "${GREEN}✅ .next build directory exists${NC}"
    BUILD_TIME=$(stat -c %y .next 2>/dev/null || stat -f "%Sm" .next 2>/dev/null || echo "unknown")
    echo "   Last built: $BUILD_TIME"
else
    echo -e "${RED}❌ .next build directory NOT FOUND${NC}"
    echo "   Run: pnpm build"
    ((ISSUES_FOUND++))
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found${NC}"
else
    echo -e "${RED}❌ package.json NOT FOUND${NC}"
    ((ISSUES_FOUND++))
fi

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules found${NC}"
else
    echo -e "${RED}❌ node_modules NOT FOUND${NC}"
    echo "   Run: pnpm install"
    ((ISSUES_FOUND++))
fi

echo ""

# ================================================
# 6. Check Nginx
# ================================================
echo "🌐 Checking Nginx..."
if command -v nginx &> /dev/null; then
    echo -e "${GREEN}✅ Nginx installed${NC}"

    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Nginx is running${NC}"
    else
        echo -e "${RED}❌ Nginx is NOT running${NC}"
        echo "   Run: systemctl start nginx"
        ((ISSUES_FOUND++))
    fi

    if [ -f "/etc/nginx/sites-available/qoqnuz" ]; then
        echo -e "${GREEN}✅ Nginx config exists${NC}"
    else
        echo -e "${RED}❌ Nginx config NOT FOUND${NC}"
        echo "   Create config at: /etc/nginx/sites-available/qoqnuz"
        ((ISSUES_FOUND++))
    fi

    if [ -L "/etc/nginx/sites-enabled/qoqnuz" ]; then
        echo -e "${GREEN}✅ Nginx config enabled${NC}"
    else
        echo -e "${RED}❌ Nginx config NOT ENABLED${NC}"
        echo "   Run: ln -s /etc/nginx/sites-available/qoqnuz /etc/nginx/sites-enabled/"
        ((ISSUES_FOUND++))
    fi

    nginx -t 2>&1 | grep -q "successful" && echo -e "${GREEN}✅ Nginx config is valid${NC}" || {
        echo -e "${RED}❌ Nginx config has errors${NC}"
        echo "   Run: nginx -t"
        ((ISSUES_FOUND++))
    }
else
    echo -e "${RED}❌ Nginx not installed${NC}"
    ((ISSUES_FOUND++))
fi

echo ""

# ================================================
# 7. Check Ports
# ================================================
echo "🔌 Checking ports..."
if command -v lsof &> /dev/null; then
    if lsof -i :3000 &> /dev/null; then
        echo -e "${GREEN}✅ Port 3000 is in use (app running)${NC}"
        PROCESS=$(lsof -i :3000 | tail -n 1 | awk '{print $1}')
        echo "   Process: $PROCESS"
    else
        echo -e "${RED}❌ Port 3000 is NOT in use${NC}"
        echo "   The app is not running on port 3000"
        ((ISSUES_FOUND++))
    fi
else
    echo -e "${YELLOW}⚠️  lsof not installed, cannot check ports${NC}"
fi

echo ""

# ================================================
# 8. Check PM2 Logs (last 20 lines)
# ================================================
echo "📋 Recent PM2 logs (last 20 lines)..."
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "qoqnuz-web"; then
        echo "----------------------------------------"
        pm2 logs qoqnuz-web --lines 20 --nostream
        echo "----------------------------------------"
    fi
fi

echo ""

# ================================================
# 9. Check SSL Certificate
# ================================================
echo "🔒 Checking SSL certificate..."
if [ -d "/etc/letsencrypt/live/app.qoqnuz.com" ]; then
    echo -e "${GREEN}✅ SSL certificate exists${NC}"
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in /etc/letsencrypt/live/app.qoqnuz.com/cert.pem 2>/dev/null | cut -d= -f2)
    if [ -n "$CERT_EXPIRY" ]; then
        echo "   Expires: $CERT_EXPIRY"
    fi
else
    echo -e "${YELLOW}⚠️  SSL certificate not found${NC}"
    echo "   Run: certbot --nginx -d app.qoqnuz.com"
fi

echo ""

# ================================================
# 10. Check Git status
# ================================================
echo "📦 Checking Git repository..."
if [ -d "../.git" ]; then
    cd ..
    CURRENT_BRANCH=$(git branch --show-current 2>/dev/null)
    echo -e "${GREEN}✅ Git repository found${NC}"
    echo "   Current branch: $CURRENT_BRANCH"

    if git status | grep -q "behind"; then
        echo -e "${YELLOW}   ⚠️  Local branch is behind remote${NC}"
        echo "      Run: git pull"
    fi
    cd web
else
    echo -e "${YELLOW}⚠️  Not a git repository${NC}"
fi

echo ""

# ================================================
# Summary
# ================================================
echo "================================================"
echo "📊 DIAGNOSTIC SUMMARY"
echo "================================================"

if [ $ISSUES_FOUND -eq 0 ]; then
    echo -e "${GREEN}✅ No issues found! Your setup looks good.${NC}"
    echo ""
    echo "If you're still experiencing issues, check:"
    echo "  1. Browser console for JavaScript errors"
    echo "  2. Supabase dashboard for database errors"
    echo "  3. R2 bucket accessibility"
else
    echo -e "${RED}❌ Found $ISSUES_FOUND issue(s) that need attention${NC}"
    echo ""
    echo "Please review the errors above and fix them."
    echo ""
    echo "Common fixes:"
    echo "  1. Configure .env.local with your credentials"
    echo "  2. Run: pnpm install && pnpm build"
    echo "  3. Run: pm2 restart qoqnuz-web"
    echo "  4. Run: systemctl restart nginx"
fi

echo ""
echo "================================================"
echo "For detailed logs, run:"
echo "  • PM2 logs: pm2 logs qoqnuz-web"
echo "  • Nginx errors: tail -f /var/log/nginx/error.log"
echo "  • System logs: journalctl -u nginx -f"
echo "================================================"
