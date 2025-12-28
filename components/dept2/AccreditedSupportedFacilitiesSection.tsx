'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
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

// قائمة المحافظات المصرية
const egyptGovernorates = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر', 'البحيرة', 'الفيوم', 'الغربية',
    'الإسماعيلية', 'المنوفية', 'المنيا', 'القليوبية', 'الوادي الجديد', 'الشرقية', 'السويس',
    'أسوان', 'أسيوط', 'بني سويف', 'بورسعيد', 'دمياط', 'الأقصر', 'سوهاج', 'جنوب سيناء',
    'كفر الشيخ', 'مطروح', 'قنا', 'شمال سيناء'
];

/**
 * مكون قسم "المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم" لـ dept2
 */
export default function AccreditedSupportedFacilitiesSection({ currentUser, canEdit }: AccreditedSupportedFacilitiesSectionProps) {
    // State
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

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await getAccreditedSupportedFacilities();
        setFacilities(data);
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!formData.facilityName || !formData.governorate || !formData.decisionNumber ||
            !formData.decisionDate || !formData.supportType || !formData.accreditationStatus || !formData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = formData.month.split('-');

        const facilityData = {
            facilityName: formData.facilityName,
            governorate: formData.governorate,
            decisionNumber: formData.decisionNumber,
            decisionDate: formData.decisionDate,
            supportType: formData.supportType,
            accreditationStatus: formData.accreditationStatus,
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateAccreditedSupportedFacility(editingId, {
                    ...facilityData,
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
                const id = await saveAccreditedSupportedFacility(facilityData);
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
            decisionNumber: '',
            decisionDate: '',
            supportType: '',
            accreditationStatus: '',
            month: ''
        });
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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذا السجل؟')) {
            const success = await deleteAccreditedSupportedFacility(id);
            if (success) {
                await loadData();
                alert('تم حذف السجل بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف السجل');
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
                'رقم القرار': item.decisionNumber,
                'تاريخ القرار': item.decisionDate,
                'نوع الدعم': item.supportType,
                'حالة الاعتماد': item.accreditationStatus
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المنشآت المعتمدة');

        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `المنشآت_المعتمدة_المدعومة${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const tableRows = filteredData.map((item, index) => {
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.facilityName, alignment: AlignmentType.RIGHT })], width: { size: 22, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.governorate, alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.decisionNumber, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.decisionDate, alignment: AlignmentType.CENTER })], width: { size: 13, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.supportType, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.accreditationStatus, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 22, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'رقم القرار', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'تاريخ القرار', alignment: AlignmentType.CENTER })], width: { size: 13, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'نوع الدعم', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'حالة الاعتماد', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })
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
                        text: 'المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم',
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
        link.download = `المنشآت_المعتمدة_المدعومة${filterMonthText}.docx`;
        link.click();
    };

    // Filtering
    const filteredData = filterMonth
        ? facilities.filter(f => f.month === filterMonth)
        : facilities;

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="المنشآت المعتمدة من المنشآت التي تلقت زيارات دعم"
                icon="🏆"
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
                                    <label className="form-label">اسم المنشأة *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.facilityName}
                                        onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                                        placeholder="اسم المنشأة"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">المحافظة *</label>
                                    <select
                                        className="form-input"
                                        required
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
                                    <label className="form-label">رقم القرار *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={formData.decisionNumber}
                                        onChange={(e) => setFormData({ ...formData, decisionNumber: e.target.value })}
                                        placeholder="رقم قرار الاعتماد"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">تاريخ القرار *</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        required
                                        value={formData.decisionDate}
                                        onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">نوع الدعم *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.supportType}
                                        onChange={(e) => setFormData({ ...formData, supportType: e.target.value })}
                                    >
                                        <option value="">اختر نوع الدعم</option>
                                        <option value="دعم فني">دعم فني</option>
                                        <option value="دعم فني تمهيدي">دعم فني تمهيدي</option>
                                        <option value="دعم فني عن بعد">دعم فني عن بعد</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">حالة الاعتماد *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.accreditationStatus}
                                        onChange={(e) => setFormData({ ...formData, accreditationStatus: e.target.value })}
                                    >
                                        <option value="">اختر حالة الاعتماد</option>
                                        <option value="اعتماد">اعتماد</option>
                                        <option value="اعتماد مبدئي">اعتماد مبدئي</option>
                                        <option value="تجديد اعتماد">تجديد اعتماد</option>
                                        <option value="استكمال اعتماد">استكمال اعتماد</option>
                                    </select>
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
                                    <th style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold' }}>اسم المنشأة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>المحافظة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>رقم القرار</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>تاريخ القرار</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>نوع الدعم</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>حالة الاعتماد</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 8 : 7} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{item.facilityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.decisionNumber}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.decisionDate}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{item.supportType}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{item.accreditationStatus}</td>
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
