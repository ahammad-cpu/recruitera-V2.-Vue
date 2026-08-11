/** Client-side CSV download — every report section's "Export CSV" button and
 * the drill-down popup's export icon both go through this one helper. */
export function exportToCsv(filename: string, rows: Record<string, string | number | null | undefined>[]) {
  if (!rows.length) return
  const headers = Object.keys(rows[0]!)
  const escape = (v: unknown) => {
    const s = v == null ? '' : String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(','), ...rows.map(r => headers.map(h => escape(r[h])).join(','))]
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** BRD §2.9: every export is labeled with section name + date range + export timestamp. */
export function csvFilename(sectionName: string, dateRangeLabel: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  return `${sectionName.toLowerCase().replace(/\s+/g, '-')}_${dateRangeLabel.toLowerCase().replace(/\s+/g, '-')}_${stamp}.csv`
}
