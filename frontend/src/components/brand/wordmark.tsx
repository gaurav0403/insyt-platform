export function InsytWordmark({ className }: { className?: string }) {
  return (
    <span className={`font-display font-semibold tracking-tight ${className ?? ""}`}>
      insyt<span className="text-ochre">.</span>
    </span>
  );
}
