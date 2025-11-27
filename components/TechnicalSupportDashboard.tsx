'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface TechnicalSupportDashboardProps {
    submissions: Array<Record<string, any>>;
}

export default function TechnicalSupportDashboard({ submissions }: TechnicalSupportDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);

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
                    count: 0
                };
            }

            aggregated[periodKey].supportPrograms += parseFloat(sub.supportPrograms) || 0;
            aggregated[periodKey].introVisits += parseFloat(sub.introVisits) || 0;
            aggregated[periodKey].fieldSupportVisits += parseFloat(sub.fieldSupportVisits) || 0;
            aggregated[periodKey].remoteSupportVisits += parseFloat(sub.remoteSupportVisits) || 0;
            aggregated[periodKey].supportedFacilities += parseFloat(sub.supportedFacilities) || 0;
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
    const currentTotalPrograms = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.supportPrograms) || 0), 0);
    const previousTotalPrograms = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.supportPrograms) || 0), 0);
    const programsChange = calculateChange(currentTotalPrograms, previousTotalPrograms);

    const currentTotalIntroVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.introVisits) || 0), 0);
    const previousTotalIntroVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.introVisits) || 0), 0);
    const introVisitsChange = calculateChange(currentTotalIntroVisits, previousTotalIntroVisits);

    const currentTotalFieldVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.fieldSupportVisits) || 0), 0);
    const previousTotalFieldVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.fieldSupportVisits) || 0), 0);
    const fieldVisitsChange = calculateChange(currentTotalFieldVisits, previousTotalFieldVisits);

    const currentTotalRemoteVisits = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.remoteSupportVisits) || 0), 0);
    const previousTotalRemoteVisits = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.remoteSupportVisits) || 0), 0);
    const remoteVisitsChange = calculateChange(currentTotalRemoteVisits, previousTotalRemoteVisits);

    const currentTotalFacilities = currentYearData.reduce((sum, sub) => sum + (parseFloat(sub.supportedFacilities) || 0), 0);
    const previousTotalFacilities = previousYearData.reduce((sum, sub) => sum + (parseFloat(sub.supportedFacilities) || 0), 0);
    const facilitiesChange = calculateChange(currentTotalFacilities, previousTotalFacilities);

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

    const preparePieData = (metric: 'supportPrograms' | 'introVisits' | 'fieldSupportVisits' | 'remoteSupportVisits' | 'supportedFacilities') => {
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
            }

            return [
                { name: `${targetYear}`, value: currentVal },
                { name: `${targetYear - 1}`, value: previousVal }
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

        const sortedPeriods = Array.from(allPeriods).sort();

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

    function renderTableRows() {
        const periods = Object.keys(currentAggregated).sort();

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

            const currentData = currentAggregated[period];
            const previousData = previousAggregated[previousPeriodKey];

            return (
                <tr key={period} style={{
                    borderBottom: '1px solid #eee',
                    backgroundColor: index % 2 === 0 ? 'transparent' : 'var(--background-color)'
                }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{formatPeriodLabel(period)}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.supportPrograms || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.supportPrograms || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.introVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.introVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.fieldSupportVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.fieldSupportVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.remoteSupportVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.remoteSupportVisits || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.supportedFacilities || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.supportedFacilities || 0}</td>
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
                        {[2026, 2025, 2024, 2023, 2022, 2021].map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>
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
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة أنواع الزيارات - رسم بياني عمودي</h4>
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
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>برامج {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>برامج {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تمهيدية {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>تمهيدية {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>ميداني {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>ميداني {targetYear - 1}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>عن بعد {targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>عن بعد {targetYear - 1}</th>
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
