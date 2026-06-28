-- ====================================================================
-- PostgreSQL Database Schema Layout for Community Hero
-- Fully optimized for Hyperlocal Civic Hazard Mapping & AI Routing
-- Created/Updated: 2026-06-23
-- ====================================================================

-- --------------------------------------------------------------------
-- Prerequisite Extensions
-- --------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- --------------------------------------------------------------------
-- Drop Existing Tables (Reverse Order of Reference Columns)
-- --------------------------------------------------------------------
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_rewards CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS verifications CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS timeline_items CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- --------------------------------------------------------------------
-- 1. Users Table (Core Citizen & Admin Directory)
-- --------------------------------------------------------------------
CREATE TABLE users (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'u_' || md5(random()::text),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'citizen' CHECK (role IN ('citizen', 'admin')),
    points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 2. Departments Table (Responsible Municipal Agencies)
-- --------------------------------------------------------------------
CREATE TABLE departments (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'dept_' || md5(random()::text),
    name VARCHAR(150) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g. "SF_DPW" for Dept of Public Works
    contact_email VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 3. Issues Table (Civic and Safety Incidents Registry)
-- --------------------------------------------------------------------
CREATE TABLE issues (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'issue_' || md5(random()::text),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN (
        'Pothole', 'Water Leakage', 'Garbage', 'Drainage', 
        'Streetlight', 'Road Damage', 'Public Safety', 'Other'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'Reported' CHECK (status IN (
        'Reported', 'Verified', 'Assigned', 'In Progress', 'Resolved'
    )),
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    image_url TEXT,
    reporter_id VARCHAR(100) NOT NULL,
    reporter_name VARCHAR(150) NOT NULL,
    department_id VARCHAR(100),
    upvotes_count INTEGER NOT NULL DEFAULT 0 CHECK (upvotes_count >= 0),
    verifications_count INTEGER NOT NULL DEFAULT 0 CHECK (verifications_count >= 0),
    summary TEXT NOT NULL,
    ai_explanation TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_issues_reporter FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_issues_department FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
    
    -- GPS spatial bound constraint (Must be a valid coordinate on planet earth)
    CONSTRAINT chk_latitude CHECK (latitude BETWEEN -90 AND 90),
    CONSTRAINT chk_longitude CHECK (longitude BETWEEN -180 AND 180)
);

-- --------------------------------------------------------------------
-- 4. Comments Table (Incident Discussion Thread Panels)
-- --------------------------------------------------------------------
CREATE TABLE comments (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'com_' || md5(random()::text),
    issue_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100), -- Can be NULL to represent System / City AI counselor proxy
    user_name VARCHAR(150) NOT NULL,
    user_role VARCHAR(20) NOT NULL CHECK (user_role IN ('citizen', 'admin', 'ai')),
    comment_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_comments_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- --------------------------------------------------------------------
-- 5. Verifications Table (Onsite Resident Attestations)
-- --------------------------------------------------------------------
CREATE TABLE verifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ver_' || md5(random()::text),
    issue_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(100) NOT NULL,
    notes TEXT NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_verifications_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE,
    CONSTRAINT fk_verifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Enforce single verification per citizen per issue
    CONSTRAINT uq_user_issue_verification UNIQUE (user_id, issue_id)
);

-- --------------------------------------------------------------------
-- 6. Badges Table (Civic Engagement achievements metadata)
-- --------------------------------------------------------------------
CREATE TABLE badges (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'badge_' || md5(random()::text),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    icon_url VARCHAR(255),
    points_required INTEGER NOT NULL DEFAULT 0 CHECK (points_required >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 7. User Badges Junction Table (Awarded achievements record)
-- --------------------------------------------------------------------
CREATE TABLE user_badges (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ub_' || md5(random()::text),
    user_id VARCHAR(100) NOT NULL,
    badge_id VARCHAR(100) NOT NULL,
    earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_user_badges_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_badges_badge FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    
    -- Duplicity defense
    CONSTRAINT uq_user_badge UNIQUE (user_id, badge_id)
);

-- --------------------------------------------------------------------
-- 8. Rewards Table (Point Redemption Items catalogue)
-- --------------------------------------------------------------------
CREATE TABLE rewards (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'rew_' || md5(random()::text),
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    stock INTEGER NOT NULL DEFAULT -1, -- Negative implies infinite voucher generation
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- --------------------------------------------------------------------
-- 9. User Rewards Junction Table (Redemption history store)
-- --------------------------------------------------------------------
CREATE TABLE user_rewards (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ur_' || md5(random()::text),
    user_id VARCHAR(100) NOT NULL,
    reward_id VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Claimed', 'Cancelled')),
    redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_user_rewards_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_rewards_reward FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 10. Notifications Table (System & Engagement dispatch logs)
-- --------------------------------------------------------------------
CREATE TABLE notifications (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'ntf_' || md5(random()::text),
    user_id VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50) NOT NULL DEFAULT 'system' CHECK (type IN (
        'system', 'badge_earned', 'issue_update', 'comment', 
        'points_awarded', 'reward_redeemed'
    )),
    reference_id VARCHAR(100), -- Holds reference key (e.g. issue_id or badge_id)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- 11. Timeline Items Table (Incident lifecycle timeline logs)
-- --------------------------------------------------------------------
CREATE TABLE timeline_items (
    id VARCHAR(100) PRIMARY KEY DEFAULT 'time_' || md5(random()::text),
    issue_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    updated_by VARCHAR(55) NOT NULL CHECK (updated_by IN ('reporter', 'admin', 'ai')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Foreign Key constraints
    CONSTRAINT fk_timeline_issue FOREIGN KEY (issue_id) REFERENCES issues(id) ON DELETE CASCADE
);

-- --------------------------------------------------------------------
-- Optimization Indexes for high-throughput queries
-- --------------------------------------------------------------------

-- Geolocation spatial index
CREATE INDEX idx_issues_spatial_clustering ON issues (latitude, longitude);

-- Filter & State lookups
CREATE INDEX idx_issues_filtering ON issues (status, category, severity);
CREATE INDEX idx_issues_reporter_id ON issues (reporter_id);
CREATE INDEX idx_issues_department_id ON issues (department_id);

-- User-specific listings
CREATE INDEX idx_notifications_unread ON notifications (user_id) WHERE is_read = FALSE;
CREATE INDEX idx_comments_issue_lookup ON comments (issue_id);
CREATE INDEX idx_verifications_joint ON verifications (issue_id, user_id);
CREATE INDEX idx_user_badges_lookup ON user_badges (user_id);
CREATE INDEX idx_user_rewards_lookup ON user_rewards (user_id);

-- --------------------------------------------------------------------
-- Seed initial records for testing
-- --------------------------------------------------------------------
INSERT INTO users (id, email, full_name, password_hash, role, points) VALUES 
('u_alex_admin', 'alex@government.org', 'Alex Supervisor', '$2a$10$I6jL4xU6aNf98iP6k6U6b.Gskj10qGk6rR3849xUkI837nS9P3x12', 'admin', 1000),
('u_jane_doe', 'jane@community.org', 'Jane Doe', '$2a$10$I6jL4xU6aNf98iP6k6U6b.Gskj10qGk6rR3849xUkI837nS9P3x12', 'citizen', 250);

INSERT INTO departments (id, name, code, contact_email) VALUES
('dept_dpw', 'Department of Public Works', 'SF_DPW', 'dpw-dispatch@sfgov.org'),
('dept_muni', 'Municipal Transportation Agency', 'SF_MTA', 'muni-streets@sfgov.org'),
('dept_puc', 'Public Utilities Commission', 'SF_PUC', 'water-power@sfgov.org');

INSERT INTO badges (id, name, description, points_required) VALUES
('badge_first_responder', 'First Responder', 'Logged your very first hyperlocal hazard log', 0),
('badge_civic_crusader', 'Civic Crusader', 'Acquired over 200 points in verified hazard reports', 200),
('badge_safety_sentinel', 'Safety Sentinel', 'Submitted 10 verified on-site field inspections', 500);

INSERT INTO rewards (id, title, description, points_cost, stock) VALUES
('rew_muni_pass', 'MUNI Transit 1-Day Pass Coupon', 'Free unlimited MUNI rides inside SF county lines.', 150, 100),
('rew_park_voucher', 'Gold State National Park Token', 'Complimentary visitor entry passes.', 300, 50);
