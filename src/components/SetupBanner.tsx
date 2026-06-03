export function SetupBanner() {
  return (
    <div className="sd-alert-warning">
      <strong>Setup required:</strong> Connect Supabase (see{" "}
      <code className="rounded bg-black/30 px-1 text-sd-glow">.env.local.example</code>
      ) and run migrations in{" "}
      <code className="rounded bg-black/30 px-1 text-sd-glow">
        supabase/migrations
      </code>
      . Then import branches from the admin panel.
    </div>
  );
}
