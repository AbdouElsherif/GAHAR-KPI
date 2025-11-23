'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, onAuthChange, User } from '@/lib/auth';
import { getAllKPIData, KPIData } from '@/lib/firestore';

const departments: Record<string, string> = {
    'dept1': 'الإدارة العامة للتدريب للغير',
    'dept2': 'الإدارة العامة للدعم الفني',
    'dept3': 'الإدارة العامة لرضاء المتعاملين',
    'dept4': 'الإدارة العامة للرقابة الفنية والإكلينيكية',
    'dept5': 'الإدارة العامة للرقابة الإدارية على المنشآت الصحية',
    'dept6': 'الإدارة العامة للاعتماد والتسجيل',
    'dept7': 'الإدارة العامة لتسجيل أعضاء المهن الطبية',
    'dept8': 'الإدارة العامة لأبحاث وتطوير المعايير',
};

export default function DashboardPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [allData, setAllData] = useState<KPIData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user: User | null) => {
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUser(user);

            // Load all KPI data
            const data = await getAllKPIData();

            // Filter data based on user role
            if (user.role === 'super_admin') {
                setAllData(data);
            } else if (user.departmentId) {
                setAllData(data.filter((item: KPIData) => item.departmentId === user.departmentId));
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, [router]);

    // Calculate statistics
    const getStats = () => {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthData = allData.filter(
            item => parseInt(item.month) === currentMonth && item.year === currentYear
        );

        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        const lastMonthData = allData.filter(
            item => parseInt(item.month) === lastMonth && item.year === lastMonthYear
        );

        // Calculate totals for various metrics
        const calculateTotal = (data: KPIData[], fields: string[]) => {
            return data.reduce((sum, item) => {
                return sum + fields.reduce((fieldSum, field) => {
                    const value = parseInt(item.data[field]) || 0;
                    return fieldSum + value;
                }, 0);
            }, 0);
        };

        // Training programs (dept1)
        const trainingFields = ['trainingPrograms', 'trainees'];
        const currentTraining = calculateTotal(
            currentMonthData.filter(d => d.departmentId === 'dept1'),
            trainingFields
        );
        const lastTraining = calculateTotal(
            lastMonthData.filter(d => d.departmentId === 'dept1'),
            trainingFields
        );

        // Field visits (dept2, dept4, dept5)
        const visitFields = ['fieldVisits', 'totalFieldVisits', 'introVisits', 'fieldSupportVisits'];
        const currentVisits = calculateTotal(
            currentMonthData.filter(d => ['dept2', 'dept4', 'dept5'].includes(d.departmentId)),
            visitFields
        );
        const lastVisits = calculateTotal(
            lastMonthData.filter(d => ['dept2', 'dept4', 'dept5'].includes(d.departmentId)),
            visitFields
        );

        return {
            totalDepartments: currentUser?.role === 'super_admin' ? Object.keys(departments).length : 1,
            totalEntries: allData.length,
            currentMonthEntries: currentMonthData.length,
            trainingChange: lastTraining > 0 ? ((currentTraining - lastTraining) / lastTraining * 100).toFixed(1) : '0',
            visitsChange: lastVisits > 0 ? ((currentVisits - lastVisits) / lastVisits * 100).toFixed(1) : '0',
        };
    };

    // Get recent entries (last 10)
    const getRecentEntries = () => {
        return allData.slice(0, 10);
    };

    // Get department breakdown
    const getDepartmentBreakdown = () => {
        const breakdown: Record<string, number> = {};
        allData.forEach(item => {
            breakdown[item.departmentId] = (breakdown[item.departmentId] || 0) + 1;
        });
        return breakdown;
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
                <div style={{ fontSize: '1.2rem', color: 'var(--primary-color)' }}>جاري التحميل...</div>
            </div>
        );
    }

    if (!currentUser) return null;

    const stats = getStats();
    const recentEntries = getRecentEntries();
    const departmentBreakdown = getDepartmentBreakdown();

    return (
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: '1.8rem' }}>لوحة التحكم العامة</h1>
                <Link href="/" className="btn btn-secondary">العودة للرئيسية</Link>
            </div>

            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ background: 'linear-gradient(135deg, #0eacb8 0%, #0c98a3 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.9 }}>عدد الإدارات</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalDepartments}</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.9 }}>إجمالي البيانات المُدخلة</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.totalEntries}</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.9 }}>بيانات الشهر الحالي</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>{stats.currentMonthEntries}</div>
                </div>

                <div className="card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                    <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', opacity: 0.9 }}>التغيير في الزيارات</h3>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold' }}>
                        {stats.visitsChange}%
                        <span style={{ fontSize: '1rem', marginRight: '5px' }}>{parseFloat(stats.visitsChange) >= 0 ? '↑' : '↓'}</span>
                    </div>
                </div>
            </div>

            {/* Department Breakdown */}
            {currentUser.role === 'super_admin' && (
                <div className="card" style={{ marginBottom: '30px' }}>
                    <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>التوزيع حسب الإدارات</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px' }}>
                        {Object.entries(departmentBreakdown).map(([deptId, count]) => (
                            <div key={deptId} style={{ padding: '15px', backgroundColor: 'var(--background-color)', borderRadius: '8px', borderRight: '4px solid var(--primary-color)' }}>
                                <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '5px' }}>{departments[deptId]}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>{count} سجل</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Recent Entries */}
            <div className="card">
                <h2 style={{ marginBottom: '20px', color: 'var(--primary-color)' }}>آخر البيانات المُدخلة</h2>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الإدارة</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الشهر</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>السنة</th>
                                <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>تاريخ الإدخال</th>
                                <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentEntries.map((entry, index) => (
                                <tr key={entry.id || index} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{departments[entry.departmentId]}</td>
                                    <td style={{ padding: '12px' }}>
                                        {new Date(entry.year, parseInt(entry.month)).toLocaleDateString('ar-EG', { month: 'long' })}
                                    </td>
                                    <td style={{ padding: '12px' }}>{entry.year}</td>
                                    <td style={{ padding: '12px', fontSize: '0.9rem', color: '#666' }}>
                                        {entry.createdAt ? new Date(entry.createdAt).toLocaleDateString('ar-EG') : '-'}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <Link
                                            href={`/department/${entry.departmentId}`}
                                            className="btn"
                                            style={{ padding: '6px 12px', fontSize: '0.85rem', backgroundColor: 'var(--primary-color)', color: 'white' }}
                                        >
                                            عرض التفاصيل
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
