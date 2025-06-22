'use client';

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { requestNotificationPermission } from '@/firebase/fcm';

// React context for managing user authentication state

interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    photoURL?: string;
    bio?: string;
    followers: string[];
    following: string[];
    createdAt: Date;
    fcmToken: string;
}

interface AuthContextType {
    user: User | null;
    userProfile: UserProfile | null;
    loading: boolean;
    idToken: string | null;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    idToken: null,
});

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [idToken, setIdToken] = useState<string | null>(null);

    useEffect(() => {
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            setLoading(false);
        }, 5000); // 5 second timeout

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);

            if (user) {
                const token = await user.getIdToken();
                setIdToken(token);

                // Fetch user profile from Firestore
                try {
                    const userDocRef = doc(db, 'users', user.uid);
                    const userDoc = await getDoc(userDocRef);
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setUserProfile({
                            uid: user.uid,
                            email: data.email,
                            displayName: data.displayName,
                            photoURL: data.photoURL || undefined,
                            bio: data.bio || '',
                            followers: data.followers || [],
                            following: data.following || [],
                            createdAt: data.createdAt?.toDate() || new Date(),
                            fcmToken: data.fcmToken || '',
                        });

                        try {
                            const currentToken =
                                await requestNotificationPermission();
                            if (
                                currentToken &&
                                data.fcmToken !== currentToken
                            ) {
                                await updateDoc(userDocRef, {
                                    fcmToken: currentToken,
                                });
                            } else if (currentToken && !data.fcmToken) {
                                await updateDoc(userDocRef, {
                                    fcmToken: currentToken,
                                });
                            }
                        } catch (fcmerror) {
                            console.error(
                                'Error updating FCM token:',
                                fcmerror
                            );
                        }
                    }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            } else {
                setUserProfile(null);
                setIdToken(null);
            }

            clearTimeout(timeoutId);
            setLoading(false);
        });

        //clean up
        return () => {
            clearTimeout(timeoutId);
            unsubscribe();
        };
    }, []);

    const value = { user, userProfile, loading, idToken };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
}

//custom hook for access to context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used with an AuthProvider');
    }
    return context;
};
