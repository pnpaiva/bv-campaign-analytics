// API Configuration
// WARNING: In production, these should be environment variables!
// This file is for development purposes only.

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV;

// API Keys - Use environment variables in production
export const API_CONFIG = {
  // Apify Configuration
  APIFY_API_TOKEN: import.meta.env.VITE_APIFY_API_TOKEN || (isDevelopment ? '' : ''),
  
  // YouTube Configuration  
  YOUTUBE_API_KEY: import.meta.env.VITE_YOUTUBE_API_KEY || (isDevelopment ? '' : ''),
  
  // Apify Actors
  APIFY_INSTAGRAM_ACTOR: 'nH2AHrwxeTRJoN5hX',
  APIFY_TIKTOK_ACTOR: 'OtzYfK1ndEGdwWFKQ',
};

// API Endpoints
export const API_ENDPOINTS = {
  // Apify endpoints
  APIFY_INSTAGRAM_RUN: `https://api.apify.com/v2/acts/${API_CONFIG.APIFY_INSTAGRAM_ACTOR}/runs`,
  APIFY_TIKTOK_RUN: `https://api.apify.com/v2/acts/${API_CONFIG.APIFY_TIKTOK_ACTOR}/runs`,
  
  // YouTube endpoint
  YOUTUBE_VIDEOS: 'https://www.googleapis.com/youtube/v3/videos',
};

// Validate configuration
export function validateApiConfig(): { isValid: boolean; missingKeys: string[] } {
  const missingKeys: string[] = [];
  
  if (!API_CONFIG.APIFY_API_TOKEN) {
    missingKeys.push('VITE_APIFY_API_TOKEN');
  }
  
  if (!API_CONFIG.YOUTUBE_API_KEY) {
    missingKeys.push('VITE_YOUTUBE_API_KEY');
  }
  
  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}