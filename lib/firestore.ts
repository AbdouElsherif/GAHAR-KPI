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
        const snapshot = await getDocs(mohKPIRef);

        let kpis = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        } as MOHKPI));

        // Filter by fiscal year if provided
        if (fiscalYear) {
            kpis = kpis.filter(kpi => kpi.fiscalYear === fiscalYear);
        }

        // Sort by name
        kpis.sort((a, b) => a.name.localeCompare(b.name, 'ar'));

        return kpis;
    } catch (error) {
        console.error('Error getting MOH KPIs:', error);
        return [];
    }
}

export async function updateMOHKPI(id: string, updates: Partial<MOHKPI> & { updatedBy: string }): Promise<boolean> {
    try {
        const mohKPIRef = doc(db, 'moh_kpis', id);
        await setDoc(mohKPIRef, {
            ...updates,
            updatedAt: Timestamp.now()
        }, { merge: true });
        return true;
    } catch (error) {
        console.error('Error updating MOH KPI:', error);
        return false;
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