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
  ChevronLeft
} from 'lucide-react';

const CATEGORIES = [
  { id: 'esportes', name: 'Esportes', icon: Dribbble },
  { id: 'cinema', name: 'Cinema', icon: Film },
  { id: 'noticias', name: 'Notícias', icon: Newspaper },
  { id: 'documentarios', name: 'Documentários', icon: Globe },
];

const LIVE_CHANNELS = [
  {
    id: 'lord-sports-1',
    name: 'Lord Sports Premium',
    category: 'esportes',
    logo: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD',
    color: '#22d3ee'
  },
  {
    id: 'lord-cinema-1',
    name: 'Lord Cinema Elite',
    category: 'cinema',
    logo: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD',
    color: '#f59e0b'
  },
  {
    id: 'lord-news-1',
    name: 'Lord News 24h',
    category: 'noticias',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=2070&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD',
    color: '#ef4444'
  },
  {
    id: 'lord-nature-1',
    name: 'Lord Nature Global',
    category: 'documentarios',
    logo: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD',
    color: '#10b981'
  },
  {
    id: 'lord-music-1',
    name: 'Lord Music Live',
    category: 'cinema',
    logo: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2070&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD',
    color: '#a855f7'
  },
  {
    id: 'lord-tech-1',
    name: 'Lord Tech World',
    category: 'noticias',
    logo: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD',
    color: '#3b82f6'
  },
];

export default function LiveTV({ onClose }: { onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState('esportes');
  const [currentChannel, setCurrentChannel] = useState(LIVE_CHANNELS[0]);
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
    <div className="fixed inset-0 z-[300] bg-[#050505] flex overflow-hidden selection:bg-cyan-500 font-sans text-white">
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
      <aside className="w-24 md:w-28 bg-black/60 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-12 gap-12 z-50">
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
        <section className="flex-[0.65] p-6 md:p-8 flex items-center justify-center">
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

            <video 
              ref={videoRef}
              className="w-full h-full object-contain"
              onClick={() => setPlaying(!playing)}
              playsInline
            />

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
              
              <div className="flex items-center gap-4">
                <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-5 py-2.5 rounded-full flex items-center gap-3">
                  <Zap className="w-4 h-4 text-cyan-500" />
                  <span className="font-black text-[10px] tracking-widest uppercase text-white/60">Latência Zero Ativada</span>
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

                    {/* ZAPPING BAR (TROCA RÁPIDA) */}
                    <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar mask-fade-edges">
                      {LIVE_CHANNELS.map(ch => (
                        <button
                          key={ch.id}
                          onClick={() => setCurrentChannel(ch)}
                          className={`flex-shrink-0 group relative w-48 h-24 rounded-[24px] overflow-hidden border-2 transition-all duration-500 ${currentChannel.id === ch.id ? 'border-cyan-500 scale-105 shadow-[0_0_30px_rgba(34,211,238,0.3)]' : 'border-white/5 hover:border-white/20'}`}
                        >
                          <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-70 transition-opacity" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 text-left">
                            <p className="text-[9px] font-black uppercase tracking-widest text-white truncate">{ch.name}</p>
                            <span className="text-[7px] font-bold text-cyan-500 uppercase tracking-widest">{ch.quality}</span>
                          </div>
                          {currentChannel.id === ch.id && (
                            <div className="absolute top-3 right-3 w-2 h-2 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)] animate-pulse" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* GRID DINÂMICO DE ALTO PADRÃO (GLASSMORPHISM) */}
        <section className="flex-[0.35] px-10 pb-10 overflow-hidden flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <h3 className="text-3xl font-black uppercase italic tracking-tighter text-white">Grade de Canais</h3>
              <p className="text-[10px] font-bold text-silver/40 uppercase tracking-[0.4em] mt-1">Lord Vision • Transmissão via Fibra Direct</p>
            </div>
            <div className="flex gap-3">
              <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-cyan-500 transition-all flex items-center justify-center"><ChevronLeft className="w-6 h-6" /></button>
              <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-cyan-500 transition-all flex items-center justify-center"><ChevronRight className="w-6 h-6" /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 overflow-y-auto no-scrollbar pr-2">
            {filteredChannels.map(ch => (
              <motion.button
                key={ch.id}
                whileHover={{ scale: 1.05, y: -8 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentChannel(ch)}
                className={`group relative aspect-video rounded-[32px] overflow-hidden border-2 transition-all duration-700 ${currentChannel.id === ch.id ? 'bg-white/10 border-cyan-500 shadow-[0_0_60px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/10 hover:border-white/30'}`}
              >
                <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-90 transition-all duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute top-5 right-5">
                  <div className="flex items-center gap-2 bg-red-600 px-3 py-1 rounded-full shadow-xl">
                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-white">Live</span>
                  </div>
                </div>

                <div className="absolute bottom-6 left-6 right-6 text-left">
                  <p className="text-sm font-black uppercase italic tracking-tighter text-white mb-1 truncate">{ch.name}</p>
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-1 bg-cyan-500 rounded-full" />
                    <span className="text-[9px] font-bold text-silver/40 uppercase tracking-widest">{ch.quality}</span>
                  </div>
                </div>

                {/* DYNAMIC SHINE EFFECT */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1000 pointer-events-none">
                  <div 
                    className="absolute -inset-20 blur-[80px] opacity-20 animate-pulse"
                    style={{ backgroundColor: ch.color }}
                  />
                  <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                </div>
              </motion.button>
            ))}
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
