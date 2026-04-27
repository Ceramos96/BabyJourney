-- ============================================================
-- Little Sprout — Initial Schema
-- Run this in: Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- ── babies ────────────────────────────────────────────────────
create table if not exists babies (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid references auth.users on delete cascade,
  first_name      text not null,
  full_name       text,
  nickname        text,
  date_of_birth   date not null,
  gender          text check (gender in ('male','female','other')),
  blood_type      text,
  avatar_url      text,
  created_at      timestamptz default now()
);

alter table babies enable row level security;

-- ── user_profiles ─────────────────────────────────────────────
-- Created before babies RLS policies because those policies cross-reference this table.
create table if not exists user_profiles (
  id             uuid primary key references auth.users on delete cascade,
  baby_id        uuid references babies on delete cascade,
  role           text not null check (role in ('owner','family','viewer')),
  display_name   text,
  avatar_url     text,
  last_active_at timestamptz
);

alter table user_profiles enable row level security;

-- ── babies RLS (after user_profiles exists) ───────────────────
create policy "owner can manage baby"
  on babies for all
  using  (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

create policy "family can view baby"
  on babies for select
  using (
    exists (
      select 1 from user_profiles
      where user_profiles.baby_id = babies.id
        and user_profiles.id = auth.uid()
        and user_profiles.role in ('family','viewer')
    )
  );

-- ── user_profiles RLS ─────────────────────────────────────────
create policy "users can view profiles for their baby"
  on user_profiles for select
  using (
    baby_id in (
      select baby_id from user_profiles where id = auth.uid()
      union
      select id from babies where owner_id = auth.uid()
    )
  );

create policy "owner can manage profiles"
  on user_profiles for all
  using (
    baby_id in (select id from babies where owner_id = auth.uid())
  )
  with check (
    baby_id in (select id from babies where owner_id = auth.uid())
  );

create policy "user can manage own profile"
  on user_profiles for all
  using  (id = auth.uid())
  with check (id = auth.uid());

-- ── daily_logs ────────────────────────────────────────────────
create table if not exists daily_logs (
  id         uuid primary key default gen_random_uuid(),
  baby_id    uuid references babies on delete cascade,
  logged_by  uuid references auth.users,
  type       text not null check (type in ('feed','nap','diaper','note')),
  logged_at  timestamptz not null,
  data       jsonb,
  created_at timestamptz default now()
);

alter table daily_logs enable row level security;

create policy "family can view logs"
  on daily_logs for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can insert logs"
  on daily_logs for insert
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

create policy "logger can update own logs"
  on daily_logs for update
  using (logged_by = auth.uid());

create policy "logger can delete own logs"
  on daily_logs for delete
  using (logged_by = auth.uid());

create index if not exists daily_logs_baby_logged_at
  on daily_logs (baby_id, logged_at desc);

-- ── growth_records ────────────────────────────────────────────
create table if not exists growth_records (
  id           uuid primary key default gen_random_uuid(),
  baby_id      uuid references babies on delete cascade,
  recorded_by  uuid references auth.users,
  recorded_at  date not null,
  weight_kg    numeric(5,3),
  height_cm    numeric(5,1),
  head_cm      numeric(5,1),
  notes        text,
  created_at   timestamptz default now()
);

alter table growth_records enable row level security;

create policy "family can view growth"
  on growth_records for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can insert growth"
  on growth_records for insert
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

create policy "recorder can update growth"
  on growth_records for update
  using (recorded_by = auth.uid());

create policy "recorder can delete growth"
  on growth_records for delete
  using (recorded_by = auth.uid());

-- ── photos ────────────────────────────────────────────────────
create table if not exists photos (
  id           uuid primary key default gen_random_uuid(),
  baby_id      uuid references babies on delete cascade,
  uploaded_by  uuid references auth.users,
  storage_path text,
  drive_url    text,
  caption      text,
  tags         text[],
  taken_at     timestamptz,
  created_at   timestamptz default now()
);

alter table photos enable row level security;

create policy "family can view photos"
  on photos for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can insert photos"
  on photos for insert
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

create policy "uploader can update photos"
  on photos for update
  using (uploaded_by = auth.uid());

create policy "uploader can delete photos"
  on photos for delete
  using (uploaded_by = auth.uid());

create index if not exists photos_baby_taken_at
  on photos (baby_id, taken_at desc);

-- ── milestones ────────────────────────────────────────────────
create table if not exists milestones (
  id           uuid primary key default gen_random_uuid(),
  baby_id      uuid references babies on delete cascade,
  logged_by    uuid references auth.users,
  type         text not null,
  achieved_at  date,
  note         text,
  photo_id     uuid references photos on delete set null,
  created_at   timestamptz default now(),
  unique (baby_id, type)
);

alter table milestones enable row level security;

create policy "family can view milestones"
  on milestones for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can insert milestones"
  on milestones for insert
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

create policy "logger can update milestones"
  on milestones for update
  using (logged_by = auth.uid());

-- ── notes ─────────────────────────────────────────────────────
create table if not exists notes (
  id         uuid primary key default gen_random_uuid(),
  baby_id    uuid references babies on delete cascade,
  written_by uuid references auth.users,
  body       text not null,
  tags       text[],
  created_at timestamptz default now()
);

alter table notes enable row level security;

create policy "family can view notes"
  on notes for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can insert notes"
  on notes for insert
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

create policy "writer can update notes"
  on notes for update
  using (written_by = auth.uid());

create policy "writer can delete notes"
  on notes for delete
  using (written_by = auth.uid());

-- ── allergens ─────────────────────────────────────────────────
create table if not exists allergens (
  id                 uuid primary key default gen_random_uuid(),
  baby_id            uuid references babies on delete cascade,
  name               text not null,
  severity           text check (severity in ('mild','moderate','severe')),
  first_reaction_at  date,
  notes              text,
  created_at         timestamptz default now()
);

alter table allergens enable row level security;

create policy "family can view allergens"
  on allergens for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can manage allergens"
  on allergens for all
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  )
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

-- ── foods_tried ───────────────────────────────────────────────
create table if not exists foods_tried (
  id             uuid primary key default gen_random_uuid(),
  baby_id        uuid references babies on delete cascade,
  name           text not null,
  first_tried_at date,
  reaction       text,
  created_at     timestamptz default now()
);

alter table foods_tried enable row level security;

create policy "family can view foods"
  on foods_tried for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can manage foods"
  on foods_tried for all
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  )
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

-- ── vaccinations ──────────────────────────────────────────────
create table if not exists vaccinations (
  id         uuid primary key default gen_random_uuid(),
  baby_id    uuid references babies on delete cascade,
  name       text not null,
  due_at     date,
  done_at    date,
  notes      text,
  created_at timestamptz default now()
);

alter table vaccinations enable row level security;

create policy "family can view vaccinations"
  on vaccinations for select
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles where id = auth.uid()
    )
  );

create policy "family can manage vaccinations"
  on vaccinations for all
  using (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  )
  with check (
    baby_id in (
      select id from babies where owner_id = auth.uid()
      union
      select baby_id from user_profiles
      where id = auth.uid() and role in ('owner','family')
    )
  );

-- ── Supabase Storage bucket ───────────────────────────────────
insert into storage.buckets (id, name, public)
values ('baby-media', 'baby-media', false)
on conflict (id) do nothing;

create policy "family can read media"
  on storage.objects for select
  using (
    bucket_id = 'baby-media'
    and auth.uid() is not null
  );

create policy "family can upload media"
  on storage.objects for insert
  with check (
    bucket_id = 'baby-media'
    and auth.uid() is not null
  );

create policy "uploader can delete media"
  on storage.objects for delete
  using (
    bucket_id = 'baby-media'
    and owner = auth.uid()
  );
