'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { login, initializeUsers } from '@/lib/auth';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Ensure default users exist
        initializeUsers();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const user = await login(email, password);

            if (user) {
                if (user.role === 'super_admin') {
                    router.push('/admin');
                } else {
                    router.push('/');
                }
            } else {
                setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
            }
        } catch (err: any) {
            setError(err.message || 'حدث خطأ أثناء تسجيل الدخول');
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
                        تسجيل الدخول
                    </h1>
                    <p style={{ color: '#666', fontSize: '0.95rem' }}>
                        بوابة مؤشرات الأداء - GAHAR
                    </p>
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

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">البريد الإلكتروني</label>
                        <input
                            type="email"
                            className="form-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoFocus
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">كلمة المرور</label>
                        <input
                            type="password"
                            className="form-input"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
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
                        {loading ? 'جاري تسجيل الدخول...' : 'دخول'}
                    </button>
                </form>

                <div style={{
                    marginTop: '30px',
                    padding: '15px',
                    backgroundColor: 'var(--background-color)',
                    borderRadius: '6px',
                    fontSize: '0.85rem'
                }}>
                    <p style={{ fontWeight: 'bold', marginBottom: '8px', color: 'var(--secondary-color)' }}>
                        حسابات تجريبية:
                    </p>
                    <p style={{ margin: '4px 0' }}>• المدير العام: admin@gahar.gov.eg / admin123</p>
                    <p style={{ margin: '4px 0', fontSize: '0.75rem', color: '#888' }}>
                        (سيتم إنشاء هذا الحساب تلقائياً عند أول تشغيل)
                    </p>
                </div>
            </div>
        </div>
    );
}
