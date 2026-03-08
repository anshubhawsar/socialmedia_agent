import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const hasValidSupabase = 
  supabaseUrl && 
  supabaseServiceKey && 
  !supabaseUrl.includes('your-project') && 
  !supabaseServiceKey.includes('your-service');

export const supabase = hasValidSupabase 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export const isSupabaseConfigured = () => supabase !== null;
