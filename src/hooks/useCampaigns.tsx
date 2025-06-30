import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useAnalytics } from '@/hooks/useAnalytics';

export interface Campaign {
  id: string;
  brand_name: string;
  creator_id: string;
  campaign_date: string;
  campaign_month?: string; // Changed to string to match database
  client_id?: string;
  client_name?: string;
  master_campaign_id?: string;
  deal_value?: number;
  status: 'analyzing' | 'completed' | 'draft';
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  created_at: string;
  updated_at: string;
  creators?: {
    name: string;
    platform_handles: Record<string, string>;
  };
  clients?: {
    name: string;
  };
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();
  const { triggerAnalytics, fetchYouTubeAnalytics } = useAnalytics();

  const fetchCampaigns = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          creators (
            name,
            platform_handles
          ),
          clients (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type cast the response to match our Campaign interface
      const typedCampaigns: Campaign[] = (data || []).map(campaign => ({
        ...campaign,
        status: campaign.status as 'analyzing' | 'completed' | 'draft',
        creators: campaign.creators ? {
          name: campaign.creators.name,
          platform_handles: (campaign.creators.platform_handles as Record<string, string>) || {}
        } : undefined,
        clients: campaign.clients ? {
          name: campaign.clients.name
        } : undefined
      }));
      
      setCampaigns(typedCampaigns);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to fetch campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshAllCampaigns = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to refresh campaigns",
        variant: "destructive",
      });
      return;
    }

    try {
      toast({
        title: "Refreshing campaigns",
        description: "Fetching latest analytics for all campaigns...",
      });

      // Get all campaigns with analytics data
      const { data: campaignsWithAnalytics, error } = await supabase
        .from('campaigns')
        .select(`
          *,
          analytics_data (content_url, platform)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      // Process each campaign that has analytics data
      for (const campaign of campaignsWithAnalytics || []) {
        if (campaign.analytics_data && campaign.analytics_data.length > 0) {
          for (const analytics of campaign.analytics_data) {
            if (analytics.platform === 'youtube' && analytics.content_url) {
              try {
                await supabase.functions.invoke('direct-youtube-analytics', {
                  body: {
                    campaign_id: campaign.id,
                    video_url: analytics.content_url
                  }
                });
              } catch (error) {
                console.error('Failed to refresh analytics for campaign:', campaign.id, error);
              }
            }
          }
        }
      }

      // Refresh the campaigns list after a delay to allow analytics processing
      setTimeout(async () => {
        await fetchCampaigns();
      }, 2000);

      toast({
        title: "Success",
        description: "All campaigns refreshed successfully",
      });

    } catch (error) {
      console.error('Error refreshing all campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to refresh campaigns",
        variant: "destructive",
      });
    }
  };

  const createCampaign = async (campaignData: {
    brand_name: string;
    creator_id: string;
    campaign_date: string;
    campaign_month?: string; // Changed to string
    client_id?: string;
    master_campaign_id?: string;
    deal_value?: number;
    content_urls?: { platform: string; url: string }[];
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create campaigns",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          brand_name: campaignData.brand_name,
          creator_id: campaignData.creator_id,
          campaign_date: campaignData.campaign_date,
          campaign_month: campaignData.campaign_month,
          client_id: campaignData.client_id,
          master_campaign_id: campaignData.master_campaign_id,
          deal_value: campaignData.deal_value,
          user_id: user.id,
          status: 'analyzing',
        })
        .select(`
          *,
          creators (
            name,
            platform_handles
          ),
          clients (
            name
          )
        `)
        .single();

      if (error) throw error;
      
      const typedCampaign: Campaign = {
        ...data,
        status: data.status as 'analyzing' | 'completed' | 'draft',
        creators: data.creators ? {
          name: data.creators.name,
          platform_handles: (data.creators.platform_handles as Record<string, string>) || {}
        } : undefined,
        clients: data.clients ? {
          name: data.clients.name
        } : undefined
      };
      
      setCampaigns(prev => [typedCampaign, ...prev]);

      if (campaignData.content_urls && campaignData.content_urls.length > 0) {
        console.log('Processing content URLs:', campaignData.content_urls);
        
        // Use direct analytics instead of the complex job system
        for (const contentUrl of campaignData.content_urls) {
          if (contentUrl.url.trim() && contentUrl.platform.toLowerCase() === 'youtube') {
            try {
              console.log('Fetching direct analytics for:', contentUrl.url);
              
              // Call the new direct analytics function
              const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('direct-youtube-analytics', {
                body: {
                  campaign_id: typedCampaign.id,
                  video_url: contentUrl.url
                }
              });

              if (analyticsError) {
                console.error('Failed to fetch direct analytics:', analyticsError);
              } else {
                console.log('Direct analytics successful:', analyticsData);
              }
            } catch (analyticsError) {
              console.error('Analytics fetch failed for URL:', contentUrl.url, analyticsError);
            }
          }
        }

        // Refresh campaigns after a short delay
        setTimeout(async () => {
          await fetchCampaigns();
        }, 2000);

        toast({
          title: "Success",
          description: "Campaign created and analytics are being fetched directly",
        });
      } else {
        toast({
          title: "Success",
          description: "Campaign created successfully",
        });
      }
      
      return typedCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
      return null;
    }
  };

  const triggerCampaignAnalytics = async (campaignId: string, platforms: string[] = ['youtube'], videoUrl?: string) => {
    try {
      // Get analytics data for this campaign to find video URLs
      const { data: analyticsData, error } = await supabase
        .from('analytics_data')
        .select('content_url, platform')
        .eq('campaign_id', campaignId);

      if (error) throw error;

      if (videoUrl && platforms.includes('youtube')) {
        console.log('Triggering direct analytics for specific URL:', videoUrl);
        
        const { data, error: analyticsError } = await supabase.functions.invoke('direct-youtube-analytics', {
          body: {
            campaign_id: campaignId,
            video_url: videoUrl
          }
        });

        if (analyticsError) {
          throw analyticsError;
        }

        console.log('Direct analytics result:', data);
      } else if (analyticsData && analyticsData.length > 0) {
        // Use existing URLs from analytics data
        for (const data of analyticsData) {
          if (data.platform === 'youtube' && data.content_url) {
            const { error: analyticsError } = await supabase.functions.invoke('direct-youtube-analytics', {
              body: {
                campaign_id: campaignId,
                video_url: data.content_url
              }
            });

            if (analyticsError) {
              console.error('Failed to refresh analytics for URL:', data.content_url, analyticsError);
            }
          }
        }
      } else {
        // Fallback to existing method
        await triggerAnalytics(campaignId, platforms);
      }
      
      // Refresh campaigns to get updated data
      setTimeout(async () => {
        await fetchCampaigns();
      }, 1000);
      
      toast({
        title: "Success",
        description: "Analytics refreshed successfully",
      });
    } catch (error) {
      console.error('Error triggering analytics:', error);
      toast({
        title: "Error",
        description: "Failed to refresh analytics",
        variant: "destructive",
      });
    }
  };

  const updateCampaign = async (campaignId: string, campaignData: {
    brand_name?: string;
    creator_id?: string;
    campaign_date?: string;
    campaign_month?: string; // Changed to string
    client_id?: string;
    master_campaign_id?: string;
    deal_value?: number;
    content_urls?: { platform: string; url: string }[];
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to update campaigns",
        variant: "destructive",
      });
      return null;
    }

    try {
      // First update the basic campaign data
      const updateData = {
        brand_name: campaignData.brand_name,
        creator_id: campaignData.creator_id,
        campaign_date: campaignData.campaign_date,
        campaign_month: campaignData.campaign_month,
        client_id: campaignData.client_id,
        master_campaign_id: campaignData.master_campaign_id,
        deal_value: campaignData.deal_value,
      };

      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .eq('user_id', user.id)
        .select(`
          *,
          creators (
            name,
            platform_handles
          ),
          clients (
            name
          )
        `)
        .single();

      if (error) throw error;
      
      // Type cast the response to match our Campaign interface
      const typedCampaign: Campaign = {
        ...data,
        status: data.status as 'analyzing' | 'completed' | 'draft',
        creators: data.creators ? {
          name: data.creators.name,
          platform_handles: (data.creators.platform_handles as Record<string, string>) || {}
        } : undefined,
        clients: data.clients ? {
          name: data.clients.name
        } : undefined
      };
      
      // Process new content URLs if provided
      if (campaignData.content_urls && campaignData.content_urls.length > 0) {
        console.log('Processing updated content URLs:', campaignData.content_urls);
        
        // Process YouTube URLs for analytics
        for (const contentUrl of campaignData.content_urls) {
          if (contentUrl.url.trim() && contentUrl.platform.toLowerCase() === 'youtube') {
            try {
              console.log('Fetching analytics for updated URL:', contentUrl.url);
              
              const { data: analyticsData, error: analyticsError } = await supabase.functions.invoke('direct-youtube-analytics', {
                body: {
                  campaign_id: campaignId,
                  video_url: contentUrl.url
                }
              });

              if (analyticsError) {
                console.error('Failed to fetch analytics for updated URL:', analyticsError);
              } else {
                console.log('Analytics successful for updated URL:', analyticsData);
              }
            } catch (analyticsError) {
              console.error('Analytics fetch failed for updated URL:', contentUrl.url, analyticsError);
            }
          }
        }

        // Refresh campaigns after processing URLs to get updated totals
        setTimeout(async () => {
          await fetchCampaigns();
        }, 3000);

        toast({
          title: "Success",
          description: "Campaign updated and analytics are being refreshed",
        });
      } else {
        // Update local state immediately if no URLs to process
        setCampaigns(prev => prev.map(campaign => 
          campaign.id === campaignId ? typedCampaign : campaign
        ));
        
        toast({
          title: "Success",
          description: "Campaign updated successfully",
        });
      }
      
      return typedCampaign;
    } catch (error) {
      console.error('Error updating campaign:', error);
      toast({
        title: "Error",
        description: "Failed to update campaign",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteCampaign = async (campaignId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete campaigns",
        variant: "destructive",
      });
      return false;
    }

    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setCampaigns(prev => prev.filter(campaign => campaign.id !== campaignId));
      
      toast({
        title: "Success",
        description: "Campaign deleted successfully",
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting campaign:', error);
      toast({
        title: "Error",
        description: "Failed to delete campaign",
        variant: "destructive",
      });
      return false;
    }
  };

  const getTotalEngagement = (startDate?: string, endDate?: string, campaignIds?: string[]) => {
    let filteredCampaigns = campaigns;

    if (startDate || endDate) {
      filteredCampaigns = campaigns.filter(campaign => {
        const campaignDate = new Date(campaign.campaign_date);
        if (startDate && campaignDate < new Date(startDate)) return false;
        if (endDate && campaignDate > new Date(endDate)) return false;
        return true;
      });
    }

    if (campaignIds && campaignIds.length > 0) {
      filteredCampaigns = filteredCampaigns.filter(campaign => 
        campaignIds.includes(campaign.id)
      );
    }

    return filteredCampaigns.reduce((total, campaign) => total + campaign.total_engagement, 0);
  };

  // Set up real-time subscription for campaigns updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('campaigns-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'campaigns',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          // Refresh campaigns when any change occurs
          fetchCampaigns();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  return {
    campaigns,
    loading,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    getTotalEngagement,
    triggerCampaignAnalytics,
    refreshAllCampaigns,
    refetch: fetchCampaigns,
  };
};
