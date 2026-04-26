export default function LeafIllo({ style, className }) {
  return (
    <svg
      viewBox="0 0 22 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: 'var(--sage-500)', ...style }}
      className={className}
    >
      {/* Leaf outline */}
      <path d="M11 26 C5 19 3 13 4 7 C6 3 11 1 16 4 C19 8 18 16 11 26Z" />
      {/* Midrib */}
      <path d="M11 26 L10 8" />
      {/* Veins */}
      <path d="M10 20 C7 17 5 15 5 13" />
      <path d="M10 14 C13 12 15 10 15 8" />
      <path d="M10 17 C8 15 7 14 6 12" />
    </svg>
  )
}
