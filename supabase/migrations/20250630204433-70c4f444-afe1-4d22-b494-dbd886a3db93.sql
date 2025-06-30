
-- Check current state of campaigns
SELECT 
  c.id,
  c.brand_name,
  c.master_campaign_id,
  c.master_campaign_name,
  c.creator_id,
  cr.name as creator_name
FROM campaigns c
LEFT JOIN creators cr ON c.creator_id = cr.id
WHERE c.brand_name LIKE '%Revolut%';

-- Simply clear any problematic master_campaign_id values
UPDATE campaigns 
SET master_campaign_id = NULL 
WHERE master_campaign_name IS NOT NULL 
  AND master_campaign_id IS NOT NULL;

-- Add a trigger to prevent setting master_campaign_id to invalid values
CREATE OR REPLACE FUNCTION validate_master_campaign_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If master_campaign_name is provided, clear master_campaign_id
  IF NEW.master_campaign_name IS NOT NULL THEN
    NEW.master_campaign_id := NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_validate_master_campaign_id ON campaigns;

-- Create the trigger
CREATE TRIGGER trigger_validate_master_campaign_id
  BEFORE INSERT OR UPDATE ON campaigns
  FOR EACH ROW
  EXECUTE FUNCTION validate_master_campaign_id();
