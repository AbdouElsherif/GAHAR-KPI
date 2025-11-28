'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface AdminAuditDashboardProps {
    submissions: Array<Record<string, any>>;
}

export default function AdminAuditDashboard({ submissions }: AdminAuditDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [visibleMetrics, setVisibleMetrics] = useState<{
        adminAudit: boolean;
        adminInspection: boolean;
        followUp: boolean;
        examReferral: boolean;
        facilities: boolean;
    }>({
        adminAudit: true,
        adminInspection: true,
        followUp: true,
        examReferral: true,
        facilities: true
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
            totalFieldVisits: number;
            adminAuditVisits: number;
            adminInspectionVisits: number;
            followUpVisits: number;
            examReferralVisits: number;
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
                    adminAuditVisits: 0,
                    adminInspectionVisits: 0,
                    followUpVisits: 0,
                    examReferralVisits: 0,
                    visitedFacilities: 0,
                    count: 0
                };
            }

            aggregated[periodKey].totalFieldVisits += parseFloat(sub.totalFieldVisits) || 0;
            aggregated[periodKey].adminAuditVisits += parseFloat(sub.adminAuditVisits) || 0;
            aggregated[periodKey].adminInspectionVisits += parseFloat(sub.adminInspectionVisits) || 0;
            aggregated[periodKey].followUpVisits += parseFloat(sub.followUpVisits) || 0;
            aggregated[periodKey].examReferralVisits += parseFloat(sub.examReferralVisits) || 0;
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

    // Calculate totals for each metric
    const currentTotalFieldVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.totalFieldVisits) || 0), 0);
    const previousTotalFieldVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.totalFieldVisits) || 0), 0);
    const fieldVisitsChange = calculateChange(currentTotalFieldVisits, previousTotalFieldVisits);

    const currentTotalAdminAuditVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.adminAuditVisits) || 0), 0);
    const previousTotalAdminAuditVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.adminAuditVisits) || 0), 0);
    const adminAuditVisitsChange = calculateChange(currentTotalAdminAuditVisits, previousTotalAdminAuditVisits);

    const currentTotalAdminInspectionVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.adminInspectionVisits) || 0), 0);
    const previousTotalAdminInspectionVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.adminInspectionVisits) || 0), 0);
    const adminInspectionVisitsChange = calculateChange(currentTotalAdminInspectionVisits, previousTotalAdminInspectionVisits);

    const currentTotalFollowUpVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.followUpVisits) || 0), 0);
    const previousTotalFollowUpVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.followUpVisits) || 0), 0);
    const followUpVisitsChange = calculateChange(currentTotalFollowUpVisits, previousTotalFollowUpVisits);

    const currentTotalExamReferralVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.examReferralVisits) || 0), 0);
    const previousTotalExamReferralVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.examReferralVisits) || 0), 0);
    const examReferralVisitsChange = calculateChange(currentTotalExamReferralVisits, previousTotalExamReferralVisits);

    const currentTotalVisitedFacilities = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.visitedFacilities) || 0), 0);
    const previousTotalVisitedFacilities = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.visitedFacilities) || 0), 0);
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

    const preparePieData = (metric: 'totalFieldVisits' | 'adminAuditVisits' | 'adminInspectionVisits' | 'followUpVisits' | 'examReferralVisits' | 'visitedFacilities') => {
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
                    title="زيارات التدقيق الإداري والسلامة"
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
                    title="زيارات التفتيش الإداري"
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
                    title="زيارات المتابعة"
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
                    title="زيارات الفحص والإحالة"
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
                    title="المنشآت المزارة"
                    icon="🏢"
                    currentValue={currentTotalVisitedFacilities}
                    previousValue={previousTotalVisitedFacilities}
                    changePercentage={visitedFacilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={visitedFacilitiesPieData}
                    color="#a4de6c"
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
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold' }}>الفترة</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>إجمالي {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>إجمالي {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تدقيق {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تدقيق {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تفتيش {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تفتيش {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>متابعة {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>متابعة {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>فحص/إحالة {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>فحص/إحالة {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>منشآت {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>منشآت {targetYear - 1}</th>
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
