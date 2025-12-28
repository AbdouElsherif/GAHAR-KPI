'use client';

import { ReactNode } from 'react';

interface DashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
    title?: string;
}

export default function DashboardModal({ isOpen, onClose, children, title }: DashboardModalProps) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(5px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'var(--card-bg)',
                    borderRadius: '16px',
                    width: '95%',
                    maxWidth: '1400px',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    position: 'relative',
                    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header if title exists */}
                {title && (
                    <div style={{
                        padding: '20px 30px',
                        borderBottom: '1px solid #eee',
                        paddingLeft: '60px', // Space for close button (assuming LTR for position, but RTL for text)
                        textAlign: 'right'
                    }}>
                        <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>{title}</h2>
                    </div>
                )}

                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        left: '15px', // Moved to left to match Arabic standard (close on left)
                        background: 'none',
                        border: 'none',
                        fontSize: '28px',
                        cursor: 'pointer',
                        color: 'var(--text-color)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                        zIndex: 10,
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.1)'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    title="إغلاق"
                >
                    ×
                </button>

                {/* Content */}
                <div style={{ padding: '30px' }}>
                    {children}
                </div>
            </div>
        </div>
    );
}
