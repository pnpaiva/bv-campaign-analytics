
-- First, let's check if we have the necessary columns and add missing ones for client, month, and master campaign functionality

-- Add client field to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS client_name TEXT,
ADD COLUMN IF NOT EXISTS campaign_month DATE,
ADD COLUMN IF NOT EXISTS master_campaign_id UUID REFERENCES public.campaigns(id);

-- Create an index for better performance on master campaign lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_master_campaign_id ON public.campaigns(master_campaign_id);

-- Create a table for clients if it doesn't exist
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- Enable RLS for clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Users can manage their own clients" 
  ON public.clients 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Update campaigns table to reference clients properly
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS client_id UUID REFERENCES public.clients(id);

-- Let's also ensure the analytics data foreign key constraint exists
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

-- Similarly for analytics_jobs
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'analytics_jobs_campaign_id_fkey'
    ) THEN
        ALTER TABLE public.analytics_jobs 
        ADD CONSTRAINT analytics_jobs_campaign_id_fkey 
        FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Let's also check and fix the unique constraint for analytics_data to allow multiple URLs per campaign
ALTER TABLE public.analytics_data DROP CONSTRAINT IF EXISTS analytics_data_campaign_id_platform_content_url_key;
CREATE UNIQUE INDEX IF NOT EXISTS analytics_data_unique_content 
ON public.analytics_data(campaign_id, platform, content_url);
