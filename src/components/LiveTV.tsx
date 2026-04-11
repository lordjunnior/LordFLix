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
    quality: '4K Ultra HD'
  },
  {
    id: 'lord-cinema-1',
    name: 'Lord Cinema Elite',
    category: 'cinema',
    logo: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD'
  },
  {
    id: 'lord-news-1',
    name: 'Lord News 24h',
    category: 'noticias',
    logo: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=2070&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD'
  },
  {
    id: 'lord-nature-1',
    name: 'Lord Nature Global',
    category: 'documentarios',
    logo: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop',
    stream: 'https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8',
    quality: '4K Ultra HD'
  },
];

export default function LiveTV({ onClose }: { onClose: () => void }) {
  const [selectedCategory, setSelectedCategory] = useState('esportes');
  const [currentChannel, setCurrentChannel] = useState(LIVE_CHANNELS[0]);
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showZapping, setShowZapping] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && currentChannel.stream) {
      if (Hls.isSupported()) {
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hls.loadSource(currentChannel.stream);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (playing) videoRef.current?.play();
        });
      } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = currentChannel.stream;
        videoRef.current.addEventListener('loadedmetadata', () => {
          if (playing) videoRef.current?.play();
        });
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [currentChannel, playing]);

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
    <div className="fixed inset-0 z-[300] bg-zinc-950 flex overflow-hidden selection:bg-cyan-500">
      {/* NAVEGAÇÃO LATERAL MAGNÉTICA */}
      <aside className="w-24 md:w-32 bg-black/40 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center py-10 gap-10">
        <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
          <Tv className="w-6 h-6 text-black" />
        </div>
        
        <nav className="flex flex-col gap-6">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`group relative flex flex-col items-center gap-2 transition-all ${selectedCategory === cat.id ? 'text-cyan-400' : 'text-silver/40 hover:text-white'}`}
            >
              <div className={`p-4 rounded-2xl transition-all duration-500 ${selectedCategory === cat.id ? 'bg-cyan-500/10 border border-cyan-500/20' : 'bg-transparent border border-transparent'}`}>
                <cat.icon className="w-6 h-6" />
              </div>
              <span className="text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">{cat.name}</span>
              {selectedCategory === cat.id && (
                <motion.div 
                  layoutId="active-cat"
                  className="absolute -left-4 w-1 h-8 bg-cyan-500 rounded-full shadow-[0_0_15px_rgba(34,211,238,1)]"
                />
              )}
            </button>
          ))}
        </nav>

        <button 
          onClick={onClose}
          className="mt-auto w-12 h-12 rounded-2xl bg-white/5 hover:bg-red-500/20 border border-white/10 flex items-center justify-center transition-all group"
        >
          <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
        </button>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* PLAYER CINEMATIC VIEW */}
        <section className="flex-[0.7] p-6 md:p-10 flex items-center justify-center relative">
          <div 
            ref={containerRef}
            className="relative w-full max-w-6xl aspect-video group overflow-hidden rounded-[40px] border border-cyan-500/20 shadow-[0_0_100px_rgba(0,0,0,0.8)] bg-black"
            onMouseEnter={() => setShowZapping(true)}
            onMouseLeave={() => setShowZapping(false)}
          >
            {/* AMBILIGHT EFFECT */}
            <div className="absolute inset-0 bg-cyan-500/5 blur-[120px] pointer-events-none" />
            
            <div className="absolute top-8 left-8 z-10 flex items-center gap-4">
              <div className="flex items-center gap-2 bg-red-600/20 border border-red-600/30 px-4 py-2 rounded-full">
                <div className="w-2 h-2 bg-red-600 rounded-full animate-ping" />
                <span className="font-black italic text-[10px] tracking-[0.2em] uppercase text-red-500">Live</span>
              </div>
              <div className="bg-black/40 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-full">
                <span className="font-black text-[10px] tracking-widest uppercase text-white/60">Sinal Satélite 1 • {currentChannel.quality}</span>
              </div>
            </div>

            <video 
              ref={videoRef}
              className="w-full h-full object-cover"
              onClick={() => setPlaying(!playing)}
            />

            {/* OVERLAY DE CONTROLE CINEMATIC */}
            <AnimatePresence>
              {showZapping && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/80 to-transparent p-10 flex flex-col justify-end gap-6"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button onClick={() => setPlaying(!playing)} className="text-white hover:text-cyan-400 transition-colors">
                        {playing ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
                      </button>
                      <div className="flex flex-col">
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{currentChannel.name}</h2>
                        <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-[0.3em]">Transmissão Estabilizada</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                        <button onClick={() => setMuted(!muted)} className="text-white/60 hover:text-white">
                          {muted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <input 
                          type="range" 
                          min={0} 
                          max={1} 
                          step="any" 
                          value={muted ? 0 : volume}
                          onChange={(e) => setVolume(parseFloat(e.target.value))}
                          className="w-24 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                        />
                      </div>
                      <button onClick={toggleFullscreen} className="text-white/60 hover:text-white">
                        {isFullscreen ? <Maximize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                      </button>
                    </div>
                  </div>

                  {/* ZAPPING BAR (TROCA RÁPIDA) */}
                  <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                    {LIVE_CHANNELS.map(ch => (
                      <button
                        key={ch.id}
                        onClick={() => setCurrentChannel(ch)}
                        className={`flex-shrink-0 group relative w-40 h-20 rounded-2xl overflow-hidden border transition-all ${currentChannel.id === ch.id ? 'border-cyan-500 ring-2 ring-cyan-500/20' : 'border-white/10 hover:border-white/30'}`}
                      >
                        <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                        <span className="absolute bottom-3 left-3 text-[8px] font-black uppercase tracking-widest text-white">{ch.name}</span>
                        {currentChannel.id === ch.id && (
                          <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-cyan-500 rounded-full shadow-[0_0_10px_rgba(34,211,238,1)]" />
                        )}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

        {/* GRID DINÂMICO COM GLASSMORPHISM */}
        <section className="flex-[0.3] px-10 pb-10 overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-sm font-black uppercase tracking-[0.4em] text-silver/40">Canais Disponíveis</h3>
            <div className="flex gap-2">
              <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-cyan-500 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-2 rounded-full bg-white/5 border border-white/10 text-white hover:bg-cyan-500 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {filteredChannels.map(ch => (
              <motion.button
                key={ch.id}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentChannel(ch)}
                className={`group relative aspect-video rounded-3xl overflow-hidden border backdrop-blur-xl transition-all duration-500 ${currentChannel.id === ch.id ? 'bg-cyan-500/10 border-cyan-500 shadow-[0_0_40px_rgba(34,211,238,0.2)]' : 'bg-white/5 border-white/10 hover:border-cyan-500/40'}`}
              >
                <img src={ch.logo} alt={ch.name} className="w-full h-full object-cover opacity-50 group-hover:opacity-80 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
                
                <div className="absolute top-4 right-4">
                  <div className="flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-full shadow-lg">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse" />
                    <span className="text-[7px] font-black uppercase tracking-widest text-white">Live</span>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4 text-left">
                  <p className="text-[10px] font-black uppercase tracking-tighter text-white mb-1 truncate">{ch.name}</p>
                  <div className="flex items-center gap-2">
                    <Zap className="w-3 h-3 text-cyan-500" />
                    <span className="text-[8px] font-bold text-silver/40 uppercase tracking-widest">{ch.quality}</span>
                  </div>
                </div>

                {/* GLOW EFFECT ON HOVER */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute -inset-20 bg-cyan-500/10 blur-[60px] animate-pulse" />
                </div>
              </motion.button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
