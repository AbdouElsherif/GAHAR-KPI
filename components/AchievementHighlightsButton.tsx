'use client';

import { useMemo, useState } from 'react';
import {
    getAccreditationFacilities,
    getAccreditationDecisions,
    getAdminAuditFacilities,
    getAllKPIData,
    getGovernorateCustomerSurveys,
    getPaidFacilities,
    getReportsPresentedToCommittee,
    getReviewerEvaluationVisits,
    getTechnicalClinicalFacilities,
    getTechnicalClinicalObservations,
    getTotalMedProfsByCategory,
    getTrainingEntities,
    getTrainingNatures
} from '@/lib/firestore';

interface MetricItem {
    label: string;
    value: number;
    suffix?: string;
    titleHighlight?: string;
    details?: Array<{
        label: string;
        value: number;
        suffix?: string;
    }>;
    comparison?: {
        previousValue: number;
        difference: number;
        percentage: number | null;
        periodLabel: string;
    };
}

interface AchievementSection {
    title: string;
    periodLabel: string;
    metrics: MetricItem[];
}

const normalizeMonth = (value: any): string => {
    if (typeof value !== 'string') return '';
    const match = value.match(/^(\d{4})-(\d{1,2})/);
    return match ? `${match[1]}-${match[2].padStart(2, '0')}` : '';
};

const getFiscalYearRange = (monthKey: string) => {
    const [yearValue, monthValue] = monthKey.split('-').map(Number);
    if (!yearValue || !monthValue) return null;

    const startYear = monthValue >= 7 ? yearValue : yearValue - 1;
    const endYear = startYear + 1;

    return {
        start: `${startYear}-07`,
        end: `${endYear}-06`,
        label: `${startYear} - ${endYear}`
    };
};

const getPreviousYearMonth = (monthKey: string) => {
    const [yearValue, monthValue] = monthKey.split('-').map(Number);
    if (!yearValue || !monthValue) return '';
    return `${yearValue - 1}-${String(monthValue).padStart(2, '0')}`;
};

const getLatestMonth = (records: Array<{ month?: string }>) => {
    return records
        .map(record => normalizeMonth(record.month))
        .filter(Boolean)
        .sort()
        .at(-1) || '';
};

const isWithinMonth = (record: any, monthKey: string) => normalizeMonth(record?.month) === monthKey;

const isWithinFiscalYear = (record: any, fiscalYear: ReturnType<typeof getFiscalYearRange>) => {
    if (!fiscalYear) return false;
    const monthKey = normalizeMonth(record?.month);
    return monthKey >= fiscalYear.start && monthKey <= fiscalYear.end;
};

const includesAny = (value: any, terms: string[]) => {
    const normalized = String(value || '').trim();
    return terms.some(term => normalized.includes(term));
};

const sumAmounts = (records: any[]) => {
    return records.reduce((total, record) => total + (Number(record?.amount) || 0), 0);
};

const sumField = (records: any[], fieldName: string) => {
    return records.reduce((total, record) => total + (Number(record?.[fieldName]) || 0), 0);
};

const countUniqueFacilities = (records: any[]) => {
    return new Set(records.map(record => String(record?.facilityName || '').trim()).filter(Boolean)).size;
};

const groupDecisionCounts = (records: any[]) => {
    return records.reduce((grouped, record) => {
        const decisionType = String(record?.decisionType || 'غير محدد').trim() || 'غير محدد';
        grouped[decisionType] = (grouped[decisionType] || 0) + (Number(record?.count) || 0);
        return grouped;
    }, {} as Record<string, number>);
};

const averageSatisfactionByGovernorate = (records: any[]) => {
    const grouped = records.reduce((result, record) => {
        const governorate = String(record?.governorate || 'غير محدد').trim() || 'غير محدد';
        if (!result[governorate]) {
            result[governorate] = {
                patientTotal: 0,
                staffTotal: 0,
                count: 0
            };
        }

        result[governorate].patientTotal += Number(record?.patientSatisfactionRate) || 0;
        result[governorate].staffTotal += Number(record?.staffSatisfactionRate) || 0;
        result[governorate].count += 1;
        return result;
    }, {} as Record<string, { patientTotal: number; staffTotal: number; count: number }>);

    return Object.fromEntries(
        (Object.entries(grouped) as [string, { patientTotal: number; staffTotal: number; count: number }][]).map(([governorate, values]) => [
            governorate,
            {
                patientSatisfaction: values.count ? values.patientTotal / values.count : 0,
                staffSatisfaction: values.count ? values.staffTotal / values.count : 0
            }
        ])
    ) as Record<string, { patientSatisfaction: number; staffSatisfaction: number }>;
};

const formatNumber = (value: number) => {
    return new Intl.NumberFormat('ar-EG').format(value);
};

const formatSignedNumber = (value: number) => {
    const sign = value > 0 ? '+' : '';
    return `${sign}${formatNumber(value)}`;
};

const formatPercentage = (value: number | null) => {
    if (value === null) return 'لا توجد نسبة';
    const sign = value > 0 ? '+' : '';
    return `${sign}${new Intl.NumberFormat('ar-EG', {
        maximumFractionDigits: 1
    }).format(value)}%`;
};

const buildComparison = (currentValue: number, previousValue: number, periodLabel: string) => ({
    previousValue,
    difference: currentValue - previousValue,
    percentage: previousValue === 0 ? null : ((currentValue - previousValue) / Math.abs(previousValue)) * 100,
    periodLabel
});

const metricAccentColor = '#0d6a79';

const standardFields = [
    { name: 'standard1', label: 'معايير دور النقاهة والرعاية الممتدة' },
    { name: 'standard2', label: 'معايير السياحة الاستشفائية' },
    { name: 'standard3', label: 'معايير الرعاية الأولية (إصدار 2025)' },
    { name: 'standard4', label: 'الدليل الاسترشادي للتجهيزات الطبية للمستشفيات' },
    { name: 'standard5', label: 'معايير المستشفيات (إصدار 2025)' },
    { name: 'standard6', label: 'معايير التميز للمنشآت الصديقة للأم والطفل' },
    { name: 'standard7', label: 'معايير المعامل الإكلينيكية' },
    { name: 'standard8', label: 'معايير المراكز الطبية المتخصصة وجراحات اليوم الواحد' },
    { name: 'standard9', label: 'معايير الأشعة العلاجية التداخلية والتشخيصية' },
    { name: 'standard10', label: 'معايير مكاتب الصحة المستقلة' },
    { name: 'standard11', label: 'معايير مكاتب الصحة النفسية (الإصدار الثاني)' },
    { name: 'standard12', label: 'معايير التميز الإكلينيكي' },
    { name: 'standard13', label: 'معايير بنوك الدم' },
    { name: 'standard14', label: 'معايير التطبيب عن بعد' },
    { name: 'standard15', label: 'دليل المراجعين' },
    { name: 'standard16', label: 'معايير العلاج الطبيعي (الإصدار الثاني)' },
    { name: 'standard17', label: 'معايير مراكز التجميل والليزر' }
];

export default function AchievementHighlightsButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(false);
    const [sections, setSections] = useState<AchievementSection[]>([]);
    const [selectedMonth, setSelectedMonth] = useState('');
    const [comparisonEnabled, setComparisonEnabled] = useState(false);

    const reportingMonth = useMemo(() => {
        return sections.find(section => section.periodLabel)?.periodLabel || '';
    }, [sections]);

    const loadAchievements = async (monthOverride?: string, comparisonOverride?: boolean) => {
        try {
            setLoading(true);
            setError(false);

            const [
                technicalClinicalFacilities,
                technicalClinicalObservations,
                adminAuditFacilities,
                accreditationFacilities,
                paidFacilities,
                governorateCustomerSurveys,
                reviewerEvaluationVisits,
                reportsPresentedToCommittee,
                accreditationDecisions,
                totalMedProfsByCategory,
                trainingEntities,
                trainingNatures,
                allKpiData
            ] = await Promise.all([
                getTechnicalClinicalFacilities(),
                getTechnicalClinicalObservations(),
                getAdminAuditFacilities(),
                getAccreditationFacilities(),
                getPaidFacilities(),
                getGovernorateCustomerSurveys(),
                getReviewerEvaluationVisits(),
                getReportsPresentedToCommittee(),
                getAccreditationDecisions(),
                getTotalMedProfsByCategory(),
                getTrainingEntities(),
                getTrainingNatures(),
                getAllKPIData()
            ]);

            const latestAvailableMonth = getLatestMonth([
                ...technicalClinicalFacilities,
                ...technicalClinicalObservations,
                ...adminAuditFacilities,
                ...accreditationFacilities,
                ...paidFacilities,
                ...governorateCustomerSurveys,
                ...reviewerEvaluationVisits,
                ...reportsPresentedToCommittee,
                ...accreditationDecisions,
                ...totalMedProfsByCategory,
                ...trainingEntities,
                ...trainingNatures,
                ...allKpiData.map(record => ({ month: record.data?.date || record.month }))
            ]);
            const reportMonth = monthOverride || selectedMonth || latestAvailableMonth;
            const shouldCompare = comparisonOverride ?? comparisonEnabled;
            if (!selectedMonth && reportMonth) {
                setSelectedMonth(reportMonth);
            }

            const fiscalYear = getFiscalYearRange(reportMonth);
            const adminAuditKpi = allKpiData.find(record =>
                record.departmentId === 'dept5' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const adminAuditKpiData = adminAuditKpi?.data || {};
            const customerSatisfactionKpi = allKpiData.find(record =>
                record.departmentId === 'dept3' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const customerSatisfactionKpiData = customerSatisfactionKpi?.data || {};
            const accreditationKpi = allKpiData.find(record =>
                record.departmentId === 'dept6' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const accreditationKpiData = accreditationKpi?.data || {};
            const reviewersKpi = allKpiData.find(record =>
                record.departmentId === 'dept9' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const reviewersKpiData = reviewersKpi?.data || {};
            const medicalProfessionalsKpi = allKpiData.find(record =>
                record.departmentId === 'dept7' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const medicalProfessionalsKpiData = medicalProfessionalsKpi?.data || {};
            const technicalSupportKpi = allKpiData.find(record =>
                record.departmentId === 'dept2' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const technicalSupportKpiData = technicalSupportKpi?.data || {};
            const trainingKpi = allKpiData.find(record =>
                record.departmentId === 'dept1' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const trainingKpiData = trainingKpi?.data || {};
            const standardsKpi = allKpiData.find(record =>
                record.departmentId === 'dept8' && normalizeMonth(record.data?.date || record.month) === reportMonth
            );
            const standardsKpiData = standardsKpi?.data || {};

            const monthTechnicalClinicalFacilities = technicalClinicalFacilities.filter(record => isWithinMonth(record, reportMonth));
            const monthTechnicalClinicalObservations = technicalClinicalObservations.filter(record => isWithinMonth(record, reportMonth));
            const monthAdminAuditFacilities = adminAuditFacilities.filter(record => isWithinMonth(record, reportMonth));
            const monthAccreditationFacilities = accreditationFacilities.filter(record => isWithinMonth(record, reportMonth));
            const monthPaidFacilities = paidFacilities.filter(record => isWithinMonth(record, reportMonth));
            const monthGovernorateCustomerSurveys = governorateCustomerSurveys.filter(record => isWithinMonth(record, reportMonth));
            const monthReviewerEvaluationVisits = reviewerEvaluationVisits.filter(record => isWithinMonth(record, reportMonth));
            const monthReportsPresentedToCommittee = reportsPresentedToCommittee.filter(record => isWithinMonth(record, reportMonth));
            const monthAccreditationDecisions = accreditationDecisions.filter(record => isWithinMonth(record, reportMonth));
            const monthTotalMedProfsByCategory = totalMedProfsByCategory.filter(record => isWithinMonth(record, reportMonth));
            const monthTrainingEntities = trainingEntities.filter(record => isWithinMonth(record, reportMonth));
            const monthTrainingNatures = trainingNatures.filter(record => isWithinMonth(record, reportMonth));
            const fiscalYearPaidFacilities = paidFacilities.filter(record => isWithinFiscalYear(record, fiscalYear));
            const previousYearMonth = getPreviousYearMonth(reportMonth);
            const previousFiscalYear = getFiscalYearRange(previousYearMonth);
            const previousAdminAuditKpi = allKpiData.find(record =>
                record.departmentId === 'dept5' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousAdminAuditKpiData = previousAdminAuditKpi?.data || {};
            const previousCustomerSatisfactionKpi = allKpiData.find(record =>
                record.departmentId === 'dept3' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousCustomerSatisfactionKpiData = previousCustomerSatisfactionKpi?.data || {};
            const previousAccreditationKpi = allKpiData.find(record =>
                record.departmentId === 'dept6' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousAccreditationKpiData = previousAccreditationKpi?.data || {};
            const previousReviewersKpi = allKpiData.find(record =>
                record.departmentId === 'dept9' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousReviewersKpiData = previousReviewersKpi?.data || {};
            const previousMedicalProfessionalsKpi = allKpiData.find(record =>
                record.departmentId === 'dept7' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousMedicalProfessionalsKpiData = previousMedicalProfessionalsKpi?.data || {};
            const previousTechnicalSupportKpi = allKpiData.find(record =>
                record.departmentId === 'dept2' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousTechnicalSupportKpiData = previousTechnicalSupportKpi?.data || {};
            const previousTrainingKpi = allKpiData.find(record =>
                record.departmentId === 'dept1' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousTrainingKpiData = previousTrainingKpi?.data || {};
            const previousStandardsKpi = allKpiData.find(record =>
                record.departmentId === 'dept8' && normalizeMonth(record.data?.date || record.month) === previousYearMonth
            );
            const previousStandardsKpiData = previousStandardsKpi?.data || {};
            const previousMonthTechnicalClinicalFacilities = technicalClinicalFacilities.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthTechnicalClinicalObservations = technicalClinicalObservations.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthAdminAuditFacilities = adminAuditFacilities.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthAccreditationFacilities = accreditationFacilities.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthPaidFacilities = paidFacilities.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthGovernorateCustomerSurveys = governorateCustomerSurveys.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthReviewerEvaluationVisits = reviewerEvaluationVisits.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthReportsPresentedToCommittee = reportsPresentedToCommittee.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthAccreditationDecisions = accreditationDecisions.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthTotalMedProfsByCategory = totalMedProfsByCategory.filter(record => isWithinMonth(record, previousYearMonth));
            const previousMonthTrainingNatures = trainingNatures.filter(record => isWithinMonth(record, previousYearMonth));
            const previousFiscalYearPaidFacilities = paidFacilities.filter(record => isWithinFiscalYear(record, previousFiscalYear));
            const monthDecisionCounts = groupDecisionCounts(monthAccreditationDecisions);
            const previousMonthDecisionCounts = groupDecisionCounts(previousMonthAccreditationDecisions);
            const decisionTypes = Array.from(new Set([
                ...Object.keys(monthDecisionCounts),
                ...(shouldCompare ? Object.keys(previousMonthDecisionCounts) : [])
            ])).sort((a, b) => a.localeCompare(b, 'ar'));
            const decisionMetrics: MetricItem[] = decisionTypes.map(decisionType => ({
                label: `عدد القرارات الصادرة - ${decisionType}`,
                value: monthDecisionCounts[decisionType] || 0
            }));
            const totalReportsPresentedToCommittee = sumField(monthReportsPresentedToCommittee, 'numberOfDecisions');
            const previousTotalReportsPresentedToCommittee = sumField(previousMonthReportsPresentedToCommittee, 'numberOfDecisions');
            const currentSatisfactionByGovernorate = averageSatisfactionByGovernorate(monthGovernorateCustomerSurveys);
            const previousSatisfactionByGovernorate = averageSatisfactionByGovernorate(previousMonthGovernorateCustomerSurveys);
            const satisfactionGovernorates = Array.from(new Set([
                ...Object.keys(currentSatisfactionByGovernorate),
                ...(shouldCompare ? Object.keys(previousSatisfactionByGovernorate) : [])
            ])).sort((a, b) => a.localeCompare(b, 'ar'));
            const customerSatisfactionGovernorateMetrics: MetricItem[] = satisfactionGovernorates.map(governorate => ({
                label: 'نسب الرضاء',
                titleHighlight: governorate,
                value: 0,
                details: [
                    {
                        label: 'مرضى',
                        value: currentSatisfactionByGovernorate[governorate]?.patientSatisfaction || 0,
                        suffix: '%'
                    },
                    {
                        label: 'عاملين',
                        value: currentSatisfactionByGovernorate[governorate]?.staffSatisfaction || 0,
                        suffix: '%'
                    }
                ]
            }));
            const trainingEntityMetrics: MetricItem[] = monthTrainingEntities.map(entity => ({
                label: 'الجهة الحاصلة على التدريب',
                titleHighlight: String(entity.entityName || 'غير محدد'),
                value: 0,
                details: [
                    {
                        label: 'متدربين',
                        value: Number(entity.traineesCount) || 0
                    }
                ]
            }));
            const trainingMethodologyMetric: MetricItem = {
                label: 'منهجية التدريب',
                value: 0,
                details: [
                    {
                        label: 'حضوري',
                        value: sumField(monthTrainingNatures, 'physicalPrograms')
                    },
                    {
                        label: 'عن بعد',
                        value: sumField(monthTrainingNatures, 'onlinePrograms')
                    },
                    {
                        label: 'مدمج',
                        value: sumField(monthTrainingNatures, 'hybridPrograms')
                    }
                ]
            };
            const incompleteStandardFields = standardFields.filter(field => {
                const value = Number(standardsKpiData[field.name]) || 0;
                return value < 100;
            });
            const incompleteStandardMetrics: MetricItem[] = incompleteStandardFields.map(field => ({
                label: field.label,
                value: Number(standardsKpiData[field.name]) || 0,
                suffix: '%'
            }));

            const newSections: AchievementSection[] = [
                {
                    title: 'الرقابة الفنية والإكلينيكية',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'إجمالي الزيارات',
                            value: monthTechnicalClinicalFacilities.length
                        },
                        {
                            label: 'التقييم الفني والإكلينيكي',
                            value: monthTechnicalClinicalFacilities.filter(record =>
                                includesAny(record.visitType, ['تقييم']) || includesAny(record.assessmentType, ['تقييم'])
                            ).length
                        },
                        {
                            label: 'التدقيق الفني والإكلينيكي',
                            value: monthTechnicalClinicalFacilities.filter(record =>
                                includesAny(record.visitType, ['تدقيق']) || includesAny(record.assessmentType, ['تدقيق'])
                            ).length
                        },
                        {
                            label: 'عدد الملاحظات',
                            value: monthTechnicalClinicalObservations.length
                        }
                    ]
                },
                {
                    title: 'الإدارة العامة للرقابة الإدارية على المنشآت الصحية',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'إجمالي الزيارات',
                            value: Number(adminAuditKpiData.totalFieldVisits) || monthAdminAuditFacilities.length
                        },
                        {
                            label: 'تدقيق إداري وسلامة بيئية',
                            value: Number(adminAuditKpiData.adminAuditVisits) || 0
                        },
                        {
                            label: 'تفتيش إداري',
                            value: Number(adminAuditKpiData.adminInspectionVisits) || 0
                        },
                        {
                            label: 'زيارات متابعة',
                            value: Number(adminAuditKpiData.followUpVisits) || 0
                        },
                        {
                            label: 'فحص/ إحالة/ تكليف',
                            value: Number(adminAuditKpiData.examReferralVisits) || 0
                        },
                        {
                            label: 'فحص حدث جسيم',
                            value: Number(adminAuditKpiData.seriousIncidentExam) || 0
                        },
                        {
                            label: 'المنشآت التي تم زيارتها',
                            value: Number(adminAuditKpiData.visitedFacilities) || countUniqueFacilities(monthAdminAuditFacilities)
                        }
                    ]
                },
                {
                    title: 'الإدارة العامة لرضاء المتعاملين',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'عدد الزيارات الميدانية لاستبيان رضاء المتعاملين',
                            value: Number(customerSatisfactionKpiData.fieldVisits) || 0
                        },
                        {
                            label: 'عدد المنشآت التي تم إجراء استبيانات بها',
                            value: Number(customerSatisfactionKpiData.surveyedFacilities) || 0
                        },
                        {
                            label: 'حجم عينة قياس تجربة المريض',
                            value: Number(customerSatisfactionKpiData.patientExperienceSample) || 0
                        },
                        {
                            label: 'حجم عينة قياس رضاء العاملين',
                            value: Number(customerSatisfactionKpiData.staffSatisfactionSample) || 0
                        },
                        ...customerSatisfactionGovernorateMetrics
                    ]
                },
                {
                    title: 'الاعتماد والتسجيل',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'عدد المنشآت الجديدة المتقدمة للتسجيل',
                            value: Number(accreditationKpiData.newFacilities) || 0
                        },
                        {
                            label: 'الاعتماد/ الاعتماد المبدئي',
                            value: Number(accreditationKpiData.accreditation) || 0
                        },
                        {
                            label: 'تجديد الاعتماد',
                            value: Number(accreditationKpiData.renewal) || 0
                        },
                        {
                            label: 'استكمال الاعتماد',
                            value: Number(accreditationKpiData.completion) || 0
                        },
                        {
                            label: 'الالتماسات',
                            value: Number(accreditationKpiData.reviewedAppeals) || 0
                        },
                        {
                            label: 'الخطط التصحيحية',
                            value: Number(accreditationKpiData.reviewedPlans) || 0
                        },
                        {
                            label: 'عدد المنشآت المعتمدة خلال الشهر',
                            value: monthAccreditationFacilities.filter(record => includesAny(record.accreditationStatus, ['معتمد'])).length
                        },
                        {
                            label: 'عدد المنشآت التي قامت بسداد الرسوم خلال الشهر',
                            value: monthPaidFacilities.length
                        },
                        {
                            label: 'إجمالي الرسوم المحققة خلال الشهر',
                            value: sumAmounts(monthPaidFacilities),
                            suffix: 'جنيه'
                        },
                        {
                            label: `إجمالي الرسوم خلال العام المالي ${fiscalYear?.label || ''}`.trim(),
                            value: sumAmounts(fiscalYearPaidFacilities),
                            suffix: 'جنيه'
                        }
                    ]
                },
                {
                    title: 'الإدارة العامة لشئون المراجعين',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'إجمالي الزيارات التقييمية',
                            value: Number(reviewersKpiData.totalEvaluationVisits) || sumField(monthReviewerEvaluationVisits, 'facilityName')
                        },
                        {
                            label: 'عدد أيام التقييم',
                            value: Number(reviewersKpiData.evaluationDays) || 0
                        },
                        {
                            label: 'عدد الزيارات لمحافظات التأمين الصحي الشامل',
                            value: Number(reviewersKpiData.visitsToInsuranceGovernorate) || 0
                        },
                        {
                            label: 'عدد الزيارات لمنشآت وزارة الصحة والسكان',
                            value: Number(reviewersKpiData.visitsToMOHFacilities) || 0
                        },
                        {
                            label: 'عدد الزيارات للمنشآت الجامعية',
                            value: Number(reviewersKpiData.visitsToUniFacilities) || 0
                        },
                        {
                            label: 'عدد لجان الاعتماد المنعقدة',
                            value: Number(reviewersKpiData.accreditationCommittees) || 0
                        },
                        {
                            label: 'عدد تقارير الزيارات المعروضة على اللجنة',
                            value: Number(reviewersKpiData.reportsToCommittee) || totalReportsPresentedToCommittee
                        },
                        {
                            label: 'عدد الالتماسات المقدمة',
                            value: Number(reviewersKpiData.appealsSubmitted) || 0
                        },
                        ...decisionMetrics
                    ]
                },
                {
                    title: 'الإدارة العامة لتسجيل أعضاء المهن الطبية',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'عدد أعضاء المهن الطبية المسجلين خلال الشهر',
                            value: Number(medicalProfessionalsKpiData.registeredMembers) || 0
                        },
                        {
                            label: 'عدد أعضاء المهن الطبية المحدث بياناتهم',
                            value: Number(medicalProfessionalsKpiData.updatedMembers) || 0
                        },
                        {
                            label: 'عدد المنشآت التي تم تسجيل أعضاء المهن بها',
                            value: Number(medicalProfessionalsKpiData.facilitiesRegistered) || 0
                        },
                        {
                            label: 'عدد المنشآت التي تم تحديث أعضاء المهن بها',
                            value: Number(medicalProfessionalsKpiData.facilitiesUpdated) || 0
                        },
                        {
                            label: 'الإجمالي الكلي لأعضاء المهن الطبية',
                            value: sumField(monthTotalMedProfsByCategory, 'total')
                        }
                    ]
                },
                {
                    title: 'الإدارة العامة للدعم الفني',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'برامج الدعم الفني المقدمة',
                            value: Number(technicalSupportKpiData.supportPrograms) || 0
                        },
                        {
                            label: 'زيارات تمهيدية',
                            value: Number(technicalSupportKpiData.introVisits) || 0
                        },
                        {
                            label: 'زيارات دعم فني ميداني',
                            value: Number(technicalSupportKpiData.fieldSupportVisits) || 0
                        },
                        {
                            label: 'دعم فني عن بعد',
                            value: Number(technicalSupportKpiData.remoteSupportVisits) || 0
                        },
                        {
                            label: 'منشآت حصلت على الدعم الفني',
                            value: Number(technicalSupportKpiData.supportedFacilities) || 0
                        },
                        {
                            label: 'الزيارات بقائمة الانتظار',
                            value: Number(technicalSupportKpiData.queuedFieldVisits) || 0
                        },
                        {
                            label: 'المحافظات المنفذ بها زيارات',
                            value: Number(technicalSupportKpiData.governoratesWithFieldVisits) || 0
                        }
                    ]
                },
                {
                    title: 'الإدارة العامة للتدريب',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: [
                        {
                            label: 'عدد البرامج التدريبية',
                            value: Number(trainingKpiData.trainingPrograms) || 0
                        },
                        {
                            label: 'عدد المتدربين',
                            value: Number(trainingKpiData.trainees) || 0
                        },
                        ...trainingEntityMetrics,
                        trainingMethodologyMetric
                    ]
                },
                {
                    title: 'الإدارة العامة لأبحاث وتطوير المعايير',
                    periodLabel: reportMonth || 'لا توجد بيانات',
                    metrics: incompleteStandardMetrics.length > 0 ? incompleteStandardMetrics : [
                        {
                            label: 'لا توجد معايير غير مكتملة',
                            value: 100,
                            suffix: '%'
                        }
                    ]
                }
            ];

            if (shouldCompare && previousYearMonth) {
                const previousMetricValuesBySection = [
                    [
                        previousMonthTechnicalClinicalFacilities.length,
                        previousMonthTechnicalClinicalFacilities.filter(record =>
                            includesAny(record.visitType, ['ØªÙ‚ÙŠÙŠÙ…']) || includesAny(record.assessmentType, ['ØªÙ‚ÙŠÙŠÙ…'])
                        ).length,
                        previousMonthTechnicalClinicalFacilities.filter(record =>
                            includesAny(record.visitType, ['ØªØ¯Ù‚ÙŠÙ‚']) || includesAny(record.assessmentType, ['ØªØ¯Ù‚ÙŠÙ‚'])
                        ).length,
                        previousMonthTechnicalClinicalObservations.length
                    ],
                    [
                        Number(previousAdminAuditKpiData.totalFieldVisits) || previousMonthAdminAuditFacilities.length,
                        Number(previousAdminAuditKpiData.adminAuditVisits) || 0,
                        Number(previousAdminAuditKpiData.adminInspectionVisits) || 0,
                        Number(previousAdminAuditKpiData.followUpVisits) || 0,
                        Number(previousAdminAuditKpiData.examReferralVisits) || 0,
                        Number(previousAdminAuditKpiData.seriousIncidentExam) || 0,
                        Number(previousAdminAuditKpiData.visitedFacilities) || countUniqueFacilities(previousMonthAdminAuditFacilities)
                    ],
                    [
                        Number(previousCustomerSatisfactionKpiData.fieldVisits) || 0,
                        Number(previousCustomerSatisfactionKpiData.surveyedFacilities) || 0,
                        Number(previousCustomerSatisfactionKpiData.patientExperienceSample) || 0,
                        Number(previousCustomerSatisfactionKpiData.staffSatisfactionSample) || 0,
                        ...satisfactionGovernorates.map(() => 0)
                    ],
                    [
                        Number(previousAccreditationKpiData.newFacilities) || 0,
                        Number(previousAccreditationKpiData.accreditation) || 0,
                        Number(previousAccreditationKpiData.renewal) || 0,
                        Number(previousAccreditationKpiData.completion) || 0,
                        Number(previousAccreditationKpiData.reviewedAppeals) || 0,
                        Number(previousAccreditationKpiData.reviewedPlans) || 0,
                        previousMonthAccreditationFacilities.filter(record => includesAny(record.accreditationStatus, ['Ù…Ø¹ØªÙ…Ø¯'])).length,
                        previousMonthPaidFacilities.length,
                        sumAmounts(previousMonthPaidFacilities),
                        sumAmounts(previousFiscalYearPaidFacilities)
                    ],
                    [
                        Number(previousReviewersKpiData.totalEvaluationVisits) || sumField(previousMonthReviewerEvaluationVisits, 'facilityName'),
                        Number(previousReviewersKpiData.evaluationDays) || 0,
                        Number(previousReviewersKpiData.visitsToInsuranceGovernorate) || 0,
                        Number(previousReviewersKpiData.visitsToMOHFacilities) || 0,
                        Number(previousReviewersKpiData.visitsToUniFacilities) || 0,
                        Number(previousReviewersKpiData.accreditationCommittees) || 0,
                        Number(previousReviewersKpiData.reportsToCommittee) || previousTotalReportsPresentedToCommittee,
                        Number(previousReviewersKpiData.appealsSubmitted) || 0,
                        ...decisionTypes.map(decisionType => previousMonthDecisionCounts[decisionType] || 0)
                    ],
                    [
                        Number(previousMedicalProfessionalsKpiData.registeredMembers) || 0,
                        Number(previousMedicalProfessionalsKpiData.updatedMembers) || 0,
                        Number(previousMedicalProfessionalsKpiData.facilitiesRegistered) || 0,
                        Number(previousMedicalProfessionalsKpiData.facilitiesUpdated) || 0,
                        sumField(previousMonthTotalMedProfsByCategory, 'total')
                    ],
                    [
                        Number(previousTechnicalSupportKpiData.supportPrograms) || 0,
                        Number(previousTechnicalSupportKpiData.introVisits) || 0,
                        Number(previousTechnicalSupportKpiData.fieldSupportVisits) || 0,
                        Number(previousTechnicalSupportKpiData.remoteSupportVisits) || 0,
                        Number(previousTechnicalSupportKpiData.supportedFacilities) || 0,
                        Number(previousTechnicalSupportKpiData.queuedFieldVisits) || 0,
                        Number(previousTechnicalSupportKpiData.governoratesWithFieldVisits) || 0
                    ],
                    [
                        Number(previousTrainingKpiData.trainingPrograms) || 0,
                        Number(previousTrainingKpiData.trainees) || 0,
                        ...trainingEntityMetrics.map(() => 0),
                        sumField(previousMonthTrainingNatures, 'physicalPrograms') +
                        sumField(previousMonthTrainingNatures, 'onlinePrograms') +
                        sumField(previousMonthTrainingNatures, 'hybridPrograms')
                    ],
                    incompleteStandardMetrics.length > 0 ? incompleteStandardFields.map(field =>
                        Number(previousStandardsKpiData[field.name]) || 0
                    ) : [
                        100
                    ]
                ];

                newSections.forEach((section, sectionIndex) => {
                    section.metrics = section.metrics.map((metric, metricIndex) => ({
                        ...metric,
                        comparison: metric.details ? undefined : buildComparison(
                            metric.value,
                            previousMetricValuesBySection[sectionIndex]?.[metricIndex] || 0,
                            previousYearMonth
                        )
                    }));
                });
            }

            setSections(newSections);
        } catch (loadError) {
            console.error('Error loading achievement highlights:', loadError);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    const openAchievements = () => {
        setIsOpen(true);
        if (sections.length === 0) {
            loadAchievements();
        }
    };

    const handleMonthChange = (monthValue: string) => {
        setSelectedMonth(monthValue);
        loadAchievements(monthValue, comparisonEnabled);
    };

    const handleComparisonToggle = (enabled: boolean) => {
        setComparisonEnabled(enabled);
        if (sections.length > 0) {
            loadAchievements(selectedMonth, enabled);
        }
    };

    return (
        <>
            <button
                onClick={openAchievements}
                style={{
                    backgroundColor: '#fff',
                    color: '#0d6a79',
                    border: '1px solid #a3e2d1',
                    borderRadius: '999px',
                    padding: '10px 16px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 2px 8px rgba(13, 106, 121, 0.08)'
                }}
                title="عرض أهم إنجازات الإدارات"
            >
                <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>★</span>
                أهم الإنجازات
            </button>

            {isOpen && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'white',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    direction: 'rtl',
                    textAlign: 'right'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        width: '100%',
                        height: '100vh',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column'
                    }}>
                        <div style={{
                            backgroundColor: '#0d6a79',
                            color: 'white',
                            padding: '18px 28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '12px',
                            flexShrink: 0,
                            flexWrap: 'wrap'
                        }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>أهم إنجازات الإدارات</h3>
                                <p style={{ margin: '5px 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                                    ملخص سريع للأرقام الأبرز حسب آخر شهر بيانات متاح{reportingMonth ? `: ${reportingMonth}` : ''}.
                                </p>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginRight: 'auto',
                                flexWrap: 'wrap'
                            }}>
                                <label htmlFor="achievement-month" style={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                                    اختر الشهر والسنة
                                </label>
                                <input
                                    id="achievement-month"
                                    type="month"
                                    value={selectedMonth}
                                    onChange={(event) => handleMonthChange(event.target.value)}
                                    disabled={loading}
                                    style={{
                                        border: '1px solid #a3e2d1',
                                        borderRadius: '6px',
                                        padding: '8px 10px',
                                        fontSize: '0.95rem',
                                        color: '#0d6a79',
                                        fontWeight: 'bold',
                                        backgroundColor: loading ? '#e9ecef' : 'white'
                                    }}
                                />
                                <label style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '7px',
                                    fontSize: '0.9rem',
                                    fontWeight: 'bold',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    opacity: loading ? 0.7 : 1
                                }}>
                                    <input
                                        type="checkbox"
                                        checked={comparisonEnabled}
                                        disabled={loading}
                                        onChange={(event) => handleComparisonToggle(event.target.checked)}
                                    />
                                    مقارنة بنفس الشهر من العام السابق
                                </label>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontSize: '1.5rem',
                                    lineHeight: 1
                                }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{
                            padding: '24px 28px',
                            overflowY: 'auto',
                            flex: 1,
                            backgroundColor: '#f8f9fa'
                        }}>
                            {loading && (
                                <div style={{ padding: '20px', color: '#666', textAlign: 'center' }}>
                                    جاري تحميل مؤشرات الإنجاز...
                                </div>
                            )}

                            {!loading && error && (
                                <div style={{ padding: '16px', color: '#842029', backgroundColor: '#f8d7da', borderRadius: '8px' }}>
                                    تعذر تحميل أهم الإنجازات حاليا. يرجى المحاولة مرة أخرى.
                                </div>
                            )}

                            {!loading && !error && (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '18px',
                                    maxWidth: '1180px',
                                    margin: '0 auto'
                                }}>
                                    {sections.map(section => (
                                        <div
                                            key={section.title}
                                            style={{
                                                border: '1px solid #ddd',
                                                borderRadius: '8px',
                                                overflow: 'hidden',
                                                backgroundColor: '#fff',
                                                boxShadow: '0 10px 24px rgba(13, 106, 121, 0.08)'
                                            }}
                                        >
                                            <div style={{
                                                background: 'linear-gradient(135deg, #0d6a79 0%, #15938a 100%)',
                                                borderBottom: '1px solid #eee',
                                                padding: '16px 18px',
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                gap: '10px',
                                                flexWrap: 'wrap'
                                            }}>
                                                <strong style={{ color: 'white', fontSize: '1.15rem', fontWeight: 800 }}>
                                                    {section.title}
                                                </strong>
                                                <span style={{ color: '#eef9f6', fontSize: '0.95rem', fontWeight: 'bold' }}>
                                                    الفترة: {section.periodLabel}
                                                </span>
                                            </div>

                                            <div style={{
                                                display: 'grid',
                                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                                gap: '14px',
                                                padding: '16px',
                                                backgroundColor: '#f6fbfa'
                                            }}>
                                                {section.metrics.map((metric) => {
                                                    const accentColor = metricAccentColor;
                                                    const comparison = metric.comparison;
                                                    const comparisonColor = !comparison || comparison.difference === 0
                                                        ? '#667b78'
                                                        : comparison.difference > 0
                                                            ? '#0f8a55'
                                                            : '#b42318';
                                                    return (
                                                    <div
                                                        key={`${section.title}-${metric.label}-${metric.titleHighlight || ''}`}
                                                        style={{
                                                            position: 'relative',
                                                            border: '1px solid #dbeeea',
                                                            borderRadius: '8px',
                                                            padding: '16px 16px 14px',
                                                            background: 'linear-gradient(180deg, #ffffff 0%, #f8fffd 100%)',
                                                            boxShadow: '0 6px 16px rgba(13, 106, 121, 0.07)',
                                                            minHeight: comparison ? '154px' : '118px',
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            justifyContent: 'space-between',
                                                            alignItems: 'center',
                                                            overflow: 'hidden'
                                                        }}
                                                    >
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            right: 0,
                                                            bottom: 0,
                                                            width: '5px',
                                                            backgroundColor: accentColor
                                                        }} />
                                                        <div style={{
                                                            color: '#36514f',
                                                            fontSize: '0.92rem',
                                                            lineHeight: '1.55',
                                                            fontWeight: 900,
                                                            paddingRight: '8px',
                                                            marginBottom: '14px',
                                                            textAlign: 'center'
                                                        }}>
                                                            {metric.label}
                                                            {metric.titleHighlight && (
                                                                <span style={{
                                                                    color: '#b45309',
                                                                    fontWeight: 900,
                                                                    marginRight: '6px'
                                                                }}>
                                                                    {metric.titleHighlight}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'baseline',
                                                            justifyContent: 'center',
                                                            gap: '6px',
                                                            width: '100%'
                                                        }}>
                                                            {metric.details ? (
                                                                <div style={{
                                                                    display: 'grid',
                                                                    gridTemplateColumns: `repeat(${metric.details.length}, minmax(0, 1fr))`,
                                                                    gap: metric.details.length > 2 ? '6px' : '10px',
                                                                    width: '100%'
                                                                }}>
                                                                    {metric.details.map(detail => (
                                                                        <div
                                                                            key={`${metric.label}-${detail.label}`}
                                                                            style={{
                                                                                textAlign: 'center',
                                                                                padding: metric.details && metric.details.length > 2 ? '7px 5px' : '8px',
                                                                                borderRadius: '8px',
                                                                                backgroundColor: '#eef9f6',
                                                                                border: '1px solid #d7eee8'
                                                                            }}
                                                                        >
                                                                            <div style={{
                                                                                color: '#667b78',
                                                                                fontSize: metric.details && metric.details.length > 2 ? '0.76rem' : '0.82rem',
                                                                                fontWeight: 900,
                                                                                marginBottom: '5px'
                                                                            }}>
                                                                                {detail.label}
                                                                            </div>
                                                                            <strong style={{
                                                                                color: accentColor,
                                                                                fontSize: metric.details && metric.details.length > 2 ? '1.22rem' : '1.45rem',
                                                                                lineHeight: 1,
                                                                                fontFamily: '"Times New Roman", Times, serif',
                                                                                fontWeight: 900
                                                                            }}>
                                                                                {formatNumber(detail.value)}
                                                                            </strong>
                                                                            {detail.suffix && (
                                                                                <span style={{ color: '#667b78', fontSize: '0.82rem', fontWeight: 'bold', marginRight: '3px' }}>
                                                                                    {detail.suffix}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <strong style={{
                                                                        color: accentColor,
                                                                        fontSize: '1.75rem',
                                                                        lineHeight: 1,
                                                                        fontFamily: '"Times New Roman", Times, serif',
                                                                        fontWeight: 900
                                                                    }}>
                                                                        {formatNumber(metric.value)}
                                                                    </strong>
                                                                    {metric.suffix && (
                                                                        <span style={{ color: '#667b78', fontSize: '0.9rem', fontWeight: 'bold' }}>
                                                                            {metric.suffix}
                                                                        </span>
                                                                    )}
                                                                </>
                                                            )}
                                                        </div>
                                                        {comparison && (
                                                            <div style={{
                                                                marginTop: '12px',
                                                                paddingTop: '10px',
                                                                borderTop: '1px solid #e2f2ee',
                                                                width: '100%',
                                                                textAlign: 'center',
                                                                fontSize: '0.82rem',
                                                                color: '#667b78',
                                                                lineHeight: 1.6
                                                            }}>
                                                                <div>
                                                                    نفس الشهر من العام السابق: {formatNumber(comparison.previousValue)}
                                                                </div>
                                                                <div style={{ color: comparisonColor, fontWeight: 900 }}>
                                                                    {formatSignedNumber(comparison.difference)} ({formatPercentage(comparison.percentage)})
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
