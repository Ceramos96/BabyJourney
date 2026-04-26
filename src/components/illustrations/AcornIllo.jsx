export default function AcornIllo({ style, className }) {
  return (
    <svg
      viewBox="0 0 44 54"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ color: 'var(--sage-700)', ...style }}
      className={className}
    >
      {/* Acorn body */}
      <path d="M22 20 C12 20 8 29 9 36 C10 43 15 49 22 49 C29 49 34 43 35 36 C36 29 32 20 22 20Z" />
      {/* Cap */}
      <path d="M11 22 C11 15 16 13 22 13 C28 13 33 15 33 22" />
      <path d="M11 22 L33 22" />
      {/* Cap texture */}
      <path d="M14 17 C16 15 18 14 20 14" />
      <path d="M18 16 C20 14 23 14 25 15" />
      <path d="M22 17 C25 15 28 15 30 17" />
      {/* Stem */}
      <path d="M22 13 C22 10 23 8 22 5" />
      {/* Stem leaf */}
      <path d="M22 8 C18 6 16 3 18 1 C21 0 24 3 22 8" />
    </svg>
  )
}
