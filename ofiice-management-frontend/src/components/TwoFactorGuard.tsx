
import React, { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const TwoFactorGuard: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const location = useLocation();

    useEffect(() => {
        const check2FAStatus = async () => {
            // 1. Check if we already verified in this session
            const sessionVerified = sessionStorage.getItem('is2FAVerified');
            if (sessionVerified === 'true') {
                setIsVerified(true);
                return;
            }

            try {
                // 2. Check backend if 2FA is actually enabled for this user
                const response = await fetch(`${API_BASE_URL}/auth/2fa`, {
                    credentials: 'include'
                });

                if (!response.ok) {
                    // If auth fails here, ProtectedRoute will likely handle it or we redirect to login
                    // But for this guard, if we cant check 2fa status, assume false or error
                    setIsVerified(false);
                    return;
                }

                const data = await response.json();

                if (data.twoFactorEnabled) {
                    // 2FA is enabled but we checked session above and it wasn't verified
                    // So we must require verification
                    setIsVerified(false);
                } else {
                    // 2FA not enabled, proceed
                    setIsVerified(true);
                }
            } catch (error) {
                console.error("2FA Check Error", error);
                setIsVerified(false);
            }
        };

        check2FAStatus();
    }, []);

    if (isVerified === null) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
        );
    }

    if (!isVerified) {
        // Redirect to 2FA verification page, preserving intent
        return <Navigate to="/verify-2fa" state={{ from: location }} replace />;
    }

    return children ? <>{children}</> : <Outlet />;
};

export default TwoFactorGuard;
