/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

export default function GuiaTV({ onBack, series = [] }: { onBack: () => void, series?: any[] }) {
  const passos = [
    { 
      numero: "01", 
      titulo: "Abra o Navegador", 
      desc: "No controle da sua TV, procure pelo ícone de Internet ou Navegador (Web Browser).",
      img: "https://picsum.photos/seed/browser/200/200"
    },
    { 
      numero: "02", 
      titulo: "Digite o Endereço", 
      desc: "Lá em cima, digite LORD-FLIX.TV e aperte o botão OK no controle.",
      img: "https://picsum.photos/seed/typing/200/200"
    },
    { 
      numero: "03", 
      titulo: "Use as Setas", 
      desc: "Navegue pelos filmes usando as setas do controle. O botão central dá o PLAY.",
      img: "https://picsum.photos/seed/remote/200/200"
    }
  ];

  return (
    <div className="bg-obsidian min-h-screen p-6 md:p-20 relative">
      <button 
        onClick={onBack}
        className="absolute top-10 left-10 flex items-center gap-2 text-silver/50 hover:text-white transition-all uppercase text-[10px] font-bold tracking-widest"
      >
        Voltar ao Cinema
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-20"
      >
        <h1 className="text-5xl md:text-7xl font-black mb-6 uppercase tracking-tighter italic">
          LordFlix na sua <span className="text-gold">Smart TV</span>
        </h1>
        <p className="text-silver/40 max-w-2xl mx-auto uppercase text-[10px] font-bold tracking-[0.3em]">
          Transforme sua sala em uma sala de cinema premium em apenas 3 passos simples.
        </p>
      </motion.div>
      
      <div className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto mb-32">
        {passos.map((passo, index) => (
          <motion.div 
            key={passo.numero}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-panel p-10 rounded-[40px] relative overflow-hidden group hover:border-gold/30 transition-all"
          >
            <span className="absolute -top-6 -right-4 text-[12rem] font-black opacity-[0.03] text-white group-hover:opacity-[0.05] transition-opacity">
              {passo.numero}
            </span>
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10">
                <img src={passo.img} alt={passo.titulo} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
              </div>
            </div>
            <h2 className="text-2xl font-black mb-4 uppercase italic text-center">{passo.titulo}</h2>
            <p className="text-silver/50 leading-relaxed text-sm text-center">{passo.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* GRADE DE PROGRAMAÇÃO (SÉRIES REAIS) */}
      <section className="max-w-7xl mx-auto">
        <div className="flex flex-col items-center mb-16">
          <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter text-center">Grade de Programação Supreme</h2>
          <div className="h-1 w-20 bg-gold mt-4"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {series.map((item) => (
            <motion.div 
              key={item.id} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="group relative bg-zinc-900 border-b border-gold/20 hover:border-gold transition-all rounded-xl overflow-hidden"
            >
              {/* IMAGEM DA SÉRIE */}
              <div className="aspect-video overflow-hidden">
                <img 
                  src={item.bg || item.img} 
                  alt={item.titulo} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="p-6">
                {/* TAG SUPREME GOLD */}
                <span className="text-[10px] font-black bg-gold text-black px-2 py-0.5 uppercase mb-3 inline-block">
                  Premium TV
                </span>
                <h3 className="text-white font-bold truncate text-lg">
                  {item.titulo}
                </h3>
                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">
                  {item.ano} • Sci-Fi Series
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-32 p-10 border-t border-white/5 flex flex-col items-center gap-6"
      >
        <div className="flex items-center gap-4 text-silver/20">
          <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-center">
            Otimizado para Samsung Tizen, LG WebOS e Android TV
          </p>
        </div>
        <div className="bg-gold/10 text-gold px-6 py-2 rounded-full text-[9px] font-black uppercase tracking-widest">
          Suporte Técnico 24h Ativo
        </div>
      </motion.div>
    </div>
  );
}
