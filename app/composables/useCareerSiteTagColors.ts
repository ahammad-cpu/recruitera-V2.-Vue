// Distinct accent colors per employment type / collar so job tags read at a
// glance instead of all sharing one brand-color tint. Independent of the
// customer's configured brand colors on purpose — these are categorization
// tags, not brand surfaces.

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  'Full-time': '#16a34a',
  'Part-time': '#0891b2',
  'Freelance / Project': '#7c3aed',
  'Shift Based': '#d97706',
  'Volunteering': '#db2777',
  'Internship': '#4f46e5',
}

const COLLAR_COLORS: Record<'white' | 'blue', string> = {
  white: '#2563eb',
  blue: '#db2777',
}

export function employmentTypeColor(type: string | undefined | null, fallback: string) {
  return (type && EMPLOYMENT_TYPE_COLORS[type]) || fallback
}

export function collarColor(collar: 'white' | 'blue') {
  return COLLAR_COLORS[collar]
}
