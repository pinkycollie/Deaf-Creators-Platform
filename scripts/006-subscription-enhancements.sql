-- Migration: Enhanced Subscription Management
-- Adds fields and constraints for better subscription handling

-- Add stripe_customer_id to subscriptions table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'subscriptions' 
        AND column_name = 'stripe_customer_id'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN stripe_customer_id VARCHAR(255);
    END IF;
END $$;

-- Add unique constraint on user_id for subscriptions
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'subscriptions_user_id_key'
    ) THEN
        ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- Create subscription_tiers table for flexible tier management
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stripe_monthly_price_id VARCHAR(255),
    stripe_yearly_price_id VARCHAR(255),
    monthly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    yearly_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
    max_projects INTEGER DEFAULT -1, -- -1 means unlimited
    max_storage_gb INTEGER DEFAULT 1,
    max_video_duration_minutes INTEGER DEFAULT -1, -- -1 means unlimited
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    priority INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default subscription tiers
INSERT INTO subscription_tiers (id, name, description, monthly_price, yearly_price, max_projects, max_storage_gb, max_video_duration_minutes, features, priority)
VALUES 
    (
        'free',
        'Free',
        'Try out the platform with limited features',
        0,
        0,
        1,
        1,
        10,
        '[
            {"name": "1 project", "included": true},
            {"name": "1 GB storage", "included": true},
            {"name": "Video duration up to 10 minutes", "included": true},
            {"name": "Standard video processing", "included": true},
            {"name": "Basic analytics", "included": true},
            {"name": "Community support", "included": true},
            {"name": "ASL caption support", "included": true}
        ]'::jsonb,
        0
    ),
    (
        'basic',
        'Basic',
        'Perfect for individual creators getting started',
        9.99,
        99.99,
        5,
        10,
        30,
        '[
            {"name": "Up to 5 projects", "included": true},
            {"name": "10 GB storage", "included": true},
            {"name": "Video duration up to 30 minutes", "included": true},
            {"name": "Standard video processing", "included": true},
            {"name": "Basic analytics", "included": true},
            {"name": "Community support", "included": true},
            {"name": "ASL caption support", "included": true}
        ]'::jsonb,
        1
    ),
    (
        'standard',
        'Standard',
        'For growing creators with more content',
        24.99,
        249.99,
        20,
        50,
        120,
        '[
            {"name": "Up to 20 projects", "included": true},
            {"name": "50 GB storage", "included": true},
            {"name": "Video duration up to 2 hours", "included": true},
            {"name": "HD video processing", "included": true},
            {"name": "Advanced analytics", "included": true},
            {"name": "Email support", "included": true},
            {"name": "ASL caption support", "included": true},
            {"name": "Custom branding", "included": true}
        ]'::jsonb,
        2
    ),
    (
        'premium',
        'Premium',
        'For professional creators and teams',
        49.99,
        499.99,
        -1,
        200,
        -1,
        '[
            {"name": "Unlimited projects", "included": true},
            {"name": "200 GB storage", "included": true},
            {"name": "Unlimited video duration", "included": true},
            {"name": "4K video processing", "included": true},
            {"name": "Advanced analytics", "included": true},
            {"name": "Priority support", "included": true},
            {"name": "ASL caption support", "included": true},
            {"name": "Custom branding", "included": true},
            {"name": "API access", "included": true},
            {"name": "White-label options", "included": true},
            {"name": "Dedicated account manager", "included": true}
        ]'::jsonb,
        3
    )
ON CONFLICT (id) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_tiers_priority ON subscription_tiers(priority);

-- Create a function to check subscription limits
CREATE OR REPLACE FUNCTION check_subscription_limit(
    p_user_id UUID,
    p_limit_type VARCHAR(50),
    p_current_value INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_tier_id VARCHAR(50);
    v_limit INTEGER;
BEGIN
    -- Get user's current subscription tier
    SELECT plan_id INTO v_tier_id
    FROM subscriptions
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_tier_id IS NULL THEN
        v_tier_id := 'free';
    END IF;
    
    -- Get the limit for the tier
    CASE p_limit_type
        WHEN 'projects' THEN
            SELECT max_projects INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
        WHEN 'storage' THEN
            SELECT max_storage_gb INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
        WHEN 'video_duration' THEN
            SELECT max_video_duration_minutes INTO v_limit FROM subscription_tiers WHERE id = v_tier_id;
        ELSE
            RETURN FALSE;
    END CASE;
    
    -- -1 means unlimited
    IF v_limit = -1 THEN
        RETURN TRUE;
    END IF;
    
    -- Check if current value is within limit
    RETURN p_current_value < v_limit;
END;
$$ LANGUAGE plpgsql;

-- Create audit log for subscription changes
CREATE TABLE IF NOT EXISTS subscription_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID NOT NULL REFERENCES subscriptions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    old_plan_id VARCHAR(100),
    new_plan_id VARCHAR(100),
    old_status VARCHAR(50),
    new_status VARCHAR(50),
    change_type VARCHAR(50) NOT NULL, -- 'created', 'upgraded', 'downgraded', 'canceled', 'reactivated'
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON subscription_history(created_at);

-- Enable RLS on new tables
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;

-- RLS policy for subscription_tiers (readable by all)
CREATE POLICY subscription_tiers_read_all ON subscription_tiers
    FOR SELECT USING (TRUE);

-- RLS policy for subscription_history (tenant isolation)
CREATE POLICY subscription_history_tenant_isolation ON subscription_history
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
