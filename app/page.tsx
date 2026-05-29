'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, logout, User, onAuthChange } from '@/lib/auth';
import { departmentsList as departments } from '@/constants/departments';
import { exportAllDataForAI } from '@/lib/aiExportHelper';
import AchievementHighlightsButton from '@/components/AchievementHighlightsButton';
import NotificationCenter from '@/components/NotificationCenter';
import DataQualityCenter from '@/components/DataQualityCenter';

export default function Home() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isFirstLoad, setIsFirstLoad] = useState(true);
    const [isExporting, setIsExporting] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [isAIExportModalOpen, setIsAIExportModalOpen] = useState(false);
    const [aiExportPeriodType, setAIExportPeriodType] = useState('all');
    const [aiExportMonth, setAIExportMonth] = useState('');
    const [aiExportQuarter, setAIExportQuarter] = useState('1');
    const [aiExportHalfYear, setAIExportHalfYear] = useState('1');
    const [aiExportYear, setAIExportYear] = useState(new Date().getFullYear().toString());
    const [aiExportDepartmentIds, setAIExportDepartmentIds] = useState<string[]>(departments.map(dept => dept.id));
    const [promptCopyStatus, setPromptCopyStatus] = useState<'idle' | 'copied' | 'error'>('idle');

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

    const buildAIExportFilter = (): string | null => {
        if (aiExportPeriodType === 'month') {
            if (!aiExportMonth) {
                alert('يرجى اختيار الشهر');
                return null;
            }
            return aiExportMonth;
        }

        if (aiExportPeriodType === 'quarter') return `Q${aiExportQuarter}-${aiExportYear}`;
        if (aiExportPeriodType === 'halfYear') return `H${aiExportHalfYear}-${aiExportYear}`;
        if (aiExportPeriodType === 'year') return `Y-${aiExportYear}`;
        return 'ALL';
    };

    const getAIExportFilterDescription = (filterString: string): string => {
        if (filterString === 'ALL') return 'إجمالي قاعدة البيانات';
        if (/^\d{4}-\d{2}$/.test(filterString)) return `شهر ${filterString}`;
        if (filterString.startsWith('Q')) {
            const [quarter, year] = filterString.split('-');
            return `الربع ${quarter.replace('Q', '')} من عام ${year}`;
        }
        if (filterString.startsWith('H')) {
            const [half, year] = filterString.split('-');
            return `النصف ${half.replace('H', '')} من عام ${year}`;
        }
        if (filterString.startsWith('Y-')) return `عام ${filterString.split('-')[1]}`;
        return filterString;
    };

    const selectedAIExportDepartments = departments.filter(dept => aiExportDepartmentIds.includes(dept.id));

    const buildAIReporterPrompt = (): string | null => {
        const filterString = buildAIExportFilter();
        if (!filterString) return null;

        const selectedNames = selectedAIExportDepartments.map(dept => dept.name).join('، ');
        return [
            'حلل ملف JSON المرفق الخاص ببوابة مؤشرات الأداء GAHAR.',
            `نطاق الفترة: ${getAIExportFilterDescription(filterString)}.`,
            `الإدارات المطلوبة: ${selectedNames || 'كل الإدارات'}.`,
            'ابدأ بملخص تنفيذي قصير، ثم أبرز الاتجاهات، ونقاط القوة، ومناطق التحسين، وأي بيانات ناقصة أو غير متسقة.',
            'استخدم العام المالي الموضح داخل الملف عند إجراء المقارنات السنوية، واذكر أسماء المجموعات التي استندت إليها.'
        ].join('\n');
    };

    const toggleAIExportDepartment = (departmentId: string) => {
        setAIExportDepartmentIds(prev =>
            prev.includes(departmentId)
                ? prev.filter(id => id !== departmentId)
                : [...prev, departmentId]
        );
    };

    const handleCopyAIReporterPrompt = async () => {
        const prompt = buildAIReporterPrompt();
        if (!prompt) return;

        try {
            await navigator.clipboard.writeText(prompt);
            setPromptCopyStatus('copied');
            setTimeout(() => setPromptCopyStatus('idle'), 2500);
        } catch (error) {
            console.error('Error copying AI reporter prompt:', error);
            setPromptCopyStatus('error');
            setTimeout(() => setPromptCopyStatus('idle'), 3000);
        }
    };

    const handleAIExport = async () => {
        const filterString = buildAIExportFilter();
        if (!filterString) return;
        if (aiExportDepartmentIds.length === 0) {
            alert('يرجى اختيار إدارة واحدة على الأقل');
            return;
        }

        try {
            setIsExporting('loading');
            const data = await exportAllDataForAI({
                filterString,
                departmentIds: aiExportDepartmentIds
            });
            
            // Format current date for the filename
            const today = new Date();
            const dateStr = `${today.getFullYear()}_${String(today.getMonth() + 1).padStart(2, '0')}_${String(today.getDate()).padStart(2, '0')}`;
            const periodSuffix = filterString === 'ALL' ? 'all' : filterString.replace(/[^a-zA-Z0-9-]/g, '_');
            const departmentSuffix = aiExportDepartmentIds.length === departments.length ? 'all_departments' : aiExportDepartmentIds.join('_');
            const fileName = `gahar_kpi_ai_export_${departmentSuffix}_${periodSuffix}_${dateStr}.json`;
            
            // Convert to JSON and create a download link
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", jsonString);
            downloadAnchor.setAttribute("download", fileName);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
            
            setIsExporting('success');
            setIsAIExportModalOpen(false);
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
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 7 }, (_, i) => (currentYear - i).toString());

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

                {(currentUser.role === 'super_admin' || currentUser.role === 'general_viewer') && (
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                        <AchievementHighlightsButton />
                    </div>
                )}

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

                <NotificationCenter currentUser={currentUser} />

                <DataQualityCenter currentUser={currentUser} />

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
                                    onClick={() => setIsAIExportModalOpen(true)}
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

                {isAIExportModalOpen && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        zIndex: 9999,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        padding: '20px',
                        direction: 'rtl',
                        textAlign: 'right'
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '8px',
                            width: '100%',
                            maxWidth: '520px',
                            overflow: 'hidden',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{
                                backgroundColor: '#0d6a79',
                                color: 'white',
                                padding: '15px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                gap: '15px'
                            }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>
                                    تصدير بيانات AI Reporter
                                </h3>
                                <button
                                    onClick={() => isExporting !== 'loading' && setIsAIExportModalOpen(false)}
                                    disabled={isExporting === 'loading'}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        color: 'white',
                                        cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer',
                                        fontSize: '1.5rem',
                                        lineHeight: 1
                                    }}
                                >
                                    &times;
                                </button>
                            </div>

                            <div style={{ padding: '20px' }}>
                                <p style={{ color: '#555', marginBottom: '18px', lineHeight: '1.6', fontSize: '0.95rem' }}>
                                    اختر ما إذا كنت تريد تصدير إجمالي قاعدة البيانات أو تصدير فترة محددة فقط داخل ملف JSON.
                                </p>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                            نطاق التصدير
                                        </label>
                                        <select
                                            value={aiExportPeriodType}
                                            onChange={(e) => setAIExportPeriodType(e.target.value)}
                                            disabled={isExporting === 'loading'}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                        >
                                            <option value="all">إجمالي قاعدة البيانات</option>
                                            <option value="month">شهر محدد</option>
                                            <option value="quarter">ربع سنة</option>
                                            <option value="halfYear">نصف سنة</option>
                                            <option value="year">سنة كاملة</option>
                                        </select>
                                    </div>

                                    {aiExportPeriodType === 'month' && (
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                                الشهر
                                            </label>
                                            <input
                                                type="month"
                                                value={aiExportMonth}
                                                onChange={(e) => setAIExportMonth(e.target.value)}
                                                disabled={isExporting === 'loading'}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                            />
                                        </div>
                                    )}

                                    {aiExportPeriodType === 'quarter' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ flex: 2 }}>
                                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                                    الربع
                                                </label>
                                                <select
                                                    value={aiExportQuarter}
                                                    onChange={(e) => setAIExportQuarter(e.target.value)}
                                                    disabled={isExporting === 'loading'}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                                >
                                                    <option value="1">الربع الأول (يناير - مارس)</option>
                                                    <option value="2">الربع الثاني (أبريل - يونيو)</option>
                                                    <option value="3">الربع الثالث (يوليو - سبتمبر)</option>
                                                    <option value="4">الربع الرابع (أكتوبر - ديسمبر)</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                                    السنة
                                                </label>
                                                <select
                                                    value={aiExportYear}
                                                    onChange={(e) => setAIExportYear(e.target.value)}
                                                    disabled={isExporting === 'loading'}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                                >
                                                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {aiExportPeriodType === 'halfYear' && (
                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <div style={{ flex: 2 }}>
                                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                                    النصف
                                                </label>
                                                <select
                                                    value={aiExportHalfYear}
                                                    onChange={(e) => setAIExportHalfYear(e.target.value)}
                                                    disabled={isExporting === 'loading'}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                                >
                                                    <option value="1">النصف الأول (يناير - يونيو)</option>
                                                    <option value="2">النصف الثاني (يوليو - ديسمبر)</option>
                                                </select>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                                    السنة
                                                </label>
                                                <select
                                                    value={aiExportYear}
                                                    onChange={(e) => setAIExportYear(e.target.value)}
                                                    disabled={isExporting === 'loading'}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                                >
                                                    {years.map(year => <option key={year} value={year}>{year}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {aiExportPeriodType === 'year' && (
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                                                السنة
                                            </label>
                                            <select
                                                value={aiExportYear}
                                                onChange={(e) => setAIExportYear(e.target.value)}
                                                disabled={isExporting === 'loading'}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                            >
                                                {years.map(year => <option key={year} value={year}>{year}</option>)}
                                            </select>
                                        </div>
                                    )}

                                    <div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            gap: '10px',
                                            marginBottom: '8px'
                                        }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', color: '#333' }}>
                                                الإدارات المطلوب تضمينها
                                            </label>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setAIExportDepartmentIds(
                                                        aiExportDepartmentIds.length === departments.length
                                                            ? []
                                                            : departments.map(dept => dept.id)
                                                    );
                                                }}
                                                disabled={isExporting === 'loading'}
                                                style={{
                                                    backgroundColor: '#eef9f6',
                                                    color: '#0d6a79',
                                                    border: '1px solid #a3e2d1',
                                                    borderRadius: '4px',
                                                    padding: '6px 10px',
                                                    cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer',
                                                    fontSize: '0.85rem',
                                                    fontWeight: 'bold'
                                                }}
                                            >
                                                {aiExportDepartmentIds.length === departments.length ? 'إلغاء تحديد الكل' : 'تحديد الكل'}
                                            </button>
                                        </div>

                                        <div style={{
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                                            gap: '8px',
                                            maxHeight: '190px',
                                            overflowY: 'auto',
                                            border: '1px solid #ddd',
                                            borderRadius: '6px',
                                            padding: '10px',
                                            backgroundColor: '#fbfbfb'
                                        }}>
                                            {departments.map(dept => (
                                                <label
                                                    key={dept.id}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        color: '#333',
                                                        fontSize: '0.9rem',
                                                        lineHeight: '1.4',
                                                        cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={aiExportDepartmentIds.includes(dept.id)}
                                                        onChange={() => toggleAIExportDepartment(dept.id)}
                                                        disabled={isExporting === 'loading'}
                                                    />
                                                    <span>{dept.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div style={{
                                backgroundColor: '#f8f9fa',
                                padding: '15px 20px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                flexWrap: 'wrap',
                                gap: '10px',
                                borderTop: '1px solid #ddd'
                            }}>
                                <button
                                    onClick={handleCopyAIReporterPrompt}
                                    disabled={isExporting === 'loading'}
                                    className="btn"
                                    style={{
                                        backgroundColor: promptCopyStatus === 'copied' ? '#198754' : promptCopyStatus === 'error' ? '#dc3545' : 'white',
                                        color: promptCopyStatus === 'idle' ? '#0d6a79' : 'white',
                                        border: '1px solid #0d6a79',
                                        padding: '10px 16px',
                                        borderRadius: '4px',
                                        cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    {promptCopyStatus === 'copied' && 'تم نسخ الـ Prompt'}
                                    {promptCopyStatus === 'error' && 'تعذر النسخ'}
                                    {promptCopyStatus === 'idle' && 'نسخ Prompt جاهز'}
                                </button>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                                <button
                                    onClick={() => setIsAIExportModalOpen(false)}
                                    disabled={isExporting === 'loading'}
                                    className="btn"
                                    style={{
                                        backgroundColor: '#6c757d',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold'
                                    }}
                                >
                                    إلغاء
                                </button>
                                <button
                                    onClick={handleAIExport}
                                    disabled={isExporting === 'loading'}
                                    className="btn"
                                    style={{
                                        backgroundColor: '#0d6a79',
                                        color: 'white',
                                        border: 'none',
                                        padding: '10px 20px',
                                        borderRadius: '4px',
                                        cursor: isExporting === 'loading' ? 'not-allowed' : 'pointer',
                                        fontSize: '0.95rem',
                                        fontWeight: 'bold',
                                        opacity: isExporting === 'loading' ? 0.7 : 1
                                    }}
                                >
                                    {isExporting === 'loading' ? 'جاري التصدير...' : 'تصدير الآن'}
                                </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
