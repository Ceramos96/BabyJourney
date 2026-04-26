export default function SproutIllo({ style, className }) {
  return (
    <svg
      viewBox="0 0 80 110"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: 'var(--sage-700)', ...style }}
      className={className}
    >
      {/* Stem */}
      <path d="M40 100 C40 85 40 68 40 48" />

      {/* Left leaf — lower, faces outward */}
      <path d="M40 78 C32 70 18 72 13 64 C19 54 40 60 40 70" />
      {/* Left leaf midrib */}
      <path d="M26 69 C31 70 37 72 40 78" />
      {/* Left leaf secondary veins */}
      <path d="M20 66 C24 65 28 66 32 68" />

      {/* Right leaf — mid position, faces outward */}
      <path d="M40 62 C48 54 62 56 67 48 C61 38 40 44 40 54" />
      {/* Right leaf midrib */}
      <path d="M54 53 C49 55 45 57 40 62" />
      {/* Right leaf secondary veins */}
      <path d="M60 50 C56 51 52 52 48 54" />

      {/* Top leaf — unfurling, faces up */}
      <path d="M40 48 C36 36 37 22 40 11 C43 22 44 36 40 48" />
      {/* Top leaf midrib — continues upward */}
      <path d="M40 48 L40 20" />
      {/* Top leaf secondary veins */}
      <path d="M40 35 C38 32 36 30 35 28" />
      <path d="M40 40 C42 37 44 35 45 33" />
      {/* Unfurling spiral at tip */}
      <path d="M40 11 C38 7 37 4 39 2 C41 3 42 6 40 11" />

      {/* Root — central */}
      <path d="M40 100 L40 108" />
      {/* Root — left main */}
      <path d="M40 100 C35 104 27 105 21 108" />
      {/* Root — right main */}
      <path d="M40 100 C45 104 53 105 59 108" />
      {/* Root — fine branches */}
      <path d="M30 104 C27 106 24 107 22 110" />
      <path d="M50 104 C53 106 56 107 58 110" />
      <path d="M40 104 C39 106 39 107 38 110" />
    </svg>
  )
}
