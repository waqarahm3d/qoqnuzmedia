-- =====================================================
-- Feedback/Issue Reporting System
-- Migration for user feedback and issue tracking
-- =====================================================

-- Issue categories
CREATE TYPE issue_category AS ENUM (
    'bug',
    'feature_request',
    'improvement',
    'question',
    'other'
);

-- Issue priorities
CREATE TYPE issue_priority AS ENUM (
    'low',
    'medium',
    'high',
    'critical'
);

-- Issue statuses
CREATE TYPE issue_status AS ENUM (
    'open',
    'in_progress',
    'resolved',
    'closed',
    'wont_fix'
);

-- Issues/Feedback table
CREATE TABLE IF NOT EXISTS issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category issue_category NOT NULL DEFAULT 'other',
    priority issue_priority NOT NULL DEFAULT 'medium',
    status issue_status NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES profiles(id),
    resolution_comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue comments table
CREATE TABLE IF NOT EXISTS issue_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_admin_reply BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Issue attachments (optional - for screenshots, etc.)
CREATE TABLE IF NOT EXISTS issue_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_type TEXT,
    file_size INT,
    uploaded_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_issues_user_id ON issues(user_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_category ON issues(category);
CREATE INDEX IF NOT EXISTS idx_issues_priority ON issues(priority);
CREATE INDEX IF NOT EXISTS idx_issues_created_at ON issues(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_issue_comments_issue_id ON issue_comments(issue_id);
CREATE INDEX IF NOT EXISTS idx_issue_attachments_issue_id ON issue_attachments(issue_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER trigger_update_issues_updated_at
    BEFORE UPDATE ON issues
    FOR EACH ROW
    EXECUTE FUNCTION update_issues_updated_at();

-- RLS Policies for issues table
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

-- Users can view their own issues
CREATE POLICY "Users can view their own issues"
    ON issues FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

-- Users can create issues
CREATE POLICY "Users can create issues"
    ON issues FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Users can update their own open issues
CREATE POLICY "Users can update their own open issues"
    ON issues FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid() AND status = 'open')
    WITH CHECK (user_id = auth.uid() AND status = 'open');

-- Admins can view all issues
CREATE POLICY "Admins can view all issues"
    ON issues FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Admins can update all issues
CREATE POLICY "Admins can update all issues"
    ON issues FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- RLS Policies for issue_comments table
ALTER TABLE issue_comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their issues
CREATE POLICY "Users can view comments on their issues"
    ON issue_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_comments.issue_id
            AND issues.user_id = auth.uid()
        )
    );

-- Users can comment on their own issues
CREATE POLICY "Users can comment on their own issues"
    ON issue_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_comments.issue_id
            AND issues.user_id = auth.uid()
        )
        AND user_id = auth.uid()
        AND is_admin_reply = FALSE
    );

-- Admins can view all comments
CREATE POLICY "Admins can view all comments"
    ON issue_comments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Admins can create comments
CREATE POLICY "Admins can create comments"
    ON issue_comments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- RLS Policies for issue_attachments table
ALTER TABLE issue_attachments ENABLE ROW LEVEL SECURITY;

-- Users can view attachments on their issues
CREATE POLICY "Users can view attachments on their issues"
    ON issue_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_attachments.issue_id
            AND issues.user_id = auth.uid()
        )
    );

-- Users can upload attachments to their issues
CREATE POLICY "Users can upload attachments to their issues"
    ON issue_attachments FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM issues
            WHERE issues.id = issue_attachments.issue_id
            AND issues.user_id = auth.uid()
        )
        AND uploaded_by = auth.uid()
    );

-- Admins can view all attachments
CREATE POLICY "Admins can view all attachments"
    ON issue_attachments FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM admin_users
            WHERE admin_users.user_id = auth.uid()
        )
    );

-- Function to get issue statistics
CREATE OR REPLACE FUNCTION get_issue_statistics()
RETURNS TABLE (
    total_issues BIGINT,
    open_issues BIGINT,
    resolved_issues BIGINT,
    in_progress_issues BIGINT,
    avg_resolution_time INTERVAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_issues,
        COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_issues,
        COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_issues,
        COUNT(*) FILTER (WHERE status = 'in_progress')::BIGINT as in_progress_issues,
        AVG(resolved_at - created_at) FILTER (WHERE resolved_at IS NOT NULL) as avg_resolution_time
    FROM issues;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_issue_statistics() TO authenticated;

COMMENT ON TABLE issues IS 'User feedback and issue reports';
COMMENT ON TABLE issue_comments IS 'Comments and replies on issues';
COMMENT ON TABLE issue_attachments IS 'File attachments for issues';
COMMENT ON FUNCTION get_issue_statistics() IS 'Get issue statistics for admin dashboard';
