'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { departmentsList } from '@/constants/departments';
import { User } from '@/lib/auth';
import { exportAllDataForAI } from '@/lib/aiExportHelper';
import {
    analyzeDataQuality,
    type DataQualityCategory,
    type DataQualityIssue,
    type DataQualityReport,
    type DataQualitySeverity
} from '@/lib/dataQuality';

interface DataQualityCenterProps {
    currentUser: User;
}

const severityLabels: Record<DataQualitySeverity, string> = {
    high: 'حرجة',
    medium: 'متوسطة',
    low: 'تنبيه'
};

const severityStyles: Record<DataQualitySeverity, { color: string; background: string; border: string }> = {
    high: {
        color: '#842029',
        background: '#f8d7da',
        border: '#f1aeb5'
    },
    medium: {
        color: '#664d03',
        background: '#fff3cd',
        border: '#ffecb5'
    },
    low: {
        color: '#055160',
        background: '#cff4fc',
        border: '#9eeaf9'
    }
};

const categoryLabels: Record<DataQualityCategory, string> = {
    duplicates: 'تكرار',
    missing: 'نواقص',
    range: 'نطاق القيم',
    consistency: 'اتساق الإجماليات',
    naming: 'توحيد المسميات'
};

const formatNumber = (value: number) => new Intl.NumberFormat('ar-EG').format(value);
const DATA_QUALITY_START_MONTH = '2025-12';

const collectionDepartmentMap: Record<string, string> = {
    accreditation_facilities: 'dept6',
    completion_facilities: 'dept6',
    payment_facilities: 'dept6',
    corrective_plan_facilities: 'dept6',
    basic_requirements_facilities: 'dept6',
    appeals_facilities: 'dept6',
    paid_facilities: 'dept6',
    medical_professional_registrations: 'dept7',
    committee_preparation_facilities: 'dept6',
    certificate_issuance_facilities: 'dept6',
    technical_support_visits: 'dept2',
    remote_technical_supports: 'dept2',
    introductory_support_visits: 'dept2',
    queued_support_visits: 'dept2',
    scheduled_support_visits: 'dept2',
    accredited_supported_facilities: 'dept2',
    technical_clinical_facilities: 'dept4',
    admin_audit_facilities: 'dept5',
    admin_audit_observations: 'dept5',
    technical_clinical_observations: 'dept4',
    observation_correction_rates: 'dept5',
    technical_clinical_correction_rates: 'dept4',
    reviewer_evaluation_visits: 'dept9',
    medical_professionals_by_category: 'dept7',
    medical_professionals_by_governorate: 'dept7',
    training_entities: 'dept1',
    program_types: 'dept1',
    total_med_profs_by_category: 'dept7',
    total_med_profs_by_governorate: 'dept7',
    governorate_customer_surveys: 'dept3',
    reports_presented_to_committee: 'dept9',
    reports_by_facility_specialty: 'dept9',
    accreditation_decisions: 'dept9',
    collected_revenues: 'dept1',
    general_kpis: 'dept1'
};

const formatMonth = (monthKey: string) => {
    try {
        const [year, month] = monthKey.split('-').map(Number);
        return new Intl.DateTimeFormat('ar-EG', {
            month: 'long',
            year: 'numeric'
        }).format(new Date(year, month - 1, 1));
    } catch {
        return monthKey;
    }
};

const formatDateTime = (value: string) => {
    try {
        return new Intl.DateTimeFormat('ar-EG', {
            dateStyle: 'medium',
            timeStyle: 'short'
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const getVisibleDepartmentIds = (currentUser: User) => {
    if (currentUser.role === 'super_admin' || currentUser.role === 'general_viewer') {
        return departmentsList.map(department => department.id);
    }

    return currentUser.departmentId ? [currentUser.departmentId] : [];
};

const getIssueDepartmentId = (issue: DataQualityIssue) => {
    const primaryLocation = issue.locations?.[0];
    return issue.departmentId
        || primaryLocation?.departmentId
        || (issue.collectionName ? collectionDepartmentMap[issue.collectionName] : undefined);
};

const buildLocationHref = (location: {
    departmentId?: string;
    collectionName?: string;
    month?: string;
    recordId?: string;
}) => {
    const departmentId = location.departmentId
        || (location.collectionName ? collectionDepartmentMap[location.collectionName] : undefined);
    if (!departmentId) return '/#data-quality-center';

    const params = new URLSearchParams();
    if (location.month) params.set('month', location.month);
    if (location.collectionName) params.set('section', location.collectionName);
    if (location.recordId) params.set('recordId', location.recordId);

    const query = params.toString();
    return `/department/${departmentId}${query ? `?${query}` : ''}`;
};

const buildIssueHref = (issue: DataQualityIssue) => {
    return buildLocationHref({
        departmentId: getIssueDepartmentId(issue),
        collectionName: issue.collectionName || issue.locations?.[0]?.collectionName,
        month: issue.month || issue.locations?.[0]?.month,
        recordId: issue.recordId || issue.locations?.[0]?.recordId
    });
};

export default function DataQualityCenter({ currentUser }: DataQualityCenterProps) {
    const [report, setReport] = useState<DataQualityReport | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [severityFilter, setSeverityFilter] = useState<'all' | DataQualitySeverity>('all');
    const [categoryFilter, setCategoryFilter] = useState<'all' | DataQualityCategory>('all');
    const [showAll, setShowAll] = useState(false);
    const loadingRef = useRef(false);
    const lastRefreshAtRef = useRef(0);

    const visibleDepartmentIds = useMemo(() => getVisibleDepartmentIds(currentUser), [currentUser]);
    const visibleDepartmentKey = visibleDepartmentIds.join('|');

    const loadQualityReport = useCallback(async () => {
        if (loadingRef.current) return;

        try {
            loadingRef.current = true;
            lastRefreshAtRef.current = Date.now();
            setLoading(true);
            setError(false);
            const payload = await exportAllDataForAI({
                filterString: 'ALL',
                departmentIds: visibleDepartmentIds
            });
            setReport(analyzeDataQuality(payload, {
                minMonth: DATA_QUALITY_START_MONTH
            }));
        } catch (loadError) {
            console.error('Error loading data quality report:', loadError);
            setError(true);
        } finally {
            loadingRef.current = false;
            setLoading(false);
        }
    }, [visibleDepartmentKey]);

    useEffect(() => {
        loadQualityReport();
    }, [loadQualityReport]);

    useEffect(() => {
        const refreshWhenCurrent = () => {
            if (document.visibilityState !== 'visible') return;
            if (Date.now() - lastRefreshAtRef.current < 3000) return;
            loadQualityReport();
        };

        window.addEventListener('focus', refreshWhenCurrent);
        document.addEventListener('visibilitychange', refreshWhenCurrent);

        return () => {
            window.removeEventListener('focus', refreshWhenCurrent);
            document.removeEventListener('visibilitychange', refreshWhenCurrent);
        };
    }, [loadQualityReport]);

    const filteredIssues = useMemo(() => {
        if (!report) return [];

        return report.issues.filter(issue => {
            const severityMatches = severityFilter === 'all' || issue.severity === severityFilter;
            const categoryMatches = categoryFilter === 'all' || issue.category === categoryFilter;
            return severityMatches && categoryMatches;
        });
    }, [categoryFilter, report, severityFilter]);

    const visibleIssues = showAll ? filteredIssues : filteredIssues.slice(0, 10);

    const renderIssue = (issue: DataQualityIssue) => {
        const severityStyle = severityStyles[issue.severity];
        const issueDepartmentId = getIssueDepartmentId(issue);
        const issueDepartmentName = issue.departmentName
            || (issueDepartmentId ? departmentsList.find(department => department.id === issueDepartmentId)?.name : undefined);
        const reviewHref = buildIssueHref(issue);
        const locationItems = [
            issueDepartmentName ? `الإدارة: ${issueDepartmentName}` : '',
            issue.month ? `الشهر: ${issue.month}` : '',
            issue.collectionLabel ? `القسم/الجدول: ${issue.collectionLabel}` : '',
            issue.recordId ? `معرّف السجل: ${issue.recordId}` : ''
        ].filter(Boolean);

        return (
            <div
                key={issue.id}
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) auto',
                    gap: '14px',
                    padding: '15px 16px',
                    borderBottom: '1px solid var(--border-color)',
                    alignItems: 'center'
                }}
            >
                <div>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        marginBottom: '7px'
                    }}>
                        <span style={{
                            backgroundColor: severityStyle.background,
                            border: `1px solid ${severityStyle.border}`,
                            color: severityStyle.color,
                            borderRadius: '999px',
                            padding: '3px 9px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold'
                        }}>
                            {severityLabels[issue.severity]}
                        </span>
                        <span style={{
                            backgroundColor: '#eef9f6',
                            border: '1px solid #a3e2d1',
                            color: '#0d6a79',
                            borderRadius: '999px',
                            padding: '3px 9px',
                            fontSize: '0.78rem',
                            fontWeight: 'bold'
                        }}>
                            {categoryLabels[issue.category]}
                        </span>
                        {issue.month && (
                            <span style={{ color: '#666', fontSize: '0.85rem', fontWeight: 'bold' }}>
                                {issue.month}
                            </span>
                        )}
                    </div>

                    <strong style={{ display: 'block', color: 'var(--text-color)', marginBottom: '5px' }}>
                        {issue.title}
                    </strong>
                    <div style={{ color: 'var(--text-color)', opacity: 0.82, fontSize: '0.92rem', lineHeight: 1.55 }}>
                        {issueDepartmentName && (
                            <span style={{ fontWeight: 'bold', color: '#0d6a79' }}>
                                {issueDepartmentName}: {' '}
                            </span>
                        )}
                        {issue.details}
                    </div>
                    {locationItems.length > 0 && (
                        <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '7px'
                        }}>
                            {locationItems.map(item => (
                                <span
                                    key={item}
                                    style={{
                                        backgroundColor: '#f8f9fa',
                                        border: '1px solid var(--border-color)',
                                        color: '#555',
                                        borderRadius: '6px',
                                        padding: '4px 8px',
                                        fontSize: '0.8rem',
                                        fontWeight: 600
                                    }}
                                >
                                    {item}
                                </span>
                            ))}
                        </div>
                    )}
                    {issue.locations && issue.locations.length > 0 && (
                        <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '7px',
                            alignItems: 'center'
                        }}>
                            <span style={{
                                color: '#555',
                                fontSize: '0.8rem',
                                fontWeight: 'bold'
                            }}>
                                أماكن الظهور:
                            </span>
                            {issue.locations.map((location, index) => (
                                <Link
                                    key={`${location.collectionName || 'general'}-${location.recordId || index}-${location.value || ''}`}
                                    href={buildLocationHref(location)}
                                    style={{
                                        backgroundColor: '#eef9f6',
                                        border: '1px solid #a3e2d1',
                                        color: '#0d6a79',
                                        borderRadius: '6px',
                                        padding: '5px 8px',
                                        fontSize: '0.78rem',
                                        fontWeight: 'bold',
                                        textDecoration: 'none'
                                    }}
                                >
                                    {location.value ? `${location.value} - ` : ''}
                                    {location.collectionLabel || location.collectionName || 'جدول'}
                                    {location.month ? ` (${location.month})` : ''}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <Link
                    href={reviewHref}
                    className="btn"
                    style={{
                        backgroundColor: issueDepartmentId ? '#0d6a79' : '#6c757d',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '5px',
                        textDecoration: 'none',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {issueDepartmentId ? 'فتح موضع المراجعة' : 'مراجعة عامة'}
                </Link>
            </div>
        );
    };

    return (
        <div style={{
            scrollMarginTop: '20px',
            marginTop: '40px',
            borderTop: '1px solid #eee',
            paddingTop: '30px',
            direction: 'rtl',
            textAlign: 'right'
        }} id="data-quality-center">
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '15px',
                flexWrap: 'wrap',
                marginBottom: '15px'
            }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', margin: '0 0 6px', color: '#0d6a79', fontWeight: 'bold' }}>
                        مركز جودة البيانات
                    </h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem', lineHeight: 1.7 }}>
                        فحص آلي للتكرار، القيم غير المنطقية، الحقول الناقصة، اختلاف أسماء المنشآت، وعدم تطابق الإجماليات مع الجداول التفصيلية.
                    </p>
                    <p style={{ margin: '6px 0 0', color: '#0d6a79', fontSize: '0.86rem', fontWeight: 'bold' }}>
                        نطاق الفحص: بداية من {formatMonth(DATA_QUALITY_START_MONTH)}
                    </p>
                    {report && (
                        <p style={{ margin: '6px 0 0', color: '#777', fontSize: '0.82rem' }}>
                            آخر فحص: {formatDateTime(report.generatedAt)}
                        </p>
                    )}
                </div>

                <button
                    onClick={loadQualityReport}
                    disabled={loading}
                    style={{
                        backgroundColor: loading ? '#6c757d' : '#0d6a79',
                        color: 'white',
                        border: 'none',
                        padding: '9px 16px',
                        borderRadius: '6px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        fontWeight: 'bold'
                    }}
                >
                    {loading ? 'جاري الفحص...' : 'إعادة الفحص'}
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                marginBottom: '15px'
            }}>
                <div style={{ border: '1px solid #f1aeb5', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>
                        {formatNumber(report?.summary.high || 0)}
                    </strong>
                    <span>مشاكل حرجة</span>
                </div>
                <div style={{ border: '1px solid #ffecb5', backgroundColor: '#fff3cd', color: '#664d03', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>
                        {formatNumber(report?.summary.medium || 0)}
                    </strong>
                    <span>مشاكل متوسطة</span>
                </div>
                <div style={{ border: '1px solid #9eeaf9', backgroundColor: '#cff4fc', color: '#055160', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>
                        {formatNumber(report?.summary.low || 0)}
                    </strong>
                    <span>تنبيهات تحسين</span>
                </div>
                <div style={{ border: '1px solid #a3e2d1', backgroundColor: '#eef9f6', color: '#0d6a79', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>
                        {formatNumber(report?.summary.scannedRecords || 0)}
                    </strong>
                    <span>سجل تم فحصه</span>
                </div>
            </div>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
                flexWrap: 'wrap',
                marginBottom: '12px'
            }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <select
                        value={severityFilter}
                        onChange={(event) => setSeverityFilter(event.target.value as 'all' | DataQualitySeverity)}
                        disabled={loading}
                        className="form-input"
                        style={{ width: '180px', padding: '8px 10px' }}
                    >
                        <option value="all">كل درجات الخطورة</option>
                        <option value="high">حرجة</option>
                        <option value="medium">متوسطة</option>
                        <option value="low">تنبيه</option>
                    </select>

                    <select
                        value={categoryFilter}
                        onChange={(event) => setCategoryFilter(event.target.value as 'all' | DataQualityCategory)}
                        disabled={loading}
                        className="form-input"
                        style={{ width: '190px', padding: '8px 10px' }}
                    >
                        <option value="all">كل أنواع المشاكل</option>
                        <option value="duplicates">تكرار</option>
                        <option value="missing">نواقص</option>
                        <option value="range">نطاق القيم</option>
                        <option value="consistency">اتساق الإجماليات</option>
                        <option value="naming">توحيد المسميات</option>
                    </select>
                </div>

                {report && (
                    <span style={{ color: '#666', fontSize: '0.9rem', fontWeight: 'bold' }}>
                        المعروض: {formatNumber(filteredIssues.length)} من {formatNumber(report.summary.totalIssues)}
                    </span>
                )}
            </div>

            <div style={{
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'var(--card-bg)'
            }}>
                {loading && (
                    <div style={{ padding: '18px', color: '#666', textAlign: 'center' }}>
                        جاري فحص جودة البيانات...
                    </div>
                )}

                {!loading && error && (
                    <div style={{ padding: '18px', color: '#842029', backgroundColor: '#f8d7da' }}>
                        تعذر تشغيل فحص جودة البيانات حاليا. يرجى المحاولة مرة أخرى.
                    </div>
                )}

                {!loading && !error && report && report.issues.length === 0 && (
                    <div style={{ padding: '18px', color: '#0f5132', backgroundColor: '#d1e7dd' }}>
                        لا توجد مشاكل جودة بيانات واضحة في نطاق الإدارات المتاح لك.
                    </div>
                )}

                {!loading && !error && report && filteredIssues.length === 0 && report.issues.length > 0 && (
                    <div style={{ padding: '18px', color: '#664d03', backgroundColor: '#fff3cd' }}>
                        لا توجد مشاكل تطابق الفلاتر الحالية.
                    </div>
                )}

                {!loading && !error && visibleIssues.map(renderIssue)}

                {!loading && !error && filteredIssues.length > 10 && (
                    <div style={{ padding: '12px 16px', color: '#666', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                        <button
                            onClick={() => setShowAll(value => !value)}
                            style={{
                                background: 'transparent',
                                border: '1px solid #0d6a79',
                                color: '#0d6a79',
                                borderRadius: '6px',
                                padding: '8px 14px',
                                fontWeight: 'bold',
                                cursor: 'pointer'
                            }}
                        >
                            {showAll ? 'عرض أول 10 مشاكل فقط' : `عرض كل المشاكل (${formatNumber(filteredIssues.length)})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
