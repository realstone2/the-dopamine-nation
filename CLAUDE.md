# 도파민의 민족 — 개발 가이드

## 프로젝트 개요

친구들끼리 내기를 하며 도파민(1도파민=1원)을 걸고, 승패 통계를 기록하고, 놀림 카드를 공유하는 소셜 웹앱.

- 기획서: `docs/기획서-v2.md`
- 기술 스택: Next.js 15 (App Router) + Supabase + TanStack Query v5 + shadcn/ui + Tailwind CSS v4

## 아키텍처: FSD (Feature-Sliced Design)

```
src/
├── app/              # Next.js App Router (라우팅, 레이아웃만)
├── pages/            # FSD 페이지 컴포넌트 (페이지별 조합)
├── widgets/          # 독립적인 UI 블록 (대시보드, 게임보드)
├── features/         # 유저 시나리오 단위 기능
├── entities/         # 도메인 모델 (station, user, game, game-result)
└── shared/           # 공용 리소스 (ui, api, lib, config)
```

### FSD 규칙

- **단방향 의존**: `app → pages → widgets → features → entities → shared`
- **역방향 import 금지**: entities에서 features를 import하면 안 됨
- **각 슬라이스 구조**: `ui/`, `model/`, `api/`, `lib/` 세그먼트로 구성
- **Public API**: 각 슬라이스의 진입점은 `index.ts`를 통해 노출

## 컴포넌트 패턴

### 레이아웃 컴포넌트 (shared/ui)

```tsx
<VStack px={16} gap={12}>
  <Typography variants={'h2_bold'}>제목</Typography>
  <Button size={'md'}>버튼</Button>
</VStack>
```

- `VStack`, `HStack`: Flex 레이아웃 래퍼 (px, py, gap 등 spacing props)
- `Typography`: 텍스트 컴포넌트 (variants로 스타일 지정)
- `Button`: shadcn/ui 기반 (size: sm/md/lg)

### 페이지 컴포넌트

- 서버 컴포넌트를 기본으로 사용
- 인터랙션이 필요한 부분만 `'use client'` 분리
- 데이터 fetching은 서버 컴포넌트에서, mutation은 클라이언트에서

## TanStack Query 패턴

### Query Factory (queryOptions 패턴)

```tsx
// entities/station/api/queries.ts
import { queryOptions } from '@tanstack/react-query';

export const stationQueries = {
  all: ['station'] as const,
  detail: (id: string) =>
    queryOptions({
      queryKey: [...stationQueries.all, id],
      queryFn: () => getStation(id),
    }),
};
```

### 사용 규칙

- queryKey는 계층적으로 구성: `['stations', id, 'members']`
- queryFn 안에서 Supabase 클라이언트 직접 호출
- mutation 후 관련 queryKey invalidate

## Supabase 사용 규칙

### 클라이언트 설정

- 서버용: `shared/api/supabase-server.ts` (createServerClient)
- 클라이언트용: `shared/api/supabase-client.ts` (createBrowserClient)
- 환경변수: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### RLS (Row Level Security)

- 모든 테이블에 RLS 활성화 필수
- 스테이션 데이터는 해당 멤버만 접근 가능
- 게임 결과는 참여자만 조회/생성 가능

### 인증

- 카카오 OAuth (Supabase Auth 연동)
- 미들웨어에서 세션 확인 → 미인증 시 로그인 페이지 리다이렉트

## 네이밍 규칙

- **코드**: 영어 (변수, 함수, 컴포넌트, 파일명)
- **주석/문서**: 한국어
- **커밋 메시지**: 한국어 또는 영어 (Conventional Commits)
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
