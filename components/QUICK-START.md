# 🚀 دليل سريع: إضافة مكون قسم جديد

## الخطوات الأساسية (5 دقائق)

### 1️⃣ إنشاء ملف المكون الجديد

انسخ المحتوى أدناه وعدّله حسب احتياجاتك:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import {
    // استورد الـ Type والدوال المطلوبة من firestore
    // مثال: TrainingEntity, saveTrainingEntity, etc.
} from '@/lib/firestore';

interface YOUR_SECTION_Props {
    currentUser: any;
    canEdit: (user: any) => boolean;
}

export default function YOUR_SECTIONSection({ currentUser, canEdit }: YOUR_SECTION_Props) {
    // ============ STATE ============
    const [data, setData] = useState<YOUR_TYPE[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterMonth, setFilterMonth] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);
    const [formData, setFormData] = useState({
        // أضف حقول النموذج هنا
        month: ''
    });

    const userCanEdit = currentUser && canEdit(currentUser);

    // ============ LOAD DATA ============
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const result = await getYOUR_DATA();
        setData(result);
    };

    // ============ FORM HANDLERS ============
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentUser || !canEdit(currentUser)) {
            alert('ليس لديك صلاحية لإضافة البيانات');
            return;
        }

        // تحقق من الحقول المطلوبة
        if (!formData.month /* أضف الحقول الأخرى */) {
            alert('يرجى ملء جميع الحقول المطلوبة');
            return;
        }

        const [year, month] = formData.month.split('-');

        const dataToSave = {
            ...formData,
            year: parseInt(year),
            createdBy: currentUser.email,
            updatedBy: currentUser.email
        };

        try {
            if (editingId) {
                const success = await updateYOUR_DATA(editingId, {
                    ...dataToSave,
                    updatedBy: currentUser.email
                });

                if (success) {
                    await loadData();
                    resetForm();
                    alert('تم تحديث البيانات بنجاح');
                }
            } else {
                const id = await saveYOUR_DATA(dataToSave);
                if (id) {
                    await loadData();
                    resetForm();
                    alert('تم إضافة البيانات بنجاح');
                }
            }
        } catch (error) {
            console.error('Error saving data:', error);
            alert('حدث خطأ أثناء حفظ البيانات');
        }
    };

    const resetForm = () => {
        setFormData({
            // أعد تعيين الحقول
            month: ''
        });
        setEditingId(null);
    };

    const handleEdit = (item: YOUR_TYPE) => {
        setFormData({
            // حدد الحقول للتعديل
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
            const success = await deleteYOUR_DATA(id);
            if (success) {
                await loadData();
                alert('تم حذف السجل بنجاح');
            }
        }
    };

    // ============ EXPORT FUNCTIONS ============
    const exportToExcel = () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const excelData = filteredData.map((item, index) => {
            const [year, month] = item.month.split('-');
            return {
                '#': index + 1,
                // أضف الأعمدة هنا
                'الشهر': `${monthNames[parseInt(month) - 1]} ${year}`
            };
        });

        const worksheet = XLSX.utils.json_to_sheet(excelData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'SECTION_NAME');

        const filterMonthText = filterMonth ? `_${filterMonth.replace('-', '_')}` : '';
        XLSX.writeFile(workbook, `SECTION_NAME${filterMonthText}.xlsx`);
    };

    const exportToWord = async () => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];

        const tableRows = filteredData.map((item, index) => {
            const [year, month] = item.month.split('-');
            return new TableRow({
                children: [
                    new TableCell({ 
                        children: [new Paragraph({ text: (index + 1).toString(), alignment: AlignmentType.CENTER })],
                        width: { size: 10, type: WidthType.PERCENTAGE }
                    }),
                    // أضف الأعمدة الأخرى هنا
                ]
            });
        });

        const table = new Table({
            rows: [
                new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph({ text: '#', alignment: AlignmentType.CENTER })] }),
                        // أضف رؤوس الأعمدة هنا
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
                        text: 'SECTION_TITLE',
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
        link.download = `SECTION_NAME${filterMonthText}.docx`;
        link.click();
    };

    // ============ FILTERING ============
    const filteredData = filterMonth
        ? data.filter(item => item.month === filterMonth)
        : data;

    const formatMonthYear = (month: string) => {
        const monthNames = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const [year, monthNum] = month.split('-');
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
    };

    // ============ RENDER ============
    return (
        <div className="card" style={{ marginTop: '30px' }}>
            <SectionHeader
                title="عنوان القسم"
                icon="📋"
                count={filteredData.length}
                isExpanded={isExpanded}
                onToggle={() => setIsExpanded(!isExpanded)}
            />

            {isExpanded && (
                <>
                    {/* ============ FORM ============ */}
                    {userCanEdit && (
                        <form onSubmit={handleSubmit} style={{ marginBottom: '30px', padding: '20px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                            <h3 style={{ marginTop: 0, marginBottom: '20px', color: 'var(--secondary-color)' }}>
                                {editingId ? 'تعديل بيانات' : 'إضافة بيانات جديدة'}
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                                {/* أضف حقول النموذج هنا */}
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

                    {/* ============ FILTER AND EXPORT ============ */}
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

                    {/* ============ TABLE ============ */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: 'white', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', borderRadius: '8px', overflow: 'hidden' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#0D6A79', color: 'white' }}>
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>#</th>
                                    {/* أضف رؤوس الأعمدة هنا */}
                                    <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>الشهر</th>
                                    {userCanEdit && <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold' }}>إجراءات</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 ? (
                                    <tr>
                                        <td colSpan={99} style={{ padding: '40px', textAlign: 'center', color: '#999' }}>
                                            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>📊</div>
                                            لا توجد بيانات
                                        </td>
                                    </tr>
                                ) : (
                                    filteredData.map((item, index) => (
                                        <tr key={item.id} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{index + 1}</td>
                                            {/* أضف خلايا البيانات هنا */}
                                            <td style={{ padding: '12px', textAlign: 'center' }}>{formatMonthYear(item.month)}</td>
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
```

### 2️⃣ عدّل الـ Placeholders

ابحث في الكود عن واستبدل:
- `YOUR_SECTION` → اسم المكون (مثل: `TrainingEntities`)
- `YOUR_TYPE` → نوع البيانات (مثل: `TrainingEntity`)
- `YOUR_DATA` → اسم الدوال (مثل: `TrainingEntity`)
- `SECTION_NAME` → اسم القسم
- `SECTION_TITLE` → عنوان القسم بالعربية

### 3️⃣ أضف الحقول المطلوبة

في قسم `formData`، أضف الحقول حسب احتياجاتك:
```tsx
const [formData, setFormData] = useState({
    entityName: '',      // مثال
    traineesCount: '',   // مثال
    month: ''
});
```

### 4️⃣ أضف التصدير في index.ts

```tsx
// components/deptX/index.ts
export { default as YOUR_SECTIONSection } from './YOUR_SECTIONSection';
```

### 5️⃣ استخدم المكون في page.tsx

```tsx
// app/department/[id]/page.tsx
import { YOUR_SECTIONSection } from '@/components/deptX';

// في الـ JSX
{id === 'deptX' && (
    <YOUR_SECTIONSection
        currentUser={currentUser}
        canEdit={canEdit}
    />
)}
```

## ✅ قائمة مراجعة سريعة

قبل اعتبار المكون مكتملاً، تأكد من:

- [ ] تم إنشاء ملف المكون في المجلد الصحيح
- [ ] تم استيراد المكونات المشتركة
- [ ] تم استيراد الأنواع والدوال من firestore
- [ ] تم إضافة جميع الحقول المطلوبة في formData
- [ ] تم تنفيذ loadData بشكل صحيح
- [ ] handleSubmit يعمل للإضافة والتعديل
- [ ] handleDelete يعمل بشكل صحيح
- [ ] exportToExcel يحتوي على جميع الأعمدة
- [ ] exportToWord يحتوي على جميع الأعمدة
- [ ] الجدول يعرض جميع البيانات بشكل صحيح
- [ ] tم إضافة التصدير في index.ts
- [ ] تم استخدام المكون في page.tsx
- [ ] تم اختبار جميع الوظائف (إضافة، تعديل، حذف، تصدير)

## 🎨 ألوان ثابتة

استخدم هذه الألوان بشكل ثابت:
- رأس الجدول: `#0D6A79`
- الصفوف الفردية: `white`
- الصفوف الزوجية: `#f9f9f9`
- زر التعديل: `#0eacb8`
- زر الحذف: `#dc3545`
- أزرار الإجراءات الأساسية: `var(--primary-color)`

## 📚 أمثلة جاهزة

للمرجع:
- **بسيط:** `components/dept1/TrainingEntitiesSection.tsx`
- **متوسط:** `components/dept2/RemoteTechSupportSection.tsx`
- **المكونات المشتركة:** `components/shared/`

---

وقت القراءة: 3 دقائق | وقت التنفيذ: 10-15 دقيقة
