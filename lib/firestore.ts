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
    accreditationStatus: string;
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
    facilityType: string;
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
    facilityType: string;
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

// Scheduled Support Visits (زيارات الدعم الفني المجدولة في شهر ....)
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

// Accredited Supported Facilities (المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم)
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
    facilityType: string;
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
    facilityType: string;
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
    visitType: string;
    assessmentType?: string;  // نوع التقييم - حقل نصي حر
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
    entityType: string;  // الجهة التابعة: هيئة الرعاية الصحية / وزارة الصحة
    facilityType: string;  // نوع المنشأة: مراكز الرعاية الأولية / وحدات الرعاية الأولية
    observation: string;  // نص دليل التطابق/الملاحظة
    percentage: number;  // نسبة الملاحظات
    month: string;  // الشهر YYYY-MM
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Technical Clinical Observations (الملاحظات المتكررة للرقابة الفنية والإكلينيكية)
export interface TechnicalClinicalObservation {
    id?: string;
    entityType: string;  // الجهة التابعة: هيئة الرعاية الصحية / وزارة الصحة
    facilityType: string;  // نوع المنشأة: مراكز الرعاية الأولية / وحدات الرعاية الأولية
    observation: string;  // نص دليل التطابق/الملاحظة
    percentage: number;  // نسبة الملاحظات
    month: string;  // الشهر YYYY-MM
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface ObservationCorrectionRate {
    id?: string;
    entityType: string;  // الجهة: المنشآت الصحية التابعة لهيئة الرعاية / منشآت صحية أخرى
    facilityCategory: string;  // الفئة: مستشفيات / مراكز ووحدات الرعاية الأولية / المراكز الطبية...
    facilityName: string;  // اسم المنشأة
    governorate: string;  // المحافظة
    visitDate: string;  // تاريخ الزيارة
    visitType: string;  // نوع الزيارة
    month: string;  // الشهر YYYY-MM للفلترة
    year: number;
    // بيانات كل معيار - عدد الملاحظات الواردة
    pccTotal: number;
    efsTotal: number;
    ogmTotal: number;
    imtTotal: number;
    wfmTotal: number;
    caiTotal: number;
    qpiTotal: number;
    // بيانات كل معيار - عدد الملاحظات المصححة
    pccCorrected: number;
    efsCorrected: number;
    ogmCorrected: number;
    imtCorrected: number;
    wfmCorrected: number;
    caiCorrected: number;
    qpiCorrected: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Reviewer Evaluation Visits (الزيارات التقييمية وفقا لنوع المنشأة للمراجعين)
export interface ReviewerEvaluationVisit {
    id?: string;
    month: string;  // الشهر YYYY-MM
    facilityType: string;  // نوع المنشأة
    visitsCount: number;  // عدد الزيارات
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface ReviewerEvaluationVisitByGovernorate {
    id?: string;
    month: string;
    governorate: string;
    visitsCount: number;
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Reviewer Evaluation Visits By Visit Type (الزيارات التقييمية وفقا لنوع الزيارة)
export interface ReviewerEvaluationVisitByType {
    id?: string;
    month: string;  // الشهر YYYY-MM
    visitType: string;  // نوع الزيارة
    visitsCount: number;  // عدد الزيارات
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Medical Professionals By Category (أعضاء المهن الطبية حسب الفئة)
export interface MedicalProfessionalByCategory {
    id?: string;
    month: string;  // الشهر YYYY-MM
    branch: string;  // الفرع (رئاسة الهيئة، بورسعيد، الأقصر، الإسماعيلية، السويس، أسوان، جنوب سيناء)
    doctors: number;  // أطباء بشريين
    dentists: number;  // أطباء أسنان
    pharmacists: number;  // صيادلة
    physiotherapy: number;  // علاج طبيعي
    veterinarians: number;  // بيطريين
    seniorNursing: number;  // تمريض عالي
    technicalNursing: number;  // فني تمريض
    healthTechnician: number;  // فني صحي
    scientists: number;  // علميين
    total: number;  // الإجمالي (محسوب)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

export interface MedicalProfessionalByGovernorate {
    id?: string;
    month: string;  // الشهر YYYY-MM
    governorate: string;  // المحافظة
    doctors: number;  // أطباء بشريين
    dentists: number;  // أطباء أسنان
    pharmacists: number;  // صيادلة
    physiotherapy: number;  // علاج طبيعي
    veterinarians: number;  // بيطريين
    seniorNursing: number;  // تمريض عالي
    technicalNursing: number;  // فني تمريض
    healthTechnician: number;  // فني صحي
    scientists: number;  // علميين
    total: number;  // الإجمالي (محسوب)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Training Entity (الجهات الحاصلة على التدريب for dept1)
export interface TrainingEntity {
    id?: string;
    entityName: string;  // الجهة الحاصلة على التدريب
    traineesCount: number;  // عدد المتدربين
    month: string;  // الشهر YYYY-MM
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Program Type (نوع البرنامج for dept1)
export interface ProgramType {
    id?: string;
    month: string;  // الشهر YYYY-MM
    trainingPrograms: number;  // برامج تدريب
    awarenessPrograms: number;  // برامج توعية
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}

// Governorate Customer Survey (استبيانات رضاء المتعاملين حسب المحافظة for dept3)
export interface GovernorateCustomerSurvey {
    id?: string;
    month: string;  // الشهر YYYY-MM
    governorate: string;  // المحافظة
    visitImplementationRate: number;  // نسبة تنفيذ الزيارات (0-100)
    targetFacilities: number;  // عدد المنشآت المستهدفة
    visitedFacilitiesList: string;  // أسماء المنشآت (نص طويل - كل منشأة في سطر)
    patientSurveysCount: number;  // عدد استبيانات قياس تجربة المريض
    staffSurveysCount: number;  // عدد استبيانات مقدمي الخدمة والعاملين
    patientSatisfactionRate: number;  // نسبة قياس رضاء المريض (0-100، مع كسور)
    staffSatisfactionRate: number;  // نسبة قياس رضاء العاملين (0-100، مع كسور)
    year: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}


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

// Accreditation Facilities Functions
export async function saveAccreditationFacility(
    facilityData: Omit<AccreditationFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'accreditation_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...facilityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving accreditation facility:', error);
        return null;
    }
}

export async function getAccreditationFacilities(month?: string): Promise<AccreditationFacility[]> {
    try {
        const facilitiesRef = collection(db, 'accreditation_facilities');
        let q;

        if (month) {
            // Just filter by month, sort client-side to avoid composite index
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            // No filter, just order by creation date
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as AccreditationFacility));

        // Sort client-side if filtered
        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting accreditation facilities:', error);
        return [];
    }
}

export async function updateAccreditationFacility(
    id: string,
    updates: Partial<AccreditationFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'accreditation_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating accreditation facility:', error);
        return false;
    }
}

export async function deleteAccreditationFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'accreditation_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting accreditation facility:', error);
        return false;
    }
}

// Technical Support Visit Functions
export async function saveTechnicalSupportVisit(
    visitData: Omit<TechnicalSupportVisit, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const visitsRef = collection(db, 'technical_support_visits');
        const docRef = await addDoc(visitsRef, {
            ...visitData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving technical support visit:', error);
        return null;
    }
}

export async function getTechnicalSupportVisits(month?: string): Promise<TechnicalSupportVisit[]> {
    try {
        const visitsRef = collection(db, 'technical_support_visits');
        let q;

        if (month) {
            q = query(visitsRef, where('month', '==', month));
        } else {
            q = query(visitsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as TechnicalSupportVisit));

        if (month) {
            visits.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return visits;
    } catch (error) {
        console.error('Error getting technical support visits:', error);
        return [];
    }
}

export async function updateTechnicalSupportVisit(
    id: string,
    updates: Partial<TechnicalSupportVisit> & { updatedBy: string }
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'technical_support_visits', id);
        await setDoc(visitRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating technical support visit:', error);
        return false;
    }
}

export async function deleteTechnicalSupportVisit(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'technical_support_visits', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting technical support visit:', error);
        return false;
    }
}

// Remote Technical Support Functions (الدعم الفني عن بعد)
export async function saveRemoteTechnicalSupport(
    supportData: Omit<RemoteTechnicalSupport, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const supportsRef = collection(db, 'remote_technical_supports');
        const docRef = await addDoc(supportsRef, {
            ...supportData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving remote technical support:', error);
        return null;
    }
}

export async function getRemoteTechnicalSupports(month?: string): Promise<RemoteTechnicalSupport[]> {
    try {
        const supportsRef = collection(db, 'remote_technical_supports');
        let q;

        if (month) {
            q = query(supportsRef, where('month', '==', month));
        } else {
            q = query(supportsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let supports = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as RemoteTechnicalSupport));

        if (month) {
            supports.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return supports;
    } catch (error) {
        console.error('Error getting remote technical supports:', error);
        return [];
    }
}

export async function updateRemoteTechnicalSupport(
    id: string,
    updates: Partial<RemoteTechnicalSupport> & { updatedBy: string }
): Promise<boolean> {
    try {
        const supportRef = doc(db, 'remote_technical_supports', id);
        await setDoc(supportRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating remote technical support:', error);
        return false;
    }
}

export async function deleteRemoteTechnicalSupport(id: string): Promise<boolean> {
    try {
        const supportRef = doc(db, 'remote_technical_supports', id);
        await deleteDoc(supportRef);
        return true;
    } catch (error) {
        console.error('Error deleting remote technical support:', error);
        return false;
    }
}

// Introductory Support Visit Functions (زيارات الدعم الفني التمهيدية)
export async function saveIntroductorySupportVisit(
    visitData: Omit<IntroductorySupportVisit, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const visitsRef = collection(db, 'introductory_support_visits');
        const docRef = await addDoc(visitsRef, {
            ...visitData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving introductory support visit:', error);
        return null;
    }
}

export async function getIntroductorySupportVisits(month?: string): Promise<IntroductorySupportVisit[]> {
    try {
        const visitsRef = collection(db, 'introductory_support_visits');
        let q;

        if (month) {
            q = query(visitsRef, where('month', '==', month));
        } else {
            q = query(visitsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as IntroductorySupportVisit));

        if (month) {
            visits.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return visits;
    } catch (error) {
        console.error('Error getting introductory support visits:', error);
        return [];
    }
}

export async function updateIntroductorySupportVisit(
    id: string,
    updates: Partial<IntroductorySupportVisit> & { updatedBy: string }
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'introductory_support_visits', id);
        await setDoc(visitRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating introductory support visit:', error);
        return false;
    }
}

export async function deleteIntroductorySupportVisit(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'introductory_support_visits', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting introductory support visit:', error);
        return false;
    }
}

// Scheduled Support Visit Functions (زيارات الدعم الفني المجدولة في شهر ....)
export async function saveScheduledSupportVisit(
    visitData: Omit<ScheduledSupportVisit, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const visitsRef = collection(db, 'scheduled_support_visits');
        const docRef = await addDoc(visitsRef, {
            ...visitData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving scheduled support visit:', error);
        return null;
    }
}

export async function getScheduledSupportVisits(month?: string): Promise<ScheduledSupportVisit[]> {
    try {
        const visitsRef = collection(db, 'scheduled_support_visits');
        let q;

        if (month) {
            q = query(visitsRef, where('month', '==', month));
        } else {
            q = query(visitsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as ScheduledSupportVisit));

        if (month) {
            visits.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return visits;
    } catch (error) {
        console.error('Error getting scheduled support visits:', error);
        return [];
    }
}

export async function updateScheduledSupportVisit(
    id: string,
    updates: Partial<ScheduledSupportVisit> & { updatedBy: string }
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'scheduled_support_visits', id);
        await setDoc(visitRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating scheduled support visit:', error);
        return false;
    }
}

export async function deleteScheduledSupportVisit(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'scheduled_support_visits', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting scheduled support visit:', error);
        return false;
    }
}

// ==================== Accredited Supported Facilities Functions ====================

export async function saveAccreditedSupportedFacility(
    facilityData: Omit<AccreditedSupportedFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'accredited_supported_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...facilityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving accredited supported facility:', error);
        return null;
    }
}

export async function getAccreditedSupportedFacilities(month?: string): Promise<AccreditedSupportedFacility[]> {
    try {
        const facilitiesRef = collection(db, 'accredited_supported_facilities');
        let q;

        if (month) {
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as AccreditedSupportedFacility));

        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting accredited supported facilities:', error);
        return [];
    }
}

export async function updateAccreditedSupportedFacility(
    id: string,
    updates: Partial<Omit<AccreditedSupportedFacility, 'id' | 'createdAt'>> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'accredited_supported_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating accredited supported facility:', error);
        return false;
    }
}

export async function deleteAccreditedSupportedFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'accredited_supported_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting accredited supported facility:', error);
        return false;
    }
}

// Completion Facilities Functions
export async function saveCompletionFacility(
    facilityData: Omit<CompletionFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'completion_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...facilityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving completion facility:', error);
        return null;
    }
}

export async function getCompletionFacilities(month?: string): Promise<CompletionFacility[]> {
    try {
        const facilitiesRef = collection(db, 'completion_facilities');
        let q;

        if (month) {
            // Just filter by month, sort client-side to avoid composite index
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            // No filter, just order by creation date
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as CompletionFacility));

        // Sort client-side if filtered
        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting completion facilities:', error);
        return [];
    }
}

export async function updateCompletionFacility(
    id: string,
    updates: Partial<CompletionFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'completion_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating completion facility:', error);
        return false;
    }
}

export async function deleteCompletionFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'completion_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting completion facility:', error);
        return false;
    }
}

// Payment Facilities Functions
export async function savePaymentFacility(
    facilityData: Omit<PaymentFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'payment_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...facilityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving payment facility:', error);
        return null;
    }
}

export async function getPaymentFacilities(month?: string): Promise<PaymentFacility[]> {
    try {
        const facilitiesRef = collection(db, 'payment_facilities');
        let q;

        if (month) {
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as PaymentFacility));

        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting payment facilities:', error);
        return [];
    }
}

export async function updatePaymentFacility(
    id: string,
    updates: Partial<PaymentFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'payment_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating payment facility:', error);
        return false;
    }
}

export async function deletePaymentFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'payment_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting payment facility:', error);
        return false;
    }
}

// Corrective Plan Facilities Functions
export async function saveCorrectivePlanFacility(
    facilityData: Omit<CorrectivePlanFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'corrective_plan_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...facilityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving corrective plan facility:', error);
        return null;
    }
}

export async function getCorrectivePlanFacilities(month?: string): Promise<CorrectivePlanFacility[]> {
    try {
        const facilitiesRef = collection(db, 'corrective_plan_facilities');
        let q;

        if (month) {
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as CorrectivePlanFacility));

        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting corrective plan facilities:', error);
        return [];
    }
}

export async function updateCorrectivePlanFacility(
    id: string,
    updates: Partial<CorrectivePlanFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'corrective_plan_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating corrective plan facility:', error);
        return false;
    }
}

export async function deleteCorrectivePlanFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'corrective_plan_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting corrective plan facility:', error);
        return false;
    }
}


// Paid Facilities Functions
export async function savePaidFacility(
    facilityData: Omit<PaidFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'paid_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...facilityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving paid facility:', error);
        return null;
    }
}

export async function getPaidFacilities(month?: string): Promise<PaidFacility[]> {
    try {
        const facilitiesRef = collection(db, 'paid_facilities');
        let q;

        if (month) {
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as PaidFacility));

        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting paid facilities:', error);
        return [];
    }
}

export async function updatePaidFacility(
    id: string,
    updates: Partial<PaidFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'paid_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating paid facility:', error);
        return false;
    }
}

export async function deletePaidFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'paid_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting paid facility:', error);
        return false;
    }
}

// Basic Requirements Facilities Functions
export async function saveBasicRequirementsFacility(
    data: Omit<BasicRequirementsFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'basic_requirements_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving basic requirements facility:', error);
        return null;
    }
}

export async function getBasicRequirementsFacilities(
    departmentId: string,
    filterMonth?: string
): Promise<BasicRequirementsFacility[]> {
    try {
        const facilitiesRef = collection(db, 'basic_requirements_facilities');
        const snapshot = await getDocs(facilitiesRef);

        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as BasicRequirementsFacility[];

        // Client-side filtering by month if provided
        if (filterMonth) {
            facilities = facilities.filter(facility => facility.month === filterMonth);
        }

        return facilities;
    } catch (error) {
        console.error('Error getting basic requirements facilities:', error);
        return [];
    }
}

export async function updateBasicRequirementsFacility(
    id: string,
    updates: Partial<BasicRequirementsFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'basic_requirements_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating basic requirements facility:', error);
        return false;
    }
}

export async function deleteBasicRequirementsFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'basic_requirements_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting basic requirements facility:', error);
        return false;
    }
}

// Appeals Facilities Functions
export async function saveAppealsFacility(
    data: Omit<AppealsFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'appeals_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving appeals facility:', error);
        return null;
    }
}

export async function getAppealsFacilities(
    departmentId: string,
    filterMonth?: string
): Promise<AppealsFacility[]> {
    try {
        const facilitiesRef = collection(db, 'appeals_facilities');
        const snapshot = await getDocs(facilitiesRef);

        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as AppealsFacility[];

        if (filterMonth) {
            facilities = facilities.filter(facility => facility.month === filterMonth);
        }

        return facilities;
    } catch (error) {
        console.error('Error getting appeals facilities:', error);
        return [];
    }
}

export async function updateAppealsFacility(
    id: string,
    updates: Partial<AppealsFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'appeals_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating appeals facility:', error);
        return false;
    }
}

export async function deleteAppealsFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'appeals_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting appeals facility:', error);
        return false;
    }
}

// Medical Professional Registration Functions
export async function saveMedicalProfessionalRegistration(
    data: Omit<MedicalProfessionalRegistration, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const registrationsRef = collection(db, 'medical_professional_registrations');
        const docRef = await addDoc(registrationsRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving medical professional registration:', error);
        return null;
    }
}

export async function getMedicalProfessionalRegistrations(month?: string): Promise<MedicalProfessionalRegistration[]> {
    try {
        const registrationsRef = collection(db, 'medical_professional_registrations');
        let q;

        if (month) {
            q = query(registrationsRef, where('month', '==', month));
        } else {
            q = query(registrationsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let registrations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as MedicalProfessionalRegistration));

        if (month) {
            registrations.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return registrations;
    } catch (error) {
        console.error('Error getting medical professional registrations:', error);
        return [];
    }
}

export async function updateMedicalProfessionalRegistration(
    id: string,
    updates: Partial<MedicalProfessionalRegistration> & { updatedBy: string }
): Promise<boolean> {
    try {
        const registrationRef = doc(db, 'medical_professional_registrations', id);
        await setDoc(registrationRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating medical professional registration:', error);
        return false;
    }
}

export async function deleteMedicalProfessionalRegistration(id: string): Promise<boolean> {
    try {
        const registrationRef = doc(db, 'medical_professional_registrations', id);
        await deleteDoc(registrationRef);
        return true;
    } catch (error) {
        console.error('Error deleting medical professional registration:', error);
        return false;
    }
}

// Technical Clinical Facilities Functions
export async function saveTechnicalClinicalFacility(
    data: Omit<TechnicalClinicalFacility, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const facilitiesRef = collection(db, 'technical_clinical_facilities');
        const docRef = await addDoc(facilitiesRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving technical clinical facility:', error);
        return null;
    }
}

export async function getTechnicalClinicalFacilities(month?: string): Promise<TechnicalClinicalFacility[]> {
    try {
        const facilitiesRef = collection(db, 'technical_clinical_facilities');
        let q;

        if (month) {
            q = query(facilitiesRef, where('month', '==', month));
        } else {
            q = query(facilitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let facilities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as TechnicalClinicalFacility));

        if (month) {
            facilities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return facilities;
    } catch (error) {
        console.error('Error getting technical clinical facilities:', error);
        return [];
    }
}

export async function updateTechnicalClinicalFacility(
    id: string,
    updates: Partial<TechnicalClinicalFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'technical_clinical_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating technical clinical facility:', error);
        return false;
    }
}

export async function deleteTechnicalClinicalFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'technical_clinical_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting technical clinical facility:', error);
        return false;
    }
}

// Admin Audit Facility functions (for dept5)
export async function saveAdminAuditFacility(
    facility: Omit<AdminAuditFacility, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
    try {
        const facilityRef = collection(db, 'admin_audit_facilities');
        const docRef = await addDoc(facilityRef, {
            ...facility,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving admin audit facility:', error);
        return null;
    }
}

export async function getAdminAuditFacilities(filterMonth?: string): Promise<AdminAuditFacility[]> {
    try {
        const facilitiesRef = collection(db, 'admin_audit_facilities');
        let q;
        if (filterMonth) {
            q = query(facilitiesRef, where('month', '==', filterMonth));
        } else {
            q = query(facilitiesRef);
        }
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as AdminAuditFacility[];
    } catch (error) {
        console.error('Error getting admin audit facilities:', error);
        return [];
    }
}

export async function updateAdminAuditFacility(
    id: string,
    updates: Partial<AdminAuditFacility> & { updatedBy: string }
): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'admin_audit_facilities', id);
        await setDoc(facilityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating admin audit facility:', error);
        return false;
    }
}

export async function deleteAdminAuditFacility(id: string): Promise<boolean> {
    try {
        const facilityRef = doc(db, 'admin_audit_facilities', id);
        await deleteDoc(facilityRef);
        return true;
    } catch (error) {
        console.error('Error deleting admin audit facility:', error);
        return false;
    }
}

// Admin Audit Observations Functions (الملاحظات المتكررة)
export async function saveAdminAuditObservation(
    data: Omit<AdminAuditObservation, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const observationsRef = collection(db, 'admin_audit_observations');
        const docRef = await addDoc(observationsRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving admin audit observation:', error);
        return null;
    }
}

export async function getAdminAuditObservations(filterMonth?: string): Promise<AdminAuditObservation[]> {
    try {
        const observationsRef = collection(db, 'admin_audit_observations');
        let q;
        if (filterMonth) {
            q = query(observationsRef, where('month', '==', filterMonth));
        } else {
            q = query(observationsRef, orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        let observations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as AdminAuditObservation));

        // Sort by entityType then by percentage descending
        if (filterMonth) {
            observations.sort((a, b) => {
                if (a.entityType !== b.entityType) {
                    return a.entityType.localeCompare(b.entityType, 'ar');
                }
                return b.percentage - a.percentage;
            });
        }

        return observations;
    } catch (error) {
        console.error('Error getting admin audit observations:', error);
        return [];
    }
}

export async function updateAdminAuditObservation(
    id: string,
    updates: Partial<AdminAuditObservation> & { updatedBy: string }
): Promise<boolean> {
    try {
        const observationRef = doc(db, 'admin_audit_observations', id);
        await setDoc(observationRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating admin audit observation:', error);
        return false;
    }
}

export async function deleteAdminAuditObservation(id: string): Promise<boolean> {
    try {
        const observationRef = doc(db, 'admin_audit_observations', id);
        await deleteDoc(observationRef);
        return true;
    } catch (error) {
        console.error('Error deleting admin audit observation:', error);
        return false;
    }
}

// Observation Correction Rate CRUD functions - نسب تصحيح الملاحظات
export async function saveObservationCorrectionRate(
    data: Omit<ObservationCorrectionRate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
    try {
        const collectionRef = collection(db, 'observation_correction_rates');
        const docRef = await addDoc(collectionRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving observation correction rate:', error);
        return null;
    }
}

export async function getObservationCorrectionRates(
    filterMonth?: string
): Promise<ObservationCorrectionRate[]> {
    try {
        const collectionRef = collection(db, 'observation_correction_rates');
        let q;

        if (filterMonth) {
            q = query(collectionRef, where('month', '==', filterMonth));
        } else {
            q = query(collectionRef);
        }

        const snapshot = await getDocs(q);
        const rates: ObservationCorrectionRate[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            rates.push({
                id: doc.id,
                entityType: data.entityType || 'المنشآت الصحية التابعة لهيئة الرعاية',
                facilityCategory: data.facilityCategory,
                facilityName: data.facilityName,
                governorate: data.governorate,
                visitDate: data.visitDate,
                visitType: data.visitType || 'زيارة متابعة تدقيق إداري',
                month: data.month,
                year: data.year,
                pccTotal: data.pccTotal,
                efsTotal: data.efsTotal,
                ogmTotal: data.ogmTotal,
                imtTotal: data.imtTotal,
                wfmTotal: data.wfmTotal,
                caiTotal: data.caiTotal,
                qpiTotal: data.qpiTotal,
                pccCorrected: data.pccCorrected,
                efsCorrected: data.efsCorrected,
                ogmCorrected: data.ogmCorrected,
                imtCorrected: data.imtCorrected,
                wfmCorrected: data.wfmCorrected,
                caiCorrected: data.caiCorrected,
                qpiCorrected: data.qpiCorrected,
                createdAt: data.createdAt?.toDate(),
                createdBy: data.createdBy,
                updatedAt: data.updatedAt?.toDate(),
                updatedBy: data.updatedBy
            });
        });

        return rates;
    } catch (error) {
        console.error('Error getting observation correction rates:', error);
        return [];
    }
}

export async function updateObservationCorrectionRate(
    id: string,
    updates: Partial<ObservationCorrectionRate> & { updatedBy: string }
): Promise<boolean> {
    try {
        const docRef = doc(db, 'observation_correction_rates', id);
        await setDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating observation correction rate:', error);
        return false;
    }
}

export async function deleteObservationCorrectionRate(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, 'observation_correction_rates', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting observation correction rate:', error);
        return false;
    }
}

// Technical Clinical Observations Functions (الملاحظات المتكررة للرقابة الفنية والإكلينيكية)
export async function saveTechnicalClinicalObservation(
    data: Omit<TechnicalClinicalObservation, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const observationsRef = collection(db, 'technical_clinical_observations');
        const docRef = await addDoc(observationsRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving technical clinical observation:', error);
        return null;
    }
}

export async function getTechnicalClinicalObservations(filterMonth?: string): Promise<TechnicalClinicalObservation[]> {
    try {
        const observationsRef = collection(db, 'technical_clinical_observations');
        let q;
        if (filterMonth) {
            q = query(observationsRef, where('month', '==', filterMonth));
        } else {
            q = query(observationsRef, orderBy('createdAt', 'desc'));
        }
        const snapshot = await getDocs(q);
        let observations = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as TechnicalClinicalObservation));

        // Sort by entityType then by percentage descending
        if (filterMonth) {
            observations.sort((a, b) => {
                if (a.entityType !== b.entityType) {
                    return a.entityType.localeCompare(b.entityType, 'ar');
                }
                return b.percentage - a.percentage;
            });
        }

        return observations;
    } catch (error) {
        console.error('Error getting technical clinical observations:', error);
        return [];
    }
}

export async function updateTechnicalClinicalObservation(
    id: string,
    updates: Partial<TechnicalClinicalObservation> & { updatedBy: string }
): Promise<boolean> {
    try {
        const observationRef = doc(db, 'technical_clinical_observations', id);
        await setDoc(observationRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating technical clinical observation:', error);
        return false;
    }
}

export async function deleteTechnicalClinicalObservation(id: string): Promise<boolean> {
    try {
        const observationRef = doc(db, 'technical_clinical_observations', id);
        await deleteDoc(observationRef);
        return true;
    } catch (error) {
        console.error('Error deleting technical clinical observation:', error);
        return false;
    }
}

// Technical Clinical Correction Rate Interface and CRUD functions
// نسب تصحيح الملاحظات للرقابة الفنية والإكلينيكية
export interface TechnicalClinicalCorrectionRate {
    id?: string;
    entityType: string;  // الجهة: المنشآت الصحية التابعة لهيئة الرعاية / منشآت صحية أخرى
    facilityCategory: string;  // الفئة: مستشفيات / مراكز ووحدات الرعاية الأولية / المراكز الطبية...
    facilityName: string;  // اسم المنشأة
    governorate: string;  // المحافظة
    visitDate: string;  // تاريخ الزيارة
    visitType: string;  // نوع الزيارة
    month: string;  // الشهر YYYY-MM للفلترة
    year: number;
    // بيانات كل معيار - عدد الملاحظات الواردة (16 معيار)
    pccTotal: number;
    actTotal: number;
    icdTotal: number;
    dasTotal: number;
    mmsTotal: number;
    sipTotal: number;
    ipcTotal: number;
    wfmTotal: number;
    imtTotal: number;
    qpiTotal: number;
    scmTotal: number;
    texTotal: number;
    teqTotal: number;
    tpoTotal: number;
    nsrTotal: number;
    sasTotal: number;
    // بيانات كل معيار - عدد الملاحظات المصححة (16 معيار)
    pccCorrected: number;
    actCorrected: number;
    icdCorrected: number;
    dasCorrected: number;
    mmsCorrected: number;
    sipCorrected: number;
    ipcCorrected: number;
    wfmCorrected: number;
    imtCorrected: number;
    qpiCorrected: number;
    scmCorrected: number;
    texCorrected: number;
    teqCorrected: number;
    tpoCorrected: number;
    nsrCorrected: number;
    sasCorrected: number;
    createdAt?: Date;
    createdBy?: string;
    updatedAt?: Date;
    updatedBy?: string;
}


export async function saveTechnicalClinicalCorrectionRate(
    data: Omit<TechnicalClinicalCorrectionRate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
    try {
        const collectionRef = collection(db, 'technical_clinical_correction_rates');
        const docRef = await addDoc(collectionRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving technical clinical correction rate:', error);
        return null;
    }
}

export async function getTechnicalClinicalCorrectionRates(
    filterMonth?: string
): Promise<TechnicalClinicalCorrectionRate[]> {
    try {
        const collectionRef = collection(db, 'technical_clinical_correction_rates');
        let q;

        if (filterMonth) {
            q = query(collectionRef, where('month', '==', filterMonth));
        } else {
            q = query(collectionRef);
        }

        const snapshot = await getDocs(q);
        const rates: TechnicalClinicalCorrectionRate[] = [];

        snapshot.forEach((doc) => {
            const data = doc.data();
            rates.push({
                id: doc.id,
                entityType: data.entityType || 'المنشآت الصحية التابعة لهيئة الرعاية',
                facilityCategory: data.facilityCategory,
                facilityName: data.facilityName,
                governorate: data.governorate,
                visitDate: data.visitDate,
                visitType: data.visitType || 'زيارة متابعة وتدقيق فني وإكلينيكي',
                month: data.month,
                year: data.year,
                pccTotal: data.pccTotal || 0,
                actTotal: data.actTotal || 0,
                icdTotal: data.icdTotal || 0,
                dasTotal: data.dasTotal || 0,
                mmsTotal: data.mmsTotal || 0,
                sipTotal: data.sipTotal || 0,
                ipcTotal: data.ipcTotal || 0,
                wfmTotal: data.wfmTotal || 0,
                imtTotal: data.imtTotal || 0,
                qpiTotal: data.qpiTotal || 0,
                scmTotal: data.scmTotal || 0,
                texTotal: data.texTotal || 0,
                teqTotal: data.teqTotal || 0,
                tpoTotal: data.tpoTotal || 0,
                nsrTotal: data.nsrTotal || 0,
                sasTotal: data.sasTotal || 0,
                pccCorrected: data.pccCorrected || 0,
                actCorrected: data.actCorrected || 0,
                icdCorrected: data.icdCorrected || 0,
                dasCorrected: data.dasCorrected || 0,
                mmsCorrected: data.mmsCorrected || 0,
                sipCorrected: data.sipCorrected || 0,
                ipcCorrected: data.ipcCorrected || 0,
                wfmCorrected: data.wfmCorrected || 0,
                imtCorrected: data.imtCorrected || 0,
                qpiCorrected: data.qpiCorrected || 0,
                scmCorrected: data.scmCorrected || 0,
                texCorrected: data.texCorrected || 0,
                teqCorrected: data.teqCorrected || 0,
                tpoCorrected: data.tpoCorrected || 0,
                nsrCorrected: data.nsrCorrected || 0,
                sasCorrected: data.sasCorrected || 0,
                createdAt: data.createdAt?.toDate(),
                createdBy: data.createdBy,
                updatedAt: data.updatedAt?.toDate(),
                updatedBy: data.updatedBy
            });
        });


        return rates;
    } catch (error) {
        console.error('Error getting technical clinical correction rates:', error);
        return [];
    }
}

export async function updateTechnicalClinicalCorrectionRate(
    id: string,
    updates: Partial<TechnicalClinicalCorrectionRate> & { updatedBy: string }
): Promise<boolean> {
    try {
        const docRef = doc(db, 'technical_clinical_correction_rates', id);
        await setDoc(docRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating technical clinical correction rate:', error);
        return false;
    }
}

export async function deleteTechnicalClinicalCorrectionRate(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, 'technical_clinical_correction_rates', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting technical clinical correction rate:', error);
        return false;
    }
}

// Queued Support Visit Functions (زيارات الدعم الفني بقائمة الانتظار)
export async function saveQueuedSupportVisit(
    visitData: Omit<QueuedSupportVisit, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const visitsRef = collection(db, 'queued_support_visits');
        const docRef = await addDoc(visitsRef, {
            ...visitData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving queued support visit:', error);
        return null;
    }
}

export async function getQueuedSupportVisits(month?: string): Promise<QueuedSupportVisit[]> {
    try {
        const visitsRef = collection(db, 'queued_support_visits');
        let q;

        if (month) {
            q = query(visitsRef, where('month', '==', month));
        } else {
            q = query(visitsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as QueuedSupportVisit));

        if (month) {
            visits.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return visits;
    } catch (error) {
        console.error('Error getting queued support visits:', error);
        return [];
    }
}

export async function updateQueuedSupportVisit(
    id: string,
    updates: Partial<QueuedSupportVisit> & { updatedBy: string }
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'queued_support_visits', id);
        await setDoc(visitRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating queued support visit:', error);
        return false;
    }
}

export async function deleteQueuedSupportVisit(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'queued_support_visits', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting queued support visit:', error);
        return false;
    }
}

// Reviewer Evaluation Visits Functions (الزيارات التقييمية وفقا لنوع المنشأة للمراجعين)
export async function saveReviewerEvaluationVisit(
    visitData: Omit<ReviewerEvaluationVisit, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const visitsRef = collection(db, 'reviewer_evaluation_visits');
        const docRef = await addDoc(visitsRef, {
            ...visitData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving reviewer evaluation visit:', error);
        return null;
    }
}

export async function getReviewerEvaluationVisits(month?: string): Promise<ReviewerEvaluationVisit[]> {
    try {
        const visitsRef = collection(db, 'reviewer_evaluation_visits');
        let q;

        if (month) {
            q = query(visitsRef, where('month', '==', month));
        } else {
            q = query(visitsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let visits = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as ReviewerEvaluationVisit));

        if (month) {
            visits.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return visits;
    } catch (error) {
        console.error('Error getting reviewer evaluation visits:', error);
        return [];
    }
}

export async function updateReviewerEvaluationVisit(
    id: string,
    updates: Partial<ReviewerEvaluationVisit> & { updatedBy: string }
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'reviewer_evaluation_visits', id);
        await setDoc(visitRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating reviewer evaluation visit:', error);
        return false;
    }
}

export async function deleteReviewerEvaluationVisit(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'reviewer_evaluation_visits', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting reviewer evaluation visit:', error);
        return false;
    }
}

// ==================== Reviewer Evaluation Visits By Governorate Functions ====================

export async function saveReviewerEvaluationVisitByGovernorate(
    visitData: Omit<ReviewerEvaluationVisitByGovernorate, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
    try {
        const visitRef = collection(db, 'reviewer_evaluation_visits_by_governorate');
        const docRef = await addDoc(visitRef, {
            ...visitData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving reviewer evaluation visit by governorate:', error);
        return null;
    }
}

export async function getReviewerEvaluationVisitsByGovernorate(month?: string): Promise<ReviewerEvaluationVisitByGovernorate[]> {
    try {
        const visitRef = collection(db, 'reviewer_evaluation_visits_by_governorate');
        let q = query(visitRef, orderBy('month', 'desc'));

        if (month) {
            q = query(visitRef, where('month', '==', month), orderBy('governorate', 'asc'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ReviewerEvaluationVisitByGovernorate));
    } catch (error) {
        console.error('Error getting reviewer evaluation visits by governorate:', error);
        return [];
    }
}

export async function updateReviewerEvaluationVisitByGovernorate(
    id: string,
    visitData: Partial<Omit<ReviewerEvaluationVisitByGovernorate, 'id' | 'createdAt' | 'createdBy'>>
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'reviewer_evaluation_visits_by_governorate', id);
        await updateDoc(visitRef, {
            ...visitData,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating reviewer evaluation visit by governorate:', error);
        return false;
    }
}

export async function deleteReviewerEvaluationVisitByGovernorate(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'reviewer_evaluation_visits_by_governorate', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting reviewer evaluation visit by governorate:', error);
        return false;
    }
}

// ==================== Reviewer Evaluation Visits By Visit Type Functions ====================

export async function saveReviewerEvaluationVisitByType(
    visitData: Omit<ReviewerEvaluationVisitByType, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
    try {
        const visitRef = collection(db, 'reviewer_evaluation_visits_by_type');
        const docRef = await addDoc(visitRef, {
            ...visitData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving reviewer evaluation visit by type:', error);
        return null;
    }
}

export async function getReviewerEvaluationVisitsByType(month?: string): Promise<ReviewerEvaluationVisitByType[]> {
    try {
        const visitRef = collection(db, 'reviewer_evaluation_visits_by_type');
        let q = query(visitRef, orderBy('month', 'desc'));

        if (month) {
            q = query(visitRef, where('month', '==', month), orderBy('visitType', 'asc'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ReviewerEvaluationVisitByType));
    } catch (error) {
        console.error('Error getting reviewer evaluation visits by type:', error);
        return [];
    }
}

export async function updateReviewerEvaluationVisitByType(
    id: string,
    visitData: Partial<Omit<ReviewerEvaluationVisitByType, 'id' | 'createdAt' | 'createdBy'>>
): Promise<boolean> {
    try {
        const visitRef = doc(db, 'reviewer_evaluation_visits_by_type', id);
        await updateDoc(visitRef, {
            ...visitData,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating reviewer evaluation visit by type:', error);
        return false;
    }
}

export async function deleteReviewerEvaluationVisitByType(id: string): Promise<boolean> {
    try {
        const visitRef = doc(db, 'reviewer_evaluation_visits_by_type', id);
        await deleteDoc(visitRef);
        return true;
    } catch (error) {
        console.error('Error deleting reviewer evaluation visit by type:', error);
        return false;
    }
}

// ==================== Medical Professionals By Category Functions ====================

export async function saveMedicalProfessionalByCategory(
    data: Omit<MedicalProfessionalByCategory, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string | null> {
    try {
        const collectionRef = collection(db, 'medical_professionals_by_category');
        const docRef = await addDoc(collectionRef, {
            ...data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving medical professional by category:', error);
        return null;
    }
}

export async function getMedicalProfessionalsByCategory(month?: string): Promise<MedicalProfessionalByCategory[]> {
    try {
        const collectionRef = collection(db, 'medical_professionals_by_category');
        let q = query(collectionRef, orderBy('month', 'desc'));

        if (month) {
            q = query(collectionRef, where('month', '==', month), orderBy('branch', 'asc'));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MedicalProfessionalByCategory));
    } catch (error) {
        console.error('Error getting medical professionals by category:', error);
        return [];
    }
}

export async function updateMedicalProfessionalByCategory(
    id: string,
    data: Partial<Omit<MedicalProfessionalByCategory, 'id' | 'createdAt' | 'createdBy'>>
): Promise<boolean> {
    try {
        const docRef = doc(db, 'medical_professionals_by_category', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date()
        });
        return true;
    } catch (error) {
        console.error('Error updating medical professional by category:', error);
        return false;
    }
}

export async function deleteMedicalProfessionalByCategory(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, 'medical_professionals_by_category', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting medical professional by category:', error);
        return false;
    }
}


// Medical Professionals by Governorate CRUD
export async function saveMedicalProfessionalByGovernorate(data: Omit<MedicalProfessionalByGovernorate, 'id' | 'createdAt' | 'updatedAt'>): Promise<string | null> {
    try {
        const collectionRef = collection(db, 'medical_professionals_by_governorate');
        // Check for duplicates
        const q = query(
            collectionRef,
            where('month', '==', data.month),
            where('governorate', '==', data.governorate)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            console.error('Record already exists for this month and governorate');
            return null; // Handle duplicate appropriately
        }

        const docRef = await addDoc(collectionRef, {
            ...data,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving medical professional by governorate:', error);
        return null;
    }
}

export async function getMedicalProfessionalsByGovernorate(month?: string): Promise<MedicalProfessionalByGovernorate[]> {
    try {
        const collectionRef = collection(db, 'medical_professionals_by_governorate');
        let q;

        if (month) {
            q = query(collectionRef, where('month', '==', month), orderBy('governorate', 'asc'));
        } else {
            // Default to current year if no month specified or just get recent
            q = query(collectionRef, orderBy('month', 'desc'), orderBy('governorate', 'asc'), limit(100));
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as MedicalProfessionalByGovernorate));
    } catch (error) {
        console.error('Error fetching medical professionals by governorate:', error);
        return [];
    }
}

export async function updateMedicalProfessionalByGovernorate(id: string, data: Partial<MedicalProfessionalByGovernorate>): Promise<boolean> {
    try {
        const docRef = doc(db, 'medical_professionals_by_governorate', id);
        await updateDoc(docRef, {
            ...data,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating medical professional by governorate:', error);
        return false;
    }
}

export async function deleteMedicalProfessionalByGovernorate(id: string): Promise<boolean> {
    try {
        const docRef = doc(db, 'medical_professionals_by_governorate', id);
        await deleteDoc(docRef);
        return true;
    } catch (error) {
        console.error('Error deleting medical professional by governorate:', error);
        return false;
    }
}

// Training Entity Functions (الجهات الحاصلة على التدريب for dept1)
export async function saveTrainingEntity(
    entityData: Omit<TrainingEntity, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const entitiesRef = collection(db, 'training_entities');
        const docRef = await addDoc(entitiesRef, {
            ...entityData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving training entity:', error);
        return null;
    }
}

export async function getTrainingEntities(month?: string): Promise<TrainingEntity[]> {
    try {
        const entitiesRef = collection(db, 'training_entities');
        let q;

        if (month) {
            q = query(entitiesRef, where('month', '==', month));
        } else {
            q = query(entitiesRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let entities = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as TrainingEntity));

        if (month) {
            entities.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return entities;
    } catch (error) {
        console.error('Error getting training entities:', error);
        return [];
    }
}

export async function updateTrainingEntity(
    id: string,
    updates: Partial<TrainingEntity> & { updatedBy: string }
): Promise<boolean> {
    try {
        const entityRef = doc(db, 'training_entities', id);
        await setDoc(entityRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating training entity:', error);
        return false;
    }
}

export async function deleteTrainingEntity(id: string): Promise<boolean> {
    try {
        const entityRef = doc(db, 'training_entities', id);
        await deleteDoc(entityRef);
        return true;
    } catch (error) {
        console.error('Error deleting training entity:', error);
        return false;
    }
}


// Program Type Functions (نوع البرنامج for dept1)
export async function saveProgramType(
    programData: Omit<ProgramType, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const programsRef = collection(db, 'program_types');
        const docRef = await addDoc(programsRef, {
            ...programData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving program type:', error);
        return null;
    }
}

export async function getProgramTypes(month?: string): Promise<ProgramType[]> {
    try {
        const programsRef = collection(db, 'program_types');
        let q;

        if (month) {
            q = query(programsRef, where('month', '==', month));
        } else {
            q = query(programsRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let programs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as ProgramType));

        if (month) {
            programs.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return programs;
    } catch (error) {
        console.error('Error getting program types:', error);
        return [];
    }
}

export async function updateProgramType(
    id: string,
    updates: Partial<ProgramType> & { updatedBy: string }
): Promise<boolean> {
    try {
        const programRef = doc(db, 'program_types', id);
        await setDoc(programRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating program type:', error);
        return false;
    }
}

export async function deleteProgramType(id: string): Promise<boolean> {
    try {
        const programRef = doc(db, 'program_types', id);
        await deleteDoc(programRef);
        return true;
    } catch (error) {
        console.error('Error deleting program type:', error);
        return false;
    }
}

// Governorate Customer Survey Functions (استبيانات رضاء المتعاملين حسب المحافظة)
export async function saveGovernorateCustomerSurvey(
    surveyData: Omit<GovernorateCustomerSurvey, 'id' | 'createdAt' | 'updatedAt'> & { createdBy: string; updatedBy: string }
): Promise<string | null> {
    try {
        const surveysRef = collection(db, 'governorate_customer_surveys');
        const docRef = await addDoc(surveysRef, {
            ...surveyData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error saving governorate customer survey:', error);
        return null;
    }
}

export async function getGovernorateCustomerSurveys(month?: string): Promise<GovernorateCustomerSurvey[]> {
    try {
        const surveysRef = collection(db, 'governorate_customer_surveys');
        let q;

        if (month) {
            q = query(surveysRef, where('month', '==', month));
        } else {
            q = query(surveysRef, orderBy('createdAt', 'desc'));
        }

        const snapshot = await getDocs(q);
        let surveys = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as GovernorateCustomerSurvey));

        if (month) {
            surveys.sort((a, b) => {
                const aTime = a.createdAt?.getTime() || 0;
                const bTime = b.createdAt?.getTime() || 0;
                return bTime - aTime;
            });
        }

        return surveys;
    } catch (error) {
        console.error('Error getting governorate customer surveys:', error);
        return [];
    }
}

export async function updateGovernorateCustomerSurvey(
    id: string,
    updates: Partial<GovernorateCustomerSurvey> & { updatedBy: string }
): Promise<boolean> {
    try {
        const surveyRef = doc(db, 'governorate_customer_surveys', id);
        await setDoc(surveyRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating governorate customer survey:', error);
        return false;
    }
}

export async function deleteGovernorateCustomerSurvey(id: string): Promise<boolean> {
    try {
        const surveyRef = doc(db, 'governorate_customer_surveys', id);
        await deleteDoc(surveyRef);
        return true;
    } catch (error) {
        console.error('Error deleting governorate customer survey:', error);
        return false;
    }
}
