import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, Timestamp, addDoc, deleteDoc, updateDoc, limit } from 'firebase/firestore';
import { db } from './firebase';

export interface KPIData {
    id?: string;
    departmentId: string;
    departmentName: string;
    month: string;
    year: number;
    data: Record<string, any>;
    createdAt: Date;
    createdBy: string;
    updatedAt: Date;
    updatedBy: string;
}

export interface MOHQuarterData {
    target: number | string;
    achieved: number | string;
}

export interface MOHKPI {
    id?: string;
    name: string;
    unit: string;
    department?: string;
    annualTarget?: string;
    fiscalYear: string;
    q1: MOHQuarterData;
    q2: MOHQuarterData;
    q3: MOHQuarterData;
    q4: MOHQuarterData;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface AccreditationFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    affiliation: string;
    accreditationStatus: string;
    standards: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface CompletionFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface PaymentFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface CorrectivePlanFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface BasicRequirementsFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface TechnicalSupportVisit {
    id?: string;
    facilityName: string;
    governorate: string;
    visitType: string;
    affiliatedEntity: string;
    facilityType: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface RemoteTechnicalSupport {
    id?: string;
    facilityName: string;
    governorate: string;
    visitType: string;
    affiliatedEntity: string;
    facilityType: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface IntroductorySupportVisit {
    id?: string;
    facilityName: string;
    governorate: string;
    visitType: string;
    affiliatedEntity: string;
    facilityType: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface QueuedSupportVisit {
    id?: string;
    facilityName: string;
    governorate: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Scheduled Support Visits (Ø²ÙŠØ§Ø±Ø§Øª Ø§Ù„Ø¯Ø¹Ù… Ø§Ù„ÙÙ†ÙŠ Ø§Ù„Ù…Ø¬Ø¯ÙˆÙ„Ø© ÙÙŠ Ø´Ù‡Ø± ....)
export interface ScheduledSupportVisit {
    id?: string;
    facilityName: string;
    governorate: string;
    visitType: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Accredited Supported Facilities (Ø§Ù„Ù…Ù†Ø´Ø¢Øª Ø§Ù„Ù…Ø¹ØªÙ…Ø¯Ø© Ù…Ù† Ø§Ù„Ù…Ù†Ø´Ø¢Øª Ø§Ù„ØªÙŠ ØªÙ„Ù‚Øª Ø²ÙŠØ§Ø±Ø§Øª Ø¯Ø¹Ù…)
export interface AccreditedSupportedFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    decisionNumber: string;
    decisionDate: string;
    supportType: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface AppealsFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}


export interface PaidFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    amount: number;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface MedicalProfessionalRegistration {
    id?: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Committee Preparation Facilities (Ø§Ù„ØªØ¬Ù‡ÙŠØ² Ù„Ù„Ø¹Ø±Ø¶ Ø¹Ù„Ù‰ Ø§Ù„Ù„Ø¬Ù†Ø©)
export interface CommitteePreparationFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Certificate Issuance Facilities (Ø¥ØµØ¯Ø§Ø± Ø§Ù„Ø´Ù‡Ø§Ø¯Ø§Øª)
export interface CertificateIssuanceFacility {
    id?: string;
    facilityName: string;
    governorate: string;
    accreditationStatus: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface TechnicalClinicalFacility {
    id?: string;
    facilityType: string;
    facilityName: string;
    governingAuthority: string;
    visitType: string;
    assessmentType?: string;  // Ù†ÙˆØ¹ Ø§Ù„ØªÙ‚ÙŠÙŠÙ… - Ø­Ù‚Ù„ Ù†ØµÙŠ Ø­Ø±
    governorate: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface AdminAuditFacility {
    id?: string;
    facilityType: string;
    facilityName: string;
    affiliation: string; // التبعية
    visitType: string;
    governorate: string;
    month: string;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface AdminAuditObservation {
    id?: string;
    entityType: string;  // Ø§Ù„Ø¬Ù‡Ø© Ø§Ù„ØªØ§Ø¨Ø¹Ø©: Ù‡ÙŠØ¦Ø© Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ© / ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØµØ­Ø©
    facilityType: string;  // Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø©: Ù…Ø±Ø§ÙƒØ² Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø£ÙˆÙ„ÙŠØ© / ÙˆØ­Ø¯Ø§Øª Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø£ÙˆÙ„ÙŠØ©
    observation: string;  // Ù†Øµ Ø¯Ù„ÙŠÙ„ Ø§Ù„ØªØ·Ø§Ø¨Ù‚/Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø©
    percentage?: number;  // Ù†Ø³Ø¨Ø© Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Technical Clinical Observations (Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„Ù…ØªÙƒØ±Ø±Ø© Ù„Ù„Ø±Ù‚Ø§Ø¨Ø© Ø§Ù„ÙÙ†ÙŠØ© ÙˆØ§Ù„Ø¥ÙƒÙ„ÙŠÙ†ÙŠÙƒÙŠØ©)
export interface TechnicalClinicalObservation {
    id?: string;
    entityType: string;  // Ø§Ù„Ø¬Ù‡Ø© Ø§Ù„ØªØ§Ø¨Ø¹Ø©: Ù‡ÙŠØ¦Ø© Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„ØµØ­ÙŠØ© / ÙˆØ²Ø§Ø±Ø© Ø§Ù„ØµØ­Ø©
    facilityType: string;  // Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø©: Ù…Ø±Ø§ÙƒØ² Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø£ÙˆÙ„ÙŠØ© / ÙˆØ­Ø¯Ø§Øª Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø£ÙˆÙ„ÙŠØ©
    observation: string;  // Ù†Øµ Ø¯Ù„ÙŠÙ„ Ø§Ù„ØªØ·Ø§Ø¨Ù‚/Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø©
    percentage: number;  // Ù†Ø³Ø¨Ø© Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface ObservationCorrectionRate {
    id?: string;
    entityType: string;  // Ø§Ù„Ø¬Ù‡Ø©: Ø§Ù„Ù…Ù†Ø´Ø¢Øª Ø§Ù„ØµØ­ÙŠØ© Ø§Ù„ØªØ§Ø¨Ø¹Ø© Ù„Ù‡ÙŠØ¦Ø© Ø§Ù„Ø±Ø¹Ø§ÙŠØ© / Ù…Ù†Ø´Ø¢Øª ØµØ­ÙŠØ© Ø£Ø®Ø±Ù‰
    facilityCategory: string;  // Ø§Ù„ÙØ¦Ø©: Ù…Ø³ØªØ´ÙÙŠØ§Øª / Ù…Ø±Ø§ÙƒØ² ÙˆÙˆØ­Ø¯Ø§Øª Ø§Ù„Ø±Ø¹Ø§ÙŠØ© Ø§Ù„Ø£ÙˆÙ„ÙŠØ© / Ø§Ù„Ù…Ø±Ø§ÙƒØ² Ø§Ù„Ø·Ø¨ÙŠØ©...
    facilityName: string;  // Ø§Ø³Ù… Ø§Ù„Ù…Ù†Ø´Ø£Ø©
    governorate: string;  // Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©
    visitDate: string;  // ØªØ§Ø±ÙŠØ® Ø§Ù„Ø²ÙŠØ§Ø±Ø©
    visitType: string;  // Ù†ÙˆØ¹ Ø§Ù„Ø²ÙŠØ§Ø±Ø©
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM Ù„Ù„ÙÙ„ØªØ±Ø©
    year: number;
    // Ø¨ÙŠØ§Ù†Ø§Øª ÙƒÙ„ Ù…Ø¹ÙŠØ§Ø± - Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ù„Ø§Ø­Ø¸Ø§Øª Ø§Ù„ÙˆØ§Ø±Ø¯Ø©
    pccTotal: number;
    efsTotal: number;
    ogmTotal: number;
    imtTotal: number;
    wfmTotal: number;
    caiTotal: number;
    qpiTotal: number;
    mrsTotal: number;
    scmTotal: number;
    emsTotal: number;
    // بيانات كل معيار - عدد الملاحظات المصححة
    pccCorrected: number;
    efsCorrected: number;
    ogmCorrected: number;
    imtCorrected: number;
    wfmCorrected: number;
    caiCorrected: number;
    qpiCorrected: number;
    mrsCorrected: number;
    scmCorrected: number;
    emsCorrected: number;
    pcsTotal: number;
    pcsCorrected: number;
    cpsTotal: number;
    cpsCorrected: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Reviewer Evaluation Visits (Ø§Ù„Ø²ÙŠØ§Ø±Ø§Øª Ø§Ù„ØªÙ‚ÙŠÙŠÙ…ÙŠØ© ÙˆÙÙ‚Ø§ Ù„Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø© Ù„Ù„Ù…Ø±Ø§Ø¬Ø¹ÙŠÙ†)
export interface ReviewerEvaluationVisit {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    facilityType: string;  // Ù†ÙˆØ¹ Ø§Ù„Ù…Ù†Ø´Ø£Ø©
    facilityName: string;  // Ø§Ø³Ù… Ø§Ù„Ù…Ù†Ø´Ø£Ø©
    governorate: string;  // Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©
    visitType: string;  // Ù†ÙˆØ¹ Ø§Ù„Ø²ÙŠØ§Ø±Ø©
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}



// Reviewer Evaluation Visits By Visit Type (Ø§Ù„Ø²ÙŠØ§Ø±Ø§Øª Ø§Ù„ØªÙ‚ÙŠÙŠÙ…ÙŠØ© ÙˆÙÙ‚Ø§ Ù„Ù†ÙˆØ¹ Ø§Ù„Ø²ÙŠØ§Ø±Ø©)


// Medical Professionals By Category (Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù† Ø§Ù„Ø·Ø¨ÙŠØ© Ø­Ø³Ø¨ Ø§Ù„ÙØ¦Ø©)
export interface MedicalProfessionalByCategory {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    branch: string;  // Ø§Ù„ÙØ±Ø¹ (Ø±Ø¦Ø§Ø³Ø© Ø§Ù„Ù‡ÙŠØ¦Ø©ØŒ Ø¨ÙˆØ±Ø³Ø¹ÙŠØ¯ØŒ Ø§Ù„Ø£Ù‚ØµØ±ØŒ Ø§Ù„Ø¥Ø³Ù…Ø§Ø¹ÙŠÙ„ÙŠØ©ØŒ Ø§Ù„Ø³ÙˆÙŠØ³ØŒ Ø£Ø³ÙˆØ§Ù†ØŒ Ø¬Ù†ÙˆØ¨ Ø³ÙŠÙ†Ø§Ø¡)
    doctors: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø¨Ø´Ø±ÙŠÙŠÙ†
    dentists: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø£Ø³Ù†Ø§Ù†
    pharmacists: number;  // ØµÙŠØ§Ø¯Ù„Ø©
    physiotherapy: number;  // Ø¹Ù„Ø§Ø¬ Ø·Ø¨ÙŠØ¹ÙŠ
    veterinarians: number;  // Ø¨ÙŠØ·Ø±ÙŠÙŠÙ†
    seniorNursing: number;  // ØªÙ…Ø±ÙŠØ¶ Ø¹Ø§Ù„ÙŠ
    technicalNursing: number;  // ÙÙ†ÙŠ ØªÙ…Ø±ÙŠØ¶
    healthTechnician: number;  // ÙÙ†ÙŠ ØµØ­ÙŠ
    scientists: number;  // Ø¹Ù„Ù…ÙŠÙŠÙ†
    total: number;  // Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ (Ù…Ø­Ø³ÙˆØ¨)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface MedicalProfessionalByGovernorate {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    governorate: string;  // Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©
    doctors: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø¨Ø´Ø±ÙŠÙŠÙ†
    dentists: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø£Ø³Ù†Ø§Ù†
    pharmacists: number;  // ØµÙŠØ§Ø¯Ù„Ø©
    physiotherapy: number;  // Ø¹Ù„Ø§Ø¬ Ø·Ø¨ÙŠØ¹ÙŠ
    veterinarians: number;  // Ø¨ÙŠØ·Ø±ÙŠÙŠÙ†
    seniorNursing: number;  // ØªÙ…Ø±ÙŠØ¶ Ø¹Ø§Ù„ÙŠ
    technicalNursing: number;  // ÙÙ†ÙŠ ØªÙ…Ø±ÙŠØ¶
    healthTechnician: number;  // ÙÙ†ÙŠ ØµØ­ÙŠ
    scientists: number;  // Ø¹Ù„Ù…ÙŠÙŠÙ†
    total: number;  // Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ (Ù…Ø­Ø³ÙˆØ¨)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Training Entity (Ø§Ù„Ø¬Ù‡Ø§Øª Ø§Ù„Ø­Ø§ØµÙ„Ø© Ø¹Ù„Ù‰ Ø§Ù„ØªØ¯Ø±ÙŠØ¨ for dept1)
export interface TrainingEntity {
    id?: string;
    entityName: string;  // Ø§Ù„Ø¬Ù‡Ø© Ø§Ù„Ø­Ø§ØµÙ„Ø© Ø¹Ù„Ù‰ Ø§Ù„ØªØ¯Ø±ÙŠØ¨
    traineesCount: number;  // Ø¹Ø¯Ø¯ Ø§Ù„Ù…ØªØ¯Ø±Ø¨ÙŠÙ†
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Program Type (Ù†ÙˆØ¹ Ø§Ù„Ø¨Ø±Ù†Ø§Ù…Ø¬ for dept1)
export interface ProgramType {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    trainingPrograms?: number;  // Ø¨Ø±Ø§Ù…Ø¬ ØªØ¯Ø±ÙŠØ¨
    awarenessPrograms?: number;  // Ø¨Ø±Ø§Ù…Ø¬ ØªÙˆØ¹ÙŠØ©
    workshops?: number; // ورش عمل
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Collected Revenue (الإيرادات المحصلة for dept1)
export interface CollectedRevenue {
    id?: string;
    departmentId: string;
    month: string; // YYYY-MM
    source: string; // مصدر الإيراد
    value: number; // القيمة المالية
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Training Program By Governorate (البرامج التدريبية بالمحافظات for dept1)
export interface TrainingProgramByGovernorate {
    id?: string;
    departmentId: string;
    month: string; // YYYY-MM
    governorate: string; // المحافظة
    phase: string; // المرحلة (مرحلة أولى، مرحلة ثانية، ...)
    programsCount: number; // عدد البرامج التدريبية
    traineesCount: number; // عدد المتدربين
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Training Methodology (منهجية التدريب for dept1)
export interface TrainingNature {
    id?: string;
    month: string; // YYYY-MM
    physicalPrograms: number; // حضوري
    onlinePrograms: number; // عن بعد
    hybridPrograms: number; // مدمج
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Governorate Customer Survey (Ø§Ø³ØªØ¨ÙŠØ§Ù†Ø§Øª Ø±Ø¶Ø§Ø¡ Ø§Ù„Ù…ØªØ¹Ø§Ù…Ù„ÙŠÙ† Ø­Ø³Ø¨ Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø© for dept3)
export interface GovernorateCustomerSurvey {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    governorate: string;  // Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©
    visitImplementationRate: number;  // Ù†Ø³Ø¨Ø© ØªÙ†ÙÙŠØ° Ø§Ù„Ø²ÙŠØ§Ø±Ø§Øª (0-100)
    facilitiesCount: number;  // Ø¹Ø¯Ø¯ Ø§Ù„Ù…Ù†Ø´Ø¢Øª
    visitedFacilitiesList: string;  // Ø£Ø³Ù…Ø§Ø¡ Ø§Ù„Ù…Ù†Ø´Ø¢Øª (Ù†Øµ Ø·ÙˆÙŠÙ„ - ÙƒÙ„ Ù…Ù†Ø´Ø£Ø© ÙÙŠ Ø³Ø·Ø±)
    patientSurveysCount: number;  // Ø¹Ø¯Ø¯ Ø§Ø³ØªØ¨ÙŠØ§Ù†Ø§Øª Ù‚ÙŠØ§Ø³ ØªØ¬Ø±Ø¨Ø© Ø§Ù„Ù…Ø±ÙŠØ¶
    staffSurveysCount: number;  // Ø¹Ø¯Ø¯ Ø§Ø³ØªØ¨ÙŠØ§Ù†Ø§Øª Ù…Ù‚Ø¯Ù…ÙŠ Ø§Ù„Ø®Ø¯Ù…Ø© ÙˆØ§Ù„Ø¹Ø§Ù…Ù„ÙŠÙ†
    patientSatisfactionRate: number;  // Ù†Ø³Ø¨Ø© Ù‚ÙŠØ§Ø³ Ø±Ø¶Ø§Ø¡ Ø§Ù„Ù…Ø±ÙŠØ¶ (0-100ØŒ Ù…Ø¹ ÙƒØ³ÙˆØ±)
    staffSatisfactionRate: number;  // Ù†Ø³Ø¨Ø© Ù‚ÙŠØ§Ø³ Ø±Ø¶Ø§Ø¡ Ø§Ù„Ø¹Ø§Ù…Ù„ÙŠÙ† (0-100ØŒ Ù…Ø¹ ÙƒØ³ÙˆØ±)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Total Medical Professionals By Category (Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙƒÙ„ÙŠ Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù† Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ù…Ø³Ø¬Ù„ÙŠÙ† Ø·Ø¨Ù‚Ø§ Ù„Ù„ÙØ¦Ø©)
export interface TotalMedicalProfessionalByCategory {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    branch: string;  // Ø§Ù„ÙØ±Ø¹ (Ø±Ø¦Ø§Ø³Ø© Ø§Ù„Ù‡ÙŠØ¦Ø©ØŒ Ø¨ÙˆØ±Ø³Ø¹ÙŠØ¯ØŒ Ø§Ù„Ø£Ù‚ØµØ±ØŒ Ø§Ù„Ø¥Ø³Ù…Ø§Ø¹ÙŠÙ„ÙŠØ©ØŒ Ø§Ù„Ø³ÙˆÙŠØ³ØŒ Ø£Ø³ÙˆØ§Ù†ØŒ Ø¬Ù†ÙˆØ¨ Ø³ÙŠÙ†Ø§Ø¡)
    doctors: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø¨Ø´Ø±ÙŠÙŠÙ†
    dentists: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø£Ø³Ù†Ø§Ù†
    pharmacists: number;  // ØµÙŠØ§Ø¯Ù„Ø©
    physiotherapy: number;  // Ø¹Ù„Ø§Ø¬ Ø·Ø¨ÙŠØ¹ÙŠ
    veterinarians: number;  // Ø¨ÙŠØ·Ø±ÙŠÙŠÙ†
    seniorNursing: number;  // ØªÙ…Ø±ÙŠØ¶ Ø¹Ø§Ù„ÙŠ
    technicalNursing: number;  // ÙÙ†ÙŠ ØªÙ…Ø±ÙŠØ¶
    healthTechnician: number;  // ÙÙ†ÙŠ ØµØ­ÙŠ
    scientists: number;  // Ø¹Ù„Ù…ÙŠÙŠÙ†
    total: number;  // Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ (Ù…Ø­Ø³ÙˆØ¨)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Total Medical Professionals By Governorate (Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ Ø§Ù„ÙƒÙ„ÙŠ Ù„Ø£Ø¹Ø¶Ø§Ø¡ Ø§Ù„Ù…Ù‡Ù† Ø§Ù„Ø·Ø¨ÙŠØ© Ø§Ù„Ù…Ø³Ø¬Ù„ÙŠÙ† Ø¨Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø§Øª)
export interface TotalMedicalProfessionalByGovernorate {
    id?: string;
    month: string;  // Ø§Ù„Ø´Ù‡Ø± YYYY-MM
    governorate: string;  // Ø§Ù„Ù…Ø­Ø§ÙØ¸Ø©
    doctors: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø¨Ø´Ø±ÙŠÙŠÙ†
    dentists: number;  // Ø£Ø·Ø¨Ø§Ø¡ Ø£Ø³Ù†Ø§Ù†
    pharmacists: number;  // ØµÙŠØ§Ø¯Ù„Ø©
    physiotherapy: number;  // Ø¹Ù„Ø§Ø¬ Ø·Ø¨ÙŠØ¹ÙŠ
    veterinarians: number;  // Ø¨ÙŠØ·Ø±ÙŠÙŠÙ†
    seniorNursing: number;  // ØªÙ…Ø±ÙŠØ¶ Ø¹Ø§Ù„ÙŠ
    technicalNursing: number;  // ÙÙ†ÙŠ ØªÙ…Ø±ÙŠØ¶
    healthTechnician: number;  // ÙÙ†ÙŠ ØµØ­ÙŠ
    scientists: number;  // Ø¹Ù„Ù…ÙŠÙŠÙ†
    total: number;  // Ø§Ù„Ø¥Ø¬Ù…Ø§Ù„ÙŠ (Ù…Ø­Ø³ÙˆØ¨)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Technical Clinical Correction Rate
export interface TechnicalClinicalCorrectionRate {
    id?: string;
    entityType: string;
    facilityCategory: string;
    facilityName: string;
    governorate: string;
    visitDate: string;
    visitType: string;
    month: string;
    year: number;
    actTotal: number;
    icdTotal: number;
    dasTotal: number;
    mmsTotal: number;
    sipTotal: number;
    ipcTotal: number;
    scmTotal: number;
    texTotal: number;
    teqTotal: number;
    tpoTotal: number;
    nsrTotal: number;
    sasTotal: number;
    actCorrected: number;
    icdCorrected: number;
    dasCorrected: number;
    mmsCorrected: number;
    sipCorrected: number;
    ipcCorrected: number;
    scmCorrected: number;
    texCorrected: number;
    teqCorrected: number;
    tpoCorrected: number;
    nsrCorrected: number;
    sasCorrected: number;
    irsTotal: number;
    mrsTotal: number;
    cpsTotal: number;
    lprTotal: number;
    lepTotal: number;
    lpoTotal: number;
    lqcTotal: number;
    irsCorrected: number;
    mrsCorrected: number;
    cpsCorrected: number;
    lprCorrected: number;
    lepCorrected: number;
    lpoCorrected: number;
    lqcCorrected: number;
    cssTotal: number;
    cssCorrected: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}



// ============================================================
// CRUD Factory Function - generates save/getAll/update/delete
// for any Firestore collection with the standard pattern
// ============================================================
function createCRUD<T extends { id?: string; createdAt?: Date; updatedAt?: Date }>(collectionName: string) {
    return {
        async save(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<string | null> {
            try {
                const colRef = collection(db, collectionName);
                const docRef = await addDoc(colRef, {
                    ...data,
                    createdAt: Timestamp.now(),
                    updatedAt: Timestamp.now()
                });
                return docRef.id;
            } catch (error) {
                console.error(`Error saving to ${collectionName}:`, error);
                return null;
            }
        },

        async getAll(month?: string): Promise<T[]> {
            try {
                const colRef = collection(db, collectionName);
                let q;

                if (month) {
                    q = query(colRef, where('month', '==', month));
                } else {
                    q = query(colRef, orderBy('createdAt', 'desc'));
                }

                const snapshot = await getDocs(q);
                let items = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                    createdAt: doc.data().createdAt?.toDate(),
                    updatedAt: doc.data().updatedAt?.toDate()
                } as T));

                if (month) {
                    items.sort((a, b) => {
                        const aTime = (a.createdAt as any)?.getTime() || 0;
                        const bTime = (b.createdAt as any)?.getTime() || 0;
                        return bTime - aTime;
                    });
                }

                return items;
            } catch (error) {
                console.error(`Error getting from ${collectionName}:`, error);
                return [];
            }
        },

        async update(id: string, updates: Partial<T> & { updatedBy: string }): Promise<boolean> {
            try {
                const docRef = doc(db, collectionName, id);
                await setDoc(docRef, {
                    ...updates,
                    updatedAt: Timestamp.now()
                }, { merge: true });
                return true;
            } catch (error) {
                console.error(`Error updating in ${collectionName}:`, error);
                return false;
            }
        },

        async remove(id: string): Promise<boolean> {
            try {
                const docRef = doc(db, collectionName, id);
                await deleteDoc(docRef);
                return true;
            } catch (error) {
                console.error(`Error deleting from ${collectionName}:`, error);
                return false;
            }
        }
    };
}

// ============================================================
// CRUD Instances - one line per collection
// ============================================================
const accreditationCRUD = createCRUD<AccreditationFacility>('accreditation_facilities');
const completionCRUD = createCRUD<CompletionFacility>('completion_facilities');
const paymentCRUD = createCRUD<PaymentFacility>('payment_facilities');
const correctivePlanCRUD = createCRUD<CorrectivePlanFacility>('corrective_plan_facilities');
const basicRequirementsCRUD = createCRUD<BasicRequirementsFacility>('basic_requirements_facilities');
const appealsCRUD = createCRUD<AppealsFacility>('appeals_facilities');
const paidCRUD = createCRUD<PaidFacility>('paid_facilities');
const medicalProfRegCRUD = createCRUD<MedicalProfessionalRegistration>('medical_professional_registrations');
const committeePreparationCRUD = createCRUD<CommitteePreparationFacility>('committee_preparation_facilities');
const certificateIssuanceCRUD = createCRUD<CertificateIssuanceFacility>('certificate_issuance_facilities');
const technicalSupportCRUD = createCRUD<TechnicalSupportVisit>('technical_support_visits');
const remoteSupportCRUD = createCRUD<RemoteTechnicalSupport>('remote_technical_supports');
const introSupportCRUD = createCRUD<IntroductorySupportVisit>('introductory_support_visits');
const queuedSupportCRUD = createCRUD<QueuedSupportVisit>('queued_support_visits');
const scheduledSupportCRUD = createCRUD<ScheduledSupportVisit>('scheduled_support_visits');
const accreditedSupportedCRUD = createCRUD<AccreditedSupportedFacility>('accredited_supported_facilities');
const technicalClinicalCRUD = createCRUD<TechnicalClinicalFacility>('technical_clinical_facilities');
const adminAuditCRUD = createCRUD<AdminAuditFacility>('admin_audit_facilities');
const adminAuditObsCRUD = createCRUD<AdminAuditObservation>('admin_audit_observations');
const techClinicalObsCRUD = createCRUD<TechnicalClinicalObservation>('technical_clinical_observations');
const obsCorrectionCRUD = createCRUD<ObservationCorrectionRate>('observation_correction_rates');
const techClinicalCorrCRUD = createCRUD<TechnicalClinicalCorrectionRate>('technical_clinical_correction_rates');
const reviewerEvalCRUD = createCRUD<ReviewerEvaluationVisit>('reviewer_evaluation_visits');
const medProfCategoryCRUD = createCRUD<MedicalProfessionalByCategory>('medical_professionals_by_category');
const medProfGovernorateCRUD = createCRUD<MedicalProfessionalByGovernorate>('medical_professionals_by_governorate');
const trainingEntityCRUD = createCRUD<TrainingEntity>('training_entities');
const programTypeCRUD = createCRUD<ProgramType>('program_types');
const totalMedProfCategoryCRUD = createCRUD<TotalMedicalProfessionalByCategory>('total_med_profs_by_category');
const totalMedProfGovernorateCRUD = createCRUD<TotalMedicalProfessionalByGovernorate>('total_med_profs_by_governorate');
const govCustomerSurveyCRUD = createCRUD<GovernorateCustomerSurvey>('governorate_customer_surveys');

// ============================================================
// Backwards-compatible exports
// ============================================================

// Accreditation Facilities
export const saveAccreditationFacility = accreditationCRUD.save;
export const getAccreditationFacilities = accreditationCRUD.getAll;
export const updateAccreditationFacility = accreditationCRUD.update;
export const deleteAccreditationFacility = accreditationCRUD.remove;

// Completion Facilities
export const saveCompletionFacility = completionCRUD.save;
export const getCompletionFacilities = completionCRUD.getAll;
export const updateCompletionFacility = completionCRUD.update;
export const deleteCompletionFacility = completionCRUD.remove;

// Payment Facilities
export const savePaymentFacility = paymentCRUD.save;
export const getPaymentFacilities = paymentCRUD.getAll;
export const updatePaymentFacility = paymentCRUD.update;
export const deletePaymentFacility = paymentCRUD.remove;

// Corrective Plan Facilities
export const saveCorrectivePlanFacility = correctivePlanCRUD.save;
export const getCorrectivePlanFacilities = correctivePlanCRUD.getAll;
export const updateCorrectivePlanFacility = correctivePlanCRUD.update;
export const deleteCorrectivePlanFacility = correctivePlanCRUD.remove;

// Basic Requirements Facilities
export const saveBasicRequirementsFacility = basicRequirementsCRUD.save;
export const getBasicRequirementsFacilities = (_departmentId: string, month?: string) => basicRequirementsCRUD.getAll(month);
export const updateBasicRequirementsFacility = basicRequirementsCRUD.update;
export const deleteBasicRequirementsFacility = basicRequirementsCRUD.remove;

// Appeals Facilities
export const saveAppealsFacility = appealsCRUD.save;
export const getAppealsFacilities = (_departmentId: string, month?: string) => appealsCRUD.getAll(month);
export const updateAppealsFacility = appealsCRUD.update;
export const deleteAppealsFacility = appealsCRUD.remove;

// Paid Facilities
export const savePaidFacility = paidCRUD.save;
export const getPaidFacilities = paidCRUD.getAll;
export const updatePaidFacility = paidCRUD.update;
export const deletePaidFacility = paidCRUD.remove;

// Medical Professional Registration
export const saveMedicalProfessionalRegistration = medicalProfRegCRUD.save;
export const getMedicalProfessionalRegistrations = medicalProfRegCRUD.getAll;
export const updateMedicalProfessionalRegistration = medicalProfRegCRUD.update;
export const deleteMedicalProfessionalRegistration = medicalProfRegCRUD.remove;

// Committee Preparation Facilities
export const saveCommitteePreparationFacility = committeePreparationCRUD.save;
export const getCommitteePreparationFacilities = committeePreparationCRUD.getAll;
export const updateCommitteePreparationFacility = committeePreparationCRUD.update;
export const deleteCommitteePreparationFacility = committeePreparationCRUD.remove;

// Certificate Issuance Facilities
export const saveCertificateIssuanceFacility = certificateIssuanceCRUD.save;
export const getCertificateIssuanceFacilities = certificateIssuanceCRUD.getAll;
export const updateCertificateIssuanceFacility = certificateIssuanceCRUD.update;
export const deleteCertificateIssuanceFacility = certificateIssuanceCRUD.remove;

// Technical Support Visits
export const saveTechnicalSupportVisit = technicalSupportCRUD.save;
export const getTechnicalSupportVisits = technicalSupportCRUD.getAll;
export const updateTechnicalSupportVisit = technicalSupportCRUD.update;
export const deleteTechnicalSupportVisit = technicalSupportCRUD.remove;

// Remote Technical Support
export const saveRemoteTechnicalSupport = remoteSupportCRUD.save;
export const getRemoteTechnicalSupports = remoteSupportCRUD.getAll;
export const updateRemoteTechnicalSupport = remoteSupportCRUD.update;
export const deleteRemoteTechnicalSupport = remoteSupportCRUD.remove;

// Introductory Support Visits
export const saveIntroductorySupportVisit = introSupportCRUD.save;
export const getIntroductorySupportVisits = introSupportCRUD.getAll;
export const updateIntroductorySupportVisit = introSupportCRUD.update;
export const deleteIntroductorySupportVisit = introSupportCRUD.remove;

// Queued Support Visits
export const saveQueuedSupportVisit = queuedSupportCRUD.save;
export const getQueuedSupportVisits = queuedSupportCRUD.getAll;
export const updateQueuedSupportVisit = queuedSupportCRUD.update;
export const deleteQueuedSupportVisit = queuedSupportCRUD.remove;

// Scheduled Support Visits
export const saveScheduledSupportVisit = scheduledSupportCRUD.save;
export const getScheduledSupportVisits = scheduledSupportCRUD.getAll;
export const updateScheduledSupportVisit = scheduledSupportCRUD.update;
export const deleteScheduledSupportVisit = scheduledSupportCRUD.remove;

// Accredited Supported Facilities
export const saveAccreditedSupportedFacility = accreditedSupportedCRUD.save;
export const getAccreditedSupportedFacilities = accreditedSupportedCRUD.getAll;
export const updateAccreditedSupportedFacility = accreditedSupportedCRUD.update;
export const deleteAccreditedSupportedFacility = accreditedSupportedCRUD.remove;

// Technical Clinical Facilities
export const saveTechnicalClinicalFacility = technicalClinicalCRUD.save;
export const getTechnicalClinicalFacilities = technicalClinicalCRUD.getAll;
export const updateTechnicalClinicalFacility = technicalClinicalCRUD.update;
export const deleteTechnicalClinicalFacility = technicalClinicalCRUD.remove;

// Admin Audit Facilities
export const saveAdminAuditFacility = adminAuditCRUD.save;
export const getAdminAuditFacilities = adminAuditCRUD.getAll;
export const updateAdminAuditFacility = adminAuditCRUD.update;
export const deleteAdminAuditFacility = adminAuditCRUD.remove;

// Admin Audit Observations
export const saveAdminAuditObservation = adminAuditObsCRUD.save;
export const getAdminAuditObservations = adminAuditObsCRUD.getAll;
export const updateAdminAuditObservation = adminAuditObsCRUD.update;
export const deleteAdminAuditObservation = adminAuditObsCRUD.remove;

// Technical Clinical Observations
export const saveTechnicalClinicalObservation = techClinicalObsCRUD.save;
export const getTechnicalClinicalObservations = techClinicalObsCRUD.getAll;
export const updateTechnicalClinicalObservation = techClinicalObsCRUD.update;
export const deleteTechnicalClinicalObservation = techClinicalObsCRUD.remove;

// Observation Correction Rates
export const saveObservationCorrectionRate = obsCorrectionCRUD.save;
export const getObservationCorrectionRates = obsCorrectionCRUD.getAll;
export const updateObservationCorrectionRate = obsCorrectionCRUD.update;
export const deleteObservationCorrectionRate = obsCorrectionCRUD.remove;

// Technical Clinical Correction Rates
export const saveTechnicalClinicalCorrectionRate = techClinicalCorrCRUD.save;
export const getTechnicalClinicalCorrectionRates = techClinicalCorrCRUD.getAll;
export const updateTechnicalClinicalCorrectionRate = techClinicalCorrCRUD.update;
export const deleteTechnicalClinicalCorrectionRate = techClinicalCorrCRUD.remove;

// Reviewer Evaluation Visits
export const saveReviewerEvaluationVisit = reviewerEvalCRUD.save;
export const getReviewerEvaluationVisits = reviewerEvalCRUD.getAll;
export const updateReviewerEvaluationVisit = reviewerEvalCRUD.update;
export const deleteReviewerEvaluationVisit = reviewerEvalCRUD.remove;

// Medical Professionals By Category
export const saveMedicalProfessionalByCategory = (data: any) => medProfCategoryCRUD.save(data);
export const getMedicalProfessionalsByCategory = medProfCategoryCRUD.getAll;
export const updateMedicalProfessionalByCategory = (id: string, updates: any) => medProfCategoryCRUD.update(id, updates);
export const deleteMedicalProfessionalByCategory = medProfCategoryCRUD.remove;

// Medical Professionals By Governorate
export const saveMedicalProfessionalByGovernorate = (data: any) => medProfGovernorateCRUD.save(data);
export const getMedicalProfessionalsByGovernorate = medProfGovernorateCRUD.getAll;
export const updateMedicalProfessionalByGovernorate = (id: string, data: any) => medProfGovernorateCRUD.update(id, data);
export const deleteMedicalProfessionalByGovernorate = medProfGovernorateCRUD.remove;

// Training Entities
export const saveTrainingEntity = trainingEntityCRUD.save;
export const getTrainingEntities = trainingEntityCRUD.getAll;
export const updateTrainingEntity = trainingEntityCRUD.update;
export const deleteTrainingEntity = trainingEntityCRUD.remove;

// Program Types
export const saveProgramType = programTypeCRUD.save;
export const getProgramTypes = programTypeCRUD.getAll;
export const updateProgramType = programTypeCRUD.update;
export const deleteProgramType = programTypeCRUD.remove;

// Total Medical Professionals By Category
export const saveTotalMedProfByCategory = totalMedProfCategoryCRUD.save;
export const getTotalMedProfsByCategory = totalMedProfCategoryCRUD.getAll;
export const updateTotalMedProfByCategory = totalMedProfCategoryCRUD.update;
export const deleteTotalMedProfByCategory = totalMedProfCategoryCRUD.remove;

// Total Medical Professionals By Governorate
export const saveTotalMedProfByGovernorate = totalMedProfGovernorateCRUD.save;
export const getTotalMedProfsByGovernorate = totalMedProfGovernorateCRUD.getAll;
export const updateTotalMedProfByGovernorate = totalMedProfGovernorateCRUD.update;
export const deleteTotalMedProfByGovernorate = totalMedProfGovernorateCRUD.remove;

// Governorate Customer Surveys
export const saveGovernorateCustomerSurvey = govCustomerSurveyCRUD.save;
export const getGovernorateCustomerSurveys = govCustomerSurveyCRUD.getAll;
export const updateGovernorateCustomerSurvey = govCustomerSurveyCRUD.update;
export const deleteGovernorateCustomerSurvey = govCustomerSurveyCRUD.remove;

export async function saveKPIData(kpiData: Omit<KPIData, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
        const kpiRef = collection(db, 'kpis');
        const docRef = await addDoc(kpiRef, {
            ...kpiData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving KPI data:', error);
        return null;
    }
}

export async function getKPIData(departmentId: string, year?: number): Promise<KPIData[]> {
    try {
        const kpiRef = collection(db, 'kpis');
        let q = query(kpiRef, where('departmentId', '==', departmentId));

        if (year) {
            q = query(q, where('year', '==', year));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as KPIData));
    } catch (error) {
        console.error('Error getting KPI data:', error);
        return [];
    }
}

export async function getAllKPIData(): Promise<KPIData[]> {
    try {
        const kpiRef = collection(db, 'kpis');
        const q = query(kpiRef, orderBy('year', 'desc'), orderBy('month', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as KPIData));
    } catch (error) {
        console.error('Error getting all KPI data:', error);
        return [];
    }
}

export async function updateKPIData(id: string, updates: Partial<KPIData>): Promise<boolean> {
    try {
        const kpiRef = doc(db, 'kpis', id);
        await setDoc(kpiRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating KPI data:', error);
        return false;
    }
}

export async function deleteKPIData(id: string): Promise<boolean> {
    try {
        const kpiRef = doc(db, 'kpis', id);
        await deleteDoc(kpiRef);
        return true;
    } catch (error) {
        console.error('Error deleting KPI data:', error);
        return false;
    }
}

// MOH KPI Functions
export async function saveMOHKPI(kpiData: Omit<MOHKPI, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }): Promise<string | null> {
    try {
        const mohKPIRef = collection(db, 'moh_kpis');
        const docRef = await addDoc(mohKPIRef, {
            ...kpiData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving MOH KPI:', error);
        return null;
    }
}

export async function getMOHKPIs(fiscalYear?: string): Promise<MOHKPI[]> {
    try {
        const mohKPIRef = collection(db, 'moh_kpis');
        let q;

        if (fiscalYear) {
            q = query(mohKPIRef, where('fiscalYear', '==', fiscalYear));
        } else {
            q = query(mohKPIRef);
        }

        const snapshot = await getDocs(q);

        let kpis = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as MOHKPI));

        // Sort by name (client-side to avoid index issues for now)
        kpis.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        return kpis;
    } catch (error) {
        console.error('Error getting MOH KPIs:', error);
        return [];
    }
}

export async function updateMOHKPI(id: string, updates: Partial<MOHKPI> & { updatedBy: string }): Promise<{ success: boolean; error?: string }> {
    try {
        // Ensure no undefined values are passed to Firestore
        const safeUpdates = Object.entries(updates).reduce((acc, [key, value]) => {
            acc[key] = value === undefined ? null : value;
            return acc;
        }, {} as any);

        const mohKPIRef = doc(db, 'moh_kpis', id);
        await setDoc(mohKPIRef, {
            ...safeUpdates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return { success: true };
    } catch (error: any) {
        console.error('Error updating MOH KPI:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteMOHKPI(id: string): Promise<boolean> {
    try {
        const mohKPIRef = doc(db, 'moh_kpis', id);
        await deleteDoc(mohKPIRef);
        return true;
    } catch (error) {
        console.error('Error deleting MOH KPI:', error);
        return false;
    }
}

// Reports Presented to Committee (التقارير المعروضة على اللجنة وفقا لنوع القرار)
export interface ReportPresentedToCommittee {
    id?: string;
    month: string;  // الشهر YYYY-MM
    committeeDecisionType: string;  // نوع القرار (Dropdown)
    numberOfDecisions: number;  // عدد القرارات
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export async function saveReportPresentedToCommittee(
    reportData: Omit<ReportPresentedToCommittee, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const reportsRef = collection(db, 'reports_presented_to_committee');
        const docRef = await addDoc(reportsRef, {
            ...reportData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving report presented to committee:', error);
        return null;
    }
}

export async function getReportsPresentedToCommittee(month?: string): Promise<ReportPresentedToCommittee[]> {
    try {
        const reportsRef = collection(db, 'reports_presented_to_committee');
        let q;

        if (month) {
            q = query(reportsRef, where('month', '==', month));
        } else {
            q = query(reportsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let reports = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as ReportPresentedToCommittee));

        if (month) {
            reports.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return reports;
    } catch (error) {
        console.error('Error getting reports presented to committee:', error);
        return [];
    }
}

export async function updateReportPresentedToCommittee(
    id: string,
    updates: Partial<ReportPresentedToCommittee> & { updatedBy: string }
): Promise<boolean> {
    try {
        const reportRef = doc(db, 'reports_presented_to_committee', id);
        await setDoc(reportRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating report presented to committee:', error);
        return false;
    }
}

export async function deleteReportPresentedToCommittee(id: string): Promise<boolean> {
    try {
        const reportRef = doc(db, 'reports_presented_to_committee', id);
        await deleteDoc(reportRef);
        return true;
    } catch (error) {
        console.error('Error deleting report presented to committee:', error);
        return false;
    }
}

// Reports By Facility Specialty (التقارير المعروضة على اللجنة وفقا لتخصص المنشآت)
export interface ReportByFacilitySpecialty {
    id?: string;
    month: string;  // الشهر YYYY-MM
    facilitySpecialty: string;  // التخصص (Dropdown)
    numberOfReports: number;  // عدد التقارير
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export async function saveReportByFacilitySpecialty(
    reportData: Omit<ReportByFacilitySpecialty, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const reportsRef = collection(db, 'reports_by_facility_specialty');
        const docRef = await addDoc(reportsRef, {
            ...reportData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving report by facility specialty:', error);
        return null;
    }
}

export async function getReportsByFacilitySpecialty(month?: string): Promise<ReportByFacilitySpecialty[]> {
    try {
        const reportsRef = collection(db, 'reports_by_facility_specialty');
        let q;

        if (month) {
            q = query(reportsRef, where('month', '==', month));
        } else {
            q = query(reportsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let reports = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as ReportByFacilitySpecialty));

        if (month) {
            reports.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return reports;
    } catch (error) {
        console.error('Error getting reports by facility specialty:', error);
        return [];
    }
}

export async function updateReportByFacilitySpecialty(
    id: string,
    updates: Partial<ReportByFacilitySpecialty> & { updatedBy: string }
): Promise<boolean> {
    try {
        const reportRef = doc(db, 'reports_by_facility_specialty', id);
        await setDoc(reportRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating report by facility specialty:', error);
        return false;
    }
}

export async function deleteReportByFacilitySpecialty(id: string): Promise<boolean> {
    try {
        const reportRef = doc(db, 'reports_by_facility_specialty', id);
        await deleteDoc(reportRef);
        return true;
    } catch (error) {
        console.error('Error deleting report by facility specialty:', error);
        return false;
    }
}

// Accreditation Decisions (القرارات الصادرة)
export interface AccreditationDecision {
    id?: string;
    month: string;  // الشهر YYYY-MM
    facilityCategory: string;  // نوع المنشأة
    decisionType: string;  // نوع القرار
    count: number;  // العدد
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export async function saveAccreditationDecision(
    data: Omit<AccreditationDecision, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const ref = collection(db, 'accreditation_decisions');
        const docRef = await addDoc(ref, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving accreditation decision:', error);
        return null;
    }
}

export async function getAccreditationDecisions(month?: string): Promise<AccreditationDecision[]> {
    try {
        const ref = collection(db, 'accreditation_decisions');
        let q;

        if (month) {
            q = query(ref, where('month', '==', month));
        } else {
            q = query(ref, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let decisions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as AccreditationDecision));

        if (month) {
            decisions.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return decisions;
    } catch (error) {
        console.error('Error getting accreditation decisions:', error);
        return [];
    }
}

export async function updateAccreditationDecision(
    id: string,
    updates: Partial<AccreditationDecision> & { updatedBy: string }
): Promise<boolean> {
    try {
        const ref = doc(db, 'accreditation_decisions', id);
        await setDoc(ref, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating accreditation decision:', error);
        return false;
    }
}

export async function deleteAccreditationDecision(id: string): Promise<boolean> {
    try {
        const ref = doc(db, 'accreditation_decisions', id);
        await deleteDoc(ref);
        return true;
    } catch (error) {
        console.error('Error deleting accreditation decision:', error);
        return false;
    }
}

// ============================================================================
// Collected Revenues (الإيرادات المحصلة)
// ============================================================================

export const saveCollectedRevenue = async (data: any) => {
    try {
        const docRef = await addDoc(collection(db, 'collectedRevenues'), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding collected revenue:', error);
        return null;
    }
};

export const getCollectedRevenues = async () => {
    try {
        const q = query(collection(db, 'collectedRevenues'), orderBy('month', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as CollectedRevenue[];
    } catch (error) {
        console.error('Error getting collected revenues:', error);
        return [];
    }
};

export const updateCollectedRevenue = async (id: string, data: any) => {
    try {
        const docRef = doc(db, 'collectedRevenues', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating collected revenue:', error);
        return false;
    }
};

export const deleteCollectedRevenue = async (id: string) => {
    try {
        const docRef = doc(db, 'collectedRevenues', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting collected revenue:', error);
        return false;
    }
};

// ============================================================================
// Training Programs By Governorate (البرامج التدريبية بالمحافظات)
// ============================================================================

export const saveTrainingProgramByGovernorate = async (data: any) => {
    try {
        const docRef = await addDoc(collection(db, 'trainingProgramsByGovernorate'), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding training program by governorate:', error);
        return null;
    }
};

export const getTrainingProgramsByGovernorate = async () => {
    try {
        const q = query(collection(db, 'trainingProgramsByGovernorate'), orderBy('month', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as TrainingProgramByGovernorate[];
    } catch (error) {
        console.error('Error getting training programs by governorate:', error);
        return [];
    }
};

export const updateTrainingProgramByGovernorate = async (id: string, data: any) => {
    try {
        const docRef = doc(db, 'trainingProgramsByGovernorate', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating training program by governorate:', error);
        return false;
    }
};

export const deleteTrainingProgramByGovernorate = async (id: string) => {
    try {
        const docRef = doc(db, 'trainingProgramsByGovernorate', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting training program by governorate:', error);
        return false;
    }
};

// ============================================================================
// Training Methodology (منهجية التدريب)
// ============================================================================

export const saveTrainingNature = async (data: Omit<TrainingNature, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
        const docRef = await addDoc(collection(db, 'trainingNatures'), {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error adding training nature:', error);
        return null;
    }
};

export const getTrainingNatures = async () => {
    try {
        const q = query(collection(db, 'trainingNatures'), orderBy('month', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as TrainingNature[];
    } catch (error) {
        console.error('Error getting training natures:', error);
        return [];
    }
};

export const updateTrainingNature = async (id: string, data: Partial<TrainingNature>) => {
    try {
        const docRef = doc(db, 'trainingNatures', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating training nature:', error);
        return false;
    }
};

export const deleteTrainingNature = async (id: string) => {
    try {
        const docRef = doc(db, 'trainingNatures', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting training nature:', error);
        return false;
    }
};

// ============================================================================
// Safe Health Design - Received Projects (المشروعات المستلمة حسب الجهة المرسلة for dept10)
// ============================================================================

export interface ReceivedProject {
    id?: string;
    month: string;
    entityType: string;
    projectCount: number;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export async function saveReceivedProject(
    data: Omit<ReceivedProject, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const ref = collection(db, 'dept10_received_projects');
        const docRef = await addDoc(ref, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving received project:', error);
        return null;
    }
}

export async function getReceivedProjects(month?: string): Promise<ReceivedProject[]> {
    try {
        const ref = collection(db, 'dept10_received_projects');
        let q;

        if (month) {
            q = query(ref, where('month', '==', month));
        } else {
            q = query(ref, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as ReceivedProject));

        if (month) {
            items.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return items;
    } catch (error) {
        console.error('Error getting received projects:', error);
        return [];
    }
}

export async function updateReceivedProject(
    id: string,
    updates: Partial<ReceivedProject> & { updatedBy: string }
): Promise<boolean> {
    try {
        const ref = doc(db, 'dept10_received_projects', id);
        await setDoc(ref, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating received project:', error);
        return false;
    }
}

export async function deleteReceivedProject(id: string): Promise<boolean> {
    try {
        const ref = doc(db, 'dept10_received_projects', id);
        await deleteDoc(ref);
        return true;
    } catch (error) {
        console.error('Error deleting received project:', error);
        return false;
    }
}

// ============================================================================
// Safe Health Design - Completed Projects (المشروعات المنتهي مراجعتها حسب الجهة for dept10)
// ============================================================================

export interface CompletedReviewProject {
    id?: string;
    month: string;
    entityType: string;
    projectCount: number;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export async function saveCompletedReviewProject(
    data: Omit<CompletedReviewProject, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const ref = collection(db, 'dept10_completed_projects');
        const docRef = await addDoc(ref, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving completed review project:', error);
        return null;
    }
}

export async function getCompletedReviewProjects(month?: string): Promise<CompletedReviewProject[]> {
    try {
        const ref = collection(db, 'dept10_completed_projects');
        let q;

        if (month) {
            q = query(ref, where('month', '==', month));
        } else {
            q = query(ref, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as CompletedReviewProject));

        if (month) {
            items.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return items;
    } catch (error) {
        console.error('Error getting completed review projects:', error);
        return [];
    }
}

export async function updateCompletedReviewProject(
    id: string,
    updates: Partial<CompletedReviewProject> & { updatedBy: string }
): Promise<boolean> {
    try {
        const ref = doc(db, 'dept10_completed_projects', id);
        await setDoc(ref, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating completed review project:', error);
        return false;
    }
}

export async function deleteCompletedReviewProject(id: string): Promise<boolean> {
    try {
        const ref = doc(db, 'dept10_completed_projects', id);
        await deleteDoc(ref);
        return true;
    } catch (error) {
        console.error('Error deleting completed review project:', error);
        return false;
    }
}
