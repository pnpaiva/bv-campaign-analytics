# BV Campaign Analytics

A comprehensive analytics platform for tracking influencer marketing campaigns across YouTube, Instagram, and TikTok, built for Beyond Views.

## Features

- **Multi-Platform Support**: Track performance across YouTube, Instagram, and TikTok
- **Real-Time Analytics**: Fetch live engagement metrics using official APIs
- **Campaign Management**: Create, edit, and monitor multiple campaigns
- **Secure API Integration**: 
  - YouTube Data API v3 for YouTube
  - Apify actors for Instagram and TikTok
- **Beautiful UI**: Built with React, TypeScript, and Tailwind CSS

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- API Keys:
  - Apify API Token (for Instagram and TikTok data)
  - YouTube Data API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/pnpaiva/bv-campaign-analytics.git
   cd bv-campaign-analytics
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```
   VITE_APIFY_API_TOKEN=your_apify_token_here
   VITE_YOUTUBE_API_KEY=your_youtube_api_key_here
   VITE_APIFY_INSTAGRAM_ACTOR=apify/instagram-post-scraper
   VITE_APIFY_TIKTOK_ACTOR=clockworks/free-tiktok-scraper
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## API Configuration

### Apify Actors Used

- **Instagram**: `apify/instagram-post-scraper`
- **TikTok**: `clockworks/free-tiktok-scraper`

### Getting API Keys

#### Apify (Instagram & TikTok Data)

1. Sign up at [Apify.com](https://apify.com)
2. Go to [Account - Integrations](https://console.apify.com/account/integrations)
3. Copy your API token
4. Monitor usage at [Billing](https://console.apify.com/billing/payment)

#### YouTube Data API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "YouTube Data API v3"
4. Create credentials (API Key)
5. (Optional) Add restrictions for security

## Usage

### Creating a Campaign

1. Click "Create Campaign"
2. Fill in campaign details:
   - Campaign name
   - Brand name
   - Creator name
   - Content URLs (YouTube, Instagram, and/or TikTok)
3. Click "Save"

### Supported URL Formats

- **YouTube**: 
  - `https://youtube.com/watch?v=VIDEO_ID`
  - `https://youtu.be/VIDEO_ID`
  
- **Instagram**: 
  - `https://instagram.com/p/POST_ID/`
  - `https://instagram.com/reel/REEL_ID/`
  - `https://instagram.com/tv/TV_ID/`
  
- **TikTok**:
  - `https://tiktok.com/@username/video/VIDEO_ID`
  - `https://vm.tiktok.com/SHORT_ID`

### Refreshing Analytics

1. Click the "Refresh" button on any campaign
2. Wait for the API calls to complete
3. View updated metrics:
   - Total views
   - Engagement rate
   - Platform breakdown
   - Individual content performance

## Security

**IMPORTANT**: Never commit API keys or sensitive data!

- All API keys should be in `.env` (which is gitignored)
- See [SECURITY.md](SECURITY.md) for detailed security practices
- Rotate API keys regularly
- Monitor API usage for unusual activity

## Project Structure

```
src/
├── components/       # Reusable UI components
├── config/          # API configuration
├── hooks/           # Custom React hooks
├── pages/           # Page components
├── services/        # API integration services
│   ├── instagramApi.ts
│   ├── youtubeApi.ts
│   ├── tiktokApi.ts
│   └── campaignAnalytics.ts
├── types/           # TypeScript type definitions
└── utils/           # Utility functions
```

## API Rate Limits & Costs

### YouTube
- **Free Tier**: 10,000 units/day
- **Video stats**: ~3 units per request

### Apify (Instagram & TikTok)
- **Instagram**: ~0.04 compute units per post
- **TikTok**: ~0.02 compute units per video
- Check your [Apify billing](https://console.apify.com/billing) for current usage

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Platforms

1. Create a new API service in `src/services/`
2. Add platform detection in `campaignAnalytics.ts`
3. Update types in `src/types/campaign.ts`
4. Update UI components to display new platform data

## Troubleshooting

### "No analytics data found"
- Check if API keys are correctly set in `.env`
- Verify URLs are in the correct format
- Check browser console for API errors
- Ensure you have sufficient Apify credits

### "Invalid URL"
- Ensure URL is a direct link to content
- Check supported formats above
- Remove any tracking parameters

### API Errors
- **429 Too Many Requests**: You've hit rate limits
- **403 Forbidden**: Check API key validity
- **Timeout**: Apify actors may take 30-60 seconds

## Deployment

### Lovable.dev

This project is integrated with Lovable.dev. Changes pushed to GitHub automatically sync.

### Manual Deployment

1. Build the project:
   ```bash
   npm run build
   ```

2. Deploy the `dist` folder to your hosting service

3. Set environment variables in your hosting platform

## Contributing

1. Create a feature branch
2. Make your changes
3. Ensure no sensitive data is exposed
4. Submit a pull request

## License

Proprietary - Beyond Views

## Support

For issues or questions, contact the Beyond Views team.