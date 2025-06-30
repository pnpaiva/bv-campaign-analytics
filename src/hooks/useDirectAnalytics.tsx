
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDirectAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDirectAnalytics = async (campaignId: string, videoUrl: string) => {
    setLoading(true);
    
    console.log('=== Starting Direct Analytics Fetch ===');
    console.log('Campaign ID:', campaignId);
    console.log('Video URL:', videoUrl);
    
    try {
      // Clean the video URL
      const cleanUrl = videoUrl.trim();
      if (!cleanUrl) {
        throw new Error('Empty video URL provided');
      }

      // Validate YouTube URL format
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      if (!youtubeRegex.test(cleanUrl)) {
        throw new Error('Invalid YouTube URL format. Please provide a valid YouTube URL.');
      }

      console.log('Calling direct YouTube analytics function...');
      
      const { data, error } = await supabase.functions.invoke('direct-youtube-analytics', {
        body: { 
          campaign_id: campaignId,
          video_url: cleanUrl
        }
      });

      console.log('Direct analytics response:', data);
      console.log('Direct analytics error:', error);

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(`Function error: ${error.message}`);
      }

      if (!data || !data.success) {
        console.error('Function returned unsuccessful response:', data);
        throw new Error(data?.error || 'Analytics fetch failed - function returned unsuccessful response');
      }

      console.log('Analytics data received:', data.data);

      toast({
        title: "Success",
        description: `YouTube analytics fetched: ${data.data?.views || 0} views, ${data.data?.engagement || 0} engagement`,
      });

      return data;
    } catch (error) {
      console.error('=== Direct Analytics Error ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      toast({
        title: "Analytics Error",
        description: `Failed to fetch analytics: ${error.message}`,
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
