// Analytics API utility functions

interface AnalyticsData {
  views: number;
  engagement: number;
  rate: string;
}

const API_BASE_URL = '/.netlify/functions';

export async function fetchInstagramAnalytics(url: string): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch-instagram-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`Instagram analytics fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching Instagram analytics:', error);
    throw error;
  }
}

export async function fetchYoutubeAnalytics(url: string): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch-youtube-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`YouTube analytics fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching YouTube analytics:', error);
    throw error;
  }
}

export async function fetchTikTokAnalytics(url: string): Promise<AnalyticsData> {
  try {
    const response = await fetch(`${API_BASE_URL}/fetch-tiktok-analytics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      throw new Error(`TikTok analytics fetch failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching TikTok analytics:', error);
    throw error;
  }
}

// Main function to fetch analytics based on URL type
export async function fetchDirectAnalytics(url: string): Promise<AnalyticsData> {
  if (url.includes('instagram.com')) {
    return fetchInstagramAnalytics(url);
  } else if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return fetchYoutubeAnalytics(url);
  } else if (url.includes('tiktok.com')) {
    return fetchTikTokAnalytics(url);
  } else {
    throw new Error('Unsupported platform URL');
  }
}