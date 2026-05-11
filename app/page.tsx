'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout, User, onAuthChange } from '@/lib/auth';
import { departmentsList as departments } from '@/constants/departments';
import { exportAllDataForAI } from '@/lib/aiExportHelper';

export default function Home() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isExporting, setIsExporting] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

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

    const handleAIExport = async () => {
        try {
            setIsExporting('loading');
            const data = await exportAllDataForAI();
            
            // Format current date for the filename
            const today = new Date();
            const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
            const fileName = `gahar_kpi_ai_export_${dateStr}.json`;
            
            // Convert to JSON and create a download link
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", jsonString);
            downloadAnchor.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            
            setIsExporting('success');
            setTimeout(() => {
                setIsExporting('idle');
            }, 3000);
        } catch (error) {
            console.error('Error exporting data for AI:', error);
            setIsExporting('error');
            setTimeout(() => {
                setIsExporting('idle');
            }, 4000);
        }
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

                {(currentUser.role === 'super_admin' || currentUser.role === 'general_viewer') && (
                    <div style={{ 
                        marginTop: '40px', 
                        borderTop: '1px solid #eee', 
                        paddingTop: '30px',
                        textAlign: 'right',
                        direction: 'rtl'
                    }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '15px', color: '#0d6a79', fontWeight: 'bold' }}>
                            🤖 بوابة التحليل الذكي للذكاء الاصطناعي (AI Reporter Portal)
                        </h2>
                        
                        <div style={{
                            background: 'linear-gradient(135deg, #eef9f6 0%, #d8f3ec 100%)',
                            border: '1px solid #a3e2d1',
                            borderRadius: '12px',
                            padding: '25px',
                            boxShadow: '0 4px 15px rgba(13, 106, 121, 0.08)',
                            transition: 'all 0.3s ease',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <p style={{ fontSize: '1rem', color: '#2c5e53', lineHeight: '1.7', marginBottom: '20px' }}>
                                يمكنك الآن تحميل قاعدة البيانات الكاملة لكافة إدارات وأقسام بوابة GAHAR بضغطة زر واحدة. 
                                هذا الملف مُهيكل ومُنسق خصيصاً لتقوم بوضعه مباشرة داخل <strong>Claude Pro</strong> أو <strong>Gemini Advanced</strong> أو <strong>ChatGPT</strong>، 
                                لتبدأ فوراً محادثة ذكية لاستخراج كافة أنواع التقارير المخصصة والمقارنات والتحليلات البيانية المعقدة لأي أقسام أو فترات زمنية تريدها.
                            </p>

                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '15px' }}>
                                <button
                                    onClick={handleAIExport}
                                    disabled={isExporting === 'loading'}
                                    style={{
                                        backgroundColor: isExporting === 'loading' ? '#6c757d' : isExporting === 'success' ? '#28a745' : isExporting === 'error' ? '#dc3545' : '#0d6a79',
                                        color: 'white',
                                        border: 'none',
                                        padding: '12px 25px',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer',
                                        boxShadow: '0 4px 12px rgba(13, 106, 121, 0.2)',
                                        transition: 'all 0.2s ease',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px'
                                    }}
                                >
                                    {isExporting === 'loading' && 'جاري تجميع البيانات وتحضيرها...'}
                                    {isExporting === 'success' && '✓ تم التحميل بنجاح!'}
                                    {isExporting === 'error' && '✕ حدث خطأ أثناء التجميع'}
                                    {isExporting === 'idle' && '⬇ تحميل البيانات الذكية للتحليل (AI Export)'}
                                </button>

                                <div style={{ fontSize: '0.85rem', color: '#568b7f', fontWeight: '500' }}>
                                    💡 <em>تلميحة: اسحب الملف الناتج وضعه داخل Claude أو Gemini وقم بسؤاله مباشرة عما تريد!</em>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
