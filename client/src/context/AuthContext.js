/**
 * Vossle — Auth Context
 * Global authentication state management.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api.service';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within AuthProvider');
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Check for existing session on mount
    useEffect(() => {
        const initAuth = async () => {
            const token = api.getToken();
            if (token) {
                try {
                    const data = await api.getProfile();
                    setUser(data.user);
                } catch {
                    api.setToken(null);
                }
            }
            setLoading(false);
        };
        initAuth();
    }, []);

    const register = useCallback(async (name, email, password) => {
        const data = await api.register(name, email, password);
        setUser(data.user);
        return data;
    }, []);

    const login = useCallback(async (email, password) => {
        const data = await api.login(email, password);
        setUser(data.user);
        return data;
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.logout();
        } catch {
            // Ignore logout errors
        }
        setUser(null);
        api.setToken(null);
    }, []);

    const value = {
        user,
        loading,
        isAuthenticated: !!user,
        register,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
