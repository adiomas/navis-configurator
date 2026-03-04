/**
 * Design system constants for Navis Marine Configurator.
 * Use with cn(): cn(ds.card.base, 'p-4')
 */
export const ds = {
  page: {
    spacing: 'space-y-3',
    title: 'text-xl font-semibold text-navy',
    subtitle: 'text-xs text-muted-foreground',
    header: 'flex items-center justify-between',
  },

  card: {
    base: 'rounded-lg border border-border/60 bg-white',
    padded: 'rounded-lg border border-border/60 bg-white p-4',
    title: 'text-sm font-semibold text-navy',
    titleMargin: 'mb-3',
  },

  table: {
    wrapper: 'overflow-x-auto',
    headerCell:
      'px-2 py-2 text-[10px] uppercase tracking-wider text-muted-foreground font-medium sm:px-3',
    cell: 'px-2 py-2 text-xs sm:px-3',
    row: 'border-b border-border/30 last:border-0 hover:bg-muted/50',
    rowClickable:
      'border-b border-border/30 last:border-0 hover:bg-muted/50 cursor-pointer',
  },

  btn: {
    base: 'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors cursor-pointer',
    // Sizes
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-xs',
    lg: 'px-4 py-2 text-sm',
    // Variants
    primary: 'bg-primary text-white hover:bg-primary/90',
    secondary: 'border border-border bg-white text-navy hover:bg-muted',
    ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
    danger: 'bg-destructive text-white hover:bg-destructive/90',
    icon: 'rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground',
  },

  input: {
    base: 'h-8 w-full rounded-md border border-input bg-background px-2.5 text-base md:text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors',
    textarea: 'w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-base md:text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors',
    select: 'h-8 w-full appearance-none rounded-md border border-input bg-background px-2.5 text-base md:text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-colors cursor-pointer',
    checkbox: 'h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary',
    label: 'mb-1.5 block text-xs font-medium text-foreground',
    error: 'mt-0.5 text-[11px] text-destructive',
    group: 'space-y-1',
  },

  badge: {
    base: 'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
    primary: 'bg-primary/10 text-primary',
    success: 'bg-emerald-100 text-emerald-700',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-red-100 text-red-700',
    muted: 'bg-muted text-muted-foreground',
  },

  empty: {
    container: 'flex flex-col items-center justify-center py-10',
    icon: 'h-10 w-10 text-muted-foreground/50',
    title: 'mt-3 text-sm font-medium text-navy',
    description: 'mt-1 text-xs text-muted-foreground',
  },

  skeleton: {
    base: 'animate-pulse rounded bg-muted',
    line: 'h-4 animate-pulse rounded bg-muted',
    circle: 'animate-pulse rounded-full bg-muted',
  },

  text: {
    muted: 'text-xs text-muted-foreground',
    label:
      'text-[11px] font-medium uppercase tracking-wide text-muted-foreground',
    value: 'text-lg font-semibold text-navy',
    link: 'text-xs font-medium text-primary hover:text-primary/80',
  },
  modal: {
    backdrop: 'fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4',
    content: 'w-full rounded-xl bg-white shadow-xl',
    header: 'flex items-center justify-between border-b border-border px-5 py-4',
    title: 'font-display text-base font-semibold text-navy',
    body: 'p-5 space-y-4',
    footer: 'flex justify-end gap-2.5 border-t border-border px-5 py-3',
  },

  form: {
    grid: 'grid grid-cols-1 gap-3 sm:grid-cols-2',
    spacing: 'space-y-3',
    langTab: 'px-2 py-0.5 text-[11px] font-medium transition-colors',
    langTabActive: 'bg-navy text-white',
    langTabInactive: 'text-muted-foreground hover:text-foreground',
  },
} as const
