#!/bin/bash
# scale-out.sh — Simulate ASG scale-out: add backend-c (GREEN theme)
# Run from project root: bash scripts/scale-out.sh

set -e

echo "=== Scale-Out: Starting backend-c (GREEN theme) ==="

# 1. Start backend-c container
echo "[1/3] Starting backend-c container..."
docker compose --profile scale up -d backend-c

# 2. Wait for backend-c to be ready
echo "[2/3] Waiting for backend-c to initialize..."
sleep 4

# 3. Update nginx upstream to include backend-c
echo "[3/3] Updating nginx load balancer config..."
cat > nginx/nginx.conf << 'EOF'
upstream backend_pool {
    server backend-a:3001;
    server backend-b:3001;
    server backend-c:3001;
}

log_format lb_upstream '[$time_local] $remote_addr → $upstream_addr "$request" $status';

server {
    listen 80;
    access_log /var/log/nginx/access.log lb_upstream;

    location /socket.io/ {
        proxy_pass http://backend_pool;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
    }

    location /api/ {
        proxy_pass http://backend_pool;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health {
        proxy_pass http://backend_pool;
        proxy_set_header Host $host;
    }
}
EOF

# Reload nginx with zero downtime
docker compose exec nginx nginx -s reload

echo ""
echo "Scale-out complete!"
echo "  → backend-c (GREEN) is now receiving traffic"
echo "  → Watch the canvas: new GREEN flowers will appear"
echo "  → Run 'docker compose logs nginx' to see load balancing in action"
