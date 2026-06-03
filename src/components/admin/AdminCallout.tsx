interface Props {
  title?: string;
  children: React.ReactNode;
}

export function AdminCallout({ title, children }: Props) {
  return (
    <div className="rounded-lg border border-sd-glow/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-50/90">
      {title && <p className="mb-1 font-medium text-sd-glow">{title}</p>}
      {children}
    </div>
  );
}
