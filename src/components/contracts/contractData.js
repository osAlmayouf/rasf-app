import { Coins, ListChecks, Clock, FileText, Megaphone, AlertTriangle } from 'lucide-react';
import { ASAR_CONTRACT_SUMMARY } from '../../data/asarContract';
import { INSPIRE_CONTRACT_SUMMARY } from '../../data/inspireContract';

// لون ثانوي على الهوية للرسوم
export const BRAND_SECONDARY = '#8A6D51';

// أقسام ملخص العقد (مطابقة لنموذج ملخص عقود الصناديق)
export const SECTIONS = [
  { key: 'shares',      label: 'الحصص',        icon: Coins },
  { key: 'obligations', label: 'الالتزامات',    icon: ListChecks, ordered: true },
  { key: 'durations',   label: 'المدد',         icon: Clock },
  { key: 'reports',     label: 'التقارير',      icon: FileText },
  { key: 'marketing',   label: 'التسويق',       icon: Megaphone },
  { key: 'penalties',   label: 'غرامات التأخير', icon: AlertTriangle },
];

export const BLANK = { fundManager: '', responsibleMgmt: '', shares: '', obligations: '', durations: '', reports: '', marketing: '', penalties: '' };

export const lines = (s) => (s ?? '').split('\n').map(l => l.trim()).filter(Boolean);

// تجربة: ملخصات جاهزة تظهر حسب اسم/معرّف المشروع ما لم يُحفظ له ملخص بعد
const PREFILL_MATCHERS = [
  { re: /asar|اسار|أسار|آسار/i,     data: ASAR_CONTRACT_SUMMARY },
  { re: /inspire|انسباير|إنسباير/i,  data: INSPIRE_CONTRACT_SUMMARY },
];

export const resolveSummary = (project) => {
  if (project.contractSummary) return project.contractSummary;
  const hay = `${project?.name ?? ''} ${project?.id ?? ''}`;
  return PREFILL_MATCHERS.find(m => m.re.test(hay))?.data ?? BLANK;
};

export const summaryHasContent = (s) => !!s && Object.values(s).some(v => v && String(v).trim());
export const hasContractSummary = (project) => summaryHasContent(resolveSummary(project));
