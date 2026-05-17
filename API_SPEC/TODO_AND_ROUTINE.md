# 할 일(Todo) 및 루틴(Routine) API 명세

## 개요
- 목적: 반복이 없는 항목은 `todo` 엔드포인트로, 반복 항목은 `routine` 엔드포인트로 관리합니다.
- 공통 규칙:
  - 인증: 모든 엔드포인트는 인증 필요 (`Authorization: Bearer <accessToken>`)
  - 날짜/시간: ISO 8601 형식 사용 (예: `2026-04-18T12:00:00.000Z`)
  - 에러 응답: 프로젝트의 `ErrorCode` 패턴을 따릅니다. 에러는 `{ code, status, message, details? }` 형태 권장.

---

## 인증
- 헤더: `Authorization: Bearer <accessToken>`
- 오류:
  - 토큰 없음: `AUTH007` (401) — 액세스 토큰이 없습니다.
  - 토큰 유효하지 않음: `AUTH008` (401) — 액세스 토큰이 유효하지 않습니다.

---

# `todo` 엔드포인트 (할 일)

기본 DTO(프로젝트 기준)
- CreateTodoRequestDto: `{ content: string, dueTo?: string }`
- CreateTodoResponseDto / TodoItemDto: `{ todoId, content, dueTo?, status, completedAt?, createdAt }`
- GetTodoListResponseDto: `{ filter, limit, count, nextCursor?, todos: TodoItemDto[] }`

## 1) 할 일 생성
- Method: `POST`
- Path: `/api/todos`
- 권한: 인증 필요
- Request body (application/json):
  - `content` (string, required)
  - `dueTo` (string, optional, ISO 8601)
- Response 201: CreateTodoResponseDto
- 오류 매핑:
  - `INVALID011` (400) — 할 일 내용은 공백일 수 없습니다.
  - `INVALID012` (400) — 마감 기한 형식이 올바르지 않습니다.
  - 인증 오류: `AUTH007`/`AUTH008`

## 2) 할 일 목록 조회
- Method: `GET`
- Path: `/api/todos`
- Query params:
  - `filter` (string, optional): `all|pending|completed|overdue|today` (기본: `all`)
  - `cursor` (string, optional)
  - `limit` (number, optional)
- Response 200: GetTodoListResponseDto
- 오류:
  - `INVALID013` (400) — 할 일 조회 상태 필터 값이 올바르지 않습니다.
  - `INVALID014` (400) — 할 일 조회 페이지 크기(limit) 값이 올바르지 않습니다.
  - 인증 오류: `AUTH007`/`AUTH008`

## 3) 단일 할 일 조회
- Method: `GET`
- Path: `/api/todos/{todoId}`
- Response 200: TodoItemDto
- 오류:
  - `TODO001` (404) — 조회할 할 일을 찾을 수 없거나 접근 권한이 없습니다.
  - `INVALID007` (400) — UUID 형식이 올바르지 않습니다. (id 검증 시)
  - 인증 오류: `AUTH007`/`AUTH008`

## 4) 할 일 수정
- Method: `PATCH`
- Path: `/api/todos/{todoId}`
- Request body (부분 업데이트 허용): `{ content?, dueTo? }` (dueTo에 `null` 전달 시 마감 해제)
- Response 200: TodoItemDto
- 오류:
  - `INVALID009` (400) — 수정할 필드가 없습니다.
  - `INVALID011` (400) — 내용 공백
  - `INVALID012` (400) — 마감 기한 형식 오류
  - `TODO001` (404) — 존재하지 않거나 권한 없음
  - 인증 오류: `AUTH007`/`AUTH008`

## 5) 할 일 삭제
- Method: `DELETE`
- Path: `/api/todos/{todoId}`
- Response 204
- 오류:
  - `TODO001` (404)
  - 인증 오류: `AUTH007`/`AUTH008`

## 6) 완료 토글 / 완료 처리
- 권장: POST `/api/todos/{todoId}/toggle-complete` 또는 PATCH `/api/todos/{todoId}/complete` (body: `{ completed: boolean }`)
- Response 200: 업데이트된 TodoItemDto
- 오류:
  - `TODO001` (404)
  - (선택) `TODO002` (409) — 이미 완료된 할 일입니다. (프로젝트에 없을 경우 신규 제안)
  - 인증 오류: `AUTH007`/`AUTH008`

### 예시 (생성)
Request:
```
POST /api/todos
{
  "content": "알레르기 약 먹기",
  "dueTo": "2026-05-16T09:00:00.000Z"
}
```
Response 201:
```
{
  "todoId":"uuid-...",
  "content":"알레르기 약 먹기",
  "dueTo":"2026-05-16T09:00:00.000Z",
  "status":false,
  "completedAt":null,
  "createdAt":"2026-05-15T03:00:00.000Z"
}
```

---

# `routine` 엔드포인트 (반복 작업)

기본 DTO(프로젝트 기준)
- CreateRoutineRequestDto: `{ content: string, type: string, daysOfWeek?: number[], dayOfMonth?: number }`
- CreateRoutineResponseDto: `{ routineId, content, type, daysOfWeek, dayOfMonth?, createdAt }`
- RoutineListItemDto: `{ routineId, content, type, daysOfWeek, dayOfMonth?, scheduledFor?, completedAt? }`
- ToggleRoutineStatusResponseDto: `{ routineId, completed, completedAt? }`

## 1) 루틴 생성
- Method: `POST`
- Path: `/api/routines`
- Request body:
  - `content` (string, required)
  - `type` (string, required) — `DAILY` | `WEEKLY` | `MONTHLY`
  - `daysOfWeek` (number[] optional) — WEEKLY에서 값 사용, 1(월)~7(일)
  - `dayOfMonth` (number optional) — MONTHLY에서 값 사용, 1~31
- Response 201: CreateRoutineResponseDto
- 오류:
  - `INVALID015` (400) — 루틴 내용은 공백일 수 없습니다.
  - `INVALID016` (400) — 루틴 타입은 DAILY, WEEKLY, MONTHLY 중 하나여야 합니다.
  - `INVALID017` (400) — 주간 루틴 요일은 1(월)부터 7(일) 사이의 정수여야 합니다.
  - `INVALID019` (400) — 월간 루틴 날짜(dayOfMonth)는 1부터 31 사이의 정수여야 합니다.
  - `INVALID020` (400) — 루틴 타입별 입력 조합이 올바르지 않습니다.
  - 인증 오류: `AUTH007`/`AUTH008`

## 2) 루틴 목록 조회 (탭별)
- Method: `GET`
- Path: `/api/routines`
- Query params:
  - `tab` (string) — 예: `all|today|pending|completed`
- Response 200: GetRoutineListResponseDto `{ tab, count, routines }`
- 오류:
  - `INVALID021` (400) — 루틴 조회 탭(tab) 값이 올바르지 않습니다.
  - 인증 오류: `AUTH007`/`AUTH008`

## 3) 단일 루틴 조회
- Method: `GET`
- Path: `/api/routines/{routineId}`
- Response 200: RoutineListItemDto
- 오류:
  - `ROUTINE001` (404) — 조회할 루틴을 찾을 수 없거나 접근 권한이 없습니다.
  - 인증 오류: `AUTH007`/`AUTH008`

## 4) 루틴 수정
- Method: `PATCH`
- Path: `/api/routines/{routineId}`
- Request body (부분 업데이트 허용): `{ content?, type?, daysOfWeek?, dayOfMonth? }`
- Response 200: 업데이트된 CreateRoutineResponseDto
- 오류: 생성 시의 유효성 검사 에러(`INVALID015`, `INVALID016`, `INVALID017`, `INVALID019`, `INVALID020`)
- 존재하지 않거나 권한 없음: `ROUTINE001` (404)

## 5) 루틴 삭제
- Method: `DELETE`
- Path: `/api/routines/{routineId}`
- Response 204
- 오류: `ROUTINE001` (404)

## 6) 오늘의 루틴 상태 토글(완료/미완료)
- Method: `POST`
- Path: `/api/routines/{routineId}/toggle` 또는 `/complete`
- 동작: 오늘 해당 루틴 인스턴스의 완료 상태를 토글
- Response 200: ToggleRoutineStatusResponseDto
- 오류:
  - `INVALID022` (400) — 오늘은 이 루틴의 상태를 변경할 수 없습니다.
  - `ROUTINE001` (404)
  - 인증 오류: `AUTH007`/`AUTH008`

## 7) (선택) 일시정지/재개
- Method: `POST` `/api/routines/{routineId}/pause` 또는 `/resume`
- Response 200: 현재 상태
- 오류: `ROUTINE001` (404), 인증 오류

### 예시 (루틴 생성)
Request:
```
POST /api/routines
{
  "content": "부모님께 안부 인사 드리기",
  "type": "WEEKLY",
  "daysOfWeek": [7]
}
```
Response 201:
```
{
  "routineId":"uuid-...",
  "content":"부모님께 안부 인사 드리기",
  "type":"WEEKLY",
  "daysOfWeek":[7],
  "createdAt":"2026-05-15T03:00:00.000Z"
}
```

---

# 공통 에러 코드 요약
- 인증
  - `AUTH007` (401): 액세스 토큰이 없습니다.
  - `AUTH008` (401): 액세스 토큰이 유효하지 않습니다.
- 유효성
  - `INVALID011` (400): 할 일 내용은 공백일 수 없습니다.
  - `INVALID012` (400): 마감 기한 형식이 올바르지 않습니다.
  - `INVALID013` (400): 할 일 조회 상태 필터 값이 올바르지 않습니다.
  - `INVALID014` (400): 할 일 조회 페이지 크기(limit) 값이 올바르지 않습니다.
  - `INVALID015` (400): 루틴 내용은 공백일 수 없습니다.
  - `INVALID016` (400): 루틴 타입은 DAILY, WEEKLY, MONTHLY 중 하나여야 합니다.
  - `INVALID017` (400): 주간 루틴 요일은 1(월)부터 7(일) 사이의 정수여야 합니다.
  - `INVALID019` (400): 월간 루틴 날짜(dayOfMonth)는 1부터 31 사이의 정수여야 합니다.
  - `INVALID020` (400): 루틴 타입별 입력 조합이 올바르지 않습니다.
  - `INVALID021` (400): 루틴 조회 탭(tab) 값이 올바르지 않습니다.
  - `INVALID022` (400): 오늘은 이 루틴의 상태를 변경할 수 없습니다.
- 리소스 없음 / 권한 오류
  - `TODO001` (404): 조회할 할 일을 찾을 수 없거나 접근 권한이 없습니다.
  - `ROUTINE001` (404): 조회할 루틴을 찾을 수 없거나 접근 권한이 없습니다.
- 제안(신규)
  - `TODO002` (409): 이미 완료된 할 일입니다. (중복 완료 시)
  - `ROUTINE002` (409): 루틴 상태 변경 충돌(동시성)

---

# 에러 응답 형식 권장
- HTTP 상태 코드에 맞춰 다음 구조 반환:
```
{
  "code": "INVALID011",
  "status": 400,
  "message": "할 일 내용은 공백일 수 없습니다.",
  "details": { "field": "content" }
}
```

---

# 다음 단계 제안
- `API_SPEC/TODO_AND_ROUTINE.md`를 프로젝트 문서 저장소에 추가했습니다. (원하면 커밋도 진행)
- Swagger 예시 자동 생성 또는 상세 요청/응답 스니펫 추가를 원하면 진행하겠습니다.


---

(이 문서는 `src/routes/todo/dto` 및 `src/routes/routine/dto`의 DTO와 `src/errors/ErrorCodes.ts`의 에러 코드 패턴을 반영하여 작성되었습니다.)

---

## 루틴 실행 흐름(라이프사이클)
이 섹션은 루틴이 어떻게 스케줄링되고, "오늘의 루틴" 인스턴스가 생성되며, 사용자가 완료 처리했을 때 어떤 기록이 남고 다음 발생에 어떻게 반영되는지에 대해 설명합니다.

1) 스케줄링 및 인스턴스 생성
 - 저장 시점: 사용자가 `POST /api/routines`로 루틴을 생성하면 루틴 정책(타입, daysOfWeek, dayOfMonth 등)이 저장됩니다.
 - 인스턴스 생성 방식(설계 대안):
   - 실시간 계산 방식(권장): "오늘" 탭이나 특정 날짜 조회 시점에 해당 루틴이 그 날짜에 해당하는지 계산하여 응답에 포함. DB에 매일 인스턴스를 생성하지 않음.
   - 선생성 방식: Scheduler(예: cron, background job)가 매일 또는 미리 기간 단위로 해당 날짜의 루틴 인스턴스를 DB에 `routine_instance` 형태로 생성. 이 방식은 완료 히스토리 연결과 통계에 유리.
 - 프로젝트 선택: 현재 DTO(`RoutineListItemDto`)는 `scheduledFor?: Date` 필드를 지원하므로, 선생성 방식(또는 제공되는 날짜를 계산해 응답에 포함) 둘 다 가능.

2) 오늘의 루틴 표시
 - 클라이언트는 `GET /api/routines?tab=today`로 오늘 해당되는 루틴 목록을 요청합니다.
 - 실시간 계산 방식: 서비스 계층에서 각 루틴의 스케줄 규칙에 따라 `scheduledFor`를 오늘 날짜로 채움.
 - 선생성 방식: 이미 생성된 `routine_instance` 레코드를 조회해 `scheduledFor`와 `completedAt` 값을 사용해 반환.

3) 루틴 완료 처리 및 기록
 - 완료 API: `POST /api/routines/{routineId}/toggle` 또는 `/complete`는 "오늘"에 해당하는 인스턴스의 완료 상태를 변경.
 - 처리 흐름(선생성 방식 기준):
   1. 클라이언트가 완료 요청을 보냄.
   2. 서버는 오늘 날짜의 `routine_instance`가 존재하는지 확인(없으면 생성하거나 `INVALID022` 반환 선택).
   3. 인스턴스의 `completed`를 `true`로 설정하고 `completedAt`에 타임스탬프 기록.
   4. 별도의 히스토리/로그 테이블(`routine_history`)이 있다면 해당 행을 추가하여 완료 이벤트를 영구 기록.
 - 처리 흐름(실시간 계산 방식 기준):
   1. 완료 요청 시 서버는 루틴 규칙을 확인해 요청한 날짜가 유효한지 검증.
   2. 영구 기록을 위해 `routine_history` 또는 `routine_instance` 레코드를 생성하여 `completedAt`을 기록.
 - 응답: `ToggleRoutineStatusResponseDto`로 `routineId`, `completed`(boolean), `completedAt`(타임스탬프)을 반환.

4) 완료 후 목록/다음 발생 반영
 - 단일 인스턴스 기준: 오늘의 인스턴스를 완료하면 오늘 탭에서 해당 항목은 `completed` 상태로 표시됩니다.
 - 다음 발생: 루틴은 반복 규칙에 따라 다음 스케줄(예: 다음 주 일요일, 다음 달 지정일 등)에 다시 "오늘의 루틴" 또는 `scheduledFor`로 나타남. 즉, 완료는 해당 인스턴스에만 적용되며 루틴 자체는 계속 유효.
 - 예: WEEKLY 루틴(매주 일요일)을 5/10에 완료하면 5/10 인스턴스는 `completedAt`이 기록되고 다음 인스턴스(5/17)는 정상적으로 표시.

5) 히스토리 및 통계
 - 권장 모델:
   - `routine` 테이블: 루틴 정의 보관.
   - `routine_instance` 또는 `routine_history`: 특정 날짜 인스턴스의 `scheduledFor`, `completed`, `completedAt`, `userId` 등을 보관.
 - 이력 쿼리: 사용자는 완료 기록을 통해 주간/월간 통계, 연속 성공 횟수(streak) 등을 계산할 수 있음.

6) 일시정지/재개와 예외 처리
 - 일시정지: 루틴이 `paused` 상태이면 Scheduler 또는 실시간 계산에서 해당 기간 인스턴스 생성/표시를 건너뜀.
 - 휴가/스킵: 사용자가 특정 날짜 인스턴스를 건너뛰면 `routine_instance`에 `skipped` 플래그를 설정할 수 있음.
 - 충돌/동시성: 동일 인스턴스에 대해 동시 업데이트 발생 시 낙관적 락(버전 필드) 또는 DB 트랜잭션으로 처리. 실패 시 `ROUTINE002`(409) 같은 충돌 코드를 반환하는 것을 권장.

7) 에지 케이스
 - 과거 날짜 완료: 정책에 따라 허용/비허용 결정. 허용할 경우 `completedAt`을 요청 시 전달된 시간으로 기록.
 - 다중 완료 요청: 완료가 이미 되어 있을 경우 idempotency를 보장하기 위해 성공(200)을 반환하거나, 별도 충돌 코드(`ROUTINE002`)를 반환하도록 설계 가능.
 - 시간대: 서버는 저장 시 UTC 기준을 권장. 클라이언트는 로컬 시간대를 고려해 ISO 8601을 전송.

8) API와 연관된 엔드포인트 요약
 - 인스턴스 생성(선생성 방식): 내부 스케줄러(엔드포인트 아님) 또는 관리자용 백그라운드 job.
 - 인스턴스 상태 변경: `POST /api/routines/{routineId}/toggle` 또는 `POST /api/routines/{routineId}/complete`.
 - 기록 조회: `GET /api/routines/{routineId}/history?from=...&to=...` (추가 설계 권장)

예시: 완료 처리 흐름(요약)
 - 클라이언트: `POST /api/routines/uuid-123/complete`
 - 서버(선생성): 오늘 `routine_instance` 확인 -> `completedAt` 기록 -> `200 { routineId, completed: true, completedAt: "..." }`
 - 클라이언트: 다음 조회 시 `GET /api/routines?tab=today`에서 해당 인스턴스는 완료 상태로 표시되고, 다음 발생은 정상적으로 리스트에 노출됨.
