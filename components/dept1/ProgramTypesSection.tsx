'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    ProgramType,
    saveProgramType,
    getProgramTypes,
    updateProgramType,
    deleteProgramType
} from '@/lib/firestore';

interface ProgramTypesSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

/**
 * مكون قسم "نوع البرنامج" لـ dept1
 */
export default function ProgramTypesSection({ currentUser, canEdit }: ProgramTypesSectionProps) {
    // State
    const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
    const [editingProgramTypeId, setEditingProgramTypeId] = useState<string | null>(null);
    const [programTypeFilterMonth, setProgramTypeFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [programTypeFormData, setProgramTypeFormData] = useState({
        trainingPrograms: '',
        awarenessPrograms: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadProgramTypes();
    }, []);

    const loadProgramTypes = async () => {
        const programs = await getProgramTypes();
        setProgramTypes(programs);
    };

    // Form handlers
    const handleProgramTypeSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!programTypeFormData.trainingPrograms || !programTypeFormData.awarenessPrograms || !programTypeFormData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = programTypeFormData.month.split('-');

        const programData = {
            trainingPrograms: parseInt(programTypeFormData.trainingPrograms),
            awarenessPrograms: parseInt(programTypeFormData.awarenessPrograms),
            month: programTypeFormData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingProgramTypeId) {
                const success = await updateProgramType(editingProgramTypeId, {
                    ...programData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadProgramTypes();
                    resetProgramTypeForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveProgramType(programData);
                if (id) {
                    await loadProgramTypes();
                    resetProgramTypeForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving program type:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetProgramTypeForm = () => {
        setProgramTypeFormData({
            trainingPrograms: '',
            awarenessPrograms: '',
            month: ''
        });
        setEditingProgramTypeId(null);
    };

    const handleEditProgramType = (program: ProgramType) => {
        setProgramTypeFormData({
            trainingPrograms: program.trainingPrograms.toString(),
            awarenessPrograms: program.awarenessPrograms.toString(),
            month: program.month
        });
        setEditingProgramTypeId(program.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteProgramType = async (programId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
            const success = await deleteProgramType(programId);
            if (success) {
                await loadProgramTypes();
                alert('تم حذف البيانات بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف البيانات');
            }
        }
    };

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredPrograms.map((program, index) => {
            const [year, month] = program.month.split('-');
            return {
                '#': index + 1,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`,
                'برامج تدريب': program.trainingPrograms,
                'برامج توعية': program.awarenessPrograms
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'نوع البرنامج');

        const filterMonthText = programTypeFilterMonth
            ? `_${programTypeFilterMonth.replace('-', '_')}`
            : '';

        XLSX.writeFile(workbook, `نوع_البرنامج${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredPrograms.map((program, index) => {
            const [year, month] = program.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 15, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })],
                        width: { size: 35, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: program.trainingPrograms.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 25, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: program.awarenessPrograms.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 25, type: WidthType.PERCENTAGE }
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
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })],
                            width: { size: 35, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'برامج تدريب', alignment: AlignmentType.CENTER })],
                            width: { size: 25, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'برامج توعية', alignment: AlignmentType.CENTER })],
                            width: { size: 25, type: WidthType.PERCENTAGE }
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
                        text: 'نوع البرنامج',
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

        const filterMonthText = programTypeFilterMonth
            ? `_${programTypeFilterMonth.replace('-', '_')}`
            : '';

        link.download = `نوع_البرنامج${filterMonthText}.docx`;
        link.click();
    };

    // Filtering
    const filteredPrograms = programTypeFilterMonth
        ? programTypes.filter(p => p.month === programTypeFilterMonth)
        : programTypes;

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="نوع البرنامج"
                icon="📊"
                count={filteredPrograms.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* Form */}
                    {userCanEdit && (
                        <form onSubmit={handleProgramTypeSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingProgramTypeId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">الشهر *</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        required
                                        value={programTypeFormData.month}
                                        onChange={(e) => setProgramTypeFormData({ ...programTypeFormData, month: e.target.value })}
                                        min="2019-01"
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">برامج تدريب *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={programTypeFormData.trainingPrograms}
                                        onChange={(e) => setProgramTypeFormData({ ...programTypeFormData, trainingPrograms: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">برامج توعية *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={programTypeFormData.awarenessPrograms}
                                        onChange={(e) => setProgramTypeFormData({ ...programTypeFormData, awarenessPrograms: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                    {editingProgramTypeId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                </button>
                                {editingProgramTypeId && (
                                    <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetProgramTypeForm}>
                                        إلغاء التعديل
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Filter and Export */}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        <MonthFilter
                            value={programTypeFilterMonth}
                            onChange={setProgramTypeFilterMonth}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredPrograms.length > 0}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>برامج تدريب</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>برامج توعية</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredPrograms.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 5 : 4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredPrograms.map((program, index) => (
                                        <tr key={program.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(program.month)}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{program.trainingPrograms}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{program.awarenessPrograms}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEditProgramType(program)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteProgramType(program.id!)}
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
