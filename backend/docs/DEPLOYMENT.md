# Deployment Guide

## Prerequisites

- Docker & Docker Compose (for containerized deployment)
- Node.js 18+ (for direct deployment)
- PostgreSQL 14+ (if not using Docker)
- Redis 7+ (optional, for caching)

## Local Development

### Setup

```bash
cd backend

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Initialize database
pnpm run db:push
pnpm run db:seed

# Start development server
pnpm run dev
```

API will be available at `http://localhost:3001`

### Database Management

```bash
# Run migrations
pnpm run db:migrate

# Seed test data
pnpm run db:seed

# Reset database
pnpm run db:reset

# Prisma Studio (web UI)
npx prisma studio
```

## Docker Deployment

### Using Docker Compose (Recommended for Development)

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

Services started:
- PostgreSQL on port 5432
- Redis on port 6379
- API on port 3001

### Custom Environment Variables

Create a `.env` file in the project root:

```env
JWT_SECRET=your_production_secret_key
JWT_REFRESH_SECRET=your_production_refresh_secret
NODE_ENV=production
```

Then:
```bash
docker-compose up -d
```

### Building Production Image

```bash
# Build image
docker build -t identity-verification-api:latest .

# Run container
docker run -d \
  --name identity-api \
  -p 3001:3001 \
  -e DATABASE_URL="postgresql://..." \
  -e JWT_SECRET="your_secret" \
  identity-verification-api:latest
```

## Production Deployment (Linux/Ubuntu)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis (optional)
sudo apt install -y redis-server
```

### 2. Application Setup

```bash
# Create application user
sudo useradd -m -s /bin/bash appuser
sudo mkdir -p /var/www/identity-verification
sudo chown appuser:appuser /var/www/identity-verification

# Clone repository
cd /var/www/identity-verification
git clone <repo-url> .
cd backend

# Install dependencies
pnpm install --prod

# Build
pnpm run build
```

### 3. Environment Configuration

```bash
sudo nano /var/www/identity-verification/backend/.env.production
```

```env
NODE_ENV=production
PORT=3001
LOG_LEVEL=info

DATABASE_URL=postgresql://user:password@localhost:5432/identity_verification
REDIS_URL=redis://localhost:6379

JWT_SECRET=<generate-secure-secret>
JWT_REFRESH_SECRET=<generate-secure-secret>

CORS_ORIGIN=https://yourdomain.com
API_PREFIX=/api/v1

ENABLE_RATE_LIMITING=true
ENABLE_AUDIT_LOG=true
```

Generate secure secrets:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Database Setup

```bash
# Create database
sudo -u postgres createdb identity_verification
sudo -u postgres createuser appuser -P

# Grant permissions
sudo -u postgres psql << EOF
ALTER USER appuser WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE identity_verification TO appuser;
\q
EOF

# Run migrations
cd /var/www/identity-verification/backend
pnpm run db:push
pnpm run db:seed
```

### 5. Systemd Service

Create `/etc/systemd/system/identity-verification.service`:

```ini
[Unit]
Description=Identity Verification API
After=network.target postgresql.service redis-server.service

[Service]
Type=simple
User=appuser
WorkingDirectory=/var/www/identity-verification/backend
ExecStart=/home/appuser/.npm/_npx/bin/pnpm start
Restart=on-failure
RestartSec=10
Environment="NODE_ENV=production"
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
```

Enable and start service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable identity-verification
sudo systemctl start identity-verification
sudo systemctl status identity-verification
```

### 6. Nginx Reverse Proxy

Install Nginx:
```bash
sudo apt install -y nginx
```

Create `/etc/nginx/sites-available/identity-verification`:

```nginx
upstream identity_api {
    server localhost:3001;
}

server {
    listen 80;
    server_name api.yourdomain.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL certificates (using Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Proxy settings
    location / {
        proxy_pass http://identity_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://identity_api;
        access_log off;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/identity-verification /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 7. SSL Certificates (Let's Encrypt)

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.yourdomain.com
sudo certbot renew --dry-run  # Test renewal
```

### 8. Monitoring & Logging

```bash
# View service logs
sudo journalctl -u identity-verification -f

# View access logs
sudo tail -f /var/log/nginx/access.log

# View error logs
sudo tail -f /var/log/nginx/error.log

# Application logs
tail -f /var/www/identity-verification/backend/logs/all.log
```

## AWS Deployment

### Using ECS

```bash
# Create ECR repository
aws ecr create-repository --repository-name identity-verification-api

# Build and push image
docker build -t identity-verification-api .
docker tag identity-verification-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/identity-verification-api:latest
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/identity-verification-api:latest
```

### RDS Database

```bash
# Create RDS PostgreSQL instance
aws rds create-db-instance \
  --db-instance-identifier identity-verification-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --allocated-storage 20 \
  --master-username postgres \
  --master-user-password <password>
```

### ElastiCache (Redis)

```bash
# Create ElastiCache cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id identity-verification-cache \
  --cache-node-type cache.t3.micro \
  --engine redis
```

## Vercel Deployment

For Node.js serverless deployment:

1. Push code to GitHub
2. Import project in Vercel
3. Set environment variables
4. Deploy

Note: For long-running verification processes, consider using background jobs instead of serverless.

## Health Checks & Monitoring

### Health Check Endpoint

```bash
curl http://api.yourdomain.com/health
```

Response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-02T15:00:00.000Z",
  "uptime": 3600.5,
  "database": "connected"
}
```

### Monitoring Checklist

- [ ] API response times
- [ ] Error rates
- [ ] Database performance
- [ ] Disk space
- [ ] Memory usage
- [ ] CPU usage
- [ ] Network latency

## Backup Strategy

### Database Backup

```bash
# Daily backup
0 2 * * * pg_dump -U appuser identity_verification > /backups/db_$(date +\%Y\%m\%d).sql

# Store in S3
0 3 * * * aws s3 cp /backups/db_$(date +\%Y\%m\%d).sql s3://backup-bucket/db/
```

### Restore Backup

```bash
psql -U appuser identity_verification < /backups/db_backup.sql
```

## Scaling

### Horizontal Scaling

1. Deploy multiple API instances
2. Use load balancer (Nginx, ALB, NLB)
3. Ensure stateless design (use Redis for sessions)
4. Database replication for reads

### Vertical Scaling

- Increase server CPU/RAM
- Upgrade database instance
- Optimize code and queries

## Rolling Updates

```bash
# Update application
git pull origin main
pnpm install --prod
pnpm run build

# Restart service
sudo systemctl restart identity-verification

# Verify health
curl http://localhost:3001/health
```

## Troubleshooting

### Connection Issues

```bash
# Check if service is running
sudo systemctl status identity-verification

# Check logs
sudo journalctl -u identity-verification -n 50

# Test database connection
psql -h localhost -U appuser -d identity_verification
```

### Performance Issues

```bash
# Check system resources
free -h
df -h
top

# Check database connections
ps aux | grep postgres

# Monitor Nginx
sudo nginx -s status
```

### SSL Certificate Issues

```bash
# Check certificate expiry
openssl x509 -enddate -noout -in /etc/letsencrypt/live/api.yourdomain.com/cert.pem

# Renew certificate
sudo certbot renew --force-renewal
```

## Security Hardening

- [ ] Enable firewall (UFW)
- [ ] Configure fail2ban for brute-force protection
- [ ] Regular security updates
- [ ] Implement DDoS protection
- [ ] Enable VPN for admin access
- [ ] Regular security audits
- [ ] Backup encryption
- [ ] Database encryption at rest
- [ ] TLS 1.3 minimum
- [ ] Regular secret rotation

## Disaster Recovery

### Recovery Plan

1. Database restored from latest backup
2. Application redeployed
3. Services health checked
4. Verify data integrity
5. Monitor for errors

### RTO/RPO

- **RTO (Recovery Time Objective):** 1 hour
- **RPO (Recovery Point Objective):** 4 hours

## Cost Optimization

- Use reserved instances for databases
- Implement auto-scaling
- Monitor resource usage
- Clean up old logs and backups
- Use CDN for static assets
