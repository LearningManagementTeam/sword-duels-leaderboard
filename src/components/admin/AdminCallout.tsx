interface Props {
  title?: string;
  children: React.ReactNode;
}

export function AdminCallout({ title, children }: Props) {
  return (
    <div className="sd-alert-info text-sm">
      {title && <p className="mb-1 font-medium text-sd-glow">{title}</p>}
      {children}
    </div>
  );
}
