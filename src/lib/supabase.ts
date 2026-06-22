// Re-export the singleton from supabase-client to avoid duplicate GoTrueClient instances.
// All code should import from '@/lib/supabase-client' directly.
// This file exists only for backward compatibility.
export { supabase } from './supabase-client'
