import { toast } from 'sonner';

interface YouTubeVideoData {
  url: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  engagementRate: number;
  title?: string;
  publishedAt?: string;
  channelTitle?: string;
  duration?: string;
}

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY || '';

export async function fetchYouTubeData(url: string): Promise<YouTubeVideoData | null> {
  if (!YOUTUBE_API_KEY) {
    console.error('YouTube API key not configured');
    toast.error('YouTube API not configured. Please add VITE_YOUTUBE_API_KEY to your environment variables.');
    return null;
  }

  try {
    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(url);
    if (!videoId) {
      toast.error('Invalid YouTube URL');
      return null;
    }

    console.log('Fetching YouTube data for video ID:', videoId);

    // Call YouTube Data API v3
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?` +
      `part=statistics,snippet,contentDetails&` +
      `id=${videoId}&` +
      `key=${YOUTUBE_API_KEY}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`YouTube API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error('Video not found');
    }

    const video = data.items[0];
    const statistics = video.statistics;
    const snippet = video.snippet;
    const contentDetails = video.contentDetails;

    console.log('YouTube data received:', { statistics, snippet });

    // Parse the data
    const viewCount = parseInt(statistics.viewCount || '0');
    const likeCount = parseInt(statistics.likeCount || '0');
    const commentCount = parseInt(statistics.commentCount || '0');

    const youtubeData: YouTubeVideoData = {
      url,
      viewCount,
      likeCount,
      commentCount,
      engagementRate: calculateEngagementRate(likeCount, commentCount, viewCount),
      title: snippet.title,
      publishedAt: snippet.publishedAt,
      channelTitle: snippet.channelTitle,
      duration: parseDuration(contentDetails.duration),
    };

    return youtubeData;
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    toast.error(`Failed to fetch YouTube data: ${error.message}`);
    return null;
  }
}

function calculateEngagementRate(likes: number, comments: number, views: number): number {
  if (views === 0) return 0;
  return ((likes + comments) / views) * 100;
}

function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
    /youtube\.com\/embed\/([\w-]+)/,
    /youtube\.com\/v\/([\w-]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function parseDuration(duration: string): string {
  // Convert ISO 8601 duration to human-readable format
  // Example: PT4M13S -> 4:13
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }
}

export function isYouTubeUrl(url: string): boolean {
  const youtubeUrlPattern = /^https?:\/\/(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)([\w-]+)/;
  return youtubeUrlPattern.test(url);
}