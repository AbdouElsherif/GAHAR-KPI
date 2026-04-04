'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import ExcelImportButton from '../ExcelImportButton';
import { allSectionDefinitions } from '@/lib/excelImportHelpers';
import {
    RemoteTechnicalSupport,
    saveRemoteTechnicalSupport,
    getRemoteTechnicalSupports,
    updateRemoteTechnicalSupport,
    deleteRemoteTechnicalSupport
} from '@/lib/firestore';

interface RemoteTechSupportSectionProps {
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

const techSupportFacilityTypes = [
    'مستشفيات',
    'مستشفيات الصحة النفسية',
    'عيادات خاصة',
    'معامل',
    'صيدليات',
    'مراكز جراحات اليوم الواحد',
    'مراكز علاج طبيعي',
    'مراكز أشعة',
    'مراكز ووحدات الرعاية الأولية'
];

export default function RemoteTechSupportSection({ currentUser, canEdit }: RemoteTechSupportSectionProps) {
    // State
    const [remoteTechnicalSupports, setRemoteTechnicalSupports] = useState<RemoteTechnicalSupport[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        facilityName: '',
        governorate: '',
        visitType: '',
        affiliatedEntity: '',
        facilityType: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getRemoteTechnicalSupports();
        setRemoteTechnicalSupports(data);
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!userCanEdit) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!formData.facilityName || !formData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = formData.month.split('-');

        const data = {
            ...formData,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateRemoteTechnicalSupport(editingId, data);
                if (success) {
                    await loadData();
                    resetForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveRemoteTechnicalSupport(data);
                if (id) {
                    await loadData();
                    resetForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetForm = () => {
        setFormData({
            facilityName: '',
            governorate: '',
            visitType: '',
            affiliatedEntity: '',
            facilityType: '',
            month: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item: RemoteTechnicalSupport) => {
        setFormData({
            facilityName: item.facilityName,
            governorate: item.governorate,
            visitType: item.visitType,
            affiliatedEntity: item.affiliatedEntity,
            facilityType: item.facilityType,
            month: item.month
        });
        setEditingId(item.id || null);
        setIsExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!userCanEdit) return;

        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteRemoteTechnicalSupport(id);
            if (success) {
                await loadData();
                alert('تم الحذف بنجاح');
            } else {
                alert('حدث خطأ أثناء الحذف');
            }
        }
    };

    // Export functions
    const exportToExcel = () => {
        const data = filteredData.map((item, index) => {
            return {
                '#': index + 1,
                'اسم المنشأة': item.facilityName,
                'المحافظة': item.governorate,
                'نوع الزيارة': item.visitType,
                'الجهة التابعة': item.affiliatedEntity,
                'نوع المنشأة': item.facilityType,
                'الشهر': item.month
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الدعم الفني عن بعد');
        XLSX.writeFile(workbook, `الدعم_الفني_عن_بعد.xlsx`);
    };

    const exportToWord = async () => {
        const tableRows = filteredData.map((item, index) => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString() })] }),
                    new TableCell({ children: [new Paragraph({ text: item.facilityName })] }),
                    new TableCell({ children: [new Paragraph({ text: item.governorate })] }),
                    new TableCell({ children: [new Paragraph({ text: item.visitType })] }),
                    new TableCell({ children: [new Paragraph({ text: item.affiliatedEntity })] }),
                    new TableCell({ children: [new Paragraph({ text: item.facilityType })] }),
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
                        new TableCell({ children: [new Paragraph('الجهة التابعة')] }),
                        new TableCell({ children: [new Paragraph('نوع المنشأة')] }),
                        new TableCell({ children: [new Paragraph('الشهر')] }),
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });

        const doc = new Document({
            sections: [{
                children: [
                    new Paragraph({ text: 'الدعم الفني عن بعد', heading: 'Heading1', alignment: AlignmentType.CENTER }),
                    table
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `الدعم_الفني_عن_بعد.docx`;
        link.click();
    };

    // Filtering
    const filteredData = filterMonth
        ? remoteTechnicalSupports.filter(item => item.month === filterMonth)
        : remoteTechnicalSupports;

    return (
        <div className="card" style={{ marginTop: '20px' }}>
            <SectionHeader
                title="الدعم الفني عن بعد"
                icon="📞"
                count={filteredData.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
                                <div className="form-group">
                                    <label>اسم المنشأة *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.facilityName}
                                        onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>المحافظة</label>
                                    <select
                                        className="form-input"
                                        value={formData.governorate}
                                        onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
                                    >
                                        <option value="">اختر المحافظة</option>
                                        {egyptGovernorates.map(gov => (
                                            <option key={gov} value={gov}>{gov}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>نوع الزيارة</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.visitType}
                                        onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>الجهة التابعة</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={formData.affiliatedEntity}
                                        onChange={(e) => setFormData({ ...formData, affiliatedEntity: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>نوع المنشأة</label>
                                    <select
                                        className="form-input"
                                        value={formData.facilityType}
                                        onChange={(e) => setFormData({ ...formData, facilityType: e.target.value })}
                                    >
                                        <option value="">اختر نوع المنشأة</option>
                                        {techSupportFacilityTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>الشهر *</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        required
                                        value={formData.month}
                                        onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary">
                                    {editingId ? 'تحديث' : 'حفظ'}
                                </button>
                                {editingId && (
                                    <button type="button" className="btn btn-secondary" onClick={resetForm}>
                                        إلغاء
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                        <MonthFilter value={filterMonth} onChange={setFilterMonth} />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons onExportExcel={exportToExcel} onExportWord={exportToWord} />
                            {userCanEdit && (
                                <ExcelImportButton
                                    sectionDef={allSectionDefinitions['dept2']['remote_technical_supports']}
                                    userId={currentUser.email || currentUser.uid || 'unknown'}
                                    onImportComplete={loadData}
                                />
                            )}
                        </div>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>اسم المنشأة</th>
                                    <th>المحافظة</th>
                                    <th>نوع الزيارة</th>
                                    <th>الجهة التابعة</th>
                                    <th>نوع المنشأة</th>
                                    <th>الشهر</th>
                                    {userCanEdit && <th>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 8 : 7} style={{ textAlign: 'center', padding: '20px' }}>لا توجد بيانات</td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id}>
                                            <td>{index + 1}</td>
                                            <td>{item.facilityName}</td>
                                            <td>{item.governorate}</td>
                                            <td>{item.visitType}</td>
                                            <td>{item.affiliatedEntity}</td>
                                            <td>{item.facilityType}</td>
                                            <td>{item.month}</td>
                                            {userCanEdit && (
                                                <td>
                                                    <button onClick={() => handleEdit(item)} style={{ marginRight: '5px' }}>✍️</button>
                                                    <button onClick={() => handleDelete(item.id!)}>🗑️</button>
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
