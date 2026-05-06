interface RuleProps {
  variant?: "thin" | "thick";
  className?: string;
}

export function Rule({ variant = "thin", className }: RuleProps) {
  return (
    <div
      className={`w-full ${
        variant === "thick" ? "h-[2px] bg-bone" : "h-px bg-surface-edge"
      } ${className ?? ""}`}
    />
  );
}
