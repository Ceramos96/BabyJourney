-- ============================================================
-- Little Sprout — Seed: Baby + Owner profile
-- Run AFTER signing in for the first time.
-- Replace <YOUR_USER_ID> with your actual auth.users UUID
-- (find it in Supabase → Authentication → Users)
-- ============================================================

-- 1. Insert baby record
insert into babies (id, owner_id, first_name, full_name, nickname, date_of_birth, gender)
values (
  gen_random_uuid(),
  '<YOUR_USER_ID>',    -- ← replace this
  'Minh Khang',
  'Trần Minh Khang',
  'Khang',
  '2025-10-26',
  'male'
)
returning id;          -- copy this id for step 2

-- 2. Insert owner profile (use the baby id returned above)
insert into user_profiles (id, baby_id, role, display_name)
values (
  '<YOUR_USER_ID>',    -- ← same user id as above
  '<BABY_ID>',         -- ← id returned from step 1
  'owner',
  'Ba'
);
