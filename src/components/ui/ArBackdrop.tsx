export function ArBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgb(20 83 45 / 0.35), transparent 60%), linear-gradient(180deg, #041a12 0%, #0a2e1f 50%, #041a12 100%)",
        }}
      />
      <div className="absolute -left-20 top-1/4 h-72 w-72 rounded-full bg-emerald-500/10 blur-3xl" />
      <div className="absolute -right-16 bottom-1/4 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl" />
      <svg
        className="absolute left-1/2 top-8 h-64 w-64 -translate-x-1/2 opacity-[0.07]"
        viewBox="0 0 200 200"
      >
        <circle
          cx="100"
          cy="100"
          r="90"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-emerald-300"
        />
        <circle
          cx="100"
          cy="100"
          r="60"
          fill="none"
          stroke="currentColor"
          strokeWidth="0.5"
          className="text-emerald-300"
        />
      </svg>
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #4ade80 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}
