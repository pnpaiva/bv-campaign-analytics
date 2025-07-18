import { toast } from 'sonner';

interface TikTokVideoData {
  url: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  engagementRate: number;
  caption?: string;
  publishedAt?: string;
  authorUsername?: string;
  musicTitle?: string;
}

// TikTok URL validation
export function isTikTokUrl(url: string): boolean {
  const tiktokUrlPattern = /^https?:\/\/(www\.|m\.)?(tiktok\.com\/@[\w.-]+\/video\/\d+|vm\.tiktok\.com\/\w+)/;
  const isValid = tiktokUrlPattern.test(url);
  console.log('Checking TikTok URL:', url, 'Valid:', isValid);
  return isValid;
}

// Fetch TikTok data via Supabase Edge Function
export async function fetchTikTokData(url: string): Promise<TikTokVideoData | null> {
  try {
    // Validate TikTok URL
    if (!isTikTokUrl(url)) {
      console.error('Invalid TikTok URL:', url);
      toast.error('Invalid TikTok URL format');
      return null;
    }

    console.log('Fetching TikTok data via Edge Function:', url);

    const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
    const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      console.error('Supabase configuration missing');
      toast.error('TikTok API not configured. Please check your environment variables.');
      return null;
    }

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/tiktok-analytics`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ url }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch TikTok data');
    }

    const data = await response.json();
    console.log('TikTok data received:', data);

    // Calculate engagement rate
    const engagementRate = data.viewCount > 0 
      ? ((data.likeCount + data.commentCount + data.shareCount) / data.viewCount) * 100 
      : 0;

    return {
      url,
      viewCount: data.viewCount || 0,
      likeCount: data.likeCount || 0,
      commentCount: data.commentCount || 0,
      shareCount: data.shareCount || 0,
      engagementRate,
      caption: data.caption,
      publishedAt: data.timestamp || new Date().toISOString(),
      authorUsername: data.authorUsername,
      musicTitle: data.musicTitle,
    };
  } catch (error) {
    console.error('Error fetching TikTok data:', error);
    toast.error(`Failed to fetch TikTok data: ${error.message}`);
    return null;
  }
}