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
  Search,
  Tv,
  ChevronRight,
  ChevronLeft,
  Share2,
  Clock,
  Info,
  Calendar
} from 'lucide-react';
import { LIVE_CHANNELS } from '../constants/channels';

const CATEGORIES = [
  { id: 'featured', name: 'Featured' },
  { id: 'cinema', name: 'Movies' },
  { id: 'esportes', name: 'Sports' },
  { id: 'noticias', name: 'News' },
  { id: 'documentarios', name: 'Documentaries' },
  { id: 'kids', name: 'Kids' },
];

// Mock EPG Data Generation
const generateEPG = (channelId: string) => {
  const now = new Date();
  const startOfHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0);
  
  return [
    { 
      id: `${channelId}-1`, 
      title: 'MasterChef Brasil', 
      description: 'Chefs amadores competem para se tornarem os melhores cozinheiros amadores do Brasil.',
      start: startOfHour, 
      duration: 60, // minutes
      rating: 'TV-PG'
    },
    { 
      id: `${channelId}-2`, 
      title: 'Z Nation', 
      description: 'Um grupo de sobreviventes tenta atravessar o país com a única pessoa que sobreviveu a uma mordida de zumbi.',
      start: new Date(startOfHour.getTime() + 60 * 60000), 
      duration: 45,
      rating: 'TV-14'
    },
    { 
      id: `${channelId}-3`, 
      title: 'Cops', 
      description: 'Siga policiais reais em patrulha enquanto eles respondem a chamados e prendem criminosos.',
      start: new Date(startOfHour.getTime() + 105 * 60000), 
      duration: 30,
      rating: 'TV-MA'
    },
    { 
      id: `${channelId}-4`, 
      title: 'Highway to Heaven', 
      description: 'Um anjo enviado à Terra ajuda pessoas em dificuldades.',
      start: new Date(startOfHour.getTime() + 135 * 60000), 
      duration: 60,
      rating: 'TV-G'
    }
  ];
};

interface LiveTVProps {
  onClose: () => void;
  currentChannel: typeof LIVE_CHANNELS[0];
  onChannelChange: (channel: typeof LIVE_CHANNELS[0]) => void;
}

export default function LiveTV({ onClose, currentChannel, onChannelChange }: LiveTVProps) {
  const [selectedCategory, setSelectedCategory] = useState('featured');
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeEPG, setActiveEPG] = useState(generateEPG(currentChannel.id)[0]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update EPG when channel changes
  useEffect(() => {
    setActiveEPG(generateEPG(currentChannel.id)[0]);
  }, [currentChannel]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const currentIndex = LIVE_CHANNELS.findIndex(c => c.id === currentChannel.id);
      if (e.key === 'ArrowDown') {
        const nextIndex = (currentIndex + 1) % LIVE_CHANNELS.length;
        onChannelChange(LIVE_CHANNELS[nextIndex]);
      } else if (e.key === 'ArrowUp') {
        const prevIndex = (currentIndex - 1 + LIVE_CHANNELS.length) % LIVE_CHANNELS.length;
        onChannelChange(LIVE_CHANNELS[prevIndex]);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentChannel, onChannelChange, onClose]);

  // Pre-fetching Manifests
  useEffect(() => {
    // Warm up cache for all channel manifests
    LIVE_CHANNELS.forEach(channel => {
      if (channel.stream) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = channel.stream;
        link.as = 'fetch';
        document.head.appendChild(link);
      }
    });
  }, []);

  useEffect(() => {
    const initPlayer = () => {
      if (videoRef.current && currentChannel.stream) {
        setLoading(true);
        if (Hls.isSupported()) {
          if (hlsRef.current) hlsRef.current.destroy();
          const hls = new Hls({ 
            enableWorker: true, 
            lowLatencyMode: true,
            liveSyncDurationCount: 3,
            maxBufferLength: 4, // Fragmentação agressiva
            startLevel: 0,
            capLevelToPlayerSize: true,
            abrEwmaDefaultEstimate: 50000, // Prioridade de primeiro frame
          });
          hls.loadSource(currentChannel.stream);
          hls.attachMedia(videoRef.current);
          hlsRef.current = hls;
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            if (playing) videoRef.current?.play().catch(() => setPlaying(false));
          });

          // Reconexão Automática (500ms)
          hls.on(Hls.Events.ERROR, (event, data) => {
            if (data.fatal) {
              switch (data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR:
                  setTimeout(() => hls.startLoad(), 500);
                  break;
                case Hls.ErrorTypes.MEDIA_ERROR:
                  setTimeout(() => hls.recoverMediaError(), 500);
                  break;
                default:
                  setTimeout(() => initPlayer(), 500);
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
    return () => { if (hlsRef.current) hlsRef.current.destroy(); };
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
    controlsTimeoutRef.current = setTimeout(() => { if (playing) setShowControls(false); }, 3000);
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

  const timeSlots = ['7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM', '9:30 PM', '10:00 PM'];

  return (
    <div className="fixed inset-0 z-[300] bg-[#1a0a0a] flex flex-col overflow-hidden font-sans text-white selection:bg-red-600">
      {/* TOP NAVIGATION BAR (PLEX STYLE) */}
      <header className="h-16 md:h-20 px-4 md:px-10 flex items-center justify-between bg-gradient-to-b from-black/60 to-transparent z-50">
        <div className="flex items-center gap-4 md:gap-12">
          <button 
            onClick={onClose}
            className="flex items-center gap-2 text-white/40 hover:text-white transition-all group mr-2"
          >
            <ChevronLeft className="w-5 h-5 md:w-6 md:h-6 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.2em] hidden sm:block">Voltar</span>
          </button>

          <div className="flex items-center gap-2 cursor-pointer group" onClick={onClose}>
             <div className="w-8 h-8 md:w-10 md:h-10 bg-orange-500 rounded-lg flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)] group-hover:scale-110 transition-transform">
               <Tv className="w-4 h-4 md:w-6 md:h-6 text-black" />
             </div>
             <span className="text-lg md:text-2xl font-black italic tracking-tighter uppercase text-white">Lord Vision</span>
          </div>
          
          <nav className="hidden lg:flex items-center gap-8">
            <button className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Filmes</button>
            <button className="text-sm font-bold uppercase tracking-widest text-white border-b-2 border-orange-500 pb-1">TV em Direto</button>
            <button className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">A Pedido</button>
            <button className="text-sm font-bold uppercase tracking-widest text-white/40 hover:text-white transition-colors">Descobrir</button>
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-8">
          <div className="relative group hidden sm:block">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 group-focus-within:text-orange-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar..." 
              className="bg-white/5 border border-white/10 rounded-full py-2 md:py-2.5 pl-10 md:pl-12 pr-4 md:pr-6 text-[10px] md:text-xs font-bold focus:outline-none focus:border-orange-500/50 focus:bg-white/10 transition-all w-32 md:w-64"
            />
          </div>
          <button onClick={onClose} className="lg:hidden w-8 h-8 flex items-center justify-center bg-white/5 rounded-full">
            <X className="w-4 h-4" />
          </button>
          <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-br from-orange-400 to-red-600 border-2 border-white/20 flex items-center justify-center font-black text-xs md:text-sm shadow-lg">
            L
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative">
        {/* HERO SECTION (ACTIVE CHANNEL INFO) */}
        <section className="px-4 md:px-10 py-6 md:py-12 flex flex-col lg:flex-row gap-6 md:gap-12 items-start relative min-h-[450px]">
          {/* PLAYER PREVIEW */}
          <div 
            ref={containerRef}
            className="relative w-full lg:w-[550px] aspect-video rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-black group"
            onMouseMove={handleMouseMove}
          >
            <video 
              ref={videoRef}
              className="w-full h-full object-contain"
              onClick={() => setPlaying(!playing)}
              playsInline
              preload="metadata"
            />
            
            {/* AMBILIGHT GLOW */}
            <div 
              className="absolute inset-0 opacity-30 blur-[100px] pointer-events-none transition-colors duration-1000"
              style={{ backgroundColor: currentChannel.color }}
            />

            {/* LOADING STATE */}
            <AnimatePresence>
              {loading && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                >
                  <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white animate-pulse">Sincronizando sinal...</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* PLAYER CONTROLS OVERLAY */}
            <AnimatePresence>
              {showControls && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center"
                >
                  <button onClick={() => setPlaying(!playing)} className="w-12 h-12 md:w-16 md:h-16 bg-orange-500 rounded-full flex items-center justify-center text-black shadow-2xl hover:scale-110 transition-transform">
                    {playing ? <Pause className="w-6 h-6 md:w-8 md:h-8 fill-current" /> : <Play className="w-6 h-6 md:w-8 md:h-8 fill-current ml-1" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SHOW INFO */}
          <div className="flex-1 flex flex-col pt-0 md:pt-4">
            <div className="flex items-center gap-4 mb-4 md:mb-6">
              <div className="bg-orange-500 text-black px-2 md:px-3 py-0.5 md:py-1 rounded font-black text-[8px] md:text-[10px] uppercase tracking-widest">TV-PG</div>
              <div className="text-white/40 font-bold text-[10px] md:text-xs uppercase tracking-widest">E4 • 1 min restante</div>
            </div>
            
            <h1 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter text-white mb-2">{activeEPG.title}</h1>
            <h2 className="text-lg md:text-2xl font-bold text-white/60 mb-6 md:mb-8">{currentChannel.name}</h2>
            
            <div className="flex gap-3 md:gap-4 mb-6 md:mb-10">
              <button className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 md:px-8 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-all">
                <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Partilhar</span>
              </button>
              <button className="bg-white/10 hover:bg-white/20 border border-white/10 px-4 md:px-8 py-2 md:py-3 rounded-xl flex items-center gap-2 md:gap-3 transition-all">
                <Info className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-[10px] md:text-sm font-bold uppercase tracking-widest">Mais Info</span>
              </button>
            </div>

            <p className="text-sm md:text-xl text-white/40 leading-relaxed max-w-3xl font-medium line-clamp-4 md:line-clamp-none">
              {activeEPG.description}
            </p>
          </div>
        </section>

        {/* CATEGORY FILTER BAR */}
        <section className="px-4 md:px-10 mb-4 md:mb-8">
          <div className="flex items-center gap-2 md:gap-4 overflow-x-auto no-scrollbar py-2 md:py-4 border-b border-white/5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 md:px-8 py-2 md:py-2.5 rounded-full text-[10px] md:text-xs font-black uppercase tracking-[0.2em] transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-white text-black shadow-xl' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </section>

        {/* EPG GRID (THE CORE) */}
        <section className="px-4 md:px-10 pb-20">
          {/* TIME HEADER */}
          <div className="flex items-center mb-4 md:mb-6 sticky top-0 bg-[#1a0a0a] z-40 py-2 md:py-4 border-b border-white/5">
            <div className="w-32 md:w-64 flex items-center gap-2 md:gap-3">
              <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-orange-500">Hoje</span>
              <ChevronRight className="w-3 h-3 md:w-4 md:h-4 text-white/20" />
            </div>
            <div className="flex-1 flex">
              {timeSlots.map(time => (
                <div key={time} className="flex-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white/20 border-l border-white/5 pl-2 md:pl-4">
                  {time}
                </div>
              ))}
            </div>
            <div className="hidden md:flex gap-2 ml-4">
              <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><ChevronLeft className="w-4 h-4" /></button>
              <button className="p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-all"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>

          {/* CHANNEL ROWS */}
          <div className="flex flex-col gap-1 overflow-x-auto md:overflow-visible">
            <div className="min-w-[800px] md:min-w-0 flex flex-col gap-1">
              {LIVE_CHANNELS.map(channel => {
                const epg = generateEPG(channel.id);
                const isActive = currentChannel.id === channel.id;
                
                return (
                  <div 
                    key={channel.id}
                    onClick={() => onChannelChange(channel)}
                    className={`flex items-stretch group cursor-pointer transition-all ${isActive ? 'bg-orange-500/10' : 'hover:bg-white/5'}`}
                  >
                    {/* CHANNEL LOGO & NAME */}
                    <div className="w-32 md:w-64 p-2 md:p-4 flex flex-col md:flex-row items-center gap-2 md:gap-6 border-r border-white/5 bg-black/40 backdrop-blur-xl">
                      <div className="w-12 md:w-16 aspect-video rounded-lg overflow-hidden bg-[#121212] border border-white/10 p-1 md:p-1.5 flex items-center justify-center">
                        <img src={channel.logo} alt={channel.name} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex flex-col items-center md:items-start text-center md:text-left">
                        <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-white group-hover:text-orange-500 transition-colors line-clamp-1">{channel.name}</span>
                        <span className="text-[8px] md:text-[9px] font-bold text-white/20 uppercase tracking-widest mt-0.5 md:mt-1">{channel.quality}</span>
                      </div>
                    </div>

                    {/* SHOW TIMELINE */}
                    <div className="flex-1 flex bg-white/[0.01] backdrop-blur-md">
                      {epg.map((show, idx) => (
                        <div 
                          key={show.id}
                          className={`p-2 md:p-4 border-l border-white/5 flex flex-col justify-center transition-all relative overflow-hidden group/show ${idx === 0 && isActive ? 'bg-orange-500/20 backdrop-blur-lg' : 'hover:bg-white/10'}`}
                          style={{ flex: show.duration / 30 }}
                        >
                          <span className="text-[10px] md:text-xs font-black uppercase tracking-tight text-white/80 line-clamp-1 group-hover/show:text-orange-500 transition-colors">{show.title}</span>
                          <div className="flex items-center gap-2 mt-0.5 md:mt-1">
                            <span className="text-[8px] md:text-[9px] font-bold text-white/30 uppercase tracking-widest">{show.duration} min restante</span>
                            {idx === 0 && <div className="w-1 md:w-1.5 h-1 md:h-1.5 bg-orange-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(249,115,22,1)]" />}
                          </div>
                          
                          {/* PROGRESS BAR FOR CURRENT SHOW */}
                          {idx === 0 && (
                            <div className="absolute bottom-0 left-0 h-0.5 bg-orange-500/30 w-full">
                              <motion.div 
                                initial={{ width: 0 }}
                                animate={{ width: '40%' }}
                                className="h-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.5)]"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
