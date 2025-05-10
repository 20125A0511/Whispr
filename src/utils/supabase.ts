import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kqjvzhedzdbbmovcocnu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtxanZ6aGVkemRiYm1vdmNvY251Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4OTE3NDQsImV4cCI6MjA2MjQ2Nzc0NH0.iLPg6Y3kKYS4Rmx6yB9Rn_eR8KXxnp_XowQRfjvoDsg'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 