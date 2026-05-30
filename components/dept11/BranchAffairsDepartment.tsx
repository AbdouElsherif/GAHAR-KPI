'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import DashboardModal from '@/components/DashboardModal';
import DepartmentExportButton from '@/components/DepartmentExportButton';
import {
    BranchAffairsBranchReport,
    BranchAffairsReport,
    saveBranchAffairsReport,
    getBranchAffairsReports,
    updateBranchAffairsReport,
    deleteBranchAffairsReport
} from '@/lib/firestore';
import BranchAffairsDashboard from './BranchAffairsDashboard';
import { BRANCH_INDICATORS, BRANCH_PHASES, BRANCHES, formatMonthLabel } from './branchAffairsConfig';

interface BranchAffairsDepartmentProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
    departmentName: string;
}

const MIN_MONTH = '2019-01';
const MAX_MONTH = new Date().toISOString().slice(0, 7);

const emptyIndicator = (indicator: typeof BRANCH_INDICATORS[number]) => {
    if (indicator.composite === 'visitedAndApplied') {
        return {
            value: 0,
            previousValue: 0,
            details: '',
            previousDetails: ''
        };
    }
    if (!indicator.numeric) {
        return {
            details: '',
            previousDetails: ''
        };
    }
    return {
        value: 0,
        previousValue: 0,
        details: '',
        previousDetails: ''
    };
};

const removeUndefinedValues = (value: any): any => {
    if (Array.isArray(value)) {
        return value.map(removeUndefinedValues);
    }

    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value)
                .filter(([, entryValue]) => entryValue !== undefined)
                .map(([key, entryValue]) => [key, removeUndefinedValues(entryValue)])
        );
    }

    return value;
};

const createEmptyBranches = (): BranchAffairsBranchReport[] => {
    return BRANCHES.map(branch => ({
        branchId: branch.id,
        branchName: branch.name,
        phase: branch.phase,
        indicators: BRANCH_INDICATORS.reduce((acc, indicator) => {
            acc[indicator.id] = emptyIndicator(indicator);
            return acc;
        }, {} as BranchAffairsBranchReport['indicators'])
    }));
};

const normalizeBranches = (branches?: BranchAffairsBranchReport[]) => {
    const existingById = new Map((branches || []).map(branch => [branch.branchId, branch]));
    return createEmptyBranches().map(branch => {
        const existing = existingById.get(branch.branchId);
        if (!existing) return branch;

        return {
            ...branch,
            indicators: BRANCH_INDICATORS.reduce((acc, indicator) => {
                acc[indicator.id] = {
                    ...emptyIndicator(indicator),
                    ...(existing.indicators?.[indicator.id] || {})
                };
                return acc;
            }, {} as BranchAffairsBranchReport['indicators'])
        };
    });
};

const getIndicatorTotal = (branch: BranchAffairsBranchReport, indicatorId: string) => {
    const indicator = branch.indicators[indicatorId];
    if (!indicator) return 0;
    if (typeof indicator.value === 'number') return indicator.value;
    return (Number(indicator.visitedFacilities) || 0) + (Number(indicator.accreditationApplicants) || 0);
};

const getSingleIndicatorValue = (indicator: any): number => {
    if (!indicator) return 0;
    if (typeof indicator.value === 'number') return indicator.value;
    return (Number(indicator.visitedFacilities) || 0) + (Number(indicator.accreditationApplicants) || 0);
};

const getSinglePreviousValue = (indicator: any): number => {
    if (!indicator) return 0;
    if (typeof indicator.previousValue === 'number') return indicator.previousValue;
    return (Number(indicator.previousVisitedFacilities) || 0) + (Number(indicator.previousAccreditationApplicants) || 0);
};

const getPreviousMonth = (month: string) => {
    if (!month || !month.includes('-')) return '';
    const [year, monthNumber] = month.split('-');
    return `${Number(year) - 1}-${monthNumber}`;
};

export default function BranchAffairsDepartment({ currentUser, canEdit, departmentName }: BranchAffairsDepartmentProps) {
    const [reports, setReports] = useState<BranchAffairsReport[]>([]);
    const [selectedMonth, setSelectedMonth] = useState(MAX_MONTH);
    const [summary, setSummary] = useState('');
    const [activityDetails, setActivityDetails] = useState('');
    const [branches, setBranches] = useState<BranchAffairsBranchReport[]>(createEmptyBranches());
    const [activePhase, setActivePhase] = useState(1);
    const [activeBranchId, setActiveBranchId] = useState(BRANCHES[0].id);
    const [achievementsPhase, setAchievementsPhase] = useState(1);
    const [achievementsBranchId, setAchievementsBranchId] = useState(BRANCHES[0].id);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);

    const userCanEdit = currentUser && canEdit(currentUser);
    const selectedReport = useMemo(() => reports.find(report => report.month === selectedMonth), [reports, selectedMonth]);
    const previousReport = useMemo(() => reports.find(report => report.month === getPreviousMonth(selectedMonth)), [reports, selectedMonth]);
    const selectedMonthLabel = formatMonthLabel(selectedMonth);
    const previousMonthLabel = formatMonthLabel(getPreviousMonth(selectedMonth));

    useEffect(() => {
        loadReports();
    }, []);

    useEffect(() => {
        if (selectedReport) {
            setSummary(selectedReport.summary || '');
            setActivityDetails(selectedReport.activityDetails || '');
            setBranches(normalizeBranches(selectedReport.branches));
        } else {
            setSummary('');
            setActivityDetails('');
            setBranches(createEmptyBranches());
        }
    }, [selectedReport]);

    const loadReports = async () => {
        const data = await getBranchAffairsReports();
        setReports(data);
    };

    const activePhaseBranches = branches.filter(branch => branch.phase === activePhase);
    const activeBranch = branches.find(branch => branch.branchId === activeBranchId) || activePhaseBranches[0] || branches[0];

    const previousBranch = previousReport?.branches.find(branch => branch.branchId === activeBranch?.branchId);
    const achievementsBranches = normalizeBranches(selectedReport?.branches);
    const achievementsPhaseBranches = achievementsBranches.filter(branch => branch.phase === achievementsPhase);
    const achievementsBranch = achievementsBranches.find(branch => branch.branchId === achievementsBranchId) || achievementsPhaseBranches[0] || achievementsBranches[0];
    const achievementsPreviousBranch = previousReport?.branches.find(branch => branch.branchId === achievementsBranch?.branchId);

    const updateIndicator = (branchId: string, indicatorId: string, field: string, value: string) => {
        setBranches(prev => prev.map(branch => {
            if (branch.branchId !== branchId) return branch;
            const currentIndicator = branch.indicators[indicatorId] || {};
            const parsedValue = field.toLowerCase().includes('details') ? value : Math.max(0, Number(value) || 0);

            return {
                ...branch,
                indicators: {
                    ...branch.indicators,
                    [indicatorId]: {
                        ...currentIndicator,
                        [field]: parsedValue
                    }
                }
            };
        }));
    };

    const totals = useMemo(() => {
        return BRANCH_INDICATORS.filter(indicator => indicator.numeric).map(indicator => ({
            id: indicator.id,
            label: indicator.label,
            total: branches.reduce((sum, branch) => sum + getIndicatorTotal(branch, indicator.id), 0)
        }));
    }, [branches]);

    const canEditSelectedMonth = () => {
        if (!userCanEdit) return false;
        if (currentUser?.role === 'super_admin') return true;
        const [year, month] = selectedMonth.split('-').map(Number);
        const recordDate = new Date(year, month - 1, 1);
        const threeMonthsAgo = new Date(new Date().getFullYear(), new Date().getMonth() - 3, 1);
        return recordDate >= threeMonthsAgo;
    };

    const handleSave = async () => {
        if (!currentUser || !canEditSelectedMonth()) {
            setMessage({ type: 'error', text: 'ليس لديك صلاحية لحفظ بيانات هذا الشهر' });
            return;
        }

        if (!selectedMonth) {
            setMessage({ type: 'error', text: 'يرجى اختيار الشهر' });
            return;
        }

        setIsSaving(true);
        setMessage(null);

        const [year] = selectedMonth.split('-');
        const payload = {
            departmentId: 'dept11',
            month: selectedMonth,
            year: Number(year),
            summary,
            activityDetails,
            branches: removeUndefinedValues(branches),
            createdBy: currentUser.id,
            updatedBy: currentUser.id
        };

        try {
            const success = selectedReport?.id
                ? await updateBranchAffairsReport(selectedReport.id, { ...payload, updatedBy: currentUser.id })
                : await saveBranchAffairsReport(payload);

            if (success) {
                await loadReports();
                setMessage({ type: 'success', text: 'تم حفظ بيانات شئون الفروع بنجاح' });
            } else {
                setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ البيانات' });
            }
        } catch (error) {
            console.error('Error saving branch affairs report:', error);
            setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ البيانات' });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedReport?.id || !canEditSelectedMonth()) return;
        if (!confirm(`هل أنت متأكد من حذف بيانات ${formatMonthLabel(selectedMonth)}؟`)) return;

        const success = await deleteBranchAffairsReport(selectedReport.id);
        if (success) {
            await loadReports();
            setMessage({ type: 'success', text: 'تم حذف بيانات الشهر بنجاح' });
        } else {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء حذف البيانات' });
        }
    };

    const copyPreviousYear = () => {
        if (!previousReport) return;
        setBranches(normalizeBranches(previousReport.branches));
        setMessage({ type: 'success', text: 'تم نسخ بيانات نفس الشهر من السنة السابقة كمسودة قابلة للتعديل' });
    };

    const getPreviousDisplayValue = (
        indicator: typeof BRANCH_INDICATORS[number],
        current: any,
        storedPrevious?: any
    ) => {
        if (!indicator.numeric) return '';

        const source = storedPrevious || current || {};
        return storedPrevious ? getSingleIndicatorValue(source) : getSinglePreviousValue(source);
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px 0' }} dir="rtl">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', gap: '15px', flexWrap: 'wrap' }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: '1.8rem' }}>لوحة مؤشرات {departmentName}</h1>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <DepartmentExportButton departmentId="dept11" departmentName={departmentName} />
                    <button
                        onClick={() => setIsDashboardOpen(true)}
                        className="btn"
                        style={{ backgroundColor: '#198754', color: 'white', fontSize: '0.95rem', padding: '10px 20px' }}
                    >
                        📊 لوحة البيانات
                    </button>
                    <Link href="/" className="btn btn-secondary">العودة للرئيسية</Link>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px', alignItems: 'end' }}>
                    <div className="form-group" style={{ margin: 0 }}>
                        <label className="form-label">الشهر</label>
                        <input
                            type="month"
                            className="form-input"
                            min={MIN_MONTH}
                            max={MAX_MONTH}
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                        />
                    </div>
                    <div style={{ color: '#666' }}>
                        <strong>حالة الشهر:</strong> {selectedReport ? 'تم إدخال بيانات لهذا الشهر' : 'شهر جديد بدون بيانات محفوظة'}
                    </div>
                    <div style={{ color: '#666' }}>
                        <strong>مقارنة السنة السابقة:</strong> {previousReport ? formatMonthLabel(previousReport.month) : 'لا توجد بيانات مقابلة'}
                    </div>
                </div>
            </div>

            {message && (
                <div
                    style={{
                        padding: '14px 18px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        backgroundColor: message.type === 'success' ? '#d4edda' : '#f8d7da',
                        color: message.type === 'success' ? '#155724' : '#721c24',
                        border: `1px solid ${message.type === 'success' ? '#c3e6cb' : '#f5c6cb'}`
                    }}
                >
                    {message.text}
                </div>
            )}

            <div className="card">
                <h2 style={{ color: 'var(--primary-color)', marginBottom: '20px' }}>تجميع مؤشرات الفروع</h2>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    {totals.map(total => (
                        <div
                            key={total.id}
                            style={{
                                border: '1px solid var(--border-color)',
                                borderRadius: '10px',
                                padding: '14px',
                                backgroundColor: 'var(--background-color)'
                            }}
                        >
                            <div style={{ fontSize: '0.85rem', color: '#666', minHeight: '40px' }}>{total.label}</div>
                            <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--primary-color)' }}>{total.total}</div>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                        <label className="form-label">ملخص نشاطات الإدارة</label>
                        <textarea
                            className="form-input"
                            rows={5}
                            value={summary}
                            onChange={(e) => setSummary(e.target.value)}
                            disabled={!canEditSelectedMonth()}
                            placeholder="أدخل ملخص نشاطات الإدارة"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">تفاصيل الأنشطة بالإدارة</label>
                        <textarea
                            className="form-input"
                            rows={5}
                            value={activityDetails}
                            onChange={(e) => setActivityDetails(e.target.value)}
                            disabled={!canEditSelectedMonth()}
                            placeholder="أدخل تفاصيل الأنشطة بالإدارة"
                        />
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
                    <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>بيانات الفروع</h2>
                    {previousReport && canEditSelectedMonth() && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={copyPreviousYear}
                            style={{ padding: '9px 16px' }}
                        >
                            نسخ بيانات السنة السابقة كمسودة
                        </button>
                    )}
                </div>

                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                    {BRANCH_PHASES.map(phase => (
                        <button
                            key={phase.id}
                            type="button"
                            onClick={() => {
                                setActivePhase(phase.id);
                                const firstBranch = branches.find(branch => branch.phase === phase.id);
                                if (firstBranch) setActiveBranchId(firstBranch.branchId);
                            }}
                            className="btn"
                            style={{
                                backgroundColor: activePhase === phase.id ? 'var(--primary-color)' : '#e9ecef',
                                color: activePhase === phase.id ? 'white' : 'var(--secondary-color)',
                                padding: '9px 16px'
                            }}
                        >
                            {phase.label}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '22px' }}>
                    {activePhaseBranches.map(branch => (
                        <button
                            key={branch.branchId}
                            type="button"
                            onClick={() => setActiveBranchId(branch.branchId)}
                            style={{
                                border: `1px solid ${activeBranch?.branchId === branch.branchId ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                backgroundColor: activeBranch?.branchId === branch.branchId ? 'rgba(13,106,121,0.08)' : 'var(--card-bg)',
                                color: activeBranch?.branchId === branch.branchId ? 'var(--primary-color)' : 'var(--text-color)',
                                borderRadius: '8px',
                                padding: '10px 14px',
                                cursor: 'pointer',
                                fontWeight: 700
                            }}
                        >
                            {branch.branchName}
                        </button>
                    ))}
                </div>

                {activeBranch && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '980px' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'right', width: '24%' }}>المؤشر</th>
                                    <th style={{ padding: '12px', textAlign: 'center', width: '22%' }}>{previousMonthLabel}</th>
                                    <th style={{ padding: '12px', textAlign: 'center', width: '20%' }}>{selectedMonthLabel}</th>
                                    <th style={{ padding: '12px', textAlign: 'right' }}>التفاصيل</th>
                                </tr>
                            </thead>
                            <tbody>
                                {BRANCH_INDICATORS.map((indicator, index) => {
                                    if (!indicator.numeric) {
                                        const current = activeBranch.indicators[indicator.id] || emptyIndicator(indicator);

                                        return (
                                            <tr key={indicator.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                <td
                                                    colSpan={4}
                                                    style={{
                                                        padding: '14px 12px'
                                                    }}
                                                >
                                                    <label
                                                        className="form-label"
                                                        style={{
                                                            color: 'var(--secondary-color)',
                                                            fontWeight: 800,
                                                            marginBottom: '10px'
                                                        }}
                                                    >
                                                        {indicator.label}
                                                    </label>
                                                    <textarea
                                                        className="form-input"
                                                        rows={4}
                                                        value={current.details || ''}
                                                        onChange={(e) => updateIndicator(activeBranch.branchId, indicator.id, 'details', e.target.value)}
                                                        disabled={!canEditSelectedMonth()}
                                                        placeholder={`أدخل ${indicator.label}`}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    }

                                    const current = activeBranch.indicators[indicator.id] || emptyIndicator(indicator);
                                    const previous = previousBranch?.indicators?.[indicator.id];
                                    const hasStoredPrevious = Boolean(previous);
                                    const previousValue = previous ? getSingleIndicatorValue(previous) : 0;

                                    return (
                                        <tr key={indicator.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                            <td style={{ padding: '12px', fontWeight: 700, color: 'var(--secondary-color)' }}>{indicator.label}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#666', fontWeight: 700 }}>
                                                {hasStoredPrevious ? (
                                                    previousValue
                                                ) : (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        className="form-input"
                                                        value={getSinglePreviousValue(current)}
                                                        onChange={(e) => updateIndicator(activeBranch.branchId, indicator.id, 'previousValue', e.target.value)}
                                                        disabled={!canEditSelectedMonth()}
                                                    />
                                                )}
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="form-input"
                                                    value={getSingleIndicatorValue(current)}
                                                    onChange={(e) => updateIndicator(activeBranch.branchId, indicator.id, 'value', e.target.value)}
                                                    disabled={!canEditSelectedMonth()}
                                                />
                                            </td>
                                            <td style={{ padding: '12px' }}>
                                                <textarea
                                                    className="form-input"
                                                    rows={indicator.numeric ? 2 : 4}
                                                    value={current.details || ''}
                                                    onChange={(e) => updateIndicator(activeBranch.branchId, indicator.id, 'details', e.target.value)}
                                                    disabled={!canEditSelectedMonth()}
                                                    placeholder="تفاصيل المؤشر"
                                                />
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
                    <div style={{ color: '#666' }}>
                        {canEditSelectedMonth() ? 'يمكن حفظ أو تعديل بيانات هذا الشهر.' : 'هذا الشهر خارج نطاق التعديل المتاح لهذا المستخدم.'}
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {selectedReport && canEditSelectedMonth() && (
                            <button
                                type="button"
                                className="btn"
                                onClick={handleDelete}
                                style={{ backgroundColor: '#dc3545', color: 'white' }}
                            >
                                حذف بيانات الشهر
                            </button>
                        )}
                        <button
                            type="button"
                            className="btn btn-primary"
                            onClick={handleSave}
                            disabled={!canEditSelectedMonth() || isSaving}
                        >
                            {isSaving ? 'جاري الحفظ...' : selectedReport ? 'تحديث بيانات الشهر' : 'حفظ بيانات الشهر'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '18px' }}>
                    <h2 style={{ color: 'var(--primary-color)', margin: 0 }}>إنجازات الفروع</h2>
                    <div style={{ color: '#666', fontWeight: 700 }}>
                        {selectedReport ? formatMonthLabel(selectedReport.month) : `لا توجد بيانات محفوظة لشهر ${formatMonthLabel(selectedMonth)}`}
                    </div>
                </div>

                {!selectedReport ? (
                    <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>لا توجد إنجازات محفوظة للشهر المحدد</p>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
                            {BRANCH_PHASES.map(phase => (
                                <button
                                    key={phase.id}
                                    type="button"
                                    onClick={() => {
                                        setAchievementsPhase(phase.id);
                                        const firstBranch = achievementsBranches.find(branch => branch.phase === phase.id);
                                        if (firstBranch) setAchievementsBranchId(firstBranch.branchId);
                                    }}
                                    className="btn"
                                    style={{
                                        backgroundColor: achievementsPhase === phase.id ? 'var(--primary-color)' : '#e9ecef',
                                        color: achievementsPhase === phase.id ? 'white' : 'var(--secondary-color)',
                                        padding: '10px 22px',
                                        minWidth: '130px'
                                    }}
                                >
                                    {phase.label}
                                </button>
                            ))}
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end', marginBottom: '24px' }}>
                            {achievementsPhaseBranches.map(branch => (
                                <button
                                    key={branch.branchId}
                                    type="button"
                                    onClick={() => setAchievementsBranchId(branch.branchId)}
                                    style={{
                                        border: `1px solid ${achievementsBranch?.branchId === branch.branchId ? 'var(--primary-color)' : 'var(--border-color)'}`,
                                        backgroundColor: achievementsBranch?.branchId === branch.branchId ? 'rgba(13,106,121,0.08)' : 'var(--card-bg)',
                                        color: achievementsBranch?.branchId === branch.branchId ? 'var(--primary-color)' : 'var(--text-color)',
                                        borderRadius: '8px',
                                        padding: '12px 20px',
                                        cursor: 'pointer',
                                        fontWeight: 800,
                                        minWidth: '92px',
                                        boxShadow: achievementsBranch?.branchId === branch.branchId ? '0 2px 8px rgba(13,106,121,0.10)' : 'none'
                                    }}
                                >
                                    {branch.branchName}
                                </button>
                            ))}
                        </div>

                        {achievementsBranch && (
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '900px' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right', width: '28%' }}>المؤشر</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '18%' }}>{previousMonthLabel}</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '18%' }}>{selectedMonthLabel}</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>التفاصيل</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {BRANCH_INDICATORS.filter(indicator => indicator.numeric).map((indicator, index) => {
                                            const current = achievementsBranch.indicators[indicator.id] || emptyIndicator(indicator);
                                            const storedPrevious = achievementsPreviousBranch?.indicators?.[indicator.id];

                                            return (
                                                <tr key={indicator.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#eef3f5' : 'white' }}>
                                                    <td style={{ padding: '12px', fontWeight: 700, color: 'var(--secondary-color)' }}>{indicator.label}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 700, color: '#666' }}>
                                                        {getPreviousDisplayValue(indicator, current, storedPrevious)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 800, color: 'var(--primary-color)' }}>
                                                        {getSingleIndicatorValue(current)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'right', whiteSpace: 'pre-wrap' }}>
                                                        {current.details || '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {achievementsBranch && (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginTop: '22px' }}>
                                {BRANCH_INDICATORS.filter(indicator => !indicator.numeric).map(indicator => {
                                    const current = achievementsBranch.indicators[indicator.id] || emptyIndicator(indicator);

                                    return (
                                        <div
                                            key={indicator.id}
                                            style={{
                                                border: '1px solid var(--border-color)',
                                                borderTop: '4px solid var(--primary-color)',
                                                borderRadius: '10px',
                                                backgroundColor: '#eef3f5',
                                                padding: '18px',
                                                minHeight: '140px'
                                            }}
                                        >
                                            <h3 style={{ margin: '0 0 12px', color: 'var(--secondary-color)', fontSize: '1.05rem' }}>
                                                {indicator.label}
                                            </h3>
                                            <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-color)', lineHeight: 1.8 }}>
                                                {current.details || '-'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            <DashboardModal
                isOpen={isDashboardOpen}
                onClose={() => setIsDashboardOpen(false)}
                title="لوحة بيانات الإدارة العامة لشئون الفروع"
            >
                <BranchAffairsDashboard reports={reports} selectedMonth={selectedMonth} />
            </DashboardModal>
        </div>
    );
}
