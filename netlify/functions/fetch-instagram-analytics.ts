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

    // Extract username from Instagram URL
    const usernameMatch = url.match(/instagram\.com\/([^\/\?]+)/);
    if (!usernameMatch) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid Instagram URL' }),
      };
    }

    // For now, return mock data since Instagram's API requires authentication
    // In production, you would integrate with Instagram Basic Display API
    const mockData = {
      views: Math.floor(Math.random() * 50000) + 10000,
      engagement: Math.floor(Math.random() * 5000) + 1000,
      rate: (Math.random() * 5 + 2).toFixed(1),
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(mockData),
    };
  } catch (error) {
    console.error('Instagram analytics error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Failed to fetch Instagram analytics' }),
    };
  }
};
