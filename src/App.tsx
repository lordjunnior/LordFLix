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
      nota: "9.0", 
      idade: "L", 
      kids: false, 
      ano: "2026",
      duracao: "Ao Vivo",
      diretor: "LordFlix",
      resumo: "Notícias em tempo real com qualidade 4K.",
      img: "https://image.tmdb.org/t/p/w500/p9v9v9v9v9v9v9v9v9v9v9v9v9v.jpg", 
      bg: "https://image.tmdb.org/t/p/original/p9v9v9v9v9v9v9v9v9v9v9v9v9v.jpg",
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

  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className={`movie-poster-container w-full aspect-[2/3] cursor-pointer group ${type === 'release' ? 'release-glow' : ''}`}
      onClick={onClick}
    >
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-2 border-white/5 border-t-cyan-500 animate-spin"></div>
        </div>
      )}
      <img 
        src={filme.img} 
        alt={`Poster oficial do filme ${filme.titulo} - Qualidade Ultra HD`} 
        className={`movie-poster-img ${isLoaded ? 'opacity-100' : 'opacity-0'} ${type === 'classic' ? 'noir-treatment' : ''}`}
        referrerPolicy="no-referrer"
        loading="lazy"
        onLoad={() => setIsLoaded(true)}
      />
      <div className="vignette-layer"></div>
      
      {/* Overlay de PNL + CTA */}
      <div className="glass-pnl-overlay">
        <div className="flex gap-2 mb-3">
          <span className="glass-tag">{filme.ano}</span>
          <span className="glass-tag text-cyan-400 border-cyan-400/30">4K</span>
        </div>
        <h3 className="pnl-title">{filme.titulo}</h3>
        <p className="pnl-description line-clamp-2">
          {filme.resumo || "Uma obra-prima cinematográfica que redefine o gênero."}
        </p>
        <button className="cta-supreme-mini hover:bg-cyan-500">
          Assistir Agora
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

        {/* 3. O CONTEÚDO (Trio da Blindagem: CTA + SEO + PNL) */}
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

            {/* TRIO DA BLINDAGEM: CTA + PNL */}
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
            {categorias[1].filmes.slice(0, 4).map((item) => (
              <div 
                key={`tv-guide-${item.id}`} 
                onClick={() => handleFilmeSelecionado(item)}
                className="group relative bg-zinc-900 border-b border-gold/20 hover:border-gold transition-all cursor-pointer rounded-xl overflow-hidden"
              >
                <div className="aspect-video overflow-hidden">
                  <img 
                    src={item.bg || item.img} 
                    alt={item.titulo} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700"
                    referrerPolicy="no-referrer"
                  />
                </div>
                
                <div className="p-6">
                  <span className="text-[10px] font-black bg-gold text-black px-2 py-0.5 uppercase mb-3 inline-block">
                    Premium TV
                  </span>
                  <h3 className="text-white font-bold text-lg truncate">
                    {item.titulo}
                  </h3>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mt-2">
                    {item.ano} • Sci-Fi Series
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

      {/* 6. POR QUE AS FAMÍLIAS CONFIAM */}
      <section id="seguranca" className="py-32 px-10 bg-gradient-to-b from-transparent to-black/50">
        <h2 className="text-center text-4xl font-display font-black uppercase italic mb-20 tracking-tighter">Por Que as Famílias Confiam no LordFlix</h2>
        <div className="grid md:grid-cols-4 gap-12 max-w-7xl mx-auto">
          {[
            { img: "https://picsum.photos/seed/family/400/400", t: "Controle Parental", d: "PIN de segurança para proteger crianças" },
            { img: "https://picsum.photos/seed/award/400/400", t: "Ratings IMDb", d: "Avaliações verificadas de confiança" },
            { img: "https://picsum.photos/seed/gift/400/400", t: "100% Grátis", d: "Sem pagamentos escondidos ou surpresas" },
            { img: "https://picsum.photos/seed/privacy/400/400", t: "Privado", d: "Ninguém vê o que você assiste" }
          ].map((item, i) => (
            <div key={i} className="text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                <img src={item.img} alt={item.t} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700" referrerPolicy="no-referrer" />
              </div>
              <h3 className="text-lg font-black uppercase italic tracking-tighter">{item.t}</h3>
              <p className="text-silver/40 text-sm leading-relaxed uppercase tracking-widest text-[10px]">{item.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-20 text-center max-w-2xl mx-auto">
          <p className="text-xl italic text-silver/20 leading-relaxed font-display">
            "Sua família segura. Cinema com controle total. Capas reais com ratings verificados. É só clicar e assistir."
          </p>
        </div>
      </section>

      {/* 7. FOOTER TÉCNICO E SEO */}
      <footer className="bg-[#050505] border-t border-white/5 py-20 px-8">
        {/* SEO TÉCNICO: SCHEMA MARKUP HÍBRIDO */}
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": [
              ...categorias[0].filmes.map((m, i) => ({ "@type": "ListItem", "position": i + 1, "item": { "@type": "Movie", "name": m.titulo } })),
              ...categorias[1].filmes.map((m, i) => ({ "@type": "ListItem", "position": categorias[0].filmes.length + i + 1, "item": { "@type": "Movie", "name": m.titulo } }))
            ]
          })}
        </script>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2">
            <span className="text-3xl font-display font-black italic tracking-tighter mb-6 block">
              <span className="text-white/40">LORD</span>
              <span className="text-cyan-500">FLIX</span>
            </span>
            <p className="text-silver/40 text-sm max-w-md leading-relaxed uppercase tracking-widest font-bold">
              A maior plataforma de streaming de alta performance do mundo. Tecnologia de ponta, curadoria de elite e experiência cinematográfica sem precedentes.
            </p>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-8">Navegação</h4>
            <ul className="space-y-4 text-silver/40 text-[10px] font-bold uppercase tracking-widest">
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Início</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Filmes</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Séries</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Minha Lista</li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-black uppercase tracking-[0.3em] text-[10px] mb-8">Suporte</h4>
            <ul className="space-y-4 text-silver/40 text-[10px] font-bold uppercase tracking-widest">
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Ajuda</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Privacidade</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Termos de Uso</li>
              <li className="hover:text-cyan-500 cursor-pointer transition-colors">Contato</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <span className="text-silver/20 text-[10px] font-black uppercase tracking-[0.5em]">© 2026 LordFlix Supreme - Elite Digital</span>
          <div className="flex gap-8 text-silver/20 text-[10px] font-black uppercase tracking-widest">
            <span>4K HDR</span>
            <span>Dolby Atmos</span>
            <span>Studio Grade</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
