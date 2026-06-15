'use client';

import { useState, useMemo, useCallback } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { TechnicalClinicalFacility, TechnicalClinicalCorrectionRate, TechnicalClinicalObservation } from '@/lib/firestore';

interface TechnicalClinicalDashboardProps {
    submissions: Array<Record<string, any>>;
    facilities: TechnicalClinicalFacility[];
    correctionRates?: TechnicalClinicalCorrectionRate[];
    observations?: TechnicalClinicalObservation[];
}

export default function TechnicalClinicalDashboard({ submissions, facilities, correctionRates = [], observations = [] }: TechnicalClinicalDashboardProps) {

    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedMonth, setSelectedMonth] = useState<number>(10); // Default to October
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [visibleMetrics, setVisibleMetrics] = useState<{
        audit: boolean;
        assessment: boolean;
        facilities: boolean;
    }>({
        audit: true,
        assessment: true,
        facilities: true
    });

    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

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

    const computedSubmissions = useMemo(() => {
        const aggregated: Record<string, any> = {};
        
        // 1. Calculate from facilities
        facilities.forEach(fac => {
            if (!fac.month) return;
            const dateStr = fac.month;
            
            if (!aggregated[dateStr]) {
                aggregated[dateStr] = {
                    date: dateStr,
                    totalFieldVisits: 0,
                    auditVisits: 0,
                    assessmentVisits: 0,
                    visitedFacilities: 0,
                    _uniqueFacilities: new Set()
                };
            }
            
            aggregated[dateStr].totalFieldVisits += 1;
            
            if (fac.visitType === 'التدقيق الفني والإكلينيكي' || fac.visitType?.includes('تدقيق')) {
                aggregated[dateStr].auditVisits += 1;
            } else if (fac.visitType === 'التقييم الفني والإكلينيكي' || fac.visitType?.includes('تقييم')) {
                aggregated[dateStr].assessmentVisits += 1;
            }
            
            if (fac.facilityName) {
                aggregated[dateStr]._uniqueFacilities.add(fac.facilityName);
            }
            
            aggregated[dateStr].visitedFacilities = aggregated[dateStr]._uniqueFacilities.size;
        });

        // 2. Merge with explicit submissions (Use submission data if provided, fallback to computed)
        submissions.forEach(sub => {
            if (!sub.date) return;
            
            if (!aggregated[sub.date]) {
                aggregated[sub.date] = { ...sub };
            } else {
                aggregated[sub.date].totalFieldVisits = Math.max(parseFloat(sub.totalFieldVisits) || 0, aggregated[sub.date].totalFieldVisits);
                aggregated[sub.date].auditVisits = Math.max(parseFloat(sub.auditVisits) || 0, aggregated[sub.date].auditVisits);
                aggregated[sub.date].assessmentVisits = Math.max(parseFloat(sub.assessmentVisits) || 0, aggregated[sub.date].assessmentVisits);
                aggregated[sub.date].visitedFacilities = Math.max(parseFloat(sub.visitedFacilities) || 0, aggregated[sub.date].visitedFacilities);
            }
        });

        return Object.values(aggregated).map((item: any) => {
            const { _uniqueFacilities, ...rest } = item;
            return rest;
        });
    }, [submissions, facilities]);

    const filterByYear = useCallback((fiscalYear: number) => {
        return computedSubmissions.filter(sub => sub.date && getFiscalYear(sub.date) === fiscalYear);
    }, [computedSubmissions, getFiscalYear]);

    const aggregateData = useCallback((data: Array<Record<string, any>>, type: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly') => {
        const aggregated: Record<string, {
            totalFieldVisits: number;
            auditVisits: number;
            assessmentVisits: number;
            visitedFacilities: number;
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
                    auditVisits: 0,
                    assessmentVisits: 0,
                    visitedFacilities: 0,
                    count: 0
                };
            }

            aggregated[periodKey].totalFieldVisits += parseFloat(sub.totalFieldVisits) || 0;
            aggregated[periodKey].auditVisits += parseFloat(sub.auditVisits) || 0;
            aggregated[periodKey].assessmentVisits += parseFloat(sub.assessmentVisits) || 0;
            aggregated[periodKey].visitedFacilities += parseFloat(sub.visitedFacilities) || 0;
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
    }, [selectedMonth, selectedQuarter, selectedHalf]);

    // Calculate totals for each metric
    const currentTotalFieldVisits = useMemo(() => calculateFilteredTotal(currentAggregated, 'totalFieldVisits', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalFieldVisits = useMemo(() => calculateFilteredTotal(previousAggregated, 'totalFieldVisits', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const fieldVisitsChange = useMemo(() => calculateChange(currentTotalFieldVisits, previousTotalFieldVisits), [calculateChange, currentTotalFieldVisits, previousTotalFieldVisits]);

    const currentTotalAuditVisits = useMemo(() => calculateFilteredTotal(currentAggregated, 'auditVisits', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalAuditVisits = useMemo(() => calculateFilteredTotal(previousAggregated, 'auditVisits', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const auditVisitsChange = useMemo(() => calculateChange(currentTotalAuditVisits, previousTotalAuditVisits), [calculateChange, currentTotalAuditVisits, previousTotalAuditVisits]);

    const currentTotalAssessmentVisits = useMemo(() => calculateFilteredTotal(currentAggregated, 'assessmentVisits', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalAssessmentVisits = useMemo(() => calculateFilteredTotal(previousAggregated, 'assessmentVisits', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const assessmentVisitsChange = useMemo(() => calculateChange(currentTotalAssessmentVisits, previousTotalAssessmentVisits), [calculateChange, currentTotalAssessmentVisits, previousTotalAssessmentVisits]);

    const currentTotalVisitedFacilities = useMemo(() => calculateFilteredTotal(currentAggregated, 'visitedFacilities', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalVisitedFacilities = useMemo(() => calculateFilteredTotal(previousAggregated, 'visitedFacilities', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const visitedFacilitiesChange = useMemo(() => calculateChange(currentTotalVisitedFacilities, previousTotalVisitedFacilities), [calculateChange, currentTotalVisitedFacilities, previousTotalVisitedFacilities]);

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

    const getDetailedTableColumnLabel = useCallback((fiscalYear: number): string => {
        const fiscalYearRange = `${fiscalYear - 1} - ${fiscalYear}`;

        if (comparisonType === 'monthly') {
            return `${monthNames[selectedMonth - 1]} (${fiscalYearRange})`;
        }

        if (comparisonType === 'quarterly') {
            return `الربع ${selectedQuarter} (${fiscalYearRange})`;
        }

        if (comparisonType === 'halfYearly') {
            return `النصف ${selectedHalf} (${fiscalYearRange})`;
        }

        return `السنة المالية (${fiscalYearRange})`;
    }, [comparisonType, monthNames, selectedMonth, selectedQuarter, selectedHalf]);

    const isMonthInSelectedAnalysisPeriod = useCallback((monthValue: string): boolean => {
        if (!monthValue || getFiscalYear(monthValue) !== targetYear) return false;

        const month = getMonth(monthValue);
        if (comparisonType === 'monthly') {
            return month === selectedMonth;
        }

        if (comparisonType === 'quarterly') {
            return getQuarter(month) === selectedQuarter;
        }

        return false;
    }, [comparisonType, getFiscalYear, getMonth, getQuarter, selectedMonth, selectedQuarter, targetYear]);

    const selectedAnalysisFacilities = useMemo(
        () => facilities.filter(facility => isMonthInSelectedAnalysisPeriod(facility.month)),
        [facilities, isMonthInSelectedAnalysisPeriod]
    );
    const selectedAnalysisObservations = useMemo(
        () => observations.filter(observation => isMonthInSelectedAnalysisPeriod(observation.month)),
        [observations, isMonthInSelectedAnalysisPeriod]
    );
    const selectedAnalysisCorrectionRates = useMemo(
        () => correctionRates.filter(rate => isMonthInSelectedAnalysisPeriod(rate.month)),
        [correctionRates, isMonthInSelectedAnalysisPeriod]
    );

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

    const preparePieData = useCallback((metric: 'totalFieldVisits' | 'auditVisits' | 'assessmentVisits' | 'visitedFacilities') => {
        if (comparisonType === 'yearly' || comparisonType === 'monthly') {
            let currentVal = 0;
            let previousVal = 0;

            switch (metric) {
                case 'totalFieldVisits':
                    currentVal = currentTotalFieldVisits;
                    previousVal = previousTotalFieldVisits;
                    break;
                case 'auditVisits':
                    currentVal = currentTotalAuditVisits;
                    previousVal = previousTotalAuditVisits;
                    break;
                case 'assessmentVisits':
                    currentVal = currentTotalAssessmentVisits;
                    previousVal = previousTotalAssessmentVisits;
                    break;
                case 'visitedFacilities':
                    currentVal = currentTotalVisitedFacilities;
                    previousVal = previousTotalVisitedFacilities;
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
    }, [comparisonType, currentTotalFieldVisits, previousTotalFieldVisits, currentTotalAuditVisits, previousTotalAuditVisits, currentTotalAssessmentVisits, previousTotalAssessmentVisits, currentTotalVisitedFacilities, previousTotalVisitedFacilities, targetYear, selectedQuarter, selectedHalf, currentYearData, previousYearData, aggregateData, formatPeriodLabel]);

    const fieldVisitsPieData = useMemo(() => preparePieData('totalFieldVisits'), [preparePieData]);
    const auditVisitsPieData = useMemo(() => preparePieData('auditVisits'), [preparePieData]);
    const assessmentVisitsPieData = useMemo(() => preparePieData('assessmentVisits'), [preparePieData]);
    const visitedFacilitiesPieData = useMemo(() => preparePieData('visitedFacilities'), [preparePieData]);

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
                [`تدقيق ${targetYear}`]: currentAggregated[period]?.auditVisits || 0,
                [`تدقيق ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.auditVisits || 0,
                [`تقييم ${targetYear}`]: currentAggregated[period]?.assessmentVisits || 0,
                [`تقييم ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.assessmentVisits || 0,
                [`منشآت ${targetYear}`]: currentAggregated[period]?.visitedFacilities || 0,
                [`منشآت ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.visitedFacilities || 0,
            };
        });
    }, [currentAggregated, previousAggregated, comparisonType, selectedMonth, selectedQuarter, selectedHalf, targetYear, formatPeriodLabel]);

    const chartData = useMemo(() => prepareChartData(), [prepareChartData]);

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
                    <td colSpan={9} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.auditVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.auditVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.assessmentVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.assessmentVisits || 0}</td>
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
                    الإدارة العامة للرقابة الفنية والإكلينيكية - تحليلات ومقارنات
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
                    title="زيارات التدقيق"
                    icon="🔍"
                    currentValue={currentTotalAuditVisits}
                    previousValue={previousTotalAuditVisits}
                    changePercentage={auditVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={auditVisitsPieData}
                    color="#8884d8"
                />
                <KPICard
                    title="زيارات التقييم"
                    icon="📋"
                    currentValue={currentTotalAssessmentVisits}
                    previousValue={previousTotalAssessmentVisits}
                    changePercentage={assessmentVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={assessmentVisitsPieData}
                    color="#82ca9d"
                />
                <KPICard
                    title="المنشآت المزارة"
                    icon="🏢"
                    currentValue={currentTotalVisitedFacilities}
                    previousValue={previousTotalVisitedFacilities}
                    changePercentage={visitedFacilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={visitedFacilitiesPieData}
                    color="#ffc658"
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
                                    checked={visibleMetrics.audit}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, audit: e.target.checked })}
                                />
                                <span>تدقيق</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.assessment}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, assessment: e.target.checked })}
                                />
                                <span>تقييم</span>
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
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
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
                            {visibleMetrics.audit && (
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
                            {visibleMetrics.assessment && (
                                <>
                                    <Bar dataKey={`تقييم ${targetYear}`} fill="#82ca9d">
                                        <LabelList
                                            dataKey={`تقييم ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`تقييم ${targetYear - 1}`} fill="#c5e8d5">
                                        <LabelList
                                            dataKey={`تقييم ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.facilities && (
                                <>
                                    <Bar dataKey={`منشآت ${targetYear}`} fill="#ffc658">
                                        <LabelList
                                            dataKey={`منشآت ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`منشآت ${targetYear - 1}`} fill="#ffe5b4">
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
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>البيان</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{getDetailedTableColumnLabel(targetYear)}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{getDetailedTableColumnLabel(targetYear - 1)}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(() => {
                                // حساب إجمالي زيارات التدقيق للسنة الحالية
                                const currentAuditTotal = calculateFilteredTotal(currentAggregated, 'auditVisits', comparisonType);
                                // حساب إجمالي زيارات التدقيق للسنة السابقة
                                const previousAuditTotal = calculateFilteredTotal(previousAggregated, 'auditVisits', comparisonType);

                                // حساب إجمالي زيارات التقييم للسنة الحالية
                                const currentAssessmentTotal = calculateFilteredTotal(currentAggregated, 'assessmentVisits', comparisonType);
                                // حساب إجمالي زيارات التقييم للسنة السابقة
                                const previousAssessmentTotal = calculateFilteredTotal(previousAggregated, 'assessmentVisits', comparisonType);

                                // حساب إجمالي جميع الزيارات للسنة الحالية
                                const currentTotalVisits = calculateFilteredTotal(currentAggregated, 'totalFieldVisits', comparisonType);
                                // حساب إجمالي جميع الزيارات للسنة السابقة
                                const previousTotalVisits = calculateFilteredTotal(previousAggregated, 'totalFieldVisits', comparisonType);

                                return (
                                    <>
                                        <tr style={{ borderBottom: '1px solid #eee', backgroundColor: 'transparent' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>زيارات التدقيق الفني والإكلينيكي</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{currentAuditTotal}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousAuditTotal}</td>
                                        </tr>
                                        <tr style={{ borderBottom: '1px solid #eee', backgroundColor: 'var(--background-color)' }}>
                                            <td style={{ padding: '12px', fontWeight: '500' }}>زيارات التقييم الفني والإكلينيكي</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{currentAssessmentTotal}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousAssessmentTotal}</td>
                                        </tr>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white', fontWeight: 'bold' }}>
                                            <td style={{ padding: '12px' }}>إجمالي الزيارات</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{currentTotalVisits}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{previousTotalVisits}</td>
                                        </tr>
                                    </>
                                );
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* قسم الرسوم البيانية للزيارات - يظهر للمقارنة الشهرية والربع سنوية */}
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
                            تحليل الزيارات - {getDetailedTableColumnLabel(targetYear)}
                        </h3>
                    </div>

                    {/* Container for both charts */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                        gap: '20px'
                    }}>
                        {/* Chart 1: Assessment Type Distribution */}
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
                                🎯 توزيع الزيارات حسب نوع التقييم
                            </h4>
                            {(() => {
                                // Count by assessment type using visitType field
                                let technicalAudit = 0;  // التدقيق الفني والإكلينيكي
                                let technicalAssessment = 0;  // التقييم الفني والإكلينيكي

                                selectedAnalysisFacilities.forEach(f => {
                                    const visitType = f.visitType || '';
                                    if (visitType.includes('تدقيق')) {
                                        technicalAudit++;
                                    } else if (visitType.includes('تقييم')) {
                                        technicalAssessment++;
                                    }
                                });

                                const assessmentData = [
                                    { name: 'تدقيق فني', value: technicalAudit, color: '#0d6a79' },
                                    { name: 'تقييم فني', value: technicalAssessment, color: '#ffc658' }
                                ];

                                const total = technicalAudit + technicalAssessment;

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
                                            <BarChart data={assessmentData} layout="horizontal" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis dataKey="name" stroke="var(--text-color)" />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} domain={[0, Math.max(...assessmentData.map(d => d.value)) + 3]} />
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
                                                    {assessmentData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                                    ))}
                                                    <LabelList
                                                        dataKey="value"
                                                        position="top"
                                                        style={{
                                                            fontWeight: 'bold',
                                                            fill: 'var(--text-color)',
                                                            fontSize: '16px'
                                                        }}
                                                    />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            gap: '30px',
                                            marginTop: '15px'
                                        }}>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    backgroundColor: '#0d6a79',
                                                    borderRadius: '4px'
                                                }}></div>
                                                <span style={{ fontWeight: 'bold' }}>تدقيق فني</span>
                                            </div>
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}>
                                                <div style={{
                                                    width: '16px',
                                                    height: '16px',
                                                    backgroundColor: '#ffc658',
                                                    borderRadius: '4px'
                                                }}></div>
                                                <span style={{ fontWeight: 'bold' }}>تقييم فني</span>
                                            </div>
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
                                                    labelFormatter={() => ''}
                                                    formatter={(value: number, name: string, props: any) => [`${value}`, `${props.payload.name}: `]}
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
                                                    <span style={{ fontSize: '0.85rem' }}>{item.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    {/* Chart 3: Governorate Distribution */}
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
                            📍 توزيع الزيارات حسب المحافظة
                        </h4>
                        {(() => {
                            // Group by governorate
                            const governorateCount: { [key: string]: number } = {};
                            selectedAnalysisFacilities.forEach(f => {
                                const gov = f.governorate || 'غير محدد';
                                governorateCount[gov] = (governorateCount[gov] || 0) + 1;
                            });

                            // Color palette for governorates
                            const colors = [
                                '#0d6a79', '#28a745', '#ffc107', '#dc3545', '#6f42c1',
                                '#17a2b8', '#fd7e14', '#20c997', '#e83e8c', '#6610f2'
                            ];

                            const governorateData = Object.entries(governorateCount)
                                .map(([name, value], index) => ({
                                    name,
                                    value,
                                    color: colors[index % colors.length]
                                }))
                                .sort((a, b) => b.value - a.value);

                            if (governorateData.length === 0) {
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
                                <div style={{ display: 'flex', flexDirection: 'row-reverse', alignItems: 'flex-start', gap: '20px' }}>
                                    <div style={{ flex: 1 }}>
                                        <ResponsiveContainer width="100%" height={280}>
                                            <BarChart data={governorateData} layout="horizontal" margin={{ top: 30, right: 20, left: 20, bottom: 5 }}>
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
                                                    {governorateData.map((entry, index) => (
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
                                    {/* Legend on the right side */}
                                    <div style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        minWidth: '120px'
                                    }}>
                                        {governorateData.map((item, index) => (
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

            {/* قسم الرسوم البيانية للملاحظات المتكررة */}
            {(comparisonType === 'monthly' || comparisonType === 'quarterly') && observations.length > 0 && (
                <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '20px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>🔄</span>
                        <h3 style={{
                            margin: 0,
                            color: '#dc3545',
                            fontSize: '1.3rem',
                            fontWeight: 'bold'
                        }}>
                            تحليل الملاحظات المتكررة - {getDetailedTableColumnLabel(targetYear)}
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
                                                    labelFormatter={() => ''}
                                                    formatter={(value: number, name: string, props: any) => [`${value}`, `${props.payload.name}: `]}
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
                                                    <span style={{ fontSize: '0.85rem' }}>{item.name}</span>
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
                                                    labelFormatter={() => ''}
                                                    formatter={(value: number, name: string, props: any) => [`${value}`, `${props.payload.fullName}: `]}
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
                                                    <span style={{ fontSize: '0.85rem' }}>{item.fullName}</span>
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


            {/* Correction Rates Section */}
            {(comparisonType === 'monthly' || comparisonType === 'quarterly') && correctionRates.length > 0 && (
                <div style={{ marginTop: '30px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#17a2b8', fontSize: '1.2rem' }}>
                        📊 نسب تصحيح الملاحظات - {getDetailedTableColumnLabel(targetYear)}
                    </h3>
                    <div style={{ marginTop: '20px' }}>
                        {(() => {
                            const filteredRates = selectedAnalysisCorrectionRates;

                            if (filteredRates.length === 0) {
                                return <p style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>لا توجد بيانات متاحة لهذه الفترة</p>;
                            }

                            const criteriaConfig = [
                                { key: 'act', label: 'ACT', desc: 'تقديم الرعاية واستمراريتها وقواعد انتقالها' },
                                { key: 'icd', label: 'ICD', desc: 'تقديم الرعاية المتكاملة' },
                                { key: 'das', label: 'DAS', desc: 'الخدمات التشخيصية والمساعدة' },
                                { key: 'mms', label: 'MMS', desc: 'إدارة وسلامة الدواء' },
                                { key: 'sip', label: 'SIP', desc: 'سلامة الإجراءات الجراحية والتداخلية' },
                                { key: 'ipc', label: 'IPC', desc: 'منع ومكافحة انتشار العدوى' },
                                { key: 'scm', label: 'SCM', desc: 'إدارة سلاسل الإمداد' },
                                { key: 'sas', label: 'SAS', desc: 'سلامة الإجراءات الجراحية والتداخلية والتخدير' },
                                { key: 'mrs', label: 'MRS', desc: 'خدمات الأشعة الطبية' },
                                { key: 'tex', label: 'TEX', desc: 'التجهيزات الطبية' },
                                { key: 'teq', label: 'TEQ', desc: 'الأعطال والأجهزة' },
                                { key: 'tpo', label: 'TPO', desc: 'السياسات والإجراءات' },
                                { key: 'nsr', label: 'NSR', desc: 'متطلبات السلامة الوطنية' },
                                { key: 'irs', label: 'IRS', desc: 'تحديد المريض' },
                                { key: 'cps', label: 'CPS', desc: 'سجلات الطوارئ' },
                                { key: 'lpr', label: 'LPR', desc: 'السجلات المعملية' },
                                { key: 'lep', label: 'LEP', desc: 'إدارة المخلفات' },
                                { key: 'lpo', label: 'LPO', desc: 'سياسات المختبر' },
                                { key: 'lqc', label: 'LQC', desc: 'مراقبة الجودة' },
                                { key: 'css', label: 'CSS', desc: 'التعقيم المركزي' },
                                { key: 'gsr', label: 'GSR', desc: 'متطلبات جهار للسلامة' }
                            ];

                            const renderSmartTable = (title: string, color: string, rates: any[]) => (
                                <div style={{ marginBottom: '40px' }}>
                                    <h4 style={{ backgroundColor: color, color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                        {title} ({rates.length} زيارات)
                                    </h4>
                                    <div style={{ border: `2px solid ${color}`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px', overflowX: 'auto' }}>
                                        {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية'].map(category => {
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

                            return (
                                <div>
                                    {/* جدول المؤشرات الذكي */}
                                    <div style={{ marginTop: '10px' }}>
                                        {renderSmartTable('🏛️ أولاً: المنشآت الصحية التابعة لهيئة الرعاية', '#17a2b8', filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية'))}
                                        {renderSmartTable('🏥 ثانياً: المنشآت الصحية التابعة لوزارة الصحة', '#ff9800', filteredRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة'))}
                                        {renderSmartTable('🏢 ثالثاً: منشآت صحية أخرى', '#28a745', filteredRates.filter(r => r.entityType === 'منشآت صحية أخرى'))}
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )
            }

            {/* قسم المعوقات - يظهر فقط في حالة الفلترة الشهرية - يظهر دائماً في آخر لوحة البيانات */}
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

            {/* قسم مقترحات التطوير - يظهر فقط في حالة الفلترة الشهرية - يظهر دائماً في آخر لوحة البيانات */}
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

            {/* قسم الأنشطة الإضافية - يظهر فقط في حالة الفلترة الشهرية - يظهر دائماً في آخر لوحة البيانات */}
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
        </div >
    );
}
