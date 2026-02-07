-- Initialize PGVector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table for vector storage
CREATE TABLE IF NOT EXISTS embeddings (
  id SERIAL PRIMARY KEY,
  vector vector(384),
  content TEXT NOT NULL,
  course_id INTEGER,
  lesson_id INTEGER,
  file_id INTEGER,
  file_type VARCHAR(50),
  page_number INTEGER,
  timestamp_seconds FLOAT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for vector similarity search
CREATE INDEX IF NOT EXISTS embeddings_vector_idx ON embeddings USING ivfflat (vector vector_cosine_ops) WITH (lists = 100);

-- Create additional indexes for filtering
CREATE INDEX IF NOT EXISTS embeddings_course_id_idx ON embeddings(course_id);
CREATE INDEX IF NOT EXISTS embeddings_lesson_id_idx ON embeddings(lesson_id);
CREATE INDEX IF NOT EXISTS embeddings_file_id_idx ON embeddings(file_id);
