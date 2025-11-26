# الحلول الأمنية المقترحة - ملف التنفيذ

## 1. إصلاح كلمات المرور الافتراضية

### قبل (غير آمن):
```typescript
// lib/auth.ts
const adminAuth = await createUserWithEmailAndPassword(
    auth,
    'admin@gahar.gov.eg',
    'admin123'  // ❌ كلمة مرور ضعيفة موثقة
);
```

### بعد (آمن):
```typescript
// lib/auth.ts
import { generateStrongPassword } from './passwordGenerator';

export async function initializeUsers() {
    try {
        const usersRef = collection(db, 'users');
        const snapshot = await getDocs(usersRef);
        
        if (snapshot.empty) {
            // توليد كلمات مرور قوية عشوائية
            const adminPassword = generateStrongPassword();
            const viewerPassword = generateStrongPassword();
            
            // Create default admin user
            const adminAuth = await createUserWithEmailAndPassword(
                auth,
                'admin@gahar.gov.eg',
                adminPassword
            );
            
            await setDoc(doc(db, 'users', adminAuth.user.uid), {
                username: 'admin',
                email: 'admin@gahar.gov.eg',
                role: 'super_admin',
                createdAt: serverTimestamp(),
                passwordChangedAt: serverTimestamp()
            });
            
            // تسجيل كلمات المرور في مكان آمن منفصل
            // (يجب أن تُرسل للمسؤول عبر قنوات آمنة)
            console.log('SAVE THESE CREDENTIALS SECURELY:');
            console.log(`Admin: admin@gahar.gov.eg / ${adminPassword}`);
            console.log(`Viewer: viewer@gahar.gov.eg / ${viewerPassword}`);
            
            // حفظ hash من كلمة المرور في مكان آمن (اختياري)
            // await storeCredentialsSecurely(adminPassword, viewerPassword);
        }
    } catch (error: any) {
        if (error.code !== 'auth/email-already-in-use') {
            console.error('Error initializing users:', error);
        }
    }
}
```

---

## 2. إضافة مدقق قوة كلمة المرور

### ملف جديد: `lib/passwordValidator.ts`
```typescript
export interface PasswordStrength {
    score: number; // 0-100
    isStrong: boolean;
    feedback: string[];
}

export function validatePassword(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    if (!password) {
        return { score: 0, isStrong: false, feedback: ['كلمة المرور مطلوبة'] };
    }

    // الطول
    if (password.length < 12) {
        feedback.push('كلمة المرور يجب أن تكون 12 حرف على الأقل');
    } else {
        score += 25;
    }

    // أحرف كبيرة
    if (/[A-Z]/.test(password)) {
        score += 15;
    } else {
        feedback.push('أضف أحرف كبيرة (A-Z)');
    }

    // أحرف صغيرة
    if (/[a-z]/.test(password)) {
        score += 15;
    } else {
        feedback.push('أضف أحرف صغيرة (a-z)');
    }

    // أرقام
    if (/[0-9]/.test(password)) {
        score += 15;
    } else {
        feedback.push('أضف أرقام (0-9)');
    }

    // أحرف خاصة
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
        score += 20;
    } else {
        feedback.push('أضف أحرف خاصة (!@#$%...)');
    }

    // منع كلمات شهيرة
    const commonPasswords = ['password', '123456', 'qwerty', 'admin', 'password123'];
    if (commonPasswords.some(p => password.toLowerCase().includes(p))) {
        feedback.push('تجنب كلمات المرور الشهيرة');
        score = Math.max(0, score - 30);
    }

    return {
        score: Math.min(100, score),
        isStrong: score >= 60 && feedback.length === 0,
        feedback
    };
}

export function generateStrongPassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+-=[]{}:;<>?,./';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';
    
    // تأكد من وجود كل نوع
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];
    
    // ملء الباقي
    for (let i = password.length; i < length; i++) {
        password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // خلط عشوائي
    return password.split('').sort(() => Math.random() - 0.5).join('');
}
```

---

## 3. تأمين قواعد Firestore

### ملف محدّث: `firestore.rules`
```plaintext
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // دوال مساعدة
    function isAuthenticated() {
      return request.auth != null;
    }
    
    function getUserData() {
      return get(/databases/$(database)/documents/users/$(request.auth.uid)).data;
    }
    
    function isSuperAdmin() {
      return isAuthenticated() && getUserData().role == 'super_admin';
    }
    
    function isDeptAdmin() {
      return isAuthenticated() && getUserData().role == 'dept_admin';
    }
    
    function userDepartmentId() {
      return getUserData().departmentId;
    }
    
    // مستخدمون
    match /users/{userId} {
      // يمكن للمستخدم قراءة ملفه الخاص فقط (ما عدا الحقول الحساسة)
      allow read: if isAuthenticated() && request.auth.uid == userId 
                && !request.resource.data.keys().hasAny(['passwordHash', 'lastLoginIp']);
      
      // super_admin يمكنه قراءة جميع المستخدمين
      allow read: if isSuperAdmin();
      
      // المستخدم يمكنه تحديث ملفه (ما عدا الدور والبريد)
      allow update: if isAuthenticated() && request.auth.uid == userId 
                   && !request.resource.data.diff(resource.data).affectedKeys().hasAny(['role', 'email', 'passwordHash']);
      
      // فقط super_admin يمكنه الإنشاء والتحديث والحذف
      allow create, update, delete: if isSuperAdmin() 
                                   && request.resource.data.role in ['super_admin', 'dept_admin', 'dept_viewer', 'general_viewer']
                                   && request.resource.data.email is string
                                   && request.resource.data.username is string;
    }
    
    // KPIs
    match /kpis/{kpiId} {
      // المصرح يمكنه القراءة فقط
      allow read: if isAuthenticated() && 
                     (isSuperAdmin() || 
                      isDeptAdmin() && userDepartmentId() == resource.data.departmentId ||
                      getUserData().role == 'general_viewer');
      
      // فقط dept_admin و super_admin يمكنهم الإنشاء
      allow create: if isAuthenticated() && 
                       (isSuperAdmin() || 
                        (isDeptAdmin() && request.resource.data.departmentId == userDepartmentId())) &&
                       request.resource.data.departmentId is string &&
                       request.resource.data.month is string &&
                       request.resource.data.year is number;
      
      // فقط صاحب البيانات أو super_admin يمكنه التحديث
      allow update: if isAuthenticated() && 
                       (isSuperAdmin() || 
                        (isDeptAdmin() && userDepartmentId() == resource.data.departmentId &&
                         userDepartmentId() == request.resource.data.departmentId)) &&
                       !request.resource.data.diff(resource.data).affectedKeys().hasAny(['createdAt', 'createdBy']);
      
      // فقط super_admin يمكنه الحذف
      allow delete: if isSuperAdmin();
    }
    
    // Audit Logs (قراءة فقط للمسؤولين)
    match /auditLogs/{logId} {
      allow read: if isSuperAdmin();
      allow write: if false; // يُكتب من Cloud Functions فقط
    }
    
    // Rate Limiting collection
    match /rateLimits/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

---

## 4. تأمين Firebase Storage Rules

### ملف محدّث: `storage.rules`
```plaintext
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // منع جميع الوصول بشكل افتراضي
    match /{allPaths=**} {
      allow read, write, delete: if false;
    }
    
    // السماح بالتقارير المُصدَّرة فقط
    match /exports/{userId}/{fileId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId &&
                      request.resource.size < 50 * 1024 * 1024 && // 50MB max
                      request.resource.contentType in [
                        'application/pdf',
                        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                      ];
      allow delete: if request.auth.uid == userId;
    }
    
    // الملفات المؤقتة
    match /temp/{userId}/{fileId} {
      allow read, write, delete: if request.auth.uid == userId &&
                                     request.resource.size < 100 * 1024 * 1024; // 100MB max
    }
  }
}
```

---

## 5. إضافة Audit Logging

### ملف جديد: `lib/auditLog.ts`
```typescript
import { collection, addDoc, serverTimestamp, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export interface AuditLog {
    id?: string;
    action: string; // LOGIN, LOGOUT, CREATE_USER, DELETE_USER, EXPORT_DATA, etc.
    userId: string;
    userEmail: string;
    targetId?: string; // ID of the resource being modified
    targetType?: string; // USER, KPI, DEPARTMENT, etc.
    status: 'success' | 'failure';
    details?: Record<string, any>;
    error?: string;
    ipAddress?: string;
    userAgent?: string;
    timestamp: Timestamp;
}

export async function logAuditAction(action: Omit<AuditLog, 'id' | 'timestamp'>) {
    try {
        const auditRef = collection(db, 'auditLogs');
        const docRef = await addDoc(auditRef, {
            ...action,
            timestamp: serverTimestamp()
        });
        return docRef.id;
    } catch (error) {
        console.error('Failed to log audit action:', error);
    }
}

export async function getAuditLogs(userId?: string, days: number = 30): Promise<AuditLog[]> {
    try {
        const auditRef = collection(db, 'auditLogs');
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - days);
        
        let q = query(auditRef, where('timestamp', '>=', Timestamp.fromDate(thirtyDaysAgo)));
        
        if (userId) {
            q = query(q, where('userId', '==', userId));
        }
        
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as AuditLog));
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return [];
    }
}
```

---

## 6. تحديث lib/auth.ts مع الأمان المحسّن

```typescript
import { logAuditAction } from './auditLog';
import { validatePassword } from './passwordValidator';

export async function addUser(userData: {
    username: string;
    email: string;
    password: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer' | 'general_viewer';
    departmentId?: string;
    departmentName?: string;
}, currentUserId: string): Promise<User | null> {
    try {
        // التحقق من الصلاحيات
        const currentUser = await getUserProfile(currentUserId);
        if (currentUser?.role !== 'super_admin') {
            await logAuditAction({
                action: 'CREATE_USER',
                userId: currentUserId,
                userEmail: currentUser?.email || '',
                status: 'failure',
                error: 'Unauthorized: Only super admins can create users'
            });
            throw new Error('Unauthorized');
        }
        
        // التحقق من قوة كلمة المرور
        const passwordValidation = validatePassword(userData.password);
        if (!passwordValidation.isStrong) {
            throw new Error(`Password too weak: ${passwordValidation.feedback.join(', ')}`);
        }
        
        // التحقق من البريد الإلكتروني
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userData.email)) {
            throw new Error('Invalid email format');
        }
        
        // إنشاء المستخدم
        const userCredential = await createUserWithEmailAndPassword(
            auth,
            userData.email,
            userData.password
        );
        
        const userProfile = {
            username: userData.username,
            email: userData.email,
            role: userData.role,
            departmentId: userData.departmentId,
            departmentName: userData.departmentName,
            createdAt: serverTimestamp(),
            createdBy: currentUserId
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
        
        // تسجيل النشاط
        await logAuditAction({
            action: 'CREATE_USER',
            userId: currentUserId,
            userEmail: currentUser?.email || '',
            targetId: userCredential.user.uid,
            targetType: 'USER',
            status: 'success',
            details: { email: userData.email, role: userData.role }
        });
        
        return {
            id: userCredential.user.uid,
            ...userProfile
        };
    } catch (error: any) {
        console.error('Error adding user:', error);
        throw error;
    }
}

export async function deleteUser(currentUserId: string, targetUserId: string): Promise<void> {
    try {
        // التحقق من الصلاحيات
        const currentUser = await getUserProfile(currentUserId);
        if (currentUser?.role !== 'super_admin') {
            await logAuditAction({
                action: 'DELETE_USER',
                userId: currentUserId,
                userEmail: currentUser?.email || '',
                targetId: targetUserId,
                status: 'failure',
                error: 'Unauthorized'
            });
            throw new Error('Unauthorized: Only super admins can delete users');
        }
        
        // منع حذف نفسك
        if (currentUserId === targetUserId) {
            throw new Error('Cannot delete your own account');
        }
        
        const targetUser = await getUserProfile(targetUserId);
        await deleteDoc(doc(db, 'users', targetUserId));
        
        // تسجيل النشاط
        await logAuditAction({
            action: 'DELETE_USER',
            userId: currentUserId,
            userEmail: currentUser?.email || '',
            targetId: targetUserId,
            targetType: 'USER',
            status: 'success',
            details: { deletedUserEmail: targetUser?.email }
        });
    } catch (error: any) {
        console.error('Error deleting user:', error);
        throw error;
    }
}

export async function login(email: string, password: string): Promise<User | null> {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userProfile = await getUserProfile(userCredential.user.uid);
        
        // تسجيل النشاط الناجح
        await logAuditAction({
            action: 'LOGIN',
            userId: userCredential.user.uid,
            userEmail: email,
            status: 'success'
        });
        
        return userProfile;
    } catch (error: any) {
        // تسجيل محاولة تسجيل دخول فاشلة
        await logAuditAction({
            action: 'LOGIN',
            userId: 'unknown',
            userEmail: email,
            status: 'failure',
            error: error.code
        });
        
        throw error;
    }
}
```

---

## 7. إضافة Security Headers في next.config.js

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.firebaseio.com https://*.googleapis.com; frame-ancestors 'none';"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

---

## 8. مثال على استخدام Password Validator في Form

```typescript
// components/UserForm.tsx
'use client';

import { useState } from 'react';
import { validatePassword, PasswordStrength } from '@/lib/passwordValidator';

export function UserPasswordInput() {
    const [password, setPassword] = useState('');
    const [strength, setStrength] = useState<PasswordStrength>({
        score: 0,
        isStrong: false,
        feedback: []
    });

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setPassword(value);
        setStrength(validatePassword(value));
    };

    const getStrengthColor = () => {
        if (strength.score < 30) return '#dc3545'; // red
        if (strength.score < 60) return '#ffc107'; // yellow
        if (strength.score < 80) return '#17a2b8'; // cyan
        return '#28a745'; // green
    };

    return (
        <div>
            <input
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="أدخل كلمة مرور قوية"
            />
            
            {/* مؤشر قوة كلمة المرور */}
            <div style={{
                marginTop: '10px',
                height: '6px',
                backgroundColor: '#ddd',
                borderRadius: '3px',
                overflow: 'hidden'
            }}>
                <div style={{
                    width: `${strength.score}%`,
                    height: '100%',
                    backgroundColor: getStrengthColor(),
                    transition: 'width 0.3s'
                }} />
            </div>
            
            {/* ملاحظات التحسين */}
            {strength.feedback.length > 0 && (
                <ul style={{ fontSize: '0.85rem', color: '#666', marginTop: '8px' }}>
                    {strength.feedback.map((msg, i) => (
                        <li key={i}>{msg}</li>
                    ))}
                </ul>
            )}
            
            {strength.isStrong && (
                <p style={{ color: '#28a745', fontSize: '0.85rem' }}>✓ كلمة مرور قوية</p>
            )}
        </div>
    );
}
```

---

## تعليمات التنفيذ

### المرحلة 1: الإصلاحات الفورية (اليوم)
1. ✅ حذف كلمات المرور من `lib/auth.ts` و `app/login/page.tsx`
2. ✅ حذف ``.env.check`` و ``.env.production.check`` من Git
3. ✅ إضافة ``.env*`` إلى ``.gitignore``

### المرحلة 2: التحديثات الأمنية (غداً)
1. ✅ إنشاء `lib/passwordValidator.ts`
2. ✅ تحديث `lib/auth.ts` مع التحقق من الصلاحيات
3. ✅ تحديث `firestore.rules` و `storage.rules`
4. ✅ إنشاء `lib/auditLog.ts`

### المرحلة 3: التحسينات (هذا الأسبوع)
1. ✅ إضافة headers أمنية في `next.config.js`
2. ✅ إضافة مكون Password Strength Indicator
3. ✅ إضافة 2FA (اختياري)
4. ✅ تشفير البيانات الحساسة

