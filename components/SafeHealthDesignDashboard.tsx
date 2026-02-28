'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
    ReceivedProject,
    CompletedReviewProject,
    getReceivedProjects,
    getCompletedReviewProjects
} from '@/lib/firestore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

interface SafeHealthDesignDashboardProps {
    submissions: Array<Record<string, any>>;
}

const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

export default function SafeHealthDesignDashboard({ submissions }: SafeHealthDesignDashboardProps) {
    const [comparisonType, setComparisonType] = useState<'monthly' | 'quarterly' | 'halfYearly' | 'yearly'>('monthly');
    const [targetYear, setTargetYear] = useState(2025);
    const [selectedQuarter, setSelectedQuarter] = useState<number>(1);
    const [selectedHalf, setSelectedHalf] = useState<number>(1);
    const [selectedMonth, setSelectedMonth] = useState<number>(10);
    const [receivedProjects, setReceivedProjects] = useState<ReceivedProject[]>([]);
    const [completedProjects, setCompletedProjects] = useState<CompletedReviewProject[]>([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [received, completed] = await Promise.all([
            getReceivedProjects(),
            getCompletedReviewProjects()
        ]);
        setReceivedProjects(received);
        setCompletedProjects(completed);
    };

    // Fiscal year helpers (July-June)
    const getFiscalYear = (dateStr: string): number => {
        const year = parseInt(dateStr.split('-')[0]);
        const month = parseInt(dateStr.split('-')[1]);
        return month >= 7 ? year + 1 : year;
    };

    const getMonth = (dateStr: string): number => parseInt(dateStr.split('-')[1]);

    const getQuarter = (month: number): number => {
        if (month >= 7 && month <= 9) return 1;
        if (month >= 10 && month <= 12) return 2;
        if (month >= 1 && month <= 3) return 3;
        return 4;
    };

    const getHalf = (month: number): number => month >= 7 ? 1 : 2;

    // Filter submissions by fiscal year
    const currentYearData = useMemo(() => {
        return submissions.filter(sub => sub.date && getFiscalYear(sub.date) === targetYear);
    }, [submissions, targetYear]);

    const previousYearData = useMemo(() => {
        return submissions.filter(sub => sub.date && getFiscalYear(sub.date) === targetYear - 1);
    }, [submissions, targetYear]);

    // Filter received/completed projects by fiscal year
    const filterProjectsByFiscalYear = (projects: (ReceivedProject | CompletedReviewProject)[], year: number) => {
        return projects.filter(p => {
            if (!p.month) return false;
            return getFiscalYear(p.month) === year;
        });
    };

    const currentReceivedProjects = useMemo(() => filterProjectsByFiscalYear(receivedProjects, targetYear), [receivedProjects, targetYear]);
    const currentCompletedProjects = useMemo(() => filterProjectsByFiscalYear(completedProjects, targetYear), [completedProjects, targetYear]);

    // Aggregate by period
    const aggregateData = (data: Array<Record<string, any>>, type: 'monthly' | 'quarterly' | 'halfYearly' | 'yearly') => {
        const aggregated: Record<string, any> = {};

        data.forEach(sub => {
            if (!sub.date) return;
            const month = getMonth(sub.date);
            let periodKey = '';

            switch (type) {
                case 'monthly': periodKey = sub.date; break;
                case 'quarterly': periodKey = `Q${getQuarter(month)}`; break;
                case 'halfYearly': periodKey = `H${getHalf(month)}`; break;
                case 'yearly': periodKey = 'السنة الكاملة'; break;
            }

            if (!aggregated[periodKey]) {
                aggregated[periodKey] = {
                    firstTimeProjects: 0,
                    feedbackReviewProjects: 0,
                    technicalSupportRequested: 0,
                    technicalSupportProvided: 0,
                    medicalEquipmentReview: 0,
                    count: 0
                };
            }

            aggregated[periodKey].firstTimeProjects += Number(sub.firstTimeProjects) || 0;
            aggregated[periodKey].feedbackReviewProjects += Number(sub.feedbackReviewProjects) || 0;
            aggregated[periodKey].technicalSupportRequested += Number(sub.technicalSupportRequested) || 0;
            aggregated[periodKey].technicalSupportProvided += Number(sub.technicalSupportProvided) || 0;
            aggregated[periodKey].medicalEquipmentReview += Number(sub.medicalEquipmentReview) || 0;
            aggregated[periodKey].count += 1;
        });

        return aggregated;
    };

    const currentAggregated = aggregateData(currentYearData, comparisonType);
    const previousAggregated = aggregateData(previousYearData, comparisonType);

    // Get period key based on selection
    const getPeriodKey = (aggregated: any): string => {
        if (comparisonType === 'yearly') return 'السنة الكاملة';
        if (comparisonType === 'quarterly') return `Q${selectedQuarter}`;
        if (comparisonType === 'halfYearly') return `H${selectedHalf}`;
        // monthly
        const monthKey = Object.keys(aggregated).find(key => {
            if (key.includes('-')) return parseInt(key.split('-')[1]) === selectedMonth;
            return false;
        });
        return monthKey || '';
    };

    const currentPeriodKey = getPeriodKey(currentAggregated);
    const currentPeriodData = currentAggregated[currentPeriodKey] || { firstTimeProjects: 0, feedbackReviewProjects: 0, technicalSupportRequested: 0, technicalSupportProvided: 0, medicalEquipmentReview: 0 };
    const previousPeriodKey = (() => {
        if (comparisonType !== 'monthly') return getPeriodKey(previousAggregated);
        if (currentPeriodKey.includes('-')) {
            const [year, month] = currentPeriodKey.split('-');
            return `${parseInt(year) - 1}-${month}`;
        }
        return '';
    })();
    const previousPeriodData = previousAggregated[previousPeriodKey] || { firstTimeProjects: 0, feedbackReviewProjects: 0, technicalSupportRequested: 0, technicalSupportProvided: 0, medicalEquipmentReview: 0 };

    // Calculate change percentage
    const calcChange = (current: number, previous: number): number => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
    };

    // Entity distribution for received projects (filtered by period)
    const getFilteredProjects = (projects: (ReceivedProject | CompletedReviewProject)[]): (ReceivedProject | CompletedReviewProject)[] => {
        return projects.filter(p => {
            if (!p.month) return false;
            const month = getMonth(p.month);
            if (comparisonType === 'monthly') return month === selectedMonth && getFiscalYear(p.month) === targetYear;
            if (comparisonType === 'quarterly') return getQuarter(month) === selectedQuarter && getFiscalYear(p.month) === targetYear;
            if (comparisonType === 'halfYearly') return getHalf(month) === selectedHalf && getFiscalYear(p.month) === targetYear;
            return getFiscalYear(p.month) === targetYear;
        });
    };

    const filteredReceived = getFilteredProjects(receivedProjects);
    const filteredCompleted = getFilteredProjects(completedProjects);

    const receivedByEntity = useMemo(() => {
        const map = new Map<string, number>();
        filteredReceived.forEach(p => {
            const current = map.get(p.entityType) || 0;
            map.set(p.entityType, current + ((p as ReceivedProject).projectCount || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredReceived]);

    const completedByEntity = useMemo(() => {
        const map = new Map<string, number>();
        filteredCompleted.forEach(p => {
            const current = map.get(p.entityType) || 0;
            map.set(p.entityType, current + ((p as CompletedReviewProject).projectCount || 0));
        });
        return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
    }, [filteredCompleted]);

    // Text fields for selected month
    const getTextFieldsForSelectedMonth = () => {
        if (comparisonType !== 'monthly') return { activitySummary: '', activityDetails: '', obstacles: '', developmentProposals: '', notes: '' };
        const monthData = currentYearData.find(sub => {
            if (!sub.date) return false;
            return getMonth(sub.date) === selectedMonth;
        });
        return {
            activitySummary: monthData?.activitySummary || '',
            activityDetails: monthData?.activityDetails || '',
            obstacles: monthData?.obstacles || '',
            developmentProposals: monthData?.developmentProposals || '',
            notes: monthData?.notes || ''
        };
    };

    const textFields = getTextFieldsForSelectedMonth();

    // Chart data
    const chartData = useMemo(() => {
        const fiscalMonths = [7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];
        return fiscalMonths.map(m => {
            const currentEntry = Object.entries(currentAggregated).find(([key]) => {
                if (key.includes('-')) return parseInt(key.split('-')[1]) === m;
                return false;
            });
            const previousEntry = Object.entries(previousAggregated).find(([key]) => {
                if (key.includes('-')) return parseInt(key.split('-')[1]) === m;
                return false;
            });

            const currentVal = currentEntry ? currentEntry[1].firstTimeProjects + currentEntry[1].feedbackReviewProjects : 0;
            const previousVal = previousEntry ? previousEntry[1].firstTimeProjects + previousEntry[1].feedbackReviewProjects : 0;

            return {
                name: monthNames[m - 1],
                [`${targetYear}`]: currentVal,
                [`${targetYear - 1}`]: previousVal
            };
        }).filter(d => d[`${targetYear}`] > 0 || d[`${targetYear - 1}`] > 0);
    }, [currentAggregated, previousAggregated, targetYear]);

    const totalCurrent = currentPeriodData.firstTimeProjects + currentPeriodData.feedbackReviewProjects;
    const totalPrevious = previousPeriodData.firstTimeProjects + previousPeriodData.feedbackReviewProjects;

    const kpiCardStyle = {
        padding: '20px',
        borderRadius: '12px',
        textAlign: 'center' as const,
        color: 'white',
        boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
    };

    const changeIndicator = (current: number, previous: number) => {
        const change = calcChange(current, previous);
        if (change === 0 && current === 0) return null;
        const color = change >= 0 ? '#28a745' : '#dc3545';
        const arrow = change >= 0 ? '↑' : '↓';
        return (
            <div style={{ fontSize: '0.75rem', marginTop: '5px', opacity: 0.9 }}>
                <span style={{ color: 'rgba(255,255,255,0.9)' }}>
                    {arrow} {Math.abs(Math.round(change))}% مقارنة بالعام السابق
                </span>
            </div>
        );
    };

    return (
        <div>
            <div style={{ marginBottom: '30px' }}>
                <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', color: 'var(--primary-color)' }}>
                    📊 لوحة بيانات التصميم الصحي الآمن
                </h2>
                <p style={{ margin: 0, color: '#666', fontSize: '1rem' }}>
                    الإدارة العامة للتصميم الصحي الآمن - تحليلات ومقارنات
                </p>
            </div>

            {/* Filters */}
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

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '30px' }}>
                <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #0D6A79, #0eacb8)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{totalCurrent}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>إجمالي المشروعات</div>
                    {changeIndicator(totalCurrent, totalPrevious)}
                </div>
                <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #2ecc71, #27ae60)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentPeriodData.firstTimeProjects}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>مراجعة أول مرة</div>
                    {changeIndicator(currentPeriodData.firstTimeProjects, previousPeriodData.firstTimeProjects)}
                </div>
                <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #e67e22, #d35400)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentPeriodData.feedbackReviewProjects}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>مراجعة ملاحظات</div>
                    {changeIndicator(currentPeriodData.feedbackReviewProjects, previousPeriodData.feedbackReviewProjects)}
                </div>
                <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #9b59b6, #8e44ad)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentPeriodData.technicalSupportProvided}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>دعم فني مقدم</div>
                    {changeIndicator(currentPeriodData.technicalSupportProvided, previousPeriodData.technicalSupportProvided)}
                </div>
                <div style={{ ...kpiCardStyle, background: 'linear-gradient(135deg, #3498db, #2980b9)' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{currentPeriodData.medicalEquipmentReview}</div>
                    <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>مراجعة تجهيزات طبية</div>
                    {changeIndicator(currentPeriodData.medicalEquipmentReview, previousPeriodData.medicalEquipmentReview)}
                </div>
            </div>

            {/* Monthly Comparison Chart */}
            {comparisonType === 'monthly' && chartData.length > 0 && (
                <div style={{ marginBottom: '30px', padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ textAlign: 'center', color: 'var(--primary-color)', marginBottom: '20px' }}>📊 مقارنة المشروعات الشهرية</h3>
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey={`${targetYear}`} fill="#0D6A79" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey={`${targetYear}`} position="top" style={{ fontSize: 12, fontWeight: 'bold' }} />
                            </Bar>
                            <Bar dataKey={`${targetYear - 1}`} fill="#e67e22" radius={[4, 4, 0, 0]}>
                                <LabelList dataKey={`${targetYear - 1}`} position="top" style={{ fontSize: 12, fontWeight: 'bold' }} />
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Entity Distribution Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                {/* Received Projects by Entity */}
                <div style={{ padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ textAlign: 'center', color: '#0D6A79', marginBottom: '15px' }}>📥 المشروعات المستلمة حسب الجهة</h3>
                    {receivedByEntity.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>الجهة</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>عدد المشروعات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {receivedByEntity.map((item, i) => (
                                    <tr key={item.name} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.name}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>{item.value}</td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#e8f4f8', fontWeight: 'bold' }}>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>الإجمالي</td>
                                    <td style={{ padding: '10px', textAlign: 'center', color: '#0D6A79' }}>
                                        {receivedByEntity.reduce((s, i) => s + i.value, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>لا توجد بيانات</div>
                    )}
                </div>

                {/* Completed Projects by Entity */}
                <div style={{ padding: '20px', backgroundColor: 'var(--card-bg)', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }}>
                    <h3 style={{ textAlign: 'center', color: '#2ecc71', marginBottom: '15px' }}>✅ المشروعات المنتهي مراجعتها حسب الجهة</h3>
                    {completedByEntity.length > 0 ? (
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#2ecc71', color: 'white' }}>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>الجهة</th>
                                    <th style={{ padding: '10px', textAlign: 'center' }}>عدد المشروعات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {completedByEntity.map((item, i) => (
                                    <tr key={item.name} style={{ borderBottom: '1px solid #eee', backgroundColor: i % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                        <td style={{ padding: '10px', textAlign: 'center' }}>{item.name}</td>
                                        <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#2ecc71' }}>{item.value}</td>
                                    </tr>
                                ))}
                                <tr style={{ backgroundColor: '#e8f8f0', fontWeight: 'bold' }}>
                                    <td style={{ padding: '10px', textAlign: 'center' }}>الإجمالي</td>
                                    <td style={{ padding: '10px', textAlign: 'center', color: '#2ecc71' }}>
                                        {completedByEntity.reduce((s, i) => s + i.value, 0)}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ textAlign: 'center', padding: '30px', color: '#999' }}>لا توجد بيانات</div>
                    )}
                </div>
            </div>

            {/* Text Fields - Only show in monthly view */}
            {comparisonType === 'monthly' && textFields.activitySummary && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '2px solid #6f42c1', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #6f42c1' }}>
                            <span style={{ fontSize: '1.5rem' }}>📋</span>
                            <h3 style={{ margin: 0, color: '#4a1a8a', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                ملخص أنشطة الإدارة - {monthNames[selectedMonth - 1]} {targetYear}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: '#f3e8ff', padding: '20px', borderRadius: '8px', fontSize: '1rem', lineHeight: '1.6', color: '#4a1a8a', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {textFields.activitySummary}
                        </div>
                    </div>
                </div>
            )}

            {comparisonType === 'monthly' && textFields.activityDetails && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '2px solid #0d6efd', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #0d6efd' }}>
                            <span style={{ fontSize: '1.5rem' }}>📄</span>
                            <h3 style={{ margin: 0, color: '#084298', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                تفاصيل أنشطة الإدارة - {monthNames[selectedMonth - 1]} {targetYear}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: '#e7f1ff', padding: '20px', borderRadius: '8px', fontSize: '1rem', lineHeight: '1.6', color: '#084298', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {textFields.activityDetails}
                        </div>
                    </div>
                </div>
            )}

            {comparisonType === 'monthly' && textFields.obstacles && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '2px solid #ffc107', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #ffc107' }}>
                            <span style={{ fontSize: '1.5rem' }}>⚠️</span>
                            <h3 style={{ margin: 0, color: '#856404', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                المعوقات - {monthNames[selectedMonth - 1]} {targetYear}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: '#fff3cd', padding: '20px', borderRadius: '8px', fontSize: '1rem', lineHeight: '1.6', color: '#856404', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {textFields.obstacles}
                        </div>
                    </div>
                </div>
            )}

            {comparisonType === 'monthly' && textFields.developmentProposals && (
                <div style={{ marginBottom: '30px' }}>
                    <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', padding: '25px', border: '2px solid #198754', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px', paddingBottom: '15px', borderBottom: '2px solid #198754' }}>
                            <span style={{ fontSize: '1.5rem' }}>💡</span>
                            <h3 style={{ margin: 0, color: '#0f5132', fontSize: '1.3rem', fontWeight: 'bold' }}>
                                مقترحات التطوير - {monthNames[selectedMonth - 1]} {targetYear}
                            </h3>
                        </div>
                        <div style={{ backgroundColor: '#d1e7dd', padding: '20px', borderRadius: '8px', fontSize: '1rem', lineHeight: '1.6', color: '#0f5132', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {textFields.developmentProposals}
                        </div>
                    </div>
                </div>
            )}

            {/* No data message */}
            {totalCurrent === 0 && receivedByEntity.length === 0 && completedByEntity.length === 0 && (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: '#999' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📊</div>
                    <p style={{ fontSize: '1.2rem' }}>لا توجد بيانات متاحة لعرضها في لوحة البيانات</p>
                    <p style={{ fontSize: '0.9rem' }}>يرجى إضافة بيانات أولاً من صفحة الإدارة</p>
                </div>
            )}
        </div>
    );
}
