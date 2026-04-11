/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Minimize, 
  Settings, 
  X,
  FastForward,
  Rewind,
  Shield,
  Globe
} from 'lucide-react';

export const LordPlayer = ({ 
  src, 
  title, 
  movieId, 
  media_type, 
  movieData,
  onClose 
}: { 
  src: string, 
  title: string, 
  movieId: string, 
  media_type: string,
  movieData: any,
  onClose: () => void 
}) => {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastSavedTime = useRef<number>(0);
  
  const [playing, setPlaying] = useState(true);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [seeking, setSeeking] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [isShadowBanned, setIsShadowBanned] = useState(false);
  const [showSeekIndicator, setShowSeekIndicator] = useState<{ type: 'rewind' | 'forward', visible: boolean }>({ type: 'forward', visible: false });
  const [currentProvider, setCurrentProvider] = useState('vidsrc');
  const [showProviderSelector, setShowProviderSelector] = useState(false);
  const [season, setSeason] = useState(1);
  const [episode, setEpisode] = useState(1);

  const providers = [
    { 
      id: 'vidsrc', 
      name: 'Sinal 1', 
      fullName: 'Vidsrc (Elite)',
      url: (id: string, type: string, s: number, e: number) => 
        type === 'tv' 
          ? `https://vidsrc.cc/v2/embed/tv/${id}/${s}/${e}` 
          : `https://vidsrc.cc/v2/embed/movie/${id}` 
    },
    { 
      id: 'embedsu', 
      name: 'Sinal 2', 
      fullName: 'Embed.su (Premium)',
      url: (id: string, type: string, s: number, e: number) => 
        type === 'tv' 
          ? `https://embed.su/embed/tv/${id}/${s}/${e}` 
          : `https://embed.su/embed/movie/${id}` 
    },
    { 
      id: 'superembed', 
      name: 'Sinal 3', 
      fullName: 'SuperEmbed (Global)',
      url: (id: string, type: string, s: number, e: number) => 
        type === 'tv' 
          ? `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${s}&e=${e}` 
          : `https://multiembed.mov/?video_id=${id}&tmdb=1` 
    },
  ];

  const getEmbedUrl = () => {
    if (src.includes('akamaihd.net')) return src; // Live streams
    const provider = providers.find(p => p.id === currentProvider) || providers[0];
    return provider.url(movieId, media_type, season, episode);
  };

  const isEmbed = !src.includes('akamaihd.net');

  // Monitor Shadow Ban Status
  useEffect(() => {
    if (auth.currentUser) {
      const unsub = onSnapshot(doc(db, 'users', auth.currentUser.uid), (snapshot) => {
        if (snapshot.exists()) {
          setIsShadowBanned(snapshot.data().status === 'shadow_banned');
        }
      });
      return () => unsub();
    }
  }, []);

  // Load Saved Progress
  useEffect(() => {
    const loadProgress = async () => {
      if (auth.currentUser && movieId) {
        try {
          const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', movieId);
          const snap = await getDoc(historyRef);
          if (snap.exists()) {
            const data = snap.data();
            if (data.progress > 0 && data.duration > 0) {
              // Só retomar se não estiver quase no fim (ex: 95%)
              if (data.progress < data.duration * 0.95) {
                playerRef.current?.seekTo(data.progress, 'seconds');
                lastSavedTime.current = data.progress;
              }
            }
          }
        } catch (error) {
          console.error("Erro ao carregar progresso:", error);
        }
      }
    };
    
    // Pequeno delay para garantir que o player está pronto
    const timer = setTimeout(loadProgress, 1000);
    return () => clearTimeout(timer);
  }, [movieId]);

  // Save Progress periodically
  useEffect(() => {
    const saveProgress = async () => {
      if (!auth.currentUser || !movieId || !duration || isShadowBanned) return;
      
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      // Só salvar se mudou significativamente (ex: 5 segundos)
      if (Math.abs(currentTime - lastSavedTime.current) < 5) return;

      try {
        const historyRef = doc(db, 'users', auth.currentUser.uid, 'history', movieId);
        await setDoc(historyRef, {
          movieId,
          titulo: title,
          img: movieData.img,
          bg: movieData.bg,
          progress: currentTime,
          duration: duration,
          media_type: media_type,
          lastUpdated: serverTimestamp()
        }, { merge: true });
        lastSavedTime.current = currentTime;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `users/${auth.currentUser.uid}/history/${movieId}`);
      }
    };

    const interval = setInterval(saveProgress, 10000); // Salva a cada 10 segundos
    return () => {
      clearInterval(interval);
      saveProgress(); // Salva ao fechar
    };
  }, [movieId, duration, isShadowBanned, title, movieData, media_type]);

  // Auto-hide controls
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (showControls && playing) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }
    return () => clearTimeout(timeout);
  }, [showControls, playing]);

  const handlePlayPause = () => setPlaying(!playing);
  
  const handleToggleMuted = () => setMuted(!muted);
  
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(parseFloat(e.target.value));
    setMuted(false);
  };

  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const handleProgress = (state: { played: number }) => {
    if (!seeking) {
      setPlayed(state.played);
    }
  };

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseDown = () => setSeeking(true);

  const handleSeekMouseUp = (e: React.MouseEvent<HTMLInputElement> | React.TouchEvent<HTMLInputElement>) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat((e.target as HTMLInputElement).value));
  };

  const handleDuration = (duration: number) => setDuration(duration);

  const formatTime = (seconds: number) => {
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = date.getUTCSeconds().toString().padStart(2, '0');
    if (hh) {
      return `${hh}:${mm.toString().padStart(2, '0')}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const fastForward = () => {
    if (isLocked) return;
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(currentTime + 10);
    setShowSeekIndicator({ type: 'forward', visible: true });
    setTimeout(() => setShowSeekIndicator(prev => ({ ...prev, visible: false })), 500);
  };

  const rewind = () => {
    if (isLocked) return;
    const currentTime = playerRef.current?.getCurrentTime() || 0;
    playerRef.current?.seekTo(currentTime - 10);
    setShowSeekIndicator({ type: 'rewind', visible: true });
    setTimeout(() => setShowSeekIndicator(prev => ({ ...prev, visible: false })), 500);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch(e.key.toLowerCase()) {
        case ' ':
        case 'k':
          e.preventDefault();
          handlePlayPause();
          break;
        case 'f':
          handleToggleFullscreen();
          break;
        case 'm':
          handleToggleMuted();
          break;
        case 'arrowright':
          fastForward();
          break;
        case 'arrowleft':
          rewind();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playing, muted]);

  const Player = ReactPlayer as any;

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[200] bg-black flex items-center justify-center overflow-hidden"
      onMouseMove={() => setShowControls(true)}
      onClick={() => setShowControls(true)}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {isEmbed ? (
          <iframe
            key={`${currentProvider}-${season}-${episode}`}
            src={getEmbedUrl()}
            className="w-full h-full border-none"
            allowFullScreen
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            referrerPolicy="no-referrer"
          />
        ) : (
          <Player
            ref={playerRef}
            url={getEmbedUrl()}
            width="100%"
            height="100%"
            playing={playing && !isShadowBanned}
            volume={volume}
            muted={muted}
            playbackRate={playbackRate}
            onProgress={handleProgress}
            onDuration={handleDuration}
            onEnded={() => setPlaying(false)}
            config={{
              youtube: { 
                playerVars: { 
                  showinfo: 0, 
                  controls: 0, 
                  disablekb: 1, 
                  rel: 0 
                }
              },
              file: { attributes: { controlsList: 'nodownload' } }
            } as any}
            style={{ pointerEvents: 'none' }}
          />
        )}

        {/* OVERLAY CLICKABLE */}
        <div 
          className="absolute inset-0 z-10 cursor-pointer flex"
          onClick={() => {
            if (isLocked) {
              setShowControls(true);
              return;
            }
            handlePlayPause();
          }}
          onDoubleClick={handleToggleFullscreen}
        >
          <div className="flex-1 h-full" onDoubleClick={(e) => { e.stopPropagation(); rewind(); }} />
          <div className="flex-1 h-full" onDoubleClick={(e) => { e.stopPropagation(); fastForward(); }} />
        </div>

        {/* SEEK INDICATORS */}
        <AnimatePresence>
          {showSeekIndicator.visible && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.5 }}
              className={`absolute top-1/2 ${showSeekIndicator.type === 'forward' ? 'right-1/4' : 'left-1/4'} -translate-y-1/2 z-30 bg-black/40 backdrop-blur-xl p-8 rounded-full border border-white/10 flex flex-col items-center gap-2`}
            >
              {showSeekIndicator.type === 'forward' ? <FastForward className="w-10 h-10 text-cyan-500" /> : <Rewind className="w-10 h-10 text-cyan-500" />}
              <span className="text-xs font-black text-white uppercase tracking-widest">10s</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTROLES SUPREME */}
        <AnimatePresence>
          {showControls && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 flex flex-col justify-between pointer-events-none"
            >
              {/* TOP BAR */}
              <div className="p-8 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-start pointer-events-auto">
                <div className="flex flex-col">
                  <motion.h2 
                    initial={{ x: -20 }}
                    animate={{ x: 0 }}
                    className="text-2xl md:text-4xl font-black uppercase italic tracking-tighter text-aluminum"
                  >
                    {title} {media_type === 'tv' && `• S${season} E${episode}`}
                  </motion.h2>
                  <div className="flex flex-wrap gap-4 mt-6">
                    {providers.map((p, idx) => (
                      <button
                        key={p.id}
                        onClick={() => setCurrentProvider(p.id)}
                        className={`group relative px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] transition-all border-2 flex items-center gap-3 overflow-hidden ${currentProvider === p.id ? 'bg-white border-white text-black shadow-[0_0_40px_rgba(255,255,255,0.3)]' : 'bg-white/5 border-white/10 text-white hover:border-white/30'}`}
                      >
                        <div className={`w-2 h-2 rounded-full ${currentProvider === p.id ? 'bg-black animate-pulse' : 'bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,1)]'}`} />
                        <span className="relative z-10">Sinal {idx + 1}: {p.name}</span>
                        {currentProvider === p.id && (
                          <motion.div 
                            layoutId="active-provider-glow"
                            className="absolute inset-0 bg-white opacity-10"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </button>
                    ))}
                    {media_type === 'tv' && (
                      <div className="flex gap-3">
                        <div className="flex items-center bg-black/40 backdrop-blur-2xl border-2 border-white/10 rounded-2xl px-6 py-3 gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Temporada</span>
                          <input 
                            type="number" 
                            min={1} 
                            value={season} 
                            onChange={(e) => setSeason(parseInt(e.target.value) || 1)}
                            className="bg-transparent text-white text-[14px] font-black w-10 outline-none border-b-2 border-white/10 focus:border-cyan-500 transition-colors text-center"
                          />
                        </div>
                        <div className="flex items-center bg-black/40 backdrop-blur-2xl border-2 border-white/10 rounded-2xl px-6 py-3 gap-4">
                          <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em]">Episódio</span>
                          <input 
                            type="number" 
                            min={1} 
                            value={episode} 
                            onChange={(e) => setEpisode(parseInt(e.target.value) || 1)}
                            className="bg-transparent text-white text-[14px] font-black w-10 outline-none border-b-2 border-white/10 focus:border-cyan-500 transition-colors text-center"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setShowProviderSelector(!showProviderSelector)}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${showProviderSelector ? 'bg-gold border-gold text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                    title="Trocar Provedor de Sinal"
                  >
                    <Globe className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setIsLocked(!isLocked)}
                    className={`w-12 h-12 rounded-full border flex items-center justify-center transition-all ${isLocked ? 'bg-cyan-500 border-cyan-500 text-black' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                    title={isLocked ? "Desbloquear Controles" : "Bloquear Controles"}
                  >
                    {isLocked ? <Shield className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/20 border border-white/10 flex items-center justify-center transition-all group"
                  >
                    <X className="w-5 h-5 text-white group-hover:rotate-90 transition-transform" />
                  </button>
                </div>
              </div>

              {/* CENTER PLAY/PAUSE INDICATOR */}
              <div className="flex items-center justify-center">
                <AnimatePresence mode="wait">
                  {!playing && !isEmbed && (
                    <motion.div 
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 1.5, opacity: 0 }}
                      className="w-24 h-24 bg-cyan-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,211,238,0.5)]"
                    >
                      <Play className="w-10 h-10 text-black fill-black ml-1" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* BOTTOM CONTROLS */}
              <div className={`p-8 md:p-12 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-auto transition-all duration-500 ${isLocked ? 'translate-y-full opacity-0' : 'translate-y-0 opacity-1'}`}>
                {/* SEEK BAR */}
                <div className="group relative mb-8 flex items-center gap-4">
                  <span className="text-[10px] font-bold text-silver/40 w-12 text-right">{formatTime(played * duration)}</span>
                  <div className="flex-1 relative h-6 flex items-center">
                    <input
                      type="range"
                      min={0}
                      max={0.999999}
                      step="any"
                      value={played}
                      onMouseDown={handleSeekMouseDown}
                      onChange={handleSeekChange}
                      onMouseUp={handleSeekMouseUp}
                      className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer outline-none accent-cyan-500 z-10"
                      style={{
                        background: `linear-gradient(to right, #22d3ee ${played * 100}%, rgba(255,255,255,0.1) ${played * 100}%)`
                      }}
                    />
                    {/* GLOWING HEAD */}
                    <div 
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_15px_rgba(34,211,238,1)] pointer-events-none transition-transform group-hover:scale-125 z-20"
                      style={{ left: `calc(${played * 100}% - 8px)` }}
                    />
                  </div>
                  <span className="text-[10px] font-bold text-silver/40 w-12">{formatTime(duration)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6 md:gap-10">
                    {/* PLAY/PAUSE */}
                    <button onClick={handlePlayPause} className="text-white hover:text-cyan-400 transition-colors">
                      {playing ? <Pause className="w-8 h-8 md:w-10 md:h-10 fill-current" /> : <Play className="w-8 h-8 md:w-10 md:h-10 fill-current" />}
                    </button>

                    {/* REWIND/FORWARD */}
                    <div className="flex items-center gap-6">
                      <button onClick={rewind} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors group">
                        <RotateCcw className="w-6 h-6 group-hover:-rotate-45 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-widest">-10s</span>
                      </button>
                      <button onClick={fastForward} className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors group">
                        <RotateCw className="w-6 h-6 group-hover:rotate-45 transition-transform" />
                        <span className="text-[8px] font-black uppercase tracking-widest">+10s</span>
                      </button>
                    </div>

                    {/* VOLUME */}
                    <div className="hidden sm:flex items-center gap-4 group/vol">
                      <button onClick={handleToggleMuted} className="text-white/60 hover:text-white transition-colors">
                        {muted || volume === 0 ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                      </button>
                      <input 
                        type="range" 
                        min={0} 
                        max={1} 
                        step="any" 
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        className="w-0 group-hover/vol:w-24 transition-all duration-300 h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 md:gap-10">
                    {/* INFO BADGE */}
                    <div className="hidden lg:flex flex-col items-end">
                      <span className="text-[8px] font-black text-cyan-500 uppercase tracking-[0.3em]">Qualidade LordEngine</span>
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">4K Ultra HD • 60FPS</span>
                    </div>

                    {/* SETTINGS / SPEED */}
                    <div className="relative">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`text-white/60 hover:text-white transition-all ${showSettings ? 'rotate-90 text-cyan-400' : ''}`}
                      >
                        <Settings className="w-6 h-6" />
                      </button>
                      
                      <AnimatePresence>
                        {showSettings && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute bottom-full right-0 mb-4 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-2xl p-4 min-w-[180px] shadow-2xl"
                          >
                            <p className="text-[8px] font-black uppercase tracking-widest text-silver/20 mb-3 px-2">Velocidade de Reprodução</p>
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                              <button
                                key={rate}
                                onClick={() => {
                                  setPlaybackRate(rate);
                                  setShowSettings(false);
                                }}
                                className={`w-full text-left px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${playbackRate === rate ? 'bg-cyan-500 text-black' : 'text-white hover:bg-white/5'}`}
                              >
                                {rate === 1 ? 'Normal' : `${rate}x`}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* PROVIDER SELECTOR MODAL */}
                    <AnimatePresence>
                      {showProviderSelector && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="absolute bottom-full right-0 mb-4 bg-black/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 min-w-[280px] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
                        >
                          <div className="flex items-center gap-3 mb-6">
                            <Globe className="w-4 h-4 text-gold" />
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Provedores de Sinal</h3>
                          </div>
                          <div className="space-y-2">
                            {providers.map(p => (
                              <button
                                key={p.id}
                                onClick={() => {
                                  setCurrentProvider(p.id);
                                  setShowProviderSelector(false);
                                }}
                                className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${currentProvider === p.id ? 'bg-gold border-gold text-black' : 'bg-white/5 border-white/5 text-silver/60 hover:bg-white/10 hover:border-white/10'}`}
                              >
                                {p.name}
                                {currentProvider === p.id && <Shield className="w-3 h-3" />}
                              </button>
                            ))}
                          </div>
                          <p className="mt-6 text-[8px] font-bold text-silver/20 uppercase tracking-widest text-center leading-relaxed">
                            Se o sinal cair ou travar, <br/> alterne entre os provedores de elite.
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* FULLSCREEN */}
                    <button onClick={handleToggleFullscreen} className="text-white/60 hover:text-white transition-colors">
                      {isFullscreen ? <Minimize className="w-6 h-6" /> : <Maximize className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LOADING INDICATOR */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <AnimatePresence>
            {(!duration && !isEmbed || isShadowBanned) ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin mb-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-500 animate-pulse">Buffers de Elite Ativos</span>
              </motion.div>
            ) : isEmbed && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-32 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-xl px-6 py-3 rounded-full border border-white/10 flex items-center gap-3"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black text-white uppercase tracking-widest">Sinal de Elite Estabilizado</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
