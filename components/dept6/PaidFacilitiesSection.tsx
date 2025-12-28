'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import { PaidFacility } from '@/lib/firestore';

interface PaidFacilitiesSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

const egyptGovernorates = ['القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس', 'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الأقصر', 'سوهاج', 'جنوب سيناء', 'كفر الشيخ', 'مطروح', 'قنا', 'شمال سيناء'];

export default function PaidFacilitiesSection({ currentUser, canEdit }: PaidFacilitiesSectionProps) {
    const [facilities, setFacilities] = useState<PaidFacility[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({ facilityName: '', governorate: '', accreditationStatus: '', amount: '', month: '' });

    const userCanEdit = currentUser && canEdit(currentUser);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        // TODO: Firestore call
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !canEdit(currentUser)) { alert('ليس لديك صلاحية'); return; }
        if (!formData.facilityName || !formData.governorate || !formData.accreditationStatus || !formData.amount || !formData.month) { alert('يرجى ملء جميع الحقول'); return; }

        const [year, month] = formData.month.split('-');
        const facilityData = { facilityName: formData.facilityName, governorate: formData.governorate, accreditationStatus: formData.accreditationStatus, amount: parseFloat(formData.amount), month: formData.month, year: parseInt(year), createdBy: currentUser.email, updatedBy: currentUser.email };

        try {
            if (editingId) {
                await loadData(); resetForm(); alert('تم التحديث');
            } else {
                await loadData(); resetForm(); alert('تم الإضافة');
            }
        } catch (error) { console.error('Error:', error); alert('حدث خطأ'); }
    };

    const resetForm = () => { setFormData({ facilityName: '', governorate: '', accreditationStatus: '', amount: '', month: '' }); setEditingId(null); };
    const handleEdit = (item: PaidFacility) => { setFormData({ facilityName: item.facilityName, governorate: item.governorate, accreditationStatus: item.accreditationStatus, amount: item.amount.toString(), month: item.month }); setEditingId(item.id || null); window.scrollTo({ top: 0, behavior: 'smooth' }); };
    const handleDelete = async (id: string) => { if (!currentUser || !canEdit(currentUser)) { alert('ليس لديك صلاحية'); return; } if (confirm('هل أنت متأكد؟')) { await loadData(); alert('تم الحذف'); } };

    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const data = filteredData.map((item, i) => { const [year, month] = item.month.split('-'); return { '#': i + 1, 'اسم المنشأة': item.facilityName, 'المحافظة': item.governorate, 'حالة الاعتماد': item.accreditationStatus, 'المبلغ': item.amount, 'الشهر': `${monthNames[parseInt(month) - 1]} ${year}` }; });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الرسوم المحصلة');
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `الرسوم_المحصلة${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const tableRows = filteredData.map((item, i) => { const [year, month] = item.month.split('-'); return new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.facilityName, alignment: AlignmentType.RIGHT })], width: { size: 30, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.governorate, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.accreditationStatus, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: item.amount.toString(), alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })] }); });
        const table = new Table({ rows: [new TableRow({ children: [new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 10, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 30, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'المبلغ', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }), new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })] }), ...tableRows], width: { size: 100, type: WidthType.PERCENTAGE } });
        const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: 'الرسوم المحصلة خلال الشهر', alignment: AlignmentType.CENTER, spacing: { after: 200 } }), table] }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        link.download = `الرسوم_المحصلة${filterMonthText}.docx`;
        link.click();
    };

    const filteredData = filterMonth ? facilities.filter(f => f.month === filterMonth) : facilities;
    const formatMonthYear = (month: string) => { const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر']; const [year, monthNum] = month.split('-'); return `${monthNames[parseInt(monthNum) - 1]} ${year}`; };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader title="الرسوم المحصلة خلال الشهر" icon="💰" count={filteredData.length} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>{editingId ? 'تعديل' : 'إضافة'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group"><label className="form-label">اسم المنشأة *</label><input type="text" className="form-input" required value={formData.facilityName} onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })} /></div>
                                <div className="form-group">
                                    <label className="form-label">المحافظة *</label>
                                    <select className="form-input" required value={formData.governorate} onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}>
                                        <option value="">اختر</option>{egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">حالة الاعتماد *</label>
                                    <select className="form-input" required value={formData.accreditationStatus} onChange={(e) => setFormData({ ...formData, accreditationStatus: e.target.value })}>
                                        <option value="">اختر</option><option value="معتمد">معتمد</option><option value="قيد المراجعة">قيد المراجعة</option><option value="مرفوض">مرفوض</option>
                                    </select>
                                </div>
                                <div className="form-group"><label className="form-label">المبلغ *</label><input type="number" className="form-input" required min="0" step="0.01" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} placeholder="المبلغ بالجنيه" /></div>
                                <div className="form-group"><label className="form-label">الشهر *</label><input type="month" className="form-input" required value={formData.month} onChange={(e) => setFormData({ ...formData, month: e.target.value })} max={new Date().toISOString().split('T')[0].slice(0, 7)} /></div>
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
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>اسم المنشأة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>المحافظة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>حالة الاعتماد</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>المبلغ</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan={userCanEdit ? 7 : 6} style={{ padding: '40px', textAlign: 'center', color: '#999' }}><div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>لا توجد بيانات</td></tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{item.facilityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.accreditationStatus}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>{item.amount.toLocaleString()} ج.م</td>
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
