import { TopMetaBar } from "@/components/insyt/top-meta-bar";

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface text-text">
      <TopMetaBar />
      <main className="max-w-[1440px] mx-auto px-8 py-10">{children}</main>
    </div>
  );
}
