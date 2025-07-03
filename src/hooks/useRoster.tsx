
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Json } from '@/integrations/supabase/types';

export interface RosterCreator {
  id: string;
  creator_name: string;
  channel_links: Json;
  social_media_handles: Json;
  channel_stats: Json;
  last_updated: string;
  created_at: string;
  updated_at: string;
}

export const useRoster = () => {
  const [creators, setCreators] = useState<RosterCreator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCreators = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_roster')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCreators(data || []);
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error",
        description: "Failed to fetch creators",
        variant: "destructive",
      });
    }
  };

  const addCreator = async (creatorData: {
    creator_name: string;
    channel_links: Json;
    social_media_handles: Json;
  }) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('creator_roster')
        .insert({
          ...creatorData,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCreators(prev => [data, ...prev]);
      toast({
        title: "Success",
        description: "Creator added successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error adding creator:', error);
      toast({
        title: "Error",
        description: "Failed to add creator",
        variant: "destructive",
      });
    }
  };

  const updateCreator = async (id: string, updates: Partial<RosterCreator>) => {
    try {
      const { data, error } = await supabase
        .from('creator_roster')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      setCreators(prev => prev.map(c => c.id === id ? data : c));
      toast({
        title: "Success",
        description: "Creator updated successfully",
      });
      
      return data;
    } catch (error) {
      console.error('Error updating creator:', error);
      toast({
        title: "Error",
        description: "Failed to update creator",
        variant: "destructive",
      });
    }
  };

  const deleteCreator = async (id: string) => {
    try {
      const { error } = await supabase
        .from('creator_roster')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      setCreators(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Success",
        description: "Creator deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting creator:', error);
      toast({
        title: "Error",
        description: "Failed to delete creator",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchCreators();
    }
    setLoading(false);
  }, [user]);

  return {
    creators,
    loading,
    addCreator,
    updateCreator,
    deleteCreator,
    refreshCreators: fetchCreators,
  };
};
