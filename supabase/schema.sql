-- NBA 政策島：手動套用到 Supabase SQL Editor。此檔案尚未連線執行。
-- 需啟用 Authentication > Anonymous Sign-ins；前端僅使用 publishable / anon key。
-- 使用 Auth + PostgREST RPC 每兩秒同步，無須另外開啟 Realtime publication。
begin;
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.nba_rooms (
  id uuid primary key default gen_random_uuid(),
  court_id text not null check (court_id = any(array['harbor-01','harbor-02','harbor-03','harbor-04','harbor-05','park-01','park-02','park-03','park-04','park-05','roof-01','roof-02','roof-03','roof-04','roof-05'])),
  invite_code text not null unique default encode(extensions.gen_random_bytes(12),'hex'),
  host_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'waiting' check (status in ('waiting','countdown','playing','finished','cancelled')),
  round integer not null default 1 check (round > 0),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '2 hours'
);
create table if not exists public.nba_players (
  room_id uuid not null references public.nba_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  slot smallint not null check (slot in (1,2)),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 24),
  ready boolean not null default false,
  score integer check (score between 0 and 60),
  attempts integer check (attempts between 0 and 60),
  submitted_at timestamptz,
  primary key (room_id,user_id),
  unique (room_id,slot),
  check ((score is null and attempts is null and submitted_at is null) or (score is not null and attempts is not null and submitted_at is not null and score <= attempts))
);
create index if not exists nba_rooms_court_status_idx on public.nba_rooms(court_id,status,expires_at);
create index if not exists nba_players_user_idx on public.nba_players(user_id);

alter table public.nba_rooms enable row level security;
alter table public.nba_players enable row level security;
revoke all on public.nba_rooms, public.nba_players from public, anon, authenticated;
grant select on public.nba_rooms, public.nba_players to authenticated;

create or replace function public.nba_is_member(p_room uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and exists(select 1 from public.nba_players where room_id=p_room and user_id=auth.uid());
$$;
revoke all on function public.nba_is_member(uuid) from public,anon;
grant execute on function public.nba_is_member(uuid) to authenticated;
drop policy if exists nba_rooms_member_read on public.nba_rooms;
create policy nba_rooms_member_read on public.nba_rooms for select to authenticated using (public.nba_is_member(id));
drop policy if exists nba_players_member_read on public.nba_players;
create policy nba_players_member_read on public.nba_players for select to authenticated using (public.nba_is_member(room_id));
-- 不授予任何直接 INSERT/UPDATE/DELETE；所有寫入僅經下列驗證身分的 RPC。

create or replace function public.nba_get_room(p_room uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype; people jsonb;
begin
  select * into r from public.nba_rooms where id=p_room for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER'; end if;
  if r.expires_at<=clock_timestamp() and r.status not in ('finished','cancelled') then
    update public.nba_rooms set status='cancelled' where id=p_room returning * into r;
  elsif r.status in ('countdown','playing') and clock_timestamp()>=r.ends_at+interval '15 seconds' then
    update public.nba_rooms set status='finished' where id=p_room returning * into r;
  elsif r.status='countdown' and clock_timestamp()>=r.starts_at then
    update public.nba_rooms set status='playing' where id=p_room returning * into r;
  end if;
  select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'display_name',display_name,'slot',slot,'ready',ready,'score',score,'attempts',attempts) order by slot),'[]'::jsonb) into people from public.nba_players where room_id=p_room;
  return jsonb_build_object('room',jsonb_build_object('id',r.id,'court_id',r.court_id,'invite_code',r.invite_code,'host_id',r.host_id,'status',r.status,'round',r.round,'starts_at',r.starts_at,'ends_at',r.ends_at,'expires_at',r.expires_at),'players',people,'server_now',clock_timestamp());
end;
$$;

create or replace function public.nba_create_room(p_court text,p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare new_room uuid;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 then raise exception 'INVALID_NAME'; end if;
  -- 同一身分同時開房也會序列化，最多五個活躍房間。
  perform pg_advisory_xact_lock(hashtext(auth.uid()::text)::bigint);
  if (select count(*) from public.nba_rooms where host_id=auth.uid() and status in ('waiting','countdown','playing') and expires_at>clock_timestamp())>=5 then raise exception 'TOO_MANY_ROOMS'; end if;
  insert into public.nba_rooms(court_id,host_id) values(p_court,auth.uid()) returning id into new_room;
  insert into public.nba_players(room_id,user_id,slot,display_name) values(new_room,auth.uid(),1,btrim(p_name));
  return public.nba_get_room(new_room);
end;
$$;

create or replace function public.nba_join_room(p_court text,p_invite text,p_name text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_name is null or char_length(btrim(p_name)) not between 1 and 24 then raise exception 'INVALID_NAME'; end if;
  -- 鎖住同一房間後再檢查人數，兩位訪客同時加入也不能超過兩人。
  select * into r from public.nba_rooms where invite_code=lower(btrim(p_invite)) for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if r.court_id<>p_court then raise exception 'WRONG_COURT'; end if;
  if public.nba_is_member(r.id) then raise exception 'ALREADY_JOINED'; end if;
  if r.expires_at<=clock_timestamp() then raise exception 'ROOM_EXPIRED'; end if;
  if r.status<>'waiting' then raise exception 'ROOM_NOT_WAITING'; end if;
  if (select count(*) from public.nba_players where room_id=r.id)>=2 then raise exception 'ROOM_FULL'; end if;
  insert into public.nba_players(room_id,user_id,slot,display_name) values(r.id,auth.uid(),2,btrim(p_name));
  return public.nba_get_room(r.id);
end;
$$;

create or replace function public.nba_set_ready(p_room uuid,p_ready boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype;
begin
  select * into r from public.nba_rooms where id=p_room for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER'; end if;
  if r.status<>'waiting' then raise exception 'ROOM_NOT_WAITING'; end if;
  if r.expires_at<=clock_timestamp() then raise exception 'ROOM_EXPIRED'; end if;
  update public.nba_players set ready=coalesce(p_ready,false) where room_id=p_room and user_id=auth.uid();
  return public.nba_get_room(p_room);
end;
$$;

create or replace function public.nba_start_match(p_room uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype; start_time timestamptz;
begin
  select * into r from public.nba_rooms where id=p_room for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if auth.uid() is distinct from r.host_id then raise exception 'NOT_HOST'; end if;
  if r.status<>'waiting' then raise exception 'ROOM_NOT_WAITING'; end if;
  if r.expires_at<=clock_timestamp() then raise exception 'ROOM_EXPIRED'; end if;
  if (select count(*) from public.nba_players where room_id=p_room)<>2 or not (select bool_and(ready) from public.nba_players where room_id=p_room) then raise exception 'NOT_READY'; end if;
  start_time:=clock_timestamp()+interval '5 seconds';
  update public.nba_rooms set status='countdown',starts_at=start_time,ends_at=start_time+interval '30 seconds' where id=p_room;
  return public.nba_get_room(p_room);
end;
$$;

create or replace function public.nba_submit_score(p_room uuid,p_round integer,p_score integer,p_attempts integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype; own_score integer;
begin
  select * into r from public.nba_rooms where id=p_room for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER'; end if;
  if r.round is distinct from p_round then raise exception 'ROUND_MISMATCH'; end if;
  select score into own_score from public.nba_players where room_id=p_room and user_id=auth.uid();
  if own_score is not null then raise exception 'SCORE_ALREADY_SUBMITTED'; end if;
  if r.status not in ('playing','countdown') or r.ends_at is null or clock_timestamp()>=r.ends_at+interval '15 seconds' then raise exception 'SCORE_CLOSED'; end if;
  if clock_timestamp()<r.ends_at then raise exception 'TOO_EARLY'; end if;
  if p_score is null or p_attempts is null or p_score<0 or p_attempts<0 or p_score>p_attempts or p_attempts>60 then raise exception 'INVALID_SCORE'; end if;
  -- 呼叫端無法提供 user_id；成績只能寫入 auth.uid() 自己那列，且只接受一次。
  update public.nba_players set score=p_score,attempts=p_attempts,submitted_at=clock_timestamp() where room_id=p_room and user_id=auth.uid();
  if (select count(*) from public.nba_players where room_id=p_room and score is not null)=2 then
    update public.nba_rooms set status='finished' where id=p_room;
  else
    update public.nba_rooms set status='playing' where id=p_room;
  end if;
  return public.nba_get_room(p_room);
end;
$$;

create or replace function public.nba_restart_match(p_room uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype;
begin
  select * into r from public.nba_rooms where id=p_room for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if auth.uid() is distinct from r.host_id then raise exception 'NOT_HOST'; end if;
  if r.status<>'finished' then raise exception 'ROUND_NOT_FINISHED'; end if;
  if (select count(*) from public.nba_players where room_id=p_room)<>2 then raise exception 'NOT_READY'; end if;
  update public.nba_players set ready=false,score=null,attempts=null,submitted_at=null where room_id=p_room;
  update public.nba_rooms set round=round+1,status='waiting',starts_at=null,ends_at=null,expires_at=clock_timestamp()+interval '2 hours' where id=p_room;
  return public.nba_get_room(p_room);
end;
$$;

create or replace function public.nba_leave_room(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare r public.nba_rooms%rowtype;
begin
  select * into r from public.nba_rooms where id=p_room for update;
  if not found then raise exception 'ROOM_NOT_FOUND'; end if;
  if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER'; end if;
  if r.host_id=auth.uid() or r.status<>'waiting' then update public.nba_rooms set status='cancelled' where id=p_room; end if;
  delete from public.nba_players where room_id=p_room and user_id=auth.uid();
end;
$$;

create or replace function public.nba_court_activity()
returns table(court_id text,waiting_count bigint,preparing_count bigint,playing_count bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  return query select r.court_id,
    count(*) filter(where r.status='waiting' and (select count(*) from public.nba_players p where p.room_id=r.id)<2),
    count(*) filter(where r.status='waiting' and (select count(*) from public.nba_players p where p.room_id=r.id)=2),
    count(*) filter(where r.status in ('countdown','playing'))
    from public.nba_rooms r where r.expires_at>clock_timestamp() and (r.status='waiting' or (r.status in ('countdown','playing') and r.ends_at+interval '15 seconds'>clock_timestamp())) group by r.court_id;
end;
$$;

create or replace function public.nba_my_rooms(p_court text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare rooms jsonb;
begin
  if auth.uid() is null then raise exception 'AUTH_REQUIRED'; end if;
  select coalesce(jsonb_agg(to_jsonb(x)),'[]'::jsonb) into rooms from (
    select r.id,r.court_id,r.invite_code,r.round,
      case when r.status in ('countdown','playing') and r.ends_at+interval '15 seconds'<=clock_timestamp() then 'finished' else r.status end as status
    from public.nba_rooms r join public.nba_players p on p.room_id=r.id
    where p.user_id=auth.uid() and r.court_id=p_court and r.expires_at>clock_timestamp() and r.status<>'cancelled'
    order by r.created_at desc limit 10
  ) x;
  return rooms;
end;
$$;

revoke all on function public.nba_get_room(uuid),public.nba_create_room(text,text),public.nba_join_room(text,text,text),public.nba_set_ready(uuid,boolean),public.nba_start_match(uuid),public.nba_submit_score(uuid,integer,integer,integer),public.nba_restart_match(uuid),public.nba_leave_room(uuid),public.nba_court_activity(),public.nba_my_rooms(text) from public,anon;
grant execute on function public.nba_get_room(uuid),public.nba_create_room(text,text),public.nba_join_room(text,text,text),public.nba_set_ready(uuid,boolean),public.nba_start_match(uuid),public.nba_submit_score(uuid,integer,integer,integer),public.nba_restart_match(uuid),public.nba_leave_room(uuid),public.nba_court_activity(),public.nba_my_rooms(text) to authenticated;
commit;
