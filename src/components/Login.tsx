/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { Shield, Lock, Globe, Zap, ChevronRight } from 'lucide-react';

const ParticleBackground = () => {
  const particles = useMemo(() => Array.from({ length: 40 }), []);
  
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-cyan-500/20 rounded-full"
          initial={{ 
            x: Math.random() * 100 + '%', 
            y: Math.random() * 100 + '%',
            opacity: Math.random() * 0.5
          }}
          animate={{ 
            y: [null, '-100%'],
            opacity: [0, 0.5, 0]
          }}
          transition={{ 
            duration: Math.random() * 10 + 10, 
            repeat: Infinity, 
            ease: "linear",
            delay: Math.random() * 10
          }}
        />
      ))}
    </div>
  );
};

export const LordLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  const loginComGoogle = async () => {
    setLoading(true);
    setErro(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setSucesso(true);
      setTimeout(() => {
        onLogin();
      }, 1500);
    } catch (error: any) {
      console.error("Erro no login:", error);
      setErro("Falha na autenticação. Tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#020202] relative overflow-hidden selection:bg-cyan-500 selection:text-black">
      {/* ATMOSPHERIC BACKGROUND */}
      <ParticleBackground />
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.05),transparent_70%)]" />
      <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-cyan-500/5 blur-[150px] rounded-full" />
      <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-blue-600/5 blur-[150px] rounded-full" />
      
      <motion.div 
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg relative z-10"
      >
        {/* LOGO SECTION */}
        <div className="text-center mb-16 space-y-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-block"
          >
            <div className="text-6xl md:text-7xl font-display font-black italic tracking-tighter leading-none">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/20">LORD</span>
              <span className="text-cyan-500 drop-shadow-[0_0_25px_rgba(34,211,238,0.5)]">FLIX</span>
            </div>
          </motion.div>
          <div className="flex items-center justify-center gap-4">
            <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/10" />
            <p className="text-[10px] uppercase tracking-[0.8em] text-silver/30 font-black">Sovereign Entertainment</p>
            <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/10" />
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="glass-panel p-10 md:p-14 rounded-[60px] border-white/5 shadow-[0_40px_100px_rgba(0,0,0,0.8)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          
          <AnimatePresence mode="wait">
            {sucesso ? (
              <motion.div 
                key="sucesso"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-8"
              >
                <div className="w-24 h-24 mx-auto rounded-[35px] bg-cyan-500 flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.4)]">
                  <Shield className="w-10 h-10 text-black" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">Acesso Concedido</h2>
                  <p className="text-silver/40 text-[10px] font-black uppercase tracking-[0.4em]">Bem-vindo ao Círculo Interno</p>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="login-content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-10"
              >
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-white text-center uppercase tracking-widest">Portal de Autenticação</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {[
                      { icon: <Zap className="w-4 h-4" />, label: "Bitrate" },
                      { icon: <Globe className="w-4 h-4" />, label: "Global" },
                      { icon: <Lock className="w-4 h-4" />, label: "Secure" }
                    ].map((item, i) => (
                      <div key={i} className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/5 border border-white/5">
                        <div className="text-cyan-500">{item.icon}</div>
                        <span className="text-[8px] font-black uppercase tracking-widest text-silver/40">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={loginComGoogle}
                  disabled={loading}
                  className="w-full relative group/btn"
                >
                  <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl blur opacity-20 group-hover/btn:opacity-60 transition duration-1000 group-hover/btn:duration-200" />
                  <div className="relative flex items-center justify-center gap-4 w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] transition-all active:scale-95">
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    ) : (
                      <>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
                        Entrar no Império
                        <ChevronRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                      </>
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {erro && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="text-center"
                    >
                      <p className="text-red-500 text-[10px] font-black uppercase tracking-widest">{erro}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* FOOTER INFO */}
        <div className="mt-12 flex flex-col items-center gap-6">
          <div className="flex gap-10">
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-white">4K+</span>
              <span className="text-[8px] font-bold text-silver/20 uppercase tracking-widest">Qualidade</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-white">256-BIT</span>
              <span className="text-[8px] font-bold text-silver/20 uppercase tracking-widest">Encryption</span>
            </div>
            <div className="w-px h-8 bg-white/5" />
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-black text-white">ULTRA</span>
              <span className="text-[8px] font-bold text-silver/20 uppercase tracking-widest">Bitrate</span>
            </div>
          </div>
          <p className="text-[9px] text-silver/10 uppercase tracking-[0.5em] font-black text-center max-w-xs leading-loose">
            Acesso restrito a membros autorizados. Todos os direitos reservados à LordEngine v4.0.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
