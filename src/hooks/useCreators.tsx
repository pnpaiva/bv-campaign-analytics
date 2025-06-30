
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const fetchCreators = async () => {
    try {
      const { data, error } = await supabase
        .from('creators')
        .select('*')
        .order('name');

      if (error) throw error;
      setCreators(data || []);
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
    try {
      const { data, error } = await supabase
        .from('creators')
        .insert({
          name,
          platform_handles: platformHandles,
        })
        .select()
        .single();

      if (error) throw error;
      
      setCreators(prev => [...prev, data]);
      toast({
        title: "Success",
        description: "Creator added successfully",
      });
      
      return data;
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
  }, []);

  return {
    creators,
    loading,
    createCreator,
    refetch: fetchCreators,
  };
};
