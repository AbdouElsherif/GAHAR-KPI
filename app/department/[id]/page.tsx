'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, canEdit, canAccessDepartment, User, onAuthChange } from '@/lib/auth';
import { saveKPIData, getKPIData, updateKPIData, saveAccreditationFacility, getAccreditationFacilities, updateAccreditationFacility, deleteAccreditationFacility, type AccreditationFacility, saveCompletionFacility, getCompletionFacilities, updateCompletionFacility, deleteCompletionFacility, type CompletionFacility, savePaymentFacility, getPaymentFacilities, updatePaymentFacility, deletePaymentFacility, type PaymentFacility, saveCorrectivePlanFacility, getCorrectivePlanFacilities, updateCorrectivePlanFacility, deleteCorrectivePlanFacility, type CorrectivePlanFacility, savePaidFacility, getPaidFacilities, updatePaidFacility, deletePaidFacility, type PaidFacility, saveMedicalProfessionalRegistration, getMedicalProfessionalRegistrations, updateMedicalProfessionalRegistration, deleteMedicalProfessionalRegistration, type MedicalProfessionalRegistration } from '@/lib/firestore';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType, BorderStyle } from 'docx';
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
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept2': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'supportPrograms', label: 'عدد برامج الدعم الفني المقدمة', type: 'number' },
        { name: 'introVisits', label: 'زيارات تمهيدية', type: 'number' },
        { name: 'fieldSupportVisits', label: 'زيارات دعم فني ميداني', type: 'number' },
        { name: 'remoteSupportVisits', label: 'زيارات دعم فني عن بعد', type: 'number' },
        { name: 'supportedFacilities', label: 'منشآت حصلت على الدعم الفني', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept3': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'patientExperienceSample', label: 'حجم عينة قياس تجربة مريض', type: 'number' },
        { name: 'staffSatisfactionSample', label: 'حجم عينة قياس رضاء العاملين', type: 'number' },
        { name: 'fieldVisits', label: 'عدد الزيارات الميدانية لاستبيان رضاء المتعاملين', type: 'number' },
        { name: 'surveyedFacilities', label: 'عدد المنشآت التي تم إجراء استبيانات بها', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept4': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'totalFieldVisits', label: 'إجمالي الزيارات الميدانية للرقابة الفنية والإكلينيكية', type: 'number' },
        { name: 'auditVisits', label: 'زيارات التدقيق الفني والإكلينيكي', type: 'number' },
        { name: 'assessmentVisits', label: 'زيارات التقييم الفني والإكلينيكي', type: 'number' },
        { name: 'visitedFacilities', label: 'عدد المنشآت الصحية التي تم إجراء زيارات رقابة فنية وإكلينيكية لها', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
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
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
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
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept7': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'registeredMembers', label: 'عدد أعضاء المهن المسجلين', type: 'number' },
        { name: 'facilitiesUpdated', label: 'عدد المنشآت التي تم تسجيل وتحديث أعضاء المهن الطبية بها', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
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
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
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

    // Main data entry section expand/collapse state
    const [isDataEntrySectionExpanded, setIsDataEntrySectionExpanded] = useState(false);

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
    const [isFacilitiesSectionExpanded, setIsFacilitiesSectionExpanded] = useState(false);

    // Completion Facilities tracking states (for dept6 only)
    const [completionFacilities, setCompletionFacilities] = useState<CompletionFacility[]>([]);
    const [completionFacilityFormData, setCompletionFacilityFormData] = useState({
        facilityName: '',
        governorate: '',
        accreditationStatus: '',
        month: ''
    });
    const [editingCompletionFacilityId, setEditingCompletionFacilityId] = useState<string | null>(null);
    const [completionFacilityFilterMonth, setCompletionFacilityFilterMonth] = useState('');
    const [completionFacilitySubmitted, setCompletionFacilitySubmitted] = useState(false);
    const [isCompletionFacilitiesSectionExpanded, setIsCompletionFacilitiesSectionExpanded] = useState(false);

    // Payment Facilities tracking states (for dept6 only)
    const [paymentFacilities, setPaymentFacilities] = useState<PaymentFacility[]>([]);
    const [paymentFacilityFormData, setPaymentFacilityFormData] = useState({
        facilityName: '',
        governorate: '',
        accreditationStatus: '',
        month: ''
    });
    const [editingPaymentFacilityId, setEditingPaymentFacilityId] = useState<string | null>(null);
    const [paymentFacilityFilterMonth, setPaymentFacilityFilterMonth] = useState('');
    const [paymentFacilitySubmitted, setPaymentFacilitySubmitted] = useState(false);
    const [isPaymentFacilitiesSectionExpanded, setIsPaymentFacilitiesSectionExpanded] = useState(false);

    // Corrective Plan Facilities tracking states (for dept6 only)
    const [correctivePlanFacilities, setCorrectivePlanFacilities] = useState<CorrectivePlanFacility[]>([]);
    const [correctivePlanFacilityFormData, setCorrectivePlanFacilityFormData] = useState({
        facilityType: '',
        facilityName: '',
        governorate: '',
        month: ''
    });
    const [editingCorrectivePlanFacilityId, setEditingCorrectivePlanFacilityId] = useState<string | null>(null);
    const [correctivePlanFacilityFilterMonth, setCorrectivePlanFacilityFilterMonth] = useState('');
    const [correctivePlanFacilitySubmitted, setCorrectivePlanFacilitySubmitted] = useState(false);
    const [isCorrectivePlanFacilitiesSectionExpanded, setIsCorrectivePlanFacilitiesSectionExpanded] = useState(false);


    // Paid Facilities tracking states (for dept6 only)
    const [paidFacilities, setPaidFacilities] = useState<PaidFacility[]>([]);
    const [paidFacilityFormData, setPaidFacilityFormData] = useState({
        facilityName: '',
        governorate: '',
        accreditationStatus: '',
        amount: '',
        month: ''
    });
    const [editingPaidFacilityId, setEditingPaidFacilityId] = useState<string | null>(null);
    const [paidFacilityFilterMonth, setPaidFacilityFilterMonth] = useState('');
    const [paidFacilitySubmitted, setPaidFacilitySubmitted] = useState(false);
    const [isPaidFacilitiesSectionExpanded, setIsPaidFacilitiesSectionExpanded] = useState(false);

    // Medical Professional Registration tracking states (for dept6 only)
    const [medicalProfessionalRegistrations, setMedicalProfessionalRegistrations] = useState<MedicalProfessionalRegistration[]>([]);
    const [medicalProfessionalFormData, setMedicalProfessionalFormData] = useState({
        facilityName: '',
        governorate: '',
        accreditationStatus: '',
        facilityType: '',
        month: ''
    });
    const [editingMedicalProfessionalId, setEditingMedicalProfessionalId] = useState<string | null>(null);
    const [medicalProfessionalFilterMonth, setMedicalProfessionalFilterMonth] = useState('');
    const [medicalProfessionalSubmitted, setMedicalProfessionalSubmitted] = useState(false);
    const [isMedicalProfessionalSectionExpanded, setIsMedicalProfessionalSectionExpanded] = useState(false);

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

    // Load completion facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadCompletionFacilities();
        }
    }, [id, currentUser, completionFacilityFilterMonth]);

    // Load payment facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadPaymentFacilities();
        }
    }, [id, currentUser, paymentFacilityFilterMonth]);

    // Load corrective plan facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadCorrectivePlanFacilities();
        }
    }, [id, currentUser, correctivePlanFacilityFilterMonth]);


    // Load paid facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadPaidFacilities();
        }
    }, [id, currentUser, paidFacilityFilterMonth]);

    // Load medical professional registrations for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadMedicalProfessionalRegistrations();
        }
    }, [id, currentUser, medicalProfessionalFilterMonth]);

    const loadFacilities = async () => {
        const data = await getAccreditationFacilities(facilityFilterMonth || undefined);
        setFacilities(data);
    };

    const loadCompletionFacilities = async () => {
        const data = await getCompletionFacilities(completionFacilityFilterMonth || undefined);
        setCompletionFacilities(data);
    };

    const loadPaymentFacilities = async () => {
        const data = await getPaymentFacilities(paymentFacilityFilterMonth || undefined);
        setPaymentFacilities(data);
    };

    const loadPaidFacilities = async () => {
        const data = await getPaidFacilities(paidFacilityFilterMonth || undefined);
        setPaidFacilities(data);
    };

    const loadCorrectivePlanFacilities = async () => {
        const data = await getCorrectivePlanFacilities(correctivePlanFacilityFilterMonth || undefined);
        setCorrectivePlanFacilities(data);
    };


    const loadMedicalProfessionalRegistrations = async () => {
        const data = await getMedicalProfessionalRegistrations(medicalProfessionalFilterMonth || undefined);
        setMedicalProfessionalRegistrations(data);
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

    // Export functions for Accreditation Facilities
    const exportFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = facilities.map((facility, index) => {
            const [year, month] = facility.month.split('-');
            return {
                '#': index + 1,
                'اسم المنشأة': facility.facilityName,
                'المحافظة': facility.governorate,
                'حالة الاعتماد': facility.accreditationStatus,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'المنشآت المتقدمة');

        const fileName = facilityFilterMonth
            ? `المنشآت_المتقدمة_${facilityFilterMonth}.xlsx`
            : `المنشآت_المتقدمة_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportFacilitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...facilities.map((facility, index) => {
                const [year, month] = facility.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityName, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.governorate, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.accreditationStatus, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'المنشآت المتقدمة خلال الشهر',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = facilityFilterMonth
            ? `المنشآت_المتقدمة_${facilityFilterMonth}.docx`
            : `المنشآت_المتقدمة_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Completion Facility handlers (for dept6)
    const handleCompletionFacilityInputChange = (field: string, value: string) => {
        setCompletionFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCompletionFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingCompletionFacilityId) {
                // Update
                const success = await updateCompletionFacility(editingCompletionFacilityId, {
                    ...completionFacilityFormData,
                    year: parseInt(completionFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setCompletionFacilitySubmitted(true);
                    setTimeout(() => setCompletionFacilitySubmitted(false), 3000);
                    resetCompletionFacilityForm();
                    await loadCompletionFacilities();
                }
            } else {
                // Create
                const docId = await saveCompletionFacility({
                    ...completionFacilityFormData,
                    year: parseInt(completionFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setCompletionFacilitySubmitted(true);
                    setTimeout(() => setCompletionFacilitySubmitted(false), 3000);
                    resetCompletionFacilityForm();
                    await loadCompletionFacilities();
                }
            }
        } catch (error) {
            console.error('Error saving completion facility:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditCompletionFacility = (facility: CompletionFacility) => {
        setEditingCompletionFacilityId(facility.id || null);
        setCompletionFacilityFormData({
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            accreditationStatus: facility.accreditationStatus,
            month: facility.month
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteCompletionFacility = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;

        const success = await deleteCompletionFacility(id);
        if (success) {
            await loadCompletionFacilities();
        }
    };

    const resetCompletionFacilityForm = () => {
        setCompletionFacilityFormData({
            facilityName: '',
            governorate: '',
            accreditationStatus: '',
            month: ''
        });
        setEditingCompletionFacilityId(null);
    };

    // Export functions for Completion Facilities
    const exportCompletionFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = completionFacilities.map((facility, index) => {
            const [year, month] = facility.month.split('-');
            return {
                '#': index + 1,
                'اسم المنشأة': facility.facilityName,
                'المحافظة': facility.governorate,
                'حالة الاعتماد': facility.accreditationStatus,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'مرحلة الاستكمال');

        const fileName = completionFacilityFilterMonth
            ? `مرحلة_الاستكمال_${completionFacilityFilterMonth}.xlsx`
            : `مرحلة_الاستكمال_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportCompletionFacilitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...completionFacilities.map((facility, index) => {
                const [year, month] = facility.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityName, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.governorate, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.accreditationStatus, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'مرحلة الاستكمال',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = completionFacilityFilterMonth
            ? `مرحلة_الاستكمال_${completionFacilityFilterMonth}.docx`
            : `مرحلة_الاستكمال_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Payment Facility handlers (for dept6)
    const handlePaymentFacilityInputChange = (field: string, value: string) => {
        setPaymentFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaymentFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingPaymentFacilityId) {
                const success = await updatePaymentFacility(editingPaymentFacilityId, {
                    ...paymentFacilityFormData,
                    year: parseInt(paymentFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setPaymentFacilitySubmitted(true);
                    setTimeout(() => setPaymentFacilitySubmitted(false), 3000);
                    resetPaymentFacilityForm();
                    await loadPaymentFacilities();
                }
            } else {
                const docId = await savePaymentFacility({
                    ...paymentFacilityFormData,
                    year: parseInt(paymentFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setPaymentFacilitySubmitted(true);
                    setTimeout(() => setPaymentFacilitySubmitted(false), 3000);
                    resetPaymentFacilityForm();
                    await loadPaymentFacilities();
                }
            }
        } catch (error) {
            console.error('Error saving payment facility:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditPaymentFacility = (facility: PaymentFacility) => {
        setEditingPaymentFacilityId(facility.id || null);
        setPaymentFacilityFormData({
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            accreditationStatus: facility.accreditationStatus,
            month: facility.month
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePaymentFacility = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;

        const success = await deletePaymentFacility(id);
        if (success) {
            await loadPaymentFacilities();
        }
    };

    const resetPaymentFacilityForm = () => {
        setPaymentFacilityFormData({
            facilityName: '',
            governorate: '',
            accreditationStatus: '',
            month: ''
        });
        setEditingPaymentFacilityId(null);
    };

    // Export functions for Payment Facilities
    const exportPaymentFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = paymentFacilities.map((facility, index) => {
            const [year, month] = facility.month.split('-');
            return {
                '#': index + 1,
                'اسم المنشأة': facility.facilityName,
                'المحافظة': facility.governorate,
                'حالة الاعتماد': facility.accreditationStatus,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'مرحلة السداد');

        const fileName = paymentFacilityFilterMonth
            ? `مرحلة_السداد_${paymentFacilityFilterMonth}.xlsx`
            : `مرحلة_السداد_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportPaymentFacilitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...paymentFacilities.map((facility, index) => {
                const [year, month] = facility.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityName, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.governorate, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.accreditationStatus, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'مرحلة السداد',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = paymentFacilityFilterMonth
            ? `مرحلة_السداد_${paymentFacilityFilterMonth}.docx`
            : `مرحلة_السداد_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Corrective Plan Facility handlers (for dept6)
    const handleCorrectivePlanFacilityInputChange = (field: string, value: string) => {
        setCorrectivePlanFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCorrectivePlanFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingCorrectivePlanFacilityId) {
                const success = await updateCorrectivePlanFacility(editingCorrectivePlanFacilityId, {
                    ...correctivePlanFacilityFormData,
                    year: parseInt(correctivePlanFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setCorrectivePlanFacilitySubmitted(true);
                    setTimeout(() => setCorrectivePlanFacilitySubmitted(false), 3000);
                    resetCorrectivePlanFacilityForm();
                    await loadCorrectivePlanFacilities();
                }
            } else {
                const docId = await saveCorrectivePlanFacility({
                    ...correctivePlanFacilityFormData,
                    year: parseInt(correctivePlanFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setCorrectivePlanFacilitySubmitted(true);
                    setTimeout(() => setCorrectivePlanFacilitySubmitted(false), 3000);
                    resetCorrectivePlanFacilityForm();
                    await loadCorrectivePlanFacilities();
                }
            }
        } catch (error) {
            console.error('Error saving corrective plan facility:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditCorrectivePlanFacility = (facility: CorrectivePlanFacility) => {
        setEditingCorrectivePlanFacilityId(facility.id || null);
        setCorrectivePlanFacilityFormData({
            facilityType: facility.facilityType,
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            month: facility.month
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteCorrectivePlanFacility = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;

        const success = await deleteCorrectivePlanFacility(id);
        if (success) {
            await loadCorrectivePlanFacilities();
        }
    };

    const resetCorrectivePlanFacilityForm = () => {
        setCorrectivePlanFacilityFormData({
            facilityType: '',
            facilityName: '',
            governorate: '',
            month: ''
        });
        setEditingCorrectivePlanFacilityId(null);
    };

    // Export functions for Corrective Plan Facilities
    const exportCorrectivePlanFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = correctivePlanFacilities.map((facility, index) => {
            const [year, month] = facility.month.split('-');
            return {
                '#': index + 1,
                'نوع المنشأة': facility.facilityType,
                'اسم المنشأة': facility.facilityName,
                'المحافظة': facility.governorate,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'متابعة الخطط التصحيحية');

        const fileName = correctivePlanFacilityFilterMonth
            ? `متابعة_الخطط_التصحيحية_${correctivePlanFacilityFilterMonth}.xlsx`
            : `متابعة_الخطط_التصحيحية_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportCorrectivePlanFacilitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'نوع المنشأة', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...correctivePlanFacilities.map((facility, index) => {
                const [year, month] = facility.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityType, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityName, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.governorate, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'متابعة الخطط التصحيحية',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = correctivePlanFacilityFilterMonth
            ? `متابعة_الخطط_التصحيحية_${correctivePlanFacilityFilterMonth}.docx`
            : `متابعة_الخطط_التصحيحية_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };


    // Paid Facility handlers (for dept6)
    const handlePaidFacilityInputChange = (field: string, value: string) => {
        setPaidFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handlePaidFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingPaidFacilityId) {
                const success = await updatePaidFacility(editingPaidFacilityId, {
                    ...paidFacilityFormData,
                    amount: parseFloat(paidFacilityFormData.amount),
                    year: parseInt(paidFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setPaidFacilitySubmitted(true);
                    setTimeout(() => setPaidFacilitySubmitted(false), 3000);
                    resetPaidFacilityForm();
                    await loadPaidFacilities();
                }
            } else {
                const docId = await savePaidFacility({
                    ...paidFacilityFormData,
                    amount: parseFloat(paidFacilityFormData.amount),
                    year: parseInt(paidFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setPaidFacilitySubmitted(true);
                    setTimeout(() => setPaidFacilitySubmitted(false), 3000);
                    resetPaidFacilityForm();
                    await loadPaidFacilities();
                }
            }
        } catch (error) {
            console.error('Error saving paid facility:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditPaidFacility = (facility: PaidFacility) => {
        setEditingPaidFacilityId(facility.id || null);
        setPaidFacilityFormData({
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            accreditationStatus: facility.accreditationStatus,
            amount: facility.amount.toString(),
            month: facility.month
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeletePaidFacility = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذه المنشأة؟')) return;

        const success = await deletePaidFacility(id);
        if (success) {
            await loadPaidFacilities();
        }
    };

    const resetPaidFacilityForm = () => {
        setPaidFacilityFormData({
            facilityName: '',
            governorate: '',
            accreditationStatus: '',
            amount: '',
            month: ''
        });
        setEditingPaidFacilityId(null);
    };

    // Export functions for Paid Facilities
    const exportPaidFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = paidFacilities.map((facility, index) => {
            const [year, month] = facility.month.split('-');
            return {
                '#': index + 1,
                'اسم المنشأة': facility.facilityName,
                'المحافظة': facility.governorate,
                'حالة الاعتماد': facility.accreditationStatus,
                'القيمة المالية (ج.م)': facility.amount.toLocaleString(),
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'المنشآت المدفوعة');

        const fileName = paidFacilityFilterMonth
            ? `المنشآت_المدفوعة_${paidFacilityFilterMonth}.xlsx`
            : `المنشآت_المدفوعة_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportPaidFacilitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 17, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 17, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'القيمة المالية (ج.م)', alignment: AlignmentType.CENTER })], width: { size: 16, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 17, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...paidFacilities.map((facility, index) => {
                const [year, month] = facility.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityName, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.governorate, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.accreditationStatus, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.amount.toLocaleString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'المنشآت المدفوعة',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = paidFacilityFilterMonth
            ? `المنشآت_المدفوعة_${paidFacilityFilterMonth}.docx`
            : `المنشآت_المدفوعة_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Medical Professional Registration handlers (for dept6)
    const handleMedicalProfessionalInputChange = (field: string, value: string) => {
        setMedicalProfessionalFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleMedicalProfessionalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingMedicalProfessionalId) {
                const success = await updateMedicalProfessionalRegistration(editingMedicalProfessionalId, {
                    ...medicalProfessionalFormData,
                    year: parseInt(medicalProfessionalFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setMedicalProfessionalSubmitted(true);
                    setTimeout(() => setMedicalProfessionalSubmitted(false), 3000);
                    resetMedicalProfessionalForm();
                    await loadMedicalProfessionalRegistrations();
                }
            } else {
                const docId = await saveMedicalProfessionalRegistration({
                    ...medicalProfessionalFormData,
                    year: parseInt(medicalProfessionalFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setMedicalProfessionalSubmitted(true);
                    setTimeout(() => setMedicalProfessionalSubmitted(false), 3000);
                    resetMedicalProfessionalForm();
                    await loadMedicalProfessionalRegistrations();
                }
            }
        } catch (error) {
            console.error('Error saving medical professional registration:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditMedicalProfessional = (registration: MedicalProfessionalRegistration) => {
        setEditingMedicalProfessionalId(registration.id || null);
        setMedicalProfessionalFormData({
            facilityName: registration.facilityName,
            governorate: registration.governorate,
            accreditationStatus: registration.accreditationStatus,
            facilityType: registration.facilityType,
            month: registration.month
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteMedicalProfessional = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا التسجيل؟')) return;

        const success = await deleteMedicalProfessionalRegistration(id);
        if (success) {
            await loadMedicalProfessionalRegistrations();
        }
    };

    const resetMedicalProfessionalForm = () => {
        setMedicalProfessionalFormData({
            facilityName: '',
            governorate: '',
            accreditationStatus: '',
            facilityType: '',
            month: ''
        });
        setEditingMedicalProfessionalId(null);
    };

    // Export functions for Medical Professional Registrations
    const exportMedicalProfessionalsToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = medicalProfessionalRegistrations.map((registration, index) => {
            const [year, month] = registration.month.split('-');
            return {
                '#': index + 1,
                'نوع المنشأة': registration.facilityType,
                'اسم المنشأة': registration.facilityName,
                'المحافظة': registration.governorate,
                'حالة الاعتماد': registration.accreditationStatus,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'أعضاء المهن الطبية');

        const fileName = medicalProfessionalFilterMonth
            ? `أعضاء_المهن_الطبية_${medicalProfessionalFilterMonth}.xlsx`
            : `أعضاء_المهن_الطبية_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportMedicalProfessionalsToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'نوع المنشأة', alignment: AlignmentType.CENTER })], width: { size: 18, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 24, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 17, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 17, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 16, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...medicalProfessionalRegistrations.map((registration, index) => {
                const [year, month] = registration.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: registration.facilityType, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: registration.facilityName, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: registration.governorate, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: registration.accreditationStatus, alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'مرحلة تسجيل أعضاء المهن الطبية',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    new Table({
                        rows: tableRows,
                        width: { size: 100, type: WidthType.PERCENTAGE }
                    })
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = medicalProfessionalFilterMonth
            ? `أعضاء_المهن_الطبية_${medicalProfessionalFilterMonth}.docx`
            : `أعضاء_المهن_الطبية_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
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
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: isDataEntrySectionExpanded ? '25px' : '0',
                                paddingBottom: isDataEntrySectionExpanded ? '15px' : '0',
                                borderBottom: isDataEntrySectionExpanded ? '2px solid var(--background-color)' : 'none',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsDataEntrySectionExpanded(!isDataEntrySectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary-color)' }}>
                                📝 {editingId ? 'تعديل البيانات' : 'إدخال البيانات'}
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isDataEntrySectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isDataEntrySectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isDataEntrySectionExpanded && (
                            <>
                                {editingId && (
                                    <div style={{ marginBottom: '25px' }}>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="btn"
                                            style={{ backgroundColor: '#6c757d', color: 'white', padding: '8px 16px', fontSize: '0.9rem' }}
                                        >
                                            إلغاء التعديل
                                        </button>
                                    </div>
                                )}

                                {submitted && (
                                    <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '25px', border: '1px solid #c3e6cb' }}>
                                        <strong>تم بنجاح!</strong> تم {editingId ? 'تحديث' : 'حفظ'} البيانات بنجاح.
                                    </div>
                                )}

                                <form onSubmit={handleSubmit}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                        {fields.map((field) => (
                                            <div key={field.name} className="form-group" style={field.name === 'notes' || field.name === 'obstacles' || field.name === 'developmentProposals' || field.name === 'additionalActivities' ? { gridColumn: '1 / -1' } : {}}>
                                                <label className="form-label">{field.label}</label>
                                                {field.name === 'notes' || field.name === 'obstacles' || field.name === 'developmentProposals' || field.name === 'additionalActivities' ? (
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
                        )}
                    </>
                ) : (
                    <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                        <p style={{ margin: 0, color: '#856404' }}>⚠️ لديك صلاحية العرض فقط. لا يمكنك إضافة أو تعديل البيانات.</p>
                    </div>
                )}

            </div>

            {/* Facilities Tracking Section - Only for dept6 */}
            {
                id === 'dept6' && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: isFacilitiesSectionExpanded ? '20px' : '0',
                                paddingBottom: isFacilitiesSectionExpanded ? '15px' : '0',
                                borderBottom: isFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsFacilitiesSectionExpanded(!isFacilitiesSectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                📋 المنشآت المتقدمة خلال الشهر
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isFacilitiesSectionExpanded && (
                            <>
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
                                                        <option value="تجديد / استكمال اعتماد">تجديد / استكمال اعتماد</option>
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
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                            المنشآت المسجلة
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {facilities.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={exportFacilitiesToExcel}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📊 تصدير Excel
                                                    </button>
                                                    <button
                                                        onClick={exportFacilitiesToWord}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📄 تصدير Word
                                                    </button>
                                                </>
                                            )}
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
                            </>
                        )}
                    </div>
                )
            }

            {/* Completion Facilities Tracking Section - Only for dept6 */}
            {
                id === 'dept6' && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: isCompletionFacilitiesSectionExpanded ? '20px' : '0',
                                paddingBottom: isCompletionFacilitiesSectionExpanded ? '15px' : '0',
                                borderBottom: isCompletionFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsCompletionFacilitiesSectionExpanded(!isCompletionFacilitiesSectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                📋 مرحلة استكمال الطلب (طرف المنشأة) عدد {completionFacilities.length} منشأة
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isCompletionFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isCompletionFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isCompletionFacilitiesSectionExpanded && (
                            <>
                                {userCanEdit ? (
                                    <>
                                        {completionFacilitySubmitted && (
                                            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                                <strong>تم بنجاح!</strong> تم {editingCompletionFacilityId ? 'تحديث' : 'إضافة'} المنشأة بنجاح.
                                            </div>
                                        )}

                                        <form onSubmit={handleCompletionFacilitySubmit} style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">اسم المنشأة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={completionFacilityFormData.facilityName}
                                                        onChange={(e) => handleCompletionFacilityInputChange('facilityName', e.target.value)}
                                                        placeholder="أدخل اسم المنشأة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">المحافظة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={completionFacilityFormData.governorate}
                                                        onChange={(e) => handleCompletionFacilityInputChange('governorate', e.target.value)}
                                                        placeholder="أدخل المحافظة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">حالة الاعتماد *</label>
                                                    <select
                                                        className="form-input"
                                                        required
                                                        value={completionFacilityFormData.accreditationStatus}
                                                        onChange={(e) => handleCompletionFacilityInputChange('accreditationStatus', e.target.value)}
                                                    >
                                                        <option value="">اختر حالة الاعتماد</option>
                                                        <option value="منشأة جديدة">منشأة جديدة</option>
                                                        <option value="تجديد / استكمال اعتماد">تجديد / استكمال اعتماد</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">الشهر *</label>
                                                    <input
                                                        type="month"
                                                        className="form-input"
                                                        required
                                                        value={completionFacilityFormData.month}
                                                        onChange={(e) => handleCompletionFacilityInputChange('month', e.target.value)}
                                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button type="submit" className="btn btn-primary">
                                                    {editingCompletionFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                                </button>
                                                {editingCompletionFacilityId && (
                                                    <button
                                                        type="button"
                                                        onClick={resetCompletionFacilityForm}
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

                                {/* Completion Facilities Table */}
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                            المنشآت المسجلة
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {completionFacilities.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={exportCompletionFacilitiesToExcel}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📊 تصدير Excel
                                                    </button>
                                                    <button
                                                        onClick={exportCompletionFacilitiesToWord}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📄 تصدير Word
                                                    </button>
                                                </>
                                            )}
                                            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    value={completionFacilityFilterMonth}
                                                    onChange={(e) => setCompletionFacilityFilterMonth(e.target.value)}
                                                    placeholder="فلترة حسب الشهر"
                                                />
                                            </div>
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
                                                {completionFacilities.length === 0 ? (
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
                                                    completionFacilities.map((facility, index) => (
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
                                                                            onClick={() => handleEditCompletionFacility(facility)}
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
                                                                            onClick={() => handleDeleteCompletionFacility(facility.id!)}
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
                            </>
                        )}
                    </div>
                )
            }

            {/* Payment Facilities Tracking Section - Only for dept6 */}
            {
                id === 'dept6' && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: isPaymentFacilitiesSectionExpanded ? '20px' : '0',
                                paddingBottom: isPaymentFacilitiesSectionExpanded ? '15px' : '0',
                                borderBottom: isPaymentFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsPaymentFacilitiesSectionExpanded(!isPaymentFacilitiesSectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                💰 مرحلة جاري سداد رسوم الزيارة التقييمية (طرف المنشأة) عدد {paymentFacilities.length} منشأة
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isPaymentFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isPaymentFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isPaymentFacilitiesSectionExpanded && (
                            <>
                                {userCanEdit ? (
                                    <>
                                        {paymentFacilitySubmitted && (
                                            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                                <strong>تم بنجاح!</strong> تم {editingPaymentFacilityId ? 'تحديث' : 'إضافة'} المنشأة بنجاح.
                                            </div>
                                        )}

                                        <form onSubmit={handlePaymentFacilitySubmit} style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">اسم المنشأة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={paymentFacilityFormData.facilityName}
                                                        onChange={(e) => handlePaymentFacilityInputChange('facilityName', e.target.value)}
                                                        placeholder="أدخل اسم المنشأة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">المحافظة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={paymentFacilityFormData.governorate}
                                                        onChange={(e) => handlePaymentFacilityInputChange('governorate', e.target.value)}
                                                        placeholder="أدخل المحافظة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">حالة الاعتماد *</label>
                                                    <select
                                                        className="form-input"
                                                        required
                                                        value={paymentFacilityFormData.accreditationStatus}
                                                        onChange={(e) => handlePaymentFacilityInputChange('accreditationStatus', e.target.value)}
                                                    >
                                                        <option value="">اختر حالة الاعتماد</option>
                                                        <option value="منشأة جديدة">منشأة جديدة</option>
                                                        <option value="تجديد / استكمال اعتماد">تجديد / استكمال اعتماد</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">الشهر *</label>
                                                    <input
                                                        type="month"
                                                        className="form-input"
                                                        required
                                                        value={paymentFacilityFormData.month}
                                                        onChange={(e) => handlePaymentFacilityInputChange('month', e.target.value)}
                                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button type="submit" className="btn btn-primary">
                                                    {editingPaymentFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                                </button>
                                                {editingPaymentFacilityId && (
                                                    <button
                                                        type="button"
                                                        onClick={resetPaymentFacilityForm}
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

                                {/* Payment Facilities Table */}
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                            المنشآت المسجلة
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {paymentFacilities.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={exportPaymentFacilitiesToExcel}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📊 تصدير Excel
                                                    </button>
                                                    <button
                                                        onClick={exportPaymentFacilitiesToWord}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📄 تصدير Word
                                                    </button>
                                                </>
                                            )}
                                            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    value={paymentFacilityFilterMonth}
                                                    onChange={(e) => setPaymentFacilityFilterMonth(e.target.value)}
                                                    placeholder="فلترة حسب الشهر"
                                                />
                                            </div>
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
                                                {paymentFacilities.length === 0 ? (
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
                                                    paymentFacilities.map((facility, index) => (
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
                                                                            onClick={() => handleEditPaymentFacility(facility)}
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
                                                                            onClick={() => handleDeletePaymentFacility(facility.id!)}
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
                            </>
                        )}
                    </div>
                )
            }


            {/* Paid Facilities Tracking Section - Only for dept6 */}
            {
                id === 'dept6' && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: isPaidFacilitiesSectionExpanded ? '20px' : '0',
                                paddingBottom: isPaidFacilitiesSectionExpanded ? '15px' : '0',
                                borderBottom: isPaidFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsPaidFacilitiesSectionExpanded(!isPaidFacilitiesSectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                ✅ المنشآت التي قامت بسداد رسوم الزيارة التقييمية - عدد {paidFacilities.length} منشأة
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isPaidFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isPaidFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isPaidFacilitiesSectionExpanded && (
                            <>
                                {userCanEdit ? (
                                    <>
                                        {paidFacilitySubmitted && (
                                            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                                <strong>تم بنجاح!</strong> تم {editingPaidFacilityId ? 'تحديث' : 'إضافة'} المنشأة بنجاح.
                                            </div>
                                        )}

                                        <form onSubmit={handlePaidFacilitySubmit} style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">اسم المنشأة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={paidFacilityFormData.facilityName}
                                                        onChange={(e) => handlePaidFacilityInputChange('facilityName', e.target.value)}
                                                        placeholder="أدخل اسم المنشأة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">المحافظة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={paidFacilityFormData.governorate}
                                                        onChange={(e) => handlePaidFacilityInputChange('governorate', e.target.value)}
                                                        placeholder="أدخل المحافظة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">حالة الاعتماد *</label>
                                                    <select
                                                        className="form-input"
                                                        required
                                                        value={paidFacilityFormData.accreditationStatus}
                                                        onChange={(e) => handlePaidFacilityInputChange('accreditationStatus', e.target.value)}
                                                    >
                                                        <option value="">اختر حالة الاعتماد</option>
                                                        <option value="اعتماد مبدئي">اعتماد مبدئي</option>
                                                        <option value="تجديد اعتماد مبدئي">تجديد اعتماد مبدئي</option>
                                                        <option value="اعتماد بعد اعتماد مبدئي">اعتماد بعد اعتماد مبدئي</option>
                                                        <option value="اعتماد">اعتماد</option>
                                                        <option value="تجديد اعتماد">تجديد اعتماد</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">القيمة المالية (جنيه) *</label>
                                                    <input
                                                        type="number"
                                                        className="form-input"
                                                        required
                                                        min="0"
                                                        step="0.01"
                                                        value={paidFacilityFormData.amount}
                                                        onChange={(e) => handlePaidFacilityInputChange('amount', e.target.value)}
                                                        placeholder="أدخل القيمة المالية"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">الشهر *</label>
                                                    <input
                                                        type="month"
                                                        className="form-input"
                                                        required
                                                        value={paidFacilityFormData.month}
                                                        onChange={(e) => handlePaidFacilityInputChange('month', e.target.value)}
                                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button type="submit" className="btn btn-primary">
                                                    {editingPaidFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                                </button>
                                                {editingPaidFacilityId && (
                                                    <button
                                                        type="button"
                                                        onClick={resetPaidFacilityForm}
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

                                {/* Paid Facilities Table */}
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                            المنشآت المسجلة
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {paidFacilities.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={exportPaidFacilitiesToExcel}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📊 تصدير Excel
                                                    </button>
                                                    <button
                                                        onClick={exportPaidFacilitiesToWord}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📄 تصدير Word
                                                    </button>
                                                </>
                                            )}
                                            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    value={paidFacilityFilterMonth}
                                                    onChange={(e) => setPaidFacilityFilterMonth(e.target.value)}
                                                    placeholder="فلترة حسب الشهر"
                                                />
                                            </div>
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
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>القيمة المالية</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                    {userCanEdit && (
                                                        <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>إجراءات</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {paidFacilities.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={userCanEdit ? 6 : 5} style={{
                                                            padding: '40px',
                                                            textAlign: 'center',
                                                            color: '#999'
                                                        }}>
                                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                            لا توجد منشآت مسجلة
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    paidFacilities.map((facility, index) => (
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
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#6f42c1' }}>
                                                                {facility.amount.toLocaleString('ar-EG')} ج.م
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
                                                                            onClick={() => handleEditPaidFacility(facility)}
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
                                                                            onClick={() => handleDeletePaidFacility(facility.id!)}
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
                            </>
                        )}
                    </div>
                )
            }

            {/* Medical Professional Registration Section - Only for dept6 */}
            {
                id === 'dept6' && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: isMedicalProfessionalSectionExpanded ? '20px' : '0',
                                paddingBottom: isMedicalProfessionalSectionExpanded ? '15px' : '0',
                                borderBottom: isMedicalProfessionalSectionExpanded ? '2px solid var(--background-color)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsMedicalProfessionalSectionExpanded(!isMedicalProfessionalSectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                👨‍⚕️ مرحلة تسجيل عضو مهن على المنصة - عدد {medicalProfessionalRegistrations.length} عضو مهن طبية
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isMedicalProfessionalSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isMedicalProfessionalSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isMedicalProfessionalSectionExpanded && (
                            <>
                                {userCanEdit ? (
                                    <>
                                        {medicalProfessionalSubmitted && (
                                            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                                <strong>تم بنجاح!</strong> تم {editingMedicalProfessionalId ? 'تحديث' : 'إضافة'} التسجيل بنجاح.
                                            </div>
                                        )}

                                        <form onSubmit={handleMedicalProfessionalSubmit} style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">نوع المنشأة *</label>
                                                    <select
                                                        className="form-input"
                                                        required
                                                        value={medicalProfessionalFormData.facilityType}
                                                        onChange={(e) => handleMedicalProfessionalInputChange('facilityType', e.target.value)}
                                                    >
                                                        <option value="">اختر نوع المنشأة</option>
                                                        <option value="صيدلية">صيدلية</option>
                                                        <option value="مستشفى">مستشفى</option>
                                                        <option value="عيادة">عيادة</option>
                                                        <option value="وحدة طب أسرة">وحدة طب أسرة</option>
                                                        <option value="مركز طب أسرة">مركز طب أسرة</option>
                                                        <option value="أخرى">أخرى</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">اسم المنشأة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={medicalProfessionalFormData.facilityName}
                                                        onChange={(e) => handleMedicalProfessionalInputChange('facilityName', e.target.value)}
                                                        placeholder="أدخل اسم المنشأة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">المحافظة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={medicalProfessionalFormData.governorate}
                                                        onChange={(e) => handleMedicalProfessionalInputChange('governorate', e.target.value)}
                                                        placeholder="أدخل المحافظة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">حالة الاعتماد *</label>
                                                    <select
                                                        className="form-input"
                                                        required
                                                        value={medicalProfessionalFormData.accreditationStatus}
                                                        onChange={(e) => handleMedicalProfessionalInputChange('accreditationStatus', e.target.value)}
                                                    >
                                                        <option value="">اختر حالة الاعتماد</option>
                                                        <option value="منشأة جديدة">منشأة جديدة</option>
                                                        <option value="تجديد / استكمال اعتماد">تجديد / استكمال اعتماد</option>
                                                    </select>
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">الشهر *</label>
                                                    <input
                                                        type="month"
                                                        className="form-input"
                                                        required
                                                        value={medicalProfessionalFormData.month}
                                                        onChange={(e) => handleMedicalProfessionalInputChange('month', e.target.value)}
                                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button type="submit" className="btn btn-primary">
                                                    {editingMedicalProfessionalId ? 'تحديث التسجيل' : 'إضافة تسجيل'}
                                                </button>
                                                {editingMedicalProfessionalId && (
                                                    <button
                                                        type="button"
                                                        onClick={resetMedicalProfessionalForm}
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

                                {/* Medical Professional Registrations Table */}
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                            التسجيلات المسجلة
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {medicalProfessionalRegistrations.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={exportMedicalProfessionalsToExcel}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📊 تصدير Excel
                                                    </button>
                                                    <button
                                                        onClick={exportMedicalProfessionalsToWord}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📄 تصدير Word
                                                    </button>
                                                </>
                                            )}
                                            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    value={medicalProfessionalFilterMonth}
                                                    onChange={(e) => setMedicalProfessionalFilterMonth(e.target.value)}
                                                    placeholder="فلترة حسب الشهر"
                                                />
                                            </div>
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
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>نوع المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                    {userCanEdit && (
                                                        <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>إجراءات</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {medicalProfessionalRegistrations.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={userCanEdit ? 6 : 5} style={{
                                                            padding: '40px',
                                                            textAlign: 'center',
                                                            color: '#999'
                                                        }}>
                                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                            لا توجد تسجيلات مسجلة
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    medicalProfessionalRegistrations.map((registration, index) => (
                                                        <tr key={registration.id} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                                        }}>
                                                            <td style={{ padding: '12px', fontWeight: '500' }}>
                                                                {registration.facilityName}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                {registration.governorate}
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
                                                                    {registration.accreditationStatus}
                                                                </span>
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#dc3545' }}>
                                                                {registration.facilityType}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>
                                                                {(() => {
                                                                    const [year, month] = registration.month.split('-');
                                                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                                                })()}
                                                            </td>
                                                            {userCanEdit && (
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                        <button
                                                                            onClick={() => handleEditMedicalProfessional(registration)}
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
                                                                            onClick={() => handleDeleteMedicalProfessional(registration.id!)}
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
                            </>
                        )}
                    </div>
                )
            }

            {/* Corrective Plan Facilities Tracking Section - Only for dept6 */}
            {
                id === 'dept6' && (
                    <div className="card" style={{ marginTop: '30px' }}>
                        <div
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer',
                                marginBottom: isCorrectivePlanFacilitiesSectionExpanded ? '20px' : '0',
                                paddingBottom: isCorrectivePlanFacilitiesSectionExpanded ? '15px' : '0',
                                borderBottom: isCorrectivePlanFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                                transition: 'all 0.3s ease'
                            }}
                            onClick={() => setIsCorrectivePlanFacilitiesSectionExpanded(!isCorrectivePlanFacilitiesSectionExpanded)}
                        >
                            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                                📋 متابعة الخطط التصحيحية - عدد {correctivePlanFacilities.length} منشأة
                            </h2>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                color: 'var(--primary-color)',
                                fontWeight: 'bold'
                            }}>
                                <span style={{ fontSize: '0.9rem' }}>
                                    {isCorrectivePlanFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                </span>
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isCorrectivePlanFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </div>
                        </div>

                        {isCorrectivePlanFacilitiesSectionExpanded && (
                            <>
                                {userCanEdit ? (
                                    <>
                                        {correctivePlanFacilitySubmitted && (
                                            <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                                <strong>تم بنجاح!</strong> تم {editingCorrectivePlanFacilityId ? 'تحديث' : 'إضافة'} المنشأة بنجاح.
                                            </div>
                                        )}

                                        <form onSubmit={handleCorrectivePlanFacilitySubmit} style={{ marginBottom: '30px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                <div className="form-group">
                                                    <label className="form-label">نوع المنشأة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={correctivePlanFacilityFormData.facilityType}
                                                        onChange={(e) => handleCorrectivePlanFacilityInputChange('facilityType', e.target.value)}
                                                        placeholder="أدخل نوع المنشأة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">اسم المنشأة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={correctivePlanFacilityFormData.facilityName}
                                                        onChange={(e) => handleCorrectivePlanFacilityInputChange('facilityName', e.target.value)}
                                                        placeholder="أدخل اسم المنشأة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">المحافظة *</label>
                                                    <input
                                                        type="text"
                                                        className="form-input"
                                                        required
                                                        value={correctivePlanFacilityFormData.governorate}
                                                        onChange={(e) => handleCorrectivePlanFacilityInputChange('governorate', e.target.value)}
                                                        placeholder="أدخل المحافظة"
                                                    />
                                                </div>

                                                <div className="form-group">
                                                    <label className="form-label">الشهر *</label>
                                                    <input
                                                        type="month"
                                                        className="form-input"
                                                        required
                                                        value={correctivePlanFacilityFormData.month}
                                                        onChange={(e) => handleCorrectivePlanFacilityInputChange('month', e.target.value)}
                                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                    />
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                                <button type="submit" className="btn btn-primary">
                                                    {editingCorrectivePlanFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                                </button>
                                                {editingCorrectivePlanFacilityId && (
                                                    <button
                                                        type="button"
                                                        onClick={resetCorrectivePlanFacilityForm}
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

                                {/* Corrective Plan Facilities Table */}
                                <div style={{ marginTop: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                        <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                            المنشآت المسجلة
                                        </h3>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            {correctivePlanFacilities.length > 0 && (
                                                <>
                                                    <button
                                                        onClick={exportCorrectivePlanFacilitiesToExcel}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#28a745',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📊 تصدير Excel
                                                    </button>
                                                    <button
                                                        onClick={exportCorrectivePlanFacilitiesToWord}
                                                        style={{
                                                            padding: '8px 16px',
                                                            backgroundColor: '#007bff',
                                                            color: 'white',
                                                            border: 'none',
                                                            borderRadius: '6px',
                                                            cursor: 'pointer',
                                                            fontSize: '0.9rem',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '5px'
                                                        }}
                                                    >
                                                        📄 تصدير Word
                                                    </button>
                                                </>
                                            )}
                                            <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    value={correctivePlanFacilityFilterMonth}
                                                    onChange={(e) => setCorrectivePlanFacilityFilterMonth(e.target.value)}
                                                    placeholder="فلترة حسب الشهر"
                                                />
                                            </div>
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
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                    {userCanEdit && (
                                                        <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>إجراءات</th>
                                                    )}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {correctivePlanFacilities.length === 0 ? (
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
                                                    correctivePlanFacilities.map((facility, index) => (
                                                        <tr key={facility.id} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                                        }}>
                                                            <td style={{ padding: '12px', fontWeight: '500' }}>
                                                                {facility.facilityType}
                                                            </td>
                                                            <td style={{ padding: '12px', fontWeight: '500' }}>
                                                                {facility.facilityName}
                                                            </td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                {facility.governorate}
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
                                                                            onClick={() => handleEditCorrectivePlanFacility(facility)}
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
                                                                            onClick={() => handleDeleteCorrectivePlanFacility(facility.id!)}
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
                            </>
                        )}
                    </div>
                )
            }


            {
                submissions.length > 0 && (
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
                                        {activeFields.filter(f => f.name !== 'notes' && f.name !== 'obstacles' && f.name !== 'developmentProposals' && f.name !== 'additionalActivities').map(field => (
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
                                            {activeFields.filter(f => f.name !== 'notes' && f.name !== 'obstacles' && f.name !== 'developmentProposals' && f.name !== 'additionalActivities').map(field => (
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
                                            {activeFields.filter(f => f.name !== 'notes' && f.name !== 'obstacles').map((field, index) => (
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
                )
            }

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
                        <AccreditationDashboard submissions={submissions} facilities={facilities} completionFacilities={completionFacilities} paymentFacilities={paymentFacilities} paidFacilities={paidFacilities} medicalProfessionalRegistrations={medicalProfessionalRegistrations} />
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
