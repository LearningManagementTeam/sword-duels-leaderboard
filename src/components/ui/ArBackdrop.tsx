import { ArGradientScene } from "@/components/ui/ArGradientScene";

export function ArBackdrop() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      <ArGradientScene />

      {/* Soft vignette for text contrast — keeps gradients visible */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(4 26 18 / 0.35) 0%, rgb(4 26 18 / 0.5) 55%, rgb(4 26 18 / 0.65) 100%)",
        }}
      />

      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            "radial-gradient(ellipse 90% 60% at 50% -10%, rgb(74 222 128 / 0.12), transparent 50%), radial-gradient(ellipse 50% 40% at 100% 100%, rgb(217 70 239 / 0.1), transparent 45%)",
        }}
      />
    </div>
  );
}
