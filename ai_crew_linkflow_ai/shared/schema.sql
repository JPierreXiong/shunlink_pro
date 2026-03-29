-- LinkFlow AI — Shared Database Schema (Neon PostgreSQL)
-- Run this once against your Neon instance to bootstrap all tables.
-- Compatible with both linkflow-web (Prisma) and linkflow-crew (psycopg2).

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TABLE: users
-- Managed primarily by linkflow-web (ShipAny auth layer)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email            TEXT UNIQUE NOT NULL,
    name             TEXT,
    avatar_url       TEXT,
    provider         TEXT DEFAULT 'email',          -- 'email' | 'github' | 'google'
    credit_balance   INT NOT NULL DEFAULT 1,        -- 1 free credit on signup
    total_tasks_run  INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: payments
-- Managed by linkflow-web Creem webhook handler
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creem_checkout_id   TEXT,
    creem_product_id    TEXT,
    amount              DECIMAL(10,2),
    currency            TEXT DEFAULT 'USD',
    credits_added       INT NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'completed' | 'refunded'
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: platforms
-- Seeded by linkflow-crew admin / manually
-- Stores CSS selector configs so the AI can target any site
-- ============================================================
CREATE TABLE IF NOT EXISTS platforms (
    id               SERIAL PRIMARY KEY,
    site_name        TEXT NOT NULL,
    base_url         TEXT NOT NULL,
    category         TEXT DEFAULT 'Web2.0',           -- 'Web2.0' | 'Social' | 'Forum' | 'Blog'
    domain_authority INT DEFAULT 0,
    selector_config  JSONB NOT NULL DEFAULT '{}',     -- CSS selectors JSON blob
    login_required   BOOLEAN DEFAULT true,
    is_active        BOOLEAN DEFAULT true,
    logo_url         TEXT,
    notes            TEXT,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLE: backlink_tasks
-- The central task queue — written by linkflow-web,
-- consumed and updated by linkflow-crew worker
-- ============================================================
CREATE TABLE IF NOT EXISTS backlink_tasks (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    platform_id      INT REFERENCES platforms(id),

    -- User-submitted fields
    target_url       TEXT NOT NULL,
    anchor_text      TEXT NOT NULL,
    article_content  TEXT,
    platform_type    TEXT DEFAULT 'Web2.0',  -- 'Web2.0' | 'Social' | 'Forum'

    -- Worker status machine
    -- pending → processing → success
    --                      ↘ failed       (after 3 retries, credit refunded)
    --                      ↘ need_2fa     (paused, waiting for human input)
    -- need_2fa → pending   (user submits code, re-queued)
    status           TEXT NOT NULL DEFAULT 'pending',
    retry_count      INT NOT NULL DEFAULT 0,
    error_message    TEXT,

    -- 2FA human-in-loop fields
    twofa_code       TEXT,                   -- user-submitted 2FA code
    twofa_prompt     TEXT,                   -- message shown to user (e.g. "Enter Google Auth code")

    -- Output fields (written by worker on success)
    screenshot_url   TEXT,                   -- public URL (Vercel Blob / Cloudinary)
    live_link_url    TEXT,                   -- the published backlink URL

    -- Timing
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deadline         TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
    started_at       TIMESTAMPTZ,
    completed_at     TIMESTAMPTZ
);

-- ============================================================
-- INDEXES for worker polling performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_backlink_tasks_status
    ON backlink_tasks(status)
    WHERE status IN ('pending', 'need_2fa');

CREATE INDEX IF NOT EXISTS idx_backlink_tasks_user_id
    ON backlink_tasks(user_id);

CREATE INDEX IF NOT EXISTS idx_backlink_tasks_deadline
    ON backlink_tasks(deadline)
    WHERE status NOT IN ('success', 'failed');

CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON payments(user_id);

-- ============================================================
-- SEED: default platform entries
-- ============================================================
INSERT INTO platforms (site_name, base_url, category, domain_authority, selector_config, logo_url) VALUES
('WordPress.com',       'https://wordpress.com',        'Blog',   98, '{"login_url":"/login","username_sel":"#user_login","password_sel":"#user_pass","submit_sel":"#wp-submit","new_post_url":"/wp-admin/post-new.php","title_sel":"#title","content_sel":"#content","publish_sel":"#publish"}', 'https://s.w.org/favicon.ico'),
('Blogger',             'https://www.blogger.com',      'Blog',   95, '{"login_url":"/","new_post_url":"https://draft.blogger.com/blog/post/create","title_sel":"[data-testid=title-input]","content_sel":"[aria-label=Post body]","publish_sel":"[data-testid=publish-button]"}', 'https://www.blogger.com/favicon.ico'),
('Medium',              'https://medium.com',           'Blog',   95, '{"login_url":"/m/signin","new_post_url":"https://medium.com/new-story","title_sel":"[data-testid=post-title]","content_sel":"[contenteditable=true]","publish_sel":"[data-testid=publish-button]"}', 'https://miro.medium.com/max/1200/1*jfdwtvU6V6g99q3G7gq7dQ.png'),
('Tumblr',              'https://www.tumblr.com',       'Blog',   94, '{"login_url":"/login","new_post_url":"https://www.tumblr.com/new/text","title_sel":"[name=title]","content_sel":"[data-testid=text-editor]","publish_sel":"[data-testid=publish-button]"}', 'https://assets.tumblr.com/images/favicons/favicon.ico'),
('Weebly',              'https://www.weebly.com',       'Web2.0', 92, '{"login_url":"/app#login","new_post_url":"/app#page/new","title_sel":".page-title input","content_sel":".content-area","publish_sel":".publish-button"}', 'https://www.weebly.com/favicon.ico'),
('Wix',                 'https://www.wix.com',          'Web2.0', 92, '{"login_url":"/signin","new_post_url":"https://manage.wix.com/new-post","title_sel":"[data-hook=post-title]","content_sel":"[data-hook=ricos-editor]","publish_sel":"[data-hook=publish-button]"}', 'https://www.wix.com/favicon.ico'),
('LiveJournal',         'https://www.livejournal.com',  'Blog',   88, '{"login_url":"/login.bml","username_sel":"#user","password_sel":"#password","submit_sel":"[name=action:login]","new_post_url":"https://www.livejournal.com/update.bml","title_sel":"#subject","content_sel":"#draft","publish_sel":"[name=action:update]"}', 'https://www.livejournal.com/favicon.ico'),
('HubPages',            'https://hubpages.com',         'Web2.0', 86, '{"login_url":"/user/login","username_sel":"#email","password_sel":"#password","submit_sel":".login-btn","new_post_url":"https://hubpages.com/my/hubs/new","title_sel":"[name=title]","content_sel":".ql-editor","publish_sel":".publish-hub"}', 'https://hubpages.com/favicon.ico'),
('Quora Spaces',        'https://www.quora.com',        'Social', 93, '{"login_url":"/","new_post_url":"https://www.quora.com/create-post","title_sel":"[contenteditable=true]","content_sel":".q-text","publish_sel":"[data-testid=submit-button]"}', 'https://www.quora.com/favicon.ico'),
('Vocal.media',         'https://vocal.media',          'Blog',   74, '{"login_url":"/login","new_post_url":"https://vocal.media/create-story","title_sel":"[placeholder=Title]","content_sel":"[contenteditable=true]","publish_sel":"[data-testid=publish]"}', 'https://vocal.media/favicon.ico')
ON CONFLICT DO NOTHING;


