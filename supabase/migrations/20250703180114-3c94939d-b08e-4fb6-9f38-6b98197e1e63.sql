-- Clean up duplicate records, keeping only the latest one for each creator per day
DELETE FROM public.youtube_analytics 
WHERE id NOT IN (
  SELECT DISTINCT ON (creator_roster_id, date_recorded) id
  FROM public.youtube_analytics 
  ORDER BY creator_roster_id, date_recorded, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.youtube_analytics 
ADD CONSTRAINT youtube_analytics_creator_date_unique 
UNIQUE (creator_roster_id, date_recorded);

-- Create an index for better performance  
CREATE INDEX IF NOT EXISTS idx_youtube_analytics_user_date 
ON public.youtube_analytics (creator_roster_id, date_recorded DESC);

-- Update the function to properly handle channel engagement
CREATE OR REPLACE FUNCTION public.calculate_channel_engagement(
  p_subscribers BIGINT,
  p_views BIGINT
) RETURNS DECIMAL AS $$
BEGIN
  -- For channels, use a simple engagement calculation based on subscriber ratio
  -- This is an approximation since we don't have actual likes/comments at channel level
  IF p_views > 0 THEN
    RETURN (p_subscribers::DECIMAL / p_views * 100000)::DECIMAL(10,2);
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;