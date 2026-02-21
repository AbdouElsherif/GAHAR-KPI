'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    CollectedRevenue,
    saveCollectedRevenue,
    getCollectedRevenues,
    updateCollectedRevenue,
    deleteCollectedRevenue
} from '@/lib/firestore';

interface CollectedRevenuesSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
    globalFilterMonth?: string | null;
}

/**
 * مكون قسم "الإيرادات المحصلة" لـ dept1
 */
export default function CollectedRevenuesSection({ currentUser, canEdit, globalFilterMonth }: CollectedRevenuesSectionProps) {
    // State
    const [revenues, setRevenues] = useState<CollectedRevenue[]>([]);
    const [editingRevenueId, setEditingRevenueId] = useState<string | null>(null);
    const [revenueFilterMonth, setRevenueFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [revenueFormData, setRevenueFormData] = useState({
        source: '',
        value: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadRevenues();
    }, []);

    const loadRevenues = async () => {
        const data = await getCollectedRevenues();
        setRevenues(data);
    };

    // Form handlers
    const handleRevenueSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!revenueFormData.month) {
            alert('يرجى اختيار الشهر');
            return;
        }

        if (!revenueFormData.source) {
            alert('يرجى إدخال مصدر الإيراد');
            return;
        }

        const [year, month] = revenueFormData.month.split('-');

        const revenueData = {
            departmentId: 'dept1',
            source: revenueFormData.source,
            value: revenueFormData.value ? parseFloat(revenueFormData.value) : 0,
            month: revenueFormData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingRevenueId) {
                const success = await updateCollectedRevenue(editingRevenueId, {
                    ...revenueData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadRevenues();
                    resetRevenueForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveCollectedRevenue(revenueData);
                if (id) {
                    await loadRevenues();
                    resetRevenueForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving collected revenue:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetRevenueForm = () => {
        setRevenueFormData({
            source: '',
            value: '',
            month: ''
        });
        setEditingRevenueId(null);
    };

    const handleEditRevenue = (revenue: CollectedRevenue) => {
        setRevenueFormData({
            source: revenue.source,
            value: revenue.value.toString(),
            month: revenue.month
        });
        setEditingRevenueId(revenue.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteRevenue = async (revenueId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
            const success = await deleteCollectedRevenue(revenueId);
            if (success) {
                await loadRevenues();
                alert('تم حذف البيانات بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف البيانات');
            }
        }
    };

    // Filtering
    const filteredRevenues = (globalFilterMonth || revenueFilterMonth)
        ? revenues.filter(r => r.month === (globalFilterMonth || revenueFilterMonth))
        : revenues;

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredRevenues.map((revenue, index) => {
            const [year, month] = revenue.month.split('-');
            return {
                '#': index + 1,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`,
                'مصدر الإيراد': revenue.source,
                'القيمة المالية': revenue.value
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'الإيرادات المحصلة');

        const filterMonthText = (globalFilterMonth || revenueFilterMonth)
            ? `_${(globalFilterMonth || revenueFilterMonth).replace('-', '_')}`
            : '';

        XLSX.writeFile(workbook, `الإيرادات_المحصلة${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredRevenues.map((revenue, index) => {
            const [year, month] = revenue.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: revenue.source, alignment: AlignmentType.CENTER })],
                        width: { size: 40, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: revenue.value.toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 30, type: WidthType.PERCENTAGE }
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
                            children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'مصدر الإيراد', alignment: AlignmentType.CENTER })],
                            width: { size: 40, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'القيمة المالية', alignment: AlignmentType.CENTER })],
                            width: { size: 30, type: WidthType.PERCENTAGE }
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
                        text: 'الإيرادات المحصلة',
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

        const filterMonthText = (globalFilterMonth || revenueFilterMonth)
            ? `_${(globalFilterMonth || revenueFilterMonth).replace('-', '_')}`
            : '';

        link.download = `الإيرادات_المحصلة${filterMonthText}.docx`;
        link.click();
    };

    // Format month for display
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="الإيرادات المحصلة"
                icon="💰"
                count={filteredRevenues.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* Form */}
                    {userCanEdit && (
                        <form onSubmit={handleRevenueSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingRevenueId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">الشهر *</label>
                                    <input
                                        type="month"
                                        className="form-input"
                                        required
                                        value={revenueFormData.month}
                                        onChange={(e) => setRevenueFormData({ ...revenueFormData, month: e.target.value })}
                                        min="2019-01"
                                        max={new Date().toISOString().split('T')[0].slice(0, 7)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">مصدر الإيراد *</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        required
                                        value={revenueFormData.source}
                                        onChange={(e) => setRevenueFormData({ ...revenueFormData, source: e.target.value })}
                                        placeholder="مصدر الإيراد"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">القيمة المالية *</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        required
                                        min="0"
                                        value={revenueFormData.value}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || Number(val) >= 0) {
                                                setRevenueFormData({ ...revenueFormData, value: val });
                                            }
                                        }}
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button type="submit" className="btn" style={{ backgroundColor: 'var(--primary-color)', color: 'white' }}>
                                    {editingRevenueId ? 'تحديث البيانات' : 'حفظ البيانات'}
                                </button>
                                {editingRevenueId && (
                                    <button type="button" className="btn" style={{ backgroundColor: '#6c757d', color: 'white' }} onClick={resetRevenueForm}>
                                        إلغاء التعديل
                                    </button>
                                )}
                            </div>
                        </form>
                    )}

                    {/* Filter and Export */}
                    <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: '15px' }}>
                        <MonthFilter
                            value={globalFilterMonth || revenueFilterMonth}
                            onChange={(val) => !globalFilterMonth && setRevenueFilterMonth(val)}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
                            disabled={!!globalFilterMonth}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredRevenues.length > 0}
                            />
                        </div>
                    </div>

                    {/* Notice */}
                    <div style={{
                        backgroundColor: '#fff3cd',
                        color: '#856404',
                        padding: '12px 20px',
                        borderRadius: '8px',
                        marginBottom: '15px',
                        fontWeight: 'bold',
                        fontSize: '0.95rem',
                        border: '1px solid #ffc107'
                    }}>
                        ⚠️ تنويه: المؤشر نصف سنوي
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>مصدر الإيراد</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>القيمة المالية</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredRevenues.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 5 : 4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>💰</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredRevenues.map((revenue, index) => (
                                        <tr key={revenue.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(revenue.month)}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>{revenue.source}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>
                                                {typeof revenue.value === 'number' ? revenue.value.toLocaleString() : revenue.value}
                                            </td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEditRevenue(revenue)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteRevenue(revenue.id!)}
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
