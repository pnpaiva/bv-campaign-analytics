import React, { useState } from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { toast } from 'sonner';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface ContentUrl {
  url: string;
  platform?: string;
  analytics?: {
    views: number;
    engagement: number;
    rate: number;
  };
}

interface CampaignFormData {
  name: string;
  brand: string;
  creator: string;
  contentUrls: ContentUrl[];
  [key: string]: any;
}

interface CampaignFormHandlerProps {
  onSubmit?: (data: any) => void;
  children: (props: {
    handleSubmit: (data: CampaignFormData) => Promise<void>;
    isLoading: boolean;
    error: string | null;
  }) => React.ReactNode;
}

export function CampaignFormHandler({ onSubmit, children }: CampaignFormHandlerProps) {
  const { fetchBatchAnalytics, isLoading: isAnalyticsLoading } = useAnalytics();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: CampaignFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Extract URLs from content URLs
      const urls = formData.contentUrls.map(item => item.url).filter(Boolean);
      
      if (urls.length === 0) {
        toast.error('Please add at least one content URL');
        return;
      }

      // Fetch analytics for all URLs
      console.log('Fetching analytics for URLs:', urls);
      const analyticsResults = await fetchBatchAnalytics(urls);
      
      // Map analytics back to content URLs
      const enrichedContentUrls = formData.contentUrls.map((item) => {
        const analyticsData = analyticsResults.find(result => result.url === item.url);
        
        return {
          ...item,
          platform: analyticsData?.platform || 'unknown',
          analytics: {
            views: analyticsData?.views || 0,
            engagement: analyticsData?.engagement || 0,
            rate: analyticsData?.rate || 0,
          },
        };
      });

      // Prepare campaign data
      const campaignData = {
        ...formData,
        content_urls: enrichedContentUrls,
        created_at: new Date().toISOString(),
        status: 'active',
      };

      console.log('Creating campaign with data:', campaignData);

      // Insert into Supabase
      const { data, error: dbError } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single();

      if (dbError) {
        throw new Error(dbError.message);
      }

      toast.success('Campaign created successfully!');
      
      // Call custom onSubmit if provided
      if (onSubmit) {
        onSubmit(data);
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create campaign';
      setError(errorMessage);
      console.error('Campaign submission error:', err);
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return <>{children({ handleSubmit, isLoading: isSubmitting || isAnalyticsLoading, error })}</>;
}

// Example usage component
export function CampaignFormExample() {
  return (
    <CampaignFormHandler>
      {({ handleSubmit, isLoading, error }) => (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = {
              name: 'Test Campaign',
              brand: 'Test Brand',
              creator: 'Test Creator',
              contentUrls: [
                { url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
                { url: 'https://www.instagram.com/p/C1234567890/' },
              ],
            };
            handleSubmit(formData);
          }}
        >
          {error && (
            <div className="alert alert-error mb-4">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
          >
            {isLoading ? 'Creating Campaign...' : 'Create Campaign'}
          </button>
        </form>
      )}
    </CampaignFormHandler>
  );
}