# Supabase Edge Functions for Campaign Analytics

These Edge Functions handle fetching analytics data from social media platforms (Instagram, YouTube, TikTok).

## Functions Overview

### 1. fetch-instagram-analytics
Fetches analytics data for Instagram posts/reels.
- **Endpoint**: `POST /fetch-instagram-analytics`
- **Payload**: `{ "url": "https://www.instagram.com/p/..." }`
- **Returns**: `{ "views": number, "engagement": number, "rate": number }`

### 2. fetch-youtube-analytics
Fetches analytics data for YouTube videos using YouTube Data API v3.
- **Endpoint**: `POST /fetch-youtube-analytics`
- **Payload**: `{ "url": "https://www.youtube.com/watch?v=..." }`
- **Returns**: `{ "views": number, "engagement": number, "rate": number }`

### 3. fetch-tiktok-analytics
Fetches analytics data for TikTok videos.
- **Endpoint**: `POST /fetch-tiktok-analytics`
- **Payload**: `{ "url": "https://www.tiktok.com/@user/video/..." }`
- **Returns**: `{ "views": number, "engagement": number, "rate": number }`

## Deployment Instructions

### Prerequisites
1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

### Deploy Functions

1. Deploy all functions at once:
   ```bash
   chmod +x deploy-edge-functions.sh
   ./deploy-edge-functions.sh
   ```

   Or deploy individually:
   ```bash
   supabase functions deploy fetch-instagram-analytics
   supabase functions deploy fetch-youtube-analytics
   supabase functions deploy fetch-tiktok-analytics
   ```

### Set Up API Keys

1. **YouTube API Key** (Required for real YouTube data):
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable YouTube Data API v3
   - Create credentials (API Key)
   - Set the key in Supabase:
     ```bash
     supabase secrets set YOUTUBE_API_KEY=your-api-key-here
     ```

2. **Instagram & TikTok** (Future implementation):
   - Currently returns mock data
   - Instagram requires Facebook App Review and Instagram Basic Display API
   - TikTok requires TikTok for Developers account and API access

### Testing Functions

1. Check function logs:
   ```bash
   supabase functions logs fetch-instagram-analytics --tail
   supabase functions logs fetch-youtube-analytics --tail
   supabase functions logs fetch-tiktok-analytics --tail
   ```

2. Test locally (optional):
   ```bash
   supabase functions serve fetch-youtube-analytics
   ```

## Troubleshooting

### "Edge Function returned a non-2xx status code"
- Check function logs for detailed error messages
- Ensure CORS headers are properly configured
- Verify API keys are set correctly
- Check if the URL format is valid

### Mock Data vs Real Data
- Functions return mock data by default
- To get real data:
  - YouTube: Set up YOUTUBE_API_KEY
  - Instagram/TikTok: Implement API integration

## API Response Format

All functions return the same response structure:
```json
{
  "views": 123456,
  "engagement": 12345,
  "rate": 10.5
}
```

Or in case of error:
```json
{
  "error": "Error message",
  "details": "Stack trace (in development)"
}
```