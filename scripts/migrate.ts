import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://osldoolmbpqayxhgmbum.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9zbGRvb2xtYnBxYXl4aGdtYnVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzQ1MTk5OCwiZXhwIjoyMDkzMDI3OTk4fQ.l5uXV9U4zs9dQHjVFiwCtndUETda0uVTSXbOc7Fba4U';

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function runMigrations() {
  console.log('🚀 Starting database migrations...');

  try {
    // Use raw SQL via the REST API directly
    console.log('📋 Running raw SQL migrations...');
    
    // First, let's check if we can query the current schema
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (tablesError) {
      console.error('❌ Error checking existing tables:', tablesError);
    } else {
      console.log('📋 Existing tables:', tables?.map(t => t.table_name));
    }

    // Try to create blocks table using the standard approach
    console.log('📋 Creating blocks table...');
    
    // We'll use the Supabase SQL editor approach - create a temporary function
    const createBlocksSQL = `
      CREATE TABLE IF NOT EXISTS blocks (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id uuid REFERENCES lessons(id) ON DELETE CASCADE,
        course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
        type text NOT NULL CHECK (type IN ('video','text','image','quiz','callout','download','divider')),
        sort_order int NOT NULL DEFAULT 0,
        content jsonb DEFAULT '{}',
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
      
      CREATE INDEX IF NOT EXISTS idx_blocks_lesson_id ON blocks(lesson_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_course_id ON blocks(course_id);
      CREATE INDEX IF NOT EXISTS idx_blocks_type ON blocks(type);
      CREATE INDEX IF NOT EXISTS idx_blocks_sort_order ON blocks(sort_order);
    `;

    // Since we can't execute raw SQL easily, let's create a simple script to run this manually
    console.log('⚠️  Cannot execute raw SQL via JavaScript client.');
    console.log('📋 Please run this SQL manually in the Supabase SQL Editor:');
    console.log('\n' + '='.repeat(80));
    console.log(createBlocksSQL);
    console.log('='.repeat(80) + '\n');

    // Add columns to courses table SQL
    const alterCoursesSQL = `
      ALTER TABLE courses 
      ADD COLUMN IF NOT EXISTS is_first_lesson_free boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS intro_video_mux_id text,
      ADD COLUMN IF NOT EXISTS thumbnail_time float DEFAULT 0,
      ADD COLUMN IF NOT EXISTS certificate_template_url text,
      ADD COLUMN IF NOT EXISTS certificate_title text,
      ADD COLUMN IF NOT EXISTS certificate_signer text,
      ADD COLUMN IF NOT EXISTS status text DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived'));
    `;

    console.log('📋 Also run this SQL for courses table:');
    console.log('\n' + '='.repeat(80));
    console.log(alterCoursesSQL);
    console.log('='.repeat(80) + '\n');

    console.log('🎉 Migration script completed. Please run the SQL above in Supabase SQL Editor.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migrations
runMigrations();