'use client';

import { useState, useRef, useCallback } from 'react';
import {
    readExcelFile,
    validateExcelData,
    batchSaveToFirestore,
    generateTemplate,
    type SectionDefinition,
    type ImportValidationResult,
    type BatchSaveResult
} from '@/lib/excelImportHelpers';

interface ExcelImportButtonProps {
    sectionDef: SectionDefinition;
    userId: string;
    onImportComplete: () => void;
    disabled?: boolean;
}

type ImportStep = 'idle' | 'preview' | 'importing' | 'done' | 'error';

export default function ExcelImportButton({
    sectionDef,
    userId,
    onImportComplete,
    disabled = false
}: ExcelImportButtonProps) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [step, setStep] = useState<ImportStep>('idle');
    const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
    const [saveResult, setSaveResult] = useState<BatchSaveResult | null>(null);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [dragOver, setDragOver] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const resetState = useCallback(() => {
        setStep('idle');
        setValidationResult(null);
        setSaveResult(null);
        setProgress({ current: 0, total: 0 });
        setDragOver(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const handleClose = useCallback(() => {
        setIsModalOpen(false);
        resetState();
    }, [resetState]);

    const processFile = useCallback(async (file: File) => {
        if (!file.name.match(/\.(xlsx|xls)$/i)) {
            alert('⚠️ يرجى اختيار ملف Excel بصيغة .xlsx أو .xls');
            return;
        }

        try {
            const rawData = await readExcelFile(file);
            const result = validateExcelData(rawData, sectionDef);
            setValidationResult(result);
            setStep('preview');
        } catch (error) {
            setValidationResult({
                isValid: false,
                errors: [(error as Error).message],
                warnings: [],
                data: [],
                totalRows: 0
            });
            setStep('error');
        }
    }, [sectionDef]);

    const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) processFile(file);
    }, [processFile]);

    const handleImport = useCallback(async () => {
        if (!validationResult || !validationResult.isValid || validationResult.data.length === 0) return;

        setStep('importing');
        setProgress({ current: 0, total: validationResult.data.length });

        const result = await batchSaveToFirestore(
            validationResult.data,
            sectionDef,
            userId,
            (current, total) => setProgress({ current, total })
        );

        setSaveResult(result);
        setStep('done');

        if (result.success) {
            onImportComplete();
        }
    }, [validationResult, sectionDef, userId, onImportComplete]);

    const handleDownloadTemplate = useCallback(() => {
        generateTemplate(sectionDef);
    }, [sectionDef]);

    // Preview table columns (show first 5 columns max for readability)
    const previewColumns = sectionDef.columns.slice(0, 6);

    return (
        <>
            {/* Import Button */}
            <div style={{ display: 'flex', gap: '6px' }}>
                <button
                    onClick={() => { resetState(); setIsModalOpen(true); }}
                    disabled={disabled}
                    title="استيراد بيانات من ملف Excel"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 14px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: '#fff',
                        background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 6px rgba(39,174,96,0.3)',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                >
                    📥 استيراد Excel
                </button>
                <button
                    onClick={handleDownloadTemplate}
                    disabled={disabled}
                    title="تحميل نموذج Excel فارغ"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        padding: '7px 10px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: 'var(--primary-color)',
                        background: 'transparent',
                        border: '2px solid var(--primary-color)',
                        borderRadius: '8px',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: disabled ? 0.5 : 1,
                        transition: 'all 0.2s ease',
                        whiteSpace: 'nowrap'
                    }}
                    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = 'var(--primary-color)'; e.currentTarget.style.color = '#fff'; } }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--primary-color)'; }}
                >
                    📄 نموذج
                </button>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.6)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10000,
                        backdropFilter: 'blur(4px)'
                    }}
                    onClick={(e) => { if (e.target === e.currentTarget && step !== 'importing') handleClose(); }}
                >
                    <div
                        style={{
                            background: 'var(--card-bg, #fff)',
                            borderRadius: '16px',
                            width: '90%',
                            maxWidth: step === 'preview' ? '900px' : '550px',
                            maxHeight: '85vh',
                            overflow: 'auto',
                            boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                            animation: 'modalSlideIn 0.3s ease',
                            direction: 'rtl'
                        }}
                    >
                        <style>{`
                            @keyframes modalSlideIn {
                                from { opacity: 0; transform: translateY(-20px) scale(0.95); }
                                to { opacity: 1; transform: translateY(0) scale(1); }
                            }
                            @keyframes progressPulse {
                                0%, 100% { opacity: 1; }
                                50% { opacity: 0.7; }
                            }
                        `}</style>

                        {/* Header */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '20px 24px',
                            borderBottom: '2px solid var(--background-color, #f0f0f0)',
                            background: 'linear-gradient(135deg, rgba(39,174,96,0.08), rgba(46,204,113,0.04))'
                        }}>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-color, #333)' }}>
                                📥 استيراد بيانات - {sectionDef.name}
                            </h3>
                            {step !== 'importing' && (
                                <button
                                    onClick={handleClose}
                                    style={{
                                        background: 'none',
                                        border: 'none',
                                        fontSize: '24px',
                                        cursor: 'pointer',
                                        color: 'var(--text-secondary, #666)',
                                        padding: '4px',
                                        lineHeight: 1
                                    }}
                                >✕</button>
                            )}
                        </div>

                        {/* Body */}
                        <div style={{ padding: '24px' }}>

                            {/* Step 1: File Selection */}
                            {step === 'idle' && (
                                <div>
                                    {/* Drop Zone */}
                                    <div
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            border: `3px dashed ${dragOver ? '#27ae60' : 'var(--border-color, #ddd)'}`,
                                            borderRadius: '12px',
                                            padding: '40px 20px',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            background: dragOver ? 'rgba(39,174,96,0.08)' : 'var(--background-color, #f9f9f9)',
                                            transition: 'all 0.3s ease',
                                            marginBottom: '20px'
                                        }}
                                    >
                                        <div style={{ fontSize: '48px', marginBottom: '12px' }}>
                                            {dragOver ? '📂' : '📁'}
                                        </div>
                                        <p style={{
                                            fontSize: '16px',
                                            fontWeight: '600',
                                            color: 'var(--text-color, #333)',
                                            marginBottom: '8px'
                                        }}>
                                            اسحب ملف Excel هنا أو اضغط للاختيار
                                        </p>
                                        <p style={{
                                            fontSize: '13px',
                                            color: 'var(--text-secondary, #999)'
                                        }}>
                                            يدعم ملفات .xlsx و .xls
                                        </p>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept=".xlsx,.xls"
                                            onChange={handleFileSelect}
                                            style={{ display: 'none' }}
                                        />
                                    </div>

                                    {/* Quick Actions */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: 'center',
                                        flexWrap: 'wrap'
                                    }}>
                                        <button
                                            onClick={handleDownloadTemplate}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                padding: '10px 16px',
                                                fontSize: '14px',
                                                color: '#2980b9',
                                                background: 'rgba(41,128,185,0.08)',
                                                border: '1px solid rgba(41,128,185,0.2)',
                                                borderRadius: '8px',
                                                cursor: 'pointer',
                                                fontWeight: '600'
                                            }}
                                        >
                                            📄 تحميل نموذج فارغ
                                        </button>
                                    </div>

                                    {/* Info */}
                                    <div style={{
                                        marginTop: '20px',
                                        padding: '14px',
                                        background: 'rgba(41,128,185,0.06)',
                                        borderRadius: '8px',
                                        border: '1px solid rgba(41,128,185,0.15)',
                                        fontSize: '13px',
                                        color: 'var(--text-secondary, #666)',
                                        lineHeight: '1.8'
                                    }}>
                                        <strong style={{ color: '#2980b9' }}>💡 نصيحة:</strong> حمّل النموذج الفارغ أولاً، واملأ البيانات فيه، ثم ارفعه هنا.
                                        <br />
                                        <strong>الأعمدة المطلوبة:</strong> {sectionDef.columns.filter(c => c.required).map(c => c.header).join('، ')}
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Preview & Validation */}
                            {step === 'preview' && validationResult && (
                                <div>
                                    {/* Status Banner */}
                                    <div style={{
                                        padding: '14px 16px',
                                        borderRadius: '10px',
                                        marginBottom: '16px',
                                        background: validationResult.isValid
                                            ? 'linear-gradient(135deg, rgba(39,174,96,0.1), rgba(46,204,113,0.05))'
                                            : 'linear-gradient(135deg, rgba(231,76,60,0.1), rgba(192,57,43,0.05))',
                                        border: `1px solid ${validationResult.isValid ? 'rgba(39,174,96,0.3)' : 'rgba(231,76,60,0.3)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px'
                                    }}>
                                        <span style={{ fontSize: '28px' }}>
                                            {validationResult.isValid ? '✅' : '❌'}
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: '700', fontSize: '15px', color: 'var(--text-color, #333)' }}>
                                                {validationResult.isValid
                                                    ? `تم تحقق البيانات بنجاح - ${validationResult.data.length} سجل جاهز للاستيراد`
                                                    : `توجد أخطاء في البيانات (${validationResult.errors.length} خطأ)`
                                                }
                                            </div>
                                            {validationResult.warnings.length > 0 && (
                                                <div style={{ fontSize: '13px', color: '#e67e22', marginTop: '4px' }}>
                                                    ⚠️ {validationResult.warnings.length} تنبيه
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Errors */}
                                    {validationResult.errors.length > 0 && (
                                        <div style={{
                                            maxHeight: '150px',
                                            overflow: 'auto',
                                            padding: '12px',
                                            background: 'rgba(231,76,60,0.05)',
                                            borderRadius: '8px',
                                            marginBottom: '12px',
                                            border: '1px solid rgba(231,76,60,0.15)',
                                            fontSize: '13px'
                                        }}>
                                            {validationResult.errors.map((err, idx) => (
                                                <div key={idx} style={{ color: '#c0392b', marginBottom: '4px' }}>
                                                    ❌ {err}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Warnings */}
                                    {validationResult.warnings.length > 0 && (
                                        <div style={{
                                            maxHeight: '100px',
                                            overflow: 'auto',
                                            padding: '12px',
                                            background: 'rgba(243,156,18,0.05)',
                                            borderRadius: '8px',
                                            marginBottom: '12px',
                                            border: '1px solid rgba(243,156,18,0.15)',
                                            fontSize: '13px'
                                        }}>
                                            {validationResult.warnings.map((warn, idx) => (
                                                <div key={idx} style={{ color: '#d68910', marginBottom: '4px' }}>
                                                    ⚠️ {warn}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Data Preview Table */}
                                    {validationResult.data.length > 0 && (
                                        <div style={{
                                            maxHeight: '300px',
                                            overflow: 'auto',
                                            borderRadius: '8px',
                                            border: '1px solid var(--border-color, #e0e0e0)',
                                            marginBottom: '16px'
                                        }}>
                                            <table style={{
                                                width: '100%',
                                                borderCollapse: 'collapse',
                                                fontSize: '13px',
                                                direction: 'rtl'
                                            }}>
                                                <thead>
                                                    <tr style={{
                                                        background: 'var(--primary-color)',
                                                        color: '#fff',
                                                        position: 'sticky',
                                                        top: 0
                                                    }}>
                                                        <th style={{ padding: '10px 12px', textAlign: 'right' }}>#</th>
                                                        {previewColumns.map(col => (
                                                            <th key={col.field} style={{ padding: '10px 12px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                                                                {col.header}
                                                            </th>
                                                        ))}
                                                        {sectionDef.columns.length > 6 && (
                                                            <th style={{ padding: '10px 12px', textAlign: 'center' }}>...</th>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {validationResult.data.slice(0, 10).map((row, idx) => (
                                                        <tr key={idx} style={{
                                                            background: idx % 2 === 0 ? 'var(--card-bg, #fff)' : 'var(--background-color, #f9f9f9)',
                                                            borderBottom: '1px solid var(--border-color, #eee)'
                                                        }}>
                                                            <td style={{ padding: '8px 12px', fontWeight: '600', color: 'var(--text-secondary, #999)' }}>
                                                                {idx + 1}
                                                            </td>
                                                            {previewColumns.map(col => (
                                                                <td key={col.field} style={{ padding: '8px 12px' }}>
                                                                    {row[col.field] !== undefined ? String(row[col.field]) : '-'}
                                                                </td>
                                                            ))}
                                                            {sectionDef.columns.length > 6 && (
                                                                <td style={{ padding: '8px 12px', textAlign: 'center', color: 'var(--text-secondary, #999)' }}>...</td>
                                                            )}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                            {validationResult.data.length > 10 && (
                                                <div style={{
                                                    textAlign: 'center',
                                                    padding: '8px',
                                                    fontSize: '12px',
                                                    color: 'var(--text-secondary, #999)',
                                                    background: 'var(--background-color, #f5f5f5)'
                                                }}>
                                                    يتم عرض أول 10 سجلات من أصل {validationResult.data.length}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div style={{
                                        display: 'flex',
                                        gap: '12px',
                                        justifyContent: 'flex-start'
                                    }}>
                                        {validationResult.isValid && validationResult.data.length > 0 && (
                                            <button
                                                onClick={handleImport}
                                                style={{
                                                    padding: '12px 28px',
                                                    fontSize: '15px',
                                                    fontWeight: '700',
                                                    color: '#fff',
                                                    background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
                                                    border: 'none',
                                                    borderRadius: '10px',
                                                    cursor: 'pointer',
                                                    boxShadow: '0 4px 12px rgba(39,174,96,0.3)',
                                                    transition: 'all 0.2s ease'
                                                }}
                                            >
                                                ✅ استيراد {validationResult.data.length} سجل
                                            </button>
                                        )}
                                        <button
                                            onClick={resetState}
                                            style={{
                                                padding: '12px 20px',
                                                fontSize: '14px',
                                                color: 'var(--text-secondary, #666)',
                                                background: 'var(--background-color, #f0f0f0)',
                                                border: '1px solid var(--border-color, #ddd)',
                                                borderRadius: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🔄 اختيار ملف آخر
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            style={{
                                                padding: '12px 20px',
                                                fontSize: '14px',
                                                color: '#e74c3c',
                                                background: 'transparent',
                                                border: '1px solid rgba(231,76,60,0.3)',
                                                borderRadius: '10px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 3: Importing Progress */}
                            {step === 'importing' && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'progressPulse 1.5s infinite' }}>
                                        ⏳
                                    </div>
                                    <h3 style={{ margin: '0 0 12px', color: 'var(--text-color, #333)' }}>
                                        جاري استيراد البيانات...
                                    </h3>
                                    <p style={{ color: 'var(--text-secondary, #666)', margin: '0 0 20px' }}>
                                        {progress.current} من {progress.total} سجل
                                    </p>

                                    {/* Progress Bar */}
                                    <div style={{
                                        width: '100%',
                                        height: '12px',
                                        background: 'var(--background-color, #e0e0e0)',
                                        borderRadius: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                                            height: '100%',
                                            background: 'linear-gradient(90deg, #27ae60, #2ecc71)',
                                            borderRadius: '6px',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>

                                    <p style={{
                                        fontSize: '12px',
                                        color: 'var(--text-secondary, #999)',
                                        marginTop: '12px'
                                    }}>
                                        ⚠️ لا تغلق هذه النافذة حتى اكتمال الاستيراد
                                    </p>
                                </div>
                            )}

                            {/* Step 4: Done */}
                            {step === 'done' && saveResult && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '56px', marginBottom: '16px' }}>
                                        {saveResult.success ? '🎉' : '⚠️'}
                                    </div>
                                    <h3 style={{
                                        margin: '0 0 12px',
                                        color: saveResult.success ? '#27ae60' : '#e67e22'
                                    }}>
                                        {saveResult.success
                                            ? 'تم استيراد البيانات بنجاح!'
                                            : 'تم الاستيراد مع بعض الأخطاء'
                                        }
                                    </h3>

                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                        gap: '24px',
                                        marginBottom: '20px'
                                    }}>
                                        <div style={{
                                            padding: '12px 20px',
                                            background: 'rgba(39,174,96,0.1)',
                                            borderRadius: '10px',
                                            textAlign: 'center'
                                        }}>
                                            <div style={{ fontSize: '24px', fontWeight: '700', color: '#27ae60' }}>
                                                {saveResult.savedCount}
                                            </div>
                                            <div style={{ fontSize: '13px', color: 'var(--text-secondary, #666)' }}>
                                                سجل تم حفظه
                                            </div>
                                        </div>
                                        {saveResult.failedCount > 0 && (
                                            <div style={{
                                                padding: '12px 20px',
                                                background: 'rgba(231,76,60,0.1)',
                                                borderRadius: '10px',
                                                textAlign: 'center'
                                            }}>
                                                <div style={{ fontSize: '24px', fontWeight: '700', color: '#e74c3c' }}>
                                                    {saveResult.failedCount}
                                                </div>
                                                <div style={{ fontSize: '13px', color: 'var(--text-secondary, #666)' }}>
                                                    سجل فشل
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {saveResult.errors.length > 0 && (
                                        <div style={{
                                            maxHeight: '120px',
                                            overflow: 'auto',
                                            padding: '12px',
                                            background: 'rgba(231,76,60,0.05)',
                                            borderRadius: '8px',
                                            marginBottom: '16px',
                                            fontSize: '13px',
                                            textAlign: 'right'
                                        }}>
                                            {saveResult.errors.map((err, idx) => (
                                                <div key={idx} style={{ color: '#c0392b', marginBottom: '4px' }}>
                                                    ❌ {err}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleClose}
                                        style={{
                                            padding: '12px 32px',
                                            fontSize: '15px',
                                            fontWeight: '700',
                                            color: '#fff',
                                            background: 'linear-gradient(135deg, #2980b9, #3498db)',
                                            border: 'none',
                                            borderRadius: '10px',
                                            cursor: 'pointer',
                                            boxShadow: '0 4px 12px rgba(41,128,185,0.3)'
                                        }}
                                    >
                                        إغلاق
                                    </button>
                                </div>
                            )}

                            {/* Error State */}
                            {step === 'error' && validationResult && (
                                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>❌</div>
                                    <h3 style={{ margin: '0 0 16px', color: '#e74c3c' }}>
                                        خطأ في قراءة الملف
                                    </h3>
                                    <div style={{
                                        padding: '12px',
                                        background: 'rgba(231,76,60,0.05)',
                                        borderRadius: '8px',
                                        marginBottom: '20px',
                                        fontSize: '14px',
                                        color: '#c0392b'
                                    }}>
                                        {validationResult.errors.map((err, idx) => (
                                            <div key={idx}>{err}</div>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                        <button
                                            onClick={resetState}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '14px',
                                                color: '#fff',
                                                background: '#2980b9',
                                                border: 'none',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🔄 حاول مرة أخرى
                                        </button>
                                        <button
                                            onClick={handleClose}
                                            style={{
                                                padding: '10px 20px',
                                                fontSize: '14px',
                                                color: 'var(--text-secondary, #666)',
                                                background: 'var(--background-color, #f0f0f0)',
                                                border: '1px solid var(--border-color, #ddd)',
                                                borderRadius: '8px',
                                                cursor: 'pointer'
                                            }}
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
