import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export const ScrollControls = () => {
  const [isVisible, setIsVisible] = useState(false);

  // Monitora o scroll para mostrar/esconder o botão
  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 50 }}
          className="fixed bottom-10 right-10 z-[100] flex flex-col gap-3"
        >
          {/* Botão Para Cima */}
          <motion.button
            whileHover={{ scale: 1.1, y: -5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="group relative w-16 h-16 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-full flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
            title="Voltar ao Topo"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronUp className="w-7 h-7 text-aluminum group-hover:text-cyan-400 transition-all relative z-10" />
            
            {/* Efeito de brilho metálico rotativo */}
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 opacity-0 group-hover:opacity-10 pointer-events-none"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-gradient-to-b from-white to-transparent" />
            </motion.div>
          </motion.button>

          {/* Botão Para Baixo */}
          <motion.button
            whileHover={{ scale: 1.1, y: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToBottom}
            className="group relative w-14 h-14 bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden"
            title="Ir para o Rodapé"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <ChevronDown className="w-6 h-6 text-aluminum group-hover:text-cyan-400 transition-colors relative z-10" />
            
            {/* Efeito de brilho metálico interno */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </div>
          </motion.button>

          {/* Label Vertical Elegante */}
          <div className="absolute -left-12 top-1/2 -translate-y-1/2 rotate-180 [writing-mode:vertical-lr] pointer-events-none">
            <span className="text-[8px] font-black uppercase tracking-[0.5em] text-silver/10 group-hover:text-silver/30 transition-colors">
              Navigation Control
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
