'use client';

import { useState } from 'react';
import KPICard from './KPICard';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList, Cell } from 'recharts';

interface ReviewerEvaluationVisit {
    id?: string;
    month: string;
    facilityType: string;
    facilityName?: string;
    governorate?: string;
    visitType?: string;
    year: number;
}

interface ReportPresentedToCommittee {
    id?: string;
    month: string;
    committeeDecisionType: string;
    numberOfDecisions: number;
    year: number;
}

interface ReportByFacilitySpecialty {
    id?: string;
    month: string;
    facilitySpecialty: string;
    numberOfReports: number;
    year: number;
}

interface AccreditationDecision {
    id?: string;
    month: string;
    facilityCategory: string;
    decisionType: string;
    count: number;
    year: number;
}

interface ReviewersDashboardProps {
    submissions: Array<Record<string, any>>;
    evaluationVisits: ReviewerEvaluationVisit[];
    reportsToCommitteeData?: ReportPresentedToCommittee[];
    reportsBySpecialtyData?: ReportByFacilitySpecialty[];
    accreditationDecisionsData?: AccreditationDecision[];
    governorateVisits?: any[]; // Deprecated, computed from evaluationVisits
    visitTypeVisits?: any[]; // Deprecated, computed from evaluationVisits
}

export default function ReviewersDashboard({
    submissions,
    evaluationVisits,
    reportsToCommitteeData = [],
    reportsBySpecialtyData = [],
    accreditationDecisionsData = [],
    governorateVisits,
    visitTypeVisits
}: ReviewersDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [reportsChartView, setReportsChartView] = useState<'byDecisionType' | 'bySpecialty'>('byDecisionType');
    const [visitsChartView, setVisitsChartView] = useState<'byFacilityType' | 'byGovernorate' | 'byVisitType'>('byFacilityType');
    const [decisionsChartView, setDecisionsChartView] = useState('المستشفيات');
    const [selectedMonth, setSelectedMonth] = useState<number>(10);

    const facilityCategoryTypes = [
        'المستشفيات',
        'مراكز ووحدات الرعاية الصحية',
        'المعامل الطبية',
        'مراكز الأشعة',
        'المراكز الطبية المتخصصة والعيادات المجمعة ومراكز جراحات اليوم الواحد',
        'الصيدليات',
        'مراكز العلاج الطبيعي',
        'دور النقاهة'
    ];

    const facilityCategoryShortNames: Record<string, string> = {
        'المستشفيات': 'المستشفيات',
        'مراكز ووحدات الرعاية الصحية': 'مراكز الرعاية',
        'المعامل الطبية': 'المعامل',
        'مراكز الأشعة': 'الأشعة',
        'المراكز الطبية المتخصصة والعيادات المجمعة ومراكز جراحات اليوم الواحد': 'المراكز المتخصصة',
        'الصيدليات': 'الصيدليات',
        'مراكز العلاج الطبيعي': 'العلاج الطبيعي',
        'دور النقاهة': 'دور النقاهة'
    };

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

    const filterReports = (reports: any[], year: number) => {
        return reports.filter(report => {
            const fiscalYear = getFiscalYear(report.month);
            if (fiscalYear !== year) return false;

            const month = getMonth(report.month);
            if (comparisonType === 'monthly') {
                return month === selectedMonth;
            } else if (comparisonType === 'quarterly') {
                return getQuarter(month) === selectedQuarter;
            } else if (comparisonType === 'halfYearly') {
                return getHalf(month) === selectedHalf;
            }
            return true; // yearly
        });
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
            visitsToUniFacilities: number;
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
                    visitsToUniFacilities: 0,
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
            aggregated[periodKey].visitsToUniFacilities += parseFloat(sub.visitsToUniFacilities) || 0;
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

    const currentEvaluationDays = calculateFilteredTotal(currentAggregated, 'evaluationDays', comparisonType);
    const previousEvaluationDays = calculateFilteredTotal(previousAggregated, 'evaluationDays', comparisonType);
    const evaluationDaysChange = calculateChange(currentEvaluationDays, previousEvaluationDays);

    const currentInsuranceVisits = calculateFilteredTotal(currentAggregated, 'visitsToInsuranceGovernorate', comparisonType);
    const previousInsuranceVisits = calculateFilteredTotal(previousAggregated, 'visitsToInsuranceGovernorate', comparisonType);
    const insuranceVisitsChange = calculateChange(currentInsuranceVisits, previousInsuranceVisits);

    const currentGovVisits = calculateFilteredTotal(currentAggregated, 'visitsToGovFacilities', comparisonType);
    const previousGovVisits = calculateFilteredTotal(previousAggregated, 'visitsToGovFacilities', comparisonType);
    const govVisitsChange = calculateChange(currentGovVisits, previousGovVisits);

    const currentPrivateVisits = calculateFilteredTotal(currentAggregated, 'visitsToPrivateFacilities', comparisonType);
    const previousPrivateVisits = calculateFilteredTotal(previousAggregated, 'visitsToPrivateFacilities', comparisonType);
    const privateVisitsChange = calculateChange(currentPrivateVisits, previousPrivateVisits);

    const currentMOHVisits = calculateFilteredTotal(currentAggregated, 'visitsToMOHFacilities', comparisonType);
    const previousMOHVisits = calculateFilteredTotal(previousAggregated, 'visitsToMOHFacilities', comparisonType);
    const mohVisitsChange = calculateChange(currentMOHVisits, previousMOHVisits);

    const currentCommittees = calculateFilteredTotal(currentAggregated, 'accreditationCommittees', comparisonType);
    const previousCommittees = calculateFilteredTotal(previousAggregated, 'accreditationCommittees', comparisonType);
    const committeesChange = calculateChange(currentCommittees, previousCommittees);

    const currentReports = filterReports(reportsToCommitteeData, targetYear).reduce((sum: number, r: ReportPresentedToCommittee) => sum + (r.numberOfDecisions || 0), 0);
    const previousReports = filterReports(reportsToCommitteeData, targetYear - 1).reduce((sum: number, r: ReportPresentedToCommittee) => sum + (r.numberOfDecisions || 0), 0);
    const reportsChange = calculateChange(currentReports, previousReports);

    const currentAppeals = calculateFilteredTotal(currentAggregated, 'appealsSubmitted', comparisonType);
    const previousAppeals = calculateFilteredTotal(previousAggregated, 'appealsSubmitted', comparisonType);
    const appealsChange = calculateChange(currentAppeals, previousAppeals);

    const currentUniVisits = calculateFilteredTotal(currentAggregated, 'visitsToUniFacilities', comparisonType);
    const previousUniVisits = calculateFilteredTotal(previousAggregated, 'visitsToUniFacilities', comparisonType);
    const uniVisitsChange = calculateChange(currentUniVisits, previousUniVisits);

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
    const evaluationDaysPieData = preparePieData('evaluationDays');
    const insuranceVisitsPieData = preparePieData('visitsToInsuranceGovernorate');
    const govVisitsPieData = preparePieData('visitsToGovFacilities');
    const privateVisitsPieData = preparePieData('visitsToPrivateFacilities');
    const mohVisitsPieData = preparePieData('visitsToMOHFacilities');
    const committeesPieData = preparePieData('accreditationCommittees');
    const reportsPieData = [
        { name: `${targetYear}`, value: currentReports },
        { name: `${targetYear - 1}`, value: previousReports }
    ];
    const appealsPieData = preparePieData('appealsSubmitted');
    const uniVisitsPieData = preparePieData('visitsToUniFacilities');

    const filterEvaluationVisits = (visits: ReviewerEvaluationVisit[]) => {
        return visits.filter(visit => {
            const fiscalYear = getFiscalYear(visit.month);
            if (fiscalYear !== targetYear) return false;

            const month = getMonth(visit.month);
            if (comparisonType === 'monthly') {
                return month === selectedMonth;
            } else if (comparisonType === 'quarterly') {
                return getQuarter(month) === selectedQuarter;
            } else if (comparisonType === 'halfYearly') {
                return getHalf(month) === selectedHalf;
            }
            return true; // yearly
        });
    };

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
        // Define indicators to display
        const indicators = [
            { name: 'إجمالي الزيارات التقييمية', key: 'totalEvaluationVisits' },
            { name: 'زيارات محافظات التأمين الصحي الشامل', key: 'visitsToInsuranceGovernorate' },
            { name: 'زيارات المنشآت الحكومية', key: 'visitsToGovFacilities' },
            { name: 'زيارات منشآت القطاع الخاص', key: 'visitsToPrivateFacilities' },
            { name: 'زيارات منشآت وزارة الصحة والسكان', key: 'visitsToMOHFacilities' },
            { name: 'الزيارات للمنشآت الجامعية', key: 'visitsToUniFacilities' },
            { name: 'عدد أيام التقييم', key: 'evaluationDays' },
            { name: 'لجان الاعتماد المنعقدة', key: 'accreditationCommittees' },
            { name: 'تقارير الزيارات المعروضة على اللجنة', key: 'reportsToCommittee' },
            { name: 'الالتماسات المقدمة', key: 'appealsSubmitted' }
        ];

        // Get current and previous period keys
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
                    <td colSpan={3} style={{ padding: '30px', textAlign: 'center', color: '#999' }}>
                        لا توجد بيانات متاحة للفترة المحددة
                    </td>
                </tr>
            );
        }

        const period = periods[0]; // Get the first (and should be only) period
        let previousPeriodKey = period;

        if (comparisonType === 'monthly' && period.includes('-')) {
            const [year, month] = period.split('-');
            const currentYear = parseInt(year);
            const previousYear = currentYear - 1;
            previousPeriodKey = `${previousYear}-${month}`;
        }

        const curr = currentAggregated[period];
        const prev = previousAggregated[previousPeriodKey];

        // Render each indicator as a row
        return indicators.map((indicator, index) => (
            <tr key={indicator.key} style={{
                borderBottom: '1px solid #eee',
                backgroundColor: index === 0 ? '#bbdefb' : (index >= 1 && index <= 5) ? '#e3f2fd' : 'transparent'
            }}>
                <td style={{ padding: '12px', fontWeight: '500', textAlign: 'right' }}>{indicator.name}</td>
                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#1976d2' }}>
                    {indicator.key === 'reportsToCommittee' ? currentReports : (curr?.[indicator.key as keyof typeof curr] || 0)}
                </td>
                <td style={{ padding: '12px', textAlign: 'center', color: '#999' }}>
                    {indicator.key === 'reportsToCommittee' ? previousReports : (prev?.[indicator.key as keyof typeof prev] || 0)}
                </td>
            </tr>
        ));
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
                    title="عدد أيام التقييم"
                    icon="📅"
                    currentValue={currentEvaluationDays}
                    previousValue={previousEvaluationDays}
                    changePercentage={evaluationDaysChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={evaluationDaysPieData}
                    color="#28a745"
                />
                <KPICard
                    title="زيارات محافظات التأمين الصحي"
                    icon="🏛️"
                    currentValue={currentInsuranceVisits}
                    previousValue={previousInsuranceVisits}
                    changePercentage={insuranceVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={insuranceVisitsPieData}
                    color="#6f42c1"
                />
                <KPICard
                    title="زيارات المنشآت الحكومية"
                    icon="🏢"
                    currentValue={currentGovVisits}
                    previousValue={previousGovVisits}
                    changePercentage={govVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={govVisitsPieData}
                    color="#17a2b8"
                />
                <KPICard
                    title="زيارات منشآت القطاع الخاص"
                    icon="🏪"
                    currentValue={currentPrivateVisits}
                    previousValue={previousPrivateVisits}
                    changePercentage={privateVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={privateVisitsPieData}
                    color="#ffc107"
                />
                <KPICard
                    title="زيارات منشآت وزارة الصحة"
                    icon="🏥"
                    currentValue={currentMOHVisits}
                    previousValue={previousMOHVisits}
                    changePercentage={mohVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={mohVisitsPieData}
                    color="#20c997"
                />
                <KPICard
                    title="عدد الزيارات للمنشآت الجامعية"
                    icon="🏫"
                    currentValue={currentUniVisits}
                    previousValue={previousUniVisits}
                    changePercentage={uniVisitsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={uniVisitsPieData}
                    color="#ff5722"
                />
                <KPICard
                    title="لجان الاعتماد المنعقدة"
                    icon="�‍⚖️"
                    currentValue={currentCommittees}
                    previousValue={previousCommittees}
                    changePercentage={committeesChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={committeesPieData}
                    color="#8884d8"
                />
                <KPICard
                    title="تقارير الزيارات المعروضة على اللجنة"
                    icon="�"
                    currentValue={currentReports}
                    previousValue={previousReports}
                    changePercentage={reportsChange}
                    currentYear={targetYear}
                    previousYear={targetYear - 1}
                    pieData={reportsPieData}
                    color="#fd7e14"
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
                    color="#e83e8c"
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
                    <h4 style={{ margin: '0 0 20px 0', color: 'var(--text-color)' }}>مقارنة الزيارات التقييمية وأيام التقييم</h4>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={[
                                {
                                    name: `العام المالي الحالي (${targetYear})`,
                                    'الزيارات التقييمية': currentTotalVisits,
                                    'أيام التقييم': currentEvaluationDays
                                },
                                {
                                    name: `العام المالي السابق (${targetYear - 1})`,
                                    'الزيارات التقييمية': previousTotalVisits,
                                    'أيام التقييم': previousEvaluationDays
                                }
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                            <XAxis dataKey="name" stroke="var(--text-color)" />
                            <YAxis stroke="var(--text-color)" tick={false} axisLine={false} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'var(--card-bg)',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar dataKey="الزيارات التقييمية" fill="#0eacb8" radius={[5, 5, 0, 0]}>
                                <LabelList
                                    dataKey="الزيارات التقييمية"
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#0eacb8', fontSize: '14px' }}
                                />
                            </Bar>
                            <Bar dataKey="أيام التقييم" fill="#28a745" radius={[5, 5, 0, 0]}>
                                <LabelList
                                    dataKey="أيام التقييم"
                                    position="top"
                                    style={{ fontWeight: 'bold', fill: '#28a745', fontSize: '14px' }}
                                />
                            </Bar>
                        </BarChart>
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
                                <th style={{ padding: '15px', textAlign: 'right', fontWeight: 'bold', width: '50%' }}>المؤشر</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', width: '25%' }}>{targetYear}</th>
                                <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', width: '25%' }}>{targetYear - 1}</th>
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

            {/* الزيارات التقييمية - قسم موحد مع أزرار تنقل */}
            {evaluationVisits && evaluationVisits.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #17a2b8',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* العنوان */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #17a2b8'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>📊</span>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--text-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                الزيارات التقييمية
                            </h3>
                        </div>

                        {/* أزرار التنقل */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '25px',
                            flexWrap: 'wrap'
                        }}>
                            <button
                                onClick={() => setVisitsChartView('byFacilityType')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '25px',
                                    border: '2px solid #17a2b8',
                                    backgroundColor: visitsChartView === 'byFacilityType' ? '#17a2b8' : 'transparent',
                                    color: visitsChartView === 'byFacilityType' ? 'white' : '#17a2b8',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                حسب نوع المنشأة
                            </button>
                            <button
                                onClick={() => setVisitsChartView('byGovernorate')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '25px',
                                    border: '2px solid #17a2b8',
                                    backgroundColor: visitsChartView === 'byGovernorate' ? '#17a2b8' : 'transparent',
                                    color: visitsChartView === 'byGovernorate' ? 'white' : '#17a2b8',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                حسب المحافظة
                            </button>
                            <button
                                onClick={() => setVisitsChartView('byVisitType')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '25px',
                                    border: '2px solid #17a2b8',
                                    backgroundColor: visitsChartView === 'byVisitType' ? '#17a2b8' : 'transparent',
                                    color: visitsChartView === 'byVisitType' ? 'white' : '#17a2b8',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                حسب نوع الزيارة
                            </button>
                        </div>

                        {/* الرسم البياني - حسب نوع المنشأة */}
                        {visitsChartView === 'byFacilityType' && (
                            <>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={(() => {
                                            const filtered = filterEvaluationVisits(evaluationVisits);
                                            const counts = filtered.reduce((acc, visit) => {
                                                const type = visit.facilityType || 'غير محدد';
                                                acc[type] = (acc[type] || 0) + (parseInt(visit.facilityName || '0') || 0);
                                                return acc;
                                            }, {} as Record<string, number>);
                                            return Object.entries(counts).map(([name, count]) => ({
                                                name,
                                                'عدد الزيارات': count
                                            }));
                                        })()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            height={40}
                                            style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            label={{ value: 'عدد الزيارات', angle: -90, position: 'insideLeft' }}
                                            style={{ fontSize: '0.9rem' }}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #17a2b8',
                                                borderRadius: '8px',
                                                padding: '10px'
                                            }}
                                        />
                                        <Bar dataKey="عدد الزيارات" radius={[8, 8, 0, 0]}>
                                            <LabelList dataKey="عدد الزيارات" position="top" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} />
                                            {Object.keys(evaluationVisits.reduce((acc, visit) => {
                                                const type = visit.facilityType || 'غير محدد';
                                                acc[type] = true;
                                                return acc;
                                            }, {} as Record<string, boolean>)).map((_, index) => {
                                                const colors = ['#17a2b8', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#d1ecf1',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <strong style={{ color: '#0c5460' }}>
                                        إجمالي الزيارات: {filterEvaluationVisits(evaluationVisits).reduce((sum, v) => sum + (parseInt(v.facilityName || '0') || 0), 0)} زيارة
                                    </strong>
                                </div>
                            </>
                        )}

                        {/* الرسم البياني - حسب المحافظة */}
                        {visitsChartView === 'byGovernorate' && (
                            <>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={(() => {
                                            const filtered = filterEvaluationVisits(evaluationVisits);
                                            const counts = filtered.reduce((acc, visit) => {
                                                const gov = visit.governorate || 'غير محدد';
                                                acc[gov] = (acc[gov] || 0) + (parseInt(visit.facilityName || '0') || 0);
                                                return acc;
                                            }, {} as Record<string, number>);
                                            return Object.entries(counts).map(([name, count]) => ({
                                                name,
                                                'عدد الزيارات': count
                                            }));
                                        })()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            height={40}
                                            style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            label={{ value: 'عدد الزيارات', angle: -90, position: 'insideLeft' }}
                                            style={{ fontSize: '0.9rem' }}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #17a2b8',
                                                borderRadius: '8px',
                                                padding: '10px'
                                            }}
                                        />
                                        <Bar dataKey="عدد الزيارات" radius={[8, 8, 0, 0]}>
                                            <LabelList dataKey="عدد الزيارات" position="top" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} />
                                            {Object.keys(evaluationVisits.reduce((acc, visit) => {
                                                const gov = visit.governorate || 'غير محدد';
                                                acc[gov] = true;
                                                return acc;
                                            }, {} as Record<string, boolean>)).map((_, index) => {
                                                const colors = ['#28a745', '#17a2b8', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#d1ecf1',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <strong style={{ color: '#0c5460' }}>
                                        إجمالي الزيارات: {filterEvaluationVisits(evaluationVisits).reduce((sum, v) => sum + (parseInt(v.facilityName || '0') || 0), 0)} زيارة
                                    </strong>
                                </div>
                            </>
                        )}

                        {/* الرسم البياني - حسب نوع الزيارة */}
                        {visitsChartView === 'byVisitType' && (
                            <>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={(() => {
                                            const filtered = filterEvaluationVisits(evaluationVisits);
                                            const counts = filtered.reduce((acc, visit) => {
                                                const type = visit.visitType || 'غير محدد';
                                                acc[type] = (acc[type] || 0) + (parseInt(visit.facilityName || '0') || 0);
                                                return acc;
                                            }, {} as Record<string, number>);
                                            return Object.entries(counts).map(([type, count]) => ({
                                                'نوع الزيارة': type,
                                                'عدد الزيارات': count
                                            }));
                                        })()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="نوع الزيارة"
                                            height={40}
                                            style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            label={{ value: 'عدد الزيارات', angle: -90, position: 'insideLeft' }}
                                            style={{ fontSize: '0.9rem' }}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #17a2b8',
                                                borderRadius: '8px',
                                                padding: '10px'
                                            }}
                                        />
                                        <Bar dataKey="عدد الزيارات" radius={[8, 8, 0, 0]}>
                                            <LabelList dataKey="عدد الزيارات" position="top" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} />
                                            {Object.keys(evaluationVisits.reduce((acc, visit) => {
                                                const type = visit.visitType || 'غير محدد';
                                                acc[type] = true;
                                                return acc;
                                            }, {} as Record<string, boolean>)).map((_, index) => {
                                                const colors = ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#e83e8c'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#d1ecf1',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <strong style={{ color: '#0c5460' }}>
                                        إجمالي الزيارات: {filterEvaluationVisits(evaluationVisits).reduce((sum, v) => sum + (parseInt(v.facilityName || '0') || 0), 0)} زيارة
                                    </strong>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* التقارير المعروضة على اللجنة - قسم موحد مع أزرار تنقل */}
            {((reportsToCommitteeData && reportsToCommitteeData.length > 0) || (reportsBySpecialtyData && reportsBySpecialtyData.length > 0)) && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #0eacb8',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* العنوان */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #0eacb8'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>📑</span>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--text-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                التقارير المعروضة على اللجنة
                            </h3>
                        </div>

                        {/* أزرار التنقل */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '25px'
                        }}>
                            <button
                                onClick={() => setReportsChartView('byDecisionType')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '25px',
                                    border: '2px solid #0eacb8',
                                    backgroundColor: reportsChartView === 'byDecisionType' ? '#0eacb8' : 'transparent',
                                    color: reportsChartView === 'byDecisionType' ? 'white' : '#0eacb8',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                حسب نوع القرار
                            </button>
                            <button
                                onClick={() => setReportsChartView('bySpecialty')}
                                style={{
                                    padding: '10px 24px',
                                    borderRadius: '25px',
                                    border: '2px solid #0eacb8',
                                    backgroundColor: reportsChartView === 'bySpecialty' ? '#0eacb8' : 'transparent',
                                    color: reportsChartView === 'bySpecialty' ? 'white' : '#0eacb8',
                                    fontWeight: 'bold',
                                    fontSize: '0.95rem',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                حسب تخصص المنشآت
                            </button>
                        </div>

                        {/* الرسم البياني - حسب نوع القرار */}
                        {reportsChartView === 'byDecisionType' && reportsToCommitteeData && reportsToCommitteeData.length > 0 && (
                            <>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={(() => {
                                            const filtered = filterReports(reportsToCommitteeData, targetYear);
                                            const counts = filtered.reduce((acc: Record<string, number>, report: any) => {
                                                const type = report.committeeDecisionType || 'غير محدد';
                                                acc[type] = (acc[type] || 0) + (report.numberOfDecisions || 0);
                                                return acc;
                                            }, {} as Record<string, number>);
                                            return Object.entries(counts).map(([name, count]) => ({
                                                name,
                                                'عدد التقارير': count
                                            }));
                                        })()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            height={40}
                                            style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            label={{ value: 'عدد التقارير', angle: -90, position: 'insideLeft' }}
                                            style={{ fontSize: '0.9rem' }}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #0eacb8',
                                                borderRadius: '8px',
                                                padding: '10px'
                                            }}
                                        />
                                        <Bar dataKey="عدد التقارير" radius={[8, 8, 0, 0]}>
                                            <LabelList dataKey="عدد التقارير" position="top" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} />
                                            {Object.keys(reportsToCommitteeData.reduce((acc, report) => {
                                                const type = report.committeeDecisionType || 'غير محدد';
                                                acc[type] = true;
                                                return acc;
                                            }, {} as Record<string, boolean>)).map((_, index) => {
                                                const colors = ['#0eacb8', '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#d1ecf1',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <strong style={{ color: '#0c5460' }}>
                                        إجمالي التقارير: {filterReports(reportsToCommitteeData, targetYear).reduce((sum: number, r: any) => sum + (r.numberOfDecisions || 0), 0)} تقرير
                                    </strong>
                                </div>
                            </>
                        )}

                        {/* الرسم البياني - حسب تخصص المنشآت */}
                        {reportsChartView === 'bySpecialty' && reportsBySpecialtyData && reportsBySpecialtyData.length > 0 && (
                            <>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={(() => {
                                            const filtered = filterReports(reportsBySpecialtyData, targetYear);
                                            const counts = filtered.reduce((acc: Record<string, number>, report: any) => {
                                                const type = report.facilitySpecialty || 'غير محدد';
                                                acc[type] = (acc[type] || 0) + (report.numberOfReports || 0);
                                                return acc;
                                            }, {} as Record<string, number>);
                                            return Object.entries(counts).map(([name, count]) => ({
                                                name,
                                                'عدد التقارير': count
                                            }));
                                        })()}
                                        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            dataKey="name"
                                            height={40}
                                            style={{ fontSize: '0.9rem', fontWeight: 'bold' }}
                                        />
                                        <YAxis
                                            label={{ value: 'عدد التقارير', angle: -90, position: 'insideLeft' }}
                                            style={{ fontSize: '0.9rem' }}
                                            tick={false}
                                            axisLine={false}
                                        />
                                        <Tooltip
                                            contentStyle={{
                                                backgroundColor: '#fff',
                                                border: '1px solid #0eacb8',
                                                borderRadius: '8px',
                                                padding: '10px'
                                            }}
                                        />
                                        <Bar dataKey="عدد التقارير" radius={[8, 8, 0, 0]}>
                                            <LabelList dataKey="عدد التقارير" position="top" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} />
                                            {Object.keys(reportsBySpecialtyData.reduce((acc, report) => {
                                                const type = report.facilitySpecialty || 'غير محدد';
                                                acc[type] = true;
                                                return acc;
                                            }, {} as Record<string, boolean>)).map((_, index) => {
                                                const colors = ['#e83e8c', '#007bff', '#28a745', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14', '#20c997', '#17a2b8'];
                                                return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                                <div style={{
                                    marginTop: '15px',
                                    padding: '15px',
                                    backgroundColor: '#d1ecf1',
                                    borderRadius: '8px',
                                    textAlign: 'center'
                                }}>
                                    <strong style={{ color: '#0c5460' }}>
                                        إجمالي التقارير: {filterReports(reportsBySpecialtyData, targetYear).reduce((sum: number, r: any) => sum + (r.numberOfReports || 0), 0)} تقرير
                                    </strong>
                                </div>
                            </>
                        )}

                        {/* رسالة عدم وجود بيانات */}
                        {((reportsChartView === 'byDecisionType' && (!reportsToCommitteeData || reportsToCommitteeData.length === 0)) ||
                            (reportsChartView === 'bySpecialty' && (!reportsBySpecialtyData || reportsBySpecialtyData.length === 0))) && (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                    لا توجد بيانات مسجلة لهذا التصنيف
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* القرارات الصادرة - قسم موحد مع أزرار تنقل */}
            {accreditationDecisionsData && accreditationDecisionsData.length > 0 && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '2px solid #6f42c1',
                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                    }}>
                        {/* العنوان */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            marginBottom: '20px',
                            paddingBottom: '15px',
                            borderBottom: '2px solid #6f42c1'
                        }}>
                            <span style={{ fontSize: '1.5rem' }}>🏛️</span>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--text-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                القرارات الصادرة
                            </h3>
                        </div>

                        {/* أزرار التنقل */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            gap: '8px',
                            marginBottom: '25px',
                            flexWrap: 'wrap'
                        }}>
                            {facilityCategoryTypes.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => setDecisionsChartView(category)}
                                    style={{
                                        padding: '8px 18px',
                                        borderRadius: '25px',
                                        border: '2px solid #6f42c1',
                                        backgroundColor: decisionsChartView === category ? '#6f42c1' : 'transparent',
                                        color: decisionsChartView === category ? 'white' : '#6f42c1',
                                        fontWeight: 'bold',
                                        fontSize: '0.85rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    {facilityCategoryShortNames[category] || category}
                                </button>
                            ))}
                        </div>

                        {/* الرسم البياني */}
                        {(() => {
                            const filteredByTime = filterReports(accreditationDecisionsData, targetYear);
                            const filtered = filteredByTime.filter(d => d.facilityCategory === decisionsChartView);
                            const counts = filtered.reduce((acc, d) => {
                                acc[d.decisionType] = (acc[d.decisionType] || 0) + d.count;
                                return acc;
                            }, {} as Record<string, number>);
                            const chartData = Object.entries(counts).map(([name, count]) => ({
                                name,
                                'العدد': count
                            }));

                            if (chartData.length === 0) {
                                return (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                        لا توجد بيانات مسجلة لـ &quot;{facilityCategoryShortNames[decisionsChartView] || decisionsChartView}&quot;
                                    </div>
                                );
                            }

                            const colors = ['#6f42c1', '#007bff', '#28a745', '#ffc107', '#dc3545', '#17a2b8', '#fd7e14', '#20c997', '#e83e8c', '#6610f2', '#343a40', '#795548', '#009688', '#ff5722'];

                            return (
                                <>
                                    <h4 style={{ textAlign: 'center', color: '#6f42c1', marginBottom: '15px', fontSize: '1.1rem' }}>
                                        القرارات الصادرة لـ {decisionsChartView}
                                    </h4>
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="name"
                                                height={40}
                                                style={{ fontSize: '0.85rem', fontWeight: 'bold' }}
                                            />
                                            <YAxis
                                                style={{ fontSize: '0.9rem' }}
                                                tick={false}
                                                axisLine={false}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#fff',
                                                    border: '1px solid #6f42c1',
                                                    borderRadius: '8px',
                                                    padding: '10px'
                                                }}
                                            />
                                            <Bar dataKey="العدد" radius={[8, 8, 0, 0]}>
                                                <LabelList dataKey="العدد" position="top" style={{ fontSize: '0.9rem', fontWeight: 'bold' }} />
                                                {chartData.map((_, index) => (
                                                    <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                    <div style={{
                                        marginTop: '15px',
                                        padding: '15px',
                                        backgroundColor: '#e8dff5',
                                        borderRadius: '8px',
                                        textAlign: 'center'
                                    }}>
                                        <strong style={{ color: '#4a1d8e' }}>
                                            إجمالي القرارات: {chartData.reduce((sum, d: any) => sum + d['العدد'], 0)} قرار
                                        </strong>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}

        </div>
    );
}
