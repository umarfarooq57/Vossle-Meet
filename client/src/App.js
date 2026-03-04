/**
 * Vossle — App Root
 * Routing and layout configuration.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Room from './pages/Room';

/**
 * Protected route — redirects to login if not authenticated
 */
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * Guest route — redirects to dashboard if already authenticated
 */
const GuestRoute = ({ children }) => {
    const { isAuthenticated, loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            }}>
                <div className="spinner" style={{ width: '40px', height: '40px', borderWidth: '3px' }} />
            </div>
        );
    }

    return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

/**
 * Layout with navbar (for non-room pages)
 */
const MainLayout = ({ children }) => (
    <>
        <Navbar />
        {children}
    </>
);

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    {/* Public routes with navbar */}
                    <Route path="/" element={<MainLayout><Landing /></MainLayout>} />

                    <Route path="/login" element={
                        <GuestRoute>
                            <MainLayout><Login /></MainLayout>
                        </GuestRoute>
                    } />

                    <Route path="/register" element={
                        <GuestRoute>
                            <MainLayout><Register /></MainLayout>
                        </GuestRoute>
                    } />

                    {/* Protected routes with navbar */}
                    <Route path="/dashboard" element={
                        <ProtectedRoute>
                            <MainLayout><Dashboard /></MainLayout>
                        </ProtectedRoute>
                    } />

                    {/* Video room — full screen, no navbar */}
                    <Route path="/room/:id" element={
                        <ProtectedRoute>
                            <Room />
                        </ProtectedRoute>
                    } />

                    {/* 404 fallback */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
