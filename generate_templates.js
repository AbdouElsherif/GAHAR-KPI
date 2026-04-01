const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'نماذج_استيراد_dept4');
if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

function colIndexToLetter(index) {
    let letter = '';
    let i = index;
    while (i >= 0) {
        letter = String.fromCharCode((i % 26) + 65) + letter;
        i = Math.floor(i / 26) - 1;
    }
    return letter;
}

function createTemplate(name, columns) {
    const wb = XLSX.utils.book_new();
    const MAX_DATA_ROWS = 500;

    const headers = columns.map(c => c.header);
    const example = columns.map(c => {
        if (c.type === 'month') return '2025-03';
        if (c.type === 'date') return '2025-03-15';
        if (c.type === 'percentage') return '85';
        if (c.type === 'number') return '0';
        if (c.validValues && c.validValues.length) return c.validValues[0];
        return '';
    });

    // Main data sheet
    const ws = XLSX.utils.aoa_to_sheet([headers, example]);
    ws['!cols'] = columns.map(c => ({ wch: Math.max((c.header || '').length * 2, 15) }));

    // Find columns with valid values (for dropdown lists)
    const columnsWithLists = columns
        .map((c, idx) => ({ col: c, idx }))
        .filter(({ col }) => col.validValues && col.validValues.length > 0);

    if (columnsWithLists.length > 0) {
        // Build "القوائم" (Lists) sheet
        const maxLen = Math.max(...columnsWithLists.map(({ col }) => col.validValues.length));
        const listsData = [];
        listsData.push(columnsWithLists.map(({ col }) => col.header));
        for (let r = 0; r < maxLen; r++) {
            listsData.push(columnsWithLists.map(({ col }) => col.validValues[r] || ''));
        }
        const listsWs = XLSX.utils.aoa_to_sheet(listsData);
        listsWs['!cols'] = columnsWithLists.map(() => ({ wch: 35 }));
        XLSX.utils.book_append_sheet(wb, listsWs, 'القوائم');

        // Add data validation (dropdown) to main sheet
        const dataValidation = [];
        columnsWithLists.forEach(({ col, idx }, listColIdx) => {
            const dataColLetter = colIndexToLetter(idx);
            const listColLetter = colIndexToLetter(listColIdx);
            const listLength = col.validValues.length;

            dataValidation.push({
                type: 'list',
                sqref: `${dataColLetter}2:${dataColLetter}${MAX_DATA_ROWS + 1}`,
                formula1: `'القوائم'!$${listColLetter}$2:$${listColLetter}$${listLength + 1}`,
                showInputMessage: true,
                promptTitle: col.header,
                prompt: `اختر ${col.header} من القائمة`,
                showErrorMessage: true,
                errorStyle: 'warning',
                errorTitle: 'تنبيه',
                error: 'يفضل اختيار قيمة من القائمة المنسدلة'
            });
        });

        ws['!dataValidation'] = dataValidation;
    }

    // Add main data sheet AFTER lists sheet so lists is created first
    XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

    // Hints sheet
    const hintsHeader = ['الحقل', 'مطلوب؟', 'النوع', 'القيم المقبولة'];
    const hintsData = columns.map(c => [
        c.header,
        c.required ? 'نعم ✅' : 'لا',
        c.type === 'month' ? 'شهر (YYYY-MM)' :
            c.type === 'percentage' ? 'نسبة مئوية (0-100)' :
                c.type === 'date' ? 'تاريخ (YYYY-MM-DD)' :
                    c.type === 'number' ? 'رقم' : 'نص',
        c.validValues ? c.validValues.join(' | ') : 'أي قيمة'
    ]);
    const wsHints = XLSX.utils.aoa_to_sheet([hintsHeader, ...hintsData]);
    wsHints['!cols'] = [{ wch: 25 }, { wch: 10 }, { wch: 25 }, { wch: 60 }];
    XLSX.utils.book_append_sheet(wb, wsHints, 'تعليمات');

    const filePath = path.join(dir, 'نموذج_' + name + '.xlsx');
    XLSX.writeFile(wb, filePath);
    console.log('  ✅ ' + name + '.xlsx');
}

// ============================================================
// Data Definitions
const visitTypes = ['التدقيق الفني والإكلينيكي', 'التقييم الفني والإكلينيكي'];
const tcVisitTypes = ['تقييم فني وإكلينيكي', 'تدقيق فني وإكلينيكي'];

// Section 1 Dropdowns
const section1FacilityTypes = [
    'مستشفى', 'صيدلية', 'مراكز الرعاية الأولية', 'معمل', 'مركز أشعة', 
    'مراكز طبية', 'مستشفى صحة نفسية', 'عيادات طبية', 'مراكز علاج طبيعي'
];

// Section 2 Dropdowns
const section2EntityTypes = [
    'المنشآت الصحية التابعة لهيئة الرعاية الصحية',
    'منشآت تابعة لوزارة الصحة',
    'منشآت تابعة لجهات أخرى'
];
const section2FacilityTypes = [
    'مراكز ووحدات الرعاية الأولية', 'مستشفيات', 'مراكز طبية', 'معامل', 
    'مراكز الأشعة', 'مراكز علاج طبيعي', 'مستشفيات صحة نفسية', 'صيدليات'
];

// Section 3 Dropdowns
const section3EntityTypes = [
    'المنشآت الصحية التابعة لهيئة الرعاية',
    'المنشآت الصحية التابعة لوزارة الصحة',
    'منشآت صحية أخرى'
];
const section3FacilityCategories = [
    'مراكز ووحدات الرعاية الأولية', 'مستشفى', 'صيدلية', 'معمل',
    'مراكز أشعة', 'مراكز طبية', 'مراكز علاج طبيعي', 'عيادات طبية',
    'مستشفى صحة نفسية'
];

const gov = [
    'القاهرة', 'الإسكندرية', 'بورسعيد', 'السويس', 'الإسماعيلية',
    'دمياط', 'الدقهلية', 'الشرقية', 'القليوبية', 'كفر الشيخ',
    'الغربية', 'المنوفية', 'البحيرة', 'الفيوم', 'بني سويف',
    'المنيا', 'أسيوط', 'سوهاج', 'قنا', 'الأقصر', 'أسوان',
    'مطروح', 'الوادي الجديد', 'البحر الأحمر', 'شمال سيناء', 'جنوب سيناء'
];

// ============================================================
// Generate Templates
// ============================================================

console.log('\n📁 إنشاء نماذج الإكسل مع قوائم منسدلة...\n');

// 1. المنشآت التي تم زيارتها
createTemplate('المنشآت_التي_تم_زيارتها', [
    { header: 'الشهر', type: 'month', required: true },
    { header: 'نوع المنشأة', type: 'string', required: true, validValues: section1FacilityTypes },
    { header: 'اسم المنشأة', type: 'string', required: true },
    { header: 'الجهة الحاكمة', type: 'string', required: true, validValues: [
        'هيئة الرعاية الصحية', 'وزارة الصحة', 'قطاع خاص',
        'الهيئة العامة للمستشفيات والمعاهد التعليمية', 'هيئة قناة السويس',
        'جامعية', 'جمعيات أهلية', 'أمانة المراكز الطبية المتخصصة',
        'الهيئة العامة للتأمين الصحي', 'الهيئة القومية لسكك حديد مصر',
        'قطاع أعمال', 'وزارة الداخلية قطاع الخدمات الطبية',
        'القوات المسلحة', 'جهات سيادية'
    ] },
    { header: 'نوع الزيارة', type: 'string', required: true, validValues: visitTypes },
    { header: 'نوع التقييم', type: 'string', required: false },
    { header: 'المحافظة', type: 'string', required: true, validValues: gov }
]);

// 2. الملاحظات المتكررة
createTemplate('الملاحظات_المتكررة', [
    { header: 'الشهر', type: 'month', required: true },
    { header: 'الجهة التابعة', type: 'string', required: true, validValues: section2EntityTypes },
    { header: 'نوع المنشأة', type: 'string', required: true, validValues: section2FacilityTypes },
    { header: 'اسم المنشأة', type: 'string', required: true },
    { header: 'الملاحظة', type: 'string', required: true },
    { header: 'النسبة (%)', type: 'percentage', required: true }
]);

// 3. نسب تصحيح الملاحظات
const tcStandardCodes = ['act', 'icd', 'das', 'mms', 'sip', 'ipc', 'scm', 'tex', 'teq', 'tpo', 'nsr', 'sas', 'irs', 'mrs', 'cps', 'lpr', 'lep', 'lpo', 'lqc', 'css'];
const tcStandardNames = {
    act: 'ACT', icd: 'ICD', das: 'DAS', mms: 'MMS', sip: 'SIP',
    ipc: 'IPC', scm: 'SCM', tex: 'TEX', teq: 'TEQ', tpo: 'TPO',
    nsr: 'NSR', sas: 'SAS', irs: 'IRS', mrs: 'MRS', cps: 'CPS',
    lpr: 'LPR', lep: 'LEP', lpo: 'LPO', lqc: 'LQC', css: 'CSS'
};

let tcCols = [
    { header: 'الشهر', required: true, type: 'month' },
    { header: 'الجهة', required: true, type: 'string', validValues: section3EntityTypes },
    { header: 'الفئة', required: true, type: 'string', validValues: section3FacilityCategories },
    { header: 'اسم المنشأة', required: true, type: 'string' },
    { header: 'المحافظة', required: true, type: 'string', validValues: gov },
    { header: 'تاريخ الزيارة', required: true, type: 'date' },
    { header: 'نوع الزيارة', required: true, type: 'string', validValues: tcVisitTypes },
];

for (let c of tcStandardCodes) {
    tcCols.push({ header: tcStandardNames[c] + ' - الواردة', required: false, type: 'number' });
    tcCols.push({ header: tcStandardNames[c] + ' - المصححة', required: false, type: 'number' });
}

createTemplate('نسب_تصحيح_الملاحظات', tcCols);

console.log('\n🎉 تم إنشاء جميع النماذج في المجلد:');
console.log('   ' + dir);
console.log('\n📋 كل ملف يحتوي على:');
console.log('   1. ورقة "البيانات" - مع قوائم منسدلة للاختيار (لا حاجة للكتابة اليدوية)');
console.log('   2. ورقة "القوائم" - تحتوي القيم المرجعية');
console.log('   3. ورقة "تعليمات" - توضح كل عمود\n');
