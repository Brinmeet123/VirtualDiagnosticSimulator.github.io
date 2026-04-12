type Props = {
  children: React.ReactNode
  className?: string
  /** Visually de-emphasize when used inline in a dense layout */
  compact?: boolean
  /** When false, only the hint text is shown (e.g. next to a "Next step" button). */
  showHeading?: boolean
  /** Primary action (e.g. "Next step") rendered inside the same card below the hint */
  action?: React.ReactNode
  /** Center hint text and align the action block as one unit */
  centered?: boolean
}

export default function NextStepGuidance({
  children,
  className = '',
  compact,
  showHeading = true,
  action,
  centered = false,
}: Props) {
  return (
    <div
      className={[
        'rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/80 text-amber-950 shadow-sm',
        compact ? 'px-4 py-3 text-sm' : 'px-4 py-3 text-sm',
        centered ? 'text-center' : '',
        action ? 'w-full' : '',
        className,
      ].join(' ')}
      role="note"
    >
      {showHeading && (
        <p className={['font-medium text-amber-900', centered && 'text-center'].filter(Boolean).join(' ')}>
          <span className="mr-1.5" aria-hidden>
            👉
          </span>
          Next step
        </p>
      )}
      <p
        className={[
          showHeading ? 'mt-1' : '',
          'text-amber-950/90 leading-snug',
          centered ? 'text-center' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </p>
      {action != null && (
        <div className="mt-4 border-t border-amber-200/80 pt-4">{action}</div>
      )}
    </div>
  )
}
