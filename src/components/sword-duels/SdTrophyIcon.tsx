interface Props {
  size?: number;
  className?: string;
}

/** Gold trophy SVG for bracket center stage. */
export function SdTrophyIcon({ size = 40, className = "" }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <path
        d="M16 8h32v6c0 8-4 14-10 17v3h8v4H18v-4h8v-3c-6-3-10-9-10-17V8z"
        fill="url(#sd-trophy-cup)"
        stroke="#b45309"
        strokeWidth="1.5"
      />
      <path
        d="M16 10H10c0 6 2 10 6 12M48 10h6c0 6-2 10-6 12"
        stroke="#fbbf24"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <rect x="22" y="38" width="20" height="5" rx="1" fill="#92400e" />
      <rect x="18" y="43" width="28" height="6" rx="2" fill="url(#sd-trophy-base)" />
      <path
        d="M28 14h8v2c0 3-1.5 5-4 5s-4-2-4-5v-2z"
        fill="#fef3c7"
        opacity="0.85"
      />
      <defs>
        <linearGradient id="sd-trophy-cup" x1="32" y1="8" x2="32" y2="34">
          <stop stopColor="#fde68a" />
          <stop offset="0.5" stopColor="#fbbf24" />
          <stop offset="1" stopColor="#d97706" />
        </linearGradient>
        <linearGradient id="sd-trophy-base" x1="32" y1="43" x2="32" y2="49">
          <stop stopColor="#fbbf24" />
          <stop offset="1" stopColor="#92400e" />
        </linearGradient>
      </defs>
    </svg>
  );
}
