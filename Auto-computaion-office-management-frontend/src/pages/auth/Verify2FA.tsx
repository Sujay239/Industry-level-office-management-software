
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OtpInput } from '@/components/ui/otp-input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { useNotification } from '@/components/NotificationProvider';

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

const Verify2FA: React.FC = () => {
    const [otp, setOtp] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { showSuccess, showError } = useNotification();

    // Check for token presence - Removed to prevent infinite loop as token is HttpOnly
    // and not passed in state. The backend validates the session cookie instead.

    const handleVerify = async () => {
        if (otp.length !== 6) {
            showError("Please enter a valid 6-digit code.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/authorized-2fa`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code: otp }),
            });

            const data = await response.json();

            if (response.status === 401 || response.status === 403) {
                showError("Session expired. Please login again.");
                navigate('/login', { replace: true });
                return;
            }

            if (!response.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            // Mark session as verified
            sessionStorage.setItem('is2FAVerified', 'true');
            showSuccess("2FA Verified Successfully");

            // Check if there is a pending redirect
            const from = location.state?.from?.pathname;
            if (from) {
                navigate(from, { replace: true });
                return;
            }

            // Fallback: Fetch user info to determine role-based dashboard
            try {
                const meRes = await fetch(`${API_BASE_URL}/auth/me`, { credentials: 'include' });
                if (meRes.ok) {
                    const meData = await meRes.json();
                    const role = meData.user?.role;
                    if (role === 'super_admin') {
                        navigate('/super-admin', { replace: true });
                        return;
                    }
                }
            } catch (err) {
                console.error("Failed to fetch user role for redirect", err);
            }

            // Default to admin dashboard if all else fails
            navigate('/admin', { replace: true });

        } catch (error: any) {
            console.error(error);
            showError(error.message || "Failed to verify 2FA code");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
            <Card className="w-full max-w-md border-slate-200 dark:border-slate-800 shadow-xl">
                <CardHeader className="text-center">
                    <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mx-auto flex items-center justify-center mb-4">
                        <ShieldCheck className="w-8 h-8" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white">Two-Factor Authentication</CardTitle>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Enter the 6-digit code to access your admin dashboard.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex justify-center">
                        <OtpInput
                            value={otp}
                            onChange={setOtp}
                            length={6}
                            onComplete={() => { }} // Optional: Can auto-trigger verify here if desired
                            className="bg-transparent"
                        />
                    </div>

                    <Button
                        onClick={handleVerify}
                        disabled={isLoading || otp.length !== 6}
                        className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 h-11 text-base font-medium cursor-pointer"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Verify Identity"
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
};

export default Verify2FA;
