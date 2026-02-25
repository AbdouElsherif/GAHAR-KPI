import * as XLSX from 'xlsx';
import { db } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';

export const exportDepartmentDataToExcel = async (departmentId: string, departmentName: string, filterString: string) => {
    try {
        const workbook = XLSX.utils.book_new();

        if (departmentId === 'dept9') {
            await exportDept9Data(workbook, filterString);
        } else if (departmentId === 'dept2') {
            await exportDept2Data(workbook, filterString);
        } else if (departmentId === 'dept1') {
            await exportDept1Data(workbook, filterString);
        } else if (departmentId === 'dept3') {
            await exportDept3Data(workbook, filterString);
        } else if (departmentId === 'dept4') {
            await exportDept4Data(workbook, filterString);
        } else if (departmentId === 'dept5') {
            await exportDept5Data(workbook, filterString);
        } else if (departmentId === 'dept6') {
            await exportDept6Data(workbook, filterString);
        } else if (departmentId === 'dept7') {
            await exportDept7Data(workbook, filterString);
        } else if (departmentId === 'dept8') {
            await exportDept8Data(workbook, filterString);
        } else {
            alert(`التصدير غير مدعوم حالياً لهذه الإدارة.`);
            return;
        }

        // Add a cover sheet
        const coverData = [
            ['تقرير بيانات الإدارة'],
            ['الإدارة:', departmentName],
            ['الفترة:', getFilterDescription(filterString)],
            ['تاريخ التصدير:', format(new Date(), 'dd MMMM yyyy, hh:mm a', { locale: ar })]
        ];
        const coverWs = XLSX.utils.aoa_to_sheet(coverData);
        coverWs['!cols'] = [{ wch: 20 }, { wch: 40 }];
        // Add cover as the first sheet
        XLSX.utils.book_append_sheet(workbook, coverWs, 'معلومات التقرير');


        // Generate Excel file
        const fileName = `تقرير_${departmentName.replace(/\s+/g, '_')}_${filterString.replace(/[^a-zA-Z0-9-]/g, '_')}.xlsx`;
        XLSX.writeFile(workbook, fileName);

    } catch (error) {
        console.error('Error in exportDepartmentDataToExcel:', error);
        throw error;
    }
};

// --- Helper Functions ---

const getFilterDescription = (filterString: string): string => {
    if (filterString === 'ALL') return 'الكل (منذ البداية)';
    if (filterString.startsWith('Q')) return `الربع ${filterString.split('-')[0].replace('Q', '')} من عام ${filterString.split('-')[1]}`;
    if (filterString.startsWith('H')) return `النصف ${filterString.split('-')[0].replace('H', '')} من عام ${filterString.split('-')[1]}`;
    if (filterString.startsWith('Y-')) return `عام ${filterString.split('-')[1]}`;
    return `شهر ${filterString}`; // YYYY-MM
};

// Client-side filter for KPI data (since month field in kpis is stored unreliably)
// docDate is YYYY-MM format (from data.date field), filterString is the user selection
const matchesFilter = (docDate: string, filterString: string): boolean => {
    if (!filterString || filterString === 'ALL') return true;
    if (!docDate) return false;

    // Specific month: YYYY-MM
    if (filterString.match(/^\d{4}-\d{2}$/)) {
        return docDate === filterString;
    }

    // Year: Y-YYYY
    if (filterString.startsWith('Y-')) {
        const year = filterString.split('-')[1];
        return docDate.startsWith(year + '-');
    }

    // Quarter: Q1-YYYY etc.
    if (filterString.startsWith('Q')) {
        const quarter = parseInt(filterString.split('-')[0].replace('Q', ''));
        const year = filterString.split('-')[1];
        const month = parseInt(docDate.split('-')[1]);
        if (!docDate.startsWith(year + '-')) return false;
        if (quarter === 1) return month >= 1 && month <= 3;
        if (quarter === 2) return month >= 4 && month <= 6;
        if (quarter === 3) return month >= 7 && month <= 9;
        if (quarter === 4) return month >= 10 && month <= 12;
    }

    // Half-year: H1-YYYY etc.
    if (filterString.startsWith('H')) {
        const half = parseInt(filterString.split('-')[0].replace('H', ''));
        const year = filterString.split('-')[1];
        const month = parseInt(docDate.split('-')[1]);
        if (!docDate.startsWith(year + '-')) return false;
        if (half === 1) return month >= 1 && month <= 6;
        if (half === 2) return month >= 7 && month <= 12;
    }

    return true;
};

const applyFilterToQuery = (collectionRef: any, filterString: string, dateFieldName: string = 'month') => {
    if (filterString === 'ALL') return query(collectionRef);

    if (filterString.includes('-') && !filterString.startsWith('Q') && !filterString.startsWith('H') && !filterString.startsWith('Y')) {
        // YYYY-MM format
        return query(collectionRef, where(dateFieldName, '==', filterString));
    }

    if (filterString.startsWith('Y-')) {
        const year = filterString.split('-')[1];
        return query(collectionRef, where(dateFieldName, '>=', `${year}-01`), where(dateFieldName, '<=', `${year}-12`));
    }

    if (filterString.startsWith('Q')) {
        const quarter = parseInt(filterString.split('-')[0].replace('Q', ''));
        const year = filterString.split('-')[1];
        let startMonth = '', endMonth = '';
        if (quarter === 1) { startMonth = '01'; endMonth = '03'; }
        else if (quarter === 2) { startMonth = '04'; endMonth = '06'; }
        else if (quarter === 3) { startMonth = '07'; endMonth = '09'; }
        else if (quarter === 4) { startMonth = '10'; endMonth = '12'; }
        return query(collectionRef, where(dateFieldName, '>=', `${year}-${startMonth}`), where(dateFieldName, '<=', `${year}-${endMonth}`));
    }

    if (filterString.startsWith('H')) {
        const half = parseInt(filterString.split('-')[0].replace('H', ''));
        const year = filterString.split('-')[1];
        let startMonth = '', endMonth = '';
        if (half === 1) { startMonth = '01'; endMonth = '06'; }
        else if (half === 2) { startMonth = '07'; endMonth = '12'; }
        return query(collectionRef, where(dateFieldName, '>=', `${year}-${startMonth}`), where(dateFieldName, '<=', `${year}-${endMonth}`));
    }

    return query(collectionRef); // Fallback
};

// --- Department 9 Specific Export Logic ---
const exportDept9Data = async (workbook: XLSX.WorkBook, filterString: string) => {

    // 1. KPI Data (البيانات الرئيسية للإدارة 9)
    const kpiRef = collection(db, 'kpis');
    // Fetch all and filter client-side since 'month' field is not reliable (stored as number string "0","1"...)
    // The correct date is stored in data.date as YYYY-MM
    const kpiSnapshot = await getDocs(query(kpiRef));

    const kpiDataRaw = kpiSnapshot.docs
        .map(doc => doc.data() as any)
        .filter((data: any) => {
            if (data.departmentId !== 'dept9') return false;
            // Apply date filter based on data.date field
            const docDate = data.data?.date || '';
            return matchesFilter(docDate, filterString);
        });

    const kpiDataFormatted = kpiDataRaw.map((row: any) => {
        const d = row.data || {};
        return {
            'الشهر': d.date || row.month || 'غير محدد',
            'إجمالي الزيارات التقييمية': d.totalEvaluationVisits || 0,
            'عدد أيام التقييم': d.evaluationDays || 0,
            'زيارات محافظات التأمين الشامل': d.visitsToInsuranceGovernorate || 0,
            'زيارات المنشآت الحكومية': d.visitsToGovFacilities || 0,
            'زيارات منشآت القطاع الخاص': d.visitsToPrivateFacilities || 0,
            'زيارات منشآت وزارة الصحة': d.visitsToMOHFacilities || 0,
            'زيارات المنشآت الجامعية': d.visitsToUniFacilities || 0,
            'عدد لجان الاعتماد المنعقدة': d.accreditationCommittees || 0,
            'تقارير الزيارات المعروضة على اللجنة': d.reportsToCommittee || 0,
            'عدد الالتماسات المقدمة': d.appealsSubmitted || 0,
            'المعوقات': d.obstacles || 'لا يوجد',
            'مقترحات التطوير': d.developmentProposals || 'لا يوجد',
            'أنشطة إضافية': d.additionalActivities || 'لا يوجد',
            'ملاحظات': d.notes || 'لا يوجد'
        };
    });

    if (kpiDataFormatted.length > 0) {
        const wsKpi = XLSX.utils.json_to_sheet(kpiDataFormatted);
        XLSX.utils.book_append_sheet(workbook, wsKpi, 'مؤشرات الإدارة 9');
    }

    // 2. Reviewer Evaluation Visits (الزيارات التقييمية للمراجعين)
    const reviewerVisitsRef = collection(db, 'reviewerEvaluationVisits');
    const reviewerVisitsQ = applyFilterToQuery(reviewerVisitsRef, filterString);
    const reviewerVisitsSnapshot = await getDocs(reviewerVisitsQ);

    const reviewerVisitsData = reviewerVisitsSnapshot.docs.map(doc => doc.data() as any);
    const reviewerVisitsFormatted = reviewerVisitsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'نوع الزيارة التقييمية': row.visitType || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));

    if (reviewerVisitsFormatted.length > 0) {
        const wsReviewerVisits = XLSX.utils.json_to_sheet(reviewerVisitsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsReviewerVisits, 'الزيارات التقييمية حسب النوع');
    }

    // 3. Reports Presented to Committee (تقارير الزيارات المعروضة على اللجنة)
    const reportsToCommitteeRef = collection(db, 'reportsPresentedToCommittee');
    const reportsToCommitteeQ = applyFilterToQuery(reportsToCommitteeRef, filterString);
    const reportsToCommitteeSnapshot = await getDocs(reportsToCommitteeQ);

    const reportsToCommitteeData = reportsToCommitteeSnapshot.docs.map(doc => doc.data() as any);
    const reportsToCommitteeFormatted = reportsToCommitteeData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'عدد الزيارات المعروضة': row.reportsCount || 0,
    }));

    if (reportsToCommitteeFormatted.length > 0) {
        const wsReportsToCommittee = XLSX.utils.json_to_sheet(reportsToCommitteeFormatted);
        XLSX.utils.book_append_sheet(workbook, wsReportsToCommittee, 'التقارير المعروضة على اللجنة');
    }

    // 4. Reports By Facility Specialty (تقارير الزيارات حسب تخصص المنشأة)
    const reportsBySpecialtyRef = collection(db, 'reportsByFacilitySpecialty');
    const reportsBySpecialtyQ = applyFilterToQuery(reportsBySpecialtyRef, filterString);
    const reportsBySpecialtySnapshot = await getDocs(reportsBySpecialtyQ);

    const reportsBySpecialtyData = reportsBySpecialtySnapshot.docs.map(doc => doc.data() as any);
    const reportsBySpecialtyFormatted = reportsBySpecialtyData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'التخصص الدقيق': row.specialty || 'غير محدد',
        'عدد التقارير': row.reportsCount || 0,
    }));

    if (reportsBySpecialtyFormatted.length > 0) {
        const wsReportsBySpecialty = XLSX.utils.json_to_sheet(reportsBySpecialtyFormatted);
        XLSX.utils.book_append_sheet(workbook, wsReportsBySpecialty, 'التقارير حسب التخصص');
    }

    // 5. Accreditation Decisions (قرارات اللجنة العليا للاعتماد)
    const accreditationDecisionsRef = collection(db, 'accreditationDecisions');
    const accreditationDecisionsQ = applyFilterToQuery(accreditationDecisionsRef, filterString, 'decisionMonth'); // Note: Date field is decisionMonth here
    const accreditationDecisionsSnapshot = await getDocs(accreditationDecisionsQ);

    // Fallback parsing for `decisionDate` if `decisionMonth` (YYYY-MM) is missing or needs checking? They both exist but `decisionMonth` is what we added earlier.
    const accreditationDecisionsData = accreditationDecisionsSnapshot.docs.map(doc => doc.data() as any);
    const accreditationDecisionsFormatted = accreditationDecisionsData.map((row: any) => ({
        'شهر القرار': row.decisionMonth || 'غير محدد',
        'تاريخ التقييم / القرار': row.decisionDate || 'غير محدد',
        'القرار': row.decisionType || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'رقم القرار': row.decisionNumber || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));

    if (accreditationDecisionsFormatted.length > 0) {
        const wsAccreditationDecisions = XLSX.utils.json_to_sheet(accreditationDecisionsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsAccreditationDecisions, 'قرارات الاعتماد');
    }
};

// --- Department 2 Specific Export Logic ---
const exportDept2Data = async (workbook: XLSX.WorkBook, filterString: string) => {

    // 1. KPI Data (البيانات الرئيسية للإدارة 2)
    const kpiRef = collection(db, 'kpis');
    // Fetch all and filter client-side since 'month' field is not reliable
    const kpiSnapshot = await getDocs(query(kpiRef));

    const kpiDataRaw = kpiSnapshot.docs
        .map(doc => doc.data() as any)
        .filter((data: any) => {
            if (data.departmentId !== 'dept2') return false;
            const docDate = data.data?.date || '';
            return matchesFilter(docDate, filterString);
        });

    const kpiDataFormatted = kpiDataRaw.map((row: any) => {
        const d = row.data || {};
        return {
            'الشهر': (row.data || {}).date || row.month || 'غير محدد',
            'عدد برامج الدعم الفني': d.supportPrograms || 0,
            'زيارات تمهيدية': d.introVisits || 0,
            'زيارات دعم فني ميداني': d.fieldSupportVisits || 0,
            'زيارات دعم فني عن بعد': d.remoteSupportVisits || 0,
            'منشآت حصلت على الدعم الفني': d.supportedFacilities || 0,
            'عدد الزيارات الميدانية بقائمة الانتظار': d.queuedFieldVisits || 0,
            'عدد المحافظات المنفذ بها زيارات ميدانية': d.governoratesWithFieldVisits || 0,
            'عدد الإصدارات والتحديثات المنفذة لأدوات التقييم الذاتي': d.toolReleasesUpdates || 0,
            'نسبة استيفاء تقارير الدعم الفني وإرسالها للمنشآت خلال 15 يوما (%)': d.reportsComplianceRate || 0,
            'المعوقات': d.obstacles || 'لا يوجد',
            'مقترحات التطوير': d.developmentProposals || 'لا يوجد',
            'أنشطة إضافية': d.additionalActivities || 'لا يوجد',
            'ملاحظات': d.notes || 'لا يوجد'
        };
    });

    if (kpiDataFormatted.length > 0) {
        const wsKpi = XLSX.utils.json_to_sheet(kpiDataFormatted);
        XLSX.utils.book_append_sheet(workbook, wsKpi, 'مؤشرات الإدارة 2');
    }

    // 2. Technical Support Visits (زيارات الدعم الفني الميداني)
    const fieldVisitsRef = collection(db, 'technical_support_visits');
    const fieldVisitsQ = applyFilterToQuery(fieldVisitsRef, filterString);
    const fieldVisitsSnapshot = await getDocs(fieldVisitsQ);

    const fieldVisitsData = fieldVisitsSnapshot.docs.map(doc => doc.data() as any);
    const fieldVisitsFormatted = fieldVisitsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
        'الجهة التابعة لها المنشأة': row.affiliatedEntity || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
    }));

    if (fieldVisitsFormatted.length > 0) {
        const wsFieldVisits = XLSX.utils.json_to_sheet(fieldVisitsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsFieldVisits, 'الزيارات الميدانية');
    }

    // 3. Remote Technical Support (الدعم الفني عن بعد)
    const remoteVisitsRef = collection(db, 'remote_technical_supports');
    const remoteVisitsQ = applyFilterToQuery(remoteVisitsRef, filterString);
    const remoteVisitsSnapshot = await getDocs(remoteVisitsQ);

    const remoteVisitsData = remoteVisitsSnapshot.docs.map(doc => doc.data() as any);
    const remoteVisitsFormatted = remoteVisitsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
        'الجهة التابعة لها المنشأة': row.affiliatedEntity || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
    }));

    if (remoteVisitsFormatted.length > 0) {
        const wsRemoteVisits = XLSX.utils.json_to_sheet(remoteVisitsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsRemoteVisits, 'الدعم الفني عن بعد');
    }

    // 4. Introductory Support Visits (الزيارات التمهيدية)
    const introVisitsRef = collection(db, 'introductory_support_visits');
    const introVisitsQ = applyFilterToQuery(introVisitsRef, filterString);
    const introVisitsSnapshot = await getDocs(introVisitsQ);

    const introVisitsData = introVisitsSnapshot.docs.map(doc => doc.data() as any);
    const introVisitsFormatted = introVisitsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
        'الجهة التابعة لها المنشأة': row.affiliatedEntity || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
    }));

    if (introVisitsFormatted.length > 0) {
        const wsIntroVisits = XLSX.utils.json_to_sheet(introVisitsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsIntroVisits, 'الزيارات التمهيدية');
    }

    // 5. Queued Support Visits (الزيارات بقائمة الانتظار)
    const queuedVisitsRef = collection(db, 'queued_support_visits'); // Note: Make sure 'queued_support_visits' is the right name in DB, assumed based on pattern.
    const queuedVisitsQ = applyFilterToQuery(queuedVisitsRef, filterString);
    const queuedVisitsSnapshot = await getDocs(queuedVisitsQ);

    const queuedVisitsData = queuedVisitsSnapshot.docs.map(doc => doc.data() as any);
    const queuedVisitsFormatted = queuedVisitsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));

    if (queuedVisitsFormatted.length > 0) {
        const wsQueuedVisits = XLSX.utils.json_to_sheet(queuedVisitsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsQueuedVisits, 'قائمة الانتظار');
    }

    // 6. Scheduled Support Visits (الزيارات المجدولة)
    const scheduledVisitsRef = collection(db, 'scheduled_support_visits');
    const scheduledVisitsQ = applyFilterToQuery(scheduledVisitsRef, filterString);
    const scheduledVisitsSnapshot = await getDocs(scheduledVisitsQ);

    const scheduledVisitsData = scheduledVisitsSnapshot.docs.map(doc => doc.data() as any);
    const scheduledVisitsFormatted = scheduledVisitsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
    }));

    if (scheduledVisitsFormatted.length > 0) {
        const wsScheduledVisits = XLSX.utils.json_to_sheet(scheduledVisitsFormatted);
        XLSX.utils.book_append_sheet(workbook, wsScheduledVisits, 'الزيارات المجدولة');
    }

    // 7. Accredited Supported Facilities (المنشآت المعتمدة الممدعمة)
    const accreditedFacilitiesRef = collection(db, 'accredited_supported_facilities');
    const accreditedFacilitiesQ = applyFilterToQuery(accreditedFacilitiesRef, filterString);
    const accreditedFacilitiesSnapshot = await getDocs(accreditedFacilitiesQ);

    const accreditedFacilitiesData = accreditedFacilitiesSnapshot.docs.map(doc => doc.data() as any);
    const accreditedFacilitiesFormatted = accreditedFacilitiesData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'رقم القرار': row.decisionNumber || 'غير محدد',
        'تاريخ القرار': row.decisionDate || 'غير محدد',
        'نوع الدعم': row.supportType || 'غير محدد',
        'موقف الاعتماد': row.accreditationStatus || 'غير محدد',
    }));

    if (accreditedFacilitiesFormatted.length > 0) {
        const wsAccreditedFacilities = XLSX.utils.json_to_sheet(accreditedFacilitiesFormatted);
        XLSX.utils.book_append_sheet(workbook, wsAccreditedFacilities, 'المنشآت المعتمدة');
    }
};

// --- Generic KPI Export Helper ---
const exportGenericKpiData = async (
    workbook: XLSX.WorkBook,
    filterString: string,
    departmentId: string,
    sheetName: string,
    fieldMap: Record<string, string>
) => {
    const kpiRef = collection(db, 'kpis');
    // Fetch all and filter client-side since 'month' field is stored as a number string, not YYYY-MM
    const kpiSnapshot = await getDocs(query(kpiRef));

    const kpiDataRaw = kpiSnapshot.docs
        .map(doc => doc.data() as any)
        .filter((data: any) => {
            if (data.departmentId !== departmentId) return false;
            const docDate = data.data?.date || '';
            return matchesFilter(docDate, filterString);
        });

    const kpiDataFormatted = kpiDataRaw.map((row: any) => {
        const dataFields = row.data || {};
        const result: Record<string, any> = { 'الشهر': dataFields.date || row.month || 'غير محدد' };
        // Map nested "data" field fields (skip 'date' since we already handle it)
        for (const [field, label] of Object.entries(fieldMap)) {
            if (field === 'date') continue;
            result[label as string] = dataFields[field] ?? row[field] ?? '';
        }
        return result;
    });

    if (kpiDataFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(kpiDataFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, sheetName);
    }
};

// --- Department 1 (الإدارة العامة للتدريب للغير) ---
const exportDept1Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept1', 'المؤشرات الرئيسية', {
        trainingPrograms: 'عدد البرامج التدريبية',
        trainees: 'عدد المتدربين',
        activitySummary: 'ملخص أنشطة الإدارة',
        activityDetails: 'تفاصيل أنشطة الإدارة',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'أنشطة إضافية',
        notes: 'ملاحظات',
    });

    // Training entities (الجهات الحاصلة على التدريب)
    const trainingEntitiesRef = collection(db, 'training_entities');
    const trainingEntitiesQ = applyFilterToQuery(trainingEntitiesRef, filterString);
    const trainingEntitiesSnapshot = await getDocs(trainingEntitiesQ);
    const trainingEntitiesData = trainingEntitiesSnapshot.docs.map(doc => doc.data() as any);
    const trainingEntitiesFormatted = trainingEntitiesData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم الجهة': row.entityName || 'غير محدد',
        'عدد المتدربين': row.traineesCount || 0,
    }));
    if (trainingEntitiesFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(trainingEntitiesFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'الجهات الحاصلة على التدريب');
    }

    // Program types (نوع البرنامج)
    const programTypesRef = collection(db, 'program_types');
    const programTypesQ = applyFilterToQuery(programTypesRef, filterString);
    const programTypesSnapshot = await getDocs(programTypesQ);
    const programTypesData = programTypesSnapshot.docs.map(doc => doc.data() as any);
    const programTypesFormatted = programTypesData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'برامج تدريب': row.trainingPrograms || 0,
        'برامج توعية': row.awarenessPrograms || 0,
        'ورش عمل': row.workshops || 0,
    }));
    if (programTypesFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(programTypesFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'أنواع البرامج');
    }
};

// --- Department 3 (الإدارة العامة لرضاء المتعاملين) ---
const exportDept3Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept3', 'المؤشرات الرئيسية', {
        patientExperienceSample: 'حجم عينة قياس تجربة مريض',
        staffSatisfactionSample: 'حجم عينة قياس رضاء العاملين',
        fieldVisits: 'عدد الزيارات الميدانية لاستبيان رضاء المتعاملين',
        surveyedFacilities: 'عدد المنشآت التي تم إجراء استبيانات بها',
        visitedGovernorates: 'محافظات تمت زيارتها',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'أنشطة إضافية',
        notes: 'ملاحظات',
    });

    // Governorate customer surveys
    const govSurveysRef = collection(db, 'governorate_customer_surveys');
    const govSurveysQ = applyFilterToQuery(govSurveysRef, filterString);
    const govSurveysSnapshot = await getDocs(govSurveysQ);
    const govSurveysData = govSurveysSnapshot.docs.map(doc => doc.data() as any);
    const govSurveysFormatted = govSurveysData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'نسبة تنفيذ الزيارات': row.visitImplementationRate || 0,
        'عدد المنشآت': row.facilitiesCount || 0,
        'عدد استبيانات قياس تجربة المريض': row.patientSurveysCount || 0,
        'عدد استبيانات مقدمي الخدمة والعاملين': row.staffSurveysCount || 0,
        'نسبة قياس رضاء المريض': row.patientSatisfactionRate || 0,
        'نسبة قياس رضاء العاملين': row.staffSatisfactionRate || 0,
    }));
    if (govSurveysFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(govSurveysFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'استبيانات المحافظات');
    }
};

// --- Department 4 (الإدارة العامة للرقابة الفنية والإكلينيكية) ---
const exportDept4Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept4', 'المؤشرات الرئيسية', {
        totalFieldVisits: 'إجمالي الزيارات الميدانية للرقابة الفنية والإكلينيكية',
        auditVisits: 'زيارات التدقيق الفني والإكلينيكي',
        assessmentVisits: 'زيارات التقييم الفني والإكلينيكي',
        visitedFacilities: 'عدد المنشآت الصحية التي تم إجراء زيارات رقابة فنية وإكلينيكية لها',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'أنشطة إضافية',
        notes: 'ملاحظات',
    });

    // Technical/Clinical Facilities
    const tcFacilitiesRef = collection(db, 'technical_clinical_facilities');
    const tcFacilitiesQ = applyFilterToQuery(tcFacilitiesRef, filterString);
    const tcFacilitiesSnapshot = await getDocs(tcFacilitiesQ);
    const tcFacilitiesData = tcFacilitiesSnapshot.docs.map(doc => doc.data() as any);
    const tcFacilitiesFormatted = tcFacilitiesData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
        'نوع التقييم': row.assessmentType || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));
    if (tcFacilitiesFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(tcFacilitiesFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'المنشآت الفنية والإكلينيكية');
    }

    // Technical/Clinical Observations
    const tcObsRef = collection(db, 'technical_clinical_observations');
    const tcObsQ = applyFilterToQuery(tcObsRef, filterString);
    const tcObsSnapshot = await getDocs(tcObsQ);
    const tcObsData = tcObsSnapshot.docs.map(doc => doc.data() as any);
    const tcObsFormatted = tcObsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'الجهة التابعة': row.entityType || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'الملاحظة': row.observation || 'غير محدد',
        'النسبة (%)': row.percentage || 0,
    }));
    if (tcObsFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(tcObsFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'الملاحظات الفنية والإكلينيكية');
    }
};

// --- Department 5 (الإدارة العامة للرقابة الإدارية) ---
const exportDept5Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept5', 'المؤشرات الرئيسية', {
        totalFieldVisits: 'إجمالي الزيارات الميدانية',
        adminAuditVisits: 'تدقيق إداري وسلامة بيئية',
        adminInspectionVisits: 'تفتيش إداري',
        followUpVisits: 'زيارات متابعة',
        examReferralVisits: 'فحص / إحالة / تكليف',
        visitedFacilities: 'عدد المنشآت التي تم زيارتها',
        seriousIncidentExam: 'فحص حدث جسيم',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'أنشطة إضافية',
        notes: 'ملاحظات',
    });

    // Admin Audit Facilities
    const adminFacRef = collection(db, 'admin_audit_facilities');
    const adminFacQ = applyFilterToQuery(adminFacRef, filterString);
    const adminFacSnapshot = await getDocs(adminFacQ);
    const adminFacData = adminFacSnapshot.docs.map(doc => doc.data() as any);
    const adminFacFormatted = adminFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));
    if (adminFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(adminFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'منشآت الرقابة الإدارية');
    }

    // Admin Audit Observations
    const adminObsRef = collection(db, 'admin_audit_observations');
    const adminObsQ = applyFilterToQuery(adminObsRef, filterString);
    const adminObsSnapshot = await getDocs(adminObsQ);
    const adminObsData = adminObsSnapshot.docs.map(doc => doc.data() as any);
    const adminObsFormatted = adminObsData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'الجهة التابعة': row.entityType || 'غير محدد',
        'نوع المنشأة': row.facilityType || 'غير محدد',
        'الملاحظة': row.observation || 'غير محدد',
        'النسبة (%)': row.percentage || 0,
    }));
    if (adminObsFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(adminObsFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'الملاحظات الإدارية');
    }

    // Observation correction rates
    const corrRateRef = collection(db, 'observation_correction_rates');
    const corrRateQ = applyFilterToQuery(corrRateRef, filterString);
    const corrRateSnapshot = await getDocs(corrRateQ);
    const corrRateData = corrRateSnapshot.docs.map(doc => doc.data() as any);
    const corrRateFormatted = corrRateData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'الجهة': row.entityType || 'غير محدد',
        'الفئة': row.facilityCategory || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'تاريخ الزيارة': row.visitDate || 'غير محدد',
        'نوع الزيارة': row.visitType || 'غير محدد',
    }));
    if (corrRateFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(corrRateFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'نسب تصحيح الملاحظات');
    }
};

// --- Department 6 (الإدارة العامة للاعتماد) ---
const exportDept6Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept6', 'المؤشرات الرئيسية', {
        newFacilities: 'عدد المنشآت الجديدة المتقدمة للتسجيل',
        reviewedAppeals: 'عدد الالتماسات التي تمت مراجعتها',
        reviewedPlans: 'عدد الخطط التصحيحية التي تمت مراجعتها',
        accreditation: 'الاعتماد/ الاعتماد المبدئي',
        renewal: 'تجديد الاعتماد',
        completion: 'استكمال الاعتماد',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'أنشطة إضافية',
        notes: 'ملاحظات',
    });

    // Accreditation Facilities
    const accFacRef = collection(db, 'accreditation_facilities');
    const accFacQ = applyFilterToQuery(accFacRef, filterString);
    const accFacSnapshot = await getDocs(accFacQ);
    const accFacData = accFacSnapshot.docs.map(doc => doc.data() as any);
    const accFacFormatted = accFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'الجهة التابعة': row.affiliation || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
        'المعايير': row.standards || 'غير محدد',
    }));
    if (accFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(accFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'منشآت الاعتماد');
    }

    // Completion Facilities
    const compFacRef = collection(db, 'completion_facilities');
    const compFacQ = applyFilterToQuery(compFacRef, filterString);
    const compFacSnapshot = await getDocs(compFacQ);
    const compFacData = compFacSnapshot.docs.map(doc => doc.data() as any);
    const compFacFormatted = compFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
    }));
    if (compFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(compFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'منشآت الاستكمال');
    }

    // Payment Facilities
    const payFacRef = collection(db, 'payment_facilities');
    const payFacQ = applyFilterToQuery(payFacRef, filterString);
    const payFacSnapshot = await getDocs(payFacQ);
    const payFacData = payFacSnapshot.docs.map(doc => doc.data() as any);
    const payFacFormatted = payFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
    }));
    if (payFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(payFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'منشآت السداد');
    }

    // Corrective Plan Facilities
    const corrFacRef = collection(db, 'corrective_plan_facilities');
    const corrFacQ = applyFilterToQuery(corrFacRef, filterString);
    const corrFacSnapshot = await getDocs(corrFacQ);
    const corrFacData = corrFacSnapshot.docs.map(doc => doc.data() as any);
    const corrFacFormatted = corrFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));
    if (corrFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(corrFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'خطط التصحيح');
    }

    // Basic Requirements Facilities
    const basicFacRef = collection(db, 'basic_requirements_facilities');
    const basicFacQ = applyFilterToQuery(basicFacRef, filterString);
    const basicFacSnapshot = await getDocs(basicFacQ);
    const basicFacData = basicFacSnapshot.docs.map(doc => doc.data() as any);
    const basicFacFormatted = basicFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));
    if (basicFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(basicFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'المنشآت الأساسية');
    }

    // Appeals Facilities
    const appealsFacRef = collection(db, 'appeals_facilities');
    const appealsFacQ = applyFilterToQuery(appealsFacRef, filterString);
    const appealsFacSnapshot = await getDocs(appealsFacQ);
    const appealsFacData = appealsFacSnapshot.docs.map(doc => doc.data() as any);
    const appealsFacFormatted = appealsFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
    }));
    if (appealsFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(appealsFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'الالتماسات');
    }

    // Paid Facilities
    const paidFacRef = collection(db, 'paid_facilities');
    const paidFacQ = applyFilterToQuery(paidFacRef, filterString);
    const paidFacSnapshot = await getDocs(paidFacQ);
    const paidFacData = paidFacSnapshot.docs.map(doc => doc.data() as any);
    const paidFacFormatted = paidFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
        'المبلغ': row.amount || 0,
    }));
    if (paidFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(paidFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'المنشآت المدفوعة');
    }

    // Committee Preparation Facilities
    const commFacRef = collection(db, 'committee_preparation_facilities');
    const commFacQ = applyFilterToQuery(commFacRef, filterString);
    const commFacSnapshot = await getDocs(commFacQ);
    const commFacData = commFacSnapshot.docs.map(doc => doc.data() as any);
    const commFacFormatted = commFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
    }));
    if (commFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(commFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'التجهيز للعرض على اللجنة');
    }

    // Certificate Issuance Facilities
    const certFacRef = collection(db, 'certificate_issuance_facilities');
    const certFacQ = applyFilterToQuery(certFacRef, filterString);
    const certFacSnapshot = await getDocs(certFacQ);
    const certFacData = certFacSnapshot.docs.map(doc => doc.data() as any);
    const certFacFormatted = certFacData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
    }));
    if (certFacFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(certFacFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'إصدار الشهادات');
    }
};

// --- Department 7 (الإدارة العامة للمهن الطبية) ---
const exportDept7Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept7', 'المؤشرات الرئيسية', {
        registeredMembers: 'عدد أعضاء المهن الطبية المسجلين خلال الشهر',
        updatedMembers: 'عدد أعضاء المهن الطبية المحدث بياناتهم',
        facilitiesRegistered: 'عدد المنشآت التي تم تسجيل أعضاء المهن الطبية بها',
        facilitiesUpdated: 'عدد المنشآت التي تم تحديث أعضاء المهن الطبية بها',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'ملخص التقرير الشهري',
        notes: 'ملاحظات',
    });

    // Medical Professionals by Category
    const medCatRef = collection(db, 'medical_professionals_by_category');
    const medCatQ = applyFilterToQuery(medCatRef, filterString);
    const medCatSnapshot = await getDocs(medCatQ);
    const medCatData = medCatSnapshot.docs.map(doc => doc.data() as any);
    const medCatFormatted = medCatData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'الفرع': row.branch || 'غير محدد',
        'أطباء بشريين': row.doctors || 0,
        'أطباء أسنان': row.dentists || 0,
        'صيادلة': row.pharmacists || 0,
        'علاج طبيعي': row.physiotherapy || 0,
        'بيطريين': row.veterinarians || 0,
        'تمريض عالي': row.seniorNursing || 0,
        'فني تمريض': row.technicalNursing || 0,
        'فني صحي': row.healthTechnician || 0,
        'علميين': row.scientists || 0,
        'الإجمالي': row.total || 0,
    }));
    if (medCatFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(medCatFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'أعضاء المهن حسب الفئة');
    }

    // Medical Professionals by Governorate
    const medGovRef = collection(db, 'medical_professionals_by_governorate');
    const medGovQ = applyFilterToQuery(medGovRef, filterString);
    const medGovSnapshot = await getDocs(medGovQ);
    const medGovData = medGovSnapshot.docs.map(doc => doc.data() as any);
    const medGovFormatted = medGovData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'أطباء بشريين': row.doctors || 0,
        'أطباء أسنان': row.dentists || 0,
        'صيادلة': row.pharmacists || 0,
        'علاج طبيعي': row.physiotherapy || 0,
        'بيطريين': row.veterinarians || 0,
        'تمريض عالي': row.seniorNursing || 0,
        'فني تمريض': row.technicalNursing || 0,
        'فني صحي': row.healthTechnician || 0,
        'علميين': row.scientists || 0,
        'الإجمالي': row.total || 0,
    }));
    if (medGovFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(medGovFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'أعضاء المهن حسب المحافظة');
    }

    // Medical Professional Registrations
    const medRegRef = collection(db, 'medical_professional_registrations');
    const medRegQ = applyFilterToQuery(medRegRef, filterString);
    const medRegSnapshot = await getDocs(medRegQ);
    const medRegData = medRegSnapshot.docs.map(doc => doc.data() as any);
    const medRegFormatted = medRegData.map((row: any) => ({
        'الشهر': row.month || 'غير محدد',
        'اسم المنشأة': row.facilityName || 'غير محدد',
        'المحافظة': row.governorate || 'غير محدد',
        'حالة الاعتماد': row.accreditationStatus || 'غير محدد',
    }));
    if (medRegFormatted.length > 0) {
        const ws = XLSX.utils.json_to_sheet(medRegFormatted);
        XLSX.utils.book_append_sheet(workbook, ws, 'تسجيلات المهن الطبية');
    }
};

// --- Department 8 (الإدارة العامة لأبحاث وتطوير المعايير) ---
const exportDept8Data = async (workbook: XLSX.WorkBook, filterString: string) => {
    await exportGenericKpiData(workbook, filterString, 'dept8', 'المؤشرات الرئيسية', {
        standard1: 'معايير دور النقاهة والرعاية الممتدة',
        standard2: 'معايير السياحة الاستشفائية',
        standard3: 'معايير الرعاية الأولية (إصدار 2025)',
        standard4: 'الدليل الاسترشادي للتجهيزات الطبية للمستشفيات',
        standard5: 'معايير المستشفيات (إصدار 2025)',
        standard6: 'معايير التميز للمنشآت الصديقة للأم والطفل',
        standard7: 'معايير المعامل الإكلينيكية',
        standard8: 'معايير المراكز الطبية المتخصصة وجراحات اليوم الواحد',
        standard9: 'معايير الأشعة العلاجية التداخلية والتشخيصية',
        standard10: 'معايير مكاتب الصحة المستقلة',
        standard11: 'معايير مكاتب الصحة النفسية (الإصدار الثاني)',
        standard12: 'معايير التميز الإكلينيكي',
        standard13: 'معايير بنوك الدم',
        standard14: 'معايير التطبيب عن بعد',
        standard15: 'دليل المراجعين',
        standard16: 'معايير العلاج الطبيعي (الإصدار الثاني)',
        activitySummary: 'ملخص أنشطة الإدارة',
        activityDetails: 'تفاصيل أنشطة الإدارة',
        obstacles: 'المعوقات',
        developmentProposals: 'مقترحات التطوير',
        additionalActivities: 'أنشطة إضافية',
        notes: 'ملاحظات',
    });
};

