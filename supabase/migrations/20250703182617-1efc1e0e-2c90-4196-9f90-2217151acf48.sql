
-- First, let's ensure we have a proper constraint on youtube_analytics for unique daily records per creator
ALTER TABLE public.youtube_analytics 
DROP CONSTRAINT IF EXISTS youtube_analytics_creator_date_unique;

ALTER TABLE public.youtube_analytics 
ADD CONSTRAINT youtube_analytics_creator_date_unique 
UNIQUE (creator_roster_id, date_recorded);

-- Create a simpler function to directly update YouTube channel data
CREATE OR REPLACE FUNCTION public.update_creator_youtube_stats(
  p_creator_roster_id uuid,
  p_channel_url text,
  p_subscribers bigint DEFAULT 0,
  p_views bigint DEFAULT 0,
  p_video_count bigint DEFAULT 0
) RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  -- Insert or update today's data
  INSERT INTO public.youtube_analytics (
    creator_roster_id,
    channel_id,
    channel_name,
    subscribers,
    views,
    date_recorded,
    fetched_at
  ) VALUES (
    p_creator_roster_id,
    NULL, -- Will be updated by edge function
    NULL, -- Will be updated by edge function  
    p_subscribers,
    p_views,
    CURRENT_DATE,
    now()
  )
  ON CONFLICT (creator_roster_id, date_recorded) 
  DO UPDATE SET
    subscribers = EXCLUDED.subscribers,
    views = EXCLUDED.views,
    fetched_at = EXCLUDED.fetched_at;

  -- Return the updated data
  SELECT jsonb_build_object(
    'creator_roster_id', p_creator_roster_id,
    'subscribers', p_subscribers,
    'views', p_views,
    'video_count', p_video_count,
    'updated_at', now()
  ) INTO result;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create a view to get the latest stats for each creator
CREATE OR REPLACE VIEW public.creator_latest_stats AS
SELECT DISTINCT ON (ya.creator_roster_id)
  ya.creator_roster_id,
  cr.creator_name,
  cr.user_id,
  ya.subscribers,
  ya.views,
  ya.channel_name,
  ya.channel_id,
  ya.date_recorded,
  ya.fetched_at
FROM public.youtube_analytics ya
JOIN public.creator_roster cr ON cr.id = ya.creator_roster_id
ORDER BY ya.creator_roster_id, ya.date_recorded DESC, ya.fetched_at DESC;
