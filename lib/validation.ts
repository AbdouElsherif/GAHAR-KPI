/**
 * Input Validation Library
 * دوال التحقق من صحة المدخلات
 */

export interface ValidationError {
    field: string;
    message: string;
}

/**
 * التحقق من أن الحقل غير فارغ
 */
export function requiredField(value: any, fieldLabel: string): ValidationError | null {
    if (value === undefined || value === null || value === '' || (typeof value === 'string' && value.trim() === '')) {
        return { field: fieldLabel, message: `${fieldLabel} حقل مطلوب` };
    }
    return null;
}

/**
 * التحقق من أن القيمة رقم صحيح وموجب
 */
export function positiveNumber(value: any, fieldLabel: string): ValidationError | null {
    const num = Number(value);
    if (isNaN(num)) {
        return { field: fieldLabel, message: `${fieldLabel} يجب أن يكون رقماً` };
    }
    if (num < 0) {
        return { field: fieldLabel, message: `${fieldLabel} يجب أن يكون رقماً موجباً` };
    }
    return null;
}

/**
 * التحقق من أن القيمة نسبة مئوية بين 0 و 100
 */
export function percentage(value: any, fieldLabel: string): ValidationError | null {
    const num = Number(value);
    if (isNaN(num)) {
        return { field: fieldLabel, message: `${fieldLabel} يجب أن يكون رقماً` };
    }
    if (num < 0 || num > 100) {
        return { field: fieldLabel, message: `${fieldLabel} يجب أن تكون نسبة بين 0 و 100` };
    }
    return null;
}

/**
 * التحقق من صيغة الشهر (YYYY-MM)
 */
export function validMonth(value: string, fieldLabel: string = 'الشهر'): ValidationError | null {
    if (!value || value.trim() === '') {
        return { field: fieldLabel, message: `يرجى اختيار ${fieldLabel}` };
    }
    const pattern = /^\d{4}-\d{2}$/;
    if (!pattern.test(value)) {
        return { field: fieldLabel, message: `${fieldLabel} يجب أن يكون بصيغة YYYY-MM` };
    }
    return null;
}

/**
 * التحقق من أن الشهر ليس مستقبلياً
 */
export function notFutureMonth(value: string, fieldLabel: string = 'الشهر'): ValidationError | null {
    if (!value) return null;
    const [selectedYear, selectedMonth] = value.split('-').map(Number);
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    if (selectedYear > currentYear || (selectedYear === currentYear && selectedMonth > currentMonth)) {
        return { field: fieldLabel, message: 'لا يمكن تسجيل بيانات لشهر مستقبلي' };
    }
    return null;
}

/**
 * التحقق من صيغة التاريخ (YYYY-MM-DD)
 */
export function validDate(value: string, fieldLabel: string = 'التاريخ'): ValidationError | null {
    if (!value || value.trim() === '') {
        return { field: fieldLabel, message: `يرجى اختيار ${fieldLabel}` };
    }
    const pattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!pattern.test(value)) {
        return { field: fieldLabel, message: `${fieldLabel} يجب أن يكون بصيغة صحيحة` };
    }
    return null;
}

/**
 * التحقق من أن التاريخ ليس مستقبلياً (لليوم)
 */
export function notFutureDate(value: string, fieldLabel: string = 'التاريخ'): ValidationError | null {
    if (!value) return null;
    const selectedDate = new Date(value);
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    if (selectedDate > today) {
        return { field: fieldLabel, message: 'لا يمكن تسجيل بيانات بتاريخ مستقبلي' };
    }
    return null;
}

/**
 * تجميع أخطاء التحقق وعرضها في alert واحد
 * @returns true إذا لا توجد أخطاء (valid)، false إذا توجد أخطاء
 */
export function validateAndAlert(errors: (ValidationError | null)[]): boolean {
    const actualErrors = errors.filter((e): e is ValidationError => e !== null);
    if (actualErrors.length === 0) return true;

    const message = '⚠️ يرجى تصحيح الأخطاء التالية:\n\n' +
        actualErrors.map((e, i) => `${i + 1}. ${e.message}`).join('\n');
    alert(message);
    return false;
}

/**
 * التحقق من النموذج العام - يتحقق من أن جميع الحقول المطلوبة غير فارغة
 * @param formData بيانات النموذج
 * @param requiredFields قائمة الحقول المطلوبة [اسم_الحقل, عنوان_العرض]
 */
export function validateRequiredFields(
    formData: Record<string, any>,
    requiredFields: [string, string][]
): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const [fieldName, fieldLabel] of requiredFields) {
        const error = requiredField(formData[fieldName], fieldLabel);
        if (error) errors.push(error);
    }
    return errors;
}

/**
 * التحقق من حقول الأرقام - يتحقق من أنها أرقام موجبة
 * @param formData بيانات النموذج
 * @param numericFields قائمة الحقول الرقمية [اسم_الحقل, عنوان_العرض]
 */
export function validateNumericFields(
    formData: Record<string, any>,
    numericFields: [string, string][]
): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const [fieldName, fieldLabel] of numericFields) {
        const value = formData[fieldName];
        // تحقق فقط إذا كان الحقل يحتوي على قيمة
        if (value !== undefined && value !== null && value !== '') {
            const error = positiveNumber(value, fieldLabel);
            if (error) errors.push(error);
        }
    }
    return errors;
}

/**
 * التحقق من حقول النسب المئوية - يتحقق من أنها بين 0 و 100
 * @param formData بيانات النموذج
 * @param percentFields قائمة حقول النسب [اسم_الحقل, عنوان_العرض]
 */
export function validatePercentageFields(
    formData: Record<string, any>,
    percentFields: [string, string][]
): ValidationError[] {
    const errors: ValidationError[] = [];
    for (const [fieldName, fieldLabel] of percentFields) {
        const value = formData[fieldName];
        if (value !== undefined && value !== null && value !== '') {
            const error = percentage(value, fieldLabel);
            if (error) errors.push(error);
        }
    }
    return errors;
}
