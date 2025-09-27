-- Update the existing user profile with display_name from email
UPDATE public.profiles 
SET display_name = split_part(
  (SELECT email FROM auth.users WHERE id = profiles.user_id), 
  '@', 
  1
) 
WHERE display_name IS NULL AND user_id IN (SELECT id FROM auth.users);