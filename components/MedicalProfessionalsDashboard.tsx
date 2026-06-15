'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface MedicalProfessionalByCategory {
    id?: string;
    month: string;
    branch: string;
    doctors: number;
    dentists: number;
    pharmacists: number;
    physiotherapy: number;
    veterinarians: number;
    seniorNursing: number;
    technicalNursing: number;
    healthTechnician: number;
    scientists: number;
    total: number;
    year: number;
}

interface MedicalProfessionalByGovernorate {
    id?: string;
    month: string;
    governorate: string;
    doctors: number;
    dentists: number;
    pharmacists: number;
    physiotherapy: number;
    veterinarians: number;
    seniorNursing: number;
    technicalNursing: number;
    healthTechnician: number;
    scientists: number;
    total: number;
    year: number;
}

interface TotalMedicalProfessionalByCategory {
    id?: string;
    month: string;
    branch: string;
    doctors: number;
    dentists: number;
    pharmacists: number;
    physiotherapy: number;
    veterinarians: number;
    seniorNursing: number;
    technicalNursing: number;
    healthTechnician: number;
    scientists: number;
    total: number;
    year: number;
}

interface TotalMedicalProfessionalByGovernorate {
    id?: string;
    month: string;
    governorate: string;
    doctors: number;
    dentists: number;
    pharmacists: number;
    physiotherapy: number;
    veterinarians: number;
    seniorNursing: number;
    technicalNursing: number;
    healthTechnician: number;
    scientists: number;
    total: number;
    year: number;
}

interface MedicalProfessionalsDashboardProps {
    submissions: Array<Record<string, any>>;
    medProfsByCategory?: MedicalProfessionalByCategory[];
    medProfsByGovernorate?: MedicalProfessionalByGovernorate[];
    totalMedProfsByCategory?: TotalMedicalProfessionalByCategory[];
    totalMedProfsByGovernorate?: TotalMedicalProfessionalByGovernorate[];
    globalFilterMonth?: string;
}

export default function MedicalProfessionalsDashboard({
    submissions,
    medProfsByCategory = [],
    medProfsByGovernorate = [],
    totalMedProfsByCategory = [],
    totalMedProfsByGovernorate = [],
    globalFilterMonth
}: MedicalProfessionalsDashboardProps) {
    const getInitialMonth = () => {
        if (globalFilterMonth) {
            return parseInt(globalFilterMonth.split('-')[1]);
        }
        return 10;
    };

    const getInitialYear = () => {
        if (globalFilterMonth) {
            const [year, month] = globalFilterMonth.split('-').map(Number);
            return month >= 7 ? year + 1 : year;
        }
        return 2025;
    };

    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(getInitialYear());
    const [selectedMonth, setSelectedMonth] = useState<number>(getInitialMonth());
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [visibleMetrics, setVisibleMetrics] = useState<{
        members: boolean;
        facilities: boolean;
    }>({
        members: true,
        facilities: true
    });

    const [activeCategoryView, setActiveCategoryView] = useState<'monthly' | 'total'>('monthly');
    const [activeGovernorateView, setActiveGovernorateView] = useState<'monthly' | 'total'>('monthly');


    // Update state when globalFilterMonth changes
    useEffect(() => {
        if (globalFilterMonth) {
            const [year, month] = globalFilterMonth.split('-').map(Number);
            setSelectedMonth(month);
            setTargetYear(month >= 7 ? year + 1 : year);
            setComparisonType('monthly');
        }
    }, [globalFilterMonth]);

    const getFiscalYear = useCallback((dateStr: string): number => {
        const year = parseInt(dateStr.split('-')[0]);
        const month = parseInt(dateStr.split('-')[1]);
        return month >= 7 ? year + 1 : year;
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

    const filterByYear = useCallback((fiscalYear: number) => {
        return submissions.filter(sub => sub.date && getFiscalYear(sub.date) === fiscalYear);
    }, [submissions, getFiscalYear]);

    const aggregateData = useCallback((data: Array<Record<string, any>>, type: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly') => {
        const aggregated: Record<string, {
            registeredMembers: number;
            updatedMembers: number;
            facilitiesRegistered: number;
            facilitiesUpdated: number;
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
                    registeredMembers: 0,
                    updatedMembers: 0,
                    facilitiesRegistered: 0,
                    facilitiesUpdated: 0,
                    count: 0
                };
            }

            aggregated[periodKey].registeredMembers += parseFloat(sub.registeredMembers) || 0;
            aggregated[periodKey].updatedMembers += parseFloat(sub.updatedMembers) || 0;
            aggregated[periodKey].facilitiesRegistered += parseFloat(sub.facilitiesRegistered) || 0;
            aggregated[periodKey].facilitiesUpdated += parseFloat(sub.facilitiesUpdated) || 0;
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

    // Calculate totals
    const currentTotalMembers = useMemo(() => calculateFilteredTotal(currentAggregated, 'registeredMembers', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalMembers = useMemo(() => calculateFilteredTotal(previousAggregated, 'registeredMembers', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const membersChange = useMemo(() => calculateChange(currentTotalMembers, previousTotalMembers), [calculateChange, currentTotalMembers, previousTotalMembers]);

    const currentTotalUpdatedMembers = useMemo(() => calculateFilteredTotal(currentAggregated, 'updatedMembers', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalUpdatedMembers = useMemo(() => calculateFilteredTotal(previousAggregated, 'updatedMembers', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const updatedMembersChange = useMemo(() => calculateChange(currentTotalUpdatedMembers, previousTotalUpdatedMembers), [calculateChange, currentTotalUpdatedMembers, previousTotalUpdatedMembers]);

    const currentTotalRegisteredFacilities = useMemo(() => calculateFilteredTotal(currentAggregated, 'facilitiesRegistered', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalRegisteredFacilities = useMemo(() => calculateFilteredTotal(previousAggregated, 'facilitiesRegistered', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const registeredFacilitiesChange = useMemo(() => calculateChange(currentTotalRegisteredFacilities, previousTotalRegisteredFacilities), [calculateChange, currentTotalRegisteredFacilities, previousTotalRegisteredFacilities]);

    const currentTotalUpdatedFacilities = useMemo(() => calculateFilteredTotal(currentAggregated, 'facilitiesUpdated', comparisonType), [calculateFilteredTotal, currentAggregated, comparisonType]);
    const previousTotalUpdatedFacilities = useMemo(() => calculateFilteredTotal(previousAggregated, 'facilitiesUpdated', comparisonType), [calculateFilteredTotal, previousAggregated, comparisonType]);
    const updatedFacilitiesChange = useMemo(() => calculateChange(currentTotalUpdatedFacilities, previousTotalUpdatedFacilities), [calculateChange, currentTotalUpdatedFacilities, previousTotalUpdatedFacilities]);


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

    const getSelectedPeriodLabel = useCallback((fiscalYear = targetYear): string => {
        const yearRange = `${fiscalYear - 1} - ${fiscalYear}`;
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        if (comparisonType === 'monthly') return `${monthNames[selectedMonth - 1]} (${yearRange})`;
        if (comparisonType === 'quarterly') return `الربع ${selectedQuarter} (${yearRange})`;
        if (comparisonType === 'halfYearly') return `النصف ${selectedHalf} (${yearRange})`;
        return `السنة المالية ${yearRange}`;
    }, [comparisonType, selectedHalf, selectedMonth, selectedQuarter, targetYear]);

    const isDateInSelectedPeriod = useCallback((date: string): boolean => {
        if (!date || getFiscalYear(date) !== targetYear) return false;

        const month = getMonth(date);
        if (comparisonType === 'monthly') return month === selectedMonth;
        if (comparisonType === 'quarterly') return getQuarter(month) === selectedQuarter;
        if (comparisonType === 'halfYearly') return getHalf(month) === selectedHalf;
        return true;
    }, [comparisonType, getFiscalYear, getHalf, getMonth, getQuarter, selectedHalf, selectedMonth, selectedQuarter, targetYear]);

    const getNarrativeForSelectedPeriod = useCallback((field: 'obstacles' | 'developmentProposals' | 'additionalActivities' | 'notes'): string => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        return currentYearData
            .filter(sub => sub.date && isDateInSelectedPeriod(sub.date) && typeof sub[field] === 'string' && sub[field].trim())
            .sort((a, b) => a.date.localeCompare(b.date))
            .map(sub => {
                const value = sub[field].trim();
                return comparisonType === 'monthly'
                    ? value
                    : `${monthNames[getMonth(sub.date) - 1]}:\n${value}`;
            })
            .join('\n\n');
    }, [comparisonType, currentYearData, getMonth, isDateInSelectedPeriod]);

    const currentObstacles = getNarrativeForSelectedPeriod('obstacles');
    const currentDevelopmentProposals = getNarrativeForSelectedPeriod('developmentProposals');
    const currentAdditionalActivities = getNarrativeForSelectedPeriod('additionalActivities');
    const currentNotes = getNarrativeForSelectedPeriod('notes');

    const preparePieData = useCallback((metric: 'registeredMembers' | 'updatedMembers' | 'facilitiesRegistered' | 'facilitiesUpdated') => {
        if (comparisonType === 'yearly' || comparisonType === 'monthly') {
            let currentVal = 0;
            let previousVal = 0;

            switch (metric) {
                case 'registeredMembers':
                    currentVal = currentTotalMembers;
                    previousVal = previousTotalMembers;
                    break;
                case 'updatedMembers':
                    currentVal = currentTotalUpdatedMembers;
                    previousVal = previousTotalUpdatedMembers;
                    break;
                case 'facilitiesRegistered':
                    currentVal = currentTotalRegisteredFacilities;
                    previousVal = previousTotalRegisteredFacilities;
                    break;
                case 'facilitiesUpdated':
                    currentVal = currentTotalUpdatedFacilities;
                    previousVal = previousTotalUpdatedFacilities;
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
    }, [comparisonType, currentTotalMembers, previousTotalMembers, currentTotalUpdatedMembers, previousTotalUpdatedMembers, currentTotalRegisteredFacilities, previousTotalRegisteredFacilities, currentTotalUpdatedFacilities, previousTotalUpdatedFacilities, targetYear, selectedQuarter, selectedHalf, currentYearData, previousYearData, aggregateData, formatPeriodLabel]);

    const membersPieData = useMemo(() => preparePieData('registeredMembers'), [preparePieData]);
    const updatedMembersPieData = useMemo(() => preparePieData('updatedMembers'), [preparePieData]);
    const registeredFacilitiesPieData = useMemo(() => preparePieData('facilitiesRegistered'), [preparePieData]);
    const updatedFacilitiesPieData = useMemo(() => preparePieData('facilitiesUpdated'), [preparePieData]);

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
                [`أعضاء مسجلين ${targetYear - 1} - ${targetYear}`]: currentAggregated[period]?.registeredMembers || 0,
                [`أعضاء مسجلين ${targetYear - 2} - ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.registeredMembers || 0,
                [`أعضاء محدثين ${targetYear - 1} - ${targetYear}`]: currentAggregated[period]?.updatedMembers || 0,
                [`أعضاء محدثين ${targetYear - 2} - ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.updatedMembers || 0,
                [`منشآت مسجلة ${targetYear - 1} - ${targetYear}`]: currentAggregated[period]?.facilitiesRegistered || 0,
                [`منشآت مسجلة ${targetYear - 2} - ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.facilitiesRegistered || 0,
                [`منشآت محدثة ${targetYear - 1} - ${targetYear}`]: currentAggregated[period]?.facilitiesUpdated || 0,
                [`منشآت محدثة ${targetYear - 2} - ${targetYear - 1}`]: previousAggregated[previousPeriodKey]?.facilitiesUpdated || 0,
            };
        });
    }, [currentAggregated, previousAggregated, comparisonType, selectedMonth, selectedQuarter, selectedHalf, targetYear, formatPeriodLabel]);

    const chartData = useMemo(() => prepareChartData(), [prepareChartData]);

    function renderTableRows() {
        let periods = Object.keys(currentAggregated).sort();

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
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
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
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.registeredMembers || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.registeredMembers || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.updatedMembers || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.updatedMembers || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.facilitiesRegistered || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.facilitiesRegistered || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{currentData?.facilitiesUpdated || 0}</td>
                    <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>{previousData?.facilitiesUpdated || 0}</td>
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
                    الإدارة العامة لتسجيل أعضاء المهن الطبية - تحليلات ومقارنات
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
                    title="عدد أعضاء المهن الطبية المسجلين خلال الفترة"
                    icon="👨‍⚕️"
                    currentValue={currentTotalMembers}
                    previousValue={previousTotalMembers}
                    changePercentage={membersChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={membersPieData}
                    color="#0eacb8"
                />
                <KPICard
                    title="عدد أعضاء المهن الطبية المحدث بياناتهم"
                    icon="🔄"
                    currentValue={currentTotalUpdatedMembers}
                    previousValue={previousTotalUpdatedMembers}
                    changePercentage={updatedMembersChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={updatedMembersPieData}
                    color="#f4a261"
                />
                <KPICard
                    title="عدد المنشآت التي تم تسجيل أعضاء المهن الطبية بها"
                    icon="🏢"
                    currentValue={currentTotalRegisteredFacilities}
                    previousValue={previousTotalRegisteredFacilities}
                    changePercentage={registeredFacilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={registeredFacilitiesPieData}
                    color="#2a9d8f"
                />
                <KPICard
                    title="عدد المنشآت التي تم تحديث أعضاء المهن الطبية بها"
                    icon="🏥"
                    currentValue={currentTotalUpdatedFacilities}
                    previousValue={previousTotalUpdatedFacilities}
                    changePercentage={updatedFacilitiesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={updatedFacilitiesPieData}
                    color="#8884d8"
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
                        <h4 style={{ margin: 0, color: 'var(--text-color)' }}>مقارنة الأعضاء المسجلين - رسم بياني عمودي</h4>
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
                            <Bar dataKey={`أعضاء مسجلين ${targetYear - 1} - ${targetYear}`} fill="#0eacb8">
                                <LabelList
                                    dataKey={`أعضاء مسجلين ${targetYear - 1} - ${targetYear}`}
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#0eacb8', fontSize: '14px' }}
                                />
                            </Bar>
                            <Bar dataKey={`أعضاء مسجلين ${targetYear - 2} - ${targetYear - 1}`} fill="#a8e6cf">
                                <LabelList
                                    dataKey={`أعضاء مسجلين ${targetYear - 2} - ${targetYear - 1}`}
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#666', fontSize: '14px' }}
                                />
                            </Bar>
                            <Bar dataKey={`أعضاء محدثين ${targetYear - 1} - ${targetYear}`} fill="#f4a261">
                                <LabelList
                                    dataKey={`أعضاء محدثين ${targetYear - 1} - ${targetYear}`}
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#f4a261', fontSize: '14px' }}
                                />
                            </Bar>
                            <Bar dataKey={`أعضاء محدثين ${targetYear - 2} - ${targetYear - 1}`} fill="#fbd29d">
                                <LabelList
                                    dataKey={`أعضاء محدثين ${targetYear - 2} - ${targetYear - 1}`}
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#666', fontSize: '14px' }}
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
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', width: '30%' }}>المؤشر</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{getSelectedPeriodLabel(targetYear)}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>{getSelectedPeriodLabel(targetYear - 1)}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', backgroundColor: 'rgba(0,0,0,0.1)' }}>التغيير</th>
                            </tr>
                        </thead>
                        <tbody>
                            {/* أعضاء مسجلين */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    👨‍⚕️ عدد أعضاء المهن الطبية المسجلين خلال الفترة
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#0eacb8' }}>
                                    {currentTotalMembers.toLocaleString('en-US')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalMembers.toLocaleString('en-US')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: membersChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {membersChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(membersChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* أعضاء محدثين */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    🔄 عدد أعضاء المهن الطبية المحدث بياناتهم
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#f4a261' }}>
                                    {currentTotalUpdatedMembers.toLocaleString('en-US')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalUpdatedMembers.toLocaleString('en-US')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: updatedMembersChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {updatedMembersChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(updatedMembersChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* منشآت تم تسجيل أعضاء المهن بها */}
                            <tr style={{ borderBottom: '1px solid #eee' }}>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    🏢 عدد المنشآت التي تم تسجيل أعضاء المهن الطبية بها
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#2a9d8f' }}>
                                    {currentTotalRegisteredFacilities.toLocaleString('en-US')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalRegisteredFacilities.toLocaleString('en-US')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: registeredFacilitiesChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {registeredFacilitiesChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(registeredFacilitiesChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>

                            {/* منشآت تم تحديث أعضاء المهن بها */}
                            <tr>
                                <td style={{ padding: '15px', fontWeight: 'bold', backgroundColor: 'var(--background-color)' }}>
                                    🏥 عدد المنشآت التي تم تحديث أعضاء المهن الطبية بها
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', fontWeight: '600', fontSize: '1.1rem', color: '#8884d8' }}>
                                    {currentTotalUpdatedFacilities.toLocaleString('en-US')}
                                </td>
                                <td style={{ padding: '15px', textAlign: 'center', color: '#999' }}>
                                    {previousTotalUpdatedFacilities.toLocaleString('en-US')}
                                </td>
                                <td style={{
                                    padding: '15px',
                                    textAlign: 'center',
                                    fontWeight: 'bold',
                                    backgroundColor: 'rgba(0,0,0,0.02)'
                                }}>
                                    <span style={{
                                        color: updatedFacilitiesChange >= 0 ? '#28a745' : '#dc3545',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px'
                                    }}>
                                        {updatedFacilitiesChange >= 0 ? '⬆' : '⬇'}
                                        {Math.abs(updatedFacilitiesChange).toFixed(1)}%
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* قسم أعضاء المهن الطبية المسجلين (طبقا للفئة) - رسم بياني تفاعلي */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '15px',
                    padding: '15px',
                    border: '2px solid #006666',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{
                            margin: 0,
                            color: 'var(--text-color)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '1.4rem'
                        }}>
                            <span style={{ fontSize: '1.8rem' }}>📊</span>
                            {activeCategoryView === 'monthly'
                                ? `أعضاء المهن الطبية المسجلين (طبقا للفئة) - ${getSelectedPeriodLabel()}`
                                : 'الإجمالي الكلي لأعضاء المهن الطبية المسجلين (طبقا للفئة) - محافظات مرحلة أولى'}
                        </h3>

                        {/* أزرار التنقل - نمط كبسولة */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#f0f2f5',
                            padding: '5px',
                            borderRadius: '50px',
                            gap: '5px'
                        }}>
                            <button
                                onClick={() => setActiveCategoryView('monthly')}
                                style={{
                                    padding: '10px 25px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: activeCategoryView === 'monthly' ? '#006666' : 'transparent',
                                    color: activeCategoryView === 'monthly' ? 'white' : '#555',
                                    boxShadow: activeCategoryView === 'monthly' ? '0 4px 8px rgba(0,102,102,0.3)' : 'none'
                                }}
                            >
                                بيانات الفترة
                            </button>
                            <button
                                onClick={() => setActiveCategoryView('total')}
                                style={{
                                    padding: '10px 25px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: activeCategoryView === 'total' ? '#006666' : 'transparent',
                                    color: activeCategoryView === 'total' ? 'white' : '#555',
                                    boxShadow: activeCategoryView === 'total' ? '0 4px 8px rgba(0,102,102,0.3)' : 'none'
                                }}
                            >
                                الإجمالي الكلي
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '340px', width: '100%', position: 'relative' }}>
                        {/* مربع الإجمالي العائم */}
                        <div style={{
                            position: 'absolute',
                            top: '10px',
                            right: '30px',
                            backgroundColor: 'rgba(0, 102, 102, 0.05)',
                            border: '1px solid #006666',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '120px'
                        }}>
                            <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold', marginBottom: '4px' }}>
                                {activeCategoryView === 'monthly' ? 'محافظات مرحلة أولى' : 'الإجمالي الكلي'}
                            </span>
                            <span style={{ fontSize: '1.2rem', color: '#006666', fontWeight: '900' }}>
                                {(() => {
                                    const sourceData = activeCategoryView === 'monthly' ? medProfsByCategory : totalMedProfsByCategory;
                                    const filteredData = sourceData.filter(item => {
                                        if (activeCategoryView === 'monthly' && item.branch === 'رئاسة الهيئة') return false;
                                        if (!item.month) return false;
                                        const month = parseInt(item.month.split('-')[1]);
                                        const year = parseInt(item.month.split('-')[0]);
                                        const fiscalYear = month >= 7 ? year + 1 : year;
                                        if (comparisonType === 'monthly') {
                                            return fiscalYear === targetYear && month === selectedMonth;
                                        } else if (comparisonType === 'quarterly') {
                                            const quarter = month >= 7 && month <= 9 ? 1 : month >= 10 && month <= 12 ? 2 : month >= 1 && month <= 3 ? 3 : 4;
                                            return fiscalYear === targetYear && quarter === selectedQuarter;
                                        } else if (comparisonType === 'halfYearly') {
                                            const half = month >= 7 ? 1 : 2;
                                            return fiscalYear === targetYear && half === selectedHalf;
                                        }
                                        return fiscalYear === targetYear;
                                    });
                                    return filteredData.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString('en-US');
                                })()}
                            </span>
                        </div>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={(() => {
                                    const sourceData = activeCategoryView === 'monthly' ? medProfsByCategory : totalMedProfsByCategory;
                                    const filteredData = sourceData.filter(item => {
                                        if (activeCategoryView === 'monthly' && item.branch === 'رئاسة الهيئة') return false;
                                        if (!item.month) return false;
                                        const month = parseInt(item.month.split('-')[1]);
                                        const year = parseInt(item.month.split('-')[0]);
                                        const fiscalYear = month >= 7 ? year + 1 : year;
                                        if (comparisonType === 'monthly') {
                                            return fiscalYear === targetYear && month === selectedMonth;
                                        } else if (comparisonType === 'quarterly') {
                                            const quarter = month >= 7 && month <= 9 ? 1 : month >= 10 && month <= 12 ? 2 : month >= 1 && month <= 3 ? 3 : 4;
                                            return fiscalYear === targetYear && quarter === selectedQuarter;
                                        } else if (comparisonType === 'halfYearly') {
                                            const half = month >= 7 ? 1 : 2;
                                            return fiscalYear === targetYear && half === selectedHalf;
                                        }
                                        return fiscalYear === targetYear;
                                    });

                                    const categories = [
                                        { key: 'doctors', name: 'أطباء بشريين', color: '#e63946' },
                                        { key: 'dentists', name: 'أطباء أسنان', color: '#2a9d8f' },
                                        { key: 'pharmacists', name: 'صيادلة', color: '#f4a261' },
                                        { key: 'physiotherapy', name: 'علاج طبيعي', color: '#264653' },
                                        { key: 'veterinarians', name: 'بيطريين', color: '#e9c46a' },
                                        { key: 'seniorNursing', name: 'تمريض عالي', color: '#457b9d' },
                                        { key: 'technicalNursing', name: 'فني تمريض', color: '#1d3557' },
                                        { key: 'healthTechnician', name: 'فني صحي', color: '#8d99ae' },
                                        { key: 'scientists', name: 'علميين', color: '#bc4749' }
                                    ];

                                    const chartData = categories.map(cat => ({
                                        name: cat.name,
                                        value: filteredData.reduce((sum, item) => sum + (item[cat.key as keyof MedicalProfessionalByCategory] as number || 0), 0),
                                        color: cat.color
                                    })).sort((a, b) => b.value - a.value);

                                    return chartData;
                                })()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    tick={{ fill: '#666', fontSize: 11, fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis hide={true} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        textAlign: 'right'
                                    }}
                                    formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('en-US') : value, 'العدد']}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                    {(() => {
                                        const sourceData = activeCategoryView === 'monthly' ? medProfsByCategory : totalMedProfsByCategory;
                                        const filteredData = sourceData.filter(item => {
                                            if (activeCategoryView === 'monthly' && item.branch === 'رئاسة الهيئة') return false;
                                            if (!item.month) return false;
                                            const month = parseInt(item.month.split('-')[1]);
                                            const year = parseInt(item.month.split('-')[0]);
                                            const fiscalYear = month >= 7 ? year + 1 : year;
                                            if (comparisonType === 'monthly') {
                                                return fiscalYear === targetYear && month === selectedMonth;
                                            } else if (comparisonType === 'quarterly') {
                                                const quarter = month >= 7 && month <= 9 ? 1 : month >= 10 && month <= 12 ? 2 : month >= 1 && month <= 3 ? 3 : 4;
                                                return fiscalYear === targetYear && quarter === selectedQuarter;
                                            } else if (comparisonType === 'halfYearly') {
                                                const half = month >= 7 ? 1 : 2;
                                                return fiscalYear === targetYear && half === selectedHalf;
                                            }
                                            return fiscalYear === targetYear;
                                        });

                                        const categories = [
                                            { key: 'doctors', name: 'أطباء بشريين', color: '#e63946' },
                                            { key: 'dentists', name: 'أطباء أسنان', color: '#2a9d8f' },
                                            { key: 'pharmacists', name: 'صيادلة', color: '#f4a261' },
                                            { key: 'physiotherapy', name: 'علاج طبيعي', color: '#264653' },
                                            { key: 'veterinarians', name: 'بيطريين', color: '#e9c46a' },
                                            { key: 'seniorNursing', name: 'تمريض عالي', color: '#457b9d' },
                                            { key: 'technicalNursing', name: 'فني تمريض', color: '#1d3557' },
                                            { key: 'healthTechnician', name: 'فني صحي', color: '#8d99ae' },
                                            { key: 'scientists', name: 'علميين', color: '#bc4749' }
                                        ];

                                        const finalData = categories.map(cat => ({
                                            name: cat.name,
                                            value: filteredData.reduce((sum, item) => sum + (item[cat.key as keyof MedicalProfessionalByCategory] as number || 0), 0),
                                            color: cat.color
                                        })).sort((a, b) => b.value - a.value);

                                        return finalData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ));
                                    })()}
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        formatter={(val: any) => typeof val === 'number' ? val.toLocaleString('en-US') : val}
                                        style={{ fill: '#333', fontSize: 13, fontWeight: 'bold' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* قسم إجمالي أعضاء المهن الطبية المسجلين بالمحافظات - رسم بياني تفاعلي */}
            <div style={{ marginBottom: '30px' }}>
                <div style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '15px',
                    padding: '15px',
                    border: '2px solid #006666',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '20px',
                        marginBottom: '30px'
                    }}>
                        <h3 style={{ margin: 0, color: 'var(--text-color)', display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem' }}>
                            <span style={{ fontSize: '1.8rem' }}>🗺️</span>
                            {activeGovernorateView === 'monthly'
                                ? `إجمالي أعضاء المهن الطبية المسجلين بالمحافظات - ${getSelectedPeriodLabel()}`
                                : 'الإجمالي الكلي لأعضاء المهن الطبية المسجلين بالمحافظات'}
                        </h3>

                        {/* أزرار التنقل - نمط الكبسولة */}
                        <div style={{
                            display: 'flex',
                            backgroundColor: '#f0f4f4',
                            padding: '5px',
                            borderRadius: '50px',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <button
                                onClick={() => setActiveGovernorateView('monthly')}
                                style={{
                                    padding: '10px 25px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: activeGovernorateView === 'monthly' ? '#006666' : 'transparent',
                                    color: activeGovernorateView === 'monthly' ? 'white' : '#555',
                                    boxShadow: activeGovernorateView === 'monthly' ? '0 4px 8px rgba(0,102,102,0.3)' : 'none'
                                }}
                            >
                                بيانات الفترة
                            </button>
                            <button
                                onClick={() => setActiveGovernorateView('total')}
                                style={{
                                    padding: '10px 25px',
                                    borderRadius: '50px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '0.95rem',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease',
                                    backgroundColor: activeGovernorateView === 'total' ? '#006666' : 'transparent',
                                    color: activeGovernorateView === 'total' ? 'white' : '#555',
                                    boxShadow: activeGovernorateView === 'total' ? '0 4px 8px rgba(0,102,102,0.3)' : 'none'
                                }}
                            >
                                الإجمالي الكلي
                            </button>
                        </div>
                    </div>

                    <div style={{ height: '340px', width: '100%', position: 'relative' }}>
                        {/* مربع الملخص العائم */}
                        <div style={{
                            position: 'absolute',
                            top: '0px',
                            right: '30px',
                            backgroundColor: 'rgba(0, 102, 102, 0.05)',
                            border: '1px solid #006666',
                            borderRadius: '8px',
                            padding: '10px 15px',
                            zIndex: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            minWidth: '120px'
                        }}>
                            <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 'bold', marginBottom: '4px' }}>
                                {activeGovernorateView === 'monthly' ? 'بيانات الفترة' : 'الإجمالي الكلي'}
                            </span>
                            <span style={{ fontSize: '1.2rem', color: '#006666', fontWeight: '900' }}>
                                {(() => {
                                    const sourceData = activeGovernorateView === 'monthly' ? medProfsByGovernorate : totalMedProfsByGovernorate;
                                    const filteredData = sourceData.filter(item => {
                                        if (!item.month) return false;
                                        const month = parseInt(item.month.split('-')[1]);
                                        const year = parseInt(item.month.split('-')[0]);
                                        const fiscalYear = month >= 7 ? year + 1 : year;
                                        if (comparisonType === 'monthly') {
                                            return fiscalYear === targetYear && month === selectedMonth;
                                        } else if (comparisonType === 'quarterly') {
                                            const quarter = month >= 7 && month <= 9 ? 1 : month >= 10 && month <= 12 ? 2 : month >= 1 && month <= 3 ? 3 : 4;
                                            return fiscalYear === targetYear && quarter === selectedQuarter;
                                        } else if (comparisonType === 'halfYearly') {
                                            const half = month >= 7 ? 1 : 2;
                                            return fiscalYear === targetYear && half === selectedHalf;
                                        }
                                        return fiscalYear === targetYear;
                                    });
                                    return filteredData.reduce((sum, item) => sum + (item.total || 0), 0).toLocaleString('en-US');
                                })()}
                            </span>
                        </div>

                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={(() => {
                                    const sourceData = activeGovernorateView === 'monthly' ? medProfsByGovernorate : totalMedProfsByGovernorate;
                                    const filteredData = sourceData.filter(item => {
                                        if (!item.month) return false;
                                        const month = parseInt(item.month.split('-')[1]);
                                        const year = parseInt(item.month.split('-')[0]);
                                        const fiscalYear = month >= 7 ? year + 1 : year;
                                        if (comparisonType === 'monthly') {
                                            return fiscalYear === targetYear && month === selectedMonth;
                                        } else if (comparisonType === 'quarterly') {
                                            const quarter = month >= 7 && month <= 9 ? 1 : month >= 10 && month <= 12 ? 2 : month >= 1 && month <= 3 ? 3 : 4;
                                            return fiscalYear === targetYear && quarter === selectedQuarter;
                                        } else if (comparisonType === 'halfYearly') {
                                            const half = month >= 7 ? 1 : 2;
                                            return fiscalYear === targetYear && half === selectedHalf;
                                        }
                                        return fiscalYear === targetYear;
                                    });

                                    // تجميع البيانات حسب المحافظة
                                    const govGroups: Record<string, number> = {};
                                    filteredData.forEach(item => {
                                        const govName = item.governorate === 'شمال سيناء' ? 'ش سيناء' :
                                            item.governorate === 'جنوب سيناء' ? 'ج سيناء' :
                                                item.governorate;
                                        govGroups[govName] = (govGroups[govName] || 0) + (item.total || 0);
                                    });

                                    const colors = ['#e63946', '#2a9d8f', '#f4a261', '#264653', '#e9c46a', '#457b9d', '#1d3557', '#8d99ae', '#bc4749'];

                                    return Object.entries(govGroups)
                                        .map(([name, value], index) => ({
                                            name,
                                            value,
                                            color: colors[index % colors.length]
                                        }))
                                        .sort((a, b) => b.value - a.value);
                                })()}
                                margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                                <XAxis
                                    dataKey="name"
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    tick={{ fill: '#666', fontSize: 11, fontWeight: 'bold' }}
                                    dy={10}
                                />
                                <YAxis hide={true} />
                                <Tooltip
                                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                                    contentStyle={{
                                        borderRadius: '8px',
                                        border: 'none',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        textAlign: 'right'
                                    }}
                                    formatter={(value: any) => [typeof value === 'number' ? value.toLocaleString('en-US') : value, 'العدد']}
                                />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={45}>
                                    {(() => {
                                        const sourceData = activeGovernorateView === 'monthly' ? medProfsByGovernorate : totalMedProfsByGovernorate;
                                        const filteredData = sourceData.filter(item => {
                                            if (!item.month) return false;
                                            const month = parseInt(item.month.split('-')[1]);
                                            const year = parseInt(item.month.split('-')[0]);
                                            const fiscalYear = month >= 7 ? year + 1 : year;
                                            if (comparisonType === 'monthly') {
                                                return fiscalYear === targetYear && month === selectedMonth;
                                            } else if (comparisonType === 'quarterly') {
                                                const quarter = month >= 7 && month <= 9 ? 1 : month >= 10 && month <= 12 ? 2 : month >= 1 && month <= 3 ? 3 : 4;
                                                return fiscalYear === targetYear && quarter === selectedQuarter;
                                            } else if (comparisonType === 'halfYearly') {
                                                const half = month >= 7 ? 1 : 2;
                                                return fiscalYear === targetYear && half === selectedHalf;
                                            }
                                            return fiscalYear === targetYear;
                                        });

                                        const govGroups: Record<string, number> = {};
                                        filteredData.forEach(item => {
                                            const govName = item.governorate === 'شمال سيناء' ? 'ش سيناء' :
                                                item.governorate === 'جنوب سيناء' ? 'ج سيناء' :
                                                    item.governorate;
                                            govGroups[govName] = (govGroups[govName] || 0) + (item.total || 0);
                                        });

                                        const colors = ['#e63946', '#2a9d8f', '#f4a261', '#264653', '#e9c46a', '#457b9d', '#1d3557', '#8d99ae', '#bc4749'];

                                        const chartData = Object.entries(govGroups)
                                            .map(([name, value], index) => ({
                                                name,
                                                value,
                                                color: colors[index % colors.length]
                                            }))
                                            .sort((a, b) => b.value - a.value);

                                        return chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ));
                                    })()}
                                    <LabelList
                                        dataKey="value"
                                        position="top"
                                        formatter={(val: any) => typeof val === 'number' ? val.toLocaleString('en-US') : val}
                                        style={{ fill: '#333', fontSize: 13, fontWeight: 'bold' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>



            {currentObstacles && (
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
                                المعوقات - {getSelectedPeriodLabel()}
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

            {currentDevelopmentProposals && (
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
                                مقترحات التطوير - {getSelectedPeriodLabel()}
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

            {currentAdditionalActivities && (
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
                                ملخص التقرير - {getSelectedPeriodLabel()}
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

            {currentNotes && (
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
                                    ملاحظات - {getSelectedPeriodLabel()}
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
                )}
        </div >
    );
}
