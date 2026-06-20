export function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label={text}
        className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border-subtle text-[9px] font-semibold normal-case text-text-secondary outline-none transition-colors hover:border-accent-primary hover:text-accent-primary focus-visible:border-accent-primary focus-visible:text-accent-primary"
      >
        i
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-72 -translate-x-1/2 rounded-2xl border border-border-subtle bg-surface p-4 text-left opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <span className="mb-2 flex h-4 w-4 items-center justify-center rounded-full bg-accent-primary text-[9px] font-semibold normal-case text-white">
          i
        </span>
        <span className="block text-xs font-normal normal-case leading-snug text-text-primary">
          {text}
        </span>
      </span>
    </span>
  );
}
