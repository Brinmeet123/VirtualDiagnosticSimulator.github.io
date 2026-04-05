type Props = {
  children: React.ReactNode
  className?: string
  /** Visually de-emphasize when used inline in a dense layout */
  compact?: boolean
}

export default function NextStepGuidance({ children, className = '', compact }: Props) {
  return (
    <div
      className={[
        'rounded-xl border border-amber-200/90 bg-gradient-to-br from-amber-50 to-orange-50/80 text-amber-950 shadow-sm',
        compact ? 'px-3 py-2.5 text-sm' : 'px-4 py-3 text-sm',
        className,
      ].join(' ')}
      role="note"
    >
      <p className="font-medium text-amber-900">
        <span className="mr-1.5" aria-hidden>
          👉
        </span>
        Next step
      </p>
      <p className="mt-1 text-amber-950/90 leading-snug">{children}</p>
    </div>
  )
}
