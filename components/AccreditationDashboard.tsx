'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface AccreditationDashboardProps {
    submissions: Array<Record<string, any>>;
}

export default function AccreditationDashboard({ submissions }: AccreditationDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
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
        if (compType === 'yearly' || compType === 'monthly') {
            return Object.values(aggregated).reduce((sum: number, period: any) =>
                sum + (period[metric] || 0), 0
            );
        } else if (compType === 'quarterly') {
            const periodKey = `Q${selectedQuarter}`;
            return aggregated[periodKey]?.[metric] || 0;
        } else if (compType === 'halfYearly') {
            const periodKey = `H${selectedHalf}`;
            return aggregated[periodKey]?.[metric] || 0;
        }
        return 0;
    };

    // Calculate totals
    const currentTotalNewFacilities = calculateFilteredTotal(currentAggregated, 'newFacilities', comparisonType);
    const previousTotalNewFacilities = calculateFilteredTotal(previousAggregated, 'newFacilities', comparisonType);
    const newFacilitiesChange = calculateChange(currentTotalNewFacilities, previousTotalNewFacilities);

    const currentTotalAppeals = calculateFilteredTotal(currentAggregated, 'reviewedAppeals', comparisonType);
    const previousTotalAppeals = calculateFilteredTotal(previousAggregated, 'reviewedAppeals', comparisonType);
    const appealsChange = calculateChange(currentTotalAppeals, previousTotalAppeals);

    const currentTotalPlans = calculateFilteredTotal(currentAggregated, 'reviewedPlans', comparisonType);
    const previousTotalPlans = calculateFilteredTotal(previousAggregated, 'reviewedPlans', comparisonType);
    const plansChange = calculateChange(currentTotalPlans, previousTotalPlans);

    const currentTotalAccreditation = calculateFilteredTotal(currentAggregated, 'accreditation', comparisonType);
    const previousTotalAccreditation = calculateFilteredTotal(previousAggregated, 'accreditation', comparisonType);
    const accreditationChange = calculateChange(currentTotalAccreditation, previousTotalAccreditation);

    const currentTotalRenewal = calculateFilteredTotal(currentAggregated, 'renewal', comparisonType);
    const previousTotalRenewal = calculateFilteredTotal(previousAggregated, 'renewal', comparisonType);
    const renewalChange = calculateChange(currentTotalRenewal, previousTotalRenewal);

    const currentTotalCompletion = calculateFilteredTotal(currentAggregated, 'completion', comparisonType);
    const previousTotalCompletion = calculateFilteredTotal(previousAggregated, 'completion', comparisonType);
    const completionChange = calculateChange(currentTotalCompletion, previousTotalCompletion);


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

        if (comparisonType === 'quarterly') {
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
    }

    function renderTableRows() {
        let periods = Object.keys(currentAggregated).sort();

        if (comparisonType === 'quarterly') {
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
    }

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
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

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
                    marginBottom: '20px',
                    border: '1px solid var(--border-color)'
                }}>
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة المنشآت الجديدة - رسم بياني خطي</h4>
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
                                dataKey={`منشآت جديدة ${targetYear}`}
                                stroke="#0eacb8"
                                strokeWidth={2}
                                dot={{ fill: '#0eacb8', r: 4 }}
                            >
                                <LabelList
                                    dataKey={`منشآت جديدة ${targetYear}`}
                                    position="top"
                                    offset={10}
                                    style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                />
                            </Line>
                            <Line
                                type="monotone"
                                dataKey={`منشآت جديدة ${targetYear - 1}`}
                                stroke="#999"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#999', r: 3 }}
                            >
                                <LabelList
                                    dataKey={`منشآت جديدة ${targetYear - 1}`}
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
                        <h4 style={{ margin: 0, color: 'var(--text-color)' }}>مقارنة القرارات - رسم بياني عمودي</h4>
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
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>الفترة</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>منشآت جديدة {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>منشآت جديدة {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>التماسات {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>التماسات {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>خطط {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>خطط {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>اعتماد {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>اعتماد {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تجديد {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تجديد {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>استكمال {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>استكمال {targetYear - 1}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
