#!/bin/bash
# EC2 User Data — PixelFlora startup script
#
# Works in two modes:
#   1. Fresh install: Amazon Linux 2023 base AMI (no pre-installed app)
#      → Installs Node.js + Nginx, clones repo, builds frontend, installs backend
#   2. AMI-based   : Custom AMI already has app pre-installed
#      → Skips install, only writes env config and starts services
#
# NOTE: This file is processed by Terraform templatefile().
#       ${redis_host} is the only Terraform variable — it gets replaced at deploy time.
#       All other shell variables use $VAR notation (no braces) to avoid conflicts.

set -e
exec > /var/log/pixelflora-startup.log 2>&1

# Terraform injects the ElastiCache endpoint at deploy time
REDIS_HOST="${redis_host}"
APP_DIR="/home/ec2-user/app"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "=== PixelFlora startup BEGIN (Redis: $REDIS_HOST) ==="

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 1: Install (skipped when using a pre-built AMI)
# ─────────────────────────────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/backend/package.json" ]; then
  log "App not found — running full bootstrap (this takes ~5-10 minutes)..."

  # System packages (Amazon Linux 2023 uses dnf)
  dnf update -y
  dnf install -y git nginx

  # Node.js 22.x
  curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
  dnf install -y nodejs

  log "Node $(node -v) and Nginx installed."

  # ── IMPORTANT: Replace the URL below with your actual GitHub repository ──
  REPO_URL="https://github.com/Mikang-K/PixelFlora.git"

  cd /home/ec2-user
  sudo -u ec2-user git clone $REPO_URL app
  log "Repository cloned."

  # Build frontend
  # VITE_BACKEND_URL is intentionally empty: the React app will connect to
  # window.location.origin at runtime, which routes through ALB → Nginx → backend.
  cd $APP_DIR/frontend
  sudo -u ec2-user npm install
  sudo -u ec2-user env VITE_BACKEND_URL='' npm run build
  log "Frontend built."

  # Install backend dependencies
  cd $APP_DIR/backend
  sudo -u ec2-user npm install --production
  log "Backend dependencies installed."

  # Remove the default server block from nginx.conf so it doesn't conflict
  # with pixelflora.conf (both claim server_name _ on port 80)
  cat > /etc/nginx/nginx.conf << 'NGINXMAINEOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log notice;
pid /run/nginx.pid;

include /usr/share/nginx/modules/*.conf;

events {
    worker_connections 1024;
}

http {
    log_format  main  '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile            on;
    tcp_nopush          on;
    keepalive_timeout   65;
    types_hash_max_size 4096;

    include             /etc/nginx/mime.types;
    default_type        application/octet-stream;

    include /etc/nginx/conf.d/*.conf;
}
NGINXMAINEOF

  # ── Nginx: serves the React build + proxies /api and /socket.io to backend ──
  cat > /etc/nginx/conf.d/pixelflora.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    # Serve the pre-built React app
    root /home/ec2-user/app/frontend/dist;
    index index.html;

    # ALB health check — proxied to backend
    location /health {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    # REST API — proxied to backend
    location /api {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Socket.io — WebSocket upgrade required
    location /socket.io {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        # Keep WebSocket connections open for real-time updates
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    # SPA fallback — unknown paths serve index.html (React Router handles them)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

  rm -f /etc/nginx/conf.d/default.conf

  # ── systemd service for the backend ──
  cat > /etc/systemd/system/pixelflora.service << 'SVCEOF'
[Unit]
Description=PixelFlora Backend Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/app/backend
ExecStart=/usr/bin/node server.js
EnvironmentFile=/etc/pixelflora.env
Restart=always
RestartSec=5
# Allow time for graceful shutdown: SIGTERM → grayscale pixels → emit instance:leave
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
SVCEOF

  systemctl daemon-reload
  systemctl enable pixelflora
  systemctl enable nginx

  # Allow nginx (runs as 'nginx' user) to traverse the ec2-user home directory
  # Without this, nginx returns 500 when serving /home/ec2-user/app/frontend/dist
  chmod o+x /home/ec2-user

  log "Full bootstrap complete."
else
  log "Pre-installed app found (AMI-based). Skipping install phase."
fi

# ─────────────────────────────────────────────────────────────────────────────
# PHASE 2: Configure environment and start services
# Always runs — even on AMI-based instances
# ─────────────────────────────────────────────────────────────────────────────
log "Writing /etc/pixelflora.env ..."
cat > /etc/pixelflora.env << ENVEOF
NODE_ENV=production
PORT=3001
REDIS_HOST=$REDIS_HOST
REDIS_PORT=6379
ENVEOF

chmod 640 /etc/pixelflora.env

log "Starting services..."
systemctl restart pixelflora
systemctl restart nginx

log "=== PixelFlora startup COMPLETE ==="
log "  Backend : http://localhost:3001"
log "  Nginx   : http://localhost:80"
log "  Redis   : $REDIS_HOST:6379"
