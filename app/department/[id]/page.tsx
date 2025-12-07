'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, canEdit, canAccessDepartment, User, onAuthChange } from '@/lib/auth';
import { saveKPIData, getKPIData, updateKPIData, saveAccreditationFacility, getAccreditationFacilities, updateAccreditationFacility, deleteAccreditationFacility, type AccreditationFacility } from '@/lib/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import Pagination from '@/components/Pagination';
import DashboardModal from '@/components/DashboardModal';
import TrainingDashboard from '@/components/TrainingDashboard';
import TechnicalSupportDashboard from '@/components/TechnicalSupportDashboard';
import CustomerSatisfactionDashboard from '@/components/CustomerSatisfactionDashboard';
import TechnicalClinicalDashboard from '@/components/TechnicalClinicalDashboard';
import AdminAuditDashboard from '@/components/AdminAuditDashboard';
import AccreditationDashboard from '@/components/AccreditationDashboard';
import MedicalProfessionalsDashboard from '@/components/MedicalProfessionalsDashboard';

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

// Helper function to format date consistently on server and client
const formatMonthYear = (date: Date): string => {
    const arabicMonths = [
        'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
        'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
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
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    // Dashboard modal states
    const [isDashboardOpen, setIsDashboardOpen] = useState(false);
    const [isTechSupportDashboardOpen, setIsTechSupportDashboardOpen] = useState(false);
    const [isCustomerSatisfactionDashboardOpen, setIsCustomerSatisfactionDashboardOpen] = useState(false);
    const [isTechnicalClinicalDashboardOpen, setIsTechnicalClinicalDashboardOpen] = useState(false);
    const [isAdminAuditDashboardOpen, setIsAdminAuditDashboardOpen] = useState(false);
    const [isAccreditationDashboardOpen, setIsAccreditationDashboardOpen] = useState(false);
    const [isMedicalProfessionalsDashboardOpen, setIsMedicalProfessionalsDashboardOpen] = useState(false);

    // Facilities tracking states (for dept6 only)
    const [facilities, setFacilities] = useState<AccreditationFacility[]>([]);
    const [facilityFormData, setFacilityFormData] = useState({
        facilityName: '',
        governorate: '',
        accreditationStatus: '',
        month: ''
    });
    const [editingFacilityId, setEditingFacilityId] = useState<string | null>(null);
    const [facilityFilterMonth, setFacilityFilterMonth] = useState('');
    const [facilitySubmitted, setFacilitySubmitted] = useState(false);

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

            // Sort by date (oldest first)
            kpiData.sort((a: any, b: any) => {
                // Assuming createdAt is a Firestore Timestamp or Date object
                const dateA = a.createdAt instanceof Date ? a.createdAt : a.createdAt.toDate();
                const dateB = b.createdAt instanceof Date ? b.createdAt : b.createdAt.toDate();
                return dateA.getTime() - dateB.getTime();
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
                const monthYear = formatMonthYear(date);
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

    // Reset to first page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchText, dateFrom, dateTo]);

    // Load facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadFacilities();
        }
    }, [id, currentUser, facilityFilterMonth]);

    const loadFacilities = async () => {
        const data = await getAccreditationFacilities(facilityFilterMonth || undefined);
        setFacilities(data);
    };

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

        // التحقق من التكرار (للإدخال الجديد أو التعديل)
        if (formData.date) {
            const isDuplicate = submissions.some(sub =>
                sub.date === formData.date && sub.id !== editingId
            );
            if (isDuplicate) {
                alert('⚠️ تم إدخال بيانات هذا الشهر مسبقاً. لا يمكن تكرار نفس الشهر والسنة في نفس الإدارة.');
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
            const monthYear = formatMonthYear(currentDate);
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

    // Facility handlers (for dept6)
    const handleFacilityInputChange = (field: string, value: string) => {
        setFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingFacilityId) {
                // Update
                const success = await updateAccreditationFacility(editingFacilityId, {
                    ...facilityFormData,
                    year: parseInt(facilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setFacilitySubmitted(true);
                    setTimeout(() => setFacilitySubmitted(false), 3000);
                    resetFacilityForm();
                    await loadFacilities();
                }
            } else {
                // Create
                const docId = await saveAccreditationFacility({
                    ...facilityFormData,
                    year: parseInt(facilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setFacilitySubmitted(true);
                    setTimeout(() => setFacilitySubmitted(false), 3000);
                    resetFacilityForm();
                    await loadFacilities();
                }
            }
        } catch (error) {
            console.error('Error saving facility:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditFacility = (facility: AccreditationFacility) => {
        setEditingFacilityId(facility.id || null);
        setFacilityFormData({
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            accreditationStatus: facility.accreditationStatus,
            month: facility.month
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteFacility = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;

        const success = await deleteAccreditationFacility(id);
        if (success) {
            await loadFacilities();
        }
    };

    const resetFacilityForm = () => {
        setFacilityFormData({
            facilityName: '',
            governorate: '',
            accreditationStatus: '',
            month: ''
        });
        setEditingFacilityId(null);
    };

    const filteredSubmissions = getFilteredAndSortedSubmissions();

    // Determine active and completed fields for dept8
    let activeFields = fields;
    let completedStandards: Field[] = [];

    if (id === 'dept8' && filteredSubmissions.length > 0) {
        // Use the latest record (first in filtered list) to determine completion
        const latestRecord = filteredSubmissions[0];
        const completed: Field[] = [];
        const active: Field[] = [];

        fields.forEach(field => {
            // Check if it's a standard field (numeric) and has reached 100%
            const val = latestRecord[field.name];
            const numVal = parseFloat(val);

            if (field.type === 'number' && numVal === 100) {
                completed.push(field);
            } else {
                active.push(field);
            }
        });

        if (completed.length > 0) {
            completedStandards = completed;
            activeFields = active;
        }
    }

    const handleExportPDF = () => {
        const doc = new jsPDF();

        // Add font support for Arabic (using a standard font that supports Arabic would be ideal, 
        // but for now we'll use default and hope for the best or use a workaround if needed.
        // Note: jsPDF default fonts don't support Arabic well. We might need a custom font.
        // For this iteration, we will try basic export. If Arabic fails, we'll need to add a font.)

        doc.text(`تقرير ${departmentName}`, 100, 10, { align: 'center' });

        const tableColumn = activeFields.map(f => f.label);
        const tableRows = filteredSubmissions.map(sub =>
            activeFields.map(f => {
                if (f.name === 'date' && sub[f.name]) {
                    // Handle both YYYY-MM and YYYY-MM-DD
                    const dateVal = sub[f.name].length === 7 ? sub[f.name] + '-01' : sub[f.name];
                    return formatMonthYear(new Date(dateVal));
                }
                if (f.type === 'number' && id === 'dept8' && sub[f.name]) {
                    return `${sub[f.name]}%`;
                }
                return sub[f.name] || '-';
            })
        );

        // Add totals row if not dept8
        if (id !== 'dept8') {
            const totalsRow = activeFields.map((f, index) => {
                if (index === 0) return 'المجموع';
                if (f.type === 'number') {
                    return totals[f.name]?.toString() || '0';
                }
                return '-';
            });
            tableRows.push(totalsRow);
        }

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 20,
            styles: { font: 'helvetica', halign: 'right' },
            headStyles: { fillColor: [14, 172, 184] },
            footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' },
        });

        doc.save(`${departmentName}_report.pdf`);
    };

    const handleExportExcel = () => {
        const wb = XLSX.utils.book_new();

        const dataForExcel = filteredSubmissions.map(sub => {
            const row: Record<string, any> = {};
            activeFields.forEach(f => {
                if (f.name === 'date' && sub[f.name]) {
                    // Handle both YYYY-MM and YYYY-MM-DD
                    const dateVal = sub[f.name].length === 7 ? sub[f.name] + '-01' : sub[f.name];
                    row[f.label] = formatMonthYear(new Date(dateVal));
                } else if (f.type === 'number' && id === 'dept8' && sub[f.name]) {
                    row[f.label] = `${sub[f.name]}%`;
                } else {
                    row[f.label] = sub[f.name] || '-';
                }
            });
            return row;
        });

        // Add totals row if not dept8
        if (id !== 'dept8') {
            const totalsRow: Record<string, any> = {};
            activeFields.forEach((f, index) => {
                if (index === 0) {
                    totalsRow[f.label] = 'المجموع';
                } else if (f.type === 'number') {
                    totalsRow[f.label] = totals[f.name] || 0;
                } else {
                    totalsRow[f.label] = '-';
                }
            });
            dataForExcel.push(totalsRow);
        }

        const ws = XLSX.utils.json_to_sheet(dataForExcel);

        // Adjust column widths
        const wscols = [{ wch: 20 }, ...activeFields.map(() => ({ wch: 20 }))];
        ws['!cols'] = wscols;

        XLSX.utils.book_append_sheet(wb, ws, "Report");
        XLSX.writeFile(wb, `${departmentName}_report.xlsx`);
    };

    if (!currentUser) return null;

    const userCanEdit = canEdit(currentUser);

    // Filter and sort functions moved to top

    // Pagination: Calculate items for current page  
    // filteredSubmissions is now calculated at the top
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedSubmissions = filteredSubmissions.slice(startIndex, endIndex);

    // Calculate totals from filtered data
    const calculateTotals = () => {
        const totals: Record<string, number> = {};

        // Only calculate if not dept8
        if (id === 'dept8') return totals;

        fields.forEach(field => {
            if (field.type === 'number') {
                totals[field.name] = filteredSubmissions.reduce((sum, sub) => {
                    const value = parseFloat(sub[field.name]) || 0;
                    return sum + value;
                }, 0);
            }
        });

        return totals;
    };

    const totals = calculateTotals();




    // Check if user can edit a specific record based on year
    const canEditRecord = (record: Record<string, any>) => {
        if (!userCanEdit) return false;

        // Super admin can edit any record
        if (currentUser?.role === 'super_admin') return true;

        // Extract year from record date (format: YYYY-MM or YYYY-MM-DD)
        const recordDate = record.date;
        if (!recordDate) return true; // If no date, allow edit

        const recordYear = parseInt(recordDate.substring(0, 4));
        const currentYear = new Date().getFullYear();

        // Department admins can only edit current year data
        return recordYear === currentYear;
    };

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
                                                max={(field.type === 'date' || field.type === 'month') ? new Date().toISOString().split('T')[0].slice(0, 7) : (field.type === 'number' && id === 'dept8') ? '100' : undefined}
                                                min={field.type === 'number' ? '0' : undefined}
                                                step={field.type === 'number' ? '1' : undefined}
                                                onKeyDown={(e) => {
                                                    if (field.type === 'number' && (e.key === '.' || e.key === ',' || e.key === '-' || e.key === 'e' || e.key === 'E')) {
                                                        e.preventDefault();
                                                    }
                                                }}
                                                title={(field.type === 'date' || field.type === 'month') ? 'الشهر والسنة إجباري - لا يمكن اختيار شهر مستقبلي' : field.type === 'number' && id === 'dept8' ? 'أدخل نسبة مئوية من 0 إلى 100' : field.type === 'number' ? 'أدخل عدداً صحيحاً موجباً فقط' : undefined}
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

            {/* Facilities Tracking Section - Only for dept6 */}
            {id === 'dept6' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <h2 style={{ margin: '0 0 20px 0', fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                        📋 تسجيل المنشآت المتقدمة
                    </h2>

                    {userCanEdit ? (
                        <>
                            {facilitySubmitted && (
                                <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                    <strong>تم بنجاح!</strong> تم {editingFacilityId ? 'تحديث' : 'إضافة'} المنشأة بنجاح.
                                </div>
                            )}

                            <form onSubmit={handleFacilitySubmit} style={{ marginBottom: '30px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label className="form-label">اسم المنشأة *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={facilityFormData.facilityName}
                                            onChange={(e) => handleFacilityInputChange('facilityName', e.target.value)}
                                            placeholder="أدخل اسم المنشأة"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">المحافظة *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={facilityFormData.governorate}
                                            onChange={(e) => handleFacilityInputChange('governorate', e.target.value)}
                                            placeholder="أدخل المحافظة"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">حالة الاعتماد *</label>
                                        <select
                                            className="form-input"
                                            required
                                            value={facilityFormData.accreditationStatus}
                                            onChange={(e) => handleFacilityInputChange('accreditationStatus', e.target.value)}
                                        >
                                            <option value="">اختر حالة الاعتماد</option>
                                            <option value="منشأة جديدة">منشأة جديدة</option>
                                            <option value="تجديد اعتماد">تجديد اعتماد</option>
                                            <option value="استكمال اعتماد">استكمال اعتماد</option>
                                            <option value="اعتماد مبدئي">اعتماد مبدئي</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">الشهر *</label>
                                        <input
                                            type="month"
                                            className="form-input"
                                            required
                                            value={facilityFormData.month}
                                            onChange={(e) => handleFacilityInputChange('month', e.target.value)}
                                            max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <button type="submit" className="btn btn-primary">
                                        {editingFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                    </button>
                                    {editingFacilityId && (
                                        <button
                                            type="button"
                                            onClick={resetFacilityForm}
                                            className="btn"
                                            style={{ backgroundColor: '#6c757d', color: 'white' }}
                                        >
                                            إلغاء
                                        </button>
                                    )}
                                </div>
                            </form>
                        </>
                    ) : null}

                    {/* Facilities Table */}
                    <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                المنشآت المسجلة
                            </h3>
                            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                <input
                                    type="month"
                                    className="form-input"
                                    value={facilityFilterMonth}
                                    onChange={(e) => setFacilityFilterMonth(e.target.value)}
                                    placeholder="فلترة حسب الشهر"
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%',
                                borderCollapse: 'collapse',
                                fontSize: '0.9rem',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                            }}>
                                <thead>
                                    <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                        <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>حالة الاعتماد</th>
                                        <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                        {userCanEdit && (
                                            <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>إجراءات</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {facilities.length === 0 ? (
                                        <tr>
                                            <td colSpan={userCanEdit ? 5 : 4} style={{
                                                padding: '40px',
                                                textAlign: 'center',
                                                color: '#999'
                                            }}>
                                                <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                لا توجد منشآت مسجلة
                                            </td>
                                        </tr>
                                    ) : (
                                        facilities.map((facility, index) => (
                                            <tr key={facility.id} style={{
                                                borderBottom: '1px solid #eee',
                                                backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                            }}>
                                                <td style={{ padding: '12px', fontWeight: '500' }}>
                                                    {facility.facilityName}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {facility.governorate}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 12px',
                                                        borderRadius: '12px',
                                                        fontSize: '0.85rem',
                                                        backgroundColor: 'var(--background-color)',
                                                        color: 'var(--primary-color)',
                                                        fontWeight: '500'
                                                    }}>
                                                        {facility.accreditationStatus}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                                                    {(() => {
                                                        const [year, month] = facility.month.split('-');
                                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                        return `${monthNames[parseInt(month) - 1]} ${year}`;
                                                    })()}
                                                </td>
                                                {userCanEdit && (
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleEditFacility(facility)}
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
                                                                onClick={() => handleDeleteFacility(facility.id!)}
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
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

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
                        {id === 'dept1' && (
                            <button
                                onClick={() => setIsDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
                        {id === 'dept2' && (
                            <button
                                onClick={() => setIsTechSupportDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
                        {id === 'dept3' && (
                            <button
                                onClick={() => setIsCustomerSatisfactionDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
                        {id === 'dept4' && (
                            <button
                                onClick={() => setIsTechnicalClinicalDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
                        {id === 'dept5' && (
                            <button
                                onClick={() => setIsAdminAuditDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
                        {id === 'dept6' && (
                            <button
                                onClick={() => setIsAccreditationDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
                        {id === 'dept7' && (
                            <button
                                onClick={() => setIsMedicalProfessionalsDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
                        )}
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


                    {/* Achievements Card for dept8 */}
                    {id === 'dept8' && completedStandards.length > 0 && (
                        <div style={{
                            marginBottom: '25px',
                            padding: '20px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '12px',
                            border: '1px solid #c8e6c9',
                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '15px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    backgroundColor: '#28a745',
                                    borderRadius: '50%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: 'white'
                                }}>
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="20 6 9 17 4 12"></polyline>
                                    </svg>
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, color: '#155724', fontSize: '1.2rem' }}>إنجازات مكتملة</h3>
                                    <p style={{ margin: '5px 0 0 0', color: '#155724', fontSize: '0.95rem' }}>
                                        تم الانتهاء من <strong>{completedStandards.length}</strong> معايير بنسبة 100%
                                    </p>
                                </div>
                            </div>

                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                                gap: '10px'
                            }}>
                                {completedStandards.map(std => (
                                    <div key={std.name} style={{
                                        backgroundColor: 'white',
                                        padding: '10px 15px',
                                        borderRadius: '8px',
                                        border: '1px solid #c8e6c9',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        fontSize: '0.9rem',
                                        color: '#155724'
                                    }}>
                                        <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓</span>
                                        {std.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                    {activeFields.filter(f => f.name !== 'notes').map(field => (
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
                                {paginatedSubmissions.map((sub, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #eee', backgroundColor: sub.id === editingId ? '#f8f9fa' : 'transparent' }}>
                                        {activeFields.filter(f => f.name !== 'notes').map(field => (
                                            <td key={field.name} style={{ padding: '12px' }}>
                                                {field.name === 'date' && sub[field.name] ? (
                                                    (() => {
                                                        // Handle both YYYY-MM and YYYY-MM-DD
                                                        const dateVal = sub[field.name].length === 7 ? sub[field.name] + '-01' : sub[field.name];
                                                        return formatMonthYear(new Date(dateVal));
                                                    })()
                                                ) : field.type === 'number' && id === 'dept8' && sub[field.name] ? (
                                                    `${sub[field.name]}%`
                                                ) : (
                                                    sub[field.name] || '-'
                                                )}
                                            </td>
                                        ))}
                                        {userCanEdit && (
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                {canEditRecord(sub) ? (
                                                    <button
                                                        onClick={() => handleEdit(sub)}
                                                        style={{ padding: '8px 20px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '500', transition: 'all 0.2s' }}
                                                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#0c98a3'}
                                                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#0eacb8'}
                                                    >
                                                        تعديل
                                                    </button>
                                                ) : (
                                                    <button
                                                        disabled
                                                        title="لا يمكن تعديل بيانات السنوات السابقة (للمدير العام فقط)"
                                                        style={{
                                                            padding: '8px 20px',
                                                            backgroundColor: '#ccc',
                                                            color: '#666',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'not-allowed',
                                                            fontSize: '0.9rem',
                                                            fontWeight: '500'
                                                        }}
                                                    >
                                                        🔒 مقفل
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                                }
                                {/* Totals Row - Only for departments other than dept8 */}
                                {id !== 'dept8' && filteredSubmissions.length > 0 && (
                                    <tr style={{
                                        backgroundColor: '#f0f9fa',
                                        borderTop: '2px solid var(--primary-color)',
                                        fontWeight: 'bold'
                                    }}>
                                        {activeFields.filter(f => f.name !== 'notes').map((field, index) => (
                                            <td key={field.name} style={{
                                                padding: '14px 12px',
                                                color: 'var(--primary-color)',
                                                fontSize: '1.05rem'
                                            }}>
                                                {index === 0 ? (
                                                    'المجموع'
                                                ) : field.type === 'number' ? (
                                                    totals[field.name] || 0
                                                ) : (
                                                    '-'
                                                )}
                                            </td>
                                        ))}
                                        {userCanEdit && <td style={{ padding: '14px 12px' }}></td>}
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Component */}
                    <Pagination
                        currentPage={currentPage}
                        totalItems={filteredSubmissions.length}
                        itemsPerPage={itemsPerPage}
                        onPageChange={setCurrentPage}
                        onItemsPerPageChange={setItemsPerPage}
                    />
                </div>
            )}

            {
                id === 'dept1' && (
                    <DashboardModal
                        isOpen={isDashboardOpen}
                        onClose={() => setIsDashboardOpen(false)}
                    >
                        <TrainingDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }
            {
                id === 'dept2' && (
                    <DashboardModal
                        isOpen={isTechSupportDashboardOpen}
                        onClose={() => setIsTechSupportDashboardOpen(false)}
                    >
                        <TechnicalSupportDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }
            {
                id === 'dept3' && (
                    <DashboardModal
                        isOpen={isCustomerSatisfactionDashboardOpen}
                        onClose={() => setIsCustomerSatisfactionDashboardOpen(false)}
                    >
                        <CustomerSatisfactionDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }
            {
                id === 'dept4' && (
                    <DashboardModal
                        isOpen={isTechnicalClinicalDashboardOpen}
                        onClose={() => setIsTechnicalClinicalDashboardOpen(false)}
                    >
                        <TechnicalClinicalDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }
            {
                id === 'dept5' && (
                    <DashboardModal
                        isOpen={isAdminAuditDashboardOpen}
                        onClose={() => setIsAdminAuditDashboardOpen(false)}
                        title="لوحة بيانات الرقابة الإدارية على المنشآت الصحية"
                    >
                        <AdminAuditDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }

            {
                id === 'dept6' && (
                    <DashboardModal
                        isOpen={isAccreditationDashboardOpen}
                        onClose={() => setIsAccreditationDashboardOpen(false)}
                        title="لوحة بيانات الإدارة العامة للاعتماد والتسجيل"
                    >
                        <AccreditationDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }

            {
                id === 'dept7' && (
                    <DashboardModal
                        isOpen={isMedicalProfessionalsDashboardOpen}
                        onClose={() => setIsMedicalProfessionalsDashboardOpen(false)}
                        title="لوحة بيانات الإدارة العامة لتسجيل أعضاء المهن الطبية"
                    >
                        <MedicalProfessionalsDashboard submissions={submissions} />
                    </DashboardModal>
                )
            }
        </div >
    );
}
