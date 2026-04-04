'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import ExcelImportButton from '../ExcelImportButton';
import { allSectionDefinitions } from '@/lib/excelImportHelpers';
import {
    AccreditedSupportedFacility,
    saveAccreditedSupportedFacility,
    getAccreditedSupportedFacilities,
    updateAccreditedSupportedFacility,
    deleteAccreditedSupportedFacility
} from '@/lib/firestore';

interface AccreditedSupportedFacilitiesSectionProps {
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

export default function AccreditedSupportedFacilitiesSection({ currentUser, canEdit }: AccreditedSupportedFacilitiesSectionProps) {
    const [facilities, setFacilities] = useState<AccreditedSupportedFacility[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        facilityName: '',
        governorate: '',
        decisionNumber: '',
        decisionDate: '',
        supportType: '',
        accreditationStatus: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAccreditedSupportedFacilities();
        setFacilities(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userCanEdit) return;
        if (!formData.facilityName || !formData.month) return alert('يرجى ملء الحقول المطلوبة');

        const [year, month] = formData.month.split('-');
        const data = { ...formData, year: parseInt(year), createdBy: currentUser.email, updatedBy: currentUser.email };

        try {
            if (editingId) {
                if (await updateAccreditedSupportedFacility(editingId, data)) {
                    await loadData();
                    resetForm();
                    alert('تم التحديث بنجاح');
                }
            } else {
                if (await saveAccreditedSupportedFacility(data)) {
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
        setFormData({ facilityName: '', governorate: '', decisionNumber: '', decisionDate: '', supportType: '', accreditationStatus: '', month: '' });
        setEditingId(null);
    };

    const handleEdit = (item: AccreditedSupportedFacility) => {
        setFormData({
            facilityName: item.facilityName,
            governorate: item.governorate,
            decisionNumber: item.decisionNumber,
            decisionDate: item.decisionDate,
            supportType: item.supportType,
            accreditationStatus: item.accreditationStatus,
            month: item.month
        });
        setEditingId(item.id || null);
        setIsExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!userCanEdit) return;
        if (confirm('هل أنت متأكد؟')) {
            if (await deleteAccreditedSupportedFacility(id)) {
                await loadData();
                alert('تم الحذف');
            }
        }
    };

    const filteredData = filterMonth ? facilities.filter(v => v.month === filterMonth) : facilities;

    const exportToExcel = () => {
        const data = filteredData.map((item, i) => ({
            '#': i + 1,
            'اسم المنشأة': item.facilityName,
            'المحافظة': item.governorate,
            'رقم القرار': item.decisionNumber,
            'تاريخ القرار': item.decisionDate,
            'نوع الدعم': item.supportType,
            'موقف الاعتماد': item.accreditationStatus,
            'الشهر': item.month
        }));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'المنشآت المعتمدة المدعومة');
        XLSX.writeFile(wb, 'المنشآت_المعتمدة_المدعومة.xlsx');
    };

    const exportToWord = async () => {
        const tableRows = filteredData.map((item, index) => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                    new TableCell({ children: [new Paragraph({ text: item.facilityName })] }),
                    new TableCell({ children: [new Paragraph({ text: item.governorate })] }),
                    new TableCell({ children: [new Paragraph({ text: item.decisionNumber })] }),
                    new TableCell({ children: [new Paragraph({ text: item.decisionDate })] }),
                    new TableCell({ children: [new Paragraph({ text: item.supportType })] }),
                    new TableCell({ children: [new Paragraph({ text: item.accreditationStatus })] }),
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
                        new TableCell({ children: [new Paragraph('رقم القرار')] }),
                        new TableCell({ children: [new Paragraph('تاريخ القرار')] }),
                        new TableCell({ children: [new Paragraph('نوع الدعم')] }),
                        new TableCell({ children: [new Paragraph('موقف الاعتماد')] }),
                        new TableCell({ children: [new Paragraph('الشهر')] }),
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({ sections: [{ children: [new Paragraph({ text: 'المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم', heading: 'Heading1', alignment: AlignmentType.CENTER }), table] }] });
        const blob = await Packer.toBlob(doc);
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = 'المنشآت_المعتمدة_المدعومة.docx';
        link.click();
    };

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <SectionHeader title="المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم" icon="🏆" count={filteredData.length} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                <div className="form-group"><label>اسم المنشأة *</label><input className="form-input" required value={formData.facilityName} onChange={e => setFormData({ ...formData, facilityName: e.target.value })} /></div>
                                <div className="form-group"><label>المحافظة</label><select className="form-input" value={formData.governorate} onChange={e => setFormData({ ...formData, governorate: e.target.value })}><option value="">اختر</option>{egyptGovernorates.map(g => <option key={g} value={g}>{g}</option>)}</select></div>
                                <div className="form-group"><label>رقم القرار</label><input className="form-input" value={formData.decisionNumber} onChange={e => setFormData({ ...formData, decisionNumber: e.target.value })} /></div>
                                <div className="form-group"><label>تاريخ القرار</label><input type="date" className="form-input" value={formData.decisionDate} onChange={e => setFormData({ ...formData, decisionDate: e.target.value })} /></div>
                                <div className="form-group"><label>نوع الدعم</label><input className="form-input" value={formData.supportType} onChange={e => setFormData({ ...formData, supportType: e.target.value })} /></div>
                                <div className="form-group"><label>موقف الاعتماد</label><input className="form-input" value={formData.accreditationStatus} onChange={e => setFormData({ ...formData, accreditationStatus: e.target.value })} /></div>
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
                                    sectionDef={allSectionDefinitions['dept2']['accredited_supported_facilities']}
                                    userId={currentUser.email || currentUser.uid || 'unknown'}
                                    onImportComplete={loadData}
                                />
                            )}
                        </div>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead><tr><th>#</th><th>اسم المنشأة</th><th>المحافظة</th><th>رقم القرار</th><th>تاريخ القرار</th><th>نوع الدعم</th><th>موقف الاعتماد</th><th>الشهر</th>{userCanEdit && <th>إجراءات</th>}</tr></thead>
                            <tbody>
                                {filteredData.length === 0 ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '20px' }}>لا توجد بيانات</td></tr> : filteredData.map((d, i) => (
                                    <tr key={d.id}><td>{i + 1}</td><td>{d.facilityName}</td><td>{d.governorate}</td><td>{d.decisionNumber}</td><td>{d.decisionDate}</td><td>{d.supportType}</td><td>{d.accreditationStatus}</td><td>{d.month}</td>
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
