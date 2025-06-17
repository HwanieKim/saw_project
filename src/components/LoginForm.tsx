'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FirebaseError } from 'firebase/app';
import { auth } from '@/firebase/config';

export default function LoginForm() {
    const [email, setEmail] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/');
        } catch (err: unknown) {
            if (err instanceof FirebaseError) {
                console.log('Firebase Error', err.code, err.message);
                setError(err.message);
            } else {
                console.log('Unexpected Error', err);
                setError('An unexpected error occurred, please try again');
            }
        }
    };

    return (
        <form
            onSubmit={handleSubmit}
            className="w-full max-w-sm p-8 space-y-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold text-center text-gray-800">
                Login to CineShelf
            </h2>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 text-gray-800 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">
                    Password
                </label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 mt-1 text-gray-800 border rounded-md focus:outline-none focus:ring focus:ring-indigo-200"
                />
            </div>
            {error && (
                <p className="text-sm text-center text-red-500">{error}</p>
            )}
            <button
                type="submit"
                className="w-full py-2 font-semibold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Login
            </button>
        </form>
    );
}
