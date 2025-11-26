'use client';

import { ReactNode } from 'react';

interface DashboardModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

export default function DashboardModal({ isOpen, onClose, children }: DashboardModalProps) {
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
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
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
