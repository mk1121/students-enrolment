# 🔐 GitHub Secrets and Variables Configuration Guide

## Required GitHub Secrets

### 🔥 **ESSENTIAL SECRETS (Required for Basic Functionality)**

#### Database & Authentication
```
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random
MONGODB_URI=mongodb://your-mongodb-connection-string
```

#### Payment Processing - Stripe
```
STRIPE_SECRET_KEY=sk_live_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

#### Email Service (Gmail OAuth2)
```
EMAIL_USER=your-email@gmail.com
EMAIL_FROM=noreply@yourdomain.com
GMAIL_CLIENT_ID=your-client-id.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=your-client-secret
GMAIL_REFRESH_TOKEN=1//your-refresh-token
```

#### Application URLs
```
CLIENT_URL=https://your-frontend-domain.com
SERVER_URL=https://your-backend-domain.com
```

---

### 🐳 **DOCKER DEPLOYMENT SECRETS**

```
DOCKER_USERNAME=your-dockerhub-username
DOCKER_PASSWORD=your-dockerhub-password-or-token
```

---

### 🚀 **STAGING DEPLOYMENT SECRETS**

```
STAGING_HOST=your-staging-server-ip-or-domain
STAGING_USER=your-staging-server-username
STAGING_SSH_KEY=-----BEGIN PRIVATE KEY-----
STAGING_PORT=22
STAGING_URL=https://staging.yourdomain.com
```

---

### 🏭 **PRODUCTION DEPLOYMENT SECRETS**

```
PRODUCTION_HOST=your-production-server-ip-or-domain
PRODUCTION_USER=your-production-server-username
PRODUCTION_SSH_KEY=-----BEGIN PRIVATE KEY-----
PRODUCTION_PORT=22
PRODUCTION_URL=https://yourdomain.com
```

---

### 📊 **MONITORING & NOTIFICATIONS (Optional)**

```
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
SNYK_TOKEN=your-snyk-security-token
```

---

### 💳 **OPTIONAL PAYMENT GATEWAYS**

#### SSLCommerz (Bangladesh)
```
SSLCOMMERZ_STORE_ID=your-store-id
SSLCOMMERZ_STORE_PASSWORD=your-store-password
SSLCOMMERZ_IS_LIVE=false
```

---

### 🌐 **RENDER DEPLOYMENT SECRETS (NEW)**

#### Render Staging (develop branch)
```
RENDER_STAGING_SERVICE_ID=srv-xxxxxxxxx
RENDER_STAGING_API_KEY=rnd_xxxxxxxxx
RENDER_STAGING_URL=https://students-enrollment-staging.onrender.com
```

#### Render Production (main branch)
```
RENDER_PRODUCTION_SERVICE_ID=srv-yyyyyyyyy
RENDER_PRODUCTION_API_KEY=rnd_yyyyyyyyy
RENDER_PRODUCTION_URL=https://students-enrollment-production.onrender.com
```

#### Frontend Environment Variables
```
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_your_test_key
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_your_live_key
```

---

## 📝 **How to Set Up GitHub Secrets**

### Step 1: Go to Repository Settings
1. Navigate to your GitHub repository
2. Click **Settings** tab
3. Go to **Secrets and variables** → **Actions**

### Step 2: Add Repository Secrets
Click **New repository secret** for each secret above:

#### Essential Secrets (Set these first):
1. `JWT_SECRET` - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`
2. `MONGODB_URI` - Your MongoDB connection string
3. `STRIPE_SECRET_KEY` - From your Stripe dashboard
4. `STRIPE_WEBHOOK_SECRET` - From your Stripe webhook settings
5. `EMAIL_USER` - Your Gmail address
6. `EMAIL_FROM` - Your sender email address
7. `GMAIL_CLIENT_ID` - From Google Cloud Console
8. `GMAIL_CLIENT_SECRET` - From Google Cloud Console  
9. `GMAIL_REFRESH_TOKEN` - Generate using OAuth2 flow
10. `CLIENT_URL` - Your frontend URL
11. `SERVER_URL` - Your backend URL

#### Docker Secrets (if using Docker deployment):
12. `DOCKER_USERNAME` - Your Docker Hub username
13. `DOCKER_PASSWORD` - Your Docker Hub access token

#### Deployment Secrets (if using automatic deployment):
14. `STAGING_HOST` - Staging server IP/domain
15. `STAGING_USER` - SSH username for staging
16. `STAGING_SSH_KEY` - SSH private key for staging
17. `PRODUCTION_HOST` - Production server IP/domain
18. `PRODUCTION_USER` - SSH username for production  
19. `PRODUCTION_SSH_KEY` - SSH private key for production

---

## 🚦 **Minimum Setup for CI/CD to Work**

### For **Testing Only** (CI without deployment):
```
JWT_SECRET
MONGODB_URI (can use MongoDB Atlas free tier)
STRIPE_SECRET_KEY (test key: sk_test_...)
STRIPE_WEBHOOK_SECRET (test webhook secret)
EMAIL_USER
EMAIL_FROM
GMAIL_CLIENT_ID
GMAIL_CLIENT_SECRET
GMAIL_REFRESH_TOKEN
CLIENT_URL
SERVER_URL
```

### For **Basic Deployment**:
Add Docker secrets:
```
DOCKER_USERNAME
DOCKER_PASSWORD
```

### For **Full Production**:
Add all deployment and monitoring secrets.

---

## 🔧 **Environment Variables vs GitHub Secrets**

### GitHub Secrets (Sensitive Data):
- Database passwords
- API keys
- SSH keys
- Webhook secrets
- OAuth tokens

### Environment Variables (Non-sensitive):
- `NODE_ENV=production`
- `PORT=5000`
- `RATE_LIMIT_MAX_REQUESTS=100`

---

## 📋 **Quick Setup Checklist**

- [ ] **JWT_SECRET** - Generate random secret
- [ ] **MONGODB_URI** - Set up MongoDB database
- [ ] **STRIPE_SECRET_KEY** - Get from Stripe dashboard
- [ ] **STRIPE_WEBHOOK_SECRET** - Configure Stripe webhook
- [ ] **Email OAuth2** - Set up Gmail OAuth2 (4 secrets)
- [ ] **URLs** - Set CLIENT_URL and SERVER_URL
- [ ] **Docker** - Set up Docker Hub credentials (if needed)
- [ ] **Deployment** - Set up server SSH access (if needed)
- [ ] **Monitoring** - Set up Slack/Snyk (optional)

---

## 🎯 **Priority Order**

1. **Essential for CI:** JWT_SECRET, MONGODB_URI, Stripe keys, Email config
2. **For Docker:** Docker Hub credentials  
3. **For Deployment:** Server SSH keys and URLs
4. **For Monitoring:** Slack/Snyk tokens

---

*Generated for Students Enrollment System CI/CD Pipeline*
