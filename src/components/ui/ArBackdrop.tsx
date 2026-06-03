/** Public path for the soft blurred page background */
export const SD_BACKDROP_IMAGE = "/backgrounds/sd-wave-green.png";

export function ArBackdrop() {
  return (
    <div
      className="sd-hud-scan pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden
    >
      {/* Solid base so edges never flash white */}
      <div className="absolute inset-0 bg-sd-deep" />

      {/* User wave art — heavily blurred and dimmed */}
      <div
        className="sd-backdrop-photo absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${SD_BACKDROP_IMAGE})` }}
      />

      {/* Readability scrim over the photo */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgb(4 26 18 / 0.82) 0%, rgb(4 26 18 / 0.88) 45%, rgb(4 26 18 / 0.92) 100%)",
        }}
      />

      {/* Subtle brand tint (keeps magenta complement without competing with art) */}
      <div
        className="absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 20%, rgb(20 83 45 / 0.25), transparent 55%), radial-gradient(ellipse 40% 35% at 100% 90%, rgb(88 28 135 / 0.08), transparent 50%)",
        }}
      />

      <div className="sd-light-streak sd-light-streak--green opacity-40" />
      <div className="sd-light-streak sd-light-streak--magenta opacity-30" />

      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #4ade80 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
}
