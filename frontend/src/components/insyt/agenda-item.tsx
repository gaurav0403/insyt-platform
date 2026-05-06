interface AgendaItemProps {
  title: string;
  owner?: string;
  due?: string;
}

export function AgendaItem({ title, owner, due }: AgendaItemProps) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="text-vermilion-3 mt-0.5">{"\u2192"}</span>
      <div className="flex-1">
        <p className="t-small text-text">{title}</p>
        {(owner || due) && (
          <p className="t-label text-text-3 mt-1">
            {owner}
            {owner && due && " \u00B7 "}
            {due}
          </p>
        )}
      </div>
    </div>
  );
}
