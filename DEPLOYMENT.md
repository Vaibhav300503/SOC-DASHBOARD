# SOC Dashboard - Deployment Guide

Complete guide for deploying the SOC Dashboard to production.

## Pre-Deployment Checklist

- [ ] All features tested locally
- [ ] Environment variables configured
- [ ] Backend API deployed
- [ ] MongoDB database set up
- [ ] Tailscale API key configured
- [ ] SSL certificates ready
- [ ] Domain name configured
- [ ] Backup strategy in place

## Build for Production

### 1. Optimize Build

```bash
# Install dependencies
npm install

# Build for production
npm run build

# Preview production build
npm run preview
```

### 2. Verify Build

```bash
# Check dist folder size
du -sh dist/

# List all files
ls -la dist/
```

## Deployment Options

### Option 1: Netlify (Recommended for Static)

#### Prerequisites
- Netlify account
- Git repository (GitHub, GitLab, Bitbucket)

#### Steps

1. **Connect Repository**
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Select your repository

2. **Configure Build**
   - Build command: `npm run build`
   - Publish directory: `dist`

3. **Set Environment Variables**
   - Go to Site settings → Build & deploy → Environment
   - Add all variables from `.env`

4. **Deploy**
   - Netlify automatically deploys on push to main branch

#### Netlify Configuration File

Create `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "SAMEORIGIN"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
```

### Option 2: Vercel

#### Prerequisites
- Vercel account
- Git repository

#### Steps

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Deploy**
   ```bash
   vercel --prod
   ```

3. **Configure Environment Variables**
   - In Vercel dashboard → Settings → Environment Variables
   - Add all variables from `.env`

#### Vercel Configuration File

Create `vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "env": {
    "VITE_API_BASE_URL": "@api_base_url",
    "VITE_WS_URL": "@ws_url"
  }
}
```

### Option 3: Docker

#### Prerequisites
- Docker installed
- Docker Hub account (optional)

#### Dockerfile

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Install serve to run the app
RUN npm install -g serve

# Copy built app from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["serve", "-s", "dist", "-l", "3000"]
```

#### Build and Run Docker Image

```bash
# Build image
docker build -t soc-dashboard:latest .

# Run container
docker run -p 3000:3000 \
  -e VITE_API_BASE_URL=http://api.example.com \
  -e VITE_WS_URL=ws://api.example.com \
  soc-dashboard:latest

# Push to Docker Hub
docker tag soc-dashboard:latest username/soc-dashboard:latest
docker push username/soc-dashboard:latest
```

#### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  dashboard:
    build: .
    ports:
      - "3000:3000"
    environment:
      VITE_API_BASE_URL: http://api:3001/api
      VITE_WS_URL: ws://api:3001/ws
    depends_on:
      - api

  api:
    image: your-api-image:latest
    ports:
      - "3001:3001"
    environment:
      MONGODB_URI: mongodb://mongo:27017/soc_dashboard
    depends_on:
      - mongo

  mongo:
    image: mongo:5
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

Run with:
```bash
docker-compose up -d
```

### Option 4: Traditional Server (AWS EC2, DigitalOcean, etc.)

#### Prerequisites
- Server with Node.js installed
- SSH access
- Domain name

#### Steps

1. **Connect to Server**
   ```bash
   ssh user@your-server.com
   ```

2. **Clone Repository**
   ```bash
   git clone https://github.com/your-repo/soc-dashboard.git
   cd soc-dashboard
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Build Application**
   ```bash
   npm run build
   ```

5. **Install PM2 (Process Manager)**
   ```bash
   npm install -g pm2
   ```

6. **Create PM2 Configuration**

   Create `ecosystem.config.js`:
   ```javascript
   module.exports = {
     apps: [{
       name: 'soc-dashboard',
       script: 'npm',
       args: 'run preview',
       env: {
         VITE_API_BASE_URL: 'http://api.example.com',
         VITE_WS_URL: 'ws://api.example.com'
       }
     }]
   }
   ```

7. **Start Application**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

8. **Configure Nginx Reverse Proxy**

   Create `/etc/nginx/sites-available/soc-dashboard`:
   ```nginx
   server {
     listen 80;
     server_name your-domain.com;

     location / {
       proxy_pass http://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection 'upgrade';
       proxy_set_header Host $host;
       proxy_cache_bypass $http_upgrade;
     }

     location /ws {
       proxy_pass ws://localhost:3000;
       proxy_http_version 1.1;
       proxy_set_header Upgrade $http_upgrade;
       proxy_set_header Connection "upgrade";
     }
   }
   ```

9. **Enable Site**
   ```bash
   sudo ln -s /etc/nginx/sites-available/soc-dashboard /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

10. **Setup SSL with Let's Encrypt**
    ```bash
    sudo apt install certbot python3-certbot-nginx
    sudo certbot --nginx -d your-domain.com
    ```

## Environment Configuration

### Production Environment Variables

Create `.env.production`:

```bash
# API Configuration
VITE_API_BASE_URL=https://api.example.com/api
VITE_WS_URL=wss://api.example.com/ws

# Features
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_MOCK_DATA=false
VITE_LOG_LEVEL=warn

# Application
VITE_APP_NAME=SOC Dashboard
VITE_REFRESH_INTERVAL=5000
```

## Security Hardening

### 1. Content Security Policy

Add to `index.html`:
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline'; 
               img-src 'self' data: https:; 
               font-src 'self'; 
               connect-src 'self' https: wss:">
```

### 2. CORS Configuration

Backend should implement:
```javascript
const cors = require('cors')

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
```

### 3. HTTPS/TLS

- Always use HTTPS in production
- Use strong SSL certificates
- Enable HSTS header

### 4. Rate Limiting

```javascript
const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
})

app.use('/api/', limiter)
```

### 5. Input Validation

- Validate all user inputs
- Sanitize database queries
- Use parameterized queries

## Performance Optimization

### 1. Enable Compression

```javascript
const compression = require('compression')
app.use(compression())
```

### 2. Caching Strategy

```javascript
// Cache static assets for 1 year
app.use(express.static('dist', {
  maxAge: '1y',
  etag: false
}))

// Cache API responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'public, max-age=300')
  next()
})
```

### 3. CDN Configuration

- Serve static assets from CDN
- Use CloudFlare or similar service
- Enable caching headers

### 4. Database Optimization

```javascript
// Add indexes
db.logs.createIndex({ timestamp: -1 })
db.logs.createIndex({ severity: 1 })
db.logs.createIndex({ source_ip: 1 })
```

## Monitoring & Logging

### 1. Application Monitoring

```bash
# Install monitoring tools
npm install pm2-plus

# Enable monitoring
pm2 plus
```

### 2. Error Tracking

```javascript
// Sentry integration
import * as Sentry from "@sentry/vue"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
})
```

### 3. Logging

```javascript
// Winston logger
const winston = require('winston')

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
```

## Backup & Recovery

### 1. Database Backup

```bash
# MongoDB backup
mongodump --uri="mongodb://localhost:27017/soc_dashboard" --out=./backup

# Restore
mongorestore --uri="mongodb://localhost:27017/soc_dashboard" ./backup
```

### 2. Automated Backups

```bash
# Create backup script
#!/bin/bash
BACKUP_DIR="/backups/soc-dashboard"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --uri="$MONGODB_URI" --out="$BACKUP_DIR/backup_$DATE"

# Keep only last 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

### 3. Version Control

- Tag releases: `git tag v1.0.0`
- Keep changelog: `CHANGELOG.md`
- Document breaking changes

## CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy to Netlify
        uses: nwtgck/actions-netlify@v1.2
        with:
          publish-dir: './dist'
          production-branch: main
          github-token: ${{ secrets.GITHUB_TOKEN }}
          deploy-message: 'Deploy from GitHub Actions'
        env:
          NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
          NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

## Post-Deployment

### 1. Verify Deployment

```bash
# Check application is running
curl https://your-domain.com

# Check API connectivity
curl https://your-domain.com/api/logs/stats

# Check WebSocket
wscat -c wss://your-domain.com/ws
```

### 2. Monitor Performance

- Check Core Web Vitals
- Monitor error rates
- Track API response times
- Monitor database performance

### 3. Update Documentation

- Document deployment process
- Update runbooks
- Create incident response procedures

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs soc-dashboard

# Check port
lsof -i :3000

# Restart application
pm2 restart soc-dashboard
```

### WebSocket Connection Failed

- Check firewall rules
- Verify WebSocket URL
- Check reverse proxy configuration
- Enable WebSocket upgrade headers

### High Memory Usage

- Check for memory leaks
- Implement pagination
- Clear old logs from database
- Restart application periodically

### Slow Performance

- Check database indexes
- Enable caching
- Use CDN for static assets
- Optimize API queries

---

**Last Updated**: January 2024
