# Signup Flow and Email Verification

This document explains how the signup process and email verification work in the application.

## Signup Process Flow

1. **User initiates signup**: The user fills out the signup form with their email and password.

2. **Form validation**: Client-side validation checks for:
   - Valid email format
   - Password length (at least 6 characters)
   - Password matching confirmation

3. **Signup request**: The application calls `signUp(email, password)` in `AuthContext.tsx`, which:
   - Sends signup request to Supabase Auth
   - Checks the response to determine if email verification is required
   - Creates a minimal user record if email verification is not required

4. **Email verification handling**:
   - If verification is required:
     - Shows the verification screen
     - Stores verification status in localStorage (`verificationSent` and `verificationEmail`)
     - Does NOT set the user in AuthContext (to prevent premature login)
     
   - If verification is not required (or user is already confirmed):
     - Sets the user in AuthContext
     - Redirects to dashboard

## Email Verification Database Trigger

When a user verifies their email by clicking the link in the verification email:

1. Supabase updates the user's `email_confirmed_at` field in the `auth.users` table
2. A database trigger (`on_email_verification`) detects this change
3. The trigger executes the `handle_email_verification()` function, which:
   - Checks if `email_confirmed_at` changed from NULL to a timestamp
   - Creates a new user record in the `public.users` table if one doesn't exist
   - Updates the email if the user record already exists

## Handling Page Refreshes

If the user refreshes the page during the verification process:

1. The signup page checks localStorage for `verificationSent` and `verificationEmail`
2. If found, it restores the verification screen state
3. The user can request a new verification email if needed

## Login Integration

When a user visits the login page:

1. The page clears any verification status from localStorage
2. This prevents the verification screen from appearing if the user abandons signup

## Security Considerations

- User records in `public.users` are only created after email verification or for trusted providers
- The database trigger has SECURITY DEFINER privileges to ensure it can create records
- The middleware prevents access to protected routes without authentication 