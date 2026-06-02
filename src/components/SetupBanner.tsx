export function SetupBanner() {
  return (
    <div className="rounded-lg border border-amber-600/50 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
      <strong>Setup required:</strong> Connect Supabase (see{" "}
      <code className="rounded bg-slate-800 px-1">.env.local.example</code>) and
      run migrations in <code className="rounded bg-slate-800 px-1">supabase/migrations</code>.
      Then import branches from the admin panel.
    </div>
  );
}
