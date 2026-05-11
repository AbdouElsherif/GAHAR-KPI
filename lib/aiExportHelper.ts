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

export async function exportAllDataForAI(): Promise<ExportDataPayload> {
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

    return {
        exportedAt: new Date().toISOString(),
        systemName: "GAHAR Performance Indicators Portal (بوابة مؤشرات الأداء)",
        dataDescription: "This JSON file contains all KPI collections, support visits, correction rates, registration, training, surveys, and decisions data for all departments of GAHAR (General Authority for Healthcare Accreditation and Regulation). It is structured for easy parsing by LLMs (Claude, ChatGPT, Gemini) to generate custom reports, statistical analysis, and comparisons.",
        collections: {
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
        }
    };
}
