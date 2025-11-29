'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { changePassword, validatePassword } from '@/lib/auth';
import Image from 'next/image';
import Link from 'next/link';

export default function ChangePasswordPage() {
    const router = useRouter();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setLoading(true);

        if (newPassword !== confirmPassword) {
            setError('كلمة المرور الجديدة غير متطابقة');
            setLoading(false);
            return;
        }

        const validation = validatePassword(newPassword);
        if (!validation.isValid) {
            setError(validation.error || 'كلمة المرور غير صالحة');
            setLoading(false);
            return;
        }

        try {
            await changePassword(oldPassword, newPassword);
            setSuccess('تم تغيير كلمة المرور بنجاح');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setTimeout(() => {
                router.push('/');
            }, 2000);
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء تغيير كلمة المرور');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--primary-color), var(--secondary-color))'
        }}>
            <div className="card" style={{
                maxWidth: '450px',
                width: '100%',
                margin: '20px',
                padding: '40px'
            }}>
                <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                    <Image
                        src="/logo.png"
                        alt="GAHAR Logo"
                        width={100}
                        height={100}
                        style={{ margin: '0 auto 20px' }}
                    />
                    <h1 style={{ color: 'var(--secondary-color)', marginBottom: '10px', fontSize: '1.8rem' }}>
                        تغيير كلمة المرور
                    </h1>
                </div>

                {error && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        border: '1px solid #f5c6cb',
                        fontSize: '0.9rem'
                    }}>
                        {error}
                    </div>
                )}

                {success && (
                    <div style={{
                        padding: '12px',
                        backgroundColor: '#d4edda',
                        color: '#155724',
                        borderRadius: '6px',
                        marginBottom: '20px',
                        border: '1px solid #c3e6cb',
                        fontSize: '0.9rem'
                    }}>
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">كلمة المرور الحالية</label>
                        <input
                            type="password"
                            className="form-input"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            className="form-input"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">تأكيد كلمة المرور الجديدة</label>
                        <input
                            type="password"
                            className="form-input"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                        disabled={loading}
                    >
                        {loading ? 'جاري التغيير...' : 'تغيير كلمة المرور'}
                    </button>
                </form>

                <div style={{ marginTop: '20px', textAlign: 'center' }}>
                    <Link href="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>
                        العودة للصفحة الرئيسية
                    </Link>
                </div>
            </div>
        </div>
    );
}
