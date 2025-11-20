'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { IUser } from '@/models/User';

interface AuthContextType {
    user: FirebaseUser | null;
    profile: IUser | null;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    refreshProfile: async () => { },
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<FirebaseUser | null>(null);
    const [profile, setProfile] = useState<IUser | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async (uid: string) => {
        try {
            const res = await fetch(`/api/users/${uid}`);
            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
            } else {
                // If 404 or other error, set profile to null but don't log error for 404 if API returns 200 with null
                // The API now returns 200 with { user: null } for not found, so res.ok covers it.
                // If it actually returns 404 (e.g. network issue or old API), handle it:
                if (res.status === 404) {
                    setProfile(null);
                } else {
                    console.error('Failed to fetch user profile', res.statusText);
                    setProfile(null);
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            setProfile(null);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                await fetchProfile(firebaseUser.uid);
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.uid);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}
