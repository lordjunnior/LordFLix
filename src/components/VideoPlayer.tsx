import React from 'react';
import { motion } from 'motion/react';

interface LordPlayerProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const LordPlayer = ({ src, title, onClose }: LordPlayerProps) => {
  // Verifica se o link é um EMBED (Filmes/Séries) ou um STREAM DIRETO (Canais de TV)
  const isEmbed = src.includes('vidsrc.to') || src.includes('youtube.com');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      {/* Barra de Controle Superior */}
      <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black to-transparent absolute top-0 w-full z-10">
        <h2 className="text-white font-black uppercase tracking-widest text-sm">{title}</h2>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-cyan-500 hover:text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all text-white"
        >
          Sair do Cinema [x]
        </button>
      </div>

      {/* Área do Player */}
      <div className="flex-1 w-full h-full">
        {isEmbed ? (
          <iframe 
            src={src}
            className="w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={title}
          />
        ) : (
          /* Se for canal de TV ou arquivo direto, usa o player de vídeo padrão */
          <video 
            src={src} 
            controls 
            autoPlay 
            className="w-full h-full"
          />
        )}
      </div>
    </motion.div>
  );
};
