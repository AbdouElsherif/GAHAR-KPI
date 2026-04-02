import * as XLSX from 'xlsx';
import { egyptGovernorates } from '@/constants/departments';
import {
    saveTechnicalClinicalFacility,
    saveTechnicalClinicalObservation,
    saveTechnicalClinicalCorrectionRate,
    saveAccreditationFacility,
    saveCompletionFacility,
    savePaymentFacility,
    savePaidFacility,
    saveMedicalProfessionalRegistration,
    saveCommitteePreparationFacility,
    saveCertificateIssuanceFacility,
    saveCorrectivePlanFacility,
    saveBasicRequirementsFacility,
    saveAppealsFacility,
    saveAdminAuditFacility,
} from '@/lib/firestore';

// ============================================================
// Column Definition Types
// ============================================================

export interface ColumnDefinition {
    /** Arabic column header in the Excel file */
    header: string;
    /** Firestore field name */
    field: string;
    /** Is this column required? */
    required: boolean;
    /** Data type for validation */
    type: 'string' | 'number' | 'month' | 'date' | 'percentage';
    /** Valid values (for dropdowns) */
    validValues?: string[];
    /** Default value if empty */
    defaultValue?: string | number;
}

export interface SectionDefinition {
    /** Section display name in Arabic */
    name: string;
    /** Firestore collection name */
    collection: string;
    /** Column definitions */
    columns: ColumnDefinition[];
    /** Save function reference name */
    saveFnName: string;
}

export interface ImportValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    data: Record<string, any>[];
    totalRows: number;
}

// ============================================================
// Section Definitions for dept4 (الرقابة الفنية والإكلينيكية)
// ============================================================

// Section 1 Dropdowns
const section1FacilityTypes = [
    'مستشفى', 'صيدلية', 'مراكز الرعاية الأولية', 'معمل', 'مركز أشعة', 
    'مراكز طبية', 'مستشفى صحة نفسية', 'عيادات طبية', 'مراكز علاج طبيعي'
];

// Section 2 Dropdowns
const section2EntityTypes = [
    'المنشآت الصحية التابعة لهيئة الرعاية الصحية',
    'منشآت تابعة لوزارة الصحة',
    'منشآت تابعة لجهات أخرى'
];
const section2FacilityTypes = [
    'مراكز ووحدات الرعاية الأولية', 'مستشفيات', 'مراكز طبية', 'معامل', 
    'مراكز الأشعة', 'مراكز علاج طبيعي', 'مستشفيات صحة نفسية', 'صيدليات'
];

// Section 3 Dropdowns
const section3EntityTypes = [
    'المنشآت الصحية التابعة لهيئة الرعاية',
    'المنشآت الصحية التابعة لوزارة الصحة',
    'منشآت صحية أخرى'
];
const section3FacilityCategories = [
    'مراكز ووحدات الرعاية الأولية', 'مستشفى', 'صيدلية', 'معمل',
    'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية',
    'مستشفى صحة نفسية'
];

const technicalClinicalVisitTypes = [
    'التدقيق الفني والإكلينيكي',
    'التقييم الفني والإكلينيكي'
];

const technicalClinicalCorrectionVisitTypes = [
    'تقييم فني وإكلينيكي',
    'تدقيق فني وإكلينيكي'
];

// Correction rate standard codes for dept4
const tcStandardCodes = [
    'act', 'icd', 'das', 'mms', 'sip', 'ipc', 'scm', 'tex', 'teq', 'tpo',
    'nsr', 'sas', 'irs', 'mrs', 'cps', 'lpr', 'lep', 'lpo', 'lqc', 'css'
];

const tcStandardNames: Record<string, string> = {
    act: 'ACT', icd: 'ICD', das: 'DAS', mms: 'MMS', sip: 'SIP',
    ipc: 'IPC', scm: 'SCM', tex: 'TEX', teq: 'TEQ', tpo: 'TPO',
    nsr: 'NSR', sas: 'SAS', irs: 'IRS', mrs: 'MRS', cps: 'CPS',
    lpr: 'LPR', lep: 'LEP', lpo: 'LPO', lqc: 'LQC', css: 'CSS'
};

// Build correction rate columns dynamically
const buildCorrectionRateColumns = (): ColumnDefinition[] => {
    const baseColumns: ColumnDefinition[] = [
        { header: 'الشهر', field: 'month', required: true, type: 'month' },
        { header: 'الجهة', field: 'entityType', required: true, type: 'string', validValues: section3EntityTypes },
        { header: 'الفئة', field: 'facilityCategory', required: true, type: 'string', validValues: section3FacilityCategories },
        { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
        { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
        { header: 'تاريخ الزيارة', field: 'visitDate', required: true, type: 'date' },
        { header: 'نوع الزيارة', field: 'visitType', required: true, type: 'string', validValues: technicalClinicalCorrectionVisitTypes },
    ];

    const standardColumns: ColumnDefinition[] = [];
    for (const code of tcStandardCodes) {
        const name = tcStandardNames[code];
        standardColumns.push(
            { header: `${name} - الواردة`, field: `${code}Total`, required: false, type: 'number', defaultValue: 0 },
            { header: `${name} - المصححة`, field: `${code}Corrected`, required: false, type: 'number', defaultValue: 0 }
        );
    }

    return [...baseColumns, ...standardColumns];
};

export const dept4Sections: Record<string, SectionDefinition> = {
    'technical_clinical_facilities': {
        name: '🏥 المنشآت التي تم زيارتها',
        collection: 'technical_clinical_facilities',
        saveFnName: 'saveTechnicalClinicalFacility',
        columns: [
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
            { header: 'نوع المنشأة', field: 'facilityType', required: true, type: 'string', validValues: section1FacilityTypes },
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'الجهة الحاكمة', field: 'governingAuthority', required: true, type: 'string', validValues: [
                'هيئة الرعاية الصحية', 'وزارة الصحة', 'قطاع خاص',
                'الهيئة العامة للمستشفيات والمعاهد التعليمية', 'هيئة قناة السويس',
                'جامعية', 'جمعيات أهلية', 'أمانة المراكز الطبية المتخصصة',
                'الهيئة العامة للتأمين الصحي', 'الهيئة القومية لسكك حديد مصر',
                'قطاع أعمال', 'وزارة الداخلية قطاع الخدمات الطبية',
                'القوات المسلحة', 'جهات سيادية'
            ] },
            { header: 'نوع الزيارة', field: 'visitType', required: true, type: 'string', validValues: technicalClinicalVisitTypes },
            { header: 'نوع التقييم', field: 'assessmentType', required: false, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
        ]
    },
    'technical_clinical_observations': {
        name: '📋 الملاحظات المتكررة',
        collection: 'technical_clinical_observations',
        saveFnName: 'saveTechnicalClinicalObservation',
        columns: [
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
            { header: 'الجهة التابعة', field: 'entityType', required: true, type: 'string', validValues: section2EntityTypes },
            { header: 'نوع المنشأة', field: 'facilityType', required: true, type: 'string', validValues: section2FacilityTypes },
            { header: 'الملاحظة', field: 'observation', required: true, type: 'string' },
            { header: 'النسبة (%)', field: 'percentage', required: true, type: 'percentage' },
        ]
    },
    'technical_clinical_correction_rates': {
        name: '📊 نسب تصحيح الملاحظات',
        collection: 'technical_clinical_correction_rates',
        saveFnName: 'saveTechnicalClinicalCorrectionRate',
        columns: buildCorrectionRateColumns()
    }
};

// ============================================================
// Section Definitions for dept6 (الإدارة العامة للاعتماد والتسجيل)
// ============================================================

const dept6AffiliationOptions = [
    'هيئة الرعاية الصحية', 'وزارة الصحة', 'قطاع خاص', 'القوات المسلحة',
    'جمعيات أهلية', 'هيئة قناة السويس', 'جامعي',
    'وزارة الداخلية قطاع الخدمات الطبية', 'قطاع أعمال', 'حكومي',
    'الهيئة العامة للمستشفيات والمعاهد التعليمية',
    'الهيئة القومية لسكك حديد مصر',
    'الهيئة العامة للتأمين الصحي',
    'أمانة المراكز الطبية المتخصصة', 'جهات سيادية'
];

const dept6Section1AccreditationStatus = [
    'منشأة جديدة', 'تجديد / استكمال اعتماد'
];

const dept6Section1Standards = [
    'معايير اعتماد المستشفيات', 'الاعتماد المبدئي للمستشفيات',
    'معايير اعتماد مراكز ووحدات الرعاية الأولية',
    'الاعتماد المبدئي لمراكز ووحدات الرعاية الأولية',
    'معايير اعتماد معامل التحاليل الطبية',
    'معايير اعتماد مستشفيات الصحة النفسية',
    'معايير اعتماد مراكز الاشعة التشخيصية والعلاجية',
    'معايير اعتماد مراكز جراحات اليوم الواحد',
    'معايير اعتماد العيادات المجمعة',
    'معايير اعتماد مراكز الغسيل الكلوي',
    'معايير اعتماد مركز الاسنان',
    'معايير اعتماد العيادات الخاصة/ الأسنان',
    'معايير اعتماد الصيدليات العامة',
    'معايير اعتماد التميز الأخضر',
    'معايير اعتماد العلاج الطبيعي',
    'معايير دور النقاهة ومنشآت الرعاية الصحية الممتدة',
    'معايير منشآت الاستشفاء الطبي',
    'لم يتم التحديد'
];

const dept6Section3AccreditationStatus = [
    'منشأة جديدة', 'تجديد اعتماد / اعتماد مبدئي'
];

const dept6Section4AccreditationStatus = [
    'اعتماد مبدئي', 'تجديد اعتماد مبدئي',
    'اعتماد بعد اعتماد مبدئي', 'اعتماد', 'تجديد اعتماد'
];

const dept6Section5AccreditationStatus = [
    'منشأة جديدة', 'تجديد / اعتماد واعتماد مبدئي'
];

const dept6Section6AccreditationStatus = [
    'منشأة جديدة', 'تجديد الاعتماد',
    'استكمال الاعتماد واعتماد مبدئي', 'فرصة ثانية'
];

const dept6Section7AccreditationStatus = [
    'منشأة جديدة', 'تجديد / اعتماد واعتماد مبدئي'
];

export const dept6Sections: Record<string, SectionDefinition> = {
    'accreditation_facilities': {
        name: '📋 المنشآت المتقدمة خلال الشهر',
        collection: 'accreditation_facilities',
        saveFnName: 'saveAccreditationFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'التبعية', field: 'affiliation', required: true, type: 'string', validValues: dept6AffiliationOptions },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section1AccreditationStatus },
            { header: 'المعايير', field: 'standards', required: false, type: 'string', validValues: dept6Section1Standards },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'completion_facilities': {
        name: '📋 مرحلة استكمال الطلب',
        collection: 'completion_facilities',
        saveFnName: 'saveCompletionFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section1AccreditationStatus },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'payment_facilities': {
        name: '💰 جاري سداد رسوم الزيارة التقييمية',
        collection: 'payment_facilities',
        saveFnName: 'savePaymentFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section3AccreditationStatus },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'paid_facilities': {
        name: '✅ المنشآت التي قامت بسداد رسوم الزيارة',
        collection: 'paid_facilities',
        saveFnName: 'savePaidFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section4AccreditationStatus },
            { header: 'القيمة المالية', field: 'amount', required: true, type: 'number' },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'medical_professional_registrations': {
        name: '👨‍⚕️ التحويل إلى مرحلة تسجيل عضو مهن طبية',
        collection: 'medical_professional_registrations',
        saveFnName: 'saveMedicalProfessionalRegistration',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section5AccreditationStatus },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'committee_preparation_facilities': {
        name: '📋 التجهيز للعرض على اللجنة',
        collection: 'committee_preparation_facilities',
        saveFnName: 'saveCommitteePreparationFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section6AccreditationStatus },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'certificate_issuance_facilities': {
        name: '🎓 إصدار الشهادات',
        collection: 'certificate_issuance_facilities',
        saveFnName: 'saveCertificateIssuanceFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'حالة الاعتماد', field: 'accreditationStatus', required: true, type: 'string', validValues: dept6Section7AccreditationStatus },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'corrective_plan_facilities': {
        name: '📋 متابعة الخطط التصحيحية',
        collection: 'corrective_plan_facilities',
        saveFnName: 'saveCorrectivePlanFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'basic_requirements_facilities': {
        name: '📝 متابعة استكمال المتطلبات الأساسية',
        collection: 'basic_requirements_facilities',
        saveFnName: 'saveBasicRequirementsFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
    'appeals_facilities': {
        name: '📋 دراسة الالتماسات',
        collection: 'appeals_facilities',
        saveFnName: 'saveAppealsFacility',
        columns: [
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    },
};

// ============================================================
// Section Definitions for dept5 (الإدارة العامة للرقابة الإدارية على المنشآت الصحية)
// ============================================================

const dept5FacilityTypes = [
    'مستشفى', 'صيدلية', 'مراكز الرعاية الأولية', 'معمل', 'مركز أشعة', 
    'مراكز طبية', 'مستشفى صحة نفسية', 'عيادات طبية', 'مراكز علاج طبيعي'
];

const dept5AffiliationOptions = [
    'هيئة الرعاية الصحية', 'وزارة الصحة', 'قطاع خاص', 'القوات المسلحة',
    'جمعيات أهلية', 'هيئة قناة السويس', 'جامعي',
    'وزار الداخلية قطاع الخدمات الطبية', 'قطاع أعمال', 'حكومي',
    'الهيئة العامة للمستشفيات والمعاهد التعليمية',
    'الهيئة القومية لسكك حديد مصر',
    'الهيئة العامة للتأمين الصحي',
    'أمانة المراكز الطبية المتخصصة', 'جهات سيادية'
];

const dept5VisitTypes = [
    'زيارة متابعة', 'تفتيش إداري', 'تدقيق إداري وسلامة بيئية', 
    'متابعة خطة تصحيحية لحدث جسيم', 'فحص شكوى - إحالة', 
    'تخطيط صحي', 'تدقيق على السلامة البيئية', 'فحص حدث جسيم'
];

export const dept5Sections: Record<string, SectionDefinition> = {
    'admin_audit_facilities': {
        name: '🏥 منشآت الرقابة الإدارية',
        collection: 'admin_audit_facilities',
        saveFnName: 'saveAdminAuditFacility',
        columns: [
            { header: 'نوع المنشأة', field: 'facilityType', required: true, type: 'string', validValues: dept5FacilityTypes },
            { header: 'اسم المنشأة', field: 'facilityName', required: true, type: 'string' },
            { header: 'التبعية', field: 'affiliation', required: true, type: 'string', validValues: dept5AffiliationOptions },
            { header: 'نوع الزيارة', field: 'visitType', required: true, type: 'string', validValues: dept5VisitTypes },
            { header: 'المحافظة', field: 'governorate', required: true, type: 'string', validValues: egyptGovernorates },
            { header: 'الشهر', field: 'month', required: true, type: 'month' },
        ]
    }
};

// ============================================================
// All sections registry (will grow as we add more departments)
// ============================================================

export const allSectionDefinitions: Record<string, Record<string, SectionDefinition>> = {
    'dept4': dept4Sections,
    'dept5': dept5Sections,
    'dept6': dept6Sections,
};

// ============================================================
// Excel Reading & Validation Functions
// ============================================================

/**
 * Reads an Excel file and returns raw data from the first sheet
 */
export const readExcelFile = (file: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });
                resolve(jsonData as any[][]);
            } catch (error) {
                reject(new Error('فشل في قراءة ملف Excel. تأكد من صحة الملف.'));
            }
        };
        reader.onerror = () => reject(new Error('فشل في قراءة الملف.'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Normalizes an Arabic string for comparison (removes extra spaces, normalizes alef/taa)
 */
const normalizeArabic = (str: string): string => {
    return str
        .trim()
        .replace(/\s+/g, ' ')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[٪%]/g, '')
        .replace(/[()（）]/g, '')
        .toLowerCase();
};

/**
 * Deep normalize for fuzzy Arabic matching: strips definite article, common suffixes
 */
const deepNormalizeArabic = (str: string): string => {
    let normalized = normalizeArabic(str);
    // Remove definite article ال
    normalized = normalized.replace(/^ال/g, '').replace(/ ال/g, ' ');
    // Remove common plural suffixes for better matching
    normalized = normalized.replace(/ات$/g, '').replace(/ون$/g, '').replace(/ين$/g, '');
    return normalized.trim();
};

/**
 * Try to parse a cell value as YYYY-MM month format
 * Handles: YYYY-MM, YYYY/MM, MM/YYYY, M/YYYY, Excel date serials, full dates
 */
const parseMonthValue = (cellValue: string): string | null => {
    // Already correct format
    if (/^\d{4}-\d{2}$/.test(cellValue)) return cellValue;

    // YYYY/MM or YYYY-M
    let match = cellValue.match(/^(\d{4})[\-/](\d{1,2})$/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}`;

    // MM/YYYY or M/YYYY
    match = cellValue.match(/^(\d{1,2})[\-/](\d{4})$/);
    if (match) return `${match[2]}-${match[1].padStart(2, '0')}`;

    // Full date: YYYY-MM-DD or DD/MM/YYYY or MM/DD/YYYY
    match = cellValue.match(/^(\d{4})[\-/](\d{1,2})[\-/](\d{1,2})$/);
    if (match) return `${match[1]}-${match[2].padStart(2, '0')}`;

    match = cellValue.match(/^(\d{1,2})[\-/](\d{1,2})[\-/](\d{4})$/);
    if (match) return `${match[3]}-${match[2].padStart(2, '0')}`;

    // Excel date serial number (a plain number like 45717)
    const num = parseFloat(cellValue);
    if (!isNaN(num) && num > 30000 && num < 100000) {
        // Convert Excel serial to JS date
        const excelEpoch = new Date(1899, 11, 30);
        const jsDate = new Date(excelEpoch.getTime() + num * 86400000);
        const y = jsDate.getFullYear();
        const m = (jsDate.getMonth() + 1).toString().padStart(2, '0');
        return `${y}-${m}`;
    }

    // Try Date.parse as last resort
    const parsed = new Date(cellValue);
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 2000) {
        const y = parsed.getFullYear();
        const m = (parsed.getMonth() + 1).toString().padStart(2, '0');
        return `${y}-${m}`;
    }

    return null;
};

/**
 * Validates Excel data against a section definition
 */
export const validateExcelData = (
    rawData: any[][],
    sectionDef: SectionDefinition
): ImportValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const validData: Record<string, any>[] = [];

    if (rawData.length < 2) {
        return {
            isValid: false,
            errors: ['الملف فارغ أو لا يحتوي على بيانات. يجب أن يحتوي على صف العناوين وصف بيانات واحد على الأقل.'],
            warnings: [],
            data: [],
            totalRows: 0
        };
    }

    // First row is headers
    const headers = (rawData[0] as string[]).map(h => (h || '').toString().trim());
    const dataRows = rawData.slice(1).filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== ''));

    if (dataRows.length === 0) {
        return {
            isValid: false,
            errors: ['الملف لا يحتوي على بيانات. أضف بيانات بعد صف العناوين.'],
            warnings: [],
            data: [],
            totalRows: 0
        };
    }

    // Map headers to column definitions
    const columnMap: Map<number, ColumnDefinition> = new Map();
    const foundColumns: Set<string> = new Set();

    for (let i = 0; i < headers.length; i++) {
        const normalizedHeader = normalizeArabic(headers[i]);
        for (const colDef of sectionDef.columns) {
            const normalizedColHeader = normalizeArabic(colDef.header);
            if (normalizedHeader === normalizedColHeader || normalizedHeader.includes(normalizedColHeader) || normalizedColHeader.includes(normalizedHeader)) {
                if (!foundColumns.has(colDef.field)) {
                    columnMap.set(i, colDef);
                    foundColumns.add(colDef.field);
                    break;
                }
            }
        }
    }

    // Check for missing required columns
    const missingRequired = sectionDef.columns
        .filter(col => col.required && !foundColumns.has(col.field))
        .map(col => col.header);

    if (missingRequired.length > 0) {
        errors.push(`أعمدة مطلوبة مفقودة: ${missingRequired.join('، ')}`);
    }

    // Check for unrecognized columns
    for (let i = 0; i < headers.length; i++) {
        if (!columnMap.has(i) && headers[i]) {
            warnings.push(`العمود "${headers[i]}" غير معروف وسيتم تجاهله.`);
        }
    }

    if (errors.length > 0) {
        return { isValid: false, errors, warnings, data: [], totalRows: dataRows.length };
    }

    // Validate each data row
    for (let rowIdx = 0; rowIdx < dataRows.length; rowIdx++) {
        const row = dataRows[rowIdx];
        const rowNum = rowIdx + 2; // +2 for 1-indexed + header row
        const record: Record<string, any> = {};
        let rowValid = true;

        for (const [colIdx, colDef] of Array.from(columnMap.entries())) {
            let cellValue = row[colIdx];
            cellValue = cellValue !== null && cellValue !== undefined ? String(cellValue).trim() : '';

            // Check required
            if (colDef.required && !cellValue) {
                errors.push(`صف ${rowNum}: الحقل "${colDef.header}" مطلوب ولا يمكن أن يكون فارغاً.`);
                rowValid = false;
                continue;
            }

            // Use default value if empty and not required
            if (!cellValue && colDef.defaultValue !== undefined) {
                record[colDef.field] = colDef.defaultValue;
                continue;
            }

            if (!cellValue) {
                record[colDef.field] = '';
                continue;
            }

            // Type-specific validation
            switch (colDef.type) {
                case 'month': {
                    const parsedMonth = parseMonthValue(cellValue);
                    if (!parsedMonth) {
                        errors.push(`صف ${rowNum}: "${colDef.header}" يجب أن يكون بصيغة YYYY-MM (مثل: 2025-03). القيمة المُدخلة: "${cellValue}"`);
                        rowValid = false;
                        continue;
                    }
                    // Validate month range
                    const [year, month] = parsedMonth.split('-').map(Number);
                    if (month < 1 || month > 12) {
                        errors.push(`صف ${rowNum}: الشهر في "${colDef.header}" يجب أن يكون بين 01 و 12`);
                        rowValid = false;
                        continue;
                    }
                    record[colDef.field] = parsedMonth;
                    break;
                }

                case 'number':
                    const numVal = parseFloat(cellValue);
                    if (isNaN(numVal)) {
                        errors.push(`صف ${rowNum}: "${colDef.header}" يجب أن يكون رقماً.`);
                        rowValid = false;
                        continue;
                    }
                    record[colDef.field] = numVal;
                    break;

                case 'percentage':
                    const pctVal = parseFloat(cellValue.replace('%', '').replace('٪', ''));
                    if (isNaN(pctVal)) {
                        errors.push(`صف ${rowNum}: "${colDef.header}" يجب أن يكون نسبة مئوية (رقم).`);
                        rowValid = false;
                        continue;
                    }
                    if (pctVal < 0 || pctVal > 100) {
                        warnings.push(`صف ${rowNum}: "${colDef.header}" = ${pctVal}% (خارج النطاق 0-100)`);
                    }
                    record[colDef.field] = pctVal;
                    break;

                case 'date':
                    // Accept various date formats
                    record[colDef.field] = cellValue;
                    break;

                case 'string':
                default:
                    // Validate against valid values if specified
                    if (colDef.validValues && colDef.validValues.length > 0) {
                        const normalizedCell = normalizeArabic(cellValue);
                        const deepCell = deepNormalizeArabic(cellValue);
                        
                        // 1. Exact match (after basic normalization)
                        let matchedValue = colDef.validValues.find(v => normalizeArabic(v) === normalizedCell);
                        
                        // 2. Deep match (strip ال and plural suffixes)
                        if (!matchedValue) {
                            matchedValue = colDef.validValues.find(v => deepNormalizeArabic(v) === deepCell);
                        }
                        
                        // 3. Partial/contains match
                        if (!matchedValue) {
                            matchedValue = colDef.validValues.find(v =>
                                normalizeArabic(v).includes(normalizedCell) ||
                                normalizedCell.includes(normalizeArabic(v))
                            );
                        }
                        
                        // 4. Deep partial match
                        if (!matchedValue) {
                            matchedValue = colDef.validValues.find(v =>
                                deepNormalizeArabic(v).includes(deepCell) ||
                                deepCell.includes(deepNormalizeArabic(v))
                            );
                        }

                        if (matchedValue) {
                            record[colDef.field] = matchedValue;
                            if (normalizeArabic(matchedValue) !== normalizedCell) {
                                warnings.push(`صف ${rowNum}: "${colDef.header}" تم تصحيح "${cellValue}" إلى "${matchedValue}"`);
                            }
                        } else {
                            // Value doesn't match any valid option → ERROR (block import)
                            const validList = colDef.validValues!.slice(0, 5).join('، ');
                            const moreText = colDef.validValues!.length > 5 ? ` ... و${colDef.validValues!.length - 5} قيمة أخرى` : '';
                            errors.push(`صف ${rowNum}: "${colDef.header}" = "${cellValue}" غير موجود في القائمة المحددة. القيم المقبولة: ${validList}${moreText}`);
                            rowValid = false;
                            continue;
                        }
                    } else {
                        record[colDef.field] = cellValue;
                    }
                    break;
            }
        }

        if (rowValid) {
            validData.push(record);
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        data: validData,
        totalRows: dataRows.length
    };
};

// ============================================================
// Batch Save to Firestore
// ============================================================

type SaveFunctionType = (data: any) => Promise<string | null>;

const saveFunctions: Record<string, SaveFunctionType> = {
    'saveTechnicalClinicalFacility': saveTechnicalClinicalFacility,
    'saveTechnicalClinicalObservation': saveTechnicalClinicalObservation,
    'saveTechnicalClinicalCorrectionRate': saveTechnicalClinicalCorrectionRate,
    'saveAccreditationFacility': saveAccreditationFacility,
    'saveCompletionFacility': saveCompletionFacility,
    'savePaymentFacility': savePaymentFacility,
    'savePaidFacility': savePaidFacility,
    'saveMedicalProfessionalRegistration': saveMedicalProfessionalRegistration,
    'saveCommitteePreparationFacility': saveCommitteePreparationFacility,
    'saveCertificateIssuanceFacility': saveCertificateIssuanceFacility,
    'saveCorrectivePlanFacility': saveCorrectivePlanFacility,
    'saveBasicRequirementsFacility': saveBasicRequirementsFacility,
    'saveAppealsFacility': saveAppealsFacility,
    'saveAdminAuditFacility': saveAdminAuditFacility,
};

export interface BatchSaveResult {
    success: boolean;
    savedCount: number;
    failedCount: number;
    errors: string[];
}

/**
 * Saves validated data to Firestore in batches
 */
export const batchSaveToFirestore = async (
    data: Record<string, any>[],
    sectionDef: SectionDefinition,
    userId: string,
    onProgress?: (current: number, total: number) => void
): Promise<BatchSaveResult> => {
    const saveFn = saveFunctions[sectionDef.saveFnName];
    if (!saveFn) {
        return {
            success: false,
            savedCount: 0,
            failedCount: data.length,
            errors: [`دالة الحفظ "${sectionDef.saveFnName}" غير موجودة.`]
        };
    }

    let savedCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
        try {
            const record = { ...data[i] };

            // Add year from month field
            if (record.month) {
                record.year = parseInt(record.month.split('-')[0]);
            }

            // Add audit fields
            record.createdBy = userId;
            record.updatedBy = userId;

            const docId = await saveFn(record);
            if (docId) {
                savedCount++;
            } else {
                failedCount++;
                errors.push(`فشل في حفظ السجل ${i + 1}`);
            }
        } catch (error) {
            failedCount++;
            errors.push(`خطأ في السجل ${i + 1}: ${(error as Error).message}`);
        }

        if (onProgress) {
            onProgress(i + 1, data.length);
        }
    }

    return {
        success: failedCount === 0,
        savedCount,
        failedCount,
        errors
    };
};

// ============================================================
// Template Generator
// ============================================================

/**
 * Converts a 0-based column index to Excel column letter (0='A', 1='B', 26='AA', etc.)
 */
const colIndexToLetter = (index: number): string => {
    let letter = '';
    let i = index;
    while (i >= 0) {
        letter = String.fromCharCode((i % 26) + 65) + letter;
        i = Math.floor(i / 26) - 1;
    }
    return letter;
};

/**
 * Generates an empty Excel template for a section WITH dropdown validation lists
 */
export const generateTemplate = (sectionDef: SectionDefinition): void => {
    const wb = XLSX.utils.book_new();
    const MAX_DATA_ROWS = 500; // Support up to 500 rows of data

    // Headers row
    const headers = sectionDef.columns.map(col => col.header);

    // Example row (with hints)
    const exampleRow = sectionDef.columns.map(col => {
        if (col.type === 'month') return '2025-03';
        if (col.type === 'date') return '2025-03-15';
        if (col.type === 'number') return '0';
        if (col.type === 'percentage') return '85';
        if (col.validValues && col.validValues.length > 0) return col.validValues[0];
        return '';
    });

    const wsData = [headers, exampleRow];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = sectionDef.columns.map(col => ({
        wch: Math.max(col.header.length * 2, 15)
    }));

    // ============================================================
    // Create hidden "القوائم" sheet with valid values for dropdowns
    // ============================================================
    const columnsWithValidValues = sectionDef.columns
        .map((col, idx) => ({ col, idx }))
        .filter(({ col }) => col.validValues && col.validValues.length > 0);

    if (columnsWithValidValues.length > 0) {
        // Build lists sheet: each column has a header + values
        const maxListLength = Math.max(...columnsWithValidValues.map(({ col }) => col.validValues!.length));
        const listsData: any[][] = [];

        // Header row for lists sheet
        listsData.push(columnsWithValidValues.map(({ col }) => col.header));

        // Value rows
        for (let r = 0; r < maxListLength; r++) {
            const row: any[] = [];
            for (const { col } of columnsWithValidValues) {
                row.push(col.validValues![r] || '');
            }
            listsData.push(row);
        }

        const listsWs = XLSX.utils.aoa_to_sheet(listsData);
        listsWs['!cols'] = columnsWithValidValues.map(() => ({ wch: 30 }));
        XLSX.utils.book_append_sheet(wb, listsWs, 'القوائم');

        // ============================================================
        // Add Data Validation (dropdown lists) to the main data sheet
        // ============================================================
        const dataValidation: any[] = [];

        columnsWithValidValues.forEach(({ col, idx }, listColIdx) => {
            const dataColLetter = colIndexToLetter(idx);
            const listColLetter = colIndexToLetter(listColIdx);
            const listLength = col.validValues!.length;

            dataValidation.push({
                type: 'list',
                sqref: `${dataColLetter}2:${dataColLetter}${MAX_DATA_ROWS + 1}`,
                formula1: `القوائم!$${listColLetter}$2:$${listColLetter}$${listLength + 1}`,
                showInputMessage: true,
                promptTitle: col.header,
                prompt: `اختر ${col.header} من القائمة`,
                showErrorMessage: true,
                errorStyle: 'warning',
                errorTitle: 'قيمة غير موجودة',
                error: `يفضل اختيار قيمة من القائمة المنسدلة لتجنب الأخطاء الإملائية`
            });
        });

        (ws as any)['!dataValidation'] = dataValidation;
    }

    // Add the main data sheet
    const sheetName = sectionDef.name.replace(/[^\u0600-\u06FF\s]/g, '').trim() || 'البيانات';
    XLSX.utils.book_append_sheet(wb, ws, sheetName);

    // Create a hints/values sheet
    const hintsData: any[][] = [['الحقل', 'مطلوب؟', 'النوع', 'القيم المقبولة']];
    for (const col of sectionDef.columns) {
        hintsData.push([
            col.header,
            col.required ? 'نعم ✅' : 'لا',
            col.type === 'month' ? 'شهر (YYYY-MM)' :
                col.type === 'number' ? 'رقم' :
                    col.type === 'percentage' ? 'نسبة مئوية (0-100)' :
                        col.type === 'date' ? 'تاريخ (YYYY-MM-DD)' : 'نص',
            col.validValues ? col.validValues.join(' | ') : 'أي قيمة'
        ]);
    }

    const hintsWs = XLSX.utils.aoa_to_sheet(hintsData);
    hintsWs['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, hintsWs, 'تعليمات');

    const fileName = `نموذج_${sectionDef.name.replace(/[^\u0600-\u06FF\s]/g, '').trim().replace(/\s+/g, '_')}.xlsx`;
    XLSX.writeFile(wb, fileName);
};
