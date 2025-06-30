
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

export interface Creator {
  id: string;
  name: string;
  platform_handles: Record<string, string>;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export const useCreators = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchCreators = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Type cast the response to match our Creator interface
      const typedCreators: Creator[] = (data || []).map(creator => ({
        ...creator,
        platform_handles: (creator.platform_handles as Record<string, string>) || {}
      }));
      
      setCreators(typedCreators);
    } catch (error) {
      console.error('Error fetching creators:', error);
      toast({
        title: "Error",
        description: "Failed to fetch creators",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createCreator = async (name: string, platformHandles: Record<string, string> = {}) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create creators",
        variant: "destructive",
      });
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('creators')
        .insert({
          name,
          platform_handles: platformHandles,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Type cast the response to match our Creator interface
      const typedCreator: Creator = {
        ...data,
        platform_handles: (data.platform_handles as Record<string, string>) || {}
      };
      
      setCreators(prev => [...prev, typedCreator]);
      toast({
        title: "Success",
        description: "Creator added successfully",
      });
      
      return typedCreator;
    } catch (error) {
      console.error('Error creating creator:', error);
      toast({
        title: "Error",
        description: "Failed to create creator",
        variant: "destructive",
      });
      return null;
    }
  };

  useEffect(() => {
    fetchCreators();
  }, [user]);

  return {
    creators,
    loading,
    createCreator,
    refetch: fetchCreators,
  };
};
