-- 手動增量：先套用 schema.sql，再套用本檔。尚未在遠端執行。
-- 原房間/匿名身分/兩人上限沿用。前端僅使用公開金鑰。
begin;
alter table public.nba_rooms add column if not exists game_id text not null default 'shoot';
alter table public.nba_rooms add column if not exists game_seed bigint not null default 1;
alter table public.nba_players add column if not exists result jsonb;
alter table public.nba_players drop constraint if exists nba_players_score_check;
alter table public.nba_players drop constraint if exists nba_players_attempts_check;
alter table public.nba_players drop constraint if exists nba_players_check;
alter table public.nba_players drop constraint if exists nba_players_score_v2;
alter table public.nba_players drop constraint if exists nba_players_attempts_v2;
alter table public.nba_players add constraint nba_players_score_v2 check(score between 0 and 5000);
alter table public.nba_players add constraint nba_players_attempts_v2 check(attempts between 0 and 400);

create or replace function public.nba_game_id(p_court text) returns text language sql immutable set search_path='' as $$
select case p_court when 'harbor-01' then 'shoot' when 'harbor-02' then 'five' when 'harbor-03' then 'wind' when 'harbor-04' then 'bank' when 'harbor-05' then 'buzzer'
when 'park-01' then 'dribble' when 'park-02' then 'pass' when 'park-03' then 'rebound' when 'park-04' then 'duel' when 'park-05' then 'memory'
when 'roof-01' then 'relay' when 'roof-02' then 'rhythm' when 'roof-03' then 'defense' when 'roof-04' then 'maze' when 'roof-05' then 'allround' end;
$$;
create or replace function public.nba_game_ms(p_game text) returns integer language sql immutable set search_path='' as $$
select case p_game when 'shoot' then 30000 when 'five' then 60000 when 'wind' then 45000 when 'bank' then 40000 when 'buzzer' then 30000
when 'dribble' then 40000 when 'pass' then 30000 when 'rebound' then 25000 when 'duel' then 70000 when 'memory' then 45000
when 'relay' then 60000 when 'rhythm' then 30000 when 'defense' then 30000 when 'maze' then 60000 when 'allround' then 40000 end;
$$;
-- 已完成/進行中的舊房間保留原投籃規則；等待中與新房間採球場專屬遊戲。
update public.nba_rooms set game_id=public.nba_game_id(court_id) where status='waiting';
update public.nba_players p set result=jsonb_build_object('gameId','shoot','score',p.score,'hits',p.score,'attempts',p.attempts,'progress',0,'completed',false,'elapsedMs',30000,'timeMs',30000,'longest',0,'rounds',0,'steps',0,'pcScore',0,'subscores','[]'::jsonb)
 from public.nba_rooms r where p.room_id=r.id and r.game_id='shoot' and p.result is null and p.score is not null;

create table if not exists public.nba_duel_moves(
 room_id uuid not null references public.nba_rooms(id) on delete cascade,
 round integer not null check(round>0),turn integer not null check(turn between 0 and 9),
 user_id uuid not null references auth.users(id) on delete cascade,
 move integer not null check(move between 0 and 2),created_at timestamptz not null default clock_timestamp(),
 primary key(room_id,round,turn,user_id)
);
alter table public.nba_duel_moves enable row level security;
-- 沒有直接讀取政策/授權。包括房間成員也不能 SELECT 提前看對方招式。
revoke all on public.nba_duel_moves from public,anon,authenticated;

create or replace function public.nba_valid_result(p_game text,v jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare k text;n integer;score integer;hits integer;attempts integer;progress integer;done boolean;elapsed integer;
begin
 if jsonb_typeof(v)<>'object' or v->>'gameId' is distinct from p_game or public.nba_game_ms(p_game) is null then return false;end if;
 foreach k in array array['score','hits','attempts','progress','elapsedMs','timeMs','longest','rounds','steps','pcScore'] loop
  if jsonb_typeof(v->k) is distinct from 'number' then return false;end if;n:=(v->>k)::integer;if n<0 or n>80000 then return false;end if;
 end loop;
 if jsonb_typeof(v->'completed') is distinct from 'boolean' then return false;end if;
 score:=(v->>'score')::integer;hits:=(v->>'hits')::integer;attempts:=(v->>'attempts')::integer;progress:=(v->>'progress')::integer;done:=(v->>'completed')::boolean;elapsed:=(v->>'elapsedMs')::integer;
 if score>5000 or attempts>400 or hits>attempts or progress>10 or elapsed>public.nba_game_ms(p_game) or (v->>'timeMs')::integer>60000 or (v->>'longest')::integer>8 or (v->>'rounds')::integer>6 or (v->>'steps')::integer>36 then return false;end if;
 if p_game='shoot' then return score=hits and hits<=60 and attempts<=60 and elapsed=30000;
 elsif p_game='five' then return progress<=5 and progress=hits and score=hits and done=(progress=5) and (done or elapsed=60000);
 elsif p_game='wind' then return attempts<=8 and score=hits and (attempts=8 or elapsed=45000);
 elsif p_game='bank' then return attempts<=10 and score=hits and (attempts=10 or elapsed=40000);
 elsif p_game='buzzer' then return attempts<=6 and score between hits*2 and hits*3 and elapsed=30000;
 elsif p_game='dribble' then return progress=10 and attempts=10 and elapsed=20000 and (v->>'timeMs')::integer=20000+(10-hits)*2000;
 elsif p_game='pass' then return score=hits and attempts<=15 and elapsed=30000;
 elsif p_game='rebound' then return score=hits and attempts=10 and elapsed=25000;
 elsif p_game='relay' then return progress<=3 and score=progress and hits=progress and done=(progress=3) and (done or elapsed=60000);
 elsif p_game='rhythm' then return hits<=48 and attempts<=48 and score between hits*10 and hits*20 and elapsed=30000;
 elsif p_game='defense' then return score=hits and attempts<=10 and elapsed=30000;
 elsif p_game='memory' then return score=(v->>'longest')::integer and (v->>'rounds')::integer<=6 and score=case when (v->>'rounds')::integer=0 then 0 else (v->>'rounds')::integer+2 end;
 elsif p_game='maze' then return progress<=3 and score=progress and (v->>'steps')::integer between progress*4 and progress*12;
 elsif p_game='allround' then
  if jsonb_typeof(v->'subscores') is distinct from 'array' or jsonb_array_length(v->'subscores')<>3 then return false;end if;
  for k in select jsonb_array_elements_text(v->'subscores') loop if k::integer<0 or k::integer>5 then return false;end if;end loop;
  return attempts<=15 and score=hits and score=(v->'subscores'->>0)::integer+(v->'subscores'->>1)::integer+(v->'subscores'->>2)::integer;
 end if;return false; -- duel 僅由後端從雙方選擇計算，禁止客戶端提交結果。
exception when others then return false;
end;
$$;

create or replace function public.nba_compare_result(p_game text,a jsonb,b jsonb) returns integer language plpgsql immutable set search_path='' as $$
declare av numeric[];bv numeric[];d integer:=0;i integer;
begin
 if p_game='allround' then for i in 0..2 loop d:=d+sign((a->'subscores'->>i)::numeric-(b->'subscores'->>i)::numeric)::integer;end loop;return sign(d)::integer;
 elsif p_game in ('five','relay') then
  av:=array[(a->>'completed')::boolean::integer,case when (a->>'completed')::boolean then -(a->>'elapsedMs')::numeric else (a->>'progress')::numeric end];
  bv:=array[(b->>'completed')::boolean::integer,case when (b->>'completed')::boolean then -(b->>'elapsedMs')::numeric else (b->>'progress')::numeric end];
 elsif p_game='dribble' then av:=array[-(a->>'timeMs')::numeric];bv:=array[-(b->>'timeMs')::numeric];
 elsif p_game='memory' then av:=array[(a->>'longest')::numeric,(a->>'rounds')::numeric];bv:=array[(b->>'longest')::numeric,(b->>'rounds')::numeric];
 elsif p_game='maze' then av:=array[(a->>'progress')::numeric,-(a->>'steps')::numeric];bv:=array[(b->>'progress')::numeric,-(b->>'steps')::numeric];
 else av:=array[(a->>'score')::numeric];bv:=array[(b->>'score')::numeric];end if;
 return case when av=bv then 0 when av>bv then 1 else -1 end;
end;
$$;

create or replace function public.nba_get_room(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nba_rooms%rowtype;people jsonb;history jsonb:='[]';duel jsonb:=null;current_turn integer;idx integer;a integer;b integer;attack_slot integer;
 scores integer[]:=array[0,0];last_time timestamptz;own_submitted boolean;outcome jsonb:=null;ar jsonb;br jsonb;aid uuid;bid uuid;comparison integer;
begin
 select * into r from public.nba_rooms where id=p_room for update;
 if not found then raise exception 'ROOM_NOT_FOUND';end if;
 if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER';end if;
 last_time:=clock_timestamp();
 if r.expires_at<=last_time and r.status not in ('finished','cancelled') then update public.nba_rooms set status='cancelled' where id=p_room returning * into r;
 elsif r.status in ('countdown','playing') and (last_time>=r.ends_at+interval '15 seconds' or (r.game_id='duel' and last_time>=r.ends_at)) then update public.nba_rooms set status='finished' where id=p_room returning * into r;
 elsif r.status='countdown' and last_time>=r.starts_at then update public.nba_rooms set status='playing' where id=p_room returning * into r;end if;
 if r.game_id='duel' and r.starts_at is not null then
  current_turn:=greatest(0,least(9,floor(extract(epoch from (last_time-r.starts_at))*1000/7000)::integer));
  for idx in 0..9 loop
   attack_slot:=case when idx%2=0 then 1 else 2 end;
   select m.move into a from public.nba_duel_moves m join public.nba_players p on p.room_id=m.room_id and p.user_id=m.user_id where m.room_id=p_room and m.round=r.round and m.turn=idx and p.slot=attack_slot;
   select m.move into b from public.nba_duel_moves m join public.nba_players p on p.room_id=m.room_id and p.user_id=m.user_id where m.room_id=p_room and m.round=r.round and m.turn=idx and p.slot<>attack_slot;
   -- 只有雙方都交招或該回合已到期才揭曉；未封存的一方完全不回傳招式。
   if (a is not null and b is not null) or last_time>=r.starts_at+((idx+1)*7)*interval '1 second' then
    history:=history||jsonb_build_array(jsonb_build_object('turn',idx,'attack',a,'defense',b,'attacker_slot',attack_slot,'scored',a is not null and a is distinct from b));
    if a is not null and a is distinct from b then scores[attack_slot]:=scores[attack_slot]+2;end if;
   end if;
  end loop;
  select exists(select 1 from public.nba_duel_moves where room_id=p_room and round=r.round and turn=current_turn and user_id=auth.uid()) into own_submitted;
  duel:=jsonb_build_object('turn',current_turn,'submitted',own_submitted,'history',history,'scores',to_jsonb(scores));
  if r.status='finished' then
   update public.nba_players p set score=scores[p.slot],attempts=10,submitted_at=coalesce(p.submitted_at,last_time),result=jsonb_build_object('gameId','duel','score',scores[p.slot],'hits',scores[p.slot]/2,'attempts',10,'progress',10,'completed',true,'elapsedMs',70000,'timeMs',70000,'longest',0,'rounds',0,'steps',0,'pcScore',0,'subscores','[]'::jsonb) where p.room_id=p_room;
  end if;
 end if;
 select coalesce(jsonb_agg(jsonb_build_object('user_id',user_id,'display_name',display_name,'slot',slot,'ready',ready,'score',score,'attempts',attempts,'result',result) order by slot),'[]') into people from public.nba_players where room_id=p_room;
 if r.status='finished' then
  select user_id,result into aid,ar from public.nba_players where room_id=p_room and slot=1;select user_id,result into bid,br from public.nba_players where room_id=p_room and slot=2;
  if ar is null and br is null then outcome:=jsonb_build_object('type','no-contest','winnerId',null);
  elsif ar is null or br is null then outcome:=jsonb_build_object('type','forfeit','winnerId',case when ar is null then bid else aid end);
  else comparison:=public.nba_compare_result(r.game_id,ar,br);outcome:=jsonb_build_object('type',case when comparison=0 then 'draw' else 'win' end,'winnerId',case when comparison=0 then null when comparison>0 then aid else bid end);end if;
 end if;
 return jsonb_build_object('room',jsonb_build_object('id',r.id,'court_id',r.court_id,'game_id',r.game_id,'game_seed',r.game_seed,'invite_code',r.invite_code,'host_id',r.host_id,'status',r.status,'round',r.round,'starts_at',r.starts_at,'ends_at',r.ends_at,'expires_at',r.expires_at),'players',people,'duel',duel,'outcome',outcome,'server_now',last_time);
end;
$$;

create or replace function public.nba_create_room(p_court text,p_name text) returns jsonb language plpgsql security definer set search_path='' as $$
declare new_room uuid;
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 if p_name is null or char_length(btrim(p_name)) not between 1 and 24 or public.nba_game_id(p_court) is null then raise exception 'INVALID_NAME_OR_COURT';end if;
 perform pg_advisory_xact_lock(hashtext(auth.uid()::text)::bigint);
 if (select count(*) from public.nba_rooms where host_id=auth.uid() and status in ('waiting','countdown','playing') and expires_at>clock_timestamp())>=5 then raise exception 'TOO_MANY_ROOMS';end if;
 insert into public.nba_rooms(court_id,host_id,game_id,game_seed) values(p_court,auth.uid(),public.nba_game_id(p_court),floor(random()*2147483647)::bigint) returning id into new_room;
 insert into public.nba_players(room_id,user_id,slot,display_name) values(new_room,auth.uid(),1,btrim(p_name));return public.nba_get_room(new_room);
end;
$$;
-- nba_join_room / nba_set_ready 沿用 schema.sql 的房間鎖、主鍵及兩人上限檢查。
create or replace function public.nba_games_capabilities() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then raise exception 'AUTH_REQUIRED';end if;
 return jsonb_build_object('version',2,'games',15);
end;
$$;
create or replace function public.nba_start_match(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nba_rooms%rowtype;at_time timestamptz;
begin
 select * into r from public.nba_rooms where id=p_room for update;if not found then raise exception 'ROOM_NOT_FOUND';end if;
 if auth.uid() is distinct from r.host_id then raise exception 'NOT_HOST';end if;
 if r.status<>'waiting' then raise exception 'ROOM_NOT_WAITING';end if;
 if r.expires_at<=clock_timestamp() then raise exception 'ROOM_EXPIRED';end if;
 if (select count(*) from public.nba_players where room_id=p_room)<>2 or not (select bool_and(ready) from public.nba_players where room_id=p_room) then raise exception 'NOT_READY';end if;
 at_time:=clock_timestamp()+interval '5 seconds';
 update public.nba_rooms set status='countdown',starts_at=at_time,ends_at=at_time+public.nba_game_ms(r.game_id)*interval '1 millisecond' where id=p_room;return public.nba_get_room(p_room);
end;
$$;

create or replace function public.nba_submit_result(p_room uuid,p_round integer,p_game text,p_seed bigint,p_result jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nba_rooms%rowtype;prior jsonb;
begin
 select * into r from public.nba_rooms where id=p_room for update;if not found then raise exception 'ROOM_NOT_FOUND';end if;
 if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER';end if;
 if r.round is distinct from p_round then raise exception 'ROUND_MISMATCH';end if;
 if r.game_id is distinct from p_game or r.game_seed is distinct from p_seed then raise exception 'GAME_OR_SEED_MISMATCH';end if;
 if p_game='duel' then raise exception 'SERVER_RESULT_ONLY';end if;
 select result into prior from public.nba_players where room_id=p_room and user_id=auth.uid();if prior is not null then raise exception 'SCORE_ALREADY_SUBMITTED';end if;
 if r.status not in ('playing','countdown') or r.ends_at is null or clock_timestamp()>=r.ends_at+interval '15 seconds' then raise exception 'SCORE_CLOSED';end if;
 if not public.nba_valid_result(p_game,p_result) then raise exception 'INVALID_SCORE';end if;
 if clock_timestamp()<r.starts_at or (p_result->>'elapsedMs')::integer>extract(epoch from (clock_timestamp()-r.starts_at))*1000+250 then raise exception 'TOO_EARLY';end if;
 update public.nba_players set result=p_result,score=(p_result->>'score')::integer,attempts=(p_result->>'attempts')::integer,submitted_at=clock_timestamp() where room_id=p_room and user_id=auth.uid();
 if (select count(*) from public.nba_players where room_id=p_room and result is not null)=2 then update public.nba_rooms set status='finished' where id=p_room;end if;
 return public.nba_get_room(p_room);
end;
$$;
create or replace function public.nba_choose_move(p_room uuid,p_round integer,p_turn integer,p_move integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nba_rooms%rowtype;current_turn integer;
begin
 select * into r from public.nba_rooms where id=p_room for update;if not found then raise exception 'ROOM_NOT_FOUND';end if;
 if not public.nba_is_member(p_room) then raise exception 'NOT_MEMBER';end if;
 if r.round is distinct from p_round then raise exception 'ROUND_MISMATCH';end if;
 if r.game_id<>'duel' then raise exception 'WRONG_GAME';end if;
 if r.status not in ('countdown','playing') or clock_timestamp()<r.starts_at or clock_timestamp()>=r.ends_at then raise exception 'TURN_CLOSED';end if;
 current_turn:=floor(extract(epoch from (clock_timestamp()-r.starts_at))*1000/7000)::integer;
 if p_turn is distinct from current_turn or p_move is null or p_move not between 0 and 2 then raise exception 'TURN_MISMATCH';end if;
 if exists(select 1 from public.nba_duel_moves where room_id=p_room and round=p_round and turn=p_turn and user_id=auth.uid()) then raise exception 'MOVE_ALREADY_SUBMITTED';end if;
 insert into public.nba_duel_moves(room_id,round,turn,user_id,move) values(p_room,p_round,p_turn,auth.uid(),p_move);
 return public.nba_get_room(p_room);
end;
$$;
create or replace function public.nba_restart_match(p_room uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nba_rooms%rowtype;
begin
 select * into r from public.nba_rooms where id=p_room for update;if not found then raise exception 'ROOM_NOT_FOUND';end if;
 if auth.uid() is distinct from r.host_id then raise exception 'NOT_HOST';end if;
 if r.status<>'finished' then raise exception 'ROUND_NOT_FINISHED';end if;
 if (select count(*) from public.nba_players where room_id=p_room)<>2 then raise exception 'NOT_READY';end if;
 update public.nba_players set ready=false,score=null,attempts=null,result=null,submitted_at=null where room_id=p_room;
 update public.nba_rooms set round=round+1,status='waiting',starts_at=null,ends_at=null,game_id=public.nba_game_id(court_id),game_seed=floor(random()*2147483647)::bigint,expires_at=clock_timestamp()+interval '2 hours' where id=p_room;
 return public.nba_get_room(p_room);
end;
$$;
-- 舊投籃 RPC 保留，但不得拿去寫入其他遊戲。
create or replace function public.nba_submit_score(p_room uuid,p_round integer,p_score integer,p_attempts integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare r public.nba_rooms%rowtype;
begin
 select * into r from public.nba_rooms where id=p_room;if r.game_id<>'shoot' then raise exception 'WRONG_GAME';end if;
 return public.nba_submit_result(p_room,p_round,'shoot',r.game_seed,jsonb_build_object('gameId','shoot','score',p_score,'hits',p_score,'attempts',p_attempts,'progress',0,'completed',false,'elapsedMs',30000,'timeMs',30000,'longest',0,'rounds',0,'steps',0,'pcScore',0,'subscores','[]'::jsonb));
end;
$$;
revoke all on function public.nba_game_id(text),public.nba_game_ms(text),public.nba_valid_result(text,jsonb),public.nba_compare_result(text,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.nba_submit_result(uuid,integer,text,bigint,jsonb),public.nba_choose_move(uuid,integer,integer,integer) from public,anon;
revoke all on function public.nba_games_capabilities() from public,anon;
grant execute on function public.nba_games_capabilities() to authenticated;
grant execute on function public.nba_submit_result(uuid,integer,text,bigint,jsonb),public.nba_choose_move(uuid,integer,integer,integer) to authenticated;
-- 既有同簽名 RPC 的 authenticated 權限由 schema.sql 保留；再次明示避免預設 PUBLIC 授權。
revoke all on function public.nba_get_room(uuid),public.nba_create_room(text,text),public.nba_start_match(uuid),public.nba_restart_match(uuid),public.nba_submit_score(uuid,integer,integer,integer) from public,anon;
grant execute on function public.nba_get_room(uuid),public.nba_create_room(text,text),public.nba_start_match(uuid),public.nba_restart_match(uuid),public.nba_submit_score(uuid,integer,integer,integer) to authenticated;
commit;
