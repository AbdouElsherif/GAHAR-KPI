'use client';

import { useState, useMemo, useCallback } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface AccreditationDashboardProps {
    submissions: Array<Record<string, any>>;
    facilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        affiliation?: string;
        standards?: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
    completionFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
    paymentFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
    paidFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        accreditationStatus: string;
        amount: number;
        month: string;
        year: number;
    }>;
    medicalProfessionalRegistrations?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
    correctivePlanFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        month: string;
        year: number;
    }>;
    basicRequirementsFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        month: string;
        year: number;
    }>;
    appealsFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        month: string;
        year: number;
    }>;
    certificateIssuanceFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
    committeePreparationFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
}

export default function AccreditationDashboard({ submissions, facilities = [], completionFacilities = [], paymentFacilities = [], paidFacilities = [], medicalProfessionalRegistrations = [], correctivePlanFacilities = [], basicRequirementsFacilities = [], appealsFacilities = [], certificateIssuanceFacilities = [], committeePreparationFacilities = [] }: AccreditationDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [selectedMonth, setSelectedMonth] = useState<number>(10); // أكتوبر كقيمة افتراضية
    const [section1View, setSection1View] = useState<'charts' | 'table'>('charts');
    const [section1ChartType, setSection1ChartType] = useState<'governorate' | 'affiliation' | 'standards' | 'affiliation_governorate'>('governorate');
    const [paidSectionView, setPaidSectionView] = useState<'charts' | 'table'>('charts');
    const [visibleMetrics, setVisibleMetrics] = useState<{
        newFacilities: boolean;
        appeals: boolean;
        plans: boolean;
        accreditation: boolean;
        renewal: boolean;
        completion: boolean;
    }>({
        newFacilities: true,
        appeals: true,
        plans: true,
        accreditation: true,
        renewal: true,
        completion: true
    });

    const getFiscalYear = useCallback((dateStr: string): number => {
        const year = parseInt(dateStr.split('-')[0]);
        const month = parseInt(dateStr.split('-')[1]);
        return month >= 7 ? year + 1 : year;
    }, []);

    const getYear = useCallback((dateStr: string): number => {
        return parseInt(dateStr.split('-')[0]);
    }, []);

    const getMonth = useCallback((dateStr: string): number => {
        return parseInt(dateStr.split('-')[1]);
    }, []);

    const getQuarter = useCallback((month: number): number => {
        if (month >= 7 && month <= 9) return 1;
        if (month >= 10 && month <= 12) return 2;
        if (month >= 1 && month <= 3) return 3;
        return 4;
    }, []);

    const getHalf = useCallback((month: number): number => {
        return month >= 7 ? 1 : 2;
    }, []);

    const filterByYear = useCallback((fiscalYear: number) => {
        return submissions.filter(sub => sub.date && getFiscalYear(sub.date) === fiscalYear);
    }, [submissions, getFiscalYear]);

    const aggregateData = useCallback((data: Array<Record<string, any>>, type: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly') => {
        const aggregated: Record<string, {
            newFacilities: number;
            reviewedAppeals: number;
            reviewedPlans: number;
            accreditation: number;
            renewal: number;
            completion: number;
            count: number;
        }> = {};

        data.forEach(sub => {
            if (!sub.date) return;

            const month = getMonth(sub.date);
            let periodKey = '';

            switch (type) {
                case 'monthly':
                    periodKey = sub.date;
                    break;
                case 'quarterly':
                    periodKey = `Q${getQuarter(month)}`;
                    break;
                case 'halfYearly':
                    periodKey = `H${getHalf(month)}`;
                    break;
                case 'yearly':
                    periodKey = 'السنة الكاملة';
                    break;
            }

            if (!aggregated[periodKey]) {
                aggregated[periodKey] = {
                    newFacilities: 0,
                    reviewedAppeals: 0,
                    reviewedPlans: 0,
                    accreditation: 0,
                    renewal: 0,
                    completion: 0,
                    count: 0
                };
            }

            aggregated[periodKey].newFacilities += parseFloat(sub.newFacilities) || 0;
            aggregated[periodKey].reviewedAppeals += parseFloat(sub.reviewedAppeals) || 0;
            aggregated[periodKey].reviewedPlans += parseFloat(sub.reviewedPlans) || 0;
            aggregated[periodKey].accreditation += parseFloat(sub.accreditation) || 0;
            aggregated[periodKey].renewal += parseFloat(sub.renewal) || 0;
            aggregated[periodKey].completion += parseFloat(sub.completion) || 0;
            aggregated[periodKey].count += 1;
        });

        return aggregated;
    }, [getMonth, getQuarter, getHalf]);

    const calculateChange = useCallback((current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    }, []);

    const currentYearData = useMemo(() => filterByYear(targetYear), [filterByYear, targetYear]);
    const previousYearData = useMemo(() => filterByYear(targetYear - 1), [filterByYear, targetYear]);

    const currentAggregated = useMemo(() => aggregateData(currentYearData, comparisonType), [aggregateData, currentYearData, comparisonType]);
    const previousAggregated = useMemo(() => aggregateData(previousYearData, comparisonType), [aggregateData, previousYearData, comparisonType]);

    // Calculate totals based on the selected comparison type
    const calculateFilteredTotal = useCallback((
        aggregated: Record<string, any>,
        metric: string,
        compType: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly'
    ): number => {
        if (compType === 'yearly') {
            return Object.values(aggregated).reduce((sum: number, period: any) =>
                sum + (period[metric] || 0), 0
            );
        } else if (compType === 'monthly') {
            const monthKey = Object.keys(aggregated).find(key => {
                if (key.includes('-')) {
                    const month = parseInt(key.split('-')[1]);
                    return month === selectedMonth;
                }
                return false;
            });
            return aggregated[monthKey || '']?.[metric] || 0;
        } else if (compType === 'quarterly') {
            const periodKey = `Q${selectedQuarter}`;
            return aggregated[periodKey]?.[metric] || 0;
        } else if (compType === 'halfYearly') {
            const periodKey = `H${selectedHalf}`;
            return aggregated[periodKey]?.[metric] || 0;
        }
        return 0;
    }, [selectedMonth, selectedQuarter, selectedHalf]);

    const currentTotalNewFacilities = useMemo(() => calculateFilteredTotal(currentAggregated, 'newFacilities', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalNewFacilities = useMemo(() => calculateFilteredTotal(previousAggregated, 'newFacilities', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const newFacilitiesChange = useMemo(() => calculateChange(currentTotalNewFacilities, previousTotalNewFacilities), [calculateChange, currentTotalNewFacilities, previousTotalNewFacilities]);

    const currentTotalAppeals = useMemo(() => calculateFilteredTotal(currentAggregated, 'reviewedAppeals', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalAppeals = useMemo(() => calculateFilteredTotal(previousAggregated, 'reviewedAppeals', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const appealsChange = useMemo(() => calculateChange(currentTotalAppeals, previousTotalAppeals), [calculateChange, currentTotalAppeals, previousTotalAppeals]);

    const currentTotalPlans = useMemo(() => calculateFilteredTotal(currentAggregated, 'reviewedPlans', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalPlans = useMemo(() => calculateFilteredTotal(previousAggregated, 'reviewedPlans', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const plansChange = useMemo(() => calculateChange(currentTotalPlans, previousTotalPlans), [calculateChange, currentTotalPlans, previousTotalPlans]);

    const currentTotalAccreditation = useMemo(() => calculateFilteredTotal(currentAggregated, 'accreditation', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalAccreditation = useMemo(() => calculateFilteredTotal(previousAggregated, 'accreditation', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const accreditationChange = useMemo(() => calculateChange(currentTotalAccreditation, previousTotalAccreditation), [calculateChange, currentTotalAccreditation, previousTotalAccreditation]);

    const currentTotalRenewal = useMemo(() => calculateFilteredTotal(currentAggregated, 'renewal', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalRenewal = useMemo(() => calculateFilteredTotal(previousAggregated, 'renewal', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const renewalChange = useMemo(() => calculateChange(currentTotalRenewal, previousTotalRenewal), [calculateChange, currentTotalRenewal, previousTotalRenewal]);

    const currentTotalCompletion = useMemo(() => calculateFilteredTotal(currentAggregated, 'completion', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalCompletion = useMemo(() => calculateFilteredTotal(previousAggregated, 'completion', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const completionChange = useMemo(() => calculateChange(currentTotalCompletion, previousTotalCompletion), [calculateChange, currentTotalCompletion, previousTotalCompletion]);

    const formatPeriodLabel = useCallback((period: string): string => {
        if (period.startsWith('Q')) return `الربع ${period.slice(1)}`;
        if (period.startsWith('H')) return `النصف ${period.slice(1)}`;
        if (period === 'السنة الكاملة') return period;
        if (period.includes('-')) {
            const [year, month] = period.split('-');
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            return monthNames[parseInt(month) - 1];
        }
        return period;
    }, []);

    const getObstaclesForSelectedMonth = (): string => {
        if (comparisonType !== 'monthly') return '';

        // فلترة البيانات حسب السنة والشهر المحدد
        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            const year = getYear(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return monthData?.obstacles || '';
    };

    const currentObstacles = getObstaclesForSelectedMonth();

    const getDevelopmentProposalsForSelectedMonth = (): string => {
        if (comparisonType !== 'monthly') return '';

        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            const year = getYear(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return monthData?.developmentProposals || '';
    };


    const currentDevelopmentProposals = getDevelopmentProposalsForSelectedMonth();

    const getAdditionalActivitiesForSelectedMonth = (): string => {
        if (comparisonType !== 'monthly') return '';

        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            const year = getYear(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return monthData?.additionalActivities || '';
    };

    const currentAdditionalActivities = getAdditionalActivitiesForSelectedMonth();

    // دالة لفلترة وترتيب المنشآت حسب الشهر المحدد وحالة الاعتماد
    const getFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !facilities || facilities.length === 0) return [];

        // فلترة المنشآت حسب الشهر والسنة المحددة
        const filtered = facilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        // ترتيب المنشآت حسب حالة الاعتماد (تجميع كل نوع مع بعضه)
        return filtered.sort((a, b) => {
            return a.accreditationStatus.localeCompare(b.accreditationStatus, 'ar');
        });
    };

    const filteredFacilities = getFacilitiesForSelectedMonth();
    const newFacilitiesOnly = filteredFacilities.filter(f => f.accreditationStatus === 'منشأة جديدة');

    // تجهيز بيانات الرسوم البيانية للقسم الأول (المنشآت الجديدة فقط)
    const prepareSection1ChartData = () => {
        if (section1ChartType === 'governorate') {
            const govCounts: Record<string, number> = {};
            newFacilitiesOnly.forEach(f => {
                govCounts[f.governorate] = (govCounts[f.governorate] || 0) + 1;
            });
            return Object.entries(govCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        } else if (section1ChartType === 'affiliation') {
            const affCounts: Record<string, number> = {};
            newFacilitiesOnly.forEach(f => {
                const aff = f.affiliation || 'غير محدد';
                affCounts[aff] = (affCounts[aff] || 0) + 1;
            });
            return Object.entries(affCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        } else if (section1ChartType === 'standards') {
            const stdCounts: Record<string, number> = {};
            const standardMapping: Record<string, string> = {
                'معايير اعتماد العلاج الطبيعي': 'العلاج الطبيعي',
                'معايير اعتماد مركز الاسنان': 'مركز الأسنان',
                'معايير اعتماد معامل التحاليل الطبية': 'المعامل',
                'معايير اعتماد مراكز ووحدات الرعاية الأولية': 'اعتماد مراكز ووحدات الرعاية',
                'الاعتماد المبدئي لمراكز ووحدات الرعاية الأولية': 'مبدئي مراكز ووحدات الرعاية',
                'معايير اعتماد مراكز جراحات اليوم الواحد': 'جراحات اليوم الواحد',
                'الاعتماد المبدئي للمستشفيات': 'مبدئي المستشفيات',
                'معايير اعتماد مراكز الاشعة التشخيصية والعلاجية': 'مراكز الأشعة التشخيصية',
                'معايير اعتماد العيادات الخاصة/ الأسنان': 'العيادات الخاصة/ الأسنان',
                'معايير اعتماد الصيدليات العامة': 'الصيدليات',
                'معايير اعتماد المستشفيات': 'اعتماد المستشفيات',
                'معايير اعتماد العيادات المجمعة': 'العيادات المجمعة',
                'معايير اعتماد مراكز الغسيل الكلوي': 'الغسيل الكلوي',
                'معايير اعتماد مستشفيات الصحة النفسية': 'مستشفيات الصحة النفسية',
                'معايير اعتماد التميز الأخضر': 'التميز الأخضر'
            };

            newFacilitiesOnly.forEach(f => {
                const rawStd = f.standards || 'غير محدد';
                const std = standardMapping[rawStd] || rawStd;
                stdCounts[std] = (stdCounts[std] || 0) + 1;
            });
            return Object.entries(stdCounts)
                .map(([name, value]) => ({ name, value }))
                .sort((a, b) => b.value - a.value);
        } else if (section1ChartType === 'affiliation_governorate') {
            const data: Record<string, any> = {};
            // تجميع التبعيات والمحافظات
            newFacilitiesOnly.forEach(f => {
                const aff = f.affiliation || 'غير محدد';
                const gov = f.governorate;

                if (!data[aff]) {
                    data[aff] = { name: aff };
                }
                data[aff][gov] = (data[aff][gov] || 0) + 1;
            });

            return Object.values(data);
        }
        return [];
    };

    const section1ChartData = prepareSection1ChartData();

    // دالة لفلترة وترتيب منشآت الاستكمال حسب الشهر المحدد وحالة الاعتماد
    const getCompletionFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !completionFacilities || completionFacilities.length === 0) return [];

        // فلترة المنشآت حسب الشهر والسنة المحددة
        const filtered = completionFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        // ترتيب المنشآت حسب حالة الاعتماد (تجميع كل نوع مع بعضه)
        return filtered.sort((a, b) => {
            return a.accreditationStatus.localeCompare(b.accreditationStatus, 'ar');
        });
    };

    const filteredCompletionFacilities = getCompletionFacilitiesForSelectedMonth();

    // دالة لفلترة وترتيب منشآت السداد حسب الشهر المحدد وحالة الاعتماد
    const getPaymentFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !paymentFacilities || paymentFacilities.length === 0) return [];

        const filtered = paymentFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.accreditationStatus.localeCompare(b.accreditationStatus, 'ar');
        });
    };

    const filteredPaymentFacilities = getPaymentFacilitiesForSelectedMonth();

    // دالة لفلترة وترتيب المنشآت المدفوعة حسب الشهر المحدد وحالة الاعتماد
    const getPaidFacilitiesForSelectedMonth = useMemo(() => {
        if (comparisonType !== 'monthly' || !paidFacilities || paidFacilities.length === 0) return [];

        const filtered = paidFacilities.filter(facility => {
            if (!facility.month) return false;
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');
            const month = parseInt(facility.month.split('-')[1]);

            return month === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.accreditationStatus.localeCompare(b.accreditationStatus, 'ar');
        });
    }, [comparisonType, paidFacilities, selectedMonth, targetYear, getFiscalYear]);

    const filteredPaidFacilities = getPaidFacilitiesForSelectedMonth;

    const paidFacilitiesChartData = useMemo(() => {
        const categories = {
            'إيرادات الاعتماد': { value: 0, count: 0 },
            'إيرادات اعتماد بعد اعتماد مبدئي': { value: 0, count: 0 },
            'إيرادات الاعتماد المبدئي': { value: 0, count: 0 },
            'إيرادات تجديد الاعتماد': { value: 0, count: 0 },
            'إيرادات تجديد الاعتماد المبدئي': { value: 0, count: 0 },
            'إيرادات رسوم تأجيل': { value: 0, count: 0 },
            'إيرادات شهادات إضافية': { value: 0, count: 0 }
        };

        filteredPaidFacilities.forEach(f => {
            const status = f.accreditationStatus;
            let categoryKey: keyof typeof categories | null = null;

            if (status.includes('تأجيل')) {
                categoryKey = 'إيرادات رسوم تأجيل';
            } else if (status.includes('شهادات')) {
                categoryKey = 'إيرادات شهادات إضافية';
            } else if (status.includes('تجديد') && status.includes('مبدئي')) {
                categoryKey = 'إيرادات تجديد الاعتماد المبدئي';
            } else if (status.includes('تجديد')) {
                categoryKey = 'إيرادات تجديد الاعتماد';
            } else if (status.includes('مبدئي') && status.includes('بعد')) {
                categoryKey = 'إيرادات اعتماد بعد اعتماد مبدئي';
            } else if (status.includes('مبدئي')) {
                categoryKey = 'إيرادات الاعتماد المبدئي';
            } else if (status.includes('اعتماد')) {
                categoryKey = 'إيرادات الاعتماد';
            }

            if (categoryKey) {
                categories[categoryKey].value += f.amount || 0;
                categories[categoryKey].count += 1;
            }
        });

        return Object.entries(categories).map(([name, data]) => ({
            name,
            value: data.value,
            count: data.count
        }));
    }, [filteredPaidFacilities]);

    // دالة لفلترة وترتيب منشآت تسجيل المهن حسب الشهر المحدد ونوع المنشأة
    const getMedicalProfessionalRegistrationsForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !medicalProfessionalRegistrations || medicalProfessionalRegistrations.length === 0) return [];

        const filtered = medicalProfessionalRegistrations.filter(registration => {
            if (!registration.month) return false;
            const [year, month] = registration.month.split('-');
            const registrationMonth = parseInt(month);
            const registrationFiscalYear = getFiscalYear(registration.month + '-01');

            return registrationMonth === selectedMonth && registrationFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.facilityName.localeCompare(b.facilityName, 'ar');
        });
    };

    const filteredMedicalProfessionalRegistrations = getMedicalProfessionalRegistrationsForSelectedMonth();

    // دالة لفلترة وترتيب منشآت الخطط التصحيحية حسب الشهر المحدد ونوع المنشأة
    const getCorrectivePlanFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !correctivePlanFacilities || correctivePlanFacilities.length === 0) return [];

        const filtered = correctivePlanFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.facilityName.localeCompare(b.facilityName, 'ar');
        });
    };

    const filteredCorrectivePlanFacilities = getCorrectivePlanFacilitiesForSelectedMonth();

    // دالة لفلترة وترتيب منشآت المتطلبات الأساسية حسب الشهر المحدد ونوع المنشأة
    const getBasicRequirementsFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !basicRequirementsFacilities || basicRequirementsFacilities.length === 0) return [];

        const filtered = basicRequirementsFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.facilityName.localeCompare(b.facilityName, 'ar');
        });
    };

    const filteredBasicRequirementsFacilities = getBasicRequirementsFacilitiesForSelectedMonth();

    // دالة لفلترة وترتيب منشآت الالتماسات حسب الشهر المحدد ونوع المنشأة
    const getAppealsFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !appealsFacilities || appealsFacilities.length === 0) return [];

        const filtered = appealsFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.facilityName.localeCompare(b.facilityName, 'ar');
        });
    };

    const filteredAppealsFacilities = getAppealsFacilitiesForSelectedMonth();

    // دالة لفلترة وترتيب منشآت إصدار الشهادات حسب الشهر المحدد
    const getCertificateIssuanceFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !certificateIssuanceFacilities || certificateIssuanceFacilities.length === 0) return [];

        const filtered = certificateIssuanceFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.facilityName.localeCompare(b.facilityName, 'ar');
        });
    };

    const filteredCertificateIssuanceFacilities = getCertificateIssuanceFacilitiesForSelectedMonth();

    // دالة لفلترة وترتيب منشآت التجهيز للعرض على اللجنة حسب الشهر المحدد
    const getCommitteePreparationFacilitiesForSelectedMonth = () => {
        if (comparisonType !== 'monthly' || !committeePreparationFacilities || committeePreparationFacilities.length === 0) return [];

        const filtered = committeePreparationFacilities.filter(facility => {
            if (!facility.month) return false;
            const [year, month] = facility.month.split('-');
            const facilityMonth = parseInt(month);
            const facilityFiscalYear = getFiscalYear(facility.month + '-01');

            return facilityMonth === selectedMonth && facilityFiscalYear === targetYear;
        });

        return filtered.sort((a, b) => {
            return a.facilityName.localeCompare(b.facilityName, 'ar');
        });
    };

    const filteredCommitteePreparationFacilities = getCommitteePreparationFacilitiesForSelectedMonth();

    const preparePieData = (metric: 'newFacilities' | 'reviewedAppeals' | 'reviewedPlans' | 'accreditation' | 'renewal' | 'completion') => {
        if (comparisonType === 'yearly' || comparisonType === 'monthly') {
            let currentVal = 0;
            let previousVal = 0;

            switch (metric) {
                case 'newFacilities':
                    currentVal = currentTotalNewFacilities;
                    previousVal = previousTotalNewFacilities;
                    break;
                case 'reviewedAppeals':
                    currentVal = currentTotalAppeals;
                    previousVal = previousTotalAppeals;
                    break;
                case 'reviewedPlans':
                    currentVal = currentTotalPlans;
                    previousVal = previousTotalPlans;
                    break;
                case 'accreditation':
                    currentVal = currentTotalAccreditation;
                    previousVal = previousTotalAccreditation;
                    break;
                case 'renewal':
                    currentVal = currentTotalRenewal;
                    previousVal = previousTotalRenewal;
                    break;
                case 'completion':
                    currentVal = currentTotalCompletion;
                    previousVal = previousTotalCompletion;
                    break;
            }

            return [
                { name: `${targetYear}`, value: currentVal },
                { name: `${targetYear - 1}`, value: previousVal }
            ];
        } else if (comparisonType === 'quarterly' || comparisonType === 'halfYearly') {
            const currentAgg = aggregateData(currentYearData, comparisonType);
            const previousAgg = aggregateData(previousYearData, comparisonType);

            const periodKey = comparisonType === 'quarterly' ? `Q${selectedQuarter}` : `H${selectedHalf}`;
            const periodLabel = comparisonType === 'quarterly' ? `الربع ${selectedQuarter}` : `النصف ${selectedHalf}`;

            return [
                { name: `${periodLabel} ${targetYear}`, value: currentAgg[periodKey]?.[metric] || 0 },
                { name: `${periodLabel} ${targetYear - 1}`, value: previousAgg[periodKey]?.[metric] || 0 }
            ];
        } else {
            const aggregated = aggregateData(currentYearData, comparisonType);
            const periods = Object.keys(aggregated).sort();
            return periods.map(period => ({
                name: formatPeriodLabel(period),
                value: aggregated[period]?.[metric] || 0
            }));
        }
    };

    const newFacilitiesPieData = preparePieData('newFacilities');
    const appealsPieData = preparePieData('reviewedAppeals');
    const plansPieData = preparePieData('reviewedPlans');
    const accreditationPieData = preparePieData('accreditation');
    const renewalPieData = preparePieData('renewal');
    const completionPieData = preparePieData('completion');

    const prepareChartData = useCallback(() => {
        const currentPeriods = Object.keys(currentAggregated);
        const allPeriods = new Set<string>();

        currentPeriods.forEach(period => {
            allPeriods.add(period);
        });

        Object.keys(previousAggregated).forEach(prevPeriod => {
            if (comparisonType === 'monthly' && prevPeriod.includes('-')) {
                const [year, month] = prevPeriod.split('-');
                const nextYear = parseInt(year) + 1;
                const currentEquivalent = `${nextYear}-${month}`;
                allPeriods.add(currentEquivalent);
            } else {
                allPeriods.add(prevPeriod);
            }
        });

        let sortedPeriods = Array.from(allPeriods).sort();

        if (comparisonType === 'monthly') {
            sortedPeriods = sortedPeriods.filter(p => {
                if (p.includes('-')) {
                    const month = parseInt(p.split('-')[1]);
                    return month === selectedMonth;
                }
                return false;
            });
        } else if (comparisonType === 'quarterly') {
            const targetPeriod = `Q${selectedQuarter}`;
            sortedPeriods = sortedPeriods.filter(p => p === targetPeriod);
        } else if (comparisonType === 'halfYearly') {
            const targetPeriod = `H${selectedHalf}`;
            sortedPeriods = sortedPeriods.filter(p => p === targetPeriod);
        }

        return sortedPeriods.map(period => {
            let previousPeriodKey = period;

            if (comparisonType === 'monthly' && period.includes('-')) {
                const [year, month] = period.split('-');
                const currentYear = parseInt(year);
                const previousYear = currentYear - 1;
                previousPeriodKey = `${previousYear}-${month}`;
            }

            return {
                period: formatPeriodLabel(period),
                [`منشآت جديدة ${targetYear}`]: currentAggregated[period]?.newFacilities || 0,
                [`منشآت جديدة ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.newFacilities || 0,
                [`التماسات ${targetYear}`]: currentAggregated[period]?.reviewedAppeals || 0,
                [`التماسات ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.reviewedAppeals || 0,
                [`خطط ${targetYear}`]: currentAggregated[period]?.reviewedPlans || 0,
                [`خطط ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.reviewedPlans || 0,
                [`اعتماد ${targetYear}`]: currentAggregated[period]?.accreditation || 0,
                [`اعتماد ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.accreditation || 0,
                [`تجديد ${targetYear}`]: currentAggregated[period]?.renewal || 0,
                [`تجديد ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.renewal || 0,
                [`استكمال ${targetYear}`]: currentAggregated[period]?.completion || 0,
                [`استكمال ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.completion || 0,
            };
        });
    }, [comparisonType, currentAggregated, previousAggregated, selectedMonth, selectedQuarter, selectedHalf, targetYear, formatPeriodLabel]);

    const renderTableRows = useCallback(() => {
        let periods = Object.keys(currentAggregated).sort();

        if (comparisonType === 'monthly') {
            periods = periods.filter(p => {
                if (p.includes('-')) {
                    const month = parseInt(p.split('-')[1]);
                    return month === selectedMonth;
                }
                return false;
            });
        } else if (comparisonType === 'quarterly') {
            const targetPeriod = `Q${selectedQuarter}`;
            periods = periods.filter(p => p === targetPeriod);
        } else if (comparisonType === 'halfYearly') {
            const targetPeriod = `H${selectedHalf}`;
            periods = periods.filter(p => p === targetPeriod);
        }

        if (periods.length === 0) {
            return (
                <tr>
                    <td colSpan={13} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                        لا توجد بيانات متاحة للسنة المحددة
                    </td>
                </tr>
            );
        }

        return periods.map((period, index) => {
            let previousPeriodKey = period;

            if (comparisonType === 'monthly' && period.includes('-')) {
                const [year, month] = period.split('-');
                const currentYear = parseInt(year);
                const previousYear = currentYear - 1;
                previousPeriodKey = `${previousYear}-${month}`;
            }

            const currentData = currentAggregated[period];
            const previousData = previousAggregated[previousPeriodKey];

            return (
                <tr key={period} style={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--background-color)'
                }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{formatPeriodLabel(period)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.newFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.newFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.reviewedAppeals || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.reviewedAppeals || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.reviewedPlans || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.reviewedPlans || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.accreditation || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.accreditation || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.renewal || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.renewal || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.completion || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.completion || 0}</td>
                </tr>
            );
        });
    }, [comparisonType, currentAggregated, previousAggregated, selectedMonth, selectedQuarter, selectedHalf, formatPeriodLabel]);

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: 'var(--primary-color)' }}>
                    📊 لوحة البيانات القياسية
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>
                    الإدارة العامة للاعتماد والتسجيل - تحليلات ومقارنات
                </p>
            </div>

            <div style={{
                marginBottom: '30px',
                padding: '20px',
                backgroundColor: 'var(--card-bg)',
                borderRadius: '12px',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
                alignItems: 'center',
                border: '1px solid var(--border-color)'
            }}>
                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>
                        نوع المقارنة
                    </label>
                    <select
                        value={comparisonType}
                        onChange={(e) => setComparisonType(e.target.value as any)}
                        className="form-input"
                        style={{ width: '100%' }}
                    >
                        <option value="monthly">شهري</option>
                        <option value="quarterly">ربع سنوي</option>
                        <option value="halfYearly">نصف سنوي</option>
                        <option value="yearly">سنوي</option>
                    </select>
                </div>

                <div style={{ flex: '1', minWidth: '200px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>
                        السنة المالية (يوليو - يونيو)
                    </label>
                    <select
                        value={targetYear}
                        onChange={(e) => setTargetYear(parseInt(e.target.value))}
                        className="form-input"
                        style={{ width: '100%' }}
                    >
                        {[2026, 2025, 2024].map(year => (
                            <option key={year} value={year}>العام المالي {year - 1} - {year}</option>
                        ))}
                    </select>
                </div>

                {comparisonType === 'monthly' && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>
                            الشهر المحدد
                        </label>
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                            className="form-input"
                            style={{ width: '100%' }}
                        >
                            <option value={7}>يوليو</option>
                            <option value={8}>أغسطس</option>
                            <option value={9}>سبتمبر</option>
                            <option value={10}>أكتوبر</option>
                            <option value={11}>نوفمبر</option>
                            <option value={12}>ديسمبر</option>
                            <option value={1}>يناير</option>
                            <option value={2}>فبراير</option>
                            <option value={3}>مارس</option>
                            <option value={4}>أبريل</option>
                            <option value={5}>مايو</option>
                            <option value={6}>يونيو</option>
                        </select>
                    </div>
                )}

                {comparisonType === 'quarterly' && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>
                            الربع المحدد
                        </label>
                        <select
                            value={selectedQuarter}
                            onChange={(e) => setSelectedQuarter(parseInt(e.target.value))}
                            className="form-input"
                            style={{ width: '100%' }}
                        >
                            <option value={1}>الربع الأول (يوليو - سبتمبر)</option>
                            <option value={2}>الربع الثاني (أكتوبر - ديسمبر)</option>
                            <option value={3}>الربع الثالث (يناير - مارس)</option>
                            <option value={4}>الربع الرابع (أبريل - يونيو)</option>
                        </select>
                    </div>
                )}

                {comparisonType === 'halfYearly' && (
                    <div style={{ flex: '1', minWidth: '200px' }}>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: 'var(--text-color)' }}>
                            النصف المحدد
                        </label>
                        <select
                            value={selectedHalf}
                            onChange={(e) => setSelectedHalf(parseInt(e.target.value))}
                            className="form-input"
                            style={{ width: '100%' }}
                        >
                            <option value={1}>النصف الأول (يوليو - ديسمبر)</option>
                            <option value={2}>النصف الثاني (يناير - يونيو)</option>
                        </select>
                    </div>
                )}
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '35px'
            }}>
                <KPICard
                    title="منشآت جديدة"
                    icon="🏥"
                    currentValue={currentTotalNewFacilities}
                    previousValue={previousTotalNewFacilities}
                    changePercentage={newFacilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={newFacilitiesPieData}
                    color="#0eacb8"
                />
                <KPICard
                    title="التماسات مراجعة"
                    icon="📝"
                    currentValue={currentTotalAppeals}
                    previousValue={previousTotalAppeals}
                    changePercentage={appealsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={appealsPieData}
                    color="#8884d8"
                />
                <KPICard
                    title="خطط تصحيحية"
                    icon="📋"
                    currentValue={currentTotalPlans}
                    previousValue={previousTotalPlans}
                    changePercentage={plansChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={plansPieData}
                    color="#82ca9d"
                />
                <KPICard
                    title="اعتماد/اعتماد مبدئي"
                    icon="✅"
                    currentValue={currentTotalAccreditation}
                    previousValue={previousTotalAccreditation}
                    changePercentage={accreditationChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={accreditationPieData}
                    color="#ffc658"
                />
                <KPICard
                    title="تجديد اعتماد"
                    icon="🔄"
                    currentValue={currentTotalRenewal}
                    previousValue={previousTotalRenewal}
                    changePercentage={renewalChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={renewalPieData}
                    color="#ff7c7c"
                />
                <KPICard
                    title="استكمال اعتماد"
                    icon="🏁"
                    currentValue={currentTotalCompletion}
                    previousValue={previousTotalCompletion}
                    changePercentage={completionChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={completionPieData}
                    color="#6c757d"
                />
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-color)' }}>📈 الرسوم البيانية</h3>



                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h4 style={{ margin: 0, color: 'var(--text-color)' }}>مقارنة حالات الاعتماد</h4>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.accreditation}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, accreditation: e.target.checked })}
                                />
                                <span>اعتماد</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.renewal}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, renewal: e.target.checked })}
                                />
                                <span>تجديد</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.completion}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, completion: e.target.checked })}
                                />
                                <span>استكمال</span>
                            </label>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={prepareChartData()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="period" stroke="var(--text-color)" />
                            <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            {visibleMetrics.accreditation && (
                                <>
                                    <Bar dataKey={`اعتماد ${targetYear}`} fill="#ffc658">
                                        <LabelList
                                            dataKey={`اعتماد ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`اعتماد ${targetYear - 1}`} fill="#ffe5b4">
                                        <LabelList
                                            dataKey={`اعتماد ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.renewal && (
                                <>
                                    <Bar dataKey={`تجديد ${targetYear}`} fill="#ff7c7c">
                                        <LabelList
                                            dataKey={`تجديد ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`تجديد ${targetYear - 1}`} fill="#ffb3b3">
                                        <LabelList
                                            dataKey={`تجديد ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.completion && (
                                <>
                                    <Bar dataKey={`استكمال ${targetYear}`} fill="#6c757d">
                                        <LabelList
                                            dataKey={`استكمال ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`استكمال ${targetYear - 1}`} fill="#adb5bd">
                                        <LabelList
                                            dataKey={`استكمال ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-color)' }}>📊 جدول المقارنة التفصيلي</h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{
                        width: '100%',
                        borderCollapse: 'collapse',
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        fontSize: '0.9rem'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', width: '30%' }}>المؤشر</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{targetYear - 1} - {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{targetYear - 2} - {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.1)' }}>التغيير</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* منشآت جديدة */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    🏥 منشآت جديدة
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#0eacb8' }}>
                                    {currentTotalNewFacilities.toLocaleString('ar-EG')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalNewFacilities.toLocaleString('ar-EG')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: newFacilitiesChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {newFacilitiesChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(newFacilitiesChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* التماسات مراجعة */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    📝 التماسات مراجعة
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#8884d8' }}>
                                    {currentTotalAppeals.toLocaleString('ar-EG')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalAppeals.toLocaleString('ar-EG')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: appealsChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {appealsChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(appealsChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* خطط تصحيحية */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    📋 خطط تصحيحية
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#82ca9d' }}>
                                    {currentTotalPlans.toLocaleString('ar-EG')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalPlans.toLocaleString('ar-EG')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: plansChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {plansChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(plansChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* اعتماد/اعتماد مبدئي */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    ✅ اعتماد/اعتماد مبدئي
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#ffc658' }}>
                                    {currentTotalAccreditation.toLocaleString('ar-EG')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalAccreditation.toLocaleString('ar-EG')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: accreditationChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {accreditationChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(accreditationChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* تجديد اعتماد */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    🔄 تجديد اعتماد
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#ff7c7c' }}>
                                    {currentTotalRenewal.toLocaleString('ar-EG')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalRenewal.toLocaleString('ar-EG')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: renewalChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {renewalChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(renewalChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* استكمال اعتماد */}
                            <tr>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    🏁 استكمال اعتماد
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#6c757d' }}>
                                    {currentTotalCompletion.toLocaleString('ar-EG')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalCompletion.toLocaleString('ar-EG')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: completionChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {completionChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(completionChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>


            {/* Pipeline Visualization - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && (
                <div style={{ marginBottom: '50px', marginTop: '50px' }}>
                    <h3 style={{ textAlign: 'center', marginBottom: '40px', color: 'var(--text-color)' }}>
                        🛤️ تتبع مراحل المنشآت (Pipeline)
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>

                        {/* الأنبوب المركزي */}
                        <div style={{
                            position: 'absolute',
                            left: '50%',
                            transform: 'translateX(-50%)',
                            width: '20px',
                            height: '100%',
                            background: 'linear-gradient(to bottom, #bdc3c7, #2c3e50)',
                            borderRadius: '10px',
                            zIndex: 1
                        }}></div>

                        {/* المراحل */}
                        {[
                            { id: 1, title: 'مرحلة استكمال الطلب', count: filteredCompletionFacilities.length, color: '#e67e22', icon: '📝' },
                            { id: 2, title: 'مرحلة تم سداد الرسوم', count: filteredPaidFacilities.length, color: '#27ae60', icon: '💰' },
                            { id: 3, title: 'تم التحويل إلى تسجيل أعضاء مهن طبية', count: filteredMedicalProfessionalRegistrations.length, color: '#f1c40f', icon: '👨‍⚕️' },
                            { id: 4, title: 'تم التجهيز للعرض على اللجنة', count: filteredCommitteePreparationFacilities.length, color: '#8e44ad', icon: '⚖️' },
                            { id: 5, title: 'مرحلة اصدار الشهادات', count: filteredCertificateIssuanceFacilities.length, color: '#2980b9', icon: '🎓' },
                            { id: 6, title: 'الالتماسات', count: filteredAppealsFacilities.length, color: '#c0392b', icon: '📜' },
                            { id: 7, title: 'الخطط التصحيحية', count: filteredCorrectivePlanFacilities.length, color: '#7f8c8d', icon: '🔧' }
                        ].map((stage, index) => (
                            <div key={stage.id} style={{
                                display: 'flex',
                                justifyContent: index % 2 === 0 ? 'flex-start' : 'flex-end',
                                width: '100%',
                                marginBottom: '40px',
                                position: 'relative',
                                zIndex: 2
                            }}>
                                {/* المحتوى (يمين أو يسار) */}
                                <div style={{
                                    width: '45%',
                                    display: 'flex',
                                    justifyContent: index % 2 === 0 ? 'flex-end' : 'flex-start',
                                    paddingRight: index % 2 === 0 ? '40px' : '0',
                                    paddingLeft: index % 2 !== 0 ? '40px' : '0',
                                    alignItems: 'center'
                                }}>

                                    {/* بطاقة المرحلة */}
                                    <div style={{
                                        backgroundColor: 'var(--card-bg)',
                                        padding: '15px 25px',
                                        borderRadius: '15px',
                                        boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                        borderRight: index % 2 === 0 ? `5px solid ${stage.color}` : 'none',
                                        borderLeft: index % 2 !== 0 ? `5px solid ${stage.color}` : 'none',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        minWidth: '220px',
                                        position: 'relative'
                                    }}>

                                        {/* السهم المتجه للمركز */}
                                        <div style={{
                                            position: 'absolute',
                                            top: '50%',
                                            [index % 2 === 0 ? 'right' : 'left']: '-10px',
                                            transform: 'translateY(-50%) rotate(45deg)',
                                            width: '20px',
                                            height: '20px',
                                            backgroundColor: 'var(--card-bg)',
                                            zIndex: -1
                                        }}></div>

                                        <div style={{
                                            backgroundColor: stage.color,
                                            color: 'white',
                                            borderRadius: '50%',
                                            width: '30px',
                                            height: '30px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 'bold',
                                            marginBottom: '10px',
                                            alignSelf: index % 2 === 0 ? 'flex-end' : 'flex-start'
                                        }}>
                                            {stage.id}
                                        </div>

                                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-color)', textAlign: 'center', fontSize: '1rem' }}>
                                            {stage.icon} {stage.title}
                                        </h4>
                                        <div style={{
                                            background: `linear-gradient(45deg, ${stage.color}, ${stage.color}88)`,
                                            color: 'white',
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                        }}>
                                            {stage.count} منشأة
                                        </div>
                                    </div>
                                </div>

                                {/* الدائرة المركزية على الأنبوب */}
                                <div style={{
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '50%',
                                    backgroundColor: stage.color,
                                    border: '4px solid white',
                                    boxShadow: '0 0 10px rgba(0,0,0,0.3)',
                                    zIndex: 3
                                }}></div>
                            </div>
                        ))}

                        {/* السهم النهائي السفلي */}
                        <div style={{
                            width: '0',
                            height: '0',
                            borderLeft: '30px solid transparent',
                            borderRight: '30px solid transparent',
                            borderTop: '40px solid #2c3e50',
                            marginTop: '-10px',
                            zIndex: 1
                        }}></div>
                    </div>
                </div>
            )}

            {/* قسم المنشآت المتقدمة خلال الشهر - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && newFacilitiesOnly.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #0eacb8',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #0eacb8',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>📋</span>
                            <h3 style={{
                                margin: 0,
                                color: '#0eacb8',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                المنشآت المتقدمة (منشأة جديدة) {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear - 1} - {targetYear}
                            </h3>
                            <span style={{ fontSize: '1rem', color: '#666', fontWeight: '500' }}>
                                ({newFacilitiesOnly.length} منشأة)
                            </span>

                            <div style={{
                                marginLeft: 'auto',
                                display: 'flex',
                                backgroundColor: '#f0f2f5',
                                padding: '4px',
                                borderRadius: '8px',
                                gap: '4px'
                            }}>
                                <button
                                    onClick={() => setSection1View('charts')}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        backgroundColor: section1View === 'charts' ? '#0eacb8' : 'transparent',
                                        color: section1View === 'charts' ? 'white' : '#666',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📊 الرسوم البيانية
                                </button>
                                <button
                                    onClick={() => setSection1View('table')}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        backgroundColor: section1View === 'table' ? '#0eacb8' : 'transparent',
                                        color: section1View === 'table' ? 'white' : '#666',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📑 الجدول
                                </button>
                            </div>
                        </div>

                        {section1View === 'charts' ? (
                            <div>
                                <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', justifyContent: 'center' }}>
                                    <button
                                        onClick={() => setSection1ChartType('governorate')}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            border: `1px solid ${section1ChartType === 'governorate' ? '#0eacb8' : '#ddd'}`,
                                            backgroundColor: section1ChartType === 'governorate' ? 'rgba(14, 172, 184, 0.1)' : 'white',
                                            color: section1ChartType === 'governorate' ? '#0eacb8' : '#666',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        حسب المحافظة
                                    </button>
                                    <button
                                        onClick={() => setSection1ChartType('affiliation')}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            border: `1px solid ${section1ChartType === 'affiliation' ? '#0eacb8' : '#ddd'}`,
                                            backgroundColor: section1ChartType === 'affiliation' ? 'rgba(14, 172, 184, 0.1)' : 'white',
                                            color: section1ChartType === 'affiliation' ? '#0eacb8' : '#666',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        حسب التبعية
                                    </button>
                                    <button
                                        onClick={() => setSection1ChartType('standards')}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            border: `1px solid ${section1ChartType === 'standards' ? '#0eacb8' : '#ddd'}`,
                                            backgroundColor: section1ChartType === 'standards' ? 'rgba(14, 172, 184, 0.1)' : 'white',
                                            color: section1ChartType === 'standards' ? '#0eacb8' : '#666',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        حسب المعايير
                                    </button>
                                    <button
                                        onClick={() => setSection1ChartType('affiliation_governorate')}
                                        style={{
                                            padding: '8px 20px',
                                            borderRadius: '20px',
                                            border: `1px solid ${section1ChartType === 'affiliation_governorate' ? '#0eacb8' : '#ddd'}`,
                                            backgroundColor: section1ChartType === 'affiliation_governorate' ? 'rgba(14, 172, 184, 0.1)' : 'white',
                                            color: section1ChartType === 'affiliation_governorate' ? '#0eacb8' : '#666',
                                            cursor: 'pointer',
                                            fontWeight: '600',
                                            fontSize: '0.9rem'
                                        }}
                                    >
                                        حسب المحافظة والتبعية
                                    </button>
                                </div>

                                <div style={{ height: '450px', width: '100%' }}>
                                    {section1ChartData.length > 0 ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            {section1ChartType === 'affiliation_governorate' ? (
                                                <BarChart data={section1ChartData} margin={{ top: 20, right: 0, left: 20, bottom: 60 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                    <XAxis
                                                        dataKey="name"
                                                        interval={0}
                                                        angle={0}
                                                        textAnchor="middle"
                                                        style={{ fontSize: '0.8rem', fontWeight: 'bold' }}
                                                        tick={{ fill: '#333', dy: 15 }}
                                                        height={100}
                                                        axisLine={{ stroke: '#ddd' }}
                                                        tickLine={false}
                                                    />
                                                    <YAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Legend
                                                        layout="vertical"
                                                        verticalAlign="middle"
                                                        align="right"
                                                        wrapperStyle={{ right: 0, fontSize: "13px", color: "#000000" }}
                                                    />
                                                    {(() => {
                                                        // استخراج جميع المحافظات الموجودة في البيانات لعمل Stacks
                                                        const governorates = new Set<string>();
                                                        newFacilitiesOnly.forEach(f => governorates.add(f.governorate));

                                                        const colors = [
                                                            '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#00C49F',
                                                            '#FFBB28', '#FF8042', '#0088FE', '#00C49F', '#FFBB28',
                                                            '#FF8042', '#a4de6c', '#d0ed57', '#ffc658'
                                                        ];

                                                        return Array.from(governorates).map((gov, index) => (
                                                            <Bar
                                                                key={gov}
                                                                dataKey={gov}
                                                                stackId="a"
                                                                barSize={60}
                                                                fill={colors[index % colors.length]}
                                                                name={gov}
                                                            >
                                                                <LabelList
                                                                    dataKey={gov}
                                                                    position="center"
                                                                    style={{ fill: 'white', fontSize: '11px', fontWeight: 'bold', textShadow: '0px 0px 3px rgba(0,0,0,0.5)' }}
                                                                    formatter={(value: any) => value > 0 ? value : ''}
                                                                />
                                                            </Bar>
                                                        ));
                                                    })()}
                                                </BarChart>
                                            ) : (
                                                <BarChart data={section1ChartData} layout="horizontal" margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                                    <XAxis
                                                        dataKey="name"
                                                        type="category"
                                                        interval={0}
                                                        angle={0}
                                                        textAnchor="middle"
                                                        style={{ fontSize: '0.8rem', fontWeight: '600' }}
                                                        tick={{ fill: '#333', dy: 15 }}
                                                        height={60}
                                                        axisLine={{ stroke: '#ddd' }}
                                                        tickLine={false}
                                                    />
                                                    <YAxis type="number" allowDecimals={false} hide />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                    />
                                                    <Bar dataKey="value" name="عدد المنشآت الجديدة" fill="#0eacb8" radius={[4, 4, 0, 0]} barSize={40}>
                                                        <LabelList dataKey="value" position="insideTop" style={{ fontSize: '0.85rem', fontWeight: 'bold', fill: '#fff' }} dy={10} />
                                                    </Bar>
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    ) : (
                                        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                                            <span style={{ fontSize: '3rem', marginBottom: '10px' }}>🏥</span>
                                            لا توجد منشآت جديدة مسجلة لهذا الشهر
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.95rem'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0eacb8', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '60px' }}>#</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>المحافظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '200px' }}>حالة الاعتماد</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {newFacilitiesOnly.map((facility, index) => (
                                            <tr key={facility.id || index} style={{
                                                borderBottom: '1px solid #eee',
                                                backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--background-color)'
                                            }}>
                                                <td style={{ padding: '12px', fontWeight: '500', color: '#666' }}>{index + 1}</td>
                                                <td style={{ padding: '12px', fontWeight: '500' }}>{facility.facilityName}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{facility.governorate}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '6px 14px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                                                        color: '#4caf50',
                                                        fontWeight: '500',
                                                        display: 'inline-block'
                                                    }}>
                                                        {facility.accreditationStatus}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}





            {/* قسم منشآت الاستكمال - يظهر فقط في حالة الفلترة الشهرية */}


            {/* قسم منشآت السداد - يظهر فقط في حالة الفلترة الشهرية */}


            {/* قسم المنشآت المدفوعة - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && filteredPaidFacilities.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #6f42c1',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #6f42c1',
                            flexWrap: 'wrap'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>💰</span>
                            <h3 style={{
                                margin: 0,
                                color: '#6f42c1',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                المنشآت التي قامت بسداد رسوم الزيارة التقييمية {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear - 1} - {targetYear}
                            </h3>
                            <span style={{ fontSize: '1rem', color: '#666', fontWeight: '500' }}>
                                ({filteredPaidFacilities.length} منشأة - الإجمالي: {filteredPaidFacilities.reduce((sum, f) => sum + (f.amount || 0), 0).toLocaleString('ar-EG')} ج.م)
                            </span>

                            <div style={{
                                marginLeft: 'auto',
                                display: 'flex',
                                backgroundColor: '#f0f2f5',
                                padding: '4px',
                                borderRadius: '8px',
                                gap: '4px'
                            }}>
                                <button
                                    onClick={() => setPaidSectionView('charts')}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        backgroundColor: paidSectionView === 'charts' ? '#6f42c1' : 'transparent',
                                        color: paidSectionView === 'charts' ? 'white' : '#666',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📊 الرسوم البيانية
                                </button>
                                <button
                                    onClick={() => setPaidSectionView('table')}
                                    style={{
                                        padding: '6px 16px',
                                        borderRadius: '6px',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '0.9rem',
                                        fontWeight: '500',
                                        backgroundColor: paidSectionView === 'table' ? '#6f42c1' : 'transparent',
                                        color: paidSectionView === 'table' ? 'white' : '#666',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    📑 الجدول
                                </button>
                            </div>
                        </div>

                        {paidSectionView === 'charts' ? (
                            <div style={{ height: '400px', width: '100%', marginTop: '20px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                        data={paidFacilitiesChartData}
                                        margin={{ top: 30, right: 30, left: 20, bottom: 60 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#eee" />
                                        <XAxis
                                            dataKey="name"
                                            interval={0}
                                            angle={0}
                                            textAnchor="middle"
                                            style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                                            tickMargin={8}
                                            tickLine={false}
                                            axisLine={false}
                                        />
                                        <YAxis hide />
                                        <Tooltip
                                            formatter={(value: number, name: string, props: any) => {
                                                if (name === 'value') {
                                                    return [
                                                        `${value.toLocaleString('ar-EG')} ج.م`,
                                                        'الإيرادات'
                                                    ];
                                                }
                                                return [value, name];
                                            }}
                                            labelFormatter={(label) => {
                                                const item = paidFacilitiesChartData.find(d => d.name === label);
                                                return (
                                                    <span style={{ fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
                                                        {label}
                                                        {item && (
                                                            <span style={{ fontSize: '0.85rem', color: '#666', marginTop: '4px', display: 'block' }}>
                                                                عدد المنشآت: {item.count}
                                                            </span>
                                                        )}
                                                    </span>
                                                );
                                            }}
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                        />
                                        <Bar dataKey="value" fill="#6f42c1" radius={[4, 4, 0, 0]} barSize={50}>
                                            <LabelList
                                                dataKey="value"
                                                position="top"
                                                formatter={(value: any) => `${(value || 0).toLocaleString('ar-EG')}`}
                                                style={{ fontSize: '0.85rem', fontWeight: 'bold', fill: '#6f42c1' }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        ) : (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    fontSize: '0.95rem'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#6f42c1', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '60px' }}>#</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>المحافظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>حالة الاعتماد</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>القيمة المالية</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            // تجميع المنشآت حسب حالة الاعتماد
                                            const groupedFacilities = filteredPaidFacilities.reduce((groups, facility) => {
                                                const status = facility.accreditationStatus;
                                                if (!groups[status]) {
                                                    groups[status] = [];
                                                }
                                                groups[status].push(facility);
                                                return groups;
                                            }, {} as Record<string, typeof filteredPaidFacilities>);

                                            let globalIndex = 0;
                                            const rows: any[] = [];

                                            Object.entries(groupedFacilities).forEach(([status, facilities]) => {
                                                const groupTotal = facilities.reduce((sum, f) => sum + (f.amount || 0), 0);

                                                rows.push(
                                                    <tr key={`header-${status}`} style={{ backgroundColor: '#f8f9fa' }}>
                                                        <td colSpan={5} style={{
                                                            padding: '12px',
                                                            fontWeight: 'bold',
                                                            color: '#6f42c1',
                                                            fontSize: '1rem',
                                                            borderTop: '2px solid #6f42c1',
                                                            borderBottom: '1px solid #dee2e6'
                                                        }}>
                                                            {status} ({facilities.length} منشأة - الإجمالي: {groupTotal.toLocaleString('ar-EG')} ج.م)
                                                        </td>
                                                    </tr>
                                                );

                                                facilities.forEach((facility) => {
                                                    globalIndex++;
                                                    rows.push(
                                                        <tr key={facility.id || `facility-${globalIndex}`} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: globalIndex % 2 === 0 ? 'transparent' : 'var(--background-color)'
                                                        }}>
                                                            <td style={{ padding: '12px', fontWeight: '500', color: '#666' }}>{globalIndex}</td>
                                                            <td style={{ padding: '12px', fontWeight: '500' }}>{facility.facilityName}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{facility.governorate}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '6px 14px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.85rem',
                                                                    backgroundColor: 'rgba(111, 66, 193, 0.1)',
                                                                    color: '#6f42c1',
                                                                    fontWeight: '500',
                                                                    display: 'inline-block'
                                                                }}>
                                                                    {facility.accreditationStatus}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#6f42c1', fontSize: '1rem' }}>
                                                                {(facility.amount || 0).toLocaleString('ar-EG')} ج.م
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            });

                                            return rows;
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* قسم تسجيل مهن - يظهر فقط في حالة الفلترة الشهرية */}


            {/* قسم متابعة الخطط التصحيحية - يظهر فقط في حالة الفلترة الشهرية */}


            {/* قسم متابعة استكمال المتطلبات الأساسية - يظهر فقط في حالة الفلترة الشهرية */}


            {/* قسم دراسة الالتماسات - يظهر فقط في حالة الفلترة الشهرية */}


            {/* قسم المعوقات - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && currentObstacles && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #ffc107',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '15px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #ffc107'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <h3 style={{
                                margin: 0,
                                color: '#856404',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                المعوقات - {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear - 1} - {targetYear}
                            </h3>
                        </div>
                        <div style={{
                            backgroundColor: '#fff3cd',
                            padding: '20px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: '#856404',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {currentObstacles}
                        </div>
                    </div>
                </div>
            )}

            {/* قسم مقترحات التطوير - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && currentDevelopmentProposals && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #28a745',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '15px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #28a745'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>💡</span>
                            <h3 style={{
                                margin: 0,
                                color: '#155724',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                مقترحات التطوير - {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear - 1} - {targetYear}
                            </h3>
                        </div>
                        <div style={{
                            backgroundColor: '#d4edda',
                            padding: '20px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: '#155724',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {currentDevelopmentProposals}
                        </div>
                    </div>
                </div>
            )}

            {/* قسم الأنشطة الإضافية - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && currentAdditionalActivities && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #6f42c1',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            marginBottom: '15px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #6f42c1'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🎯</span>
                            <h3 style={{
                                margin: 0,
                                color: '#4a2c7a',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                أنشطة إضافية - {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear - 1} - {targetYear}
                            </h3>
                        </div>
                        <div style={{
                            backgroundColor: '#e8d9f5',
                            padding: '20px',
                            borderRadius: '8px',
                            fontSize: '1rem',
                            lineHeight: '1.6',
                            color: '#4a2c7a',
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-word'
                        }}>
                            {currentAdditionalActivities}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
