/**
 * Filter type system for the Candidates page.
 *
 * Each filter kind = one type discriminator + one operator + a value shape.
 * Adding a new filter type means:
 *   1. add a `FilterType` case
 *   2. add its `FilterOperator` string(s)
 *   3. add its value shape to `FilterValue`
 *   4. add a case to CandidatesFilters.vue's dynamic renderer
 */

export type FilterType =
  | 'checkbox-multi'      // Candidate origin, Candidate status, etc.
  | 'has-tag'             // Source tag, Tag — has / doesn't have / has all these
  | 'number-range'        // Screening score (Min-Max)
  | 'text-contains'       // Education / Company / Job title (contains + variants)
  | 'date-range'          // Hire date, Start date, Date created
  | 'has-dropdown'        // Disqualify reason (single-tag has/is dropdown)
  | 'radio'               // CV or resume, Similar profiles
  | 'event-scheduled'     // Composite: checkbox-multi + date range in one panel

export type FilterOperator =
  // checkbox-multi
  | 'is' | 'is-not'
  // has-tag
  | 'has-tag' | 'not-has-tag' | 'has-all-tags'
  // number-range
  | 'between'
  // text-contains
  | 'contains' | 'not-contains'
  | 'school-contains' | 'school-not-contains'
  | 'degree-contains' | 'degree-not-contains'
  | 'subject-contains' | 'subject-not-contains'
  // date-range
  | 'is-before' | 'is-after' | 'is-between' | 'is-in-range'
  // radio (one-of-two)
  | 'has' | 'not-has'
  | 'matches' | 'not-matches'

export interface FilterCatalogEntry {
  id: string                    // stable filter id
  name: string
  type: FilterType
  icon: unknown                 // lucide component (unknown = kept opaque)
  operators: { value: FilterOperator; label: string }[]
  /** Static option list for checkbox-multi and dropdown filters. */
  options?: { value: string; label: string; count?: number }[]
  /** has-tag only: show a checkbox per option and render selections as
   * removable chips in the trigger instead of a comma-joined label list —
   * opt-in per entry so filters like Job/Stage/Tag keep their current look. */
  chips?: boolean
}

export interface ActiveFilter {
  id: string
  op: FilterOperator
  values?: string[]             // checkbox-multi / has-tag
  range?: { min?: number; max?: number }
  text?: string
  date?: { from?: string; to?: string; preset?: string }
}
