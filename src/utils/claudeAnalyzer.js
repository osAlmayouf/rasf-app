import * as XLSX from 'xlsx';
import Anthropic from '@anthropic-ai/sdk';

const MAX_CHARS = 60_000;

function excelToText(file) {
  return file.arrayBuffer().then(buf => {
    const wb = XLSX.read(buf, { type: 'array' });
    let text = '';
    for (const sheetName of wb.SheetNames) {
      const csv = XLSX.utils.sheet_to_csv(wb.Sheets[sheetName]);
      if (csv.trim().length === 0) continue;
      text += `\n=== ورقة: ${sheetName} ===\n${csv}\n`;
    }
    return text.slice(0, MAX_CHARS);
  });
}

const PROMPT = (text) => `أنت محلل مالي متخصص في دراسات جدوى العقارات السعودية.
استخرج البيانات الرئيسية من الدراسة المالية التالية وأعدها كـ JSON فقط بدون أي نص إضافي قبله أو بعده.

القواعد:
- القيم الرقمية بدون علامة % أو وحدات
- investmentM و totalRevenue بوحدة المليون ريال (اقسم على مليون إذا كانت القيمة بالريال)
- إذا لم تجد قيمة، ضع null
- status: "planning" أو "financing" أو "active" أو "completed"
- deliveryDate: بصيغة "Q2 2027" أو سنة فقط "2027"

الصيغة المطلوبة:
{
  "location": "اسم المدينة أو الحي",
  "investmentM": 850,
  "totalRevenue": 1134,
  "irr": 33.0,
  "roi": 71.0,
  "roeAnnual": 30.3,
  "deliveryDate": "Q3 2026",
  "status": "financing"
}

محتوى الدراسة:
${text}`;

export async function analyzeWithClaude(file) {
  const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('VITE_ANTHROPIC_API_KEY غير محدد في ملف .env');

  const text = await excelToText(file);
  if (!text.trim()) throw new Error('الملف فارغ أو لا يحتوي على بيانات');

  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

  const response = await client.messages.create({
    model: 'claude-opus-4-7',
    max_tokens: 1024,
    messages: [{ role: 'user', content: PROMPT(text) }],
  });

  const raw = response.content[0]?.text ?? '';

  // Extract JSON block even if Claude adds surrounding text
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('لم يتمكن Claude من استخراج البيانات');

  const parsed = JSON.parse(match[0]);

  const toPercent = (n) => {
    if (n == null) return null;
    const pct = n > 0 && n <= 1 ? n * 100 : n;
    return pct > 0 && pct < 500 ? parseFloat(pct.toFixed(2)) : null;
  };

  return {
    location:     parsed.location     ?? null,
    investmentM:  parsed.investmentM  ?? null,
    totalRevenue: parsed.totalRevenue ?? null,
    irr:          toPercent(parsed.irr)          ?? null,
    roi:          toPercent(parsed.roi)          ?? null,
    roeAnnual:    toPercent(parsed.roeAnnual)    ?? null,
    deliveryDate: parsed.deliveryDate ?? null,
    status:       parsed.status       ?? null,
    rawHits:      Object.entries(parsed)
                    .filter(([, v]) => v != null)
                    .map(([k, v]) => ({ field: k, value: String(v) })),
  };
}
