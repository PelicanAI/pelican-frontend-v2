# Disable Email Confirmation in Supabase (For Testing)

If you keep getting 401 errors after signing up, email confirmation might be required.

## Quick Fix:

1. Go to: https://supabase.com/dashboard/project/ewcqmsfaostcwmgybbub/auth/providers
2. Scroll to **"Email"** provider
3. Toggle **"Confirm email"** to **OFF**
4. Click Save

Now try signing up again - it should work immediately!

## Alternative: Confirm Users Manually

1. Go to: https://supabase.com/dashboard/project/ewcqmsfaostcwmgybbub/auth/users
2. Find your user in the list
3. Click the user
4. Click "Confirm Email" button

Then try logging in again.

