import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue  } from 'framer-motion';
import { Home, MoveLeft, Terminal } from 'lucide-react';
import { Button } from "@/components/ui/button"; // shadcn component
import { Badge } from "@/components/ui/badge";   // shadcn component

const NotFound: React.FC = () => {
    const navigate = useNavigate();
    const containerRef = useRef<HTMLDivElement>(null);

    // Mouse position for the "Gravity" effect
    const mouseX = useMotionValue(0);
    const mouseY = useMotionValue(0);

    const handleMouseMove = (e: React.MouseEvent) => {
        const { left, top } = containerRef.current!.getBoundingClientRect();
        mouseX.set(e.clientX - left);
        mouseY.set(e.clientY - top);
    };

    return (
        <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden cursor-default selection:bg-cyan-500/30"
        >
            {/* --- Interactive Background Orbs --- */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(17,24,39,1)_0%,rgba(2,6,23,1)_100%)]" />

                {/* Mouse-following Glow */}
                <motion.div
                    className="absolute w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px]"
                    style={{ x: mouseX, y: mouseY, translateX: '-50%', translateY: '-50%' }}
                />

                {/* Static grid overlay */}
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
            </div>

            {/* --- Main Interactive Card --- */}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full max-w-xl group"
            >
                {/* Decorative Borders & Glows */}
                <div className="absolute -inset-1 bg-linear-to-r from-cyan-500/20 to-purple-500/20 rounded-[2.5rem] blur-2xl group-hover:opacity-100 opacity-50 transition duration-1000" />

                <div className="relative bg-slate-900/80 backdrop-blur-3xl border border-slate-800 rounded-[2rem] p-8 md:p-12 overflow-hidden">

                    {/* The "Scanline" Animation Effect */}
                    <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <motion.div
                            animate={{ translateY: ['-100%', '100%'] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                            className="w-full h-20 bg-linear-to-b from-transparent via-cyan-500/5 to-transparent"
                        />
                    </div>

                    <div className="flex flex-col items-center text-center">
                        <motion.div
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 6, repeat: Infinity }}
                        >
                            <Badge variant="outline" className="mb-6 px-8 py-2 border-cyan-500/30 bg-cyan-500/10 text-cyan-400 font-mono tracking-widest uppercase">
                                <Terminal className="w-3 h-3 mr-2" />
                                System Error: 404
                            </Badge>
                        </motion.div>

                        <h1 className="text-6xl md:text-8xl font-black text-white mb-6 tracking-tighter italic">
                            LOST <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">IN SPACE</span>
                        </h1>

                        <p className="text-slate-400 text-lg mb-10 max-w-sm leading-relaxed">
                            The coordinates you entered don't match any known sectors. You may have drifted into a black hole.
                        </p>

                        {/* --- shadcn Interactive Buttons --- */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">

                            {/* Primary Button: Home */}
                            <Button
                                size="lg"
                                className="cursor-pointer h-14 px-8 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(8,145,178,0.3)]"
                                onClick={() => navigate('/')}
                            >
                                <Home className="w-5 h-5 mr-2" />
                                Initiate Return
                            </Button>

                            {/* Secondary Button: Back */}
                            <Button
                                variant="outline"
                                size="lg"
                                className="cursor-pointer h-14 px-8 rounded-xl border-slate-700 hover:bg-slate-800 text-slate-300 hover:text-white transition-all hover:scale-105 active:scale-95"
                                onClick={() => navigate(-1)}
                            >
                                <MoveLeft className="w-5 h-5 mr-2" />
                                Previous Sector
                            </Button>
                        </div>
                    </div>

                    {/* Bottom Status Bar */}
                    <div className="mt-12 pt-8 border-t border-slate-800/50 flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-widest">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            Connection Stable
                        </div>
                        <div>Sector: 0x404_VOID</div>
                    </div>
                </div>
            </motion.div>

            {/* Random Floating Particles */}
            <FloatingParticles />
        </div>
    );
};

// Helper component for extra interactivity
const FloatingParticles = () => (
    <div className="absolute inset-0 pointer-events-none">
        {[...Array(15)].map((_, i) => (
            <motion.div
                key={i}
                className="absolute w-1 h-1 bg-slate-500 rounded-full"
                initial={{
                    x: Math.random() * 100 + "%",
                    y: Math.random() * 100 + "%",
                    opacity: Math.random()
                }}
                animate={{
                    y: [null, Math.random() * -100 + "px"],
                    opacity: [0, 0.5, 0]
                }}
                transition={{
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    ease: "linear"
                }}
            />
        ))}
    </div>
);

export default NotFound;
