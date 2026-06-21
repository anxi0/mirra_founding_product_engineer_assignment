// 프로덕션에서는 Claude API를 사용해 intent를 분류하지만,
// PoC에서는 결정론적 키워드 매칭으로 구현한다.
// 이유: API 의존성 없이 즉시 실행 가능해야 하고,
//       "AI를 믿지 않고 직접 검증한" 영역을 명확히 분리하기 위함.

export type IntentType = "create" | "schedule" | "analyze" | "edit" | "ask";
export type Platform = "instagram" | "tiktok" | "kakao" | null;
export type ContentFormat = "carousel" | "video" | "text" | null;
export type TimeReference = "today" | "tomorrow" | "this_week" | "next_week" | null;

export interface ClassifiedIntent {
  intentType: IntentType;
  targetPlatform: Platform;
  contentFormat: ContentFormat;
  timeReference: TimeReference;
  resolvedAction: string | null;
}

const PLATFORM_KEYWORDS: Record<string, Platform> = {
  "인스타그램": "instagram", "인스타": "instagram", "ig": "instagram",
  "틱톡": "tiktok", "tiktok": "tiktok",
  "카카오": "kakao", "카카오채널": "kakao",
};

const FORMAT_KEYWORDS: Record<string, ContentFormat> = {
  "카드뉴스": "carousel", "카드": "carousel", "carousel": "carousel",
  "숏폼": "video", "영상": "video", "동영상": "video", "video": "video",
  "텍스트": "text", "글": "text",
};

const TIME_KEYWORDS: Record<string, TimeReference> = {
  "오늘": "today", "today": "today",
  "내일": "tomorrow", "tomorrow": "tomorrow",
  "이번주": "this_week", "이번 주": "this_week", "this week": "this_week",
  "다음주": "next_week", "다음 주": "next_week",
};

const CREATE_VERBS = ["만들어", "만들어줘", "생성해", "작성해", "제작해", "올려줘", "올릴"];
const SCHEDULE_VERBS = ["예약해", "예약", "발행해", "발행", "스케줄", "올려줘"];
const ANALYZE_VERBS = ["분석해", "성과", "어떤지", "잘됐어", "확인해", "결과", "어떻게"];
const EDIT_VERBS = ["수정해", "바꿔", "변경해", "고쳐"];

export function classify(query: string): ClassifiedIntent {
  const q = query.toLowerCase();

  // platform
  let targetPlatform: Platform = null;
  for (const [kw, platform] of Object.entries(PLATFORM_KEYWORDS)) {
    if (q.includes(kw.toLowerCase())) { targetPlatform = platform; break; }
  }

  // format
  let contentFormat: ContentFormat = null;
  for (const [kw, format] of Object.entries(FORMAT_KEYWORDS)) {
    if (q.includes(kw.toLowerCase())) { contentFormat = format; break; }
  }

  // time
  let timeReference: TimeReference = null;
  for (const [kw, time] of Object.entries(TIME_KEYWORDS)) {
    if (q.includes(kw.toLowerCase())) { timeReference = time; break; }
  }

  // intent
  let intentType: IntentType = "ask";
  if (EDIT_VERBS.some(v => q.includes(v))) intentType = "edit";
  else if (ANALYZE_VERBS.some(v => q.includes(v))) intentType = "analyze";
  else if (SCHEDULE_VERBS.some(v => q.includes(v)) && !CREATE_VERBS.some(v => q.includes(v))) intentType = "schedule";
  else if (CREATE_VERBS.some(v => q.includes(v))) intentType = "create";

  // resolved action
  const resolvedAction =
    intentType === "create" && contentFormat === "carousel" ? "carousel_generate" :
    intentType === "create" && contentFormat === "video"    ? "video_generate" :
    intentType === "create"                                  ? "content_generate" :
    intentType === "schedule"                                ? "post_schedule" :
    intentType === "analyze"                                 ? "analytics_query" :
    intentType === "edit"                                    ? "content_edit" : null;

  return { intentType, targetPlatform, contentFormat, timeReference, resolvedAction };
}
