
-- Drop all existing problematic functions and constraints
DROP FUNCTION IF EXISTS update_campaign_analytics CASCADE;
DROP FUNCTION IF EXISTS refresh_creator_roster_data CASCADE;

-- Clean up analytics_data table constraints
ALTER TABLE public.analytics_data DROP CONSTRAINT IF EXISTS analytics_data_unique_content;

-- Create a simple, direct function to update campaign data
CREATE OR REPLACE FUNCTION direct_update_campaign(
  p_campaign_id uuid,
  p_video_url text,
  p_views integer,
  p_likes integer,
  p_comments integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Directly update campaigns table with real data
  UPDATE public.campaigns 
  SET 
    total_views = p_views,
    total_engagement = p_likes + p_comments,
    engagement_rate = CASE 
      WHEN p_views > 0 THEN ROUND((p_likes + p_comments)::numeric / p_views * 100, 2)
      ELSE 0 
    END,
    status = 'completed',
    updated_at = now()
  WHERE id = p_campaign_id;

  -- Store analytics data for history
  INSERT INTO public.analytics_data (
    campaign_id,
    platform,
    content_url,
    views,
    engagement,
    likes,
    comments,
    engagement_rate,
    fetched_at
  ) VALUES (
    p_campaign_id,
    'youtube',
    p_video_url,
    p_views,
    p_likes + p_comments,
    p_likes,
    p_comments,
    CASE 
      WHEN p_views > 0 THEN ROUND((p_likes + p_comments)::numeric / p_views * 100, 2)
      ELSE 0 
    END,
    now()
  )
  ON CONFLICT (campaign_id, content_url) 
  DO UPDATE SET
    views = EXCLUDED.views,
    engagement = EXCLUDED.engagement,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    engagement_rate = EXCLUDED.engagement_rate,
    fetched_at = EXCLUDED.fetched_at;
END;
$$;

-- Create simple function for roster data
CREATE OR REPLACE FUNCTION direct_update_roster(
  p_creator_roster_id uuid,
  p_channel_id text,
  p_channel_name text,
  p_subscribers integer,
  p_total_views integer
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prev_subs integer := 0;
  prev_views integer := 0;
BEGIN
  -- Get previous day's data for daily calculations
  SELECT COALESCE(subscribers, 0), COALESCE(views, 0)
  INTO prev_subs, prev_views
  FROM youtube_analytics 
  WHERE creator_roster_id = p_creator_roster_id 
    AND date_recorded < current_date
  ORDER BY date_recorded DESC 
  LIMIT 1;

  -- Insert/update today's data
  INSERT INTO public.youtube_analytics (
    creator_roster_id,
    channel_id,
    channel_name,
    subscribers,
    views,
    daily_subscribers,
    daily_views,
    date_recorded,
    fetched_at
  ) VALUES (
    p_creator_roster_id,
    p_channel_id,
    p_channel_name,
    p_subscribers,
    p_total_views,
    GREATEST(0, p_subscribers - prev_subs),
    GREATEST(0, p_total_views - prev_views),
    current_date,
    now()
  )
  ON CONFLICT (creator_roster_id, date_recorded) 
  DO UPDATE SET
    channel_id = EXCLUDED.channel_id,
    channel_name = EXCLUDED.channel_name,
    subscribers = EXCLUDED.subscribers,
    views = EXCLUDED.views,
    daily_subscribers = EXCLUDED.daily_subscribers,
    daily_views = EXCLUDED.daily_views,
    fetched_at = EXCLUDED.fetched_at;
END;
$$;

-- Add unique constraint back properly
ALTER TABLE public.analytics_data ADD CONSTRAINT analytics_data_campaign_url_unique 
  UNIQUE (campaign_id, content_url);
