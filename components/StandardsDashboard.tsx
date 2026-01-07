'use client';

import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface StandardsDashboardProps {
    submissions: Array<Record<string, any>>;
}

export default function StandardsDashboard({ submissions }: StandardsDashboardProps) {
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

    // Define all 16 standards
    const standardFields = [
        { name: 'standard1', label: 'معايير دور النقاهة والرعاية الممتدة' },
        { name: 'standard2', label: 'معايير السياحة الاستشفائية' },
        { name: 'standard3', label: 'معايير الرعاية الأولية (إصدار 2025)' },
        { name: 'standard4', label: 'الدليل الاسترشادي للتجهيزات الطبية للمستشفيات' },
        { name: 'standard5', label: 'معايير المستشفيات (إصدار 2025)' },
        { name: 'standard6', label: 'معايير التميز للمنشآت الصديقة للأم والطفل' },
        { name: 'standard7', label: 'معايير المعامل الإكلينيكية' },
        { name: 'standard8', label: 'معايير المراكز الطبية المتخصصة وجراحات اليوم الواحد' },
        { name: 'standard9', label: 'معايير الأشعة العلاجية التداخلية والتشخيصية' },
        { name: 'standard10', label: 'معايير مكاتب الصحة المستقلة' },
        { name: 'standard11', label: 'معايير مكاتب الصحة النفسية (الإصدار الثاني)' },
        { name: 'standard12', label: 'معايير التميز الإكلينيكي' },
        { name: 'standard13', label: 'معايير بنوك الدم' },
        { name: 'standard14', label: 'معايير التطبيب عن بعد' },
        { name: 'standard15', label: 'دليل المراجعين' },
        { name: 'standard16', label: 'معايير العلاج الطبيعي (الإصدار الثاني)' }
    ];

    const aggregateData = (data: Array<Record<string, any>>, type: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly') => {
        const aggregated: Record<string, { standards: Record<string, number[]>; count: number }> = {};

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
                aggregated[periodKey] = { standards: {}, count: 0 };
                standardFields.forEach(field => {
                    aggregated[periodKey].standards[field.name] = [];
                });
            }

            standardFields.forEach(field => {
                const value = parseFloat(sub[field.name]) || 0;
                aggregated[periodKey].standards[field.name].push(value);
            });
            aggregated[periodKey].count += 1;
        });

        // Calculate averages
        Object.keys(aggregated).forEach(period => {
            Object.keys(aggregated[period].standards).forEach(stdName => {
                const values: number[] = aggregated[period].standards[stdName] as number[];
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                (aggregated[period].standards as any)[stdName] = avg;
            });
        });

        return aggregated;
    };

    const currentYearData = filterByYear(targetYear);
    const previousYearData = filterByYear(targetYear - 1);

    const currentAggregated = aggregateData(currentYearData, comparisonType);
    const previousAggregated = aggregateData(previousYearData, comparisonType);

    // Calculate KPIs
    const calculateKPIs = (aggregated: any, compType: string) => {
        let periodKey = '';

        if (compType === 'yearly') {
            periodKey = 'السنة الكاملة';
        } else if (compType === 'monthly') {
            const monthKey = Object.keys(aggregated).find(key => {
                if (key.includes('-')) {
                    const month = parseInt(key.split('-')[1]);
                    return month === selectedMonth;
                }
                return false;
            });
            periodKey = monthKey || '';
        } else if (compType === 'quarterly') {
            periodKey = `Q${selectedQuarter}`;
        } else if (compType === 'halfYearly') {
            periodKey = `H${selectedHalf}`;
        }

        if (!aggregated[periodKey]) {
            return { completed: 0, avgProgress: 0, inProgress: 0, notStarted: 0 };
        }

        const standards = aggregated[periodKey].standards;
        let completed = 0;
        let inProgress = 0;
        let notStarted = 0;
        let totalProgress = 0;

        Object.values(standards).forEach((value: any) => {
            const progress = parseFloat(value) || 0;
            totalProgress += progress;

            if (progress === 100) {
                completed++;
            } else if (progress > 0) {
                inProgress++;
            } else {
                notStarted++;
            }
        });

        const avgProgress = totalProgress / standardFields.length;

        return { completed, avgProgress, inProgress, notStarted };
    };

    const currentKPIs = calculateKPIs(currentAggregated, comparisonType);
    const previousKPIs = calculateKPIs(previousAggregated, comparisonType);

    const calculateChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    const completedChange = calculateChange(currentKPIs.completed, previousKPIs.completed);
    const avgProgressChange = calculateChange(currentKPIs.avgProgress, previousKPIs.avgProgress);
    const inProgressChange = calculateChange(currentKPIs.inProgress, previousKPIs.inProgress);

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

    const getTextFieldsForSelectedMonth = () => {
        if (comparisonType !== 'monthly') return { obstacles: '', developmentProposals: '', additionalActivities: '', notes: '' };

        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return {
            obstacles: monthData?.obstacles || '',
            developmentProposals: monthData?.developmentProposals || '',
            additionalActivities: monthData?.additionalActivities || '',
            notes: monthData?.notes || ''
        };
    };

    const getAllTextFieldsForYear = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const fiscalMonths = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6]; // July to June

        return currentYearData
            .filter(sub => sub.date && getFiscalYear(sub.date) === targetYear)
            .map(sub => {
                const month = getMonth(sub.date);
                const year = getYear(sub.date);
                return {
                    month,
                    year,
                    monthName: monthNames[month - 1],
                    date: sub.date,
                    obstacles: sub.obstacles || '',
                    developmentProposals: sub.developmentProposals || '',
                    additionalActivities: sub.additionalActivities || '',
                    notes: sub.notes || ''
                };
            })
            .filter(item =>
                item.obstacles ||
                item.developmentProposals ||
                item.additionalActivities ||
                item.notes
            )
            .sort((a, b) => {
                const aIndex = fiscalMonths.indexOf(a.month);
                const bIndex = fiscalMonths.indexOf(b.month);
                return aIndex - bIndex;
            });
    };

    const textFields = getTextFieldsForSelectedMonth();
    const allYearTextFields = getAllTextFieldsForYear();

    function prepareChartData() {
        const currentPeriods = Object.keys(currentAggregated);
        const allPeriods = new Set<string>();

        currentPeriods.forEach(period => allPeriods.add(period));
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

            const currentStds = currentAggregated[period]?.standards || {};
            const previousStds = previousAggregated[previousPeriodKey]?.standards || {};

            // Calculate average for current and previous
            const currentAvg = Object.values(currentStds).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0) / standardFields.length;
            const previousAvg = Object.values(previousStds).reduce((sum: number, val: any) => sum + (parseFloat(val) || 0), 0) / standardFields.length;

            return {
                period: formatPeriodLabel(period),
                [`متوسط ${targetYear}`]: Math.round(currentAvg * 10) / 10,
                [`متوسط ${targetYear - 1}`]: Math.round(previousAvg * 10) / 10,
            };
        });
    }

    function prepareStandardsBarChart() {
        let periodKey = '';

        if (comparisonType === 'yearly') {
            periodKey = 'السنة الكاملة';
        } else if (comparisonType === 'monthly') {
            const monthKey = Object.keys(currentAggregated).find(key => {
                if (key.includes('-')) {
                    const month = parseInt(key.split('-')[1]);
                    return month === selectedMonth;
                }
                return false;
            });
            periodKey = monthKey || '';
        } else if (comparisonType === 'quarterly') {
            periodKey = `Q${selectedQuarter}`;
        } else if (comparisonType === 'halfYearly') {
            periodKey = `H${selectedHalf}`;
        }

        if (!currentAggregated[periodKey]) return [];

        const standards = currentAggregated[periodKey].standards;

        return standardFields.map(field => ({
            name: field.label.length > 25 ? field.label.substring(0, 22) + '...' : field.label,
            'نسبة الإنجاز': Math.round((parseFloat(String(standards[field.name])) || 0) * 10) / 10
        }));
    }

    const preparePieData = (metric: 'completed' | 'avgProgress') => {
        const currentVal = metric === 'completed' ? currentKPIs.completed : currentKPIs.avgProgress;
        const previousVal = metric === 'completed' ? previousKPIs.completed : previousKPIs.avgProgress;
        return [
            { name: `${targetYear}`, value: Math.round(currentVal * 10) / 10 },
            { name: `${targetYear - 1}`, value: Math.round(previousVal * 10) / 10 }
        ];
    };

    const completedPieData = preparePieData('completed');
    const avgProgressPieData = preparePieData('avgProgress');

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: 'var(--primary-color)' }}>
                    📊 لوحة بيانات أبحاث وتطوير المعايير
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>
                    الإدارة العامة لأبحاث وتطوير المعايير - تحليلات ومقارنات
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
                )
                }
            </div>

            <div style={{ marginBottom: '30px' }}>
                <h3 style={{ marginBottom: '20px', color: 'var(--text-color)' }}>📊 تحليل المعايير</h3>

                {/* Standards Progress Table */}
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '12px',
                    padding: '20px',
                    border: '1px solid var(--border-color)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <h4 style={{
                        margin: '0 0 20px 0',
                        color: 'var(--text-color)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📋</span>
                        جدول نسب إنجاز المعايير
                    </h4>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: '0.95rem'
                        }}>
                            <thead>
                                <tr style={{
                                    backgroundColor: '#0eacb8',
                                    color: 'white'
                                }}>
                                    <th style={{
                                        padding: '15px 12px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        width: '80px',
                                        borderRight: '1px solid rgba(255,255,255,0.2)'
                                    }}>
                                        #
                                    </th>
                                    <th style={{
                                        padding: '15px 12px',
                                        textAlign: 'right',
                                        fontWeight: 'bold',
                                        borderRight: '1px solid rgba(255,255,255,0.2)'
                                    }}>
                                        اسم المعيار
                                    </th>
                                    <th style={{
                                        padding: '15px 12px',
                                        textAlign: 'center',
                                        fontWeight: 'bold',
                                        width: '150px'
                                    }}>
                                        نسبة الإنجاز
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {standardFields.map((field, index) => {
                                    const chartData = prepareStandardsBarChart();
                                    const progress = chartData[index]?.['نسبة الإنجاز'] || 0;

                                    // Determine color based on progress
                                    let progressColor = '#dc3545'; // Red for 0%
                                    if (progress === 100) {
                                        progressColor = '#28a745'; // Green for 100%
                                    } else if (progress >= 75) {
                                        progressColor = '#17a2b8'; // Blue for 75-99%
                                    } else if (progress >= 50) {
                                        progressColor = '#ffc107'; // Yellow for 50-74%
                                    } else if (progress > 0) {
                                        progressColor = '#fd7e14'; // Orange for 1-49%
                                    }

                                    return (
                                        <tr key={field.name} style={{
                                            borderBottom: '1px solid #e0e0e0',
                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa',
                                            transition: 'background-color 0.2s'
                                        }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e3f2fd'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? 'white' : '#f8f9fa'}
                                        >
                                            <td style={{
                                                padding: '12px',
                                                textAlign: 'center',
                                                fontWeight: 'bold',
                                                fontSize: '1.1rem',
                                                color: '#0eacb8'
                                            }}>
                                                {index + 1}
                                            </td>
                                            <td style={{
                                                padding: '12px',
                                                textAlign: 'right',
                                                fontWeight: '500'
                                            }}>
                                                {field.label}
                                            </td>
                                            <td style={{
                                                padding: '12px',
                                                textAlign: 'center'
                                            }}>
                                                <span style={{
                                                    display: 'inline-block',
                                                    padding: '6px 16px',
                                                    borderRadius: '20px',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    backgroundColor: progressColor,
                                                    color: 'white',
                                                    minWidth: '70px'
                                                }}>
                                                    {progress}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Text Fields - Only show in monthly view */}
            {
                comparisonType === 'monthly' && textFields.obstacles && (
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
                                {textFields.obstacles}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                comparisonType === 'monthly' && textFields.developmentProposals && (
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
                                {textFields.developmentProposals}
                            </div>
                        </div>
                    </div>
                )
            }

            {
                comparisonType === 'monthly' && textFields.additionalActivities && (
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
                                <span style={{ fontSize: '1.5rem' }}>✨</span>
                                <h3 style={{
                                    margin: 0,
                                    color: '#0c5460',
                                    fontSize: '1.3rem',
                                    fontWeight: 'bold'
                                }}>
                                    الأنشطة الإضافية - {(() => {
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
                                {textFields.additionalActivities}
                            </div>
                        </div>
                    </div>
                )
            }

            {/* All Year Summary - Show all text fields from the entire year */}
            {allYearTextFields.length > 0 && (
                <div style={{ marginTop: '40px' }}>
                    <h3 style={{
                        marginBottom: '25px',
                        color: 'var(--primary-color)',
                        fontSize: '1.8rem',
                        fontWeight: 'bold',
                        borderBottom: '3px solid var(--primary-color)',
                        paddingBottom: '10px'
                    }}>
                        📋 ملخص السنة المالية {targetYear - 1} - {targetYear}
                    </h3>

                    {allYearTextFields.map((monthData, index) => (
                        <details
                            key={monthData.date}
                            style={{ marginBottom: '20px' }}
                            open={index === 0}
                        >
                            <summary style={{
                                cursor: 'pointer',
                                padding: '15px 20px',
                                backgroundColor: 'var(--primary-color)',
                                color: 'white',
                                borderRadius: '10px',
                                fontWeight: 'bold',
                                fontSize: '1.1rem',
                                listStyle: 'none',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                transition: 'all 0.3s',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                            }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = '#0a8491';
                                    e.currentTarget.style.transform = 'translateX(-5px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = 'var(--primary-color)';
                                    e.currentTarget.style.transform = 'translateX(0)';
                                }}
                            >
                                <span style={{ fontSize: '1.3rem' }}>📅</span>
                                {monthData.monthName} {monthData.year}
                            </summary>

                            <div style={{
                                padding: '20px',
                                backgroundColor: 'var(--card-bg)',
                                border: '2px solid var(--border-color)',
                                borderTop: 'none',
                                borderRadius: '0 0 10px 10px',
                                marginTop: '-5px'
                            }}>
                                {monthData.obstacles && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '10px',
                                            paddingBottom: '8px',
                                            borderBottom: '2px solid #ffc107'
                                        }}>
                                            <span style={{ fontSize: '1.3rem' }}>⚠️</span>
                                            <h4 style={{
                                                margin: 0,
                                                color: '#856404',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                المعوقات
                                            </h4>
                                        </div>
                                        <div style={{
                                            backgroundColor: '#fff8e1',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.7',
                                            color: '#5a4a00',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            border: '1px solid #ffe082'
                                        }}>
                                            {monthData.obstacles}
                                        </div>
                                    </div>
                                )}

                                {monthData.developmentProposals && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '10px',
                                            paddingBottom: '8px',
                                            borderBottom: '2px solid #28a745'
                                        }}>
                                            <span style={{ fontSize: '1.3rem' }}>💡</span>
                                            <h4 style={{
                                                margin: 0,
                                                color: '#155724',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                مقترحات التطوير
                                            </h4>
                                        </div>
                                        <div style={{
                                            backgroundColor: '#e8f5e9',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.7',
                                            color: '#1b5e20',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            border: '1px solid #a5d6a7'
                                        }}>
                                            {monthData.developmentProposals}
                                        </div>
                                    </div>
                                )}

                                {monthData.additionalActivities && (
                                    <div style={{ marginBottom: '20px' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '10px',
                                            paddingBottom: '8px',
                                            borderBottom: '2px solid #17a2b8'
                                        }}>
                                            <span style={{ fontSize: '1.3rem' }}>✨</span>
                                            <h4 style={{
                                                margin: 0,
                                                color: '#0c5460',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                الأنشطة الإضافية
                                            </h4>
                                        </div>
                                        <div style={{
                                            backgroundColor: '#e1f5fe',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.7',
                                            color: '#01579b',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            border: '1px solid #81d4fa'
                                        }}>
                                            {monthData.additionalActivities}
                                        </div>
                                    </div>
                                )}

                                {monthData.notes && (
                                    <div style={{ marginBottom: '0' }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '10px',
                                            paddingBottom: '8px',
                                            borderBottom: '2px solid #6c757d'
                                        }}>
                                            <span style={{ fontSize: '1.3rem' }}>📝</span>
                                            <h4 style={{
                                                margin: 0,
                                                color: '#495057',
                                                fontSize: '1.1rem',
                                                fontWeight: 'bold'
                                            }}>
                                                ملاحظات
                                            </h4>
                                        </div>
                                        <div style={{
                                            backgroundColor: '#f8f9fa',
                                            padding: '15px',
                                            borderRadius: '8px',
                                            fontSize: '0.95rem',
                                            lineHeight: '1.7',
                                            color: '#212529',
                                            whiteSpace: 'pre-wrap',
                                            wordBreak: 'break-word',
                                            border: '1px solid #dee2e6'
                                        }}>
                                            {monthData.notes}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </details>
                    ))}
                </div>
            )}
        </div >
    );
}
