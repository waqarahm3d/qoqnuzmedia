#!/bin/bash

# ================================================================
# Qoqnuz Audio Downloader - Quick Setup Script
# ================================================================

set -e

echo "=========================================="
echo "Qoqnuz Audio Downloader Integration Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running from correct directory
if [ ! -d "web" ] || [ ! -d "audio-processor" ]; then
    echo -e "${RED}Error: Please run this script from the qoqnuzmedia directory${NC}"
    exit 1
fi

echo "Step 1: Database Migration"
echo "============================="
echo ""
echo -e "${YELLOW}Please follow these steps to set up the database:${NC}"
echo "1. Go to https://app.supabase.com"
echo "2. Open your project"
echo "3. Go to SQL Editor"
echo "4. Open the file: web/supabase-migrations/001_audio_downloader.sql"
echo "5. Copy the contents and paste into SQL Editor"
echo "6. Click 'Run' to execute the migration"
echo ""
read -p "Press Enter when you have completed the database migration..."

echo ""
echo "Step 2: Configure Environment Variables"
echo "========================================="
echo ""

# Setup Next.js environment
echo -e "${GREEN}Setting up Next.js environment...${NC}"
cd web

if [ ! -f ".env.local" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "✓ Created .env.local from .env.example"
    else
        echo -e "${RED}Error: .env.example not found${NC}"
        exit 1
    fi
else
    echo "✓ .env.local already exists"
fi

echo ""
echo -e "${YELLOW}Please add these variables to web/.env.local:${NC}"
echo ""
echo "AUDIO_PROCESSOR_URL=http://localhost:8000"
echo "AUDIO_PROCESSOR_API_KEY=\$(openssl rand -hex 32)"
echo "DOWNLOAD_WHITELIST_ENABLED=false"
echo ""
read -p "Press Enter when you have updated web/.env.local..."

cd ..

# Setup Audio Processor environment
echo ""
echo -e "${GREEN}Setting up Audio Processor environment...${NC}"
cd audio-processor

if [ ! -f ".env" ]; then
    if [ -f ".env.supabase.example" ]; then
        cp .env.supabase.example .env
        echo "✓ Created .env from .env.supabase.example"
    else
        echo -e "${RED}Error: .env.supabase.example not found${NC}"
        exit 1
    fi
else
    echo "✓ .env already exists"
fi

echo ""
echo -e "${YELLOW}Please update audio-processor/.env with your Supabase credentials:${NC}"
echo ""
echo "SUPABASE_URL=https://your-project.supabase.co"
echo "SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
echo "DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:5432/postgres"
echo "AUDIO_PROCESSOR_API_KEY=<same as in web/.env.local>"
echo ""
read -p "Press Enter when you have updated audio-processor/.env..."

cd ..

echo ""
echo "Step 3: Install Dependencies"
echo "=============================="
echo ""

# Check Python
if ! command -v python3.11 &> /dev/null; then
    echo -e "${RED}Error: Python 3.11 not found. Please install Python 3.11${NC}"
    exit 1
fi

# Check FFmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${YELLOW}Warning: FFmpeg not found${NC}"
    echo "Please install FFmpeg:"
    echo "  Ubuntu/Debian: sudo apt install ffmpeg"
    echo "  macOS: brew install ffmpeg"
    read -p "Press Enter to continue..."
fi

# Setup Python virtual environment
echo -e "${GREEN}Setting up Python virtual environment...${NC}"
cd audio-processor

if [ ! -d "venv" ]; then
    python3.11 -m venv venv
    echo "✓ Created virtual environment"
fi

source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
echo "✓ Installed Python dependencies"

cd ..

echo ""
echo "Step 4: Choose Deployment Method"
echo "=================================="
echo ""
echo "1. Docker (Recommended - easiest)"
echo "2. Manual (Run services separately)"
echo ""
read -p "Enter your choice (1 or 2): " deployment_choice

if [ "$deployment_choice" = "1" ]; then
    echo ""
    echo -e "${GREEN}Starting services with Docker...${NC}"

    if ! command -v docker-compose &> /dev/null && ! command -v docker &> /dev/null; then
        echo -e "${RED}Error: Docker not found. Please install Docker first.${NC}"
        exit 1
    fi

    docker-compose -f docker-compose.integrated.yml up -d

    echo ""
    echo -e "${GREEN}✓ Services started!${NC}"
    echo ""
    echo "View logs: docker-compose -f docker-compose.integrated.yml logs -f"
    echo "Stop services: docker-compose -f docker-compose.integrated.yml down"

else
    echo ""
    echo -e "${YELLOW}Manual deployment selected.${NC}"
    echo ""
    echo "You need to start these services in separate terminals:"
    echo ""
    echo "Terminal 1 - Redis:"
    echo "  redis-server"
    echo ""
    echo "Terminal 2 - Audio Processor API:"
    echo "  cd audio-processor"
    echo "  source venv/bin/activate"
    echo "  uvicorn app.main:app --host 0.0.0.0 --port 8000"
    echo ""
    echo "Terminal 3 - Celery Worker:"
    echo "  cd audio-processor"
    echo "  source venv/bin/activate"
    echo "  celery -A app.celery_app worker --loglevel=info --concurrency=2"
    echo ""
    echo "Terminal 4 - Next.js App:"
    echo "  cd web"
    echo "  pnpm dev"
    echo ""
fi

echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo ""
echo "1. Access your admin panel: http://localhost:3000/admin"
echo "2. Click on 'Downloads' in the sidebar"
echo "3. Submit a test download"
echo "4. Monitor progress in real-time"
echo ""
echo "📚 Documentation:"
echo "  - Integration Guide: AUDIO_DOWNLOADER_INTEGRATION.md"
echo "  - Audio Processor Docs: audio-processor/README.md"
echo "  - VPS Setup: audio-processor/VPS_SETUP.md"
echo ""
echo "🐛 Troubleshooting:"
echo "  - Check logs: docker-compose -f docker-compose.integrated.yml logs -f"
echo "  - Test API: curl http://localhost:8000/health"
echo "  - Monitor Celery: http://localhost:5555 (Flower)"
echo ""
echo -e "${GREEN}Happy downloading! 🎵${NC}"
