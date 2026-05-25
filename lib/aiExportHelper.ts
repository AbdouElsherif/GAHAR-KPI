import {
    getAccreditationFacilities,
    getCompletionFacilities,
    getPaymentFacilities,
    getCorrectivePlanFacilities,
    getBasicRequirementsFacilities,
    getAppealsFacilities,
    getPaidFacilities,
    getMedicalProfessionalRegistrations,
    getCommitteePreparationFacilities,
    getCertificateIssuanceFacilities,
    getTechnicalSupportVisits,
    getRemoteTechnicalSupports,
    getIntroductorySupportVisits,
    getQueuedSupportVisits,
    getScheduledSupportVisits,
    getAccreditedSupportedFacilities,
    getTechnicalClinicalFacilities,
    getAdminAuditFacilities,
    getAdminAuditObservations,
    getTechnicalClinicalObservations,
    getObservationCorrectionRates,
    getTechnicalClinicalCorrectionRates,
    getReviewerEvaluationVisits,
    getMedicalProfessionalsByCategory,
    getMedicalProfessionalsByGovernorate,
    getTrainingEntities,
    getProgramTypes,
    getTotalMedProfsByCategory,
    getTotalMedProfsByGovernorate,
    getGovernorateCustomerSurveys,
    getReportsPresentedToCommittee,
    getReportsByFacilitySpecialty,
    getAccreditationDecisions,
    getCollectedRevenues,
    getAllKPIData
} from './firestore';

export interface ExportDataPayload {
    exportedAt: string;
    systemName: string;
    dataDescription: string;
    exportScope: {
        filterString: string;
        description: string;
        filtered: boolean;
    };
    fiscalYearSettings?: {
        fiscalYearStartMonth: number;
        fiscalYearEndMonth: number;
        descriptionAr: string;
        descriptionEn: string;
    };
    collections: {
        accreditation_facilities: any[];
        completion_facilities: any[];
        payment_facilities: any[];
        corrective_plan_facilities: any[];
        basic_requirements_facilities: any[];
        appeals_facilities: any[];
        paid_facilities: any[];
        medical_professional_registrations: any[];
        committee_preparation_facilities: any[];
        certificate_issuance_facilities: any[];
        technical_support_visits: any[];
        remote_technical_supports: any[];
        introductory_support_visits: any[];
        queued_support_visits: any[];
        scheduled_support_visits: any[];
        accredited_supported_facilities: any[];
        technical_clinical_facilities: any[];
        admin_audit_facilities: any[];
        admin_audit_observations: any[];
        technical_clinical_observations: any[];
        observation_correction_rates: any[];
        technical_clinical_correction_rates: any[];
        reviewer_evaluation_visits: any[];
        medical_professionals_by_category: any[];
        medical_professionals_by_governorate: any[];
        training_entities: any[];
        program_types: any[];
        total_med_profs_by_category: any[];
        total_med_profs_by_governorate: any[];
        governorate_customer_surveys: any[];
        reports_presented_to_committee: any[];
        reports_by_facility_specialty: any[];
        accreditation_decisions: any[];
        collected_revenues: any[];
        general_kpis: any[];
    };
}

const getFilterDescription = (filterString: string): string => {
    if (!filterString || filterString === 'ALL') return 'All data';
    if (/^\d{4}-\d{2}$/.test(filterString)) return `Month ${filterString}`;
    if (filterString.startsWith('Q')) {
        const [quarter, year] = filterString.split('-');
        return `Quarter ${quarter.replace('Q', '')} of ${year}`;
    }
    if (filterString.startsWith('H')) {
        const [half, year] = filterString.split('-');
        return `Half ${half.replace('H', '')} of ${year}`;
    }
    if (filterString.startsWith('Y-')) return `Year ${filterString.split('-')[1]}`;
    return filterString;
};

const normalizeToMonth = (value: any, fallbackYear?: any): string | null => {
    if (!value) return null;

    if (value instanceof Date) {
        return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}`;
    }

    if (typeof value?.toDate === 'function') {
        return normalizeToMonth(value.toDate());
    }

    if (typeof value === 'number' && fallbackYear) {
        if (value >= 1 && value <= 12) {
            return `${fallbackYear}-${String(value).padStart(2, '0')}`;
        }
        return null;
    }

    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})/);
    if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}`;
    }

    const slashMatch = trimmed.match(/^(\d{4})\/(\d{1,2})/);
    if (slashMatch) {
        return `${slashMatch[1]}-${slashMatch[2].padStart(2, '0')}`;
    }

    if (fallbackYear && /^\d{1,2}$/.test(trimmed)) {
        const monthNumber = Number(trimmed);
        if (monthNumber >= 1 && monthNumber <= 12) {
            return `${fallbackYear}-${String(monthNumber).padStart(2, '0')}`;
        }
    }

    return null;
};

const getRecordMonth = (record: any): string | null => {
    const candidates = [
        record?.data?.date,
        record?.date,
        record?.month,
        record?.visitDate,
        record?.decisionDate
    ];

    for (const candidate of candidates) {
        const normalized = normalizeToMonth(candidate, record?.year);
        if (normalized) return normalized;
    }

    return null;
};

const matchesFilter = (recordMonth: string | null, filterString: string): boolean => {
    if (!filterString || filterString === 'ALL') return true;
    if (!recordMonth) return false;

    if (/^\d{4}-\d{2}$/.test(filterString)) {
        return recordMonth === filterString;
    }

    if (filterString.startsWith('Y-')) {
        return recordMonth.startsWith(`${filterString.split('-')[1]}-`);
    }

    if (filterString.startsWith('Q')) {
        const [quarterPart, year] = filterString.split('-');
        const month = Number(recordMonth.split('-')[1]);
        if (!recordMonth.startsWith(`${year}-`)) return false;
        if (quarterPart === 'Q1') return month >= 1 && month <= 3;
        if (quarterPart === 'Q2') return month >= 4 && month <= 6;
        if (quarterPart === 'Q3') return month >= 7 && month <= 9;
        if (quarterPart === 'Q4') return month >= 10 && month <= 12;
    }

    if (filterString.startsWith('H')) {
        const [halfPart, year] = filterString.split('-');
        const month = Number(recordMonth.split('-')[1]);
        if (!recordMonth.startsWith(`${year}-`)) return false;
        if (halfPart === 'H1') return month >= 1 && month <= 6;
        if (halfPart === 'H2') return month >= 7 && month <= 12;
    }

    return true;
};

const filterRecordsByPeriod = <T,>(records: T[], filterString: string): T[] => {
    if (!filterString || filterString === 'ALL') return records;
    return records.filter(record => matchesFilter(getRecordMonth(record), filterString));
};

export async function exportAllDataForAI(filterString: string = 'ALL'): Promise<ExportDataPayload> {
    const [
        accreditationFacilities,
        completionFacilities,
        paymentFacilities,
        correctivePlanFacilities,
        basicRequirementsFacilities,
        appealsFacilities,
        paidFacilities,
        medicalProfRegistrations,
        committeePreparationFacilities,
        certificateIssuanceFacilities,
        technicalSupportVisits,
        remoteTechnicalSupports,
        introductorySupportVisits,
        queuedSupportVisits,
        scheduledSupportVisits,
        accreditedSupportedFacilities,
        technicalClinicalFacilities,
        adminAuditFacilities,
        adminAuditObservations,
        technicalClinicalObservations,
        observationCorrectionRates,
        technicalClinicalCorrectionRates,
        reviewerEvaluationVisits,
        medProfessionalsByCategory,
        medProfessionalsByGovernorate,
        trainingEntities,
        programTypes,
        totalMedProfsByCategory,
        totalMedProfsByGovernorate,
        govCustomerSurveys,
        reportsCommittee,
        reportsSpecialty,
        accreditationDecisions,
        collectedRevenues,
        generalKPIs
    ] = await Promise.all([
        getAccreditationFacilities(),
        getCompletionFacilities(),
        getPaymentFacilities(),
        getCorrectivePlanFacilities(),
        getBasicRequirementsFacilities('all'), // passes a dummy dept id to retrieve all
        getAppealsFacilities('all'),
        getPaidFacilities(),
        getMedicalProfessionalRegistrations(),
        getCommitteePreparationFacilities(),
        getCertificateIssuanceFacilities(),
        getTechnicalSupportVisits(),
        getRemoteTechnicalSupports(),
        getIntroductorySupportVisits(),
        getQueuedSupportVisits(),
        getScheduledSupportVisits(),
        getAccreditedSupportedFacilities(),
        getTechnicalClinicalFacilities(),
        getAdminAuditFacilities(),
        getAdminAuditObservations(),
        getTechnicalClinicalObservations(),
        getObservationCorrectionRates(),
        getTechnicalClinicalCorrectionRates(),
        getReviewerEvaluationVisits(),
        getMedicalProfessionalsByCategory(),
        getMedicalProfessionalsByGovernorate(),
        getTrainingEntities(),
        getProgramTypes(),
        getTotalMedProfsByCategory(),
        getTotalMedProfsByGovernorate(),
        getGovernorateCustomerSurveys(),
        getReportsPresentedToCommittee(),
        getReportsByFacilitySpecialty(),
        getAccreditationDecisions(),
        getCollectedRevenues(),
        getAllKPIData()
    ]);

    const collections: ExportDataPayload['collections'] = {
        accreditation_facilities: accreditationFacilities,
        completion_facilities: completionFacilities,
        payment_facilities: paymentFacilities,
        corrective_plan_facilities: correctivePlanFacilities,
        basic_requirements_facilities: basicRequirementsFacilities,
        appeals_facilities: appealsFacilities,
        paid_facilities: paidFacilities,
        medical_professional_registrations: medicalProfRegistrations,
        committee_preparation_facilities: committeePreparationFacilities,
        certificate_issuance_facilities: certificateIssuanceFacilities,
        technical_support_visits: technicalSupportVisits,
        remote_technical_supports: remoteTechnicalSupports,
        introductory_support_visits: introductorySupportVisits,
        queued_support_visits: queuedSupportVisits,
        scheduled_support_visits: scheduledSupportVisits,
        accredited_supported_facilities: accreditedSupportedFacilities,
        technical_clinical_facilities: technicalClinicalFacilities,
        admin_audit_facilities: adminAuditFacilities,
        admin_audit_observations: adminAuditObservations,
        technical_clinical_observations: technicalClinicalObservations,
        observation_correction_rates: observationCorrectionRates,
        technical_clinical_correction_rates: technicalClinicalCorrectionRates,
        reviewer_evaluation_visits: reviewerEvaluationVisits,
        medical_professionals_by_category: medProfessionalsByCategory,
        medical_professionals_by_governorate: medProfessionalsByGovernorate,
        training_entities: trainingEntities,
        program_types: programTypes,
        total_med_profs_by_category: totalMedProfsByCategory,
        total_med_profs_by_governorate: totalMedProfsByGovernorate,
        governorate_customer_surveys: govCustomerSurveys,
        reports_presented_to_committee: reportsCommittee,
        reports_by_facility_specialty: reportsSpecialty,
        accreditation_decisions: accreditationDecisions,
        collected_revenues: collectedRevenues,
        general_kpis: generalKPIs
    };

    const filteredCollections = Object.fromEntries(
        Object.entries(collections).map(([collectionName, records]) => [
            collectionName,
            filterRecordsByPeriod(records, filterString)
        ])
    ) as ExportDataPayload['collections'];

    return {
        exportedAt: new Date().toISOString(),
        systemName: "GAHAR Performance Indicators Portal (بوابة مؤشرات الأداء)",
        dataDescription: "This JSON file contains all KPI collections, support visits, correction rates, registration, training, surveys, and decisions data for all departments of GAHAR (General Authority for Healthcare Accreditation and Regulation). It is structured for easy parsing by LLMs (Claude, ChatGPT, Gemini) to generate custom reports, statistical analysis, and comparisons.",
        exportScope: {
            filterString,
            description: getFilterDescription(filterString),
            filtered: filterString !== 'ALL'
        },
        fiscalYearSettings: {
            fiscalYearStartMonth: 7, // July
            fiscalYearEndMonth: 6, // June
            descriptionAr: "العام المالي في الهيئة العامة للاعتماد والرقابة الصحية (GAHAR) وفي الحكومة المصرية يبدأ في 1 يوليو وينتهي في 30 يونيو من العام التالي. على سبيل المثال، العام المالي 2025 - 2026 يبدأ في 1 يوليو 2025 وينتهي في 30 يونيو 2026. أي بيانات أو فلاتر أو مقارنات سنوية يجب أن تتبع هذا التقسيم الزمني للعام المالي.",
            descriptionEn: "The Fiscal Year for GAHAR (and the Egyptian government) starts on July 1st and ends on June 30th of the following year. For example, Fiscal Year 2025-2026 starts on July 1st, 2025 and ends on June 30th, 2026. Any financial or performance annual comparisons or queries should strictly group data according to this fiscal cycle."
        },
        collections: filteredCollections
    };
}
