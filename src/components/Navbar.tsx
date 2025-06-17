// src/app/components/Navbar.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/firebase/config';
import { useAuth } from '@/context/AuthContext';
import SearchBar from './SearchBar';

export default function Navbar() {
    const { user, loading } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            //logout successful -> redirect to login
            router.push('/login');
        } catch (error) {
            console.error('Error in logout :', error);
        }
    };

    return (
        <nav className="bg-gray-800 text-white p-4 shadow-md">
            <div className="container mx-auto">
                <div className="flex justify-between items-center mb-4">
                    <Link
                        href="/"
                        className="text-2xl font-bold hover:text-indigo-400">
                        CineShelf
                    </Link>

                    <div className="flex items-center space-x-4">
                        {loading ? (
                            <div className="h-8 w-24 bg-gray-700 rounded animate-pulse"></div>
                        ) : user ? (
                            // If user is logged in, show their email and a Logout button
                            <>
                                <span className="text-sm">
                                    Welcome, {user.displayName || user.email}
                                </span>
                                <button
                                    onClick={handleLogout}
                                    className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors">
                                    Logout
                                </button>
                            </>
                        ) : (
                            // If user is logged out, show Login and Register links
                            <>
                                <Link
                                    href="/login"
                                    className="px-4 py-2 hover:bg-gray-700 rounded-md">
                                    Login
                                </Link>
                                <Link
                                    href="/register"
                                    className="px-4 py-2 bg-indigo-600 rounded-md hover:bg-indigo-700">
                                    Register
                                </Link>
                            </>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-4">
                    <SearchBar />
                </div>

                {/* Navigation Links */}
                <div className="flex items-center space-x-6">
                    <Link
                        href="/"
                        className="px-3 py-2 hover:bg-gray-700 rounded-md transition-colors">
                        Home
                    </Link>
                    <Link
                        href="/discover"
                        className="px-3 py-2 hover:bg-gray-700 rounded-md transition-colors">
                        Discover
                    </Link>
                    {user && (
                        <Link
                            href="/my-lists"
                            className="px-3 py-2 hover:bg-gray-700 rounded-md transition-colors">
                            My Lists
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
