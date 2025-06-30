
-- First, let's create a special "system" creator for master campaign templates
INSERT INTO public.creators (id, name, user_id, platform_handles)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'System Template Creator',
  (SELECT id FROM auth.users LIMIT 1), -- Use any existing user as owner
  '{}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Update the foreign key constraint to be deferrable and allow the special UUID
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_creator_id_fkey;

-- Add the foreign key back with proper handling
ALTER TABLE public.campaigns ADD CONSTRAINT campaigns_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES public.creators(id)
  DEFERRABLE INITIALLY DEFERRED;

-- Update the constraint to allow master campaign templates with the special creator
ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS master_campaign_template_check;

-- Add a more flexible constraint that allows master campaigns
ALTER TABLE public.campaigns ADD CONSTRAINT master_campaign_template_check 
  CHECK (
    (is_master_campaign_template = TRUE) OR
    (is_master_campaign_template = FALSE AND creator_id IS NOT NULL) OR
    (is_master_campaign_template IS NULL AND creator_id IS NOT NULL)
  );

-- Ensure RLS policies allow master campaign operations
DROP POLICY IF EXISTS "Users can manage their own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage their own campaigns" 
  ON public.campaigns 
  FOR ALL 
  USING (
    auth.uid() = user_id OR 
    (is_master_campaign_template = TRUE AND auth.uid() IS NOT NULL)
  );
