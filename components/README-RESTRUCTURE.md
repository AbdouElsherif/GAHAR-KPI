# إعادة هيكلة المشروع 🏗️

## نظرة عامة
تمت إعادة هيكلة المشروع لتحسين تنظيم الكود وقابليته للصيانة من خلال فصل المكونات إلى مجلدات منفصلة حسب الإدارة.

## البنية الجديدة

```
components/
├── shared/                    # مكونات مشتركة قابلة لإعادة الاستخدام
│   ├── index.ts              # تصدير مركزي
│   ├── SectionHeader.tsx     # رأس القسم مع زر الطي/التوسيع
│   ├── MonthFilter.tsx       # فلتر الشهر
│   └── ExportButtons.tsx     # أزرار التصدير (Excel/Word)
│
├── dept1/                     # الإدارة العامة للتدريب للغير
│   ├── index.ts              # تصدير مركزي
│   └── TrainingEntitiesSection.tsx  # قسم الجهات الحاصلة على التدريب
│
├── dept2/                     # الإدارة العامة للدعم الفني
│   ├── index.ts              # تصدير مركزي
│   ├── TechSupportVisitsSection.tsx     # قسم زيارات الدعم الفني الميداني
│   └── RemoteTechSupportSection.tsx     # قسم الدعم الفني عن بعد
│
├── dept3/                     # الإدارة العامة لرضاء المتعاملين
│   └── index.ts              # جاهز للاستخدام المستقبلي
│
├── dept4/                     # الإدارة العامة للرقابة الفنية والإكلينيكية
│   └── index.ts              # جاهز للاستخدام المستقبلي
│
├── dept5/                     # الإدارة العامة للرقابة الإدارية
│   └── index.ts              # جاهز للاستخدام المستقبلي
│
├── dept6/                     # الإدارة العامة للاعتماد والتسجيل
│   └── index.ts              # جاهز للاستخدام المستقبلي
│
├── dept7/                     # الإدارة العامة لتسجيل أعضاء المهن الطبية
│   └── index.ts              # جاهز للاستخدام المستقبلي
│
├── dept8/                     # الإدارة العامة لأبحاث وتطوير المعايير
│   └── index.ts              # جاهز للاستخدام المستقبلي
│
└── dept9/                     # الإدارة العامة لشئون المراجعين
    └── index.ts              # جاهز للاستخدام المستقبلي
```

## المكونات المشتركة

### 1. SectionHeader
رأس القسم القابل للطي والتوسيع مع أيقونة وعداد.

**الاستخدام:**
```tsx
import { SectionHeader } from '@/components/shared';

<SectionHeader
  title="عنوان القسم"
  icon="🎓"
  count={10}
  isExpanded={isExpanded}
  onToggle={() => setIsExpanded(!isExpanded)}
/>
```

**الخصائص:**
- `title`: عنوان القسم (string)
- `icon`: أيقونة (emoji أو نص - اختياري، افتراضي: '📋')
- `count`: عدد العناصر (number - اختياري)
- `isExpanded`: حالة التوسيع (boolean)
- `onToggle`: دالة التبديل (function)

### 2. MonthFilter
فلتر الشهر القابل لإعادة الاستخدام مع تحديد الحد الأقصى للتاريخ.

**الاستخدام:**
```tsx
import { MonthFilter } from '@/components/shared';

<MonthFilter
  value={filterMonth}
  onChange={setFilterMonth}
  label="فلترة حسب الشهر"
  minWidth="250px"
/>
```

**الخصائص:**
- `value`: القيمة الحالية (string - YYYY-MM)
- `onChange`: دالة التغيير (function)
- `label`: تسمية الحقل (string - اختياري، افتراضي: 'فلترة حسب الشهر')
- `maxDate`: الحد الأقصى للتاريخ (string - اختياري، افتراضي: الشهر الحالي)
- `minWidth`: الحد الأدنى للعرض (string - اختياري، افتراضي: '200px')

### 3. ExportButtons
أزرار التصدير إلى Excel و Word مع إمكانية التعطيل.

**الاستخدام:**
```tsx
import { ExportButtons } from '@/components/shared';

<ExportButtons
  onExportExcel={exportToExcel}
  onExportWord={exportToWord}
  show={data.length > 0}
/>
```

**الخصائص:**
- `onExportExcel`: دالة التصدير إلى Excel (function)
- `onExportWord`: دالة التصدير إلى Word (function)
- `disabled`: حالة التعطيل (boolean - اختياري، افتراضي: false)
- `show`: إظهار الأزرار (boolean - اختياري، افتراضي: true)

## مكونات الأقسام

### بنية المكون القياسية

كل مكون قسم يتبع نفس البنية:

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, AlignmentType } from 'docx';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
import { 
  // استيراد الأنواع والدوال من lib/firestore
} from '@/lib/firestore';

interface SectionProps {
  currentUser: any;
  canEdit: (user: any) => boolean;
}

export default function SectionName({ currentUser, canEdit }: SectionProps) {
  // State management
  // Load data
  // Form handlers
  // Export functions
  // Filter logic
  
  return (
    <div className="card" style={{ marginTop: '30px' }}>
      <SectionHeader ... />
      {isExpanded && (
        <>
          {/* Form */}
          {/* Filter and Export */}
          {/* Table */}
        </>
      )}
    </div>
  );
}
```

### مثال: TrainingEntitiesSection (dept1)

**الموقع:** `components/dept1/TrainingEntitiesSection.tsx`

**الوظيفة:** إدارة بيانات الجهات الحاصلة على التدريب

**الميزات:**
- ✅ نموذج إدخال البيانات (اسم الجهة، عدد المتدربين، الشهر)
- ✅ جدول عرض البيانات مع فلترة حسب الشهر
- ✅ تعديل وحذف السجلات
- ✅ تصدير إلى Excel و Word
- ✅ طي/توسيع القسم

**الاستخدام في page.tsx:**
```tsx
import { TrainingEntitiesSection } from '@/components/dept1';

// في component الصفحة
{id === 'dept1' && (
  <TrainingEntitiesSection
    currentUser={currentUser}
    canEdit={canEdit}
  />
)}
```

## دليل الاستخدام

### 1. استيراد المكونات المشتركة

```tsx
// استيراد جميع المكونات المشتركة
import { SectionHeader, ExportButtons, MonthFilter } from '@/components/shared';

// أو استيراد فردي
import SectionHeader from '@/components/shared/SectionHeader';
```

### 2. استيراد مكونات قسم محدد

```tsx
// استيراد جميع مكونات dept1
import * as Dept1Components from '@/components/dept1';

// أو استيراد مكون محدد
import { TrainingEntitiesSection } from '@/components/dept1';
```

### 3. إنشاء مكون قسم جديد

1. أنشئ ملف TSX جديد في المجلد المناسب (مثل `components/dept3/CustomerSatisfactionSection.tsx`)
2. استخدم البنية القياسية للمكون
3. أضف التصدير في ملف `index.ts` للمجلد
4. استخدم المكون في `page.tsx`

**مثال:**

```tsx
// components/dept3/CustomerSatisfactionSection.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { SectionHeader, ExportButtons, MonthFilter } from '../shared';
// ... بقية الاستيرادات

export default function CustomerSatisfactionSection({ currentUser, canEdit }) {
  // ... الكود
}
```

```ts
// components/dept3/index.ts
export { default as CustomerSatisfactionSection } from './CustomerSatisfactionSection';
```

```tsx
// app/department/[id]/page.tsx
import { CustomerSatisfactionSection } from '@/components/dept3';

// استخدام المكون
{id === 'dept3' && (
  <CustomerSatisfactionSection
    currentUser={currentUser}
    canEdit={canEdit}
  />
)}
```

## الفوائد

### ✅ تنظيم أفضل
- كل إدارة لها مجلدها الخاص
- سهولة إيجاد الملفات ذات الصلة

### ✅ قابلية إعادة الاستخدام
- مكونات مشتركة يمكن استخدامها في أي مكان
- تقليل تكرار الكود

### ✅ سهولة الصيانة
- تغييرات المكونات المشتركة تؤثر على جميع الأقسام
- كود منظم وسهل القراءة

### ✅ قابلية التوسع
- سهولة إضافة أقسام جديدة
- بنية واضحة ومتسقة

## الخطوات التالية

### المهام المقترحة:

1. **إكمال مكونات dept2:**
   - ✅ RemoteTechSupportSection
   - ✅ TechSupportVisitsSection
   - ⏳ IntroductorySupportVisitsSection
   - ⏳ QueuedSupportVisitsSection
   - ⏳ ScheduledSupportVisitsSection
   - ⏳ AccreditedSupportedFacilitiesSection

2. **إنشاء مكونات dept4:**
   - ⏳ TechnicalClinicalFacilitiesSection
   - ⏳ TechnicalClinicalObservationsSection

3. **إنشاء مكونات dept5:**
   - ⏳ AdminAuditFacilitiesSection
   - ⏳ AdminAuditObservationsSection
   - ⏳ ObservationCorrectionRatesSection

4. **إنشاء مكونات dept6:**
   - ⏳ AccreditationFacilitiesSection
   - ⏳ CompletionFacilitiesSection
   - ⏳ PaymentFacilitiesSection
   - ⏳ CorrectivePlanFacilitiesSection
   - ⏳ BasicRequirementsFacilitiesSection
   - ⏳ AppealsFacilitiesSection
   - ⏳ PaidFacilitiesSection
   - ⏳ MedicalProfessionalRegistrationsSection

5. **إنشاء مكونات dept7:**
   - ⏳ MedicalProfessionalsByCategorySection
   - ⏳ MedicalProfessionalsByGovernorateSection

6. **إنشاء مكونات dept9:**
   - ⏳ ReviewerEvaluationVisitsSection
   - ⏳ ReviewerEvaluationVisitsByGovernorateSection
   - ⏳ ReviewerEvaluationVisitsByTypeSection

## ملاحظات هامة

- ⚠️ **الالتزام بالبنية القياسية:** تأكد من اتباع نفس البنية لجميع المكونات الجديدة
- ⚠️ **التصدير المركزي:** دائماً قم بتحديث ملف `index.ts` عند إضافة مكون جديد
- ⚠️ **المكونات المشتركة:** استخدم المكونات المشتركة بدلاً من تكرار الكود
- ⚠️ **التسميات:** استخدم أسماء واضحة ومعبرة للمكونات والملفات

## الدعم والمساعدة

إذا كان لديك أي أسئلة أو تحتاج إلى مساعدة:
1. راجع المكونات الموجودة كمرجع
2. اتبع البنية القياسية للمكونات
3. استخدم المكونات المشتركة قدر الإمكان

---

تم إنشاء هذا الملف في: ${new Date().toLocaleString('ar-EG')}
