'use client';

export interface BranchDefinition {
    id: string;
    name: string;
    phase: number;
}

export interface BranchIndicatorDefinition {
    id: string;
    label: string;
    numeric: boolean;
    composite?: 'visitedAndApplied';
}

export const BRANCH_PHASES = [
    { id: 1, label: 'المرحلة الأولى' }
];

export const BRANCHES: BranchDefinition[] = [
    { id: 'port_said', name: 'بورسعيد', phase: 1 },
    { id: 'ismailia', name: 'الإسماعيلية', phase: 1 },
    { id: 'suez', name: 'السويس', phase: 1 },
    { id: 'south_sinai', name: 'جنوب سيناء', phase: 1 },
    { id: 'luxor', name: 'الأقصر', phase: 1 },
    { id: 'aswan', name: 'أسوان', phase: 1 }
];

export const BRANCH_INDICATORS: BranchIndicatorDefinition[] = [
    { id: 'healthControlVisits', label: 'زيارات الرقابة الصحية', numeric: true },
    { id: 'patientSatisfactionSurveys', label: 'استبيانات رضاء المرضى', numeric: true },
    { id: 'providerSatisfactionSurveys', label: 'استبيانات رضاء مقدمي الخدمة', numeric: true },
    { id: 'seriousEvents', label: 'بيانات الأحداث الجسيمة', numeric: true },
    { id: 'technicalSupportVisits', label: 'زيارات الدعم الفني', numeric: true },
    { id: 'marketingVisits', label: 'الزيارات التسويقية', numeric: true },
    {
        id: 'visitedAndAppliedFacilities',
        label: 'عدد المنشآت التي تم زيارتها وتقدمت للاعتماد',
        numeric: true,
        composite: 'visitedAndApplied'
    },
    { id: 'fieldOperationsCoordination', label: 'تنسيق العمليات الميدانية', numeric: true },
    { id: 'medicalProfessionalsRegistration', label: 'تسجيل أعضاء المهن الطبية', numeric: true },
    { id: 'externalTraining', label: 'نشاط التدريب للغير', numeric: true },
    { id: 'internalTraining', label: 'نشاط التدريب الداخلي', numeric: true },
    { id: 'communitySeminars', label: 'الندوات المجتمعية', numeric: true },
    { id: 'internalMeetings', label: 'الاجتماعات الداخلية', numeric: true },
    { id: 'externalMeetings', label: 'الاجتماعات الخارجية', numeric: true },
    { id: 'obstacles', label: 'المعوقات', numeric: false },
    { id: 'developmentProposals', label: 'مقترحات التطوير', numeric: false }
];

export const monthNames = [
    'يناير',
    'فبراير',
    'مارس',
    'أبريل',
    'مايو',
    'يونيو',
    'يوليو',
    'أغسطس',
    'سبتمبر',
    'أكتوبر',
    'نوفمبر',
    'ديسمبر'
];

export const formatMonthLabel = (month: string): string => {
    if (!month || !month.includes('-')) return 'غير محدد';
    const [year, monthNumber] = month.split('-');
    return `${monthNames[Number(monthNumber) - 1] || monthNumber} ${year}`;
};
