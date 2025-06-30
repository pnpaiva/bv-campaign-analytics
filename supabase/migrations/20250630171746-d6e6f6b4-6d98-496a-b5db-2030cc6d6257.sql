
-- Create table to store API credentials (encrypted)
CREATE TABLE IF NOT EXISTS public.api_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  credential_type TEXT NOT NULL, -- 'oauth_token', 'api_key', etc.
  encrypted_value TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, platform, credential_type)
);

-- Create table to store analytics data
CREATE TABLE IF NOT EXISTS public.analytics_data (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('youtube', 'instagram', 'tiktok')),
  content_url TEXT NOT NULL,
  views INTEGER DEFAULT 0,
  engagement INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  sentiment_score DECIMAL(3,2), -- -1 to 1 scale
  sentiment_label TEXT, -- 'positive', 'negative', 'neutral'
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, platform, content_url)
);

-- Create table for caching API responses
CREATE TABLE IF NOT EXISTS public.api_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  platform TEXT NOT NULL,
  response_data JSONB NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for background job tracking
CREATE TABLE IF NOT EXISTS public.analytics_jobs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES public.campaigns(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.api_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for api_credentials
CREATE POLICY "Users can manage their own API credentials" 
  ON public.api_credentials 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for analytics_data
CREATE POLICY "Users can view analytics for their campaigns" 
  ON public.analytics_data 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = analytics_data.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "System can insert analytics data" 
  ON public.analytics_data 
  FOR INSERT 
  WITH CHECK (true); -- Edge functions will handle this

CREATE POLICY "System can update analytics data" 
  ON public.analytics_data 
  FOR UPDATE 
  USING (true); -- Edge functions will handle this

-- Create RLS policies for api_cache (system managed)
CREATE POLICY "System can manage cache" 
  ON public.api_cache 
  FOR ALL 
  USING (true);

-- Create RLS policies for analytics_jobs
CREATE POLICY "Users can view their analytics jobs" 
  ON public.analytics_jobs 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.campaigns 
    WHERE campaigns.id = analytics_jobs.campaign_id 
    AND campaigns.user_id = auth.uid()
  ));

CREATE POLICY "System can manage analytics jobs" 
  ON public.analytics_jobs 
  FOR ALL 
  USING (true); -- Edge functions will handle this

-- Create function to update campaign totals from analytics data
CREATE OR REPLACE FUNCTION public.update_campaign_totals(campaign_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.campaigns 
  SET 
    total_views = COALESCE((
      SELECT SUM(views) 
      FROM public.analytics_data 
      WHERE campaign_id = campaign_uuid
    ), 0),
    total_engagement = COALESCE((
      SELECT SUM(engagement) 
      FROM public.analytics_data 
      WHERE campaign_id = campaign_uuid
    ), 0),
    engagement_rate = CASE 
      WHEN (SELECT SUM(views) FROM public.analytics_data WHERE campaign_id = campaign_uuid) > 0 
      THEN (
        SELECT (SUM(engagement)::DECIMAL / SUM(views)) * 100 
        FROM public.analytics_data 
        WHERE campaign_id = campaign_uuid
      )
      ELSE 0 
    END,
    updated_at = now()
  WHERE id = campaign_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired cache entries
CREATE OR REPLACE FUNCTION public.cleanup_expired_cache()
RETURNS void AS $$
BEGIN
  DELETE FROM public.api_cache 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_analytics_data_campaign_id ON public.analytics_data(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_data_platform ON public.analytics_data(platform);
CREATE INDEX IF NOT EXISTS idx_api_cache_key ON public.api_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON public.api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_analytics_jobs_campaign_id ON public.analytics_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_analytics_jobs_status ON public.analytics_jobs(status);
