-- Database Schema: Community Hero PostgreSQL Design Layout
-- Created: 2026-06-23

-- ER DIAGRAM PHYSICAL RELATIONSHIPS:
-- [users] (1) <------- (M) [issues] (on reporter_id)
-- [issues] (1) <------- (M) [comments] (on issue_id)
-- [users] (1) <------- (M) [comments] (on user_id)
-- [issues] (1) <------- (M) [timeline_items] (on issue_id)
-- [issues] (1) <------- (M) [upvotes] (on issue_id & user_id join index)
-- [issues] (1) <------- (M) [verifications] (on issue_id & user_id)

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Citizen / Admin profiles)
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'u_' || md5(random()::text),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
    points INTEGER NOT NULL DEFAULT 50,
    badges TEXT[] NOT NULL DEFAULT ARRAY['First Responder'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Issues Table (Incident logs)
CREATE TABLE issues (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'issue_' || md5(random()::text),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Pothole', 'Water Leakage', 'Garbage', 'Drainage', 'Streetlight', 'Road Damage', 'Public Safety', 'Other')),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'Reported' CHECK (status IN ('Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved')),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT NOT NULL,
    reporter_id VARCHAR(100) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reporter_name VARCHAR(255) NOT NULL,
    assigned_department VARCHAR(255),
    upvotes_count INTEGER NOT NULL DEFAULT 0,
    verifications_count INTEGER NOT NULL DEFAULT 0,
    summary TEXT NOT NULL,
    ai_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Comments Table (Resident discussion)
CREATE TABLE comments (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'com_' || md5(random()::text),
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id VARCHAR(100) NOT NULL, -- Reference users(id) or string 'ai_counselor'
    user_name VARCHAR(255) NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('citizen', 'admin', 'ai')),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Status Timeline Tracking
CREATE TABLE timeline_items (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'time_' || md5(random()::text),
    issue_id VARCHAR(100) NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    updated_by VARCHAR(50) NOT NULL CHECK (updated_by IN ('reporter', 'admin', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast hyperlocal spatial clustering & searching
CREATE INDEX idx_issues_coords ON issues(latitude, longitude);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_category ON issues(category);
CREATE INDEX idx_comments_issue_id ON comments(issue_id);
CREATE INDEX idx_timeline_issue_id ON timeline_items(issue_id);


-- SEED INITIAL DATA (Parity with JSON database engine)
INSERT INTO users (id, email, full_name, password_hash, role, points, badges) VALUES 
('u_default_admin', 'admin@community.org', 'Alex Admin', '$2a$10$I6jL4xU6aNf98iP6k6U6b.Gskj10qGk6rR3849xUkI837nS9P3x12', 'admin', 500, ARRAY['Civic Champion', 'City Administrator']),
('u_jane_doe', 'jane@community.org', 'Jane Doe', '$2a$10$I6jL4xU6aNf98iP6k6U6b.Gskj10qGk6rR3849xUkI837nS9P3x12', 'citizen', 240, ARRAY['Community Helper', 'Civic Champion']);
