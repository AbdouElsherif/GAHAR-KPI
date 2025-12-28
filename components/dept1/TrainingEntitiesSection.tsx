'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    TrainingEntity,
    saveTrainingEntity,
    getTrainingEntities,
    updateTrainingEntity,
    deleteTrainingEntity
} from '@/lib/firestore';

interface TrainingEntitiesSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

/**
 * مكون قسم "الجهات الحاصلة على التدريب" لـ dept1
 */
export default function TrainingEntitiesSection({ currentUser, canEdit }: TrainingEntitiesSectionProps) {
    // State
    const [trainingEntities, setTrainingEntities] = useState<TrainingEntity[]>([]);
    const [editingTrainingEntityId, setEditingTrainingEntityId] = useState<string | null>(null);
    const [trainingEntityFilterMonth, setTrainingEntityFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [trainingEntityFormData, setTrainingEntityFormData] = useState({
        entityName: '',
        traineesCount: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadTrainingEntities();
    }, []);

    const loadTrainingEntities = async () => {
        const entities = await getTrainingEntities();
        setTrainingEntities(entities);
    };

    // Form handlers
    const handleTrainingEntitySubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!trainingEntityFormData.entityName || !trainingEntityFormData.traineesCount || !trainingEntityFormData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = trainingEntityFormData.month.split('-');

        const entityData = {
            entityName: trainingEntityFormData.entityName,
            traineesCount: parseInt(trainingEntityFormData.traineesCount),
            month: trainingEntityFormData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingTrainingEntityId) {
                const success = await updateTrainingEntity(editingTrainingEntityId, {
                    ...entityData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadTrainingEntities();
                    resetTrainingEntityForm();
                    alert('تم تحديث بيانات الجهة بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveTrainingEntity(entityData);
                if (id) {
                    await loadTrainingEntities();
                    resetTrainingEntityForm();
                    alert('تم إضافة الجهة بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving training entity:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetTrainingEntityForm = () => {
        setTrainingEntityFormData({
            entityName: '',
            traineesCount: '',
            month: ''
        });
        setEditingTrainingEntityId(null);
    };

    const handleEditTrainingEntity = (entity: TrainingEntity) => {
        setTrainingEntityFormData({
            entityName: entity.entityName,
            traineesCount: entity.traineesCount.toString(),
            month: entity.month
        });
        setEditingTrainingEntityId(entity.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteTrainingEntity = async (entityId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه الجهة؟')) {
            const success = await deleteTrainingEntity(entityId);
            if (success) {
                await loadTrainingEntities();
                alert('تم حذف الجهة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الجهة');
            }
        }
    };

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredEntities.map((entity, index) => {
            const [year, month] = entity.month.split('-');
            return {
                '#': index + 1,
                'الجهة الحاصلة على التدريب': entity.entityName,
                'عدد المتدربين': entity.traineesCount,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الجهات الحاصلة على التدريب');

        const filterMonthText = trainingEntityFilterMonth
            ? `_${trainingEntityFilterMonth.replace('-', '_')}`
            : '';

        XLSX.writeFile(workbook, `الجهات_الحاصلة_على_التدريب${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredEntities.map((entity, index) => {
            const [year, month] = entity.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: entity.entityName, alignment: AlignmentType.RIGHT })],
                        width: { size: 45, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: entity.traineesCount.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })],
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
                            width: { size: 10, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الجهة الحاصلة على التدريب', alignment: AlignmentType.CENTER })],
                            width: { size: 45, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'عدد المتدربين', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })],
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
                        text: 'الجهات الحاصلة على التدريب',
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

        const filterMonthText = trainingEntityFilterMonth
            ? `_${trainingEntityFilterMonth.replace('-', '_')}`
            : '';

        link.download = `الجهات_الحاصلة_على_التدريب${filterMonthText}.docx`;
        link.click();
    };

    // Filtering
    const filteredEntities = trainingEntityFilterMonth
        ? trainingEntities.filter(e => e.month === trainingEntityFilterMonth)
        : trainingEntities;

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="الجهات الحاصلة على التدريب"
                icon="🎓"
                count={filteredEntities.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* Form */}
                    {userCanEdit && (
                        <form onSubmit={handleTrainingEntitySubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingTrainingEntityId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">الجهة الحاصلة على التدريب *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={trainingEntityFormData.entityName}
                                        onChange={(e) => setTrainingEntityFormData({ ...trainingEntityFormData, entityName: e.target.value })}
                                        placeholder="اسم الجهة"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد المتدربين *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={trainingEntityFormData.traineesCount}
                                        onChange={(e) => setTrainingEntityFormData({ ...trainingEntityFormData, traineesCount: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الشهر *</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        required
                                        value={trainingEntityFormData.month}
                                        onChange={(e) => setTrainingEntityFormData({ ...trainingEntityFormData, month: e.target.value })}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                    {editingTrainingEntityId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                </button>
                                {editingTrainingEntityId && (
                                    <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetTrainingEntityForm}>
                                        إلغاء التعديل
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Filter and Export */}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        <MonthFilter
                            value={trainingEntityFilterMonth}
                            onChange={setTrainingEntityFilterMonth}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredEntities.length > 0}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الجهة الحاصلة على التدريب</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>عدد المتدربين</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredEntities.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 5 : 4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEntities.map((entity, index) => (
                                        <tr key={entity.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{entity.entityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{entity.traineesCount}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(entity.month)}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEditTrainingEntity(entity)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTrainingEntity(entity.id!)}
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
