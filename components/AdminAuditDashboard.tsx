'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

import { AdminAuditFacility, AdminAuditObservation, ObservationCorrectionRate } from '@/lib/firestore';

interface AdminAuditDashboardProps {
    submissions: Array<Record<string, any>>;
    facilities: AdminAuditFacility[];
    observations: AdminAuditObservation[];
    correctionRates?: ObservationCorrectionRate[];
}

export default function AdminAuditDashboard({ submissions, facilities, observations, correctionRates = [] }: AdminAuditDashboardProps) {
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
        healthPlanning: boolean;
        environmentalSafetyAudit: boolean;
        seriousIncidentExam: boolean;
    }>({
        adminAudit: true,
        adminInspection: true,
        followUp: true,
        examReferral: true,
        facilities: true,
        healthPlanning: true,
        environmentalSafetyAudit: true,
        seriousIncidentExam: true
    });

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
            healthPlanning: number;
            environmentalSafetyAudit: number;
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
                    healthPlanning: 0,
                    environmentalSafetyAudit: 0,
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
            aggregated[periodKey].healthPlanning += parseFloat(sub.healthPlanning) || 0;
            aggregated[periodKey].environmentalSafetyAudit += parseFloat(sub.environmentalSafetyAudit) || 0;
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

    const currentTotalHealthPlanning = calculateFilteredTotal(currentAggregated, 'healthPlanning', comparisonType);
    const previousTotalHealthPlanning = calculateFilteredTotal(previousAggregated, 'healthPlanning', comparisonType);
    const healthPlanningChange = calculateChange(currentTotalHealthPlanning, previousTotalHealthPlanning);

    const currentTotalEnvironmentalSafetyAudit = calculateFilteredTotal(currentAggregated, 'environmentalSafetyAudit', comparisonType);
    const previousTotalEnvironmentalSafetyAudit = calculateFilteredTotal(previousAggregated, 'environmentalSafetyAudit', comparisonType);
    const environmentalSafetyAuditChange = calculateChange(currentTotalEnvironmentalSafetyAudit, previousTotalEnvironmentalSafetyAudit);

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

    const preparePieData = (metric: 'totalFieldVisits' | 'adminAuditVisits' | 'adminInspectionVisits' | 'followUpVisits' | 'examReferralVisits' | 'visitedFacilities' | 'healthPlanning' | 'environmentalSafetyAudit' | 'seriousIncidentExam') => {
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
                case 'healthPlanning':
                    currentVal = currentTotalHealthPlanning;
                    previousVal = previousTotalHealthPlanning;
                    break;
                case 'environmentalSafetyAudit':
                    currentVal = currentTotalEnvironmentalSafetyAudit;
                    previousVal = previousTotalEnvironmentalSafetyAudit;
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
    const healthPlanningPieData = preparePieData('healthPlanning');
    const environmentalSafetyAuditPieData = preparePieData('environmentalSafetyAudit');
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
                    title="تخطيط صحي"
                    icon="📊"
                    currentValue={currentTotalHealthPlanning}
                    previousValue={previousTotalHealthPlanning}
                    changePercentage={healthPlanningChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={healthPlanningPieData}
                    color="#e91e63"
                />
                <KPICard
                    title="تدقيق على السلامة البيئية"
                    icon="🌿"
                    currentValue={currentTotalEnvironmentalSafetyAudit}
                    previousValue={previousTotalEnvironmentalSafetyAudit}
                    changePercentage={environmentalSafetyAuditChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={environmentalSafetyAuditPieData}
                    color="#4caf50"
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
                    marginBottom: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة إجمالي الزيارات الميدانية - رسم بياني خطي</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={prepareChartData()}>
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
                            <Line
                                type="monotone"
                                dataKey={`إجمالي زيارات ${targetYear}`}
                                stroke="#0eacb8"
                                strokeWidth={2}
                                dot={{ fill: '#0eacb8', r: 4 }}
                            >
                                <LabelList
                                    dataKey={`إجمالي زيارات ${targetYear}`}
                                    position="top"
                                    offset={10}
                                    style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                />
                            </Line>
                            <Line
                                type="monotone"
                                dataKey={`إجمالي زيارات ${targetYear - 1}`}
                                stroke="#999"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#999', r: 3 }}
                            >
                                <LabelList
                                    dataKey={`إجمالي زيارات ${targetYear - 1}`}
                                    position="top"
                                    offset={10}
                                    style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                />
                            </Line>
                        </LineChart>
                    </ResponsiveContainer>
                </div>

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
                                    {(() => {
                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                        const year = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                        return `${monthNames[selectedMonth - 1]} ${year}`;
                                    })()}
                                </th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>
                                    {(() => {
                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                        const year = selectedMonth >= 7 ? targetYear - 2 : targetYear - 1;
                                        return `${monthNames[selectedMonth - 1]} ${year}`;
                                    })()}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                const currentData = Object.values(currentAggregated).find((_, idx) => {
                                    const key = Object.keys(currentAggregated)[idx];
                                    if (key.includes('-')) {
                                        return parseInt(key.split('-')[1]) === selectedMonth;
                                    }
                                    return false;
                                }) as any || { adminAuditVisits: 0, adminInspectionVisits: 0, followUpVisits: 0, examReferralVisits: 0, healthPlanning: 0, environmentalSafetyAudit: 0, seriousIncidentExam: 0 };

                                const previousData = Object.values(previousAggregated).find((_, idx) => {
                                    const key = Object.keys(previousAggregated)[idx];
                                    if (key.includes('-')) {
                                        return parseInt(key.split('-')[1]) === selectedMonth;
                                    }
                                    return false;
                                }) as any || { adminAuditVisits: 0, adminInspectionVisits: 0, followUpVisits: 0, examReferralVisits: 0, healthPlanning: 0, environmentalSafetyAudit: 0, seriousIncidentExam: 0 };

                                const indicators = [
                                    { label: 'تدقيق إداري وسلامة بيئية', current: currentData.adminAuditVisits || 0, previous: previousData.adminAuditVisits || 0 },
                                    { label: 'تفتيش إداري', current: currentData.adminInspectionVisits || 0, previous: previousData.adminInspectionVisits || 0 },
                                    { label: 'زيارات متابعة', current: currentData.followUpVisits || 0, previous: previousData.followUpVisits || 0 },
                                    { label: 'فحص / إحالة / تكليف', current: currentData.examReferralVisits || 0, previous: previousData.examReferralVisits || 0 },
                                    { label: 'تخطيط صحي', current: currentData.healthPlanning || 0, previous: previousData.healthPlanning || 0 },
                                    { label: 'تدقيق على السلامة البيئية', current: currentData.environmentalSafetyAudit || 0, previous: previousData.environmentalSafetyAudit || 0 },
                                    { label: 'فحص حدث جسيم', current: currentData.seriousIncidentExam || 0, previous: previousData.seriousIncidentExam || 0 },
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

            {/* قسم المنشآت التي تم زيارتها - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid #e0e0e0',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--primary-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                🏥 المنشآت التي تم زيارتها خلال {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear}
                            </h3>
                            <div style={{
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                padding: '5px 15px',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                fontWeight: 'bold'
                            }}>
                                العدد: {facilities.filter(f => {
                                    const [year, month] = f.month.split('-');
                                    const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                    return parseInt(year) === expectedYear && parseInt(month) === selectedMonth;
                                }).length}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #0D6A79', fontWeight: '700', fontSize: '0.95rem' }}>نوع المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #0D6A79', fontWeight: '700', fontSize: '0.95rem' }}>اسم المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #0D6A79', fontWeight: '700', fontSize: '0.95rem' }}>نوع الزيارة</th>
                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #0D6A79', fontWeight: '700', fontSize: '0.95rem' }}>المحافظة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(() => {
                                        const filteredFacilities = facilities.filter(f => {
                                            const [year, month] = f.month.split('-');
                                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                            return parseInt(year) === expectedYear && parseInt(month) === selectedMonth;
                                        });

                                        if (filteredFacilities.length === 0) {
                                            return (
                                                <tr>
                                                    <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                                                        لا توجد زيارات مسجلة لهذا الشهر
                                                    </td>
                                                </tr>
                                            );
                                        }

                                        // تجميع المنشآت حسب المحافظة
                                        const groupedByGovernorate: Record<string, typeof filteredFacilities> = {};
                                        filteredFacilities.forEach(facility => {
                                            const gov = facility.governorate || 'غير محدد';
                                            if (!groupedByGovernorate[gov]) {
                                                groupedByGovernorate[gov] = [];
                                            }
                                            groupedByGovernorate[gov].push(facility);
                                        });

                                        // ترتيب المحافظات أبجدياً
                                        const sortedGovernorates = Object.keys(groupedByGovernorate).sort((a, b) => a.localeCompare(b, 'ar'));

                                        // ألوان خلفية خفيفة متناوبة للمحافظات
                                        const governorateColors = [
                                            'rgba(13, 106, 121, 0.05)',  // لون أساسي خفيف جداً
                                            'rgba(13, 106, 121, 0.12)', // لون أساسي خفيف
                                        ];

                                        let rowIndex = 0;
                                        return sortedGovernorates.map((governorate, govIndex) => {
                                            const bgColor = governorateColors[govIndex % 2];
                                            const facilitiesInGov = groupedByGovernorate[governorate];

                                            return facilitiesInGov.map((facility, facilityIndex) => {
                                                const currentRowIndex = rowIndex++;
                                                return (
                                                    <tr
                                                        key={`${governorate}-${facilityIndex}`}
                                                        style={{
                                                            borderBottom: '1px solid #dee2e6',
                                                            backgroundColor: bgColor
                                                        }}
                                                    >
                                                        <td style={{ padding: '12px' }}>{facility.facilityType}</td>
                                                        <td style={{ padding: '12px', fontWeight: 'bold' }}>{facility.facilityName}</td>
                                                        <td style={{ padding: '12px' }}>{facility.visitType}</td>
                                                        <td style={{
                                                            padding: '12px',
                                                            textAlign: 'center',
                                                            fontWeight: facilityIndex === 0 ? '600' : 'normal',
                                                            color: facilityIndex === 0 ? '#0D6A79' : 'inherit'
                                                        }}>
                                                            {facility.governorate}
                                                        </td>
                                                    </tr>
                                                );
                                            });
                                        });
                                    })()}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Recurring Observations Section - الملاحظات المتكررة */}
            {comparisonType === 'monthly' && (() => {
                const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
                const filteredObservations = observations.filter(o => o.month === monthStr);

                // Group by entityType
                const hcaObservations = filteredObservations.filter(o => o.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية الصحية');
                const mohObservations = filteredObservations.filter(o => o.entityType === 'منشآت تابعة لوزارة الصحة');
                const otherObservations = filteredObservations.filter(o => o.entityType === 'منشآت تابعة لمنشآت أخرى');

                if (filteredObservations.length === 0) return null;


                return (
                    <div style={{ marginBottom: '30px' }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                        }}>
                            <h3 style={{
                                margin: '0 0 20px 0',
                                color: 'var(--primary-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px'
                            }}>
                                📋 الملاحظات المتكررة خلال زيارات الرقابة الإدارية - {(() => {
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[selectedMonth - 1];
                                })()} {targetYear}
                            </h3>

                            {/* HCA Observations Accordion */}
                            {hcaObservations.length > 0 && (
                                <div style={{ marginBottom: '20px' }}>
                                    <details open style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <summary style={{
                                            padding: '15px 20px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            backgroundColor: '#e3f2fd',
                                            color: '#1565c0',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>المنشآت الصحية التابعة لهيئة الرعاية الصحية</span>
                                            <span style={{
                                                backgroundColor: '#1565c0',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem'
                                            }}>{hcaObservations.length} ملاحظات</span>
                                        </summary>
                                        <div style={{ padding: '15px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#e3f2fd' }}>
                                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #1565c0' }}>نوع المنشأة</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #1565c0' }}>أدلة التطابق التي ورد عليها ملاحظات متكررة</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1565c0', width: '120px' }}>نسبة الملاحظات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hcaObservations.map((obs, idx) => (
                                                        <tr key={obs.id || idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                            <td style={{ padding: '12px' }}>{obs.facilityType}</td>
                                                            <td style={{ padding: '12px' }}>{obs.observation}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: obs.percentage > 30 ? '#f8d7da' : obs.percentage >= 20 ? '#fff3cd' : '#d4edda',
                                                                    color: obs.percentage > 30 ? '#721c24' : obs.percentage >= 20 ? '#856404' : '#155724'
                                                                }}>
                                                                    {obs.percentage}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>
                                </div>
                            )}

                            {/* MOH Observations Accordion */}
                            {mohObservations.length > 0 && (
                                <div>
                                    <details open style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <summary style={{
                                            padding: '15px 20px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            backgroundColor: '#fff3e0',
                                            color: '#e65100',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>منشآت تابعة لوزارة الصحة</span>
                                            <span style={{
                                                backgroundColor: '#e65100',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem'
                                            }}>{mohObservations.length} ملاحظات</span>
                                        </summary>
                                        <div style={{ padding: '15px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#fff3e0' }}>
                                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e65100' }}>نوع المنشأة</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e65100' }}>أدلة التطابق التي ورد عليها ملاحظات متكررة</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e65100', width: '120px' }}>نسبة الملاحظات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {mohObservations.map((obs, idx) => (
                                                        <tr key={obs.id || idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                            <td style={{ padding: '12px' }}>{obs.facilityType}</td>
                                                            <td style={{ padding: '12px' }}>{obs.observation}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: obs.percentage > 30 ? '#f8d7da' : obs.percentage >= 20 ? '#fff3cd' : '#d4edda',
                                                                    color: obs.percentage > 30 ? '#721c24' : obs.percentage >= 20 ? '#856404' : '#155724'
                                                                }}>
                                                                    {obs.percentage}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>
                                </div>
                            )}

                            {/* Other Facilities Observations Accordion */}
                            {otherObservations.length > 0 && (
                                <div style={{ marginTop: '20px' }}>
                                    <details open style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        overflow: 'hidden'
                                    }}>
                                        <summary style={{
                                            padding: '15px 20px',
                                            cursor: 'pointer',
                                            fontWeight: 'bold',
                                            fontSize: '1.1rem',
                                            backgroundColor: '#e8f5e9',
                                            color: '#2e7d32',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}>
                                            <span>منشآت تابعة لمنشآت أخرى</span>
                                            <span style={{
                                                backgroundColor: '#2e7d32',
                                                color: 'white',
                                                padding: '4px 12px',
                                                borderRadius: '12px',
                                                fontSize: '0.85rem'
                                            }}>{otherObservations.length} ملاحظات</span>
                                        </summary>
                                        <div style={{ padding: '15px' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#e8f5e9' }}>
                                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2e7d32' }}>نوع المنشأة</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2e7d32' }}>أدلة التطابق التي ورد عليها ملاحظات متكررة</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2e7d32', width: '120px' }}>نسبة الملاحظات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {otherObservations.map((obs, idx) => (
                                                        <tr key={obs.id || idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                            <td style={{ padding: '12px' }}>{obs.facilityType}</td>
                                                            <td style={{ padding: '12px' }}>{obs.observation}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <span style={{
                                                                    padding: '4px 12px',
                                                                    borderRadius: '12px',
                                                                    fontSize: '0.9rem',
                                                                    fontWeight: 'bold',
                                                                    backgroundColor: obs.percentage > 30 ? '#f8d7da' : obs.percentage >= 20 ? '#fff3cd' : '#d4edda',
                                                                    color: obs.percentage > 30 ? '#721c24' : obs.percentage >= 20 ? '#856404' : '#155724'
                                                                }}>
                                                                    {obs.percentage}%
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </details>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })()}

            {/* Correction Rates Section */}
            {comparisonType === 'monthly' && correctionRates.length > 0 && (() => {
                const filteredRates = correctionRates.filter(r => {
                    const [rateYear, rateMonth] = r.month.split('-').map(Number);
                    // حساب السنة المتوقعة بناءً على السنة المالية المختارة
                    // إذا كان الشهر أكبر من أو يساوي 7 (يوليو - ديسمبر)، تكون السنة هي السنة السابقة لسنة النهاية
                    // إذا كان الشهر أقل من 7 (يناير - يونيو)، تكون السنة هي نفس سنة النهاية
                    const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                    return rateYear === expectedYear && rateMonth === selectedMonth;
                });

                if (filteredRates.length === 0) return null;

                return (
                    <div style={{ marginTop: '30px' }}>
                        <details open style={{ backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                            <summary style={{ cursor: 'pointer', fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '20px' }}>
                                📊 نسب تصحيح الملاحظات بناء على تقارير الزيارات ({filteredRates.length} سجل)
                            </summary>

                            {/* HCA Facilities */}
                            {filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية').length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ backgroundColor: '#17a2b8', color: 'white', padding: '12px 15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                        🏛️ المنشآت الصحية التابعة لهيئة الرعاية
                                    </h3>
                                    <div style={{ border: '2px solid #17a2b8', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '15px' }}>
                                        {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية'].map(category => {
                                            const categoryRates = filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية' && r.facilityCategory === category);
                                            if (categoryRates.length === 0) return null;
                                            return (
                                                <div key={category} style={{ marginBottom: '20px' }}>
                                                    <h4 style={{ color: '#17a2b8', borderBottom: '1px solid #17a2b8', paddingBottom: '8px', marginBottom: '10px' }}>
                                                        🏥 {category} ({categoryRates.length})
                                                    </h4>
                                                    {categoryRates.map(rate => (
                                                        <div key={rate.id} style={{ marginBottom: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
                                                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                                ● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}
                                                            </div>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                                                                        <th style={{ padding: '6px', textAlign: 'right' }}>البيان</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>PCC</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>EFS</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>OGM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>IMT</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>WFM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>CAI</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>QPI</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>MRS</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>SCM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>EMS</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr style={{ backgroundColor: 'white' }}>
                                                                        <td style={{ padding: '6px' }}>الواردة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                            <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.t}</td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                        <td style={{ padding: '6px' }}>المصححة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                            <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.c}</td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ padding: '6px', fontWeight: 'bold' }}>النسبة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => {
                                                                            if (item.t < 0 && item.c < 0) {
                                                                                return (
                                                                                    <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                                                        <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                            return (
                                                                                <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                                                    <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24' }}>{pct}%</span>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* MOH Facilities */}
                            {filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة').length > 0 && (
                                <div style={{ marginBottom: '30px' }}>
                                    <h3 style={{ backgroundColor: '#ff9800', color: 'white', padding: '12px 15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                        🏥 المنشآت الصحية التابعة لوزارة الصحة
                                    </h3>
                                    <div style={{ border: '2px solid #ff9800', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '15px' }}>
                                        {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية', 'صيدلية', 'معمل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                            const categoryRates = filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة' && r.facilityCategory === category);
                                            if (categoryRates.length === 0) return null;
                                            return (
                                                <div key={category} style={{ marginBottom: '20px' }}>
                                                    <h4 style={{ color: '#ff9800', borderBottom: '1px solid #ff9800', paddingBottom: '8px', marginBottom: '10px' }}>
                                                        🏥 {category} ({categoryRates.length})
                                                    </h4>
                                                    {categoryRates.map(rate => (
                                                        <div key={rate.id} style={{ marginBottom: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
                                                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                                ● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}
                                                            </div>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                                                                        <th style={{ padding: '6px', textAlign: 'right' }}>البيان</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>PCC</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>EFS</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>OGM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>IMT</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>WFM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>CAI</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>QPI</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>MRS</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>SCM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>EMS</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr style={{ backgroundColor: 'white' }}>
                                                                        <td style={{ padding: '6px' }}>الواردة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                            <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.t}</td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                        <td style={{ padding: '6px' }}>المصححة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                            <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.c}</td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ padding: '6px', fontWeight: 'bold' }}>النسبة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => {
                                                                            if (item.t < 0 && item.c < 0) {
                                                                                return (
                                                                                    <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                                                        <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                            return (
                                                                                <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                                                    <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24' }}>{pct}%</span>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Other Facilities */}
                            {filteredRates.filter(r => r.entityType === 'منشآت صحية أخرى').length > 0 && (
                                <div>
                                    <h3 style={{ backgroundColor: '#28a745', color: 'white', padding: '12px 15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                        🏢 منشآت صحية أخرى
                                    </h3>
                                    <div style={{ border: '2px solid #28a745', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '15px' }}>
                                        {['صيدلية', 'معمل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                            const categoryRates = filteredRates.filter(r => r.entityType === 'منشآت صحية أخرى' && r.facilityCategory === category);
                                            if (categoryRates.length === 0) return null;
                                            return (
                                                <div key={category} style={{ marginBottom: '20px' }}>
                                                    <h4 style={{ color: '#28a745', borderBottom: '1px solid #28a745', paddingBottom: '8px', marginBottom: '10px' }}>
                                                        🏥 {category} ({categoryRates.length})
                                                    </h4>
                                                    {categoryRates.map(rate => (
                                                        <div key={rate.id} style={{ marginBottom: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
                                                            <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                                                                ● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}
                                                            </div>
                                                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                <thead>
                                                                    <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                                                                        <th style={{ padding: '6px', textAlign: 'right' }}>البيان</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>PCC</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>EFS</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>OGM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>IMT</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>WFM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>CAI</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>QPI</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>MRS</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>SCM</th>
                                                                        <th style={{ padding: '6px', textAlign: 'center' }}>EMS</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    <tr style={{ backgroundColor: 'white' }}>
                                                                        <td style={{ padding: '6px' }}>الواردة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                            <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.t}</td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                        <td style={{ padding: '6px' }}>المصححة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                            <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.c}</td>
                                                                        ))}
                                                                    </tr>
                                                                    <tr>
                                                                        <td style={{ padding: '6px', fontWeight: 'bold' }}>النسبة</td>
                                                                        {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => {
                                                                            if (item.t < 0 && item.c < 0) {
                                                                                return (
                                                                                    <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                                                        <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                                                                    </td>
                                                                                );
                                                                            }
                                                                            const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                            return (
                                                                                <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                                                    <span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 'bold', backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24' }}>{pct}%</span>
                                                                                </td>
                                                                            );
                                                                        })}
                                                                    </tr>
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </details>
                    </div>
                );
            })()}
        </div>
    );
}
