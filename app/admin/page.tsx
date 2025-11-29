'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, logout, getUsers, addUser, updateUser, deleteUser, User, onAuthChange, validatePassword } from '@/lib/auth';
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

    const [formData, setFormData] = useState<FormData>({
        username: '',
        email: '',
        password: '',
        role: 'dept_viewer',
        departmentId: '',
        departmentName: ''
    });

    useEffect(() => {
        const unsubscribe = onAuthChange(async (user) => {
            if (!user || user.role !== 'super_admin') {
                router.push('/login');
                return;
            }
            setCurrentUser(user);
            await loadUsers();
        });

        return () => unsubscribe();
    }, [router]);

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

        if (formData.password) {
            const validation = validatePassword(formData.password);
            if (!validation.isValid) {
                alert(validation.error);
                return;
            }
        }

        if (editingUser) {
            await updateUser(editingUser.id, formData);
        } else {
            await addUser(formData);
        }

        await loadUsers();
        resetForm();
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

                            <div className="form-group">
                                <label className="form-label">كلمة المرور {editingUser && '(اتركها فارغة إذا لم ترد التغيير)'}</label>
                                <input
                                    type="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                />
                            </div>

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
                                        <button
                                            onClick={() => handleEdit(user)}
                                            style={{
                                                padding: '6px 12px',
                                                backgroundColor: 'var(--primary-color)',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '4px',
                                                cursor: 'pointer',
                                                marginLeft: '5px',
                                                fontSize: '0.85rem'
                                            }}
                                        >
                                            تعديل
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
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
