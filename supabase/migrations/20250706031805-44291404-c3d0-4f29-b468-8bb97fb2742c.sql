
-- First, let's create a simpler function to handle YouTube channel data updates
CREATE OR REPLACE FUNCTION update_creator_youtube_data(
  p_creator_roster_id uuid,
  p_subscribers bigint DEFAULT 0,
  p_total_views bigint DEFAULT 0,
  p_channel_id text DEFAULT NULL,
  p_channel_name text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insert or update today's YouTube analytics data
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

-- Create a simple function to store video analytics
CREATE OR REPLACE FUNCTION store_video_analytics(
  p_creator_roster_id uuid,
  p_video_id text,
  p_title text,
  p_published_at timestamp with time zone,
  p_views bigint DEFAULT 0,
  p_likes bigint DEFAULT 0,
  p_comments bigint DEFAULT 0
) RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.video_analytics (
    creator_roster_id,
    video_id,
    title,
    published_at,
    views,
    likes,
    comments,
    fetched_at
  ) VALUES (
    p_creator_roster_id,
    p_video_id,
    p_title,
    p_published_at,
    p_views,
    p_likes,
    p_comments,
    now()
  )
  ON CONFLICT (creator_roster_id, video_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    views = EXCLUDED.views,
    likes = EXCLUDED.likes,
    comments = EXCLUDED.comments,
    fetched_at = EXCLUDED.fetched_at;
END;
$$;

-- Fix the unique constraint on video_analytics if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'video_analytics_creator_video_unique'
  ) THEN
    ALTER TABLE video_analytics 
    ADD CONSTRAINT video_analytics_creator_video_unique 
    UNIQUE (creator_roster_id, video_id);
  END IF;
END $$;

-- Ensure youtube_analytics has proper unique constraint
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'youtube_analytics_creator_date_unique'
  ) THEN
    ALTER TABLE youtube_analytics 
    ADD CONSTRAINT youtube_analytics_creator_date_unique 
    UNIQUE (creator_roster_id, date_recorded);
  END IF;
END $$;
