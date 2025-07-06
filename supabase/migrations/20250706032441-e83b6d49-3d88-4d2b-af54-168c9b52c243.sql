
-- Fix the video_analytics table structure and relationships
ALTER TABLE public.video_analytics DROP CONSTRAINT IF EXISTS video_analytics_creator_roster_id_fkey;
ALTER TABLE public.video_analytics ADD CONSTRAINT video_analytics_creator_roster_id_fkey 
  FOREIGN KEY (creator_roster_id) REFERENCES public.creator_roster(id) ON DELETE CASCADE;

-- Create a unified function to update campaign analytics directly
CREATE OR REPLACE FUNCTION update_campaign_analytics(
  p_campaign_id uuid,
  p_video_url text,
  p_views bigint,
  p_likes bigint,
  p_comments bigint,
  p_engagement_rate numeric
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Update the campaigns table directly with the new data
  UPDATE public.campaigns 
  SET 
    total_views = p_views,
    total_engagement = p_likes + p_comments,
    engagement_rate = p_engagement_rate,
    updated_at = now()
  WHERE id = p_campaign_id;
  
  -- Also store in analytics_data for historical tracking
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
    p_engagement_rate,
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

-- Simplify roster analytics by using only youtube_analytics table
CREATE OR REPLACE FUNCTION refresh_creator_roster_data(
  p_creator_roster_id uuid,
  p_channel_id text,
  p_channel_name text,
  p_subscribers bigint,
  p_total_views bigint
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Simply insert/update today's data in youtube_analytics
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
    GREATEST(0, p_subscribers - COALESCE((
      SELECT subscribers 
      FROM youtube_analytics 
      WHERE creator_roster_id = p_creator_roster_id 
      AND date_recorded < CURRENT_DATE 
      ORDER BY date_recorded DESC 
      LIMIT 1
    ), 0)),
    GREATEST(0, p_total_views - COALESCE((
      SELECT views 
      FROM youtube_analytics 
      WHERE creator_roster_id = p_creator_roster_id 
      AND date_recorded < CURRENT_DATE 
      ORDER BY date_recorded DESC 
      LIMIT 1
    ), 0)),
    CURRENT_DATE,
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

-- Add missing unique constraint for analytics_data
ALTER TABLE public.analytics_data DROP CONSTRAINT IF EXISTS analytics_data_unique_content;
ALTER TABLE public.analytics_data ADD CONSTRAINT analytics_data_unique_content 
  UNIQUE (campaign_id, content_url);
