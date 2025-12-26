#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "======================================================================"
echo "  Klyx Deployment Script"
echo "  Vercel (Frontend + API) + Render.com (Workers)"
echo "======================================================================"
echo -e "${NC}"

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo -e "${RED}❌ Error: vercel.json not found${NC}"
    echo "Please run this script from the project root directory"
    exit 1
fi

# Step 1: Build frontend
echo -e "${YELLOW}📦 Step 1: Building frontend...${NC}"
cd frontend

if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

echo "Building Next.js..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend built successfully${NC}"
else
    echo -e "${RED}✗ Frontend build failed${NC}"
    exit 1
fi

cd ..

# Step 2: Test backend imports
echo -e "\n${YELLOW}🔍 Step 2: Checking backend dependencies...${NC}"
cd backend

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate
pip install -q -r requirements.txt

echo -e "${GREEN}✓ Backend dependencies OK${NC}"
deactivate
cd ..

# Step 3: Commit changes (if any)
echo -e "\n${YELLOW}📝 Step 3: Committing changes...${NC}"
git add .

if git diff-index --quiet HEAD --; then
    echo "No changes to commit"
else
    echo "Changes detected, committing..."
    git commit -m "Deploy: $(date +%Y-%m-%d\ %H:%M:%S)" || echo "Commit failed or no changes"
fi

# Step 4: Deploy to Vercel
echo -e "\n${YELLOW}🚀 Step 4: Deploying to Vercel...${NC}"
echo "Choose deployment option:"
echo "  1. Deploy to production (vercel --prod)"
echo "  2. Deploy to preview (vercel)"
echo "  3. Skip Vercel deployment"
read -p "Enter choice [1-3]: " deploy_choice

case $deploy_choice in
    1)
        if command -v vercel &> /dev/null; then
            vercel --prod
            echo -e "${GREEN}✓ Deployed to Vercel production${NC}"
        else
            echo -e "${YELLOW}⚠ Vercel CLI not installed${NC}"
            echo "Install with: npm i -g vercel"
            echo "Or deploy via dashboard: https://vercel.com/dashboard"
        fi
        ;;
    2)
        if command -v vercel &> /dev/null; then
            vercel
            echo -e "${GREEN}✓ Deployed to Vercel preview${NC}"
        else
            echo -e "${YELLOW}⚠ Vercel CLI not installed${NC}"
            echo "Install with: npm i -g vercel"
        fi
        ;;
    3)
        echo "Skipping Vercel deployment"
        ;;
    *)
        echo "Invalid choice, skipping Vercel deployment"
        ;;
esac

# Step 5: Push to GitHub (triggers Render)
echo -e "\n${YELLOW}🔄 Step 5: Pushing to GitHub (triggers Render.com)...${NC}"
read -p "Push to GitHub? [y/n]: " push_choice

if [ "$push_choice" = "y" ] || [ "$push_choice" = "Y" ]; then
    git push origin main
    echo -e "${GREEN}✓ Pushed to GitHub${NC}"
    echo -e "${BLUE}ℹ Render.com will auto-deploy from GitHub push${NC}"
else
    echo "Skipped GitHub push"
fi

# Step 6: Verify deployments
echo -e "\n${YELLOW}✅ Step 6: Verifying deployments...${NC}"
sleep 5

# Check Vercel
echo "Testing Vercel API..."
if curl -s https://klyx.vercel.app/api/health | grep -q "ok"; then
    echo -e "${GREEN}✓ Vercel API is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Vercel API not responding (may still be deploying)${NC}"
fi

# Check Render (if URL provided)
echo ""
read -p "Enter Render worker URL (or press Enter to skip): " render_url

if [ ! -z "$render_url" ]; then
    echo "Testing Render worker..."
    if curl -s "$render_url/health" | grep -q "ok"; then
        echo -e "${GREEN}✓ Render worker is healthy${NC}"
    else
        echo -e "${YELLOW}⚠ Render worker not responding${NC}"
    fi
fi

# Summary
echo -e "\n${BLUE}"
echo "======================================================================"
echo "  Deployment Summary"
echo "======================================================================"
echo -e "${NC}"
echo "Frontend + API: https://klyx.vercel.app"
if [ ! -z "$render_url" ]; then
    echo "Worker: $render_url"
fi
echo ""
echo -e "${GREEN}✅ Deployment process complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Check Vercel dashboard: https://vercel.com/dashboard"
echo "  2. Check Render dashboard: https://dashboard.render.com"
echo "  3. Test user registration and login"
echo "  4. Verify screener returns results"
echo "  5. Monitor logs for any errors"
echo ""
echo -e "${BLUE}Happy deploying! 🚀${NC}"
