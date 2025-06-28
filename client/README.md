# Client Environment Setup

## Environment Variables

This React application uses environment variables for configuration. Environment files are git-ignored for security.

### Setup Instructions

1. **Development Environment:**
   ```bash
   cp .env.development.example .env.development
   # Edit .env.development with your actual values
   ```

2. **Production Environment:**
   ```bash
   cp .env.production.example .env.production
   # Edit .env.production with your actual values
   ```

### Required Variables

- `REACT_APP_API_URL` - Backend API URL
- `REACT_APP_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `REACT_APP_ENVIRONMENT` - Environment identifier
- `REACT_APP_DEBUG_MODE` - Enable/disable debug features
- `REACT_APP_API_TIMEOUT` - API request timeout in milliseconds

### File Structure

```
client/
├── .env.development          # Your dev config (git-ignored)
├── .env.production           # Your prod config (git-ignored)
├── .env.development.example  # Dev template (tracked)
└── .env.production.example   # Prod template (tracked)
```

### Security Note

⚠️ **Never commit actual .env files to git!** Only the .example template files should be tracked. 