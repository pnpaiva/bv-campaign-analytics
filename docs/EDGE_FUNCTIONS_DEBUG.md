# Edge Functions Debugging Guide

This guide helps you diagnose and fix issues with the analytics Edge Functions.

## Quick Diagnostics

### 1. Browser Console Test

Open your browser console on the app and run:

```javascript
// This will test all three Edge Functions
debugEdgeFunctions()
```

### 2. Check Edge Function Logs

```bash
# Check YouTube analytics logs
supabase functions logs fetch-youtube-analytics --tail 50

# Check Instagram analytics logs  
supabase functions logs fetch-instagram-analytics --tail 50

# Check TikTok analytics logs
supabase functions logs fetch-tiktok-analytics --tail 50
```

### 3. Verify Secrets

```bash
# List all configured secrets
supabase secrets list

# You should see:
# - YOUTUBE_API_KEY
# - APIFY_API_KEY
# - Any other required keys
```

## Common Issues and Solutions

### Issue: "Edge Function returned a non-2xx status code"

**Possible Causes:**

1. **Missing API Keys**
   ```bash
   # Set YouTube API key
   supabase secrets set YOUTUBE_API_KEY=your-key-here
   
   # Set Apify API key
   supabase secrets set APIFY_API_KEY=your-key-here
   ```

2. **Function Not Deployed**
   ```bash
   # Deploy all functions
   supabase functions deploy fetch-youtube-analytics
   supabase functions deploy fetch-instagram-analytics
   supabase functions deploy fetch-tiktok-analytics
   ```

3. **CORS Issues**
   - Ensure your Edge Functions include proper CORS headers
   - Check that the `_shared/cors.ts` file exists

4. **Invalid URL Format**
   - YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
   - Instagram: `https://www.instagram.com/p/POST_ID/`
   - TikTok: `https://www.tiktok.com/@username/video/VIDEO_ID`

### Issue: Analytics always return 0

**Possible Causes:**

1. **API Quota Exceeded**
   - Check YouTube API quota in Google Cloud Console
   - Check Apify account limits

2. **Invalid API Response**
   - Check Edge Function logs for API response errors
   - Verify API keys are valid and have proper permissions

## Using the New Analytics Service

### Basic Usage

```typescript
import { analyticsService } from '@/lib/analytics-service';

// Fetch analytics for a single URL
const analytics = await analyticsService.fetchAnalyticsByUrl(
  'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
);

console.log(analytics);
// { views: 1234567, engagement: 12345, rate: 1.5, platform: 'youtube' }
```

### React Hook Usage

```typescript
import { useAnalytics } from '@/hooks/useAnalytics';

function MyComponent() {
  const { fetchAnalytics, fetchBatchAnalytics, isLoading } = useAnalytics();
  
  const handleFetch = async () => {
    const results = await fetchBatchAnalytics([
      'https://www.youtube.com/watch?v=abc123',
      'https://www.instagram.com/p/xyz789/'
    ]);
    
    console.log(results);
  };
  
  return (
    <button onClick={handleFetch} disabled={isLoading}>
      {isLoading ? 'Fetching...' : 'Fetch Analytics'}
    </button>
  );
}
```

### Campaign Form Integration

```typescript
import { CampaignFormHandler } from '@/components/CampaignFormHandler';

function CampaignForm() {
  return (
    <CampaignFormHandler onSubmit={(data) => console.log('Created:', data)}>
      {({ handleSubmit, isLoading, error }) => (
        <form onSubmit={(e) => {
          e.preventDefault();
          handleSubmit(formData);
        }}>
          {/* Your form fields */}
        </form>
      )}
    </CampaignFormHandler>
  );
}
```

## Testing with Real URLs

```javascript
// In browser console
const debugger = new EdgeFunctionDebugger();

// Test with your actual campaign URLs
const results = await debugger.testWithRealUrls({
  youtube: 'https://www.youtube.com/watch?v=YOUR_VIDEO_ID',
  instagram: 'https://www.instagram.com/p/YOUR_POST_ID/',
  tiktok: 'https://www.tiktok.com/@USER/video/VIDEO_ID'
});

console.log(debugger.generateReport(results));
```

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   React App     │────▶│ Analytics Service │────▶│  Edge Functions │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                           │
                                                           ▼
                                                   ┌───────────────┐
                                                   │  External APIs│
                                                   │  - YouTube    │
                                                   │  - Apify      │
                                                   └───────────────┘
```

## Error Handling Flow

1. **Edge Function Error** → Returns default values (0) with error message
2. **Analytics Service** → Catches errors, logs them, returns safe defaults
3. **React Hook** → Shows warning toast, continues with default values
4. **Campaign Form** → Creates campaign with available data

## Monitoring

- Check Supabase Dashboard for Edge Function invocations
- Monitor API usage in respective dashboards (YouTube, Apify)
- Use browser DevTools to inspect network requests
- Check application logs for detailed error messages

## Support

For Beyond Views team members:
- Technical issues: tech@beyondviews.com
- API key requests: admin@beyondviews.com
- Emergency: Contact Pedro directly