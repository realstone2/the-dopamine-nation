# 도파민의 민족 — 개발 가이드

## 프로젝트 개요

친구들끼리 내기를 하며 도파민(1도파민=1원)을 걸고, 승패 통계를 기록하고, 놀림 카드를 공유하는 소셜 웹앱.

- 기획서: `docs/기획서-v2.md`
- DB 스키마: `supabase/migrations/00001_initial_schema.sql`

## 실행 방법

```bash
# 의존성 설치
npm install

# 환경변수 설정
cp .env.local.example .env.local
# .env.local에 Supabase URL, Anon Key, Site URL 입력

# 개발 서버 실행
npm run dev          # http://localhost:3000

# 프로덕션 빌드
npm run build
npm start
```

### 환경변수

| 변수 | 설명 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 공개 Anon Key |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL (카카오 OAuth 리다이렉트용) |

### Supabase 설정

1. [supabase.com](https://supabase.com)에서 프로젝트 생성
2. `supabase/migrations/00001_initial_schema.sql` 실행 (SQL Editor에서)
3. Authentication → Providers → Kakao 활성화 + REST API Key/Secret 입력
4. 카카오 개발자 콘솔에서 Redirect URI: `{SUPABASE_URL}/auth/v1/callback`

## 배포

**Vercel 배포 (권장)**:
```bash
npm i -g vercel
vercel
```
- Framework: Next.js (자동 감지)
- 환경변수 3개 Vercel 대시보드에 설정
- `NEXT_PUBLIC_SITE_URL`을 실제 배포 도메인으로 변경
- 카카오 개발자 콘솔에서도 배포 도메인 등록

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| Framework | Next.js (App Router) | 16.x |
| Runtime | React | 19.x |
| 스타일링 | Tailwind CSS + shadcn/ui | v4 |
| 상태/데이터 | TanStack Query | v5 |
| Backend | Supabase (Auth + DB + RLS) | - |
| OG 이미지 | @vercel/og (ImageResponse) | - |
| 인증 | Supabase Auth + 카카오 OAuth | - |

## 아키텍처

### FSD (Feature-Sliced Design)

```
┌─────────────────────────────────────────────────┐
│  app/                   Next.js 라우팅 레이어     │
│  ┌───────────────────────────────────────────┐   │
│  │  features/           유저 시나리오 단위     │   │
│  │  ┌───────────────────────────────────┐    │   │
│  │  │  entities/        도메인 모델       │    │   │
│  │  │  ┌───────────────────────────┐    │    │   │
│  │  │  │  shared/       공용 리소스  │    │    │   │
│  │  │  └───────────────────────────┘    │    │   │
│  │  └───────────────────────────────────┘    │   │
│  └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
의존 방향: app → features → entities → shared (단방향)
```

### 유저 플로우

```
카카오 로그인 (/login)
  │
  ▼
스테이션 리스트 (/)
  ├── 스테이션 생성
  ├── 초대 링크 수락 (/invite/[code])
  │
  ▼
스테이션 상세 (/stations/[id])
  ├── 대시보드 (멤버별 승/패/도파민 수지)
  ├── 게임 시작
  │   ├── 악어이빨 (/stations/[id]/game/crocodile)
  │   └── 랜덤뽑기 (/stations/[id]/game/random-pick)
  ├── 수동 도파민 입력
  ├── 놀림 카드 공유 → OG 이미지 (/api/og/card)
  └── 스테이션 삭제/탈퇴
```

### 데이터 흐름

```
[Server Component]          [Client Component]           [Supabase]
     │                            │                          │
     ├── createClient() ──────────┼──────── Auth + RLS ──────┤
     │                            │                          │
     ├── .from('table')           │                          │
     │   .select() ──────────────→├── 렌더링                  │
     │                            │                          │
     │                     [Server Action]                   │
     │                            │                          │
     │                            ├── .insert() ─────────────┤
     │                            ├── .update() ─────────────┤
     │                            └── revalidatePath() ──→ 재검증
```

## 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # 루트 레이아웃 (Geist 폰트, Providers)
│   ├── page.tsx                  # 홈 — 스테이션 리스트 + 생성 폼
│   ├── loading.tsx               # 전역 로딩 UI
│   ├── error.tsx                 # 전역 에러 UI
│   ├── not-found.tsx             # 404 페이지
│   ├── providers.tsx             # QueryClientProvider
│   ├── login/page.tsx            # 카카오 로그인
│   ├── auth/callback/route.ts    # OAuth 콜백 + 유저 upsert
│   ├── invite/[code]/page.tsx    # 초대 링크 수락
│   ├── api/og/card/route.tsx     # OG 이미지 생성 API
│   └── stations/[id]/
│       ├── page.tsx              # 스테이션 상세 (대시보드+게임+수동입력+놀림카드)
│       └── game/
│           ├── crocodile/page.tsx   # 악어이빨 게임
│           └── random-pick/page.tsx # 랜덤뽑기 게임
│
├── features/                     # 유저 시나리오 단위 기능
│   ├── auth/                     # 카카오 로그인/로그아웃
│   │   ├── api/actions.ts        #   signInWithKakao, signOut
│   │   └── ui/kakao-login-button.tsx
│   │
│   ├── station/                  # 스테이션 CRUD + 멤버 관리
│   │   ├── api/actions.ts        #   create, join, delete, leave
│   │   └── ui/                   #   CreateStationForm, StationCard,
│   │                             #   InviteLinkCopy, StationActions
│   │
│   ├── dashboard/                # 멤버별 통계 대시보드
│   │   ├── lib/calculate-stats.ts #  Map 기반 O(n) 통계 집계
│   │   └── ui/                   #   DashboardList, MemberStatsCard
│   │
│   ├── game/                     # 게임 플레이 + 결과 기록
│   │   ├── api/actions.ts        #   completeGame (멤버 검증 포함)
│   │   ├── lib/crocodile.ts      #   순수 게임 로직 (init, pressTooth)
│   │   └── ui/                   #   GameSetupForm, CrocodileBoard,
│   │                             #   RandomPickBoard, *GamePage 래퍼
│   │
│   ├── manual-entry/             # 수동 도파민 입력
│   │   ├── api/actions.ts        #   createManualEntry
│   │   └── ui/manual-entry-form.tsx
│   │
│   └── share-card/               # 놀림 카드 OG 이미지 공유
│       ├── lib/ments.ts          #   도파민 수지별 놀림 멘트
│       └── ui/                   #   ShareCardList, ShareCardButton
│
├── entities/                     # 도메인 모델
│   └── station/api/queries.ts    # queryOptions 팩토리 패턴
│
├── shared/                       # 공용 리소스
│   ├── api/                      # Supabase 클라이언트
│   │   ├── supabase-server.ts    #   서버용 (cookies 기반)
│   │   ├── supabase-client.ts    #   브라우저용
│   │   ├── database.types.ts     #   DB 타입 정의 (참조용)
│   │   └── types.ts              #   CookieToSet 등 공용 타입
│   ├── ui/                       # 공용 컴포넌트
│   │   ├── vstack.tsx, hstack.tsx #  Flex 레이아웃 래퍼
│   │   ├── typography.tsx        #   텍스트 컴포넌트
│   │   ├── button.tsx            #   shadcn/ui Button
│   │   ├── card.tsx              #   shadcn/ui Card
│   │   └── input.tsx             #   shadcn/ui Input
│   ├── lib/utils.ts              # cn(), formatDopamine()
│   └── config/constants.ts       # DOPAMINE_TO_WON, SITE_NAME
│
├── middleware.ts                  # 인증 미들웨어 (미인증→/login 리다이렉트)
│
└── supabase/migrations/          # DB 스키마
    └── 00001_initial_schema.sql  # 7 테이블 + RLS + 인덱스
```

## DB 스키마

```
┌──────────┐     ┌─────────────────┐     ┌────────────┐
│  users   │◄────│ station_members  │────►│  stations   │
│          │     │ (station_id, PK) │     │             │
│ id (PK)  │     │ (user_id, PK)   │     │ id (PK)     │
│ kakao_id │     │ role             │     │ title       │
│ nickname │     └─────────────────┘     │ invite_code │
│ avatar   │                              │ created_by  │
└──────┬───┘                              └──────┬──────┘
       │                                         │
       │     ┌────────────────────┐              │
       ├────►│ game_participants   │              │
       │     │ session_id (FK)    │     ┌────────┴───────┐
       │     │ user_id (FK)       │     │ game_sessions   │
       │     │ result (win/lose)  │────►│ station_id (FK) │
       │     │ dopamine_change    │     │ game_type_id    │
       │     └────────────────────┘     │ bet_amount      │
       │                                │ status          │
       │     ┌────────────────────┐     │ created_by (FK) │
       ├────►│ manual_entries      │     └─────────────────┘
       │     │ station_id (FK)    │
       │     │ from_user (FK)     │     ┌────────────────┐
       │     │ to_user (FK)       │     │ game_types      │
       │     │ amount             │     │ '악어이빨'       │
       │     │ description        │     │ '랜덤뽑기'       │
       │     └────────────────────┘     └────────────────┘
```

모든 테이블에 RLS 활성화. 스테이션 멤버만 해당 스테이션 데이터 접근 가능.

## 라우트 맵

| 경로 | 타입 | 설명 |
|------|------|------|
| `/` | Dynamic | 홈 — 내 스테이션 리스트 |
| `/login` | Static | 카카오 로그인 |
| `/auth/callback` | Route Handler | OAuth 콜백 |
| `/invite/[code]` | Dynamic | 초대 수락 |
| `/stations/[id]` | Dynamic | 스테이션 상세 |
| `/stations/[id]/game/crocodile` | Dynamic | 악어이빨 게임 |
| `/stations/[id]/game/random-pick` | Dynamic | 랜덤뽑기 게임 |
| `/api/og/card?userId&stationId` | Route Handler | OG 이미지 생성 |

## 핵심 패턴

### Server Action 패턴

```tsx
// features/*/api/actions.ts
'use server';
export async function doSomething(params) {
  const supabase = await createClient();         // 서버 클라이언트
  const { data: { user } } = await supabase.auth.getUser();  // 인증 확인
  if (!user) throw new Error('인증이 필요합니다');
  // ... 비즈니스 로직 + DB 조작
  revalidatePath('/affected-path');               // 캐시 무효화
}
```

### TanStack Query 패턴

```tsx
// entities/station/api/queries.ts
export const stationQueries = {
  all: ['station'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...stationQueries.all, id],
      queryFn: () => getStation(id),
    }),
};
```

### Supabase 클라이언트 주의사항

- **Database 제네릭 미사용**: supabase-js v2.95 호환성 이슈로 `createServerClient<Database>()` 대신 `createServerClient()` 사용
- `database.types.ts`는 참조용으로 존재하지만 제네릭 파라미터로는 전달하지 않음
- 타입 단언(`as`)으로 쿼리 결과 타입 지정

### 게임 로직 분리 패턴

```
features/game/lib/crocodile.ts   ← 순수 함수 (테스트 가능)
features/game/ui/crocodile-board.tsx ← 클라이언트 UI (상태 관리)
features/game/api/actions.ts     ← 서버 액션 (DB 기록)
```

## 네이밍 규칙

- **코드**: 영어 (변수, 함수, 컴포넌트, 파일명)
- **주석/문서**: 한국어
- **커밋 메시지**: 한국어 (Conventional Commits)
- **파일명**: kebab-case (`station-dashboard.tsx`)
- **컴포넌트명**: PascalCase (`StationDashboard`)
- **함수/변수명**: camelCase (`getStationMembers`)

## 커밋 컨벤션

논리적인 단위가 끝날 때마다 커밋. Conventional Commits 형식:

```
feat: 스테이션 생성 기능 추가
fix: 대시보드 도파민 수지 계산 오류 수정
docs: 기획서 v2 작성
chore: 프로젝트 초기 세팅
```

## 주요 도메인 용어

| 용어      | 의미                                            |
| --------- | ----------------------------------------------- |
| 도파민    | 내기 단위 (1도파민 = 1원)                       |
| 스테이션  | 내기를 함께하는 그룹                            |
| 멤버      | 스테이션 참여자                                 |
| 세션      | 1회 내기 게임                                   |
| 놀림 카드 | 유저 통계 + 놀림 멘트가 포함된 공유용 OG 이미지 |

## FSD 규칙

- **단방향 의존**: `app → features → entities → shared`
- **역방향 import 금지**: entities에서 features를 import하면 안 됨
- **feature 간 import 금지**: features/dashboard에서 features/game을 import하면 안 됨
- **각 슬라이스 구조**: `ui/`, `api/`, `lib/` 세그먼트로 구성
- **Public API**: 각 슬라이스의 진입점은 `index.ts`를 통해 노출
- **조합은 app 레이어에서**: feature 간 조합이 필요하면 app/page에서 수행
