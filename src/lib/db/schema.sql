-- Drop existing tables if they exist (to recreate with new schema)
DROP TABLE IF EXISTS notes CASCADE;
DROP TABLE IF EXISTS notebooks CASCADE;
DROP TABLE IF EXISTS category_tags CASCADE;
DROP TABLE IF EXISTS prompt_tags CASCADE;
DROP TABLE IF EXISTS tag_categories CASCADE;
DROP TABLE IF EXISTS tags CASCADE;
DROP TABLE IF EXISTS prompts CASCADE;
DROP TABLE IF EXISTS folders CASCADE;

-- Folders table (using TEXT for IDs to support string IDs like 'writing', 'coding')
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  parent_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Prompts table
CREATE TABLE prompts (
  id TEXT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  folder_id TEXT REFERENCES folders(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Tags table
CREATE TABLE tags (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL
);

-- Tag categories table
CREATE TABLE tag_categories (
  id TEXT PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

-- Junction: prompt_tags (many-to-many relationship between prompts and tags)
CREATE TABLE prompt_tags (
  prompt_id TEXT REFERENCES prompts(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (prompt_id, tag_id)
);

-- Junction: category_tags (many-to-many relationship between categories and tags)
CREATE TABLE category_tags (
  category_id TEXT REFERENCES tag_categories(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (category_id, tag_id)
);

-- Notebooks table
CREATE TABLE notebooks (
  id TEXT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) DEFAULT 'notebook',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Notes table
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  notebook_id TEXT REFERENCES notebooks(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  type VARCHAR(50) DEFAULT 'text',
  template VARCHAR(100) DEFAULT NULL,
  position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Junction: note_tags (many-to-many relationship between notes and tags)
CREATE TABLE note_tags (
  note_id TEXT REFERENCES notes(id) ON DELETE CASCADE,
  tag_id TEXT REFERENCES tags(id) ON DELETE CASCADE,
  PRIMARY KEY (note_id, tag_id)
);

-- Indexes for better query performance
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_prompts_folder_id ON prompts(folder_id);
CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_notes_notebook_id ON notes(notebook_id);
