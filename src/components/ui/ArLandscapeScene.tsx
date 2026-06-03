/** CSS-only animated AR-style landscape (no images / WebGL). */
export function ArLandscapeScene() {
  return (
    <div className="sd-landscape absolute inset-0 overflow-hidden" aria-hidden>
      <div className="sd-landscape__sky" />
      <div className="sd-landscape__horizon-grid" />
      <div className="sd-landscape__hill sd-landscape__hill--a" />
      <div className="sd-landscape__hill sd-landscape__hill--b" />
      <div className="sd-landscape__hill sd-landscape__hill--c" />
      <div className="sd-landscape__floor-grid" />
      <div className="sd-landscape__glow-line sd-landscape__glow-line--green" />
      <div className="sd-landscape__glow-line sd-landscape__glow-line--magenta" />
    </div>
  );
}
