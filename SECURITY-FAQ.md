# أسئلة وأجوبة أمنية - Security FAQ

## Q1: لماذا كلمات المرور الافتراضية مشكلة كبيرة؟

**الإجابة:**
```
المشكلة: كلمات المرور الافتراضية الموثقة معروفة وضعيفة جداً

التأثير:
1. أي شخص يعرف رابط التطبيق يمكنه تسجيل الدخول
2. يمكن كسرها بـ brute force في دقائق معدودة
3. لا توجد حماية ضد الهجمات الآلية
4. تكشف معلومات حساسة عن هيكل النظام

الحل:
- توليد كلمات مرور عشوائية قوية (16 حرف)
- إرسالها عبر قنوات آمنة (بريد مشفر)
- إجبار تغيير كلمة المرور عند أول تسجيل دخول
```

---

## Q2: هل يمكن ترك ملف .env في المستودع؟

**الإجابة:**
```
❌ لا، بشكل قاطع!

السبب:
- حتى إذا حذفته الآن، فإنه لا يزال في Git history
- أي شخص يمكنه استرجاعه من السجل
- يحتوي على رموز محساس (Vercel OIDC Token)

الحل الصحيح:
1. حذف من Git history:
   git filter-branch --tree-filter 'rm -f .env*' -- --all
   git push --force-with-lease

2. إضافة إلى .gitignore:
   echo ".env*" >> .gitignore
   
3. إعادة تعيين جميع الرموز:
   - Vercel API Keys
   - Firebase Service Account
   - أي مفاتيح أخرى

4. استخدام آمن:
   - Vercel Environment Variables UI
   - GitHub Secrets للـ CI/CD
   - AWS Secrets Manager للـ production
```

---

## Q3: ما الفرق بين NEXT_PUBLIC_ و متغيرات عادية؟

**الإجابة:**
```
NEXT_PUBLIC_* = يُكشف في المتصفح (استخدم للبيانات العامة فقط)
تحتوي على: Firebase API Key, Project ID (آمنة)

المتغيرات العادية = بقى على الخادم (استخدم للأسرار)
تحتوي على: Database passwords, Private keys, Tokens

❌ خطأ شائع:
NEXT_PUBLIC_DATABASE_PASSWORD=secret123  # لا! ستكون مرئية!

✅ الصحيح:
NEXT_PUBLIC_FIREBASE_API_KEY=xxx
DATABASE_PASSWORD=secret123  # خادم فقط
```

---

## Q4: لماذا نحتاج Audit Logging؟

**الإجابة:**
```
الأسباب:
1. الامتثال القانوني:
   - القوانين تتطلب تسجيل الوصول للبيانات الحساسة
   - إثبات من قام بماذا ومتى

2. كشف الانتهاكات:
   - اكتشاف محاولات غير مصرح بها
   - تتبع تسريب البيانات

3. المحاسبة:
   - مسؤولية واضحة لكل فعل
   - منع الإنكار

4. الاستجابة للحوادث:
   - فهم ما حدث بالضبط
   - التحقيق من الانتهاكات

مثال:
```
// يجب تسجيل:
- من حاول تسجيل الدخول؟
- هل نجح أم فشل؟
- من حذف مستخدم؟
- من صدّر البيانات؟
- متى تم هذا؟
```

---

## Q5: هل Firebase آمن تماماً؟

**الإجابة:**
```
Firebase نفسه آمن جداً، لكن ❌ Rules الافتراضي غير آمن

مثال على Rules غير آمن:
match /{allPaths=**} {
  allow read, write: if true;  // ❌ كل شخص يمكنه الوصول!
}

مثال على Rules آمن:
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}

الدروس المستفادة:
1. اختبر Rules بعناية
2. استخدم Firebase Rules Simulator
3. ابدأ بـ "منع الكل" ثم أضف الاستثناءات
4. راقب access logs
```

---

## Q6: كيف أتحقق من قوة كلمة المرور بشكل صحيح؟

**الإجابة:**
```
يجب أن تحتوي على:

1. الطول الكافي (12+ حرف):
   - أقل من 8 أحرف = ضعيفة جداً
   - 12+ حرف = متوسطة
   - 16+ حرف = قوية

2. تنوع الأحرف:
   - أحرف كبيرة (A-Z)
   - أحرف صغيرة (a-z)
   - أرقام (0-9)
   - أحرف خاصة (!@#$%)

3. تجنب الأنماط:
   - قواموس كلمات شهيرة
   - تسلسلات (123456)
   - لوحة مفاتيح (qwerty)
   - معلومات شخصية

مثال:
❌ ضعيفة: password123
❌ ضعيفة: Admin@2025
✅ قوية: Tr0p!c@lMango#92x$K
✅ قوية: B4$ket_Of~Gr33n+Bananas!
```

---

## Q7: كيفية إرسال كلمات مرور آمنة للمستخدمين الجدد؟

**الإجابة:**
```
❌ خطأ:
- لا تُرسلها عبر البريد العادي (غير مشفر)
- لا تُرسلها عبر Slack أو Teams
- لا تحفظها في ملفات نصية

✅ الطريقة الصحيحة:

1. استخدام Firebase Email Link:
   await sendSignInLinkToEmail(auth, email);
   // المستخدم يفتح الرابط = تسجيل دخول فوري

2. إجبار تغيير كلمة المرور عند أول دخول:
   - جلسة محدودة (30 دقيقة)
   - إعادة توجيه لصفحة تغيير كلمة المرور
   - منع الوصول حتى يغير كلمته

3. استخدام مثل OTP (One-Time Password):
   - إرسال رمز 6 أرقام
   - يُستخدم لمرة واحدة فقط
   - ينتهي بعد 5 دقائق

4. SSO (Single Sign-On):
   - استخدام Google أو Microsoft accounts
   - لا تحتاج لإدارة كلمات مرور
```

---

## Q8: ماذا يعني Rate Limiting وكيف أطبقه؟

**الإجابة:**
```
Rate Limiting = تحديد عدد الطلبات في فترة زمنية

لماذا؟
1. منع brute force attacks:
   - محاولات تسجيل دخول متكررة
   - كسر كلمات المرور

2. منع DDoS:
   - طلبات هجومية ضخمة
   - جعل الخدمة غير متاحة

3. حماية الموارد:
   - منع استنزاف قاعدة البيانات
   - الحفاظ على الأداء

التطبيق في Firebase:

match /users/{userId} {
  // السماح بـ 5 عمليات كتابة فقط كل ساعة
  allow write: if request.auth.uid == userId &&
              request.time.toMillis() - 
              get(/databases/$(database)/documents/rateLimits/$(userId)).data.lastWrite 
              > 3600000;
}

أو استخدام Cloud Functions للتحكم الأفضل
```

---

## Q9: هل يجب استخدام 2FA (Two-Factor Authentication)؟

**الإجابة:**
```
✅ نعم، بشدة، خاصة للمدراء!

مستويات الحماية:

مستوى 1 (أساسي):
- كلمة مرور قوية

مستوى 2 (موصى به):
- كلمة مرور قوية
- +2FA (SMS أو Authenticator App)

مستوى 3 (عالي):
- كلمة مرور قوية
- +2FA
- +Hardware Security Key

التطبيق:

Firebase + Google Authenticator:
const recaptchaVerifier = new firebase.auth.RecaptchaVerifier('captcha');
await auth.signInWithPhoneNumber(phone, recaptchaVerifier);

أو استخدم Firebase Custom Claims:
{
  "mfaRequired": true,
  "mfaMethod": "totp" // Time-based OTP
}
```

---

## Q10: كيف أكتشف اختراق أمني؟

**الإجابة:**
```
علامات التحذير:

1. محاولات تسجيل دخول مريبة:
   - كثير المحاولات الفاشلة من نفس الـ IP
   - محاولات من دول غير معهودة
   - أوقات غير معتادة

2. تغييرات غير عادية:
   - تعديل بيانات مستخدمين
   - إنشاء حسابات جديدة غريبة
   - تغيير الصلاحيات

3. استهلاك موارد غير عادي:
   - زيادة مفاجئة في الطلبات
   - استنزاف النطاق الترددي
   - استهلاك Storage

المراقبة:

1. Firestore Rules:
   allow read: if request.auth != null && 
               request.time.toMillis() - 
               get(/databases/$(database)/documents/security/lastCheck).data.timestamp 
               < 60000;

2. Firebase Cloud Functions:
   exports.monitorUserActivity = functions
     .firestore
     .document('users/{userId}')
     .onUpdate((change, context) => {
       if (suspiciousChange(change.before, change.after)) {
         sendAlert('Suspicious activity detected');
       }
     });

3. إنشاء Dashboard للمراقبة
4. إعدادات تنبيهات Firebase

الخطوات عند اكتشاف اختراق:
1. عزل النظام فوراً
2. تحديد نطاق الاختراق
3. إعادة تعيين كل الكلمات المرور
4. تحليل السجلات
5. اتصل بفريق الأمن
```

---

## Q11: ما معنى CORS وهل أحتاجه؟

**الإجابة:**
```
CORS = Cross-Origin Resource Sharing

شرح بسيط:
- الإعدادات تسمح بطلبات من نطاقات مختلفة
- إذا كان API في example.com
- و Frontend في another.com
- يحتاج CORS للتواصل

الإعداد الآمن:

next.config.js:
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        {
          key: 'Access-Control-Allow-Origin',
          value: 'https://trusted-domain.com'  // نطاق معين فقط
        },
        {
          key: 'Access-Control-Allow-Methods',
          value: 'GET, POST, PUT, DELETE'
        },
        {
          key: 'Access-Control-Allow-Headers',
          value: 'Content-Type, Authorization'
        }
      ]
    }
  ];
}

❌ خطأ شائع:
Access-Control-Allow-Origin: *  // السماح للجميع!

✅ الصحيح:
Access-Control-Allow-Origin: https://your-domain.com
```

---

## Q12: كيفية عمل encryption؟

**الإجابة:**
```
أنواع التشفير:

1. Encryption at Transit (أثناء النقل):
   HTTP → HTTPS (TLS/SSL)
   - بيانات مشفرة أثناء الإرسال
   - لا يمكن قراءتها بـ man-in-the-middle attack

2. Encryption at Rest (في التخزين):
   Database → Encrypted Database
   - بيانات مشفرة على الخادم
   - حتى إذا سُرقت قاعدة البيانات، تكون غير مقروءة

مثال بسيط:
```typescript
// قبل التشفير (غير آمن)
const data = "SSN: 123-45-6789";

// بعد التشفير (آمن)
const encrypted = encrypt(data, privateKey);
// Output: "aK9@#$%^&*(qwerty"

// فقط المفتاح الصحيح يمكنه فك التشفير
const decrypted = decrypt(encrypted, privateKey);
// Output: "SSN: 123-45-6789"
```

في Firebase:
- Firestore يوفر encryption at rest بشكل افتراضي
- HTTPS مفعّل بشكل افتراضي
- بيانات PII يمكن تشفيرها بشكل إضافي
```

---

## Q13: ما الفرق بين هجمات XSS و CSRF؟

**الإجابة:**
```
XSS (Cross-Site Scripting):
مثال:
- المهاجم يضع script ضار في تعليق
- عند قراءة التعليق، script يعمل في متصفحك
- يسرق cookies أو يحول البيانات

الحماية:
- تجنب innerHTML
- استخدم textContent
- React يرفع XSS بشكل افتراضي
```typescript
// ❌ خطر
html: '<img src=x onerror="alert(1)">'

// ✅ آمن
<div>{userInput}</div>  // React يهرب
```

CSRF (Cross-Site Request Forgery):
مثال:
- أنت معترّف في بنكك
- تزور موقع ضار
- الموقع يرسل طلب لحسابك البنكي
- بدون علمك، يحول أموالك!

الحماية:
- استخدام CSRF tokens
- SameSite cookies
```typescript
// في Next.js
import { csrf } from 'next-csrf';

export async function POST(req) {
  const token = req.headers['x-csrf-token'];
  if (!csrfProtection.validate(token)) {
    return new Response('Invalid', { status: 403 });
  }
  // معالجة الطلب
}
```
```

---

## Q14: كيف أختبر الأمان؟

**الإجابة:**
```
أدوات الاختبار:

1. Firebase Rules Simulator:
   - Firebase Console → Security Rules
   - اختبر scenarios مختلفة

2. Burp Suite Community:
   - اختبار اختراق حقيقي
   - تحليل الطلبات

3. OWASP ZAP:
   - أداة مفتوحة المصدر
   - فحص تلقائي للثغرات

4. npm audit:
   npm audit
   npm audit fix

5. SonarQube:
   - تحليل الكود
   - كشف الثغرات

6. Penetration Testing:
   - توظيف شركة متخصصة
   - اختبار شامل

قائمة التحقق اليدوية:
- [ ] محاول الوصول بدون تسجيل دخول
- [ ] محاول تعديل UID في URL
- [ ] محاول تسجيل الدخول بكلمات مرور ضعيفة
- [ ] محاول حذف حساب آخر
- [ ] محاول تجاوز التحقق
- [ ] محاول رفع ملفات خطرة
```

---

## Q15: ماذا أفعل إذا اخترقت قاعدة البيانات؟

**الإجابة:**
```
خطة الاستجابة:

1. فوري (الساعة الأولى):
   - [ ] عزل النظام عن الإنترنت
   - [ ] حفظ الأدلة والسجلات
   - [ ] إخطار فريق الأمن
   - [ ] تفعيل خطة الطوارئ

2. قصير المدى (24 ساعة):
   - [ ] تحديد نطاق الاختراق
   - [ ] معرفة البيانات المسروقة
   - [ ] إعادة تعيين كل الكلمات المرور
   - [ ] حظر الحسابات المريبة
   - [ ] تحليل السجلات
   - [ ] توثيق كل شيء

3. إخطار المستخدمين:
   - [ ] بريد واضح عن الحادثة
   - [ ] تعليمات بتغيير كلمة المرور
   - [ ] خدمة مراقبة ائتمان مجانية
   - [ ] خط ساخن للأسئلة

4. طويل المدى:
   - [ ] تحسين الأمان
   - [ ] اختبارات اختراق
   - [ ] تدريب الفريق
   - [ ] مراجعة السياسات

قالب البريد:
```
الموضوع: إشعار أمني مهم

عزيزي المستخدم،

اكتشفنا نشاط غير مصرح قد يؤثر على حسابك.
قدنا بالتالي:
1. حماية بيانات المستخدمين
2. إجراء تحقيق فوري
3. تحسين أنظمتنا الأمنية

ما يجب عليك فعله:
1. غيّر كلمة المرور فوراً
2. فعّل المصادقة الثنائية
3. راقب حسابك

اتصل بنا على: security@gahar.gov.eg
```
```

---

## 📚 مراجع إضافية

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules/best-practices)
- [Next.js Security](https://nextjs.org/docs/going-to-production/security-checklist)
- [CWE Top 25](https://cwe.mitre.org/top25/)

---

**آخر تحديث:** 26 نوفمبر 2025

