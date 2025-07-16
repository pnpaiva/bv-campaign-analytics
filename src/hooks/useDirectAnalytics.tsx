
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDirectAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDirectAnalytics = async (campaignId: string, videoUrl: string) => {
    setLoading(true);
    
    console.log('=== Starting direct analytics fetch ===');
    console.log('Campaign ID:', campaignId);
    console.log('Video URL:', videoUrl);
    
    try {
      const cleanUrl = videoUrl.trim();
      if (!cleanUrl) {
        throw new Error('Empty video URL provided');
      }

      // Determine platform and validate URL
      let platform = '';
      let functionName = '';
      
      const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
      const instagramRegex = /(?:instagram\.com\/(?:p|reel)\/([A-Za-z0-9_-]+))/;
      const tiktokRegex = /(?:tiktok\.com\/@[\w.-]+\/video\/(\d+))/;

      if (youtubeRegex.test(cleanUrl)) {
        platform = 'youtube';
        functionName = 'direct-youtube-analytics';
      } else if (instagramRegex.test(cleanUrl)) {
        platform = 'instagram';
        functionName = 'fetch-instagram-analytics';
      } else if (tiktokRegex.test(cleanUrl)) {
        platform = 'tiktok';
        functionName = 'fetch-tiktok-analytics';
      } else {
        throw new Error('Invalid URL format. Please provide a valid YouTube, Instagram, or TikTok URL.');
      }

      console.log(`Calling ${functionName} function for ${platform}...`);
      
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { 
          campaign_id: campaignId,
          content_url: cleanUrl
        }
      });

      console.log('Function response:', { data, error });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(`Function call failed: ${error.message}`);
      }

      if (!data || !data.success) {
        const errorMsg = data?.error || 'Unknown error occurred';
        console.error('Function returned error:', errorMsg);
        throw new Error(errorMsg);
      }

      console.log('Analytics data received:', data.data);

      toast({
        title: "Analytics Updated!",
        description: `Successfully updated ${platform}: ${data.data?.views || 0} views, ${data.data?.engagement || 0} engagement`,
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
