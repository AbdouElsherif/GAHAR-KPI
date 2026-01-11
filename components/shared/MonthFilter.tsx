'use client';

import React from 'react';

interface MonthFilterProps {
    value: string;
    onChange: (value: string) => void;
    label?: string;
    maxDate?: string;
    minWidth?: string;
}

/**
 * فلتر الشهر القابل لإعادة الاستخدام
 * يستخدم في جميع الجداول التي تحتاج فلترة حسب الشهر
 */
export default function MonthFilter({
    value,
    onChange,
    label = 'فلترة حسب الشهر',
    maxDate,
    minWidth = '200px'
}: MonthFilterProps) {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    // Default max date is current month
    const defaultMaxDate = maxDate || new Date().toISOString().split('T')[0].slice(0, 7);
    // Minimum date is January 2019
    const defaultMinDate = '2019-01';

    return (
        <div className="form-group" style={{ margin: 0, minWidth }}>
            {label && <label className="form-label">{label}</label>}
            <input
                type="month"
                className="form-input"
                value={value}
                onChange={handleChange}
                placeholder={label}
                min={defaultMinDate}
                max={defaultMaxDate}
                style={{
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '0.9rem',
                    borderRadius: '6px',
                    border: '1px solid #ddd',
                    transition: 'border-color 0.2s'
                }}
            />
        </div>
    );
}
