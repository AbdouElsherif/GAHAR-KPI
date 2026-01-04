'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';
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

    const getFiscalYear = (dateStr: string): number => {

        const year = parseInt(dateStr.split('-')[0]);
        const month = parseInt(dateStr.split('-')[1]);
        return month >= 7 ? year + 1 : year;
    };

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

    const currentTotalAuditVisits = calculateFilteredTotal(currentAggregated, 'auditVisits', comparisonType);
    const previousTotalAuditVisits = calculateFilteredTotal(previousAggregated, 'auditVisits', comparisonType);
    const auditVisitsChange = calculateChange(currentTotalAuditVisits, previousTotalAuditVisits);

    const currentTotalAssessmentVisits = calculateFilteredTotal(currentAggregated, 'assessmentVisits', comparisonType);
    const previousTotalAssessmentVisits = calculateFilteredTotal(previousAggregated, 'assessmentVisits', comparisonType);
    const assessmentVisitsChange = calculateChange(currentTotalAssessmentVisits, previousTotalAssessmentVisits);

    const currentTotalVisitedFacilities = calculateFilteredTotal(currentAggregated, 'visitedFacilities', comparisonType);
    const previousTotalVisitedFacilities = calculateFilteredTotal(previousAggregated, 'visitedFacilities', comparisonType);
    const visitedFacilitiesChange = calculateChange(currentTotalVisitedFacilities, previousTotalVisitedFacilities);

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

    const preparePieData = (metric: 'totalFieldVisits' | 'auditVisits' | 'assessmentVisits' | 'visitedFacilities') => {
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
    };

    const fieldVisitsPieData = preparePieData('totalFieldVisits');
    const auditVisitsPieData = preparePieData('auditVisits');
    const assessmentVisitsPieData = preparePieData('assessmentVisits');
    const visitedFacilitiesPieData = preparePieData('visitedFacilities');

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
                [`تدقيق ${targetYear}`]: currentAggregated[period]?.auditVisits || 0,
                [`تدقيق ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.auditVisits || 0,
                [`تقييم ${targetYear}`]: currentAggregated[period]?.assessmentVisits || 0,
                [`تقييم ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.assessmentVisits || 0,
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
                            <option key={year} value={year}>{year - 1} - {year}</option>
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
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>السنة المالية {targetYear - 1} - {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>السنة المالية {targetYear - 2} - {targetYear - 1}</th>
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
                                    <tr style={{ backgroundColor: '#f8f9fa', color: '#495057' }}>
                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>نوع المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>اسم المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>المحافظة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facilities.filter(f => {
                                        const [year, month] = f.month.split('-');
                                        const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                        return parseInt(year) === expectedYear && parseInt(month) === selectedMonth;
                                    }).length === 0 ? (
                                        <tr>
                                            <td colSpan={3} style={{ padding: '20px', textAlign: 'center', color: '#6c757d' }}>
                                                لا توجد زيارات مسجلة لهذا الشهر
                                            </td>
                                        </tr>
                                    ) : (
                                        facilities.filter(f => {
                                            const [year, month] = f.month.split('-');
                                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                            return parseInt(year) === expectedYear && parseInt(month) === selectedMonth;
                                        }).map((facility, index) => (
                                            <tr key={index} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '12px' }}>{facility.facilityType}</td>
                                                <td style={{ padding: '12px', fontWeight: 'bold' }}>{facility.facilityName}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{facility.governorate}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Recurring Observations Section */}
            {comparisonType === 'monthly' && observations.length > 0 && (
                <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        padding: '25px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                        <h3 style={{
                            margin: '0 0 20px 0',
                            color: '#dc3545',
                            fontSize: '1.3rem',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px'
                        }}>
                            🔄 الملاحظات المتكررة - {monthNames[selectedMonth - 1]} {selectedMonth >= 7 ? targetYear - 1 : targetYear}
                        </h3>
                        {(() => {
                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                            const filteredObs = observations.filter(o => {
                                const [year, month] = o.month.split('-');
                                return parseInt(year) === expectedYear && parseInt(month) === selectedMonth;
                            });

                            if (filteredObs.length === 0) {
                                return <p style={{ textAlign: 'center', color: '#6c757d' }}>لا توجد ملاحظات متكررة لهذا الشهر</p>;
                            }

                            // Group by entityType
                            const hcaObservations = filteredObs.filter(o => o.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية الصحية');
                            const mohObservations = filteredObs.filter(o => o.entityType === 'منشآت تابعة لوزارة الصحة');
                            const otherObservations = filteredObs.filter(o => o.entityType === 'منشآت تابعة لجهات أخرى');

                            return (
                                <div>
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
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                            <thead>
                                                                <tr style={{ backgroundColor: '#e3f2fd' }}>
                                                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #1565c0' }}>نوع المنشأة</th>
                                                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #1565c0' }}>الملاحظة</th>
                                                                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #1565c0', width: '120px' }}>النسبة</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {hcaObservations.map((obs, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                                        <td style={{ padding: '12px' }}>{obs.facilityType}</td>
                                                                        <td style={{ padding: '12px' }}>{obs.observation}</td>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <span style={{
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontWeight: 'bold',
                                                                                backgroundColor: obs.percentage >= 50 ? '#f8d7da' : '#fff3cd',
                                                                                color: obs.percentage >= 50 ? '#721c24' : '#856404'
                                                                            }}>{obs.percentage}%</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    )}

                                    {/* MOH Observations Accordion */}
                                    {mohObservations.length > 0 && (
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
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                            <thead>
                                                                <tr style={{ backgroundColor: '#fff3e0' }}>
                                                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e65100' }}>نوع المنشأة</th>
                                                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #e65100' }}>الملاحظة</th>
                                                                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #e65100', width: '120px' }}>النسبة</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {mohObservations.map((obs, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                                        <td style={{ padding: '12px' }}>{obs.facilityType}</td>
                                                                        <td style={{ padding: '12px' }}>{obs.observation}</td>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <span style={{
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontWeight: 'bold',
                                                                                backgroundColor: obs.percentage >= 50 ? '#f8d7da' : '#fff3cd',
                                                                                color: obs.percentage >= 50 ? '#721c24' : '#856404'
                                                                            }}>{obs.percentage}%</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    )}

                                    {/* Other Observations Accordion */}
                                    {otherObservations.length > 0 && (
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
                                                    backgroundColor: '#e8f5e9',
                                                    color: '#2e7d32',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center'
                                                }}>
                                                    <span>منشآت تابعة لجهات أخرى</span>
                                                    <span style={{
                                                        backgroundColor: '#2e7d32',
                                                        color: 'white',
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem'
                                                    }}>{otherObservations.length} ملاحظات</span>
                                                </summary>
                                                <div style={{ padding: '15px' }}>
                                                    <div style={{ overflowX: 'auto' }}>
                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                                            <thead>
                                                                <tr style={{ backgroundColor: '#e8f5e9' }}>
                                                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2e7d32' }}>نوع المنشأة</th>
                                                                    <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #2e7d32' }}>الملاحظة</th>
                                                                    <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #2e7d32', width: '120px' }}>النسبة</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {otherObservations.map((obs, idx) => (
                                                                    <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                                        <td style={{ padding: '12px' }}>{obs.facilityType}</td>
                                                                        <td style={{ padding: '12px' }}>{obs.observation}</td>
                                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                            <span style={{
                                                                                padding: '4px 10px',
                                                                                borderRadius: '12px',
                                                                                fontWeight: 'bold',
                                                                                backgroundColor: obs.percentage >= 50 ? '#f8d7da' : '#fff3cd',
                                                                                color: obs.percentage >= 50 ? '#721c24' : '#856404'
                                                                            }}>{obs.percentage}%</span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </details>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* Correction Rates Section */}
            {comparisonType === 'monthly' && correctionRates.length > 0 && (
                <div style={{ marginTop: '30px', backgroundColor: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}>
                    <h3 style={{ margin: '0 0 15px 0', color: '#17a2b8', fontSize: '1.2rem' }}>
                        📊 نسب تصحيح الملاحظات - {monthNames[selectedMonth - 1]} {selectedMonth >= 7 ? targetYear - 1 : targetYear}
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        {(() => {
                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                            const filteredRates = correctionRates.filter(r => {
                                const [year, month] = r.month.split('-');
                                return parseInt(year) === expectedYear && parseInt(month) === selectedMonth;
                            });

                            if (filteredRates.length === 0) {
                                return <p style={{ textAlign: 'center', color: '#6c757d' }}>لا توجد بيانات لهذا الشهر</p>;
                            }

                            return (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                                            <th style={{ padding: '8px', textAlign: 'right' }}>المنشأة</th>
                                            <th style={{ padding: '8px', textAlign: 'center' }}>المحافظة</th>
                                            {['ACT', 'ICD', 'DAS', 'MMS', 'SIP', 'IPC', 'SCM', 'TEX', 'TEQ', 'TPO', 'NSR', 'SAS'].map(c => (
                                                <th key={c} style={{ padding: '6px', textAlign: 'center', fontSize: '0.7rem' }}>{c}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRates.map((rate, idx) => (
                                            <tr key={idx} style={{ borderBottom: '1px solid #dee2e6' }}>
                                                <td style={{ padding: '8px', fontWeight: '500' }}>{rate.facilityName}</td>
                                                <td style={{ padding: '8px', textAlign: 'center' }}>{rate.governorate}</td>
                                                {[
                                                    { t: rate.actTotal, c: rate.actCorrected },
                                                    { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected },
                                                    { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected },
                                                    { t: rate.ipcTotal, c: rate.ipcCorrected },
                                                    { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected },
                                                    { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected },
                                                    { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }
                                                ].map((item, i) => {
                                                    if (item.t === 0 && item.c === 0) {
                                                        return <td key={i} style={{ padding: '6px', textAlign: 'center', color: '#6c757d' }}>-</td>;
                                                    }
                                                    const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                    return (
                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>
                                                            <span style={{
                                                                padding: '2px 5px', borderRadius: '6px', fontSize: '0.7rem', fontWeight: 'bold',
                                                                backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da',
                                                                color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24'
                                                            }}>{pct}%</span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
