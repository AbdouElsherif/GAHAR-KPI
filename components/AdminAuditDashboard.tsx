'use client';

import { useState, useEffect } from 'react';
import KPICard from './KPICard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';

import { AdminAuditFacility, AdminAuditObservation, ObservationCorrectionRate } from '@/lib/firestore';

interface AdminAuditDashboardProps {
    submissions: Array<Record<string, any>>;
    facilities: AdminAuditFacility[];
    observations: AdminAuditObservation[];
    correctionRates?: ObservationCorrectionRate[];
    filterMonth?: string;
}

export default function AdminAuditDashboard({ submissions, facilities, observations, correctionRates = [], filterMonth }: AdminAuditDashboardProps) {
    const getFiscalYear = (dateStr: string): number => {
        const year = parseInt(dateStr.split('-')[0]);
        const month = parseInt(dateStr.split('-')[1]);
        return month >= 7 ? year + 1 : year; // يعيد سنة نهاية السنة المالية
    };

    // Calculate initial fiscal year based on current date
    const initialFiscalYear = (() => {
        const d = new Date();
        return d.getMonth() + 1 >= 7 ? d.getFullYear() + 1 : d.getFullYear();
    })();

    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(initialFiscalYear);
    const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 3));
    const [selectedHalf, setSelectedHalf] = useState<number>(Math.ceil((new Date().getMonth() + 1) / 6));
    const [visibleMetrics, setVisibleMetrics] = useState<{
        adminAudit: boolean;
        adminInspection: boolean;
        followUp: boolean;
        examReferral: boolean;
        facilities: boolean;

        seriousIncidentExam: boolean;
    }>({
        adminAudit: true,
        adminInspection: true,
        followUp: true,
        examReferral: true,
        facilities: true,

        seriousIncidentExam: true
    });
    const [activeVisitLocationChart, setActiveVisitLocationChart] = useState<'governorate' | 'governingAuthority'>('governorate');

    // Sync with external filter
    useEffect(() => {
        if (filterMonth) {
            setComparisonType('monthly');
            const [yearStr, monthStr] = filterMonth.split('-');
            const year = parseInt(yearStr);
            const month = parseInt(monthStr);

            // Calculate fiscal year end based on month
            // If month >= 7 (July-Dec), fiscal year ends next year. E.g. 2024-07 -> FY2025 (2024-2025)
            // If month < 7 (Jan-June), fiscal year ends current year. E.g. 2025-01 -> FY2025 (2024-2025)
            const fiscalYear = month >= 7 ? year + 1 : year;

            setTargetYear(fiscalYear);
            setSelectedMonth(month);
        }
    }, [filterMonth]);

    const getYear = (dateStr: string): number => {
        return parseInt(dateStr.split('-')[0]);
    };

    const getMonth = (dateStr: string): number => {
        return parseInt(dateStr.split('-')[1]);
    };

    const getQuarter = (month: number): number => {
        if (month >= 7 && month <= 9) return 1;
        if (month >= 10 && month <= 12) return 2;
        if (month >= 1 && month <= 3) return 3;
        return 4;
    };

    const getHalf = (month: number): number => {
        return month >= 7 ? 1 : 2;
    };

    const filterByYear = (fiscalYear: number) => {
        return submissions.filter(sub => sub.date && getFiscalYear(sub.date) === fiscalYear);
    };

    const aggregateData = (data: Array<Record<string, any>>, type: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly') => {
        const aggregated: Record<string, {
            totalFieldVisits: number;
            adminAuditVisits: number;
            adminInspectionVisits: number;
            followUpVisits: number;
            examReferralVisits: number;
            visitedFacilities: number;

            seriousIncidentExam: number;
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
                    totalFieldVisits: 0,
                    adminAuditVisits: 0,
                    adminInspectionVisits: 0,
                    followUpVisits: 0,
                    examReferralVisits: 0,
                    visitedFacilities: 0,

                    seriousIncidentExam: 0,
                    count: 0
                };
            }

            aggregated[periodKey].totalFieldVisits += parseFloat(sub.totalFieldVisits) || 0;
            aggregated[periodKey].adminAuditVisits += parseFloat(sub.adminAuditVisits) || 0;
            aggregated[periodKey].adminInspectionVisits += parseFloat(sub.adminInspectionVisits) || 0;
            aggregated[periodKey].followUpVisits += parseFloat(sub.followUpVisits) || 0;
            aggregated[periodKey].examReferralVisits += parseFloat(sub.examReferralVisits) || 0;
            aggregated[periodKey].visitedFacilities += parseFloat(sub.visitedFacilities) || 0;

            aggregated[periodKey].seriousIncidentExam += parseFloat(sub.seriousIncidentExam) || 0;
            aggregated[periodKey].count += 1;
        });

        return aggregated;
    };

    const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const currentYearData = filterByYear(targetYear);
    const previousYearData = filterByYear(targetYear - 1);

    const currentAggregated = aggregateData(currentYearData, comparisonType);
    const previousAggregated = aggregateData(previousYearData, comparisonType);

    // Calculate totals based on the selected comparison type
    const calculateFilteredTotal = (
        aggregated: Record<string, any>,
        metric: string,
        compType: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly'
    ): number => {
        if (compType === 'yearly') {
            return Object.values(aggregated).reduce((sum: number, period: any) =>
                sum + (period[metric] || 0), 0
            );
        } else if (compType === 'monthly') {
            // فلترة حسب الشهر المحدد
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
    };

    // Calculate totals for each metric
    const currentTotalFieldVisits = calculateFilteredTotal(currentAggregated, 'totalFieldVisits', comparisonType);
    const previousTotalFieldVisits = calculateFilteredTotal(previousAggregated, 'totalFieldVisits', comparisonType);
    const fieldVisitsChange = calculateChange(currentTotalFieldVisits, previousTotalFieldVisits);

    const currentTotalAdminAuditVisits = calculateFilteredTotal(currentAggregated, 'adminAuditVisits', comparisonType);
    const previousTotalAdminAuditVisits = calculateFilteredTotal(previousAggregated, 'adminAuditVisits', comparisonType);
    const adminAuditVisitsChange = calculateChange(currentTotalAdminAuditVisits, previousTotalAdminAuditVisits);

    const currentTotalAdminInspectionVisits = calculateFilteredTotal(currentAggregated, 'adminInspectionVisits', comparisonType);
    const previousTotalAdminInspectionVisits = calculateFilteredTotal(previousAggregated, 'adminInspectionVisits', comparisonType);
    const adminInspectionVisitsChange = calculateChange(currentTotalAdminInspectionVisits, previousTotalAdminInspectionVisits);

    const currentTotalFollowUpVisits = calculateFilteredTotal(currentAggregated, 'followUpVisits', comparisonType);
    const previousTotalFollowUpVisits = calculateFilteredTotal(previousAggregated, 'followUpVisits', comparisonType);
    const followUpVisitsChange = calculateChange(currentTotalFollowUpVisits, previousTotalFollowUpVisits);

    const currentTotalExamReferralVisits = calculateFilteredTotal(currentAggregated, 'examReferralVisits', comparisonType);
    const previousTotalExamReferralVisits = calculateFilteredTotal(previousAggregated, 'examReferralVisits', comparisonType);
    const examReferralVisitsChange = calculateChange(currentTotalExamReferralVisits, previousTotalExamReferralVisits);

    const currentTotalVisitedFacilities = calculateFilteredTotal(currentAggregated, 'visitedFacilities', comparisonType);
    const previousTotalVisitedFacilities = calculateFilteredTotal(previousAggregated, 'visitedFacilities', comparisonType);
    const visitedFacilitiesChange = calculateChange(currentTotalVisitedFacilities, previousTotalVisitedFacilities);



    const currentTotalSeriousIncidentExam = calculateFilteredTotal(currentAggregated, 'seriousIncidentExam', comparisonType);
    const previousTotalSeriousIncidentExam = calculateFilteredTotal(previousAggregated, 'seriousIncidentExam', comparisonType);
    const seriousIncidentExamChange = calculateChange(currentTotalSeriousIncidentExam, previousTotalSeriousIncidentExam);

    const formatPeriodLabel = (period: string): string => {
        if (period.startsWith('Q')) return `الربع ${period.slice(1)}`;
        if (period.startsWith('H')) return `النصف ${period.slice(1)}`;
        if (period === 'السنة الكاملة') return period;
        if (period.includes('-')) {
            const [year, month] = period.split('-');
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            return monthNames[parseInt(month) - 1];
        }
        return period;
    };

    const getDetailedTableColumnLabel = (fiscalYear: number): string => {
        const fiscalYearRange = `${fiscalYear - 1} - ${fiscalYear}`;

        if (comparisonType === 'monthly') {
            const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
            return `${monthNames[selectedMonth - 1]} (${fiscalYearRange})`;
        }

        if (comparisonType === 'quarterly') {
            return `الربع ${selectedQuarter} (${fiscalYearRange})`;
        }

        if (comparisonType === 'halfYearly') {
            return `النصف ${selectedHalf} (${fiscalYearRange})`;
        }

        return `السنة المالية (${fiscalYearRange})`;
    };

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

    const getNotesForSelectedMonth = (): string => {
        if (comparisonType !== 'monthly') return '';

        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return monthData?.notes || '';
    };

    const currentNotes = getNotesForSelectedMonth();

    const preparePieData = (metric: 'totalFieldVisits' | 'adminAuditVisits' | 'adminInspectionVisits' | 'followUpVisits' | 'examReferralVisits' | 'visitedFacilities' | 'seriousIncidentExam') => {
        if (comparisonType === 'yearly' || comparisonType === 'monthly') {
            let currentVal = 0;
            let previousVal = 0;

            switch (metric) {
                case 'totalFieldVisits':
                    currentVal = currentTotalFieldVisits;
                    previousVal = previousTotalFieldVisits;
                    break;
                case 'adminAuditVisits':
                    currentVal = currentTotalAdminAuditVisits;
                    previousVal = previousTotalAdminAuditVisits;
                    break;
                case 'adminInspectionVisits':
                    currentVal = currentTotalAdminInspectionVisits;
                    previousVal = previousTotalAdminInspectionVisits;
                    break;
                case 'followUpVisits':
                    currentVal = currentTotalFollowUpVisits;
                    previousVal = previousTotalFollowUpVisits;
                    break;
                case 'examReferralVisits':
                    currentVal = currentTotalExamReferralVisits;
                    previousVal = previousTotalExamReferralVisits;
                    break;
                case 'visitedFacilities':
                    currentVal = currentTotalVisitedFacilities;
                    previousVal = previousTotalVisitedFacilities;
                    break;

                case 'seriousIncidentExam':
                    currentVal = currentTotalSeriousIncidentExam;
                    previousVal = previousTotalSeriousIncidentExam;
                    break;
            }

            return [
                { name: `${targetYear}`, value: currentVal },
                { name: `${targetYear - 1}`, value: previousVal }
            ];
        } else if (comparisonType === 'quarterly' || comparisonType === 'halfYearly') {
            // للمقارنة الربع سنوية أو النصف سنوية - عرض الفترة المختارة فقط
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

    const fieldVisitsPieData = preparePieData('totalFieldVisits');
    const adminAuditVisitsPieData = preparePieData('adminAuditVisits');
    const adminInspectionVisitsPieData = preparePieData('adminInspectionVisits');
    const followUpVisitsPieData = preparePieData('followUpVisits');
    const examReferralVisitsPieData = preparePieData('examReferralVisits');
    const visitedFacilitiesPieData = preparePieData('visitedFacilities');

    const seriousIncidentExamPieData = preparePieData('seriousIncidentExam');

    function prepareChartData() {
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

        // تصفية حسب الفترة المختارة للمقارنة الربع سنوية أو النصف سنوية
        if (comparisonType === 'monthly') {
            // فلترة حسب الشهر المحدد فقط
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
                [`إجمالي زيارات ${targetYear}`]: currentAggregated[period]?.totalFieldVisits || 0,
                [`إجمالي زيارات ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.totalFieldVisits || 0,
                [`تدقيق ${targetYear}`]: currentAggregated[period]?.adminAuditVisits || 0,
                [`تدقيق ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.adminAuditVisits || 0,
                [`تفتيش ${targetYear}`]: currentAggregated[period]?.adminInspectionVisits || 0,
                [`تفتيش ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.adminInspectionVisits || 0,
                [`متابعة ${targetYear}`]: currentAggregated[period]?.followUpVisits || 0,
                [`متابعة ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.followUpVisits || 0,
                [`فحص/إحالة ${targetYear}`]: currentAggregated[period]?.examReferralVisits || 0,
                [`فحص/إحالة ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.examReferralVisits || 0,
                [`منشآت ${targetYear}`]: currentAggregated[period]?.visitedFacilities || 0,
                [`منشآت ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.visitedFacilities || 0,
            };
        });
    }

    function renderTableRows() {
        let periods = Object.keys(currentAggregated).sort();

        // تصفية حسب الفترة المختارة للمقارنة الربع سنوية أو النصف سنوية
        if (comparisonType === 'monthly') {
            // فلترة حسب الشهر المحدد فقط
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.totalFieldVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.totalFieldVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.adminAuditVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.adminAuditVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.adminInspectionVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.adminInspectionVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.followUpVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.followUpVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.examReferralVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.examReferralVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.visitedFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.visitedFacilities || 0}</td>
                </tr>
            );
        });
    }

    const isMonthInSelectedAnalysisPeriod = (monthValue: string): boolean => {
        if (!monthValue) return false;

        const month = getMonth(monthValue);
        if (getFiscalYear(monthValue) !== targetYear) return false;

        if (comparisonType === 'monthly') {
            return month === selectedMonth;
        }

        if (comparisonType === 'quarterly') {
            return getQuarter(month) === selectedQuarter;
        }

        return false;
    };

    const selectedAnalysisFacilities = facilities.filter(facility => isMonthInSelectedAnalysisPeriod(facility.month));
    const selectedAnalysisObservations = observations.filter(observation => isMonthInSelectedAnalysisPeriod(observation.month));
    const selectedAnalysisCorrectionRates = correctionRates.filter(rate => isMonthInSelectedAnalysisPeriod(rate.month));

    const getVisitAnalysisPeriodLabel = (): string => {
        const fiscalYearRange = `${targetYear - 1} - ${targetYear}`;

        if (comparisonType === 'quarterly') {
            return `الربع ${selectedQuarter} (${fiscalYearRange})`;
        }

        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        return `${monthNames[selectedMonth - 1]} (${fiscalYearRange})`;
    };

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: 'var(--primary-color)' }}>
                    📊 لوحة البيانات القياسية
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>
                    الإدارة العامة للرقابة الإدارية على المنشآت الصحية - تحليلات ومقارنات
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
                        disabled={!!filterMonth}
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
                        disabled={!!filterMonth}
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
                            disabled={!!filterMonth}
                        >
                            {[
                                { value: 7, label: 'يوليو' },
                                { value: 8, label: 'أغسطس' },
                                { value: 9, label: 'سبتمبر' },
                                { value: 10, label: 'أكتوبر' },
                                { value: 11, label: 'نوفمبر' },
                                { value: 12, label: 'ديسمبر' },
                                { value: 1, label: 'يناير' },
                                { value: 2, label: 'فبراير' },
                                { value: 3, label: 'مارس' },
                                { value: 4, label: 'أبريل' },
                                { value: 5, label: 'مايو' },
                                { value: 6, label: 'يونيو' },
                            ].map(month => (
                                <option key={month.value} value={month.value}>{month.label}</option>
                            ))}
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
                    title="إجمالي الزيارات الميدانية"
                    icon="🏥"
                    currentValue={currentTotalFieldVisits}
                    previousValue={previousTotalFieldVisits}
                    changePercentage={fieldVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={fieldVisitsPieData}
                    color="#0eacb8"
                />
                <KPICard
                    title="تدقيق إداري وسلامة بيئية"
                    icon="🔍"
                    currentValue={currentTotalAdminAuditVisits}
                    previousValue={previousTotalAdminAuditVisits}
                    changePercentage={adminAuditVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={adminAuditVisitsPieData}
                    color="#8884d8"
                />
                <KPICard
                    title="تفتيش إداري"
                    icon="📋"
                    currentValue={currentTotalAdminInspectionVisits}
                    previousValue={previousTotalAdminInspectionVisits}
                    changePercentage={adminInspectionVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={adminInspectionVisitsPieData}
                    color="#82ca9d"
                />
                <KPICard
                    title="زيارات متابعة"
                    icon="🔄"
                    currentValue={currentTotalFollowUpVisits}
                    previousValue={previousTotalFollowUpVisits}
                    changePercentage={followUpVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={followUpVisitsPieData}
                    color="#ffc658"
                />
                <KPICard
                    title="فحص / إحالة / تكليف"
                    icon="📄"
                    currentValue={currentTotalExamReferralVisits}
                    previousValue={previousTotalExamReferralVisits}
                    changePercentage={examReferralVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={examReferralVisitsPieData}
                    color="#ff8042"
                />
                <KPICard
                    title="عدد المنشآت التي تم زيارتها"
                    icon="🏢"
                    currentValue={currentTotalVisitedFacilities}
                    previousValue={previousTotalVisitedFacilities}
                    changePercentage={visitedFacilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={visitedFacilitiesPieData}
                    color="#a4de6c"
                />
                <KPICard
                    title="فحص حدث جسيم"
                    icon="⚠️"
                    currentValue={currentTotalSeriousIncidentExam}
                    previousValue={previousTotalSeriousIncidentExam}
                    changePercentage={seriousIncidentExamChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={seriousIncidentExamPieData}
                    color="#f44336"
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
                        <h4 style={{ margin: 0, color: 'var(--text-color)' }}>مقارنة أنواع الزيارات - رسم بياني عمودي</h4>
                        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.adminAudit}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, adminAudit: e.target.checked })}
                                />
                                <span>تدقيق</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.adminInspection}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, adminInspection: e.target.checked })}
                                />
                                <span>تفتيش</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.followUp}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, followUp: e.target.checked })}
                                />
                                <span>متابعة</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.examReferral}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, examReferral: e.target.checked })}
                                />
                                <span>فحص/إحالة</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.facilities}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, facilities: e.target.checked })}
                                />
                                <span>منشآت</span>
                            </label>
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
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
                            {visibleMetrics.adminAudit && (
                                <>
                                    <Bar dataKey={`تدقيق ${targetYear}`} fill="#8884d8">
                                        <LabelList
                                            dataKey={`تدقيق ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`تدقيق ${targetYear - 1}`} fill="#c5c5e8">
                                        <LabelList
                                            dataKey={`تدقيق ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.adminInspection && (
                                <>
                                    <Bar dataKey={`تفتيش ${targetYear}`} fill="#82ca9d">
                                        <LabelList
                                            dataKey={`تفتيش ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`تفتيش ${targetYear - 1}`} fill="#c5e8d5">
                                        <LabelList
                                            dataKey={`تفتيش ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.followUp && (
                                <>
                                    <Bar dataKey={`متابعة ${targetYear}`} fill="#ffc658">
                                        <LabelList
                                            dataKey={`متابعة ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`متابعة ${targetYear - 1}`} fill="#ffe5b4">
                                        <LabelList
                                            dataKey={`متابعة ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.examReferral && (
                                <>
                                    <Bar dataKey={`فحص/إحالة ${targetYear}`} fill="#ff8042">
                                        <LabelList
                                            dataKey={`فحص/إحالة ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`فحص/إحالة ${targetYear - 1}`} fill="#ffccb3">
                                        <LabelList
                                            dataKey={`فحص/إحالة ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.facilities && (
                                <>
                                    <Bar dataKey={`منشآت ${targetYear}`} fill="#a4de6c">
                                        <LabelList
                                            dataKey={`منشآت ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`منشآت ${targetYear - 1}`} fill="#d4f0b8">
                                        <LabelList
                                            dataKey={`منشآت ${targetYear - 1}`}
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
                        overflow: 'hidden'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>المؤشر</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {getDetailedTableColumnLabel(targetYear)}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {getDetailedTableColumnLabel(targetYear - 1)}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const indicators = [
                                    { label: 'تدقيق إداري وسلامة بيئية', current: currentTotalAdminAuditVisits, previous: previousTotalAdminAuditVisits },
                                    { label: 'تفتيش إداري', current: currentTotalAdminInspectionVisits, previous: previousTotalAdminInspectionVisits },
                                    { label: 'زيارات متابعة', current: currentTotalFollowUpVisits, previous: previousTotalFollowUpVisits },
                                    { label: 'فحص / إحالة / تكليف', current: currentTotalExamReferralVisits, previous: previousTotalExamReferralVisits },
                                    { label: 'فحص حدث جسيم', current: currentTotalSeriousIncidentExam, previous: previousTotalSeriousIncidentExam },
                                ];

                                const totalCurrent = indicators.reduce((sum, ind) => sum + ind.current, 0);
                                const totalPrevious = indicators.reduce((sum, ind) => sum + ind.previous, 0);

                                return (
                                    <>
                                        {indicators.map((ind, index) => (
                                            <tr key={ind.label} style={{
                                                borderBottom: '1px solid #eee',
                                                backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--background-color)'
                                            }}>
                                                <td style={{ padding: '12px', fontWeight: '500' }}>{ind.label}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{ind.current}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{ind.previous}</td>
                                            </tr>
                                        ))}
                                        <tr style={{
                                            borderTop: '2px solid var(--primary-color)',
                                            backgroundColor: 'var(--primary-color)',
                                            fontWeight: 'bold',
                                            color: 'white'
                                        }}>
                                            <td style={{ padding: '12px', fontWeight: 'bold', color: 'white' }}>المجموع</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'white', fontSize: '1.1rem' }}>{totalCurrent}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: 'white', fontSize: '1.1rem' }}>{totalPrevious}</td>
                                        </tr>
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

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
                                })()} {targetYear}
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
                                })()} {targetYear}
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

            {/* قسم تحليل الزيارات - يظهر في المقارنة الشهرية والربع سنوية */}
            {(comparisonType === 'monthly' || comparisonType === 'quarterly') && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📊</span>
                        <h3 style={{
                            margin: 0,
                            color: 'var(--primary-color)',
                            fontSize: '1.3rem',
                            fontWeight: 'bold'
                        }}>
                            تحليل الزيارات - {getVisitAnalysisPeriodLabel()}
                        </h3>
                    </div>

                    {/* Container for charts */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '20px'
                    }}>
                        {/* Chart 1: Visit Type Distribution */}
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '25px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{
                                margin: '0 0 20px 0',
                                color: 'var(--text-color)',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                🎯 توزيع الزيارات حسب نوع الزيارة
                            </h4>
                            {(() => {
                                // Count by visit type
                                const visitTypeCount: { [key: string]: number } = {};
                                selectedAnalysisFacilities.forEach(f => {
                                    const type = f.visitType || 'غير محدد';
                                    visitTypeCount[type] = (visitTypeCount[type] || 0) + 1;
                                });

                                // Color palette for visit types
                                const visitTypeColors: { [key: string]: string } = {
                                    'تدقيق إداري وسلامة بيئية': '#0d6a79',
                                    'تفتيش إداري': '#28a745',
                                    'زيارة متابعة': '#ffc107',
                                    'فحص / إحالة / تكليف': '#dc3545',
                                    'فحص حدث جسيم': '#6f42c1'
                                };

                                const visitTypeData = Object.entries(visitTypeCount)
                                    .map(([name, value]) => ({
                                        name: name.length > 15 ? name.substring(0, 15) + '...' : name,
                                        fullName: name,
                                        value,
                                        color: visitTypeColors[name] || '#17a2b8'
                                    }))
                                    .sort((a, b) => b.value - a.value);

                                const total = visitTypeData.reduce((sum, item) => sum + item.value, 0);

                                if (total === 0) {
                                    return (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '40px',
                                            color: '#6c757d'
                                        }}>
                                            لا توجد زيارات مسجلة لهذه الفترة
                                        </div>
                                    );
                                }

                                return (
                                    <div>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={visitTypeData} layout="horizontal" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="var(--text-color)"
                                                    tick={{ fontSize: 10, dy: 8 }}
                                                    interval={0}
                                                    textAnchor="middle"
                                                    height={60}
                                                />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} domain={[0, Math.max(...visitTypeData.map(d => d.value)) + 3]} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: number, name: string, props: any) => [`${value} زيارة`, props.payload.fullName]}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {visitTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="value"
                                                        position="top"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            fill: 'var(--text-color)',
                                                            fontSize: '14px'
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            marginTop: '15px'
                                        }}>
                                            {visitTypeData.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        backgroundColor: 'rgba(0,0,0,0.03)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        backgroundColor: item.color,
                                                        borderRadius: '3px'
                                                    }}></div>
                                                    <span style={{ fontSize: '0.85rem' }}>{item.fullName}: {item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* Chart 2: Facility Type Distribution */}
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '25px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{
                                margin: '0 0 20px 0',
                                color: 'var(--text-color)',
                                fontSize: '1.1rem',
                                fontWeight: 'bold',
                                textAlign: 'center'
                            }}>
                                🏥 توزيع الزيارات حسب نوع المنشأة
                            </h4>
                            {(() => {
                                // Group by facility type
                                const facilityTypeCount: { [key: string]: number } = {};
                                selectedAnalysisFacilities.forEach(f => {
                                    const type = f.facilityType || 'غير محدد';
                                    facilityTypeCount[type] = (facilityTypeCount[type] || 0) + 1;
                                });

                                // Color palette for facility types
                                const colors = [
                                    '#0d6a79', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
                                    '#17a2b8', '#fd7e14', '#20c997', '#e83e8c', '#6610f2'
                                ];

                                const facilityTypeData = Object.entries(facilityTypeCount)
                                    .map(([name, value], index) => ({
                                        name,
                                        value,
                                        color: colors[index % colors.length]
                                    }))
                                    .sort((a, b) => b.value - a.value);

                                if (facilityTypeData.length === 0) {
                                    return (
                                        <div style={{
                                            textAlign: 'center',
                                            padding: '40px',
                                            color: '#6c757d'
                                        }}>
                                            لا توجد زيارات مسجلة لهذه الفترة
                                        </div>
                                    );
                                }

                                return (
                                    <div>
                                        <ResponsiveContainer width="100%" height={250}>
                                            <BarChart data={facilityTypeData} layout="horizontal">
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="var(--text-color)"
                                                    tick={{ fontSize: 11, dy: 8 }}
                                                    interval={0}
                                                    textAnchor="middle"
                                                    height={50}
                                                />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} domain={[0, Math.max(...facilityTypeData.map(d => d.value)) + 3]} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: number) => [`${value} زيارة`, 'العدد']}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {facilityTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="value"
                                                        position="top"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            fill: 'var(--text-color)',
                                                            fontSize: '14px'
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                            gap: '15px',
                                            marginTop: '15px'
                                        }}>
                                            {facilityTypeData.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        backgroundColor: 'rgba(0,0,0,0.03)',
                                                        borderRadius: '15px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        backgroundColor: item.color,
                                                        borderRadius: '3px'
                                                    }}></div>
                                                    <span style={{ fontSize: '0.85rem' }}>{item.name}: {item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Visit location/authority distribution */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        marginTop: '20px'
                    }}>
                        <h4 style={{
                            margin: '0 0 20px 0',
                            color: 'var(--text-color)',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            🏢 الزيارات الميدانية
                        </h4>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '14px',
                            flexWrap: 'wrap',
                            marginBottom: '22px'
                        }}>
                            {[
                                { key: 'governorate' as const, label: 'حسب المحافظة' },
                                { key: 'governingAuthority' as const, label: 'حسب الجهة الحاكمة' }
                            ].map(option => {
                                const isActive = activeVisitLocationChart === option.key;
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => setActiveVisitLocationChart(option.key)}
                                        style={{
                                            minWidth: '175px',
                                            border: 'none',
                                            borderRadius: '24px',
                                            padding: '12px 24px',
                                            backgroundColor: isActive ? 'var(--primary-color)' : '#e9ecef',
                                            color: isActive ? 'white' : 'var(--text-color)',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: 'pointer',
                                            boxShadow: isActive ? '0 4px 10px rgba(13, 106, 121, 0.25)' : 'none',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                        {(() => {
                            const colors = [
                                '#0d6a79', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
                                '#17a2b8', '#fd7e14', '#20c997', '#e83e8c', '#6610f2'
                            ];
                            const chartTitle = activeVisitLocationChart === 'governorate'
                                ? '📍 توزيع الزيارات حسب المحافظة'
                                : '🏛️ توزيع الزيارات حسب الجهة الحاكمة';
                            const legendMinWidth = activeVisitLocationChart === 'governorate' ? '120px' : '160px';
                            const distributionCount: { [key: string]: number } = {};

                            selectedAnalysisFacilities.forEach(f => {
                                const name = activeVisitLocationChart === 'governorate'
                                    ? f.governorate || 'غير محدد'
                                    : f.affiliation || 'غير محدد';
                                distributionCount[name] = (distributionCount[name] || 0) + 1;
                            });

                            const distributionData = Object.entries(distributionCount)
                                .map(([name, value], index) => ({
                                    name,
                                    value,
                                    color: colors[index % colors.length]
                                }))
                                .sort((a, b) => b.value - a.value);

                            if (distributionData.length === 0) {
                                return (
                                    <div style={{
                                        textAlign: 'center',
                                        padding: '40px',
                                        color: '#6c757d'
                                    }}>
                                        لا توجد زيارات مسجلة لهذه الفترة
                                    </div>
                                );
                            }

                            return (
                                <div>
                                    <h5 style={{
                                        margin: '0 0 16px 0',
                                        color: 'var(--text-color)',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        textAlign: 'center'
                                    }}>
                                        {chartTitle}
                                    </h5>
                                    <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: '20px' }}>
                                        <div style={{ flex: 1 }}>
                                            <ResponsiveContainer width="100%" height={280}>
                                                <BarChart data={distributionData} layout="horizontal" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                                                    <Tooltip
                                                        contentStyle={{
                                                            backgroundColor: 'var(--card-bg)',
                                                            border: '1px solid var(--border-color)',
                                                            borderRadius: '8px'
                                                        }}
                                                        labelFormatter={() => ''}
                                                        formatter={(value: number, name: string, props: any) => [`${value}`, `${props.payload.name}: `]}
                                                    />
                                                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                        {distributionData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                        <LabelList
                                                            dataKey="value"
                                                            position="top"
                                                            style={{
                                                                fontWeight: 'bold',
                                                                fill: 'var(--text-color)',
                                                                fontSize: '14px'
                                                            }}
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '8px',
                                            minWidth: legendMinWidth
                                        }}>
                                            {distributionData.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        backgroundColor: 'rgba(0,0,0,0.03)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        backgroundColor: item.color,
                                                        borderRadius: '3px'
                                                    }}></div>
                                                    <span style={{ fontSize: '0.85rem' }}>{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* Total visits summary */}
                    {(() => {
                        const filteredCount = selectedAnalysisFacilities.length;

                        if (filteredCount > 0) {
                            return (
                                <div style={{
                                    backgroundColor: 'var(--primary-color)',
                                    color: 'white',
                                    padding: '15px 25px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '15px',
                                    fontWeight: 'bold',
                                    marginTop: '20px',
                                    fontSize: '1.1rem'
                                }}>
                                    <span>📈</span>
                                    <span>إجمالي الزيارات الميدانية: {filteredCount} زيارة</span>
                                </div>
                            );
                        }
                        return null;
                    })()}
                </div>
            )}


            {/* قسم تحليل الملاحظات المتكررة - رسوم بيانية */}
            {(comparisonType === 'monthly' || comparisonType === 'quarterly') && observations.length > 0 && (
                <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '15px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🔄</span>
                        <h3 style={{
                            margin: 0,
                            color: '#dc3545',
                            fontSize: '1.3rem',
                            fontWeight: 'bold'
                        }}>
                            تحليل الملاحظات المتكررة - {getVisitAnalysisPeriodLabel()}
                        </h3>
                    </div>

                    {/* ملاحظة حول احتساب نسب التطابق */}
                    <div style={{
                        padding: '12px 16px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        marginBottom: '20px',
                        border: '1px solid #ffc107',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                        <span style={{ color: '#856404', fontWeight: '500' }}>
                            نسب التطابق يتم احتسابها بصورة ربع سنوية فقط
                        </span>
                    </div>

                    {(() => {
                        const filteredObs = selectedAnalysisObservations;

                        if (filteredObs.length === 0) {
                            return <p style={{ textAlign: 'center', color: '#6c757d' }}>لا توجد ملاحظات متكررة لهذه الفترة</p>;
                        }

                        // Group by facility type
                        const facilityTypeCount: { [key: string]: number } = {};
                        filteredObs.forEach(o => {
                            const type = o.facilityType || 'غير محدد';
                            facilityTypeCount[type] = (facilityTypeCount[type] || 0) + 1;
                        });

                        // Group by entity type
                        const entityTypeCount: { [key: string]: number } = {};
                        filteredObs.forEach(o => {
                            const entity = o.entityType || 'غير محدد';
                            entityTypeCount[entity] = (entityTypeCount[entity] || 0) + 1;
                        });

                        // Color palettes
                        const facilityColors = ['#0d6a79', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8', '#fd7e14'];
                        const entityColors = ['#1565c0', '#e65100', '#2e7d32'];

                        const facilityTypeData = Object.entries(facilityTypeCount)
                            .map(([name, value], index) => ({
                                name,
                                value,
                                color: facilityColors[index % facilityColors.length]
                            }))
                            .sort((a, b) => b.value - a.value);

                        const entityTypeData = Object.entries(entityTypeCount)
                            .map(([name, value], index) => ({
                                name: name === 'المنشآت الصحية التابعة لهيئة الرعاية الصحية' ? 'هيئة الرعاية' :
                                    name === 'منشآت تابعة لوزارة الصحة' ? 'وزارة الصحة' :
                                        name === 'منشآت تابعة لجهات أخرى' ? 'جهات أخرى' : name,
                                fullName: name,
                                value,
                                color: entityColors[index % entityColors.length]
                            }))
                            .sort((a, b) => b.value - a.value);

                        return (
                            <div>
                                {/* Container for both charts */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                                    gap: '20px'
                                }}>
                                    {/* Chart 1: Facility Type Distribution */}
                                    <div style={{
                                        backgroundColor: 'var(--card-bg)',
                                        borderRadius: '12px',
                                        padding: '25px',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <h4 style={{
                                            margin: '0 0 20px 0',
                                            color: 'var(--text-color)',
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}>
                                            🏥 توزيع الملاحظات حسب نوع المنشأة
                                        </h4>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={facilityTypeData} layout="horizontal" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="var(--text-color)"
                                                    tick={{ fontSize: 11, dy: 8 }}
                                                    interval={0}
                                                    textAnchor="middle"
                                                    height={50}
                                                />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} domain={[0, Math.max(...facilityTypeData.map(d => d.value)) + 3]} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: number) => [`${value} ملاحظة`, 'العدد']}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {facilityTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="value"
                                                        position="top"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            fill: 'var(--text-color)',
                                                            fontSize: '14px'
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                            gap: '10px',
                                            marginTop: '15px'
                                        }}>
                                            {facilityTypeData.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        backgroundColor: 'rgba(0,0,0,0.03)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        backgroundColor: item.color,
                                                        borderRadius: '3px'
                                                    }}></div>
                                                    <span style={{ fontSize: '0.85rem' }}>{item.name}: {item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Chart 2: Entity Type (Affiliate) Distribution */}
                                    <div style={{
                                        backgroundColor: 'var(--card-bg)',
                                        borderRadius: '12px',
                                        padding: '25px',
                                        border: '1px solid var(--border-color)',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                    }}>
                                        <h4 style={{
                                            margin: '0 0 20px 0',
                                            color: 'var(--text-color)',
                                            fontSize: '1.1rem',
                                            fontWeight: 'bold',
                                            textAlign: 'center'
                                        }}>
                                            🏛️ توزيع الملاحظات حسب الجهة التابعة
                                        </h4>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={entityTypeData} layout="horizontal" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis
                                                    dataKey="name"
                                                    stroke="var(--text-color)"
                                                    tick={{ fontSize: 11, dy: 8 }}
                                                    interval={0}
                                                    textAnchor="middle"
                                                    height={50}
                                                />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} domain={[0, Math.max(...entityTypeData.map(d => d.value)) + 3]} />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: 'var(--card-bg)',
                                                        border: '1px solid var(--border-color)',
                                                        borderRadius: '8px'
                                                    }}
                                                    formatter={(value: number, name: string, props: any) => [`${value} ملاحظة`, props.payload.fullName]}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {entityTypeData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="value"
                                                        position="top"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            fill: 'var(--text-color)',
                                                            fontSize: '14px'
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{
                                            display: 'flex',
                                            flexWrap: 'wrap',
                                            justifyContent: 'center',
                                            gap: '15px',
                                            marginTop: '15px'
                                        }}>
                                            {entityTypeData.map((item, index) => (
                                                <div
                                                    key={index}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '6px',
                                                        padding: '4px 10px',
                                                        backgroundColor: 'rgba(0,0,0,0.03)',
                                                        borderRadius: '8px'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: '12px',
                                                        height: '12px',
                                                        backgroundColor: item.color,
                                                        borderRadius: '3px'
                                                    }}></div>
                                                    <span style={{ fontSize: '0.85rem' }}>{item.fullName}: {item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Total observations summary */}
                                <div style={{
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    padding: '15px 25px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    gap: '15px',
                                    fontWeight: 'bold',
                                    marginTop: '20px',
                                    fontSize: '1.1rem'
                                }}>
                                    <span>📋</span>
                                    <span>إجمالي الملاحظات المتكررة: {filteredObs.length} ملاحظة</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}




            {/* Correction Rates Section - Smart Card Design */}
            {(comparisonType === 'monthly' || comparisonType === 'quarterly') && correctionRates.length > 0 && (() => {
                const filteredRates = selectedAnalysisCorrectionRates;

                if (filteredRates.length === 0) {
                    return (
                        <div style={{ marginTop: '30px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                            <h3 style={{ margin: '0 0 15px 0', color: '#17a2b8', fontSize: '1.2rem' }}>
                                📊 نسب تصحيح الملاحظات - {getVisitAnalysisPeriodLabel()}
                            </h3>
                            <p style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>لا توجد بيانات متاحة لهذه الفترة</p>
                        </div>
                    );
                }

                // Criteria config for Administrative Audit
                const criteriaConfig = [
                    { key: 'pcc', label: 'PCC', desc: 'رعاية المرضى والرعاية المتمركزة حولهم' },
                    { key: 'efs', label: 'EFS', desc: 'إدارة وسلامة المنشأة' },
                    { key: 'ogm', label: 'OGM', desc: 'الحوكمة وإدارة المنظمة' },
                    { key: 'imt', label: 'IMT', desc: 'إدارة المعلومات والتكامل' },
                    { key: 'wfm', label: 'WFM', desc: 'إدارة القوى العاملة' },
                    { key: 'cai', label: 'CAI', desc: 'الاتصال والاعتماد والجودة' },
                    { key: 'qpi', label: 'QPI', desc: 'تحسين الجودة والأداء' },
                    { key: 'mrs', label: 'MRS', desc: 'خدمات الأشعة الطبية' },
                    { key: 'scm', label: 'SCM', desc: 'إدارة سلاسل الإمداد' },
                    { key: 'ems', label: 'EMS', desc: 'إدارة خدمات الطوارئ والمرونة المؤسسية' },
                    { key: 'pcs', label: 'PCS', desc: 'معايير العيادات الخاصة' },
                    { key: 'cps', label: 'CPS', desc: 'معايير الصيدليات العامة' }
                ];

                const renderSmartTable = (title: string, color: string, rates: any[]) => {
                    if (rates.length === 0) return null;
                    return (
                        <div style={{ marginBottom: '40px' }}>
                            <h4 style={{ backgroundColor: color, color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                {title} ({rates.length} زيارات)
                            </h4>
                            <div style={{ border: `2px solid ${color}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px', overflowX: 'auto' }}>
                                {['مراكز ووحدات الرعاية الأولية', 'مستشفيات', 'مستشفى صحة نفسية', 'صيدليات', 'معامل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                    const categoryRates = rates.filter(r => r.facilityCategory === category);
                                    if (categoryRates.length === 0) return null;
                                    return (
                                        <div key={category} style={{ marginBottom: '25px' }}>
                                            <h5 style={{ marginBottom: '15px', color: color, borderBottom: `2px solid ${color}`, paddingBottom: '10px' }}>
                                                🏥 {category} ({categoryRates.length} زيارات)
                                            </h5>
                                            {categoryRates.map((rate) => (
                                                <div key={rate.id} style={{ marginBottom: '25px', backgroundColor: '#fdfdfd', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', border: '1px solid #eee' }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                                        <span style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#333' }}>
                                                            ● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}
                                                        </span>
                                                    </div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '15px' }}>
                                                        {criteriaConfig.map(c => {
                                                            const total = (rate as any)[`${c.key}Total`] || 0;
                                                            const corrected = (rate as any)[`${c.key}Corrected`] || 0;
                                                            const pct = total > 0 ? Math.round((corrected / total) * 100) : 0;
                                                            const hasData = total > 0 || corrected > 0;

                                                            if (!hasData) return null;

                                                            return (
                                                                <div key={c.key} style={{
                                                                    backgroundColor: 'white',
                                                                    padding: '12px',
                                                                    borderRadius: '8px',
                                                                    border: '1px solid #f0f0f0',
                                                                    display: 'flex',
                                                                    flexDirection: 'column',
                                                                    gap: '6px'
                                                                }}>
                                                                    <span
                                                                        title={c.desc}
                                                                        style={{
                                                                            fontSize: '0.75rem',
                                                                            color: '#666',
                                                                            fontWeight: 'bold',
                                                                            cursor: 'help',
                                                                            borderBottom: '1px dotted #ccc'
                                                                        }}
                                                                    >
                                                                        {c.label}
                                                                    </span>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                                                        <span>{corrected} / {total}</span>
                                                                        <span style={{
                                                                            color: pct >= 80 ? '#2e7d32' : pct >= 50 ? '#f9a825' : '#c62828',
                                                                            fontWeight: 'bold'
                                                                        }}>{pct}%</span>
                                                                    </div>
                                                                    <div style={{ height: '6px', width: '100%', backgroundColor: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                                                                        <div style={{
                                                                            height: '100%',
                                                                            width: `${pct}%`,
                                                                            backgroundColor: pct >= 80 ? '#4caf50' : pct >= 50 ? '#ffc107' : '#f44336',
                                                                            borderRadius: '3px'
                                                                        }}></div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                };

                return (
                    <div style={{ marginTop: '30px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                        <h3 style={{ margin: '0 0 15px 0', color: '#17a2b8', fontSize: '1.2rem' }}>
                            📊 نسب تصحيح الملاحظات - {getVisitAnalysisPeriodLabel()}
                        </h3>
                        <div style={{ marginTop: '20px' }}>
                            {renderSmartTable('🏛️ أولاً: المنشآت الصحية التابعة لهيئة الرعاية', '#17a2b8', filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية'))}
                            {renderSmartTable('🏥 ثانياً: المنشآت الصحية التابعة لوزارة الصحة', '#ff9800', filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة'))}
                            {renderSmartTable('🏢 ثالثاً: منشآت صحية أخرى', '#28a745', filteredRates.filter(r => r.entityType === 'منشآت صحية أخرى'))}
                        </div>
                    </div>
                );
            })()}

            {/* قسم المعوقات - يظهر فقط في حالة الفلترة الشهرية */}
            {
                comparisonType === 'monthly' && currentObstacles && (
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
                                    })()} {targetYear}
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
                )
            }

            {/* قسم مقترحات التطوير - يظهر فقط في حالة الفلترة الشهرية */}
            {
                comparisonType === 'monthly' && currentDevelopmentProposals && (
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
                                    })()} {targetYear}
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
                )
            }

            {/* قسم الأنشطة الإضافية - يظهر فقط في حالة الفلترة الشهرية */}
            {
                comparisonType === 'monthly' && currentAdditionalActivities && (
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
                                    })()} {targetYear}
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
                )
            }

            {/* قسم الملاحظات - يظهر فقط في حالة الفلترة الشهرية */}
            {
                comparisonType === 'monthly' && currentNotes && (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '25px',
                            border: '2px solid #17a2b8',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '15px',
                                paddingBottom: '15px',
                                borderBottom: '2px solid #17a2b8'
                            }}>
                                <span style={{ fontSize: '1.5rem' }}>📝</span>
                                <h3 style={{
                                    margin: 0,
                                    color: '#0c5460',
                                    fontSize: '1.3rem',
                                    fontWeight: 'bold'
                                }}>
                                    ملاحظات - {(() => {
                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                        return monthNames[selectedMonth - 1];
                                    })()} {targetYear}
                                </h3>
                            </div>
                            <div style={{
                                backgroundColor: '#d1ecf1',
                                padding: '20px',
                                borderRadius: '8px',
                                fontSize: '1rem',
                                lineHeight: '1.6',
                                color: '#0c5460',
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word'
                            }}>
                                {currentNotes}
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
}
