'use client';

import React from 'react';

interface SectionHeaderProps {
    title: string;
    icon?: string;
    count?: number;
    isExpanded: boolean;
    onToggle: () => void;
}

/**
 * رأس القسم القابل للطي والتوسيع
 * يستخدم في جميع الأقسام الفرعية للإدارات
 */
export default function SectionHeader({
    title,
    icon = '📋',
    count,
    isExpanded,
    onToggle
}: SectionHeaderProps) {
    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                marginBottom: isExpanded ? '20px' : '0',
                paddingBottom: isExpanded ? '15px' : '0',
                borderBottom: isExpanded ? '2px solid var(--background-color)' : 'none',
                transition: 'all 0.3s ease'
            }}
            onClick={onToggle}
        >
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>
                {icon} {title}
                {count !== undefined && ` - عدد ${count}`}
            </h2>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--primary-color)',
                    fontWeight: 'bold'
                }}
            >
                <span style={{ fontSize: '0.9rem' }}>
                    {isExpanded ? 'طي القسم' : 'توسيع القسم'}
                </span>
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    style={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s ease'
                    }}
                >
                    <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
            </div>
        </div>
    );
}
