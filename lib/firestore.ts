import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, Timestamp, addDoc, deleteDoc } from 'firebase/firestore';
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
