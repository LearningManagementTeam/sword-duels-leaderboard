interface Props {
  title?: string;
  children: React.ReactNode;
}

export function AdminCallout({ title, children }: Props) {
  return (
    <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/90">
      {title && <p className="mb-1 font-medium text-amber-200">{title}</p>}
      {children}
    </div>
  );
}
