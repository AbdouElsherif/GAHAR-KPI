'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface TechnicalSupportDashboardProps {
    submissions: Array<Record<string, any>>;
    visits?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        visitType: string;
        affiliatedEntity: string;
        facilityType: string;
        month: string;
        year: number;
    }>;
    remoteSupports?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        visitType: string;
        affiliatedEntity: string;
        facilityType: string;
        month: string;
        year: number;
    }>;
}

export default function TechnicalSupportDashboard({ submissions, visits = [], remoteSupports = [] }: TechnicalSupportDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [selectedMonth, setSelectedMonth] = useState<number>(10); // أكتوبر كقيمة افتراضية
    const [visibleMetrics, setVisibleMetrics] = useState<{
        intro: boolean;
        field: boolean;
        remote: boolean;
        facilities: boolean;
    }>({
        intro: true,
        field: true,
        remote: true,
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
            supportPrograms: number;
            introVisits: number;
            fieldSupportVisits: number;
            remoteSupportVisits: number;
            supportedFacilities: number;
            toolReleasesUpdates: number;
            reportsComplianceRate: number;
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
                    supportPrograms: 0,
                    introVisits: 0,
                    fieldSupportVisits: 0,
                    remoteSupportVisits: 0,
                    supportedFacilities: 0,
                    toolReleasesUpdates: 0,
                    reportsComplianceRate: 0,
                    count: 0
                };
            }

            aggregated[periodKey].supportPrograms += parseFloat(sub.supportPrograms) || 0;
            aggregated[periodKey].introVisits += parseFloat(sub.introVisits) || 0;
            aggregated[periodKey].fieldSupportVisits += parseFloat(sub.fieldSupportVisits) || 0;
            aggregated[periodKey].remoteSupportVisits += parseFloat(sub.remoteSupportVisits) || 0;
            aggregated[periodKey].supportedFacilities += parseFloat(sub.supportedFacilities) || 0;
            aggregated[periodKey].toolReleasesUpdates += parseFloat(sub.toolReleasesUpdates) || 0;
            aggregated[periodKey].reportsComplianceRate += parseFloat(sub.reportsComplianceRate) || 0;
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
            // For yearly, sum all periods
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
            // For quarterly, only sum the selected quarter
            const periodKey = `Q${selectedQuarter}`;
            return aggregated[periodKey]?.[metric] || 0;
        } else if (compType === 'halfYearly') {
            // For half-yearly, only sum the selected half
            const periodKey = `H${selectedHalf}`;
            return aggregated[periodKey]?.[metric] || 0;
        }
        return 0;
    };

    const currentTotalPrograms = calculateFilteredTotal(currentAggregated, 'supportPrograms', comparisonType);
    const previousTotalPrograms = calculateFilteredTotal(previousAggregated, 'supportPrograms', comparisonType);
    const programsChange = calculateChange(currentTotalPrograms, previousTotalPrograms);

    const currentTotalIntroVisits = calculateFilteredTotal(currentAggregated, 'introVisits', comparisonType);
    const previousTotalIntroVisits = calculateFilteredTotal(previousAggregated, 'introVisits', comparisonType);
    const introVisitsChange = calculateChange(currentTotalIntroVisits, previousTotalIntroVisits);

    const currentTotalFieldVisits = calculateFilteredTotal(currentAggregated, 'fieldSupportVisits', comparisonType);
    const previousTotalFieldVisits = calculateFilteredTotal(previousAggregated, 'fieldSupportVisits', comparisonType);
    const fieldVisitsChange = calculateChange(currentTotalFieldVisits, previousTotalFieldVisits);

    const currentTotalRemoteVisits = calculateFilteredTotal(currentAggregated, 'remoteSupportVisits', comparisonType);
    const previousTotalRemoteVisits = calculateFilteredTotal(previousAggregated, 'remoteSupportVisits', comparisonType);
    const remoteVisitsChange = calculateChange(currentTotalRemoteVisits, previousTotalRemoteVisits);

    const currentTotalFacilities = calculateFilteredTotal(currentAggregated, 'supportedFacilities', comparisonType);
    const previousTotalFacilities = calculateFilteredTotal(previousAggregated, 'supportedFacilities', comparisonType);
    const facilitiesChange = calculateChange(currentTotalFacilities, previousTotalFacilities);

    const currentTotalReleases = calculateFilteredTotal(currentAggregated, 'toolReleasesUpdates', comparisonType);
    const previousTotalReleases = calculateFilteredTotal(previousAggregated, 'toolReleasesUpdates', comparisonType);
    const releasesChange = calculateChange(currentTotalReleases, previousTotalReleases);

    const currentComplianceRate = calculateFilteredTotal(currentAggregated, 'reportsComplianceRate', comparisonType);
    const previousComplianceRate = calculateFilteredTotal(previousAggregated, 'reportsComplianceRate', comparisonType);
    const complianceChange = calculateChange(currentComplianceRate, previousComplianceRate);

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

    const preparePieData = (metric: 'supportPrograms' | 'introVisits' | 'fieldSupportVisits' | 'remoteSupportVisits' | 'supportedFacilities' | 'toolReleasesUpdates' | 'reportsComplianceRate') => {
        if (comparisonType === 'yearly' || comparisonType === 'monthly') {
            let currentVal = 0;
            let previousVal = 0;

            switch (metric) {
                case 'supportPrograms':
                    currentVal = currentTotalPrograms;
                    previousVal = previousTotalPrograms;
                    break;
                case 'introVisits':
                    currentVal = currentTotalIntroVisits;
                    previousVal = previousTotalIntroVisits;
                    break;
                case 'fieldSupportVisits':
                    currentVal = currentTotalFieldVisits;
                    previousVal = previousTotalFieldVisits;
                    break;
                case 'remoteSupportVisits':
                    currentVal = currentTotalRemoteVisits;
                    previousVal = previousTotalRemoteVisits;
                    break;
                case 'supportedFacilities':
                    currentVal = currentTotalFacilities;
                    previousVal = previousTotalFacilities;
                    break;
                case 'toolReleasesUpdates':
                    currentVal = currentTotalReleases;
                    previousVal = previousTotalReleases;
                    break;
                case 'reportsComplianceRate':
                    currentVal = currentComplianceRate;
                    previousVal = previousComplianceRate;
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

    const programsPieData = preparePieData('supportPrograms');
    const introVisitsPieData = preparePieData('introVisits');
    const fieldVisitsPieData = preparePieData('fieldSupportVisits');
    const remoteVisitsPieData = preparePieData('remoteSupportVisits');
    const facilitiesPieData = preparePieData('supportedFacilities');
    const releasesPieData = preparePieData('toolReleasesUpdates');
    const compliancePieData = preparePieData('reportsComplianceRate');

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
                [`برامج ${targetYear}`]: currentAggregated[period]?.supportPrograms || 0,
                [`برامج ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.supportPrograms || 0,
                [`زيارات تمهيدية ${targetYear}`]: currentAggregated[period]?.introVisits || 0,
                [`زيارات تمهيدية ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.introVisits || 0,
                [`دعم ميداني ${targetYear}`]: currentAggregated[period]?.fieldSupportVisits || 0,
                [`دعم ميداني ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.fieldSupportVisits || 0,
                [`دعم عن بعد ${targetYear}`]: currentAggregated[period]?.remoteSupportVisits || 0,
                [`دعم عن بعد ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.remoteSupportVisits || 0,
                [`منشآت ${targetYear}`]: currentAggregated[period]?.supportedFacilities || 0,
                [`منشآت ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.supportedFacilities || 0,
            };
        });
    }



    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: 'var(--primary-color)' }}>
                    📊 لوحة البيانات القياسية
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>
                    الإدارة العامة للدعم الفني - تحليلات ومقارنات
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
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '20px',
                marginBottom: '35px'
            }}>
                <KPICard
                    title="إجمالي برامج الدعم الفني"
                    icon="🛠️"
                    currentValue={currentTotalPrograms}
                    previousValue={previousTotalPrograms}
                    changePercentage={programsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={programsPieData}
                    color="#0eacb8"
                />
                <KPICard
                    title="الزيارات التمهيدية"
                    icon="👁️"
                    currentValue={currentTotalIntroVisits}
                    previousValue={previousTotalIntroVisits}
                    changePercentage={introVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={introVisitsPieData}
                    color="#8884d8"
                />
                <KPICard
                    title="زيارات الدعم الميداني"
                    icon="🏥"
                    currentValue={currentTotalFieldVisits}
                    previousValue={previousTotalFieldVisits}
                    changePercentage={fieldVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={fieldVisitsPieData}
                    color="#82ca9d"
                />
                <KPICard
                    title="زيارات الدعم عن بعد"
                    icon="💻"
                    currentValue={currentTotalRemoteVisits}
                    previousValue={previousTotalRemoteVisits}
                    changePercentage={remoteVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={remoteVisitsPieData}
                    color="#ffc658"
                />
                <KPICard
                    title="المنشآت المدعومة"
                    icon="🏢"
                    currentValue={currentTotalFacilities}
                    previousValue={previousTotalFacilities}
                    changePercentage={facilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={facilitiesPieData}
                    color="#ff7c7c"
                />
                <KPICard
                    title="عدد إصدارات وتحديثات أدوات التقييم الذاتي"
                    icon="🔧"
                    currentValue={currentTotalReleases}
                    previousValue={previousTotalReleases}
                    changePercentage={releasesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={releasesPieData}
                    color="#9b59b6"
                />
                <KPICard
                    title="نسبة استيفاء التقارير (%)"
                    icon="📋"
                    currentValue={currentComplianceRate}
                    previousValue={previousComplianceRate}
                    changePercentage={complianceChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={compliancePieData}
                    color="#3498db"
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
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة برامج الدعم الفني - رسم بياني خطي</h4>
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
                                dataKey={`برامج ${targetYear}`}
                                stroke="#0eacb8"
                                strokeWidth={2}
                                dot={{ fill: '#0eacb8', r: 4 }}
                            >
                                <LabelList
                                    dataKey={`برامج ${targetYear}`}
                                    position="top"
                                    offset={10}
                                    style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                />
                            </Line>
                            <Line
                                type="monotone"
                                dataKey={`برامج ${targetYear - 1}`}
                                stroke="#999"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                dot={{ fill: '#999', r: 3 }}
                            >
                                <LabelList
                                    dataKey={`برامج ${targetYear - 1}`}
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
                                    checked={visibleMetrics.intro}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, intro: e.target.checked })}
                                />
                                <span>تمهيدية</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.field}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, field: e.target.checked })}
                                />
                                <span>ميداني</span>
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.9rem' }}>
                                <input
                                    type="checkbox"
                                    checked={visibleMetrics.remote}
                                    onChange={(e) => setVisibleMetrics({ ...visibleMetrics, remote: e.target.checked })}
                                />
                                <span>عن بعد</span>
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
                            {visibleMetrics.intro && (
                                <>
                                    <Bar dataKey={`زيارات تمهيدية ${targetYear}`} fill="#8884d8">
                                        <LabelList
                                            dataKey={`زيارات تمهيدية ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`زيارات تمهيدية ${targetYear - 1}`} fill="#c5c5e8">
                                        <LabelList
                                            dataKey={`زيارات تمهيدية ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.field && (
                                <>
                                    <Bar dataKey={`دعم ميداني ${targetYear}`} fill="#82ca9d">
                                        <LabelList
                                            dataKey={`دعم ميداني ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`دعم ميداني ${targetYear - 1}`} fill="#c5e8d5">
                                        <LabelList
                                            dataKey={`دعم ميداني ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.remote && (
                                <>
                                    <Bar dataKey={`دعم عن بعد ${targetYear}`} fill="#ffc658">
                                        <LabelList
                                            dataKey={`دعم عن بعد ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`دعم عن بعد ${targetYear - 1}`} fill="#ffe5b4">
                                        <LabelList
                                            dataKey={`دعم عن بعد ${targetYear - 1}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#d32f2f', fontSize: '14px' }}
                                        />
                                    </Bar>
                                </>
                            )}
                            {visibleMetrics.facilities && (
                                <>
                                    <Bar dataKey={`منشآت ${targetYear}`} fill="#ff7c7c">
                                        <LabelList
                                            dataKey={`منشآت ${targetYear}`}
                                            position="top"
                                            style={{ fontWeight: 'bold', fill: '#1976d2', fontSize: '14px' }}
                                        />
                                    </Bar>
                                    <Bar dataKey={`منشآت ${targetYear - 1}`} fill="#ffb3b3">
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
                                }) as any || { supportPrograms: 0, introVisits: 0, fieldSupportVisits: 0, remoteSupportVisits: 0, supportedFacilities: 0, toolReleasesUpdates: 0, reportsComplianceRate: 0 };

                                const previousData = Object.values(previousAggregated).find((_, idx) => {
                                    const key = Object.keys(previousAggregated)[idx];
                                    if (key.includes('-')) {
                                        return parseInt(key.split('-')[1]) === selectedMonth;
                                    }
                                    return false;
                                }) as any || { supportPrograms: 0, introVisits: 0, fieldSupportVisits: 0, remoteSupportVisits: 0, supportedFacilities: 0, toolReleasesUpdates: 0, reportsComplianceRate: 0 };

                                const indicators = [
                                    { label: 'برامج الدعم الفني', current: currentData.supportPrograms || 0, previous: previousData.supportPrograms || 0 },
                                    { label: 'زيارات تمهيدية', current: currentData.introVisits || 0, previous: previousData.introVisits || 0 },
                                    { label: 'دعم فني ميداني', current: currentData.fieldSupportVisits || 0, previous: previousData.fieldSupportVisits || 0 },
                                    { label: 'دعم فني عن بعد', current: currentData.remoteSupportVisits || 0, previous: previousData.remoteSupportVisits || 0 },
                                    { label: 'منشآت مدعومة', current: currentData.supportedFacilities || 0, previous: previousData.supportedFacilities || 0 },
                                    { label: 'عدد إصدارات وتحديثات أدوات التقييم الذاتي', current: currentData.toolReleasesUpdates || 0, previous: previousData.toolReleasesUpdates || 0 },
                                    { label: 'نسبة استيفاء التقارير (%)', current: currentData.reportsComplianceRate || 0, previous: previousData.reportsComplianceRate || 0 },
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

            {/* Field Visits Section */}
            {comparisonType === 'monthly' && visits.length > 0 && (() => {
                const monthlyVisits = visits.filter(v => {
                    const visitMonth = parseInt(v.month.split('-')[1]);
                    const visitYear = parseInt(v.month.split('-')[0]);
                    // Calculate fiscal year: if month >= 7, fiscal year is visitYear + 1, else visitYear
                    const fiscalYear = visitMonth >= 7 ? visitYear + 1 : visitYear;
                    return visitMonth === selectedMonth && fiscalYear === targetYear;
                });

                if (monthlyVisits.length === 0) return null;

                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

                return (
                    <div style={{ marginTop: '40px' }}>
                        <h3 style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: 'var(--primary-color)',
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '8px',
                            borderRight: '4px solid var(--primary-color)'
                        }}>
                            🏥 الزيارات الميدانية للمنشآت - {monthNames[selectedMonth - 1]} {targetYear} ({monthlyVisits.length} زيارة)
                        </h3>

                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            overflowX: 'auto'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>#</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>اسم المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>المحافظة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>نوع الزيارة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الجهة التابعة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>نوع المنشأة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyVisits.map((visit, index) => (
                                        <tr key={visit.id || index} style={{
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                        }}>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{visit.facilityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{visit.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{visit.visitType}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{visit.affiliatedEntity}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    backgroundColor: '#e3f2fd',
                                                    color: '#1976d2',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {visit.facilityType}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}

            {/* Remote Technical Support Section */}
            {comparisonType === 'monthly' && remoteSupports.length > 0 && (() => {
                const monthlyRemoteSupports = remoteSupports.filter(s => {
                    const supportMonth = parseInt(s.month.split('-')[1]);
                    const supportYear = parseInt(s.month.split('-')[0]);
                    const fiscalYear = supportMonth >= 7 ? supportYear + 1 : supportYear;
                    return supportMonth === selectedMonth && fiscalYear === targetYear;
                });

                if (monthlyRemoteSupports.length === 0) return null;

                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

                return (
                    <div style={{ marginTop: '40px' }}>
                        <h3 style={{
                            fontSize: '1.4rem',
                            fontWeight: 'bold',
                            color: 'var(--primary-color)',
                            marginBottom: '20px',
                            padding: '15px',
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '8px',
                            borderRight: '4px solid #ffc658'
                        }}>
                            💻 الدعم الفني عن بعد - {monthNames[selectedMonth - 1]} {targetYear} ({monthlyRemoteSupports.length} زيارة)
                        </h3>

                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            overflowX: 'auto'
                        }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>#</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>اسم المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>المحافظة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>نوع الزيارة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الجهة التابعة</th>
                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>نوع المنشأة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {monthlyRemoteSupports.map((support, index) => (
                                        <tr key={support.id || index} style={{
                                            borderBottom: '1px solid #eee',
                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                        }}>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{support.facilityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{support.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{support.visitType}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{support.affiliatedEntity}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>
                                                <span style={{
                                                    padding: '4px 12px',
                                                    backgroundColor: '#fff3cd',
                                                    color: '#856404',
                                                    borderRadius: '12px',
                                                    fontSize: '0.85rem',
                                                    fontWeight: '500'
                                                }}>
                                                    {support.facilityType}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                );
            })()}
        </div >
    );
}
