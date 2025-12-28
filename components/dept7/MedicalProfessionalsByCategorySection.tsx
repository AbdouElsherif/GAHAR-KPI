'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    MedicalProfessionalByCategory,
    saveMedicalProfessionalByCategory,
    getMedicalProfessionalsByCategory,
    updateMedicalProfessionalByCategory,
    deleteMedicalProfessionalByCategory
} from '@/lib/firestore';

interface MedicalProfessionalsByCategorySectionProps {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

const branches = ['رئاسة الهيئة', 'بورسعيد', 'الأقصر', 'الإسماعيلية', 'السويس', 'أسوان', 'جنوب سيناء'];

export default function MedicalProfessionalsByCategorySection({ currentUser, canEdit }: MedicalProfessionalsByCategorySectionProps) {
    const [professionals, setProfessionals] = useState<MedicalProfessionalByCategory[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        branch: '', doctors: '0', dentists: '0', pharmacists: '0', physiotherapy: '0',
        veterinarians: '0', seniorNursing: '0', technicalNursing: '0', healthTechnician: '0', scientists: '0', month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        const data = await getMedicalProfessionalsByCategory();
        setProfessionals(data);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser || !canEdit(currentUser)) { alert('ليس لديك صلاحية'); return; }
        if (!formData.branch || !formData.month) { alert('يرجى ملء الحقول المطلوبة'); return; }

        const [year, month] = formData.month.split('-');
        const total = [formData.doctors, formData.dentists, formData.pharmacists, formData.physiotherapy,
        formData.veterinarians, formData.seniorNursing, formData.technicalNursing, formData.healthTechnician,
        formData.scientists].reduce((sum, val) => sum + parseInt(val || '0'), 0);

        const profData = {
            branch: formData.branch,
            doctors: parseInt(formData.doctors || '0'),
            dentists: parseInt(formData.dentists || '0'),
            pharmacists: parseInt(formData.pharmacists || '0'),
            physiotherapy: parseInt(formData.physiotherapy || '0'),
            veterinarians: parseInt(formData.veterinarians || '0'),
            seniorNursing: parseInt(formData.seniorNursing || '0'),
            technicalNursing: parseInt(formData.technicalNursing || '0'),
            healthTechnician: parseInt(formData.healthTechnician || '0'),
            scientists: parseInt(formData.scientists || '0'),
            total,
            month: formData.month,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateMedicalProfessionalByCategory(editingId, { ...profData, updatedBy: currentUser.email });
                if (success) { await loadData(); resetForm(); alert('تم التحديث'); }
            } else {
                const id = await saveMedicalProfessionalByCategory(profData);
                if (id) { await loadData(); resetForm(); alert('تم الإضافة'); }
            }
        } catch (error) { console.error('Error:', error); alert('حدث خطأ'); }
    };

    const resetForm = () => {
        setFormData({
            branch: '', doctors: '0', dentists: '0', pharmacists: '0', physiotherapy: '0',
            veterinarians: '0', seniorNursing: '0', technicalNursing: '0', healthTechnician: '0', scientists: '0', month: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item: MedicalProfessionalByCategory) => {
        setFormData({
            branch: item.branch, doctors: item.doctors.toString(), dentists: item.dentists.toString(),
            pharmacists: item.pharmacists.toString(), physiotherapy: item.physiotherapy.toString(),
            veterinarians: item.veterinarians.toString(), seniorNursing: item.seniorNursing.toString(),
            technicalNursing: item.technicalNursing.toString(), healthTechnician: item.healthTechnician.toString(),
            scientists: item.scientists.toString(), month: item.month
        });
        setEditingId(item.id || null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (id: string) => {
        if (!currentUser || !canEdit(currentUser)) { alert('ليس لديك صلاحية'); return; }
        if (confirm('هل أنت متأكد؟')) {
            const success = await deleteMedicalProfessionalByCategory(id);
            if (success) { await loadData(); alert('تم الحذف'); }
        }
    };

    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const data = filteredData.map((item, i) => {
            const [year, month] = item.month.split('-');
            return {
                '#': i + 1, 'الفرع': item.branch, 'أطباء بشريين': item.doctors, 'أطباء أسنان': item.dentists,
                'صيادلة': item.pharmacists, 'علاج طبيعي': item.physiotherapy, 'بيطريين': item.veterinarians,
                'تمريض عالي': item.seniorNursing, 'فني تمريض': item.technicalNursing, 'فني صحي': item.healthTechnician,
                'علميين': item.scientists, 'الإجمالي': item.total, 'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });
        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'المهنيين حسب الفئة');
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `المهنيين_الطبيين_الفئة${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const tableRows = filteredData.map((item, i) => {
            const [year, month] = item.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph({ text: (i + 1).toString(), alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.branch, alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.doctors.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.dentists.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.pharmacists.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.physiotherapy.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.veterinarians.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.seniorNursing.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.technicalNursing.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.healthTechnician.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.scientists.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: item.total.toString(), alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                    new TableCell({ children: [new Paragraph({ text: `${monthNames[parseInt(month) - 1]} ${year}`, alignment: AlignmentType.CENTER })], width: { size: 7, type: WidthType.PERCENTAGE } })
                ]
            });
        });
        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })], width: { size: 5, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الفرع', alignment: AlignmentType.CENTER })], width: { size: 12, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'أطباء', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'أسنان', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'صيادلة', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'علاج طبيعي', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'بيطريين', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'تمريض عالي', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'فني تمريض', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'فني صحي', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'علميين', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الإجمالي', alignment: AlignmentType.CENTER })], width: { size: 8, type: WidthType.PERCENTAGE } }),
                        new TableCell({ children: [new Paragraph({ text: 'الشهر', alignment: AlignmentType.CENTER })], width: { size: 7, type: WidthType.PERCENTAGE } })
                    ]
                }),
                ...tableRows
            ],
            width: { size: 100, type: WidthType.PERCENTAGE }
        });
        const doc = new Document({ sections: [{ properties: {}, children: [new Paragraph({ text: 'المهنيين الطبيين حسب الفئة', alignment: AlignmentType.CENTER, spacing: { after: 200 } }), table] }] });
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        link.download = `المهنيين_الطبيين_الفئة${filterMonthText}.docx`;
        link.click();
    };

    const filteredData = filterMonth ? professionals.filter(p => p.month === filterMonth) : professionals;
    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader title="أعضاء المهن الطبية حسب الفئة" icon="👨‍⚕️" count={filteredData.length} isExpanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)} />
            {isExpanded && (
                <>
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>{editingId ? 'تعديل' : 'إضافة'}</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                                <div className="form-group">
                                    <label className="form-label">الفرع *</label>
                                    <select className="form-input" required value={formData.branch} onChange={(e) => setFormData({ ...formData, branch: e.target.value })}>
                                        <option value="">اختر الفرع</option>
                                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">أطباء بشريين</label>
                                    <input type="number" className="form-input" min="0" value={formData.doctors} onChange={(e) => setFormData({ ...formData, doctors: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">أطباء أسنان</label>
                                    <input type="number" className="form-input" min="0" value={formData.dentists} onChange={(e) => setFormData({ ...formData, dentists: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">صيادلة</label>
                                    <input type="number" className="form-input" min="0" value={formData.pharmacists} onChange={(e) => setFormData({ ...formData, pharmacists: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">علاج طبيعي</label>
                                    <input type="number" className="form-input" min="0" value={formData.physiotherapy} onChange={(e) => setFormData({ ...formData, physiotherapy: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">بيطريين</label>
                                    <input type="number" className="form-input" min="0" value={formData.veterinarians} onChange={(e) => setFormData({ ...formData, veterinarians: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">تمريض عالي</label>
                                    <input type="number" className="form-input" min="0" value={formData.seniorNursing} onChange={(e) => setFormData({ ...formData, seniorNursing: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">فني تمريض</label>
                                    <input type="number" className="form-input" min="0" value={formData.technicalNursing} onChange={(e) => setFormData({ ...formData, technicalNursing: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">فني صحي</label>
                                    <input type="number" className="form-input" min="0" value={formData.healthTechnician} onChange={(e) => setFormData({ ...formData, healthTechnician: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">علميين</label>
                                    <input type="number" className="form-input" min="0" value={formData.scientists} onChange={(e) => setFormData({ ...formData, scientists: e.target.value })} />
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
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden', fontSize: '0.9rem' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>الفرع</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>أطباء</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>أسنان</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>صيادلة</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>علاج طبيعي</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>بيطريين</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>تمريض عالي</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>فني تمريض</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>فني صحي</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>علميين</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>الإجمالي</th>
                                    <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    {userCanEdit && <th style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr><td colSpan={userCanEdit ? 14 : 13} style={{ padding: '40px', textAlign: 'center', color: '#999' }}><div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>لا توجد بيانات</td></tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{index + 1}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: '500' }}>{item.branch}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.doctors}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.dentists}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.pharmacists}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.physiotherapy}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.veterinarians}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.seniorNursing}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.technicalNursing}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.healthTechnician}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{item.scientists}</td>
                                            <td style={{ padding: '10px', textAlign: 'center', fontWeight: 'bold', color: '#0D6A79' }}>{item.total}</td>
                                            <td style={{ padding: '10px', textAlign: 'center' }}>{formatMonthYear(item.month)}</td>
                                            {userCanEdit && (
                                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                                                        <button onClick={() => handleEdit(item)} style={{ padding: '5px 10px', backgroundColor: '#0eacb8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>تعديل</button>
                                                        <button onClick={() => handleDelete(item.id!)} style={{ padding: '5px 10px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>حذف</button>
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
