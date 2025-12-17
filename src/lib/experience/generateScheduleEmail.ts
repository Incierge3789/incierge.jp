export type Persona = 'tax_accountant' | 'labor_consultant' | 'administrative_scrivener' | 'judicial_scrivener' | 'professional_firms';

interface ScheduleEmailResult {
    subject: string;
    body: string;
}

const PERSONA_LABELS: Record<Persona, string> = {
    tax_accountant: '税理士',
    labor_consultant: '社会保険労務士',
    administrative_scrivener: '行政書士',
    judicial_scrivener: '司法書士',
    professional_firms: '専門家',
};

// Simple heuristics to extract date-like patterns
// Matches "12/20", "12月20日", "来週火曜" etc.
const DATE_PATTERN = /((?:\d{1,2}[\/／月]\d{1,2}(?:[日])?)|(?:来週|再来週|今週)?(?:月|火|水|木|金|土|日)曜日?|(?:\d{1,2}[:：]\d{2}))/g;

function extractDates(memo: string): string[] {
    const matches = memo.match(DATE_PATTERN);
    if (!matches) return [];
    // Deduplicate and filter noise
    return Array.from(new Set(matches)).filter(m => m.length > 1);
}

export function generateScheduleEmail(persona: Persona, memo: string): ScheduleEmailResult {
    const dates = extractDates(memo);
    const hasDates = dates.length > 0;

    // Format dates for email body
    const dateList = hasDates
        ? dates.map(d => `・${d} 〜`).join('\n')
        : `・${memo} (候補日をご教示ください)`;

    let subject = '';
    let greeting = '';
    let purpose = '';
    const closing = 'ご確認のほど、よろしくお願い申し上げます。';
    const sign = `--------------------------------------------------\n${PERSONA_LABELS[persona]}事務所\n担当：[担当者名]\n--------------------------------------------------`;

    switch (persona) {
        case 'tax_accountant':
            subject = '【ご相談】次回のお打ち合わせ日程につきまして';
            greeting = 'いつも大変お世話になっております。';
            purpose = '次回のお打ち合わせ（決算/月次報告）の日程調整をお願いしたく、ご連絡いたしました。';
            break;
        case 'labor_consultant':
            subject = '就業規則／お手続きに関するお打ち合わせ日程のご相談';
            greeting = '平素は労務管理におきまして大変お世話になっております。';
            purpose = '先日ご相談いただきました件につきまして、詳細のお打ち合わせをお願いしたく存じます。';
            break;
        case 'administrative_scrivener':
            subject = '【重要】許認可申請書類に関するお打ち合わせのお願い';
            greeting = 'いつもお世話になっております。';
            purpose = '申請書類の作成にあたりまして、一度ヒアリングのお時間をいただけますでしょうか。';
            break;
        case 'judicial_scrivener':
            subject = '登記手続きに関するご面談日程の調整';
            greeting = 'お世話になっております。';
            purpose = '登記のお手続きに関しまして、ご本人様確認および押印書類のご説明のため、ご面談のお時間を頂戴できればと存じます。';
            break;
        case 'professional_firms':
            subject = '【ご相談】お打ち合わせの日程調整につきまして';
            greeting = 'いつもお世話になっております。';
            purpose = 'ご依頼いただきました件につきまして、今後の進め方をご相談したく、お打ち合わせのお時間をいただけますでしょうか。';
            break;
    }

    const location = memo.includes('Zoom') || memo.includes('オンライン') ? 'オンライン（Zoom等）' :
        memo.includes('訪問') ? '貴社へのご訪問' :
            memo.includes('来所') ? '当事務所でのご面談' : 'オンライン（Zoom）またはご訪問';

    const body = `${greeting}\n\n${purpose}\n\n以下の日時などでご都合いかがでしょうか。\n\n【候補日時】\n${memo ? `（メモ: ${memo}）\n` : ''}${hasDates ? dateList : '・[候補日をご記入ください]'}\n\n【実施形式】\n${location}\n\nご多忙の折、恐縮ではございますが\n${closing}\n\n${sign}`;

    return { subject, body };
}
