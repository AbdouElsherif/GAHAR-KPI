'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import ExcelImportButton from '../ExcelImportButton';
import { allSectionDefinitions } from '@/lib/excelImportHelpers';
import {
    ScheduledSupportVisit,
    saveScheduledSupportVisit,
    getScheduledSupportVisits,
    updateScheduledSupportVisit,
    deleteScheduledSupportVisit
} from '@/lib/firestore';

interface ScheduledSupportVisitsSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة',
    'الفيوم', 'الغربية', 'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية',
    'الوادي الجديد', 'الشرقية', 'السويس', 'أسوان', 'أسيوط', 'بني سويف',
    'بورسعيد', 'دمياط', 'الأقصر', 'مطروح', 'قنا', 'شمال سيناء', 'جنوب سيناء',
    'كفر الشيخ', 'سوهاج'
];

export default function ScheduledSupportVisitsSection({ currentUser, canEdit }: ScheduledSupportVisitsSectionProps) {
    const [visits, setVisits] = useState<ScheduledSupportVisit[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        facilityName: '',
        governorate: '',
        visitType: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getScheduledSupportVisits();
        setVisits(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userCanEdit) return;
        if (!formData.facilityName || !formData.month) return alert('يرجى ملء الحقول المطلوبة');

        const [year, month] = formData.month.split('-');
        const data = { ...formData, year: parseInt(year), createdBy: currentUser.email, updatedBy: currentUser.email };

        try {
            if (editingId) {
                if (await updateScheduledSupportVisit(editingId, data)) {
                    await loadData();
                    resetForm();
                    alert('تم التحديث بنجاح');
                }
            } else {
                if (await saveScheduledSupportVisit(data)) {
                    await loadData();
                    resetForm();
                    alert('تم الحفظ بنجاح');
                }
            }
        } catch (error) {
            console.error(error);
            alert('حدث خطأ');
        }
    };

    const resetForm = () => {
        setFormData({ facilityName: '', governorate: '', visitType: '', month: '' });
        setEditingId(null);
    };

    const handleEdit = (item: ScheduledSupportVisit) => {
        setFormData({
            facilityName: item.facilityName,
            governorate: item.governorate,
            visitType: item.visitType,
            month: item.month
        });
        setEditingId(item.id || null);
        setIsExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!userCanEdit) return;
        if (confirm('هل أنت متأكد؟')) {
            if (await deleteScheduledSupportVisit(id)) {
                await loadData();
                alert('تم الحذف');
            }
        }
    };

    const filteredData = filterMonth ? visits.filter(v => v.month === filterMonth) : visits;

    const exportToExcel = () => {
        const data = filteredData.map((item, i) => ({
            '#': i + 1,
            'اسم المنشأة': item.facilityName,
            'المحافظة': item.governorate,
            'نوع الزيارة': item.visitType,
            'الشهر': item.month
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'الزيارات المجدولة');
        XLSX.writeFile(wb, 'الزيارات_المجدولة.xlsx');
    };

    const exportToWord = async () => {
        const tableRows = filteredData.map((item, index) => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                    new TableCell({ children: [new Paragraph({ text: item.facilityName })] }),
                    new TableCell({ children: [new Paragraph({ text: item.governorate })] }),
                    new TableCell({ children: [new Paragraph({ text: item.visitType })] }),
                    new TableCell({ children: [new Paragraph({ text: item.month })] }),
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph('م')] }),
                        new TableCell({ children: [new Paragraph('اسم المنشأة')] }),
                        new TableCell({ children: [new Paragraph('المحافظة')] }),
                        new TableCell({ children: [new Paragraph('نوع الزيارة')] }),
                        new TableCell({ children: [new Paragraph('الشهر')] }),
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({ sections: [{ children: [new Paragraph({ text: 'الزيارات المجدولة', heading: 'Heading1', alignment: AlignmentType.CENTER }), table] }] });
        const blob = await Packer.toBlob(doc);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'الزيارات_المجدولة.docx';
        link.click();
    };

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <SectionHeader title="زيارات الدعم الفني المجدولة" icon="📅" count={filteredData.length} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                <div className="form-group"><label>اسم المنشأة *</label><input className="form-input" required value={formData.facilityName} onChange={e => setFormData({ ...formData, facilityName: e.target.value })} /></div>
                                <div className="form-group"><label>المحافظة</label><select className="form-input" value={formData.governorate} onChange={e => setFormData({ ...formData, governorate: e.target.value })}><option value="">اختر</option>{egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                                <div className="form-group"><label>نوع الزيارة</label><input className="form-input" value={formData.visitType} onChange={e => setFormData({ ...formData, visitType: e.target.value })} /></div>
                                <div className="form-group"><label>الشهر *</label><input type="month" className="form-input" required value={formData.month} onChange={e => setFormData({ ...formData, month: e.target.value })} /></div>
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}><button type="submit" className="btn btn-primary">{editingId ? 'تحديث' : 'حفظ'}</button>{editingId && <button type="button" className="btn btn-secondary" onClick={resetForm}>إلغاء</button>}</div>
                        </form>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <MonthFilter value={filterMonth} onChange={setFilterMonth} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons onExportExcel={exportToExcel} onExportWord={exportToWord} />
                            {userCanEdit && (
                                <ExcelImportButton
                                    sectionDef={allSectionDefinitions['dept2']['scheduled_support_visits']}
                                    userId={currentUser.email || currentUser.uid || 'unknown'}
                                    onImportComplete={loadData}
                                />
                            )}
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>#</th><th>اسم المنشأة</th><th>المحافظة</th><th>نوع الزيارة</th><th>الشهر</th>{userCanEdit && <th>إجراءات</th>}</tr></thead>
                            <tbody>
                                {filteredData.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>لا توجد بيانات</td></tr> : filteredData.map((d, i) => (
                                    <tr key={d.id}><td>{i + 1}</td><td>{d.facilityName}</td><td>{d.governorate}</td><td>{d.visitType}</td><td>{d.month}</td>
                                        {userCanEdit && <td><button onClick={() => handleEdit(d)}>✍️</button> <button onClick={() => handleDelete(d.id!)}>🗑️</button></td>}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
