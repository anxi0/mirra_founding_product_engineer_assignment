import { NextRequest } from "next/server";

const SOURCE_LABEL: Record<string, string> = {
  original: "자체 창작 (브랜드 관점)",
  web: "웹 검색 트렌드 기반",
  internal: "내 자료·경험 기반",
};

export async function POST(req: NextRequest) {
  const { source, topic, platform } = await req.json();

  const systemPrompt = `당신은 SNS 콘텐츠 전략가입니다. 한국어로 답변하며, 사용자가 입력한 주제와 소재 방향을 바탕으로 SNS 게시물 아이디어를 생성합니다.

규칙:
- 정확히 5개의 콘텐츠 아이디어를 생성합니다.
- 각 아이디어는 "제목: ...\n설명: ..." 형식으로 작성합니다.
- 제목은 SNS 게시물 첫 줄로 바로 쓸 수 있을 만큼 구체적이고 매력적으로 씁니다.
- 설명은 1~2문장으로 어떤 내용을 담을지 간략히 설명합니다.
- 아이디어 사이는 "---"로 구분합니다.
- 플랫폼 특성에 맞게 작성합니다.
- 서두 설명 없이 아이디어 목록만 바로 출력합니다.`;

  const userPrompt = `플랫폼: ${platform ?? "SNS"}
소재 방향: ${SOURCE_LABEL[source] ?? source}
주제/키워드: ${topic}

위 정보를 바탕으로 SNS 콘텐츠 아이디어 5개를 생성해주세요.`;

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
