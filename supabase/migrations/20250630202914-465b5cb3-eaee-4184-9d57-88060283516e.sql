
-- First, let's check the current campaigns table structure and see if we need to adjust it
-- We need to ensure that master campaigns can be created without requiring a real creator_id

-- Update the campaigns table to allow master campaigns to be stored properly
-- Remove the foreign key constraint on creator_id temporarily to allow placeholder values
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_creator_id_fkey;

-- Add a new column to explicitly mark master campaign templates
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_master_campaign_template BOOLEAN DEFAULT FALSE;

-- Re-add the foreign key constraint but make it optional for master campaigns
-- We'll add a check constraint to ensure either it's a master campaign template OR has a valid creator
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES public.creators(id)
  DEFERRABLE INITIALLY DEFERRED;

-- Add a constraint to ensure master campaign templates have the special placeholder creator_id
ALTER TABLE public.campaigns ADD CONSTRAINT master_campaign_template_check 
  CHECK (
    (is_master_campaign_template = TRUE AND creator_id = '00000000-0000-0000-0000-000000000000'::uuid) OR
    (is_master_campaign_template = FALSE AND creator_id IS NOT NULL)
  );

-- Update existing master campaign records to mark them as templates
UPDATE public.campaigns 
SET is_master_campaign_template = TRUE
WHERE creator_id = '00000000-0000-0000-0000-000000000000'::uuid 
  AND master_campaign_name IS NOT NULL;

-- Create an index for better performance when filtering master campaigns
CREATE INDEX IF NOT EXISTS idx_campaigns_master_template ON public.campaigns(is_master_campaign_template);
CREATE INDEX IF NOT EXISTS idx_campaigns_master_name ON public.campaigns(master_campaign_name) WHERE master_campaign_name IS NOT NULL;
