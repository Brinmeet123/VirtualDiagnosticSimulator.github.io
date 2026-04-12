type Props = {
  children: React.ReactNode
  className?: string
  /** Visually de-emphasize when used inline in a dense layout */
  compact?: boolean
  /** When false, only the hint text is shown (e.g. next to a "Next step" button). */
  showHeading?: boolean
}

export default function NextStepGuidance({
  children,
  className = '',
  compact,
  showHeading = true,
}: Props) {
  return (
    <div
      className={[
        'rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/80 text-amber-950 shadow-sm',
        compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-sm',
        className,
      ].join(' ')}
      role="note"
    >
      {showHeading && (
        <p className="font-medium text-amber-900">
          <span className="mr-1.5" aria-hidden>
            👉
          </span>
          Next step
        </p>
      )}
      <p className={[showHeading ? 'mt-1' : '', 'text-amber-950/90 leading-snug'].filter(Boolean).join(' ')}>
        {children}
      </p>
    </div>
  )
}
