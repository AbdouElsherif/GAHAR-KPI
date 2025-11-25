'use client';

import { Dispatch, SetStateAction } from 'react';

interface PaginationProps {
    currentPage: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange: (items: number) => void;
}

export default function Pagination({
    currentPage,
    totalItems,
    itemsPerPage,
    onPageChange,
    onItemsPerPageChange
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const showPages = 5; // عدد الصفحات المعروضة

        if (totalPages <= showPages + 2) {
            // إذا كان العدد قليل، اعرض كل الصفحات
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // دائماً اعرض الصفحة الأولى
            pages.push(1);

            if (currentPage > 3) {
                pages.push('...');
            }

            // الصفحات حول الصفحة الحالية
            const start = Math.max(2, currentPage - 1);
            const end = Math.min(totalPages - 1, currentPage + 1);

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }

            if (currentPage < totalPages - 2) {
                pages.push('...');
            }

            // دائماً اعرض الصفحة الأخيرة
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '20px',
            padding: '15px',
            backgroundColor: 'var(--background-color)',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '15px'
        }}>
            {/* معلومات الصفحة */}
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                عرض <strong>{startItem}</strong> إلى <strong>{endItem}</strong> من أصل <strong>{totalItems}</strong>
            </div>

            {/* أزرار التنقل */}
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                {/* زر السابق */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: currentPage === 1 ? 'var(--background-color)' : 'var(--card-bg)',
                        color: currentPage === 1 ? '#999' : 'var(--text-color)',
                        borderRadius: '6px',
                        cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                >
                    السابق
                </button>

                {/* أرقام الصفحات */}
                {getPageNumbers().map((page, index) => (
                    page === '...' ? (
                        <span key={`ellipsis-${index}`} style={{ padding: '8px 4px', color: 'var(--text-color)' }}>
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            onClick={() => onPageChange(page as number)}
                            style={{
                                padding: '8px 12px',
                                border: '1px solid var(--border-color)',
                                backgroundColor: currentPage === page ? 'var(--primary-color)' : 'var(--card-bg)',
                                color: currentPage === page ? '#ffffff' : 'var(--text-color)',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.9rem',
                                fontWeight: currentPage === page ? 'bold' : 'normal',
                                minWidth: '40px',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.backgroundColor = 'var(--hover-color)';
                                    e.currentTarget.style.color = '#ffffff';
                                }
                            }}
                            onMouseOut={(e) => {
                                if (currentPage !== page) {
                                    e.currentTarget.style.backgroundColor = 'var(--card-bg)';
                                    e.currentTarget.style.color = 'var(--text-color)';
                                }
                            }}
                        >
                            {page}
                        </button>
                    )
                ))}

                {/* زر التالي */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    style={{
                        padding: '8px 12px',
                        border: '1px solid var(--border-color)',
                        backgroundColor: currentPage === totalPages ? 'var(--background-color)' : 'var(--card-bg)',
                        color: currentPage === totalPages ? '#999' : 'var(--text-color)',
                        borderRadius: '6px',
                        cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem',
                        transition: 'all 0.2s'
                    }}
                >
                    التالي
                </button>
            </div>

            {/* اختيار عدد العناصر */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <label style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                    عدد السجلات:
                </label>
                <select
                    value={itemsPerPage}
                    onChange={(e) => {
                        onItemsPerPageChange(Number(e.target.value));
                        onPageChange(1); // العودة للصفحة الأولى عند التغيير
                    }}
                    style={{
                        padding: '6px 10px',
                        border: '1px solid var(--border-color)',
                        borderRadius: '6px',
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-color)',
                        cursor: 'pointer',
                        fontSize: '0.9rem'
                    }}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
            </div>
        </div>
    );
}
