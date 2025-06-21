// src/components/RegisterForm.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/firebase/config';
import { FirebaseError } from 'firebase/app';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { requestNotificationPermission } from '@/firebase/fcm';

export default function RegisterForm() {
    const [displayName, setDisplayName] = useState<string>('');
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        try {
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );
            const user = userCredential.user;

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                displayName: displayName,
                createdAt: new Date(),
            });
            const token = await requestNotificationPermission();
            if (token && user?.uid) {
                await updateDoc(doc(db, 'users', user.uid), {
                    fcmToken: token,
                });
            }
            router.push('/');
        } catch (err: unknown) {
            if (err instanceof FirebaseError) {
                setError(err.message);
            } else {
                setError('An unexpected error occurred, please try again');
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm p-8 space-y-6 bg-gray-800 rounded-lg shadow-md text-white">
            <h2 className="text-2xl font-bold text-center text-white">
                Create an Account
            </h2>
            <div>
                <label className="block text-sm font-medium text-gray-200">
                    Display Name
                </label>
                <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-200">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 bg-gray-700 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            {error && (
                <p className="text-sm text-center text-red-400">{error}</p>
            )}
            <button
                type="submit"
                className="w-full py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Register
            </button>
        </form>
    );
}
