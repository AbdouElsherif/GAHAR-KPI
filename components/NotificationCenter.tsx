'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { departmentsList, departmentFields } from '@/constants/departments';
import { getAllKPIData, KPIData } from '@/lib/firestore';
import { User } from '@/lib/auth';

type NotificationPriority = 'high' | 'medium' | 'low';

interface PortalNotification {
    id: string;
    departmentId: string;
    departmentName: string;
    priority: NotificationPriority;
    title: string;
    details: string;
}

interface NotificationCenterProps {
    currentUser: User;
}

const formatMonthKey = (date: Date) => {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
};

const getDueMonthForEntryAlert = () => {
    const now = new Date();
    if (now.getDate() < 7) return null;

    return formatMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
};

const getRecordMonth = (record: KPIData): string => {
    const value = record.data?.date || record.month || '';
    if (typeof value === 'string') {
        const match = value.match(/^(\d{4})-(\d{1,2})/);
        if (match) return `${match[1]}-${match[2].padStart(2, '0')}`;
    }
    return '';
};

const isEmptyValue = (value: any) => value === undefined || value === null || value === '';

const priorityStyles: Record<NotificationPriority, { label: string; color: string; background: string; border: string }> = {
    high: {
        label: 'عاجل',
        color: '#842029',
        background: '#f8d7da',
        border: '#f1aeb5'
    },
    medium: {
        label: 'آخر تحديث قديم',
        color: '#664d03',
        background: '#fff3cd',
        border: '#ffecb5'
    },
    low: {
        label: 'معلومة',
        color: '#055160',
        background: '#cff4fc',
        border: '#9eeaf9'
    }
};

export default function NotificationCenter({ currentUser }: NotificationCenterProps) {
    const [kpiData, setKpiData] = useState<KPIData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const visibleDepartments = useMemo(() => {
        if (currentUser.role === 'super_admin' || currentUser.role === 'general_viewer') {
            return departmentsList;
        }

        return departmentsList.filter(department => department.id === currentUser.departmentId);
    }, [currentUser.departmentId, currentUser.role]);

    const loadNotificationsData = async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await getAllKPIData();
            setKpiData(data);
        } catch (loadError) {
            console.error('Error loading notification center data:', loadError);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadNotificationsData();
    }, []);

    const notifications = useMemo<PortalNotification[]>(() => {
        const dueMonth = getDueMonthForEntryAlert();

        return visibleDepartments.flatMap(department => {
            const departmentKpis = kpiData
                .filter(record => record.departmentId === department.id)
                .map(record => ({ ...record, normalizedMonth: getRecordMonth(record) }))
                .sort((a, b) => b.normalizedMonth.localeCompare(a.normalizedMonth));

            const departmentNotifications: PortalNotification[] = [];

            if (departmentKpis.length === 0) {
                if (dueMonth) {
                    departmentNotifications.push({
                        id: `${department.id}-missing-due-month`,
                        departmentId: department.id,
                        departmentName: department.name,
                        priority: 'high',
                        title: 'بيانات الشهر المستحق غير مدخلة',
                        details: `لم يتم العثور على بيانات KPI لشهر ${dueMonth}، وقد بدأ التنبيه اعتبارا من اليوم السابع من الشهر التالي.`
                    });
                }
                return departmentNotifications;
            }

            const latestRecord = departmentKpis[0];
            const dueMonthRecord = dueMonth
                ? departmentKpis.find(record => record.normalizedMonth === dueMonth)
                : null;

            if (dueMonth && !dueMonthRecord) {
                departmentNotifications.push({
                    id: `${department.id}-missing-due-month`,
                    departmentId: department.id,
                    departmentName: department.name,
                    priority: 'high',
                    title: 'بيانات الشهر المستحق غير مدخلة',
                    details: `لم يتم إدخال بيانات شهر ${dueMonth}. آخر شهر متاح هو ${latestRecord.normalizedMonth || 'غير محدد'}.`
                });
            }

            if (dueMonth && latestRecord.normalizedMonth && latestRecord.normalizedMonth < dueMonth) {
                departmentNotifications.push({
                    id: `${department.id}-stale-data`,
                    departmentId: department.id,
                    departmentName: department.name,
                    priority: 'medium',
                    title: 'آخر تحديث يحتاج متابعة',
                    details: `آخر بيانات مسجلة لهذه الإدارة تخص شهر ${latestRecord.normalizedMonth}.`
                });
            }

            const requiredFields = departmentFields[department.id]?.filter(field => field.required) || [];
            const missingFields = requiredFields
                .filter(field => isEmptyValue(latestRecord.data?.[field.name]))
                .map(field => field.label);

            if (missingFields.length > 0) {
                departmentNotifications.push({
                    id: `${department.id}-missing-required-fields`,
                    departmentId: department.id,
                    departmentName: department.name,
                    priority: 'medium',
                    title: 'حقول مطلوبة ناقصة',
                    details: `آخر سجل يحتوي على حقول مطلوبة غير مكتملة: ${missingFields.slice(0, 3).join('، ')}${missingFields.length > 3 ? '...' : ''}`
                });
            }

            return departmentNotifications;
        });
    }, [kpiData, visibleDepartments]);

    const priorityCounts = useMemo(() => ({
        high: notifications.filter(notification => notification.priority === 'high').length,
        medium: notifications.filter(notification => notification.priority === 'medium').length,
        low: notifications.filter(notification => notification.priority === 'low').length
    }), [notifications]);

    const visibleNotifications = notifications.slice(0, 8);

    return (
        <div style={{
            marginTop: '40px',
            borderTop: '1px solid #eee',
            paddingTop: '30px',
            direction: 'rtl',
            textAlign: 'right'
        }}>
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
                        مركز التنبيهات
                    </h2>
                    <p style={{ margin: 0, color: '#666', fontSize: '0.95rem' }}>
                        متابعة سريعة لاكتمال بيانات الإدارات، مع بدء تنبيه نقص البيانات في اليوم السابع من الشهر التالي.
                    </p>
                </div>

                <button
                    onClick={loadNotificationsData}
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
                    {loading ? 'جاري التحديث...' : 'تحديث التنبيهات'}
                </button>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                gap: '10px',
                marginBottom: '15px'
            }}>
                <div style={{ border: '1px solid #f1aeb5', backgroundColor: '#f8d7da', color: '#842029', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>{priorityCounts.high}</strong>
                    <span>تنبيه عاجل</span>
                </div>
                <div style={{ border: '1px solid #ffecb5', backgroundColor: '#fff3cd', color: '#664d03', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>{priorityCounts.medium}</strong>
                    <span>آخر تحديث قديم</span>
                </div>
                <div style={{ border: '1px solid #a3e2d1', backgroundColor: '#eef9f6', color: '#0d6a79', borderRadius: '8px', padding: '12px' }}>
                    <strong style={{ display: 'block', fontSize: '1.4rem' }}>{visibleDepartments.length}</strong>
                    <span>إجمالي الإدارات المتابعة</span>
                </div>
            </div>

            <div style={{
                border: '1px solid #ddd',
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: 'white'
            }}>
                {loading && (
                    <div style={{ padding: '18px', color: '#666', textAlign: 'center' }}>
                        جاري تحميل التنبيهات...
                    </div>
                )}

                {!loading && error && (
                    <div style={{ padding: '18px', color: '#842029', backgroundColor: '#f8d7da' }}>
                        تعذر تحميل التنبيهات حاليا. يرجى المحاولة مرة أخرى.
                    </div>
                )}

                {!loading && !error && notifications.length === 0 && (
                    <div style={{ padding: '18px', color: '#0f5132', backgroundColor: '#d1e7dd' }}>
                        لا توجد تنبيهات حاليا. بيانات الإدارات المتاحة تبدو مكتملة حسب موعد التنبيه الشهري.
                    </div>
                )}

                {!loading && !error && visibleNotifications.map(notification => {
                    const style = priorityStyles[notification.priority];
                    return (
                        <div
                            key={notification.id}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) auto',
                                gap: '12px',
                                alignItems: 'center',
                                padding: '14px 16px',
                                borderBottom: '1px solid #eee'
                            }}
                        >
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '5px' }}>
                                    <span style={{
                                        backgroundColor: style.background,
                                        border: `1px solid ${style.border}`,
                                        color: style.color,
                                        borderRadius: '999px',
                                        padding: '3px 9px',
                                        fontSize: '0.78rem',
                                        fontWeight: 'bold'
                                    }}>
                                        {style.label}
                                    </span>
                                    <strong style={{ color: '#333' }}>{notification.title}</strong>
                                </div>
                                <div style={{ color: '#555', fontSize: '0.92rem', lineHeight: '1.5' }}>
                                    {notification.departmentName}: {notification.details}
                                </div>
                            </div>

                            <Link
                                href={`/department/${notification.departmentId}`}
                                className="btn"
                                style={{
                                    backgroundColor: '#0d6a79',
                                    color: 'white',
                                    padding: '8px 12px',
                                    borderRadius: '5px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                فتح الإدارة
                            </Link>
                        </div>
                    );
                })}

                {!loading && !error && notifications.length > visibleNotifications.length && (
                    <div style={{ padding: '12px 16px', color: '#666', backgroundColor: '#f8f9fa', textAlign: 'center' }}>
                        يوجد {notifications.length - visibleNotifications.length} تنبيه إضافي. استخدم زر فتح الإدارة لمراجعة البيانات تباعا.
                    </div>
                )}
            </div>
        </div>
    );
}
