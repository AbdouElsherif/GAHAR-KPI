'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, getUsers, addUser, updateUser, deleteUser, User, onAuthChange, validatePassword, resetUserPassword } from '@/lib/auth';
import Link from 'next/link';

const departments = [
    { id: 'dept1', name: 'الإدارة العامة للتدريب للغير' },
    { id: 'dept2', name: 'الإدارة العامة للدعم الفني' },
    { id: 'dept3', name: 'الإدارة العامة لرضاء المتعاملين' },
    { id: 'dept4', name: 'الإدارة العامة للرقابة الفنية والإكلينيكية' },
    { id: 'dept5', name: 'الإدارة العامة للرقابة الإدارية على المنشآت الصحية' },
    { id: 'dept6', name: 'الإدارة العامة للاعتماد والتسجيل' },
    { id: 'dept7', name: 'الإدارة العامة لتسجيل أعضاء المهن الطبية' },
    { id: 'dept8', name: 'الإدارة العامة لأبحاث وتطوير المعايير' },
    { id: 'dept9', name: 'الإدارة العامة لشئون المراجعين' },
];

interface FormData {
    username: string;
    email: string;
    password: string;
    role: 'super_admin' | 'dept_admin' | 'dept_viewer' | 'general_viewer';
    departmentId: string;
    departmentName: string;
}

export default function AdminPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

    // Modal state
    const [resetConfirmation, setResetConfirmation] = useState<{ show: boolean, user: User | null }>({ show: false, user: null });

    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        role: 'dept_viewer',
        departmentId: '',
        departmentName: ''
    });

    const [isFirstLoad, setIsFirstLoad] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (!user || user.role !== 'super_admin') {
                if (!user && isFirstLoad) {
                    // Firebase might still be restoring the session
                    return;
                }
                router.push('/login');
                return;
            }
            setCurrentUser(user);
            await loadUsers();
            setIsFirstLoad(false);
        });

        return () => unsubscribe();
    }, [router, isFirstLoad]);

    const loadUsers = async () => {
        const usersList = await getUsers();
        setUsers(usersList);
    };

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingUser) {
                // When editing, we don't change the password
                const { password, ...updateData } = formData;
                await updateUser(editingUser.id, updateData);
                setMessage({ type: 'success', text: 'تم تحديث بيانات المستخدم بنجاح' });
            } else {
                // When adding new user, validate password
                if (formData.password) {
                    const validation = validatePassword(formData.password);
                    if (!validation.isValid) {
                        setMessage({ type: 'error', text: validation.error || 'كلمة المرور غير صالحة' });
                        return;
                    }
                }
                await addUser(formData);
                setMessage({ type: 'success', text: 'تم إضافة المستخدم بنجاح' });
            }

            await loadUsers();
            resetForm();
            setTimeout(() => setMessage(null), 3000);
        } catch (error) {
            setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ البيانات' });
        }
    };

    const handleEdit = (user: User) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            password: '',
            role: user.role,
            departmentId: user.departmentId || '',
            departmentName: user.departmentName || ''
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
            await deleteUser(id);
            await loadUsers();
        }
    };

    // Trigger the modal instead of window.confirm
    const handleResetPassword = (user: User) => {
        setResetConfirmation({ show: true, user });
    };

    // Execute the actual reset when confirmed in modal
    const executeResetPassword = async () => {
        if (!resetConfirmation.user) return;

        const user = resetConfirmation.user;
        setResetConfirmation({ show: false, user: null }); // Close modal

        setMessage({ type: 'info', text: 'جاري إعادة تعيين كلمة المرور...' });

        const result = await resetUserPassword(user.id);

        if (result.success) {
            setMessage({
                type: 'success',
                text: `تم إعادة تعيين كلمة المرور بنجاح\nكلمة المرور الجديدة: ${result.newPassword}`
            });
            await loadUsers();
            setTimeout(() => setMessage(null), 10000); // Increased time to read password
        } else {
            setMessage({ type: 'error', text: result.error || 'فشل في إعادة تعيين كلمة المرور' });
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            password: '',
            role: 'dept_viewer',
            departmentId: '',
            departmentName: ''
        });
        setEditingUser(null);
        setShowForm(false);
    };

    const handleDepartmentChange = (deptId: string) => {
        const dept = departments.find(d => d.id === deptId);
        setFormData({
            ...formData,
            departmentId: deptId,
            departmentName: dept?.name || ''
        });
    };

    if (!currentUser) return null;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h1 className="page-title" style={{ margin: 0 }}>لوحة التحكم - إدارة المستخدمين</h1>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <Link href="/" className="btn btn-secondary">الصفحة الرئيسية</Link>
                    <button onClick={handleLogout} className="btn" style={{ backgroundColor: '#dc3545', color: 'white' }}>
                        تسجيل الخروج
                    </button>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                {message && (
                    <div style={{
                        padding: '15px',
                        marginBottom: '20px',
                        borderRadius: '8px',
                        backgroundColor: message.type === 'success' ? '#d4edda' : message.type === 'info' ? '#cce5ff' : '#f8d7da',
                        color: message.type === 'success' ? '#155724' : message.type === 'info' ? '#004085' : '#721c24',
                        border: `1px solid ${message.type === 'success' ? '#c3e6cb' : message.type === 'info' ? '#b8daff' : '#f5c6cb'}`,
                        whiteSpace: 'pre-line'
                    }}>
                        <strong>{message.type === 'success' ? '✓ نجح!' : message.type === 'info' ? 'ℹ️ تنبيه:' : '✗ خطأ!'}</strong> {message.text}
                    </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2 style={{ margin: 0, color: 'var(--primary-color)' }}>المستخدمون ({users.length})</h2>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="btn btn-primary"
                    >
                        {showForm ? 'إلغاء' : '+ إضافة مستخدم جديد'}
                    </button>
                </div>

                {showForm && (
                    <form onSubmit={handleSubmit} style={{ padding: '20px', backgroundColor: 'var(--background-color)', borderRadius: '8px', marginBottom: '20px' }}>
                        <h3 style={{ marginBottom: '15px', color: 'var(--secondary-color)' }}>
                            {editingUser ? 'تعديل مستخدم' : 'مستخدم جديد'}
                        </h3>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label className="form-label">اسم المستخدم</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">البريد الإلكتروني</label>
                                <input
                                    type="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />
                            </div>

                            {!editingUser && (
                                <div className="form-group">
                                    <label className="form-label">كلمة المرور</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>
                            )}

                            <div className="form-group">
                                <label className="form-label">الصلاحية</label>
                                <select
                                    className="form-input"
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                                    required
                                >
                                    <option value="super_admin">مدير عام</option>
                                    <option value="dept_admin">مدير إدارة</option>
                                    <option value="dept_viewer">مستخدم عرض</option>
                                    <option value="general_viewer">مراقب عام</option>
                                </select>
                            </div>

                            {formData.role !== 'super_admin' && formData.role !== 'general_viewer' && (
                                <div className="form-group">
                                    <label className="form-label">الإدارة</label>
                                    <select
                                        className="form-input"
                                        value={formData.departmentId}
                                        onChange={(e) => handleDepartmentChange(e.target.value)}
                                        required
                                    >
                                        <option value="">اختر الإدارة</option>
                                        {departments.map(dept => (
                                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>

                        <div style={{ marginTop: '15px', display: 'flex', gap: '10px' }}>
                            <button type="submit" className="btn btn-primary">
                                {editingUser ? 'حفظ التعديلات' : 'إضافة'}
                            </button>
                            <button type="button" onClick={resetForm} className="btn btn-secondary">
                                إلغاء
                            </button>
                        </div>
                    </form>
                )}

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: 'var(--background-color)', borderBottom: '2px solid var(--primary-color)' }}>
                                <th style={{ padding: '12px', textAlign: 'right' }}>اسم المستخدم</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>الصلاحية</th>
                                <th style={{ padding: '12px', textAlign: 'right' }}>الإدارة</th>
                                <th style={{ padding: '12px', textAlign: 'center' }}>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(user => (
                                <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{user.username}</td>
                                    <td style={{ padding: '12px' }}>
                                        {user.role === 'super_admin' ? 'مدير عام' :
                                            user.role === 'dept_admin' ? 'مدير إدارة' :
                                                user.role === 'general_viewer' ? 'مراقب عام' : 'مستخدم عرض'}
                                    </td>
                                    <td style={{ padding: '12px' }}>{user.departmentName || '-'}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => handleEdit(user)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: 'var(--primary-color)',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                تعديل
                                            </button>
                                            <button
                                                onClick={() => handleResetPassword(user)}
                                                style={{
                                                    padding: '6px 12px',
                                                    backgroundColor: '#ff9800',
                                                    color: 'white',
                                                    border: 'none',
                                                    borderRadius: '4px',
                                                    cursor: 'pointer',
                                                    fontSize: '0.85rem'
                                                }}
                                            >
                                                إعادة تعيين كلمة المرور
                                            </button>
                                            {user.role !== 'super_admin' && (
                                                <button
                                                    onClick={() => handleDelete(user.id)}
                                                    style={{
                                                        padding: '6px 12px',
                                                        backgroundColor: '#dc3545',
                                                        color: 'white',
                                                        border: 'none',
                                                        borderRadius: '4px',
                                                        cursor: 'pointer',
                                                        fontSize: '0.85rem'
                                                    }}
                                                >
                                                    حذف
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Custom Confirmation Modal */}
            {resetConfirmation.show && resetConfirmation.user && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    zIndex: 1000
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        padding: '25px',
                        borderRadius: '8px',
                        maxWidth: '400px',
                        width: '90%',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        textAlign: 'center'
                    }}>
                        <h3 style={{ marginTop: 0, color: '#d9534f' }}>تأكيد إعادة تعيين كلمة المرور</h3>
                        <p style={{ fontSize: '1.1rem', margin: '20px 0' }}>
                            هل أنت متأكد من إعادة تعيين كلمة المرور للمستخدم <strong>{resetConfirmation.user.username}</strong>؟
                        </p>
                        <div style={{ backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
                            سيتم تعيين كلمة المرور إلى:<br />
                            <strong style={{ fontSize: '1.2rem', color: '#0056b3' }}>Gahar@123</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '15px' }}>
                            <button
                                onClick={executeResetPassword}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#d9534f',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                نعم، قم بالتغيير
                            </button>
                            <button
                                onClick={() => setResetConfirmation({ show: false, user: null })}
                                style={{
                                    padding: '8px 20px',
                                    backgroundColor: '#6c757d',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '1rem'
                                }}
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
