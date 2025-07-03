
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface YouTubeAnalytics {
  views: number;
  subscribers: number;
  engagement: number;
  title: string;
  publishedAt: string;
}

export const useYouTubeAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchYouTubeAnalytics = useCallback(async (channelUrl: string, creatorId: string) => {
    if (!channelUrl) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('fetch-youtube-analytics', {
        body: {
          campaign_id: creatorId,
          video_url: channelUrl
        }
      });

      if (error) {
        console.error('Error fetching YouTube analytics:', error);
        toast({
          title: "Error",
          description: "Failed to fetch YouTube analytics",
          variant: "destructive",
        });
        return null;
      }

      // Store the data in our new youtube_analytics table
      if (data?.data) {
        const analyticsData = data.data;
        
        const { error: insertError } = await supabase
          .from('youtube_analytics')
          .upsert({
            creator_roster_id: creatorId,
            views: analyticsData.views || 0,
            likes: analyticsData.likes || 0,
            comments: analyticsData.comments || 0,
            engagement_rate: analyticsData.engagement_rate || 0,
            title: analyticsData.title || '',
            published_at: analyticsData.publishedAt || null,
            date_recorded: new Date().toISOString().split('T')[0]
          });

        if (insertError) {
          console.error('Error storing YouTube analytics:', insertError);
        }
      }

      return data?.data as YouTubeAnalytics;
    } catch (error) {
      console.error('Error calling YouTube analytics function:', error);
      toast({
        title: "Error",
        description: "Failed to fetch YouTube analytics",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    fetchYouTubeAnalytics,
    loading
  };
};
