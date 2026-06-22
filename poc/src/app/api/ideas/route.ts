import { NextRequest } from "next/server";

const SOURCE_LABEL: Record<string, string> = {
  original: "자체 창작 (브랜드 관점)",
  web: "웹 검색 트렌드 기반",
  internal: "내 자료·경험 기반",
};

const CONTENT_TYPE_GUIDE: Record<string, string> = {
  card: "카드뉴스 (이미지 슬라이드 여러 장, 각 장에 핵심 메시지 하나, 정보성·교육성 콘텐츠에 적합)",
  short: "숏폼 영상 (15~60초 세로 영상, 후킹 첫 3초가 핵심, 트렌드·챌린지·감성 스토리에 적합)",
  blog: "블로그/글 (텍스트 중심 긴 글, 스토리텔링·정보 공유·의견 피력에 적합)",
};

export async function POST(req: NextRequest) {
  const { source, topic, platform, contentType } = await req.json();

  const typeGuide = CONTENT_TYPE_GUIDE[contentType] ?? "SNS 콘텐츠";

  const systemPrompt = `당신은 SNS 콘텐츠 전략가입니다. 한국어로 답변하며, 사용자가 입력한 주제·소재 방향·콘텐츠 유형을 바탕으로 실제로 쓸 수 있는 게시물 아이디어를 생성합니다.

규칙:
- 정확히 5개의 아이디어를 생성합니다.
- 각 아이디어는 "제목: ...\n설명: ..." 형식으로 작성합니다.
- 제목은 해당 콘텐츠 유형의 첫 줄·썸네일 문구로 바로 쓸 수 있을 만큼 구체적이고 매력적으로 씁니다.
- 설명은 1~2문장으로 어떤 내용을 담을지 설명합니다. 콘텐츠 유형 특성(장수, 영상 구성, 글 구조 등)을 반영하세요.
- 아이디어 사이는 "---"로 구분합니다.
- 서두 설명 없이 아이디어 목록만 바로 출력합니다.`;

  const userPrompt = `플랫폼: ${platform ?? "SNS"}
콘텐츠 유형: ${typeGuide}
소재 방향: ${SOURCE_LABEL[source] ?? source}
주제/키워드: ${topic}

위 조건에 맞는 콘텐츠 아이디어 5개를 생성해주세요.`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://poc-three-blush.vercel.app",
      "X-Title": "Mirra Content Ideas",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      stream: true,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    return new Response("생성 오류", { status: 500 });
  }

  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
