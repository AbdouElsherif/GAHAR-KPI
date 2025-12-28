// types/moh-kpi.ts
export interface MOHQuarterData {
    target: number | string;
    achieved: number | string;
}

export interface MOHKPI {
    id: string;
    name: string;
    unit: string;
    fiscalYear: string;
    q1: MOHQuarterData;
    q2: MOHQuarterData;
    q3: MOHQuarterData;
    q4: MOHQuarterData;
}
