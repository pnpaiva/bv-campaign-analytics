
-- Add date columns to creator_analytics for proper time-based filtering
ALTER TABLE public.creator_analytics 
ADD COLUMN IF NOT EXISTS date_recorded DATE DEFAULT CURRENT_DATE;

-- Create a more specific table for YouTube analytics data
CREATE TABLE IF NOT EXISTS public.youtube_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_roster_id UUID NOT NULL REFERENCES public.creator_roster(id) ON DELETE CASCADE,
  channel_id TEXT,
  video_id TEXT,
  title TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  subscribers BIGINT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,
  watch_time_hours DECIMAL(10,2) DEFAULT 0,
  date_recorded DATE DEFAULT CURRENT_DATE,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS policies for youtube_analytics
ALTER TABLE public.youtube_analytics ENABLE ROW LEVEL SECURITY;

-- Users can view analytics for their own creators
CREATE POLICY "Users can view their YouTube analytics" 
  ON public.youtube_analytics 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.creator_roster cr 
    WHERE cr.id = youtube_analytics.creator_roster_id 
    AND cr.user_id = auth.uid()
  ));

-- System can insert/update YouTube analytics data
CREATE POLICY "System can manage YouTube analytics" 
  ON public.youtube_analytics 
  FOR ALL 
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_youtube_analytics_roster_date 
  ON public.youtube_analytics(creator_roster_id, date_recorded DESC);

CREATE INDEX IF NOT EXISTS idx_youtube_analytics_channel_id 
  ON public.youtube_analytics(channel_id);

-- Add index to creator_analytics for date filtering
CREATE INDEX IF NOT EXISTS idx_creator_analytics_date_recorded 
  ON public.creator_analytics(date_recorded DESC);
