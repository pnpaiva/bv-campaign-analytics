
-- Drop the dashboard_analytics view temporarily
DROP VIEW IF EXISTS dashboard_analytics;

-- Fix the campaign_month column to allow proper date formatting
-- Convert campaign_month from date to text to allow YYYY-MM format
ALTER TABLE public.campaigns ALTER COLUMN campaign_month TYPE text;

-- Recreate the dashboard_analytics view
CREATE OR REPLACE VIEW dashboard_analytics AS
SELECT 
  c.id as campaign_id,
  c.brand_name,
  c.creator_id,
  c.campaign_date,
  c.campaign_month,
  c.client_id,
  c.client_name,
  c.deal_value,
  c.status,
  c.total_views as campaign_total_views,
  c.total_engagement as campaign_total_engagement,
  c.engagement_rate as campaign_engagement_rate,
  cr.name as creator_name,
  cr.platform_handles,
  cl.name as client_name_full,
  ad.id as analytics_id,
  ad.platform,
  ad.content_url,
  ad.views,
  ad.engagement,
  ad.likes,
  ad.comments,
  ad.shares,
  ad.engagement_rate as content_engagement_rate,
  ad.sentiment_score,
  ad.sentiment_label,
  ad.fetched_at
FROM campaigns c
LEFT JOIN creators cr ON c.creator_id = cr.id
LEFT JOIN clients cl ON c.client_id = cl.id
LEFT JOIN analytics_data ad ON c.id = ad.campaign_id
WHERE c.user_id = auth.uid();

-- Add RLS policies for the tables that might be missing them
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for campaigns
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage their own campaigns" 
  ON public.campaigns 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for analytics_data (linked through campaigns)
DROP POLICY IF EXISTS "Users can view analytics for their campaigns" ON public.analytics_data;
CREATE POLICY "Users can view analytics for their campaigns" 
  ON public.analytics_data 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns 
      WHERE campaigns.id = analytics_data.campaign_id 
      AND campaigns.user_id = auth.uid()
    )
  );

-- Create RLS policies for clients
DROP POLICY IF EXISTS "Users can manage their own clients" ON public.clients;
CREATE POLICY "Users can manage their own clients" 
  ON public.clients 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Create RLS policies for creators
DROP POLICY IF EXISTS "Users can manage their own creators" ON public.creators;
CREATE POLICY "Users can manage their own creators" 
  ON public.creators 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Add proper foreign key constraints if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_creator_id_fkey'
    ) THEN
        ALTER TABLE public.campaigns 
        ADD CONSTRAINT campaigns_creator_id_fkey 
        FOREIGN KEY (creator_id) REFERENCES public.creators(id) ON DELETE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_client_id_fkey'
    ) THEN
        ALTER TABLE public.campaigns 
        ADD CONSTRAINT campaigns_client_id_fkey 
        FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'campaigns_master_campaign_id_fkey'
    ) THEN
        ALTER TABLE public.campaigns 
        ADD CONSTRAINT campaigns_master_campaign_id_fkey 
        FOREIGN KEY (master_campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'analytics_data_campaign_id_fkey'
    ) THEN
        ALTER TABLE public.analytics_data 
        ADD CONSTRAINT analytics_data_campaign_id_fkey 
        FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Grant necessary permissions
GRANT SELECT ON dashboard_analytics TO authenticated;
