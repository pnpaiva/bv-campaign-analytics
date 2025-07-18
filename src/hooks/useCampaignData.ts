import { useState, useEffect } from 'react';
import { Campaign, CreateCampaignData, UpdateCampaignData } from '../types/campaign';
import { fetchContentAnalytics, calculateCampaignMetrics, validateContentUrl } from '../services/campaignAnalytics';
import { toast } from 'sonner';

// Mock data storage (replace with actual database later)
const STORAGE_KEY = 'bv-campaigns';

function loadCampaigns(): Campaign[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Error loading campaigns:', error);
    return [];
  }
}

function saveCampaigns(campaigns: Campaign[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(campaigns));
  } catch (error) {
    console.error('Error saving campaigns:', error);
    toast.error('Failed to save campaigns');
  }
}

export function useCampaignData() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(false);

  // Load campaigns on mount
  useEffect(() => {
    setCampaigns(loadCampaigns());
  }, []);

  // Save campaigns whenever they change
  useEffect(() => {
    saveCampaigns(campaigns);
  }, [campaigns]);

  const createCampaign = async (data: CreateCampaignData): Promise<Campaign | null> => {
    try {
      // Validate all URLs
      for (const url of data.contentUrls) {
        const validation = validateContentUrl(url);
        if (!validation.isValid) {
          toast.error(`Invalid URL: ${validation.error}`);
          return null;
        }
      }

      const newCampaign: Campaign = {
        id: Date.now().toString(),
        name: data.name,
        brand: data.brand,
        creator: data.creator,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        contentUrls: data.contentUrls,
      };

      setCampaigns(prev => [...prev, newCampaign]);
      toast.success('Campaign created successfully');
      return newCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast.error('Failed to create campaign');
      return null;
    }
  };

  const updateCampaign = async (id: string, data: UpdateCampaignData): Promise<boolean> => {
    try {
      // Validate URLs if provided
      if (data.contentUrls) {
        for (const url of data.contentUrls) {
          const validation = validateContentUrl(url);
          if (!validation.isValid) {
            toast.error(`Invalid URL: ${validation.error}`);
            return false;
          }
        }
      }

      setCampaigns(prev => prev.map(campaign => {
        if (campaign.id === id) {
          return {
            ...campaign,
            ...data,
            updatedAt: new Date().toISOString(),
          };
        }
        return campaign;
      }));

      toast.success('Campaign updated successfully');
      return true;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast.error('Failed to update campaign');
      return false;
    }
  };

  const deleteCampaign = async (id: string): Promise<boolean> => {
    try {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
      toast.success('Campaign deleted successfully');
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast.error('Failed to delete campaign');
      return false;
    }
  };

  const refreshCampaignAnalytics = async (id: string): Promise<boolean> => {
    setLoading(true);
    try {
      const campaign = campaigns.find(c => c.id === id);
      if (!campaign) {
        toast.error('Campaign not found');
        return false;
      }

      if (campaign.contentUrls.length === 0) {
        toast.error('No content URLs to analyze');
        return false;
      }

      // Update status to analyzing
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'analyzing' as const } : c
      ));

      // Fetch analytics for all content URLs
      const analytics = await fetchContentAnalytics(campaign.contentUrls);
      const metrics = calculateCampaignMetrics(analytics);

      // Update campaign with analytics
      setCampaigns(prev => prev.map(c => {
        if (c.id === id) {
          return {
            ...c,
            status: 'completed' as const,
            analytics: {
              totalViews: metrics.totalViews,
              totalEngagement: metrics.totalEngagement,
              engagementRate: metrics.averageEngagementRate,
              lastUpdated: new Date().toISOString(),
              contentMetrics: analytics.map(a => ({
                url: a.url,
                platform: a.platform,
                views: a.viewCount,
                likes: a.engagementCount, // Simplified for now
                comments: 0, // Will be separated later
                engagementRate: a.engagementRate,
                title: a.title,
                fetchedAt: a.fetchedAt,
                error: a.error,
              })),
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return c;
      }));

      toast.success('Analytics updated successfully');
      return true;
    } catch (error) {
      console.error('Error refreshing analytics:', error);
      
      // Update status to error
      setCampaigns(prev => prev.map(c => 
        c.id === id ? { ...c, status: 'error' as const } : c
      ));
      
      toast.error('Failed to fetch analytics');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    refreshCampaignAnalytics,
  };
}