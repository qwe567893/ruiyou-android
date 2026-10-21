-- 瑞友 v2 | Supabase SQL Editor：首次执行整个文件
-- Do not enable anonymous read access. Never ship service_role keys with your APK.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 30),
  bio text not null default '' check (char_length(bio) <= 160),
  avatar text not null default '✦',
  created_at timestamptz not null default now()
);
create or replace function public.new_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,display_name)
  values (new.id, left(coalesce(nullif(trim(new.raw_user_meta_data->>'display_name'),''),'瑞友' || left(new.id::text,6)),30))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created_ruiyou on auth.users;
create trigger on_auth_user_created_ruiyou after insert on auth.users for each row execute procedure public.new_profile();
insert into public.profiles(id, display_name)
select u.id,left(coalesce(nullif(trim(u.raw_user_meta_data->>'display_name'),''),'瑞友' || left(u.id::text,6)),30)
from auth.users u on conflict (id) do nothing;

create table if not exists public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at timestamptz not null default now(),
  unique(sender_id,recipient_id), check(sender_id <> recipient_id)
);
create table if not exists public.friendships (
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(user_a,user_b), check(user_a::text < user_b::text)
);
create or replace function public.are_friends(a uuid,b uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.friendships f
    where f.user_a=(case when a::text < b::text then a else b end)
      and f.user_b=(case when a::text < b::text then b else a end));
$$;

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check(char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_pair_index on public.messages(sender_id,recipient_id,created_at);

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  body text not null check(char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now()
);

create table if not exists public.call_sessions (
  id uuid primary key default gen_random_uuid(),
  caller_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  callee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'ringing' check(status in ('ringing','accepted','declined','ended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check(caller_id <> callee_id)
);
create index if not exists call_callee_index on public.call_sessions(callee_id,status,created_at);
create table if not exists public.call_signals (
  id uuid primary key default gen_random_uuid(),
  call_id uuid not null references public.call_sessions(id) on delete cascade,
  sender_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  type text not null check(type in ('offer','answer','candidate')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists call_signals_index on public.call_signals(call_id,created_at);

-- Row-level security. Every data table is private unless policies say otherwise.
alter table public.profiles enable row level security;
alter table public.friend_requests enable row level security;
alter table public.friendships enable row level security;
alter table public.messages enable row level security;
alter table public.posts enable row level security;
alter table public.call_sessions enable row level security;
alter table public.call_signals enable row level security;

create policy "profile search by members" on public.profiles for select to authenticated using (true);
create policy "profile edit self" on public.profiles for update to authenticated using (id=(select auth.uid())) with check (id=(select auth.uid()));
create policy "request read participants" on public.friend_requests for select to authenticated using (sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "request create self" on public.friend_requests for insert to authenticated with check
 (sender_id=(select auth.uid()) and status='pending' and not public.are_friends(sender_id,recipient_id));
create policy "friend read own" on public.friendships for select to authenticated using (user_a=(select auth.uid()) or user_b=(select auth.uid()));
create policy "message read participants" on public.messages for select to authenticated using
 (sender_id=(select auth.uid()) or recipient_id=(select auth.uid()));
create policy "message send to friend" on public.messages for insert to authenticated with check
 (sender_id=(select auth.uid()) and public.are_friends(sender_id,recipient_id));
create policy "post members read" on public.posts for select to authenticated using (true);
create policy "post own create" on public.posts for insert to authenticated with check (author_id=(select auth.uid()));
create policy "post own delete" on public.posts for delete to authenticated using (author_id=(select auth.uid()));
create policy "call read participants" on public.call_sessions for select to authenticated using
 (caller_id=(select auth.uid()) or callee_id=(select auth.uid()));
create policy "caller starts ringing" on public.call_sessions for insert to authenticated with check
 (caller_id=(select auth.uid()) and status='ringing' and public.are_friends(caller_id,callee_id));
create policy "signal read participants" on public.call_signals for select to authenticated using (
  exists(select 1 from public.call_sessions c where c.id=call_id and ((select auth.uid()) in (c.caller_id,c.callee_id)))
);
create policy "signal send participants" on public.call_signals for insert to authenticated with check (
  sender_id=(select auth.uid()) and
  exists(select 1 from public.call_sessions c where c.id=call_id and c.status='accepted' and ((select auth.uid()) in (c.caller_id,c.callee_id)))
);

-- RPCs enforce transitions server-side; clients have no direct update policy on friendship/calls.
create or replace function public.accept_friend_request(request_id uuid) returns public.friend_requests
language plpgsql security definer set search_path = '' as $$
declare r public.friend_requests;
begin
  update public.friend_requests set status='accepted'
    where id=request_id and recipient_id=auth.uid() and status='pending'
    returning * into r;
  if r.id is null then raise exception '好友申请不存在或已处理'; end if;
  insert into public.friendships(user_a,user_b)
  values(case when r.sender_id::text<r.recipient_id::text then r.sender_id else r.recipient_id end,
         case when r.sender_id::text<r.recipient_id::text then r.recipient_id else r.sender_id end)
  on conflict do nothing;
  return r;
end;
$$;
create or replace function public.decline_friend_request(request_id uuid) returns public.friend_requests
language plpgsql security definer set search_path = '' as $$
declare r public.friend_requests;
begin
  update public.friend_requests set status='declined'
    where id=request_id and recipient_id=auth.uid() and status='pending'
    returning * into r;
  if r.id is null then raise exception '申请不存在或已处理'; end if;
  return r;
end;
$$;
create or replace function public.set_call_status(call_id uuid,new_status text) returns public.call_sessions
language plpgsql security definer set search_path = '' as $$
declare c public.call_sessions;
begin
  if new_status not in ('accepted','declined','ended') then raise exception '无效通话状态'; end if;
  update public.call_sessions set status=new_status,updated_at=now()
  where id=call_id and (
    (new_status in ('accepted','declined') and callee_id=auth.uid() and status='ringing' and created_at>now()-interval '90 seconds') or
    (new_status='ended' and auth.uid() in (caller_id,callee_id) and status in ('ringing','accepted'))
  ) returning * into c;
  if c.id is null then raise exception '通话不存在或已结束'; end if;
  return c;
end;
$$;
revoke all on function public.accept_friend_request(uuid) from public;
revoke all on function public.decline_friend_request(uuid) from public;
revoke all on function public.set_call_status(uuid,text) from public;
revoke all on function public.are_friends(uuid,uuid) from public;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.decline_friend_request(uuid) to authenticated;
grant execute on function public.set_call_status(uuid,text) to authenticated;
grant execute on function public.are_friends(uuid,uuid) to authenticated;

-- Enable realtime for messages, friend requests and calls. Other changes are fetched on demand.
do $$
declare t text;
begin
  foreach t in array array['messages','friend_requests','friendships','call_sessions','call_signals','posts'] loop
    if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I',t);
    end if;
  end loop;
end;
$$;
