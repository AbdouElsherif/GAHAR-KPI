'use client';

import { useState, useEffect, useCallback, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, User, onAuthChange } from '@/lib/auth';
import { getMOHKPIs, saveMOHKPI, updateMOHKPI, deleteMOHKPI, MOHKPI } from '@/lib/firestore';

const emptyKPI: Omit<MOHKPI, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'> = {
    name: '',
    unit: '',
    department: '',
    annualTarget: '',
    fiscalYear: '2024-2025',
    q1: { target: '', achieved: '' },
    q2: { target: '', achieved: '' },
    q3: { target: '', achieved: '' },
    q4: { target: '', achieved: '' }
};

// Helper functions for table
const getAchievementPercentage = (target: number | string, achieved: number | string): number => {
    const targetNum = typeof target === 'string' ? parseFloat(target.replace(/[^\d.]/g, '')) : target;
    const achievedNum = typeof achieved === 'string' ? parseFloat(achieved.replace(/[^\d.]/g, '')) : achieved;

    if (!targetNum || targetNum === 0) return 100;
    return Math.round((achievedNum / targetNum) * 100);
};

const getStatusColor = (percentage: number): string => {
    if (percentage >= 90) return '#22c55e';
    if (percentage >= 75) return '#eab308';
    return '#ef4444';
};

interface KPITableProps {
    kpis: MOHKPI[];
    userCanEdit: boolean;
    onEdit: (kpi: MOHKPI) => void;
    onDelete: (id: string) => void;
}

// Memoized Table Component
const KPITable = memo(({ kpis, userCanEdit, onEdit, onDelete }: KPITableProps) => {
    console.log('KPITable rendering with', kpis.length, 'KPIs');
    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                marginTop: '20px',
                fontSize: '0.9rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
            }}>
                <thead>
                    <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                        <th rowSpan={2} style={{ padding: '12px', textAlign: 'right', borderRadius: '0 8px 0 0', minWidth: '400px' }}>المؤشر</th>
                        <th rowSpan={2} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>الإدارة</th>
                        <th rowSpan={2} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>الوحدة</th>
                        <th rowSpan={2} style={{ padding: '12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.2)' }}>المستهدف السنوي</th>
                        <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            الربع الأول (Q1)
                        </th>
                        <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            الربع الثاني (Q2)
                        </th>
                        <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            الربع الثالث (Q3)
                        </th>
                        <th colSpan={2} style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>
                            الربع الرابع (Q4)
                        </th>
                        {userCanEdit && (
                            <th rowSpan={2} style={{ padding: '12px', textAlign: 'center', width: '120px' }}>
                                إجراءات
                            </th>
                        )}
                    </tr>
                    <tr style={{ backgroundColor: 'var(--secondary-color)', color: 'white' }}>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>مستهدف</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>منجز</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>مستهدف</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>منجز</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>مستهدف</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>منجز</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>مستهدف</th>
                        <th style={{ padding: '8px', textAlign: 'center', borderLeft: '1px solid rgba(255,255,255,0.2)' }}>منجز</th>
                    </tr>
                </thead>
                <tbody>
                    {kpis.length === 0 ? (
                        <tr>
                            <td colSpan={userCanEdit ? 12 : 11} style={{
                                padding: '60px 20px',
                                textAlign: 'center',
                                color: '#666',
                                fontSize: '1.1rem'
                            }}>
                                <div style={{ marginBottom: '10px', fontSize: '3rem' }}>📊</div>
                                <div style={{ fontWeight: '600', marginBottom: '8px' }}>لا توجد مؤشرات حالياً</div>
                                <div style={{ fontSize: '0.9rem' }}>
                                    {userCanEdit ? 'اضغط "إضافة مؤشر جديد" لإضافة مؤشرات' : 'سيتم إضافة المؤشرات قريباً'}
                                </div>
                            </td>
                        </tr>
                    ) : (
                        kpis.map((kpi, index) => {
                            const q1Percentage = getAchievementPercentage(kpi.q1.target, kpi.q1.achieved);
                            const q2Percentage = getAchievementPercentage(kpi.q2.target, kpi.q2.achieved);
                            const q3Percentage = getAchievementPercentage(kpi.q3.target, kpi.q3.achieved);
                            const q4Percentage = getAchievementPercentage(kpi.q4.target, kpi.q4.achieved);

                            return (
                                <tr key={kpi.id} style={{
                                    borderBottom: '1px solid #eee',
                                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                }}>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{kpi.name}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#555' }}>{kpi.department || '-'}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{kpi.unit}</td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#666', fontWeight: '500' }}>
                                        {kpi.annualTarget || '-'}
                                    </td>

                                    {/* Q1 */}
                                    <td style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid #eee' }}>{kpi.q1.target}</td>
                                    <td style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        borderLeft: '1px solid #ddd',
                                        backgroundColor: `${getStatusColor(q1Percentage)}15`,
                                        color: getStatusColor(q1Percentage),
                                        fontWeight: '600'
                                    }}>
                                        {kpi.q1.achieved}
                                    </td>

                                    {/* Q2 */}
                                    <td style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid #eee' }}>{kpi.q2.target}</td>
                                    <td style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        borderLeft: '1px solid #ddd',
                                        backgroundColor: `${getStatusColor(q2Percentage)}15`,
                                        color: getStatusColor(q2Percentage),
                                        fontWeight: '600'
                                    }}>
                                        {kpi.q2.achieved}
                                    </td>

                                    {/* Q3 */}
                                    <td style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid #eee' }}>{kpi.q3.target}</td>
                                    <td style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        borderLeft: '1px solid #ddd',
                                        backgroundColor: `${getStatusColor(q3Percentage)}15`,
                                        color: getStatusColor(q3Percentage),
                                        fontWeight: '600'
                                    }}>
                                        {kpi.q3.achieved}
                                    </td>

                                    {/* Q4 */}
                                    <td style={{ padding: '12px', textAlign: 'center', borderLeft: '1px solid #eee' }}>{kpi.q4.target}</td>
                                    <td style={{
                                        padding: '12px',
                                        textAlign: 'center',
                                        borderLeft: '1px solid #ddd',
                                        backgroundColor: `${getStatusColor(q4Percentage)}15`,
                                        color: getStatusColor(q4Percentage),
                                        fontWeight: '600'
                                    }}>
                                        {kpi.q4.achieved}
                                    </td>

                                    {userCanEdit && (
                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => onEdit(kpi)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: 'var(--primary-color)',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    تعديل
                                                </button>
                                                <button
                                                    onClick={() => onDelete(kpi.id!)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    حذف
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table >
        </div >
    );
});

KPITable.displayName = 'KPITable';

export default function MOHReportsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [kpis, setKPIs] = useState<MOHKPI[]>([]);
    const [selectedYear, setSelectedYear] = useState('2024-2025');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState(emptyKPI);
    const [submitted, setSubmitted] = useState(false);

    const loadKPIs = useCallback(async (fiscalYear: string) => {
        const data = await getMOHKPIs(fiscalYear);
        setKPIs(data);
    }, []);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user: User | null) => {
            if (!user) {
                router.push('/login');
            } else if (user.role !== 'super_admin') {
                // Only super_admin can access MOH reports
                alert('الصفحة متاحة فقط للمدير العام');
                router.push('/');
            } else {
                setCurrentUser(user);
                setLoading(false);
                await loadKPIs(selectedYear);
            }
        });

        return () => unsubscribe();
    }, [router, loadKPIs, selectedYear]);

    useEffect(() => {
        if (currentUser) {
            loadKPIs(selectedYear);
        }
    }, [selectedYear, currentUser, loadKPIs]);

    const handleYearChange = (year: string) => {
        setSelectedYear(year);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleQuarterChange = (quarter: 'q1' | 'q2' | 'q3' | 'q4', field: 'target' | 'achieved', value: string) => {
        setFormData(prev => ({
            ...prev,
            [quarter]: {
                ...prev[quarter],
                [field]: value
            }
        }));
    };

    const handleAddNew = () => {
        setFormData({
            ...emptyKPI,
            fiscalYear: selectedYear
        });
        setEditingId(null);
        setShowForm(!showForm);
    };

    const resetForm = () => {
        setFormData({
            ...emptyKPI,
            fiscalYear: selectedYear
        });
        setEditingId(null);
        setShowForm(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('handleSubmit called!', { formData, currentUser });
        if (!currentUser) return;

        try {
            if (editingId) {
                // Update existing KPI
                console.log('Updating KPI:', editingId, formData);
                const result = await updateMOHKPI(editingId, {
                    ...formData,
                    updatedBy: currentUser.id
                });

                if (result.success) {
                    console.log('KPI updated successfully');
                    setSubmitted(true);
                    setTimeout(() => setSubmitted(false), 3000);
                    resetForm();
                    await loadKPIs(selectedYear);
                } else {
                    console.error('Failed to update KPI:', result.error);
                    alert(`فشل في تحديث المؤشر: ${result.error}`);
                }
            } else {
                // Create new KPI
                console.log('Creating new KPI:', formData);
                const docId = await saveMOHKPI({
                    ...formData,
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    console.log('KPI created successfully with ID:', docId);
                    setSubmitted(true);
                    setTimeout(() => setSubmitted(false), 3000);
                    resetForm();
                    // إعادة تحميل البيانات
                    await loadKPIs(selectedYear);
                } else {
                    console.error('Failed to create KPI');
                    alert('فشل في حفظ المؤشر. يرجى المحاولة مرة أخرى.');
                }
            }
        } catch (error) {
            console.error('Error in handleSubmit:', error);
            alert('حدث خطأ. يرجى التحقق من Console للمزيد من التفاصيل.');
        }
    };

    const handleEdit = useCallback((kpi: MOHKPI) => {
        setEditingId(kpi.id || null);
        setFormData({
            name: kpi.name,
            unit: kpi.unit,
            department: kpi.department || '',
            annualTarget: kpi.annualTarget || '',
            fiscalYear: kpi.fiscalYear,
            q1: kpi.q1,
            q2: kpi.q2,
            q3: kpi.q3,
            q4: kpi.q4
        });
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا المؤشر؟')) return;

        const success = await deleteMOHKPI(id);
        if (success) {
            await loadKPIs(selectedYear);
        }
    }, [loadKPIs, selectedYear]);

    // تحديد ما إذا كان المنجز قد وصل إلى 100%
    // الأرباع التالية تصبح اختيارية عندما يصل المنجز لـ 100% (لجميع أنواع المؤشرات)
    const isQuarterComplete = (target: string | number, achieved: string | number): boolean => {
        if (!achieved) return false;
        const achievedNum = typeof achieved === 'string' ? parseFloat(achieved.replace(/[^\d.]/g, '')) : achieved;
        // تحقق إذا كانت قيمة المنجز >= 100
        return achievedNum >= 100;
    };

    // تحديد الأرباع التي يجب تعطيلها بناءً على إنجاز الأرباع السابقة
    const getDisabledQuarters = (): Set<string> => {
        const disabled = new Set<string>();

        // إذا وصل Q1 إلى 100%، تعطيل Q2, Q3, Q4
        if (isQuarterComplete(formData.q1.target, formData.q1.achieved)) {
            disabled.add('q2');
            disabled.add('q3');
            disabled.add('q4');
        }
        // إذا وصل Q2 إلى 100%، تعطيل Q3, Q4
        else if (isQuarterComplete(formData.q2.target, formData.q2.achieved)) {
            disabled.add('q3');
            disabled.add('q4');
        }
        // إذا وصل Q3 إلى 100%، تعطيل Q4
        else if (isQuarterComplete(formData.q3.target, formData.q3.achieved)) {
            disabled.add('q4');
        }

        return disabled;
    };

    if (loading || !currentUser) return null;

    const userCanEdit = currentUser.role === 'super_admin';

    return (
        <div className="container" style={{ padding: '40px 0', maxWidth: '1400px' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 className="page-title" style={{ fontSize: '1.8rem', margin: 0 }}>
                        تقارير وزارة الصحة - مؤشرات الأداء
                    </h1>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                        <select
                            value={selectedYear}
                            onChange={(e) => handleYearChange(e.target.value)}
                            className="form-input"
                            style={{ width: 'auto', padding: '8px 12px' }}
                        >
                            <option value="2024-2025">السنة المالية 2024-2025</option>
                            <option value="2023-2024">السنة المالية 2023-2024</option>
                            <option value="2025-2026">السنة المالية 2025-2026</option>
                        </select>
                        <Link href="/" className="btn btn-secondary">
                            العودة للرئيسية
                        </Link>
                    </div>
                </div>

                <div style={{
                    backgroundColor: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '20px',
                    fontSize: '0.9rem',
                    color: '#666'
                }}>
                    <strong>ملاحظة:</strong> السنة المالية تبدأ من يوليو:
                    <span style={{ marginRight: '10px' }}>
                        • الربع الأول (يوليو-سبتمبر)
                        • الربع الثاني (أكتوبر-ديسمبر)
                        • الربع الثالث (يناير-مارس)
                        • الربع الرابع (أبريل-يونيو)
                    </span>
                </div>

                {userCanEdit && (
                    <>
                        <div style={{ marginBottom: '20px' }}>
                            <button
                                onClick={handleAddNew}
                                className="btn btn-primary"
                            >
                                {showForm ? 'إلغاء' : '+ إضافة مؤشر جديد'}
                            </button>
                        </div>

                        {showForm && (
                            <div style={{
                                padding: '20px',
                                backgroundColor: 'var(--background-color)',
                                borderRadius: '8px',
                                marginBottom: '20px'
                            }}>
                                <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)' }}>
                                    {editingId ? 'تعديل المؤشر' : 'إضافة مؤشر جديد'}
                                </h3>

                                {submitted && (
                                    <div style={{
                                        padding: '15px',
                                        backgroundColor: '#d4edda',
                                        color: '#155724',
                                        borderRadius: '8px',
                                        marginBottom: '15px',
                                        border: '1px solid #c3e6cb'
                                    }}>
                                        <strong>تم بنجاح!</strong> تم {editingId ? 'تحديث' : 'حفظ'} المؤشر بنجاح.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                                        <div className="form-group">
                                            <label className="form-label">اسم المؤشر *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.name}
                                                onChange={(e) => handleInputChange('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">الوحدة *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.unit}
                                                onChange={(e) => handleInputChange('unit', e.target.value)}
                                                placeholder="مثال: %، منشأة، برنامج"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">الإدارة المسؤولة</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.department || ''}
                                                onChange={(e) => handleInputChange('department', e.target.value)}
                                                placeholder="اختياري"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">المستهدف السنوي</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={formData.annualTarget || ''}
                                                onChange={(e) => handleInputChange('annualTarget', e.target.value)}
                                                placeholder="اختياري"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">السنة المالية *</label>
                                            <select
                                                className="form-input"
                                                value={formData.fiscalYear}
                                                onChange={(e) => handleInputChange('fiscalYear', e.target.value)}
                                                required
                                            >
                                                <option value="2024-2025">2024-2025</option>
                                                <option value="2023-2024">2023-2024</option>
                                                <option value="2025-2026">2025-2026</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div style={{ marginBottom: '15px' }}>
                                        <h4 style={{ marginBottom: '10px', color: 'var(--secondary-color)' }}>البيانات الربع سنوية</h4>
                                    </div>

                                    {(['q1', 'q2', 'q3', 'q4'] as const).map((quarter, idx) => {
                                        const quarterNames = ['الربع الأول', 'الربع الثاني', 'الربع الثالث', 'الربع الرابع'];
                                        const optionalQuarters = getDisabledQuarters();
                                        const isOptional = optionalQuarters.has(quarter);

                                        return (
                                            <div key={quarter} style={{
                                                marginBottom: '15px',
                                                padding: '15px',
                                                backgroundColor: 'white',
                                                borderRadius: '8px',
                                                border: '1px solid #e0e0e0'
                                            }}>
                                                <h5 style={{ marginBottom: '10px', color: 'var(--primary-color)' }}>
                                                    {quarterNames[idx]} ({quarter.toUpperCase()})
                                                </h5>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                    <div className="form-group">
                                                        <label className="form-label">المستهدف {!isOptional && '*'}</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={formData[quarter].target}
                                                            onChange={(e) => handleQuarterChange(quarter, 'target', e.target.value)}
                                                            required={!isOptional}
                                                        />
                                                    </div>
                                                    <div className="form-group">
                                                        <label className="form-label">المنجز {!isOptional && '*'}</label>
                                                        <input
                                                            type="text"
                                                            className="form-input"
                                                            value={formData[quarter].achieved}
                                                            onChange={(e) => handleQuarterChange(quarter, 'achieved', e.target.value)}
                                                            required={!isOptional}
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                        <button type="submit" className="btn btn-primary">
                                            {editingId ? 'تحديث المؤشر' : 'حفظ المؤشر'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="btn btn-secondary"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </>
                )}

                <KPITable
                    kpis={kpis}
                    userCanEdit={userCanEdit}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />

                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f0f9ff',
                    borderRadius: '8px',
                    fontSize: '0.85rem'
                }}>
                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <span style={{ fontWeight: '600' }}>دلالات الألوان:</span>
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '16px', height: '16px', backgroundColor: '#22c55e', borderRadius: '3px' }}></div>
                                <span>90-100% (ممتاز)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '16px', height: '16px', backgroundColor: '#eab308', borderRadius: '3px' }}></div>
                                <span>75-89% (جيد)</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <div style={{ width: '16px', height: '16px', backgroundColor: '#ef4444', borderRadius: '3px' }}></div>
                                <span>&lt; 75% (يحتاج تحسين)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
}
