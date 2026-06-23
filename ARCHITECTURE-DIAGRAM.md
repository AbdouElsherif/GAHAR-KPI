# Architecture Diagram - GAHAR KPI Application

هذا الرسم يوضح المعمارية العامة لتطبيق إدارة مؤشرات الأداء، بناء على هيكل المشروع الحالي.

```mermaid
flowchart TB
    User["Users<br/>Super Admin / Department Admin / Viewer"]

    subgraph Client["Browser / Client Side"]
        NextUI["Next.js App Router UI<br/>app/* pages"]
        Home["Home Portal<br/>Department Selection"]
        Login["Login Page"]
        Admin["Admin Panel<br/>User Management"]
        DeptPage["Department KPI Page<br/>/department/[id]"]
        Dashboards["Dynamic Dashboards<br/>Recharts + Modal Views"]
        ImportExport["Excel / Word / PDF / JSON Export<br/>XLSX, docx, jsPDF"]
        DataQuality["Data Quality Center<br/>Notifications + Checks"]
    end

    subgraph SharedLib["Application Libraries"]
        AuthLib["lib/auth.ts<br/>Auth state, roles, access checks"]
        FirebaseClient["lib/firebase.ts<br/>Firebase client SDK"]
        FirestoreLib["lib/firestore.ts<br/>KPI and section CRUD"]
        Validation["lib/validation.ts<br/>Input validation"]
        ExcelImport["lib/excelImportHelpers.ts<br/>Template + batch import"]
        ExcelExport["lib/excelExportHelpers.ts<br/>Department reports"]
        AIExport["lib/aiExportHelper.ts<br/>AI-ready JSON export"]
        DataQualityLib["lib/dataQuality.ts<br/>Quality rules and issue detection"]
    end

    subgraph NextServer["Next.js Server Side"]
        ApiReset["API Route<br/>/api/reset-password"]
        FirebaseAdmin["lib/firebase-admin.ts<br/>Firebase Admin SDK"]
    end

    subgraph Firebase["Firebase Backend"]
        FAuth["Firebase Authentication"]
        FStore["Cloud Firestore"]
        Rules["Firestore Security Rules"]
    end

    subgraph FirestoreCollections["Main Firestore Collections"]
        UsersCol["users"]
        KPICol["kpis<br/>general department KPI records"]
        DeptCols["Department section collections<br/>technical_support_visits<br/>accreditation_facilities<br/>reviewer_evaluation_visits<br/>medical_professionals_*<br/>etc."]
        MOHCol["moh_kpis"]
        BranchCol["dept11_branch_affairs_reports"]
    end

    subgraph Hosting["Deployment"]
        Vercel["Vercel / Next Hosting"]
        FirebaseHosting["Firebase Hosting config"]
    end

    User --> NextUI
    NextUI --> Login
    NextUI --> Home
    Home --> DeptPage
    Home --> Admin
    DeptPage --> Dashboards
    DeptPage --> ImportExport
    Home --> DataQuality

    Login --> AuthLib
    Admin --> AuthLib
    DeptPage --> AuthLib
    Home --> AuthLib

    AuthLib --> FirebaseClient
    FirestoreLib --> FirebaseClient
    FirebaseClient --> FAuth
    FirebaseClient --> FStore

    DeptPage --> FirestoreLib
    Admin --> FirestoreLib
    Dashboards --> FirestoreLib
    ImportExport --> ExcelImport
    ImportExport --> ExcelExport
    ImportExport --> AIExport
    DataQuality --> DataQualityLib

    ExcelImport --> FirestoreLib
    ExcelExport --> FStore
    AIExport --> FirestoreLib
    DataQualityLib --> FStore
    Validation --> DeptPage

    Admin --> ApiReset
    ApiReset --> FirebaseAdmin
    FirebaseAdmin --> FAuth
    FirebaseAdmin --> FStore

    FStore --> Rules
    FStore --> UsersCol
    FStore --> KPICol
    FStore --> DeptCols
    FStore --> MOHCol
    FStore --> BranchCol

    Vercel --> NextUI
    Vercel --> NextServer
    FirebaseHosting -. optional config .-> NextUI
```

## High-Level Flow

1. المستخدم يسجل الدخول من `/login` عبر Firebase Authentication.
2. `lib/auth.ts` يجلب ملف المستخدم من مجموعة `users` في Firestore ويحدد الدور والصلاحيات.
3. الصفحة الرئيسية تعرض الإدارات المتاحة حسب الدور.
4. صفحة `/department/[id]` تعرض نموذج إدخال المؤشرات، الجداول، الاستيراد، التصدير، ولوحات التحليل.
5. `lib/firestore.ts` يمثل طبقة الوصول الأساسية لبيانات المؤشرات ومجموعات الأقسام.
6. التقارير والتصدير تتم غالبا من جهة المتصفح باستخدام `xlsx`, `docx`, `jspdf` وبيانات Firestore.
7. العمليات ذات الصلاحيات العالية، مثل إعادة تعيين كلمة المرور، تمر عبر Next.js API route وتستخدم Firebase Admin SDK.

## Main Architectural Layers

- Presentation Layer: صفحات Next.js ومكونات React داخل `app/` و `components/`.
- Auth and Authorization Layer: `lib/auth.ts` مع Firebase Auth وأدوار المستخدمين.
- Data Access Layer: `lib/firestore.ts` و Firebase Client SDK.
- Reporting and Import Layer: `lib/excelImportHelpers.ts`, `lib/excelExportHelpers.ts`, `lib/aiExportHelper.ts`.
- Server Admin Layer: `app/api/reset-password/route.ts` و `lib/firebase-admin.ts`.
- Backend Services: Firebase Authentication و Cloud Firestore.
