'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    TechnicalSupportVisit,
    saveTechnicalSupportVisit,
    getTechnicalSupportVisits,
    updateTechnicalSupportVisit,
    deleteTechnicalSupportVisit
} from '@/lib/firestore';

interface TechSupportVisitsSectionProps {
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

// أنواع المنشآت
const techSupportFacilityTypes = [
    'مستشفى',
    'مركز طبي',
    'عيادة',
    'مختبر طبي',
    'صيدلية',
    'مركز أشعة',
    'مركز علاج طبيعي'
];

/**
 * مكون قسم "زيارات الدعم الفني الميداني" لـ dept2
 */
export default function TechSupportVisitsSection({ currentUser, canEdit }: TechSupportVisitsSectionProps) {
    // State
    const [techSupportVisits, setTechSupportVisits] = useState<TechnicalSupportVisit[]>([]);
    const [editingVisitId, setEditingVisitId] = useState<string | null>(null);
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
        loadVisits();
    }, []);

    const loadVisits = async () => {
        const visits = await getTechnicalSupportVisits();
        setTechSupportVisits(visits);
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!formData.facilityName || !formData.governorate || !formData.visitType ||
            !formData.affiliatedEntity || !formData.facilityType || !formData.month) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = formData.month.split('-');

        const visitData = {
            facilityName: formData.facilityName,
            governorate: formData.governorate,
            visitType: formData.visitType,
            affiliatedEntity: formData.affiliatedEntity,
            facilityType: formData.facilityType,
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingVisitId) {
                const success = await updateTechnicalSupportVisit(editingVisitId, {
                    ...visitData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadVisits();
                    resetForm();
                    alert('تم تحديث الزيارة بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveTechnicalSupportVisit(visitData);
                if (id) {
                    await loadVisits();
                    resetForm();
                    alert('تم إضافة الزيارة بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving visit:', error);
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
        setEditingVisitId(null);
    };

    const handleEdit = (visit: TechnicalSupportVisit) => {
        setFormData({
            facilityName: visit.facilityName,
            governorate: visit.governorate,
            visitType: visit.visitType,
            affiliatedEntity: visit.affiliatedEntity,
            facilityType: visit.facilityType,
            month: visit.month
        });
        setEditingVisitId(visit.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (visitId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه الزيارة؟')) {
            const success = await deleteTechnicalSupportVisit(visitId);
            if (success) {
                await loadVisits();
                alert('تم حذف الزيارة بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف الزيارة');
            }
        }
    };

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredVisits.map((visit, index) => {
            const [year, month] = visit.month.split('-');
            return {
                '#': index + 1,
                'اسم المنشأة': visit.facilityName,
                'المحافظة': visit.governorate,
                'نوع الزيارة': visit.visitType,
                'الجهة التابعة': visit.affiliatedEntity,
                'نوع المنشأة': visit.facilityType,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'زيارات الدعم الفني');

        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `زيارات_الدعم_الفني_الميداني${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredVisits.map((visit, index) => {
            const [year, month] = visit.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: visit.facilityName, alignment: AlignmentType.RIGHT })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: visit.governorate, alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: visit.visitType, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: visit.affiliatedEntity, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: visit.facilityType, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'اسم المنشأة', alignment: AlignmentType.CENTER })], width: { size: 20, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'نوع الزيارة', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الجهة التابعة', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'نوع المنشأة', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 15, type: WidthType.PERCENTAGE } })
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
                        text: 'زيارات الدعم الفني الميداني',
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
        link.download = `زيارات_الدعم_الفني_الميداني${filterMonthText}.docx`;
        link.click();
    };

    // Filtering
    const filteredVisits = filterMonth
        ? techSupportVisits.filter(v => v.month === filterMonth)
        : techSupportVisits;

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="زيارات الدعم الفني الميداني"
                icon="🏥"
                count={filteredVisits.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* Form */}
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingVisitId ? 'تعديل بيانات' : 'إضافة زيارة جديدة'}
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
                                    <label className="form-label">نوع الزيارة *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.visitType}
                                        onChange={(e) => setFormData({ ...formData, visitType: e.target.value })}
                                    >
                                        <option value="">اختر نوع الزيارة</option>
                                        <option value="زيارة ميدانية">زيارة ميدانية</option>
                                        <option value="زيارة متابعة">زيارة متابعة</option>
                                        <option value="زيارة طارئة">زيارة طارئة</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">الجهة التابعة *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.affiliatedEntity}
                                        onChange={(e) => setFormData({ ...formData, affiliatedEntity: e.target.value })}
                                    >
                                        <option value="">اختر الجهة</option>
                                        <option value="هيئة الرعاية الصحية">هيئة الرعاية الصحية</option>
                                        <option value="وزارة الصحة">وزارة الصحة</option>
                                        <option value="القطاع الخاص">القطاع الخاص</option>
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
                                        {techSupportFacilityTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
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
                                    {editingVisitId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                </button>
                                {editingVisitId && (
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
                                show={filteredVisits.length > 0}
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
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>نوع الزيارة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الجهة التابعة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>نوع المنشأة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredVisits.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 8 : 7} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredVisits.map((visit, index) => (
                                        <tr key={visit.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'right', fontWeight: '500' }}>{visit.facilityName}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{visit.governorate}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{visit.visitType}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{visit.affiliatedEntity}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{visit.facilityType}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(visit.month)}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEdit(visit)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(visit.id!)}
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
