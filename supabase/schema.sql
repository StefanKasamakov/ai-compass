-- AI Compass community: submissions from visitors, reviewed by the owner and volunteer moderators.
-- Visitors (anon) can only INSERT pending submissions and read approved tips.
-- Moderators (rows in public.moderators) can read and review everything.
-- The GitHub Action uses the service-role key to apply approved items and store social drafts.

create extension if not exists pgcrypto with schema extensions;

-- ---------- moderators ----------
create table if not exists public.moderators (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  role text not null default 'moderator' check (role in ('owner', 'moderator')),
  added_at timestamptz not null default now()
);
alter table public.moderators enable row level security;

create or replace function public.is_moderator() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.moderators where user_id = auth.uid());
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.moderators where user_id = auth.uid() and role = 'owner');
$$;

drop policy if exists "moderators can see the team" on public.moderators;
create policy "moderators can see the team" on public.moderators for select using (public.is_moderator());
drop policy if exists "owner manages the team" on public.moderators;
create policy "owner manages the team" on public.moderators for all using (public.is_owner()) with check (public.is_owner());

-- ---------- submissions ----------
create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null check (kind in ('tool', 'fix', 'tip', 'volunteer')),
  target text check (char_length(target) <= 200),            -- tool key / repo the fix or tip is about
  url text check (char_length(url) <= 500),
  title text check (char_length(title) <= 200),
  body text not null check (char_length(body) between 10 and 4000),
  name text check (char_length(name) <= 80),                  -- shown with approved tips
  contact text check (char_length(contact) <= 200),           -- private: never readable by visitors
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'applied')),
  review_note text check (char_length(review_note) <= 1000),
  reviewed_by uuid references auth.users (id),
  reviewed_at timestamptz,
  ip_hash text
);
create index if not exists submissions_status_idx on public.submissions (status, created_at desc);
alter table public.submissions enable row level security;

-- visitors: insert only, and only as a fresh pending item
drop policy if exists "anyone can submit" on public.submissions;
create policy "anyone can submit" on public.submissions for insert to anon, authenticated
  with check (status = 'pending' and reviewed_by is null and reviewed_at is null and review_note is null);
-- visitors: read approved tips (public columns only, see grants below)
drop policy if exists "approved tips are public" on public.submissions;
create policy "approved tips are public" on public.submissions for select to anon, authenticated
  using (kind = 'tip' and status in ('approved', 'applied'));
-- moderators: read and review everything
drop policy if exists "moderators read all" on public.submissions;
create policy "moderators read all" on public.submissions for select to authenticated using (public.is_moderator());
drop policy if exists "moderators review" on public.submissions;
create policy "moderators review" on public.submissions for update to authenticated using (public.is_moderator()) with check (public.is_moderator());

-- column privileges: visitors never see contact details or IP hashes
revoke all on public.submissions from anon;
grant insert (kind, target, url, title, body, name, contact) on public.submissions to anon;
grant select (id, created_at, kind, target, body, name, status) on public.submissions to anon;
grant select, insert, update on public.submissions to authenticated;

-- spam brake: max 5 submissions per IP per hour, and stamp reviews
create or replace function public.submissions_guard() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  ip text := split_part(coalesce(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ''), ',', 1);
begin
  if tg_op = 'INSERT' then
    new.ip_hash := encode(extensions.digest(ip || 'ai-compass', 'sha256'), 'hex');
    if (select count(*) from public.submissions where ip_hash = new.ip_hash and created_at > now() - interval '1 hour') >= 5 then
      raise exception 'Too many submissions from your network. Please try again in an hour.';
    end if;
    new.status := 'pending';
  elsif tg_op = 'UPDATE' and new.status is distinct from old.status and auth.uid() is not null then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists submissions_guard on public.submissions;
create trigger submissions_guard before insert or update on public.submissions
  for each row execute function public.submissions_guard();

-- ---------- volunteers ----------
-- The owner approves a volunteer application, then calls this with the applicant's email.
-- The applicant must have signed in once (magic link) so the auth user exists.
create or replace function public.promote_moderator(target_email text) returns text
language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if not public.is_owner() then raise exception 'Only the owner can add moderators'; end if;
  select id into uid from auth.users where lower(email) = lower(target_email);
  if uid is null then return 'not-signed-in-yet'; end if;
  insert into public.moderators (user_id, email) values (uid, target_email) on conflict (user_id) do nothing;
  return 'ok';
end $$;
revoke all on function public.promote_moderator(text) from public, anon;
grant execute on function public.promote_moderator(text) to authenticated;

-- ---------- social drafts (written by the agent, posted by a human) ----------
create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  channel text not null check (channel in ('reddit', 'linkedin')),
  community text,                      -- e.g. r/ClaudeAI
  title text,
  body text not null,
  link text,
  status text not null default 'draft' check (status in ('draft', 'posted', 'discarded')),
  handled_by uuid references auth.users (id),
  handled_at timestamptz
);
alter table public.social_posts enable row level security;
drop policy if exists "moderators see drafts" on public.social_posts;
create policy "moderators see drafts" on public.social_posts for select to authenticated using (public.is_moderator());
drop policy if exists "moderators handle drafts" on public.social_posts;
create policy "moderators handle drafts" on public.social_posts for update to authenticated using (public.is_moderator()) with check (public.is_moderator());
grant select, update on public.social_posts to authenticated;
