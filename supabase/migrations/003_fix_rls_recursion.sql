-- ============================================================
-- Little Sprout — Fix RLS infinite recursion
-- Run this in: Supabase Dashboard → SQL Editor → New query
--
-- Safety: all DROP/CREATE pairs are wrapped in a single transaction
-- so there is never a window where a policy is absent.
-- The "destructive operations" warning from Supabase refers only to
-- the DROP POLICY statements — no table or row data is modified.
-- ============================================================

begin;

-- ── Helper functions (security definer = bypasses RLS) ────────
-- STABLE = PostgreSQL caches the result within a single query.
-- security definer + set search_path = the correct secure pattern
-- to prevent search_path injection and break the RLS recursion.

create or replace function public.my_baby_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select baby_id from user_profiles where id = auth.uid() limit 1
$$;

-- Returns true if the current user can read data for a given baby_id
create or replace function public.can_read_baby(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from babies       where id  = bid and owner_id = auth.uid()
    union all
    select 1 from user_profiles where baby_id = bid and id = auth.uid()
  )
$$;

-- Returns true if the current user can write data for a given baby_id
create or replace function public.can_write_baby(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from babies       where id  = bid and owner_id = auth.uid()
    union all
    select 1 from user_profiles where baby_id = bid and id = auth.uid()
                                   and role in ('owner','family')
  )
$$;

-- ── Drop and recreate babies policies ─────────────────────────
drop policy if exists "owner can manage baby"  on babies;
drop policy if exists "family can view baby"   on babies;

create policy "owner can manage baby"
  on babies for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "family can view baby"
  on babies for select
  using (can_read_baby(id));

-- ── Drop and recreate user_profiles policies ──────────────────
drop policy if exists "users can view profiles for their baby" on user_profiles;
drop policy if exists "owner can manage profiles"              on user_profiles;
drop policy if exists "user can manage own profile"            on user_profiles;

-- Users can always see their own row (no subquery needed)
create policy "user can read own profile"
  on user_profiles for select
  using (id = auth.uid());

-- Users can see all profiles that share the same baby
create policy "family can view profiles"
  on user_profiles for select
  using (can_read_baby(baby_id));

-- Owner can manage any profile for their baby
create policy "owner can manage profiles"
  on user_profiles for all
  using (
    baby_id in (select id from babies where owner_id = auth.uid())
  )
  with check (
    baby_id in (select id from babies where owner_id = auth.uid())
  );

-- Users can update their own profile row
create policy "user can manage own profile"
  on user_profiles for all
  using  (id = auth.uid())
  with check (id = auth.uid());

-- ── Drop and recreate daily_logs policies ─────────────────────
drop policy if exists "family can view logs"      on daily_logs;
drop policy if exists "family can insert logs"    on daily_logs;
drop policy if exists "logger can update own logs" on daily_logs;
drop policy if exists "logger can delete own logs" on daily_logs;

create policy "family can view logs"
  on daily_logs for select
  using (can_read_baby(baby_id));

create policy "family can insert logs"
  on daily_logs for insert
  with check (can_write_baby(baby_id));

create policy "logger can update own logs"
  on daily_logs for update
  using (logged_by = auth.uid());

create policy "logger can delete own logs"
  on daily_logs for delete
  using (logged_by = auth.uid());

-- ── Drop and recreate growth_records policies ─────────────────
drop policy if exists "family can view growth"    on growth_records;
drop policy if exists "family can insert growth"  on growth_records;
drop policy if exists "recorder can update growth" on growth_records;
drop policy if exists "recorder can delete growth" on growth_records;

create policy "family can view growth"
  on growth_records for select
  using (can_read_baby(baby_id));

create policy "family can insert growth"
  on growth_records for insert
  with check (can_write_baby(baby_id));

create policy "recorder can update growth"
  on growth_records for update
  using (recorded_by = auth.uid());

create policy "recorder can delete growth"
  on growth_records for delete
  using (recorded_by = auth.uid());

-- ── Drop and recreate photos policies ─────────────────────────
drop policy if exists "family can view photos"   on photos;
drop policy if exists "family can insert photos" on photos;
drop policy if exists "uploader can update photos" on photos;
drop policy if exists "uploader can delete photos" on photos;

create policy "family can view photos"
  on photos for select
  using (can_read_baby(baby_id));

create policy "family can insert photos"
  on photos for insert
  with check (can_write_baby(baby_id));

create policy "uploader can update photos"
  on photos for update
  using (uploaded_by = auth.uid());

create policy "uploader can delete photos"
  on photos for delete
  using (uploaded_by = auth.uid());

-- ── Drop and recreate milestones policies ─────────────────────
drop policy if exists "family can view milestones"  on milestones;
drop policy if exists "family can insert milestones" on milestones;
drop policy if exists "logger can update milestones" on milestones;

create policy "family can view milestones"
  on milestones for select
  using (can_read_baby(baby_id));

create policy "family can insert milestones"
  on milestones for insert
  with check (can_write_baby(baby_id));

create policy "logger can update milestones"
  on milestones for update
  using (logged_by = auth.uid());

-- ── Drop and recreate notes policies ──────────────────────────
drop policy if exists "family can view notes"   on notes;
drop policy if exists "family can insert notes" on notes;
drop policy if exists "writer can update notes" on notes;
drop policy if exists "writer can delete notes" on notes;

create policy "family can view notes"
  on notes for select
  using (can_read_baby(baby_id));

create policy "family can insert notes"
  on notes for insert
  with check (can_write_baby(baby_id));

create policy "writer can update notes"
  on notes for update
  using (written_by = auth.uid());

create policy "writer can delete notes"
  on notes for delete
  using (written_by = auth.uid());

-- ── Drop and recreate allergens policies ──────────────────────
drop policy if exists "family can view allergens"   on allergens;
drop policy if exists "family can manage allergens" on allergens;

create policy "family can view allergens"
  on allergens for select
  using (can_read_baby(baby_id));

create policy "family can manage allergens"
  on allergens for all
  using (can_write_baby(baby_id))
  with check (can_write_baby(baby_id));

-- ── Drop and recreate foods_tried policies ────────────────────
drop policy if exists "family can view foods"   on foods_tried;
drop policy if exists "family can manage foods" on foods_tried;

create policy "family can view foods"
  on foods_tried for select
  using (can_read_baby(baby_id));

create policy "family can manage foods"
  on foods_tried for all
  using (can_write_baby(baby_id))
  with check (can_write_baby(baby_id));

-- ── Drop and recreate vaccinations policies ───────────────────
drop policy if exists "family can view vaccinations"   on vaccinations;
drop policy if exists "family can manage vaccinations" on vaccinations;

create policy "family can view vaccinations"
  on vaccinations for select
  using (can_read_baby(baby_id));

create policy "family can manage vaccinations"
  on vaccinations for all
  using (can_write_baby(baby_id))
  with check (can_write_baby(baby_id));

commit;
