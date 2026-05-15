-- Creators Platform Schema for Neon PostgreSQL
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Creators table (main entity)
CREATE TABLE IF NOT EXISTS creators (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pinksync_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  signing_style TEXT CHECK (signing_style IN ('ASL', 'BSL', 'LSF', 'ISL', 'custom')),
  accessibility_preferences JSONB DEFAULT '{}',
  contact_info JSONB DEFAULT '{}',
  social_links JSONB DEFAULT '{}',
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0.00,
  completed_projects INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for fast lookup
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Projects (opportunities from companies)
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements JSONB NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  deadline TIMESTAMPTZ,
  duration_days INTEGER,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'completed', 'cancelled')),
  assigned_creator_id UUID REFERENCES creators(id),
  accessibility_requirements JSONB DEFAULT '{}',
  required_languages TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Applications (creators applying to projects)
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES creators(id) ON DELETE CASCADE,
  proposal TEXT NOT NULL,
  proposed_budget DECIMAL(10,2),
  estimated_days INTEGER,
  portfolio_links TEXT[],
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'accepted', 'rejected')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, creator_id)
);

-- Videos (processed content)
CREATE TABLE IF NOT EXISTS videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  creator_id UUID REFERENCES creators(id),
  pinksync_video_id TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  duration_seconds INTEGER,
  file_size_bytes BIGINT,
  url TEXT,
  thumbnail_url TEXT,
  accessibility_score INTEGER CHECK (accessibility_score >= 0 AND accessibility_score <= 100),
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_job_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id),
  creator_id UUID REFERENCES creators(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  stripe_payment_intent_id TEXT,
  payout_id TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics
CREATE TABLE IF NOT EXISTS analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  user_id UUID,
  creator_id UUID,
  project_id UUID,
  video_id UUID,
  properties JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_creators_pinksync ON creators(pinksync_user_id);
CREATE INDEX IF NOT EXISTS idx_creators_email ON creators(email);
CREATE INDEX IF NOT EXISTS idx_creators_rating ON creators(rating DESC);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company_id);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_applications_project ON applications(project_id);
CREATE INDEX IF NOT EXISTS idx_applications_creator ON applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_project ON videos(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_creator ON payments(creator_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_name ON analytics_events(event_name);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_creators_updated_at ON creators;
CREATE TRIGGER update_creators_updated_at BEFORE UPDATE ON creators FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_videos_updated_at ON videos;
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create full-text search
ALTER TABLE creators ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(display_name, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(bio, '')), 'B')
) STORED;

CREATE INDEX IF NOT EXISTS idx_creators_search ON creators USING GIN(search_vector);

-- Create materialized view for dashboard
CREATE MATERIALIZED VIEW IF NOT EXISTS creator_dashboard AS
SELECT 
  c.id,
  c.display_name,
  c.rating,
  c.completed_projects,
  c.total_earnings,
  COUNT(DISTINCT p.id) as active_projects,
  COUNT(DISTINCT a.id) as pending_applications,
  AVG(v.accessibility_score) as avg_accessibility_score
FROM creators c
LEFT JOIN projects p ON p.assigned_creator_id = c.id AND p.status = 'in_progress'
LEFT JOIN applications a ON a.creator_id = c.id AND a.status = 'pending'
LEFT JOIN videos v ON v.creator_id = c.id
GROUP BY c.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_dashboard ON creator_dashboard(id);
