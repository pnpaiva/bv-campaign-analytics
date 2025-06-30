
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useDirectAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchDirectAnalytics = async (campaignId: string, videoUrl: string) => {
    setLoading(true);
    try {
      console.log('Calling direct analytics function for campaign:', campaignId, 'video:', videoUrl);
      
      const { data, error } = await supabase.functions.invoke('direct-youtube-analytics', {
        body: { 
          campaign_id: campaignId,
          video_url: videoUrl
        }
      });

      if (error) {
        console.error('Direct analytics function error:', error);
        throw error;
      }

      console.log('Direct analytics response:', data);

      if (data.note) {
        toast({
          title: "Analytics Updated",
          description: data.note,
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Real YouTube analytics fetched successfully",
        });
      }

      return data;
    } catch (error) {
      console.error('Error fetching direct analytics:', error);
      toast({
        title: "Error",
        description: `Analytics fetch failed: ${error.message}`,
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
