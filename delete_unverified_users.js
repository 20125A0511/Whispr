const { createClient } = require('@supabase/supabase-js');

// Replace with your Supabase project URL and service role key
const SUPABASE_URL = 'https://kqjvzhedzdbbmovcocnu.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxanZ6aGVkemRiYm1vdmNvY251Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0Njg5MTc0NCwiZXhwIjoyMDYyNDY3NzQ0fQ.NL8EadiykdqmlQU-mPgAW9SV-qeRZ39pgtqkpQApP-w';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function deleteUnverifiedUsers() {
  let page = 1;
  let perPage = 1000;
  let deletedCount = 0;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error('Error listing users:', error);
      break;
    }
    if (!data || !data.users.length) break;

    for (const user of data.users) {
      const isVerified = user.user_metadata?.is_verified;
      if (!isVerified) {
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
          console.error(`Failed to delete user ${user.email}:`, delError);
        } else {
          console.log(`Deleted unverified user: ${user.email} (${user.id})`);
          deletedCount++;
        }
      }
    }
    if (data.users.length < perPage) break;
    page++;
  }
  console.log(`Done. Deleted ${deletedCount} unverified users.`);
}

deleteUnverifiedUsers(); 