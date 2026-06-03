import type { CSSProperties } from "react";

/** Decorative green electricity flashes (CSS + inline SVG, behind page scrim). */
export function ArElectricityLayer() {
  return (
    <div className="sd-electricity absolute inset-0 overflow-hidden" aria-hidden>
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient id="sd-bolt-grad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgb(74 222 128 / 0)" />
            <stop offset="35%" stopColor="rgb(163 230 53 / 0.95)" />
            <stop offset="55%" stopColor="rgb(74 222 128 / 1)" />
            <stop offset="100%" stopColor="rgb(34 197 94 / 0)" />
          </linearGradient>
        </defs>
      </svg>

      {BOLTS.map((bolt) => (
        <div
          key={bolt.id}
          className="sd-electricity__bolt"
          style={
            {
              "--sd-bolt-top": bolt.top,
              "--sd-bolt-left": bolt.left,
              "--sd-bolt-rot": `${bolt.rotate}deg`,
              "--sd-bolt-scale": bolt.scale,
              "--sd-bolt-delay": bolt.delay,
              "--sd-bolt-dur": bolt.duration,
            } as CSSProperties
          }
        >
          <svg
            viewBox="0 0 48 140"
            className="sd-electricity__svg"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={bolt.path}
              stroke="url(#sd-bolt-grad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      ))}

      {SPARKS.map((spark) => (
        <div
          key={spark.id}
          className="sd-electricity__spark"
          style={
            {
              "--sd-spark-top": spark.top,
              "--sd-spark-left": spark.left,
              "--sd-spark-rot": `${spark.rotate}deg`,
              "--sd-spark-delay": spark.delay,
              "--sd-spark-dur": spark.duration,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}

const BOLTS = [
  {
    id: "b1",
    top: "8%",
    left: "6%",
    rotate: -18,
    scale: 1,
    delay: "0s",
    duration: "5.8s",
    path: "M24 0 L14 48 L30 52 L10 92 L38 96 L22 140",
  },
  {
    id: "b2",
    top: "22%",
    left: "78%",
    rotate: 12,
    scale: 0.85,
    delay: "1.4s",
    duration: "6.4s",
    path: "M22 0 L32 38 L12 44 L28 78 L8 82 L24 140",
  },
  {
    id: "b3",
    top: "55%",
    left: "18%",
    rotate: 8,
    scale: 1.1,
    delay: "3.1s",
    duration: "7.2s",
    path: "M26 0 L16 42 L34 48 L14 88 L36 94 L20 140",
  },
  {
    id: "b4",
    top: "68%",
    left: "62%",
    rotate: -22,
    scale: 0.9,
    delay: "0.8s",
    duration: "5.2s",
    path: "M20 0 L30 40 L10 46 L26 80 L6 86 L22 140",
  },
  {
    id: "b5",
    top: "38%",
    left: "42%",
    rotate: -5,
    scale: 0.75,
    delay: "4.6s",
    duration: "8.1s",
    path: "M24 0 L18 50 L32 54 L12 98 L30 102 L24 140",
  },
  {
    id: "b6",
    top: "12%",
    left: "52%",
    rotate: 20,
    scale: 0.7,
    delay: "2.2s",
    duration: "6.9s",
    path: "M22 0 L28 36 L14 42 L30 76 L16 82 L26 140",
  },
  {
    id: "b7",
    top: "78%",
    left: "8%",
    rotate: 15,
    scale: 1,
    delay: "5.3s",
    duration: "7.5s",
    path: "M26 0 L12 44 L34 50 L10 90 L38 96 L22 140",
  },
  {
    id: "b8",
    top: "45%",
    left: "88%",
    rotate: -12,
    scale: 0.8,
    delay: "1.9s",
    duration: "5.5s",
    path: "M20 0 L34 42 L12 48 L28 84 L8 90 L24 140",
  },
] as const;

const SPARKS = [
  { id: "s1", top: "30%", left: "25%", rotate: 40, delay: "0.5s", duration: "4.1s" },
  { id: "s2", top: "18%", left: "70%", rotate: -30, delay: "2.8s", duration: "3.6s" },
  { id: "s3", top: "62%", left: "35%", rotate: 55, delay: "1.1s", duration: "4.8s" },
  { id: "s4", top: "72%", left: "82%", rotate: -45, delay: "3.9s", duration: "5.1s" },
  { id: "s5", top: "48%", left: "58%", rotate: 10, delay: "4.2s", duration: "3.9s" },
  { id: "s6", top: "85%", left: "48%", rotate: -20, delay: "2.4s", duration: "4.4s" },
] as const;
