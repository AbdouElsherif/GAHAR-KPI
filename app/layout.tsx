import './globals.css';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';

export const metadata: Metadata = {
    title: 'GAHAR KPI Dashboard',
    description: 'General Authority for Healthcare Accreditation and Regulation KPI System',
    icons: {
        icon: '/logo.png',
        shortcut: '/logo.png',
        apple: '/logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="ar" dir="rtl">
            <body>
                <header className="header">
                    <div className="container header-content">
                        <Link href="/" className="logo-container">
                            <Image
                                src="/logo.png"
                                alt="شعار الهيئة العامة للاعتماد والرقابة الصحية"
                                width={80}
                                height={80}
                                className="logo-img"
                                priority
                            />
                            <div className="brand-name">بوابة مؤشرات الأداء - الهيئة العامة للاعتماد والرقابة الصحية</div>
                        </Link>
                    </div>
                </header>
                <main className="container">
                    {children}
                </main>
                <footer style={{ textAlign: 'center', padding: '20px', color: '#666', fontSize: '0.9rem' }}>
                    &copy; {new Date().getFullYear()} الهيئة العامة للاعتماد والرقابة الصحية
                </footer>
            </body>
        </html>
    );
}
