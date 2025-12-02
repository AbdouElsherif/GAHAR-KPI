import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase-admin';
import { getDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export async function POST(request: NextRequest) {
    try {
        // Parse request body
        const { userId, newPassword = 'Gahar@123' } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'معرف المستخدم مطلوب' },
                { status: 400 }
            );
        }

        // Get Admin Auth instance safely
        let adminAuth;
        try {
            adminAuth = getAdminAuth();
        } catch (error: any) {
            console.error('Failed to get Admin Auth:', error);
            return NextResponse.json(
                { success: false, error: 'خطأ في إعدادات السيرفر: ' + error.message },
                { status: 500 }
            );
        }

        // Get user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
            return NextResponse.json(
                { success: false, error: 'المستخدم غير موجود' },
                { status: 404 }
            );
        }

        const userData = userDoc.data();
        const userEmail = userData.email;

        // Step 1: Try to get the user from Firebase Auth by email
        let firebaseAuthUser;
        try {
            firebaseAuthUser = await adminAuth.getUserByEmail(userEmail);
        } catch (error: any) {
            // User doesn't exist in Auth, that's okay
            console.log('User not found in Auth, will create new one');
        }

        // Step 2: If user exists in Auth, delete them
        if (firebaseAuthUser) {
            try {
                await adminAuth.deleteUser(firebaseAuthUser.uid);
                console.log(`Deleted user from Auth: ${firebaseAuthUser.uid}`);
            } catch (error: any) {
                console.error('Error deleting user from Auth:', error);
                return NextResponse.json(
                    { success: false, error: 'فشل في حذف المستخدم من Firebase Auth' },
                    { status: 500 }
                );
            }
        }

        // Step 3: Create new user in Firebase Auth with new password
        let newUser;
        try {
            newUser = await adminAuth.createUser({
                email: userEmail,
                password: newPassword,
                emailVerified: false,
            });
            console.log(`Created new user in Auth: ${newUser.uid}`);
        } catch (error: any) {
            console.error('Error creating user in Auth:', error);
            return NextResponse.json(
                { success: false, error: `فشل في إنشاء المستخدم: ${error.message}` },
                { status: 500 }
            );
        }

        // Step 4: Update Firestore with new UID (since it might have changed)
        try {
            // Delete old Firestore document if UID changed
            if (userId !== newUser.uid) {
                const { deleteDoc } = await import('firebase/firestore');
                await deleteDoc(doc(db, 'users', userId));
            }

            // Create/update Firestore document with new UID
            await setDoc(doc(db, 'users', newUser.uid), {
                username: userData.username,
                email: userData.email,
                role: userData.role,
                departmentId: userData.departmentId || null,
                departmentName: userData.departmentName || null,
            });

            console.log(`Updated Firestore document: ${newUser.uid}`);
        } catch (error: any) {
            console.error('Error updating Firestore:', error);
            // Try to clean up the Auth user if Firestore update fails
            await adminAuth.deleteUser(newUser.uid);
            return NextResponse.json(
                { success: false, error: 'فشل في تحديث قاعدة البيانات' },
                { status: 500 }
            );
        }

        // Success!
        return NextResponse.json({
            success: true,
            newPassword: newPassword,
            message: 'تم إعادة تعيين كلمة المرور بنجاح'
        });

    } catch (error: any) {
        console.error('Reset password API error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'حدث خطأ غير متوقع' },
            { status: 500 }
        );
    }
}
