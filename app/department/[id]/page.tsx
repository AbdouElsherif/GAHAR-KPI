'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, canEdit, canAccessDepartment, User, onAuthChange } from '@/lib/auth';
import { saveKPIData, getKPIData, updateKPIData } from '@/lib/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

interface Field {
    name: string;
    label: string;
    type: 'number' | 'text' | 'date' | 'month';
}

const departmentFields: Record<string, Field[]> = {
    'dept1': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'trainingPrograms', label: 'عدد البرامج التدريبية', type: 'number' },
        { name: 'trainees', label: 'عدد المتدربين', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept2': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'supportPrograms', label: 'عدد برامج الدعم الفني المقدمة', type: 'number' },
        { name: 'introVisits', label: 'زيارات تمهيدية', type: 'number' },
        { name: 'fieldSupportVisits', label: 'زيارات دعم فني ميداني', type: 'number' },
        { name: 'remoteSupportVisits', label: 'زيارات دعم فني عن بعد', type: 'number' },
        { name: 'supportedFacilities', label: 'منشآت حصلت على الدعم الفني', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept3': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'patientExperienceSample', label: 'حجم عينة قياس تجربة مريض', type: 'number' },
        { name: 'staffSatisfactionSample', label: 'حجم عينة قياس رضاء العاملين', type: 'number' },
        { name: 'fieldVisits', label: 'عدد الزيارات الميدانية لاستبيان رضاء المتعاملين', type: 'number' },
        { name: 'surveyedFacilities', label: 'عدد المنشآت التي تم إجراء استبيانات بها', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept4': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'totalFieldVisits', label: 'إجمالي الزيارات الميدانية للرقابة الفنية والإكلينيكية', type: 'number' },
        { name: 'auditVisits', label: 'زيارات التدقيق الفني والإكلينيكي', type: 'number' },
        { name: 'assessmentVisits', label: 'زيارات التقييم الفني والإكلينيكي', type: 'number' },
        { name: 'visitedFacilities', label: 'عدد المنشآت الصحية التي تم إجراء زيارات رقابة فنية وإكلينيكية لها', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept5': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'totalFieldVisits', label: 'إجمالي الزيارات الميدانية', type: 'number' },
        { name: 'adminAuditVisits', label: 'زيارات الرقابة الإدارية (تدقيق إداري وسلامة بيئية)', type: 'number' },
        { name: 'adminInspectionVisits', label: 'زيارات الرقابة الإدارية (تفتيش إداري)', type: 'number' },
        { name: 'followUpVisits', label: 'زيارات الرقابة الإدارية (متابعة)', type: 'number' },
        { name: 'examReferralVisits', label: 'زيارات الرقابة الإدارية (فحص/ إحالة/ تكليف)', type: 'number' },
        { name: 'visitedFacilities', label: 'عدد المنشآت التي تم إجراء زيارات رقابة إدارية لها', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept6': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'newFacilities', label: 'عدد المنشآت الجديدة المتقدمة للتسجيل', type: 'number' },
        { name: 'reviewedAppeals', label: 'عدد الالتماسات التي تمت مراجعتها', type: 'number' },
        { name: 'reviewedPlans', label: 'عدد الخطط التصحيحية التي تمت مراجعتها', type: 'number' },
        { name: 'accreditation', label: 'الاعتماد/ الاعتماد المبدئي', type: 'number' },
        { name: 'renewal', label: 'تجديد الاعتماد', type: 'number' },
        { name: 'completion', label: 'استكمال الاعتماد', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept7': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'registeredMembers', label: 'عدد أعضاء المهن المسجلين', type: 'number' },
        { name: 'facilitiesUpdated', label: 'عدد المنشآت التي تم تسجيل وتحديث أعضاء المهن الطبية بها', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept8': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'standard1', label: 'معايير دور النقاهة والرعاية الممتدة', type: 'number' },
        { name: 'standard2', label: 'معايير السياحة الاستشفائية', type: 'number' },
        { name: 'standard3', label: 'معايير الرعاية الأولية (إصدار 2025)', type: 'number' },
        { name: 'standard4', label: 'الدليل الاسترشادي للتجهيزات الطبية للمستشفيات', type: 'number' },
        { name: 'standard5', label: 'معايير المستشفيات (إصدار 2025)', type: 'number' },
        { name: 'standard6', label: 'معايير التميز للمنشآت الصديقة للأم والطفل', type: 'number' },
        { name: 'standard7', label: 'معايير المعامل الإكلينيكية', type: 'number' },
        { name: 'standard8', label: 'معايير المراكز الطبية المتخصصة وجراحات اليوم الواحد', type: 'number' },
        { name: 'standard9', label: 'معايير الأشعة العلاجية التداخلية والتشخيصية', type: 'number' },
        { name: 'standard10', label: 'معايير مكاتب الصحة المستقلة', type: 'number' },
        { name: 'standard11', label: 'معايير مكاتب الصحة النفسية (الإصدار الثاني)', type: 'number' },
        { name: 'standard12', label: 'معايير التميز الإكلينيكي', type: 'number' },
        { name: 'standard13', label: 'معايير بنوك الدم', type: 'number' },
        { name: 'standard14', label: 'معايير التطبيب عن بعد', type: 'number' },
        { name: 'standard15', label: 'دليل المراجعين', type: 'number' },
        { name: 'standard16', label: 'معايير العلاج الطبيعي (الإصدار الثاني)', type: 'number' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
};

export const dynamicParams = true;

export default function DepartmentPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string;
    const departmentName = departments[id] || 'الإدارة';
    const fields = departmentFields[id] || [];

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [submissions, setSubmissions] = useState<Array<Record<string, any>>>([]);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Filter and sort states
    const [searchText, setSearchText] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [sortColumn, setSortColumn] = useState<string>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user: User | null) => {
            if (!user) {
                router.push('/login');
                return;
            }
            if (!canAccessDepartment(user, id)) {
                router.push('/');
                return;
            }
            setCurrentUser(user);

            // Load KPI data from Firestore
            const kpiData = await getKPIData(id);

            // Sort by date (newest first)
            kpiData.sort((a: any, b: any) => {
                // Assuming createdAt is a Firestore Timestamp or Date object
                const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
                const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
                return dateB.getTime() - dateA.getTime();
            });

            const formattedData = kpiData.map((item: any) => {
                if (!item.createdAt) {
                    return {
                        ...item.data,
                        submittedAt: 'غير محدد',
                        id: item.id
                    };
                }
                const date = item.createdAt instanceof Date ? item.createdAt : item.createdAt.toDate();
                const monthYear = date.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
                return {
                    ...item.data,
                    submittedAt: monthYear,
                    id: item.id
                };
            });
            setSubmissions(formattedData);
        });

        return () => unsubscribe();
    }, [id, router]);

    const handleChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleEdit = (submission: any) => {
        setEditingId(submission.id);
        // Filter out non-form fields
        const { submittedAt, id, ...data } = submission;

        // Fix for date field if it contains full date (YYYY-MM-DD) but field type is month
        const dateField = fields.find(f => f.name === 'date');
        if (dateField && dateField.type === 'month' && data.date && data.date.length > 7) {
            data.date = data.date.substring(0, 7);
        }

        setFormData(data);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setFormData({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        // التحقق من التاريخ - منع التواريخ المستقبلية
        if (formData.date) {
            // التاريخ بصيغة YYYY-MM (للشهر والسنة)
            const [selectedYear, selectedMonth] = formData.date.split('-').map(Number);
            const today = new Date();
            const currentYear = today.getFullYear();
            const currentMonth = today.getMonth() + 1; // getMonth() يبدأ من 0

            // التحقق: هل السنة المختارة أكبر من السنة الحالية؟
            if (selectedYear > currentYear) {
                alert('⚠️ لا يمكن تسجيل بيانات لشهر مستقبلي. الرجاء اختيار الشهر الحالي أو شهر سابق.');
                return;
            }

            // التحقق: إذا كانت نفس السنة، هل الشهر أكبر من الشهر الحالي؟
            if (selectedYear === currentYear && selectedMonth > currentMonth) {
                alert('⚠️ لا يمكن تسجيل بيانات لشهر مستقبلي. الرجاء اختيار الشهر الحالي أو شهر سابق.');
                return;
            }
        }

        if (editingId) {
            // Update existing
            await updateKPIData(editingId, {
                data: formData,
                updatedBy: currentUser.id
            });

            // Update local state
            const newSubmissions = submissions.map(sub =>
                sub.id === editingId
                    ? { ...sub, ...formData }
                    : sub
            );
            setSubmissions(newSubmissions);
            setEditingId(null);
            setSubmitted(true);
            setTimeout(() => setSubmitted(false), 3000);
            setFormData({});
        } else {
            // Create new
            const currentDate = new Date();
            const monthYear = currentDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
            const dataWithTimestamp = {
                ...formData,
                submittedAt: monthYear
            };

            // Save to Firestore
            const docId = await saveKPIData({
                departmentId: id,
                departmentName: departmentName,
                month: new Date().getMonth().toString(),
                year: new Date().getFullYear(),
                data: formData,
                createdBy: currentUser.id,
                updatedBy: currentUser.id
            });

            if (docId) {
                // Update local state
                const newSubmissions = [{ ...dataWithTimestamp, id: docId }, ...submissions];
                setSubmissions(newSubmissions);
                setSubmitted(true);
                setTimeout(() => setSubmitted(false), 3000);
                setFormData({});
            }
        }
    };



    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add font support for Arabic (using a standard font that supports Arabic would be ideal, 
        // but for now we'll use default and hope for the best or use a workaround if needed.
        // Note: jsPDF default fonts don't support Arabic well. We might need a custom font.
        // For this iteration, we will try basic export. If Arabic fails, we'll need to add a font.)

        doc.text(`تقرير ${departmentName}`, 100, 10, { align: 'center' });

        const tableColumn = fields.map(f => f.label);
        const tableRows = submissions.map(sub =>
            fields.map(f => {
                if (f.name === 'date' && sub[f.name]) {
                    // Handle both YYYY-MM and YYYY-MM-DD
                    const dateVal = sub[f.name].length === 7 ? sub[f.name] + '-01' : sub[f.name];
                    return new Date(dateVal).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
                }
                return sub[f.name] || '-';
            })
        );

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { font: 'helvetica', halign: 'right' },
            headStyles: { fillColor: [14, 172, 184] },
        });

        doc.save(`${departmentName}_report.pdf`);
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        const dataForExcel = submissions.map(sub => {
            const row: Record<string, any> = {};
            fields.forEach(f => {
                if (f.name === 'date' && sub[f.name]) {
                    // Handle both YYYY-MM and YYYY-MM-DD
                    const dateVal = sub[f.name].length === 7 ? sub[f.name] + '-01' : sub[f.name];
                    row[f.label] = new Date(dateVal).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
                } else {
                    row[f.label] = sub[f.name] || '-';
                }
            });
            return row;
        });

        const ws = XLSX.utils.json_to_sheet(dataForExcel);

        // Adjust column widths
        const wscols = [{ wch: 20 }, ...fields.map(() => ({ wch: 20 }))];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${departmentName}_report.xlsx`);
    };

    if (!currentUser) return null;

    const userCanEdit = canEdit(currentUser);

    // Filter and sort functions
    const getFilteredAndSortedSubmissions = () => {
        let filtered = [...submissions];

        // Apply search filter
        if (searchText.trim()) {
            const search = searchText.toLowerCase();
            filtered = filtered.filter(sub => {
                // Search in all fields except notes
                return fields.some(field => {
                    const value = String(sub[field.name] || '').toLowerCase();
                    return value.includes(search);
                });
            });
        }

        // Apply date range filter
        if (dateFrom || dateTo) {
            filtered = filtered.filter(sub => {
                if (!sub.date) return false;
                const subDate = sub.date; // Format: YYYY-MM

                if (dateFrom && subDate < dateFrom) return false;
                if (dateTo && subDate > dateTo) return false;
                return true;
            });
        }

        // Apply sorting
        if (sortColumn) {
            filtered.sort((a, b) => {
                let aVal = a[sortColumn];
                let bVal = b[sortColumn];

                // Handle numeric values
                if (sortColumn !== 'date' && sortColumn !== 'notes') {
                    aVal = parseFloat(aVal) || 0;
                    bVal = parseFloat(bVal) || 0;
                }

                // Handle dates
                if (sortColumn === 'date') {
                    aVal = aVal || '';
                    bVal = bVal || '';
                }

                if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
                return 0;
            });
        }

        return filtered;
    };

    const handleSort = (fieldName: string) => {
        if (sortColumn === fieldName) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(fieldName);
            setSortDirection('asc');
        }
    };

    const filteredSubmissions = getFilteredAndSortedSubmissions();

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 className="page-title" style={{ margin: 0, fontSize: '1.8rem' }}>لوحة مؤشرات {departmentName}</h1>
                <Link href="/" className="btn btn-secondary">العودة للرئيسية</Link>
            </div>

            <div className="card card-hover">
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '30px', paddingBottom: '25px', borderBottom: '1px solid #eee' }}>
                    <div style={{ width: '60px', height: '60px', backgroundColor: 'rgba(14, 172, 184, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M3 3v18h18" />
                            <path d="M18 17V9" />
                            <path d="M13 17V5" />
                            <path d="M8 17v-3" />
                        </svg>
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 5px 0', color: 'var(--secondary-color)' }}>لوحة Power BI</h3>
                        <p style={{ fontSize: '0.95rem', color: '#666', margin: 0 }}>عرض التحليلات التفصيلية والرسوم البيانية</p>
                    </div>
                    <a href="#" className="btn btn-primary" style={{ marginRight: 'auto', marginLeft: '0' }} onClick={(e) => { e.preventDefault(); alert('سيتم فتح تقرير Power BI الخاص بـ ' + departmentName); }}>
                        فتح اللوحة
                    </a>
                </div>

                {userCanEdit ? (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary-color)' }}>
                                {editingId ? 'تعديل البيانات' : 'إدخال البيانات'}
                            </h2>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={handleCancelEdit}
                                    className="btn"
                                    style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 16px', fontSize: '0.9rem' }}
                                >
                                    إلغاء التعديل
                                </button>
                            )}
                        </div>

                        {submitted && (
                            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '25px', border: '1px solid #c3e6cb' }}>
                                <strong>تم بنجاح!</strong> تم {editingId ? 'تحديث' : 'حفظ'} البيانات بنجاح.
                            </div>
                        )}
                        <form onSubmit={handleSubmit}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                {fields.map((field) => (
                                    <div key={field.name} className="form-group" style={field.name === 'notes' ? { gridColumn: '1 / -1' } : {}}>
                                        <label className="form-label">{field.label}</label>
                                        {field.name === 'notes' ? (
                                            <textarea className="form-input" rows={4} placeholder="ملاحظات إضافية..." value={formData[field.name] || ''} onChange={(e) => handleChange(field.name, e.target.value)}></textarea>
                                        ) : (
                                            <input
                                                type={field.type}
                                                className="form-input"
                                                required={field.type === 'month' || field.type === 'date' || field.name !== 'notes'}
                                                value={formData[field.name] || ''}
                                                onChange={(e) => handleChange(field.name, e.target.value)}
                                                max={(field.type === 'date' || field.type === 'month') ? new Date().toISOString().split('T')[0].slice(0, 7) : undefined}
                                                min={field.type === 'number' ? '0' : undefined}
                                                step={field.type === 'number' ? '1' : undefined}
                                                onKeyDown={(e) => {
                                                    if (field.type === 'number' && (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e' || e.key === 'E')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                title={(field.type === 'date' || field.type === 'month') ? 'الشهر والسنة إجباري - لا يمكن اختيار شهر مستقبلي' : field.type === 'number' ? 'أدخل عدداً صحيحاً موجباً فقط' : undefined}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px' }}>
                                    {editingId ? 'تحديث البيانات' : 'إرسال البيانات'}
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                        <p style={{ margin: 0, color: '#856404' }}>⚠️ لديك صلاحية العرض فقط. لا يمكنك إضافة أو تعديل البيانات.</p>
                    </div>
                )}
            </div>

            {submissions.length > 0 && (
                <div className="card" style={{ marginTop: '30px' }}>
                    {/* Filter and Search UI */}
                    <div style={{ marginBottom: '20px', padding: '20px', backgroundColor: 'var(--background-color)', borderRadius: '8px' }}>
                        <h3 style={{ marginBottom: '15px', color: 'var(--primary-color)', fontSize: '1.1rem' }}>🔍 فلترة وبحث</h3>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                            {/* Search */}
                            <div className="form-group">
                                <label className="form-label">بحث في جميع الحقول</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    placeholder="ابحث..."
                                    value={searchText}
                                    onChange={(e) => setSearchText(e.target.value)}
                                />
                            </div>

                            {/* Date From */}
                            <div className="form-group">
                                <label className="form-label">من تاريخ</label>
                                <input
                                    type="month"
                                    className="form-input"
                                    value={dateFrom}
                                    onChange={(e) => setDateFrom(e.target.value)}
                                />
                            </div>

                            {/* Date To */}
                            <div className="form-group">
                                <label className="form-label">إلى تاريخ</label>
                                <input
                                    type="month"
                                    className="form-input"
                                    value={dateTo}
                                    onChange={(e) => setDateTo(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Clear Filters + Results Count */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' }}>
                            <button
                                onClick={() => {
                                    setSearchText('');
                                    setDateFrom('');
                                    setDateTo('');
                                }}
                                className="btn"
                                style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 16px', fontSize: '0.9rem' }}
                            >
                                مسح الفلاتر
                            </button>
                            <div style={{ fontSize: '0.9rem', color: '#666' }}>
                                عرض <strong>{filteredSubmissions.length}</strong> من أصل <strong>{submissions.length}</strong> سجل
                            </div>
                        </div>
                    </div>

                    {/* Export Buttons */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginBottom: '15px' }}>
                        <button
                            onClick={handleExportPDF}
                            className="btn"
                            style={{ backgroundColor: '#dc3545', color: 'white', fontSize: '0.9rem' }}
                        >
                            تصدير PDF
                        </button>
                        {currentUser?.role === 'super_admin' && (
                            <button
                                onClick={handleExportExcel}
                                className="btn"
                                style={{ backgroundColor: '#28a745', color: 'white', fontSize: '0.9rem' }}
                            >
                                تصدير Excel
                            </button>
                        )}
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                    {fields.filter(f => f.name !== 'notes').map(field => (
                                        <th key={field.name} style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>
                                            <button
                                                onClick={() => handleSort(field.name)}
                                                style={{
                                                    background: 'none',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    color: 'inherit',
                                                    fontWeight: 'bold',
                                                    fontSize: '1rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '5px'
                                                }}
                                            >
                                                {field.label}
                                                {sortColumn === field.name && (
                                                    <span style={{ fontSize: '0.8rem' }}>
                                                        {sortDirection === 'asc' ? '↑' : '↓'}
                                                    </span>
                                                )}
                                            </button>
                                        </th>
                                    ))}
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSubmissions.map((sub, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: sub.id === editingId ? '#f8f9fa' : 'transparent' }}>
                                        {fields.filter(f => f.name !== 'notes').map(field => (
                                            <td key={field.name} style={{ padding: '12px' }}>
                                                {field.name === 'date' && sub[field.name] ? (
                                                    (() => {
                                                        // Handle both YYYY-MM and YYYY-MM-DD
                                                        const dateVal = sub[field.name].length === 7 ? sub[field.name] + '-01' : sub[field.name];
                                                        return new Date(dateVal).toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' });
                                                    })()
                                                ) : (
                                                    sub[field.name] || '-'
                                                )}
                                            </td>
                                        ))}
                                        {userCanEdit && (
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(sub)}
                                                    style={{ padding: '8px 20px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s' }}
                                                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0c98a3'}
                                                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0eacb8'}
                                                >
                                                    تعديل
                                                </button>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
