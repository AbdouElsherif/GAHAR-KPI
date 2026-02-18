export const GOVERNORATE_PHASES = {
    PHASE_1: ['بورسعيد', 'السويس', 'الإسماعيلية', 'جنوب سيناء', 'أسوان', 'الأقصر'],
    PHASE_2: ['المنيا', 'مطروح', 'دمياط', 'شمال سيناء', 'كفر الشيخ']
};

export const OTHER_GOVERNORATES = [
    'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'البحر الأحمر',
    'البحيرة', 'الغربية', 'المنوفية', 'الشرقية', 'بني سويف',
    'الفيوم', 'أسيوط', 'الوادي الجديد', 'سوهاج', 'قنا'
];

export const getGovernoratePhase = (governorate: string) => {
    if (GOVERNORATE_PHASES.PHASE_1.includes(governorate)) return 'مرحلة أولى';
    if (GOVERNORATE_PHASES.PHASE_2.includes(governorate)) return 'مرحلة ثانية';
    return 'محافظات أخرى';
};
