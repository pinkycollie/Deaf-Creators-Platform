-- Video rooms for ASL conversations
CREATE TABLE video_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    room_type VARCHAR(50) DEFAULT 'conversation', -- conversation, presentation, recording
    max_participants INTEGER DEFAULT 10,
    is_recording BOOLEAN DEFAULT FALSE,
    recording_url TEXT,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room participants tracking
CREATE TABLE video_room_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'participant', -- host, moderator, participant
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    left_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    UNIQUE(room_id, user_id, joined_at)
);

-- ASL gesture recognition data
CREATE TABLE asl_gestures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID REFERENCES video_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    gesture_data JSONB NOT NULL,
    confidence_score DECIMAL(3, 2),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id UUID
);

-- Video call recordings
CREATE TABLE video_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
    recorded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    duration_seconds INTEGER,
    file_size BIGINT,
    participants TEXT[],
    metadata JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'processing',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Real-time chat messages for video calls
CREATE TABLE video_chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    room_id UUID NOT NULL REFERENCES video_rooms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text', -- text, emoji, gesture_description
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_video_rooms_tenant_id ON video_rooms(tenant_id);
CREATE INDEX idx_video_room_participants_room_id ON video_room_participants(room_id);
CREATE INDEX idx_video_room_participants_user_id ON video_room_participants(user_id);
CREATE INDEX idx_asl_gestures_room_id ON asl_gestures(room_id);
CREATE INDEX idx_asl_gestures_timestamp ON asl_gestures(timestamp);
CREATE INDEX idx_video_recordings_room_id ON video_recordings(room_id);
CREATE INDEX idx_video_chat_messages_room_id ON video_chat_messages(room_id);

-- RLS policies
ALTER TABLE video_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_room_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE asl_gestures ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_video_rooms ON video_rooms
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_video_room_participants ON video_room_participants
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_asl_gestures ON asl_gestures
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_video_recordings ON video_recordings
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

CREATE POLICY tenant_isolation_video_chat_messages ON video_chat_messages
    FOR ALL USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
