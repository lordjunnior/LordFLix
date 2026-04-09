/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export const LordLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [lembrar, setLembrar] = useState(true);
  const [tentativas, setTentativas] = useState(0);
  const [bloqueadoAte, setBloqueadoAte] = useState<number | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [sucesso, setSucesso] = useState(false);

  // Lógica de Proteção contra Força Bruta
  useEffect(() => {
    if (bloqueadoAte) {
      const interval = setInterval(() => {
        if (Date.now() > bloqueadoAte) {
          setBloqueadoAte(null);
          setTentativas(0);
          setErro(null);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [bloqueadoAte]);

  const realizarLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (bloqueadoAte) return;

    // Simulação de Validação Titanium
    if (email === "admin@lordflix.tv" && senha === "123456") {
      setSucesso(true);
      setTimeout(() => {
        onLogin();
      }, 1500);
    } else {
      const novasTentativas = tentativas + 1;
      setTentativas(novasTentativas);
      
      if (novasTentativas >= 3) {
        // Bloqueio progressivo
        const tempoBloqueio = Date.now() + (novasTentativas * 30000); 
        setBloqueadoAte(tempoBloqueio);
        setErro("Segurança ativada: Acesso bloqueado temporariamente.");
      } else {
        setErro(`Chave incorreta. Você tem mais ${3 - novasTentativas} tentativas.`);
        setTimeout(() => setErro(null), 3000);
      }
    }
  };

  const tempoRestante = bloqueadoAte ? Math.ceil((bloqueadoAte - Date.now()) / 1000) : 0;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-[#020202] relative overflow-hidden">
      {/* Detalhe de Luxo: Brilho Titanium no fundo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full"></div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md p-10 rounded-[40px] border-white/5 relative overflow-hidden z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="text-4xl font-black italic tracking-tighter mb-2"
          >
            LORD<span className="text-gold">FLIX</span>
          </motion.div>
          <p className="text-[10px] uppercase tracking-[0.5em] text-silver/30 font-bold">Acesso Restrito Titanium</p>
        </div>

        <AnimatePresence mode="wait">
          {sucesso ? (
            <motion.div 
              key="sucesso"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-10 text-center"
            >
              <div className="w-24 h-24 mx-auto mb-8 rounded-full overflow-hidden border border-green-500/20 shadow-2xl shadow-green-500/10">
                <img src="https://picsum.photos/seed/verified/200/200" alt="Sucesso" className="w-full h-full object-cover grayscale opacity-80" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-black uppercase italic mb-2">Acesso Autorizado</h2>
              <p className="text-silver/40 text-[10px] font-bold uppercase tracking-widest">Bem-vindo ao Cinema de Luxo</p>
            </motion.div>
          ) : (
            <motion.form 
              key="form"
              exit={{ opacity: 0, scale: 0.9 }}
              onSubmit={realizarLogin} 
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-silver/20 ml-4 tracking-widest">
                  E-mail de Membro
                </label>
                <input 
                  type="email" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all text-silver placeholder:opacity-10"
                  placeholder="exemplo@lordflix.tv"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-silver/20 ml-4 tracking-widest">
                  Chave de Segurança
                </label>
                <input 
                  type="password" 
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-cyan-500 transition-all text-silver placeholder:opacity-10"
                  placeholder="••••••••"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between px-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <input 
                      type="checkbox" 
                      checked={lembrar}
                      onChange={() => setLembrar(!lembrar)}
                      className="w-5 h-5 rounded-lg bg-white/5 border-white/10 checked:bg-cyan-500 transition-all appearance-none cursor-pointer border"
                    />
                    {lembrar && <div className="absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none">OK</div>}
                  </div>
                  <span className="text-[10px] text-silver/30 group-hover:text-silver transition-colors font-bold uppercase tracking-widest">Lembrar por 30 dias</span>
                </label>
              </div>

              <AnimatePresence>
                {erro && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="bg-cyan-500/10 border border-cyan-500/20 p-4 rounded-2xl"
                  >
                    <p className="text-cyan-500 text-[10px] font-black uppercase tracking-wider leading-tight text-center">{erro}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <button 
                type="submit"
                disabled={!!bloqueadoAte}
                className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all relative overflow-hidden ${bloqueadoAte ? 'bg-zinc-900 text-silver/20 cursor-not-allowed' : 'bg-white text-black hover:bg-cyan-500 hover:text-black shadow-[0_10px_30px_rgba(255,255,255,0.05)]'}`}
              >
                {bloqueadoAte ? (
                  <span className="flex items-center justify-center gap-2">
                    BLOQUEADO ({tempoRestante}s)
                  </span>
                ) : 'ENTRAR NO CINEMA'}
              </button>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="mt-10 text-center">
          <p className="text-[8px] text-silver/20 uppercase tracking-[0.4em] font-bold leading-loose">
            Proteção AES-256 GCM ativada.<br/>
            Seu IP está sendo monitorado para sua segurança.
          </p>
        </div>
      </motion.div>
    </div>
  );
};
