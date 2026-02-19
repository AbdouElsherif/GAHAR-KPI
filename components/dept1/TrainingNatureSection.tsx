'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    TrainingNature,
    saveTrainingNature,
    getTrainingNatures,
    updateTrainingNature,
    deleteTrainingNature
} from '@/lib/firestore';

interface TrainingNatureSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
    globalFilterMonth?: string | null;
}

/**
 * مكون قسم "منهجية التدريب" لـ dept1
 */
export default function TrainingNatureSection({ currentUser, canEdit, globalFilterMonth }: TrainingNatureSectionProps) {
    // State
    const [trainingNatures, setTrainingNatures] = useState<TrainingNature[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        physicalPrograms: '',
        onlinePrograms: '',
        hybridPrograms: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getTrainingNatures();
        setTrainingNatures(data);
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!formData.month) {
            alert('يرجى اختيار الشهر');
            return;
        }

        const [year, month] = formData.month.split('-');

        const data = {
            physicalPrograms: formData.physicalPrograms ? parseInt(formData.physicalPrograms) : 0,
            onlinePrograms: formData.onlinePrograms ? parseInt(formData.onlinePrograms) : 0,
            hybridPrograms: formData.hybridPrograms ? parseInt(formData.hybridPrograms) : 0,
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateTrainingNature(editingId, {
                    ...data,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadData();
                    resetForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveTrainingNature(data);
                if (id) {
                    await loadData();
                    resetForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving training nature:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetForm = () => {
        setFormData({
            physicalPrograms: '',
            onlinePrograms: '',
            hybridPrograms: '',
            month: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item: TrainingNature) => {
        setFormData({
            physicalPrograms: item.physicalPrograms ? item.physicalPrograms.toString() : '',
            onlinePrograms: item.onlinePrograms ? item.onlinePrograms.toString() : '',
            hybridPrograms: item.hybridPrograms ? item.hybridPrograms.toString() : '',
            month: item.month
        });
        setEditingId(item.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
            const success = await deleteTrainingNature(id);
            if (success) {
                await loadData();
                alert('تم حذف البيانات بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف البيانات');
            }
        }
    };

    // Filtering
    const filteredData = (globalFilterMonth || filterMonth)
        ? trainingNatures.filter(p => p.month === (globalFilterMonth || filterMonth))
        : trainingNatures;

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredData.map((item, index) => {
            const [year, month] = item.month.split('-');
            const total = (item.physicalPrograms || 0) + (item.onlinePrograms || 0) + (item.hybridPrograms || 0);
            return {
                '#': index + 1,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`,
                'عدد المتدربين (حضوري)': item.physicalPrograms || 0,
                'عدد المتدربين (عن بعد)': item.onlinePrograms || 0,
                'عدد المتدربين (مدمج)': item.hybridPrograms || 0,
                'الإجمالي': total
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'منهجية التدريب');

        const filterMonthText = (globalFilterMonth || filterMonth)
            ? `_${(globalFilterMonth || filterMonth).replace('-', '_')}`
            : '';

        XLSX.writeFile(workbook, `منهجية_التدريب${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredData.map((item, index) => {
            const [year, month] = item.month.split('-');
            const total = (item.physicalPrograms || 0) + (item.onlinePrograms || 0) + (item.hybridPrograms || 0);
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })],
                        width: { size: 30, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: (item.physicalPrograms || 0).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 15, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: (item.onlinePrograms || 0).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 15, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: (item.hybridPrograms || 0).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 15, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: total.toString(), alignment: AlignmentType.CENTER })],
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
                            children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })],
                            width: { size: 30, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'متدربين (حضوري)', alignment: AlignmentType.CENTER })],
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'متدربين (عن بعد)', alignment: AlignmentType.CENTER })],
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'متدربين (مدمج)', alignment: AlignmentType.CENTER })],
                            width: { size: 15, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الإجمالي', alignment: AlignmentType.CENTER })],
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
                        text: 'منهجية التدريب',
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

        const filterMonthText = (globalFilterMonth || filterMonth)
            ? `_${(globalFilterMonth || filterMonth).replace('-', '_')}`
            : '';

        link.download = `منهجية_التدريب${filterMonthText}.docx`;
        link.click();
    };

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="منهجية التدريب"
                icon="🌐"
                count={filteredData.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* Form */}
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">الشهر *</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        required
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        min="2019-01"
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد المتدربين (حضوري)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={formData.physicalPrograms}
                                        onChange={(e) => setFormData({ ...formData, physicalPrograms: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد المتدربين (عن بعد)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={formData.onlinePrograms}
                                        onChange={(e) => setFormData({ ...formData, onlinePrograms: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد المتدربين (مدمج)</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={formData.hybridPrograms}
                                        onChange={(e) => setFormData({ ...formData, hybridPrograms: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                    {editingId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                </button>
                                {editingId && (
                                    <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetForm}>
                                        إلغاء التعديل
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Filter and Export */}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        <MonthFilter
                            value={globalFilterMonth || filterMonth}
                            onChange={(val) => !globalFilterMonth && setFilterMonth(val)}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
                            disabled={!!globalFilterMonth}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredData.length > 0}
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
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>متدربين (حضوري)</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>متدربين (عن بعد)</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>متدربين (مدمج)</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', backgroundColor: '#F39C12' }}>الإجمالي</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => {
                                        const total = (item.physicalPrograms || 0) + (item.onlinePrograms || 0) + (item.hybridPrograms || 0);
                                        return (
                                            <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(item.month)}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.physicalPrograms || 0}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.onlinePrograms || 0}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{item.hybridPrograms || 0}</td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#F39C12' }}>{total}</td>
                                                {userCanEdit && (
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleEdit(item)}
                                                                style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                تعديل
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(item.id!)}
                                                                style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                حذف
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
