import { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const { url } = JSON.parse(event.body || '{}');
    
    if (!url) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'URL is required' }),
      };
    }

    // Validate TikTok URL
    if (!url.includes('tiktok.com')) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid TikTok URL' }),
      };
    }

    // For now, return mock data
    // TikTok's API requires complex authentication
    const mockData = {
      views: Math.floor(Math.random() * 200000) + 50000,
      engagement: Math.floor(Math.random() * 20000) + 5000,
      rate: (Math.random() * 10 + 5).toFixed(1),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData),
    };
  } catch (error) {
    console.error('TikTok analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch TikTok analytics' }),
    };
  }
};