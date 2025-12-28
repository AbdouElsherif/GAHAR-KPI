# تقرير الفحص الأمني الشامل - تطبيق GAHAR KPI
**التاريخ:** 26 نوفمبر 2025
**الحالة:** ⚠️ توجد مشاكل أمنية تحتاج إلى إجراءات فورية

---

## 📋 ملخص التقرير
تم اكتشاف **8 مشاكل أمنية حرجة وعالية** في التطبيق تتطلب إصلاحاً فوراً قبل الإطلاق في الإنتاج.

---

## 🔴 المشاكل الحرجة (Critical)

### 1. **كلمات مرور افتراضية ضعيفة وموثقة بوضوح** 
**الخطورة:** 🔴 حرجة جداً  
**الملفات المتأثرة:**
- `app/login/page.tsx` (السطر 132-134)
- `lib/auth.ts` (السطر 36-45)

**الوصف:**
```typescript
// admin@gahar.gov.eg / admin123
// viewer@gahar.gov.eg / viewer123
```
- تم نشر كلمات المرور الافتراضية في الكود المصدري
- الكلمات المرور ضعيفة جداً (8 أحرف فقط، أرقام متسلسلة)
- تم عرضها على صفحة تسجيل الدخول للجميع

**التأثير:**
- وصول غير مصرح به لأي شخص لديه رابط التطبيق
- خرق كامل للأمان في البيئة الإنتاجية

**الحل المقترح:**
```typescript
// حذف كلمات المرور من الكود
// استخدام عملية تهيئة آمنة أثناء الإطلاق الأول فقط
// توليد كلمات مرور عشوائية قوية
// إرسال بيانات الاعتماد عبر قنوات آمنة منفصلة
```

---

### 2. **تخزين بيانات اعتماد Firebase في .env (معرّض في Git)**
**الخطورة:** 🔴 حرجة جداً  
**الملفات المتأثرة:**
- `.env.check` (يحتوي على Vercel OIDC Token)

**الوصف:**
- ملفات البيئة تحتوي على رموز حساسة
- قد تكون موجودة في Git history

**الحل المقترح:**
```bash
# 1. إزالة الملفات من Git
git rm --cached .env.check .env.production.check

# 2. إضافة إلى .gitignore
echo ".env*" >> .gitignore

# 3. حذف من Git history
git filter-branch --tree-filter 'rm -f .env.check .env.production.check' -- --all
```

---

### 3. **قواعد Firestore غير آمنة كافياً**
**الخطورة:** 🔴 حرجة  
**الملف:** `firestore.rules`

**المشاكل المكتشفة:**

#### أ. عدم التحقق من الدور للكتابة على جداول الكيانات
```plaintext
// يسمح بإنشاء KPIs لأي admin أو dept_admin
allow create: if isAuthenticated() && (isSuperAdmin() || isDeptAdmin());
```
- لا يتحقق من أن الـ departmentId متطابق مع department المستخدم
- قد يسمح لـ admin بإنشاء بيانات لأقسام أخرى

#### ب. عدم كفاية التحقق من الحذف
```plaintext
allow delete: if isSuperAdmin();
```
- لا يوجد حد زمني أو تسجيل للحذف

---

### 4. **قواعد Firebase Storage غير آمنة تماماً**
**الخطورة:** 🔴 حرجة  
**الملف:** `storage.rules`

**المشكلة:**
```plaintext
match /{allPaths=**} {
  allow read: if request.auth != null;
  allow write: if request.auth != null;
}
```

**المخاطر:**
- أي مستخدم مصرح يمكنه حذف/تعديل أي ملف
- لا توجد تحقق من نوع الملف أو الحجم
- لا توجد حماية من الملفات الخطرة

**الحل المقترح:**
```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // منع جميع الوصول بشكل افتراضي
    match /{allPaths=**} {
      allow read, write: if false;
    }
    
    // السماح بمسارات محددة فقط
    match /uploads/{userId}/{document=**} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if request.auth != null && 
                      request.auth.uid == userId &&
                      request.resource.size < 10 * 1024 * 1024 && // 10MB max
                      request.resource.contentType.matches('application/(pdf|vnd.*)');
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 🟠 المشاكل العالية (High)

### 5. **عدم التحقق من صلاحيات المستخدم في بعض الحالات**
**الخطورة:** 🟠 عالية  
**الملفات المتأثرة:**
- `lib/auth.ts` (دالة `deleteUser`)

**المشكلة:**
```typescript
export async function deleteUser(id: string) {
    try {
        await deleteDoc(doc(db, 'users', id));
        // ملاحظة: This doesn't delete the Firebase Auth user
        // أنت قد تحتاج Firebase Admin SDK لذلك
    } catch (error) {
        console.error('Error deleting user:', error);
    }
}
```

- لا يوجد تحقق من صلاحيات الحذف
- حذف غير مكتمل (لا يحذف من Firebase Auth)
- لا يوجد تسجيل للحذف

**الحل:**
```typescript
export async function deleteUser(currentUserId: string, targetUserId: string) {
    // تحقق من أن المستخدم الحالي super_admin
    const currentUser = await getUserProfile(currentUserId);
    if (currentUser?.role !== 'super_admin') {
        throw new Error('Unauthorized: Only super admins can delete users');
    }
    
    if (currentUserId === targetUserId) {
        throw new Error('Cannot delete your own account');
    }
    
    try {
        // تسجيل العملية
        await logUserAction({
            action: 'DELETE_USER',
            targetUserId,
            performedBy: currentUserId,
            timestamp: new Date()
        });
        
        await deleteDoc(doc(db, 'users', targetUserId));
    } catch (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
}
```

---

### 6. **رمز متحقق OIDC معرّض في ملف البيئة**
**الخطورة:** 🟠 عالية  
**الملف:** `.env.check`

**المشكلة:**
- يحتوي على JWT token صريح
- يمكن استخدامه للوصول غير المصرح به إلى Vercel

**الحل:**
- حذف الملف فوراً
- إعادة تعيين كل الرموز في Vercel

---

### 7. **عدم وجود معدل حد (Rate Limiting)**
**الخطورة:** 🟠 عالية

**المشاكل:**
- لا حماية ضد هجمات brute force
- لا حماية ضد الإساءة (DDoS)
- أي شخص يمكنه محاولة آلاف كلمات المرور

**الحل:**
```typescript
// استخدم Firebase Security Rules للحد من معدل الطلب
rules_version = '2';
service cloud.firestore {
  function rateLimitCheck(userId, limit, duration) {
    let ref = /databases/$(database)/documents/rateLimits/$(userId);
    let doc = getAfter(ref);
    let count = doc.data.count;
    let lastReset = doc.data.lastReset;
    
    return (now - lastReset) < duration.toMillis() 
      ? count < limit 
      : true;
  }
}
```

---

### 8. **عدم وجود تسجيل (Logging) للأنشطة الحساسة**
**الخطورة:** 🟠 عالية

**الأنشطة المفقودة:**
- محاولات تسجيل الدخول الفاشلة
- إنشاء/حذف المستخدمين
- تعديل الصلاحيات
- الوصول إلى بيانات حساسة
- تصدير البيانات

**الحل:**
```typescript
interface AuditLog {
    id: string;
    action: string;
    userId: string;
    targetId?: string;
    changes?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failure';
}

export async function logAction(log: Omit<AuditLog, 'id'>) {
    const auditRef = collection(db, 'auditLogs');
    return addDoc(auditRef, {
        ...log,
        timestamp: serverTimestamp()
    });
}
```

---

## 🟡 المشاكل المتوسطة (Medium)

### 9. **عدم التحقق من صيغة البريد الإلكتروني والتحقق منه**
**الخطورة:** 🟡 متوسطة

**المشكلة:**
```typescript
// لا يوجد تحقق من صحة البريد
// لا يوجد تأكيد بريد إلكتروني
```

**الحل:**
```typescript
export async function addUser(userData: UserData) {
    // التحقق من صيغة البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
        throw new Error('Invalid email format');
    }
    
    // التحقق من أن البريد لم يستخدم بالفعل
    const existingUser = query(collection(db, 'users'), 
        where('email', '==', userData.email));
    const snapshot = await getDocs(existingUser);
    if (!snapshot.empty) {
        throw new Error('Email already in use');
    }
    
    // إنشاء المستخدم
    const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
    );
    
    // إرسال بريد التحقق
    await sendEmailVerification(userCredential.user);
}
```

---

### 10. **كلمات مرور ضعيفة - لا توجد متطلبات**
**الخطورة:** 🟡 متوسطة

**المشكلة:**
- لا يوجد تحقق من قوة كلمة المرور
- السماح بكلمات مرور قصيرة جداً

**المتطلبات المقترحة:**
- الحد الأدنى 12 حرف
- يجب أن تحتوي على أحرف كبيرة وصغيرة
- يجب أن تحتوي على أرقام وأحرف خاصة
- عدم السماح بكلمات مرور شهيرة

---

### 11. **الكشف عن معلومات حساسة في رسائل الخطأ**
**الخطورة:** 🟡 متوسطة  
**الملفات:**
- `app/login/page.tsx`
- عمليات Firestore

**المشكلة:**
```typescript
setError(err.message || 'حدث خطأ...');
// قد تكشف معلومات حساسة عن قاعدة البيانات
```

**الحل:**
```typescript
try {
    // ...
} catch (error: any) {
    // تسجيل التفاصيل بشكل آمن على الخادم
    console.error('Auth error:', error);
    
    // عرض رسالة عامة للمستخدم
    if (error.code === 'auth/user-not-found') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } else if (error.code === 'auth/wrong-password') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } else {
        setError('حدث خطأ في النظام. يرجى المحاولة لاحقاً');
    }
}
```

---

### 12. **عدم وجود حماية CSRF**
**الخطورة:** 🟡 متوسطة

**الحل:**
```typescript
// استخدم دالة Next.js الآمنة مع CSRF token
// أو استخدم مكتبة مثل next-csrf
```

---

### 13. **البيانات الحساسة قد تكون مرئية في DOM**
**الخطورة:** 🟡 متوسطة

**المشكلة:**
```tsx
// في app/login/page.tsx
<p>• المدير العام: admin@gahar.gov.eg / admin123</p>
```

- بيانات الاعتماد مرئية في HTML
- يمكن الوصول إليها عبر DevTools

---

## 🔵 التوصيات الإضافية (Best Practices)

### 14. **إضافة Two-Factor Authentication (2FA)**
```typescript
// استخدم Firebase Phone Authentication
// أو تطبيق مثل Google Authenticator
```

### 15. **تشفير البيانات في الراحة (Encryption at Rest)**
- استخدم Firestore Encryption
- شفر البيانات الحساسة قبل التخزين

### 16. **HTTPS و CSP Headers**
```typescript
// قم بإضافة headers أمنية في next.config.js
module.exports = {
  headers: async () => {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ];
  }
};
```

### 17. **استخدام Environment Variables بشكل صحيح**
```bash
# لا تضف NEXT_PUBLIC_ لأي متغير حساس
# الخاص بـ Firebase API Key فقط يجب أن يكون عام

NEXT_PUBLIC_FIREBASE_API_KEY=xxx
NEXT_PUBLIC_FIREBASE_PROJECT_ID=xxx

# الباقي يجب أن يكون خاص على الخادم
FIREBASE_ADMIN_SDK_KEY=xxx
DATABASE_URL=xxx
```

### 18. **تحديث المكتبات بانتظام**
```bash
npm audit
npm audit fix
npm update
```

---

## ✅ خطة الإصلاح الفورية (Priority Order)

| الأولوية | المشكلة | الإجراء | الموعد |
|---------|--------|--------|--------|
| 🔴 1 | كلمات مرور افتراضية | حذف فوراً من الكود | فوري |
| 🔴 2 | ملفات .env المعرضة | حذف من Git + إعادة تعيين الرموز | فوري |
| 🔴 3 | قواعد Firestore | إعادة كتابة مع تحقق صحيح | اليوم |
| 🔴 4 | Storage Rules | تأمين جميع المسارات | اليوم |
| 🟠 5 | التسجيل (Logging) | إضافة audit logs | غداً |
| 🟠 6 | Rate Limiting | تطبيق Firebase Rules | غداً |
| 🟡 7 | التحقق من البريد | إضافة التحقق | خلال 2-3 أيام |
| 🟡 8 | CSP Headers | إضافة security headers | خلال أسبوع |

---

## 📞 ملاحظات إضافية

### نقاط قوة في التطبيق:
✅ استخدام Firebase مع بيئات آمنة نسبياً  
✅ وجود نظام أدوار (Roles)  
✅ استخدام TypeScript للسلامة النوعية  
✅ فصل المنطق عن الواجهة  

### المجالات التي تحتاج تحسين:
❌ الأمان الأساسي (كلمات مرور، بيانات اعتماد)  
❌ التسجيل والمراجعة  
❌ التحقق من المدخلات  
❌ معالجة الأخطاء  
❌ تحديث المكتبات  

---

## 📋 قائمة التحقق قبل الإطلاق (Pre-Launch Checklist)

- [ ] حذف جميع كلمات المرور الافتراضية
- [ ] حذف ملفات البيئة من Git
- [ ] تأمين قواعد Firestore
- [ ] تأمين Storage Rules
- [ ] إضافة Audit Logging
- [ ] تطبيق Rate Limiting
- [ ] إضافة Password Validation
- [ ] إضافة 2FA
- [ ] تشفير البيانات الحساسة
- [ ] إضافة CSP Headers
- [ ] اختبار اختراق أمني (Penetration Testing)
- [ ] مراجعة أمنية نهائية

---

**أُعدّ بواسطة:** فريق الأمن  
**آخر تحديث:** 26 نوفمبر 2025  
**الحالة:** يتطلب إجراء فوري قبل الإطلاق في الإنتاج

