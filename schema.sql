-- Alumni Directory & E-Book Schema (Cloudflare D1)

CREATE TABLE IF NOT EXISTS alumni (
  id TEXT PRIMARY KEY,
  surname TEXT NOT NULL,
  first_name TEXT NOT NULL,
  photo_key TEXT,
  city TEXT,
  state TEXT,
  employer TEXT,
  role TEXT,
  industry TEXT,
  cohort_year INTEGER NOT NULL,
  advice TEXT,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'approved', 'hidden')),
  edit_token TEXT UNIQUE NOT NULL,
  consent INTEGER DEFAULT 0 CHECK(consent IN (0, 1)),
  linkedin_url TEXT,
  hide_employer INTEGER DEFAULT 0 CHECK(hide_employer IN (0, 1)),
  hide_city INTEGER DEFAULT 0 CHECK(hide_city IN (0, 1)),
  featured INTEGER DEFAULT 0 CHECK(featured IN (0, 1)),
  leadership_role TEXT DEFAULT NULL CHECK(leadership_role IN ('lead_mentor', 'team', NULL)),
  leadership_title TEXT DEFAULT NULL,
  country TEXT DEFAULT 'Nigeria',
  removed_at DATETIME,
  deleted_at DATETIME,
  source TEXT DEFAULT 'form' CHECK(source IN ('form', 'import')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alumni_status ON alumni(status);
CREATE INDEX IF NOT EXISTS idx_alumni_cohort ON alumni(cohort_year);
CREATE INDEX IF NOT EXISTS idx_alumni_deleted ON alumni(deleted_at);
CREATE INDEX IF NOT EXISTS idx_alumni_edit_token ON alumni(edit_token);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  directory_public INTEGER DEFAULT 1 CHECK(directory_public IN (0, 1)),
  ebook_public INTEGER DEFAULT 0 CHECK(ebook_public IN (0, 1)),
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize default settings row if not present
INSERT OR IGNORE INTO settings (id, directory_public, ebook_public) VALUES (1, 1, 0);

CREATE TABLE IF NOT EXISTS ebooks (
  id TEXT PRIMARY KEY,
  edition_name TEXT,
  scope TEXT NOT NULL,
  pdf_key TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ebooks_scope ON ebooks(scope);

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK(type IN ('ebook_download', 'directory_view', 'profile_view')),
  cohort_year INTEGER,
  alumni_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_events_type ON events(type);
