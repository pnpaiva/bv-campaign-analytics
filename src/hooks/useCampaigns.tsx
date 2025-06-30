
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useDirectAnalytics } from '@/hooks/useDirectAnalytics';

export interface Campaign {
  id: string;
  brand_name: string;
  creator_id: string;
  campaign_date: string;
  campaign_month?: string;
  client_id?: string;
  client_name?: string;
  master_campaign_id?: string;
  master_campaign_name?: string;
  master_campaign_start_date?: string;
  master_campaign_end_date?: string;
  deal_value?: number;
  status: 'analyzing' | 'completed' | 'draft';
  total_views: number;
  total_engagement: number;
  engagement_rate: number;
  is_master_campaign_template?: boolean;
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
  const { fetchDirectAnalytics } = useDirectAnalytics();

  const fetchCampaigns = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      console.log('=== Fetching Campaigns ===');
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
      
      console.log('Raw campaign data:', data);
      
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
      
      console.log('Processed campaigns:', typedCampaigns);
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

    console.log('=== Refreshing All Campaigns ===');
    
    try {
      toast({
        title: "Refreshing campaigns",
        description: "Fetching latest analytics for all campaigns...",
      });

      // Get all campaigns with their analytics data
      const { data: campaignsWithAnalytics, error } = await supabase
        .from('campaigns')
        .select(`
          id,
          brand_name,
          analytics_data (content_url, platform)
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      console.log('Campaigns with analytics:', campaignsWithAnalytics);

      let refreshCount = 0;
      
      // Process each campaign
      for (const campaign of campaignsWithAnalytics || []) {
        console.log(`Processing campaign: ${campaign.brand_name}`);
        
        if (campaign.analytics_data && campaign.analytics_data.length > 0) {
          // Use existing analytics data URLs
          for (const analytics of campaign.analytics_data) {
            if (analytics.platform === 'youtube' && analytics.content_url) {
              try {
                console.log(`Refreshing analytics for URL: ${analytics.content_url}`);
                await fetchDirectAnalytics(campaign.id, analytics.content_url);
                refreshCount++;
              } catch (error) {
                console.error(`Failed to refresh analytics for ${analytics.content_url}:`, error);
              }
            }
          }
        } else {
          // If no analytics data exists, try to find YouTube URLs from recent campaign creation
          // This is a fallback for campaigns that might have been created with URLs but no analytics
          console.log(`No analytics data found for campaign: ${campaign.brand_name}`);
        }
      }

      // Refresh the campaigns list after processing
      setTimeout(async () => {
        await fetchCampaigns();
      }, 3000);

      toast({
        title: "Success",
        description: `Refreshed analytics for ${refreshCount} videos`,
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
    campaign_month?: string;
    client_id?: string;
    master_campaign_id?: string;
    master_campaign_name?: string;
    master_campaign_start_date?: string;
    master_campaign_end_date?: string;
    deal_value?: number;
    content_urls?: { platform: string; url: string }[];
    is_master_campaign_template?: boolean;
  }) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create campaigns",
        variant: "destructive",
      });
      return null;
    }

    console.log('=== Creating Campaign ===');
    console.log('Campaign data:', campaignData);

    try {
      // Create the campaign first
      const { data, error } = await supabase
        .from('campaigns')
        .insert({
          brand_name: campaignData.brand_name,
          creator_id: campaignData.creator_id,
          campaign_date: campaignData.campaign_date,
          campaign_month: campaignData.campaign_month,
          client_id: campaignData.client_id,
          master_campaign_id: campaignData.master_campaign_id,
          master_campaign_name: campaignData.master_campaign_name,
          master_campaign_start_date: campaignData.master_campaign_start_date,
          master_campaign_end_date: campaignData.master_campaign_end_date,
          deal_value: campaignData.deal_value,
          user_id: user.id,
          status: 'analyzing',
          is_master_campaign_template: campaignData.is_master_campaign_template || false,
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
      
      console.log('Campaign created successfully:', data);
      
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

      // Process content URLs for analytics if provided (skip for master campaign templates)
      if (campaignData.content_urls && campaignData.content_urls.length > 0 && !campaignData.is_master_campaign_template) {
        console.log('Processing content URLs for analytics:', campaignData.content_urls);
        
        let analyticsProcessed = 0;
        
        for (const contentUrl of campaignData.content_urls) {
          if (contentUrl.url.trim() && contentUrl.platform.toLowerCase() === 'youtube') {
            try {
              console.log(`Processing YouTube URL: ${contentUrl.url}`);
              await fetchDirectAnalytics(typedCampaign.id, contentUrl.url);
              analyticsProcessed++;
            } catch (analyticsError) {
              console.error('Analytics fetch failed for URL:', contentUrl.url, analyticsError);
            }
          }
        }

        // Refresh campaigns after processing analytics
        if (analyticsProcessed > 0) {
          setTimeout(async () => {
            await fetchCampaigns();
          }, 2000);

          toast({
            title: "Success",
            description: `Campaign created and ${analyticsProcessed} video(s) processed for analytics`,
          });
        } else {
          toast({
            title: "Campaign Created",
            description: "Campaign created but no valid YouTube URLs found for analytics",
            variant: "default",
          });
        }
      } else if (campaignData.is_master_campaign_template) {
        toast({
          title: "Success",
          description: "Master campaign template created successfully",
        });
      } else {
        toast({
          title: "Success",
          description: "Campaign created successfully - add YouTube URLs to fetch analytics",
        });
      }
      
      return typedCampaign;
    } catch (error) {
      console.error('Error creating campaign:', error);
      toast({
        title: "Error",
        description: `Failed to create campaign: ${error.message}`,
        variant: "destructive",
      });
      return null;
    }
  };

  const triggerCampaignAnalytics = async (campaignId: string, platforms: string[] = ['youtube'], videoUrl?: string) => {
    console.log('=== Triggering Campaign Analytics ===');
    console.log('Campaign ID:', campaignId);
    console.log('Video URL:', videoUrl);
    
    try {
      if (videoUrl && platforms.includes('youtube')) {
        console.log('Processing specific video URL:', videoUrl);
        await fetchDirectAnalytics(campaignId, videoUrl);
      } else {
        // Get existing analytics data for this campaign
        const { data: analyticsData, error } = await supabase
          .from('analytics_data')
          .select('content_url, platform')
          .eq('campaign_id', campaignId);

        if (error) throw error;

        console.log('Existing analytics data:', analyticsData);

        if (analyticsData && analyticsData.length > 0) {
          let processedCount = 0;
          for (const data of analyticsData) {
            if (data.platform === 'youtube' && data.content_url) {
              try {
                console.log(`Refreshing analytics for: ${data.content_url}`);
                await fetchDirectAnalytics(campaignId, data.content_url);
                processedCount++;
              } catch (error) {
                console.error('Failed to refresh analytics for URL:', data.content_url, error);
              }
            }
          }
          
          if (processedCount === 0) {
            throw new Error('No YouTube URLs found to refresh');
          }
        } else {
          throw new Error('No analytics data found for this campaign. Please add YouTube URLs first.');
        }
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
        description: `Failed to refresh analytics: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const updateCampaign = async (campaignId: string, campaignData: {
    brand_name?: string;
    creator_id?: string;
    campaign_date?: string;
    campaign_month?: string;
    client_id?: string;
    master_campaign_id?: string;
    master_campaign_name?: string;
    master_campaign_start_date?: string;
    master_campaign_end_date?: string;
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
      const updateData = {
        brand_name: campaignData.brand_name,
        creator_id: campaignData.creator_id,
        campaign_date: campaignData.campaign_date,
        campaign_month: campaignData.campaign_month,
        client_id: campaignData.client_id,
        master_campaign_id: campaignData.master_campaign_id,
        master_campaign_name: campaignData.master_campaign_name,
        master_campaign_start_date: campaignData.master_campaign_start_date,
        master_campaign_end_date: campaignData.master_campaign_end_date,
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
      
      if (campaignData.content_urls && campaignData.content_urls.length > 0) {
        console.log('Processing updated content URLs:', campaignData.content_urls);
        
        for (const contentUrl of campaignData.content_urls) {
          if (contentUrl.url.trim() && contentUrl.platform.toLowerCase() === 'youtube') {
            try {
              console.log('Fetching analytics for updated URL:', contentUrl.url);
              await fetchDirectAnalytics(campaignId, contentUrl.url);
            } catch (analyticsError) {
              console.error('Analytics fetch failed for updated URL:', contentUrl.url, analyticsError);
            }
          }
        }

        setTimeout(async () => {
          await fetchCampaigns();
        }, 3000);

        toast({
          title: "Success",
          description: "Campaign updated and analytics are being refreshed",
        });
      } else {
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
