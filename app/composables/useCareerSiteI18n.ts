// Minimal hand-rolled EN/AR dictionary + RTL toggle, scoped to /careers/*.
// No @nuxtjs/i18n dependency — the stack is deliberately small (CLAUDE.md),
// and this is the only page family that needs a second language today.

export type CareerSiteLocale = 'en' | 'ar'

const DICT = {
  nav_home: { en: 'Home', ar: 'الرئيسية' },
  nav_opportunities: { en: 'Opportunities', ar: 'الوظائف' },
  nav_for_employees: { en: 'For Employees', ar: 'للموظفين' },
  for_employees_sign_in: { en: 'Sign in as employee', ar: 'تسجيل الدخول كموظف' },
  nav_internal_opportunities: { en: 'Internal Opportunities', ar: 'الوظائف الداخلية' },
  nav_my_referrals: { en: 'My Referrals', ar: 'ترشيحاتي' },
  nav_logout: { en: 'Log out', ar: 'تسجيل الخروج' },

  hero_hiring_badge: { en: 'open roles', ar: 'وظيفة شاغرة' },
  hero_view_roles: { en: 'View open roles', ar: 'اطّلع على الوظائف' },
  section_opportunities: { en: 'Featured Jobs', ar: 'أبرز الوظائف' },
  section_found_positions: { en: 'Found {n} open positions', ar: 'تم العثور على {n} وظيفة شاغرة' },
  section_view_all: { en: 'View all', ar: 'عرض الكل' },
  section_values: { en: 'What we stand for', ar: 'قيمنا' },
  section_life_at: { en: 'Life at', ar: 'الحياة في' },
  section_from_team: { en: 'From the team', ar: 'آراء فريقنا' },

  filter_location: { en: 'Location', ar: 'الموقع' },
  filter_category: { en: 'Category', ar: 'التصنيف' },
  filter_type: { en: 'Type', ar: 'نوع التوظيف' },
  filter_career_level: { en: 'Career Level', ar: 'المستوى الوظيفي' },
  filter_job_type: { en: 'Job Type', ar: 'نوع الوظيفة' },
  filter_job_type_all: { en: 'All', ar: 'الكل' },
  filter_job_type_white: { en: 'White Collar', ar: 'وظائف إدارية' },
  filter_job_type_blue: { en: 'Blue Collar', ar: 'وظائف مهنية' },
  filter_choose_category: { en: 'Choose Category', ar: 'اختر التصنيف' },
  filter_choose_type: { en: 'Choose Type', ar: 'اختر النوع' },
  filter_choose_level: { en: 'Choose Career Level', ar: 'اختر المستوى الوظيفي' },
  filter_choose_location: { en: 'Choose Location', ar: 'اختر الموقع' },
  filter_search_placeholder: { en: 'Search for Job Title', ar: 'ابحث عن مسمى وظيفي' },
  filter_found_jobs: { en: 'Found {n} Jobs', ar: 'تم العثور على {n} وظيفة' },
  filter_no_results: { en: 'No jobs found matching your filters.', ar: 'لا توجد وظائف مطابقة لعوامل التصفية.' },

  employment_full_time: { en: 'Full-time', ar: 'دوام كامل' },
  employment_part_time: { en: 'Part-time', ar: 'دوام جزئي' },
  employment_freelance: { en: 'Freelance / Project', ar: 'عمل حر' },
  employment_shift: { en: 'Shift Based', ar: 'نظام ورديات' },
  employment_volunteering: { en: 'Volunteering', ar: 'تطوع' },
  employment_internship: { en: 'Internship', ar: 'تدريب' },

  job_apply: { en: 'Apply', ar: 'قدّم الآن' },
  job_view_details: { en: 'View Details', ar: 'عرض التفاصيل' },
  job_refer_someone: { en: 'Refer Someone', ar: 'رشّح شخصًا' },
  job_copy_referral_link: { en: 'Copy my referral link', ar: 'انسخ رابط الترشيح الخاص بي' },
  job_closed_title: { en: 'This position is no longer available.', ar: 'هذه الوظيفة لم تعد متاحة.' },
  job_closed_recommendations: { en: 'Open roles you might like', ar: 'وظائف مشابهة متاحة' },
  job_back: { en: 'Back', ar: 'رجوع' },
  job_description: { en: 'Job Description', ar: 'الوصف الوظيفي' },
  job_responsibilities: { en: 'Responsibilities', ar: 'المسؤوليات' },
  job_requirements: { en: 'Requirements', ar: 'المتطلبات' },

  general_app_cta: { en: "Can't find your desired job? Apply through General Application.", ar: 'لم تجد الوظيفة المناسبة؟ قدّم من خلال التقديم العام.' },
  general_app_cta_sub: { en: "Leave your CV with us — when a role that's right for you opens up, our team will reach out directly, even if it takes some time.", ar: 'اترك سيرتك الذاتية لدينا — وعندما تتوفر وظيفة مناسبة لك، سيتواصل فريقنا معك مباشرة، حتى لو استغرق الأمر بعض الوقت.' },
  general_app_apply_now: { en: 'Apply now', ar: 'قدّم الآن' },
  general_app_title: { en: 'General Application', ar: 'التقديم العام' },
  general_app_full_name: { en: 'Full Name', ar: 'الاسم الكامل' },
  general_app_email: { en: 'Email', ar: 'البريد الإلكتروني' },
  general_app_job_title: { en: 'Job Title', ar: 'المسمى الوظيفي' },
  general_app_cv: { en: 'CV', ar: 'السيرة الذاتية' },
  general_app_submit: { en: 'Submit application', ar: 'إرسال الطلب' },
  general_app_success: { en: 'Application submitted successfully.', ar: 'تم إرسال الطلب بنجاح.' },
  field_required: { en: 'This field is required', ar: 'هذا الحقل مطلوب' },
  field_invalid_email: { en: 'Please enter a valid email address.', ar: 'يرجى إدخال بريد إلكتروني صحيح.' },

  for_employees_title: { en: 'For Employees', ar: 'للموظفين' },
  for_employees_subtitle: { en: 'Access internal-only roles with your company email.', ar: 'الوصول إلى الوظائف الداخلية عبر بريدك الإلكتروني الخاص بالشركة.' },
  for_employees_send_link: { en: 'Send me a sign-in email', ar: 'أرسل لي رابط تسجيل الدخول' },
  for_employees_demo: { en: 'Demo as Employee', ar: 'دخول تجريبي كموظف' },
  for_employees_check_inbox: { en: 'Check your inbox — we sent you a sign-in link.', ar: 'تحقق من بريدك الإلكتروني — أرسلنا لك رابط تسجيل الدخول.' },
  for_employees_invalid_domain: { en: 'Please use your company email address to access this section.', ar: 'يرجى استخدام بريدك الإلكتروني الخاص بالشركة للوصول إلى هذا القسم.' },

  page_not_available: { en: 'This career page is currently unavailable.', ar: 'صفحة التوظيف هذه غير متاحة حاليًا.' },
  not_yet_live: { en: 'This career site has not been published yet.', ar: 'لم يتم نشر صفحة التوظيف هذه بعد.' },
} as const

export type CareerSiteKey = keyof typeof DICT

const locale = ref<CareerSiteLocale>('en')

if (import.meta.client) {
  const saved = window.localStorage.getItem('recruitera:careers_locale')
  if (saved === 'ar' || saved === 'en') locale.value = saved
}

export function useCareerSiteI18n() {
  const dir = computed(() => (locale.value === 'ar' ? 'rtl' : 'ltr'))

  function setLocale(l: CareerSiteLocale) {
    locale.value = l
    if (import.meta.client) window.localStorage.setItem('recruitera:careers_locale', l)
  }
  function toggleLocale() {
    setLocale(locale.value === 'en' ? 'ar' : 'en')
  }
  function t(key: CareerSiteKey, vars?: Record<string, string | number>) {
    let str: string = DICT[key][locale.value]
    if (vars) {
      for (const [k, v] of Object.entries(vars)) str = str.replace(`{${k}}`, String(v))
    }
    return str
  }

  return { locale: readonly(locale), dir, setLocale, toggleLocale, t }
}
