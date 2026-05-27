# VODA Backend Code Convention

이 문서는 팀 공용 Notion에 그대로 복사해서 사용할 수 있는 기준 문서입니다.

## 1) 공통 원칙

- 언어: TypeScript
- 기본 정책: 읽기 쉬운 코드, 타입 안정성 우선, 자동 생성 파일 직접 수정 금지 (`src/routes.ts`, `build/swagger.json`)
- 변경 단위: 한 PR에는 한 가지 목적(기능/버그/리팩터링)만 담기

## 2) 네이밍 규칙

ESLint 기준(`@typescript-eslint/naming-convention`):

- interface: `PascalCase`
- typeLike(type, class, enum 등): `PascalCase`
- variable: `camelCase`, 상수는 `UPPER_CASE`

권장 규칙:

- 클래스/컨트롤러 파일명: `usersController.ts`처럼 역할이 드러나게 작성
- 함수명: 동사 중심(`getUsers`, `createOrder`)
- boolean 변수: `is`, `has`, `can` 접두어 사용

## 3) 포맷팅 규칙 (Prettier)

- `printWidth`: 100
  - 한 줄 최대 길이를 100자로 맞춥니다.
  - 100자를 넘기면 Prettier가 자동으로 줄바꿈해서 가독성을 유지합니다.

- `tabWidth`: 2
  - 들여쓰기를 공백 2칸 기준으로 맞춥니다.
  - 파일마다 들여쓰기 폭이 달라지는 문제를 줄여 팀 내 일관성을 유지합니다.

- `semi`: true
  - 문장 끝에 세미콜론(`;`)을 항상 붙입니다.
  - 자동 삽입(ASI)으로 인한 잠재적인 해석 차이를 줄여 안정성을 높입니다.

- `singleQuote`: true
  - 문자열은 기본적으로 작은따옴표(`'`)를 사용합니다.
  - 코드 전체의 문자열 표기 스타일을 통일합니다.

- `trailingComma`: all
  - 객체/배열/함수 인자 등의 마지막 항목 뒤에도 후행 쉼표를 붙입니다.
  - 다음 줄에 항목을 추가할 때 변경 diff가 깔끔해지고 리뷰가 쉬워집니다.

- `arrowParens`: always
  - 화살표 함수 매개변수가 1개여도 괄호를 항상 사용합니다.
  - 예: `x => x + 1` 대신 `(x) => x + 1`
  - 타입 추가/리팩터링 시 일관된 문법을 유지하기 쉽습니다.

규칙 위반 확인/수정 명령어:

- 확인(위반 여부 체크): `npx prettier --check .`
- 자동 수정(전체 파일 정렬): `npx prettier --write .`

## 4) ESLint 규칙 핵심

- `eqeqeq`
  - 값 비교할 때는 `==`/`!=`를 쓰지 않고, 항상 `===`/`!==`를 사용합니다.
  - 타입이 다른 값이 의도치 않게 같다고 판단되는 실수를 줄입니다.

- `no-var`
  - `var`는 사용하지 않습니다.
  - 변수 선언은 `const` 또는 `let`만 사용합니다.

- `prefer-const`
  - 한 번 선언한 뒤 값을 바꾸지 않는 변수는 `let` 대신 `const`를 사용합니다.
  - 코드 의도가 분명해지고, 실수로 재할당하는 문제를 막을 수 있습니다.

- `@typescript-eslint/no-unused-vars`
  - 선언만 하고 쓰지 않는 변수/인자는 남기지 않습니다.
  - 다만, 의도적으로 받기만 하는 인자는 이름 앞에 `_`를 붙이면 허용합니다.
  - 예: `_req`, `_next`

- `@typescript-eslint/no-explicit-any`
  - `any` 타입은 가급적 사용하지 않습니다.
  - 가능하면 실제 데이터 구조에 맞는 타입을 명시해서 타입 안정성을 유지합니다.

- `simple-import-sort/imports`, `simple-import-sort/exports`
  - import/export 순서를 자동 규칙에 맞게 정렬합니다.
  - 파일 상단 import 구문이 항상 같은 순서로 유지되어 리뷰와 유지보수가 쉬워집니다.

규칙 위반 확인/수정 명령어:

- 확인(위반 여부 체크): `npx eslint .`
- 자동 수정(가능한 항목 자동 정리): `npx eslint . --fix`

## 5) 프로젝트 구조/레이어 규칙

- 핵심 원칙: 레이어의 나열 순서가 아니라, 도메인 폴더 아래에 역할별 파일을 함께 둔다.
- 도메인 폴더 기본 구성 요소
  - `dto/`
    - `*.req.dto.ts` (요청 DTO)
    - `*.res.dto.ts` (응답 DTO)
  - `*Controller.ts`
  - `*Service.ts`
  - `*Repository.ts`
  - `*Model.ts`

권장 디렉터리 예시:

```text
src/
  users/
    dto/
      create-user.req.dto.ts
      user.res.dto.ts
    usersController.ts
    usersService.ts
    usersRepository.ts
    usersModel.ts
```

현재 프로젝트 공통 파일:

- `src/server.ts`: 서버 부트스트랩(포트 바인딩)
- `src/app.ts`: 미들웨어, swagger, 라우트 등록, 전역 에러 처리
- `src/**/*Controller.ts`: TSOA 컨트롤러
- `src/routes.ts`: TSOA 자동 생성 파일(직접 수정 금지)
- `build/swagger.json`: TSOA 자동 생성 파일(직접 수정 금지)

권장 흐름:

- Controller는 HTTP 입출력/검증 중심
- Service는 유즈케이스/비즈니스 규칙 담당
- Repository는 DB 쿼리/영속성 처리 담당
- Model은 도메인 상태/행위를 표현
- DTO는 외부(API) 계약을 표현
- DB 접근은 Prisma Client 사용

## 6) Model vs DTO 개념 정리

Model과 DTO는 비슷해 보이지만 책임이 다릅니다.

- Model
  - 도메인(업무) 개념을 표현하는 내부 객체
  - 비즈니스 규칙/상태를 담을 수 있음
  - DB 스키마와 1:1로 고정하지 않고, 도메인 관점으로 설계
  - 외부에 그대로 노출하지 않는 것이 원칙

- DTO (Data Transfer Object)
  - 계층 간/네트워크 간 데이터 전달 전용 객체
  - Request DTO: 클라이언트 입력 계약(검증 대상)
  - Response DTO: 클라이언트 출력 계약(노출 필드 제어)
  - 비즈니스 로직을 담지 않고, 구조 전달에 집중

실무 적용 원칙:

- Controller에서는 DTO를 받고/반환한다.
- Service 내부에서는 Model(또는 도메인 객체) 중심으로 처리한다.
- Repository 결과를 그대로 응답으로 내보내지말고, 가공하여 Response DTO로 매핑한다.
- 민감 정보(예: password, internal flags)는 DTO에서 명시적으로 제외한다.

## 7) 실행/빌드/개발 명령어

### 기본

- 의존성 설치: `npm install`
- 개발 서버: `npm run dev`
  - 내부적으로 `predev`가 먼저 실행되어 TSOA 스펙/라우트 생성
- 라우트+스펙 수동 생성: `npm run predev`
- 프로덕션 빌드: `npm run build`
  - `tsoa spec-and-routes && tsc`
- 빌드 결과 실행: `npm run start`

### Prisma

- Prisma Client 생성: `npx prisma generate`
- 마이그레이션 생성/적용(개발): `npx prisma migrate dev --name <migration_name>`
- 배포 환경 마이그레이션 적용: `npx prisma migrate deploy`
- DB 브라우저: `npx prisma studio`

## 8) Swagger / TSOA 운영 규칙

- 컨트롤러 추가/변경 시 반드시 라우트 재생성
  - `npm run predev` 또는 `npm run build`
- API 문서 확인: 서버 실행 후 `/docs`
- `controllerPathGlobs`: `src/**/*Controller.ts` 패턴 준수

## 9) Branch / Issue / PR 운영 규칙

- 작업 시작 전 Issue를 먼저 생성하고, Issue 단위로 브랜치를 생성합니다.
- 브랜치 네이밍 형식: `type/issue번호-간단설명`
  - 예: `feat/123-user-list-api`, `fix/148-token-expire-bug`
- PR 생성 시 본문에 연결 Issue를 명시합니다.
  - 예: `Closes #123`, `Fixes #123`, `Resolves #123`

중요 규칙:

- PR의 머지 대상(base branch)은 `main`이 아니라 `develop`입니다.
- 특별한 긴급 상황(운영 핫픽스) 외에는 `main`으로 직접 PR하지 않습니다.

머지 후 정리:

- PR 머지 완료 후 작업 브랜치는 삭제합니다.
- 원격 브랜치 삭제: `git push origin --delete <branch-name>`
- 로컬 브랜치 삭제: `git branch -d <branch-name>`

