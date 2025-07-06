# GitHub Secrets Configuration for Students Enrollment System

This document lists all the GitHub secrets that need to be configured in your repository settings for the CI/CD pipelines to work correctly.

## 🔐 Required GitHub Secrets

Navigate to your GitHub repository → Settings → Secrets and variables → Actions → Repository secrets

### **Render Deployment Secrets**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `RENDER_STAGING_URL` | Staging backend URL on Render | `https://students-enrollment-develop.onrender.com` |
| `RENDER_PRODUCTION_URL` | Production backend URL on Render | `https://students-enrollment-production.onrender.com` |
| `RENDER_STAGING_API_KEY` | Render API key for staging deployments | `rnd_XXXXXXXXXXXXXXXXXXXXXX` |
| `RENDER_PRODUCTION_API_KEY` | Render API key for production deployments | `rnd_XXXXXXXXXXXXXXXXXXXXXX` |
| `RENDER_STAGING_SERVICE_ID` | Render service ID for staging | `srv-XXXXXXXXXXXXXXXXXXXXXX` |
| `RENDER_PRODUCTION_SERVICE_ID` | Render service ID for production | `srv-XXXXXXXXXXXXXXXXXXXXXX` |
| `RENDER_DEPLOY_HOOK_DEVELOP` | Render deploy hook URL for develop branch | `https://api.render.com/deploy/srv-XXXXX?key=XXXXX` |

### **Stripe Payment Secrets**

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `STRIPE_PUBLISHABLE_KEY_STAGING` | Stripe publishable key for staging | `pk_test_XXXXXXXXXXXXXXXXXXXXXX` |
| `STRIPE_PUBLISHABLE_KEY_LIVE` | Stripe publishable key for production | `pk_live_XXXXXXXXXXXXXXXXXXXXXX` |

### **Database and Backend Secrets** (Used by Render)

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `MONGODB_URI_STAGING` | MongoDB connection string for staging | `mongodb+srv://user:pass@cluster.mongodb.net/staging` |
| `MONGODB_URI_PRODUCTION` | MongoDB connection string for production | `mongodb+srv://user:pass@cluster.mongodb.net/production` |

## 🔧 How to Find These Values

### **Render Service Information:**
1. Go to your Render dashboard
2. Select your service
3. **Service ID**: Found in the URL or service settings
4. **API Key**: Account Settings → API Keys
5. **Service URL**: Found in the service overview
6. **Deploy Hook**: Service Settings → Deploy Hooks

### **Stripe Keys:**
1. Go to your Stripe dashboard
2. Navigate to Developers → API Keys
3. **Publishable Key**: Starts with `pk_test_` (test) or `pk_live_` (live)

### **MongoDB URI:**
1. Go to MongoDB Atlas dashboard
2. Navigate to Database → Connect
3. Choose "Connect your application"
4. Copy the connection string

## 🚀 Setting Up Secrets

### Using GitHub CLI:
```bash
# Render secrets
gh secret set RENDER_STAGING_URL --body "https://your-staging-app.onrender.com"
gh secret set RENDER_PRODUCTION_URL --body "https://your-production-app.onrender.com"
gh secret set RENDER_STAGING_API_KEY --body "rnd_your_api_key"
gh secret set RENDER_PRODUCTION_API_KEY --body "rnd_your_api_key"
gh secret set RENDER_STAGING_SERVICE_ID --body "srv_your_service_id"
gh secret set RENDER_PRODUCTION_SERVICE_ID --body "srv_your_service_id"

# Stripe secrets
gh secret set STRIPE_PUBLISHABLE_KEY_STAGING --body "pk_test_your_test_key"
gh secret set STRIPE_PUBLISHABLE_KEY_LIVE --body "pk_live_your_live_key"
```

### Using GitHub Web Interface:
1. Go to your repository on GitHub
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Enter the secret name and value
5. Click **Add secret**

## ✅ Verification

After setting up all secrets, you can verify they're working by:

1. **Triggering a deployment** by pushing to `develop` or `main` branch
2. **Checking the Actions tab** for any deployment failures
3. **Visiting the deployed URLs** to ensure they're accessible

## 🔒 Security Notes

- **Never commit secrets** to your repository
- **Use different keys** for staging and production
- **Rotate keys regularly** for security
- **Limit API key permissions** to only what's needed
- **Monitor usage** of your API keys

## 📞 Troubleshooting

If you encounter issues:

1. **Check secret names** match exactly (case-sensitive)
2. **Verify Render service IDs** are correct
3. **Test API keys** manually with curl
4. **Check Render logs** for deployment issues
5. **Verify MongoDB connections** from Render dashboard

---

**Last Updated:** July 2025
**Required for:** CI/CD Pipeline, Automated Deployments, Environment Management
