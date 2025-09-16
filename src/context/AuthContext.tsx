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
import { doc, getDoc, /*updateDoc */} from 'firebase/firestore';
//import { requestNotificationPermission } from '@/firebase/fcm';

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
    authLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userProfile: null,
    loading: true,
    idToken: null,
    authLoading: true,
});

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [idToken, setIdToken] = useState<string | null>(null);
    const [authLoading, setAuthLoading] = useState<boolean>(true);

    useEffect(() => {
        // Add a timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            if(loading || authLoading){
                setLoading(false);
                setAuthLoading(false);
            }
        }, 5000); // 5 second timeout
        
        // Listen for auth state changes
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
                    }
                    //     try {
                    //         // Request notification permission and get FCM token
                    //         const currentToken =
                    //             await requestNotificationPermission();
                            
                    //             // If we have a new token, update Firestore
                    //             if (currentToken && data.fcmToken !== currentToken) {
                    //             // Update Firestore with the new token
                                
                    //             await updateDoc(userDocRef, {
                    //                 fcmToken: currentToken,
                    //             });
                                
                    //             // Also update local state
                    //             setUserProfile(prev => prev ? {
                    //                 ...prev,
                    //                 fcmToken: currentToken
                    //             } : prev);

                    //         } 
                    //         // If no token in Firestore, but we have one now, save it
                    //         else if (currentToken && !data.fcmToken) {
                    //             await updateDoc(userDocRef, {
                    //                 fcmToken: currentToken,
                    //             });

                    //             setUserProfile(prev => prev ? {
                    //                 ...prev,
                    //                 fcmToken: currentToken
                    //             } : prev);
                    //         }
                    //     } catch (fcmerror) {
                    //         console.error(
                    //             'Error updating FCM token:',
                    //             fcmerror
                    //         );
                    //     }
                    // }
                } catch (error) {
                    console.error('Error fetching user profile:', error);
                }
            } else {
                setUser(null);
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

    const value = { user, userProfile, loading, idToken, authLoading };

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
