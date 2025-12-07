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
