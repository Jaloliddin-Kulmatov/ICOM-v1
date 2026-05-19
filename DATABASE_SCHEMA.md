# ICON Platform — Database Schema

## PostgreSQL Schema

```sql
-- ============================================================
-- USERS & AUTH
-- ============================================================

CREATE TYPE user_role AS ENUM ('student', 'ambassador', 'admin');
CREATE TYPE visa_type AS ENUM ('D-2', 'D-4', 'F-2', 'F-4', 'E-7', 'other');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),          -- null for OAuth-only accounts
  name          VARCHAR(100) NOT NULL,
  bio           TEXT,
  avatar_url    VARCHAR(500),
  role          user_role DEFAULT 'student',
  is_verified   BOOLEAN DEFAULT FALSE,
  university_id UUID REFERENCES universities(id),
  country_code  CHAR(2),               -- ISO 3166-1 alpha-2
  visa_type     visa_type,
  visa_expiry   DATE,
  language_pref CHAR(2) DEFAULT 'en',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at  TIMESTAMPTZ
);

CREATE TABLE oauth_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  provider    VARCHAR(50) NOT NULL,   -- 'google', 'github', 'kakao'
  provider_id VARCHAR(255) NOT NULL,
  UNIQUE(provider, provider_id)
);

CREATE TABLE email_verifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  token      VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at    TIMESTAMPTZ
);

-- ============================================================
-- UNIVERSITIES & AMBASSADORS
-- ============================================================

CREATE TABLE universities (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         VARCHAR(200) NOT NULL,
  short_name   VARCHAR(20) NOT NULL,
  location     VARCHAR(100),
  website      VARCHAR(255),
  email_domain VARCHAR(100),           -- e.g. "snu.ac.kr"
  logo_url     VARCHAR(500),
  brand_color  CHAR(7),                -- hex
  founded_year INTEGER,
  ranking      INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ambassadors (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  department    VARCHAR(100),
  year          SMALLINT,
  status        verification_status DEFAULT 'pending',
  verified_at   TIMESTAMPTZ,
  verified_by   UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COMMUNITY POSTS
-- ============================================================

CREATE TYPE post_type AS ENUM ('post', 'announcement', 'event', 'alert');

CREATE TABLE posts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id),
  type          post_type DEFAULT 'post',
  content       TEXT NOT NULL,
  image_url     VARCHAR(500),
  translated_content TEXT,              -- AI-translated version
  original_lang CHAR(2),
  is_pinned     BOOLEAN DEFAULT FALSE,
  is_deleted    BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE post_tags (
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  tag     VARCHAR(50) NOT NULL,
  PRIMARY KEY (post_id, tag)
);

CREATE TABLE post_likes (
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE post_saves (
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    UUID REFERENCES posts(id) ON DELETE CASCADE,
  author_id  UUID REFERENCES users(id) ON DELETE CASCADE,
  parent_id  UUID REFERENCES comments(id),  -- for nested replies
  content    TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- JOBS & INTERNSHIPS
-- ============================================================

CREATE TYPE job_type AS ENUM ('part-time', 'internship', 'research', 'full-time', 'remote');

CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(200) NOT NULL,
  company         VARCHAR(200) NOT NULL,
  company_logo    VARCHAR(500),
  description     TEXT NOT NULL,
  location        VARCHAR(200),
  type            job_type NOT NULL,
  salary_min      INTEGER,
  salary_max      INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'KRW',
  salary_period   VARCHAR(20) DEFAULT 'month',
  deadline        DATE,
  is_active       BOOLEAN DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  visa_compatible TEXT[],               -- array of visa codes
  requirements    TEXT[],
  posted_by       UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ
);

CREATE TABLE job_tags (
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  tag    VARCHAR(50),
  PRIMARY KEY (job_id, tag)
);

CREATE TABLE job_applications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id     UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  status     VARCHAR(20) DEFAULT 'applied',
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(job_id, user_id)
);

CREATE TABLE job_saves (
  job_id     UUID REFERENCES jobs(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  saved_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (job_id, user_id)
);

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================

CREATE TYPE announcement_type AS ENUM ('info', 'event', 'urgent', 'scholarship');

CREATE TABLE announcements (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id     UUID REFERENCES users(id),
  university_id UUID REFERENCES universities(id),
  type          announcement_type DEFAULT 'info',
  title         VARCHAR(300) NOT NULL,
  content       TEXT NOT NULL,
  expires_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SUPPORT GUIDES
-- ============================================================

CREATE TABLE support_guides (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category   VARCHAR(50) NOT NULL,
  title      VARCHAR(300) NOT NULL,
  slug       VARCHAR(300) UNIQUE NOT NULL,
  content    TEXT NOT NULL,
  difficulty VARCHAR(10),
  read_time  SMALLINT,
  helpful    INTEGER DEFAULT 0,
  author_id  UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================

CREATE TYPE notif_type AS ENUM ('like', 'comment', 'follow', 'announcement', 'job', 'system');

CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       notif_type NOT NULL,
  title      VARCHAR(200) NOT NULL,
  message    TEXT,
  href       VARCHAR(500),
  is_read    BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- FOLLOWS
-- ============================================================

CREATE TABLE follows (
  follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
  following_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- ============================================================
-- AI SESSIONS
-- ============================================================

CREATE TABLE ai_sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  messages   JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_university ON posts(university_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_jobs_type ON jobs(type);
CREATE INDEX idx_jobs_active ON jobs(is_active, created_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_comments_post ON comments(post_id, created_at);
```
