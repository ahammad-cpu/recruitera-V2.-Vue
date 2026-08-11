import {
  UserCheck, Shirt, ThumbsUp, Briefcase, Clock, LayoutDashboard,
  Columns2, Tag, MapPin, FileText, Users as UsersIcon, HelpCircle,
  Ban, GraduationCap, Compass, CalendarClock, Award, Home as HomeIcon,
  User, UserCog, Mail, Building2, BriefcaseBusiness, ClipboardList,
  Copy, CalendarDays,
} from 'lucide-vue-next'
import type { Ref } from 'vue'
import type { FilterCatalogEntry } from '~/types/candidate-filter.types'

/**
 * Every filter the user can add. Keep alphabetised inside each group so search
 * finds them predictably. Adding a new filter = one entry here + type dispatch
 * in CandidatesFilters.vue.
 *
 * `assignedRecruiterOptions` is the one job-scoped exception — Smart
 * Distribute's "Assigned Recruiter" filter (E2) only exists inside a job
 * whose Auto-Distribute pool it can list, so the entry is only included
 * when a non-empty options list is passed in. Omit it (as
 * AddFilterPicker/CandidatesFilters both do on the global /candidates
 * page) and the catalog is exactly what it always was.
 */
export function useFilterRegistry(assignedRecruiterOptions?: Ref<{ value: string; label: string }[] | undefined>) {
  const catalog = computed<FilterCatalogEntry[]>(() => [
    // ── Assigned Recruiter (E2) — job-scoped, only present when supplied ──
    ...(assignedRecruiterOptions?.value?.length
      ? [{
          id: 'assigned-recruiter',
          name: 'Assigned recruiter',
          type: 'has-tag' as const,
          icon: UserCog,
          operators: [
            { value: 'is' as const, label: 'Assigned to' },
            { value: 'is-not' as const, label: 'Not assigned to' },
          ],
          options: [{ value: 'unassigned', label: 'Unassigned' }, ...assignedRecruiterOptions.value],
          chips: true,
        }]
      : []),

    // ── Candidate status (with Overdue per spec) ──
    {
      id: 'candidate-status',
      name: 'Candidate status',
      type: 'checkbox-multi',
      icon: UserCheck,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [
        { value: 'qualified',    label: 'Qualified' },
        { value: 'disqualified', label: 'Disqualified' },
        { value: 'new',          label: 'New' },
        { value: 'overdue',      label: 'Overdue', count: 0 },
      ],
    },
    {
      id: 'candidate-origin',
      name: 'Candidate origin',
      type: 'checkbox-multi',
      icon: Compass,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [
        { value: 'careers-site',   label: 'Careers site',   count: 0 },
        { value: 'email',          label: 'Email',          count: 0 },
        { value: 'added-manually', label: 'Added manually', count: 0 },
        { value: 'imported',       label: 'Imported',       count: 1 },
        { value: 'referred',       label: 'Referred',       count: 0 },
      ],
    },
    {
      id: 'job-status',
      name: 'Job status',
      type: 'checkbox-multi',
      icon: Clock,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [
        { value: 'published', label: 'Published', count: 2 },
        { value: 'internal',  label: 'Internal',  count: 0 },
        { value: 'closed',    label: 'Closed',    count: 0 },
        { value: 'archived',  label: 'Archived',  count: 0 },
      ],
    },
    {
      id: 'disqualification-type',
      name: 'Disqualification type',
      type: 'checkbox-multi',
      icon: Ban,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [
        { value: 'knockout',              label: 'Knockout question',     count: 1 },
        { value: 'disqualified-manually', label: 'Disqualified manually', count: 0 },
      ],
    },
    {
      id: 'hiring-status',
      name: 'Hiring status',
      type: 'checkbox-multi',
      icon: HomeIcon,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [
        { value: 'marked-as-hired',     label: 'Marked as hired',     count: 1 },
        { value: 'not-marked-as-hired', label: 'Not marked as hired', count: 16 },
      ],
    },
    {
      id: 'collar-type',
      name: 'Collar type',
      type: 'checkbox-multi',
      icon: Shirt,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [
        { value: 'white', label: 'White collar', count: 18 },
        { value: 'blue',  label: 'Blue collar',  count: 12 },
      ],
    },

    // ── Composite: checkbox-multi + date range ──
    {
      id: 'has-event-scheduled',
      name: 'Has event scheduled',
      type: 'event-scheduled',
      icon: CalendarClock,
      operators: [{ value: 'is', label: 'Is' }],
      options: [
        { value: 'on-site',  label: 'On-site interview' },
        { value: 'phone',    label: 'Phone interview' },
        { value: 'meeting',  label: 'Meeting' },
        { value: 'video',    label: 'Video interview' },
      ],
    },

    // ── has-tag (searchable dropdowns) ──
    {
      id: 'job',
      name: 'Job',
      type: 'has-tag',
      icon: Briefcase,
      operators: [
        { value: 'is',            label: 'In job' },
        { value: 'is-not',        label: 'Not in job' },
        { value: 'has-all-tags',  label: 'In all these jobs' },
      ],
      options: [],
    },
    {
      id: 'pipeline-stage',
      name: 'Stage',
      type: 'has-tag',
      icon: Columns2,
      operators: [
        { value: 'has-tag',     label: 'In stage' },
        { value: 'not-has-tag', label: 'Not in stage' },
      ],
      options: [],
    },
    {
      id: 'tag',
      name: 'Tag',
      type: 'has-tag',
      icon: Tag,
      operators: [
        { value: 'has-tag',      label: 'Has tag' },
        { value: 'not-has-tag',  label: 'Does not have tag' },
        { value: 'has-all-tags', label: 'Has all these tags' },
      ],
      options: [],
    },
    {
      id: 'source-tag',
      name: 'Source tag',
      type: 'has-tag',
      icon: Tag,
      operators: [
        { value: 'has-tag',      label: 'Has source tag' },
        { value: 'not-has-tag',  label: 'Does not have source tag' },
        { value: 'has-all-tags', label: 'Has all these source tags' },
      ],
      options: [
        { value: 'any',      label: 'Any source tags', count: 1 },
        { value: 'linkedin', label: 'LinkedIn',        count: 1 },
      ],
    },
    {
      id: 'talent-pool',
      name: 'Talent pool',
      type: 'has-tag',
      icon: UsersIcon,
      operators: [
        { value: 'has-tag',      label: 'In talent pool' },
        { value: 'not-has-tag',  label: 'Not in talent pool' },
        { value: 'has-all-tags', label: 'In all these talent pools' },
      ],
      options: [],
    },
    {
      id: 'work-location',
      name: 'Work location',
      type: 'has-tag',
      icon: MapPin,
      operators: [
        { value: 'has-tag',     label: 'In work location' },
        { value: 'not-has-tag', label: 'Not in work location' },
      ],
      options: [],
    },
    {
      id: 'added-by',
      name: 'Added by',
      type: 'has-tag',
      icon: User,
      operators: [
        { value: 'is',     label: 'Added by' },
        { value: 'is-not', label: 'Not added by' },
      ],
      options: [],
    },
    {
      id: 'evaluated-by',
      name: 'Evaluated by',
      type: 'has-tag',
      icon: UserCog,
      operators: [
        { value: 'is',     label: 'Evaluated by' },
        { value: 'is-not', label: 'Not evaluated by' },
      ],
      options: [],
    },
    {
      id: 'has-received-questionnaire',
      name: 'Has received questionnaire',
      type: 'has-tag',
      icon: Mail,
      operators: [
        { value: 'has-tag',     label: 'Has received questionnaire' },
        { value: 'not-has-tag', label: 'Has not received questionnaire' },
      ],
      options: [],
    },
    {
      id: 'has-filled-questionnaire',
      name: 'Has filled in questionnaire',
      type: 'has-tag',
      icon: ClipboardList,
      operators: [
        { value: 'has-tag',     label: 'Has filled in questionnaire' },
        { value: 'not-has-tag', label: 'Has not filled in questionnaire' },
      ],
      options: [],
    },
    {
      id: 'answered-question',
      name: 'Answered question',
      type: 'has-tag',
      icon: HelpCircle,
      operators: [
        { value: 'has-tag',     label: 'Answered question' },
        { value: 'not-has-tag', label: 'Has not answered question' },
      ],
      options: [],
    },
    {
      id: 'screening-question',
      name: 'Screening question',
      type: 'has-tag',
      icon: HelpCircle,
      operators: [
        { value: 'has-tag',     label: 'Answered' },
        { value: 'not-has-tag', label: 'Not answered' },
      ],
      options: [],
    },

    // ── has-dropdown (single-select operator, single input) ──
    {
      id: 'disqualify-reason',
      name: 'Disqualify reason',
      type: 'has-dropdown',
      icon: Ban,
      operators: [
        { value: 'is',     label: 'Disqualify reason is' },
        { value: 'is-not', label: 'Disqualify reason is not' },
      ],
      options: [
        { value: 'any',               label: 'Any disqualify reason', count: 1 },
        { value: 'lack-of-knowledge', label: 'Lack of knowledge',     count: 1 },
      ],
    },

    // ── number-range ──
    {
      id: 'screening-score',
      name: 'Screening score',
      type: 'number-range',
      icon: Award,
      operators: [{ value: 'between', label: 'Is between' }],
    },
    {
      id: 'evaluation-score',
      name: 'Evaluation score',
      type: 'number-range',
      icon: ThumbsUp,
      operators: [{ value: 'between', label: 'Is between' }],
    },
    {
      id: 'average-evaluation-score',
      name: 'Average evaluation score',
      type: 'number-range',
      icon: ThumbsUp,
      operators: [{ value: 'between', label: 'Is between' }],
    },

    // ── text-contains ──
    {
      id: 'education',
      name: 'Education experience',
      type: 'text-contains',
      icon: GraduationCap,
      operators: [
        { value: 'school-contains',      label: 'School name contains' },
        { value: 'school-not-contains',  label: 'School name does not contain' },
        { value: 'degree-contains',      label: 'Degree contains' },
        { value: 'degree-not-contains',  label: 'Degree does not contain' },
        { value: 'subject-contains',     label: 'Degree subject contains' },
        { value: 'subject-not-contains', label: 'Degree subject does not contain' },
      ],
    },
    {
      id: 'company-name',
      name: 'Company name',
      type: 'text-contains',
      icon: Building2,
      operators: [
        { value: 'contains',     label: 'Company name contains' },
        { value: 'not-contains', label: 'Company name does not contain' },
      ],
    },
    {
      id: 'job-title',
      name: 'Job title',
      type: 'text-contains',
      icon: BriefcaseBusiness,
      operators: [
        { value: 'contains',     label: 'Job title contains' },
        { value: 'not-contains', label: 'Job title does not contain' },
      ],
    },

    // ── date-range ──
    {
      id: 'hire-date',
      name: 'Hire date',
      type: 'date-range',
      icon: CalendarClock,
      operators: [{ value: 'is-in-range', label: 'Is in range' }],
    },
    {
      id: 'start-date',
      name: 'Start date',
      type: 'date-range',
      icon: CalendarClock,
      operators: [{ value: 'is-in-range', label: 'Is in range' }],
    },
    {
      id: 'date-created',
      name: 'Date created',
      type: 'date-range',
      icon: CalendarDays,
      operators: [{ value: 'is-in-range', label: 'Is in range' }],
    },

    // ── radio (one-of-two) ──
    {
      id: 'cv-or-resume',
      name: 'CV or resume',
      type: 'radio',
      icon: FileText,
      operators: [{ value: 'has', label: 'Presence' }],
      options: [
        { value: 'has',     label: 'Has CV or resume' },
        { value: 'not-has', label: 'Does not have a CV or resume' },
      ],
    },
    {
      id: 'similar-profiles',
      name: 'Similar profiles',
      type: 'radio',
      icon: Copy,
      operators: [{ value: 'matches', label: 'Matching' }],
      options: [
        { value: 'matches',     label: 'Matching data' },
        { value: 'not-matches', label: 'Not matching data' },
      ],
    },

    // ── Job department (has-tag) ──
    {
      id: 'job-department',
      name: 'Job department',
      type: 'has-tag',
      icon: LayoutDashboard,
      operators: [{ value: 'is', label: 'Is' }, { value: 'is-not', label: 'Is not' }],
      options: [],
    },
  ])

  function get(id: string): FilterCatalogEntry | undefined {
    return catalog.value.find(f => f.id === id)
  }

  return { catalog, get }
}
