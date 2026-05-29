# 주간/월간 레포트 AI 연동 및 자동화 기획 문서 (최종본)

제공해주신 실제 모바일 앱 서비스 화면(UI) 시안에 기반하여, 화면에 표시될 각 요소가 **백엔드 DB에서 어떻게 집계되는지** 혹은 **AI가 어떻게 생성해 전달해야 하는지**를 1:1로 정확하게 대응하여 매핑 명세를 업데이트했습니다.

---

## 1. 월간 레포트 UI 요소별 데이터 매핑 명세 (As-Is vs To-Be)

![월간 레포트 UI 예시](https://images.unsplash.com/photo-1517841905240-472988babdf9?w=500&auto=format&fit=crop&q=60) <!-- 임시 이미지 플레이스홀더, 실제 화면은 첨부해주신 이미지 구조를 따름 -->

월간 레포트 UI 화면에 노출되는 정보들의 원천과 연산 주체는 다음과 같습니다.

| UI 표시 문구/영역 | 수집 및 생성 방식 | 대응되는 데이터 구조 및 매핑 필드 |
| :--- | :--- | :--- |
| **"25년 9월의 월간 레포트"** | **백엔드 자동** | 레포트 기준 날짜 (`baseDate`에서 연/월 추출) |
| **"이번 달은 17개의 일기를 작성했어요"** | **백엔드 자동** | `summary.diaryCount = 17` (`prisma.diary.count` 집계) |
| **"가장 많이 언급된 주제는 음식이었어요 🍔🍕"** | **AI 분석 생성** | `detailsJson.topTheme` (AI가 한 달 일기 키워드 분석하여 도출) |
| **"이번 한 달의 감정은 안정적이었어요 🧘"** | **AI 분석 생성** | `detailsJson.overallSentiment` (AI가 한 달 감정선 분석하여 요약) |
| **"첫째 주에는 하이디라오를... / 둘째 주에는 영화를... / 마지막 주에는..."** | **AI 분석 생성** | `detailsJson.weeklyEvents` (AI가 각 주차별 대표 일기 이벤트 내용을 요약한 텍스트 배열) |
| **"9월의 순간들 📷" (사진 목록)** | **백엔드 자동** | `detailsJson.photos` (백엔드가 해당 월의 일기 사진 `diary_photo` 리스트 중 최신 순으로 최대 5개 자동 추출) |
| **"AI가 바라본 (닉네임)님의 한 달" (종합 텍스트)** | **AI 분석 생성** | `detailsJson.aiAnalysis` (AI가 작성하는 정성적 종합 라이프 피드백 텍스트) |

---

## 2. 주간 레포트 UI 요소별 데이터 매핑 명세 (As-Is vs To-Be)

주간 레포트 UI 화면에 노출되는 요일별 타임라인 정보들의 원천과 연산 주체는 다음과 같습니다.

| UI 표시 문구/영역 | 수집 및 생성 방식 | 대응되는 데이터 구조 및 매핑 필드 |
| :--- | :--- | :--- |
| **"25년 9월의 첫째 주 요약"** | **백엔드 자동** | `baseDate` (백엔드가 해당 주의 월요일 기준으로 주차 식별) |
| **"이번 주는 4개의 일기를 작성했어요"** | **백엔드 자동** | `summary.diaryCount = 4` (`prisma.diary.count` 집계) |
| **"9월 3일 월요일"** | **백엔드 자동** | `detailsJson.weeklyBreakdown[].date` 및 `dayOfWeek` |
| **"월요일에는 훠궈를 드셨네요 맛있어서 행복했던 날이에요! 🍲"** | **AI 분석 생성** | `detailsJson.weeklyBreakdown[].dailyAnalysis` (AI가 해당 날짜 일기 내용을 한 줄 요약 및 코멘트) |
| **요일별 첨부 사진** | **백엔드 자동** | `detailsJson.weeklyBreakdown[].photos` (백엔드가 해당 날짜 일기 `diary`에 첨부된 S3 이미지 URL 주소를 DB에서 1:1로 매핑하여 조회) |

---

## 3. 최종 완성된 AI 서버 연동 API 스펙

### 3.1 Request (일반 백엔드 -> AI 분석 서버)
백엔드가 직접 데이터베이스에서 해당 기간의 일기와 사진 데이터를 집계하여 원문을 실어 보냅니다. 
#### [월간 레포트 요청 시 - MONTHLY]
```json
{
  "reportType": "MONTHLY", // "WEEKLY" 또는 "MONTHLY"
  "baseDate": "2026-05-01",
  "userInfo": {
    "nickname": "코딩초보",
    "gender": "FEMALE",
    "age": 24
  },
  "stats": {
    "diaryCount": 17,
    "photoCount": 5
  },
  "previousReport": {
    "diaryCount": 12,
    "overallSentiment": "불안정하고 감정 기복이 심했어요 🌪️",
    "topTheme": "회사 스트레스 😭"
  },
  "diaries": [
    {
      "diaryId": "diary-uuid-1",
      "date": "2026-05-01",
      "dayOfWeek": "Friday",
      "title": "첫째 주 일기",
      "content": "오늘 친구랑 같이 하이디라오 훠궈 집에 가서 맛있는 소고기랑 양고기를 엄청 배부르게 먹었다. 직원이 수타면 쇼를 해줬는데 너무 신기하고 재밌었다."
    },
    {
      "diaryId": "diary-uuid-2",
      "date": "2026-05-12",
      "dayOfWeek": "Tuesday",
      "title": "영화 관람",
      "content": "기대하던 영화 <어쩔수가없다> 무대인사 회차를 보고 왔다. 감독님과 배우분들 실물이 너무 멋졌고 영화도 정말 여운이 깊게 남았다."
    },
    {
      "diaryId": "diary-uuid-3",
      "date": "2026-05-29",
      "dayOfWeek": "Friday",
      "title": "월급날!",
      "content": "기다리고 기다리던 월급이 들어왔다! 한 달 동안 야근하며 고생했던 기억이 싹 사라지고 기분이 너무 좋다."
    }
  ]
}
```

#### [주간 레포트 요청 시 - WEEKLY]
```json
{
  "reportType": "WEEKLY", // "WEEKLY" 또는 "MONTHLY"
  "baseDate": "2026-05-25",
  "userInfo": {
    "nickname": "코딩초보",
    "gender": "FEMALE",
    "age": 24
  },
  "stats": {
    "diaryCount": 3,
    "photoCount": 2
  },
  "previousReport": {
    "diaryCount": 5,
    "overallSentiment": "평온하고 즐거웠어요 🧘"
  },
  "diaries": [
    {
      "diaryId": "diary-uuid-1",
      "date": "2026-05-25",
      "dayOfWeek": "Monday",
      "title": "월요일 일기",
      "content": "월요일에는 친구랑 훠궈를 먹었다. 너무 맛있어서 하루 시작이 행복했다."
    },
    {
      "diaryId": "diary-uuid-2",
      "date": "2026-05-26",
      "dayOfWeek": "Tuesday",
      "title": "회사에서 실수한 날",
      "content": "화요일은 회사에서 큰 실수를 해서 부장님께 혼났다. 너무 슬프고 우울해서 울 뻔했다."
    },
    {
      "diaryId": "diary-uuid-3",
      "date": "2026-05-29",
      "dayOfWeek": "Friday",
      "title": "친구들과 불금!",
      "content": "금요일 퇴근하고 오랜만에 고등학교 친구들을 만나 술을 마셨다. 너무 즐겁고 신나게 놀아서 스트레스가 다 풀렸다."
    }
  ]
}
```



### 3.2 Response (AI 분석 서버 -> 일반 백엔드)
AI는 요소를 정독하고 화면 UI 텍스트로 그대로 치환해 뿌릴 수 있도록 고정된 키값으로 정교하게 응답합니다.

#### [월간 레포트 응답 시 - MONTHLY]
```json
{
  "success": true,
  "data": {
    "topTheme": "음식이었어요 🍔🍕",
    "overallSentiment": "안정적이었어요 🧘",
    "weeklyEvents": [
      "첫째 주에는 친구와 함께 하이디라오를 다녀오셨네요 🍲",
      "둘째 주에는 영화 <어쩔수가없다>를 감명 깊게 봤어요 🎥",
      "마지막 주에는 월급이 들어와 기뻐하셨어요 🤑"
    ],
    "aiAnalysis": "(코딩초보)님은 지난 달에 비해 감정이 정말 많이 안정된 것 같아요! 축하드립니다. 이번 달에는 맛있는 음식을 먹으며 사람들과 함께하는 경험이 많아졌어요. 좋은 변화입니다. 다만 음주의 빈도가 많이 증가하였습니다. 과음은 좋은 습관은 아니니 다음 달에는 횟수를 줄이는 편이 좋을 것 같아요! 영화 관람 같은 취미는 적극 추천합니다."
  }
}
```

#### [주간 레포트 응답 시 - WEEKLY]
```json
{
  "success": true,
  "data": {
    "dailyAnalysisList": [
      {
        "date": "2026-05-25",
        "dayOfWeek": "Monday",
        "diaryId": "diary-uuid-1",
        "analysis": "월요일에는 훠궈를 드셨네요 맛있어서 행복했던 날이에요! 🍲"
      },
      {
        "date": "2026-05-26",
        "dayOfWeek": "Tuesday",
        "diaryId": "diary-uuid-2",
        "analysis": "화요일은 회사에서 실수해서 많이 우울했던 날이에요 ☔"
      },
      {
        "date": "2026-05-29",
        "dayOfWeek": "Friday",
        "diaryId": "diary-uuid-3",
        "analysis": "금요일은 친구들이랑 만나서 신나게 놀았어요 🥴"
      }
    ]
  }
}
```

---

## 4. 백엔드 DB 저장 규격 병합 예시

백엔드는 AI로부터 위의 응답을 받아, 자신이 직접 카운트한 메타데이터와 결합하여 `report` 테이블의 JSON 필드에 깔끔하게 병합 적재합니다.

### 4.1 월간 레포트 최종 저장 규격 (ReportType: MONTHLY)
*   **`summary` 필드 (JSON)**
    ```json
    {
      "diaryCount": 17,
      "photoCount": 5
    }
    ```
*   **`details_json` (JSON)**
    ```json
    {
      "photos": [
        "https://s3.ap-northeast-2.amazonaws.com/voda/diaries/food.jpg",
        "https://s3.ap-northeast-2.amazonaws.com/voda/diaries/movie.jpg",
        "https://s3.ap-northeast-2.amazonaws.com/voda/diaries/drinking.jpg"
      ],
      "topTheme": "음식이었어요 🍔🍕",
      "overallSentiment": "안정적이었어요 🧘",
      "weeklyEvents": [
        "첫째 주에는 친구와 함께 하이디라오를 다녀오셨네요 🍲",
        "둘째 주에는 영화 <어쩔수가없다>를 감명 깊게 봤어요 🎥",
        "마지막 주에는 월급이 들어와 기뻐하셨어요 🤑"
      ],
      "aiAnalysis": "(코딩초보)님은 지난 달에 비해 감정이 정말 많이 안정된 것 같아요! 축하드립니다..."
    }
    ```

### 4.2 주간 레포트 최종 저장 규격 (ReportType: WEEKLY)
*   **`summary` 필드 (JSON)**
    ```json
    {
      "diaryCount": 4,
      "photoCount": 2
    }
    ```
*   **`details_json` (JSON)**
    ```json
    {
      "photos": [
        "https://s3.ap-northeast-2.amazonaws.com/voda/diaries/food.jpg",
        "https://s3.ap-northeast-2.amazonaws.com/voda/diaries/drinking.jpg"
      ],
      "weeklyBreakdown": [
        {
          "date": "2026-05-25",
          "dayOfWeek": "Monday",
          "dailyAnalysis": "월요일에는 훠궈를 드셨네요 맛있어서 행복했던 날이에요! 🍲",
          "photos": ["https://s3.ap-northeast-2.amazonaws.com/voda/diaries/food.jpg"],
          "diaryId": "diary-uuid-1"
        },
        {
          "date": "2026-05-26",
          "dayOfWeek": "Tuesday",
          "dailyAnalysis": "화요일은 회사에서 실수해서 많이 우울했던 날이에요 ☔",
          "photos": [],
          "diaryId": "diary-uuid-2"
        },
        {
          "date": "2026-05-29",
          "dayOfWeek": "Friday",
          "dailyAnalysis": "금요일은 친구들이랑 만나서 신나게 놀았어요 🥴",
          "photos": ["https://s3.ap-northeast-2.amazonaws.com/voda/diaries/drinking.jpg"],
          "diaryId": "diary-uuid-3"
        }
      ]
    }
    ```

기존의 DB 스키마 틀을 전혀 부수지 않으면서도, 기획하신 프론트엔드 모바일 시안 화면의 컴포넌트들에 100% 매핑되는 이상적이고 유연한 API 통합이 보장됩니다.
