/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from '../firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Shield, Lock, Globe, Zap, ChevronRight, Mail, UserPlus, LogIn } from 'lucide-react';

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
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return setErro("Preencha todos os campos.");
    
    setLoading(true);
    setErro(null);
    try {
      if (isRegistering) {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        // Criar documento do usuário no Firestore
        await setDoc(doc(db, 'users', cred.user.uid), {
          uid: cred.user.uid,
          email: cred.user.email,
          role: cred.user.email?.toLowerCase() === 'lordjunnior@gmail.com' ? 'admin' : 'user',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setSucesso(true);
      setTimeout(onLogin, 1500);
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      setErro(error.code === 'auth/user-not-found' ? "Usuário não encontrado." : "Falha na autenticação.");
      setLoading(false);
    }
  };

  const loginComGoogle = async () => {
    setLoading(true);
    setErro(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Verificar se o usuário já existe no Firestore, se não, criar
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          role: user.email?.toLowerCase() === 'lordjunnior@gmail.com' ? 'admin' : 'user',
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }
      
      setSucesso(true);
      setTimeout(onLogin, 1500);
    } catch (error: any) {
      console.error("Erro no login Google:", error);
      setErro("Falha na autenticação via Google.");
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
                  <h3 className="text-xl font-bold text-white text-center uppercase tracking-widest">
                    {isRegistering ? 'Criar Nova Identidade' : 'Portal de Autenticação'}
                  </h3>
                  
                  <form onSubmit={handleAuth} className="space-y-4">
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/20" />
                      <input 
                        type="email" 
                        placeholder="E-MAIL DE ELITE"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-12 pr-6 text-white text-xs font-black uppercase tracking-widest focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-silver/20" />
                      <input 
                        type="password" 
                        placeholder="CHAVE DE ACESSO"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/5 rounded-2xl py-5 pl-12 pr-6 text-white text-xs font-black uppercase tracking-widest focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                    
                    <button 
                      type="submit"
                      disabled={loading}
                      className="w-full py-6 bg-cyan-500 text-black rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] hover:bg-white transition-all flex items-center justify-center gap-3"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      ) : (
                        <>
                          {isRegistering ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
                          {isRegistering ? 'Finalizar Cadastro' : 'Entrar no Sistema'}
                        </>
                      )}
                    </button>
                  </form>

                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/5"></div></div>
                    <div className="relative flex justify-center text-[8px] font-black uppercase tracking-[0.5em] text-silver/20"><span className="bg-[#050505] px-4">Ou via Rede Externa</span></div>
                  </div>

                  <button 
                    onClick={loginComGoogle}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-4 py-5 bg-white/5 border border-white/5 text-white rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] hover:bg-white/10 transition-all"
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="Google" />
                    Google Sync
                  </button>

                  <button 
                    onClick={() => setIsRegistering(!isRegistering)}
                    className="w-full text-center text-[9px] font-black uppercase tracking-widest text-silver/40 hover:text-cyan-500 transition-colors"
                  >
                    {isRegistering ? 'Já possui acesso? Faça Login' : 'Não tem conta? Solicitar Acesso'}
                  </button>
                </div>

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
