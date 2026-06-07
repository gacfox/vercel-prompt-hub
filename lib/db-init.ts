export const DDL = `
CREATE TABLE IF NOT EXISTS vph_users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(64) NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vph_content (
  id          SERIAL PRIMARY KEY,
  author_id   INTEGER NOT NULL REFERENCES vph_users(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL,
  title       VARCHAR(200) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  is_public   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_type_public_created
  ON vph_content (type, is_public, created_at);

CREATE INDEX IF NOT EXISTS idx_content_author
  ON vph_content (author_id);

CREATE TABLE IF NOT EXISTS vph_content_text (
  id            SERIAL PRIMARY KEY,
  content_id    INTEGER NOT NULL UNIQUE REFERENCES vph_content(id) ON DELETE CASCADE,
  system_prompt TEXT NOT NULL DEFAULT '',
  user_prompt   TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vph_content_drawing (
  id         SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL UNIQUE REFERENCES vph_content(id) ON DELETE CASCADE,
  model      VARCHAR(200) NOT NULL DEFAULT '',
  prompt     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vph_content_drawing_fields (
  id          SERIAL PRIMARY KEY,
  drawing_id  INTEGER NOT NULL REFERENCES vph_content_drawing(id) ON DELETE CASCADE,
  field_key   VARCHAR(200) NOT NULL,
  field_value TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vph_content_agent_skill (
  id         SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL UNIQUE REFERENCES vph_content(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS vph_agent_skill_files (
  id              SERIAL PRIMARY KEY,
  agent_skill_id  INTEGER NOT NULL REFERENCES vph_content_agent_skill(id) ON DELETE CASCADE,
  file_path       VARCHAR(500) NOT NULL,
  content         TEXT NOT NULL DEFAULT '',
  is_directory    BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS vph_content_shell (
  id         SERIAL PRIMARY KEY,
  content_id INTEGER NOT NULL UNIQUE REFERENCES vph_content(id) ON DELETE CASCADE,
  shell_type VARCHAR(20) NOT NULL DEFAULT 'bash',
  command    TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS vph_likes (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES vph_users(id) ON DELETE CASCADE,
  content_id INTEGER NOT NULL REFERENCES vph_content(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);
`;
