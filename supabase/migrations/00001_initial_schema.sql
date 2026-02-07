-- 도파민의 민족 — 초기 DB 스키마
-- 1도파민 = 1원

-- users: 카카오 로그인 유저 프로필
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  kakao_id text unique,
  nickname text not null,
  avatar_url text,
  created_at timestamptz default now()
);

-- stations: 도파민 스테이션 (그룹)
create table public.stations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  image_url text,
  invite_code text unique default encode(gen_random_bytes(6), 'hex'),
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- station_members: 스테이션 멤버십
create table public.station_members (
  station_id uuid references public.stations(id) on delete cascade,
  user_id uuid references public.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz default now(),
  primary key (station_id, user_id)
);

-- game_types: 게임 종류 정의
create table public.game_types (
  id serial primary key,
  name text not null,
  slug text unique not null,
  description text,
  config jsonb default '{}'
);

-- 기본 게임 타입 삽입
insert into public.game_types (name, slug, description) values
  ('악어이빨', 'crocodile', '차례대로 이빨을 누르고, 당첨 이빨을 누른 사람이 패배'),
  ('랜덤뽑기', 'random-pick', '참여자 중 랜덤으로 1명 패배자 선정');

-- game_sessions: 내기 세션
create table public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references public.stations(id) on delete cascade,
  game_type_id int references public.game_types(id),
  bet_amount int not null check (bet_amount > 0),
  status text not null default 'pending' check (status in ('pending', 'playing', 'completed')),
  created_by uuid references public.users(id),
  created_at timestamptz default now()
);

-- game_participants: 게임 참여자 + 결과
create table public.game_participants (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.game_sessions(id) on delete cascade,
  user_id uuid references public.users(id),
  result text check (result in ('win', 'lose')),
  dopamine_change int default 0,
  created_at timestamptz default now()
);

-- manual_entries: 수동 도파민 입력
create table public.manual_entries (
  id uuid primary key default gen_random_uuid(),
  station_id uuid references public.stations(id) on delete cascade,
  from_user uuid references public.users(id) on delete cascade,
  to_user uuid references public.users(id) on delete cascade,
  amount int not null,
  description text,
  created_at timestamptz default now()
);

-- ============================================================
-- SECURITY DEFINER 헬퍼 함수 (RLS 무한재귀 방지)
-- ============================================================

-- 내가 속한 station_id 목록
CREATE OR REPLACE FUNCTION public.get_my_station_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT station_id FROM station_members WHERE user_id = auth.uid();
$$;

-- 내가 owner인 station_id 목록
CREATE OR REPLACE FUNCTION public.get_my_owned_station_ids()
RETURNS SETOF uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT station_id FROM station_members WHERE user_id = auth.uid() AND role = 'owner';
$$;

-- 초대 코드로 station_id 조회 (비멤버도 가능)
CREATE OR REPLACE FUNCTION public.get_station_id_by_invite_code(code text)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id FROM stations WHERE invite_code = code LIMIT 1;
$$;

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

alter table public.users enable row level security;
alter table public.stations enable row level security;
alter table public.station_members enable row level security;
alter table public.game_types enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_participants enable row level security;
alter table public.manual_entries enable row level security;

-- users: 본인 프로필 읽기/수정
create policy "users_select_own" on public.users
  for select using (auth.uid() = id);
create policy "users_insert_own" on public.users
  for insert with check (auth.uid() = id);
create policy "users_update_own" on public.users
  for update using (auth.uid() = id);

-- users: 같은 스테이션 멤버끼리 프로필 조회
create policy "users_select_station_members" on public.users
  for select using (
    id in (
      select sm.user_id from public.station_members sm
      where sm.station_id in (select public.get_my_station_ids())
    )
  );

-- stations: 멤버만 조회
create policy "stations_select_member" on public.stations
  for select using (id in (select public.get_my_station_ids()));

-- stations: 생성자도 조회 가능 (INSERT RETURNING 지원, OR 평가)
create policy "stations_select_creator" on public.stations
  for select using (auth.uid() = created_by);

-- stations: 인증된 유저 생성 가능
create policy "stations_insert_auth" on public.stations
  for insert with check (auth.uid() = created_by);

-- stations: owner만 수정/삭제
create policy "stations_update_owner" on public.stations
  for update using (id in (select public.get_my_owned_station_ids()));
create policy "stations_delete_owner" on public.stations
  for delete using (id in (select public.get_my_owned_station_ids()));

-- station_members: 헬퍼 함수로 셀프참조 제거
create policy "station_members_select" on public.station_members
  for select using (station_id in (select public.get_my_station_ids()));
create policy "station_members_insert" on public.station_members
  for insert with check (auth.uid() = user_id);
create policy "station_members_delete" on public.station_members
  for delete using (
    user_id = auth.uid()
    or station_id in (select public.get_my_owned_station_ids())
  );

-- game_types: 누구나 읽기 가능
create policy "game_types_select_all" on public.game_types
  for select using (true);

-- game_sessions: 스테이션 멤버만 조회/생성
create policy "game_sessions_select" on public.game_sessions
  for select using (station_id in (select public.get_my_station_ids()));
create policy "game_sessions_insert" on public.game_sessions
  for insert with check (station_id in (select public.get_my_station_ids()));
create policy "game_sessions_update" on public.game_sessions
  for update using (station_id in (select public.get_my_station_ids()));
create policy "game_sessions_delete" on public.game_sessions
  for delete using (created_by = auth.uid());

-- game_participants: 세션의 스테이션 멤버만
create policy "game_participants_select" on public.game_participants
  for select using (
    session_id in (
      select gs.id from public.game_sessions gs
      where gs.station_id in (select public.get_my_station_ids())
    )
  );
create policy "game_participants_insert" on public.game_participants
  for insert with check (
    session_id in (
      select gs.id from public.game_sessions gs
      where gs.station_id in (select public.get_my_station_ids())
    )
  );
create policy "game_participants_update" on public.game_participants
  for update using (
    session_id in (
      select gs.id from public.game_sessions gs
      where gs.station_id in (select public.get_my_station_ids())
    )
  );
create policy "game_participants_delete" on public.game_participants
  for delete using (
    session_id in (
      select id from public.game_sessions where created_by = auth.uid()
    )
  );

-- manual_entries: 스테이션 멤버만
create policy "manual_entries_select" on public.manual_entries
  for select using (station_id in (select public.get_my_station_ids()));
create policy "manual_entries_insert" on public.manual_entries
  for insert with check (
    station_id in (select public.get_my_station_ids())
    and auth.uid() = from_user
  );
create policy "manual_entries_delete" on public.manual_entries
  for delete using (auth.uid() = from_user);

-- ============================================================
-- 인덱스 (RLS 서브쿼리 성능 최적화)
-- ============================================================

create index idx_station_members_user_id on public.station_members(user_id);
create index idx_station_members_station_id on public.station_members(station_id);
create index idx_game_sessions_station_id on public.game_sessions(station_id);
create index idx_game_participants_session_id on public.game_participants(session_id);
create index idx_manual_entries_station_id on public.manual_entries(station_id);
