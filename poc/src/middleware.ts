import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser()가 토큰을 자동 갱신하고 갱신된 쿠키를 supabaseResponse에 씀
  const { data: { user } } = await supabase.auth.getUser();

  // 비로그인 상태에서 온보딩(/onboarding) 이외 페이지 접근 시 로그인으로
  if (!user && request.nextUrl.pathname === "/onboarding") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 로그인 상태에서 auth 페이지 접근 시 온보딩으로
  if (user && (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/signup")) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/onboarding", "/login", "/signup"],
};
