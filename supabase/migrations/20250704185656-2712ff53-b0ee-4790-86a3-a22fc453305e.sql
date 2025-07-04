
-- Create video_analytics table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.video_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_roster_id UUID NOT NULL REFERENCES public.creator_roster(id) ON DELETE CASCADE,
  video_id TEXT NOT NULL,
  title TEXT,
  published_at TIMESTAMP WITH TIME ZONE NOT NULL,
  views BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  duration TEXT,
  thumbnail_url TEXT,
  fetched_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(creator_roster_id, video_id)
);

-- Enable RLS for video_analytics
ALTER TABLE public.video_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for video_analytics
CREATE POLICY "Users can view their video analytics" 
  ON public.video_analytics 
  FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM public.creator_roster cr 
    WHERE cr.id = video_analytics.creator_roster_id 
    AND cr.user_id = auth.uid()
  ));

CREATE POLICY "System can manage video analytics" 
  ON public.video_analytics 
  FOR ALL 
  USING (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_video_analytics_creator_published ON public.video_analytics(creator_roster_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_video_analytics_published_date ON public.video_analytics(DATE(published_at));
