-- ---------- Instagram + Facebook drafts: the agent draws the slides, the owner approves, the publisher posts ----------
alter table public.social_posts drop constraint if exists social_posts_channel_check;
alter table public.social_posts add constraint social_posts_channel_check check (channel in ('reddit', 'linkedin', 'instagram'));
alter table public.social_posts drop constraint if exists social_posts_status_check;
alter table public.social_posts add constraint social_posts_status_check check (status in ('draft', 'approved', 'posted', 'discarded', 'failed'));
alter table public.social_posts add column if not exists images text[];
alter table public.social_posts add column if not exists publish_at timestamptz;
alter table public.social_posts add column if not exists posted_url text;
alter table public.social_posts add column if not exists error text;