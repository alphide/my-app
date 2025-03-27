# Setting Up Row-Level Security (RLS) in Supabase

This guide provides step-by-step instructions for configuring Row-Level Security (RLS) policies in your Supabase instance to ensure proper data access control for your application.

## Schema Updates

First, ensure your database has the latest schema with user profile fields:

```sql
-- Ensure the users table has all required fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- Create a unique constraint on username if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'users_username_key'
  ) THEN
    ALTER TABLE users ADD CONSTRAINT users_username_key UNIQUE (username);
  END IF;
END $$;

-- Create necessary indexes
CREATE INDEX IF NOT EXISTS users_username_idx ON users(username);
```

## Configuring RLS Policies

Run these SQL commands in your Supabase SQL editor to set up the proper RLS policies:

```sql
-- Enable RLS on the tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for the users table
-- Allow users to read their own user record
CREATE POLICY users_select_own ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Allow users to update their own user record
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create policies for the profiles table
-- Allow anyone to read any profile
CREATE POLICY profiles_select_all ON profiles
  FOR SELECT
  USING (true);

-- Allow users to insert their own profile
CREATE POLICY profiles_insert_own ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own profile
CREATE POLICY profiles_delete_own ON profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create policies for the reviews table
-- Allow submitters to read reviews of their profiles
CREATE POLICY reviews_select_own_profile ON reviews
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM profiles WHERE id = profile_id
    )
  );

-- Allow reviewers to read reviews they've written
CREATE POLICY reviews_select_own_reviews ON reviews
  FOR SELECT
  USING (auth.uid() = reviewer_id);

-- Allow reviewers to insert their own reviews
CREATE POLICY reviews_insert_own ON reviews
  FOR INSERT
  WITH CHECK (auth.uid() = reviewer_id);

-- Storage policies for profile images
-- First create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload their own profile images
CREATE POLICY storage_profile_images_insert ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-images' AND
    auth.uid() = SUBSTRING(name FROM '^([^-]+)')::uuid
  );

-- Allow public access to profile images
CREATE POLICY storage_profile_images_select ON storage.objects
  FOR SELECT
  USING (bucket_id = 'profile-images');

-- Allow users to update/delete their own profile images
CREATE POLICY storage_profile_images_update ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid() = SUBSTRING(name FROM '^([^-]+)')::uuid
  );

CREATE POLICY storage_profile_images_delete ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'profile-images' AND
    auth.uid() = SUBSTRING(name FROM '^([^-]+)')::uuid
  );
```

## User Flow with Profile Setup

The application now includes a profile setup flow:

1. When users select a role (submitter or reviewer), they are redirected to the profile setup page
2. Users are required to provide a display name and username
3. Users can optionally upload a profile picture
4. This information is stored in the users table with proper RLS policies

This profile information is used throughout the application to display user information instead of raw IDs or emails.

## Debugging RLS Issues

If you're experiencing RLS policy violations:

1. Check the console for error messages that include "Row Level Security policy"
2. Verify the user is authenticated before accessing protected resources
3. Make sure the user's ID matches the expected value in the RLS policy

For development purposes, you can temporarily disable RLS on a table:

```sql
ALTER TABLE [table_name] DISABLE ROW LEVEL SECURITY;
```

Remember to re-enable it when done testing:

```sql
ALTER TABLE [table_name] ENABLE ROW LEVEL SECURITY;
```

## Fixing Signup Issues

If you encounter errors during signup with messages like "Database error saving new user", you likely need to fix constraints on the users table:

```sql
-- Fix 1: Remove unique constraint on username to allow NULL values during signup
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_username_key;

-- Fix 2: Add a partial unique index that only enforces uniqueness for non-NULL usernames
DROP INDEX IF EXISTS users_username_unique_idx;
CREATE UNIQUE INDEX IF NOT EXISTS users_username_unique_idx ON users(username) 
WHERE username IS NOT NULL;

-- Fix 3: Create an automatic trigger to handle user creation
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at)
  VALUES (new.id, new.email, now())
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that runs when auth.users records are created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

These changes ensure that:
1. New users can sign up without needing to provide a username or display name immediately
2. The unique constraint only applies when usernames are actually set
3. User records are automatically created in the public.users table when auth.users records are created

## Using Server-Side APIs

For operations that require more complex authorization or multiple database interactions, consider using server-side API routes that:

1. Verify the user's identity and permissions
2. Perform the database operations using service role credentials
3. Return only the appropriate data to the client

This approach gives you more control over data access while maintaining security. 