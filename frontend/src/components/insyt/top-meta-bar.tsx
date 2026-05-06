"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "./wordmark";
import { useTheme } from "./theme-provider";

const navLinks = [
  { label: "Daily", href: "/brief" },
  { label: "Narrative", href: "/narratives" },
  { label: "Replay", href: "/cases/tanishq-hallmarking" },
  { label: "Drafts", href: "/drafts/hallmarking-response" },
  { label: "Regional", href: "/regional" },
  { label: "Ground", href: "/ground" },
  { label: "People", href: "/people" },
  { label: "Sources", href: "/sources" },
];

export function TopMetaBar() {
  const pathname = usePathname();
  const { theme, toggle } = useTheme();

  const now = new Date();
  const dateStr = now
    .toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <header className="sticky top-0 z-50 bg-surface border-b border-surface-edge">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between h-12 px-8">
        {/* Left: Wordmark + Nav */}
        <div className="flex items-center gap-8">
          <Link href="/brief">
            <Wordmark className="text-xl" />
          </Link>
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/brief"
                  ? pathname === "/brief" || pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`t-label transition-colors ${
                    isActive
                      ? "text-text border-b border-accent"
                      : "text-text-2 hover:text-text"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Theme toggle + Meta */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggle}
            className="t-label text-text-3 hover:text-text transition-colors px-2 py-1 border border-surface-edge"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "Dark" : "Light"}
          </button>
          <span className="t-label text-text-3">
            {dateStr} {"\u00B7"} {timeStr} IST
          </span>
          <div className="w-7 h-7 bg-vermilion flex items-center justify-center">
            <span className="t-label text-paper text-[10px]">RK</span>
          </div>
        </div>
      </div>
    </header>
  );
}
