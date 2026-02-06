'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';

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
    introductoryVisits?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        visitType: string;
        affiliatedEntity: string;
        facilityType: string;
        month: string;
        year: number;
    }>;
    queuedVisits?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        month: string;
        year: number;
    }>;
    scheduledVisits?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        visitType: string;
        month: string;
        year: number;
    }>;
    accreditedSupportedFacilities?: Array<{
        id?: string;
        facilityName: string;
        governorate: string;
        decisionNumber: string;
        decisionDate: string;
        supportType: string;
        accreditationStatus: string;
        month: string;
        year: number;
    }>;
}

export default function TechnicalSupportDashboard({ submissions, visits = [], remoteSupports = [], introductoryVisits = [], queuedVisits = [], scheduledVisits = [], accreditedSupportedFacilities = [] }: TechnicalSupportDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [selectedMonth, setSelectedMonth] = useState<number>(10); // أكتوبر كقيمة افتراضية
    const [fieldTab, setFieldTab] = useState<'governorate' | 'entity' | 'facilityType'>('governorate');
    const [remoteTab, setRemoteTab] = useState<'governorate' | 'entity' | 'facilityType'>('governorate');
    const [introTab, setIntroTab] = useState<'governorate' | 'entity' | 'facilityType'>('governorate');
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

    // دالة لاختصار الأسماء (الجهات والمحافظات) لتجنب التداخل
    const shortenLabel = (name: string): string => {
        const abbreviations: { [key: string]: string } = {
            'المنشآت الصحية التابعة لهيئة الرعاية الصحية': 'هيئة الرعاية',
            'منشآت تابعة لوزارة الصحة': 'وزارة الصحة',
            'منشآت تابعة لجهات أخرى': 'جهات أخرى',
            'الأمانة العامة لمستشفيات الصحة النفسية': 'الصحة النفسية',
            'الأمانة العامة لمستشفيات الصحة النفسية - وزارة الصحة': 'الصحة النفسية',
            'قطاع خاص': 'قطاع خاص',
            'شمال سيناء': 'ش سيناء',
            'جنوب سيناء': 'ج سيناء'
        };
        return abbreviations[name] || name;
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

    const getNotesForSelectedMonth = (): string => {
        if (comparisonType !== 'monthly') return '';

        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            const month = getMonth(sub.date);
            return month === selectedMonth && getFiscalYear(sub.date) === targetYear;
        });

        return monthData?.notes || '';
    };

    const currentNotes = getNotesForSelectedMonth();

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

            {/* قسم تحليل الزيارات - رسوم بيانية */}
            {comparisonType === 'monthly' && (
                <div style={{ marginTop: '30px', marginBottom: '30px' }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        marginBottom: '25px'
                    }}>
                        <span style={{ fontSize: '1.5rem' }}>📊</span>
                        <h3 style={{
                            margin: 0,
                            color: 'var(--primary-color)',
                            fontSize: '1.4rem',
                            fontWeight: 'bold'
                        }}>
                            تحليل الزيارات - {(() => {
                                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                return monthNames[selectedMonth - 1];
                            })()} {targetYear}
                        </h3>
                    </div>

                    {/* رسم 1: إجمالي أنواع الزيارات */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                        marginBottom: '20px'
                    }}>
                        <h4 style={{
                            margin: '0 0 20px 0',
                            color: 'var(--text-color)',
                            fontSize: '1.1rem',
                            fontWeight: 'bold',
                            textAlign: 'center'
                        }}>
                            🎯 إجمالي أنواع الزيارات
                        </h4>
                        {(() => {
                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                            const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

                            const fieldCount = visits.filter(v => v.month === monthStr).length;
                            const remoteCount = remoteSupports.filter(v => v.month === monthStr).length;
                            const introCount = introductoryVisits.filter(v => v.month === monthStr).length;

                            const visitTypesData = [
                                { name: 'زيارات ميدانية', value: fieldCount, color: '#0d6a79' },
                                { name: 'زيارات عن بعد', value: remoteCount, color: '#28a745' },
                                { name: 'زيارات تمهيدية', value: introCount, color: '#ffc107' }
                            ];

                            const total = visitTypesData.reduce((sum, item) => sum + item.value, 0);

                            if (total === 0) {
                                return (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                        لا توجد زيارات مسجلة لهذا الشهر
                                    </div>
                                );
                            }

                            return (
                                <div>
                                    <ResponsiveContainer width="100%" height={280}>
                                        <BarChart data={visitTypesData} layout="horizontal" margin={{ top: 30, right: 10, left: 10, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                            <XAxis dataKey="name" stroke="var(--text-color)" tick={{ fontSize: 12, dy: 8 }} interval={0} />
                                            <YAxis stroke="var(--text-color)" tick={false} axisLine={false} domain={[0, Math.max(...visitTypesData.map(d => d.value)) + 3]} />
                                            <Tooltip
                                                contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }}
                                                formatter={(value: number) => [`${value} زيارة`, 'العدد']}
                                            />
                                            <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                {visitTypesData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                                <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: 'var(--text-color)', fontSize: '14px' }} />
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '15px', marginTop: '15px' }}>
                                        {visitTypesData.map((item, index) => (
                                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                                <div style={{ width: '14px', height: '14px', backgroundColor: item.color, borderRadius: '4px' }}></div>
                                                <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.name}: {item.value}</span>
                                            </div>
                                        ))}
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'var(--primary-color)', borderRadius: '8px', color: 'white' }}>
                                            <span style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>الإجمالي: {total}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>

                    {/* قسم الزيارات الميدانية - إطار موحد بتبويبات */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '25px',
                        border: '2px solid #0d6a79',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h4 style={{ margin: '0 0 20px 0', color: '#0d6a79', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>
                            🏙️ الزيارات الميدانية
                        </h4>
                        {/* أزرار التبديل */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setFieldTab('governorate')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: fieldTab === 'governorate' ? '#0d6a79' : '#e9ecef',
                                    color: fieldTab === 'governorate' ? 'white' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب المحافظة
                            </button>
                            <button
                                onClick={() => setFieldTab('entity')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: fieldTab === 'entity' ? '#0d6a79' : '#e9ecef',
                                    color: fieldTab === 'entity' ? 'white' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب الجهة التابعة
                            </button>
                            <button
                                onClick={() => setFieldTab('facilityType')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: fieldTab === 'facilityType' ? '#0d6a79' : '#e9ecef',
                                    color: fieldTab === 'facilityType' ? 'white' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب نوع المنشأة
                            </button>
                        </div>
                        {/* الرسم البياني حسب التبويب المختار */}
                        {(() => {
                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                            const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
                            const filtered = visits.filter(v => v.month === monthStr);

                            let counts: { [key: string]: number } = {};
                            if (fieldTab === 'governorate') {
                                filtered.forEach(v => {
                                    const key = (v.governorate || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            } else if (fieldTab === 'entity') {
                                filtered.forEach(v => {
                                    const key = (v.affiliatedEntity || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            } else {
                                filtered.forEach(v => {
                                    const key = (v.facilityType || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            }

                            const colors = ['#0d6a79', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8', '#fd7e14'];
                            const data = Object.entries(counts).map(([name, value], index) => ({
                                name: shortenLabel(name),
                                fullName: name,
                                value,
                                color: colors[index % colors.length]
                            })).sort((a, b) => b.value - a.value);

                            if (data.length === 0) return <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>لا توجد بيانات</div>;

                            return (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={data} layout="horizontal" margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="name" stroke="var(--text-color)" tick={{ fontSize: 10, dy: 5 }} interval={0} height={50} />
                                        <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value: number, name: string, props: any) => [`${value}`, props.payload.fullName]} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                            <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: 'var(--text-color)', fontSize: '12px' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>

                    {/* قسم الزيارات عن بعد - إطار موحد بتبويبات */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '25px',
                        border: '2px solid #28a745',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h4 style={{ margin: '0 0 20px 0', color: '#28a745', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>
                            💻 الزيارات عن بعد
                        </h4>
                        {/* أزرار التبديل */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setRemoteTab('governorate')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: remoteTab === 'governorate' ? '#28a745' : '#e9ecef',
                                    color: remoteTab === 'governorate' ? 'white' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب المحافظة
                            </button>
                            <button
                                onClick={() => setRemoteTab('entity')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: remoteTab === 'entity' ? '#28a745' : '#e9ecef',
                                    color: remoteTab === 'entity' ? 'white' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب الجهة التابعة
                            </button>
                            <button
                                onClick={() => setRemoteTab('facilityType')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: remoteTab === 'facilityType' ? '#28a745' : '#e9ecef',
                                    color: remoteTab === 'facilityType' ? 'white' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب نوع المنشأة
                            </button>
                        </div>
                        {/* الرسم البياني حسب التبويب المختار */}
                        {(() => {
                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                            const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
                            const filtered = remoteSupports.filter(v => v.month === monthStr);

                            let counts: { [key: string]: number } = {};
                            if (remoteTab === 'governorate') {
                                filtered.forEach(v => {
                                    const key = (v.governorate || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            } else if (remoteTab === 'entity') {
                                filtered.forEach(v => {
                                    const key = (v.affiliatedEntity || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            } else {
                                filtered.forEach(v => {
                                    const key = (v.facilityType || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            }

                            const colors = ['#28a745', '#0d6a79', '#ffc107', '#dc3545', '#6f42c1', '#17a2b8', '#fd7e14'];
                            const data = Object.entries(counts).map(([name, value], index) => ({
                                name: shortenLabel(name),
                                fullName: name,
                                value,
                                color: colors[index % colors.length]
                            })).sort((a, b) => b.value - a.value);

                            if (data.length === 0) return <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>لا توجد بيانات</div>;

                            return (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={data} layout="horizontal" margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="name" stroke="var(--text-color)" tick={{ fontSize: 10, dy: 5 }} interval={0} height={50} />
                                        <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value: number, name: string, props: any) => [`${value}`, props.payload.fullName]} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                            <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: 'var(--text-color)', fontSize: '12px' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>

                    {/* قسم الزيارات التمهيدية - إطار موحد بتبويبات */}
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        marginBottom: '25px',
                        border: '2px solid #ffc107',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        <h4 style={{ margin: '0 0 20px 0', color: '#856404', fontSize: '1.2rem', fontWeight: 'bold', textAlign: 'center' }}>
                            📋 الزيارات التمهيدية
                        </h4>
                        {/* أزرار التبديل */}
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
                            <button
                                onClick={() => setIntroTab('governorate')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: introTab === 'governorate' ? '#ffc107' : '#e9ecef',
                                    color: introTab === 'governorate' ? '#333' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب المحافظة
                            </button>
                            <button
                                onClick={() => setIntroTab('entity')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: introTab === 'entity' ? '#ffc107' : '#e9ecef',
                                    color: introTab === 'entity' ? '#333' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب الجهة التابعة
                            </button>
                            <button
                                onClick={() => setIntroTab('facilityType')}
                                style={{
                                    padding: '8px 20px',
                                    borderRadius: '20px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem',
                                    backgroundColor: introTab === 'facilityType' ? '#ffc107' : '#e9ecef',
                                    color: introTab === 'facilityType' ? '#333' : '#333',
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                حسب نوع المنشأة
                            </button>
                        </div>
                        {/* الرسم البياني حسب التبويب المختار */}
                        {(() => {
                            const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                            const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
                            const filtered = introductoryVisits.filter(v => v.month === monthStr);

                            let counts: { [key: string]: number } = {};
                            if (introTab === 'governorate') {
                                filtered.forEach(v => {
                                    const key = (v.governorate || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            } else if (introTab === 'entity') {
                                filtered.forEach(v => {
                                    const key = (v.affiliatedEntity || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            } else {
                                filtered.forEach(v => {
                                    const key = (v.facilityType || 'غير محدد').trim();
                                    counts[key] = (counts[key] || 0) + 1;
                                });
                            }

                            const colors = ['#ffc107', '#0d6a79', '#28a745', '#dc3545', '#6f42c1', '#17a2b8', '#fd7e14'];
                            const data = Object.entries(counts).map(([name, value], index) => ({
                                name: shortenLabel(name),
                                fullName: name,
                                value,
                                color: colors[index % colors.length]
                            })).sort((a, b) => b.value - a.value);

                            if (data.length === 0) return <div style={{ textAlign: 'center', padding: '30px', color: '#6c757d' }}>لا توجد بيانات</div>;

                            return (
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={data} layout="horizontal" margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                        <XAxis dataKey="name" stroke="var(--text-color)" tick={{ fontSize: 10, dy: 5 }} interval={0} height={50} />
                                        <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value: number, name: string, props: any) => [`${value}`, props.payload.fullName]} />
                                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                            {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                            <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: 'var(--text-color)', fontSize: '12px' }} />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            );
                        })()}
                    </div>

                    {/* رسم حالة الزيارات */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '25px',
                            border: '1px solid var(--border-color)',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
                                ⏳ حالة الزيارات (الانتظار والمجدولة)
                            </h4>
                            {(() => {
                                const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;

                                const queuedCount = queuedVisits.filter(v => v.month === monthStr).length;
                                const scheduledCount = scheduledVisits.filter(v => v.month === monthStr).length;

                                const statusData = [
                                    { name: 'قائمة الانتظار', value: queuedCount, color: '#dc3545' },
                                    { name: 'زيارات مجدولة', value: scheduledCount, color: '#17a2b8' }
                                ];

                                const total = statusData.reduce((sum, item) => sum + item.value, 0);

                                if (total === 0) {
                                    return <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>لا توجد بيانات</div>;
                                }

                                return (
                                    <div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={statusData} layout="horizontal" margin={{ top: 25, right: 20, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis dataKey="name" stroke="var(--text-color)" tick={{ fontSize: 12 }} />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value: number) => [`${value}`, 'العدد']} />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                                    <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: 'var(--text-color)', fontSize: '14px' }} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '15px' }}>
                                            {statusData.map((item, index) => (
                                                <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: '8px' }}>
                                                    <div style={{ width: '14px', height: '14px', backgroundColor: item.color, borderRadius: '4px' }}></div>
                                                    <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{item.name}: {item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>

                        {/* رسم المنشآت المعتمدة */}
                        <div style={{
                            backgroundColor: 'var(--card-bg)',
                            borderRadius: '12px',
                            padding: '25px',
                            border: '2px solid #198754',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}>
                            <h4 style={{ margin: '0 0 20px 0', color: '#198754', fontSize: '1.1rem', fontWeight: 'bold', textAlign: 'center' }}>
                                🏆 المنشآت المعتمدة حسب نوع الدعم
                            </h4>
                            {(() => {
                                const expectedYear = selectedMonth >= 7 ? targetYear - 1 : targetYear;
                                const monthStr = `${expectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
                                const filtered = accreditedSupportedFacilities.filter(f => {
                                    const facilityMonth = parseInt(f.month.split('-')[1]);
                                    const facilityYear = parseInt(f.month.split('-')[0]);
                                    const fiscalYear = facilityMonth >= 7 ? facilityYear + 1 : facilityYear;
                                    return facilityMonth === selectedMonth && fiscalYear === targetYear;
                                });

                                const supportTypeCount: { [key: string]: number } = {};
                                filtered.forEach(f => {
                                    const type = (f.supportType || 'غير محدد').trim();
                                    supportTypeCount[type] = (supportTypeCount[type] || 0) + 1;
                                });

                                const colors = ['#198754', '#0d6a79', '#ffc107', '#dc3545', '#6f42c1'];
                                const data = Object.entries(supportTypeCount).map(([name, value], index) => ({ name, value, color: colors[index % colors.length] })).sort((a, b) => b.value - a.value);

                                if (data.length === 0) return <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>لا توجد منشآت معتمدة لهذا الشهر</div>;

                                return (
                                    <div>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={data} layout="horizontal" margin={{ top: 25, right: 10, left: 10, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                                                <XAxis dataKey="name" stroke="var(--text-color)" tick={{ fontSize: 10, dy: 5 }} interval={0} height={40} />
                                                <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                                                <Tooltip contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px' }} formatter={(value: number) => [`${value} منشأة`, 'العدد']} />
                                                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                                                    {data.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                                    <LabelList dataKey="value" position="top" style={{ fontWeight: 'bold', fill: 'var(--text-color)', fontSize: '12px' }} />
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        <div style={{ textAlign: 'center', marginTop: '10px', padding: '8px', backgroundColor: '#d1e7dd', borderRadius: '8px' }}>
                                            <span style={{ fontWeight: 'bold', color: '#198754' }}>إجمالي المنشآت المعتمدة: {filtered.length}</span>
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}



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

            {/* قسم الملاحظات - يظهر فقط في حالة الفلترة الشهرية */}
            {comparisonType === 'monthly' && currentNotes && (
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
                                ملاحظات - {(() => {
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
                            {currentNotes}
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}
