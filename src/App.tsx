import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { VoiceSearch } from './components/VoiceSearch';
import GuiaTV from './components/GuiaTV';
import { LordPlayer } from './components/VideoPlayer';
import { MediaDashboard } from './components/Dashboard';
import NossaRede from './components/NossaRede';
import { LordLogin } from './components/Login';
import { ScrollControls } from './components/ScrollControls';
import { AdminPanel } from './components/AdminPanel';
import { ProfileDashboard } from './components/ProfileDashboard';
import { NotificationPanel } from './components/NotificationPanel';
import SupportPage from './components/SupportPage';
import LiveTV from './components/LiveTV';
import BackgroundStream from './components/BackgroundStream';
import { LIVE_CHANNELS } from './constants/channels';
import { AdPlayer } from './components/AdPlayer';
import { getMovies, searchMovies, getVideos, getMovieDetails, getSeasonDetails, getMoviesByGenre } from './lib/tmdb';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { Shield, AlertCircle, Bell, Plus, Check as CheckIcon, History, Crown, X, RefreshCw, Search, Home, Film, Tv, User as UserIcon, Zap, Sparkles, Flame, Brain, Heart, Sword, Play as PlayIcon } from 'lucide-react';

// --- ERROR BOUNDARY COMPONENT ---
class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-10 text-center">
          <div className="max-w-md space-y-8">
            <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[40px] flex items-center justify-center mx-auto">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-white">Erro de Sistema</h1>
            <p className="text-silver/40 text-xs font-black uppercase tracking-[0.3em] leading-relaxed">
              Ocorreu um erro crítico na LordEngine. Nossa equipe técnica já foi notificada.
            </p>
            <button 
              onClick={() => window.location.reload()}
              className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-cyan-500 transition-all flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Reiniciar Sistema
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// 1. BANCO DE DADOS LOCAL (Integração TMDB Real)
const CATEGORIAS_INICIAIS = [
  { nome: "EM ALTA NO BRASIL", type: "trending", filmes: [] },
  { nome: "NOSTALGIA BR ANOS 90", type: "nostalgia", filmes: [] },
  { nome: "TOKUSATSU CLÁSSICO", type: "tokusatsu", filmes: [] },
  { nome: "PORRADARIA E TORNEIO", type: "action", filmes: [] },
  { nome: "HISTÓRIAS INTELIGENTES", type: "smart", filmes: [] },
  { nome: "VAI TE FAZER CHORAR", type: "drama", filmes: [] },
  { nome: "HERÓIS E TRANSFORMAÇÕES", type: "heroes", filmes: [] },
  { nome: "FILMES IMPERDÍVEIS", type: "movies", filmes: [] }
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
  src: "",
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
      whileHover={{ y: -12, scale: 1.02 }}
      whileFocus={{ y: -12, scale: 1.05 }}
      tabIndex={0}
      className={`relative w-full aspect-[2/3] cursor-pointer group outline-none rounded-[32px] overflow-hidden transition-all duration-700 ${type === 'release' ? 'shadow-[0_0_40px_rgba(34,211,238,0.2)]' : 'shadow-2xl'}`}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      {(!isLoaded && !hasError) && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-12 h-12 rounded-full border-4 border-white/5 border-t-cyan-500 animate-spin"></div>
        </div>
      )}
      
      {hasError ? (
        <div className="absolute inset-0 bg-zinc-950 flex flex-col items-center justify-center p-6 text-center border border-white/5">
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 border border-white/10">
            <X className="text-red-500 w-8 h-8" />
          </div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Sinal Indisponível</p>
        </div>
      ) : (
        <img 
          src={filme.img} 
          alt={filme.titulo} 
          className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${type === 'classic' ? 'grayscale-[0.8] contrast-[1.2]' : 'contrast-[1.1] saturate-[1.1]'}`}
          referrerPolicy="no-referrer"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
        />
      )}

      {/* ATMOSPHERIC OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-40 transition-opacity duration-700" />
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/20 via-transparent to-blue-500/20" />
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
      </div>
      
      {/* ELITE BADGES */}
      <div className="absolute top-5 right-5 flex flex-col gap-3 items-end z-20">
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-3 py-1.5 rounded-full shadow-2xl">
          <span className="text-[10px] font-black text-white tracking-widest uppercase">{filme.nota}</span>
        </div>
        {filme.ano === 'LIVE' && (
          <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)]">
            <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white italic">Live</span>
          </div>
        )}
      </div>

      {/* CONTENT INFO */}
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 translate-y-4 group-hover:translate-y-0 transition-transform duration-700">
        <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-100">
          <span className="bg-white/10 backdrop-blur-xl border border-white/20 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest text-white">{filme.ano}</span>
          <span className="bg-cyan-500/20 backdrop-blur-xl border border-cyan-500/30 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest text-cyan-400">4K UHD</span>
          <span className="bg-gold/20 backdrop-blur-xl border border-gold/30 px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[7px] md:text-[8px] font-black uppercase tracking-widest text-gold-light">Dublado</span>
        </div>

        <h3 className="text-sm md:text-xl font-black text-white uppercase italic tracking-tighter leading-none mb-2 drop-shadow-[0_0_10px_rgba(0,0,0,0.8)] line-clamp-2">
          {filme.titulo}
        </h3>

        <div className="hidden md:flex items-center gap-3 mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-700 delay-200">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className={`w-1 h-1 rounded-full ${i <= 4 ? 'bg-cyan-500' : 'bg-white/20'}`}></div>
            ))}
          </div>
          <span className="text-[8px] font-bold text-silver/40 uppercase tracking-[0.3em]">Sinal Estabilizado</span>
        </div>

        <button className="w-full bg-white text-black py-2 md:py-3.5 rounded-full font-black text-[8px] md:text-[10px] uppercase tracking-[0.3em] hover:bg-cyan-500 hover:text-black transition-all active:scale-95 shadow-2xl opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-700 delay-300">
          {filme.ano === 'LIVE' ? 'Sintonizar' : 'Assistir'}
        </button>
      </div>

      {/* PROGRESS BAR FOR HISTORY */}
      {filme.isHistory && (
        <div className="absolute bottom-0 left-0 w-full h-1.5 bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${filme.progress}%` }}
            className="h-full bg-cyan-500 shadow-[0_0_20px_rgba(34,211,238,0.6)]"
          />
        </div>
      )}
    </motion.div>
  );
};

export default function LordFlixSupremeWrapper() {
  return (
    <ErrorBoundary>
      <LordFlixSupreme />
    </ErrorBoundary>
  );
}

function LordFlixSupreme() {
  // --- ESTADOS DE AUTH & CONFIG ---
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userRole, setUserRole] = useState<string>('user');
  const [userStatus, setUserStatus] = useState<string>('active');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [adminConfig, setAdminConfig] = useState<any>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [adActive, setAdActive] = useState(false);
  const [pendingMovie, setPendingMovie] = useState<any>(null);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);

  // --- ESTADOS DO SISTEMA ---
  const [perfil, setPerfil] = useState('adulto'); 
  const [busca, setBusca] = useState(''); 
  const [mostrarPin, setMostrarPin] = useState(false); 
  const [pinDigitado, setPinDigitado] = useState(''); 
  const [pinErro, setPinErro] = useState(false); 
  const [carregado, setCarregado] = useState(false); 
  const [view, setView] = useState<'home' | 'guia' | 'rede' | 'suporte'>('home');
  const [erroSistema, setErroSistema] = useState(false);
  const [filmeDestaque, setFilmeDestaque] = useState<any>(null);
  const [filmeSelecionado, setFilmeSelecionado] = useState<any>(null);
  const [filmeEmReproducao, setFilmeEmReproducao] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLiveTV, setShowLiveTV] = useState(false);
  const [currentLiveChannel, setCurrentLiveChannel] = useState(LIVE_CHANNELS[0]);
  const [notifications, setNotifications] = useState<any[]>([
    {
      id: '1',
      title: 'Upgrade de Sinal',
      message: 'O filme "Além do Horizonte" agora está disponível com dublagem 4K Ultra HD!',
      type: 'system',
      time: 'Agora',
      read: false
    },
    {
      id: '2',
      title: 'Status VIP Ativo',
      message: 'Sua assinatura VIP foi renovada. Aproveite o bitrate absoluto sem anúncios.',
      type: 'vip',
      time: '2h atrás',
      read: true
    }
  ]);
  const [categorias, setCategorias] = useState(CATEGORIAS_INICIAIS);
  const [loading, setLoading] = useState(true);
  const [resultadosBusca, setResultadosBusca] = useState<any[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [modoNostalgia, setModoNostalgia] = useState(false);

  // --- SEO ENGINE: DYNAMIC METADATA ---
  useEffect(() => {
    const title = filmeSelecionado?.titulo 
      ? `${filmeSelecionado.titulo} | Assistir Online 4K | LordFlix`
      : filmeEmReproducao?.titulo
      ? `Assistindo: ${filmeEmReproducao.titulo} | LordFlix`
      : "LordFlix Supreme | O Cinema de Elite em 4K";
    
    document.title = title;

    // Update Meta Description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      const desc = filmeSelecionado?.resumo || filmeDestaque?.resumo || "Assista aos melhores filmes e séries em 4K Ultra HD na LordFlix. O cinema de elite chegou.";
      metaDescription.setAttribute('content', desc);
    }
  }, [filmeSelecionado, filmeEmReproducao, filmeDestaque]);

  // --- URL ROUTING ENGINE ---
  useEffect(() => {
    const path = window.location.pathname;
    if (path === '/tv') {
      setShowLiveTV(true);
    } else if (path === '/cinema') {
      setView('home');
      setShowLiveTV(false);
    }
  }, []);

  // --- 1. AUTH STATE ---
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
    });

    const unsubConfig = onSnapshot(doc(db, 'config', 'admin'), (snapshot) => {
      if (snapshot.exists()) {
        setAdminConfig(snapshot.data());
      } else {
        setDoc(doc(db, 'config', 'admin'), {
          global_announcement: "Bem-vindo à Nova Era da LordFlix!",
          maintenance_mode: false,
          active_streams_limit: 500,
          current_server_provider: "vidsrc-premium"
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, 'config/admin'));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, 'config/admin'));

    return () => {
      unsubAuth();
      unsubConfig();
    };
  }, []);

  // --- 2. USER DATA LISTENERS ---
  useEffect(() => {
    if (!user) {
      setUserRole('user');
      setUserStatus('active');
      setWatchlist([]);
      setHistory([]);
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const unsubUser = onSnapshot(userDocRef, (snapshot) => {
      const isDefaultAdmin = user.email?.toLowerCase() === "lordjunnior@gmail.com";
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Force admin role if email matches, even if document exists
        if (isDefaultAdmin && data.role !== 'admin') {
          updateDoc(userDocRef, { role: 'admin' }).catch(err => 
            handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`)
          );
        }
        setUserRole(data.role || (isDefaultAdmin ? 'admin' : 'user'));
        setUserStatus(data.status || 'active');
      } else {
        setDoc(userDocRef, {
          uid: user.uid,
          email: user.email,
          photoURL: user.photoURL,
          role: isDefaultAdmin ? 'admin' : 'user',
          status: 'active',
          lastActive: serverTimestamp()
        }).catch(err => handleFirestoreError(err, OperationType.CREATE, `users/${user.uid}`));
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    const unsubWatchlist = onSnapshot(collection(db, 'users', user.uid, 'watchlist'), (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data());
      setWatchlist(items);
    });

    const unsubHistory = onSnapshot(
      query(collection(db, 'users', user.uid, 'history'), orderBy('lastUpdated', 'desc'), limit(20)), 
      (snapshot) => {
        const items = snapshot.docs.map(doc => doc.data());
        setHistory(items);
      }
    );

    return () => {
      unsubUser();
      unsubWatchlist();
      unsubHistory();
    };
  }, [user]);

  // --- 3. TMDB DATA LOADING ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [trending, nostalgia, tokusatsu, action, smart, drama, heroes, movies] = await Promise.allSettled([
          getMovies("trending"),
          Promise.all([
            searchMovies("Saint Seiya"),
            searchMovies("Yu Yu Hakusho"),
            searchMovies("Dragon Ball Z"),
            searchMovies("Sailor Moon")
          ]).then(res => res.flat()),
          Promise.all([
            searchMovies("Jaspion"),
            searchMovies("Changeman"),
            searchMovies("Flashman"),
            searchMovies("Jiraiya"),
            searchMovies("Kamen Rider Black"),
            searchMovies("Ultraman")
          ]).then(res => res.flat()),
          getMoviesByGenre("tv", 10759), // Action & Adventure TV (Anime focus)
          getMoviesByGenre("tv", 9648), // Mystery
          getMoviesByGenre("tv", 18), // Drama
          getMoviesByGenre("tv", 10765), // Sci-Fi & Fantasy
          getMoviesByGenre("movie", 16) // Animation Movies
        ]);

        const formattedTrending = trending.status === 'fulfilled' ? formatTMDBData(trending.value) : [];
        const formattedNostalgia = nostalgia.status === 'fulfilled' ? formatTMDBData(nostalgia.value) : [];
        const formattedTokusatsu = tokusatsu.status === 'fulfilled' ? formatTMDBData(tokusatsu.value) : [];
        const formattedAction = action.status === 'fulfilled' ? formatTMDBData(action.value) : [];
        const formattedSmart = smart.status === 'fulfilled' ? formatTMDBData(smart.value) : [];
        const formattedDrama = drama.status === 'fulfilled' ? formatTMDBData(drama.value) : [];
        const formattedHeroes = heroes.status === 'fulfilled' ? formatTMDBData(heroes.value) : [];
        const formattedMovies = movies.status === 'fulfilled' ? formatTMDBData(movies.value) : [];

        setCategorias([
          { nome: "EM ALTA NO BRASIL", type: "trending", filmes: formattedTrending },
          { nome: "NOSTALGIA BR ANOS 90", type: "nostalgia", filmes: formattedNostalgia },
          { nome: "TOKUSATSU CLÁSSICO", type: "tokusatsu", filmes: formattedTokusatsu },
          { nome: "PORRADARIA E TORNEIO", type: "action", filmes: formattedAction },
          { nome: "HISTÓRIAS INTELIGENTES", type: "smart", filmes: formattedSmart },
          { nome: "VAI TE FAZER CHORAR", type: "drama", filmes: formattedDrama },
          { nome: "HERÓIS E TRANSFORMAÇÕES", type: "heroes", filmes: formattedHeroes },
          { nome: "FILMES IMPERDÍVEIS", type: "movies", filmes: formattedMovies }
        ]);

        if (formattedNostalgia.length > 0) {
          setFilmeDestaque(formattedNostalgia[0]);
        }
      } catch (error) {
        console.error("Erro crítico ao carregar dados do TMDB:", error);
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

  useEffect(() => {
    const handleOutsideClick = () => {
      if (showNotifications) setShowNotifications(false);
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showNotifications]);

  const toggleWatchlist = async (filme: any) => {
    if (!user) return;
    const itemRef = doc(db, 'users', user.uid, 'watchlist', String(filme.id));
    const isSaved = watchlist.some(item => String(item.id) === String(filme.id));

    try {
      if (isSaved) {
        await deleteDoc(itemRef);
      } else {
        await setDoc(itemRef, {
          id: String(filme.id),
          titulo: filme.titulo,
          img: filme.img,
          bg: filme.bg,
          ano: filme.ano,
          media_type: filme.media_type || 'movie',
          addedAt: serverTimestamp()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}/watchlist/${filme.id}`);
    }
  };

  // --- LÓGICA DE FILTRO ---
  const categoriasFiltradas = useMemo(() => {
    let base = categorias.map(cat => ({
      ...cat,
      filmes: cat.filmes.filter(filme => {
        const termo = busca.toLowerCase();
        const bateBusca = (filme.titulo || "").toLowerCase().includes(termo);
        if (perfil === 'kids') return filme.kids && bateBusca;
        return bateBusca;
      })
    })).filter(cat => cat.filmes.length > 0);

    // Injetar Minha Lista
    if (watchlist.length > 0) {
      base.unshift({ nome: "Minha Lista", type: "watchlist", filmes: watchlist });
    }

    // Ordenação Especial para Modo Nostalgia
    if (modoNostalgia) {
      base.sort((a, b) => {
        const aIsNostalgia = a.type === 'nostalgia' || a.type === 'tokusatsu';
        const bIsNostalgia = b.type === 'nostalgia' || b.type === 'tokusatsu';
        if (aIsNostalgia && !bIsNostalgia) return -1;
        if (!aIsNostalgia && bIsNostalgia) return 1;
        return 0;
      });
    }

    return base;
  }, [categorias, busca, perfil, watchlist, modoNostalgia]);

  const handleAssistir = async (filme: any) => {
    const isVIP = userRole === 'vip' || userRole === 'admin';
    
    // Se não for VIP, injetar anúncio antes
    if (!isVIP && filme.ano !== 'LIVE') {
      setPendingMovie(filme);
      setAdActive(true);
      return;
    }

    if (filme.ano === 'LIVE') {
      setFilmeEmReproducao(filme);
      return;
    }

    // Para filmes/séries, usamos o ID do TMDB para os provedores de elite
    // Não forçamos o trailer aqui, deixamos o LordPlayer decidir
    setFilmeEmReproducao({ ...filme, src: filme.src || '' });
  };

  const handleAdComplete = async () => {
    setAdActive(false);
    if (pendingMovie) {
      const filme = pendingMovie;
      setPendingMovie(null);
      
      if (filme.ano === 'LIVE') {
        setFilmeEmReproducao(filme);
        return;
      }
      
      setFilmeEmReproducao({ ...filme, src: filme.src || '' });
    }
  };

  const handleFilmeSelecionado = async (filme: any) => {
    setFilmeSelecionado(filme);
    if (filme.ano === 'LIVE') return;
    
    try {
      const mediaType = filme.media_type || "movie";
      const details = await getMovieDetails(filme.id, mediaType);
      if (details) {
        const director = details.credits?.crew?.find((c: any) => c.job === "Director")?.name || "Não informado";
        const actors = details.credits?.cast?.slice(0, 3).map((a: any) => a.name).join(", ") || "Não informado";
        const genres = details.genres?.map((g: any) => g.name).join(", ") || "Não informado";
        const countries = details.production_countries?.map((c: any) => c.name).join(", ") || "Não informado";
        const runtime = details.runtime ? `${Math.floor(details.runtime / 60)}h ${details.runtime % 60}m` : (details.episode_run_time?.[0] ? `${details.episode_run_time[0]}m` : "N/A");
        const year = details.release_date ? details.release_date.split("-")[0] : (details.first_air_date ? details.first_air_date.split("-")[0] : "N/A");
        
        let ageRating = "14+";
        if (mediaType === "movie") {
          const release = details.release_dates?.results?.find((r: any) => r.iso_3166_1 === "BR") || details.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US");
          if (release && release.release_dates[0].certification) ageRating = release.release_dates[0].certification;
        } else {
          const rating = details.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "BR") || details.content_ratings?.results?.find((r: any) => r.iso_3166_1 === "US");
          if (rating && rating.rating) ageRating = rating.rating;
        }

        setFilmeSelecionado((prev: any) => ({
          ...prev,
          resumo: details.overview || prev.resumo,
          diretor: director,
          atores: actors,
          genero: genres,
          paises: countries,
          duracao: runtime,
          ano: year,
          idade: ageRating,
          nota: details.vote_average?.toFixed(1) || prev.nota,
          rotten: Math.round(details.vote_average * 10) + "%"
        }));
      }
    } catch (error) {
      console.error("Erro ao buscar detalhes do filme:", error);
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

  // --- TELA DE CARREGAMENTO ---
  if (!isAuthReady || !carregado) {
    return (
      <div className="bg-black h-screen flex flex-col items-center justify-center text-white gap-8">
        <div className="w-16 h-16 rounded-full border-t-2 border-cyan-500 animate-spin"></div>
        <span className="font-black uppercase tracking-[0.5em] text-[10px] animate-pulse">Iniciando LordFlix Supreme...</span>
      </div>
    );
  }

  // --- TELA DE LOGIN ---
  if (!user) {
    return <LordLogin onLogin={() => {}} />;
  }

  // --- KILL SWITCH (MAINTENANCE MODE) ---
  if (adminConfig?.maintenance_mode && userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-10 text-center">
        <div className="max-w-md space-y-8">
          <div className="w-24 h-24 bg-cyan-500/10 border border-cyan-500/20 rounded-[40px] flex items-center justify-center mx-auto animate-pulse">
            <AlertCircle className="w-10 h-10 text-cyan-500" />
          </div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-aluminum">Upgrade de Sistema</h1>
          <p className="text-silver/40 text-xs font-black uppercase tracking-[0.3em] leading-relaxed">
            Estamos otimizando nossos servidores para garantir o bitrate absoluto. Voltamos em instantes.
          </p>
        </div>
      </div>
    );
  }

  // --- VIEW: GUIA TV ---
  if (view === 'guia') {
    return <GuiaTV onBack={() => setView('home')} series={categorias[1].filmes} />;
  }

  // --- VIEW: NOSSA REDE ---
  if (view === 'rede') {
    return <NossaRede onBack={() => setView('home')} />;
  }

  // --- VIEW: SUPORTE (CENTRO DE PERFORMANCE) ---
  if (view === 'suporte') {
    return <SupportPage onBack={() => setView('home')} />;
  }

  return (
    <div className="min-h-screen bg-[#020202] selection:bg-cyan-500 selection:text-black">
      
      {/* GLOBAL ANNOUNCEMENT */}
      <AnimatePresence>
        {adminConfig?.global_announcement && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-cyan-500 text-black py-2 px-6 flex items-center justify-center gap-4 relative z-[150]"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest">{adminConfig.global_announcement}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. BARRA DE NAVEGAÇÃO (NAVBAR) */}
      <nav className={`fixed top-0 w-full z-[60] px-4 md:px-8 py-4 md:py-6 flex flex-row justify-between items-center gap-4 transition-all duration-500 ${modoNostalgia ? 'bg-orange-950/40 border-b border-orange-500/20' : 'glass-nav'}`}>
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setView('home')}
          className="flex flex-col cursor-pointer items-start"
        >
          <span className="text-2xl md:text-4xl font-display font-black italic tracking-tighter">
            <span className={`text-transparent bg-clip-text ${modoNostalgia ? 'bg-gradient-to-r from-orange-400 to-yellow-600' : 'bg-gradient-to-r from-white/40 via-white to-white/40'}`}>LORD</span>
            <span className={modoNostalgia ? 'text-orange-500' : 'text-gold'}>FLIX</span>
          </span>
          <span className={`hidden md:block text-[8px] md:text-[10px] uppercase tracking-[0.4em] font-black ml-1 ${modoNostalgia ? 'text-orange-400' : 'text-gold'}`}>
            Anime & Tokusatsu
          </span>
        </motion.div>

        {/* MENU CENTRAL (DESKTOP) */}
        <div className="hidden lg:flex items-center gap-8">
          {['Início', 'Explorar', 'Dublados', 'Clássicos', 'Tokusatsu ⚡', 'Filmes'].map((item) => (
            <button 
              key={item}
              className="text-[10px] font-black uppercase tracking-[0.3em] text-silver/60 hover:text-white transition-colors relative group"
            >
              {item}
              <span className="absolute -bottom-2 left-0 w-0 h-0.5 bg-cyan-500 group-hover:w-full transition-all duration-300" />
            </button>
          ))}
        </div>

        {/* SELETOR DE PERFIL E MODO NOSTALGIA */}
        <div className="flex gap-2 md:gap-4 items-center justify-end">
          {/* MODO NOSTALGIA TOGGLE */}
          <button 
            onClick={() => setModoNostalgia(!modoNostalgia)}
            className={`hidden md:flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${modoNostalgia ? 'bg-orange-500 text-black border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.4)]' : 'bg-white/5 text-silver border-white/10 hover:bg-white/10'}`}
          >
            <Sparkles className={`w-3 h-3 ${modoNostalgia ? 'animate-spin' : ''}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Modo 90s</span>
          </button>

          {/* SEARCH TRIGGER MOBILE */}
          <button 
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden w-8 h-8 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors"
          >
            <Search className="w-4 h-4 text-silver/40" />
          </button>

          {/* ADMIN TRIGGER */}
          {userRole === 'admin' && (
            <button 
              onClick={() => setShowAdminPanel(true)}
              className="w-8 h-8 md:w-10 md:h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:scale-110 transition-transform"
            >
              <Shield className="w-4 h-4 md:w-5 md:h-5 text-black" />
            </button>
          )}

          <button 
            onClick={() => setShowLiveTV(true)}
            className="hidden md:flex px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600/20 transition-all items-center gap-2"
          >
            <div className="w-1 h-1 md:w-1.5 md:h-1.5 bg-red-600 rounded-full animate-ping" />
            Live
          </button>

          <div className="hidden md:flex gap-2">
            <button 
              onClick={() => setPerfil('kids')}
              className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${perfil === 'kids' ? 'bg-white text-black' : 'bg-white/5 text-silver hover:bg-white/10'}`}
            >
              Kids
            </button>
            <button 
              onClick={() => perfil === 'kids' ? setMostrarPin(true) : setPerfil('adulto')}
              className={`px-4 md:px-6 py-1.5 md:py-2 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest transition-all ${perfil === 'adulto' ? 'bg-gold text-black' : 'bg-white/5 text-silver hover:bg-white/10'}`}
            >
              Adults
            </button>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 md:pl-6 md:border-l border-white/10">
            {/* NOTIFICATION BELL */}
            <div className="relative">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(!showNotifications);
                }}
                className="w-8 h-8 md:w-10 md:h-10 bg-white/5 rounded-xl flex items-center justify-center hover:bg-white/10 transition-colors relative"
              >
                <Bell className={`w-4 h-4 md:w-5 md:h-5 ${notifications.some(n => !n.read) ? 'text-cyan-500 animate-pulse' : 'text-silver/40'}`} />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel 
                    onClose={() => setShowNotifications(false)} 
                    notifications={notifications}
                    onMarkAsRead={(id) => {
                      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
                    }}
                  />
                )}
              </AnimatePresence>
            </div>

            <div 
              className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center cursor-pointer hover:border-cyan-500 transition-colors"
              onClick={() => setShowProfile(true)}
            >
              <img 
                src={user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"} 
                className="w-full h-full object-cover rounded-xl" 
                referrerPolicy="no-referrer" 
              />
            </div>
            <button 
              onClick={() => auth.signOut()}
              className="hidden md:block text-silver/20 hover:text-gold transition-colors text-[8px] md:text-[10px] font-black uppercase tracking-widest"
              title="Sair"
            >
              Sair
            </button>
          </div>
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

      <BackgroundStream 
        streamUrl={currentLiveChannel.stream} 
        active={true} 
      />

      {/* 3. PLAYER DE VÍDEO */}
      <AnimatePresence>
        {showLiveTV && (
          <LiveTV 
            onClose={() => setShowLiveTV(false)} 
            currentChannel={currentLiveChannel}
            onChannelChange={setCurrentLiveChannel}
          />
        )}
        {filmeEmReproducao && (
          <LordPlayer 
            src={filmeEmReproducao.src} 
            title={filmeEmReproducao.titulo} 
            movieId={String(filmeEmReproducao.id)}
            media_type={filmeEmReproducao.media_type || 'movie'}
            movieData={filmeEmReproducao}
            onClose={() => setFilmeEmReproducao(null)} 
          />
        )}
      </AnimatePresence>

      {/* 3. HERO SECTION (FULL-BLEED ELITE HERO CAROUSEL) */}
      <section className="relative h-[70vh] md:h-[90vh] min-h-[500px] md:min-h-[600px] w-full overflow-hidden flex flex-col justify-center bg-black">
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
                className="w-full h-full object-cover object-center md:object-top animate-subtle-zoom"
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
        <div className="relative z-20 h-full w-full flex flex-col justify-center px-6 md:px-20 lg:px-32">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="max-w-6xl"
          >
            {/* Tag de Autoridade (SEO + PNL) */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex items-center gap-2 bg-cyan-500 px-4 py-1.5 rounded-full shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                <Sparkles className="w-3 h-3 text-black animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-black italic">Destaque do Dia</span>
              </div>
              <div className="flex gap-2">
                <span className="bg-white/10 backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white">Dublado 🇧🇷</span>
                <span className="bg-white/10 backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white">Clássico</span>
                <span className="bg-white/10 backdrop-blur-xl border border-white/10 px-3 py-1 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-widest text-white">Saga Longa</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-8xl lg:text-[11rem] font-black text-white leading-[0.8] md:leading-[0.75] tracking-tighter uppercase mb-6 md:mb-8 italic">
              {filmeDestaque?.titulo || "Cavaleiros <br /> do Zodíaco"}
            </h1>
            
            <p className="max-w-2xl text-zinc-300 text-sm md:text-2xl font-medium leading-relaxed mb-8 md:mb-12 drop-shadow-2xl line-clamp-3 md:line-clamp-none">
              {filmeDestaque?.resumo || "O clássico que marcou gerações no Brasil. Acompanhe a jornada de Seiya e seus amigos para proteger a deusa Athena."}
            </p>

            <div className="flex flex-wrap items-center gap-6 mt-12">
              <button 
                onClick={() => handleFilmeSelecionado(filmeDestaque)}
                className="group relative bg-white text-black px-10 md:px-14 py-5 md:py-6 rounded-full font-black text-xs md:text-sm uppercase tracking-[0.4em] hover:bg-cyan-500 transition-all active:scale-95 shadow-[0_0_50px_rgba(255,255,255,0.2)] overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <PlayIcon className="w-4 h-4 fill-current" />
                  Assistir Agora
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </button>
              <button 
                onClick={() => toggleWatchlist(filmeDestaque)}
                className="group px-10 md:px-14 py-5 md:py-6 rounded-full border-2 border-white/10 text-white font-black text-xs md:text-sm uppercase tracking-[0.4em] hover:bg-white/5 transition-all flex items-center gap-3"
              >
                <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                Minha Lista
              </button>
            </div>

            {/* Busca Centralizada Estilo TMDB Elite com Voice Search Integrado */}
            <div className={`relative group mt-12 mb-12 max-w-2xl transition-all duration-500 ${showMobileSearch ? 'opacity-100 translate-y-0' : 'md:opacity-100 md:translate-y-0 opacity-0 -translate-y-10 pointer-events-none md:pointer-events-auto'}`}>
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/50 to-blue-900/50 rounded-full blur opacity-25 group-focus-within:opacity-100 transition duration-1000 group-focus-within:duration-200"></div>
              <div className="relative flex items-center bg-white rounded-full shadow-2xl overflow-hidden">
                <input 
                  type="text" 
                  placeholder="O que assistir?"
                  className="w-full bg-transparent text-black py-4 md:py-6 px-6 md:px-8 text-sm md:text-lg outline-none font-medium placeholder:text-zinc-400"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                <div className="flex items-center gap-2 pr-2 md:pr-4">
                  <VoiceSearch onResult={(text) => setBusca(text)} />
                  <button className="bg-gradient-to-r from-cyan-500 to-blue-800 text-white px-4 md:px-8 py-2 md:py-3 rounded-full font-black uppercase tracking-widest text-[9px] md:text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-cyan-500/30">
                    Buscar
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* 4. SEO TÉCNICO: SCHEMA MARKUP JSON-LD */}
        <script 
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Movie",
              "name": filmeSelecionado?.titulo || filmeDestaque?.titulo || "LordFlix Supreme",
              "image": filmeSelecionado?.img || filmeDestaque?.img,
              "description": (filmeSelecionado?.resumo || filmeDestaque?.resumo || "O cinema de elite em 4K.").slice(0, 160),
              "genre": "Cinema de Elite",
              "contentRating": "14+",
              "isFamilyFriendly": "false",
              "potentialAction": {
                "@type": "WatchAction",
                "target": {
                  "@type": "EntryPoint",
                  "urlTemplate": `https://lord-flix.tv/watch/${filmeSelecionado?.id || filmeDestaque?.id || 'home'}`,
                  "actionPlatform": [
                    "http://schema.org/DesktopWebPlatform",
                    "http://schema.org/MobileWebPlatform",
                    "http://schema.org/AndroidTVPlatform"
                  ]
                }
              }
            })
          }}
        />
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

        {/* CONTINUE ASSISTINDO */}
        {history.length > 0 && (
          <section className="px-4 md:px-20 mb-20">
            <div className="flex items-center gap-4 mb-8">
              <History className="w-6 h-6 text-cyan-500" />
              <h2 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-white">Continue Assistindo</h2>
            </div>
            <div className="flex gap-6 overflow-x-auto no-scrollbar pb-8 snap-x">
              {history.map((item: any) => (
                <div key={item.id} className="min-w-[280px] md:min-w-[350px] snap-start group cursor-pointer" onClick={() => handleFilmeSelecionado(item)}>
                  <div className="relative aspect-video rounded-3xl overflow-hidden border border-white/5 group-hover:border-cyan-500/50 transition-all">
                    <img src={item.bg} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <h4 className="text-white font-black uppercase text-xs truncate">{item.titulo}</h4>
                      <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-500" style={{ width: `${(item.progress || 0) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-40">
            <div className="w-20 h-20 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
          </div>
        ) : (
          (categoriasFiltradas || []).map((cat, idx) => (
            <section key={idx} className={`px-4 md:px-20 transition-all duration-1000 ${modoNostalgia && cat.type !== 'nostalgia' && cat.type !== 'tokusatsu' ? 'opacity-30 grayscale blur-[2px] scale-95' : 'opacity-100'}`}>
              <div className="flex items-center justify-between mb-8 md:mb-12">
                <div className="flex items-center gap-4 md:gap-8">
                  <div className={`p-3 rounded-2xl ${modoNostalgia ? 'bg-orange-500/20 text-orange-500' : 'bg-cyan-500/20 text-cyan-500'}`}>
                    {cat.type === 'trending' && <Flame className="w-6 h-6" />}
                    {cat.type === 'nostalgia' && <Sparkles className="w-6 h-6" />}
                    {cat.type === 'tokusatsu' && <Zap className="w-6 h-6" />}
                    {cat.type === 'action' && <Sword className="w-6 h-6" />}
                    {cat.type === 'smart' && <Brain className="w-6 h-6" />}
                    {cat.type === 'drama' && <Heart className="w-6 h-6" />}
                    {cat.type === 'heroes' && <Zap className="w-6 h-6" />}
                    {cat.type === 'movies' && <Film className="w-6 h-6" />}
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white">{cat.nome}</h2>
                </div>
                {cat.type === 'tokusatsu' && (
                  <button className="text-[10px] font-black uppercase tracking-widest text-cyan-500 hover:text-white transition-colors">Ver tudo Tokusatsu</button>
                )}
              </div>

              <div className={`flex md:grid md:grid-cols-4 lg:grid-cols-8 gap-4 md:gap-8 pb-12 overflow-x-auto md:overflow-x-visible no-scrollbar snap-x snap-mandatory`}>
                {(cat.filmes || []).map((filme: any) => (
                  <div key={filme.id} className="min-w-[160px] md:min-w-0 snap-start">
                    <MoviePoster 
                      filme={filme} 
                      type={cat.type === 'trending' ? "release" : undefined}
                      onClick={() => handleFilmeSelecionado(filme)} 
                    />
                  </div>
                ))}
              </div>
            </section>
          ))
        )}

        {/* PRA COMEÇAR SEM ERRO (SEÇÃO EXPLICATIVA) */}
        <section className="px-4 md:px-20 py-24 bg-gradient-to-b from-transparent to-cyan-950/20">
          <div className="flex items-center gap-4 mb-16">
            <Sparkles className="w-8 h-8 text-cyan-500" />
            <h2 className="text-4xl md:text-6xl font-black uppercase italic tracking-tighter text-white">Pra Começar sem Erro</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Nunca viu anime?", desc: "Comece pelos clássicos que definiram o gênero.", icon: Sparkles, color: "from-blue-500 to-cyan-500" },
              { title: "Quer algo curto?", desc: "Séries de 12 episódios para maratonar em um dia.", icon: Zap, color: "from-purple-500 to-pink-500" },
              { title: "Quer só ação?", desc: "Tokusatsu e Shonen com as melhores lutas.", icon: Flame, color: "from-orange-500 to-red-500" }
            ].map((card, i) => (
              <div key={i} className={`p-10 rounded-[40px] bg-gradient-to-br ${card.color} opacity-80 hover:opacity-100 transition-all cursor-pointer group`}>
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                  <card.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-3xl font-black text-white uppercase italic mb-4">{card.title}</h3>
                <p className="text-white/80 font-medium">{card.desc}</p>
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
                className="absolute top-8 right-8 z-50 group flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-full transition-all hover:bg-cyan-500 hover:border-cyan-500"
              >
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white group-hover:text-black transition-colors">Fechar</span>
                <X className="w-4 h-4 text-white group-hover:text-black group-hover:rotate-90 transition-all" />
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

                <div className="flex flex-wrap gap-4 mb-8 text-[10px] font-black uppercase tracking-[0.3em] text-silver/40">
                  <span>{filmeSelecionado.ano}</span>
                  <span>{filmeSelecionado.duracao}</span>
                  <span className="text-cyan-500 border border-cyan-500/30 px-2 py-0.5 rounded">{filmeSelecionado.idade || '14+'}</span>
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white">Dublado + Legendado</span>
                  <span className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-white">4K Ultra HD</span>
                </div>

                <p className="text-silver/60 text-lg leading-relaxed mb-10 font-medium">
                  {filmeSelecionado.resumo}
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-10 mb-12">
                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20">
                    Gênero: <span className="text-white ml-2">{filmeSelecionado.genero || 'Ação, Thriller'}</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20">
                    Atores: <span className="text-white ml-2">{filmeSelecionado.atores || 'Não informado'}</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20">
                    Diretor: <span className="text-white ml-2">{filmeSelecionado.diretor || 'Não informado'}</span>
                  </p>
                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20">
                    País: <span className="text-white ml-2">{filmeSelecionado.paises || 'EUA'}</span>
                  </p>
                  
                  <div className="flex items-center gap-6 mt-2">
                    <div className="flex items-center gap-2 bg-[#f5c518] px-2 py-1 rounded-md">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/6/69/IMDB_Logo_2012.svg" alt="IMDb" className="h-3" referrerPolicy="no-referrer" />
                      <span className="text-[10px] font-black text-black">{filmeSelecionado.nota}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded-md">
                      <img src="https://www.rottentomatoes.com/assets/casablanca/images/icons/tomatometer/certified_fresh-notext.537a589cf5d.svg" alt="Rotten Tomatoes" className="h-4" referrerPolicy="no-referrer" />
                      <span className="text-[10px] font-black text-white">{filmeSelecionado.rotten || '85%'}</span>
                    </div>
                  </div>

                  <p className="text-[10px] uppercase tracking-widest font-black text-silver/20 flex items-center">
                    Qualidade: <span className="text-white ml-2">HD • 2K • 4K Ultra HD</span>
                  </p>
                </div>

                {/* Internal Linking (SEO Teia) */}

                <div className="flex flex-col md:flex-row gap-4">
                  <button 
                    onClick={() => {
                      handleAssistir(filmeSelecionado);
                      setFilmeSelecionado(null);
                    }}
                    className="bg-white text-black flex-1 px-16 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-cyan-500 hover:text-black transition-all shadow-2xl shadow-white/5"
                  >
                    Assistir Agora
                  </button>
                  <button 
                    onClick={() => toggleWatchlist(filmeSelecionado)}
                    className="bg-white/5 text-white flex-1 px-10 py-6 rounded-2xl font-black uppercase text-xs tracking-[0.3em] hover:bg-white/10 transition-all border border-white/5 flex items-center justify-center gap-3"
                  >
                    {watchlist.some(item => String(item.id) === String(filmeSelecionado.id)) ? (
                      <>
                        <CheckIcon className="w-5 h-5 text-cyan-500" />
                        Na Minha Lista
                      </>
                    ) : (
                      <>
                        <Plus className="w-5 h-5" />
                        Minha Lista
                      </>
                    )}
                  </button>
                </div>
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
                <span className="text-white/10 text-xs ml-2 uppercase tracking-[0.5em]">Supreme</span>
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
              <span className="text-silver/10 text-[9px] font-black uppercase tracking-widest">TV Box & Android Ready</span>
              <span className="text-silver/10 text-[9px] font-black uppercase tracking-widest">Encrypted Connection</span>
            </div>
          </div>
        </div>
      </footer>
      <ScrollControls />
      
      <AnimatePresence>
        {showAdminPanel && <AdminPanel onClose={() => setShowAdminPanel(false)} />}
        {showProfile && (
          <ProfileDashboard 
            user={user} 
            userRole={userRole} 
            userStatus={userStatus} 
            onClose={() => setShowProfile(false)} 
          />
        )}
        {adActive && (
          <AdPlayer 
            onComplete={handleAdComplete} 
            onClose={() => setAdActive(false)} 
          />
        )}
      </AnimatePresence>
      {/* BOTTOM NAVIGATION BAR (MOBILE ONLY) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-2xl border-t border-white/10 px-6 py-4 flex justify-between items-center">
        <button 
          onClick={() => { setView('home'); setShowLiveTV(false); }}
          className={`flex flex-col items-center gap-1 ${view === 'home' && !showLiveTV ? 'text-cyan-500' : 'text-silver/40'}`}
        >
          <Home className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button 
          onClick={() => { setView('home'); setShowLiveTV(false); }}
          className={`flex flex-col items-center gap-1 ${view === 'home' && !showLiveTV ? 'text-silver/40' : 'text-silver/40'}`}
        >
          <Film className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Filmes</span>
        </button>
        <button 
          onClick={() => setShowLiveTV(true)}
          className={`flex flex-col items-center gap-1 ${showLiveTV ? 'text-cyan-500' : 'text-silver/40'}`}
        >
          <Tv className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">TV</span>
        </button>
        <button 
          onClick={() => setShowProfile(true)}
          className={`flex flex-col items-center gap-1 ${showProfile ? 'text-cyan-500' : 'text-silver/40'}`}
        >
          <UserIcon className="w-6 h-6" />
          <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}
