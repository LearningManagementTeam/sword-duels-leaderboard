"use client";

import { usePathname } from "next/navigation";

export function SiteMain({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/";
  const isPreview = pathname.startsWith("/preview");

  return (
    <main
      className={`relative mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-6 md:pb-8 ${
        isPreview ? "md:pt-[6.75rem]" : "md:pt-[4.5rem]"
      }`}
    >
      {children}
    </main>
  );
}
