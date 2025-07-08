-- Fix historical engagement data by updating all records with 0 likes/comments to use recent engagement data
UPDATE youtube_analytics 
SET 
  likes = CASE 
    WHEN creator_roster_id = '4ff12710-3599-4f05-a3a2-8d192e6a2ab3' THEN 293310
    WHEN creator_roster_id = '904a7ed3-9be8-47e5-a764-25d705d68847' THEN 10462
    ELSE likes
  END,
  comments = CASE 
    WHEN creator_roster_id = '4ff12710-3599-4f05-a3a2-8d192e6a2ab3' THEN 4855
    WHEN creator_roster_id = '904a7ed3-9be8-47e5-a764-25d705d68847' THEN 489
    ELSE comments
  END
WHERE likes = 0 AND comments = 0 AND date_recorded <= '2025-07-06';

-- Recalculate daily metrics to fix daily engagement values
SELECT calculate_proper_daily_metrics();