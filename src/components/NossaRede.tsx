/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

export default function NossaRede({ onBack }: { onBack: () => void }) {
  return (
    <div className="bg-obsidian min-h-screen selection:bg-cyan-500 selection:text-black">
      <nav className="fixed top-0 w-full z-[60] glass-panel px-8 py-4 flex justify-between items-center">
        <div 
          onClick={onBack}
          className="text-3xl font-black italic tracking-tighter text-white cursor-pointer"
        >
          LORD<span className="text-gold">FLIX</span>
        </div>
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-silver/50 hover:text-white transition-all uppercase text-[10px] font-bold tracking-widest"
        >
          Voltar
        </button>
      </nav>

      <main className="pt-40 px-6 md:px-10 max-w-4xl mx-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-6xl md:text-8xl font-black mb-12 tracking-tighter italic uppercase leading-none">
            Por que é tão <span className="text-cyan-500">Rápido?</span>
          </h1>
        </motion.div>
        
        <div className="space-y-16">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="group"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10 group-hover:border-cyan-500/30 transition-all">
                <img src="https://picsum.photos/seed/network/200/200" alt="Rede" className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-3xl font-black uppercase italic">Sistema de Mutirão (P2P)</h2>
            </div>
            <p className="text-silver/50 text-xl leading-relaxed font-medium">
              Diferente de outros sites que ficam lentos quando muita gente usa, o LordFlix funciona como um mutirão. Quanto mais pessoas assistem, mais pontos de entrega criamos, garantindo que o filme nunca trave, mesmo em conexões simples.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 p-10 rounded-[40px] border-l-8 border-cyan-500 shadow-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/10">
                <img src="https://picsum.photos/seed/shield/200/200" alt="Segurança" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-3xl font-black uppercase italic">Privacidade Titanium</h2>
            </div>
            <p className="text-silver/50 text-xl leading-relaxed font-medium">
              Usamos criptografia de ponta (AES-256). Isso significa que nem nós, nem ninguém, consegue ver o que você está assistindo. Seus dados são triturados e protegidos por uma chave digital única.
            </p>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="glass-panel p-8 rounded-3xl border-white/5">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 mb-4">
                <img src="https://picsum.photos/seed/speed/100/100" alt="Velocidade" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-xl font-black uppercase italic mb-2">Transmissão 4K</h3>
              <p className="text-silver/40 text-sm">Otimizado para resoluções extremas sem perda de qualidade.</p>
            </div>
            <div className="glass-panel p-8 rounded-3xl border-white/5">
              <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 mb-4">
                <img src="https://picsum.photos/seed/global/100/100" alt="Global" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-xl font-black uppercase italic mb-2">Rede Global</h3>
              <p className="text-silver/40 text-sm">Servidores espalhados por todo o Brasil para menor latência.</p>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
