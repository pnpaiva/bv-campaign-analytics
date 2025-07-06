
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useRosterAnalytics = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const refreshCreatorAnalytics = async (creatorRosterId: string, channelUrl: string) => {
    setLoading(true);
    
    console.log('=== Starting roster analytics refresh ===');
    console.log('Creator Roster ID:', creatorRosterId);
    console.log('Channel URL:', channelUrl);
    
    try {
      if (!channelUrl || !channelUrl.trim()) {
        throw new Error('No channel URL provided');
      }

      console.log('Calling fetch-daily-video-analytics function...');
      
      const { data, error } = await supabase.functions.invoke('fetch-daily-video-analytics', {
        body: {
          creator_roster_id: creatorRosterId,
          channel_url: channelUrl.trim()
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

      console.log('Roster analytics updated:', data.data);

      toast({
        title: "Roster Data Updated!",
        description: `Successfully refreshed: ${data.data?.channel_name || 'Channel'} - ${data.data?.subscribers || 0} subscribers`,
      });

      return data;
    } catch (error) {
      console.error('Roster analytics error:', error);
      
      toast({
        title: "Roster Analytics Error",
        description: error.message || 'Failed to refresh roster data',
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const refreshAllCreators = async (creators: Array<{ id: string; channel_links?: any }>) => {
    setLoading(true);
    
    try {
      let successCount = 0;
      const errors: string[] = [];

      for (const creator of creators) {
        try {
          const youtubeUrl = creator.channel_links?.youtube || creator.channel_links?.YouTube;
          if (youtubeUrl) {
            await refreshCreatorAnalytics(creator.id, youtubeUrl);
            successCount++;
          } else {
            console.log(`No YouTube URL found for creator ${creator.id}`);
          }
        } catch (error) {
          console.error(`Failed to refresh creator ${creator.id}:`, error);
          errors.push(`Creator ${creator.id}: ${error.message}`);
        }
      }

      if (successCount > 0) {
        toast({
          title: "Batch Update Complete",
          description: `Successfully updated ${successCount} creators${errors.length > 0 ? ` (${errors.length} failed)` : ''}`,
        });
      }

      if (errors.length > 0 && successCount === 0) {
        throw new Error(`All updates failed: ${errors.join(', ')}`);
      }

      return { successCount, errors };
    } catch (error) {
      console.error('Batch refresh error:', error);
      
      toast({
        title: "Batch Update Error",
        description: error.message || 'Failed to refresh creators',
        variant: "destructive",
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    refreshCreatorAnalytics,
    refreshAllCreators,
  };
};
