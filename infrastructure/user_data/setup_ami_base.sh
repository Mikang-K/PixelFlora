#!/bin/bash
# PixelFlora — AMI Base Setup Script
#
# PURPOSE: Run this script MANUALLY (via SSH) on a base EC2 instance to prepare
#          it for AMI creation. The resulting AMI will have all software pre-installed,
#          making ASG instances start in ~1 minute instead of ~10 minutes.
#
# USAGE:
#   1. Launch a base Amazon Linux 2023 EC2 instance (t3.micro, us-east-1) with
#      LabInstanceProfile and your key pair.
#   2. SSH in:  ssh -i your-key.pem ec2-user@<PUBLIC_IP>
#   3. Run:     sudo bash setup_ami_base.sh
#   4. After the script finishes, go to AWS Console →
#      EC2 → Instances → Right-click → Image and templates → Create image
#   5. Copy the resulting AMI ID into terraform.tfvars as ami_id.
#
# NOTE: Do NOT start the pixelflora service after this script — startup.sh
#       (user_data) will inject the Redis endpoint and start the service at boot.

set -e

echo "=== PixelFlora AMI Base Setup ==="

# ── IMPORTANT: Set your GitHub repository URL here ──────────────────────────
REPO_URL="https://github.com/Mikang-K/PixelFlora.git"
APP_DIR="/home/ec2-user/app"

# ─────────────────────────────────────────────────────────────────────────────
# 1. System packages
# ─────────────────────────────────────────────────────────────────────────────
echo "[1/6] Installing system packages..."
dnf update -y
dnf install -y git nginx

# ─────────────────────────────────────────────────────────────────────────────
# 2. Node.js 22.x
# ─────────────────────────────────────────────────────────────────────────────
echo "[2/6] Installing Node.js 22.x..."
curl -fsSL https://rpm.nodesource.com/setup_22.x | bash -
dnf install -y nodejs
echo "Node version: $(node -v)"
echo "npm  version: $(npm -v)"

# ─────────────────────────────────────────────────────────────────────────────
# 3. Clone application
# ─────────────────────────────────────────────────────────────────────────────
echo "[3/6] Cloning repository: $REPO_URL"
cd /home/ec2-user
sudo -u ec2-user git clone $REPO_URL app
echo "Repository cloned to $APP_DIR"

# ─────────────────────────────────────────────────────────────────────────────
# 4. Build frontend
# VITE_BACKEND_URL is empty → React app connects to window.location.origin
# (ALB URL) at runtime, then Nginx proxies the request to localhost:3001
# ─────────────────────────────────────────────────────────────────────────────
echo "[4/6] Building frontend..."
cd $APP_DIR/frontend
sudo -u ec2-user npm install
sudo -u ec2-user env VITE_BACKEND_URL='' npm run build
echo "Frontend built at $APP_DIR/frontend/dist"

# ─────────────────────────────────────────────────────────────────────────────
# 5. Install backend dependencies
# ─────────────────────────────────────────────────────────────────────────────
echo "[5/6] Installing backend dependencies..."
cd $APP_DIR/backend
sudo -u ec2-user npm install --production
echo "Backend dependencies installed."

# ─────────────────────────────────────────────────────────────────────────────
# 6. Configure Nginx and systemd (disabled — startup.sh enables them at boot)
# ─────────────────────────────────────────────────────────────────────────────
echo "[6/6] Configuring Nginx and systemd..."

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

# Nginx virtual host: serve React build + proxy API/WebSocket to backend
cat > /etc/nginx/conf.d/pixelflora.conf << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    root /home/ec2-user/app/frontend/dist;
    index index.html;

    location /health {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
    }

    location /api {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /socket.io {
        proxy_pass         http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection "upgrade";
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
NGINXEOF

rm -f /etc/nginx/conf.d/default.conf

# systemd service for backend (EnvironmentFile will be written by startup.sh)
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
TimeoutStopSec=10

[Install]
WantedBy=multi-user.target
SVCEOF

systemctl daemon-reload
# Enable so startup.sh can simply do `systemctl restart pixelflora/nginx`
systemctl enable pixelflora
systemctl enable nginx

# ─────────────────────────────────────────────────────────────────────────────
# 7. Clean cloud-init cache (CRITICAL for AMI-based deployment)
# Without this, new instances launched from this AMI will see the cloud-init
# "already ran" flag and SKIP user_data (startup.sh), leaving services stopped.
# ─────────────────────────────────────────────────────────────────────────────
echo "[7/7] Clearing cloud-init cache..."
cloud-init clean --logs
echo "cloud-init cache cleared. New instances will run startup.sh on first boot."

echo ""
echo "=========================================="
echo " AMI base setup COMPLETE"
echo "=========================================="
echo ""
echo "NEXT STEPS:"
echo "  1. Exit this SSH session"
echo "  2. AWS Console → EC2 → Instances"
echo "  3. Select this instance → Actions → Image and templates → Create image"
echo "  4. Name: pixelflora-base-$(date +%Y%m%d)"
echo "  5. After image is created, copy the AMI ID (ami-xxxxxxxxxxxxxxxxx)"
echo "  6. Paste it as ami_id in infrastructure/terraform.tfvars"
echo "  7. Run: terraform apply"
echo ""
echo "Do NOT start services manually — startup.sh (user_data) will"
echo "inject Redis config and start services on each new ASG instance."
