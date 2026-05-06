export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-serif font-medium tracking-tight inline-flex items-baseline leading-none ${className ?? ""}`}
    >
      Insyt
      <span className="text-vermilion-3" aria-hidden="true">
        .
      </span>
    </span>
  );
}
