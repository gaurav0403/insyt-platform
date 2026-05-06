interface PageHeaderProps {
  title: string;
  highlight: string;
  deck?: string;
}

export function PageHeader({ title, highlight, deck }: PageHeaderProps) {
  return (
    <header className="space-y-3 mb-12">
      <h1 className="t-headline text-text">
        {title}{" "}
        <em className="italic">{highlight}</em>
        <span className="text-vermilion-3 not-italic" aria-hidden="true">
          .
        </span>
      </h1>
      {deck && (
        <p className="t-lede italic text-text-2 max-w-[720px]">{deck}</p>
      )}
    </header>
  );
}
