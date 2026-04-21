-- Video Processing Engine Schema
-- Handles video ingestion, analysis, and processing

-- Video processing jobs table
CREATE TABLE video_processing_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    input_url TEXT NOT NULL,
    output_url TEXT,
    job_type VARCHAR(50) NOT NULL, -- 'transcoding', 'analysis', 'thumbnail', 'enhancement'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    priority INTEGER DEFAULT 5, -- 1-10, higher is more urgent
    progress INTEGER DEFAULT 0, -- 0-100 percentage
    settings JSONB DEFAULT '{}', -- resolution, format, bitrate, etc.
    ai_analysis JSONB DEFAULT '{}', -- tags, scenes, quality metrics
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video scenes table for scene-based analysis
CREATE TABLE video_scenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    scene_number INTEGER NOT NULL,
    start_time DECIMAL(10, 3) NOT NULL, -- seconds with milliseconds
    end_time DECIMAL(10, 3) NOT NULL,
    duration DECIMAL(10, 3) NOT NULL,
    thumbnail_url TEXT,
    tags TEXT[],
    description TEXT,
    ai_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Video contributors table for multi-contributor projects
CREATE TABLE video_contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    contribution_type VARCHAR(50) NOT NULL, -- 'creator', 'editor', 'translator', 'asl_interpreter'
    contribution_percentage DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
    scenes UUID[], -- array of scene IDs if contribution is scene-based
    description TEXT,
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(content_id, user_id, contribution_type)
);

-- Video quality control table
CREATE TABLE video_quality_reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    reviewer_id UUID REFERENCES users(id),
    review_type VARCHAR(50) NOT NULL, -- 'ai_automated', 'human_review'
    quality_score DECIMAL(3, 2), -- 0.00 to 1.00
    technical_score DECIMAL(3, 2), -- video quality, audio, resolution
    content_score DECIMAL(3, 2), -- content relevance, appropriateness
    accessibility_score DECIMAL(3, 2), -- captions, ASL presence
    issues JSONB DEFAULT '[]', -- array of issues found
    recommendations TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'needs_revision'
    notes TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI analysis results table
CREATE TABLE ai_analysis_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    analysis_type VARCHAR(50) NOT NULL, -- 'tagging', 'scene_detection', 'moderation', 'quality'
    results JSONB NOT NULL,
    confidence_score DECIMAL(3, 2),
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_processing_jobs_tenant_id ON video_processing_jobs(tenant_id);
CREATE INDEX idx_video_processing_jobs_status ON video_processing_jobs(status);
CREATE INDEX idx_video_processing_jobs_content_id ON video_processing_jobs(content_id);
CREATE INDEX idx_video_scenes_content_id ON video_scenes(content_id);
CREATE INDEX idx_video_contributors_content_id ON video_contributors(content_id);
CREATE INDEX idx_video_contributors_user_id ON video_contributors(user_id);
CREATE INDEX idx_video_quality_reviews_content_id ON video_quality_reviews(content_id);
CREATE INDEX idx_ai_analysis_results_content_id ON ai_analysis_results(content_id);

-- RLS policies
ALTER TABLE video_processing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_contributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_quality_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_analysis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_video_processing_jobs ON video_processing_jobs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_video_scenes ON video_scenes
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_video_contributors ON video_contributors
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_video_quality_reviews ON video_quality_reviews
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_ai_analysis_results ON ai_analysis_results
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
