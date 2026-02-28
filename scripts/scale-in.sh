#!/bin/bash
# scale-in.sh — Simulate ASG scale-in: remove backend-c (GREEN theme)
# Run from project root: bash scripts/scale-in.sh

set -e

echo "=== Scale-In: Stopping backend-c (GREEN theme) ==="

# 1. Remove backend-c from nginx upstream FIRST (stop sending new requests)
echo "[1/3] Removing backend-c from load balancer..."
cat > nginx/nginx.conf << 'EOF'
upstream backend_pool {
    server backend-a:3001;
    server backend-b:3001;
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

docker compose exec nginx nginx -s reload
echo "  → nginx updated: no new connections to backend-c"

# 2. Graceful shutdown (SIGTERM → grayscale effect → process exit)
echo "[2/3] Sending SIGTERM to backend-c (triggers grayscale animation)..."
echo "  → Watch the canvas: GREEN flowers will turn gray!"
docker compose stop backend-c

# 3. Remove the stopped container
echo "[3/3] Removing backend-c container..."
docker compose rm -f backend-c

echo ""
echo "Scale-in complete!"
echo "  → backend-c (GREEN) has been shut down"
echo "  → GREEN flowers have turned gray (instance offline)"
