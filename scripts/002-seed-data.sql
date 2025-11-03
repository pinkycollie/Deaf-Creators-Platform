-- Insert sample tenant
INSERT INTO tenants (id, name, slug, domain, subscription_tier) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Tenant', 'demo', 'demo.localhost:3000', 'pro');

-- Insert sample users
INSERT INTO users (id, tenant_id, email, username, full_name, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000', 'admin@demo.com', 'admin', 'Admin User', 'admin'),
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'creator@demo.com', 'creator1', 'Demo Creator', 'creator');

-- Insert sample content
INSERT INTO content (id, tenant_id, creator_id, title, description, content_type, status, visibility) VALUES
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Welcome to ASL Learning', 'Introduction to American Sign Language basics', 'video', 'published', 'public');
