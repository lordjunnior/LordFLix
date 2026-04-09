/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';

export default function GuiaTV({ onBack, series = [] }: { onBack: () => void, series?: any[] }) {
  const passos = [
    { 
      numero: "01", 
      titulo: "Acesso Instantâneo", 
      desc: "Navegue até o endereço oficial LORD-FLIX.TV diretamente no browser da sua Smart TV.",
      img: "https://images.unsplash.com/photo-1593784991095-a205069470b6?q=80&w=2070&auto=format&fit=crop"
    },
    { 
      numero: "02", 
      titulo: "Sincronização Pura", 
      desc: "Sua conta é reconhecida imediatamente. Sem configurações complexas, apenas o play.",
      img: "https://images.unsplash.com/photo-1558885544-2defc62e2e2b?q=80&w=1974&auto=format&fit=crop"
    },
    { 
      numero: "03", 
      titulo: "Domínio Total", 
      desc: "Controle a experiência com a precisão de um estúdio. Qualidade 4K HDR garantida.",
      img: "https://images.unsplash.com/photo-1509281373149-e957c6296406?q=80&w=2056&auto=format&fit=crop"
    }
  ];

  return (
    <div className="bg-obsidian min-h-screen p-6 md:p-20 relative selection:bg-gold selection:text-black">
      <button 
        onClick={onBack}
        className="absolute top-10 left-10 flex items-center gap-2 text-silver/50 hover:text-white transition-all uppercase text-[10px] font-black tracking-[0.4em] z-50"
      >
        Voltar ao Cinema
      </button>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-32 pt-20"
      >
        <span className="text-gold text-[10px] font-black uppercase tracking-[0.6em] mb-6 block">Experiência Smart TV</span>
        <h1 className="text-6xl md:text-9xl font-black mb-8 uppercase tracking-tighter italic leading-none">
          O Cinema na <br/> <span className="text-gold">Sua Sala</span>
        </h1>
        <p className="text-silver/40 max-w-2xl mx-auto uppercase text-[10px] font-bold tracking-[0.4em] leading-loose">
          A infraestrutura LordFlix foi desenhada para dominar as maiores telas. Sem perdas, sem atrasos, apenas a pureza da imagem original.
        </p>
      </motion.div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-[1600px] mx-auto mb-48">
        {passos.map((passo, index) => (
          <motion.div 
            key={passo.numero}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
            className="relative h-[500px] rounded-[50px] overflow-hidden group cursor-pointer border border-white/5"
          >
            <img 
              src={passo.img} 
              alt={passo.titulo} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0" 
              referrerPolicy="no-referrer" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
            
            <div className="absolute top-8 left-8">
              <span className="text-6xl font-black text-white/10 group-hover:text-gold/20 transition-colors">{passo.numero}</span>
            </div>

            <div className="absolute bottom-0 left-0 p-10 z-20">
              <h2 className="text-3xl font-black mb-4 uppercase italic">{passo.titulo}</h2>
              <p className="text-silver/50 leading-relaxed text-sm max-w-[250px]">{passo.desc}</p>
            </div>
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
