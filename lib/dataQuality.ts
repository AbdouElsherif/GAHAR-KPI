import { departments, departmentFields, type Field } from '@/constants/departments';
import type { ExportDataPayload } from '@/lib/aiExportHelper';

export type DataQualitySeverity = 'high' | 'medium' | 'low';
export type DataQualityCategory =
    | 'duplicates'
    | 'missing'
    | 'range'
    | 'consistency'
    | 'naming';

export interface DataQualityIssue {
    id: string;
    severity: DataQualitySeverity;
    category: DataQualityCategory;
    title: string;
    details: string;
    departmentId?: string;
    departmentName?: string;
    collectionName?: string;
    collectionLabel?: string;
    month?: string;
    recordId?: string;
    locations?: DataQualityIssueLocation[];
}

export interface DataQualityIssueLocation {
    departmentId?: string;
    departmentName?: string;
    collectionName?: string;
    collectionLabel?: string;
    month?: string;
    recordId?: string;
    value?: string;
}

export interface DataQualityReport {
    generatedAt: string;
    scope: {
        minMonth?: string;
    };
    issues: DataQualityIssue[];
    summary: {
        totalIssues: number;
        high: number;
        medium: number;
        low: number;
        scannedRecords: number;
        affectedDepartments: number;
    };
}

export interface AnalyzeDataQualityOptions {
    minMonth?: string;
}

const collectionLabels: Record<string, string> = {
    accreditation_facilities: 'منشآت الاعتماد والتسجيل',
    completion_facilities: 'منشآت استكمال الاعتماد',
    payment_facilities: 'منشآت سداد الرسوم',
    corrective_plan_facilities: 'الخطط التصحيحية',
    basic_requirements_facilities: 'المتطلبات الأساسية',
    appeals_facilities: 'الالتماسات',
    paid_facilities: 'الرسوم المحصلة',
    medical_professional_registrations: 'تسجيل المهنيين',
    committee_preparation_facilities: 'التجهيز للعرض على اللجنة',
    certificate_issuance_facilities: 'إصدار الشهادات',
    technical_support_visits: 'زيارات الدعم الفني الميداني',
    remote_technical_supports: 'الدعم الفني عن بعد',
    introductory_support_visits: 'زيارات الدعم الفني التمهيدية',
    queued_support_visits: 'زيارات قائمة الانتظار',
    scheduled_support_visits: 'الزيارات المجدولة',
    accredited_supported_facilities: 'المنشآت المعتمدة التي تلقت دعما',
    technical_clinical_facilities: 'منشآت الرقابة الفنية والإكلينيكية',
    admin_audit_facilities: 'منشآت الرقابة الإدارية',
    admin_audit_observations: 'ملاحظات الرقابة الإدارية',
    technical_clinical_observations: 'ملاحظات الرقابة الفنية والإكلينيكية',
    observation_correction_rates: 'نسب تصحيح ملاحظات الرقابة الإدارية',
    technical_clinical_correction_rates: 'نسب تصحيح ملاحظات الرقابة الفنية',
    reviewer_evaluation_visits: 'زيارات المراجعين التقييمية',
    medical_professionals_by_category: 'المهنيون حسب الفئة',
    medical_professionals_by_governorate: 'المهنيون حسب المحافظة',
    training_entities: 'جهات التدريب',
    program_types: 'أنواع البرامج',
    total_med_profs_by_category: 'إجمالي المهنيين حسب الفئة',
    total_med_profs_by_governorate: 'إجمالي المهنيين حسب المحافظة',
    governorate_customer_surveys: 'استبيانات رضا المتعاملين حسب المحافظة',
    reports_presented_to_committee: 'التقارير المعروضة على اللجنة',
    reports_by_facility_specialty: 'التقارير حسب تخصص المنشآت',
    accreditation_decisions: 'قرارات الاعتماد',
    collected_revenues: 'الإيرادات المحصلة',
    general_kpis: 'مؤشرات الإدارات الشهرية'
};

const collectionDepartmentMap: Record<string, string> = {
    accreditation_facilities: 'dept6',
    completion_facilities: 'dept6',
    payment_facilities: 'dept6',
    corrective_plan_facilities: 'dept6',
    basic_requirements_facilities: 'dept6',
    appeals_facilities: 'dept6',
    paid_facilities: 'dept6',
    medical_professional_registrations: 'dept7',
    committee_preparation_facilities: 'dept6',
    certificate_issuance_facilities: 'dept6',
    technical_support_visits: 'dept2',
    remote_technical_supports: 'dept2',
    introductory_support_visits: 'dept2',
    queued_support_visits: 'dept2',
    scheduled_support_visits: 'dept2',
    accredited_supported_facilities: 'dept2',
    technical_clinical_facilities: 'dept4',
    admin_audit_facilities: 'dept5',
    admin_audit_observations: 'dept5',
    technical_clinical_observations: 'dept4',
    observation_correction_rates: 'dept5',
    technical_clinical_correction_rates: 'dept4',
    reviewer_evaluation_visits: 'dept9',
    medical_professionals_by_category: 'dept7',
    medical_professionals_by_governorate: 'dept7',
    training_entities: 'dept1',
    program_types: 'dept1',
    total_med_profs_by_category: 'dept7',
    total_med_profs_by_governorate: 'dept7',
    governorate_customer_surveys: 'dept3',
    reports_presented_to_committee: 'dept9',
    reports_by_facility_specialty: 'dept9',
    accreditation_decisions: 'dept9',
    collected_revenues: 'dept1'
};

const consistencyChecks = [
    {
        departmentId: 'dept2',
        field: 'introVisits',
        collection: 'introductory_support_visits',
        mode: 'count' as const,
        label: 'الزيارات التمهيدية'
    },
    {
        departmentId: 'dept2',
        field: 'fieldSupportVisits',
        collection: 'technical_support_visits',
        mode: 'count' as const,
        label: 'زيارات الدعم الفني الميداني'
    },
    {
        departmentId: 'dept2',
        field: 'remoteSupportVisits',
        collection: 'remote_technical_supports',
        mode: 'count' as const,
        label: 'زيارات الدعم الفني عن بعد'
    },
    {
        departmentId: 'dept2',
        field: 'queuedFieldVisits',
        collection: 'queued_support_visits',
        mode: 'count' as const,
        label: 'زيارات الدعم الفني بقائمة الانتظار'
    },
    {
        departmentId: 'dept4',
        field: 'totalFieldVisits',
        collection: 'technical_clinical_facilities',
        mode: 'count' as const,
        label: 'إجمالي زيارات الرقابة الفنية والإكلينيكية'
    },
    {
        departmentId: 'dept5',
        field: 'totalFieldVisits',
        collection: 'admin_audit_facilities',
        mode: 'count' as const,
        label: 'إجمالي زيارات الرقابة الإدارية'
    },
    {
        departmentId: 'dept6',
        field: 'newFacilities',
        collection: 'accreditation_facilities',
        mode: 'count' as const,
        label: 'المنشآت الجديدة المتقدمة للتسجيل'
    },
    {
        departmentId: 'dept9',
        field: 'totalEvaluationVisits',
        collection: 'reviewer_evaluation_visits',
        mode: 'sum' as const,
        sumField: 'facilityName',
        label: 'إجمالي الزيارات التقييمية'
    },
    {
        departmentId: 'dept9',
        field: 'reportsToCommittee',
        collection: 'reports_presented_to_committee',
        mode: 'sum' as const,
        sumField: 'numberOfDecisions',
        label: 'تقارير الزيارات المعروضة على اللجنة'
    }
];

const normalizeMonth = (value: any, fallbackYear?: any): string => {
    if (!value) return '';
    if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
    }
    if (typeof value?.toDate === 'function') return normalizeMonth(value.toDate());

    if (typeof value === 'number' && fallbackYear) {
        return value >= 1 && value <= 12 ? `${fallbackYear}-${String(value).padStart(2, '0')}` : '';
    }

    if (typeof value !== 'string') return '';
    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})/);
    if (isoMatch) return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}`;
    const slashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})/);
    if (slashMatch) return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}`;

    return '';
};

const getRecordMonth = (record: any): string => {
    return normalizeMonth(record?.data?.date, record?.year)
        || normalizeMonth(record?.date, record?.year)
        || normalizeMonth(record?.month, record?.year)
        || normalizeMonth(record?.visitDate, record?.year)
        || normalizeMonth(record?.decisionDate, record?.year);
};

const getRecordScopeMonth = (record: any): string => {
    return getRecordMonth(record)
        || normalizeMonth(record?.createdAt)
        || normalizeMonth(record?.updatedAt);
};

const isWithinScope = (record: any, minMonth?: string): boolean => {
    if (!minMonth) return true;
    const month = getRecordScopeMonth(record);
    return Boolean(month && month >= minMonth);
};

const filterCollectionsByScope = (
    payload: ExportDataPayload,
    minMonth?: string
): ExportDataPayload['collections'] => {
    if (!minMonth) return payload.collections;

    return Object.fromEntries(
        Object.entries(payload.collections).map(([collectionName, records]) => [
            collectionName,
            records.filter(record => isWithinScope(record, minMonth))
        ])
    ) as ExportDataPayload['collections'];
};

const isEmptyValue = (value: any) => {
    return value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '');
};

const toNumber = (value: any): number | null => {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || value.trim() === '') return null;
    const normalized = value.replace(/[,%\s]/g, '');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
};

const isPercentField = (fieldName: string, label = '') => {
    const key = fieldName.toLowerCase();
    return key.includes('percent')
        || key.includes('percentage')
        || key.includes('rate')
        || key.includes('compliance')
        || label.includes('%')
        || label.includes('نسبة')
        || label.includes('معدل');
};

const normalizeArabicName = (value: string) => {
    return value
        .trim()
        .replace(/[ً-ْـ]/g, '')
        .replace(/[أإآ]/g, 'ا')
        .replace(/ة/g, 'ه')
        .replace(/ى/g, 'ي')
        .replace(/[^\u0600-\u06FFa-zA-Z0-9]/g, '')
        .toLowerCase();
};

const getCollectionLabel = (collectionName: string) => collectionLabels[collectionName] || collectionName;

const addIssue = (issues: DataQualityIssue[], issue: Omit<DataQualityIssue, 'id'>) => {
    issues.push({
        id: `${issue.category}-${issue.departmentId || issue.collectionName || 'general'}-${issues.length + 1}`,
        collectionLabel: issue.collectionName ? getCollectionLabel(issue.collectionName) : undefined,
        ...issue
    });
};

const getIssueDepartment = (departmentId?: string) => ({
    departmentId,
    departmentName: departmentId ? departments[departmentId] || departmentId : undefined
});

const countCollectionByMonth = (records: any[], month: string) => {
    return records.filter(record => getRecordMonth(record) === month).length;
};

const sumCollectionFieldByMonth = (records: any[], month: string, fieldName: string) => {
    return records
        .filter(record => getRecordMonth(record) === month)
        .reduce((total, record) => total + (toNumber(record?.[fieldName]) || 0), 0);
};

const getAllCollectionRecords = (payload: ExportDataPayload) => {
    return Object.entries(payload.collections).flatMap(([collectionName, records]) =>
        records.map((record: any) => ({ collectionName, record }))
    );
};

const buildIssueLocation = (
    collectionName: string,
    record: any,
    value?: string
): DataQualityIssueLocation => {
    const departmentId = record?.departmentId || collectionDepartmentMap[collectionName];
    return {
        departmentId,
        departmentName: departmentId ? departments[departmentId] || departmentId : undefined,
        collectionName,
        collectionLabel: getCollectionLabel(collectionName),
        month: getRecordMonth(record),
        recordId: record?.id,
        value
    };
};

const getDuplicateRecordKey = (collectionName: string, record: any): string | null => {
    const month = getRecordMonth(record);
    if (!month) return null;

    if (collectionName === 'reviewer_evaluation_visits') {
        return [
            collectionName,
            month,
            normalizeArabicName(String(record?.facilityType || '')),
            normalizeArabicName(String(record?.governorate || '')),
            normalizeArabicName(String(record?.visitType || ''))
        ].join('|');
    }

    const facilityName = String(record?.facilityName || '').trim();
    if (!facilityName) return null;

    return [
        collectionName,
        month,
        normalizeArabicName(facilityName),
        normalizeArabicName(String(record?.governorate || '')),
        normalizeArabicName(String(record?.visitType || record?.decisionType || ''))
    ].join('|');
};

export function analyzeDataQuality(
    payload: ExportDataPayload,
    options: AnalyzeDataQualityOptions = {}
): DataQualityReport {
    const issues: DataQualityIssue[] = [];
    const collections = filterCollectionsByScope(payload, options.minMonth);
    const scopedPayload = {
        ...payload,
        collections
    };
    const generalKpis = scopedPayload.collections.general_kpis || [];

    const kpisByDepartmentMonth = new Map<string, any[]>();
    for (const record of generalKpis) {
        const month = getRecordMonth(record);
        if (!record.departmentId || !month) continue;
        const key = `${record.departmentId}|${month}`;
        kpisByDepartmentMonth.set(key, [...(kpisByDepartmentMonth.get(key) || []), record]);
    }

    for (const [key, records] of Array.from(kpisByDepartmentMonth.entries())) {
        if (records.length <= 1) continue;
        const [departmentId, month] = key.split('|');
        addIssue(issues, {
            severity: 'high',
            category: 'duplicates',
            title: 'تكرار سجل شهري لنفس الإدارة',
            details: `يوجد ${records.length} سجلات لنفس الإدارة في شهر ${month}. يفضل دمجها أو حذف التكرار حتى لا تتضاعف المؤشرات في التقارير.`,
            month,
            collectionName: 'general_kpis',
            ...getIssueDepartment(departmentId)
        });
    }

    for (const record of generalKpis) {
        const departmentId = record.departmentId;
        const fields = departmentFields[departmentId] || [];
        const month = getRecordMonth(record);

        if (!month) {
            addIssue(issues, {
                severity: 'high',
                category: 'missing',
                title: 'بيانات شهرية بدون تحديد الشهر',
                details: 'يوجد سجل محفوظ لهذه الإدارة لكن خانة "الشهر والسنة" فارغة أو مكتوبة بصيغة غير صحيحة. افتح الإدارة وراجع السجلات، ثم املأ الشهر بصيغة مثل 2026-05 حتى يظهر السجل في التقارير الشهرية.',
                collectionName: 'general_kpis',
                recordId: record.id,
                ...getIssueDepartment(departmentId)
            });
        }

        const requiredFields = fields.filter(field => field.required || field.name === 'date');
        const missingFields = requiredFields.filter(field => isEmptyValue(record.data?.[field.name]));
        if (missingFields.length > 0) {
            addIssue(issues, {
                severity: 'medium',
                category: 'missing',
                title: 'حقول مطلوبة ناقصة في سجل شهري',
                details: `الحقول الناقصة: ${missingFields.map(field => field.label).join('، ')}.`,
                month,
                collectionName: 'general_kpis',
                recordId: record.id,
                ...getIssueDepartment(departmentId)
            });
        }

        for (const field of fields.filter((item: Field) => item.type === 'number')) {
            const value = record.data?.[field.name];
            if (isEmptyValue(value)) continue;
            const numericValue = toNumber(value);

            if (numericValue === null) {
                addIssue(issues, {
                    severity: 'medium',
                    category: 'range',
                    title: 'قيمة رقمية غير قابلة للحساب',
                    details: `الحقل "${field.label}" يحتوي على قيمة غير رقمية: ${String(value)}.`,
                    month,
                    collectionName: 'general_kpis',
                    recordId: record.id,
                    ...getIssueDepartment(departmentId)
                });
                continue;
            }

            if (numericValue < 0) {
                addIssue(issues, {
                    severity: 'high',
                    category: 'range',
                    title: 'قيمة سالبة في مؤشر عددي',
                    details: `الحقل "${field.label}" قيمته ${numericValue}، وهذا يحتاج مراجعة لأن المؤشرات العددية لا يفترض أن تكون سالبة.`,
                    month,
                    collectionName: 'general_kpis',
                    recordId: record.id,
                    ...getIssueDepartment(departmentId)
                });
            }

            if (isPercentField(field.name, field.label) && (numericValue < 0 || numericValue > 100)) {
                addIssue(issues, {
                    severity: 'high',
                    category: 'range',
                    title: 'نسبة خارج النطاق المنطقي',
                    details: `الحقل "${field.label}" قيمته ${numericValue}%. يجب أن تكون النسبة بين 0 و100.`,
                    month,
                    collectionName: 'general_kpis',
                    recordId: record.id,
                    ...getIssueDepartment(departmentId)
                });
            }
        }
    }

    for (const { collectionName, record } of getAllCollectionRecords(scopedPayload)) {
        for (const [fieldName, rawValue] of Object.entries(record || {})) {
            const numericValue = toNumber(rawValue);
            if (numericValue === null) continue;

            if (isPercentField(fieldName) && (numericValue < 0 || numericValue > 100)) {
                addIssue(issues, {
                    severity: 'high',
                    category: 'range',
                    title: 'نسبة تفصيلية خارج النطاق',
                    details: `الحقل "${fieldName}" في ${getCollectionLabel(collectionName)} قيمته ${numericValue}%.`,
                    month: getRecordMonth(record),
                    collectionName,
                    recordId: record.id
                });
            }
        }
    }

    for (const check of consistencyChecks) {
        for (const record of generalKpis.filter(kpi => kpi.departmentId === check.departmentId)) {
            const month = getRecordMonth(record);
            if (!month) continue;
            const kpiValue = toNumber(record.data?.[check.field]);
            if (kpiValue === null) continue;

            const collectionRecords = (scopedPayload.collections as any)[check.collection] || [];
            const detailValue = check.mode === 'count'
                ? countCollectionByMonth(collectionRecords, month)
                : sumCollectionFieldByMonth(collectionRecords, month, check.sumField || 'count');

            if (kpiValue !== detailValue) {
                addIssue(issues, {
                    severity: 'medium',
                    category: 'consistency',
                    title: 'عدم تطابق بين الإجمالي والبيانات التفصيلية',
                    details: `${check.label}: القيمة المسجلة في KPI هي ${kpiValue} بينما البيانات التفصيلية في "${getCollectionLabel(check.collection)}" تعطي ${detailValue} لشهر ${month}.`,
                    month,
                    collectionName: check.collection,
                    recordId: record.id,
                    ...getIssueDepartment(check.departmentId)
                });
            }
        }
    }

    const possibleDuplicateRecords = new Map<string, { collectionName: string; record: any }[]>();
    for (const item of getAllCollectionRecords(scopedPayload)) {
        const key = getDuplicateRecordKey(item.collectionName, item.record);
        if (!key) continue;
        possibleDuplicateRecords.set(key, [...(possibleDuplicateRecords.get(key) || []), item]);
    }

    for (const [key, records] of Array.from(possibleDuplicateRecords.entries())) {
        if (records.length <= 1) continue;
        const [collectionName, month] = key.split('|');
        addIssue(issues, {
            severity: 'medium',
            category: 'duplicates',
            title: 'تكرار تفصيلي محتمل',
            details: `يوجد ${records.length} سجلات متشابهة في ${getCollectionLabel(collectionName)} لشهر ${month}. راجعها للتأكد من أنها ليست إدخالا مكررا.`,
            month,
            collectionName,
            recordId: records[0].record?.id
        });
    }

    const facilityVariants = new Map<string, { variants: Set<string>; locations: DataQualityIssueLocation[] }>();
    for (const { collectionName, record } of getAllCollectionRecords(scopedPayload)) {
        const facilityName = String(record?.facilityName || '').trim();
        if (!facilityName) continue;
        if (toNumber(facilityName) !== null) continue;
        const normalized = normalizeArabicName(facilityName);
        if (!normalized) continue;
        const facilityEntry = facilityVariants.get(normalized) || {
            variants: new Set<string>(),
            locations: []
        };
        const locationKey = [
            collectionName,
            getRecordMonth(record),
            record?.id,
            facilityName
        ].join('|');

        facilityEntry.variants.add(facilityName);
        if (!facilityEntry.locations.some(location => [
            location.collectionName,
            location.month,
            location.recordId,
            location.value
        ].join('|') === locationKey)) {
            facilityEntry.locations.push(buildIssueLocation(collectionName, record, facilityName));
        }
        facilityVariants.set(normalized, facilityEntry);
    }

    Array.from(facilityVariants.entries())
        .filter(([, entry]) => entry.variants.size > 1)
        .slice(0, 25)
        .forEach(([, entry]) => {
            const names = Array.from(entry.variants);
            const locations = entry.locations.slice(0, 8);
            const primaryLocation = locations[0];
            addIssue(issues, {
                severity: 'low',
                category: 'naming',
                title: 'اختلاف محتمل في كتابة اسم منشأة',
                details: `ظهرت المنشأة بصيغ متعددة: ${names.slice(0, 4).join('، ')}${names.length > 4 ? '...' : ''}. توحيد الاسم يساعد على دقة العد والمقارنات.`,
                departmentId: primaryLocation?.departmentId,
                departmentName: primaryLocation?.departmentName,
                collectionName: primaryLocation?.collectionName,
                month: primaryLocation?.month,
                recordId: primaryLocation?.recordId,
                locations
            });
        });

    const severityOrder: Record<DataQualitySeverity, number> = { high: 0, medium: 1, low: 2 };
    issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    const affectedDepartments = new Set(issues.map(issue => issue.departmentId).filter(Boolean)).size;
    const scannedRecords = Object.values(scopedPayload.collections).reduce((total, records) => total + records.length, 0);

    return {
        generatedAt: new Date().toISOString(),
        scope: {
            minMonth: options.minMonth
        },
        issues,
        summary: {
            totalIssues: issues.length,
            high: issues.filter(issue => issue.severity === 'high').length,
            medium: issues.filter(issue => issue.severity === 'medium').length,
            low: issues.filter(issue => issue.severity === 'low').length,
            scannedRecords,
            affectedDepartments
        }
    };
}
