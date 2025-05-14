import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  // Only initialize Supabase when the function is called (not during build)
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  // Validate environment variables
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    return NextResponse.json(
      { error: 'Server configuration error. Missing required environment variables.' }, 
      { status: 500 }
    );
  }

  // Initialize Supabase client
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let page = 1;
  let perPage = 1000;
  let deletedCount = 0;

  try {
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) {
        console.error('Error listing users:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      if (!data || !data.users.length) break;

      for (const user of data.users) {
        const isVerified = user.user_metadata?.is_verified;
        if (!isVerified) {
          const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
          if (delError) {
            console.error(`Failed to delete user ${user.email}:`, delError);
          } else {
            deletedCount++;
          }
        }
      }
      if (data.users.length < perPage) break;
      page++;
    }
    return NextResponse.json({ message: `Done. Deleted ${deletedCount} unverified users.` });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
} 