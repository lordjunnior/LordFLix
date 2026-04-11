import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Play, Volume2, VolumeX, SkipForward, Info, Crown } from 'lucide-react';

interface AdPlayerProps {
  onComplete: () => void;
  onClose: () => void;
}

export const AdPlayer = ({ onComplete, onClose }: AdPlayerProps) => {
  const [timeLeft, setTimeLeft] = useState(3);
  const [canSkip, setCanSkip] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanSkip(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-[400] bg-black flex items-center justify-center overflow-hidden">
      {/* BACKGROUND AD CONTENT (Simulated) */}
      <div className="absolute inset-0">
        <img 
          src="https://images.unsplash.com/photo-1616469829581-73993eb86b02?q=80&w=2070&auto=format&fit=crop" 
          className="w-full h-full object-cover opacity-40 blur-sm"
          alt="Ad Background"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/60" />
      </div>

      {/* TOP BAR - EXIT & BRANDING */}
      <div className="absolute top-0 left-0 right-0 p-4 md:p-10 flex justify-between items-start z-[450] pointer-events-none">
        <div className="hidden md:flex items-center gap-3 bg-gold/10 px-4 py-2 rounded-full border border-gold/20 pointer-events-auto">
          <Crown className="w-4 h-4 text-gold" />
          <span className="text-[8px] font-black text-gold uppercase tracking-[0.3em]">Membros VIP não veem anúncios</span>
        </div>

        <button 
          onClick={onClose}
          className="flex items-center gap-3 px-6 py-3 bg-red-500/20 hover:bg-red-500 text-white rounded-2xl border border-red-500/30 transition-all group shadow-[0_0_20px_rgba(239,68,68,0.2)] pointer-events-auto ml-auto"
        >
          <X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-widest">Sair do Vídeo</span>
        </button>
      </div>

      {/* AD CONTENT */}
      <div className="relative z-10 w-full max-w-4xl aspect-video bg-zinc-900/40 backdrop-blur-3xl rounded-[40px] overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center p-6 md:p-10 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6 md:space-y-8"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-cyan-500 rounded-3xl flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(34,211,238,0.3)]">
            <Play className="w-8 h-8 md:w-10 md:h-10 text-black fill-current" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-aluminum">Publicidade de Elite</h2>
            <p className="text-silver/40 text-[10px] font-black uppercase tracking-[0.4em]">O filme começará em instantes</p>
          </div>

          <div className="flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-6 md:gap-8">
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Bitrate</span>
                <span className="text-lg md:text-xl font-black text-white">4K ULTRA</span>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div className="flex flex-col items-center gap-2">
                <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Sinal</span>
                <span className="text-lg md:text-xl font-black text-white">ESTÁVEL</span>
              </div>
            </div>

            <button className="bg-gold text-black px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-white transition-all shadow-xl shadow-gold/20">
              Remover Anúncios Agora
            </button>
          </div>
        </motion.div>

        {/* AD OVERLAY CONTROLS */}
        <div className="absolute bottom-4 md:bottom-10 left-4 md:left-10 right-4 md:right-10 flex flex-col md:flex-row justify-between items-center md:items-end gap-4 z-[460]">
          <div className="flex items-center gap-4 bg-black/60 backdrop-blur-2xl p-4 rounded-2xl border border-white/10 w-full md:w-auto">
            <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">
              <Info className="w-5 h-5 text-silver" />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-white uppercase tracking-widest">Patrocinador LordFlix</p>
              <p className="text-[8px] text-silver/40 uppercase font-bold">Anúncio de Alta Conversão</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            <button 
              onClick={() => setMuted(!muted)}
              className="p-4 md:p-6 bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 text-silver hover:text-white transition-colors"
            >
              {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            <button 
              onClick={canSkip ? onComplete : undefined}
              className={`group flex items-center gap-4 px-8 md:px-12 py-5 md:py-7 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] transition-all shadow-2xl ${canSkip ? 'bg-white text-black hover:bg-cyan-500 hover:scale-105 active:scale-95' : 'bg-black/60 text-silver/20 cursor-not-allowed border border-white/10'}`}
            >
              {canSkip ? (
                <>
                  Pular Anúncio
                  <SkipForward className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              ) : (
                `Pular em ${timeLeft}s`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
