'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons } from '../shared';
import {
    TrainingProgramByGovernorate,
    saveTrainingProgramByGovernorate,
    getTrainingProgramsByGovernorate,
    updateTrainingProgramByGovernorate,
    deleteTrainingProgramByGovernorate
} from '@/lib/firestore';
import { GOVERNORATE_PHASES, OTHER_GOVERNORATES, getGovernoratePhase } from '@/constants/governorates';

interface TrainingProgramsByGovernorateSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
    globalFilterMonth?: string | null;
}

/**
 * Converts a monthly string (YYYY-MM) to a quarterly string (YYYY-QX).
 */
const getQuarterFromMonth = (monthStr: string): string => {
    if (!monthStr || !monthStr.includes('-')) return '';
    const [year, monthNum] = monthStr.split('-');
    const m = parseInt(monthNum);
    if (isNaN(m)) return monthStr; // Already in Q format or invalid
    let q = '';
    if (m >= 7 && m <= 9) q = 'Q1';
    else if (m >= 10 && m <= 12) q = 'Q2';
    else if (m >= 1 && m <= 3) q = 'Q3';
    else if (m >= 4 && m <= 6) q = 'Q4';
    return q ? `${year}-${q}` : monthStr;
};

/**
 * Matches two periods (could be YYYY-MM or YYYY-QX) by normalizing them to QX.
 */
const matchRecordPeriod = (recordMonth: string, filterMonth: string) => {
    if (!recordMonth || !filterMonth) return true;
    
    // Normalize both to quarter format if possible
    const recordQuarter = recordMonth.includes('-Q') ? recordMonth : getQuarterFromMonth(recordMonth);
    const filterQuarter = filterMonth.includes('-Q') ? filterMonth : getQuarterFromMonth(filterMonth);
    
    return recordQuarter === filterQuarter;
};

/**
 * مكون قسم "البرامج التدريبية" لـ dept1 (معدل لاختيار الفترة ربع سنوية)
 */
export default function TrainingProgramsByGovernorateSection({ currentUser, canEdit, globalFilterMonth }: TrainingProgramsByGovernorateSectionProps) {
    // State
    const [programs, setPrograms] = useState<TrainingProgramByGovernorate[]>([]);
    const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
    const [filterQuarter, setFilterQuarter] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [programFormData, setProgramFormData] = useState({
        governorate: '',
        programsCount: '',
        traineesCount: '',
        month: '' // will store YYYY-QX
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadPrograms();
    }, []);

    const loadPrograms = async () => {
        const data = await getTrainingProgramsByGovernorate();
        setPrograms(data);
    };

    // Parse the current form value of month (YYYY-QX) into year and quarter
    const getYearAndQuarterFromValue = (value: string) => {
        if (!value) return { year: '', quarter: '' };
        
        const [year, part] = value.split('-');
        if (part && part.startsWith('Q')) {
            return { year, quarter: part };
        }
        
        // Handle legacy monthly strings (YYYY-MM)
        if (part) {
            const monthVal = parseInt(part);
            if (!isNaN(monthVal)) {
                if (monthVal >= 7 && monthVal <= 9) return { year, quarter: 'Q1' };
                if (monthVal >= 10 && monthVal <= 12) return { year, quarter: 'Q2' };
                if (monthVal >= 1 && monthVal <= 3) return { year, quarter: 'Q3' };
                if (monthVal >= 4 && monthVal <= 6) return { year, quarter: 'Q4' };
            }
        }
        
        return { year, quarter: '' };
    };

    const { year: selectedFormYear, quarter: selectedFormQuarter } = getYearAndQuarterFromValue(programFormData.month);

    const handleFormYearChange = (year: string) => {
        const newMonthValue = year && selectedFormQuarter ? `${year}-${selectedFormQuarter}` : year;
        setProgramFormData({ ...programFormData, month: newMonthValue });
    };

    const handleFormQuarterChange = (quarter: string) => {
        const newMonthValue = selectedFormYear && quarter ? `${selectedFormYear}-${quarter}` : '';
        setProgramFormData({ ...programFormData, month: newMonthValue });
    };

    // Form handlers
    const handleProgramSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!programFormData.month || !programFormData.month.includes('-')) {
            alert('يرجى اختيار السنة والربع المالي');
            return;
        }

        if (!programFormData.governorate) {
            alert('يرجى اختيار المحافظة');
            return;
        }

        const [year] = programFormData.month.split('-');

        const programData = {
            departmentId: 'dept1',
            month: programFormData.month,
            governorate: programFormData.governorate,
            phase: getGovernoratePhase(programFormData.governorate),
            programsCount: programFormData.programsCount ? parseInt(programFormData.programsCount) : 0,
            traineesCount: programFormData.traineesCount ? parseInt(programFormData.traineesCount) : 0,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingProgramId) {
                const success = await updateTrainingProgramByGovernorate(editingProgramId, {
                    ...programData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadPrograms();
                    resetProgramForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveTrainingProgramByGovernorate(programData);
                if (id) {
                    await loadPrograms();
                    resetProgramForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving training program:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetProgramForm = () => {
        setProgramFormData({
            governorate: '',
            programsCount: '',
            traineesCount: '',
            month: ''
        });
        setEditingProgramId(null);
    };

    const handleEditProgram = (program: TrainingProgramByGovernorate) => {
        setProgramFormData({
            governorate: program.governorate,
            programsCount: program.programsCount.toString(),
            traineesCount: program.traineesCount.toString(),
            month: program.month
        });
        setEditingProgramId(program.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProgram = async (programId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
            const success = await deleteTrainingProgramByGovernorate(programId);
            if (success) {
                await loadPrograms();
                alert('تم حذف البيانات بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف البيانات');
            }
        }
    };

    // Filtering
    const filteredPrograms = programs.filter(p => {
        if (globalFilterMonth) {
            return matchRecordPeriod(p.month, globalFilterMonth);
        }
        
        // Local filters
        if (filterYear && filterQuarter) {
            const target = `${filterYear}-${filterQuarter}`;
            return matchRecordPeriod(p.month, target);
        }
        if (filterYear) {
            const [pYear] = p.month.split('-');
            return pYear === filterYear;
        }
        if (filterQuarter) {
            const pQuarter = p.month.includes('-Q') ? p.month.split('-')[1] : getQuarterFromMonth(p.month).split('-')[1];
            return pQuarter === filterQuarter;
        }
        
        return true;
    });

    // Format month/quarter for display
    const formatMonthYear = (month: string) => {
        if (!month) return '';
        const [year, monthNum] = month.split('-');
        if (!monthNum) return month;
        if (monthNum.startsWith('Q')) {
            const quarterNames: Record<string, string> = {
                'Q1': 'الربع الأول (يوليو - سبتمبر)',
                'Q2': 'الربع الثاني (أكتوبر - ديسمبر)',
                'Q3': 'الربع الثالث (يناير - مارس)',
                'Q4': 'الربع الرابع (أبريل - يونيو)'
            };
            return `${quarterNames[monthNum] || monthNum} ${year}`;
        }
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const parsedMonth = parseInt(monthNum);
        if (isNaN(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) return month;
        return `${monthNames[parsedMonth - 1]} ${year}`;
    };

    // Export functions
    const exportToExcel = () => {
        const data = filteredPrograms.map((program, index) => {
            return {
                '#': index + 1,
                'الفترة / الربع': formatMonthYear(program.month),
                'المحافظة': program.governorate,
                'المرحلة': program.phase,
                'عدد البرامج التدريبية': program.programsCount,
                'عدد المتدربين': program.traineesCount
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'البرامج التدريبية');

        const filterMonthText = (globalFilterMonth)
            ? `_${globalFilterMonth.replace('-', '_')}`
            : (filterYear || filterQuarter)
                ? `_${filterYear}_${filterQuarter}`
                : '';

        XLSX.writeFile(workbook, `البرامج_التدريبية_${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const tableRows = filteredPrograms.map((program, index) => {
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: formatMonthYear(program.month), alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: program.governorate, alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: program.phase, alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: program.programsCount.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 15, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: program.traineesCount.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 15, type: WidthType.PERCENTAGE }
                    })
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })],
                            width: { size: 10, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الفترة / الربع', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'المرحلة', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'عدد البرامج', alignment: AlignmentType.CENTER })],
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'عدد المتدربين', alignment: AlignmentType.CENTER })],
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        })
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({
            sections: [{
                properties: {},
                children: [
                    new Paragraph({
                        text: 'تصنيف البرامج التدريبية حسب المحافظة',
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 200 }
                    }),
                    table
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;

        const filterMonthText = (globalFilterMonth)
            ? `_${globalFilterMonth.replace('-', '_')}`
            : (filterYear || filterQuarter)
                ? `_${filterYear}_${filterQuarter}`
                : '';

        link.download = `البرامج_التدريبية_${filterMonthText}.docx`;
        link.click();
    };

    const availableYears = [2026, 2027, 2028, 2029, 2030];

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="تصنيف البرامج التدريبية حسب المحافظة"
                icon="🏫"
                count={filteredPrograms.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* Form */}
                    {userCanEdit && (
                        <form onSubmit={handleProgramSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingProgramId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">السنة المالية *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={selectedFormYear}
                                        onChange={(e) => handleFormYearChange(e.target.value)}
                                    >
                                        <option value="">اختر السنة</option>
                                        {availableYears.map(y => (
                                            <option key={y} value={y}>{y - 1} / {y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الربع المالي *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={selectedFormQuarter}
                                        onChange={(e) => handleFormQuarterChange(e.target.value)}
                                    >
                                        <option value="">اختر الربع</option>
                                        <option value="Q1">الربع الأول (يوليو - سبتمبر)</option>
                                        <option value="Q2">الربع الثاني (أكتوبر - ديسمبر)</option>
                                        <option value="Q3">الربع الثالث (يناير - مارس)</option>
                                        <option value="Q4">الربع الرابع (أبريل - يونيو)</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">المحافظة *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={programFormData.governorate}
                                        onChange={(e) => setProgramFormData({ ...programFormData, governorate: e.target.value })}
                                    >
                                        <option value="">اختر المحافظة</option>
                                        <optgroup label="مرحلة أولى">
                                            {GOVERNORATE_PHASES.PHASE_1.map(gov => (
                                                <option key={gov} value={gov}>{gov}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="مرحلة ثانية">
                                            {GOVERNORATE_PHASES.PHASE_2.map(gov => (
                                                <option key={gov} value={gov}>{gov}</option>
                                            ))}
                                        </optgroup>
                                        <optgroup label="محافظات أخرى">
                                            {OTHER_GOVERNORATES.map(gov => (
                                                <option key={gov} value={gov}>{gov}</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد البرامج التدريبية</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={programFormData.programsCount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || Number(val) >= 0) {
                                                setProgramFormData({ ...programFormData, programsCount: val });
                                            }
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد المتدربين</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={programFormData.traineesCount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || Number(val) >= 0) {
                                                setProgramFormData({ ...programFormData, traineesCount: val });
                                            }
                                        }}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                    {editingProgramId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                </button>
                                {editingProgramId && (
                                    <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetProgramForm}>
                                        إلغاء التعديل
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Filter and Export */}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        {globalFilterMonth ? (
                            <div className="form-group" style={{ margin: 0, minWidth: '250px' }}>
                                <label className="form-label">الفلترة النشطة (من القائمة العلوية)</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={`${formatMonthYear(globalFilterMonth)} (مفعّل عالمياً)`}
                                    disabled
                                    style={{
                                        backgroundColor: '#e9ecef',
                                        color: '#495057',
                                        cursor: 'not-allowed',
                                        fontWeight: 'bold',
                                        width: '100%',
                                        padding: '8px 12px',
                                        fontSize: '0.9rem',
                                        borderRadius: '6px',
                                        border: '1px solid #ddd'
                                    }}
                                />
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                                <div className="form-group" style={{ margin: 0, minWidth: '150px' }}>
                                    <label className="form-label">فلترة حسب السنة</label>
                                    <select
                                        className="form-input"
                                        value={filterYear}
                                        onChange={(e) => setFilterYear(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontSize: '0.9rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd'
                                        }}
                                    >
                                        <option value="">كل السنوات</option>
                                        {availableYears.map(y => (
                                            <option key={y} value={y.toString()}>{y - 1} / {y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ margin: 0, minWidth: '200px' }}>
                                    <label className="form-label">فلترة حسب الربع</label>
                                    <select
                                        className="form-input"
                                        value={filterQuarter}
                                        onChange={(e) => setFilterQuarter(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            fontSize: '0.9rem',
                                            borderRadius: '6px',
                                            border: '1px solid #ddd'
                                        }}
                                    >
                                        <option value="">كل الأرباع</option>
                                        <option value="Q1">الربع الأول (يوليو - سبتمبر)</option>
                                        <option value="Q2">الربع الثاني (أكتوبر - ديسمبر)</option>
                                        <option value="Q3">الربع الثالث (يناير - مارس)</option>
                                        <option value="Q4">الربع الرابع (أبريل - يونيو)</option>
                                    </select>
                                </div>
                            </div>
                        )}
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredPrograms.length > 0}
                            />
                        </div>
                    </div>

                    {/* Notice */}
                    <div style={{
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        border: '1px solid #ffc107'
                    }}>
                        ⚠️ تنويه: المؤشر ربع سنوي
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الفترة / الربع</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>المحافظة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>المرحلة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>عدد البرامج</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>عدد المتدربين</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrograms.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🏫</div>
                                            لا توجد بيانات للفترة المحددة
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrograms.map((program, index) => (
                                        <tr key={program.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(program.month)}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{program.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 8px',
                                                    borderRadius: '4px',
                                                    backgroundColor: program.phase === 'مرحلة أولى' ? '#e3f2fd' : program.phase === 'مرحلة ثانية' ? '#fce4ec' : '#f5f5f5',
                                                    color: program.phase === 'مرحلة أولى' ? '#0d47a1' : program.phase === 'مرحلة ثانية' ? '#880e4f' : '#616161',
                                                    fontSize: '0.85rem'
                                                }}>
                                                    {program.phase}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{program.programsCount}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{program.traineesCount}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEditProgram(program)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProgram(program.id!)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            حذف
                                                        </button>
                                                    </div>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
