import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceSearch } from './components/VoiceSearch';
import GuiaTV from './components/GuiaTV';
import { LordPlayer } from './components/VideoPlayer';
import { MediaDashboard } from './components/Dashboard';
import NossaRede from './components/NossaRede';
import { LordLogin } from './components/Login';
import { getMovies, searchMovies, getVideos } from './lib/tmdb';

// 1. BANCO DE DADOS LOCAL (Integração TMDB Real)
const CATEGORIAS_INICIAIS = [
  { nome: "Filmes em Destaque", type: "movie", filmes: [] },
  { nome: "Séries Imperdíveis", type: "tv", filmes: [] },
  { nome: "Tendências Mundiais", type: "trending", filmes: [] },
  { nome: "TV Ao Vivo", type: "live", filmes: [
    { 
      id: 301, 
      titulo: "Lord News 24h", 
      nota: "9.8", 
      idade: "L", 
      kids: false, 
      ano: "LIVE",
      duracao: "Ao Vivo",
      diretor: "LordFlix Global",
      resumo: "Cobertura global em tempo real. A notícia onde ela acontece, com a clareza do 4K.",
      img: "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=2070&auto=format&fit=crop", 
      bg: "https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=2070&auto=format&fit=crop",
      src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" 
    },
    { 
      id: 302, 
      titulo: "Lord Sports Ultra", 
      nota: "9.9", 
      idade: "L", 
      kids: false, 
      ano: "LIVE",
      duracao: "Ao Vivo",
      diretor: "LordFlix Sports",
      resumo: "O ápice do esporte mundial. Sinta a adrenalina de cada jogada em HDR10+.",
      img: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop", 
      bg: "https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop",
      src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" 
    },
    { 
      id: 303, 
      titulo: "Lord Cinema One", 
      nota: "9.5", 
      idade: "14", 
      kids: false, 
      ano: "LIVE",
      duracao: "Ao Vivo",
      diretor: "LordFlix Studios",
      resumo: "Estreias exclusivas e clássicos remasterizados em loop infinito de perfeição.",
      img: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop", 
      bg: "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop",
      src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" 
    },
    { 
      id: 304, 
      titulo: "Lord Nature 4K", 
      nota: "9.7", 
      idade: "L", 
      kids: true, 
      ano: "LIVE",
      duracao: "Ao Vivo",
      diretor: "LordFlix Earth",
      resumo: "A beleza crua do planeta Terra capturada com tecnologia de ponta.",
      img: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop", 
      bg: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?q=80&w=2074&auto=format&fit=crop",
      src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8" 
    }
  ]}
];

const formatTMDBData = (data: any[]) => data.filter(i => i.poster_path).map(item => ({
  id: item.id,
  titulo: item.title || item.name,
  nota: item.vote_average ? item.vote_average.toFixed(1) : "0.0",
  idade: "14", 
  kids: false,
  ano: (item.release_date || item.first_air_date || "").split("-")[0],
  first_air_date: item.first_air_date,
  original_name: item.original_name,
  duracao: item.runtime ? `${Math.floor(item.runtime / 60)}h ${item.runtime % 60}min` : "N/A",
  diretor: "N/A",
  resumo: item.overview,
  img: `https://image.tmdb.org/t/p/w500${item.poster_path}`,
  bg: `https://image.tmdb.org/t/p/original${item.backdrop_path || item.poster_path}`,
  src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
  trailer: "",
  media_type: item.media_type || (item.title ? "movie" : "tv")
}));

// --- COMPONENTE DE CAPA ELITE (PNL + SEO) ---
interface MoviePosterProps {
  filme: any;
  onClick: () => void;
  type?: 'release' | 'classic';
  key?: React.Key;
}

const MoviePoster = ({ filme, onClick, type }: MoviePosterProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`movie-poster-container w-full aspect-[2/3] cursor-pointer group ${type === 'release' ? 'release-glow' : ''}`}
      onClick={onClick}
    >
      {(!isLoaded && !hasError) && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-cyan-500 animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
            <span className="text-gold font-black text-xl">!</span>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-silver/40">Sinal Indisponível</p>
        </div>
      ) : (
        <img 
          src={filme.img} 
          alt={`Poster oficial do filme ${filme.titulo} - Qualidade Ultra HD`} 
          className={`movie-poster-img ${isLoaded ? 'opacity-100' : 'opacity-0'} ${type === 'classic' ? 'noir-treatment' : ''}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      )}
      <div className="vignette-layer"></div>
      
      {/* Overlay de PNL + CTA */}
      <div className="glass-pnl-overlay">
        <div className="flex justify-between items-start mb-3">
          <div className="flex gap-2">
            <span className="glass-tag">{filme.ano}</span>
            <span className="glass-tag text-cyan-400 border-cyan-400/30">4K</span>
          </div>
          {filme.ano === 'LIVE' && (
            <div className="flex items-center gap-1.5 bg-cyan-500/20 px-2 py-0.5 rounded-sm border border-cyan-500/30">
              <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
              <span className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Live</span>
            </div>
          )}
        </div>
        <h3 className="pnl-title">{filme.titulo}</h3>
        {filme.ano === 'LIVE' && (
          <div className="flex items-center gap-3 mb-2">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className={`w-0.5 h-2 rounded-full ${i <= 4 ? 'bg-cyan-500' : 'bg-white/10'}`}></div>
              ))}
            </div>
            <span className="text-[7px] font-black text-silver/40 uppercase tracking-widest">Signal: Stable</span>
          </div>
        )}
        <p className="pnl-description line-clamp-2">
          {filme.resumo || "Uma obra-prima cinematográfica que redefine o gênero."}
        </p>
        <button className="cta-supreme-mini hover:bg-cyan-500">
          {filme.ano === 'LIVE' ? 'Sintonizar Agora' : 'Assistir Agora'}
        </button>
      </div>
    </motion.div>
  );
};

export default function LordFlixSupreme() {
  // --- ESTADOS DO SISTEMA ---
  const [autenticado, setAutenticado] = useState(true);
  const [perfil, setPerfil] = useState('adulto'); 
  const [busca, setBusca] = useState(''); 
  const [mostrarPin, setMostrarPin] = useState(false); 
  const [pinDigitado, setPinDigitado] = useState(''); 
  const [pinErro, setPinErro] = useState(false); 
  const [carregado, setCarregado] = useState(false); 
  const [view, setView] = useState<'home' | 'guia' | 'rede'>('home');
  const [erroSistema, setErroSistema] = useState(false);
  const [filmeDestaque, setFilmeDestaque] = useState<any>(null);
  const [filmeSelecionado, setFilmeSelecionado] = useState<any>(null);
  const [filmeEmReproducao, setFilmeEmReproducao] = useState<any>(null);
  const [categorias, setCategorias] = useState(CATEGORIAS_INICIAIS);
  const [loading, setLoading] = useState(true);
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);

  // --- INTEGRAÇÃO TMDB REAL ---
  useEffect(() => {
    async function loadData() {
      try {
        const [movies, tv, trending] = await Promise.all([
          getMovies("movie"),
          getMovies("tv"),
          getMovies("trending")
        ]);

        const formattedMovies = formatTMDBData(movies);
        const formattedTv = formatTMDBData(tv);
        const formattedTrending = formatTMDBData(trending);

        setCategorias(prev => [
          { ...prev[0], filmes: formattedMovies },
          { ...prev[1], filmes: formattedTv },
          { ...prev[2], filmes: formattedTrending },
          prev[3] // Keep Live TV
        ]);
        
        if (formattedTrending.length > 0) {
          setFilmeDestaque(formattedTrending[0]);
        }
      } catch (error) {
        console.error("Erro ao carregar dados do TMDB:", error);
        setErroSistema(true);
      } finally {
        setLoading(false);
        setCarregado(true);
      }
    }

    loadData();
  }, []);

  // --- LÓGICA DE BUSCA REAL-TIME ---
  useEffect(() => {
    if (!busca.trim()) {
      setResultadosBusca([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setBuscando(true);
      try {
        const results = await searchMovies(busca);
        setResultadosBusca(formatTMDBData(results));
      } catch (error) {
        console.error("Erro na busca:", error);
      } finally {
        setBuscando(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [busca]);

  // --- LÓGICA DE FILTRO ---
  const categoriasFiltradas = categorias.map(cat => ({
    ...cat,
    filmes: cat.filmes.filter(filme => {
      const termo = busca.toLowerCase();
      const bateBusca = filme.titulo.toLowerCase().includes(termo);
      if (perfil === 'kids') return filme.kids && bateBusca;
      return bateBusca;
    })
  })).filter(cat => cat.filmes.length > 0);

  const handleAssistir = async (filme: any) => {
    if (filme.ano === 'LIVE') {
      setFilmeEmReproducao(filme);
      return;
    }
    try {
      const videos = await getVideos(filme.id, filme.media_type || "movie");
      const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      const src = trailer 
        ? `https://www.youtube.com/embed/${trailer.key}?autoplay=1`
        : filme.src;
      
      setFilmeEmReproducao({ ...filme, src });
    } catch (error) {
      console.error("Erro ao carregar vídeo:", error);
      setFilmeEmReproducao(filme);
    }
  };

  const handleFilmeSelecionado = async (filme: any) => {
    setFilmeSelecionado(filme);
    if (filme.ano === 'LIVE') return;
    try {
      const videos = await getVideos(filme.id, filme.media_type || "movie");
      const trailer = videos.find((v: any) => v.type === "Trailer" && v.site === "YouTube");
      if (trailer) {
        setFilmeSelecionado((prev: any) => ({
          ...prev,
          src: `https://www.youtube.com/embed/${trailer.key}?autoplay=1`
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar trailer:", error);
    }
  };

  // --- FUNÇÃO DE SENHA (PIN) ---
  const validarPin = () => {
    if (pinDigitado === "1234") {
      setPerfil('adulto');
      setMostrarPin(false);
      setPinDigitado('');
      setPinErro(false);
    } else {
      setPinErro(true);
      setPinDigitado('');
      setTimeout(() => setPinErro(false), 1000);
    }
  };

  // --- TELA DE ERRO (Fallback) ---
  if (erroSistema) {
    return (
      <div className="bg-black h-screen flex flex-col items-center justify-center text-white p-10 text-center">
        <div className="w-24 h-24 mb-8 rounded-full overflow-hidden border-2 border-cyan-500/30">
          <img src="https://picsum.photos/seed/error/200/200" alt="Erro" className="w-full h-full object-cover grayscale opacity-50" referrerPolicy="no-referrer" />
        </div>
        <h1 className="text-3xl font-black uppercase italic mb-4">O projetor está sendo ajustado</h1>
        <p className="text-silver/40 text-sm max-w-md uppercase tracking-widest leading-relaxed">
          Nossos técnicos estão calibrando a lente 4K. Tente novamente em 30 segundos para a melhor experiência.
        </p>
        <button 
          onClick={() => setErroSistema(false)}
          className="mt-10 bg-white text-black px-10 py-4 rounded-full font-black text-[10px] tracking-widest uppercase hover:bg-cyan-500 hover:text-black transition-all"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  // --- TELA DE CARREGAMENTO ---
  if (!carregado) {
    return (
      <div className="bg-black h-screen flex flex-col items-center justify-center text-white gap-8">
        <div className="w-16 h-16 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
        <span className="font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Iniciando LordFlix Supreme...</span>
      </div>
    );
  }

  // --- TELA DE LOGIN ---
  if (!autenticado) {
    return <LordLogin onLogin={() => setAutenticado(true)} />;
  }

  // --- VIEW: GUIA TV ---
  if (view === 'guia') {
    return <GuiaTV onBack={() => setView('home')} series={categorias[1].filmes} />;
  }

  // --- VIEW: NOSSA REDE ---
  if (view === 'rede') {
    return <NossaRede onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#020202] selection:bg-cyan-500 selection:text-black">
      
      {/* 1. BARRA DE NAVEGAÇÃO (NAVBAR) */}
      <nav className="fixed top-0 w-full z-[60] px-8 py-6 flex justify-between items-center glass-nav">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setView('home')}
          className="flex flex-col cursor-pointer"
        >
          <span className="text-4xl font-display font-black italic tracking-tighter">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white/40 via-white to-white/40">LORD</span>
            <span className="text-gold">FLIX</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.4em] text-gold font-black ml-1">
            Cinema para Todos
          </span>
        </motion.div>

        {/* SELETOR DE PERFIL (CONTROLE PARENTAL) */}
        <div className="flex gap-4 items-center">
          <button 
            onClick={() => setPerfil('kids')}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${perfil === 'kids' ? 'bg-white text-black' : 'bg-white/5 text-silver hover:bg-white/10'}`}
          >
            Crianças
          </button>
          <button 
            onClick={() => perfil === 'kids' ? setMostrarPin(true) : setPerfil('kids')}
            className={`px-6 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${perfil === 'adulto' ? 'bg-gold text-black' : 'bg-white/5 text-silver hover:bg-white/10'}`}
          >
            Adultos
          </button>
          <button 
            onClick={() => setAutenticado(false)}
            className="px-4 py-2 text-silver/20 hover:text-gold transition-colors text-[10px] font-black uppercase tracking-widest"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </nav>

      {/* 2. TELA DE PIN */}
      <AnimatePresence>
        {mostrarPin && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex flex-col items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-sm w-full text-center"
            >
              <div className="w-24 h-24 rounded-2xl overflow-hidden mx-auto mb-8 border border-white/10">
                <img src="https://picsum.photos/seed/lock/200/200" alt="Segurança" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
              </div>
              <h2 className="text-2xl font-black mb-2 uppercase tracking-[0.3em]">Digite seu PIN</h2>
              <p className="text-silver/40 text-[10px] font-bold uppercase tracking-widest mb-8">Acesso restrito a maiores de 18 anos</p>
              
              <div className="relative mb-8">
                <input 
                  type="password" 
                  maxLength={4}
                  className={`bg-white/5 border-2 ${pinErro ? 'border-cyan-500' : 'border-white/10'} text-4xl text-center w-full py-6 rounded-2xl outline-none focus:border-cyan-500/50 transition-all tracking-[0.5em] font-black`}
                  value={pinDigitado}
                  onChange={(e) => setPinDigitado(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && validarPin()}
                  autoFocus
                />
                {pinErro && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute -bottom-6 left-0 right-0 text-cyan-500 text-[10px] font-bold uppercase"
                  >
                    PIN Incorreto. Tente novamente.
                  </motion.p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={validarPin} 
                  className="bg-white text-black w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-gold hover:text-black transition-all"
                >
                  Confirmar
                </button>
                <button 
                  onClick={() => {
                    setMostrarPin(false);
                    setPinDigitado('');
                    setPinErro(false);
                  }} 
                  className="text-silver/30 hover:text-silver py-2 font-bold uppercase text-[10px] tracking-widest transition-all"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. PLAYER DE VÍDEO */}
      <AnimatePresence>
        {filmeEmReproducao && (
          <LordPlayer 
            src={filmeEmReproducao.src} 
            title={filmeEmReproducao.titulo} 
            onClose={() => setFilmeEmReproducao(null)} 
          />
        )}
      </AnimatePresence>

      {/* 3. HERO SECTION (FULL-BLEED ELITE HERO CAROUSEL) */}
      <section className="relative h-[90vh] min-h-[600px] w-screen overflow-hidden flex flex-col justify-center bg-black">
        {/* 1. A IMAGEM DE FORA A FORA (Full-Bleed Backdrop) - Ken Burns Effect */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            {filmeDestaque && (
              <motion.img 
                key={filmeDestaque.id}
                initial={{ scale: 1, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 0.7 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                src={filmeDestaque.bg} 
                alt="Destaque Sci-Fi LordFlix" 
                className="w-full h-full object-cover object-top animate-subtle-zoom"
                referrerPolicy="no-referrer"
                // @ts-ignore - fetchPriority is supported in modern browsers/React
                fetchPriority="high"
              />
            )}
          </AnimatePresence>
          
          {/* 2. O FADE CINEMATOGRÁFICO (Vignette Profunda) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-[#050505]/40 to-transparent z-10"></div>
        </div>

        {/* 3. O CONTEÚDO (Trio de Experiência: CTA + SEO + PNL) */}
        <div className="relative z-20 h-full w-full flex flex-col justify-center px-8 md:px-20 lg:px-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-6xl"
          >
            {/* Tag de Autoridade (SEO + PNL) */}
            <span className="text-cyan-400 font-black tracking-[0.5em] mb-4 text-xs md:text-sm uppercase drop-shadow-neon block">
              LORDFLIX EXCLUSIVE • SCI-FI DESTINY
            </span>

            <h1 className="text-6xl md:text-8xl lg:text-[10rem] font-black text-white leading-[0.8] tracking-tighter uppercase mb-6">
              ALÉM DO <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">HORIZONTE</span>
            </h1>
            
            <p className="max-w-2xl text-zinc-300 text-lg md:text-2xl font-light leading-relaxed mb-10 drop-shadow-md">
              Onde a tecnologia encontra a nostalgia. Vivencie o épico em cada pixel da LORDFLIX.
            </p>

            {/* Busca Centralizada Estilo TMDB Elite com Voice Search Integrado */}
            <div className="relative group mb-12 max-w-2xl">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-blue-900/50 rounded-full blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-full shadow-2xl overflow-hidden">
                <input 
                  type="text" 
                  placeholder="O que você quer assistir hoje?"
                  className="w-full bg-transparent text-black py-5 md:py-6 px-8 text-lg outline-none font-medium placeholder:text-zinc-400"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <div className="flex items-center gap-2 pr-4">
                  <VoiceSearch onResult={(text) => setBusca(text)} />
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-800 text-white px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-500/30">
                    Buscar
                  </button>
                </div>
              </div>
            </div>

            {/* TRIO DE EXPERIÊNCIA: CTA + PNL */}
            <div className="flex flex-wrap gap-6">
              <button 
                onClick={() => handleAssistir(filmeDestaque)}
                className="bg-cyan-500 text-black px-12 py-5 font-black text-xl hover:bg-white transition-all transform hover:scale-110 active:scale-95 shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              >
                ASSISTIR AGORA
              </button>
              <button 
                onClick={() => handleFilmeSelecionado(filmeDestaque)}
                className="border-2 border-white/20 px-12 py-5 font-black text-xl text-white backdrop-blur-md hover:bg-white/10 transition-all"
              >
                DETALHES
              </button>
            </div>
          </motion.div>
        </div>

        {/* 4. SEO TÉCNICO: SCHEMA MARKUP JSON-LD */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Movie",
            "name": "ALÉM DO HORIZONTE - LORDFLIX",
            "image": filmeDestaque?.img,
            "description": "Onde a tecnologia encontra a nostalgia. Vivencie o épico em cada pixel da LORDFLIX.",
            "genre": "Ficção Científica",
            "contentRating": "14+",
            "isFamilyFriendly": "false"
          })}
        </script>
      </section>

      {/* 4. CONTEÚDO PRINCIPAL (TRILHOS SUPREMOS) */}
      <main id="catalogo" className="relative z-10 -mt-20 space-y-24 pb-32">
        
        {/* SEÇÃO DE RESULTADOS DA BUSCA */}
        <AnimatePresence>
          {busca.trim() !== "" && (
            <motion.section 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="px-8 md:px-20 overflow-hidden"
            >
              <div className="flex items-center gap-6 mb-10">
                <h2 className="text-3xl font-sans font-black uppercase tracking-tighter">Resultados para: {busca}</h2>
                {buscando && (
                  <div className="w-6 h-6 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
                )}
              </div>

              {resultadosBusca.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pb-8">
                  {resultadosBusca.map((filme) => (
                    <MoviePoster 
                      key={`search-${filme.id}`} 
                      filme={filme} 
                      onClick={() => handleFilmeSelecionado(filme)} 
                    />
                  ))}
                </div>
              ) : !buscando && (
                <p className="text-silver/20 uppercase tracking-widest font-black text-sm py-10">Nenhum título encontrado no catálogo LordFlix.</p>
              )}
              <div className="h-px bg-white/5 w-full mt-10"></div>
            </motion.section>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          categoriasFiltradas.map((cat, idx) => (
            <section key={idx} className="px-8 md:px-20">
              <div className="flex items-center gap-6 mb-10">
                <h2 className="text-3xl font-sans font-black uppercase tracking-tighter">{cat.nome}</h2>
                <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                  <span className={`px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cat.type === 'live' ? 'bg-cyan-500 text-black' : 'bg-gold text-black'}`}>
                    {cat.type === 'live' ? 'Live' : 'Premium'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4 pb-8">
                {cat.filmes.map((filme) => (
                  <MoviePoster 
                    key={filme.id} 
                    filme={filme} 
                    type={idx === 0 ? "release" : undefined}
                    onClick={() => handleFilmeSelecionado(filme)} 
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {/* GRADE DE PROGRAMAÇÃO SUPREME (TV) */}
        <section className="px-8 md:px-20">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-4xl font-display font-black uppercase italic tracking-tighter">Grade de Programação Supreme</h2>
              <p className="text-silver/20 uppercase tracking-[0.3em] text-[10px] font-bold mt-2">A programação que não dorme. Onde as séries de elite encontram seu lar.</p>
            </div>
            <button 
              onClick={() => setView('guia')}
              className="border border-gold text-gold px-8 py-3 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-gold hover:text-black transition-all"
            >
              Acessar Grade Supreme
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categorias[3].filmes.slice(0, 4).map((item) => (
              <div 
                key={`tv-guide-${item.id}`} 
                onClick={() => handleFilmeSelecionado(item)}
                className="group relative bg-zinc-900 border-b border-cyan-500/20 hover:border-cyan-500 transition-all cursor-pointer rounded-xl overflow-hidden"
              >
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={item.bg || item.img} 
                    alt={item.titulo} 
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
                      <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
                      <span className="text-[8px] font-black text-white uppercase tracking-widest">On Air</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-black bg-cyan-500 text-black px-2 py-0.5 uppercase">
                      Lord Broadcast
                    </span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`w-0.5 h-2 rounded-full ${i <= 4 ? 'bg-cyan-500' : 'bg-white/10'}`}></div>
                      ))}
                    </div>
                  </div>
                  <h3 className="text-white font-bold text-lg truncate group-hover:text-cyan-500 transition-colors">
                    {item.titulo}
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">
                    {item.ano} • {item.titulo.includes('Sports') ? 'Sports Network' : item.titulo.includes('News') ? 'Global News' : 'Premium Content'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* DASHBOARD DE MONITORAMENTO (AUTORIDADE) */}
        <div className="max-w-4xl mx-auto px-10">
          <MediaDashboard />
        </div>
      </main>

      {/* 5.5 MODAL DE DETALHES DO FILME */}
      <AnimatePresence>
        {filmeSelecionado && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-6xl w-full bg-[#050505] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl flex flex-col md:flex-row relative"
            >
              <button 
                onClick={() => setFilmeSelecionado(null)}
                className="absolute top-8 right-8 z-50 bg-white/5 hover:bg-cyan-500 hover:text-black px-6 py-3 rounded-full transition-all text-[10px] font-black uppercase tracking-widest text-white"
              >
                Fechar
              </button>

              {/* Lado Esquerdo: Capa e Background */}
              <div className="w-full md:w-1/2 relative h-[400px] md:h-auto">
                <img 
                  src={filmeSelecionado.bg || filmeSelecionado.img} 
                  alt={filmeSelecionado.titulo} 
                  className="w-full h-full object-cover opacity-60"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-[#050505] via-transparent to-transparent hidden md:block"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent md:hidden"></div>
                
                <div className="absolute bottom-10 left-10">
                  <div className="imdb-badge mb-4">RATING {filmeSelecionado.nota}</div>
                  <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter leading-none text-white">
                    {filmeSelecionado.titulo}
                  </h2>
                </div>
              </div>

              {/* Lado Direito: Informações */}
              <div className="w-full md:w-1/2 p-10 md:p-20 flex flex-col justify-center">
                {/* Breadcrumbs (SEO Authority) */}
                <div className="flex items-center gap-2 mb-6 text-[9px] font-black uppercase tracking-[0.2em] text-silver/20">
                  <span className="hover:text-white cursor-pointer">Home</span>
                  <span>/</span>
                  <span className="hover:text-white cursor-pointer">Filmes</span>
                  <span>/</span>
                  <span className="text-cyan-500">Detalhes</span>
                </div>

                <div className="flex gap-6 mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-silver/40">
                  <span>{filmeSelecionado.ano}</span>
                  <span>{filmeSelecionado.duracao}</span>
                  <span className="text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded">{filmeSelecionado.idade}</span>
                </div>

                <p className="text-silver/60 text-lg leading-relaxed mb-10 font-medium">
                  {filmeSelecionado.resumo}
                </p>

                {/* Internal Linking (SEO Teia) */}
                <div className="mb-10">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-silver/20 mb-4">Filmes Relacionados</h4>
                  <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                    {categorias[0].filmes.slice(0, 3).map(f => (
                      <div 
                        key={`rel-${f.id}`}
                        onClick={() => handleFilmeSelecionado(f)}
                        className="w-24 aspect-[2/3] rounded-lg overflow-hidden border border-white/5 flex-shrink-0 cursor-pointer hover:border-cyan-500/50 transition-all"
                      >
                        <img src={f.img} alt={f.titulo} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 mb-12">
                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20">
                    Direção: <span className="text-white ml-2">{filmeSelecionado.diretor}</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20">
                    Qualidade: <span className="text-white ml-2">4K Ultra HD • HDR10</span>
                  </p>
                </div>

                <button 
                  onClick={() => {
                    handleAssistir(filmeSelecionado);
                    setFilmeSelecionado(null);
                  }}
                  className="bg-white text-black w-full md:w-auto px-16 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-cyan-500 hover:text-black transition-all shadow-2xl shadow-white/5"
                >
                  Assistir Agora
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. A NOVA ORDEM DO ENTRETENIMENTO (CINEMATIC SHOWCASE) */}
      <section id="experiencia" className="py-40 bg-[#020202] relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-8 md:px-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-32 gap-10">
            <div className="max-w-3xl">
              <h2 className="text-6xl md:text-9xl font-display font-black uppercase italic tracking-tighter leading-[0.85] mb-8">
                <span className="text-aluminum">O Domínio</span> <br/> <span className="text-cyan-500">Absoluto</span>
              </h2>
              <p className="text-silver/40 text-xl md:text-2xl font-light leading-relaxed">
                Não entregamos apenas pixels. Entregamos autoridade cinematográfica. Uma infraestrutura invisível desenhada para quem não aceita nada menos que a perfeição.
              </p>
            </div>
            <div className="hidden md:block text-right">
              <span className="text-[10px] font-black uppercase tracking-[0.6em] text-silver/20 block mb-4">Status da Rede</span>
              <div className="flex items-center gap-3 justify-end">
                <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></span>
                <span className="text-white font-black uppercase tracking-widest text-xs">Ultra-High Bitrate Ativo</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            {/* Feature 1: Imersão Total */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-8 h-[600px] rounded-[60px] relative overflow-hidden group cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=2070&auto=format&fit=crop" 
                alt="Cinema Experience" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition-colors duration-500"></div>
              
              <div className="absolute bottom-0 left-0 p-16 z-20">
                <span className="text-cyan-500 text-xs font-black uppercase tracking-[0.4em] mb-6 block">Tecnologia Proprietária</span>
                <h3 className="text-5xl md:text-7xl font-black uppercase italic mb-6 leading-none">Imersão <br/> Sem Limites</h3>
                <p className="text-silver/60 text-lg max-w-xl leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  Bitrate bruto. Sem compressão destrutiva. O LordFlix entrega a fidelidade original do estúdio diretamente na sua tela, sem engasgos, sem esperas.
                </p>
                <div className="mt-10 flex gap-4">
                  <div className="px-6 py-2 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">4K Native</div>
                  <div className="px-6 py-2 border border-white/20 rounded-full text-[10px] font-black uppercase tracking-widest text-white backdrop-blur-md">HDR10+</div>
                </div>
              </div>
            </motion.div>

            {/* Feature 2: Curadoria */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-4 h-[600px] rounded-[60px] relative overflow-hidden group cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=2070&auto=format&fit=crop" 
                alt="Curated Content" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-12 z-20">
                <span className="text-gold text-xs font-black uppercase tracking-[0.4em] mb-4 block">Curadoria Elite</span>
                <h3 className="text-4xl font-black uppercase italic mb-6">Obras <br/> Atemporais</h3>
                <p className="text-silver/60 text-sm leading-relaxed opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
                  Selecionamos apenas o que é relevante. Esqueça o lixo digital. Aqui, cada título é uma obra-prima validada por críticos e entusiastas.
                </p>
              </div>
            </motion.div>

            {/* Feature 3: Multi-Device */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-4 h-[500px] rounded-[60px] relative overflow-hidden group cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1593305841991-05c297ba4575?q=80&w=1957&auto=format&fit=crop" 
                alt="Multi Device" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 p-12 z-20">
                <h3 className="text-3xl font-black uppercase italic mb-4">Ecossistema <br/> Fluido</h3>
                <p className="text-silver/60 text-sm leading-relaxed">
                  Do smartphone à Smart TV de 100 polegadas. A experiência é contínua, implacável e sincronizada.
                </p>
              </div>
            </motion.div>

            {/* Feature 4: Performance */}
            <motion.div 
              whileHover={{ scale: 0.98 }}
              className="md:col-span-8 h-[500px] rounded-[60px] relative overflow-hidden group cursor-pointer"
            >
              <img 
                src="https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop" 
                alt="Performance" 
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent"></div>
              
              <div className="absolute inset-y-0 left-0 p-16 flex flex-col justify-center z-20">
                <span className="text-cyan-500 text-xs font-black uppercase tracking-[0.4em] mb-6 block">Performance Pura</span>
                <h3 className="text-5xl font-black uppercase italic mb-6">Zero <br/> Atrito</h3>
                <p className="text-silver/60 text-lg max-w-md leading-relaxed">
                  Nossa rede global de baixa latência garante que o "Play" seja uma ordem executada instantaneamente. Sem telas de carregamento. Sem interrupções.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 7. NEWSLETTER / MEMBERSHIP (CONVERSÃO) */}
      <section className="py-40 px-8 bg-[#050505] relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-black uppercase italic tracking-tighter mb-8">
            <span className="text-aluminum">Faça Parte da</span> <span className="text-gold">Elite</span>
          </h2>
          <p className="text-silver/40 uppercase tracking-[0.3em] text-[10px] font-bold mb-12">
            Receba as estreias exclusivas e atualizações de rede direto no seu e-mail.
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <input 
              type="email" 
              placeholder="SEU MELHOR E-MAIL" 
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-8 py-6 text-white font-black uppercase text-[10px] tracking-widest focus:border-gold outline-none transition-all"
            />
            <button className="bg-gold text-black px-12 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white transition-all shadow-2xl shadow-gold/20">
              Assinar Agora
            </button>
          </div>
        </div>
        {/* Decorative background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/5 blur-[150px] rounded-full pointer-events-none"></div>
      </section>

      {/* 8. FOOTER TÉCNICO E SEO */}
      <footer className="bg-[#020202] border-t border-white/5 py-40 px-8 md:px-20 selection:bg-cyan-500 selection:text-black">
        <div className="max-w-[1800px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-20 mb-40">
            <div className="md:col-span-6">
              <span className="text-6xl md:text-8xl font-display font-black italic tracking-tighter mb-12 block leading-none">
                <span className="text-aluminum">LORD</span>
                <span className="text-cyan-500">FLIX</span>
              </span>
              <p className="text-silver/40 text-xl md:text-2xl max-w-2xl leading-relaxed font-light mb-16">
                A experiência definitiva em cinema digital. Tecnologia de bitrate adaptativo, curadoria de elite e uma infraestrutura global desenhada para a perfeição.
              </p>
              <div className="flex flex-wrap gap-10">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-silver/20 uppercase tracking-[0.4em] block">Status da Rede</span>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-white font-black uppercase tracking-widest text-xs">Global Online</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-silver/20 uppercase tracking-[0.4em] block">Qualidade</span>
                  <span className="text-white font-black uppercase tracking-widest text-xs">4K HDR10+ / Dolby Atmos</span>
                </div>
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-silver/20 uppercase tracking-[0.4em] block">Região</span>
                  <span className="text-white font-black uppercase tracking-widest text-xs">América Latina / Global</span>
                </div>
              </div>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white font-black uppercase tracking-[0.6em] text-[10px] mb-12">Catálogo</h4>
              <ul className="space-y-8 text-silver/40 text-xs font-black uppercase tracking-[0.3em]">
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Filmes 4K</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Séries Premium</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Animes HD</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">TV Ao Vivo</li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white font-black uppercase tracking-[0.6em] text-[10px] mb-12">Institucional</h4>
              <ul className="space-y-8 text-silver/40 text-xs font-black uppercase tracking-[0.3em]">
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Sobre Nós</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Nossa Rede</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Carreiras</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Blog Tech</li>
              </ul>
            </div>

            <div className="md:col-span-2">
              <h4 className="text-white font-black uppercase tracking-[0.6em] text-[10px] mb-12">Suporte</h4>
              <ul className="space-y-8 text-silver/40 text-xs font-black uppercase tracking-[0.3em]">
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Central de Ajuda</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Termos de Uso</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Privacidade</li>
                <li className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">Contato Elite</li>
              </ul>
            </div>
          </div>

          <div className="pt-20 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-10">
            <p className="text-silver/20 text-[10px] font-black uppercase tracking-[0.5em]">
              © 2026 LORD-FLIX.TV — A Nova Ordem do Entretenimento.
            </p>
            <div className="flex gap-12">
              <span className="text-silver/10 text-[9px] font-black uppercase tracking-widest">Powered by LordEngine v4.0</span>
              <span className="text-silver/10 text-[9px] font-black uppercase tracking-widest">Encrypted Connection</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
