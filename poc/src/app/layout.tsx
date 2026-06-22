import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SNS 콘텐츠 마케팅 AI | Mirr - 기획부터 발행·관리까지",
  description: "Mirr는 SNS 콘텐츠 마케팅을 위한 AI입니다. 브랜드 톤을 학습해 소셜 콘텐츠를 기획·제작하고, 예약 발행과 댓글·DM 관리까지 한 곳에서 돕습니다.",
  icons: {
    icon: "https://www.mirra.my/icon.svg?icon.0wjdagn2ryz73.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
