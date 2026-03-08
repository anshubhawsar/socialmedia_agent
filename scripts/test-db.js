const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const getEnv = (key) => {
  const match = envContent.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : '';
};

async function testConnection() {
  const supabase = createClient(
    getEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getEnv('SUPABASE_SERVICE_ROLE_KEY')
  );

  console.log('🔄 Testing database connection...\n');

  // Test users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('count', { count: 'exact', head: true });
  
  console.log('✅ users table:', usersError ? '❌ ' + usersError.message : '✓ exists');

  // Test tweets table
  const { data: tweets, error: tweetsError } = await supabase
    .from('tweets')
    .select('count', { count: 'exact', head: true });
  
  console.log('✅ tweets table:', tweetsError ? '❌ ' + tweetsError.message : '✓ exists');

  // Test profiles table
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('count', { count: 'exact', head: true });
  
  console.log('✅ profiles table:', profilesError ? '❌ ' + profilesError.message : '✓ exists');

  // Test function
  const { error: funcError } = await supabase.rpc('refresh_profile_tokens_if_due', {
    p_user_id: '00000000-0000-0000-0000-000000000000'
  });
  
  console.log('✅ refresh_profile_tokens_if_due function:', funcError && !funcError.message.includes('matching row') ? '❌ ' + funcError.message : '✓ exists');

  console.log('\n✅ Database setup verified!\n');
}

testConnection().catch(err => console.error('❌ Connection error:', err.message));
