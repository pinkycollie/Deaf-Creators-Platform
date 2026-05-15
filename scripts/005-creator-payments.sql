-- Creator Payments and Royalties Schema
-- Manages task assignments, earnings, and payment disbursements

-- Creator profiles with payment information
CREATE TABLE creator_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(255) NOT NULL,
    bio TEXT,
    specializations TEXT[], -- 'asl_interpreter', 'video_editor', 'content_creator'
    portfolio_url TEXT,
    payment_method VARCHAR(50), -- 'stripe', 'paypal', 'bank_transfer', 'crypto'
    payment_details JSONB DEFAULT '{}', -- encrypted payment info
    stripe_account_id VARCHAR(255),
    paypal_email VARCHAR(255),
    crypto_wallet_address VARCHAR(255),
    tax_info JSONB DEFAULT '{}', -- W9/W8 info
    payout_threshold DECIMAL(10, 2) DEFAULT 50.00, -- minimum payout amount
    preferred_currency VARCHAR(10) DEFAULT 'USD',
    is_verified BOOLEAN DEFAULT FALSE,
    verification_date TIMESTAMP WITH TIME ZONE,
    rating DECIMAL(3, 2) DEFAULT 0.00, -- 0.00 to 5.00
    total_projects INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'pending', 'suspended'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- Task/Project assignments for creators
CREATE TABLE creator_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES users(id),
    assigned_to UUID NOT NULL REFERENCES users(id),
    content_id UUID REFERENCES content(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    task_type VARCHAR(50) NOT NULL, -- 'video_creation', 'editing', 'translation', 'asl_interpretation'
    requirements JSONB DEFAULT '{}', -- specific requirements
    deadline TIMESTAMP WITH TIME ZONE,
    budget DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'submitted', 'approved', 'rejected', 'completed'
    priority INTEGER DEFAULT 5, -- 1-10
    deliverables JSONB DEFAULT '[]', -- list of required outputs
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Earnings and royalties tracking
CREATE TABLE creator_earnings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE SET NULL,
    task_id UUID REFERENCES creator_tasks(id) ON DELETE SET NULL,
    earning_type VARCHAR(50) NOT NULL, -- 'task_payment', 'royalty', 'bonus', 'tip', 'nft_sale'
    description TEXT,
    gross_amount DECIMAL(12, 4) NOT NULL,
    platform_fee DECIMAL(12, 4) DEFAULT 0,
    tax_amount DECIMAL(12, 4) DEFAULT 0,
    net_amount DECIMAL(12, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    source_details JSONB DEFAULT '{}', -- views, sales, etc.
    period_start DATE,
    period_end DATE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'confirmed', 'paid', 'disputed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Royalty rules and configurations
CREATE TABLE royalty_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID REFERENCES content(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- 'view_based', 'scene_based', 'revenue_share', 'flat_rate'
    configuration JSONB NOT NULL, -- percentage splits, thresholds, etc.
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 1, -- for rule precedence
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scene-based royalty distributions
CREATE TABLE scene_royalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
    scene_id UUID NOT NULL REFERENCES video_scenes(id) ON DELETE CASCADE,
    contributor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    royalty_percentage DECIMAL(5, 2) NOT NULL, -- 0.00 to 100.00
    royalty_type VARCHAR(50), -- 'creation', 'editing', 'performance'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(scene_id, contributor_id, royalty_type)
);

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    earnings_ids UUID[] NOT NULL, -- array of earning IDs included in this payment
    payment_method VARCHAR(50) NOT NULL,
    payment_provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'wise', 'crypto'
    provider_transaction_id VARCHAR(255),
    gross_amount DECIMAL(12, 4) NOT NULL,
    fee_amount DECIMAL(12, 4) DEFAULT 0,
    net_amount DECIMAL(12, 4) NOT NULL,
    currency VARCHAR(10) DEFAULT 'USD',
    exchange_rate DECIMAL(12, 6) DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'refunded'
    failure_reason TEXT,
    receipt_url TEXT,
    receipt_sent BOOLEAN DEFAULT FALSE,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Payment audit trail
CREATE TABLE payment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    transaction_id UUID REFERENCES payment_transactions(id),
    earning_id UUID REFERENCES creator_earnings(id),
    action VARCHAR(100) NOT NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    performed_by UUID REFERENCES users(id),
    details JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Creator performance analytics
CREATE TABLE creator_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_date DATE NOT NULL,
    total_views BIGINT DEFAULT 0,
    total_earnings DECIMAL(12, 4) DEFAULT 0,
    total_royalties DECIMAL(12, 4) DEFAULT 0,
    content_created INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    avg_content_rating DECIMAL(3, 2) DEFAULT 0,
    engagement_score DECIMAL(5, 2) DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(creator_id, period_type, period_date)
);

-- Video content requests (for request matching)
CREATE TABLE content_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    matched_content_id UUID REFERENCES content(id) ON DELETE SET NULL,
    assigned_creator_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    requirements JSONB DEFAULT '{}',
    tags TEXT[],
    preferred_format VARCHAR(50),
    max_duration INTEGER, -- seconds
    budget_min DECIMAL(10, 2),
    budget_max DECIMAL(10, 2),
    deadline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'matched', 'assigned', 'in_progress', 'completed', 'cancelled'
    match_score DECIMAL(3, 2), -- AI-determined match quality
    pricing_estimate DECIMAL(10, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_creator_profiles_tenant_id ON creator_profiles(tenant_id);
CREATE INDEX idx_creator_profiles_user_id ON creator_profiles(user_id);
CREATE INDEX idx_creator_tasks_tenant_id ON creator_tasks(tenant_id);
CREATE INDEX idx_creator_tasks_assigned_to ON creator_tasks(assigned_to);
CREATE INDEX idx_creator_tasks_status ON creator_tasks(status);
CREATE INDEX idx_creator_earnings_creator_id ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);
CREATE INDEX idx_creator_earnings_created_at ON creator_earnings(created_at);
CREATE INDEX idx_payment_transactions_creator_id ON payment_transactions(creator_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_scene_royalties_content_id ON scene_royalties(content_id);
CREATE INDEX idx_content_requests_tenant_id ON content_requests(tenant_id);
CREATE INDEX idx_content_requests_status ON content_requests(status);
CREATE INDEX idx_creator_analytics_creator_id ON creator_analytics(creator_id);

-- RLS policies
ALTER TABLE creator_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE royalty_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE scene_royalties ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_creator_profiles ON creator_profiles
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_creator_tasks ON creator_tasks
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_creator_earnings ON creator_earnings
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_royalty_rules ON royalty_rules
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_scene_royalties ON scene_royalties
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_payment_transactions ON payment_transactions
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_payment_audit_logs ON payment_audit_logs
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_creator_analytics ON creator_analytics
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_content_requests ON content_requests
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
