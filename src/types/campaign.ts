export interface Campaign {
  id: string;
  name: string;
  brand: string;
  creator: string;
  status: 'draft' | 'analyzing' | 'completed' | 'error';
  createdAt: string;
  updatedAt: string;
  contentUrls: string[];
  analytics?: CampaignAnalytics;
}

export interface CampaignAnalytics {
  totalViews: number;
  totalEngagement: number;
  engagementRate: number;
  lastUpdated: string;
  contentMetrics: ContentMetric[];
}

export interface ContentMetric {
  url: string;
  platform: 'youtube' | 'instagram' | 'tiktok';
  views: number;
  likes: number;
  comments: number;
  shares?: number; // TikTok specific
  engagementRate: number;
  title?: string;
  fetchedAt: string;
  error?: string;
}

export interface CreateCampaignData {
  name: string;
  brand: string;
  creator: string;
  contentUrls: string[];
}

export interface UpdateCampaignData {
  name?: string;
  brand?: string;
  creator?: string;
  contentUrls?: string[];
}