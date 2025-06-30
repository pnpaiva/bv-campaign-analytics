
-- Add master campaign name and duration fields to campaigns table
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS master_campaign_name TEXT,
ADD COLUMN IF NOT EXISTS master_campaign_start_date DATE,
ADD COLUMN IF NOT EXISTS master_campaign_end_date DATE;

-- Create an index for better performance on master campaign name lookups
CREATE INDEX IF NOT EXISTS idx_campaigns_master_campaign_name ON public.campaigns(master_campaign_name);
