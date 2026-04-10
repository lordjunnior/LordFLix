import React from 'react';
import { motion } from 'motion/react';

interface LordPlayerProps {
  src: string;
  title: string;
  onClose: () => void;
}

export const LordPlayer = ({ src, title, onClose }: LordPlayerProps) => {
  const isEmbed = src.includes('embed.su') || src.includes('vidsrc') || src.includes('youtube.com');

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black flex flex-col"
    >
      <div className="p-6 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent absolute top-0 w-full z-[250]">
        <h2 className="text-white font-black uppercase tracking-widest text-sm drop-shadow-lg">{title}</h2>
        <button 
          onClick={onClose}
          className="bg-white/10 hover:bg-cyan-500 hover:text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.3em] transition-all text-white border border-white/10"
        >
          Sair do Cinema [x]
        </button>
      </div>

      <div className="flex-1 w-full h-full bg-black">
        {isEmbed ? (
          <iframe 
            src={src}
            className="w-full h-full border-none"
            // Sandbox equilibrado: impede downloads e popups, mas permite o play e os controlos
            sandbox="allow-forms allow-pointer-lock allow-same-origin allow-scripts allow-top-navigation"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            title={title}
          />
        ) : (
          <video src={src} controls autoPlay className="w-full h-full" />
        )}
      </div>
    </motion.div>
  );
};
