
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
          campaign_id: creatorId, // Using creator ID as campaign ID for this context
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
