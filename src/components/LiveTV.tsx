import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Hls from 'hls.js';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  X, 
  Tv, 
  Dribbble, 
  Film, 
  Newspaper, 
  Globe,
  Zap,
  ChevronRight,
  ChevronLeft,
  Shield,
  Settings
} from 'lucide-react';
import { LIVE_CHANNELS } from '../constants/channels';

const CATEGORIES = [
  { id: 'esportes', name: 'Esportes', icon: Dribbble },
  { id: 'cinema', name: 'Cinema', icon: Film },
  { id: 'noticias', name: 'Notícias', icon: Newspaper },
  { id: 'documentarios', name: 'Documentários', icon: Globe },
];

interface LiveTVProps {
  onClose: () => void;
  currentChannel: typeof LIVE_CHANNELS[0];
  onChannelChange: (channel: typeof LIVE_CHANNELS[0]) => void;
}

export default function LiveTV({ onClose, currentChannel, onChannelChange }: LiveTVProps) {
  const [selectedCategory, setSelectedCategory] = useState(currentChannel.category);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = LIVE_CHANNELS.findIndex(c => c.id === currentChannel.id);
      if (e.key === 'ArrowRight') {
        const nextIndex = (currentIndex + 1) % LIVE_CHANNELS.length;
        onChannelChange(LIVE_CHANNELS[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        const prevIndex = (currentIndex - 1 + LIVE_CHANNELS.length) % LIVE_CHANNELS.length;
        onChannelChange(LIVE_CHANNELS[prevIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChannel, onChannelChange, onClose]);

  useEffect(() => {
    const initPlayer = () => {
      if (videoRef.current && currentChannel.stream) {
        setLoading(true);
        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(currentChannel.stream);
          hls.attachMedia(videoRef.current);
          hlsRef.current = hls;
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            if (playing) videoRef.current?.play().catch(() => setPlaying(false));
          });

          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  initPlayer();
                  break;
              }
            }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = currentChannel.stream;
          videoRef.current.addEventListener('loadedmetadata', () => {
            setLoading(false);
            if (playing) videoRef.current?.play().catch(() => setPlaying(false));
          });
        }
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentChannel]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

  useEffect(() => {
    if (videoRef.current) {
      if (playing) videoRef.current.play().catch(() => setPlaying(false));
      else videoRef.current.pause();
    }
  }, [playing]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const filteredChannels = LIVE_CHANNELS.filter(c => c.category === selectedCategory);

  return (
    <div className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex overflow-hidden selection:bg-cyan-500 font-sans text-white">
      {/* ATMOSPHERIC BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div 
          className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full blur-[150px] opacity-20 transition-colors duration-1000"
          style={{ backgroundColor: currentChannel.color }}
        />
        <div 
          className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[120px] opacity-10 transition-colors duration-1000"
          style={{ backgroundColor: currentChannel.color }}
        />
      </div>

      {/* NAVEGAÇÃO LATERAL MAGNÉTICA */}
      <aside className="w-24 md:w-28 bg-black/40 backdrop-blur-2xl border-r border-white/5 flex flex-col items-center py-12 gap-12 z-50">
        <motion.div 
          whileHover={{ scale: 1.1, rotate: 5 }}
          className="w-14 h-14 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.4)] cursor-pointer"
        >
          <Tv className="w-7 h-7 text-black" />
        </motion.div>
        
        <nav className="flex flex-col gap-8">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`group relative flex flex-col items-center gap-3 transition-all ${selectedCategory === cat.id ? 'text-white' : 'text-white/20 hover:text-white/60'}`}
            >
              <div className={`p-4 rounded-2xl transition-all duration-500 ${selectedCategory === cat.id ? 'bg-white/10 border border-white/20 shadow-lg' : 'bg-transparent border border-transparent'}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.3em] transition-all duration-500 ${selectedCategory === cat.id ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
                {cat.name}
              </span>
              {selectedCategory === cat.id && (
                <motion.div 
                  layoutId="active-cat-indicator"
                  className="absolute -left-6 w-1.5 h-10 bg-cyan-500 rounded-full shadow-[0_0_20px_rgba(34,211,238,1)]"
                />
              )}
            </button>
          ))}
        </nav>

        <button 
          onClick={onClose}
          className="mt-auto w-14 h-14 rounded-2xl bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center transition-all group"
        >
          <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform" />
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        {/* PLAYER CINEMATIC VIEW */}
        <section className="flex-[0.50] p-6 md:p-8 flex items-center justify-center relative">
          <div 
            ref={containerRef}
            className="relative w-full h-full max-w-7xl group overflow-hidden rounded-[48px] border border-white/10 shadow-[0_0_120px_rgba(0,0,0,0.9)] bg-black"
            onMouseMove={handleMouseMove}
          >
            {/* AMBILIGHT DYNAMIC GLOW */}
            <div 
              className="absolute inset-0 opacity-20 blur-[100px] transition-colors duration-1000 pointer-events-none"
              style={{ backgroundColor: currentChannel.color }}
            />

            {/* LOADING STATE */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center gap-6"
                >
                  <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin shadow-[0_0_30px_rgba(34,211,238,0.2)]" />
                  <div className="flex flex-col items-center">
                    <p className="text-xl font-black italic uppercase tracking-[0.5em] text-white animate-pulse">Sincronizando</p>
                    <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mt-2">Sinal Satélite de Alta Fidelidade</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative w-full h-full">
              <video 
                ref={videoRef}
                className="w-full h-full object-contain"
                onClick={() => setPlaying(!playing)}
                playsInline
                referrerPolicy="no-referrer"
              />
              {/* DEBUG VISUAL */}
              <div className="absolute bottom-4 left-4 z-[100] bg-black/80 px-4 py-2 rounded-lg border border-white/20 pointer-events-none">
                <p className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest">
                  URL CARREGADA: <span className="text-white lowercase">{currentChannel.stream}</span>
                </p>
              </div>
            </div>

            {/* TOP INFO BAR */}
            <div className={`absolute top-10 left-10 right-10 z-40 flex items-center justify-between transition-all duration-700 ${showControls ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.4)]">
                  <div className="w-2 h-2 bg-white rounded-full animate-ping" />
                  <span className="font-black italic text-xs tracking-[0.2em] uppercase text-white">Ao Vivo</span>
                </div>
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-6 py-2.5 rounded-full flex items-center gap-4">
                  <span className="font-black text-xs tracking-[0.3em] uppercase text-white/80">{currentChannel.name}</span>
                  <div className="w-px h-4 bg-white/10" />
                  <span className="font-bold text-[10px] tracking-widest uppercase text-cyan-500">{currentChannel.quality}</span>
                </div>
              </div>
            </div>

            {/* MAIN CONTROLS OVERLAY */}
            <AnimatePresence>
              {showControls && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40 pointer-events-none"
                >
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <motion.button 
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="w-24 h-24 bg-white/10 backdrop-blur-xl border border-white/20 rounded-full flex items-center justify-center text-white pointer-events-auto hover:bg-cyan-500 hover:text-black hover:border-cyan-500 transition-all duration-500 shadow-2xl"
                      onClick={() => setPlaying(!playing)}
                    >
                      {playing ? <Pause className="w-10 h-10 fill-current" /> : <Play className="w-10 h-10 fill-current ml-2" />}
                    </motion.button>
                  </div>

                  {/* BOTTOM CONTROL BAR */}
                  <div className="absolute bottom-0 inset-x-0 p-10 flex flex-col gap-8 pointer-events-auto">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-8">
                        <div className="flex items-center gap-4 bg-white/5 backdrop-blur-2xl border border-white/10 px-6 py-3 rounded-full">
                          <button onClick={() => setMuted(!muted)} className="text-white/60 hover:text-white transition-colors">
                            {muted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                          </button>
                          <input 
                            type="range" 
                            min={0} 
                            max={1} 
                            step="any" 
                            value={muted ? 0 : volume}
                            onChange={(e) => setVolume(parseFloat(e.target.value))}
                            className="w-32 h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-cyan-500"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <button 
                          onClick={toggleFullscreen}
                          className="w-12 h-12 bg-white/5 backdrop-blur-2xl border border-white/10 rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                        >
                          {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* 3D CAROUSEL DE CANAIS (SUPREME) */}
        <section className="flex-[0.50] px-10 pb-10 overflow-hidden flex flex-col justify-center relative">
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
             <h1 className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[18rem] font-black uppercase italic tracking-tighter text-white/[0.03] whitespace-nowrap select-none">
               LORD VISION LIVE
             </h1>
          </div>

          <div className="flex items-center justify-between mb-16 relative z-10">
            <div className="flex flex-col">
              <div className="flex items-center gap-4 mb-2">
                <span className="text-cyan-500 font-black text-[10px] uppercase tracking-[0.6em]">Premium Broadcast</span>
                <div className="w-12 h-px bg-cyan-500/30" />
              </div>
              <h3 className="text-6xl font-black uppercase italic tracking-tighter text-white leading-none">Canais de Elite</h3>
              <p className="text-[14px] font-bold text-white/30 uppercase tracking-[0.5em] mt-4">Navegação Mercedes-Benz • Use as Setas do Teclado</p>
            </div>
            <div className="flex gap-6">
              <button 
                onClick={() => {
                  const idx = LIVE_CHANNELS.findIndex(c => c.id === currentChannel.id);
                  onChannelChange(LIVE_CHANNELS[(idx - 1 + LIVE_CHANNELS.length) % LIVE_CHANNELS.length]);
                }}
                className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-cyan-500 hover:border-cyan-500 transition-all flex items-center justify-center shadow-2xl group"
              >
                <ChevronLeft className="w-10 h-10 group-active:scale-75 transition-transform" />
              </button>
              <button 
                onClick={() => {
                  const idx = LIVE_CHANNELS.findIndex(c => c.id === currentChannel.id);
                  onChannelChange(LIVE_CHANNELS[(idx + 1) % LIVE_CHANNELS.length]);
                }}
                className="w-20 h-20 rounded-[32px] bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-cyan-500 hover:border-cyan-500 transition-all flex items-center justify-center shadow-2xl group"
              >
                <ChevronRight className="w-10 h-10 group-active:scale-75 transition-transform" />
              </button>
            </div>
          </div>

          <div className="relative h-80 flex items-center justify-center perspective-[3000px] z-10">
            <div className="flex gap-16 items-center">
              {LIVE_CHANNELS.map((ch, index) => {
                const currentIndex = LIVE_CHANNELS.findIndex(c => c.id === currentChannel.id);
                const offset = index - currentIndex;
                const isActive = offset === 0;
                
                return (
                  <motion.div
                    key={ch.id}
                    initial={false}
                    animate={{
                      x: offset * 380,
                      scale: isActive ? 1.3 : 0.75,
                      z: isActive ? 200 : -400,
                      rotateY: offset * -25,
                      opacity: Math.abs(offset) > 2 ? 0 : 1 - Math.abs(offset) * 0.4,
                    }}
                    transition={{ type: 'spring', stiffness: 200, damping: 25 }}
                    onClick={() => onChannelChange(ch)}
                    className={`absolute w-[450px] aspect-video rounded-[56px] overflow-hidden cursor-pointer border-4 transition-all duration-700 ${isActive ? 'border-white shadow-[0_0_100px_rgba(255,255,255,0.4)]' : 'border-white/5 grayscale hover:grayscale-0'}`}
                  >
                    <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent transition-opacity ${isActive ? 'opacity-90' : 'opacity-40'}`} />
                    
                    {/* REFLECTION EFFECT */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {isActive && (
                      <div className="absolute inset-0 flex flex-col justify-end p-12">
                        <motion.div 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          className="flex items-center gap-4 mb-6"
                        >
                          <div className="flex items-center gap-3 bg-red-600 px-5 py-2 rounded-full shadow-[0_0_30px_rgba(220,38,38,0.5)]">
                            <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse" />
                            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">4K ULTRA LIVE</span>
                          </div>
                          <span className="text-cyan-400 font-black text-[11px] uppercase tracking-[0.4em]">{ch.category}</span>
                        </motion.div>
                        <motion.h4 
                          initial={{ y: 20, opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: 0.1 }}
                          className="text-4xl font-black text-white uppercase italic tracking-tighter leading-none"
                        >
                          {ch.name}
                        </motion.h4>
                      </div>
                    )}

                    {/* DYNAMIC GLOW FOR ACTIVE */}
                    {isActive && (
                      <motion.div 
                        layoutId="active-glow"
                        className="absolute inset-0 bg-white/5 pointer-events-none"
                        style={{ boxShadow: `inset 0 0 100px ${ch.color}20` }}
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .mask-fade-edges {
          mask-image: linear-gradient(to right, transparent, black 10%, black 90%, transparent);
        }
      `}} />
    </div>
  );
}
