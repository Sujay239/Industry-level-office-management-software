import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, Lock, Fingerprint } from 'lucide-react';
import { motion } from 'framer-motion';

const Unauthorized: React.FC = () => {
    const navigate = useNavigate();

    // Background Pattern Component for cleaner code
    const BackgroundGrid = () => (
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
                style={{
                    backgroundImage: `linear-gradient(#94a3b8 1px, transparent 1px), linear-gradient(90deg, #94a3b8 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Gradient Overlay to fade grid at edges */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-50 via-transparent to-slate-50/80 dark:from-slate-950 dark:via-transparent dark:to-slate-950/80" />

            {/* Floating Orbs */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.5, 0.3],
                    rotate: [0, 45, 0]
                }}
                transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-0 left-1/4 w-96 h-96 bg-red-500/20 rounded-full blur-[128px]"
            />
            <motion.div
                animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.2, 0.4, 0.2],
                    x: [0, 50, 0]
                }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-[128px]"
            />
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative font-sans selection:bg-red-500/30">
            <BackgroundGrid />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Main Card */}
                <div className="relative overflow-hidden bg-white/70 dark:bg-slate-900/60 backdrop-blur-2xl rounded-3xl border border-white/50 dark:border-slate-700/50 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 p-10">

                    {/* Top Decorative Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

                    <div className="flex flex-col items-center text-center">

                        {/* Icon Wrapper with Glow Effect */}
                        <div className="relative mb-8 group">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                className="absolute inset-0 rounded-full border border-dashed border-red-200 dark:border-red-900/50 w-24 h-24 -m-2"
                            />
                            <div className="relative w-20 h-20 bg-gradient-to-tr from-red-100 to-red-50 dark:from-red-950/50 dark:to-red-900/20 rounded-2xl flex items-center justify-center border border-white/50 dark:border-red-900/50 shadow-inner">
                                <ShieldAlert className="w-10 h-10 text-red-500 dark:text-red-400 drop-shadow-sm" />

                                {/* Floating Lock Badge */}
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ delay: 0.4, type: "spring" }}
                                    className="absolute -bottom-2 -right-2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg border border-slate-100 dark:border-slate-700"
                                >
                                    <Lock className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                                </motion.div>
                            </div>
                        </div>

                        {/* Text Content */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                                Access Restricted
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 leading-relaxed max-w-sm mx-auto">
                                The page you are trying to access requires higher privileges. Please contact your administrator.
                            </p>

                            {/* Error Code Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-mono mb-8">
                                <Fingerprint className="w-3 h-3" />
                                <span>ERROR_403_FORBIDDEN</span>
                            </div>
                        </motion.div>

                        {/* Action Buttons */}
                        <div className="w-full space-y-3">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate(-1)}
                                className="w-full relative group overflow-hidden bg-slate-900 dark:bg-white text-white dark:text-slate-900 py-3.5 rounded-xl font-semibold shadow-lg shadow-slate-900/20 dark:shadow-white/10 transition-all cursor-pointer"
                            >
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                <span className="flex items-center justify-center gap-2 relative z-10">
                                    <ArrowLeft className="w-4 h-4" />
                                    Go Back Immediately
                                </span>
                            </motion.button>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => navigate('/login')}
                                className="w-full py-3.5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800/50 rounded-xl transition-all border border-transparent hover:border-slate-200 dark:hover:border-slate-700 cursor-pointer"
                            >
                                Switch Account
                            </motion.button>
                        </div>
                    </div>
                </div>

                {/* Footer Help Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-xs text-slate-400 dark:text-slate-600 mt-8"
                >
                    Session ID: <span className="font-mono">8f92-j9a0-s8h1</span>
                </motion.p>
            </motion.div>

            {/* CSS Animation for Shimmer Effect */}
            <style>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    );
};

export default Unauthorized;
