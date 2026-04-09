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
        
        <div className="space-y-32">
          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="group relative h-[600px] rounded-[60px] overflow-hidden border border-white/5"
          >
            <img 
              src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop" 
              alt="Global Infrastructure" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
            <div className="absolute inset-y-0 left-0 p-16 flex flex-col justify-center z-20">
              <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.6em] mb-6 block">Engenharia de Rede</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic mb-8 leading-none">Infraestrutura <br/> Global</h2>
              <p className="text-silver/50 text-xl leading-relaxed font-light max-w-xl">
                Nossa rede foi desenhada para alta performance. Utilizamos servidores estrategicamente localizados para garantir que o streaming seja fluido e instantâneo, independente de quantos usuários estejam conectados simultaneamente.
              </p>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="group relative h-[600px] rounded-[60px] overflow-hidden border border-white/5"
          >
            <img 
              src="https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop" 
              alt="Private Experience" 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black via-black/60 to-transparent"></div>
            <div className="absolute inset-y-0 right-0 p-16 flex flex-col justify-center items-end text-right z-20">
              <span className="text-gold text-[10px] font-black uppercase tracking-[0.6em] mb-6 block">Privacidade Absoluta</span>
              <h2 className="text-5xl md:text-7xl font-black uppercase italic mb-8 leading-none">Experiência <br/> Privada</h2>
              <p className="text-silver/50 text-xl leading-relaxed font-light max-w-xl">
                Sua navegação é simples e direta. Valorizamos sua liberdade e focamos no que realmente importa: entregar o melhor conteúdo sem interrupções ou rastreamento desnecessário. Assista com tranquilidade.
              </p>
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="grid md:grid-cols-2 gap-8"
          >
            <div className="relative h-[400px] rounded-[40px] overflow-hidden group border border-white/5">
              <img src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?q=80&w=1925&auto=format&fit=crop" alt="4K" className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all"></div>
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-3xl font-black uppercase italic mb-2">Transmissão 4K</h3>
                <p className="text-silver/40 text-sm">Otimizado para resoluções extremas sem perda de qualidade.</p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-[40px] overflow-hidden group border border-white/5">
              <img src="https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=1968&auto=format&fit=crop" alt="Global" className="absolute inset-0 w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
              <div className="absolute inset-0 bg-black/60 group-hover:bg-black/20 transition-all"></div>
              <div className="absolute bottom-0 left-0 p-10">
                <h3 className="text-3xl font-black uppercase italic mb-2">Rede Global</h3>
                <p className="text-silver/40 text-sm">Servidores espalhados por todo o Brasil para menor latência.</p>
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  );
}
