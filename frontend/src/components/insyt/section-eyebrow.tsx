interface SectionEyebrowProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionEyebrow({ children, className }: SectionEyebrowProps) {
  return (
    <div
      className={`t-label text-text-3 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
