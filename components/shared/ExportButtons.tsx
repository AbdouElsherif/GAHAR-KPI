'use client';

import React from 'react';

interface ExportButtonsProps {
    onExportExcel: () => void;
    onExportWord: () => void;
    disabled?: boolean;
    show?: boolean;
}

/**
 * أزرار التصدير إلى Excel و Word
 * يستخدم في جميع الجداول التي تحتاج تصدير
 */
export default function ExportButtons({
    onExportExcel,
    onExportWord,
    disabled = false,
    show = true
}: ExportButtonsProps) {
    if (!show) return null;

    return (
        <>
            <button
                onClick={onExportExcel}
                disabled={disabled}
                style={{
                    padding: '8px 16px',
                    backgroundColor: disabled ? '#ccc' : '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = '#218838';
                    }
                }}
                onMouseOut={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = '#28a745';
                    }
                }}
            >
                📊 تصدير Excel
            </button>
            <button
                onClick={onExportWord}
                disabled={disabled}
                style={{
                    padding: '8px 16px',
                    backgroundColor: disabled ? '#ccc' : '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    opacity: disabled ? 0.6 : 1,
                    transition: 'all 0.2s'
                }}
                onMouseOver={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = '#0056b3';
                    }
                }}
                onMouseOut={(e) => {
                    if (!disabled) {
                        e.currentTarget.style.backgroundColor = '#007bff';
                    }
                }}
            >
                📄 تصدير Word
            </button>
        </>
    );
}
