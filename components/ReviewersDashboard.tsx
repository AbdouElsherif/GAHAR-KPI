'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface ReviewersDashboardProps {
    submissions: Array<Record<string, any>>;
}

export default function ReviewersDashboard({ submissions }: ReviewersDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [selectedMonth, setSelectedMonth] = useState<number>(10);

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
            totalEvaluationVisits: number;
            evaluationDays: number;
            visitsToInsuranceGovernorate: number;
            visitsToGovFacilities: number;
            visitsToPrivateFacilities: number;
            visitsToMOHFacilities: number;
            accreditationCommittees: number;
            reportsToCommittee: number;
            appealsSubmitted: number;
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
                    totalEvaluationVisits: 0,
                    evaluationDays: 0,
                    visitsToInsuranceGovernorate: 0,
                    visitsToGovFacilities: 0,
                    visitsToPrivateFacilities: 0,
                    visitsToMOHFacilities: 0,
                    accreditationCommittees: 0,
                    reportsToCommittee: 0,
                    appealsSubmitted: 0,
                    count: 0
                };
            }

            aggregated[periodKey].totalEvaluationVisits += parseFloat(sub.totalEvaluationVisits) || 0;
            aggregated[periodKey].evaluationDays += parseFloat(sub.evaluationDays) || 0;
            aggregated[periodKey].visitsToInsuranceGovernorate += parseFloat(sub.visitsToInsuranceGovernorate) || 0;
            aggregated[periodKey].visitsToGovFacilities += parseFloat(sub.visitsToGovFacilities) || 0;
            aggregated[periodKey].visitsToPrivateFacilities += parseFloat(sub.visitsToPrivateFacilities) || 0;
            aggregated[periodKey].visitsToMOHFacilities += parseFloat(sub.visitsToMOHFacilities) || 0;
            aggregated[periodKey].accreditationCommittees += parseFloat(sub.accreditationCommittees) || 0;
            aggregated[periodKey].reportsToCommittee += parseFloat(sub.reportsToCommittee) || 0;
            aggregated[periodKey].appealsSubmitted += parseFloat(sub.appealsSubmitted) || 0;
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

    const currentTotalVisits = calculateFilteredTotal(currentAggregated, 'totalEvaluationVisits', comparisonType);
    const previousTotalVisits = calculateFilteredTotal(previousAggregated, 'totalEvaluationVisits', comparisonType);
    const visitsChange = calculateChange(currentTotalVisits, previousTotalVisits);

    const currentCommittees = calculateFilteredTotal(currentAggregated, 'accreditationCommittees', comparisonType);
    const previousCommittees = calculateFilteredTotal(previousAggregated, 'accreditationCommittees', comparisonType);
    const committeesChange = calculateChange(currentCommittees, previousCommittees);

    const currentAppeals = calculateFilteredTotal(currentAggregated, 'appealsSubmitted', comparisonType);
    const previousAppeals = calculateFilteredTotal(previousAggregated, 'appealsSubmitted', comparisonType);
    const appealsChange = calculateChange(currentAppeals, previousAppeals);

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

    const getTextFieldForSelectedMonth = (fieldName: string): string => {
        if (comparisonType !== 'monthly') return '';

        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return monthData?.[fieldName] || '';
    };

    const currentObstacles = getTextFieldForSelectedMonth('obstacles');
    const currentDevelopmentProposals = getTextFieldForSelectedMonth('developmentProposals');
    const currentAdditionalActivities = getTextFieldForSelectedMonth('additionalActivities');

    const preparePieData = (metric: string) => {
        const currentVal = calculateFilteredTotal(currentAggregated, metric, comparisonType);
        const previousVal = calculateFilteredTotal(previousAggregated, metric, comparisonType);
        return [
            { name: `${targetYear}`, value: currentVal },
            { name: `${targetYear - 1}`, value: previousVal }
        ];
    };

    const visitsPieData = preparePieData('totalEvaluationVisits');
    const committeesPieData = preparePieData('accreditationCommittees');
    const appealsPieData = preparePieData('appealsSubmitted');

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
                [`زيارات ${targetYear}`]: currentAggregated[period]?.totalEvaluationVisits || 0,
                [`زيارات ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.totalEvaluationVisits || 0,
                [`لجان ${targetYear}`]: currentAggregated[period]?.accreditationCommittees || 0,
                [`لجان ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.accreditationCommittees || 0,
            };
        });
    }

    function renderTableRows() {
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
                    <td colSpan={11} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
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

            const curr = currentAggregated[period];
            const prev = previousAggregated[previousPeriodKey];

            return (
                <tr key={period} style={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--background-color)'
                }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{formatPeriodLabel(period)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.totalEvaluationVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{prev?.totalEvaluationVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.visitsToInsuranceGovernorate || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.visitsToGovFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.visitsToPrivateFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.visitsToMOHFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.accreditationCommittees || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{prev?.accreditationCommittees || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{curr?.appealsSubmitted || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{prev?.appealsSubmitted || 0}</td>
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
                    الإدارة العامة لشئون المراجعين - تحليلات ومقارنات
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '25px',
                marginBottom: '35px'
            }}>
                <KPICard
                    title="إجمالي الزيارات التقييمية"
                    icon="🏥"
                    currentValue={currentTotalVisits}
                    previousValue={previousTotalVisits}
                    changePercentage={visitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={visitsPieData}
                    color="#0eacb8"
                />
                <KPICard
                    title="لجان الاعتماد المنعقدة"
                    icon="👨‍⚖️"
                    currentValue={currentCommittees}
                    previousValue={previousCommittees}
                    changePercentage={committeesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={committeesPieData}
                    color="#8884d8"
                />
                <KPICard
                    title="الالتماسات المقدمة"
                    icon="📝"
                    currentValue={currentAppeals}
                    previousValue={previousAppeals}
                    changePercentage={appealsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={appealsPieData}
                    color="#ff9800"
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
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة الزيارات التقييمية - رسم بياني خطي</h4>
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
                                dataKey={`زيارات ${targetYear}`}
                                stroke="#0eacb8"
                                strokeWidth={2}
                                dot={{ fill: '#0eacb8', r: 4 }}
                            >
                                <LabelList
                                    dataKey={`زيارات ${targetYear}`}
                                    position="top"
                                    offset={10}
                                    style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                />
                            </Line>
                            <Line
                                type="monotone"
                                dataKey={`زيارات ${targetYear - 1}`}
                                stroke="#999"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#999', r: 3 }}
                            >
                                <LabelList
                                    dataKey={`زيارات ${targetYear - 1}`}
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
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة لجان الاعتماد - رسم بياني عمودي</h4>
                    <ResponsiveContainer width="100%" height={300}>
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
                            <Bar dataKey={`لجان ${targetYear}`} fill="#0eacb8">
                                <LabelList
                                    dataKey={`لجان ${targetYear}`}
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                />
                            </Bar>
                            <Bar dataKey={`لجان ${targetYear - 1}`} fill="#ff9800">
                                <LabelList
                                    dataKey={`لجان ${targetYear - 1}`}
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                />
                            </Bar>
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
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>الفترة</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>زيارات {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>زيارات {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>تأمين</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>حكومي</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>خاص</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', fontSize: '0.85rem' }}>وزارة</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>لجان {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>لجان {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>التماسات {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>التماسات {targetYear - 1}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {renderTableRows()}
                        </tbody>
                    </table>
                </div>
            </div>

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
        </div>
    );
}
