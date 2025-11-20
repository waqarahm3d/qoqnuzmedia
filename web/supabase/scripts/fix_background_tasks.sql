-- Fix background_tasks table - Add missing columns
-- Run this in Supabase SQL Editor to fix the entity_type error

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add entity_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'background_tasks' AND column_name = 'entity_type') THEN
    ALTER TABLE background_tasks ADD COLUMN entity_type TEXT;
    RAISE NOTICE 'Added entity_type column';
  END IF;

  -- Add entity_id column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'background_tasks' AND column_name = 'entity_id') THEN
    ALTER TABLE background_tasks ADD COLUMN entity_id UUID;
    RAISE NOTICE 'Added entity_id column';
  END IF;

  -- Add priority column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'background_tasks' AND column_name = 'priority') THEN
    ALTER TABLE background_tasks ADD COLUMN priority INTEGER DEFAULT 5;
    RAISE NOTICE 'Added priority column';
  END IF;

  -- Add attempts column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'background_tasks' AND column_name = 'attempts') THEN
    ALTER TABLE background_tasks ADD COLUMN attempts INTEGER DEFAULT 0;
    RAISE NOTICE 'Added attempts column';
  END IF;

  -- Add max_attempts column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'background_tasks' AND column_name = 'max_attempts') THEN
    ALTER TABLE background_tasks ADD COLUMN max_attempts INTEGER DEFAULT 3;
    RAISE NOTICE 'Added max_attempts column';
  END IF;

  -- Add result column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'background_tasks' AND column_name = 'result') THEN
    ALTER TABLE background_tasks ADD COLUMN result JSONB;
    RAISE NOTICE 'Added result column';
  END IF;
END $$;

-- Create or replace the queue_mood_detection trigger function
CREATE OR REPLACE FUNCTION queue_mood_detection()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Queue mood detection task
    INSERT INTO background_tasks (task_type, entity_type, entity_id, priority)
    VALUES ('mood_detection', 'track', NEW.id, 7);

    -- Queue energy analysis task
    INSERT INTO background_tasks (task_type, entity_type, entity_id, priority)
    VALUES ('energy_analysis', 'track', NEW.id, 6);

    -- Queue audio processing task (for transcoding)
    INSERT INTO background_tasks (task_type, entity_type, entity_id, priority)
    VALUES ('audio_processing', 'track', NEW.id, 8);

    RETURN NEW;
END;
$$;

-- Create the trigger if it doesn't exist
DROP TRIGGER IF EXISTS on_track_created ON tracks;
CREATE TRIGGER on_track_created
    AFTER INSERT ON tracks
    FOR EACH ROW
    EXECUTE FUNCTION queue_mood_detection();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_background_tasks_status ON background_tasks(status);
CREATE INDEX IF NOT EXISTS idx_background_tasks_entity ON background_tasks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_background_tasks_priority ON background_tasks(priority DESC, created_at ASC);

-- Grant permissions
GRANT ALL ON background_tasks TO authenticated;
GRANT ALL ON background_tasks TO service_role;

-- Done!
SELECT 'background_tasks table fixed successfully!' as result;
