interface SeverityBarProps {
  value: number; // 1-5
}

export function SeverityBar({ value }: SeverityBarProps) {
  return (
    <div className="inline-flex gap-[2px] items-center">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={`block w-1 h-3 ${
            i < value ? "bg-vermilion-3" : "bg-bone-4"
          }`}
        />
      ))}
    </div>
  );
}
