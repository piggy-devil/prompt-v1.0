"use client";

import Link from "next/link";
import Image from "next/image";
import { BRAND_BLUE } from "@/lib/utils";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b bg-background/70 backdrop-blur supports-[backdrop-filter]:bg-background/50">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <Image
            src="/brand/mwa-logo.png"
            alt="การประปานครหลวง"
            width={100}
            height={100}
            className="rounded-full size-8"
            priority
          />
          <div className="flex items-baseline gap-2">
            <span
              className="text-sm font-medium tracking-wide"
              style={{ color: BRAND_BLUE }}
            >
              MWA Chatbot Platform
            </span>
            <span className="text-xs text-muted-foreground">
              การประปานครหลวง
            </span>
          </div>
          <div className="ml-auto">
            <Link
              href="/"
              className="text-xs text-muted-foreground hover:text-foreground underline-offset-4 hover:underline"
            >
              กลับหน้าหลัก
            </Link>
          </div>
        </div>
      </header>

      {/* Body */}
      <div className="mx-auto grid min-h-[calc(100vh-56px)] max-w-7xl lg:grid-cols-2">
        {/* Left: Hero / Brand */}
        <div className="relative hidden lg:flex items-center justify-center overflow-hidden">
          {/* พื้นหลังไล่เฉด + วงกลมเบลอ */}
          <div
            className="absolute inset-0"
            style={{
              background:
                `radial-gradient(1200px 600px at -10% -10%, ${BRAND_BLUE}20, transparent 60%),` +
                `radial-gradient(900px 450px at 120% 0%, ${BRAND_BLUE}14, transparent 60%)`,
            }}
          />
          <div className="relative z-10 w-full max-w-lg px-10">
            <div className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-xs text-muted-foreground bg-background/60 backdrop-blur">
              AI Insight with{" "}
              <span className="mx-1 font-medium text-foreground">RAG</span>
            </div>
            <h2 className="text-4xl font-semibold leading-tight">
              เข้าสู่ระบบเพื่อใช้งาน{" "}
              <span style={{ color: BRAND_BLUE }}>แพลตฟอร์มแชตบอต</span>
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              อัปโหลดเอกสาร ปรับแต่งข้อมูล และสนทนาด้วยบริบทจากคลังความรู้ของคุณ
              ประสบการณ์ใช้งานเรียบง่าย ปลอดภัย ตามแนวทางองค์กร
            </p>

            {/* Points */}
            <ul className="mt-6 space-y-2 text-sm">
              <li className="flex gap-2">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: BRAND_BLUE }}
                />
                ลงชื่อเข้าใช้งานด้วยอีเมลองค์กรหรือ Google
              </li>
              <li className="flex gap-2">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: BRAND_BLUE }}
                />
                จัดเก็บไฟล์เข้าระบบ (Drive) อย่างเป็นระเบียบ
              </li>
              <li className="flex gap-2">
                <span
                  className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: BRAND_BLUE }}
                />
                ปลอดภัยตามนโยบายข้อมูลขององค์กร
              </li>
            </ul>
          </div>
        </div>

        {/* Right: Auth card */}
        <div className="flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            {children}
            <p className="mt-6 text-center text-[11px] text-muted-foreground">
              โดยการเข้าสู่ระบบ คุณยอมรับ{" "}
              <Link
                href="/legal/terms"
                className="underline underline-offset-4 hover:text-foreground"
              >
                เงื่อนไขการใช้งาน
              </Link>{" "}
              และ{" "}
              <Link
                href="/legal/privacy"
                className="underline underline-offset-4 hover:text-foreground"
              >
                นโยบายความเป็นส่วนตัว
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
