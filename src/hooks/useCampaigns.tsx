
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Campaign {
  id: string;
  brand_name: string;
  creator_id: string;
  campaign_date: string;
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
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

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
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCampaigns(data || []);
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

  const createCampaign = async (campaignData: {
    brand_name: string;
    creator_id: string;
    campaign_date: string;
    deal_value?: number;
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
          ...campaignData,
          user_id: user.id,
        })
        .select(`
          *,
          creators (
            name,
            platform_handles
          )
        `)
        .single();

      if (error) throw error;
      
      setCampaigns(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Campaign created successfully",
      });
      
      return data;
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

  useEffect(() => {
    fetchCampaigns();
  }, [user]);

  return {
    campaigns,
    loading,
    createCampaign,
    getTotalEngagement,
    refetch: fetchCampaigns,
  };
};
