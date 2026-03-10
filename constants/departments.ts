// Shared department constants - single source of truth for the entire application

export interface Field {
    name: string;
    label: string;
    type: 'number' | 'text' | 'date' | 'month';
}

export const departments: Record<string, string> = {
    'dept1': 'الإدارة العامة للتدريب للغير',
    'dept2': 'الإدارة العامة للدعم الفني',
    'dept3': 'الإدارة العامة لرضاء المتعاملين',
    'dept4': 'الإدارة العامة للرقابة الفنية والإكلينيكية',
    'dept5': 'الإدارة العامة للرقابة الإدارية على المنشآت الصحية',
    'dept6': 'الإدارة العامة للاعتماد والتسجيل',
    'dept7': 'الإدارة العامة لتسجيل أعضاء المهن الطبية',
    'dept8': 'الإدارة العامة لأبحاث وتطوير المعايير',
    'dept9': 'الإدارة العامة لشئون المراجعين',
    'dept10': 'الإدارة العامة للتصميم الصحي الآمن',
};

// Department list as array (for home page grid)
export const departmentsList = Object.entries(departments).map(([id, name]) => ({ id, name }));

export const departmentFields: Record<string, Field[]> = {
    'dept1': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'trainingPrograms', label: 'عدد البرامج التدريبية', type: 'number' },
        { name: 'trainees', label: 'عدد المتدربين', type: 'number' },
        { name: 'activitySummary', label: 'ملخص أنشطة الإدارة', type: 'text' },
        { name: 'activityDetails', label: 'تفاصيل أنشطة الإدارة', type: 'text' },
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
        { name: 'queuedFieldVisits', label: 'عدد الزيارات الميدانية بقائمة الانتظار', type: 'number' },
        { name: 'governoratesWithFieldVisits', label: 'عدد المحافظات المنفذ بها زيارات ميدانية', type: 'number' },
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
        { name: 'registeredMembers', label: 'عدد أعضاء المهن الطبية المسجلين خلال الشهر', type: 'number' },
        { name: 'updatedMembers', label: 'عدد أعضاء المهن الطبية المحدث بياناتهم', type: 'number' },
        { name: 'facilitiesRegistered', label: 'عدد المنشآت التي تم تسجيل أعضاء المهن الطبية بها', type: 'number' },
        { name: 'facilitiesUpdated', label: 'عدد المنشآت التي تم تحديث أعضاء المهن الطبية بها', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'ملخص التقرير الشهري', type: 'text' },
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
        { name: 'activitySummary', label: 'ملخص أنشطة الإدارة', type: 'text' },
        { name: 'activityDetails', label: 'تفاصيل أنشطة الإدارة', type: 'text' },
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
        { name: 'visitsToUniFacilities', label: 'عدد الزيارات للمنشآت الجامعية', type: 'number' },
        { name: 'accreditationCommittees', label: 'عدد لجان الاعتماد المنعقدة', type: 'number' },
        { name: 'reportsToCommittee', label: 'عدد تقارير الزيارات التقييمية المعروضة على اللجنة', type: 'number' },
        { name: 'appealsSubmitted', label: 'عدد الالتماسات المقدمة', type: 'number' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'additionalActivities', label: 'أنشطة إضافية', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
    'dept10': [
        { name: 'date', label: 'الشهر والسنة', type: 'month' },
        { name: 'firstTimeProjects', label: 'عدد المشروعات مراجعة أول مرة', type: 'number' },
        { name: 'feedbackReviewProjects', label: 'عدد المستشفيات الجاري مراجعتها بعد ورود تقارير الرد على الملاحظات', type: 'number' },
        { name: 'technicalSupportRequested', label: 'عدد المشروعات التي طلبت دعماً فنياً', type: 'number' },
        { name: 'technicalSupportProvided', label: 'عدد المشروعات التي حصلت على دعم فني', type: 'number' },
        { name: 'medicalEquipmentReview', label: 'عدد المشروعات طلبت مراجعة التجهيزات الطبية', type: 'number' },
        { name: 'activitySummary', label: 'ملخص أنشطة الإدارة', type: 'text' },
        { name: 'activityDetails', label: 'تفاصيل أنشطة الإدارة', type: 'text' },
        { name: 'obstacles', label: 'المعوقات', type: 'text' },
        { name: 'developmentProposals', label: 'مقترحات التطوير', type: 'text' },
        { name: 'notes', label: 'ملاحظات', type: 'text' },
    ],
};

export const months = [
    { id: '01', name: 'يناير' },
    { id: '02', name: 'فبراير' },
    { id: '03', name: 'مارس' },
    { id: '04', name: 'أبريل' },
    { id: '05', name: 'مايو' },
    { id: '06', name: 'يونيو' },
    { id: '07', name: 'يوليو' },
    { id: '08', name: 'أغسطس' },
    { id: '09', name: 'سبتمبر' },
    { id: '10', name: 'أكتوبر' },
    { id: '11', name: 'نوفمبر' },
    { id: '12', name: 'ديسمبر' },
];

export const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
];

// Helper function to format date consistently on server and client
export const formatMonthYear = (date: Date): string => {
    const month = arabicMonths[date.getMonth()];
    const year = date.getFullYear();
    return `${month} ${year}`;
};

// Egypt Governorates
export const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'الوادي الجديد', 'الشرقية', 'السويس', 'أسوان', 'أسيوط', 'بني سويف',
    'بورسعيد', 'دمياط', 'الأقصر', 'مطروح', 'قنا', 'شمال سيناء', 'جنوب سيناء',
    'كفر الشيخ', 'سوهاج'
];

// Facility Types for Reviewer Evaluation Visits (dept9)
export const reviewerFacilityTypes = [
    'مستشفيات',
    'مستشفيات صحة نفسية',
    'صيدليات',
    'مراكز ووحدات الرعاية الأولية',
    'معامل',
    'مراكز أشعة',
    'مراكز طبية',
    'عيادات طبية',
    'مراكز علاج طبيعي',
    'مراكز جراحات اليوم الواحد',
    'دور النقاهة'
];

// Visit Types for Reviewer Evaluation Visits (dept9)
export const reviewerEvaluationVisitTypes = [
    'منشآت خضراء',
    'زيارة تقييمية بناء على التماس',
    'اعتماد بعد اعتماد مبدئي',
    'غير معلنة - اعتماد',
    'غير معلنة - اعتماد مبدئي',
    'غير معلنة - استكمال اعتماد مبدئي',
    'غير معلنة - استكمال اعتماد',
    'استكمال اعتماد مبدئي',
    'اعتماد مبدئي',
    'اعتماد مبدئي - فرصة ثانية',
    'تجديد اعتماد مبدئي',
    'اعتماد فرصة ثانية',
    'استكمال اعتماد',
    'تجديد اعتماد',
    'اعتماد',
    'استرشادية'
];

// Facility Types for Technical Support
export const techSupportFacilityTypes = [
    'مستشفيات',
    'مستشفيات الصحة النفسية',
    'عيادات خاصة',
    'معامل',
    'صيدليات',
    'مراكز جراحات اليوم الواحد',
    'مراكز علاج طبيعي',
    'مراكز أشعة',
    'مراكز ووحدات الرعاية الأولية'
];

// Date constraints
export const MIN_MONTH = '2019-01';
export const MIN_DATE = '2019-01-01';
