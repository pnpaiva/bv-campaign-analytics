# Security Best Practices for BV Campaign Analytics

## Environment Variables

### Never Commit Sensitive Data
- **NEVER** commit `.env` files to the repository
- **NEVER** hardcode API keys, passwords, or tokens in your code
- **ALWAYS** use environment variables for sensitive configuration

### Setting Up Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Add your actual API keys to `.env`:
   ```
   VITE_APIFY_API_TOKEN=your_actual_apify_token
   VITE_YOUTUBE_API_KEY=your_actual_youtube_key
   ```

3. **NEVER** share your `.env` file or commit it to Git

## API Key Security

### Apify API Token
- Get your token from: https://console.apify.com/account/integrations
- Keep it secret and rotate regularly
- Monitor usage to detect any unauthorized access

### YouTube API Key
- Get your key from: https://console.cloud.google.com/
- Restrict it to specific APIs (YouTube Data API v3)
- Add referrer restrictions for production

## Code Security

### Before Committing
1. Search for hardcoded secrets:
   ```bash
   # Search for potential secrets
   grep -r "api_key\|secret\|password\|token" src/
   ```

2. Review changes:
   ```bash
   git diff --staged
   ```

3. Use environment variables:
   ```typescript
   // ❌ BAD
   const API_KEY = "sk-1234567890";
   
   // ✅ GOOD
   const API_KEY = import.meta.env.VITE_API_KEY;
   ```

## Production Security

### When Deploying
1. Set environment variables in your hosting platform
2. Use HTTPS only
3. Implement rate limiting
4. Monitor API usage
5. Rotate keys regularly

### Lovable.dev Deployment
- Environment variables are set in the Lovable project settings
- Never expose sensitive data in the UI
- Use server-side validation for all inputs

## If You Accidentally Commit Secrets

1. **Immediately rotate the exposed keys**
2. Remove from Git history:
   ```bash
   git filter-branch --force --index-filter \
     'git rm --cached --ignore-unmatch path/to/file' \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Force push to all branches
4. Contact support if using third-party services

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] No hardcoded API keys in code
- [ ] All sensitive config uses environment variables
- [ ] API keys have appropriate restrictions
- [ ] Regular key rotation schedule
- [ ] Monitoring for unusual API usage
- [ ] HTTPS enforced in production
- [ ] Input validation implemented
- [ ] Error messages don't expose sensitive info

## Contact

For security concerns, contact the repository owner immediately.