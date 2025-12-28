'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    AdminAuditObservation,
    saveAdminAuditObservation,
    getAdminAuditObservations,
    updateAdminAuditObservation,
    deleteAdminAuditObservation
} from '@/lib/firestore';

interface AdminAuditObservationsSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

/**
 * مكون قسم "الملاحظات المتكررة" لـ dept5
 */
export default function AdminAuditObservationsSection({ currentUser, canEdit }: AdminAuditObservationsSectionProps) {
    // State
    const [observations, setObservations] = useState<AdminAuditObservation[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        entityType: '',
        facilityType: '',
        observation: '',
        percentage: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAdminAuditObservations();
        setObservations(data);
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!formData.entityType || !formData.facilityType || !formData.observation || !formData.percentage || !formData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = formData.month.split('-');

        const observationData = {
            entityType: formData.entityType,
            facilityType: formData.facilityType,
            observation: formData.observation,
            percentage: parseFloat(formData.percentage),
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateAdminAuditObservation(editingId, {
                    ...observationData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadData();
                    resetForm();
                    alert('تم تحديث البيانات بنجاح');
                }
            } else {
                const id = await saveAdminAuditObservation(observationData);
                if (id) {
                    await loadData();
                    resetForm();
                    alert('تم إضافة البيانات بنجاح');
                }
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetForm = () => {
        setFormData({
            entityType: '',
            facilityType: '',
            observation: '',
            percentage: '',
            month: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item: AdminAuditObservation) => {
        setFormData({
            entityType: item.entityType,
            facilityType: item.facilityType,
            observation: item.observation,
            percentage: item.percentage.toString(),
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

        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteAdminAuditObservation(id);
            if (success) {
                await loadData();
                alert('تم حذف السجل بنجاح');
            }
        }
    };

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredData.map((item, index) => {
            const [year, month] = item.month.split('-');
            return {
                '#': index + 1,
                'الجهة التابعة': item.entityType,
                'نوع المنشأة': item.facilityType,
                'الملاحظة': item.observation,
                'نسبة التكرار %': item.percentage,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الملاحظات المتكررة');

        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `الملاحظات_المتكررة_إدارية${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredData.map((item, index) => {
            const [year, month] = item.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.entityType, alignment: AlignmentType.CENTER })], width: { size: 18, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.facilityType, alignment: AlignmentType.CENTER })], width: { size: 18, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.observation, alignment: AlignmentType.RIGHT })], width: { size: 36, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: `${item.percentage}%`, alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } })
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الجهة التابعة', alignment: AlignmentType.CENTER })], width: { size: 18, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'نوع المنشأة', alignment: AlignmentType.CENTER })], width: { size: 18, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الملاحظة', alignment: AlignmentType.CENTER })], width: { size: 36, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'نسبة التكرار', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } })
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
                        text: 'الملاحظات المتكررة - الرقابة الإدارية',
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
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        link.download = `الملاحظات_المتكررة_إدارية${filterMonthText}.docx`;
        link.click();
    };

    // Filtering
    const filteredData = filterMonth
        ? observations.filter(o => o.month === filterMonth)
        : observations;

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="الملاحظات المتكررة"
                icon="📝"
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
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">الجهة التابعة *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.entityType}
                                        onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                    >
                                        <option value="">اختر الجهة</option>
                                        <option value="المنشآت الصحية التابعة لهيئة الرعاية">المنشآت الصحية التابعة لهيئة الرعاية</option>
                                        <option value="منشآت صحية أخرى">منشآت صحية أخرى</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">نوع المنشأة *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.facilityType}
                                        onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                                    >
                                        <option value="">اختر نوع المنشأة</option>
                                        <option value="مراكز ووحدات الرعاية الأولية">مراكز ووحدات الرعاية الأولية</option>
                                        <option value="مستشفى">مستشفى</option>
                                        <option value="صيدلية">صيدلية</option>
                                        <option value="معمل">معمل</option>
                                        <option value="مراكز أشعة">مراكز أشعة</option>
                                        <option value="مراكز طبية">مراكز طبية</option>
                                        <option value="مراكز علاج طبيعية">مراكز علاج طبيعي</option>
                                        <option value="عيادات طبية">عيادات طبية</option>
                                        <option value="مستشفى صحة نفسية">مستشفى صحة نفسية</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">نسبة التكرار (%) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.percentage}
                                        onChange={(e) => setFormData({ ...formData, percentage: e.target.value })}
                                        placeholder="نسبة التكرار"
                                    />
                                </div>
                                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                                    <label className="form-label">الملاحظة *</label>
                                    <textarea
                                        className="form-input"
                                        required
                                        value={formData.observation}
                                        onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                                        placeholder="اكتب الملاحظة"
                                        rows={3}
                                        style={{ resize: 'vertical' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الشهر *</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        required
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
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
                            value={filterMonth}
                            onChange={setFilterMonth}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
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
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الجهة التابعة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>نوع المنشأة</th>
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>الملاحظة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>نسبة التكرار</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
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
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.entityType}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.facilityType}</td>
                                            <td style={{ padding: '12px', textAlign: 'right' }}>{item.observation}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>{item.percentage}%</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(item.month)}</td>
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
