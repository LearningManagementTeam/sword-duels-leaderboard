/** Modern animated mesh gradient backdrop (CSS-only). */
export function ArGradientScene() {
  return (
    <div className="sd-gradient-scene absolute inset-0 overflow-hidden" aria-hidden>
      <div className="sd-gradient-scene__base" />
      <div className="sd-gradient-scene__mesh" />
      <div className="sd-gradient-scene__orb sd-gradient-scene__orb--lime" />
      <div className="sd-gradient-scene__orb sd-gradient-scene__orb--teal" />
      <div className="sd-gradient-scene__orb sd-gradient-scene__orb--magenta" />
      <div className="sd-gradient-scene__sheen" />
    </div>
  );
}
