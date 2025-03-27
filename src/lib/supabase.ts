import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Debug Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase environment variables are missing!');
} else {
  console.log('Supabase URL configured:', supabaseUrl.substring(0, 15) + '...');
  console.log('Supabase Anon Key configured:', supabaseAnonKey.substring(0, 5) + '...');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Check connection
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
});

/**
 * IMPORTANT: Supabase Database Access Guidelines
 * 
 * When accessing tables with Row Level Security (RLS) enabled:
 * 
 * 1. AVOID using .single() without first checking if the record exists
 *    - Use .maybeSingle() instead, which returns null instead of throwing an error
 *    - Or use a regular select() and check if data.length > 0
 * 
 * 2. For inserting/updating users table:
 *    - Client-side: Use the API route '/api/simple-set-role' for user role operations
 *    - Server-side: Use createRouteHandlerClient with cookies for auth context
 * 
 * 3. Error handling best practices:
 *    - Always wrap Supabase operations in try/catch blocks
 *    - Include fallback mechanisms (e.g., localStorage for user preferences)
 * 
 * 4. For new users:
 *    - Check if a record exists before attempting update operations
 *    - Use .upsert() or separate insert/update logic as appropriate
 * 
 * 5. Required RLS Policies for "users" table:
 *    - Read policy:   (auth.uid() = id)
 *    - Insert policy: (auth.uid() = id)
 *    - Update policy: (auth.uid() = id)
 * 
 * These policies allow authenticated users to:
 *    - Read only their own record
 *    - Insert only their own record
 *    - Update only their own record
 * 
 * For more information on Supabase RLS, see:
 * https://supabase.io/docs/guides/auth/row-level-security
 */ 