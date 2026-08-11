// Categorical series palette for Reports charts — brand tokens only (no hex),
// reused across line/bar/donut/funnel so a given source/stage/status reads
// the same color in every chart it appears in.
export const CHART_PALETTE = [
  'var(--brand-teal-secondary)',
  'var(--brand-avatar-4)',
  'var(--brand-status-orange)',
  'var(--brand-avatar-5)',
  'var(--brand-danger)',
  'var(--brand-olive)',
  'var(--brand-avatar-6)',
  'var(--brand-status-gray)',
]

export function paletteColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length]!
}
