'use client';

import React, { useState } from 'react';
import { exportDepartmentDataToExcel } from '@/lib/excelExportHelpers';

interface DepartmentExportButtonProps {
    departmentId: string;
    departmentName: string;
}

export default function DepartmentExportButton({ departmentId, departmentName }: DepartmentExportButtonProps) {
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportPeriodType, setExportPeriodType] = useState('month');
    const [exportMonth, setExportMonth] = useState('');
    const [exportQuarter, setExportQuarter] = useState('1');
    const [exportHalfYear, setExportHalfYear] = useState('1');
    const [exportYear, setExportYear] = useState(new Date().getFullYear().toString());
    const [isExporting, setIsExporting] = useState(false);

    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYear - i).toString());

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let filterString = '';

            if (exportPeriodType === 'month') {
                if (!exportMonth) {
                    alert('يرجى اختيار الشهر');
                    setIsExporting(false);
                    return;
                }
                filterString = exportMonth; // "YYYY-MM"
            } else if (exportPeriodType === 'quarter') {
                filterString = `Q${exportQuarter}-${exportYear}`;
            } else if (exportPeriodType === 'halfYear') {
                filterString = `H${exportHalfYear}-${exportYear}`;
            } else if (exportPeriodType === 'year') {
                filterString = `Y-${exportYear}`;
            } else if (exportPeriodType === 'all') {
                filterString = 'ALL';
            }

            await exportDepartmentDataToExcel(departmentId, departmentName, filterString);
            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Error exporting data: ', error);
            alert('حدث خطأ أثناء تصدير البيانات. يرجى المحاولة مرة أخرى.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <button
                onClick={() => setIsExportModalOpen(true)}
                className="btn"
                style={{
                    backgroundColor: '#198754', // Matches the Dashboard button green
                    color: 'white',
                    fontSize: '0.95rem',
                    padding: '10px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    minWidth: '160px',
                    fontFamily: 'inherit'
                }}
            >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                تصدير بيانات الإدارة
            </button>

            {isExportModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 9999,
                    display: 'flex', justifyContent: 'center', alignItems: 'center'
                }}>
                    <div style={{
                        backgroundColor: 'white', borderRadius: '8px', width: '100%', maxWidth: '500px',
                        margin: '0 20px', overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                        direction: 'rtl'
                    }}>
                        <div style={{ backgroundColor: '#198754', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: 'white' }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 'bold' }}>تصدير بيانات {departmentName}</h3>
                            <button
                                onClick={() => !isExporting && setIsExportModalOpen(false)}
                                disabled={isExporting}
                                style={{ background: 'none', border: 'none', color: 'white', cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                            >
                                &times;
                            </button>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <p style={{ color: '#666', marginBottom: '20px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                سيتم تصدير جميع أقسام هذه الإدارة في ملف إكسل واحد (Excel) مقسم إلى أوراق عمل (Sheets). قم باختيار الفترة المطلوبة للتصدير.
                            </p>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <div>
                                    <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>نوع الفترة</label>
                                    <select
                                        value={exportPeriodType}
                                        onChange={(e) => setExportPeriodType(e.target.value)}
                                        disabled={isExporting}
                                        style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                    >
                                        <option value="month">شهر محدد</option>
                                        <option value="quarter">ربع سنة</option>
                                        <option value="halfYear">نصف سنة</option>
                                        <option value="year">سنة كاملة</option>
                                        <option value="all">كل الفترات (بدون فلتر)</option>
                                    </select>
                                </div>

                                {exportPeriodType === 'month' && (
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>الشهر</label>
                                        <input
                                            type="month"
                                            value={exportMonth}
                                            onChange={(e) => setExportMonth(e.target.value)}
                                            disabled={isExporting}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                        />
                                    </div>
                                )}

                                {exportPeriodType === 'quarter' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>الربع</label>
                                            <select
                                                value={exportQuarter}
                                                onChange={(e) => setExportQuarter(e.target.value)}
                                                disabled={isExporting}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                            >
                                                <option value="1">الربع الأول (يناير - مارس)</option>
                                                <option value="2">الربع الثاني (أبريل - يونيو)</option>
                                                <option value="3">الربع الثالث (يوليو - سبتمبر)</option>
                                                <option value="4">الربع الرابع (أكتوبر - ديسمبر)</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>السنة</label>
                                            <select
                                                value={exportYear}
                                                onChange={(e) => setExportYear(e.target.value)}
                                                disabled={isExporting}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                            >
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {exportPeriodType === 'halfYear' && (
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ flex: 2 }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>النصف</label>
                                            <select
                                                value={exportHalfYear}
                                                onChange={(e) => setExportHalfYear(e.target.value)}
                                                disabled={isExporting}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                            >
                                                <option value="1">النصف الأول (يناير - يونيو)</option>
                                                <option value="2">النصف الثاني (يوليو - ديسمبر)</option>
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>السنة</label>
                                            <select
                                                value={exportYear}
                                                onChange={(e) => setExportYear(e.target.value)}
                                                disabled={isExporting}
                                                style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                            >
                                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {exportPeriodType === 'year' && (
                                    <div>
                                        <label style={{ display: 'block', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>السنة</label>
                                        <select
                                            value={exportYear}
                                            onChange={(e) => setExportYear(e.target.value)}
                                            disabled={isExporting}
                                            style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '1rem' }}
                                        >
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ backgroundColor: '#f8f9fa', padding: '15px 20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #ddd' }}>
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                disabled={isExporting}
                                className="btn"
                                style={{
                                    backgroundColor: '#6c757d', color: 'white', border: 'none', padding: '10px 20px',
                                    borderRadius: '4px', cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
                                    fontWeight: 'bold'
                                }}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="btn"
                                style={{
                                    backgroundColor: '#198754', color: 'white', border: 'none', padding: '10px 20px',
                                    borderRadius: '4px', cursor: isExporting ? 'not-allowed' : 'pointer', fontSize: '0.95rem',
                                    fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px',
                                    opacity: isExporting ? 0.7 : 1
                                }}
                            >
                                {isExporting ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite', marginLeft: '-0.25rem', marginRight: '0.5rem', height: '1.25rem', width: '1.25rem', color: 'white' }}>
                                            <circle style={{ opacity: 0.25 }} cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path style={{ opacity: 0.75 }} fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        جاري المعالجة...
                                    </>
                                ) : 'تصدير الآن'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

