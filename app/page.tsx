'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout, User, onAuthChange } from '@/lib/auth';

const departments = [
    { id: 'dept1', name: 'الإدارة العامة للتدريب للغير' },
    { id: 'dept2', name: 'الإدارة العامة للدعم الفني' },
    { id: 'dept3', name: 'الإدارة العامة لرضاء المتعاملين' },
    { id: 'dept4', name: 'الإدارة العامة للرقابة الفنية والإكلينيكية' },
    { id: 'dept5', name: 'الإدارة العامة للرقابة الإدارية على المنشآت الصحية' },
    { id: 'dept6', name: 'الإدارة العامة للاعتماد والتسجيل' },
    { id: 'dept7', name: 'الإدارة العامة لتسجيل أعضاء المهن الطبية' },
    { id: 'dept8', name: 'الإدارة العامة لأبحاث وتطوير المعايير' },
    { id: 'dept9', name: 'الإدارة العامة لشئون المراجعين' },
    { id: 'dept10', name: 'الإدارة العامة للتصميم الصحي الآمن' },
];

export default function Home() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        // Listen to auth state changes
        const unsubscribe = onAuthChange((user: User | null) => {
            if (!user) {
                // Only redirect if we've received at least one auth state (which is null)
                // and it's not the initial state while Firebase is loading persistence
                router.push('/login');
            } else {
                setCurrentUser(user);
                setLoading(false);
            }
            setIsFirstLoad(false);
        });

        return () => unsubscribe();
    }, [router]);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    if (loading || !currentUser) return null;

    // Filter departments based on user role
    const availableDepartments = currentUser.role === 'super_admin' || currentUser.role === 'general_viewer'
        ? departments
        : departments.filter(d => d.id === currentUser.departmentId);

    return (
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 0' }}>
            <div className="card" style={{ textAlign: 'center', padding: '50px 30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <h1 className="page-title" style={{ fontSize: '2rem', marginBottom: '10px' }}>
                            مرحباً بكم في بوابة مؤشرات الأداء - GAHAR
                        </h1>
                        <p style={{ fontSize: '1rem', color: '#666' }}>
                            مرحباً، {currentUser.username} ({currentUser.role === 'super_admin' ? 'مدير عام' : currentUser.role === 'dept_admin' ? 'مدير إدارة' : currentUser.role === 'general_viewer' ? 'مراقب عام' : 'مستخدم عرض'})
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {currentUser.role === 'super_admin' && (
                            <Link href="/admin" className="btn btn-primary">
                                إدارة المستخدمين
                            </Link>
                        )}

                        <Link href="/change-password" className="btn btn-primary" style={{ backgroundColor: '#6c757d', borderColor: '#6c757d' }}>
                            تغيير كلمة المرور
                        </Link>
                        <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#dc3545', color: 'white' }}>
                            تسجيل الخروج
                        </button>
                    </div>
                </div>

                <p style={{ marginBottom: '30px', fontSize: '1.2rem', color: '#555' }}>
                    يرجى اختيار الإدارة الخاصة بك للدخول إلى لوحة المؤشرات.
                </p>

                <div className="department-grid">
                    {availableDepartments.map((dept) => (
                        <Link
                            key={dept.id}
                            href={`/department/${dept.id}`}
                            className="dept-card"
                        >
                            {dept.name}
                        </Link>
                    ))}
                </div>

                {currentUser.role === 'super_admin' && (
                    <div style={{ marginTop: '40px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', color: '#0d6a79' }}>تقارير إضافية</h2>
                        <div className="department-grid">
                            <Link
                                href="/moh-reports"
                                className="dept-card"
                                style={{
                                    backgroundColor: '#f8f9fa',
                                    border: '2px dashed #0d6a79',
                                    color: '#0d6a79'
                                }}
                            >
                                تقارير وزارة الصحة
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
