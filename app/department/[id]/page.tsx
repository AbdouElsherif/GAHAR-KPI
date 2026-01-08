'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, canEdit, canAccessDepartment, User, onAuthChange } from '@/lib/auth';
import {
    saveKPIData, getKPIData, updateKPIData, saveAccreditationFacility, getAccreditationFacilities, updateAccreditationFacility, deleteAccreditationFacility, type AccreditationFacility, saveCompletionFacility, getCompletionFacilities, updateCompletionFacility, deleteCompletionFacility, type CompletionFacility, savePaymentFacility, getPaymentFacilities, updatePaymentFacility, deletePaymentFacility, type PaymentFacility, saveCorrectivePlanFacility, getCorrectivePlanFacilities, updateCorrectivePlanFacility, deleteCorrectivePlanFacility, type CorrectivePlanFacility, type BasicRequirementsFacility, saveBasicRequirementsFacility, getBasicRequirementsFacilities, updateBasicRequirementsFacility, deleteBasicRequirementsFacility, type AppealsFacility, saveAppealsFacility, getAppealsFacilities, updateAppealsFacility, deleteAppealsFacility, savePaidFacility, getPaidFacilities, updatePaidFacility, deletePaidFacility, type PaidFacility, saveMedicalProfessionalRegistration, getMedicalProfessionalRegistrations, updateMedicalProfessionalRegistration, deleteMedicalProfessionalRegistration, type MedicalProfessionalRegistration, saveTechnicalClinicalFacility, getTechnicalClinicalFacilities, updateTechnicalClinicalFacility, deleteTechnicalClinicalFacility, type TechnicalClinicalFacility, saveAdminAuditFacility, getAdminAuditFacilities, updateAdminAuditFacility, deleteAdminAuditFacility, type AdminAuditFacility, saveAdminAuditObservation, getAdminAuditObservations, updateAdminAuditObservation, deleteAdminAuditObservation, type AdminAuditObservation, saveObservationCorrectionRate, getObservationCorrectionRates, updateObservationCorrectionRate, deleteObservationCorrectionRate, type ObservationCorrectionRate, saveTechnicalClinicalObservation, getTechnicalClinicalObservations, updateTechnicalClinicalObservation, deleteTechnicalClinicalObservation, type TechnicalClinicalObservation, saveTechnicalClinicalCorrectionRate, getTechnicalClinicalCorrectionRates, updateTechnicalClinicalCorrectionRate, deleteTechnicalClinicalCorrectionRate, type TechnicalClinicalCorrectionRate, saveTechnicalSupportVisit, getTechnicalSupportVisits, updateTechnicalSupportVisit, deleteTechnicalSupportVisit, type TechnicalSupportVisit, saveRemoteTechnicalSupport, getRemoteTechnicalSupports, updateRemoteTechnicalSupport, deleteRemoteTechnicalSupport, type RemoteTechnicalSupport, saveIntroductorySupportVisit, getIntroductorySupportVisits, updateIntroductorySupportVisit, deleteIntroductorySupportVisit, type IntroductorySupportVisit, saveQueuedSupportVisit, getQueuedSupportVisits, updateQueuedSupportVisit, deleteQueuedSupportVisit, type QueuedSupportVisit, saveScheduledSupportVisit, getScheduledSupportVisits, updateScheduledSupportVisit, deleteScheduledSupportVisit, type ScheduledSupportVisit, saveAccreditedSupportedFacility, getAccreditedSupportedFacilities, updateAccreditedSupportedFacility, deleteAccreditedSupportedFacility, type AccreditedSupportedFacility, saveReviewerEvaluationVisit, getReviewerEvaluationVisits, updateReviewerEvaluationVisit, deleteReviewerEvaluationVisit, type ReviewerEvaluationVisit, saveReviewerEvaluationVisitByGovernorate, getReviewerEvaluationVisitsByGovernorate, updateReviewerEvaluationVisitByGovernorate, deleteReviewerEvaluationVisitByGovernorate, type ReviewerEvaluationVisitByGovernorate, saveReviewerEvaluationVisitByType, getReviewerEvaluationVisitsByType, updateReviewerEvaluationVisitByType, deleteReviewerEvaluationVisitByType, type ReviewerEvaluationVisitByType, saveMedicalProfessionalByCategory, getMedicalProfessionalsByCategory, updateMedicalProfessionalByCategory, deleteMedicalProfessionalByCategory, type MedicalProfessionalByCategory,
    saveMedicalProfessionalByGovernorate, getMedicalProfessionalsByGovernorate, updateMedicalProfessionalByGovernorate, deleteMedicalProfessionalByGovernorate, type MedicalProfessionalByGovernorate, saveTrainingEntity, getTrainingEntities, updateTrainingEntity, deleteTrainingEntity, type TrainingEntity, saveProgramType, getProgramTypes, updateProgramType, deleteProgramType, type ProgramType,
    saveTotalMedProfByCategory, getTotalMedProfsByCategory, updateTotalMedProfByCategory, deleteTotalMedProfByCategory, type TotalMedicalProfessionalByCategory,
    saveTotalMedProfByGovernorate, getTotalMedProfsByGovernorate, updateTotalMedProfByGovernorate, deleteTotalMedProfByGovernorate, type TotalMedicalProfessionalByGovernorate
} from '@/lib/firestore';


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
import ReviewersDashboard from '@/components/ReviewersDashboard';
import StandardsDashboard from '@/components/StandardsDashboard';
import { ProgramTypesSection } from '@/components/dept1';
import { GovernorateCustomerSurveysSection } from '@/components/dept3';


const departments: Record<string, string> = {
    'dept1': 'الإدارة العامة للتدريب للغير',
    'dept2': 'الإدارة العامة للدعم الفني',
    'dept3': 'الإدارة العامة لرضاء المتعاملين',
    'dept4': 'الإدارة العامة للرقابة الفنية والإكلينيكية',
    'dept5': 'الإدارة العامة للرقابة الإدارية على المنشآت الصحية',
    'dept6': 'الإدارة العامة للاعتماد والتسجيل',
    'dept7': 'الإدارة العامة لتسجيل أعضاء المهن الطبية',
    'dept8': 'الإدارة العامة لأبحاث وتطوير المعايير',
    'dept9': 'الإدارة العامة لشئون المراجعين',
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
        { name: 'toolReleasesUpdates', label: 'عدد الإصدارات والتحديثات المنفذة لأدوات التقييم الذاتي', type: 'number' },
        { name: 'reportsComplianceRate', label: 'نسبة استيفاء تقارير الدعم الفني وإرسالها للمنشآت خلال 15 يوما (%)', type: 'number' },
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
        { name: 'visitedGovernorates', label: 'محافظات تمت زيارتها', type: 'number' },
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
        { name: 'adminAuditVisits', label: 'تدقيق إداري وسلامة بيئية', type: 'number' },
        { name: 'adminInspectionVisits', label: 'تفتيش إداري', type: 'number' },
        { name: 'followUpVisits', label: 'زيارات متابعة', type: 'number' },
        { name: 'examReferralVisits', label: 'فحص / إحالة / تكليف', type: 'number' },
        { name: 'visitedFacilities', label: 'عدد المنشآت التي تم زيارتها', type: 'number' },
        { name: 'healthPlanning', label: 'تخطيط صحي', type: 'number' },
        { name: 'environmentalSafetyAudit', label: 'تدقيق على السلامة البيئية', type: 'number' },
        { name: 'seriousIncidentExam', label: 'فحص حدث جسيم', type: 'number' },
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
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept9': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'totalEvaluationVisits', label: 'إجمالي الزيارات التقييمية', type: 'number' },
        { name: 'evaluationDays', label: 'عدد أيام التقييم', type: 'number' },
        { name: 'visitsToInsuranceGovernorate', label: 'عدد الزيارات لمحافظات التأمين الصحي الشامل', type: 'number' },
        { name: 'visitsToGovFacilities', label: 'عدد الزيارات للمنشآت الحكومية', type: 'number' },
        { name: 'visitsToPrivateFacilities', label: 'عدد الزيارات لمنشآت القطاع الخاص', type: 'number' },
        { name: 'visitsToMOHFacilities', label: 'عدد الزيارات لمنشآت وزارة الصحة والسكان', type: 'number' },
        { name: 'accreditationCommittees', label: 'عدد لجان الاعتماد المنعقدة', type: 'number' },
        { name: 'reportsToCommittee', label: 'عدد تقارير الزيارات التقييمية المعروضة على اللجنة', type: 'number' },
        { name: 'appealsSubmitted', label: 'عدد الالتماسات المقدمة', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
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

// Egypt Governorates
const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'الوادي الجديد', 'الشرقية', 'السويس', 'أسوان', 'أسيوط', 'بني سويف',
    'بورسعيد', 'دمياط', 'الأقصر', 'مطروح', 'قنا', 'شمال سيناء', 'جنوب سيناء',
    'كفر الشيخ', 'سوهاج'
];

// Facility Types for Technical Support
const techSupportFacilityTypes = [
    'مستشفيات',
    'عيادات خاصة',
    'معامل',
    'صيدليات',
    'مراكز جراحات اليوم الواحد'
];

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
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

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
    const [isReviewersDashboardOpen, setIsReviewersDashboardOpen] = useState(false);
    const [isStandardsDashboardOpen, setIsStandardsDashboardOpen] = useState(false);

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

    // Basic Requirements Facilities tracking states (for dept6 only)
    const [basicRequirementsFacilities, setBasicRequirementsFacilities] = useState<BasicRequirementsFacility[]>([]);
    const [basicRequirementsFacilityFormData, setBasicRequirementsFacilityFormData] = useState({
        facilityType: '',
        facilityName: '',
        governorate: '',
        month: ''
    });
    const [editingBasicRequirementsFacilityId, setEditingBasicRequirementsFacilityId] = useState<string | null>(null);
    const [basicRequirementsFacilityFilterMonth, setBasicRequirementsFacilityFilterMonth] = useState('');
    const [basicRequirementsFacilitySubmitted, setBasicRequirementsFacilitySubmitted] = useState(false);
    const [isBasicRequirementsFacilitiesSectionExpanded, setIsBasicRequirementsFacilitiesSectionExpanded] = useState(false);

    // Technical Support Visits tracking states (for dept2 only)
    const [techSupportVisits, setTechSupportVisits] = useState<TechnicalSupportVisit[]>([]);
    const [techSupportVisitFormData, setTechSupportVisitFormData] = useState({
        facilityName: '',
        governorate: '',
        visitType: '',
        affiliatedEntity: '',
        facilityType: '',
        month: ''
    });
    const [editingTechSupportVisitId, setEditingTechSupportVisitId] = useState<string | null>(null);
    const [techSupportVisitsFilter, setTechSupportVisitsFilter] = useState('');
    const [isTechSupportVisitsSectionExpanded, setIsTechSupportVisitsSectionExpanded] = useState(false);

    // Remote Technical Support tracking states (الدعم الفني عن بعد for dept2 only)
    const [remoteTechnicalSupports, setRemoteTechnicalSupports] = useState<RemoteTechnicalSupport[]>([]);
    const [remoteTechSupportFormData, setRemoteTechSupportFormData] = useState({
        facilityName: '',
        governorate: '',
        visitType: '',
        affiliatedEntity: '',
        facilityType: '',
        month: ''
    });
    const [editingRemoteTechSupportId, setEditingRemoteTechSupportId] = useState<string | null>(null);
    const [remoteTechSupportFilter, setRemoteTechSupportFilter] = useState('');
    const [isRemoteTechSupportSectionExpanded, setIsRemoteTechSupportSectionExpanded] = useState(false);

    // Introductory Support Visit tracking states (زيارات الدعم الفني التمهيدية for dept2 only)
    const [introSupportVisits, setIntroSupportVisits] = useState<IntroductorySupportVisit[]>([]);
    const [introSupportVisitFormData, setIntroSupportVisitFormData] = useState({
        facilityName: '',
        governorate: '',
        visitType: '',
        affiliatedEntity: '',
        facilityType: '',
        month: ''
    });
    const [editingIntroSupportVisitId, setEditingIntroSupportVisitId] = useState<string | null>(null);
    const [introSupportVisitsFilter, setIntroSupportVisitsFilter] = useState('');
    const [isIntroSupportVisitsSectionExpanded, setIsIntroSupportVisitsSectionExpanded] = useState(false);

    // Queued Support Visit tracking states (زيارات الدعم الفني بقائمة الانتظار for dept2 only)
    const [queuedSupportVisits, setQueuedSupportVisits] = useState<QueuedSupportVisit[]>([]);
    const [queuedSupportVisitFormData, setQueuedSupportVisitFormData] = useState({
        facilityName: '',
        governorate: '',
        month: ''
    });
    const [editingQueuedSupportVisitId, setEditingQueuedSupportVisitId] = useState<string | null>(null);
    const [queuedSupportVisitsFilter, setQueuedSupportVisitsFilter] = useState('');
    const [isQueuedSupportVisitsSectionExpanded, setIsQueuedSupportVisitsSectionExpanded] = useState(false);

    // Scheduled Support Visit tracking states (زيارات الدعم الفني المجدولة في شهر .... for dept2 only)
    const [scheduledSupportVisits, setScheduledSupportVisits] = useState<ScheduledSupportVisit[]>([]);
    const [scheduledSupportVisitFormData, setScheduledSupportVisitFormData] = useState({
        facilityName: '',
        governorate: '',
        visitType: '',
        month: ''
    });
    const [editingScheduledSupportVisitId, setEditingScheduledSupportVisitId] = useState<string | null>(null);
    const [scheduledSupportVisitsFilter, setScheduledSupportVisitsFilter] = useState('');
    const [isScheduledSupportVisitsSectionExpanded, setIsScheduledSupportVisitsSectionExpanded] = useState(false);

    // Accredited Supported Facilities states (for dept2 only)
    const [accreditedSupportedFacilities, setAccreditedSupportedFacilities] = useState<AccreditedSupportedFacility[]>([]);
    const [accreditedSupportedFacilityFormData, setAccreditedSupportedFacilityFormData] = useState({
        facilityName: '',
        governorate: '',
        decisionNumber: '',
        decisionDate: '',
        supportType: '',
        accreditationStatus: '',
        month: ''
    });
    const [editingAccreditedSupportedFacilityId, setEditingAccreditedSupportedFacilityId] = useState<string | null>(null);
    const [accreditedSupportedFacilitiesFilter, setAccreditedSupportedFacilitiesFilter] = useState('');
    const [isAccreditedSupportedFacilitiesSectionExpanded, setIsAccreditedSupportedFacilitiesSectionExpanded] = useState(false);

    // Appeals Facilities tracking states (for dept6 only)
    const [appealsFacilities, setAppealsFacilities] = useState<AppealsFacility[]>([]);
    const [appealsFacilityFormData, setAppealsFacilityFormData] = useState({
        facilityType: '',
        facilityName: '',
        governorate: '',
        month: ''
    });
    const [editingAppealsFacilityId, setEditingAppealsFacilityId] = useState<string | null>(null);
    const [appealsFacilityFilterMonth, setAppealsFacilityFilterMonth] = useState('');
    const [appealsFacilitySubmitted, setAppealsFacilitySubmitted] = useState(false);
    const [isAppealsFacilitiesSectionExpanded, setIsAppealsFacilitiesSectionExpanded] = useState(false);


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

    // Technical Clinical Facilities tracking states (for dept4)
    const [technicalClinicalFacilities, setTechnicalClinicalFacilities] = useState<TechnicalClinicalFacility[]>([]);
    const [technicalClinicalFacilityFormData, setTechnicalClinicalFacilityFormData] = useState({
        facilityType: '',
        facilityName: '',
        visitType: '',
        assessmentType: '',
        governorate: '',
        month: ''
    });
    const [editingTechnicalClinicalFacilityId, setEditingTechnicalClinicalFacilityId] = useState<string | null>(null);
    const [technicalClinicalFacilityFilterMonth, setTechnicalClinicalFacilityFilterMonth] = useState('');
    const [technicalClinicalFacilitySubmitted, setTechnicalClinicalFacilitySubmitted] = useState(false);
    const [isTechnicalClinicalFacilitiesSectionExpanded, setIsTechnicalClinicalFacilitiesSectionExpanded] = useState(false);

    // Technical Clinical Observations tracking states (الملاحظات المتكررة for dept4)
    const [technicalClinicalObservations, setTechnicalClinicalObservations] = useState<TechnicalClinicalObservation[]>([]);
    const [technicalClinicalObservationFormData, setTechnicalClinicalObservationFormData] = useState({
        entityType: '',
        facilityType: '',
        observation: '',
        percentage: '',
        month: ''
    });
    const [editingTechnicalClinicalObservationId, setEditingTechnicalClinicalObservationId] = useState<string | null>(null);
    const [technicalClinicalObservationFilterMonth, setTechnicalClinicalObservationFilterMonth] = useState('');
    const [technicalClinicalObservationSubmitted, setTechnicalClinicalObservationSubmitted] = useState(false);
    const [isTechnicalClinicalObservationsSectionExpanded, setIsTechnicalClinicalObservationsSectionExpanded] = useState(false);

    // Admin Audit Facilities tracking states (for dept5)
    const [adminAuditFacilities, setAdminAuditFacilities] = useState<AdminAuditFacility[]>([]);
    const [adminAuditFacilityFormData, setAdminAuditFacilityFormData] = useState({
        facilityType: '',
        facilityName: '',
        visitType: '',
        governorate: '',
        month: ''
    });
    const [editingAdminAuditFacilityId, setEditingAdminAuditFacilityId] = useState<string | null>(null);
    const [adminAuditFacilityFilterMonth, setAdminAuditFacilityFilterMonth] = useState('');
    const [adminAuditFacilitySubmitted, setAdminAuditFacilitySubmitted] = useState(false);
    const [isAdminAuditFacilitiesSectionExpanded, setIsAdminAuditFacilitiesSectionExpanded] = useState(false);

    // Admin Audit Observations tracking states (الملاحظات المتكررة for dept5)
    const [adminAuditObservations, setAdminAuditObservations] = useState<AdminAuditObservation[]>([]);
    const [adminAuditObservationFormData, setAdminAuditObservationFormData] = useState({
        entityType: '',
        facilityType: '',
        observation: '',
        percentage: '',
        month: ''
    });
    const [editingAdminAuditObservationId, setEditingAdminAuditObservationId] = useState<string | null>(null);
    const [adminAuditObservationFilterMonth, setAdminAuditObservationFilterMonth] = useState('');
    const [adminAuditObservationSubmitted, setAdminAuditObservationSubmitted] = useState(false);
    const [isAdminAuditObservationsSectionExpanded, setIsAdminAuditObservationsSectionExpanded] = useState(false);

    // Observation Correction Rate states (نسب تصحيح الملاحظات for dept5)
    const [correctionRates, setCorrectionRates] = useState<ObservationCorrectionRate[]>([]);
    const [correctionRateFormData, setCorrectionRateFormData] = useState({
        entityType: '',
        facilityCategory: '',
        facilityName: '',
        governorate: '',
        visitDate: '',
        visitType: '',
        month: '',
        pccTotal: '', pccCorrected: '',
        efsTotal: '', efsCorrected: '',
        ogmTotal: '', ogmCorrected: '',
        imtTotal: '', imtCorrected: '',
        wfmTotal: '', wfmCorrected: '',
        caiTotal: '', caiCorrected: '',
        qpiTotal: '', qpiCorrected: '',
        mrsTotal: '', mrsCorrected: '',
        scmTotal: '', scmCorrected: '',
        emsTotal: '', emsCorrected: ''
    });
    const [editingCorrectionRateId, setEditingCorrectionRateId] = useState<string | null>(null);
    const [correctionRateFilterMonth, setCorrectionRateFilterMonth] = useState('');
    const [correctionRateSubmitted, setCorrectionRateSubmitted] = useState(false);
    const [isCorrectionRateSectionExpanded, setIsCorrectionRateSectionExpanded] = useState(false);

    // Technical Clinical Correction Rate states (نسب تصحيح الملاحظات for dept4)
    const [tcCorrectionRates, setTcCorrectionRates] = useState<TechnicalClinicalCorrectionRate[]>([]);
    const [tcCorrectionRateFormData, setTcCorrectionRateFormData] = useState({
        entityType: '',
        facilityCategory: '',
        facilityName: '',
        governorate: '',
        visitDate: '',
        visitType: '',
        month: '',
        actTotal: '', actCorrected: '',
        icdTotal: '', icdCorrected: '',
        dasTotal: '', dasCorrected: '',
        mmsTotal: '', mmsCorrected: '',
        sipTotal: '', sipCorrected: '',
        ipcTotal: '', ipcCorrected: '',
        scmTotal: '', scmCorrected: '',
        texTotal: '', texCorrected: '',
        teqTotal: '', teqCorrected: '',
        tpoTotal: '', tpoCorrected: '',
        nsrTotal: '', nsrCorrected: '',
        sasTotal: '', sasCorrected: ''
    });

    const [editingTcCorrectionRateId, setEditingTcCorrectionRateId] = useState<string | null>(null);
    const [tcCorrectionRateFilterMonth, setTcCorrectionRateFilterMonth] = useState('');
    const [tcCorrectionRateSubmitted, setTcCorrectionRateSubmitted] = useState(false);
    const [isTcCorrectionRateSectionExpanded, setIsTcCorrectionRateSectionExpanded] = useState(false);

    // Reviewer Evaluation Visits states (الزيارات التقييمية وفقا لنوع المنشأة for dept9)
    const [reviewerEvaluationVisits, setReviewerEvaluationVisits] = useState<ReviewerEvaluationVisit[]>([]);
    const [reviewerEvaluationVisitFormData, setReviewerEvaluationVisitFormData] = useState({
        month: '',
        facilityType: '',
        visitsCount: ''
    });
    const [editingReviewerEvaluationVisitId, setEditingReviewerEvaluationVisitId] = useState<string | null>(null);
    const [reviewerEvaluationVisitFilterMonth, setReviewerEvaluationVisitFilterMonth] = useState('');
    const [reviewerEvaluationVisitSubmitted, setReviewerEvaluationVisitSubmitted] = useState(false);
    const [isReviewerEvaluationVisitsSectionExpanded, setIsReviewerEvaluationVisitsSectionExpanded] = useState(false);

    // Reviewer Evaluation Visits By Governorate states (عدد الزيارات التقييمية وفقا للمحافظة for dept9)
    const [reviewerEvaluationVisitsByGovernorate, setReviewerEvaluationVisitsByGovernorate] = useState<ReviewerEvaluationVisitByGovernorate[]>([]);
    const [reviewerEvaluationVisitByGovernorateFormData, setReviewerEvaluationVisitByGovernorateFormData] = useState({
        month: '',
        governorate: '',
        visitsCount: ''
    });
    const [editingReviewerEvaluationVisitByGovernorateId, setEditingReviewerEvaluationVisitByGovernorateId] = useState<string | null>(null);
    const [reviewerEvaluationVisitByGovernorateFilterMonth, setReviewerEvaluationVisitByGovernorateFilterMonth] = useState('');
    const [reviewerEvaluationVisitByGovernorateSubmitted, setReviewerEvaluationVisitByGovernorateSubmitted] = useState(false);
    const [isReviewerEvaluationVisitsByGovernorateSectionExpanded, setIsReviewerEvaluationVisitsByGovernorateSectionExpanded] = useState(false);

    // Reviewer Evaluation Visits By Visit Type states (الزيارات التقييمية وفقا لنوع الزيارة for dept9)
    const [reviewerEvaluationVisitsByType, setReviewerEvaluationVisitsByType] = useState<ReviewerEvaluationVisitByType[]>([]);
    const [reviewerEvaluationVisitByTypeFormData, setReviewerEvaluationVisitByTypeFormData] = useState({
        month: '',
        visitType: '',
        visitsCount: ''
    });
    const [editingReviewerEvaluationVisitByTypeId, setEditingReviewerEvaluationVisitByTypeId] = useState<string | null>(null);
    const [reviewerEvaluationVisitByTypeFilterMonth, setReviewerEvaluationVisitByTypeFilterMonth] = useState('');
    const [reviewerEvaluationVisitByTypeSubmitted, setReviewerEvaluationVisitByTypeSubmitted] = useState(false);
    const [isReviewerEvaluationVisitsByTypeSectionExpanded, setIsReviewerEvaluationVisitsByTypeSectionExpanded] = useState(false);

    // Medical Professionals By Category states (for dept7 only)
    const [medProfsByCategory, setMedProfsByCategory] = useState<MedicalProfessionalByCategory[]>([]);
    const [medProfByCategoryFormData, setMedProfByCategoryFormData] = useState({
        month: '',
        branch: '',
        doctors: '',
        dentists: '',
        pharmacists: '',
        physiotherapy: '',
        veterinarians: '',
        seniorNursing: '',
        technicalNursing: '',
        healthTechnician: '',
        scientists: ''
    });
    const [editingMedProfByCategoryId, setEditingMedProfByCategoryId] = useState<string | null>(null);
    const [medProfByCategoryFilterMonth, setMedProfByCategoryFilterMonth] = useState('');
    const [medProfByCategorySubmitted, setMedProfByCategorySubmitted] = useState(false);
    const [isMedProfByCategorySectionExpanded, setIsMedProfByCategorySectionExpanded] = useState(false);

    // Medical Professionals By Governorate State
    const [medProfsByGovernorate, setMedProfsByGovernorate] = useState<MedicalProfessionalByGovernorate[]>([]);
    const [medProfByGovernorateFormData, setMedProfByGovernorateFormData] = useState<Omit<MedicalProfessionalByGovernorate, 'id' | 'createdAt' | 'updatedAt' | 'total'>>({
        month: '',
        governorate: '',
        doctors: 0,
        dentists: 0,
        pharmacists: 0,
        physiotherapy: 0,
        veterinarians: 0,
        seniorNursing: 0,
        technicalNursing: 0,
        healthTechnician: 0,
        scientists: 0,
        year: new Date().getFullYear()
    });
    const [editingMedProfByGovernorateId, setEditingMedProfByGovernorateId] = useState<string | null>(null);
    const [medProfByGovernorateFilterMonth, setMedProfByGovernorateFilterMonth] = useState('');
    const [medProfByGovernorateSubmitted, setMedProfByGovernorateSubmitted] = useState(false);
    const [isMedProfByGovernorateSectionExpanded, setIsMedProfByGovernorateSectionExpanded] = useState(false);

    // Total Medical Professionals By Category State (الإجمالي الكلي لأعضاء المهن الطبية طبقا للفئة for dept7)
    const [totalMedProfsByCategory, setTotalMedProfsByCategory] = useState<TotalMedicalProfessionalByCategory[]>([]);
    const [totalMedProfByCategoryFormData, setTotalMedProfByCategoryFormData] = useState({
        month: '',
        branch: '',
        doctors: '',
        dentists: '',
        pharmacists: '',
        physiotherapy: '',
        veterinarians: '',
        seniorNursing: '',
        technicalNursing: '',
        healthTechnician: '',
        scientists: ''
    });
    const [editingTotalMedProfByCategoryId, setEditingTotalMedProfByCategoryId] = useState<string | null>(null);
    const [totalMedProfByCategoryFilterMonth, setTotalMedProfByCategoryFilterMonth] = useState('');
    const [totalMedProfByCategorySubmitted, setTotalMedProfByCategorySubmitted] = useState(false);
    const [isTotalMedProfByCategorySectionExpanded, setIsTotalMedProfByCategorySectionExpanded] = useState(false);

    // Total Medical Professionals By Governorate State (الإجمالي الكلي لأعضاء المهن الطبية بالمحافظات for dept7)
    const [totalMedProfsByGovernorate, setTotalMedProfsByGovernorate] = useState<TotalMedicalProfessionalByGovernorate[]>([]);
    const [totalMedProfByGovernorateFormData, setTotalMedProfByGovernorateFormData] = useState({
        month: '',
        governorate: '',
        doctors: '',
        dentists: '',
        pharmacists: '',
        physiotherapy: '',
        veterinarians: '',
        seniorNursing: '',
        technicalNursing: '',
        healthTechnician: '',
        scientists: ''
    });
    const [editingTotalMedProfByGovernorateId, setEditingTotalMedProfByGovernorateId] = useState<string | null>(null);
    const [totalMedProfByGovernorateFilterMonth, setTotalMedProfByGovernorateFilterMonth] = useState('');
    const [totalMedProfByGovernorateSubmitted, setTotalMedProfByGovernorateSubmitted] = useState(false);
    const [isTotalMedProfByGovernorateSectionExpanded, setIsTotalMedProfByGovernorateSectionExpanded] = useState(false);

    // Training Entities State (الجهات الحاصلة على التدريب for dept1)
    const [trainingEntities, setTrainingEntities] = useState<TrainingEntity[]>([]);
    const [trainingEntityFormData, setTrainingEntityFormData] = useState({
        entityName: '',
        traineesCount: '',
        month: ''
    });
    const [editingTrainingEntityId, setEditingTrainingEntityId] = useState<string | null>(null);
    const [trainingEntityFilterMonth, setTrainingEntityFilterMonth] = useState('');
    const [isTrainingEntitiesSectionExpanded, setIsTrainingEntitiesSectionExpanded] = useState(false);


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

    useEffect(() => {
        if (id === 'dept2') {
            loadTechSupportVisits();
            loadRemoteTechnicalSupports();
            loadIntroSupportVisits();
            loadQueuedSupportVisits();
            loadScheduledSupportVisits();
            loadAccreditedSupportedFacilities();
        }
    }, [id]);

    const loadTechSupportVisits = async () => {
        const visits = await getTechnicalSupportVisits();
        setTechSupportVisits(visits);
    };

    const loadRemoteTechnicalSupports = async () => {
        const supports = await getRemoteTechnicalSupports();
        setRemoteTechnicalSupports(supports);
    };

    const loadIntroSupportVisits = async () => {
        const visits = await getIntroductorySupportVisits();
        setIntroSupportVisits(visits);
    };

    const loadQueuedSupportVisits = async () => {
        const visits = await getQueuedSupportVisits();
        setQueuedSupportVisits(visits);
    };

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

    // Load basic requirements facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadBasicRequirementsFacilities();
        }
    }, [id, currentUser, basicRequirementsFacilityFilterMonth]);

    // Load appeals facilities for dept6
    useEffect(() => {
        if (id === 'dept6' && currentUser) {
            loadAppealsFacilities();
        }
    }, [id, currentUser, appealsFacilityFilterMonth]);


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

    // Load Technical Clinical facilities for dept4
    useEffect(() => {
        if (id === 'dept4' && currentUser) {
            loadTechnicalClinicalFacilities();
        }
    }, [id, currentUser, technicalClinicalFacilityFilterMonth]);

    // Load Technical Clinical observations for dept4
    useEffect(() => {
        if (id === 'dept4' && currentUser) {
            loadTechnicalClinicalObservations();
        }
    }, [id, currentUser, technicalClinicalObservationFilterMonth]);

    // Load Admin Audit facilities for dept5
    useEffect(() => {
        if (id === 'dept5' && currentUser) {
            loadAdminAuditFacilities();
        }
    }, [id, currentUser, adminAuditFacilityFilterMonth]);

    // Load Admin Audit observations for dept5
    useEffect(() => {
        if (id === 'dept5' && currentUser) {
            loadAdminAuditObservations();
        }
    }, [id, currentUser, adminAuditObservationFilterMonth]);

    // Load Observation Correction Rates for dept5
    useEffect(() => {
        if (id === 'dept5' && currentUser) {
            loadCorrectionRates();
        }
    }, [id, currentUser, correctionRateFilterMonth]);

    // Load Technical Clinical Correction Rates for dept4
    useEffect(() => {
        if (id === 'dept4' && currentUser) {
            loadTcCorrectionRates();
        }
    }, [id, currentUser, tcCorrectionRateFilterMonth]);

    // Load Scheduled Support Visits when filter changes (for dept2)
    useEffect(() => {
        if (id === 'dept2' && currentUser) {
            loadScheduledSupportVisits();
        }
    }, [id, currentUser, scheduledSupportVisitsFilter]);

    // Load Accredited Supported Facilities when filter changes (for dept2)
    useEffect(() => {
        if (id === 'dept2' && currentUser) {
            loadAccreditedSupportedFacilities();
        }
    }, [id, currentUser, accreditedSupportedFacilitiesFilter]);

    // Load Reviewer Evaluation Visits for dept9
    useEffect(() => {
        if (id === 'dept9' && currentUser) {
            loadReviewerEvaluationVisits();
        }
    }, [id, currentUser, reviewerEvaluationVisitFilterMonth]);

    // Load Reviewer Evaluation Visits By Governorate for dept9
    useEffect(() => {
        if (id === 'dept9' && currentUser) {
            loadReviewerEvaluationVisitsByGovernorate();
        }
    }, [id, currentUser, reviewerEvaluationVisitByGovernorateFilterMonth]);

    // Load Reviewer Evaluation Visits By Type for dept9
    useEffect(() => {
        if (id === 'dept9' && currentUser) {
            loadReviewerEvaluationVisitsByType();
        }
    }, [id, currentUser, reviewerEvaluationVisitByTypeFilterMonth]);

    // Load Medical Professionals By Category for dept7
    useEffect(() => {
        if (id === 'dept7' && currentUser) {
            loadMedicalProfessionalsByCategory();
        }
    }, [id, currentUser, medProfByCategoryFilterMonth]);

    useEffect(() => {
        if (id === 'dept7' && currentUser) {
            loadMedicalProfessionalsByGovernorate();
        }
    }, [id, currentUser, medProfByGovernorateFilterMonth]);

    // Load Total Medical Professionals By Category for dept7
    useEffect(() => {
        if (id === 'dept7' && currentUser) {
            loadTotalMedProfsByCategory();
        }
    }, [id, currentUser, totalMedProfByCategoryFilterMonth]);

    // Load Total Medical Professionals By Governorate for dept7
    useEffect(() => {
        if (id === 'dept7' && currentUser) {
            loadTotalMedProfsByGovernorate();
        }
    }, [id, currentUser, totalMedProfByGovernorateFilterMonth]);

    // Load Training Entities for dept1
    useEffect(() => {
        if (id === 'dept1' && currentUser) {
            loadTrainingEntities();
        }
    }, [id, currentUser, trainingEntityFilterMonth]);


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

    const loadBasicRequirementsFacilities = async () => {
        const data = await getBasicRequirementsFacilities(id as string, basicRequirementsFacilityFilterMonth || undefined);
        setBasicRequirementsFacilities(data);
    };

    const loadAppealsFacilities = async () => {
        const data = await getAppealsFacilities(id as string, appealsFacilityFilterMonth || undefined);
        setAppealsFacilities(data);
    };


    const loadMedicalProfessionalRegistrations = async () => {
        const data = await getMedicalProfessionalRegistrations(medicalProfessionalFilterMonth || undefined);
        setMedicalProfessionalRegistrations(data);
    };

    const loadTechnicalClinicalFacilities = async () => {
        const data = await getTechnicalClinicalFacilities(technicalClinicalFacilityFilterMonth || undefined);
        setTechnicalClinicalFacilities(data);
    };

    const loadTechnicalClinicalObservations = async () => {
        const data = await getTechnicalClinicalObservations(technicalClinicalObservationFilterMonth || undefined);
        setTechnicalClinicalObservations(data);
    };

    const loadAdminAuditFacilities = async () => {
        const data = await getAdminAuditFacilities(adminAuditFacilityFilterMonth || undefined);
        setAdminAuditFacilities(data);
    };

    const loadAdminAuditObservations = async () => {
        const data = await getAdminAuditObservations(adminAuditObservationFilterMonth || undefined);
        setAdminAuditObservations(data);
    };

    const loadCorrectionRates = async () => {
        const data = await getObservationCorrectionRates(correctionRateFilterMonth || undefined);
        setCorrectionRates(data);
    };

    const loadTcCorrectionRates = async () => {
        const data = await getTechnicalClinicalCorrectionRates(tcCorrectionRateFilterMonth || undefined);
        setTcCorrectionRates(data);
    };

    const loadReviewerEvaluationVisits = async () => {
        const data = await getReviewerEvaluationVisits(reviewerEvaluationVisitFilterMonth || undefined);
        setReviewerEvaluationVisits(data);
    };

    const loadMedicalProfessionalsByCategory = async () => {
        const data = await getMedicalProfessionalsByCategory(medProfByCategoryFilterMonth || undefined);
        setMedProfsByCategory(data);
    };

    const loadMedicalProfessionalsByGovernorate = async () => {
        const data = await getMedicalProfessionalsByGovernorate(medProfByGovernorateFilterMonth || undefined);
        setMedProfsByGovernorate(data);
    };

    const loadTotalMedProfsByCategory = async () => {
        const data = await getTotalMedProfsByCategory(totalMedProfByCategoryFilterMonth || undefined);
        setTotalMedProfsByCategory(data);
    };

    const loadTotalMedProfsByGovernorate = async () => {
        const data = await getTotalMedProfsByGovernorate(totalMedProfByGovernorateFilterMonth || undefined);
        setTotalMedProfsByGovernorate(data);
    };

    const loadTrainingEntities = async () => {
        const data = await getTrainingEntities(trainingEntityFilterMonth || undefined);
        setTrainingEntities(data);
    };


    const loadScheduledSupportVisits = async () => {
        const data = await getScheduledSupportVisits(scheduledSupportVisitsFilter || undefined);
        setScheduledSupportVisits(data);
    };

    const loadAccreditedSupportedFacilities = async () => {
        const data = await getAccreditedSupportedFacilities(accreditedSupportedFacilitiesFilter || undefined);
        setAccreditedSupportedFacilities(data);
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

    // Technical Clinical Facility handlers (for dept4)
    const handleTechnicalClinicalFacilityInputChange = (field: string, value: string) => {
        setTechnicalClinicalFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTechnicalClinicalFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingTechnicalClinicalFacilityId) {
                const success = await updateTechnicalClinicalFacility(editingTechnicalClinicalFacilityId, {
                    ...technicalClinicalFacilityFormData,
                    year: parseInt(technicalClinicalFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setTechnicalClinicalFacilitySubmitted(true);
                    setTimeout(() => setTechnicalClinicalFacilitySubmitted(false), 3000);
                    resetTechnicalClinicalFacilityForm();
                    await loadTechnicalClinicalFacilities();
                }
            } else {
                const id = await saveTechnicalClinicalFacility({
                    ...technicalClinicalFacilityFormData,
                    year: parseInt(technicalClinicalFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (id) {
                    setTechnicalClinicalFacilitySubmitted(true);
                    setTimeout(() => setTechnicalClinicalFacilitySubmitted(false), 3000);
                    resetTechnicalClinicalFacilityForm();
                    await loadTechnicalClinicalFacilities();
                }
            }
        } catch (error) {
            console.error('Error submitting technical clinical facility:', error);
        }
    };

    const handleEditTechnicalClinicalFacility = (facility: TechnicalClinicalFacility) => {
        setTechnicalClinicalFacilityFormData({
            facilityType: facility.facilityType,
            facilityName: facility.facilityName,
            visitType: facility.visitType || '',
            assessmentType: facility.assessmentType || '',
            governorate: facility.governorate,
            month: facility.month
        });
        setEditingTechnicalClinicalFacilityId(facility.id || null);
    };

    const handleDeleteTechnicalClinicalFacility = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
            const success = await deleteTechnicalClinicalFacility(id);
            if (success) {
                await loadTechnicalClinicalFacilities();
            }
        }
    };

    const resetTechnicalClinicalFacilityForm = () => {
        setTechnicalClinicalFacilityFormData({
            facilityType: '',
            facilityName: '',
            visitType: '',
            assessmentType: '',
            governorate: '',
            month: ''
        });
        setEditingTechnicalClinicalFacilityId(null);
    };

    // Technical Clinical Observation handlers (الملاحظات المتكررة for dept4)
    const handleTechnicalClinicalObservationInputChange = (field: string, value: string) => {
        setTechnicalClinicalObservationFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTechnicalClinicalObservationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const [year, month] = technicalClinicalObservationFormData.month.split('-');

            if (editingTechnicalClinicalObservationId) {
                await updateTechnicalClinicalObservation(editingTechnicalClinicalObservationId, {
                    entityType: technicalClinicalObservationFormData.entityType,
                    facilityType: technicalClinicalObservationFormData.facilityType,
                    observation: technicalClinicalObservationFormData.observation,
                    percentage: parseFloat(technicalClinicalObservationFormData.percentage),
                    month: technicalClinicalObservationFormData.month,
                    year: parseInt(year),
                    updatedBy: currentUser.id
                });
                setTechnicalClinicalObservationSubmitted(true);
                setTimeout(() => setTechnicalClinicalObservationSubmitted(false), 3000);
                resetTechnicalClinicalObservationForm();
                await loadTechnicalClinicalObservations();
            } else {
                const docId = await saveTechnicalClinicalObservation({
                    entityType: technicalClinicalObservationFormData.entityType,
                    facilityType: technicalClinicalObservationFormData.facilityType,
                    observation: technicalClinicalObservationFormData.observation,
                    percentage: parseFloat(technicalClinicalObservationFormData.percentage),
                    month: technicalClinicalObservationFormData.month,
                    year: parseInt(year),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setTechnicalClinicalObservationSubmitted(true);
                    setTimeout(() => setTechnicalClinicalObservationSubmitted(false), 3000);
                    resetTechnicalClinicalObservationForm();
                    await loadTechnicalClinicalObservations();
                }
            }
        } catch (error) {
            console.error('Error submitting technical clinical observation:', error);
        }
    };

    const handleEditTechnicalClinicalObservation = (observation: TechnicalClinicalObservation) => {
        setTechnicalClinicalObservationFormData({
            entityType: observation.entityType,
            facilityType: observation.facilityType,
            observation: observation.observation,
            percentage: observation.percentage.toString(),
            month: observation.month
        });
        setEditingTechnicalClinicalObservationId(observation.id || null);
    };

    const handleDeleteTechnicalClinicalObservation = async (observationId: string) => {
        if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
            const success = await deleteTechnicalClinicalObservation(observationId);
            if (success) {
                await loadTechnicalClinicalObservations();
            }
        }
    };

    const resetTechnicalClinicalObservationForm = () => {
        setTechnicalClinicalObservationFormData({
            entityType: '',
            facilityType: '',
            observation: '',
            percentage: '',
            month: ''
        });
        setEditingTechnicalClinicalObservationId(null);
    };

    // Medical Professionals By Category handlers (for dept7)
    const handleMedProfByCategoryInputChange = (field: string, value: string) => {
        setMedProfByCategoryFormData({ ...medProfByCategoryFormData, [field]: value });
    };

    const handleMedProfByCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        const [year, month] = medProfByCategoryFormData.month.split('-');
        const total =
            parseInt(medProfByCategoryFormData.doctors || '0') +
            parseInt(medProfByCategoryFormData.dentists || '0') +
            parseInt(medProfByCategoryFormData.pharmacists || '0') +
            parseInt(medProfByCategoryFormData.physiotherapy || '0') +
            parseInt(medProfByCategoryFormData.veterinarians || '0') +
            parseInt(medProfByCategoryFormData.seniorNursing || '0') +
            parseInt(medProfByCategoryFormData.technicalNursing || '0') +
            parseInt(medProfByCategoryFormData.healthTechnician || '0') +
            parseInt(medProfByCategoryFormData.scientists || '0');

        const data: Omit<MedicalProfessionalByCategory, 'id' | 'createdAt' | 'updatedAt'> = {
            month: medProfByCategoryFormData.month,
            branch: medProfByCategoryFormData.branch,
            doctors: parseInt(medProfByCategoryFormData.doctors || '0'),
            dentists: parseInt(medProfByCategoryFormData.dentists || '0'),
            pharmacists: parseInt(medProfByCategoryFormData.pharmacists || '0'),
            physiotherapy: parseInt(medProfByCategoryFormData.physiotherapy || '0'),
            veterinarians: parseInt(medProfByCategoryFormData.veterinarians || '0'),
            seniorNursing: parseInt(medProfByCategoryFormData.seniorNursing || '0'),
            technicalNursing: parseInt(medProfByCategoryFormData.technicalNursing || '0'),
            healthTechnician: parseInt(medProfByCategoryFormData.healthTechnician || '0'),
            scientists: parseInt(medProfByCategoryFormData.scientists || '0'),
            total,
            year: parseInt(year),
            createdBy: currentUser.id,
            updatedBy: currentUser.id
        };

        try {
            if (editingMedProfByCategoryId) {
                await updateMedicalProfessionalByCategory(editingMedProfByCategoryId, data);
            } else {
                await saveMedicalProfessionalByCategory(data);
            }
            setMedProfByCategorySubmitted(true);
            setTimeout(() => setMedProfByCategorySubmitted(false), 3000);
            resetMedProfByCategoryForm();
            await loadMedicalProfessionalsByCategory();
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditMedProfByCategory = (item: MedicalProfessionalByCategory) => {
        setMedProfByCategoryFormData({
            month: item.month,
            branch: item.branch,
            doctors: item.doctors.toString(),
            dentists: item.dentists.toString(),
            pharmacists: item.pharmacists.toString(),
            physiotherapy: item.physiotherapy.toString(),
            veterinarians: item.veterinarians.toString(),
            seniorNursing: item.seniorNursing.toString(),
            technicalNursing: item.technicalNursing.toString(),
            healthTechnician: item.healthTechnician.toString(),
            scientists: item.scientists.toString()
        });
        setEditingMedProfByCategoryId(item.id!);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteMedProfByCategory = async (id: string) => {
        if (!confirm('هل أنت متأكد من حذف هذا السجل؟')) return;
        try {
            await deleteMedicalProfessionalByCategory(id);
            await loadMedicalProfessionalsByCategory();
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ أثناء الحذف');
        }
    };

    const resetMedProfByCategoryForm = () => {
        setMedProfByCategoryFormData({
            month: '', branch: '', doctors: '', dentists: '', pharmacists: '',
            physiotherapy: '', veterinarians: '', seniorNursing: '',
            technicalNursing: '', healthTechnician: '', scientists: ''
        });
        setEditingMedProfByCategoryId(null);
    };

    // Admin Audit Facility handlers (for dept5)
    const handleAdminAuditFacilityInputChange = (field: string, value: string) => {
        setAdminAuditFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAdminAuditFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingAdminAuditFacilityId) {
                const success = await updateAdminAuditFacility(editingAdminAuditFacilityId, {
                    ...adminAuditFacilityFormData,
                    year: parseInt(adminAuditFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setAdminAuditFacilitySubmitted(true);
                    setTimeout(() => setAdminAuditFacilitySubmitted(false), 3000);
                    resetAdminAuditFacilityForm();
                    await loadAdminAuditFacilities();
                }
            } else {
                const docId = await saveAdminAuditFacility({
                    ...adminAuditFacilityFormData,
                    year: parseInt(adminAuditFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setAdminAuditFacilitySubmitted(true);
                    setTimeout(() => setAdminAuditFacilitySubmitted(false), 3000);
                    resetAdminAuditFacilityForm();
                    await loadAdminAuditFacilities();
                }
            }
        } catch (error) {
            console.error('Error submitting admin audit facility:', error);
        }
    };

    const handleEditAdminAuditFacility = (facility: AdminAuditFacility) => {
        setAdminAuditFacilityFormData({
            facilityType: facility.facilityType,
            facilityName: facility.facilityName,
            visitType: facility.visitType,
            governorate: facility.governorate,
            month: facility.month
        });
        setEditingAdminAuditFacilityId(facility.id || null);
    };

    const handleDeleteAdminAuditFacility = async (facilityId: string) => {
        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
            const success = await deleteAdminAuditFacility(facilityId);
            if (success) {
                await loadAdminAuditFacilities();
            }
        }
    };

    const resetAdminAuditFacilityForm = () => {
        setAdminAuditFacilityFormData({
            facilityType: '',
            facilityName: '',
            visitType: '',
            governorate: '',
            month: ''
        });
        setEditingAdminAuditFacilityId(null);
    };

    // Admin Audit Observation handlers (الملاحظات المتكررة)
    const handleAdminAuditObservationInputChange = (field: string, value: string) => {
        setAdminAuditObservationFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAdminAuditObservationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const [year, month] = adminAuditObservationFormData.month.split('-');

            if (editingAdminAuditObservationId) {
                await updateAdminAuditObservation(editingAdminAuditObservationId, {
                    entityType: adminAuditObservationFormData.entityType,
                    facilityType: adminAuditObservationFormData.facilityType,
                    observation: adminAuditObservationFormData.observation,
                    percentage: parseFloat(adminAuditObservationFormData.percentage),
                    month: adminAuditObservationFormData.month,
                    year: parseInt(year),
                    updatedBy: currentUser.id
                });
                setAdminAuditObservationSubmitted(true);
                setTimeout(() => setAdminAuditObservationSubmitted(false), 3000);
                resetAdminAuditObservationForm();
                await loadAdminAuditObservations();
            } else {
                const docId = await saveAdminAuditObservation({
                    entityType: adminAuditObservationFormData.entityType,
                    facilityType: adminAuditObservationFormData.facilityType,
                    observation: adminAuditObservationFormData.observation,
                    percentage: parseFloat(adminAuditObservationFormData.percentage),
                    month: adminAuditObservationFormData.month,
                    year: parseInt(year),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setAdminAuditObservationSubmitted(true);
                    setTimeout(() => setAdminAuditObservationSubmitted(false), 3000);
                    resetAdminAuditObservationForm();
                    await loadAdminAuditObservations();
                }
            }
        } catch (error) {
            console.error('Error submitting admin audit observation:', error);
        }
    };

    const handleEditAdminAuditObservation = (observation: AdminAuditObservation) => {
        setAdminAuditObservationFormData({
            entityType: observation.entityType,
            facilityType: observation.facilityType,
            observation: observation.observation,
            percentage: observation.percentage.toString(),
            month: observation.month
        });
        setEditingAdminAuditObservationId(observation.id || null);
    };

    const handleDeleteAdminAuditObservation = async (observationId: string) => {
        if (confirm('هل أنت متأكد من حذف هذه الملاحظة؟')) {
            const success = await deleteAdminAuditObservation(observationId);
            if (success) {
                await loadAdminAuditObservations();
            }
        }
    };

    const resetAdminAuditObservationForm = () => {
        setAdminAuditObservationFormData({
            entityType: '',
            facilityType: '',
            observation: '',
            percentage: '',
            month: ''
        });
        setEditingAdminAuditObservationId(null);
    };

    // Observation Correction Rate handlers (نسب تصحيح الملاحظات)
    const handleCorrectionRateInputChange = (field: string, value: string) => {
        setCorrectionRateFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleCorrectionRateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const [year] = correctionRateFormData.month.split('-');

            const dataToSave = {
                entityType: correctionRateFormData.entityType,
                facilityCategory: correctionRateFormData.facilityCategory,
                facilityName: correctionRateFormData.facilityName,
                governorate: correctionRateFormData.governorate,
                visitDate: correctionRateFormData.visitDate,
                visitType: correctionRateFormData.visitType,
                month: correctionRateFormData.month,
                year: parseInt(year),
                pccTotal: correctionRateFormData.pccTotal === '' ? -1 : parseInt(correctionRateFormData.pccTotal),
                pccCorrected: correctionRateFormData.pccCorrected === '' ? -1 : parseInt(correctionRateFormData.pccCorrected),
                efsTotal: correctionRateFormData.efsTotal === '' ? -1 : parseInt(correctionRateFormData.efsTotal),
                efsCorrected: correctionRateFormData.efsCorrected === '' ? -1 : parseInt(correctionRateFormData.efsCorrected),
                ogmTotal: correctionRateFormData.ogmTotal === '' ? -1 : parseInt(correctionRateFormData.ogmTotal),
                ogmCorrected: correctionRateFormData.ogmCorrected === '' ? -1 : parseInt(correctionRateFormData.ogmCorrected),
                imtTotal: correctionRateFormData.imtTotal === '' ? -1 : parseInt(correctionRateFormData.imtTotal),
                imtCorrected: correctionRateFormData.imtCorrected === '' ? -1 : parseInt(correctionRateFormData.imtCorrected),
                wfmTotal: correctionRateFormData.wfmTotal === '' ? -1 : parseInt(correctionRateFormData.wfmTotal),
                wfmCorrected: correctionRateFormData.wfmCorrected === '' ? -1 : parseInt(correctionRateFormData.wfmCorrected),
                caiTotal: correctionRateFormData.caiTotal === '' ? -1 : parseInt(correctionRateFormData.caiTotal),
                caiCorrected: correctionRateFormData.caiCorrected === '' ? -1 : parseInt(correctionRateFormData.caiCorrected),
                qpiTotal: correctionRateFormData.qpiTotal === '' ? -1 : parseInt(correctionRateFormData.qpiTotal),
                qpiCorrected: correctionRateFormData.qpiCorrected === '' ? -1 : parseInt(correctionRateFormData.qpiCorrected),
                mrsTotal: correctionRateFormData.mrsTotal === '' ? -1 : parseInt(correctionRateFormData.mrsTotal),
                mrsCorrected: correctionRateFormData.mrsCorrected === '' ? -1 : parseInt(correctionRateFormData.mrsCorrected),
                scmTotal: correctionRateFormData.scmTotal === '' ? -1 : parseInt(correctionRateFormData.scmTotal),
                scmCorrected: correctionRateFormData.scmCorrected === '' ? -1 : parseInt(correctionRateFormData.scmCorrected),
                emsTotal: correctionRateFormData.emsTotal === '' ? -1 : parseInt(correctionRateFormData.emsTotal),
                emsCorrected: correctionRateFormData.emsCorrected === '' ? -1 : parseInt(correctionRateFormData.emsCorrected)
            };

            if (editingCorrectionRateId) {
                await updateObservationCorrectionRate(editingCorrectionRateId, {
                    ...dataToSave,
                    updatedBy: currentUser.id
                });
                setCorrectionRateSubmitted(true);
                setTimeout(() => setCorrectionRateSubmitted(false), 3000);
                resetCorrectionRateForm();
                await loadCorrectionRates();
            } else {
                const docId = await saveObservationCorrectionRate({
                    ...dataToSave,
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setCorrectionRateSubmitted(true);
                    setTimeout(() => setCorrectionRateSubmitted(false), 3000);
                    resetCorrectionRateForm();
                    await loadCorrectionRates();
                }
            }
        } catch (error) {
            console.error('Error submitting correction rate:', error);
        }
    };

    const handleEditCorrectionRate = (rate: ObservationCorrectionRate) => {
        setCorrectionRateFormData({
            entityType: rate.entityType,
            facilityCategory: rate.facilityCategory,
            facilityName: rate.facilityName,
            governorate: rate.governorate,
            visitDate: rate.visitDate,
            visitType: rate.visitType,
            month: rate.month,
            pccTotal: rate.pccTotal.toString(),
            pccCorrected: rate.pccCorrected.toString(),
            efsTotal: rate.efsTotal.toString(),
            efsCorrected: rate.efsCorrected.toString(),
            ogmTotal: rate.ogmTotal.toString(),
            ogmCorrected: rate.ogmCorrected.toString(),
            imtTotal: rate.imtTotal.toString(),
            imtCorrected: rate.imtCorrected.toString(),
            wfmTotal: rate.wfmTotal.toString(),
            wfmCorrected: rate.wfmCorrected.toString(),
            caiTotal: rate.caiTotal.toString(),
            caiCorrected: rate.caiCorrected.toString(),
            qpiTotal: rate.qpiTotal.toString(),
            qpiCorrected: rate.qpiCorrected.toString(),
            mrsTotal: (rate.mrsTotal || 0).toString(),
            mrsCorrected: (rate.mrsCorrected || 0).toString(),
            scmTotal: (rate.scmTotal || 0).toString(),
            scmCorrected: (rate.scmCorrected || 0).toString(),
            emsTotal: (rate.emsTotal || 0).toString(),
            emsCorrected: (rate.emsCorrected || 0).toString()
        });
        setEditingCorrectionRateId(rate.id || null);
    };

    const handleDeleteCorrectionRate = async (rateId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteObservationCorrectionRate(rateId);
            if (success) {
                await loadCorrectionRates();
            }
        }
    };

    const resetCorrectionRateForm = () => {
        setCorrectionRateFormData({
            entityType: '',
            facilityCategory: '',
            facilityName: '',
            governorate: '',
            visitDate: '',
            visitType: '',
            month: '',
            pccTotal: '', pccCorrected: '',
            efsTotal: '', efsCorrected: '',
            ogmTotal: '', ogmCorrected: '',
            imtTotal: '', imtCorrected: '',
            wfmTotal: '', wfmCorrected: '',
            caiTotal: '', caiCorrected: '',
            qpiTotal: '', qpiCorrected: '',
            mrsTotal: '', mrsCorrected: '',
            scmTotal: '', scmCorrected: '',
            emsTotal: '', emsCorrected: ''
        });
        setEditingCorrectionRateId(null);
    };

    // Technical Clinical Correction Rate handlers (نسب تصحيح الملاحظات for dept4)
    const handleTcCorrectionRateInputChange = (field: string, value: string) => {
        setTcCorrectionRateFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTcCorrectionRateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const [year] = tcCorrectionRateFormData.month.split('-');

            const dataToSave = {
                entityType: tcCorrectionRateFormData.entityType,
                facilityCategory: tcCorrectionRateFormData.facilityCategory,
                facilityName: tcCorrectionRateFormData.facilityName,
                governorate: tcCorrectionRateFormData.governorate,
                visitDate: tcCorrectionRateFormData.visitDate,
                visitType: tcCorrectionRateFormData.visitType,
                month: tcCorrectionRateFormData.month,
                year: parseInt(year),
                actTotal: parseInt(tcCorrectionRateFormData.actTotal) || 0,
                actCorrected: parseInt(tcCorrectionRateFormData.actCorrected) || 0,
                icdTotal: parseInt(tcCorrectionRateFormData.icdTotal) || 0,
                icdCorrected: parseInt(tcCorrectionRateFormData.icdCorrected) || 0,
                dasTotal: parseInt(tcCorrectionRateFormData.dasTotal) || 0,
                dasCorrected: parseInt(tcCorrectionRateFormData.dasCorrected) || 0,
                mmsTotal: parseInt(tcCorrectionRateFormData.mmsTotal) || 0,
                mmsCorrected: parseInt(tcCorrectionRateFormData.mmsCorrected) || 0,
                sipTotal: parseInt(tcCorrectionRateFormData.sipTotal) || 0,
                sipCorrected: parseInt(tcCorrectionRateFormData.sipCorrected) || 0,
                ipcTotal: parseInt(tcCorrectionRateFormData.ipcTotal) || 0,
                ipcCorrected: parseInt(tcCorrectionRateFormData.ipcCorrected) || 0,
                scmTotal: parseInt(tcCorrectionRateFormData.scmTotal) || 0,
                scmCorrected: parseInt(tcCorrectionRateFormData.scmCorrected) || 0,
                texTotal: parseInt(tcCorrectionRateFormData.texTotal) || 0,
                texCorrected: parseInt(tcCorrectionRateFormData.texCorrected) || 0,
                teqTotal: parseInt(tcCorrectionRateFormData.teqTotal) || 0,
                teqCorrected: parseInt(tcCorrectionRateFormData.teqCorrected) || 0,
                tpoTotal: parseInt(tcCorrectionRateFormData.tpoTotal) || 0,
                tpoCorrected: parseInt(tcCorrectionRateFormData.tpoCorrected) || 0,
                nsrTotal: parseInt(tcCorrectionRateFormData.nsrTotal) || 0,
                nsrCorrected: parseInt(tcCorrectionRateFormData.nsrCorrected) || 0,
                sasTotal: parseInt(tcCorrectionRateFormData.sasTotal) || 0,
                sasCorrected: parseInt(tcCorrectionRateFormData.sasCorrected) || 0
            };


            if (editingTcCorrectionRateId) {
                await updateTechnicalClinicalCorrectionRate(editingTcCorrectionRateId, {
                    ...dataToSave,
                    updatedBy: currentUser.id
                });
                setTcCorrectionRateSubmitted(true);
                setTimeout(() => setTcCorrectionRateSubmitted(false), 3000);
                resetTcCorrectionRateForm();
                await loadTcCorrectionRates();
            } else {
                const docId = await saveTechnicalClinicalCorrectionRate({
                    ...dataToSave,
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setTcCorrectionRateSubmitted(true);
                    setTimeout(() => setTcCorrectionRateSubmitted(false), 3000);
                    resetTcCorrectionRateForm();
                    await loadTcCorrectionRates();
                }
            }
        } catch (error) {
            console.error('Error submitting technical clinical correction rate:', error);
        }
    };

    const handleEditTcCorrectionRate = (rate: TechnicalClinicalCorrectionRate) => {
        setTcCorrectionRateFormData({
            entityType: rate.entityType,
            facilityCategory: rate.facilityCategory,
            facilityName: rate.facilityName,
            governorate: rate.governorate,
            visitDate: rate.visitDate,
            visitType: rate.visitType,
            month: rate.month,
            actTotal: rate.actTotal.toString(),
            actCorrected: rate.actCorrected.toString(),
            icdTotal: rate.icdTotal.toString(),
            icdCorrected: rate.icdCorrected.toString(),
            dasTotal: rate.dasTotal.toString(),
            dasCorrected: rate.dasCorrected.toString(),
            mmsTotal: rate.mmsTotal.toString(),
            mmsCorrected: rate.mmsCorrected.toString(),
            sipTotal: rate.sipTotal.toString(),
            sipCorrected: rate.sipCorrected.toString(),
            ipcTotal: rate.ipcTotal.toString(),
            ipcCorrected: rate.ipcCorrected.toString(),
            scmTotal: rate.scmTotal.toString(),
            scmCorrected: rate.scmCorrected.toString(),
            texTotal: rate.texTotal.toString(),
            texCorrected: rate.texCorrected.toString(),
            teqTotal: rate.teqTotal.toString(),
            teqCorrected: rate.teqCorrected.toString(),
            tpoTotal: rate.tpoTotal.toString(),
            tpoCorrected: rate.tpoCorrected.toString(),
            nsrTotal: rate.nsrTotal.toString(),
            nsrCorrected: rate.nsrCorrected.toString(),
            sasTotal: rate.sasTotal.toString(),
            sasCorrected: rate.sasCorrected.toString()
        });
        setEditingTcCorrectionRateId(rate.id || null);
    };

    const handleDeleteTcCorrectionRate = async (rateId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteTechnicalClinicalCorrectionRate(rateId);
            if (success) {
                await loadTcCorrectionRates();
            }
        }
    };

    const resetTcCorrectionRateForm = () => {
        setTcCorrectionRateFormData({
            entityType: '',
            facilityCategory: '',
            facilityName: '',
            governorate: '',
            visitDate: '',
            visitType: '',
            month: '',
            actTotal: '', actCorrected: '',
            icdTotal: '', icdCorrected: '',
            dasTotal: '', dasCorrected: '',
            mmsTotal: '', mmsCorrected: '',
            sipTotal: '', sipCorrected: '',
            ipcTotal: '', ipcCorrected: '',
            scmTotal: '', scmCorrected: '',
            texTotal: '', texCorrected: '',
            teqTotal: '', teqCorrected: '',
            tpoTotal: '', tpoCorrected: '',
            nsrTotal: '', nsrCorrected: '',
            sasTotal: '', sasCorrected: ''
        });
        setEditingTcCorrectionRateId(null);
    };

    // Reviewer Evaluation Visit handlers (for dept9)
    const handleReviewerEvaluationVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const visitsCount = parseInt(reviewerEvaluationVisitFormData.visitsCount);
            if (isNaN(visitsCount) || visitsCount < 0) {
                alert('يرجى إدخال عدد زيارات صحيح');
                return;
            }

            if (editingReviewerEvaluationVisitId) {
                const success = await updateReviewerEvaluationVisit(editingReviewerEvaluationVisitId, {
                    ...reviewerEvaluationVisitFormData,
                    visitsCount,
                    year: parseInt(reviewerEvaluationVisitFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setReviewerEvaluationVisitSubmitted(true);
                    setTimeout(() => setReviewerEvaluationVisitSubmitted(false), 3000);
                    resetReviewerEvaluationVisitForm();
                    await loadReviewerEvaluationVisits();
                }
            } else {
                const docId = await saveReviewerEvaluationVisit({
                    ...reviewerEvaluationVisitFormData,
                    visitsCount,
                    year: parseInt(reviewerEvaluationVisitFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setReviewerEvaluationVisitSubmitted(true);
                    setTimeout(() => setReviewerEvaluationVisitSubmitted(false), 3000);
                    resetReviewerEvaluationVisitForm();
                    await loadReviewerEvaluationVisits();
                }
            }
        } catch (error) {
            console.error('Error saving reviewer evaluation visit:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditReviewerEvaluationVisit = (visit: ReviewerEvaluationVisit) => {
        setReviewerEvaluationVisitFormData({
            month: visit.month,
            facilityType: visit.facilityType,
            visitsCount: visit.visitsCount.toString()
        });
        setEditingReviewerEvaluationVisitId(visit.id || null);
    };

    const handleDeleteReviewerEvaluationVisit = async (visitId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteReviewerEvaluationVisit(visitId);
            if (success) {
                await loadReviewerEvaluationVisits();
            }
        }
    };

    const resetReviewerEvaluationVisitForm = () => {
        setReviewerEvaluationVisitFormData({
            month: '',
            facilityType: '',
            visitsCount: ''
        });
        setEditingReviewerEvaluationVisitId(null);
    };

    const exportReviewerEvaluationVisitsToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = reviewerEvaluationVisits.map((visit, index) => {
            const [year, month] = visit.month.split('-');
            return {
                '#': index + 1,
                'نوع المنشأة': visit.facilityType,
                'عدد الزيارات': visit.visitsCount,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الزيارات التقييمية');

        const fileName = reviewerEvaluationVisitFilterMonth
            ? `الزيارات_التقييمية_نوع_المنشأة_${reviewerEvaluationVisitFilterMonth}.xlsx`
            : `الزيارات_التقييمية_نوع_المنشأة_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportReviewerEvaluationVisitsToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'نوع المنشأة', alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'عدد الزيارات', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...reviewerEvaluationVisits.map((visit, index) => {
                const [year, month] = visit.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: visit.facilityType, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: visit.visitsCount.toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'الزيارات التقييمية وفقا لنوع المنشأة',
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
        const fileName = reviewerEvaluationVisitFilterMonth
            ? `الزيارات_التقييمية_نوع_المنشأة_${reviewerEvaluationVisitFilterMonth}.docx`
            : `الزيارات_التقييمية_نوع_المنشأة_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };


    // Reviewer Evaluation Visit By Governorate handlers and functions (for dept9)
    const loadReviewerEvaluationVisitsByGovernorate = async () => {
        const data = await getReviewerEvaluationVisitsByGovernorate(reviewerEvaluationVisitByGovernorateFilterMonth || undefined);
        setReviewerEvaluationVisitsByGovernorate(data);
    };

    const handleReviewerEvaluationVisitByGovernorateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const visitsCount = parseInt(reviewerEvaluationVisitByGovernorateFormData.visitsCount);
            if (isNaN(visitsCount) || visitsCount < 0) {
                alert('يرجى إدخال عدد زيارات صحيح');
                return;
            }

            if (editingReviewerEvaluationVisitByGovernorateId) {
                const success = await updateReviewerEvaluationVisitByGovernorate(editingReviewerEvaluationVisitByGovernorateId, {
                    ...reviewerEvaluationVisitByGovernorateFormData,
                    visitsCount,
                    year: parseInt(reviewerEvaluationVisitByGovernorateFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setReviewerEvaluationVisitByGovernorateSubmitted(true);
                    setTimeout(() => setReviewerEvaluationVisitByGovernorateSubmitted(false), 3000);
                    resetReviewerEvaluationVisitByGovernorateForm();
                    await loadReviewerEvaluationVisitsByGovernorate();
                }
            } else {
                const docId = await saveReviewerEvaluationVisitByGovernorate({
                    ...reviewerEvaluationVisitByGovernorateFormData,
                    visitsCount,
                    year: parseInt(reviewerEvaluationVisitByGovernorateFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setReviewerEvaluationVisitByGovernorateSubmitted(true);
                    setTimeout(() => setReviewerEvaluationVisitByGovernorateSubmitted(false), 3000);
                    resetReviewerEvaluationVisitByGovernorateForm();
                    await loadReviewerEvaluationVisitsByGovernorate();
                }
            }
        } catch (error) {
            console.error('Error saving reviewer evaluation visit by governorate:', error);
            alert('حدث خطأ أثناء الحفظ');
        }
    };

    const handleEditReviewerEvaluationVisitByGovernorate = (visit: ReviewerEvaluationVisitByGovernorate) => {
        setReviewerEvaluationVisitByGovernorateFormData({
            month: visit.month,
            governorate: visit.governorate,
            visitsCount: visit.visitsCount.toString()
        });
        setEditingReviewerEvaluationVisitByGovernorateId(visit.id || null);
    };

    const handleDeleteReviewerEvaluationVisitByGovernorate = async (visitId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteReviewerEvaluationVisitByGovernorate(visitId);
            if (success) {
                await loadReviewerEvaluationVisitsByGovernorate();
            }
        }
    };

    const resetReviewerEvaluationVisitByGovernorateForm = () => {
        setReviewerEvaluationVisitByGovernorateFormData({
            month: '',
            governorate: '',
            visitsCount: ''
        });
        setEditingReviewerEvaluationVisitByGovernorateId(null);
    };

    const exportReviewerEvaluationVisitsByGovernorateToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = reviewerEvaluationVisitsByGovernorate.map((visit, index) => {
            const [year, month] = visit.month.split('-');
            return {
                '#': index + 1,
                'المحافظة': visit.governorate,
                'عدد الزيارات': visit.visitsCount,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الزيارات حسب المحافظة');

        const fileName = reviewerEvaluationVisitByGovernorateFilterMonth
            ? `الزيارات_التقييمية_المحافظة_${reviewerEvaluationVisitByGovernorateFilterMonth}.xlsx`
            : `الزيارات_التقييمية_المحافظة_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportReviewerEvaluationVisitsByGovernorateToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'عدد الزيارات', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...reviewerEvaluationVisitsByGovernorate.map((visit, index) => {
                const [year, month] = visit.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: visit.governorate, alignment: AlignmentType.RIGHT })] }),
                        new TableCell({ children: [new Paragraph({ text: visit.visitsCount.toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] })
                    ]
                });
            })
        ];

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({
                        text: 'الزيارات التقييمية وفقا للمحافظة',
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
        const fileName = reviewerEvaluationVisitByGovernorateFilterMonth
            ? `الزيارات_التقييمية_المحافظة_${reviewerEvaluationVisitByGovernorateFilterMonth}.docx`
            : `الزيارات_التقييمية_المحافظة_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ==================== Reviewer Evaluation Visits By Visit Type Functions ====================

    const loadReviewerEvaluationVisitsByType = async () => {
        const visits = await getReviewerEvaluationVisitsByType(reviewerEvaluationVisitByTypeFilterMonth || undefined);
        setReviewerEvaluationVisitsByType(visits);
    };

    const handleReviewerEvaluationVisitByTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) return;

        const visitData = {
            month: reviewerEvaluationVisitByTypeFormData.month,
            visitType: reviewerEvaluationVisitByTypeFormData.visitType,
            visitsCount: parseInt(reviewerEvaluationVisitByTypeFormData.visitsCount),
            year: parseInt(reviewerEvaluationVisitByTypeFormData.month.split('-')[0])
        };

        if (editingReviewerEvaluationVisitByTypeId) {
            const success = await updateReviewerEvaluationVisitByType(editingReviewerEvaluationVisitByTypeId, visitData);
            if (success) {
                resetReviewerEvaluationVisitByTypeForm();
                setReviewerEvaluationVisitByTypeSubmitted(true);
                setTimeout(() => setReviewerEvaluationVisitByTypeSubmitted(false), 3000);
                await loadReviewerEvaluationVisitsByType();
            }
        } else {
            const visitId = await saveReviewerEvaluationVisitByType(visitData);
            if (visitId) {
                resetReviewerEvaluationVisitByTypeForm();
                setReviewerEvaluationVisitByTypeSubmitted(true);
                setTimeout(() => setReviewerEvaluationVisitByTypeSubmitted(false), 3000);
                await loadReviewerEvaluationVisitsByType();
            }
        }
    };

    const handleEditReviewerEvaluationVisitByType = (visit: ReviewerEvaluationVisitByType) => {
        setReviewerEvaluationVisitByTypeFormData({
            month: visit.month,
            visitType: visit.visitType,
            visitsCount: visit.visitsCount.toString()
        });
        setEditingReviewerEvaluationVisitByTypeId(visit.id || null);
    };

    const handleDeleteReviewerEvaluationVisitByType = async (visitId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteReviewerEvaluationVisitByType(visitId);
            if (success) {
                await loadReviewerEvaluationVisitsByType();
            }
        }
    };

    const resetReviewerEvaluationVisitByTypeForm = () => {
        setReviewerEvaluationVisitByTypeFormData({
            month: '',
            visitType: '',
            visitsCount: ''
        });
        setEditingReviewerEvaluationVisitByTypeId(null);
    };

    const exportReviewerEvaluationVisitsByTypeToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = reviewerEvaluationVisitsByType.map((visit, index) => {
            const [year, month] = visit.month.split('-');
            return {
                '#': index + 1,
                'نوع الزيارة': visit.visitType,
                'عدد الزيارات': visit.visitsCount,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'الزيارات حسب النوع');

        const fileName = reviewerEvaluationVisitByTypeFilterMonth
            ? `الزيارات_التقييمية_النوع_${reviewerEvaluationVisitByTypeFilterMonth}.xlsx`
            : `الزيارات_التقييمية_النوع_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportReviewerEvaluationVisitsByTypeToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'نوع الزيارة', alignment: AlignmentType.CENTER })], width: { size: 50, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'عدد الزيارات', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } })
                ]
            })
        ];

        reviewerEvaluationVisitsByType.forEach((visit, index) => {
            const [year, month] = visit.month.split('-');
            const monthName = monthNames[parseInt(month) - 1];

            tableRows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: visit.visitType, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: visit.visitsCount.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: `${monthName} ${year}`, alignment: AlignmentType.CENTER })] })
                ]
            }));
        });

        const table = new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: 'الزيارات التقييمية وفقاً لنوع الزيارة', alignment: AlignmentType.CENTER }),
                    table
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const fileName = reviewerEvaluationVisitByTypeFilterMonth
            ? `الزيارات_التقييمية_النوع_${reviewerEvaluationVisitByTypeFilterMonth}.docx`
            : `الزيارات_التقييمية_النوع_جميع.docx`;

        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };


    // Export functions for Technical Clinical Facilities

    const exportTechnicalClinicalFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = technicalClinicalFacilities.map((facility, index) => {
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
        XLSX.utils.book_append_sheet(wb, ws, 'الرقابة الفنية والإكلينيكية');

        const fileName = technicalClinicalFacilityFilterMonth
            ? `الرقابة_الفنية_والإكلينيكية_${technicalClinicalFacilityFilterMonth}.xlsx`
            : `الرقابة_الفنية_والإكلينيكية_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportTechnicalClinicalFacilitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = [
            new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'نوع المنشأة', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 17, type: WidthType.PERCENTAGE } })
                ]
            }),
            ...technicalClinicalFacilities.map((facility, index) => {
                const [year, month] = facility.month.split('-');
                return new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: facility.facilityType, alignment: AlignmentType.CENTER })] }),
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
                        text: 'زيارات الرقابة الفنية والإكلينيكية',
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
        const fileName = technicalClinicalFacilityFilterMonth
            ? `الرقابة_الفنية_والإكلينيكية_${technicalClinicalFacilityFilterMonth}.docx`
            : `الرقابة_الفنية_والإكلينيكية_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
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

    // Basic Requirements Facility handlers (for dept6)
    const handleBasicRequirementsFacilityInputChange = (field: string, value: string) => {
        setBasicRequirementsFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleBasicRequirementsFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingBasicRequirementsFacilityId) {
                const success = await updateBasicRequirementsFacility(editingBasicRequirementsFacilityId, {
                    ...basicRequirementsFacilityFormData,
                    year: parseInt(basicRequirementsFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setBasicRequirementsFacilitySubmitted(true);
                    setTimeout(() => setBasicRequirementsFacilitySubmitted(false), 3000);
                    resetBasicRequirementsFacilityForm();
                    await loadBasicRequirementsFacilities();
                }
            } else {
                const id = await saveBasicRequirementsFacility({
                    ...basicRequirementsFacilityFormData,
                    year: parseInt(basicRequirementsFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (id) {
                    setBasicRequirementsFacilitySubmitted(true);
                    setTimeout(() => setBasicRequirementsFacilitySubmitted(false), 3000);
                    resetBasicRequirementsFacilityForm();
                    await loadBasicRequirementsFacilities();
                }
            }
        } catch (error) {
            console.error('Error submitting basic requirements facility:', error);
        }
    };

    const handleEditBasicRequirementsFacility = (facility: BasicRequirementsFacility) => {
        setBasicRequirementsFacilityFormData({
            facilityType: facility.facilityType,
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            month: facility.month
        });
        setEditingBasicRequirementsFacilityId(facility.id || null);
    };

    const handleDeleteBasicRequirementsFacility = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذه المنشأة؟')) {
            const success = await deleteBasicRequirementsFacility(id);
            if (success) {
                await loadBasicRequirementsFacilities();
            }
        }
    };

    const resetBasicRequirementsFacilityForm = () => {
        setBasicRequirementsFacilityFormData({
            facilityType: '',
            facilityName: '',
            governorate: '',
            month: ''
        });
        setEditingBasicRequirementsFacilityId(null);
    };

    const exportBasicRequirementsFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = basicRequirementsFacilities.map((facility, index) => {
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
        XLSX.utils.book_append_sheet(wb, ws, 'المتطلبات الأساسية');

        const fileName = basicRequirementsFacilityFilterMonth
            ? `متابعة_استكمال_المتطلبات_الأساسية_${basicRequirementsFacilityFilterMonth}.xlsx`
            : `متابعة_استكمال_المتطلبات_الأساسية_جميع.xlsx`;

        XLSX.writeFile(wb, fileName);
    };

    const exportBasicRequirementsFacilitiesToWord = async () => {
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
            ...basicRequirementsFacilities.map((facility, index) => {
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
                properties: {},
                children: [
                    new Paragraph({
                        text: 'متابعة استكمال المتطلبات الأساسية',
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
        const fileName = basicRequirementsFacilityFilterMonth
            ? `متابعة_استكمال_المتطلبات_الأساسية_${basicRequirementsFacilityFilterMonth}.docx`
            : `متابعة_استكمال_المتطلبات_الأساسية_جميع.docx`;
        link.download = fileName;
        link.click();
        URL.revokeObjectURL(url);
    };

    // Appeals Facility handlers (for dept6)
    const handleAppealsFacilityInputChange = (field: string, value: string) => {
        setAppealsFacilityFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleAppealsFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            if (editingAppealsFacilityId) {
                const success = await updateAppealsFacility(editingAppealsFacilityId, {
                    ...appealsFacilityFormData,
                    year: parseInt(appealsFacilityFormData.month.split('-')[0]),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setAppealsFacilitySubmitted(true);
                    setTimeout(() => setAppealsFacilitySubmitted(false), 3000);
                    resetAppealsFacilityForm();
                    await loadAppealsFacilities();
                }
            } else {
                const id = await saveAppealsFacility({
                    ...appealsFacilityFormData,
                    year: parseInt(appealsFacilityFormData.month.split('-')[0]),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (id) {
                    setAppealsFacilitySubmitted(true);
                    setTimeout(() => setAppealsFacilitySubmitted(false), 3000);
                    resetAppealsFacilityForm();
                    await loadAppealsFacilities();
                }
            }
        } catch (error) {
            console.error('Error submitting appeals facility:', error);
        }
    };

    const handleEditAppealsFacility = (facility: AppealsFacility) => {
        setAppealsFacilityFormData({
            facilityType: facility.facilityType,
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            month: facility.month
        });
        setEditingAppealsFacilityId(facility.id || null);
    };

    const handleDeleteAppealsFacility = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا الالتماس؟')) {
            const success = await deleteAppealsFacility(id);
            if (success) {
                await loadAppealsFacilities();
            }
        }
    };

    const resetAppealsFacilityForm = () => {
        setAppealsFacilityFormData({
            facilityType: '',
            facilityName: '',
            governorate: '',
            month: ''
        });
        setEditingAppealsFacilityId(null);
    };

    const exportAppealsFacilitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const data = appealsFacilities.map((facility, index) => {
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
        XLSX.utils.book_append_sheet(wb, ws, 'دراسة الالتماسات');
        const fileName = appealsFacilityFilterMonth
            ? `دراسة_الالتماسات_${appealsFacilityFilterMonth}.xlsx`
            : `دراسة_الالتماسات_جميع.xlsx`;
        XLSX.writeFile(wb, fileName);
    };

    const exportAppealsFacilitiesToWord = async () => {
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
            ...appealsFacilities.map((facility, index) => {
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
                properties: {},
                children: [
                    new Paragraph({
                        text: 'دراسة الالتماسات',
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
        const fileName = appealsFacilityFilterMonth
            ? `دراسة_الالتماسات_${appealsFacilityFilterMonth}.docx`
            : `دراسة_الالتماسات_جميع.docx`;
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

    // Technical Support Visit handlers
    const handleTechSupportVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert('يجب تسجيل الدخول أولاً');
            return;
        }

        if (!canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        const { facilityName, governorate, visitType, affiliatedEntity, facilityType, month } = techSupportVisitFormData;

        if (!facilityName || !governorate || !visitType || !affiliatedEntity || !facilityType || !month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, monthNum] = month.split('-');

        try {
            if (editingTechSupportVisitId) {
                const success = await updateTechnicalSupportVisit(editingTechSupportVisitId, {
                    facilityName,
                    governorate,
                    visitType,
                    affiliatedEntity,
                    facilityType,
                    month,
                    year: parseInt(year),
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadTechSupportVisits();
                    setTechSupportVisitFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        affiliatedEntity: '',
                        facilityType: '',
                        month: ''
                    });
                    setEditingTechSupportVisitId(null);
                    alert('تم تحديث الزيارة بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث الزيارة');
                }
            } else {
                const visitId = await saveTechnicalSupportVisit({
                    facilityName,
                    governorate,
                    visitType,
                    affiliatedEntity,
                    facilityType,
                    month,
                    year: parseInt(year),
                    createdBy: currentUser.email,
                    updatedBy: currentUser.email
                });

                if (visitId) {
                    await loadTechSupportVisits();
                    setTechSupportVisitFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        affiliatedEntity: '',
                        facilityType: '',
                        month: ''
                    });
                    alert('تمت إضافة الزيارة بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ الزيارة');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleEditTechSupportVisit = (visit: TechnicalSupportVisit) => {
        setTechSupportVisitFormData({
            facilityName: visit.facilityName,
            governorate: visit.governorate,
            visitType: visit.visitType,
            affiliatedEntity: visit.affiliatedEntity,
            facilityType: visit.facilityType,
            month: visit.month
        });
        setEditingTechSupportVisitId(visit.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };


    const handleDeleteTechSupportVisit = async (visitId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
            const success = await deleteTechnicalSupportVisit(visitId);
            if (success) {
                await loadTechSupportVisits();
                alert('تم حذف الزيارة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الزيارة');
            }
        }
    };

    // Remote Technical Support handlers (الدعم الفني عن بعد)
    const handleRemoteTechSupportSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert('يجب تسجيل الدخول أولاً');
            return;
        }

        if (!canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        const { facilityName, governorate, visitType, affiliatedEntity, facilityType, month } = remoteTechSupportFormData;

        if (!facilityName || !governorate || !visitType || !affiliatedEntity || !facilityType || !month) {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            const [year] = month.split('-');

            if (editingRemoteTechSupportId) {
                const success = await updateRemoteTechnicalSupport(editingRemoteTechSupportId, {
                    facilityName,
                    governorate,
                    visitType,
                    affiliatedEntity,
                    facilityType,
                    month,
                    year: parseInt(year),
                    updatedBy: currentUser.id
                });

                if (success) {
                    setEditingRemoteTechSupportId(null);
                    setRemoteTechSupportFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        affiliatedEntity: '',
                        facilityType: '',
                        month: ''
                    });
                    await loadRemoteTechnicalSupports();
                    alert('تم تحديث الدعم بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث الدعم');
                }
            } else {
                const docId = await saveRemoteTechnicalSupport({
                    facilityName,
                    governorate,
                    visitType,
                    affiliatedEntity,
                    facilityType,
                    month,
                    year: parseInt(year),
                    createdBy: currentUser.id,
                    updatedBy: currentUser.id
                });

                if (docId) {
                    setRemoteTechSupportFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        affiliatedEntity: '',
                        facilityType: '',
                        month: ''
                    });
                    await loadRemoteTechnicalSupports();
                    alert('تمت إضافة الدعم بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ الدعم');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleEditRemoteTechSupport = (support: RemoteTechnicalSupport) => {
        setRemoteTechSupportFormData({
            facilityName: support.facilityName,
            governorate: support.governorate,
            visitType: support.visitType,
            affiliatedEntity: support.affiliatedEntity,
            facilityType: support.facilityType,
            month: support.month
        });
        setEditingRemoteTechSupportId(support.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRemoteTechSupport = async (supportId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذا الدعم؟')) {
            const success = await deleteRemoteTechnicalSupport(supportId);
            if (success) {
                await loadRemoteTechnicalSupports();
                alert('تم حذف الدعم بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الدعم');
            }
        }
    };

    // Introductory Support Visit handlers (زيارات الدعم الفني التمهيدية)
    const handleIntroSupportVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert('يجب تسجيل الدخول أولاً');
            return;
        }

        if (!canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        const { facilityName, governorate, visitType, affiliatedEntity, facilityType, month } = introSupportVisitFormData;

        if (!facilityName || !governorate || !visitType || !affiliatedEntity || !facilityType || !month) {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            const [year] = month.split('-');

            if (editingIntroSupportVisitId) {
                const success = await updateIntroductorySupportVisit(editingIntroSupportVisitId, {
                    facilityName,
                    governorate,
                    visitType,
                    affiliatedEntity,
                    facilityType,
                    month,
                    year: parseInt(year),
                    updatedBy: currentUser.email
                });

                if (success) {
                    setEditingIntroSupportVisitId(null);
                    setIntroSupportVisitFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        affiliatedEntity: '',
                        facilityType: '',
                        month: ''
                    });
                    await loadIntroSupportVisits();
                    alert('تم تحديث الزيارة بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث الزيارة');
                }
            } else {
                const visitId = await saveIntroductorySupportVisit({
                    facilityName,
                    governorate,
                    visitType,
                    affiliatedEntity,
                    facilityType,
                    month,
                    year: parseInt(year),
                    createdBy: currentUser.email,
                    updatedBy: currentUser.email
                });

                if (visitId) {
                    setIntroSupportVisitFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        affiliatedEntity: '',
                        facilityType: '',
                        month: ''
                    });
                    await loadIntroSupportVisits();
                    alert('تمت إضافة الزيارة بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ الزيارة');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleEditIntroSupportVisit = (visit: IntroductorySupportVisit) => {
        setIntroSupportVisitFormData({
            facilityName: visit.facilityName,
            governorate: visit.governorate,
            visitType: visit.visitType,
            affiliatedEntity: visit.affiliatedEntity,
            facilityType: visit.facilityType,
            month: visit.month
        });
        setEditingIntroSupportVisitId(visit.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteIntroSupportVisit = async (visitId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
            const success = await deleteIntroductorySupportVisit(visitId);
            if (success) {
                await loadIntroSupportVisits();
                alert('تم حذف الزيارة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الزيارة');
            }
        }
    };

    // Scheduled Support Visit handlers (زيارات الدعم الفني المجدولة في شهر ....)

    const handleScheduledSupportVisitSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser) {
            alert('يجب تسجيل الدخول أولاً');
            return;
        }

        if (!canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        const { facilityName, governorate, visitType, month } = scheduledSupportVisitFormData;

        if (!facilityName || !governorate || !visitType || !month) {
            alert('الرجاء ملء جميع الحقول المطلوبة');
            return;
        }

        try {
            const [year] = month.split('-');

            if (editingScheduledSupportVisitId) {
                const success = await updateScheduledSupportVisit(editingScheduledSupportVisitId, {
                    facilityName,
                    governorate,
                    visitType,
                    month,
                    year: parseInt(year),
                    updatedBy: currentUser.email
                });

                if (success) {
                    setEditingScheduledSupportVisitId(null);
                    setScheduledSupportVisitFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        month: ''
                    });
                    await loadScheduledSupportVisits();
                    alert('تم تحديث الزيارة المجدولة بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث الزيارة المجدولة');
                }
            } else {
                const visitId = await saveScheduledSupportVisit({
                    facilityName,
                    governorate,
                    visitType,
                    month,
                    year: parseInt(year),
                    createdBy: currentUser.email,
                    updatedBy: currentUser.email
                });

                if (visitId) {
                    setScheduledSupportVisitFormData({
                        facilityName: '',
                        governorate: '',
                        visitType: '',
                        month: ''
                    });
                    await loadScheduledSupportVisits();
                    alert('تمت إضافة الزيارة المجدولة بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ الزيارة المجدولة');
                }
            }
        } catch (error) {
            console.error('Error:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleEditScheduledSupportVisit = (visit: ScheduledSupportVisit) => {
        setScheduledSupportVisitFormData({
            facilityName: visit.facilityName,
            governorate: visit.governorate,
            visitType: visit.visitType,
            month: visit.month
        });
        setEditingScheduledSupportVisitId(visit.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteScheduledSupportVisit = async (visitId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه الزيارة المجدولة؟')) {
            const success = await deleteScheduledSupportVisit(visitId);
            if (success) {
                await loadScheduledSupportVisits();
                alert('تم حذف الزيارة المجدولة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الزيارة المجدولة');
            }
        }
    };

    // ==================== Accredited Supported Facilities Handlers (for dept2 only) ====================

    const handleAccreditedSupportedFacilitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        const [year, month] = accreditedSupportedFacilityFormData.month.split('-');

        const facilityData = {
            facilityName: accreditedSupportedFacilityFormData.facilityName,
            governorate: accreditedSupportedFacilityFormData.governorate,
            decisionNumber: accreditedSupportedFacilityFormData.decisionNumber,
            decisionDate: accreditedSupportedFacilityFormData.decisionDate,
            supportType: accreditedSupportedFacilityFormData.supportType,
            accreditationStatus: accreditedSupportedFacilityFormData.accreditationStatus,
            month: accreditedSupportedFacilityFormData.month,
            year: parseInt(year),
            createdBy: currentUser.email || '',
            updatedBy: currentUser.email || ''
        };

        if (editingAccreditedSupportedFacilityId) {
            const success = await updateAccreditedSupportedFacility(editingAccreditedSupportedFacilityId, facilityData);
            if (success) {
                await loadAccreditedSupportedFacilities();
                setAccreditedSupportedFacilityFormData({
                    facilityName: '',
                    governorate: '',
                    decisionNumber: '',
                    decisionDate: '',
                    supportType: '',
                    accreditationStatus: '',
                    month: ''
                });
                setEditingAccreditedSupportedFacilityId(null);
                alert('تم تحديث المنشأة بنجاح');
            } else {
                alert('حدث خطأ أثناء تحديث المنشأة');
            }
        } else {
            const facilityId = await saveAccreditedSupportedFacility(facilityData);
            if (facilityId) {
                await loadAccreditedSupportedFacilities();
                setAccreditedSupportedFacilityFormData({
                    facilityName: '',
                    governorate: '',
                    decisionNumber: '',
                    decisionDate: '',
                    supportType: '',
                    accreditationStatus: '',
                    month: ''
                });
                alert('تم إضافة المنشأة بنجاح');
            } else {
                alert('حدث خطأ أثناء إضافة المنشأة');
            }
        }
    };

    const handleEditAccreditedSupportedFacility = (facility: AccreditedSupportedFacility) => {
        setAccreditedSupportedFacilityFormData({
            facilityName: facility.facilityName,
            governorate: facility.governorate,
            decisionNumber: facility.decisionNumber,
            decisionDate: facility.decisionDate,
            supportType: facility.supportType,
            accreditationStatus: facility.accreditationStatus,
            month: facility.month
        });
        setEditingAccreditedSupportedFacilityId(facility.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteAccreditedSupportedFacility = async (facilityId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه المنشأة؟')) {
            const success = await deleteAccreditedSupportedFacility(facilityId);
            if (success) {
                await loadAccreditedSupportedFacilities();
                alert('تم حذف المنشأة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف المنشأة');
            }
        }
    };

    // Training Entity Handlers (للإدارة العامة للتدريب للغير)
    const handleTrainingEntitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!trainingEntityFormData.entityName || !trainingEntityFormData.traineesCount || !trainingEntityFormData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = trainingEntityFormData.month.split('-');

        const entityData = {
            entityName: trainingEntityFormData.entityName,
            traineesCount: parseInt(trainingEntityFormData.traineesCount),
            month: trainingEntityFormData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingTrainingEntityId) {
                const success = await updateTrainingEntity(editingTrainingEntityId, {
                    ...entityData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadTrainingEntities();
                    resetTrainingEntityForm();
                    alert('تم تحديث بيانات الجهة بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveTrainingEntity(entityData);
                if (id) {
                    await loadTrainingEntities();
                    resetTrainingEntityForm();
                    alert('تم إضافة الجهة بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving training entity:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetTrainingEntityForm = () => {
        setTrainingEntityFormData({
            entityName: '',
            traineesCount: '',
            month: ''
        });
        setEditingTrainingEntityId(null);
    };

    const handleEditTrainingEntity = (entity: TrainingEntity) => {
        setTrainingEntityFormData({
            entityName: entity.entityName,
            traineesCount: entity.traineesCount.toString(),
            month: entity.month
        });
        setEditingTrainingEntityId(entity.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTrainingEntity = async (entityId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه الجهة؟')) {
            const success = await deleteTrainingEntity(entityId);
            if (success) {
                await loadTrainingEntities();
                alert('تم حذف الجهة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الجهة');
            }
        }
    };

    const exportTrainingEntitiesToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = trainingEntities.map((entity, index) => {
            const [year, month] = entity.month.split('-');
            return {
                '#': index + 1,
                'الجهة الحاصلة على التدريب': entity.entityName,
                'عدد المتدربين': entity.traineesCount,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الجهات الحاصلة على التدريب');

        const filterMonthText = trainingEntityFilterMonth
            ? `_${trainingEntityFilterMonth.replace('-', '_')}`
            : '';

        XLSX.writeFile(workbook, `الجهات_الحاصلة_على_التدريب${filterMonthText}.xlsx`);
    };

    const exportTrainingEntitiesToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = trainingEntities.map((entity, index) => {
            const [year, month] = entity.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: entity.entityName, alignment: AlignmentType.RIGHT })],
                        width: { size: 45, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: entity.traineesCount.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })],
                        width: { size: 25, type: WidthType.PERCENTAGE }
                    })
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })],
                            width: { size: 10, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الجهة الحاصلة على التدريب', alignment: AlignmentType.CENTER })],
                            width: { size: 45, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'عدد المتدربين', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })],
                            width: { size: 25, type: WidthType.PERCENTAGE }
                        })
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: 'الجهات الحاصلة على التدريب',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    table
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const filterMonthText = trainingEntityFilterMonth
            ? `_${trainingEntityFilterMonth.replace('-', '_')}`
            : '';

        link.download = `الجهات_الحاصلة_على_التدريب${filterMonthText}.docx`;
        link.click();
    };

    // Total Medical Professionals By Category Handlers (الإجمالي الكلي لأعضاء المهن الطبية طبقا للفئة)
    const handleTotalMedProfByCategoryInputChange = (field: string, value: string) => {
        setTotalMedProfByCategoryFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTotalMedProfByCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const [year] = totalMedProfByCategoryFormData.month.split('-');
            const total = parseInt(totalMedProfByCategoryFormData.doctors || '0') +
                parseInt(totalMedProfByCategoryFormData.dentists || '0') +
                parseInt(totalMedProfByCategoryFormData.pharmacists || '0') +
                parseInt(totalMedProfByCategoryFormData.physiotherapy || '0') +
                parseInt(totalMedProfByCategoryFormData.veterinarians || '0') +
                parseInt(totalMedProfByCategoryFormData.seniorNursing || '0') +
                parseInt(totalMedProfByCategoryFormData.technicalNursing || '0') +
                parseInt(totalMedProfByCategoryFormData.healthTechnician || '0') +
                parseInt(totalMedProfByCategoryFormData.scientists || '0');

            const dataToSave = {
                month: totalMedProfByCategoryFormData.month,
                branch: totalMedProfByCategoryFormData.branch,
                doctors: parseInt(totalMedProfByCategoryFormData.doctors || '0'),
                dentists: parseInt(totalMedProfByCategoryFormData.dentists || '0'),
                pharmacists: parseInt(totalMedProfByCategoryFormData.pharmacists || '0'),
                physiotherapy: parseInt(totalMedProfByCategoryFormData.physiotherapy || '0'),
                veterinarians: parseInt(totalMedProfByCategoryFormData.veterinarians || '0'),
                seniorNursing: parseInt(totalMedProfByCategoryFormData.seniorNursing || '0'),
                technicalNursing: parseInt(totalMedProfByCategoryFormData.technicalNursing || '0'),
                healthTechnician: parseInt(totalMedProfByCategoryFormData.healthTechnician || '0'),
                scientists: parseInt(totalMedProfByCategoryFormData.scientists || '0'),
                total,
                year: parseInt(year),
                createdBy: currentUser.id,
                updatedBy: currentUser.id
            };

            if (editingTotalMedProfByCategoryId) {
                await updateTotalMedProfByCategory(editingTotalMedProfByCategoryId, {
                    ...dataToSave,
                    updatedBy: currentUser.id
                });
                setTotalMedProfByCategorySubmitted(true);
                setTimeout(() => setTotalMedProfByCategorySubmitted(false), 3000);
                resetTotalMedProfByCategoryForm();
                await loadTotalMedProfsByCategory();
            } else {
                const docId = await saveTotalMedProfByCategory(dataToSave);
                if (docId) {
                    setTotalMedProfByCategorySubmitted(true);
                    setTimeout(() => setTotalMedProfByCategorySubmitted(false), 3000);
                    resetTotalMedProfByCategoryForm();
                    await loadTotalMedProfsByCategory();
                }
            }
        } catch (error) {
            console.error('Error submitting total medical professional by category:', error);
        }
    };

    const handleEditTotalMedProfByCategory = (item: TotalMedicalProfessionalByCategory) => {
        setTotalMedProfByCategoryFormData({
            month: item.month,
            branch: item.branch,
            doctors: item.doctors.toString(),
            dentists: item.dentists.toString(),
            pharmacists: item.pharmacists.toString(),
            physiotherapy: item.physiotherapy.toString(),
            veterinarians: item.veterinarians.toString(),
            seniorNursing: item.seniorNursing.toString(),
            technicalNursing: item.technicalNursing.toString(),
            healthTechnician: item.healthTechnician.toString(),
            scientists: item.scientists.toString()
        });
        setEditingTotalMedProfByCategoryId(item.id || null);
    };

    const handleDeleteTotalMedProfByCategory = async (itemId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteTotalMedProfByCategory(itemId);
            if (success) {
                await loadTotalMedProfsByCategory();
            }
        }
    };

    const resetTotalMedProfByCategoryForm = () => {
        setTotalMedProfByCategoryFormData({
            month: '',
            branch: '',
            doctors: '',
            dentists: '',
            pharmacists: '',
            physiotherapy: '',
            veterinarians: '',
            seniorNursing: '',
            technicalNursing: '',
            healthTechnician: '',
            scientists: ''
        });
        setEditingTotalMedProfByCategoryId(null);
    };

    // Total Medical Professionals By Governorate Handlers (الإجمالي الكلي لأعضاء المهن الطبية بالمحافظات)
    const handleTotalMedProfByGovernorateInputChange = (field: string, value: string) => {
        setTotalMedProfByGovernorateFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleTotalMedProfByGovernorateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        try {
            const [year] = totalMedProfByGovernorateFormData.month.split('-');
            const total = parseInt(totalMedProfByGovernorateFormData.doctors || '0') +
                parseInt(totalMedProfByGovernorateFormData.dentists || '0') +
                parseInt(totalMedProfByGovernorateFormData.pharmacists || '0') +
                parseInt(totalMedProfByGovernorateFormData.physiotherapy || '0') +
                parseInt(totalMedProfByGovernorateFormData.veterinarians || '0') +
                parseInt(totalMedProfByGovernorateFormData.seniorNursing || '0') +
                parseInt(totalMedProfByGovernorateFormData.technicalNursing || '0') +
                parseInt(totalMedProfByGovernorateFormData.healthTechnician || '0') +
                parseInt(totalMedProfByGovernorateFormData.scientists || '0');

            const dataToSave = {
                month: totalMedProfByGovernorateFormData.month,
                governorate: totalMedProfByGovernorateFormData.governorate,
                doctors: parseInt(totalMedProfByGovernorateFormData.doctors || '0'),
                dentists: parseInt(totalMedProfByGovernorateFormData.dentists || '0'),
                pharmacists: parseInt(totalMedProfByGovernorateFormData.pharmacists || '0'),
                physiotherapy: parseInt(totalMedProfByGovernorateFormData.physiotherapy || '0'),
                veterinarians: parseInt(totalMedProfByGovernorateFormData.veterinarians || '0'),
                seniorNursing: parseInt(totalMedProfByGovernorateFormData.seniorNursing || '0'),
                technicalNursing: parseInt(totalMedProfByGovernorateFormData.technicalNursing || '0'),
                healthTechnician: parseInt(totalMedProfByGovernorateFormData.healthTechnician || '0'),
                scientists: parseInt(totalMedProfByGovernorateFormData.scientists || '0'),
                total,
                year: parseInt(year),
                createdBy: currentUser.id,
                updatedBy: currentUser.id
            };

            if (editingTotalMedProfByGovernorateId) {
                await updateTotalMedProfByGovernorate(editingTotalMedProfByGovernorateId, {
                    ...dataToSave,
                    updatedBy: currentUser.id
                });
                setTotalMedProfByGovernorateSubmitted(true);
                setTimeout(() => setTotalMedProfByGovernorateSubmitted(false), 3000);
                resetTotalMedProfByGovernorateForm();
                await loadTotalMedProfsByGovernorate();
            } else {
                const docId = await saveTotalMedProfByGovernorate(dataToSave);
                if (docId) {
                    setTotalMedProfByGovernorateSubmitted(true);
                    setTimeout(() => setTotalMedProfByGovernorateSubmitted(false), 3000);
                    resetTotalMedProfByGovernorateForm();
                    await loadTotalMedProfsByGovernorate();
                }
            }
        } catch (error) {
            console.error('Error submitting total medical professional by governorate:', error);
        }
    };

    const handleEditTotalMedProfByGovernorate = (item: TotalMedicalProfessionalByGovernorate) => {
        setTotalMedProfByGovernorateFormData({
            month: item.month,
            governorate: item.governorate,
            doctors: item.doctors.toString(),
            dentists: item.dentists.toString(),
            pharmacists: item.pharmacists.toString(),
            physiotherapy: item.physiotherapy.toString(),
            veterinarians: item.veterinarians.toString(),
            seniorNursing: item.seniorNursing.toString(),
            technicalNursing: item.technicalNursing.toString(),
            healthTechnician: item.healthTechnician.toString(),
            scientists: item.scientists.toString()
        });
        setEditingTotalMedProfByGovernorateId(item.id || null);
    };

    const handleDeleteTotalMedProfByGovernorate = async (itemId: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteTotalMedProfByGovernorate(itemId);
            if (success) {
                await loadTotalMedProfsByGovernorate();
            }
        }
    };

    const resetTotalMedProfByGovernorateForm = () => {
        setTotalMedProfByGovernorateFormData({
            month: '',
            governorate: '',
            doctors: '',
            dentists: '',
            pharmacists: '',
            physiotherapy: '',
            veterinarians: '',
            seniorNursing: '',
            technicalNursing: '',
            healthTechnician: '',
            scientists: ''
        });
        setEditingTotalMedProfByGovernorateId(null);
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

    // Medical Professionals By Governorate Handlers
    const handleMedProfByGovernorateInputChange = (field: keyof Omit<MedicalProfessionalByGovernorate, 'id' | 'createdAt' | 'updatedAt' | 'total'>, value: any) => {
        setMedProfByGovernorateFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleMedProfByGovernorateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !canEdit(currentUser)) return;

        try {
            // Calculate total
            const total =
                Number(medProfByGovernorateFormData.doctors) +
                Number(medProfByGovernorateFormData.dentists) +
                Number(medProfByGovernorateFormData.pharmacists) +
                Number(medProfByGovernorateFormData.physiotherapy) +
                Number(medProfByGovernorateFormData.veterinarians) +
                Number(medProfByGovernorateFormData.seniorNursing) +
                Number(medProfByGovernorateFormData.technicalNursing) +
                Number(medProfByGovernorateFormData.healthTechnician) +
                Number(medProfByGovernorateFormData.scientists);

            const dataToSave = {
                ...medProfByGovernorateFormData,
                doctors: Number(medProfByGovernorateFormData.doctors),
                dentists: Number(medProfByGovernorateFormData.dentists),
                pharmacists: Number(medProfByGovernorateFormData.pharmacists),
                physiotherapy: Number(medProfByGovernorateFormData.physiotherapy),
                veterinarians: Number(medProfByGovernorateFormData.veterinarians),
                seniorNursing: Number(medProfByGovernorateFormData.seniorNursing),
                technicalNursing: Number(medProfByGovernorateFormData.technicalNursing),
                healthTechnician: Number(medProfByGovernorateFormData.healthTechnician),
                scientists: Number(medProfByGovernorateFormData.scientists),
                total,
                year: parseInt(medProfByGovernorateFormData.month.split('-')[0]) || new Date().getFullYear(),
                createdBy: currentUser.email || 'unknown'
            };

            if (editingMedProfByGovernorateId) {
                await updateMedicalProfessionalByGovernorate(editingMedProfByGovernorateId, {
                    ...dataToSave,
                    updatedBy: currentUser.email || 'unknown'
                });
            } else {
                await saveMedicalProfessionalByGovernorate(dataToSave);
            }

            setMedProfByGovernorateSubmitted(true);
            setTimeout(() => setMedProfByGovernorateSubmitted(false), 3000);
            resetMedProfByGovernorateForm();
            loadMedicalProfessionalsByGovernorate();
        } catch (error) {
            console.error('Error saving medical professionals by governorate:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const handleEditMedProfByGovernorate = (item: MedicalProfessionalByGovernorate) => {
        setMedProfByGovernorateFormData({
            month: item.month,
            governorate: item.governorate,
            doctors: item.doctors,
            dentists: item.dentists,
            pharmacists: item.pharmacists,
            physiotherapy: item.physiotherapy,
            veterinarians: item.veterinarians,
            seniorNursing: item.seniorNursing,
            technicalNursing: item.technicalNursing,
            healthTechnician: item.healthTechnician,
            scientists: item.scientists,
            year: item.year
        });
        setEditingMedProfByGovernorateId(item.id || null);
        setIsMedProfByGovernorateSectionExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteMedProfByGovernorate = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            await deleteMedicalProfessionalByGovernorate(id);
            loadMedicalProfessionalsByGovernorate();
        }
    };

    const resetMedProfByGovernorateForm = () => {
        setMedProfByGovernorateFormData({
            month: new Date().toISOString().slice(0, 7),
            governorate: '',
            doctors: 0,
            dentists: 0,
            pharmacists: 0,
            physiotherapy: 0,
            veterinarians: 0,
            seniorNursing: 0,
            technicalNursing: 0,
            healthTechnician: 0,
            scientists: 0,
            year: new Date().getFullYear()
        });
        setEditingMedProfByGovernorateId(null);
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




    // Check if user can edit a specific record based on date
    const canEditRecord = (record: Record<string, any>) => {
        if (!userCanEdit) return false;

        // Super admin can edit any record
        if (currentUser?.role === 'super_admin') return true;

        // Extract date from record (format: YYYY-MM or YYYY-MM-DD)
        const recordDate = record.date;
        if (!recordDate) return true; // If no date, allow edit

        // Parse the record date
        const [yearStr, monthStr] = recordDate.split('-');
        const recordYear = parseInt(yearStr);
        const recordMonth = parseInt(monthStr);

        // Create date objects for comparison
        const recordDateObj = new Date(recordYear, recordMonth - 1, 1); // First day of record month
        const now = new Date();

        // Calculate the date 3 months ago
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

        // Department admins can only edit records from the last 3 months
        return recordDateObj >= threeMonthsAgo;
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
                                📝 المؤشرات الرئيسية
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

            {/* Training Entities Section - الجهات الحاصلة على التدريب (for dept1 only) */}
            {id === 'dept1' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: isTrainingEntitiesSectionExpanded ? '25px' : '0',
                            paddingBottom: isTrainingEntitiesSectionExpanded ? '15px' : '0',
                            borderBottom: isTrainingEntitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            cursor: 'pointer',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsTrainingEntitiesSectionExpanded(!isTrainingEntitiesSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--primary-color)' }}>
                            🎓 الجهات الحاصلة على التدريب
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isTrainingEntitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isTrainingEntitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isTrainingEntitiesSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {/* Form for adding/editing training entities */}
                                    <form onSubmit={handleTrainingEntitySubmit} style={{ marginBottom: '20px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                        <h4 style={{ marginTop: 0, marginBottom: '15px', color: 'var(--secondary-color)' }}>
                                            {editingTrainingEntityId ? 'تعديل جهة' : 'إضافة جهة جديدة'}
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    الشهر <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <input
                                                    type="month"
                                                    value={trainingEntityFormData.month}
                                                    onChange={(e) => setTrainingEntityFormData({ ...trainingEntityFormData, month: e.target.value })}
                                                    required
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        fontSize: '1rem'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    الجهة الحاصلة على التدريب <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={trainingEntityFormData.entityName}
                                                    onChange={(e) => setTrainingEntityFormData({ ...trainingEntityFormData, entityName: e.target.value })}
                                                    required
                                                    placeholder="أدخل اسم الجهة"
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        fontSize: '1rem'
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                    عدد المتدربين <span style={{ color: 'red' }}>*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    value={trainingEntityFormData.traineesCount}
                                                    onChange={(e) => setTrainingEntityFormData({ ...trainingEntityFormData, traineesCount: e.target.value })}
                                                    required
                                                    min="0"
                                                    placeholder="أدخل عدد المتدربين"
                                                    style={{
                                                        width: '100%',
                                                        padding: '10px',
                                                        border: '1px solid #ddd',
                                                        borderRadius: '4px',
                                                        fontSize: '1rem'
                                                    }}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button type="submit" className="btn btn-primary">
                                                {editingTrainingEntityId ? 'تحديث الجهة' : 'إضافة الجهة'}
                                            </button>
                                            {editingTrainingEntityId && (
                                                <button
                                                    type="button"
                                                    onClick={resetTrainingEntityForm}
                                                    className="btn"
                                                    style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                >
                                                    إلغاء
                                                </button>
                                            )}
                                        </div>
                                    </form>

                                    {/* Filters and Export Buttons */}
                                    <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                                        <div>
                                            <label style={{ display: 'inline-block', marginLeft: '10px', fontWeight: 'bold', fontSize: '0.9rem' }}>
                                                فلترة حسب الشهر:
                                            </label>
                                            <input
                                                type="month"
                                                value={trainingEntityFilterMonth}
                                                onChange={(e) => setTrainingEntityFilterMonth(e.target.value)}
                                                style={{
                                                    padding: '8px',
                                                    border: '1px solid #ddd',
                                                    borderRadius: '4px',
                                                    fontSize: '0.95rem'
                                                }}
                                            />
                                        </div>

                                        {trainingEntities.length > 0 && (
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button
                                                    onClick={exportTrainingEntitiesToExcel}
                                                    className="btn"
                                                    style={{
                                                        backgroundColor: '#28a745',
                                                        color: 'white',
                                                        padding: '8px 16px',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    📥 تصدير إلى Excel
                                                </button>
                                                <button
                                                    onClick={exportTrainingEntitiesToWord}
                                                    className="btn"
                                                    style={{
                                                        backgroundColor: '#007bff',
                                                        color: 'white',
                                                        padding: '8px 16px',
                                                        fontSize: '0.9rem'
                                                    }}
                                                >
                                                    📄 تصدير إلى Word
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Training Entities Table */}
                                    {trainingEntities.length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#666', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                                            لا توجد جهات مسجلة حتى الآن
                                        </p>
                                    ) : (
                                        <div style={{ overflowX: 'auto' }}>
                                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#0D6A79', color: 'white', borderBottom: '2px solid var(--primary-color)' }}>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                                        <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الجهة الحاصلة على التدريب</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>عدد المتدربين</th>
                                                        <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الإجراءات</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trainingEntities.map((entity, index) => {
                                                        const [year, month] = entity.month.split('-');
                                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                        return (
                                                            <tr key={entity.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{index + 1}</td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>{`${monthNames[parseInt(month) - 1]} ${year}`}</td>
                                                                <td style={{ padding: '12px', textAlign: 'right' }}>{entity.entityName}</td>
                                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{entity.traineesCount}</td>
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                                                        <button
                                                                            onClick={() => handleEditTrainingEntity(entity)}
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
                                                                            onClick={() => handleDeleteTrainingEntity(entity.id!)}
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
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div style={{ padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffc107' }}>
                                    <p style={{ margin: 0, color: '#856404' }}>⚠️ لديك صلاحية العرض فقط. لا يمكنك إضافة أو تعديل البيانات.</p>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {/* Program Types Section - نوع البرنامج (for dept1 only) */}
            {id === 'dept1' && (
                <ProgramTypesSection
                    currentUser={currentUser}
                    canEdit={canEdit}
                />
            )}

            {/* Governorate Customer Surveys Section - استبيانات المحافظات (for dept3 only) */}
            {id === 'dept3' && (
                <GovernorateCustomerSurveysSection
                    currentUser={currentUser}
                    canEdit={canEdit}
                />
            )}

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

            {/* Medical Professionals By Category Section - أعضاء المهن الطبية حسب الفئة (for dept7 only) */}
            {false && id === 'dept7' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', marginBottom: isMedProfByCategorySectionExpanded ? '20px' : '0', paddingBottom: isMedProfByCategorySectionExpanded ? '15px' : '0', borderBottom: isMedProfByCategorySectionExpanded ? '2px solid var(--background-color)' : 'none', transition: 'all 0.3s ease' }} onClick={() => setIsMedProfByCategorySectionExpanded(!isMedProfByCategorySectionExpanded)}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            👥 أعضاء المهن الطبية حسب الفئة
                            {medProfByCategoryFilterMonth && (
                                <span>
                                    {' '}خلال شهر {(() => {
                                        const [year, month] = medProfByCategoryFilterMonth.split('-');
                                        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                        return `${monthNames[parseInt(month) - 1]} ${year}`;
                                    })()}
                                </span>
                            )}
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            <span style={{ fontSize: '0.9rem' }}>{isMedProfByCategorySectionExpanded ? 'طي القسم' : 'توسيع القسم'}</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: isMedProfByCategorySectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </div>
                    </div>
                    {isMedProfByCategorySectionExpanded && (
                        <>
                            {userCanEdit && (
                                <form onSubmit={handleMedProfByCategorySubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>{editingMedProfByCategoryId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}</h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                        <div className="form-group"><label className="form-label">الشهر *</label><input type="month" className="form-input" required value={medProfByCategoryFormData.month} onChange={(e) => handleMedProfByCategoryInputChange('month', e.target.value)} max={new Date().toISOString().split('T')[0].slice(0, 7)} /></div>
                                        <div className="form-group"><label className="form-label">الفرع *</label><select className="form-input" required value={medProfByCategoryFormData.branch} onChange={(e) => handleMedProfByCategoryInputChange('branch', e.target.value)}><option value="">اختر الفرع</option><option value="رئاسة الهيئة">رئاسة الهيئة</option><option value="بورسعيد">بورسعيد</option><option value="الأقصر">الأقصر</option><option value="الإسماعيلية">الإسماعيلية</option><option value="السويس">السويس</option></select></div>
                                        <div className="form-group"><label className="form-label">أطباء بشريين *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.doctors} onChange={(e) => handleMedProfByCategoryInputChange('doctors', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">أطباء أسنان *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.dentists} onChange={(e) => handleMedProfByCategoryInputChange('dentists', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">صيادلة *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.pharmacists} onChange={(e) => handleMedProfByCategoryInputChange('pharmacists', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">علاج طبيعي *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.physiotherapy} onChange={(e) => handleMedProfByCategoryInputChange('physiotherapy', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">بيطريين *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.veterinarians} onChange={(e) => handleMedProfByCategoryInputChange('veterinarians', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">تمريض عالي *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.seniorNursing} onChange={(e) => handleMedProfByCategoryInputChange('seniorNursing', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">فني تمريض *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.technicalNursing} onChange={(e) => handleMedProfByCategoryInputChange('technicalNursing', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">فني صحي *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.healthTechnician} onChange={(e) => handleMedProfByCategoryInputChange('healthTechnician', e.target.value)} /></div>
                                        <div className="form-group"><label className="form-label">علميين *</label><input type="number" className="form-input" required min="0" placeholder="0" value={medProfByCategoryFormData.scientists} onChange={(e) => handleMedProfByCategoryInputChange('scientists', e.target.value)} /></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>{editingMedProfByCategoryId ? 'تحديث البيانات' : 'حفظ البيانات'}</button>
                                        {editingMedProfByCategoryId && (<button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetMedProfByCategoryForm}>إلغاء التعديل</button>)}
                                    </div>
                                    {medProfByCategorySubmitted && (<div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '15px', border: '1px solid #c3e6cb' }}>✓ تم {editingMedProfByCategoryId ? 'تحديث' : 'إضافة'} البيانات بنجاح</div>)}
                                </form>
                            )}
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}><label className="form-label">فلترة حسب الشهر</label><input type="month" className="form-input" value={medProfByCategoryFilterMonth} onChange={(e) => setMedProfByCategoryFilterMonth(e.target.value)} /></div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <thead><tr style={{ backgroundColor: '#00BCD4', color: 'white' }}><th style={{ padding: '12px', textAlign: 'center' }}>الفرع</th><th style={{ padding: '12px', textAlign: 'center' }}>أطباء بشريين</th><th style={{ padding: '12px', textAlign: 'center' }}>أطباء أسنان</th><th style={{ padding: '12px', textAlign: 'center' }}>صيادلة</th><th style={{ padding: '12px', textAlign: 'center' }}>علاج طبيعي</th><th style={{ padding: '12px', textAlign: 'center' }}>بيطريين</th><th style={{ padding: '12px', textAlign: 'center' }}>تمريض عالي</th><th style={{ padding: '12px', textAlign: 'center' }}>فني تمريض</th><th style={{ padding: '12px', textAlign: 'center' }}>فني صحي</th><th style={{ padding: '12px', textAlign: 'center' }}>علميين</th><th style={{ padding: '12px', textAlign: 'center', backgroundColor: '#FFA726' }}>الإجمالي</th>{userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>}</tr></thead>
                                    <tbody>
                                        {medProfsByCategory.length === 0 ? (<tr><td colSpan={userCanEdit ? 12 : 11} style={{ padding: '40px', textAlign: 'center', color: '#999' }}><div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>لا توجد بيانات</td></tr>) : (
                                            <>
                                                {['رئاسة الهيئة', 'بورسعيد', 'الأقصر', 'الإسماعيلية', 'السويس'].map(branch => {
                                                    const branchData = medProfsByCategory.filter(item => item.branch === branch);
                                                    if (branchData.length === 0) return null;
                                                    const totals = branchData.reduce((acc, item) => ({ doctors: acc.doctors + item.doctors, dentists: acc.dentists + item.dentists, pharmacists: acc.pharmacists + item.pharmacists, physiotherapy: acc.physiotherapy + item.physiotherapy, veterinarians: acc.veterinarians + item.veterinarians, seniorNursing: acc.seniorNursing + item.seniorNursing, technicalNursing: acc.technicalNursing + item.technicalNursing, healthTechnician: acc.healthTechnician + item.healthTechnician, scientists: acc.scientists + item.scientists }), { doctors: 0, dentists: 0, pharmacists: 0, physiotherapy: 0, veterinarians: 0, seniorNursing: 0, technicalNursing: 0, healthTechnician: 0, scientists: 0 });
                                                    const branchTotal = Object.values(totals).reduce((a, b) => a + b, 0);
                                                    return (
                                                        <tr key={branch} style={{ borderBottom: '1px solid #eee' }}>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{branch}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.doctors}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.dentists}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.pharmacists}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.physiotherapy}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.veterinarians}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.seniorNursing}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.technicalNursing}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.healthTechnician}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.scientists}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', backgroundColor: '#FFF3E0' }}>{branchTotal}</td>
                                                            {userCanEdit && (<td style={{ padding: '12px', textAlign: 'center' }}><div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>{branchData.map(item => (<div key={item.id} style={{ display: 'flex', gap: '5px' }}><button onClick={() => handleEditMedProfByCategory(item)} style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>تعديل</button><button onClick={() => handleDeleteMedProfByCategory(item.id!)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>حذف</button></div>))}</div></td>)}
                                                        </tr>
                                                    );
                                                })}
                                                <tr style={{ backgroundColor: '#FFA726', color: 'white', fontWeight: 'bold' }}>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.doctors, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.dentists, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.pharmacists, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.physiotherapy, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.veterinarians, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.seniorNursing, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.technicalNursing, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.healthTechnician, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.scientists, 0)}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{medProfsByCategory.reduce((sum, item) => sum + item.total, 0)}</td>
                                                    {userCanEdit && <td></td>}
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

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
                                                    <select
                                                        className="form-input"
                                                        required
                                                        value={correctivePlanFacilityFormData.facilityType}
                                                        onChange={(e) => handleCorrectivePlanFacilityInputChange('facilityType', e.target.value)}
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

            {/* Technical Clinical Facilities Section - Dept4 only */}
            {id === 'dept4' && (
                <div className="card" style={{ marginBottom: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: isTechnicalClinicalFacilitiesSectionExpanded ? '20px' : '0',
                            paddingBottom: isTechnicalClinicalFacilitiesSectionExpanded ? '15px' : '0',
                            borderBottom: isTechnicalClinicalFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onClick={() => setIsTechnicalClinicalFacilitiesSectionExpanded(!isTechnicalClinicalFacilitiesSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            🏥 المنشآت التي تم زيارتها خلال الشهر
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isTechnicalClinicalFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isTechnicalClinicalFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isTechnicalClinicalFacilitiesSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {technicalClinicalFacilitySubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingTechnicalClinicalFacilityId ? 'تحديث' : 'إضافة'} الزيارة بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleTechnicalClinicalFacilitySubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalFacilityFormData.facilityType}
                                                    onChange={(e) => handleTechnicalClinicalFacilityInputChange('facilityType', e.target.value)}
                                                >
                                                    <option value="">اختر نوع المنشأة</option>
                                                    <option value="مستشفى">مستشفى</option>
                                                    <option value="صيدلية">صيدلية</option>
                                                    <option value="مراكز الرعاية الأولية">مراكز الرعاية الأولية</option>
                                                    <option value="معمل">معمل</option>
                                                    <option value="مركز أشعة">مركز أشعة</option>
                                                    <option value="مراكز طبية">مراكز طبية</option>
                                                    <option value="مستشفى صحة نفسية">مستشفى صحة نفسية</option>
                                                    <option value="عيادات طبية">عيادات طبية</option>
                                                    <option value="مراكز علاج طبيعي">مراكز علاج طبيعي</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">اسم المنشأة *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalFacilityFormData.facilityName}
                                                    onChange={(e) => handleTechnicalClinicalFacilityInputChange('facilityName', e.target.value)}
                                                    placeholder="أدخل اسم المنشأة"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نوع الزيارة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalFacilityFormData.visitType}
                                                    onChange={(e) => handleTechnicalClinicalFacilityInputChange('visitType', e.target.value)}
                                                >
                                                    <option value="">اختر نوع الزيارة</option>
                                                    <option value="التدقيق الفني والإكلينيكي">التدقيق الفني والإكلينيكي</option>
                                                    <option value="التقييم الفني والإكلينيكي">التقييم الفني والإكلينيكي</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نوع التقييم</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    value={technicalClinicalFacilityFormData.assessmentType}
                                                    onChange={(e) => handleTechnicalClinicalFacilityInputChange('assessmentType', e.target.value)}
                                                    placeholder="نوع التقييم (اختياري)"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">المحافظة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalFacilityFormData.governorate}
                                                    onChange={(e) => handleTechnicalClinicalFacilityInputChange('governorate', e.target.value)}
                                                >
                                                    <option value="">اختر المحافظة</option>
                                                    <option value="القاهرة">القاهرة</option>
                                                    <option value="الجيزة">الجيزة</option>
                                                    <option value="الإسكندرية">الإسكندرية</option>
                                                    <option value="الدقهلية">الدقهلية</option>
                                                    <option value="الشرقية">الشرقية</option>
                                                    <option value="المنوفية">المنوفية</option>
                                                    <option value="القليوبية">القليوبية</option>
                                                    <option value="البحيرة">البحيرة</option>
                                                    <option value="الغربية">الغربية</option>
                                                    <option value="بور سعيد">بور سعيد</option>
                                                    <option value="دمياط">دمياط</option>
                                                    <option value="الإسماعيلية">الإسماعيلية</option>
                                                    <option value="السويس">السويس</option>
                                                    <option value="كفر الشيخ">كفر الشيخ</option>
                                                    <option value="الفيوم">الفيوم</option>
                                                    <option value="بني سويف">بني سويف</option>
                                                    <option value="المنيا">المنيا</option>
                                                    <option value="أسيوط">أسيوط</option>
                                                    <option value="سوهاج">سوهاج</option>
                                                    <option value="قنا">قنا</option>
                                                    <option value="الأقصر">الأقصر</option>
                                                    <option value="أسوان">أسوان</option>
                                                    <option value="البحر الأحمر">البحر الأحمر</option>
                                                    <option value="الوادي الجديد">الوادي الجديد</option>
                                                    <option value="مطروح">مطروح</option>
                                                    <option value="شمال سيناء">شمال سيناء</option>
                                                    <option value="جنوب سيناء">جنوب سيناء</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">الشهر *</label>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalFacilityFormData.month}
                                                    onChange={(e) => handleTechnicalClinicalFacilityInputChange('month', e.target.value)}
                                                    max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button type="submit" className="btn btn-primary">
                                                {editingTechnicalClinicalFacilityId ? 'تحديث الزيارة' : 'إضافة الزيارة'}
                                            </button>
                                            {editingTechnicalClinicalFacilityId && (
                                                <button
                                                    type="button"
                                                    onClick={resetTechnicalClinicalFacilityForm}
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

                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                        سجل الزيارات
                                    </h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {technicalClinicalFacilities.length > 0 && (
                                            <>
                                                <button
                                                    onClick={exportTechnicalClinicalFacilitiesToExcel}
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
                                                    onClick={exportTechnicalClinicalFacilitiesToWord}
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
                                                value={technicalClinicalFacilityFilterMonth}
                                                onChange={(e) => setTechnicalClinicalFacilityFilterMonth(e.target.value)}
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
                                                <th style={{ padding: '12px', textAlign: 'right' }}>نوع الزيارة</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>نوع التقييم</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                {userCanEdit && (
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>إجراءات</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {technicalClinicalFacilities.length === 0 ? (
                                                <tr>
                                                    <td colSpan={userCanEdit ? 7 : 6} style={{
                                                        padding: '40px',
                                                        textAlign: 'center',
                                                        color: '#999'
                                                    }}>
                                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                        لا توجد زيارات مسجلة
                                                    </td>
                                                </tr>
                                            ) : (
                                                technicalClinicalFacilities.map((facility, index) => (
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
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>
                                                            {facility.visitType}
                                                        </td>
                                                        <td style={{ padding: '12px', fontWeight: '500' }}>
                                                            {facility.assessmentType || '-'}
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
                                                                        onClick={() => handleEditTechnicalClinicalFacility(facility)}
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
                                                                        onClick={() => handleDeleteTechnicalClinicalFacility(facility.id!)}
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
            )}

            {/* Technical Clinical Observations Section - الملاحظات المتكررة خلال زيارات الرقابة الفنية والإكلينيكية - Only for dept4 */}
            {id === 'dept4' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isTechnicalClinicalObservationsSectionExpanded ? '20px' : '0',
                            paddingBottom: isTechnicalClinicalObservationsSectionExpanded ? '15px' : '0',
                            borderBottom: isTechnicalClinicalObservationsSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsTechnicalClinicalObservationsSectionExpanded(!isTechnicalClinicalObservationsSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📋 الملاحظات المتكررة خلال زيارات الرقابة الفنية والإكلينيكية - عدد {technicalClinicalObservations.length} ملاحظة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isTechnicalClinicalObservationsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isTechnicalClinicalObservationsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isTechnicalClinicalObservationsSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {technicalClinicalObservationSubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingTechnicalClinicalObservationId ? 'تحديث' : 'إضافة'} الملاحظة بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleTechnicalClinicalObservationSubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label className="form-label">الجهة التابعة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalObservationFormData.entityType}
                                                    onChange={(e) => handleTechnicalClinicalObservationInputChange('entityType', e.target.value)}
                                                >
                                                    <option value="">اختر الجهة</option>
                                                    <option value="المنشآت الصحية التابعة لهيئة الرعاية الصحية">المنشآت الصحية التابعة لهيئة الرعاية الصحية</option>
                                                    <option value="منشآت تابعة لوزارة الصحة">منشآت تابعة لوزارة الصحة</option>
                                                    <option value="منشآت تابعة لجهات أخرى">منشآت تابعة لجهات أخرى</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalObservationFormData.facilityType}
                                                    onChange={(e) => handleTechnicalClinicalObservationInputChange('facilityType', e.target.value)}
                                                >
                                                    <option value="">اختر نوع المنشأة</option>
                                                    <option value="مراكز ووحدات الرعاية الأولية">مراكز ووحدات الرعاية الأولية</option>
                                                    <option value="مستشفيات">مستشفيات</option>
                                                    <option value="مراكز طبية">مراكز طبية</option>
                                                    <option value="معامل">معامل</option>
                                                    <option value="مراكز الأشعة">مراكز الأشعة</option>
                                                    <option value="مراكز علاج طبيعي">مراكز علاج طبيعي</option>
                                                    <option value="مستشفيات صحة نفسية">مستشفيات صحة نفسية</option>
                                                    <option value="صيدليات">صيدليات</option>
                                                </select>
                                            </div>

                                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                <label className="form-label">دليل التطابق / الملاحظة *</label>
                                                <textarea
                                                    className="form-input"
                                                    required
                                                    rows={3}
                                                    value={technicalClinicalObservationFormData.observation}
                                                    onChange={(e) => handleTechnicalClinicalObservationInputChange('observation', e.target.value)}
                                                    placeholder="أدخل نص الملاحظة أو دليل التطابق"
                                                    style={{ resize: 'vertical' }}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نسبة الملاحظات (%) *</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    required
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={technicalClinicalObservationFormData.percentage}
                                                    onChange={(e) => handleTechnicalClinicalObservationInputChange('percentage', e.target.value)}
                                                    placeholder="مثال: 32"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">الشهر *</label>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    required
                                                    value={technicalClinicalObservationFormData.month}
                                                    onChange={(e) => handleTechnicalClinicalObservationInputChange('month', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                {editingTechnicalClinicalObservationId ? 'تحديث الملاحظة' : 'إضافة الملاحظة'}
                                            </button>
                                            {editingTechnicalClinicalObservationId && (
                                                <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetTechnicalClinicalObservationForm}>
                                                    إلغاء التعديل
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </>
                            ) : null}

                            {/* Filter */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                        <label className="form-label">فلترة حسب الشهر</label>
                                        <input
                                            type="month"
                                            className="form-input"
                                            value={technicalClinicalObservationFilterMonth}
                                            onChange={(e) => setTechnicalClinicalObservationFilterMonth(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>الجهة التابعة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>دليل التطابق / الملاحظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>النسبة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                            {userCanEdit && (
                                                <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {technicalClinicalObservations.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 6 : 5} style={{
                                                    padding: '40px',
                                                    textAlign: 'center',
                                                    color: '#999'
                                                }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
                                                    لا توجد ملاحظات مسجلة
                                                </td>
                                            </tr>
                                        ) : (
                                            technicalClinicalObservations.map((observation, index) => (
                                                <tr key={observation.id} style={{
                                                    borderBottom: '1px solid #eee',
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                                }}>
                                                    <td style={{ padding: '12px', fontWeight: '500' }}>
                                                        {observation.entityType}
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        {observation.facilityType}
                                                    </td>
                                                    <td style={{ padding: '12px', maxWidth: '400px' }}>
                                                        {observation.observation}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 'bold',
                                                            backgroundColor: observation.percentage > 30 ? '#f8d7da' : observation.percentage >= 20 ? '#fff3cd' : '#d4edda',
                                                            color: observation.percentage > 30 ? '#721c24' : observation.percentage >= 20 ? '#856404' : '#155724'
                                                        }}>
                                                            {observation.percentage}%
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {observation.month}
                                                    </td>
                                                    {userCanEdit && (
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditTechnicalClinicalObservation(observation)}
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
                                                                    onClick={() => handleDeleteTechnicalClinicalObservation(observation.id!)}
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
                        </>
                    )}
                </div>
            )}

            {/* Technical Clinical Correction Rates Section - نسب تصحيح الملاحظات للرقابة الفنية والإكلينيكية - Only for dept4 */}
            {id === 'dept4' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isTcCorrectionRateSectionExpanded ? '20px' : '0',
                            paddingBottom: isTcCorrectionRateSectionExpanded ? '15px' : '0',
                            borderBottom: isTcCorrectionRateSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsTcCorrectionRateSectionExpanded(!isTcCorrectionRateSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📊 نسب تصحيح الملاحظات بناء على تقارير الزيارات - عدد {tcCorrectionRates.length} سجل
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isTcCorrectionRateSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isTcCorrectionRateSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isTcCorrectionRateSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {tcCorrectionRateSubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingTcCorrectionRateId ? 'تحديث' : 'إضافة'} السجل بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleTcCorrectionRateSubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                                            <div className="form-group">
                                                <label className="form-label">الجهة *</label>
                                                <select className="form-input" required value={tcCorrectionRateFormData.entityType}
                                                    onChange={(e) => {
                                                        handleTcCorrectionRateInputChange('entityType', e.target.value);
                                                        handleTcCorrectionRateInputChange('facilityCategory', '');
                                                    }}>
                                                    <option value="">اختر الجهة</option>
                                                    <option value="المنشآت الصحية التابعة لهيئة الرعاية">المنشآت الصحية التابعة لهيئة الرعاية</option>
                                                    <option value="المنشآت الصحية التابعة لوزارة الصحة">المنشآت الصحية التابعة لوزارة الصحة</option>
                                                    <option value="منشآت صحية أخرى">منشآت صحية أخرى</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select className="form-input" required value={tcCorrectionRateFormData.facilityCategory}
                                                    onChange={(e) => handleTcCorrectionRateInputChange('facilityCategory', e.target.value)}>
                                                    <option value="">اختر نوع المنشأة</option>
                                                    <option value="مراكز ووحدات الرعاية الأولية">مراكز ووحدات الرعاية الأولية</option>
                                                    <option value="مستشفى">مستشفى</option>
                                                    <option value="صيدلية">صيدلية</option>
                                                    <option value="معمل">معمل</option>
                                                    <option value="مراكز أشعة">مراكز أشعة</option>
                                                    <option value="مراكز طبية">مراكز طبية</option>
                                                    <option value="مراكز علاج طبيعي">مراكز علاج طبيعي</option>
                                                    <option value="عيادات طبية">عيادات طبية</option>
                                                    <option value="مستشفى صحة نفسية">مستشفى صحة نفسية</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">اسم المنشأة *</label>
                                                <input type="text" className="form-input" required value={tcCorrectionRateFormData.facilityName}
                                                    onChange={(e) => handleTcCorrectionRateInputChange('facilityName', e.target.value)} placeholder="مثال: مستشفى النصر التخصصي" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">المحافظة *</label>
                                                <input type="text" className="form-input" required value={tcCorrectionRateFormData.governorate}
                                                    onChange={(e) => handleTcCorrectionRateInputChange('governorate', e.target.value)} placeholder="مثال: بورسعيد" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">تاريخ الزيارة *</label>
                                                <input type="month" className="form-input" required value={tcCorrectionRateFormData.visitDate}
                                                    onChange={(e) => handleTcCorrectionRateInputChange('visitDate', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">نوع الزيارة *</label>
                                                <select className="form-input" required value={tcCorrectionRateFormData.visitType}
                                                    onChange={(e) => handleTcCorrectionRateInputChange('visitType', e.target.value)}>
                                                    <option value="">اختر نوع الزيارة</option>
                                                    <option value="تقييم فني وإكلينيكي">تقييم فني وإكلينيكي</option>
                                                    <option value="تدقيق فني وإكلينيكي">تدقيق فني وإكلينيكي</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">الشهر (للفلترة) *</label>
                                                <input type="month" className="form-input" required value={tcCorrectionRateFormData.month}
                                                    onChange={(e) => handleTcCorrectionRateInputChange('month', e.target.value)} />
                                            </div>
                                        </div>



                                        <h4 style={{ marginBottom: '15px', color: 'var(--secondary-color)' }}>بيانات المعايير (عدد الملاحظات الواردة / عدد المصححة)</h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                            {['ACT', 'ICD', 'DAS', 'MMS', 'SIP', 'IPC', 'SCM', 'TEX', 'TEQ', 'TPO', 'NSR', 'SAS'].map(criterion => (
                                                <div key={criterion} style={{ textAlign: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                                                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{criterion}</label>
                                                    <input type="number" min="0" className="form-input" placeholder="الواردة"
                                                        style={{ marginBottom: '5px', textAlign: 'center' }}
                                                        value={tcCorrectionRateFormData[`${criterion.toLowerCase()}Total` as keyof typeof tcCorrectionRateFormData]}
                                                        onChange={(e) => handleTcCorrectionRateInputChange(`${criterion.toLowerCase()}Total`, e.target.value)} />
                                                    <input type="number" min="0" className="form-input" placeholder="المصححة"
                                                        style={{ textAlign: 'center' }}
                                                        value={tcCorrectionRateFormData[`${criterion.toLowerCase()}Corrected` as keyof typeof tcCorrectionRateFormData]}
                                                        onChange={(e) => handleTcCorrectionRateInputChange(`${criterion.toLowerCase()}Corrected`, e.target.value)} />
                                                </div>
                                            ))}
                                        </div>


                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                {editingTcCorrectionRateId ? 'تحديث السجل' : 'إضافة السجل'}
                                            </button>
                                            {editingTcCorrectionRateId && (
                                                <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetTcCorrectionRateForm}>
                                                    إلغاء التعديل
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </>
                            ) : null}

                            {/* Filter */}
                            <div style={{ marginBottom: '20px' }}>
                                <div className="form-group" style={{ margin: 0, minWidth: '200px', display: 'inline-block' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input type="month" className="form-input" value={tcCorrectionRateFilterMonth}
                                        onChange={(e) => setTcCorrectionRateFilterMonth(e.target.value)} />
                                </div>
                            </div>

                            {/* Data Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {tcCorrectionRates.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                        لا توجد سجلات
                                    </div>
                                ) : (
                                    <div>
                                        {/* أولاً: المنشآت الصحية التابعة لهيئة الرعاية */}
                                        {tcCorrectionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية').length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <h2 style={{ backgroundColor: '#17a2b8', color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                                    🏛️ أولاً: المنشآت الصحية التابعة لهيئة الرعاية ({tcCorrectionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية').length} زيارات)
                                                </h2>
                                                <div style={{ border: '2px solid #17a2b8', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px' }}>
                                                    {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية'].map(category => {
                                                        const categoryRates = tcCorrectionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية' && r.facilityCategory === category);
                                                        if (categoryRates.length === 0) return null;
                                                        return (
                                                            <div key={category} style={{ marginBottom: '25px' }}>
                                                                <h3 style={{ marginBottom: '15px', color: '#17a2b8', borderBottom: '2px solid #17a2b8', paddingBottom: '10px' }}>
                                                                    🏥 {category} ({categoryRates.length} زيارات)
                                                                </h3>
                                                                {categoryRates.map((rate) => (
                                                                    <div key={rate.id} style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}</span>
                                                                            {userCanEdit && (
                                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                                    <button onClick={() => handleEditTcCorrectionRate(rate)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                                                    <button onClick={() => handleDeleteTcCorrectionRate(rate.id!)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                                            <thead>
                                                                                <tr style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                                                                                    <th style={{ padding: '6px', textAlign: 'right' }}>البيان</th>
                                                                                    {['ACT', 'ICD', 'DAS', 'MMS', 'SIP', 'IPC', 'SCM', 'TEX', 'TEQ', 'TPO', 'NSR', 'SAS'].map(c => (
                                                                                        <th key={c} style={{ padding: '6px', textAlign: 'center' }}>{c}</th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: '500' }}>الواردة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t === 0 && item.c === 0) ? '-' : item.t}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: '500' }}>المصححة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t === 0 && item.c === 0) ? '-' : item.c}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: 'bold' }}>النسبة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => {
                                                                                        if (item.t === 0 && item.c === 0) {
                                                                                            return (<td key={i} style={{ padding: '6px', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>-</span></td>);
                                                                                        }
                                                                                        const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                                        return (<td key={i} style={{ padding: '6px', textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24' }}>{pct}%</span></td>);
                                                                                    })}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>

                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ثانياً: المنشآت الصحية التابعة لوزارة الصحة */}
                                        {tcCorrectionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة').length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <h2 style={{ backgroundColor: '#ff9800', color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                                    🏥 ثانياً: المنشآت الصحية التابعة لوزارة الصحة ({tcCorrectionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة').length} زيارات)
                                                </h2>
                                                <div style={{ border: '2px solid #ff9800', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px' }}>
                                                    {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية', 'صيدلية', 'معمل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                                        const categoryRates = tcCorrectionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة' && r.facilityCategory === category);
                                                        if (categoryRates.length === 0) return null;
                                                        return (
                                                            <div key={category} style={{ marginBottom: '25px' }}>
                                                                <h3 style={{ marginBottom: '15px', color: '#ff9800', borderBottom: '2px solid #ff9800', paddingBottom: '10px' }}>
                                                                    🏥 {category} ({categoryRates.length} زيارات)
                                                                </h3>
                                                                {categoryRates.map((rate) => (
                                                                    <div key={rate.id} style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}</span>
                                                                            {userCanEdit && (
                                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                                    <button onClick={() => handleEditTcCorrectionRate(rate)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                                                    <button onClick={() => handleDeleteTcCorrectionRate(rate.id!)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                                            <thead>
                                                                                <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                                                                                    <th style={{ padding: '6px', textAlign: 'right' }}>البيان</th>
                                                                                    {['ACT', 'ICD', 'DAS', 'MMS', 'SIP', 'IPC', 'SCM', 'TEX', 'TEQ', 'TPO', 'NSR', 'SAS'].map(c => (
                                                                                        <th key={c} style={{ padding: '6px', textAlign: 'center' }}>{c}</th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: '500' }}>الواردة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t === 0 && item.c === 0) ? '-' : item.t}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: '500' }}>المصححة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t === 0 && item.c === 0) ? '-' : item.c}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: 'bold' }}>النسبة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => {
                                                                                        if (item.t === 0 && item.c === 0) {
                                                                                            return (<td key={i} style={{ padding: '6px', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>-</span></td>);
                                                                                        }
                                                                                        const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                                        return (<td key={i} style={{ padding: '6px', textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24' }}>{pct}%</span></td>);
                                                                                    })}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>

                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ثالثاً: منشآت صحية أخرى */}
                                        {tcCorrectionRates.filter(r => r.entityType === 'منشآت صحية أخرى').length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <h2 style={{ backgroundColor: '#28a745', color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                                    🏢 ثالثاً: منشآت صحية أخرى ({tcCorrectionRates.filter(r => r.entityType === 'منشآت صحية أخرى').length} زيارات)
                                                </h2>
                                                <div style={{ border: '2px solid #28a745', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px' }}>
                                                    {['صيدلية', 'معمل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                                        const categoryRates = tcCorrectionRates.filter(r => r.entityType === 'منشآت صحية أخرى' && r.facilityCategory === category);
                                                        if (categoryRates.length === 0) return null;
                                                        return (
                                                            <div key={category} style={{ marginBottom: '25px' }}>
                                                                <h3 style={{ marginBottom: '15px', color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
                                                                    🏥 {category} ({categoryRates.length} زيارات)
                                                                </h3>
                                                                {categoryRates.map((rate) => (
                                                                    <div key={rate.id} style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}</span>
                                                                            {userCanEdit && (
                                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                                    <button onClick={() => handleEditTcCorrectionRate(rate)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                                                    <button onClick={() => handleDeleteTcCorrectionRate(rate.id!)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
                                                                            <thead>
                                                                                <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                                                                                    <th style={{ padding: '6px', textAlign: 'right' }}>البيان</th>
                                                                                    {['ACT', 'ICD', 'DAS', 'MMS', 'SIP', 'IPC', 'SCM', 'TEX', 'TEQ', 'TPO', 'NSR', 'SAS'].map(c => (
                                                                                        <th key={c} style={{ padding: '6px', textAlign: 'center' }}>{c}</th>
                                                                                    ))}
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: '500' }}>الواردة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t === 0 && item.c === 0) ? '-' : item.t}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: '500' }}>المصححة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '6px', textAlign: 'center' }}>{(item.t === 0 && item.c === 0) ? '-' : item.c}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '6px', fontWeight: 'bold' }}>النسبة</td>
                                                                                    {[{ t: rate.actTotal, c: rate.actCorrected }, { t: rate.icdTotal, c: rate.icdCorrected }, { t: rate.dasTotal, c: rate.dasCorrected }, { t: rate.mmsTotal, c: rate.mmsCorrected }, { t: rate.sipTotal, c: rate.sipCorrected }, { t: rate.ipcTotal, c: rate.ipcCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.texTotal, c: rate.texCorrected }, { t: rate.teqTotal, c: rate.teqCorrected }, { t: rate.tpoTotal, c: rate.tpoCorrected }, { t: rate.nsrTotal, c: rate.nsrCorrected }, { t: rate.sasTotal, c: rate.sasCorrected }].map((item, i) => {
                                                                                        if (item.t === 0 && item.c === 0) {
                                                                                            return (<td key={i} style={{ padding: '6px', textAlign: 'center' }}><span style={{ fontSize: '0.75rem', color: '#6c757d' }}>-</span></td>);
                                                                                        }
                                                                                        const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                                        return (<td key={i} style={{ padding: '6px', textAlign: 'center' }}><span style={{ padding: '2px 6px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 'bold', backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da', color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24' }}>{pct}%</span></td>);
                                                                                    })}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>

                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Basic Requirements Facilities Tracking Section - Only for dept6 */}
            {/* Technical Support Visits Section - Dept2 Only */}
            {id === 'dept2' && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--primary-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                🏥 الزيارات الميدانية للمنشآت خلال شهر {techSupportVisitsFilter ? (() => {
                                    const [year, month] = techSupportVisitsFilter.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[parseInt(month) - 1];
                                })() : '...'} - عدد {techSupportVisits.filter(v => !techSupportVisitsFilter || v.month === techSupportVisitsFilter).length} زيارة
                            </h3>
                            <button
                                onClick={() => setIsTechSupportVisitsSectionExpanded(!isTechSupportVisitsSectionExpanded)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0',
                                    fontFamily: 'inherit',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isTechSupportVisitsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isTechSupportVisitsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                        {isTechSupportVisitsSectionExpanded && (
                            <>
                                {/* Form */}
                                <form onSubmit={handleTechSupportVisitSubmit} style={{ marginBottom: '30px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                اسم المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={techSupportVisitFormData.facilityName}
                                                onChange={(e) => setTechSupportVisitFormData({
                                                    ...techSupportVisitFormData,
                                                    facilityName: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                المحافظة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={techSupportVisitFormData.governorate}
                                                onChange={(e) => setTechSupportVisitFormData({
                                                    ...techSupportVisitFormData,
                                                    governorate: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                نوع الزيارة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={techSupportVisitFormData.visitType}
                                                onChange={(e) => setTechSupportVisitFormData({
                                                    ...techSupportVisitFormData,
                                                    visitType: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                                placeholder="مثال: دعم فني ميداني"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الجهة التابعة لها المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={techSupportVisitFormData.affiliatedEntity}
                                                onChange={(e) => setTechSupportVisitFormData({
                                                    ...techSupportVisitFormData,
                                                    affiliatedEntity: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                                placeholder="مثال: وزارة الصحة"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                نوع المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={techSupportVisitFormData.facilityType}
                                                onChange={(e) => setTechSupportVisitFormData({
                                                    ...techSupportVisitFormData,
                                                    facilityType: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر نوع المنشأة</option>
                                                {techSupportFacilityTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الشهر <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="month"
                                                value={techSupportVisitFormData.month}
                                                onChange={(e) => setTechSupportVisitFormData({
                                                    ...techSupportVisitFormData,
                                                    month: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editingTechSupportVisitId ? '📝 تحديث الزيارة' : '➕ إضافة زيارة'}
                                    </button>
                                    {editingTechSupportVisitId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingTechSupportVisitId(null);
                                                setTechSupportVisitFormData({
                                                    facilityName: '',
                                                    governorate: '',
                                                    visitType: '',
                                                    affiliatedEntity: '',
                                                    facilityType: '',
                                                    month: ''
                                                });
                                            }}
                                            style={{
                                                padding: '12px 30px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginLeft: '10px'
                                            }}
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}
                                </form>
                                {/* Filter and Table */}
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                            فلترة حسب الشهر:
                                        </label>
                                        <input
                                            type="month"
                                            value={techSupportVisitsFilter}
                                            onChange={(e) => setTechSupportVisitsFilter(e.target.value)}
                                            className="form-input"
                                            style={{ maxWidth: '300px' }}
                                        />
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>المحافظة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>نوع الزيارة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الجهة التابعة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الشهر</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {techSupportVisits
                                                    .filter(visit => !techSupportVisitsFilter || visit.month === techSupportVisitsFilter)
                                                    .map((visit, index) => (
                                                        <tr key={visit.id} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                        }}>
                                                            <td style={{ padding: '12px' }}>{visit.facilityName}</td>
                                                            <td style={{ padding: '12px' }}>{visit.governorate}</td>
                                                            <td style={{ padding: '12px' }}>{visit.visitType}</td>
                                                            <td style={{ padding: '12px' }}>{visit.affiliatedEntity}</td>
                                                            <td style={{ padding: '12px' }}>{visit.facilityType}</td>
                                                            <td style={{ padding: '12px' }}>{visit.month}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditTechSupportVisit(visit)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '5px'
                                                                    }}
                                                                >
                                                                    تعديل
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteTechSupportVisit(visit.id!)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    حذف
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {techSupportVisits.filter(visit => !techSupportVisitsFilter || visit.month === techSupportVisitsFilter).length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                            لا توجد زيارات مسجلة
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
            {id === 'dept2' && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--primary-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                💻 الدعم الفني عن بعد خلال شهر {remoteTechSupportFilter ? (() => {
                                    const [year, month] = remoteTechSupportFilter.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[parseInt(month) - 1];
                                })() : '...'} - عدد {remoteTechnicalSupports.filter(s => !remoteTechSupportFilter || s.month === remoteTechSupportFilter).length} زيارة
                            </h3>
                            <button
                                onClick={() => setIsRemoteTechSupportSectionExpanded(!isRemoteTechSupportSectionExpanded)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0',
                                    fontFamily: 'inherit',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isRemoteTechSupportSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isRemoteTechSupportSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                        {isRemoteTechSupportSectionExpanded && (
                            <>
                                <form onSubmit={handleRemoteTechSupportSubmit} style={{ marginBottom: '30px', marginTop: '20px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                اسم المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={remoteTechSupportFormData.facilityName}
                                                onChange={(e) => setRemoteTechSupportFormData(prev => ({ ...prev, facilityName: e.target.value }))}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                المحافظة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={remoteTechSupportFormData.governorate}
                                                onChange={(e) => setRemoteTechSupportFormData(prev => ({ ...prev, governorate: e.target.value }))}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                نوع الزيارة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={remoteTechSupportFormData.visitType}
                                                onChange={(e) => setRemoteTechSupportFormData(prev => ({ ...prev, visitType: e.target.value }))}
                                                className="form-input"
                                                required
                                                placeholder="مثال: دعم فني عن بعد"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الجهة التابعة لها المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={remoteTechSupportFormData.affiliatedEntity}
                                                onChange={(e) => setRemoteTechSupportFormData(prev => ({ ...prev, affiliatedEntity: e.target.value }))}
                                                className="form-input"
                                                required
                                                placeholder="مثال: وزارة الصحة"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                نوع المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={remoteTechSupportFormData.facilityType}
                                                onChange={(e) => setRemoteTechSupportFormData(prev => ({ ...prev, facilityType: e.target.value }))}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر نوع المنشأة</option>
                                                {techSupportFacilityTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الشهر <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="month"
                                                value={remoteTechSupportFormData.month}
                                                onChange={(e) => setRemoteTechSupportFormData(prev => ({ ...prev, month: e.target.value }))}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editingRemoteTechSupportId ? '📝 تحديث الزيارة' : '➕ إضافة زيارة'}
                                    </button>
                                    {editingRemoteTechSupportId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingRemoteTechSupportId(null);
                                                setRemoteTechSupportFormData({
                                                    facilityName: '',
                                                    governorate: '',
                                                    visitType: '',
                                                    affiliatedEntity: '',
                                                    facilityType: '',
                                                    month: ''
                                                });
                                            }}
                                            style={{
                                                padding: '12px 30px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginLeft: '10px'
                                            }}
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}
                                </form>
                                <div>
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        alignItems: 'center',
                                        marginBottom: '15px'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <label style={{ color: 'var(--text-secondary)' }}>فلترة حسب الشهر:</label>
                                            <input
                                                type="month"
                                                value={remoteTechSupportFilter}
                                                onChange={(e) => setRemoteTechSupportFilter(e.target.value)}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border-color)',
                                                    backgroundColor: 'var(--input-bg)',
                                                    color: 'var(--text-primary)'
                                                }}
                                            />
                                            {remoteTechSupportFilter && (
                                                <button
                                                    onClick={() => setRemoteTechSupportFilter('')}
                                                    style={{
                                                        padding: '8px 12px',
                                                        backgroundColor: '#6c757d',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '6px',
                                                        cursor: 'pointer'
                                                    }}
                                                >
                                                    إظهار الكل
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الشهر</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>المحافظة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right', width: '15%' }}>نوع الزيارة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الجهة التابعة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'center', width: '15%' }}>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {remoteTechnicalSupports
                                                    .filter(support => !remoteTechSupportFilter || support.month === remoteTechSupportFilter)
                                                    .map((support, index) => (
                                                        <tr key={support.id} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                        }}>
                                                            <td style={{ padding: '12px' }}>{support.month}</td>
                                                            <td style={{ padding: '12px' }}>{support.facilityName}</td>
                                                            <td style={{ padding: '12px' }}>{support.governorate}</td>
                                                            <td style={{ padding: '12px' }}>{support.visitType}</td>
                                                            <td style={{ padding: '12px' }}>{support.affiliatedEntity}</td>
                                                            <td style={{ padding: '12px' }}>{support.facilityType}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditRemoteTechSupport(support)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '5px'
                                                                    }}
                                                                >
                                                                    تعديل
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteRemoteTechSupport(support.id!)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    حذف
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {remoteTechnicalSupports.filter(s => !remoteTechSupportFilter || s.month === remoteTechSupportFilter).length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                            لا يوجد دعم فني مسجل
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Introductory Support Visits Section - Dept2 Only */}
            {id === 'dept2' && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--primary-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                🎯 زيارات الدعم الفني التمهيدية خلال شهر {introSupportVisitsFilter ? (() => {
                                    const [year, month] = introSupportVisitsFilter.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[parseInt(month) - 1];
                                })() : '...'} - عدد {introSupportVisits.filter(v => !introSupportVisitsFilter || v.month === introSupportVisitsFilter).length} زيارة
                            </h3>
                            <button
                                onClick={() => setIsIntroSupportVisitsSectionExpanded(!isIntroSupportVisitsSectionExpanded)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0',
                                    fontFamily: 'inherit',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isIntroSupportVisitsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isIntroSupportVisitsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                        {isIntroSupportVisitsSectionExpanded && (
                            <>
                                {/* Form */}
                                <form onSubmit={handleIntroSupportVisitSubmit} style={{ marginBottom: '30px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                اسم المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={introSupportVisitFormData.facilityName}
                                                onChange={(e) => setIntroSupportVisitFormData({
                                                    ...introSupportVisitFormData,
                                                    facilityName: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                المحافظة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={introSupportVisitFormData.governorate}
                                                onChange={(e) => setIntroSupportVisitFormData({
                                                    ...introSupportVisitFormData,
                                                    governorate: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                نوع الزيارة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={introSupportVisitFormData.visitType}
                                                onChange={(e) => setIntroSupportVisitFormData({
                                                    ...introSupportVisitFormData,
                                                    visitType: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                                placeholder="مثال: دعم فني تمهيدي"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الجهة التابعة لها المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={introSupportVisitFormData.affiliatedEntity}
                                                onChange={(e) => setIntroSupportVisitFormData({
                                                    ...introSupportVisitFormData,
                                                    affiliatedEntity: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                                placeholder="مثال: وزارة الصحة"
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                نوع المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={introSupportVisitFormData.facilityType}
                                                onChange={(e) => setIntroSupportVisitFormData({
                                                    ...introSupportVisitFormData,
                                                    facilityType: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر نوع المنشأة</option>
                                                {techSupportFacilityTypes.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الشهر <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="month"
                                                value={introSupportVisitFormData.month}
                                                onChange={(e) => setIntroSupportVisitFormData({
                                                    ...introSupportVisitFormData,
                                                    month: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editingIntroSupportVisitId ? '📝 تحديث الزيارة' : '➕ إضافة زيارة'}
                                    </button>
                                    {editingIntroSupportVisitId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingIntroSupportVisitId(null);
                                                setIntroSupportVisitFormData({
                                                    facilityName: '',
                                                    governorate: '',
                                                    visitType: '',
                                                    affiliatedEntity: '',
                                                    facilityType: '',
                                                    month: ''
                                                });
                                            }}
                                            style={{
                                                padding: '12px 30px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginLeft: '10px'
                                            }}
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}
                                </form>
                                {/* Filter and Table */}
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                            فلترة حسب الشهر:
                                        </label>
                                        <input
                                            type="month"
                                            value={introSupportVisitsFilter}
                                            onChange={(e) => setIntroSupportVisitsFilter(e.target.value)}
                                            className="form-input"
                                            style={{ maxWidth: '300px' }}
                                        />
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>المحافظة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>نوع الزيارة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الجهة التابعة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الشهر</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {introSupportVisits
                                                    .filter(visit => !introSupportVisitsFilter || visit.month === introSupportVisitsFilter)
                                                    .map((visit, index) => (
                                                        <tr key={visit.id} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                        }}>
                                                            <td style={{ padding: '12px' }}>{visit.facilityName}</td>
                                                            <td style={{ padding: '12px' }}>{visit.governorate}</td>
                                                            <td style={{ padding: '12px' }}>{visit.visitType}</td>
                                                            <td style={{ padding: '12px' }}>{visit.affiliatedEntity}</td>
                                                            <td style={{ padding: '12px' }}>{visit.facilityType}</td>
                                                            <td style={{ padding: '12px' }}>{visit.month}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditIntroSupportVisit(visit)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '5px'
                                                                    }}
                                                                >
                                                                    تعديل
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteIntroSupportVisit(visit.id!)}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    حذف
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {introSupportVisits.filter(v => !introSupportVisitsFilter || v.month === introSupportVisitsFilter).length === 0 && (
                                                    <tr>
                                                        <td colSpan={7} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                            لا يوجد زيارات مسجلة
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {/* Queued Support Visits Section - Dept2 Only */}
            {id === 'dept2' && (
                <div style={{ marginBottom: '40px' }}>
                    <div style={{
                        backgroundColor: 'var(--card-bg)',
                        borderRadius: '12px',
                        padding: '25px',
                        border: '1px solid var(--border-color)',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                    }}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '20px'
                        }}>
                            <h3 style={{
                                margin: 0,
                                color: 'var(--primary-color)',
                                fontSize: '1.3rem',
                                fontWeight: 'bold'
                            }}>
                                ⏳ زيارات الدعم الفني بقائمة الانتظار خلال شهر {queuedSupportVisitsFilter ? (() => {
                                    const [year, month] = queuedSupportVisitsFilter.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return monthNames[parseInt(month) - 1];
                                })() : '...'} - عدد {queuedSupportVisits.filter(v => !queuedSupportVisitsFilter || v.month === queuedSupportVisitsFilter).length} زيارة
                            </h3>
                            <button
                                onClick={() => setIsQueuedSupportVisitsSectionExpanded(!isQueuedSupportVisitsSectionExpanded)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    color: 'var(--primary-color)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    padding: '0',
                                    fontFamily: 'inherit',
                                    fontWeight: 'bold',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '5px'
                                }}
                            >
                                {isQueuedSupportVisitsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                                <svg
                                    width="24"
                                    height="24"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    style={{
                                        transform: isQueuedSupportVisitsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s'
                                    }}
                                >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                </svg>
                            </button>
                        </div>
                        {isQueuedSupportVisitsSectionExpanded && (
                            <>
                                {/* Form */}
                                <form onSubmit={async (e) => {
                                    e.preventDefault();
                                    if (!currentUser) return;

                                    const [year, month] = queuedSupportVisitFormData.month.split('-');

                                    if (editingQueuedSupportVisitId) {
                                        await updateQueuedSupportVisit(editingQueuedSupportVisitId, {
                                            facilityName: queuedSupportVisitFormData.facilityName,
                                            governorate: queuedSupportVisitFormData.governorate,
                                            month: queuedSupportVisitFormData.month,
                                            year: parseInt(year),
                                            updatedBy: currentUser.id
                                        });
                                    } else {
                                        await saveQueuedSupportVisit({
                                            facilityName: queuedSupportVisitFormData.facilityName,
                                            governorate: queuedSupportVisitFormData.governorate,
                                            month: queuedSupportVisitFormData.month,
                                            year: parseInt(year),
                                            createdBy: currentUser.id,
                                            updatedBy: currentUser.id
                                        });
                                    }

                                    setQueuedSupportVisitFormData({ facilityName: '', governorate: '', month: '' });
                                    setEditingQueuedSupportVisitId(null);
                                    await loadQueuedSupportVisits();
                                }} style={{ marginBottom: '30px' }}>
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                                        gap: '15px',
                                        marginBottom: '20px'
                                    }}>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                اسم المنشأة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                value={queuedSupportVisitFormData.facilityName}
                                                onChange={(e) => setQueuedSupportVisitFormData({
                                                    ...queuedSupportVisitFormData,
                                                    facilityName: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                المحافظة <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <select
                                                value={queuedSupportVisitFormData.governorate}
                                                onChange={(e) => setQueuedSupportVisitFormData({
                                                    ...queuedSupportVisitFormData,
                                                    governorate: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                                الشهر <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="month"
                                                value={queuedSupportVisitFormData.month}
                                                onChange={(e) => setQueuedSupportVisitFormData({
                                                    ...queuedSupportVisitFormData,
                                                    month: e.target.value
                                                })}
                                                className="form-input"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        style={{
                                            padding: '12px 30px',
                                            backgroundColor: 'var(--primary-color)',
                                            color: 'white',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontSize: '1rem',
                                            fontWeight: 'bold',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        {editingQueuedSupportVisitId ? '📝 تحديث الزيارة' : '➕ إضافة زيارة'}
                                    </button>
                                    {editingQueuedSupportVisitId && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setEditingQueuedSupportVisitId(null);
                                                setQueuedSupportVisitFormData({
                                                    facilityName: '',
                                                    governorate: '',
                                                    month: ''
                                                });
                                            }}
                                            style={{
                                                padding: '12px 30px',
                                                backgroundColor: '#6c757d',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '8px',
                                                fontSize: '1rem',
                                                fontWeight: 'bold',
                                                cursor: 'pointer',
                                                marginLeft: '10px'
                                            }}
                                        >
                                            إلغاء التعديل
                                        </button>
                                    )}
                                </form>
                                {/* Filter and Table */}
                                <div>
                                    <div style={{ marginBottom: '20px' }}>
                                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                                            فلترة حسب الشهر:
                                        </label>
                                        <input
                                            type="month"
                                            value={queuedSupportVisitsFilter}
                                            onChange={(e) => setQueuedSupportVisitsFilter(e.target.value)}
                                            className="form-input"
                                            style={{ maxWidth: '300px' }}
                                        />
                                    </div>
                                    <div style={{ overflowX: 'auto' }}>
                                        <table style={{
                                            width: '100%',
                                            borderCollapse: 'collapse',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            overflow: 'hidden'
                                        }}>
                                            <thead>
                                                <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>المحافظة</th>
                                                    <th style={{ padding: '12px', textAlign: 'right' }}>الشهر</th>
                                                    <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {queuedSupportVisits
                                                    .filter(visit => !queuedSupportVisitsFilter || visit.month === queuedSupportVisitsFilter)
                                                    .map((visit, index) => (
                                                        <tr key={visit.id} style={{
                                                            borderBottom: '1px solid #eee',
                                                            backgroundColor: index % 2 === 0 ? 'white' : '#f8f9fa'
                                                        }}>
                                                            <td style={{ padding: '12px' }}>{visit.facilityName}</td>
                                                            <td style={{ padding: '12px' }}>{visit.governorate}</td>
                                                            <td style={{ padding: '12px' }}>{visit.month}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingQueuedSupportVisitId(visit.id!);
                                                                        setQueuedSupportVisitFormData({
                                                                            facilityName: visit.facilityName,
                                                                            governorate: visit.governorate,
                                                                            month: visit.month
                                                                        });
                                                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#ffc107',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer',
                                                                        marginRight: '5px'
                                                                    }}
                                                                >
                                                                    تعديل
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
                                                                            await deleteQueuedSupportVisit(visit.id!);
                                                                            await loadQueuedSupportVisits();
                                                                        }
                                                                    }}
                                                                    style={{
                                                                        padding: '6px 12px',
                                                                        backgroundColor: '#dc3545',
                                                                        color: 'white',
                                                                        border: 'none',
                                                                        borderRadius: '4px',
                                                                        cursor: 'pointer'
                                                                    }}
                                                                >
                                                                    حذف
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                {queuedSupportVisits.filter(v => !queuedSupportVisitsFilter || v.month === queuedSupportVisitsFilter).length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} style={{ padding: '20px', textAlign: 'center', color: '#999' }}>
                                                            لا يوجد زيارات مسجلة
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

            {id === 'dept5' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isAdminAuditFacilitiesSectionExpanded ? '20px' : '0',
                            paddingBottom: isAdminAuditFacilitiesSectionExpanded ? '15px' : '0',
                            borderBottom: isAdminAuditFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsAdminAuditFacilitiesSectionExpanded(!isAdminAuditFacilitiesSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            🏥 المنشآت التي تم زيارتها خلال الشهر - عدد {adminAuditFacilities.length} زيارة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isAdminAuditFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isAdminAuditFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isAdminAuditFacilitiesSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {adminAuditFacilitySubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingAdminAuditFacilityId ? 'تحديث' : 'إضافة'} الزيارة بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleAdminAuditFacilitySubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={adminAuditFacilityFormData.facilityType}
                                                    onChange={(e) => handleAdminAuditFacilityInputChange('facilityType', e.target.value)}
                                                >
                                                    <option value="">اختر نوع المنشأة</option>
                                                    <option value="مستشفى">مستشفى</option>
                                                    <option value="صيدلية">صيدلية</option>
                                                    <option value="مراكز الرعاية الأولية">مراكز الرعاية الأولية</option>
                                                    <option value="معمل">معمل</option>
                                                    <option value="مركز أشعة">مركز أشعة</option>
                                                    <option value="مراكز طبية">مراكز طبية</option>
                                                    <option value="مستشفى صحة نفسية">مستشفى صحة نفسية</option>
                                                    <option value="عيادات طبية">عيادات طبية</option>
                                                    <option value="مراكز علاج طبيعي">مراكز علاج طبيعي</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">اسم المنشأة *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    required
                                                    value={adminAuditFacilityFormData.facilityName}
                                                    onChange={(e) => handleAdminAuditFacilityInputChange('facilityName', e.target.value)}
                                                    placeholder="أدخل اسم المنشأة"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نوع الزيارة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={adminAuditFacilityFormData.visitType}
                                                    onChange={(e) => handleAdminAuditFacilityInputChange('visitType', e.target.value)}
                                                >
                                                    <option value="">اختر نوع الزيارة</option>
                                                    <option value="زيارة متابعة">زيارة متابعة</option>
                                                    <option value="تفتيش إداري">تفتيش إداري</option>
                                                    <option value="تدقيق إداري وسلامة بيئية">تدقيق إداري وسلامة بيئية</option>
                                                    <option value="متابعة خطة تصحيحية لحدث جسيم">متابعة خطة تصحيحية لحدث جسيم</option>
                                                    <option value="فحص شكوى - إحالة">فحص شكوى - إحالة</option>
                                                    <option value="تخطيط صحي">تخطيط صحي</option>
                                                    <option value="تدقيق على السلامة البيئية">تدقيق على السلامة البيئية</option>
                                                    <option value="فحص حدث جسيم">فحص حدث جسيم</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">المحافظة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={adminAuditFacilityFormData.governorate}
                                                    onChange={(e) => handleAdminAuditFacilityInputChange('governorate', e.target.value)}
                                                >
                                                    <option value="">اختر المحافظة</option>
                                                    <option value="القاهرة">القاهرة</option>
                                                    <option value="الجيزة">الجيزة</option>
                                                    <option value="الإسكندرية">الإسكندرية</option>
                                                    <option value="الدقهلية">الدقهلية</option>
                                                    <option value="البحر الأحمر">البحر الأحمر</option>
                                                    <option value="البحيرة">البحيرة</option>
                                                    <option value="الفيوم">الفيوم</option>
                                                    <option value="الغربية">الغربية</option>
                                                    <option value="الإسماعيلية">الإسماعيلية</option>
                                                    <option value="المنوفية">المنوفية</option>
                                                    <option value="المنيا">المنيا</option>
                                                    <option value="القليوبية">القليوبية</option>
                                                    <option value="الوادي الجديد">الوادي الجديد</option>
                                                    <option value="السويس">السويس</option>
                                                    <option value="الشرقية">الشرقية</option>
                                                    <option value="جنوب سيناء">جنوب سيناء</option>
                                                    <option value="كفر الشيخ">كفر الشيخ</option>
                                                    <option value="مطروح">مطروح</option>
                                                    <option value="الأقصر">الأقصر</option>
                                                    <option value="قنا">قنا</option>
                                                    <option value="شمال سيناء">شمال سيناء</option>
                                                    <option value="سوهاج">سوهاج</option>
                                                    <option value="أسوان">أسوان</option>
                                                    <option value="أسيوط">أسيوط</option>
                                                    <option value="بني سويف">بني سويف</option>
                                                    <option value="بورسعيد">بورسعيد</option>
                                                    <option value="دمياط">دمياط</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">الشهر *</label>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    required
                                                    value={adminAuditFacilityFormData.month}
                                                    onChange={(e) => handleAdminAuditFacilityInputChange('month', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                {editingAdminAuditFacilityId ? 'تحديث الزيارة' : 'إضافة الزيارة'}
                                            </button>
                                            {editingAdminAuditFacilityId && (
                                                <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetAdminAuditFacilityForm}>
                                                    إلغاء التعديل
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </>
                            ) : null}

                            {/* Filter and Table */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                        <label className="form-label">فلترة حسب الشهر</label>
                                        <input
                                            type="month"
                                            className="form-input"
                                            value={adminAuditFacilityFilterMonth}
                                            onChange={(e) => setAdminAuditFacilityFilterMonth(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>نوع الزيارة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                            {userCanEdit && (
                                                <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminAuditFacilities.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 6 : 5} style={{
                                                    padding: '40px',
                                                    textAlign: 'center',
                                                    color: '#999'
                                                }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                    لا توجد زيارات مسجلة
                                                </td>
                                            </tr>
                                        ) : (
                                            adminAuditFacilities.map((facility, index) => (
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
                                                    <td style={{ padding: '12px', fontWeight: '500' }}>
                                                        {facility.visitType}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {facility.governorate}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {facility.month}
                                                    </td>
                                                    {userCanEdit && (
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditAdminAuditFacility(facility)}
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
                                                                    onClick={() => handleDeleteAdminAuditFacility(facility.id!)}
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
                        </>
                    )}
                </div>
            )}

            {/* Admin Audit Observations Section - الملاحظات المتكررة - Only for dept5 */}
            {id === 'dept5' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isAdminAuditObservationsSectionExpanded ? '20px' : '0',
                            paddingBottom: isAdminAuditObservationsSectionExpanded ? '15px' : '0',
                            borderBottom: isAdminAuditObservationsSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsAdminAuditObservationsSectionExpanded(!isAdminAuditObservationsSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📋 الملاحظات المتكررة خلال زيارات الرقابة الإدارية - عدد {adminAuditObservations.length} ملاحظة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isAdminAuditObservationsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isAdminAuditObservationsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isAdminAuditObservationsSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {adminAuditObservationSubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingAdminAuditObservationId ? 'تحديث' : 'إضافة'} الملاحظة بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleAdminAuditObservationSubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label className="form-label">الجهة التابعة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={adminAuditObservationFormData.entityType}
                                                    onChange={(e) => handleAdminAuditObservationInputChange('entityType', e.target.value)}
                                                >
                                                    <option value="">اختر الجهة</option>
                                                    <option value="المنشآت الصحية التابعة لهيئة الرعاية الصحية">المنشآت الصحية التابعة لهيئة الرعاية الصحية</option>
                                                    <option value="منشآت تابعة لوزارة الصحة">منشآت تابعة لوزارة الصحة</option>
                                                    <option value="منشآت تابعة لجهات أخرى">منشآت تابعة لجهات أخرى</option>
                                                </select>
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={adminAuditObservationFormData.facilityType}
                                                    onChange={(e) => handleAdminAuditObservationInputChange('facilityType', e.target.value)}
                                                >
                                                    <option value="">اختر نوع المنشأة</option>
                                                    <option value="مراكز ووحدات الرعاية الأولية">مراكز ووحدات الرعاية الأولية</option>
                                                    <option value="مستشفيات">مستشفيات</option>
                                                    <option value="مراكز طبية">مراكز طبية</option>
                                                    <option value="معامل">معامل</option>
                                                    <option value="مراكز الأشعة">مراكز الأشعة</option>
                                                    <option value="مراكز علاج طبيعي">مراكز علاج طبيعي</option>
                                                    <option value="مستشفيات صحة نفسية">مستشفيات صحة نفسية</option>
                                                    <option value="صيدليات">صيدليات</option>
                                                </select>
                                            </div>

                                            <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                                <label className="form-label">الملاحظة *</label>
                                                <textarea
                                                    className="form-input"
                                                    required
                                                    rows={3}
                                                    value={adminAuditObservationFormData.observation}
                                                    onChange={(e) => handleAdminAuditObservationInputChange('observation', e.target.value)}
                                                    placeholder="أدخل نص الملاحظة"
                                                    style={{ resize: 'vertical' }}
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">نسبة الملاحظات (%) *</label>
                                                <input
                                                    type="number"
                                                    className="form-input"
                                                    required
                                                    min="0"
                                                    max="100"
                                                    step="0.1"
                                                    value={adminAuditObservationFormData.percentage}
                                                    onChange={(e) => handleAdminAuditObservationInputChange('percentage', e.target.value)}
                                                    placeholder="مثال: 32"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">الشهر *</label>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    required
                                                    value={adminAuditObservationFormData.month}
                                                    onChange={(e) => handleAdminAuditObservationInputChange('month', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                            <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                {editingAdminAuditObservationId ? 'تحديث الملاحظة' : 'إضافة الملاحظة'}
                                            </button>
                                            {editingAdminAuditObservationId && (
                                                <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetAdminAuditObservationForm}>
                                                    إلغاء التعديل
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </>
                            ) : null}

                            {/* Filter */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '15px' }}>
                                    <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                        <label className="form-label">فلترة حسب الشهر</label>
                                        <input
                                            type="month"
                                            className="form-input"
                                            value={adminAuditObservationFilterMonth}
                                            onChange={(e) => setAdminAuditObservationFilterMonth(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>الجهة التابعة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>دليل التطابق / الملاحظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '100px' }}>النسبة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                            {userCanEdit && (
                                                <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {adminAuditObservations.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 6 : 5} style={{
                                                    padding: '40px',
                                                    textAlign: 'center',
                                                    color: '#999'
                                                }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📋</div>
                                                    لا توجد ملاحظات مسجلة
                                                </td>
                                            </tr>
                                        ) : (
                                            adminAuditObservations.map((observation, index) => (
                                                <tr key={observation.id} style={{
                                                    borderBottom: '1px solid #eee',
                                                    backgroundColor: index % 2 === 0 ? 'white' : '#f9fafb'
                                                }}>
                                                    <td style={{ padding: '12px', fontWeight: '500' }}>
                                                        {observation.entityType}
                                                    </td>
                                                    <td style={{ padding: '12px' }}>
                                                        {observation.facilityType}
                                                    </td>
                                                    <td style={{ padding: '12px', maxWidth: '400px' }}>
                                                        {observation.observation}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <span style={{
                                                            padding: '4px 12px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.9rem',
                                                            fontWeight: 'bold',
                                                            backgroundColor: observation.percentage > 30 ? '#f8d7da' : observation.percentage >= 20 ? '#fff3cd' : '#d4edda',
                                                            color: observation.percentage > 30 ? '#721c24' : observation.percentage >= 20 ? '#856404' : '#155724'
                                                        }}>
                                                            {observation.percentage}%
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {observation.month}
                                                    </td>
                                                    {userCanEdit && (
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditAdminAuditObservation(observation)}
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
                                                                    onClick={() => handleDeleteAdminAuditObservation(observation.id!)}
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
                        </>
                    )}
                </div>
            )}

            {/* Observation Correction Rates Section - نسب تصحيح الملاحظات - Only for dept5 */}
            {id === 'dept5' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isCorrectionRateSectionExpanded ? '20px' : '0',
                            paddingBottom: isCorrectionRateSectionExpanded ? '15px' : '0',
                            borderBottom: isCorrectionRateSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsCorrectionRateSectionExpanded(!isCorrectionRateSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📊 نسب تصحيح الملاحظات بناء على تقارير الزيارات - عدد {correctionRates.length} سجل
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isCorrectionRateSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isCorrectionRateSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isCorrectionRateSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {correctionRateSubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingCorrectionRateId ? 'تحديث' : 'إضافة'} السجل بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleCorrectionRateSubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px', marginBottom: '20px' }}>
                                            <div className="form-group">
                                                <label className="form-label">الجهة *</label>
                                                <select className="form-input" required value={correctionRateFormData.entityType}
                                                    onChange={(e) => {
                                                        handleCorrectionRateInputChange('entityType', e.target.value);
                                                        handleCorrectionRateInputChange('facilityCategory', '');
                                                    }}>
                                                    <option value="">اختر الجهة</option>
                                                    <option value="المنشآت الصحية التابعة لهيئة الرعاية">المنشآت الصحية التابعة لهيئة الرعاية</option>
                                                    <option value="المنشآت الصحية التابعة لوزارة الصحة">المنشآت الصحية التابعة لوزارة الصحة</option>
                                                    <option value="منشآت صحية أخرى">منشآت صحية أخرى</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select className="form-input" required value={correctionRateFormData.facilityCategory}
                                                    onChange={(e) => handleCorrectionRateInputChange('facilityCategory', e.target.value)}>
                                                    <option value="">اختر نوع المنشأة</option>
                                                    <option value="مراكز ووحدات الرعاية الأولية">مراكز ووحدات الرعاية الأولية</option>
                                                    <option value="مستشفيات">مستشفيات</option>
                                                    <option value="صيدليات">صيدليات</option>
                                                    <option value="معامل">معامل</option>
                                                    <option value="مراكز أشعة">مراكز أشعة</option>
                                                    <option value="مراكز طبية">مراكز طبية</option>
                                                    <option value="مراكز علاج طبيعي">مراكز علاج طبيعي</option>
                                                    <option value="عيادات طبية">عيادات طبية</option>
                                                    <option value="مستشفى صحة نفسية">مستشفى صحة نفسية</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">اسم المنشأة *</label>
                                                <input type="text" className="form-input" required value={correctionRateFormData.facilityName}
                                                    onChange={(e) => handleCorrectionRateInputChange('facilityName', e.target.value)} placeholder="مثال: مستشفى النصر التخصصي" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">المحافظة *</label>
                                                <input type="text" className="form-input" required value={correctionRateFormData.governorate}
                                                    onChange={(e) => handleCorrectionRateInputChange('governorate', e.target.value)} placeholder="مثال: بورسعيد" />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">تاريخ الزيارة *</label>
                                                <input type="date" className="form-input" required value={correctionRateFormData.visitDate}
                                                    onChange={(e) => handleCorrectionRateInputChange('visitDate', e.target.value)} />
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">نوع الزيارة *</label>
                                                <select className="form-input" required value={correctionRateFormData.visitType}
                                                    onChange={(e) => handleCorrectionRateInputChange('visitType', e.target.value)}>
                                                    <option value="">اختر نوع الزيارة</option>
                                                    <option value="زيارة متابعة تدقيق إداري">زيارة متابعة تدقيق إداري</option>
                                                    <option value="زيارة متابعة خطة تصحيحية">زيارة متابعة خطة تصحيحية</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label className="form-label">الشهر (للفلترة) *</label>
                                                <input type="month" className="form-input" required value={correctionRateFormData.month}
                                                    onChange={(e) => handleCorrectionRateInputChange('month', e.target.value)} />
                                            </div>
                                        </div>


                                        <h4 style={{ marginBottom: '15px', color: 'var(--secondary-color)' }}>بيانات المعايير (عدد الملاحظات الواردة / عدد المصححة)</h4>

                                        {/* المجموعة الأولى - 5 معايير */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '15px' }}>
                                            {['PCC', 'EFS', 'OGM', 'IMT', 'WFM'].map(criterion => (
                                                <div key={criterion} style={{ textAlign: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                                                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{criterion}</label>
                                                    <input type="number" min="0" className="form-input" placeholder="الواردة"
                                                        style={{ marginBottom: '5px', textAlign: 'center' }}
                                                        value={correctionRateFormData[`${criterion.toLowerCase()}Total` as keyof typeof correctionRateFormData]}
                                                        onChange={(e) => handleCorrectionRateInputChange(`${criterion.toLowerCase()}Total`, e.target.value)} />
                                                    <input type="number" min="0" className="form-input" placeholder="المصححة"
                                                        style={{ textAlign: 'center' }}
                                                        value={correctionRateFormData[`${criterion.toLowerCase()}Corrected` as keyof typeof correctionRateFormData]}
                                                        onChange={(e) => handleCorrectionRateInputChange(`${criterion.toLowerCase()}Corrected`, e.target.value)} />
                                                </div>
                                            ))}
                                        </div>

                                        {/* المجموعة الثانية - 5 معايير */}
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px', marginBottom: '20px' }}>
                                            {['CAI', 'QPI', 'MRS', 'SCM', 'EMS'].map(criterion => (
                                                <div key={criterion} style={{ textAlign: 'center', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
                                                    <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>{criterion}</label>
                                                    <input type="number" min="0" className="form-input" placeholder="الواردة"
                                                        style={{ marginBottom: '5px', textAlign: 'center' }}
                                                        value={correctionRateFormData[`${criterion.toLowerCase()}Total` as keyof typeof correctionRateFormData]}
                                                        onChange={(e) => handleCorrectionRateInputChange(`${criterion.toLowerCase()}Total`, e.target.value)} />
                                                    <input type="number" min="0" className="form-input" placeholder="المصححة"
                                                        style={{ textAlign: 'center' }}
                                                        value={correctionRateFormData[`${criterion.toLowerCase()}Corrected` as keyof typeof correctionRateFormData]}
                                                        onChange={(e) => handleCorrectionRateInputChange(`${criterion.toLowerCase()}Corrected`, e.target.value)} />
                                                </div>
                                            ))}
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px' }}>
                                            <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                                {editingCorrectionRateId ? 'تحديث السجل' : 'إضافة السجل'}
                                            </button>
                                            {editingCorrectionRateId && (
                                                <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetCorrectionRateForm}>
                                                    إلغاء التعديل
                                                </button>
                                            )}
                                        </div>
                                    </form>
                                </>
                            ) : null}

                            {/* Filter */}
                            <div style={{ marginBottom: '20px' }}>
                                <div className="form-group" style={{ margin: 0, minWidth: '200px', display: 'inline-block' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input type="month" className="form-input" value={correctionRateFilterMonth}
                                        onChange={(e) => setCorrectionRateFilterMonth(e.target.value)} />
                                </div>
                            </div>

                            {/* Data Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {correctionRates.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                        لا توجد سجلات
                                    </div>
                                ) : (
                                    <div>
                                        {/* أولاً: المنشآت الصحية التابعة لهيئة الرعاية */}
                                        {correctionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية').length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <h2 style={{ backgroundColor: '#17a2b8', color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                                    🏛️ أولاً: المنشآت الصحية التابعة لهيئة الرعاية ({correctionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية').length} زيارات)
                                                </h2>
                                                <div style={{ border: '2px solid #17a2b8', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px' }}>
                                                    {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية'].map(category => {
                                                        const categoryRates = correctionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لهيئة الرعاية' && r.facilityCategory === category);
                                                        if (categoryRates.length === 0) return null;
                                                        return (
                                                            <div key={category} style={{ marginBottom: '25px' }}>
                                                                <h3 style={{ marginBottom: '15px', color: '#17a2b8', borderBottom: '2px solid #17a2b8', paddingBottom: '10px' }}>
                                                                    🏥 {category} ({categoryRates.length} زيارات)
                                                                </h3>
                                                                {categoryRates.map((rate) => (
                                                                    <div key={rate.id} style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}</span>
                                                                            {userCanEdit && (
                                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                                    <button onClick={() => handleEditCorrectionRate(rate)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                                                    <button onClick={() => handleDeleteCorrectionRate(rate.id!)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                            <thead>
                                                                                <tr style={{ backgroundColor: '#17a2b8', color: 'white' }}>
                                                                                    <th style={{ padding: '8px', textAlign: 'right' }}>البيان</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>PCC</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>EFS</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>OGM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>IMT</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>WFM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>CAI</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>QPI</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>MRS</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>SCM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>EMS</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: '500' }}>عدد الملاحظات الواردة</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '8px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.t}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: '500' }}>عدد المصححة</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '8px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.c}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>نسبة التصحيح</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => {
                                                                                        if (item.t < 0 && item.c < 0) {
                                                                                            return (
                                                                                                <td key={i} style={{ padding: '8px', textAlign: 'center' }}>
                                                                                                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                                                                                </td>
                                                                                            );
                                                                                        }
                                                                                        const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                                        return (
                                                                                            <td key={i} style={{ padding: '8px', textAlign: 'center' }}>
                                                                                                <span style={{
                                                                                                    padding: '3px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold',
                                                                                                    backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da',
                                                                                                    color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24'
                                                                                                }}>{pct}%</span>
                                                                                            </td>
                                                                                        );
                                                                                    })}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ثانياً: المنشآت الصحية التابعة لوزارة الصحة */}
                                        {correctionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة').length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <h2 style={{ backgroundColor: '#ff9800', color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                                    🏥 ثانياً: المنشآت الصحية التابعة لوزارة الصحة ({correctionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة').length} زيارات)
                                                </h2>
                                                <div style={{ border: '2px solid #ff9800', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px' }}>
                                                    {['مستشفى', 'مستشفى صحة نفسية', 'مراكز ووحدات الرعاية الأولية', 'صيدلية', 'معمل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                                        const categoryRates = correctionRates.filter(r => r.entityType === 'المنشآت الصحية التابعة لوزارة الصحة' && r.facilityCategory === category);
                                                        if (categoryRates.length === 0) return null;
                                                        return (
                                                            <div key={category} style={{ marginBottom: '25px' }}>
                                                                <h3 style={{ marginBottom: '15px', color: '#ff9800', borderBottom: '2px solid #ff9800', paddingBottom: '10px' }}>
                                                                    🏥 {category} ({categoryRates.length} زيارات)
                                                                </h3>
                                                                {categoryRates.map((rate) => (
                                                                    <div key={rate.id} style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}</span>
                                                                            {userCanEdit && (
                                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                                    <button onClick={() => handleEditCorrectionRate(rate)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                                                    <button onClick={() => handleDeleteCorrectionRate(rate.id!)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                            <thead>
                                                                                <tr style={{ backgroundColor: '#ff9800', color: 'white' }}>
                                                                                    <th style={{ padding: '8px', textAlign: 'right' }}>البيان</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>PCC</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>EFS</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>OGM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>IMT</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>WFM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>CAI</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>QPI</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>MRS</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>SCM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>EMS</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: '500' }}>عدد الملاحظات الواردة</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '8px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.t}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: '500' }}>عدد المصححة</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '8px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.c}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>نسبة التصحيح</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => {
                                                                                        if (item.t < 0 && item.c < 0) {
                                                                                            return (
                                                                                                <td key={i} style={{ padding: '8px', textAlign: 'center' }}>
                                                                                                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                                                                                </td>
                                                                                            );
                                                                                        }
                                                                                        const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                                        return (
                                                                                            <td key={i} style={{ padding: '8px', textAlign: 'center' }}>
                                                                                                <span style={{
                                                                                                    padding: '3px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold',
                                                                                                    backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da',
                                                                                                    color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24'
                                                                                                }}>{pct}%</span>
                                                                                            </td>
                                                                                        );
                                                                                    })}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* ثالثاً: منشآت صحية أخرى */}
                                        {correctionRates.filter(r => r.entityType === 'منشآت صحية أخرى').length > 0 && (
                                            <div style={{ marginBottom: '40px' }}>
                                                <h2 style={{ backgroundColor: '#28a745', color: 'white', padding: '15px', borderRadius: '8px 8px 0 0', margin: 0 }}>
                                                    🏢 ثالثاً: منشآت صحية أخرى ({correctionRates.filter(r => r.entityType === 'منشآت صحية أخرى').length} زيارات)
                                                </h2>
                                                <div style={{ border: '2px solid #28a745', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '20px' }}>
                                                    {['صيدلية', 'معمل', 'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية'].map(category => {
                                                        const categoryRates = correctionRates.filter(r => r.entityType === 'منشآت صحية أخرى' && r.facilityCategory === category);
                                                        if (categoryRates.length === 0) return null;
                                                        return (
                                                            <div key={category} style={{ marginBottom: '25px' }}>
                                                                <h3 style={{ marginBottom: '15px', color: '#28a745', borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>
                                                                    🏥 {category} ({categoryRates.length} زيارات)
                                                                </h3>
                                                                {categoryRates.map((rate) => (
                                                                    <div key={rate.id} style={{ marginBottom: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px', padding: '15px' }}>
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                                                            <span style={{ fontWeight: 'bold' }}>● {rate.visitType} - {rate.facilityName} - {rate.governorate} - {rate.visitDate}</span>
                                                                            {userCanEdit && (
                                                                                <div style={{ display: 'flex', gap: '5px' }}>
                                                                                    <button onClick={() => handleEditCorrectionRate(rate)} style={{ padding: '4px 10px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                                                    <button onClick={() => handleDeleteCorrectionRate(rate.id!)} style={{ padding: '4px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                                                                            <thead>
                                                                                <tr style={{ backgroundColor: '#28a745', color: 'white' }}>
                                                                                    <th style={{ padding: '8px', textAlign: 'right' }}>البيان</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>PCC</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>EFS</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>OGM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>IMT</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>WFM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>CAI</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>QPI</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>MRS</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>SCM</th>
                                                                                    <th style={{ padding: '8px', textAlign: 'center' }}>EMS</th>
                                                                                </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: '500' }}>عدد الملاحظات الواردة</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '8px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.t}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: '#f1f1f1' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: '500' }}>عدد المصححة</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => (
                                                                                        <td key={i} style={{ padding: '8px', textAlign: 'center' }}>{(item.t < 0 && item.c < 0) ? 'N/A' : item.c}</td>
                                                                                    ))}
                                                                                </tr>
                                                                                <tr style={{ backgroundColor: 'white' }}>
                                                                                    <td style={{ padding: '8px', fontWeight: 'bold' }}>نسبة التصحيح</td>
                                                                                    {[{ t: rate.pccTotal, c: rate.pccCorrected }, { t: rate.efsTotal, c: rate.efsCorrected }, { t: rate.ogmTotal, c: rate.ogmCorrected }, { t: rate.imtTotal, c: rate.imtCorrected }, { t: rate.wfmTotal, c: rate.wfmCorrected }, { t: rate.caiTotal, c: rate.caiCorrected }, { t: rate.qpiTotal, c: rate.qpiCorrected }, { t: rate.mrsTotal, c: rate.mrsCorrected }, { t: rate.scmTotal, c: rate.scmCorrected }, { t: rate.emsTotal, c: rate.emsCorrected }].map((item, i) => {
                                                                                        if (item.t < 0 && item.c < 0) {
                                                                                            return (
                                                                                                <td key={i} style={{ padding: '8px', textAlign: 'center' }}>
                                                                                                    <span style={{ padding: '3px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold', backgroundColor: '#e9ecef', color: '#6c757d' }}>N/A</span>
                                                                                                </td>
                                                                                            );
                                                                                        }
                                                                                        const pct = item.t > 0 ? Math.round((item.c / item.t) * 100) : 0;
                                                                                        return (
                                                                                            <td key={i} style={{ padding: '8px', textAlign: 'center' }}>
                                                                                                <span style={{
                                                                                                    padding: '3px 8px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 'bold',
                                                                                                    backgroundColor: pct >= 80 ? '#d4edda' : pct >= 50 ? '#fff3cd' : '#f8d7da',
                                                                                                    color: pct >= 80 ? '#155724' : pct >= 50 ? '#856404' : '#721c24'
                                                                                                }}>{pct}%</span>
                                                                                            </td>
                                                                                        );
                                                                                    })}
                                                                                </tr>
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Basic Requirements Facilities Tracking Section - Only for dept6 */}
            {id === 'dept6' && (


                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isBasicRequirementsFacilitiesSectionExpanded ? '20px' : '0',
                            paddingBottom: isBasicRequirementsFacilitiesSectionExpanded ? '15px' : '0',
                            borderBottom: isBasicRequirementsFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsBasicRequirementsFacilitiesSectionExpanded(!isBasicRequirementsFacilitiesSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📝 متابعة استكمال المتطلبات الأساسية - عدد {basicRequirementsFacilities.length} منشأة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isBasicRequirementsFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isBasicRequirementsFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isBasicRequirementsFacilitiesSectionExpanded && (
                        <>
                            {userCanEdit ? (
                                <>
                                    {basicRequirementsFacilitySubmitted && (
                                        <div style={{ padding: '15px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginBottom: '20px', border: '1px solid #c3e6cb' }}>
                                            <strong>تم بنجاح!</strong> تم {editingBasicRequirementsFacilityId ? 'تحديث' : 'إضافة'} المنشأة بنجاح.
                                        </div>
                                    )}

                                    <form onSubmit={handleBasicRequirementsFacilitySubmit} style={{ marginBottom: '30px' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <div className="form-group">
                                                <label className="form-label">نوع المنشأة *</label>
                                                <select
                                                    className="form-input"
                                                    required
                                                    value={basicRequirementsFacilityFormData.facilityType}
                                                    onChange={(e) => handleBasicRequirementsFacilityInputChange('facilityType', e.target.value)}
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
                                                    value={basicRequirementsFacilityFormData.facilityName}
                                                    onChange={(e) => handleBasicRequirementsFacilityInputChange('facilityName', e.target.value)}
                                                    placeholder="أدخل اسم المنشأة"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">المحافظة *</label>
                                                <input
                                                    type="text"
                                                    className="form-input"
                                                    required
                                                    value={basicRequirementsFacilityFormData.governorate}
                                                    onChange={(e) => handleBasicRequirementsFacilityInputChange('governorate', e.target.value)}
                                                    placeholder="أدخل المحافظة"
                                                />
                                            </div>

                                            <div className="form-group">
                                                <label className="form-label">الشهر *</label>
                                                <input
                                                    type="month"
                                                    className="form-input"
                                                    required
                                                    value={basicRequirementsFacilityFormData.month}
                                                    onChange={(e) => handleBasicRequirementsFacilityInputChange('month', e.target.value)}
                                                    max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                />
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                            <button type="submit" className="btn btn-primary">
                                                {editingBasicRequirementsFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                            </button>
                                            {editingBasicRequirementsFacilityId && (
                                                <button
                                                    type="button"
                                                    onClick={resetBasicRequirementsFacilityForm}
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

                            {/* Basic Requirements Facilities Table */}
                            <div style={{ marginTop: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                        المنشآت المسجلة
                                    </h3>
                                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                        {basicRequirementsFacilities.length > 0 && (
                                            <>
                                                <button
                                                    onClick={exportBasicRequirementsFacilitiesToExcel}
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
                                                    onClick={exportBasicRequirementsFacilitiesToWord}
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
                                                value={basicRequirementsFacilityFilterMonth}
                                                onChange={(e) => setBasicRequirementsFacilityFilterMonth(e.target.value)}
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
                                            {basicRequirementsFacilities.length === 0 ? (
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
                                                basicRequirementsFacilities.map((facility, index) => (
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
                                                                        onClick={() => handleEditBasicRequirementsFacility(facility)}
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
                                                                        onClick={() => handleDeleteBasicRequirementsFacility(facility.id!)}
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
            )}

            {/* Appeals Facilities Section - Dept6 only */}
            {id === 'dept6' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: isAppealsFacilitiesSectionExpanded ? '20px' : '0',
                            paddingBottom: isAppealsFacilitiesSectionExpanded ? '15px' : '0',
                            borderBottom: isAppealsFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease',
                            cursor: 'pointer'
                        }}
                        onClick={() => setIsAppealsFacilitiesSectionExpanded(!isAppealsFacilitiesSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📋 دراسة الالتماسات - عدد {appealsFacilities.length} التماس
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isAppealsFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isAppealsFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isAppealsFacilitiesSectionExpanded && userCanEdit && (
                        <>
                            <form onSubmit={handleAppealsFacilitySubmit} style={{ marginBottom: '30px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                    <div className="form-group">
                                        <label className="form-label">نوع المنشأة *</label>
                                        <select
                                            className="form-input"
                                            required
                                            value={appealsFacilityFormData.facilityType}
                                            onChange={(e) => handleAppealsFacilityInputChange('facilityType', e.target.value)}
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
                                            value={appealsFacilityFormData.facilityName}
                                            onChange={(e) => handleAppealsFacilityInputChange('facilityName', e.target.value)}
                                            placeholder="أدخل اسم المنشأة"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">المحافظة *</label>
                                        <input
                                            type="text"
                                            className="form-input"
                                            required
                                            value={appealsFacilityFormData.governorate}
                                            onChange={(e) => handleAppealsFacilityInputChange('governorate', e.target.value)}
                                            placeholder="أدخل المحافظة"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">الشهر *</label>
                                        <input
                                            type="month"
                                            className="form-input"
                                            required
                                            value={appealsFacilityFormData.month}
                                            onChange={(e) => handleAppealsFacilityInputChange('month', e.target.value)}
                                            max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                    <button type="submit" className="btn btn-primary">
                                        {editingAppealsFacilityId ? 'تحديث الالتماس' : 'إضافة التماس'}
                                    </button>
                                    {editingAppealsFacilityId && (
                                        <button
                                            type="button"
                                            onClick={resetAppealsFacilityForm}
                                            className="btn"
                                            style={{ backgroundColor: '#6c757d', color: 'white' }}
                                        >
                                            إلغاء
                                        </button>
                                    )}
                                </div>
                            </form>

                            {appealsFacilitySubmitted && (
                                <div style={{
                                    padding: '12px',
                                    backgroundColor: '#d4edda',
                                    color: '#155724',
                                    borderRadius: '8px',
                                    marginBottom: '20px',
                                    border: '1px solid #c3e6cb'
                                }}>
                                    ✓ تم {editingAppealsFacilityId ? 'تحديث' : 'إضافة'} الالتماس بنجاح
                                </div>
                            )}
                        </>
                    )}

                    {isAppealsFacilitiesSectionExpanded && (
                        <div style={{ marginTop: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
                                <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--secondary-color)' }}>
                                    الالتماسات المسجلة
                                </h3>
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    {appealsFacilities.length > 0 && (
                                        <>
                                            <button
                                                onClick={exportAppealsFacilitiesToExcel}
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
                                                onClick={exportAppealsFacilitiesToWord}
                                                style={{
                                                    padding: '8px 16px',
                                                    backgroundColor: '#2b5797',
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
                                            value={appealsFacilityFilterMonth}
                                            onChange={(e) => setAppealsFacilityFilterMonth(e.target.value)}
                                            placeholder="فلترة حسب الشهر"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{
                                    width: '100%',
                                    borderCollapse: 'collapse',
                                    backgroundColor: 'white',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderRadius: '8px',
                                    overflow: 'hidden'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>الشهر</th>
                                            {userCanEdit && (
                                                <th style={{ padding: '12px', textAlign: 'center', width: '120px' }}>إجراءات</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appealsFacilities.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 5 : 4} style={{
                                                    padding: '40px',
                                                    textAlign: 'center',
                                                    color: '#999'
                                                }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                    لا توجد التماسات مسجلة
                                                </td>
                                            </tr>
                                        ) : (
                                            appealsFacilities.map((facility, index) => (
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
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {facility.month}
                                                    </td>
                                                    {userCanEdit && (
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditAppealsFacility(facility)}
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
                                                                    onClick={() => handleDeleteAppealsFacility(facility.id!)}
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
                    )}
                </div>
            )}

            {/* Scheduled Support Visits Section - زيارات الدعم الفني المجدولة في شهر .... (for dept2 only) */}
            {id === 'dept2' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isScheduledSupportVisitsSectionExpanded ? '20px' : '0',
                            paddingBottom: isScheduledSupportVisitsSectionExpanded ? '15px' : '0',
                            borderBottom: isScheduledSupportVisitsSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsScheduledSupportVisitsSectionExpanded(!isScheduledSupportVisitsSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📅 زيارات الدعم الفني المجدولة في شهر {(() => {
                                if (scheduledSupportVisitsFilter) {
                                    const [year, month] = scheduledSupportVisitsFilter.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                }
                                return '....';
                            })()} - عدد {scheduledSupportVisits.length} زيارة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isScheduledSupportVisitsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isScheduledSupportVisitsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isScheduledSupportVisitsSectionExpanded && (
                        <>
                            {/* Form - Only for users with edit permission */}
                            {userCanEdit && (
                                <form onSubmit={handleScheduledSupportVisitSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingScheduledSupportVisitId ? 'تعديل زيارة مجدولة' : 'إضافة زيارة مجدولة جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">اسم المنشأة *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={scheduledSupportVisitFormData.facilityName}
                                                onChange={(e) => setScheduledSupportVisitFormData({ ...scheduledSupportVisitFormData, facilityName: e.target.value })}
                                                placeholder="أدخل اسم المنشأة"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">المحافظة *</label>
                                            <select
                                                className="form-input"
                                                value={scheduledSupportVisitFormData.governorate}
                                                onChange={(e) => setScheduledSupportVisitFormData({ ...scheduledSupportVisitFormData, governorate: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">نوع الزيارة *</label>
                                            <select
                                                className="form-input"
                                                value={scheduledSupportVisitFormData.visitType}
                                                onChange={(e) => setScheduledSupportVisitFormData({ ...scheduledSupportVisitFormData, visitType: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر نوع الزيارة</option>
                                                <option value="زيارة ميدانية أساسية">زيارة ميدانية أساسية</option>
                                                <option value="زيارة ميدانية متابعة">زيارة ميدانية متابعة</option>
                                                <option value="زيارة ميدانية (ورشة عمل)">زيارة ميدانية (ورشة عمل)</option>
                                                <option value="زيارة ميدانية (مراجعة وثائق)">زيارة ميدانية (مراجعة وثائق)</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input
                                                type="month"
                                                className="form-input"
                                                value={scheduledSupportVisitFormData.month}
                                                onChange={(e) => setScheduledSupportVisitFormData({ ...scheduledSupportVisitFormData, month: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingScheduledSupportVisitId ? 'تحديث الزيارة' : 'إضافة الزيارة'}
                                        </button>
                                        {editingScheduledSupportVisitId && (
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={() => {
                                                    setEditingScheduledSupportVisitId(null);
                                                    setScheduledSupportVisitFormData({
                                                        facilityName: '',
                                                        governorate: '',
                                                        visitType: '',
                                                        month: ''
                                                    });
                                                }}
                                            >
                                                إلغاء التعديل
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* Filter */}
                            <div style={{ marginBottom: '20px' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={scheduledSupportVisitsFilter}
                                        onChange={(e) => setScheduledSupportVisitsFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {scheduledSupportVisits.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📅</div>
                                        لا توجد زيارات مجدولة
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>نوع الزيارة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {scheduledSupportVisits.map((visit, index) => {
                                                const [year, month] = visit.month.split('-');
                                                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                const monthName = monthNames[parseInt(month) - 1];

                                                return (
                                                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>{visit.facilityName}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{visit.governorate}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <span style={{
                                                                padding: '4px 12px',
                                                                borderRadius: '12px',
                                                                backgroundColor: '#e3f2fd',
                                                                color: '#1976d2',
                                                                fontSize: '0.85rem',
                                                                fontWeight: '500'
                                                            }}>
                                                                {visit.visitType}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{monthName} {year}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleEditScheduledSupportVisit(visit)}
                                                                        style={{
                                                                            padding: '5px 10px',
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
                                                                        onClick={() => handleDeleteScheduledSupportVisit(visit.id!)}
                                                                        style={{
                                                                            padding: '5px 10px',
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
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Accredited Supported Facilities Section - المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم (for dept2 only) */}
            {id === 'dept2' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isAccreditedSupportedFacilitiesSectionExpanded ? '20px' : '0',
                            paddingBottom: isAccreditedSupportedFacilitiesSectionExpanded ? '15px' : '0',
                            borderBottom: isAccreditedSupportedFacilitiesSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsAccreditedSupportedFacilitiesSectionExpanded(!isAccreditedSupportedFacilitiesSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            🏥 المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم خلال شهر {(() => {
                                if (accreditedSupportedFacilitiesFilter) {
                                    const [year, month] = accreditedSupportedFacilitiesFilter.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                }
                                return '....';
                            })()} - عدد {accreditedSupportedFacilities.length} منشأة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isAccreditedSupportedFacilitiesSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isAccreditedSupportedFacilitiesSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isAccreditedSupportedFacilitiesSectionExpanded && (
                        <>
                            {/* Form - Only for users with edit permission */}
                            {userCanEdit && (
                                <form onSubmit={handleAccreditedSupportedFacilitySubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingAccreditedSupportedFacilityId ? 'تعديل منشأة معتمدة' : 'إضافة منشأة معتمدة جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">اسم المنشأة *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.facilityName}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, facilityName: e.target.value })}
                                                placeholder="أدخل اسم المنشأة"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">المحافظة *</label>
                                            <select
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.governorate}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, governorate: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">رقم القرار *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.decisionNumber}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, decisionNumber: e.target.value })}
                                                placeholder="أدخل رقم القرار"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">تاريخ القرار *</label>
                                            <input
                                                type="date"
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.decisionDate}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, decisionDate: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">نوع الدعم المقدم للمنشأة *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.supportType}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, supportType: e.target.value })}
                                                placeholder="أدخل نوع الدعم المقدم"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">موقف المنشأة من الاعتماد *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.accreditationStatus}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, accreditationStatus: e.target.value })}
                                                placeholder="أدخل موقف المنشأة من الاعتماد"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input
                                                type="month"
                                                className="form-input"
                                                value={accreditedSupportedFacilityFormData.month}
                                                onChange={(e) => setAccreditedSupportedFacilityFormData({ ...accreditedSupportedFacilityFormData, month: e.target.value })}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingAccreditedSupportedFacilityId ? 'تحديث المنشأة' : 'إضافة المنشأة'}
                                        </button>
                                        {editingAccreditedSupportedFacilityId && (
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={() => {
                                                    setEditingAccreditedSupportedFacilityId(null);
                                                    setAccreditedSupportedFacilityFormData({
                                                        facilityName: '',
                                                        governorate: '',
                                                        decisionNumber: '',
                                                        decisionDate: '',
                                                        supportType: '',
                                                        accreditationStatus: '',
                                                        month: ''
                                                    });
                                                }}
                                            >
                                                إلغاء التعديل
                                            </button>
                                        )}
                                    </div>
                                </form>
                            )}

                            {/* Filter */}
                            <div style={{ marginBottom: '20px' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={accreditedSupportedFacilitiesFilter}
                                        onChange={(e) => setAccreditedSupportedFacilitiesFilter(e.target.value)}
                                    />
                                </div>
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {accreditedSupportedFacilities.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏥</div>
                                        لا توجد منشآت معتمدة
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>اسم المنشأة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>رقم القرار</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>تاريخ القرار</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>نوع الدعم</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>موقف الاعتماد</th>
                                                {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {accreditedSupportedFacilities.map((facility, index) => (
                                                <tr key={facility.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                    <td style={{ padding: '12px', textAlign: 'right' }}>{facility.facilityName}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{facility.governorate}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{facility.decisionNumber}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{facility.decisionDate}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{facility.supportType}</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>{facility.accreditationStatus}</td>
                                                    {userCanEdit && (
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>
                                                            <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                <button
                                                                    onClick={() => handleEditAccreditedSupportedFacility(facility)}
                                                                    style={{
                                                                        padding: '5px 10px',
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
                                                                    onClick={() => handleDeleteAccreditedSupportedFacility(facility.id!)}
                                                                    style={{
                                                                        padding: '5px 10px',
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
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Reviewer Evaluation Visits Section - الزيارات التقييمية وفقا لنوع المنشأة (for dept9 only) */}
            {id === 'dept9' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isReviewerEvaluationVisitsSectionExpanded ? '20px' : '0',
                            paddingBottom: isReviewerEvaluationVisitsSectionExpanded ? '15px' : '0',
                            borderBottom: isReviewerEvaluationVisitsSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsReviewerEvaluationVisitsSectionExpanded(!isReviewerEvaluationVisitsSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📊 الزيارات التقييمية وفقا لنوع المنشأة - شهر {(() => {
                                if (reviewerEvaluationVisitFilterMonth) {
                                    const [year, month] = reviewerEvaluationVisitFilterMonth.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                }
                                return '....'
                            })()} - عدد {reviewerEvaluationVisits.reduce((sum, visit) => sum + visit.visitsCount, 0)} زيارة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isReviewerEvaluationVisitsSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isReviewerEvaluationVisitsSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isReviewerEvaluationVisitsSectionExpanded && (
                        <>
                            {/* Form - Only for users with edit permission */}
                            {userCanEdit && (
                                <form onSubmit={handleReviewerEvaluationVisitSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingReviewerEvaluationVisitId ? 'تعديل زيارة تقييمية' : 'إضافة زيارة تقييمية جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input
                                                type="month"
                                                className="form-input"
                                                value={reviewerEvaluationVisitFormData.month}
                                                onChange={(e) => setReviewerEvaluationVisitFormData({ ...reviewerEvaluationVisitFormData, month: e.target.value })}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">نوع المنشأة *</label>
                                            <input
                                                type="text"
                                                className="form-input"
                                                value={reviewerEvaluationVisitFormData.facilityType}
                                                onChange={(e) => setReviewerEvaluationVisitFormData({ ...reviewerEvaluationVisitFormData, facilityType: e.target.value })}
                                                placeholder="أدخل نوع المنشأة"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">عدد الزيارات *</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={reviewerEvaluationVisitFormData.visitsCount}
                                                onChange={(e) => setReviewerEvaluationVisitFormData({ ...reviewerEvaluationVisitFormData, visitsCount: e.target.value })}
                                                placeholder="0"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingReviewerEvaluationVisitId ? 'تحديث الزيارة' : 'إضافة الزيارة'}
                                        </button>
                                        {editingReviewerEvaluationVisitId && (
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetReviewerEvaluationVisitForm}
                                            >
                                                إلغاء التعديل
                                            </button>
                                        )}
                                    </div>
                                    {reviewerEvaluationVisitSubmitted && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#d4edda',
                                            color: '#155724',
                                            borderRadius: '8px',
                                            marginTop: '15px',
                                            border: '1px solid #c3e6cb'
                                        }}>
                                            ✓ تم {editingReviewerEvaluationVisitId ? 'تحديث' : 'إضافة'} الزيارة التقييمية بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Filter and Export Buttons */}
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={reviewerEvaluationVisitFilterMonth}
                                        onChange={(e) => setReviewerEvaluationVisitFilterMonth(e.target.value)}
                                    />
                                </div>
                                {reviewerEvaluationVisits.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={exportReviewerEvaluationVisitsToExcel}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            📊 تصدير Excel
                                        </button>
                                        <button
                                            onClick={exportReviewerEvaluationVisitsToWord}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#2b5797',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            📄 تصدير Word
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {reviewerEvaluationVisits.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                        لا توجد زيارات تقييمية مسجلة
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>نوع المنشأة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>عدد الزيارات</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviewerEvaluationVisits.map((visit, index) => {
                                                const [year, month] = visit.month.split('-');
                                                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                const monthName = monthNames[parseInt(month) - 1];

                                                return (
                                                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>{visit.facilityType}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{visit.visitsCount}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{monthName} {year}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleEditReviewerEvaluationVisit(visit)}
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
                                                                        onClick={() => handleDeleteReviewerEvaluationVisit(visit.id!)}
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
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Reviewer Evaluation Visits By Governorate Section - الزيارات التقييمية وفقا للمحافظة (for dept9 only) */}
            {id === 'dept9' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isReviewerEvaluationVisitsByGovernorateSectionExpanded ? '20px' : '0',
                            paddingBottom: isReviewerEvaluationVisitsByGovernorateSectionExpanded ? '15px' : '0',
                            borderBottom: isReviewerEvaluationVisitsByGovernorateSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsReviewerEvaluationVisitsByGovernorateSectionExpanded(!isReviewerEvaluationVisitsByGovernorateSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📍 الزيارات التقييمية وفقا للمحافظة - شهر {(() => {
                                if (reviewerEvaluationVisitByGovernorateFilterMonth) {
                                    const [year, month] = reviewerEvaluationVisitByGovernorateFilterMonth.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                }
                                return '....';
                            })()} - عدد {reviewerEvaluationVisitsByGovernorate.reduce((sum, visit) => sum + visit.visitsCount, 0)} زيارة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isReviewerEvaluationVisitsByGovernorateSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isReviewerEvaluationVisitsByGovernorateSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isReviewerEvaluationVisitsByGovernorateSectionExpanded && (
                        <>
                            {/* Form - Only for users with edit permission */}
                            {userCanEdit && (
                                <form onSubmit={handleReviewerEvaluationVisitByGovernorateSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingReviewerEvaluationVisitByGovernorateId ? 'تعديل زيارة تقييمية' : 'إضافة زيارة تقييمية جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input
                                                type="month"
                                                className="form-input"
                                                value={reviewerEvaluationVisitByGovernorateFormData.month}
                                                onChange={(e) => setReviewerEvaluationVisitByGovernorateFormData({ ...reviewerEvaluationVisitByGovernorateFormData, month: e.target.value })}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">المحافظة *</label>
                                            <select
                                                className="form-input"
                                                value={reviewerEvaluationVisitByGovernorateFormData.governorate}
                                                onChange={(e) => setReviewerEvaluationVisitByGovernorateFormData({ ...reviewerEvaluationVisitByGovernorateFormData, governorate: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر المحافظة</option>
                                                <option value="القاهرة">القاهرة</option>
                                                <option value="الجيزة">الجيزة</option>
                                                <option value="الإسكندرية">الإسكندرية</option>
                                                <option value="الدقهلية">الدقهلية</option>
                                                <option value="الشرقية">الشرقية</option>
                                                <option value="المنوفية">المنوفية</option>
                                                <option value="القليوبية">القليوبية</option>
                                                <option value="البحيرة">البحيرة</option>
                                                <option value="الغربية">الغربية</option>
                                                <option value="بور سعيد">بور سعيد</option>
                                                <option value="دمياط">دمياط</option>
                                                <option value="الإسماعيلية">الإسماعيلية</option>
                                                <option value="السويس">السويس</option>
                                                <option value="كفر الشيخ">كفر الشيخ</option>
                                                <option value="الفيوم">الفيوم</option>
                                                <option value="بني سويف">بني سويف</option>
                                                <option value="المنيا">المنيا</option>
                                                <option value="أسيوط">أسيوط</option>
                                                <option value="سوهاج">سوهاج</option>
                                                <option value="قنا">قنا</option>
                                                <option value="الأقصر">الأقصر</option>
                                                <option value="أسوان">أسوان</option>
                                                <option value="البحر الأحمر">البحر الأحمر</option>
                                                <option value="الوادي الجديد">الوادي الجديد</option>
                                                <option value="مطروح">مطروح</option>
                                                <option value="شمال سيناء">شمال سيناء</option>
                                                <option value="جنوب سيناء">جنوب سيناء</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">عدد الزيارات *</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={reviewerEvaluationVisitByGovernorateFormData.visitsCount}
                                                onChange={(e) => setReviewerEvaluationVisitByGovernorateFormData({ ...reviewerEvaluationVisitByGovernorateFormData, visitsCount: e.target.value })}
                                                placeholder="0"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingReviewerEvaluationVisitByGovernorateId ? 'تحديث الزيارة' : 'إضافة الزيارة'}
                                        </button>
                                        {editingReviewerEvaluationVisitByGovernorateId && (
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetReviewerEvaluationVisitByGovernorateForm}
                                            >
                                                إلغاء التعديل
                                            </button>
                                        )}
                                    </div>
                                    {reviewerEvaluationVisitByGovernorateSubmitted && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#d4edda',
                                            color: '#155724',
                                            borderRadius: '8px',
                                            marginTop: '15px',
                                            border: '1px solid #c3e6cb'
                                        }}>
                                            ✓ تم {editingReviewerEvaluationVisitByGovernorateId ? 'تحديث' : 'إضافة'} الزيارة التقييمية بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Filter and Export Buttons */}
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={reviewerEvaluationVisitByGovernorateFilterMonth}
                                        onChange={(e) => setReviewerEvaluationVisitByGovernorateFilterMonth(e.target.value)}
                                    />
                                </div>
                                {reviewerEvaluationVisitsByGovernorate.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={exportReviewerEvaluationVisitsByGovernorateToExcel}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            📊 تصدير Excel
                                        </button>
                                        <button
                                            onClick={exportReviewerEvaluationVisitsByGovernorateToWord}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#2b5797',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            📄 تصدير Word
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {reviewerEvaluationVisitsByGovernorate.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📍</div>
                                        لا توجد زيارات تقييمية مسجلة
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>المحافظة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>عدد الزيارات</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviewerEvaluationVisitsByGovernorate.map((visit, index) => {
                                                const [year, month] = visit.month.split('-');
                                                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                const monthName = monthNames[parseInt(month) - 1];

                                                return (
                                                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>{visit.governorate}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{visit.visitsCount}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{monthName} {year}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleEditReviewerEvaluationVisitByGovernorate(visit)}
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
                                                                        onClick={() => handleDeleteReviewerEvaluationVisitByGovernorate(visit.id!)}
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
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Reviewer Evaluation Visits By Visit Type Section - الزيارات التقييمية وفقا لنوع الزيارة (for dept9 only) */}
            {id === 'dept9' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isReviewerEvaluationVisitsByTypeSectionExpanded ? '20px' : '0',
                            paddingBottom: isReviewerEvaluationVisitsByTypeSectionExpanded ? '15px' : '0',
                            borderBottom: isReviewerEvaluationVisitsByTypeSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsReviewerEvaluationVisitsByTypeSectionExpanded(!isReviewerEvaluationVisitsByTypeSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📊 الزيارات التقييمية وفقا لنوع الزيارة - شهر {(() => {
                                if (reviewerEvaluationVisitByTypeFilterMonth) {
                                    const [year, month] = reviewerEvaluationVisitByTypeFilterMonth.split('-');
                                    const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                    return `${monthNames[parseInt(month) - 1]} ${year}`;
                                }
                                return '....';
                            })()} - عدد {reviewerEvaluationVisitsByType.reduce((sum, visit) => sum + visit.visitsCount, 0)} زيارة
                        </h2>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            color: 'var(--primary-color)',
                            fontWeight: 'bold'
                        }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isReviewerEvaluationVisitsByTypeSectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg
                                width="24"
                                height="24"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                style={{
                                    transform: isReviewerEvaluationVisitsByTypeSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                    transition: 'transform 0.3s ease'
                                }}
                            >
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isReviewerEvaluationVisitsByTypeSectionExpanded && (
                        <>
                            {/* Form - Only for users with edit permission */}
                            {userCanEdit && (
                                <form onSubmit={handleReviewerEvaluationVisitByTypeSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingReviewerEvaluationVisitByTypeId ? 'تعديل زيارة تقييمية' : 'إضافة زيارة تقييمية جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input
                                                type="month"
                                                className="form-input"
                                                value={reviewerEvaluationVisitByTypeFormData.month}
                                                onChange={(e) => setReviewerEvaluationVisitByTypeFormData({ ...reviewerEvaluationVisitByTypeFormData, month: e.target.value })}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">نوع الزيارة *</label>
                                            <select
                                                className="form-input"
                                                value={reviewerEvaluationVisitByTypeFormData.visitType}
                                                onChange={(e) => setReviewerEvaluationVisitByTypeFormData({ ...reviewerEvaluationVisitByTypeFormData, visitType: e.target.value })}
                                                required
                                            >
                                                <option value="">اختر نوع الزيارة</option>
                                                <option value="منشآت خضراء">منشآت خضراء</option>
                                                <option value="زيارة تقييمية بناء على التماس">زيارة تقييمية بناء على التماس</option>
                                                <option value="اعتماد بعد اعتماد مبدئي">اعتماد بعد اعتماد مبدئي</option>
                                                <option value="غير معلنة - استكمال اعتماد مبدئي">غير معلنة - استكمال اعتماد مبدئي</option>
                                                <option value="غير معلنة استكمال اعتماد">غير معلنة استكمال اعتماد</option>
                                                <option value="غير معلنة اعتماد مبدئي">غير معلنة اعتماد مبدئي</option>
                                                <option value="غير معلنة اعتماد">غير معلنة اعتماد</option>
                                                <option value="استكمال اعتماد مبدئي">استكمال اعتماد مبدئي</option>
                                                <option value="اعتماد مبدئي فرصة ثانية">اعتماد مبدئي فرصة ثانية</option>
                                                <option value="اعتماد مبدئي">اعتماد مبدئي</option>
                                                <option value="تجديد اعتماد مبدئي">تجديد اعتماد مبدئي</option>
                                                <option value="اعتماد فرصة ثانية">اعتماد فرصة ثانية</option>
                                                <option value="استكمال اعتماد">استكمال اعتماد</option>
                                                <option value="تجديد اعتماد">تجديد اعتماد</option>
                                                <option value="اعتماد">اعتماد</option>
                                                <option value="استرشادية">استرشادية</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">عدد الزيارات *</label>
                                            <input
                                                type="number"
                                                className="form-input"
                                                value={reviewerEvaluationVisitByTypeFormData.visitsCount}
                                                onChange={(e) => setReviewerEvaluationVisitByTypeFormData({ ...reviewerEvaluationVisitByTypeFormData, visitsCount: e.target.value })}
                                                placeholder="0"
                                                min="0"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingReviewerEvaluationVisitByTypeId ? 'تحديث الزيارة' : 'إضافة الزيارة'}
                                        </button>
                                        {editingReviewerEvaluationVisitByTypeId && (
                                            <button
                                                type="button"
                                                className="btn"
                                                style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetReviewerEvaluationVisitByTypeForm}
                                            >
                                                إلغاء التعديل
                                            </button>
                                        )}
                                    </div>
                                    {reviewerEvaluationVisitByTypeSubmitted && (
                                        <div style={{
                                            padding: '12px',
                                            backgroundColor: '#d4edda',
                                            color: '#155724',
                                            borderRadius: '8px',
                                            marginTop: '15px',
                                            border: '1px solid #c3e6cb'
                                        }}>
                                            ✓ تم {editingReviewerEvaluationVisitByTypeId ? 'تحديث' : 'إضافة'} الزيارة التقييمية بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            {/* Filter and Export Buttons */}
                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        value={reviewerEvaluationVisitByTypeFilterMonth}
                                        onChange={(e) => setReviewerEvaluationVisitByTypeFilterMonth(e.target.value)}
                                    />
                                </div>
                                {reviewerEvaluationVisitsByType.length > 0 && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <button
                                            onClick={exportReviewerEvaluationVisitsByTypeToExcel}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#28a745',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            📊 تصدير Excel
                                        </button>
                                        <button
                                            onClick={exportReviewerEvaluationVisitsByTypeToWord}
                                            style={{
                                                padding: '8px 16px',
                                                backgroundColor: '#2b5797',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '6px',
                                                cursor: 'pointer',
                                                fontSize: '0.9rem'
                                            }}
                                        >
                                            📄 تصدير Word
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div style={{ overflowX: 'auto' }}>
                                {reviewerEvaluationVisitsByType.length === 0 ? (
                                    <div style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                        <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                        لا توجد زيارات تقييمية مسجلة
                                    </div>
                                ) : (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>#</th>
                                                <th style={{ padding: '12px', textAlign: 'right' }}>نوع الزيارة</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>عدد الزيارات</th>
                                                <th style={{ padding: '12px', textAlign: 'center' }}>الشهر</th>
                                                {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>الإجراءات</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviewerEvaluationVisitsByType.map((visit, index) => {
                                                const [year, month] = visit.month.split('-');
                                                const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
                                                const monthName = monthNames[parseInt(month) - 1];

                                                return (
                                                    <tr key={visit.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                        <td style={{ padding: '12px', textAlign: 'right' }}>{visit.visitType}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: 'var(--primary-color)' }}>{visit.visitsCount}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{monthName} {year}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button
                                                                        onClick={() => handleEditReviewerEvaluationVisitByType(visit)}
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
                                                                        onClick={() => handleDeleteReviewerEvaluationVisitByType(visit.id!)}
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
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            {
                submissions.length > 0 && id !== 'dept7' && (
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
                            {id === 'dept8' && (
                                <button
                                    onClick={() => setIsStandardsDashboardOpen(true)}
                                    className="btn"
                                    style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                                >
                                    📊 لوحة البيانات
                                </button>
                            )}
                            {id === 'dept9' && (
                                <button
                                    onClick={() => setIsReviewersDashboardOpen(true)}
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
                        <TechnicalSupportDashboard
                            submissions={submissions}
                            visits={techSupportVisits}
                            remoteSupports={remoteTechnicalSupports}
                            introductoryVisits={introSupportVisits}
                            queuedVisits={queuedSupportVisits}
                            scheduledVisits={scheduledSupportVisits}
                            accreditedSupportedFacilities={accreditedSupportedFacilities}
                        />
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
                        <TechnicalClinicalDashboard
                            submissions={submissions}
                            facilities={technicalClinicalFacilities}
                            correctionRates={tcCorrectionRates}
                            observations={technicalClinicalObservations}
                        />
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
                        <AdminAuditDashboard
                            submissions={submissions}
                            facilities={adminAuditFacilities}
                            observations={adminAuditObservations}
                            correctionRates={correctionRates}
                        />
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
                        <AccreditationDashboard
                            submissions={submissions}
                            facilities={facilities}
                            completionFacilities={completionFacilities}
                            paymentFacilities={paymentFacilities}
                            paidFacilities={paidFacilities}
                            medicalProfessionalRegistrations={medicalProfessionalRegistrations}
                            correctivePlanFacilities={correctivePlanFacilities}
                            basicRequirementsFacilities={basicRequirementsFacilities}
                            appealsFacilities={appealsFacilities}
                        />
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

            {
                id === 'dept9' && (
                    <DashboardModal
                        isOpen={isReviewersDashboardOpen}
                        onClose={() => setIsReviewersDashboardOpen(false)}
                        title="لوحة بيانات الإدارة العامة لشئون المراجعين"
                    >
                        <ReviewersDashboard
                            submissions={submissions}
                            evaluationVisits={reviewerEvaluationVisits}
                            governorateVisits={reviewerEvaluationVisitsByGovernorate}
                            visitTypeVisits={reviewerEvaluationVisitsByType}
                        />
                    </DashboardModal>
                )
            }

            {/* Medical Professionals By Category Section - أعضاء المهن الطبية حسب الفئة (for dept7 only) */}
            {id === 'dept7' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isMedProfByCategorySectionExpanded ? '20px' : '0',
                            paddingBottom: isMedProfByCategorySectionExpanded ? '15px' : '0',
                            borderBottom: isMedProfByCategorySectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsMedProfByCategorySectionExpanded(!isMedProfByCategorySectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            👥 أعضاء المهن الطبية المسجلين خلال الشهر (طبقا للفئة)
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            <span style={{ fontSize: '0.9rem' }}>
                                {isMedProfByCategorySectionExpanded ? 'طي القسم' : 'توسيع القسم'}
                            </span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isMedProfByCategorySectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isMedProfByCategorySectionExpanded && (
                        <>
                            {userCanEdit && (
                                <form onSubmit={handleMedProfByCategorySubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingMedProfByCategoryId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input type="month" className="form-input" required value={medProfByCategoryFormData.month}
                                                onChange={(e) => handleMedProfByCategoryInputChange('month', e.target.value)}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">الفرع *</label>
                                            <select className="form-input" required value={medProfByCategoryFormData.branch}
                                                onChange={(e) => handleMedProfByCategoryInputChange('branch', e.target.value)}>
                                                <option value="">اختر الفرع</option>
                                                <option value="رئاسة الهيئة">رئاسة الهيئة</option>
                                                <option value="بورسعيد">بورسعيد</option>
                                                <option value="الأقصر">الأقصر</option>
                                                <option value="الإسماعيلية">الإسماعيلية</option>
                                                <option value="السويس">السويس</option>
                                                <option value="أسوان">أسوان</option>
                                                <option value="جنوب سيناء">جنوب سيناء</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء بشريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.doctors}
                                                onChange={(e) => handleMedProfByCategoryInputChange('doctors', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء أسنان *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.dentists}
                                                onChange={(e) => handleMedProfByCategoryInputChange('dentists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">صيادلة *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.pharmacists}
                                                onChange={(e) => handleMedProfByCategoryInputChange('pharmacists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علاج طبيعي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.physiotherapy}
                                                onChange={(e) => handleMedProfByCategoryInputChange('physiotherapy', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">بيطريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.veterinarians}
                                                onChange={(e) => handleMedProfByCategoryInputChange('veterinarians', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">تمريض عالي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.seniorNursing}
                                                onChange={(e) => handleMedProfByCategoryInputChange('seniorNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني تمريض *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.technicalNursing}
                                                onChange={(e) => handleMedProfByCategoryInputChange('technicalNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني صحي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.healthTechnician}
                                                onChange={(e) => handleMedProfByCategoryInputChange('healthTechnician', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علميين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByCategoryFormData.scientists}
                                                onChange={(e) => handleMedProfByCategoryInputChange('scientists', e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingMedProfByCategoryId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                        </button>
                                        {editingMedProfByCategoryId && (
                                            <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetMedProfByCategoryForm}>إلغاء التعديل</button>
                                        )}
                                    </div>
                                    {medProfByCategorySubmitted && (
                                        <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '15px', border: '1px solid #c3e6cb' }}>
                                            ✓ تم {editingMedProfByCategoryId ? 'تحديث' : 'إضافة'} البيانات بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input type="month" className="form-input" value={medProfByCategoryFilterMonth}
                                        onChange={(e) => setMedProfByCategoryFilterMonth(e.target.value)}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#00BCD4', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>الفرع</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>أطباء بشريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>أطباء أسنان</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>صيادلة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>علاج طبيعي</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>بيطريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>تمريض عالي</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>فني تمريض</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>فني صحي</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>علميين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', backgroundColor: '#FFA726' }}>الإجمالي</th>
                                            {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medProfsByCategory.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 12 : 11} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                    لا توجد بيانات
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {['رئاسة الهيئة', 'بورسعيد', 'الأقصر', 'الإسماعيلية', 'السويس', 'أسوان', 'جنوب سيناء'].map(branch => {
                                                    const branchData = medProfsByCategory.filter(item => item.branch === branch);
                                                    if (branchData.length === 0) return null;
                                                    const totals = branchData.reduce((acc, item) => ({
                                                        doctors: acc.doctors + item.doctors,
                                                        dentists: acc.dentists + item.dentists,
                                                        pharmacists: acc.pharmacists + item.pharmacists,
                                                        physiotherapy: acc.physiotherapy + item.physiotherapy,
                                                        veterinarians: acc.veterinarians + item.veterinarians,
                                                        seniorNursing: acc.seniorNursing + item.seniorNursing,
                                                        technicalNursing: acc.technicalNursing + item.technicalNursing,
                                                        healthTechnician: acc.healthTechnician + item.healthTechnician,
                                                        scientists: acc.scientists + item.scientists
                                                    }), {
                                                        doctors: 0, dentists: 0, pharmacists: 0, physiotherapy: 0,
                                                        veterinarians: 0, seniorNursing: 0, technicalNursing: 0,
                                                        healthTechnician: 0, scientists: 0
                                                    });
                                                    const branchTotal = Object.values(totals).reduce((a, b) => a + b, 0);

                                                    return (
                                                        <tr key={branch} style={{ borderBottom: '1px solid #eee' }}>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '600' }}>{branch}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.doctors}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.dentists}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.pharmacists}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.physiotherapy}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.veterinarians}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.seniorNursing}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.technicalNursing}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.healthTechnician}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>{totals.scientists}</td>
                                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '700', backgroundColor: '#FFF3E0' }}>{branchTotal}</td>
                                                            {userCanEdit && (
                                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                        <button onClick={() => handleEditMedProfByCategory(branchData[0])}
                                                                            style={{ padding: '6px 12px', backgroundColor: 'var(--primary-color)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                            تعديل
                                                                        </button>
                                                                        <button onClick={() => handleDeleteMedProfByCategory(branchData[0].id!)}
                                                                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>
                                                                            حذف
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            )}
                                                        </tr>
                                                    );
                                                })}
                                                <tr style={{ backgroundColor: '#FFA726', color: 'white', fontWeight: 'bold' }}>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.doctors, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.dentists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.pharmacists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.physiotherapy, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.veterinarians, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.seniorNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.technicalNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.healthTechnician, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.scientists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByCategory.reduce((sum, item) => sum + item.total, 0)}
                                                    </td>
                                                    {userCanEdit && <td></td>}
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Medical Professionals By Governorate Section - for dept7 only */}
            {id === 'dept7' && (
                <div className="card" style={{ marginTop: '30px' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            cursor: 'pointer',
                            marginBottom: isMedProfByGovernorateSectionExpanded ? '20px' : '0',
                            paddingBottom: isMedProfByGovernorateSectionExpanded ? '15px' : '0',
                            borderBottom: isMedProfByGovernorateSectionExpanded ? '2px solid var(--background-color)' : 'none',
                            transition: 'all 0.3s ease'
                        }}
                        onClick={() => setIsMedProfByGovernorateSectionExpanded(!isMedProfByGovernorateSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            🏛️ إجمالي أعضاء المهن الطبية المسجلين بالمحافظات (خلال الشهر)
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            <span style={{ fontSize: '0.9rem' }}>{isMedProfByGovernorateSectionExpanded ? 'طي القسم' : 'توسيع القسم'}</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isMedProfByGovernorateSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isMedProfByGovernorateSectionExpanded && (
                        <>
                            {userCanEdit && (
                                <form onSubmit={handleMedProfByGovernorateSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingMedProfByGovernorateId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input type="month" className="form-input" required value={medProfByGovernorateFormData.month}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('month', e.target.value)}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">المحافظة *</label>
                                            <select className="form-input" required value={medProfByGovernorateFormData.governorate}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('governorate', e.target.value)}>
                                                <option value="">اختر المحافظة</option>
                                                {egyptGovernorates.map(gov => (
                                                    <option key={gov} value={gov}>{gov}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء بشريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.doctors}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('doctors', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء أسنان *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.dentists}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('dentists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">صيادلة *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.pharmacists}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('pharmacists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علاج طبيعي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.physiotherapy}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('physiotherapy', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">بيطريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.veterinarians}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('veterinarians', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">تمريض عالي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.seniorNursing}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('seniorNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني تمريض *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.technicalNursing}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('technicalNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني صحي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.healthTechnician}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('healthTechnician', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علميين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={medProfByGovernorateFormData.scientists}
                                                onChange={(e) => handleMedProfByGovernorateInputChange('scientists', e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingMedProfByGovernorateId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                        </button>
                                        {editingMedProfByGovernorateId && (
                                            <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetMedProfByGovernorateForm}>إلغاء التعديل</button>
                                        )}
                                    </div>
                                    {medProfByGovernorateSubmitted && (
                                        <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '15px', border: '1px solid #c3e6cb' }}>
                                            ✓ تم {editingMedProfByGovernorateId ? 'تحديث' : 'إضافة'} البيانات بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input type="month" className="form-input" value={medProfByGovernorateFilterMonth}
                                        onChange={(e) => setMedProfByGovernorateFilterMonth(e.target.value)}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                </div>
                                {medProfByGovernorateFilterMonth && (
                                    <button
                                        type="button"
                                        className="btn"
                                        onClick={() => setMedProfByGovernorateFilterMonth('')}
                                        style={{ backgroundColor: '#6c757d', color: 'white', height: 'fit-content' }}
                                    >
                                        عرض الكل
                                    </button>
                                )}
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#00BCD4', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>المحافظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>أطباء بشريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>أطباء أسنان</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>صيادلة</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>علاج طبيعي</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>بيطريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>تمريض عالي</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>فني تمريض</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>فني صحي</th>
                                            <th style={{ padding: '12px', textAlign: 'center' }}>علميين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', backgroundColor: '#FFA726' }}>الإجمالي</th>
                                            {userCanEdit && <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {medProfsByGovernorate.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 12 : 11} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                                    <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                                    لا توجد بيانات
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {medProfsByGovernorate.map((item, index) => (
                                                    <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? '#f9f9f9' : 'white' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.governorate}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.doctors}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.dentists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.pharmacists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.physiotherapy}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.veterinarians}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.seniorNursing}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.technicalNursing}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.healthTechnician}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.scientists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#FFA726' }}>{item.total}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button onClick={() => handleEditMedProfByGovernorate(item)} style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>تعديل</button>
                                                                    <button onClick={() => handleDeleteMedProfByGovernorate(item.id!)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>حذف</button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                <tr style={{ backgroundColor: '#FFA726', color: 'white', fontWeight: 'bold' }}>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.doctors, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.dentists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.pharmacists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.physiotherapy, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.veterinarians, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.seniorNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.technicalNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.healthTechnician, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.scientists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {medProfsByGovernorate.reduce((sum, item) => sum + item.total, 0)}
                                                    </td>
                                                    {userCanEdit && <td></td>}
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Total Medical Professionals By Category Section for dept7 */}
            {id === 'dept7' && (
                <div className="card" style={{ marginTop: '30px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTotalMedProfByCategorySectionExpanded ? '20px' : '0', padding: '15px 20px', backgroundColor: '#f8f9fa', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
                        onClick={() => setIsTotalMedProfByCategorySectionExpanded(!isTotalMedProfByCategorySectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            📊 الإجمالي الكلي لأعضاء المهن الطبية المسجلين (طبقا للفئة)
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            <span style={{ fontSize: '0.9rem' }}>{isTotalMedProfByCategorySectionExpanded ? 'طي القسم' : 'توسيع القسم'}</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isTotalMedProfByCategorySectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isTotalMedProfByCategorySectionExpanded && (
                        <>
                            {userCanEdit && (
                                <form onSubmit={handleTotalMedProfByCategorySubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingTotalMedProfByCategoryId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input type="month" className="form-input" required value={totalMedProfByCategoryFormData.month}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('month', e.target.value)}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">الفرع *</label>
                                            <select className="form-input" required value={totalMedProfByCategoryFormData.branch}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('branch', e.target.value)}>
                                                <option value="">اختر الفرع</option>
                                                <option value="رئاسة الهيئة">رئاسة الهيئة</option>
                                                <option value="بورسعيد">بورسعيد</option>
                                                <option value="الأقصر">الأقصر</option>
                                                <option value="الإسماعيلية">الإسماعيلية</option>
                                                <option value="السويس">السويس</option>
                                                <option value="أسوان">أسوان</option>
                                                <option value="جنوب سيناء">جنوب سيناء</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء بشريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.doctors}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('doctors', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء أسنان *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.dentists}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('dentists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">صيادلة *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.pharmacists}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('pharmacists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علاج طبيعي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.physiotherapy}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('physiotherapy', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">بيطريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.veterinarians}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('veterinarians', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">تمريض عالي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.seniorNursing}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('seniorNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني تمريض *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.technicalNursing}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('technicalNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني صحي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.healthTechnician}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('healthTechnician', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علميين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByCategoryFormData.scientists}
                                                onChange={(e) => handleTotalMedProfByCategoryInputChange('scientists', e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingTotalMedProfByCategoryId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                        </button>
                                        {editingTotalMedProfByCategoryId && (
                                            <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetTotalMedProfByCategoryForm}>إلغاء التعديل</button>
                                        )}
                                    </div>
                                    {totalMedProfByCategorySubmitted && (
                                        <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '15px', border: '1px solid #c3e6cb' }}>
                                            ✓ تم {editingTotalMedProfByCategoryId ? 'تحديث' : 'إضافة'} البيانات بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input type="month" className="form-input" value={totalMedProfByCategoryFilterMonth}
                                        onChange={(e) => setTotalMedProfByCategoryFilterMonth(e.target.value)}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>الفرع</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>أطباء بشريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>أطباء أسنان</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>صيادلة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>علاج طبيعي</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>بيطريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>تمريض عالي</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>فني تمريض</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>فني صحي</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>علميين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>الإجمالي</th>
                                            {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>الإجراءات</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {totalMedProfsByCategory.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 12 : 11} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                    لا توجد بيانات لعرضها
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {totalMedProfsByCategory.map((item, index) => (
                                                    <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.branch}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.doctors}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.dentists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.pharmacists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.physiotherapy}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.veterinarians}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.seniorNursing}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.technicalNursing}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.healthTechnician}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.scientists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#FFA726' }}>{item.total}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button onClick={() => handleEditTotalMedProfByCategory(item)} style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>تعديل</button>
                                                                    <button onClick={() => handleDeleteTotalMedProfByCategory(item.id!)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>حذف</button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                <tr style={{ backgroundColor: '#FFA726', color: 'white', fontWeight: 'bold' }}>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.doctors, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.dentists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.pharmacists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.physiotherapy, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.veterinarians, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.seniorNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.technicalNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.healthTechnician, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.scientists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByCategory.reduce((sum, item) => sum + item.total, 0)}
                                                    </td>
                                                    {userCanEdit && <td></td>}
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Total Medical Professionals By Governorate Section for dept7 */}
            {id === 'dept7' && (
                <div className="card" style={{ marginTop: '30px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                    <div
                        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: isTotalMedProfByGovernorateSectionExpanded ? '20px' : '0', padding: '15px 20px', backgroundColor: '#f8f9fa', borderRadius: '8px 8px 0 0', cursor: 'pointer' }}
                        onClick={() => setIsTotalMedProfByGovernorateSectionExpanded(!isTotalMedProfByGovernorateSectionExpanded)}
                    >
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                            🏛️ الإجمالي الكلي لأعضاء المهن الطبية المسجلين بالمحافظات
                        </h2>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary-color)', fontWeight: 'bold' }}>
                            <span style={{ fontSize: '0.9rem' }}>{isTotalMedProfByGovernorateSectionExpanded ? 'طي القسم' : 'توسيع القسم'}</span>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                                style={{ transform: isTotalMedProfByGovernorateSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.3s ease' }}>
                                <polyline points="6 9 12 15 18 9"></polyline>
                            </svg>
                        </div>
                    </div>

                    {isTotalMedProfByGovernorateSectionExpanded && (
                        <>
                            {userCanEdit && (
                                <form onSubmit={handleTotalMedProfByGovernorateSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                                    <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                        {editingTotalMedProfByGovernorateId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                                    </h3>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                        <div className="form-group">
                                            <label className="form-label">الشهر *</label>
                                            <input type="month" className="form-input" required value={totalMedProfByGovernorateFormData.month}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('month', e.target.value)}
                                                max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">المحافظة *</label>
                                            <select className="form-input" required value={totalMedProfByGovernorateFormData.governorate}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('governorate', e.target.value)}>
                                                <option value="">اختر المحافظة</option>
                                                <option value="القاهرة">القاهرة</option>
                                                <option value="الجيزة">الجيزة</option>
                                                <option value="الإسكندرية">الإسكندرية</option>
                                                <option value="الدقهلية">الدقهلية</option>
                                                <option value="البحر الأحمر">البحر الأحمر</option>
                                                <option value="البحيرة">البحيرة</option>
                                                <option value="الفيوم">الفيوم</option>
                                                <option value="الغربية">الغربية</option>
                                                <option value="الإسماعيلية">الإسماعيلية</option>
                                                <option value="المنوفية">المنوفية</option>
                                                <option value="المنيا">المنيا</option>
                                                <option value="القليوبية">القليوبية</option>
                                                <option value="الوادي الجديد">الوادي الجديد</option>
                                                <option value="السويس">السويس</option>
                                                <option value="أسوان">أسوان</option>
                                                <option value="أسيوط">أسيوط</option>
                                                <option value="بني سويف">بني سويف</option>
                                                <option value="بورسعيد">بورسعيد</option>
                                                <option value="دمياط">دمياط</option>
                                                <option value="الشرقية">الشرقية</option>
                                                <option value="جنوب سيناء">جنوب سيناء</option>
                                                <option value="كفر الشيخ">كفر الشيخ</option>
                                                <option value="مطروح">مطروح</option>
                                                <option value="الأقصر">الأقصر</option>
                                                <option value="قنا">قنا</option>
                                                <option value="شمال سيناء">شمال سيناء</option>
                                                <option value="سوهاج">سوهاج</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء بشريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.doctors}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('doctors', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">أطباء أسنان *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.dentists}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('dentists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">صيادلة *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.pharmacists}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('pharmacists', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علاج طبيعي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.physiotherapy}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('physiotherapy', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">بيطريين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.veterinarians}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('veterinarians', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">تمريض عالي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.seniorNursing}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('seniorNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني تمريض *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.technicalNursing}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('technicalNursing', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">فني صحي *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.healthTechnician}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('healthTechnician', e.target.value)} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">علميين *</label>
                                            <input type="number" className="form-input" required min="0" placeholder="0"
                                                value={totalMedProfByGovernorateFormData.scientists}
                                                onChange={(e) => handleTotalMedProfByGovernorateInputChange('scientists', e.target.value)} />
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                                        <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            {editingTotalMedProfByGovernorateId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                        </button>
                                        {editingTotalMedProfByGovernorateId && (
                                            <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }}
                                                onClick={resetTotalMedProfByGovernorateForm}>إلغاء التعديل</button>
                                        )}
                                    </div>
                                    {totalMedProfByGovernorateSubmitted && (
                                        <div style={{ padding: '12px', backgroundColor: '#d4edda', color: '#155724', borderRadius: '8px', marginTop: '15px', border: '1px solid #c3e6cb' }}>
                                            ✓ تم {editingTotalMedProfByGovernorateId ? 'تحديث' : 'إضافة'} البيانات بنجاح
                                        </div>
                                    )}
                                </form>
                            )}

                            <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div className="form-group" style={{ margin: 0, maxWidth: '300px' }}>
                                    <label className="form-label">فلترة حسب الشهر</label>
                                    <input type="month" className="form-input" value={totalMedProfByGovernorateFilterMonth}
                                        onChange={(e) => setTotalMedProfByGovernorateFilterMonth(e.target.value)}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                                    <thead>
                                        <tr style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>المحافظة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>أطباء بشريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>أطباء أسنان</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>صيادلة</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>علاج طبيعي</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>بيطريين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>تمريض عالي</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>فني تمريض</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>فني صحي</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>علميين</th>
                                            <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>الإجمالي</th>
                                            {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid var(--border-color)' }}>الإجراءات</th>}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {totalMedProfsByGovernorate.length === 0 ? (
                                            <tr>
                                                <td colSpan={userCanEdit ? 12 : 11} style={{ padding: '20px', textAlign: 'center', color: '#666' }}>
                                                    لا توجد بيانات لعرضها
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
                                                {totalMedProfsByGovernorate.map((item, index) => (
                                                    <tr key={item.id} style={{ backgroundColor: index % 2 === 0 ? '#f8f9fa' : 'white' }}>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.governorate}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.doctors}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.dentists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.pharmacists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.physiotherapy}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.veterinarians}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.seniorNursing}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.technicalNursing}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.healthTechnician}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center' }}>{item.scientists}</td>
                                                        <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#FFA726' }}>{item.total}</td>
                                                        {userCanEdit && (
                                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                                <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                                    <button onClick={() => handleEditTotalMedProfByGovernorate(item)} style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>تعديل</button>
                                                                    <button onClick={() => handleDeleteTotalMedProfByGovernorate(item.id!)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>حذف</button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))}
                                                <tr style={{ backgroundColor: '#FFA726', color: 'white', fontWeight: 'bold' }}>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>الإجمالي</td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.doctors, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.dentists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.pharmacists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.physiotherapy, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.veterinarians, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.seniorNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.technicalNursing, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.healthTechnician, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.scientists, 0)}
                                                    </td>
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        {totalMedProfsByGovernorate.reduce((sum, item) => sum + item.total, 0)}
                                                    </td>
                                                    {userCanEdit && <td></td>}
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Main Data Table for dept7 (Moved to bottom) */}
            {
                submissions.length > 0 && id === 'dept7' && (
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
                                onClick={() => setIsMedicalProfessionalsDashboardOpen(true)}
                                className="btn"
                                style={{ backgroundColor: '#0eacb8', color: 'white', fontSize: '0.9rem' }}
                            >
                                📊 لوحة البيانات
                            </button>
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
                                    {/* Totals Row */}
                                    {filteredSubmissions.length > 0 && (
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

            {/* Standards Dashboard Modal for dept8 */}
            {id === 'dept8' && (
                <DashboardModal
                    isOpen={isStandardsDashboardOpen}
                    onClose={() => setIsStandardsDashboardOpen(false)}
                    title="لوحة بيانات أبحاث وتطوير المعايير"
                >
                    <StandardsDashboard submissions={submissions} />
                </DashboardModal>
            )}
        </div >
    );
}
