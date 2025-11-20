-- Add audio quality processing columns to tracks table
-- Run this in Supabase SQL Editor

-- Add columns for audio quality variants
DO $$
BEGIN
  -- Add audio_quality_variants column (stores array of quality options)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tracks' AND column_name = 'audio_quality_variants') THEN
    ALTER TABLE tracks ADD COLUMN audio_quality_variants JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added audio_quality_variants column';
  END IF;

  -- Add loudness_lufs column (integrated loudness in LUFS)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tracks' AND column_name = 'loudness_lufs') THEN
    ALTER TABLE tracks ADD COLUMN loudness_lufs DECIMAL(5,2);
    RAISE NOTICE 'Added loudness_lufs column';
  END IF;

  -- Add processed_at column (when audio processing completed)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tracks' AND column_name = 'processed_at') THEN
    ALTER TABLE tracks ADD COLUMN processed_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added processed_at column';
  END IF;

  -- Add sample_rate column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tracks' AND column_name = 'sample_rate') THEN
    ALTER TABLE tracks ADD COLUMN sample_rate INTEGER DEFAULT 44100;
    RAISE NOTICE 'Added sample_rate column';
  END IF;

  -- Add bit_depth column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name = 'tracks' AND column_name = 'bit_depth') THEN
    ALTER TABLE tracks ADD COLUMN bit_depth INTEGER DEFAULT 16;
    RAISE NOTICE 'Added bit_depth column';
  END IF;
END $$;

-- Create index for faster queries on processed tracks
CREATE INDEX IF NOT EXISTS idx_tracks_processed_at ON tracks(processed_at);

-- Comment on columns for documentation
COMMENT ON COLUMN tracks.audio_quality_variants IS 'Array of quality variants: [{quality: "low"|"medium"|"high", path: "r2_path", bitrate: "128k"|"256k"|"320k"}]';
COMMENT ON COLUMN tracks.loudness_lufs IS 'Integrated loudness in LUFS (target: -14 LUFS)';
COMMENT ON COLUMN tracks.processed_at IS 'Timestamp when audio processing completed';

-- Done!
SELECT 'Audio quality columns added successfully!' as result;
