'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    ReceivedProject,
    saveReceivedProject,
    getReceivedProjects,
    updateReceivedProject,
    deleteReceivedProject
} from '@/lib/firestore';

interface ReceivedProjectsSectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
    globalFilterMonth?: string | null;
}

// أنواع الجهات المرسلة
const entityTypes = [
    'مشروعات التأمين الصحي الشامل',
    'مشروعات المستشفيات الخاصة',
    'مشروعات الجامعات',
    'مشروعات وزارة الصحة',
    'هيئات أخرى'
];

/**
 * مكون قسم "المشروعات المستلمة حسب الجهة المرسلة" لـ dept10
 */
export default function ReceivedProjectsSection({ currentUser, canEdit, globalFilterMonth }: ReceivedProjectsSectionProps) {
    // State
    const [projects, setProjects] = useState<ReceivedProject[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        entityType: '',
        projectCount: '',
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // Load data
    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        const data = await getReceivedProjects();
        setProjects(data);
    };

    // Form handlers
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        if (!formData.month) {
            alert('يرجى اختيار الشهر');
            return;
        }

        if (!formData.entityType) {
            alert('يرجى اختيار الجهة');
            return;
        }

        const [year] = formData.month.split('-');

        const projectData = {
            entityType: formData.entityType,
            projectCount: formData.projectCount ? parseInt(formData.projectCount) : 0,
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateReceivedProject(editingId, {
                    ...projectData,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadProjects();
                    resetForm();
                    alert('تم تحديث البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء تحديث البيانات');
                }
            } else {
                const id = await saveReceivedProject(projectData);
                if (id) {
                    await loadProjects();
                    resetForm();
                    alert('تم إضافة البيانات بنجاح');
                } else {
                    alert('حدث خطأ أثناء حفظ البيانات');
                }
            }
        } catch (error) {
            console.error('Error saving received project:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetForm = () => {
        setFormData({
            entityType: '',
            projectCount: '',
            month: ''
        });
        setEditingId(null);
    };

    const handleEdit = (project: ReceivedProject) => {
        setFormData({
            entityType: project.entityType || '',
            projectCount: project.projectCount ? project.projectCount.toString() : '',
            month: project.month
        });
        setEditingId(project.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (projectId: string) => {
        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لحذف البيانات');
            return;
        }

        if (confirm('هل أنت متأكد من حذف هذه البيانات؟')) {
            const success = await deleteReceivedProject(projectId);
            if (success) {
                await loadProjects();
                alert('تم حذف البيانات بنجاح');
            } else {
                alert('حدث خطأ أثناء حذف البيانات');
            }
        }
    };

    // Filtering
    const filteredProjects = (globalFilterMonth || filterMonth)
        ? projects.filter(p => p.month === (globalFilterMonth || filterMonth))
        : projects;

    // Export functions
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const data = filteredProjects.map((project, index) => {
            const [year, month] = project.month.split('-');
            return {
                '#': index + 1,
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`,
                'الجهة المرسلة': project.entityType || '',
                'عدد المشروعات': project.projectCount || 0
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المشروعات المستلمة');

        const filterMonthText = (globalFilterMonth || filterMonth)
            ? `_${(globalFilterMonth || filterMonth).replace('-', '_')}`
            : '';

        XLSX.writeFile(workbook, `المشروعات_المستلمة${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredProjects.map((project, index) => {
            const [year, month] = project.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })],
                        width: { size: 25, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: project.entityType || '', alignment: AlignmentType.CENTER })],
                        width: { size: 45, type: WidthType.PERCENTAGE }
                    }),
                    new TableCell({
                        children: [new Paragraph({ text: (project.projectCount || 0).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 20, type: WidthType.PERCENTAGE }
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
                            width: { size: 25, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'الجهة المرسلة', alignment: AlignmentType.CENTER })],
                            width: { size: 45, type: WidthType.PERCENTAGE }
                        }),
                        new TableCell({
                            children: [new Paragraph({ text: 'عدد المشروعات', alignment: AlignmentType.CENTER })],
                            width: { size: 20, type: WidthType.PERCENTAGE }
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
                        text: 'المشروعات المستلمة حسب الجهة المرسلة',
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

        const filterMonthText = (globalFilterMonth || filterMonth)
            ? `_${(globalFilterMonth || filterMonth).replace('-', '_')}`
            : '';

        link.download = `المشروعات_المستلمة${filterMonthText}.docx`;
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
                title="المشروعات المستلمة حسب الجهة المرسلة"
                icon="📥"
                count={filteredProjects.length}
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
                                    <label className="form-label">الجهة المرسلة *</label>
                                    <select
                                        className="form-input"
                                        required
                                        value={formData.entityType}
                                        onChange={(e) => setFormData({ ...formData, entityType: e.target.value })}
                                    >
                                        <option value="">اختر الجهة</option>
                                        {entityTypes.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">عدد المشروعات</label>
                                    <input
                                        type="number"
                                        className="form-input"
                                        min="0"
                                        value={formData.projectCount}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            if (val === '' || Number(val) >= 0) {
                                                setFormData({ ...formData, projectCount: val });
                                            }
                                        }}
                                        placeholder="0"
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
                            value={globalFilterMonth || filterMonth}
                            onChange={(val) => !globalFilterMonth && setFilterMonth(val)}
                            label="فلترة حسب الشهر"
                            minWidth="250px"
                            disabled={!!globalFilterMonth}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <ExportButtons
                                onExportExcel={exportToExcel}
                                onExportWord={exportToWord}
                                show={filteredProjects.length > 0}
                            />
                        </div>
                    </div>

                    {/* Table */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الجهة المرسلة</th>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>عدد المشروعات</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredProjects.length === 0 ? (
                                    <tr>
                                        <td colSpan={userCanEdit ? 5 : 4} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📥</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredProjects.map((project, index) => (
                                        <tr key={project.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(project.month)}</td>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{project.entityType}</td>
                                            <td style={{ padding: '12px', textAlign: 'center', color: '#0D6A79', fontWeight: 'bold' }}>{project.projectCount || 0}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '12px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button
                                                            onClick={() => handleEdit(project)}
                                                            style={{ padding: '6px 12px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
                                                        >
                                                            تعديل
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(project.id!)}
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
