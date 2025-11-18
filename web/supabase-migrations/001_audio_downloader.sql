-- ================================================
-- AUDIO DOWNLOADER INTEGRATION
-- Database schema for audio downloading and processing
-- ================================================

-- ================================================
-- Download Jobs Table
-- ================================================
CREATE TABLE IF NOT EXISTS download_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job Information
  url TEXT NOT NULL,
  source_type VARCHAR(50) NOT NULL, -- 'youtube' or 'soundcloud'
  download_type VARCHAR(50) NOT NULL, -- 'single', 'playlist', 'channel'
  status VARCHAR(50) NOT NULL DEFAULT 'pending', -- 'pending', 'downloading', 'processing', 'completed', 'failed'

  -- Progress Tracking
  total_items INTEGER DEFAULT 0,
  completed_items INTEGER DEFAULT 0,
  failed_items INTEGER DEFAULT 0,
  current_item VARCHAR(255),
  progress_percent DECIMAL(5,2) DEFAULT 0,

  -- Results
  downloaded_files JSONB DEFAULT '[]'::jsonb,
  error_message TEXT,
  error_details JSONB,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Additional info like playlist title, channel name, etc.

  -- Processing Options
  options JSONB DEFAULT '{}'::jsonb, -- Download options (bitrate, format, etc.)

  -- Admin Info
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,

  -- Celery Task Info
  celery_task_id VARCHAR(255) UNIQUE,

  -- Constraints
  CONSTRAINT valid_source_type CHECK (source_type IN ('youtube', 'soundcloud')),
  CONSTRAINT valid_download_type CHECK (download_type IN ('single', 'playlist', 'channel', 'user')),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'queued', 'downloading', 'processing', 'completed', 'failed', 'cancelled'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_download_jobs_status ON download_jobs(status);
CREATE INDEX IF NOT EXISTS idx_download_jobs_created_by ON download_jobs(created_by);
CREATE INDEX IF NOT EXISTS idx_download_jobs_created_at ON download_jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_download_jobs_celery_task_id ON download_jobs(celery_task_id);
CREATE INDEX IF NOT EXISTS idx_download_jobs_source_type ON download_jobs(source_type);

-- ================================================
-- Downloaded Tracks Table
-- ================================================
CREATE TABLE IF NOT EXISTS downloaded_tracks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Job Reference
  download_job_id UUID REFERENCES download_jobs(id) ON DELETE CASCADE,

  -- Track Information
  title VARCHAR(255) NOT NULL,
  artist VARCHAR(255),
  album VARCHAR(255),
  duration_ms INTEGER,

  -- Source Information
  source_type VARCHAR(50) NOT NULL,
  source_url TEXT NOT NULL,
  source_id VARCHAR(255), -- YouTube video ID or SoundCloud track ID

  -- File Information
  file_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  audio_format VARCHAR(10) DEFAULT 'mp3',
  bitrate INTEGER DEFAULT 320,

  -- Processing Status
  processed BOOLEAN DEFAULT false,
  uploaded_to_platform BOOLEAN DEFAULT false,
  track_id UUID REFERENCES tracks(id) ON DELETE SET NULL, -- Link to created track

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb, -- Extra metadata (thumbnail, description, etc.)

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  uploaded_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_source_type_track CHECK (source_type IN ('youtube', 'soundcloud'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_downloaded_tracks_job_id ON downloaded_tracks(download_job_id);
CREATE INDEX IF NOT EXISTS idx_downloaded_tracks_processed ON downloaded_tracks(processed);
CREATE INDEX IF NOT EXISTS idx_downloaded_tracks_uploaded ON downloaded_tracks(uploaded_to_platform);
CREATE INDEX IF NOT EXISTS idx_downloaded_tracks_track_id ON downloaded_tracks(track_id);
CREATE INDEX IF NOT EXISTS idx_downloaded_tracks_source_id ON downloaded_tracks(source_id);

-- ================================================
-- Whitelist Configuration Table
-- ================================================
CREATE TABLE IF NOT EXISTS download_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Whitelist Entry
  source_type VARCHAR(50) NOT NULL,
  identifier VARCHAR(255) NOT NULL, -- Channel ID, username, etc.
  name VARCHAR(255), -- Friendly name

  -- Status
  enabled BOOLEAN DEFAULT true,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_whitelist_source CHECK (source_type IN ('youtube_channel', 'soundcloud_user')),
  CONSTRAINT unique_whitelist_entry UNIQUE (source_type, identifier)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_download_whitelist_source_type ON download_whitelist(source_type);
CREATE INDEX IF NOT EXISTS idx_download_whitelist_enabled ON download_whitelist(enabled);

-- ================================================
-- Download Statistics Table
-- ================================================
CREATE TABLE IF NOT EXISTS download_statistics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  date DATE NOT NULL,

  -- Counters
  total_jobs INTEGER DEFAULT 0,
  completed_jobs INTEGER DEFAULT 0,
  failed_jobs INTEGER DEFAULT 0,
  total_tracks_downloaded INTEGER DEFAULT 0,
  total_bytes_downloaded BIGINT DEFAULT 0,

  -- Breakdown by source
  youtube_jobs INTEGER DEFAULT 0,
  soundcloud_jobs INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT unique_download_stats_date UNIQUE (date)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_download_statistics_date ON download_statistics(date DESC);

-- ================================================
-- Row Level Security (RLS)
-- ================================================

-- Enable RLS
ALTER TABLE download_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE downloaded_tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_whitelist ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_statistics ENABLE ROW LEVEL SECURITY;

-- Policies for download_jobs
CREATE POLICY "Admins can view all download jobs"
  ON download_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can insert download jobs"
  ON download_jobs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update download jobs"
  ON download_jobs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can do anything with download jobs"
  ON download_jobs FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for downloaded_tracks
CREATE POLICY "Admins can view all downloaded tracks"
  ON downloaded_tracks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can do anything with downloaded tracks"
  ON downloaded_tracks FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Policies for download_whitelist
CREATE POLICY "Admins can manage whitelist"
  ON download_whitelist FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

-- Policies for download_statistics
CREATE POLICY "Admins can view statistics"
  ON download_statistics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage statistics"
  ON download_statistics FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ================================================
-- Functions and Triggers
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for download_jobs
DROP TRIGGER IF EXISTS update_download_jobs_updated_at ON download_jobs;
CREATE TRIGGER update_download_jobs_updated_at
    BEFORE UPDATE ON download_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for download_whitelist
DROP TRIGGER IF EXISTS update_download_whitelist_updated_at ON download_whitelist;
CREATE TRIGGER update_download_whitelist_updated_at
    BEFORE UPDATE ON download_whitelist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update download statistics
CREATE OR REPLACE FUNCTION update_download_statistics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update statistics when a job completes
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO download_statistics (
            date,
            total_jobs,
            completed_jobs,
            total_tracks_downloaded,
            youtube_jobs,
            soundcloud_jobs
        )
        VALUES (
            CURRENT_DATE,
            1,
            1,
            NEW.completed_items,
            CASE WHEN NEW.source_type = 'youtube' THEN 1 ELSE 0 END,
            CASE WHEN NEW.source_type = 'soundcloud' THEN 1 ELSE 0 END
        )
        ON CONFLICT (date) DO UPDATE SET
            total_jobs = download_statistics.total_jobs + 1,
            completed_jobs = download_statistics.completed_jobs + 1,
            total_tracks_downloaded = download_statistics.total_tracks_downloaded + EXCLUDED.total_tracks_downloaded,
            youtube_jobs = download_statistics.youtube_jobs + EXCLUDED.youtube_jobs,
            soundcloud_jobs = download_statistics.soundcloud_jobs + EXCLUDED.soundcloud_jobs;
    END IF;

    -- Update statistics when a job fails
    IF NEW.status = 'failed' AND OLD.status != 'failed' THEN
        INSERT INTO download_statistics (
            date,
            total_jobs,
            failed_jobs,
            youtube_jobs,
            soundcloud_jobs
        )
        VALUES (
            CURRENT_DATE,
            1,
            1,
            CASE WHEN NEW.source_type = 'youtube' THEN 1 ELSE 0 END,
            CASE WHEN NEW.source_type = 'soundcloud' THEN 1 ELSE 0 END
        )
        ON CONFLICT (date) DO UPDATE SET
            total_jobs = download_statistics.total_jobs + 1,
            failed_jobs = download_statistics.failed_jobs + 1,
            youtube_jobs = download_statistics.youtube_jobs + EXCLUDED.youtube_jobs,
            soundcloud_jobs = download_statistics.soundcloud_jobs + EXCLUDED.soundcloud_jobs;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for download statistics
DROP TRIGGER IF EXISTS update_statistics_on_job_completion ON download_jobs;
CREATE TRIGGER update_statistics_on_job_completion
    AFTER UPDATE ON download_jobs
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION update_download_statistics();

-- ================================================
-- Comments
-- ================================================

COMMENT ON TABLE download_jobs IS 'Tracks audio download jobs from YouTube and SoundCloud';
COMMENT ON TABLE downloaded_tracks IS 'Individual tracks downloaded as part of download jobs';
COMMENT ON TABLE download_whitelist IS 'Whitelist of approved channels/users for downloading';
COMMENT ON TABLE download_statistics IS 'Daily statistics for download operations';
