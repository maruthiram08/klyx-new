# Railway Alternatives for Background Workers

**Use Case:** Deploy Flask worker app for long-running tasks (stock enrichment, database population)

---

## Comparison Table

| Platform | Type | Free Tier | Pros | Cons | Best For |
|----------|------|-----------|------|------|----------|
| **Render** | Cloud PaaS | ✅ 750 hrs/month | Easy setup, auto-deploy, free Postgres | Spins down after 15 min idle, slow cold start | Free hobby projects |
| **Fly.io** | Cloud PaaS | ✅ 3 VMs free | Fast, global edge, no sleep | Complex config, limited free tier | Production apps |
| **Koyeb** | Cloud PaaS | ✅ 1 free service | Fast, never sleeps, Europe-based | New platform, smaller community | European users |
| **Cyclic** | Serverless | ✅ Unlimited | Serverless, never sleeps, DynamoDB | 10-sec timeout, no long tasks | APIs only (won't work for us) |
| **Heroku** | Cloud PaaS | ❌ No free tier | Mature, reliable | $7/month minimum, expensive | Legacy apps |
| **Self-hosted (VPS)** | Open Source | Varies | Full control, cheap ($5/mo) | Manual setup, maintenance | DIY enthusiasts |

---

## Recommended Alternatives

### 🥇 **Option 1: Render.com** (BEST FREE ALTERNATIVE)

**Why it's great:**
- ✅ **750 hours/month free** (enough for 24/7 operation)
- ✅ Auto-deploys from GitHub (like Railway)
- ✅ Free Postgres database (shared with Vercel Postgres possible)
- ✅ Easy configuration (render.yaml or dashboard)
- ✅ Built-in cron jobs
- ✅ Logs and monitoring included

**Limitations:**
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ Cold start ~30 seconds (first request after sleep)
- ⚠️ Free tier is slower (shared CPU)

**Setup Guide:**

**1. Create `render.yaml`:**

```yaml
# render.yaml (in project root)
services:
  # Background worker
  - type: web
    name: klyx-worker
    env: python
    buildCommand: pip install -r backend/requirements.txt
    startCommand: gunicorn --workers 4 --bind 0.0.0.0:$PORT --timeout 300 --chdir backend worker_app:app
    envVars:
      - key: POSTGRES_URL
        sync: false  # Set in Render dashboard
      - key: WORKER_API_KEY
        generateValue: true  # Auto-generate
      - key: VERCEL_API_URL
        value: https://klyx.vercel.app
    healthCheckPath: /health
```

**2. Deploy to Render:**

```bash
# Option A: Via Dashboard
# 1. Go to https://render.com
# 2. New → Web Service
# 3. Connect GitHub repo: maruthiram08/klyx-new
# 4. Render auto-detects render.yaml
# 5. Click "Create Web Service"

# Option B: Via render.yaml (push to GitHub)
git add render.yaml
git commit -m "Add Render configuration"
git push
# Render auto-deploys on push
```

**3. Configure Environment Variables:**
- Dashboard → klyx-worker → Environment
- Add `POSTGRES_URL` (copy from Vercel)
- `WORKER_API_KEY` is auto-generated

**4. Set Up Cron Jobs:**

Render has built-in cron support:

```yaml
# Add to render.yaml
services:
  # Daily refresh cron job
  - type: cron
    name: daily-refresh
    env: python
    schedule: "0 2 * * *"  # 2 AM daily
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python backend/database/enrich_missing_fields.py --batch-size 100
    envVars:
      - key: POSTGRES_URL
        sync: false

  # Weekly full enrichment
  - type: cron
    name: weekly-enrichment
    env: python
    schedule: "0 3 * * 0"  # 3 AM Sunday
    buildCommand: pip install -r backend/requirements.txt
    startCommand: python backend/database/enrich_missing_fields.py --full
    envVars:
      - key: POSTGRES_URL
        sync: false
```

**5. Keep-Alive Workaround:**

To prevent spin-down, use free uptime monitoring:

```bash
# Use UptimeRobot (free tier: 50 monitors)
# 1. Go to https://uptimerobot.com
# 2. Add Monitor
# 3. URL: https://klyx-worker.onrender.com/health
# 4. Interval: 5 minutes
# This pings your worker every 5 min, keeping it awake
```

**Cost:** **$0/month** (free tier)

---

### 🥈 **Option 2: Fly.io** (BEST FOR PRODUCTION)

**Why it's great:**
- ✅ **3 shared-CPU VMs free** (256MB RAM each)
- ✅ Never spins down (always-on)
- ✅ Global edge network (fast in India)
- ✅ Docker-based (full control)
- ✅ Free Postgres (3GB storage)
- ✅ No cold starts

**Limitations:**
- ⚠️ More complex setup (Dockerfile required)
- ⚠️ CLI-based workflow (less beginner-friendly)
- ⚠️ Free tier limits: 160GB bandwidth/month

**Setup Guide:**

**1. Install Fly CLI:**

```bash
# macOS
brew install flyctl

# Linux
curl -L https://fly.io/install.sh | sh

# Windows
iwr https://fly.io/install.ps1 -useb | iex

# Login
flyctl auth login
```

**2. Create Dockerfile:**

```dockerfile
# Dockerfile (in project root)
FROM python:3.11-slim

WORKDIR /app

# Copy backend files
COPY backend/ ./backend/
COPY backend/requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt gunicorn

# Expose port
EXPOSE 8080

# Start worker app
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:8080", "--timeout", "300", "--chdir", "backend", "worker_app:app"]
```

**3. Initialize Fly App:**

```bash
cd klyx-new

# Initialize (creates fly.toml)
flyctl launch

# Choose:
# - App name: klyx-worker
# - Region: Mumbai (bom) or Singapore (sin)
# - Postgres: No (we'll use Vercel Postgres)
# - Deploy: No (configure first)
```

**4. Configure `fly.toml`:**

```toml
# fly.toml (auto-generated, then edit)
app = "klyx-worker"
primary_region = "bom"  # Mumbai

[build]
  dockerfile = "Dockerfile"

[env]
  PORT = "8080"
  VERCEL_API_URL = "https://klyx.vercel.app"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false  # IMPORTANT: Don't auto-stop
  auto_start_machines = true
  
  [http_service.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

[[services]]
  protocol = "tcp"
  internal_port = 8080

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "GET"
    path = "/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256  # Free tier
```

**5. Set Secrets:**

```bash
# Set environment variables
flyctl secrets set POSTGRES_URL="postgresql://..."
flyctl secrets set WORKER_API_KEY="$(openssl rand -hex 16)"

# Verify
flyctl secrets list
```

**6. Deploy:**

```bash
# Deploy to Fly.io
flyctl deploy

# Check status
flyctl status

# View logs
flyctl logs

# Open in browser
flyctl open
```

**7. Set Up Cron (via Fly Machines):**

```bash
# Create cron machine for daily refresh
flyctl m run \
  --region bom \
  --vm-size shared-cpu-1x \
  --schedule daily \
  --env POSTGRES_URL="postgresql://..." \
  python backend/database/enrich_missing_fields.py --batch-size 100
```

**Cost:** **$0/month** (within free tier limits)

---

### 🥉 **Option 3: Koyeb** (EUROPEAN ALTERNATIVE)

**Why it's great:**
- ✅ **1 free web service** (never sleeps!)
- ✅ Auto-deploy from GitHub
- ✅ Fast in Europe (Frankfurt, Paris)
- ✅ Simple setup like Render

**Limitations:**
- ⚠️ Limited free tier (1 service only)
- ⚠️ Slower in India (Europe-based)
- ⚠️ Newer platform (smaller community)

**Setup Guide:**

```bash
# 1. Go to https://koyeb.com
# 2. Sign up with GitHub
# 3. New App → GitHub
# 4. Select: maruthiram08/klyx-new
# 5. Configure:
#    - Build command: pip install -r backend/requirements.txt
#    - Run command: gunicorn --workers 2 --bind 0.0.0.0:$PORT --chdir backend worker_app:app
#    - Port: 8000
# 6. Environment Variables:
#    - POSTGRES_URL
#    - WORKER_API_KEY
# 7. Deploy
```

**Cost:** **$0/month** (free tier)

---

### 🛠️ **Option 4: Self-Hosted on VPS** (FULL CONTROL)

**Best VPS Providers:**

| Provider | Price | Specs | Location |
|----------|-------|-------|----------|
| **DigitalOcean** | $6/mo | 1 vCPU, 1GB RAM, 25GB SSD | Bangalore datacenter |
| **Hetzner** | €4.5/mo (~$5) | 1 vCPU, 2GB RAM, 20GB SSD | Germany (fast to India) |
| **Linode (Akamai)** | $5/mo | 1 vCPU, 1GB RAM, 25GB SSD | Mumbai datacenter |
| **Vultr** | $6/mo | 1 vCPU, 1GB RAM, 25GB SSD | Mumbai/Bangalore |
| **Oracle Cloud** | **FREE** | 1 vCPU, 1GB RAM, 50GB | Mumbai (always free tier) |

**🌟 BEST DEAL: Oracle Cloud Free Tier** (Lifetime Free!)

- ✅ **2 AMD VM instances** (1 vCPU, 1GB RAM each) - FREE FOREVER
- ✅ **4 ARM VM instances** (4 vCPU, 24GB RAM total) - FREE FOREVER
- ✅ **200GB total storage** - FREE
- ✅ **Mumbai datacenter available**
- ✅ No credit card expiry (unlike AWS free tier)

**Setup Guide for Oracle Cloud:**

**1. Create Account:**
```bash
# Go to https://oracle.com/cloud/free
# Sign up (requires credit card for verification, but won't charge)
# Choose region: Mumbai (ap-mumbai-1)
```

**2. Create VM Instance:**
```bash
# In Oracle Cloud Console:
# Compute → Instances → Create Instance
# Name: klyx-worker
# Image: Ubuntu 22.04
# Shape: VM.Standard.E2.1.Micro (Always Free)
# SSH keys: Generate new pair
# Click Create
```

**3. Configure Firewall:**
```bash
# In Oracle Cloud Console:
# Networking → Virtual Cloud Networks → Default VCN
# Security Lists → Default Security List
# Add Ingress Rule:
#   Source CIDR: 0.0.0.0/0
#   Destination Port: 5002
#   Description: Flask Worker
```

**4. SSH into VM:**
```bash
# Get public IP from instance details
ssh ubuntu@<public-ip> -i <private-key.pem>

# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and dependencies
sudo apt install python3-pip python3-venv nginx -y
```

**5. Deploy Application:**
```bash
# Clone repository
git clone https://github.com/maruthiram08/klyx-new.git
cd klyx-new/backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt gunicorn

# Set environment variables
export POSTGRES_URL="postgresql://..."
export WORKER_API_KEY="..."

# Test worker app
python worker_app.py
# Ctrl+C to stop

# Create systemd service for auto-start
sudo nano /etc/systemd/system/klyx-worker.service
```

**6. Create Systemd Service:**

```ini
# /etc/systemd/system/klyx-worker.service
[Unit]
Description=Klyx Worker App
After=network.target

[Service]
Type=notify
User=ubuntu
WorkingDirectory=/home/ubuntu/klyx-new/backend
Environment="POSTGRES_URL=postgresql://..."
Environment="WORKER_API_KEY=..."
Environment="PATH=/home/ubuntu/klyx-new/backend/venv/bin"
ExecStart=/home/ubuntu/klyx-new/backend/venv/bin/gunicorn \
    --workers 4 \
    --bind 0.0.0.0:5002 \
    --timeout 300 \
    worker_app:app
Restart=always

[Install]
WantedBy=multi-user.target
```

**7. Start Service:**

```bash
# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable klyx-worker
sudo systemctl start klyx-worker

# Check status
sudo systemctl status klyx-worker

# View logs
sudo journalctl -u klyx-worker -f
```

**8. Configure Nginx Reverse Proxy:**

```bash
sudo nano /etc/nginx/sites-available/klyx-worker
```

```nginx
# /etc/nginx/sites-available/klyx-worker
server {
    listen 80;
    server_name <public-ip>;

    location / {
        proxy_pass http://localhost:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/klyx-worker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**9. Set Up Cron Jobs:**

```bash
# Edit crontab
crontab -e

# Add cron jobs
# Daily refresh at 2 AM
0 2 * * * cd /home/ubuntu/klyx-new/backend && /home/ubuntu/klyx-new/backend/venv/bin/python database/enrich_missing_fields.py --batch-size 100 >> /var/log/klyx-refresh.log 2>&1

# Weekly full enrichment at 3 AM Sunday
0 3 * * 0 cd /home/ubuntu/klyx-new/backend && /home/ubuntu/klyx-new/backend/venv/bin/python database/enrich_missing_fields.py --full >> /var/log/klyx-enrichment.log 2>&1
```

**10. Set Up HTTPS (Optional but Recommended):**

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get free SSL certificate (requires domain name)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

**Cost:** **$0/month** (Oracle Cloud Always Free Tier)

---

## Final Recommendation

### For Your Use Case (Klyx):

**🏆 Best Choice: Render.com**

**Why:**
1. **Easiest setup** - Similar to Railway, GitHub auto-deploy
2. **Free tier sufficient** - 750 hours/month (can run 24/7)
3. **Built-in cron jobs** - No external service needed
4. **No cold starts** - With UptimeRobot keep-alive
5. **Zero cost** - Completely free

**Setup Time:** ~30 minutes

---

**🥇 Alternative: Oracle Cloud Free Tier**

**Why:**
1. **FREE FOREVER** - No time limits, no credit expiration
2. **Better specs** - More RAM, storage than Render free tier
3. **Mumbai datacenter** - Low latency for Indian users
4. **Full control** - Can install anything, no platform restrictions
5. **Learning opportunity** - Gain DevOps/Linux skills

**Setup Time:** ~2 hours (first time), ~30 min (experienced)

---

**⚡ For Production (if you outgrow free tiers): Fly.io**

**Why:**
1. **Never sleeps** - Always-on, no cold starts
2. **Global edge** - Fast everywhere, including India
3. **Reasonable pricing** - $1.94/month for 256MB VM after free tier
4. **Professional infrastructure** - Used by many production apps

**Setup Time:** ~1 hour

---

## Quick Comparison for Klyx

| Platform | Setup | Cost | Always-On | India Speed | Cron Jobs | Verdict |
|----------|-------|------|-----------|-------------|-----------|---------|
| **Render** | ⭐⭐⭐⭐⭐ | Free | ✅ (with UptimeRobot) | ⭐⭐⭐ | ✅ Built-in | **BEST FOR BEGINNERS** |
| **Fly.io** | ⭐⭐⭐ | Free | ✅ | ⭐⭐⭐⭐ | ⚠️ Manual | **BEST FOR PRODUCTION** |
| **Oracle Cloud** | ⭐⭐ | Free | ✅ | ⭐⭐⭐⭐⭐ | ✅ Crontab | **BEST VALUE (FREE FOREVER)** |
| **Railway** | ⭐⭐⭐⭐⭐ | $7/mo | ✅ | ⭐⭐⭐ | ⚠️ External | Good but not free |
| **Koyeb** | ⭐⭐⭐⭐ | Free | ✅ | ⭐⭐ | ⚠️ External | Limited free tier |

---

## Migration from Railway to Render (Easiest)

**If you've already set up Railway, switching to Render is trivial:**

```bash
# 1. Create render.yaml (see Option 1 above)
# 2. Push to GitHub
git add render.yaml
git commit -m "Add Render configuration"
git push

# 3. Go to Render dashboard
# 4. New Web Service → Connect klyx-new repo
# 5. Render auto-detects render.yaml
# 6. Copy environment variables from Railway to Render
# 7. Deploy

# Done! Your worker is now on Render instead of Railway.
```

**Time required:** 15 minutes

---

## Summary

**I recommend: Render.com** for the easiest migration from Railway with zero cost.

**If you want free forever and don't mind some Linux setup: Oracle Cloud Always Free Tier.**

Both will work perfectly for Klyx's background worker needs!

Would you like detailed setup instructions for either option?
