'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    ReviewerEvaluationVisitByType,
    saveReviewerEvaluationVisitByType,
    getReviewerEvaluationVisitsByType,
    updateReviewerEvaluationVisitByType,
    deleteReviewerEvaluationVisitByType
} from '@/lib/firestore';

interface ReviewerVisitsByTypeSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

export default function ReviewerVisitsByTypeSection({ currentUser, canEdit }: ReviewerVisitsByTypeSectionProps) {
    const [visits, setVisits] = useState<ReviewerEvaluationVisitByType[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({ visitType: '', visitsCount: '', month: '' });

    const userCanEdit = currentUser && canEdit(currentUser);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const data = await getReviewerEvaluationVisitsByType();
        setVisits(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !canEdit(currentUser)) { alert('ليس لديك صلاحية'); return; }
        if (!formData.visitType || !formData.visitsCount || !formData.month) { alert('يرجى ملء جميع الحقول'); return; }

        const [year, month] = formData.month.split('-');
        const visitData = {
            visitType: formData.visitType,
            visitsCount: parseInt(formData.visitsCount),
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateReviewerEvaluationVisitByType(editingId, { ...visitData, updatedBy: currentUser.email });
                if (success) { await loadData(); resetForm(); alert('تم التحديث'); }
            } else {
                const id = await saveReviewerEvaluationVisitByType(visitData);
                if (id) { await loadData(); resetForm(); alert('تم الإضافة'); }
            }
        } catch (error) { console.error('Error:', error); alert('حدث خطأ'); }
    };

    const resetForm = () => { setFormData({ visitType: '', visitsCount: '', month: '' }); setEditingId(null); };
    const handleEdit = (item: ReviewerEvaluationVisitByType) => {
        setFormData({ visitType: item.visitType, visitsCount: item.visitsCount.toString(), month: item.month });
        setEditingId(item.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const handleDelete = async (id: string) => {
        if (!currentUser || !canEdit(currentUser)) { alert('ليس لديك صلاحية'); return; }
        if (confirm('هل أنت متأكد؟')) {
            const success = await deleteReviewerEvaluationVisitByType(id);
            if (success) { await loadData(); alert('تم الحذف'); }
        }
    };

    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const data = filteredData.map((item, i) => {
            const [year, month] = item.month.split('-');
            return { '#': i + 1, 'نوع الزيارة': item.visitType, 'عدد الزيارات': item.visitsCount, 'الشهر': `${monthNames[parseInt(month) - 1]} ${year}` };
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الزيارات حسب النوع');
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `الزيارات_التقييمية_النوع${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const tableRows = filteredData.map((item, i) => {
            const [year, month] = item.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.visitType, alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.visitsCount.toString(), alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } })
                ]
            });
        });
        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'نوع الزيارة', alignment: AlignmentType.CENTER })], width: { size: 40, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'عدد الزيارات', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 25, type: WidthType.PERCENTAGE } })
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });
        const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: 'الزيارات حسب نوع الزيارة', alignment: AlignmentType.CENTER, spacing: { after: 200 } }), table] }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        link.download = `الزيارات_التقييمية_النوع${filterMonthText}.docx`;
        link.click();
    };

    const filteredData = filterMonth ? visits.filter(v => v.month === filterMonth) : visits;
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader title="الزيارات التقييمية وفقاً لنوع الزيارة" icon="📋" count={filteredData.length} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>{editingId ? 'تعديل' : 'إضافة جديد'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">نوع الزيارة *</label>
                                    <select className="form-input" required value={formData.visitType} onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}>
                                        <option value="">اختر نوع الزيارة</option>
                                        <option value="زيارة تقييمية">زيارة تقييمية</option>
                                        <option value="زيارة متابعة">زيارة متابعة</option>
                                        <option value="زيارة تدقيق">زيارة تدقيق</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد الزيارات *</label>
                                    <input type="number" className="form-input" required min="0" value={formData.visitsCount} onChange={(e) => setFormData({ ...formData, visitsCount: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الشهر *</label>
                                    <input type="month" className="form-input" required value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} max={new Date().toISOString().split('T')[0].slice(0, 7)} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>{editingId ? 'تحديث' : 'حفظ'}</button>
                                {editingId && <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetForm}>إلغاء</button>}
                            </div>
                        </form>
                    )}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        <MonthFilter value={filterMonth} onChange={setFilterMonth} label="فلترة حسب الشهر" minWidth="250px" />
                        <ExportButtons onExportExcel={exportToExcel} onExportWord={exportToWord} show={filteredData.length > 0} />
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>نوع الزيارة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>عدد الزيارات</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan={userCanEdit ? 5 : 4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}><div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>لا توجد بيانات</td></tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: '500' }}>{item.visitType}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>{item.visitsCount}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(item.month)}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleEdit(item)} style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>تعديل</button>
                                                        <button onClick={() => handleDelete(item.id!)} style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}>حذف</button>
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
