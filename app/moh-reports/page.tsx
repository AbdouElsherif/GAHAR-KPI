'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser, User, onAuthChange } from '@/lib/auth';

export default function MOHReportsPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange((user: User | null) => {
            if (!user) {
                router.push('/login');
            } else {
                setCurrentUser(user);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, [router]);

    if (loading || !currentUser) return null;

    return (
        <div className="container" style={{ padding: '40px 0' }}>
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                    <h1 className="page-title" style={{ fontSize: '1.8rem', margin: 0 }}>
                        تقارير وزارة الصحة
                    </h1>
                    <Link href="/" className="btn btn-secondary">
                        العودة للرئيسية
                    </Link>
                </div>

                <div style={{
                    padding: '60px 20px',
                    textAlign: 'center',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '2px dashed #dee2e6'
                }}>
                    <h2 style={{ color: '#6c757d', marginBottom: '15px' }}>قريباً</h2>
                    <p style={{ color: '#6c757d', fontSize: '1.1rem' }}>
                        هذا القسم قيد التطوير حالياً. سيتم إضافة التقارير هنا قريباً.
                    </p>
                </div>
            </div>
        </div>
    );
}
