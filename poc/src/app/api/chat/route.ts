import { NextRequest } from "next/server";

const SYSTEM_PROMPT = `당신은 Mirra의 온보딩 어시스턴트입니다. Mirra는 SNS 마케팅 자동화 SaaS로, Instagram·TikTok·YouTube·Threads 계정을 연동해 콘텐츠 기획·제작·예약 발행·성과 분석을 한 곳에서 처리합니다.

역할:
- 사용자가 원하는 것을 파악하고, Mirra로 어떻게 해결할 수 있는지 2~3문장으로 간결하게 안내합니다.
- 대화가 어느 방향이든 결론은 "어떤 SNS 계정부터 연동해볼까요?"로 자연스럽게 수렴시킵니다.
- 질문은 한 번에 하나만 합니다. 여러 질문을 한꺼번에 던지지 않습니다.
- 한국어로 답변합니다. 친근하고 간결하게, 불필요한 수식어 없이.

금지:
- Mirra가 지원하지 않는 기능(블로그, 뉴스레터 등)을 지원한다고 말하지 않습니다.
- 과도한 칭찬이나 "좋은 질문이에요!" 같은 표현을 쓰지 않습니다.`;

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://poc-three-blush.vercel.app",
      "X-Title": "Mirra Onboarding",
    },
    body: JSON.stringify({
      model: "google/gemini-flash-1.5",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages,
      ],
      stream: true,
      max_tokens: 300,
    }),
  });

  if (!response.ok) {
    return new Response("LLM 오류가 발생했습니다.", { status: 500 });
  }

  // SSE 스트림을 그대로 클라이언트로 전달
  return new Response(response.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
