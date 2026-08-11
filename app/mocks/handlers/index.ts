import { candidatesHandlers } from './candidates.handlers'
import { companyHandlers } from './company.handlers'
import { locationsHandlers } from './locations.handlers'
import { departmentsHandlers } from './departments.handlers'
import { jobTitlesHandlers } from './job-titles.handlers'
import { blocklistHandlers } from './blocklist.handlers'
import { templatesHandlers } from './templates.handlers'
import { tagsHandlers } from './tags.handlers'
import { publicLinksHandlers } from './public-links.handlers'
import { applicationFormsHandlers } from './application-forms.handlers'
import { evaluationFormsHandlers } from './evaluation-forms.handlers'
import { questionnaireFormsHandlers } from './questionnaire-forms.handlers'
import { benefitsTemplatesHandlers } from './benefits-templates.handlers'
import { pipelineTemplatesHandlers } from './pipeline-templates.handlers'
import { whatsappTemplatesHandlers } from './whatsapp-templates.handlers'
import { jobTemplatesHandlers } from './job-templates.handlers'
import { referralQuestionsHandlers } from './referral-questions.handlers'
import { offerTemplatesHandlers } from './offer-templates.handlers'
import { teamHandlers } from './team.handlers'
import { dashboardHandlers } from './dashboard.handlers'
import { talentPoolsHandlers } from './talent-pools.handlers'
import { smartDistributeHandlers } from './smart-distribute.handlers'
import { reportsHandlers } from './reports.handlers'
import { stubHandlers } from './stub.handlers'

export const handlers = [
  ...candidatesHandlers,
  ...companyHandlers,
  ...locationsHandlers,
  ...departmentsHandlers,
  ...jobTitlesHandlers,
  ...blocklistHandlers,
  ...templatesHandlers,
  ...tagsHandlers,
  ...publicLinksHandlers,
  ...applicationFormsHandlers,
  ...evaluationFormsHandlers,
  ...questionnaireFormsHandlers,
  ...benefitsTemplatesHandlers,
  ...pipelineTemplatesHandlers,
  ...whatsappTemplatesHandlers,
  ...jobTemplatesHandlers,
  ...referralQuestionsHandlers,
  ...offerTemplatesHandlers,
  ...teamHandlers,
  ...dashboardHandlers,
  ...talentPoolsHandlers,
  ...smartDistributeHandlers,
  ...reportsHandlers,
  ...stubHandlers,
]
