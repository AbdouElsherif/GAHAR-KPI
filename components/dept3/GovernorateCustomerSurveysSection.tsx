'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    GovernorateCustomerSurvey,
    saveGovernorateCustomerSurvey,
    getGovernorateCustomerSurveys,
    updateGovernorateCustomerSurvey,
    deleteGovernorateCustomerSurvey
} from '@/lib/firestore';

interface GovernorateCustomerSurveysSectionProps {
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

/**
 * مكون قسم "استبيانات رضاء المتعاملين حسب المحافظة" لـ dept3
 */
export default function GovernorateCustomerSurveysSection({ currentUser, canEdit }: GovernorateCustomerSurveysSectionProps) {
    // State
    const [surveys, setSurveys] = useState<GovernorateCustomerSurvey[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [formData, setFormData] = useState({
        month: '',
        governorate: '',
        visitImplementationRate: '',
        facilitiesCount: '',
        visitedFacilitiesList: '',
        patientSurveysCount: '',
        staffSurveysCount: '',
        patientSatisfactionRate: '',
        staffSatisfactionRate: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadSurveys();
    }, []);

    const loadSurveys = async () => {
        const data = await getGovernorateCustomerSurveys();
        setSurveys(data);
    };

    // Helper function to get percentage color
    const getPercentageColor = (percentage: number): string => {
        if (percentage >= 70) return '#28a745'; // أخضر
        if (percentage >= 50) return '#ffc107'; // برتقالي
        return '#dc3545'; // أحمر
    };

    // Toggle row expansion
    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    // Expand/collapse all
    const expandAll = () => {
        const allIds = new Set(filteredSurveys.map(s => s.id!));
        setExpandedRows(allIds);
    };

    const collapseAll = () => {
        setExpandedRows(new Set());
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        // Validation
        if (!formData.month || !formData.governorate) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = formData.month.split('-');

        const surveyData = {
            month: formData.month,
            governorate: formData.governorate,
            visitImplementationRate: parseFloat(formData.visitImplementationRate) || 0,
            facilitiesCount: parseInt(formData.facilitiesCount) || 0,
            visitedFacilitiesList: formData.visitedFacilitiesList,
            patientSurveysCount: parseInt(formData.patientSurveysCount) || 0,
            staffSurveysCount: parseInt(formData.staffSurveysCount) || 0,
            patientSatisfactionRate: parseFloat(formData.patientSatisfactionRate) || 0,
            staffSatisfactionRate: parseFloat(formData.staffSatisfactionRate) || 0,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateGovernorateCustomerSurvey(editingId, {
                    ...surveyData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadSurveys();
                    resetForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveGovernorateCustomerSurvey(surveyData);
                if (id) {
                    await loadSurveys();
                    resetForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving survey:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetForm = () => {
        setFormData({
            month: '',
            governorate: '',
            visitImplementationRate: '',
            facilitiesCount: '',
            visitedFacilitiesList: '',
            patientSurveysCount: '',
            staffSurveysCount: '',
            patientSatisfactionRate: '',
            staffSatisfactionRate: ''
        });
        setEditingId(null);
    };

    const handleEdit = (survey: GovernorateCustomerSurvey) => {
        setFormData({
            month: survey.month,
            governorate: survey.governorate,
            visitImplementationRate: survey.visitImplementationRate.toString(),
            facilitiesCount: (survey.facilitiesCount || 0).toString(),
            visitedFacilitiesList: survey.visitedFacilitiesList,
            patientSurveysCount: survey.patientSurveysCount.toString(),
            staffSurveysCount: survey.staffSurveysCount.toString(),
            patientSatisfactionRate: survey.patientSatisfactionRate.toString(),
            staffSatisfactionRate: survey.staffSatisfactionRate.toString()
        });
        setEditingId(survey.id || null);
        setIsExpanded(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
            const success = await deleteGovernorateCustomerSurvey(id);
            if (success) {
                await loadSurveys();
                alert('تم حذف البيانات بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف البيانات');
            }
        }
    };

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredSurveys.map((survey, index) => {
            const [year, month] = survey.month.split('-');
            return {
                '#': index + 1,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`,
                'المحافظة': survey.governorate,
                'نسبة تنفيذ الزيارات %': survey.visitImplementationRate,
                'عدد المنشآت': survey.facilitiesCount || 0,
                'استبيانات المرضى': survey.patientSurveysCount,
                'استبيانات العاملين': survey.staffSurveysCount,
                'نسبة رضاء المرضى %': survey.patientSatisfactionRate,
                'نسبة رضاء العاملين %': survey.staffSatisfactionRate,
                'المنشآت التي تمت زيارتها': survey.visitedFacilitiesList
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'استبيانات المحافظات');

        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `استبيانات_المحافظات${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredSurveys.map((survey, index) => {
            const [year, month] = survey.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: survey.governorate, alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: survey.visitImplementationRate + '%', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: (survey.facilitiesCount || 0).toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: survey.patientSurveysCount.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: survey.staffSurveysCount.toString(), alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: survey.patientSatisfactionRate + '%', alignment: AlignmentType.CENTER })] }),
                    new TableCell({ children: [new Paragraph({ text: survey.staffSatisfactionRate + '%', alignment: AlignmentType.CENTER })] })
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'المحافظة', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'نسبة التنفيذ %', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'عدد المنشآت', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'استبيانات المرضى', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'استبيانات العاملين', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'رضاء المرضى %', alignment: AlignmentType.CENTER })] }),
                        new TableCell({ children: [new Paragraph({ text: 'رضاء العاملين %', alignment: AlignmentType.CENTER })] })
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
                    new Paragraph({ text: 'استبيانات رضاء المتعاملين حسب المحافظة', alignment: AlignmentType.CENTER, spacing: { after: 200 } }),
                    table
                ]
            }]
        });

        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        link.download = `استبيانات_المحافظات${filterMonthText}.docx`;
        link.click();
    };

    // Filtering
    const filteredSurveys = filterMonth
        ? surveys.filter(s => s.month === filterMonth)
        : surveys;

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="استبيانات رضاء المتعاملين حسب المحافظة"
                icon="📍"
                count={filteredSurveys.length}
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

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
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
                                    <label className="form-label">نسبة تنفيذ الزيارات (%) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.visitImplementationRate}
                                        onChange={(e) => setFormData({ ...formData, visitImplementationRate: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">عدد المنشآت *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={formData.facilitiesCount}
                                        onChange={(e) => setFormData({ ...formData, facilitiesCount: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد استبيانات المرضى *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={formData.patientSurveysCount}
                                        onChange={(e) => setFormData({ ...formData, patientSurveysCount: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد استبيانات العاملين *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={formData.staffSurveysCount}
                                        onChange={(e) => setFormData({ ...formData, staffSurveysCount: e.target.value })}
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px', marginBottom: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">نسبة رضاء المرضى (%) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.patientSatisfactionRate}
                                        onChange={(e) => setFormData({ ...formData, patientSatisfactionRate: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">نسبة رضاء العاملين (%) *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        max="100"
                                        step="0.01"
                                        value={formData.staffSatisfactionRate}
                                        onChange={(e) => setFormData({ ...formData, staffSatisfactionRate: e.target.value })}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label className="form-label">المنشآت التي تمت زيارتها (كل منشأة في سطر جديد)</label>
                                <textarea
                                    className="form-input"
                                    rows={6}
                                    value={formData.visitedFacilitiesList}
                                    onChange={(e) => setFormData({ ...formData, visitedFacilitiesList: e.target.value })}
                                    placeholder="• مستشفى السلام&#10;• وحدة صحة أسرة الضواحي&#10;• ..."
                                    style={{ fontFamily: 'inherit', resize: 'vertical' }}
                                />
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

                    {/* Filter, Export, and Expand/CollapseButtons */}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px', flexWrap: 'wrap' }}>
                        <MonthFilter
                            value={filterMonth}
                            onChange={setFilterMonth}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
                        />
                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                            {filteredSurveys.length > 0 && (
                                <>
                                    <button
                                        onClick={expandAll}
                                        style={{ padding: '8px 16px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        توسيع الكل
                                    </button>
                                    <button
                                        onClick={collapseAll}
                                        style={{ padding: '8px 16px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.9rem' }}
                                    >
                                        طي الكل
                                    </button>
                                </>
                            )}
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredSurveys.length > 0}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ background: 'linear-gradient(135deg, #0D6A79 0%, #0eacb8 100%)', color: 'white' }}>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', width: '40px' }}>#</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold', width: '50px' }}></th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>المحافظة</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>نسبة التنفيذ</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>عدد المنشآت</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>استبيانات المرضى</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>استبيانات العاملين</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>رضاء المرضى %</th>
                                    <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>رضاء العاملين %</th>
                                    {userCanEdit && <th style={{ padding: '15px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredSurveys.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 10 : 9} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📍</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSurveys.map((survey, index) => (
                                        <React.Fragment key={survey.id}>
                                            {/* Main Row */}
                                            <tr style={{
                                                borderBottom: expandedRows.has(survey.id!) ? 'none' : '1px solid #eee',
                                                backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9',
                                                cursor: 'pointer'
                                            }}>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <button
                                                        onClick={() => toggleRow(survey.id!)}
                                                        style={{
                                                            background: 'none',
                                                            border: 'none',
                                                            cursor: 'pointer',
                                                            fontSize: '1.2rem',
                                                            color: '#0D6A79'
                                                        }}
                                                    >
                                                        {expandedRows.has(survey.id!) ? '▼' : '▶'}
                                                    </button>
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {survey.governorate}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    {survey.visitImplementationRate >= 100 ? <span style={{ marginLeft: '5px' }}>✅</span> : ''}
                                                    {survey.visitImplementationRate}%
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>
                                                    {(survey.facilitiesCount || 0).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>
                                                    {survey.patientSurveysCount.toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>
                                                    {survey.staffSurveysCount.toLocaleString()}
                                                </td>
                                                <td style={{
                                                    padding: '12px',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: getPercentageColor(survey.patientSatisfactionRate)
                                                }}>
                                                    {survey.patientSatisfactionRate}%
                                                </td>
                                                <td style={{
                                                    padding: '12px',
                                                    textAlign: 'center',
                                                    fontWeight: 'bold',
                                                    color: getPercentageColor(survey.staffSatisfactionRate)
                                                }}>
                                                    {survey.staffSatisfactionRate}%
                                                </td>
                                                {userCanEdit && (
                                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                            <button
                                                                onClick={() => handleEdit(survey)}
                                                                style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                تعديل
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(survey.id!)}
                                                                style={{ padding: '6px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                            >
                                                                حذف
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>

                                            {/* Expanded Facilities Row */}
                                            {expandedRows.has(survey.id!) && survey.visitedFacilitiesList && (
                                                <tr style={{ backgroundColor: '#e3f5f7', borderBottom: '1px solid #0eacb8' }}>
                                                    <td colSpan={userCanEdit ? 10 : 9} style={{ padding: '20px 40px' }}>
                                                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                                                            <span style={{ fontSize: '1.3rem', marginTop: '2px' }}>🏥</span>
                                                            <div style={{ flex: 1 }}>
                                                                <h4 style={{ margin: '0 0 10px 0', color: '#0D6A79', fontSize: '1.1rem' }}>
                                                                    المنشآت الصحية التي تمت زيارتها:
                                                                </h4>
                                                                <div style={{
                                                                    whiteSpace: 'pre-wrap',
                                                                    lineHeight: '1.8',
                                                                    color: '#333',
                                                                    fontSize: '0.95rem'
                                                                }}>
                                                                    {survey.visitedFacilitiesList}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
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
