
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDirectAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDirectAnalytics = async (campaignId: string, videoUrl: string) => {
    setLoading(true);
    
    console.log('Starting direct analytics fetch for campaign:', campaignId);
    
    try {
      const cleanUrl = videoUrl.trim();
      if (!cleanUrl) {
        throw new Error('Empty video URL provided');
      }

      // Validate YouTube URL format
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      if (!youtubeRegex.test(cleanUrl)) {
        throw new Error('Invalid YouTube URL format');
      }

      console.log('Calling direct YouTube analytics function...');
      
      const { data, error } = await supabase.functions.invoke('direct-youtube-analytics', {
        body: { 
          campaign_id: campaignId,
          video_url: cleanUrl
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Function call failed: ${error.message}`);
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error occurred';
        console.error('Function returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Analytics data received:', data.data);

      toast({
        title: "Success",
        description: `Analytics fetched: ${data.data?.views || 0} views, ${data.data?.engagement || 0} engagement`,
      });

      return data;
    } catch (error) {
      console.error('Direct analytics error:', error);
      
      toast({
        title: "Analytics Error",
        description: error.message || 'Failed to fetch analytics',
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchDirectAnalytics,
  };
};
