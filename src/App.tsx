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
import { TOKUSATSU_VAULT } from './constants/tokusatsu';
import { getMovies, searchMovies, getVideos, getMovieDetails, getSeasonDetails, getMoviesByGenre } from './lib/tmdb';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, onSnapshot, setDoc, updateDoc, serverTimestamp, collection, query, orderBy, limit, deleteDoc } from 'firebase/firestore';
import { Shield, AlertCircle, Bell, Plus, Check as CheckIcon, History, Crown, X, RefreshCw, Search, Home, Film, Tv, User as UserIcon, Zap, Globe, Smile } from 'lucide-react';

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

// --- INTERFACES DE ELITE ---
interface Movie {
  id: number | string;
  titulo: string;
  nota: string;
  idade?: string;
  kids?: boolean;
  ano?: string;
  duracao?: string;
  diretor?: string;
  resumo?: string;
  img: string;
  bg?: string;
  src?: string;
  trailer?: string;
  media_type?: 'movie' | 'tv' | 'live';
  isSaga?: boolean;
  sagaItems?: Movie[];
  isHistory?: boolean;
  progress?: number;
  popularity?: number;
  genero?: string;
  atores?: string;
  type?: string; // Para compatibilidade com filtros
}

interface Categoria {
  nome: string;
  type: string;
  filmes: Movie[];
}

// 1. BANCO DE DADOS LOCAL (Integração TMDB Real)
const CATEGORIAS_INICIAIS: Categoria[] = [
  { nome: "Continue assistindo", type: "history", filmes: [] },
  { nome: "Em alta agora", type: "trending", filmes: [] },
  { nome: "Filmes", type: "movie", filmes: [] },
  { nome: "Séries", type: "tv", filmes: [] },
  { nome: "TV ao Vivo", type: "live", filmes: [
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
      src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      media_type: 'live'
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
      src: "https://bitdash-a.akamaihd.net/content/sintel/hls/playlist.m3u8",
      media_type: 'live'
    }
  ]},
  { nome: "Animes", type: "animes", filmes: [] },
  { nome: "Heróis Lendários", type: "tokusatsu", filmes: [] },
  { nome: "Kids", type: "kids", filmes: [] },
  { nome: "Runtime TV (Dublado)", type: "runtime", filmes: [] }
];

const GENRE_MAP: { [key: number]: string } = {
  16: "Animação",
  10759: "Ação e Aventura",
  28: "Ação",
  12: "Aventura",
  35: "Comédia",
  10751: "Família",
  10765: "Sci-Fi & Fantasia",
  878: "Ficção Científica",
  18: "Drama",
  99: "Documentário",
  80: "Crime",
  9648: "Mistério",
  10762: "Kids",
  10763: "Notícias",
  10764: "Reality Show",
  10766: "Novelas",
  10767: "Talk Show",
  10768: "Guerra & Política"
};

const OFFICIAL_POSTERS: { [key: number]: string } = {
  43505: "https://m.media-amazon.com/images/I/51X6A6X6EPL._AC_.jpg", // JASPION
  43506: "https://m.media-amazon.com/images/I/81S6U-y8mLL._AC_SL1500_.jpg", // JIRAIYA
  43507: "https://m.media-amazon.com/images/M/MV5BMjA5OTM3NjYtNjYyNi00ZDRlLTk5ZTAtYmU4YjU4YjU4YjU4YjU4XkEyXkFqcGdeQXVyNjExODEyNTg@._V1_.jpg", // JIBAN
  43508: "https://m.media-amazon.com/images/I/71R37C3T5GL._AC_SL1000_.jpg", // CHANGEMAN
  43509: "https://m.media-amazon.com/images/I/81XmS5mKk6L._AC_SL1500_.jpg", // FLASHMAN
  32658: "https://m.media-amazon.com/images/M/MV5BMjA5OTM3NjYtNjYyNi00ZDRlLTk5ZTAtYmU4YjU4YjU4YjU4YjU4XkEyXkFqcGdeQXVyNjExODEyNTg@._V1_.jpg",
  43511: "https://m.media-amazon.com/images/M/MV5BMjA5OTM3NjYtNjYyNi00ZDRlLTk5ZTAtYmU4YjU4YjU4YjU4XkEyXkFqcGdeQXVyNjExODEyNTg@._V1_.jpg",
  43512: "https://m.media-amazon.com/images/M/MV5BMjA5OTM3NjYtNjYyNi00ZDRlLTk5ZTAtYmU4YjU4YjU4YjU4XkEyXkFqcGdeQXVyNjExODEyNTg@._V1_.jpg",
  43510: "https://m.media-amazon.com/images/M/MV5BMjA5OTM3NjYtNjYyNi00ZDRlLTk5ZTAtYmU4YjU4YjU4YjU4XkEyXkFqcGdeQXVyNjExODEyNTg@._V1_.jpg",
};

const formatTMDBData = (data: any[], type?: string): Movie[] => data.map(item => {
  const poster = OFFICIAL_POSTERS[item.id] || (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null);
  const backdrop = item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/original${item.poster_path}` : null);
  
  const fallbackImg = type === 'animes' || type === 'kids' 
    ? "https://images.unsplash.com/photo-1578632738980-230ce1d58cbf?q=80&w=2070&auto=format&fit=crop"
    : "https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop";

  return {
    id: item.id,
    titulo: (item.title || item.name || "").toUpperCase(),
    nota: item.vote_average ? item.vote_average.toFixed(1) : "0.0",
    idade: "14", 
    kids: item.genre_ids?.includes(10751) || item.genre_ids?.includes(10762),
    ano: (item.release_date || item.first_air_date || "").split("-")[0],
    resumo: item.overview,
    img: poster || fallbackImg,
    bg: backdrop || poster || fallbackImg,
    src: "",
    trailer: "",
    media_type: item.media_type || (item.title ? "movie" : "tv"),
    popularity: item.popularity,
    genero: item.genre_ids?.map((id: number) => GENRE_MAP[id]).filter(Boolean).join(", ") || "",
    type: type || item.media_type || (item.title ? "movie" : "tv")
  };
});

// --- COMPONENTE DE CAPA ELITE (PNL + SEO) ---
interface MoviePosterProps {
  filme: Movie;
  onClick: () => void;
  type?: 'release' | 'classic';
  handleAssistir: (filme: Movie) => void;
  toggleWatchlist: (filme: Movie) => void;
  watchlist: Movie[];
}

const MoviePoster = ({ filme, onClick, type, handleAssistir, toggleWatchlist, watchlist }: MoviePosterProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <motion.div 
      whileHover={{ y: -12, scale: 1.02 }}
      whileFocus={{ y: -12, scale: 1.05 }}
      tabIndex={0}
      className={`relative w-full aspect-[2/3] cursor-pointer group outline-none rounded-[32px] overflow-hidden transition-all duration-700 ${type === 'release' ? 'shadow-[0_0_40px_rgba(34,211,238,0.2)]' : 'shadow-2xl'}`}
      onClick={onClick}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
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
          className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 group-hover:rotate-1 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${type === 'classic' ? 'contrast-[1.2]' : 'contrast-[1.1] saturate-[1.1]'}`}
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
      
      {/* ELITE BADGES */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 items-end z-20">
        {filme.src?.includes('youtube.com') && (
          <div className="bg-red-600/90 backdrop-blur-2xl border border-white/20 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <Globe className="w-2.5 h-2.5 text-white" />
            <span className="text-[8px] font-black text-white tracking-widest uppercase">Oficial</span>
          </div>
        )}
        {filme.src?.includes('runtime') && (
          <div className="bg-gold/90 backdrop-blur-2xl border border-white/20 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <Shield className="w-2.5 h-2.5 text-black" />
            <span className="text-[8px] font-black text-black tracking-widest uppercase">Licenciado</span>
          </div>
        )}
        {filme.isSaga && (
          <div className="bg-retro-orange/90 backdrop-blur-2xl border border-white/20 px-3 py-1 rounded-full shadow-lg flex items-center gap-1.5">
            <Crown className="w-2.5 h-2.5 text-black" />
            <span className="text-[8px] font-black text-black tracking-widest uppercase">Saga</span>
          </div>
        )}
        <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-2.5 py-1 rounded-full shadow-2xl">
          <span className="text-[9px] font-black text-white tracking-widest uppercase">{filme.nota}</span>
        </div>
      </div>

      {/* EXPANDED INFO ON HOVER */}
      <div className="movie-card-expanded">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="badge-mini bg-cyan-500 text-black">Dublado</span>
          <span className="badge-mini bg-yellow-500 text-black">⭐ {filme.nota}</span>
          {filme.ano && <span className="badge-mini bg-white/10 text-white">{filme.ano}</span>}
        </div>
        
        <h3 className="text-sm font-black text-white uppercase italic tracking-tighter mb-1 line-clamp-1">
          {filme.titulo}
        </h3>

        {filme.genero && (
          <p className="text-[7px] text-cyan-400 font-black uppercase tracking-widest mb-2 line-clamp-1">
            {filme.genero}
          </p>
        )}
        
        <p className="text-[8px] text-white/60 font-medium uppercase tracking-widest mb-4 line-clamp-2 leading-relaxed">
          {filme.resumo || "Uma obra-prima absoluta do catálogo LordFlix Supreme."}
        </p>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); handleAssistir(filme); }}
            className="flex-1 bg-white text-black py-2 rounded-full font-black text-[8px] uppercase tracking-widest hover:bg-cyan-500 transition-all"
          >
            Assistir
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); toggleWatchlist(filme); }}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${watchlist.some(w => w.id === filme.id) ? 'bg-cyan-500' : 'bg-white/10 hover:bg-white/20'}`}
          >
            {watchlist.some(w => w.id === filme.id) ? <CheckIcon className="w-4 h-4 text-black" /> : <Plus className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* PROGRESS BAR FOR HISTORY */}
      {filme.isHistory && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${filme.progress}%` }}
            className="h-full bg-cyan-500 shadow-[0_0_10px_rgba(34,211,238,0.6)]"
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
  const [priorizarDublados, setPriorizarDublados] = useState(false);
  const [mostrarPin, setMostrarPin] = useState(false); 
  const [pinDigitado, setPinDigitado] = useState(''); 
  const [pinErro, setPinErro] = useState(false); 
  const [carregado, setCarregado] = useState(false); 
  const [view, setView] = useState<'home' | 'guia' | 'rede' | 'suporte' | 'movies' | 'tv' | 'profile'>('home');
  const [viewCategory, setViewCategory] = useState<any | null>(null);
  const [erroSistema, setErroSistema] = useState(false);
  const [filmeDestaque, setFilmeDestaque] = useState<any>({
    id: 872585,
    titulo: "OPPENHEIMER",
    nota: "8.9",
    idade: "16",
    ano: "2023",
    duracao: "3h 0min",
    diretor: "Christopher Nolan",
    resumo: "O físico J. Robert Oppenheimer trabalha com uma equipe de cientistas durante o Projeto Manhattan, levando ao desenvolvimento da bomba atômica.",
    img: "https://image.tmdb.org/t/p/original/nb3xI8S2nI6SSTTU4vjnSKymZpD.jpg", 
    bg: "https://image.tmdb.org/t/p/original/nb3xI8S2nI6SSTTU4vjnSKymZpD.jpg",
    media_type: 'movie'
  });
  const [filmeSelecionado, setFilmeSelecionado] = useState<any>(null);
  const [sagaSelecionada, setSagaSelecionada] = useState<any>(null);
  const [filmeEmReproducao, setFilmeEmReproducao] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showLiveTV, setShowLiveTV] = useState(false);
  const [is90sMode, setIs90sMode] = useState(false);
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
      if (firebaseUser) {
        setUser(firebaseUser);
      } else {
        // AUTO-LOGIN ELITE BYPASS: Mock user for testing phase
        setUser({
          uid: 'lord-bypass-uid',
          email: 'lordjunnior@gmail.com',
          displayName: 'Lord Junnior (Bypass)',
          photoURL: 'https://cdn-icons-png.flaticon.com/512/2503/2503508.png',
          emailVerified: true
        } as any);
      }
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

  // --- 3. MOTOR SUPREME: INJEÇÃO MANUAL (JBOX + PLAYLISTS) ---
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [m1, m2, t1, t2, a1, a2, k1, k2, r1, trend, heroData] = await Promise.allSettled([
          getMoviesByGenre("movie", 28), searchMovies("Filmes Dublados"),
          getMoviesByGenre("tv", 10759), searchMovies("Séries Dubladas"),
          getMoviesByGenre("tv", 16), searchMovies("Anime Dublado"),
          getMoviesByGenre("movie", 10751), searchMovies("Desenho Animado"),
          searchMovies("Runtime TV"),
          getMovies("trending"),
          getMovieDetails(872585, "movie")
        ]);

        // ⚔️ VAULT INSTANTÂNEO COM SUAS CAPAS (Sem busca externa para evitar timeout)
        const tokusatsuVault: Movie[] = [
          ...Array.from({ length: 12 }).map((_, i) => ({
            id: `jaspion-ep-${i + 1}`,
            titulo: `JASPION | EPISÓDIO ${String(i + 1).padStart(2, '0')}`,
            nota: "10.0",
            ano: "OFICIAL",
            genero: "Tokusatsu Dublado",
            resumo: "O Fantástico Jaspion enfrenta as forças de Satan Goss com a dublagem clássica.",
            img: "/capa-jaspion-supreme.jpg",
            bg: "/capa-jaspion-supreme.jpg",
            src: `https://www.youtube.com/watch?v=VIDEO_ID&list=PL60SfTrykhMwuIbgWhdMMB0yPQuoVWqmi`,
            media_type: 'live' as const
          })),
          ...Array.from({ length: 12 }).map((_, i) => ({
            id: `jiraiya-ep-${i + 1}`,
            titulo: `JIRAIYA | EPISÓDIO ${String(i + 1).padStart(2, '0')}`,
            nota: "10.0",
            ano: "OFICIAL",
            genero: "Ninja Olimpíada",
            resumo: "Toha Yamashi protege a Pako com a armadura de Jiraiya em sinal oficial.",
            img: "/capa-jiraiya-supreme.jpg",
            bg: "/capa-jiraiya-supreme.jpg",
            src: `https://www.youtube.com/watch?v=VIDEO_ID&list=PL60SfTrykhMx2I8m_v7_6A8LST4D5v6`,
            media_type: 'live' as const
          }))
        ];

        setCategorias(prev => {
          const next = [...prev];
          const update = (type: string, data: any[]) => {
            const i = next.findIndex(c => c.type === type);
            if (i !== -1) next[i] = { ...next[i], filmes: data };
            return next;
          };
          const merge = (r1: any, r2: any, type?: string) => {
            const data = [...(r1.status === 'fulfilled' ? r1.value : []), ...(r2.status === 'fulfilled' ? r2.value : [])];
            return formatTMDBData(data, type).slice(0, 20);
          };
          update("movie", merge(m1, m2, "movie"));
          update("tv", merge(t1, t2, "tv"));
          update("animes", merge(a1, a2, "animes"));
          update("kids", merge(k1, k2, "kids"));
         update("tokusatsu", tokusatsuVault);
        update("runtime", merge(r1, { status: 'rejected' } as any, "runtime"));

        if (trend.status === 'fulfilled') {
          update("trending", formatTMDBData(trend.value.filter((it: any) => it.backdrop_path)).slice(0, 20));
        }
        return next;
      });

      if (heroData.status === 'fulfilled' && heroData.value) {
        const h = heroData.value;
        setFilmeDestaque({
          id: h.id, titulo: h.title.toUpperCase(), nota: h.vote_average.toFixed(1),
          idade: "14", ano: h.release_date.split("-")[0], resumo: h.overview,
          img: `https://image.tmdb.org/t/p/w500${h.poster_path}`,
          bg: `https://image.tmdb.org/t/p/original${h.backdrop_path || h.poster_path}`,
          media_type: 'movie'
        });
      }
    } catch (error) {
      console.error("Erro na LordEngine:", error);
    } finally {
      setLoading(false);
      setCarregado(true);
    }
  }
  loadData();
}, []);
          update("movie", merge(m1, m2, "movie"));
          update("tv", merge(t1, t2, "tv"));
          update("animes", merge(a1, a2, "animes"));
          update("kids", merge(k1, k2, "kids"));
          update("tokusatsu", tokusatsuVault); // ENTRA NA HORA, SEM DELAY
          update("runtime", merge(r1, { status: 'rejected' }, "runtime"));
          
          if (trend.status === 'fulfilled') {
            update("trending", formatTMDBData(trend.value.filter((it: any) => it.backdrop_path)).slice(0, 20));
          }
          return next;
        });

        if (heroData.status === 'fulfilled' && heroData.value) {
          const h = heroData.value;
          setFilmeDestaque({
            id: h.id,
            titulo: h.title.toUpperCase(),
            nota: h.vote_average.toFixed(1),
            idade: "14",
            ano: h.release_date.split("-")[0],
            resumo: h.overview,
            img: `https://image.tmdb.org/t/p/w500${h.poster_path}`,
            bg: `https://image.tmdb.org/t/p/original${h.backdrop_path || h.poster_path}`,
            media_type: 'movie'
          });
        }
      } catch (error) {
        console.error("Erro na LordEngine:", error);
      } finally {
        setLoading(false);
        setCarregado(true);
      }
    }
    loadData();
  }, []);
        setCategorias(prev => {
          const next = [...prev];
          const update = (type: string, data: any[]) => {
            const i = next.findIndex(c => c.type === type);
            if (i !== -1) next[i] = { ...next[i], filmes: data };
          };

          update("movie", merge(m1, m2, "movie"));
          
          // Séries - REMOVER TOKUSATSU
          const seriesData = merge(t1, t2, "tv").filter(f => 
            !TOKUSATSU_VAULT.some(v => v.id === f.id) && 
            !f.titulo.toLowerCase().includes('jaspion') &&
            !f.titulo.toLowerCase().includes('jiraiya') &&
            !f.titulo.toLowerCase().includes('jiban') &&
            !f.titulo.toLowerCase().includes('changeman') &&
            !f.titulo.toLowerCase().includes('flashman') &&
            !f.titulo.toLowerCase().includes('kamen rider') &&
            !f.titulo.toLowerCase().includes('ultraman')
          );
          update("tv", seriesData);

          update("animes", merge(a1, a2, "animes"));
          update("kids", merge(k1, k2, "kids"));
          
          // Trending - SEM BURACOS E COM BACKDROP OBRIGATÓRIO
          if (trend.status === 'fulfilled') {
            const trendData = trend.value
              .filter((item: any) => item.backdrop_path && item.poster_path) // FILTRO RÍGIDO DE IMAGEM
              .map((item: any) => formatTMDBData([item])[0])
              .filter(f => 
                f.img && 
                !f.img.includes('unsplash') && 
                f.bg && 
                !f.bg.includes('unsplash') &&
                f.resumo && 
                f.resumo.length > 20
              );
            update("trending", trendData.slice(0, 20));
          }

          // TV ao Vivo - GRADE COMPLETA LORD + RUNTIME (COM FALLBACK DE LOGO)
          const allLive: Movie[] = LIVE_CHANNELS.map(c => {
            const isRuntime = c.id.startsWith('runtime');
            const fallbackLogo = isRuntime 
              ? "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop" // Cinema/TV fallback
              : c.logo;

            return {
              id: c.id as any,
              titulo: c.name.toUpperCase(),
              nota: "10.0",
              ano: "LIVE",
              genero: "Canal ao Vivo",
              resumo: `Assista ${c.name} ao vivo e dublado. Sinal Supreme 4K.`,
              img: c.logo || fallbackLogo,
              bg: c.logo || fallbackLogo,
              src: c.stream,
              media_type: 'live'
            };
          });
          update("live", allLive);
          
          // Runtime Category (Live Channels + Conteúdo Dublado)
          const runtimeLive: Movie[] = LIVE_CHANNELS.filter(c => c.id.startsWith('runtime')).map(c => {
            const fallbackLogo = "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=2070&auto=format&fit=crop";
            return {
              id: c.id as any,
              titulo: c.name.toUpperCase(),
              nota: "10.0",
              ano: "LIVE",
              genero: "Canal ao Vivo",
              resumo: `Assista ${c.name} ao vivo e dublado. Conteúdo 100% legalizado via Runtime TV Brasil.`,
              img: c.logo || fallbackLogo,
              bg: c.logo || fallbackLogo,
              src: c.stream,
              media_type: 'live'
            };
          });
          const runtimeMovies = [
            ...runtimeLive,
            ...(r1.status === 'fulfilled' ? formatTMDBData(r1.value, "runtime").map(m => ({ ...m, src: 'runtime' })) : [])
          ];
          update("runtime", runtimeMovies.slice(0, 20));
          
          // Tokusatsu Section (Vault Only for Precision)
          update("tokusatsu", vaultMovies.slice(0, 20));
          
          return next;
        });

      } catch (error) {
        console.error("Erro na LordEngine:", error);
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

  // --- LÓGICA DE FILTRO E AGRUPAMENTO ---
  const categoriasFiltradas = useMemo(() => {
    const allMovies = Array.from(new Map(categorias.flatMap(c => c.filmes).map(m => [m.id, m])).values());
    
    const groupSagas = (filmes: Movie[]): Movie[] => {
      const sagas: { [key: string]: Movie[] } = {};
      const keywords = [
        "Dragon Ball", "Naruto", "One Piece", "Cavaleiros do Zodíaco", "Yu Yu Hakusho",
        "Jaspion", "Jiraiya", "Jiban", "Changeman", "Flashman", "Lion Man", "Kamen Rider", 
        "Cybercop", "Winspector", "Solbrain", "National Kid", "Ultraman", "Spectreman", 
        "Sharivan", "Shaider", "Goggle V", "Dynaman", "Maskman", "Patrine", "Spielvan",
        "Star Wars", "Harry Potter"
      ];
      
      const result: Movie[] = [];
      filmes.forEach(f => {
        let foundSaga = false;
        for (const kw of keywords) {
          if (f.titulo.toLowerCase().includes(kw.toLowerCase())) {
            if (!sagas[kw]) sagas[kw] = [];
            sagas[kw].push(f);
            foundSaga = true;
            break;
          }
        }
        if (!foundSaga) result.push(f);
      });

      Object.entries(sagas).forEach(([kw, items]) => {
        if (items.length > 1) {
          result.unshift({
            ...items[0],
            id: `saga-${kw}`,
            titulo: `Saga ${kw} Completa`,
            isSaga: true,
            sagaItems: items,
          });
        } else {
          result.push(...items);
        }
      });

      return result;
    };

    if (busca.trim() !== "") {
      const b = busca.toLowerCase();
      // Busca por vibe (SEO + PNL)
      const vibeMap: {[key: string]: string[]} = {
        "triste": ["drama", "chorar", "emocional"],
        "épico": ["ação", "aventura", "fantasia"],
        "sombrio": ["terror", "suspense", "mistério"],
        "engraçado": ["comédia", "divertido"]
      };

      let searchTerms = [b];
      Object.entries(vibeMap).forEach(([vibe, terms]) => {
        if (b.includes(vibe)) searchTerms = [...searchTerms, ...terms];
      });

      const filtered = allMovies.filter(f => 
        searchTerms.some(term => 
          f.titulo.toLowerCase().includes(term) || 
          f.resumo?.toLowerCase().includes(term) ||
          f.genero?.toLowerCase().includes(term)
        )
      );
      return [{ nome: `Resultados para "${busca}"`, type: "search", filmes: groupSagas(filtered) }];
    }

    const intelligentCategories: Categoria[] = [
      { 
        nome: "Continue assistindo", 
        type: "history", 
        filmes: history.map(h => {
          const movie = allMovies.find(m => String(m.id) === String(h.movieId));
          return movie ? ({ ...movie, progress: h.progress, isHistory: true } as Movie) : null;
        }).filter((m): m is Movie => m !== null)
      },
      { 
        nome: "Em alta agora", 
        type: "trending", 
        filmes: groupSagas(allMovies.filter(f => parseFloat(f.nota) > 8.5)).slice(0, 20) 
      },
      // PRINCIPAL
      { 
        nome: "Filmes", 
        type: "movie", 
        filmes: groupSagas(allMovies.filter(f => f.media_type === 'movie')).slice(0, 20) 
      },
      { 
        nome: "Series", 
        type: "tv", 
        filmes: groupSagas(allMovies.filter(f => f.media_type === 'tv')).slice(0, 20) 
      },
      { 
        nome: "Heróis Lendários", 
        type: "tokusatsu", 
        filmes: groupSagas(allMovies.filter(f => 
          (f as any).type === 'tokusatsu' || 
          f.titulo.toLowerCase().includes('jaspion') || 
          f.titulo.toLowerCase().includes('jiraiya') || 
          f.titulo.toLowerCase().includes('jiban') || 
          f.titulo.toLowerCase().includes('changeman') || 
          f.titulo.toLowerCase().includes('flashman') || 
          f.titulo.toLowerCase().includes('kamen rider') || 
          f.titulo.toLowerCase().includes('ultraman') ||
          f.titulo.toLowerCase().includes('metal hero') ||
          f.titulo.toLowerCase().includes('super sentai') ||
          f.titulo.toLowerCase().includes('tokusatsu') ||
          f.titulo.toLowerCase().includes('lion man') ||
          f.titulo.toLowerCase().includes('cybercop') ||
          f.titulo.toLowerCase().includes('winspector') ||
          f.titulo.toLowerCase().includes('spectreman') ||
          f.titulo.toLowerCase().includes('sharivan') ||
          f.titulo.toLowerCase().includes('shaider') ||
          f.titulo.toLowerCase().includes('gavan') ||
          f.titulo.toLowerCase().includes('spielvan') ||
          f.titulo.toLowerCase().includes('metalder') ||
          f.titulo.toLowerCase().includes('maskman') ||
          f.titulo.toLowerCase().includes('goggle five') ||
          f.titulo.toLowerCase().includes('solbrain') ||
          f.titulo.toLowerCase().includes('machine man') ||
          f.titulo.toLowerCase().includes('ultraseven') ||
          f.titulo.toLowerCase().includes('patrine')
        )).slice(0, 20) 
      },
      { 
        nome: "TV ao Vivo", 
        type: "live", 
        filmes: categorias.find(c => c.type === 'live')?.filmes || [] 
      },
      // BELOW PRINCIPAL
      { 
        nome: "Animes", 
        type: "animes", 
        filmes: groupSagas(allMovies.filter(f => f.genero?.toLowerCase().includes('animação') || f.genero?.toLowerCase().includes('anime'))).slice(0, 20) 
      },
      { 
        nome: "Kids", 
        type: "kids", 
        filmes: groupSagas(allMovies.filter(f => f.genero?.toLowerCase().includes('família') || f.genero?.toLowerCase().includes('infantil'))).slice(0, 20) 
      },
      // OTHERS
      { 
        nome: "Classicos", 
        type: "classic", 
        filmes: groupSagas(allMovies.filter(f => f.ano && parseInt(f.ano) < 2010)).slice(0, 20) 
      },
      { 
        nome: "Acao", 
        type: "action", 
        filmes: groupSagas(allMovies.filter(f => f.genero?.toLowerCase().includes('ação') || f.genero?.toLowerCase().includes('aventura'))).slice(0, 20) 
      }
    ];

    return intelligentCategories.filter(c => c.filmes.length > 0 || c.type === 'tokusatsu');
  }, [categorias, busca, perfil, is90sMode, priorizarDublados, history, view, watchlist]);

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
    if (filme.isSaga) {
      setSagaSelecionada(filme);
      return;
    }
    setFilmeSelecionado({ 
      ...filme, 
      similar: (categorias.flatMap(c => c.filmes) as any[])
        .filter(f => f.id !== filme.id && (f.genero === filme.genero || f.media_type === filme.media_type))
        .slice(0, 6)
    });
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

  // --- TELA DE LOGIN (BYPASS ATIVO) ---
  if (!user && isAuthReady) {
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
    <div className={`min-h-screen transition-colors duration-1000 selection:bg-cyan-500 selection:text-black ${is90sMode ? 'mode-90s bg-[#1a0f0f]' : 'bg-[#020202]'}`}>
      {/* AMBILIGHT GLOW (IMERSÃO TOTAL) */}
      <div className="ambilight-glow" />
      
      {/* GLOBAL ANNOUNCEMENT */}
      <AnimatePresence>
        {adminConfig?.global_announcement && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`py-2 px-6 flex items-center justify-center gap-4 relative z-[150] ${is90sMode ? 'bg-retro-orange text-black' : 'bg-cyan-500 text-black'}`}
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span className="text-[10px] font-black uppercase tracking-widest">{adminConfig.global_announcement}</span>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 1. BARRA DE NAVEGAÇÃO (NAVBAR) */}
      <nav className="fixed top-0 w-full z-[60] px-4 md:px-8 py-4 md:py-6 flex flex-row justify-between items-center gap-4 glass-nav">
        <div className="flex items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onClick={() => { setView('home'); setBusca(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="flex flex-col cursor-pointer items-start"
          >
            <div className="flex items-center">
              <span className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase logo-lord">LORD</span>
              <span className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase logo-flix">FLIX</span>
            </div>
            <span className="text-[8px] md:text-[10px] font-bold text-white/40 uppercase tracking-[0.3em] ml-1">Anime & Tokusatsu</span>
          </motion.div>

          <div className="hidden lg:flex items-center gap-8">
            {[
              { label: 'Início', icon: Home, action: () => { setView('home'); setBusca(''); window.scrollTo({ top: 0, behavior: 'smooth' }); } },
              { label: 'Filmes', icon: Film, action: () => { setView('home'); setBusca(''); setTimeout(() => document.getElementById('cat-movie')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } },
              { label: 'Séries', icon: Tv, action: () => { setView('home'); setBusca(''); setTimeout(() => document.getElementById('cat-tv')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } },
              { label: 'TV ao Vivo', icon: Globe, action: () => { setShowLiveTV(true); } },
              { label: 'Animes', icon: Zap, action: () => { setView('home'); setBusca(''); setTimeout(() => document.getElementById('cat-animes')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } },
              { label: 'Tokusatsu', icon: Zap, action: () => { setView('home'); setBusca(''); setTimeout(() => document.getElementById('cat-tokusatsu')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } },
              { label: 'Kids', icon: Smile, action: () => { setView('home'); setBusca(''); setTimeout(() => document.getElementById('cat-kids')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100); } }
            ].map((item) => (
              <button 
                key={item.label}
                onClick={item.action}
                className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 hover:text-white transition-all"
              >
                <item.icon className={`w-3 h-3 transition-colors ${item.label === 'Tokusatsu' ? 'group-hover:text-cyan-500' : 'group-hover:text-cyan-500'}`} />
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* SELETOR DE PERFIL (CONTROLE PARENTAL) */}
        <div className="flex gap-2 md:gap-6 items-center justify-end">
          {/* SEARCH BOX */}
          <div className="hidden md:flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 w-64 focus-within:w-80 transition-all">
            <Search className="w-4 h-4 text-white/40 mr-2" />
            <input 
              type="text" 
              placeholder="Busca inteligente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="bg-transparent border-none outline-none text-[10px] uppercase font-black tracking-widest w-full text-white placeholder:text-white/20"
            />
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

            {/* PROFILE */}
            <button 
              onClick={() => setShowProfile(true)}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-white/40 transition-all"
            >
              <img src={user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} alt="User" />
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
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ 
                  scale: { duration: 20, ease: "linear", repeat: Infinity, repeatType: "reverse" },
                  opacity: { duration: 1.5 }
                }}
                src={filmeDestaque.bg} 
                alt="Destaque LordFlix Supreme - Cinema de Elite" 
                className="w-full h-full object-cover object-center md:object-top"
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
            <div className="flex items-center gap-4 mb-4">
              <span className="text-cyan-400 font-black tracking-[0.3em] md:tracking-[0.5em] text-[10px] md:text-sm uppercase drop-shadow-neon">
                LORDFLIX EXCLUSIVE
              </span>
              <span className="bg-gold text-black px-2 md:px-3 py-0.5 md:py-1 text-[8px] md:text-[10px] font-black uppercase tracking-widest rounded-sm">
                Dublado
              </span>
            </div>

            <div className="flex flex-wrap gap-3 mb-8">
              <span className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(34,211,238,0.4)]">Dublado</span>
              <span className="bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Clássico</span>
              <span className="bg-white/10 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-white/10">Saga Longa</span>
            </div>

            <h1 className="text-4xl md:text-8xl lg:text-[8rem] font-black text-white leading-[0.9] md:leading-[0.85] tracking-tighter uppercase mb-6 md:mb-8 italic">
              Assista os maiores <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-cyan-400 bg-[length:200%_auto] animate-gradient-x">sucessos agora</span>
            </h1>
            
            <p className="max-w-2xl text-zinc-300 text-sm md:text-2xl font-medium leading-relaxed mb-8 md:mb-12 drop-shadow-2xl line-clamp-3 md:line-clamp-none">
              Filmes, séries e clássicos em um só lugar. Onde a tecnologia encontra a nostalgia.
            </p>

            <div className="flex flex-wrap gap-4 mb-12">
              <button 
                onClick={() => handleAssistir(filmeDestaque)}
                className="bg-white text-black px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-cyan-500 transition-all active:scale-95 shadow-2xl"
              >
                Assistir agora
              </button>
              <button 
                onClick={() => {
                  const el = document.getElementById('catalogo');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-full font-black text-xs uppercase tracking-[0.3em] hover:bg-white/20 transition-all active:scale-95"
              >
                Começar a assistir
              </button>
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
                      handleAssistir={handleAssistir}
                      toggleWatchlist={toggleWatchlist}
                      watchlist={watchlist}
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
          <div className="space-y-24 md:space-y-40">
            {/* SEO HIDDEN TITLES */}
            <div className="sr-only">
              <h1>Assistir Filmes Online</h1>
              <h2>Séries para Maratonar</h2>
              <h2>Anime Dublado e Legendado</h2>
              <h2>Tokusatsu Clássico Online</h2>
            </div>

            {(categoriasFiltradas || []).map((cat, idx) => {
              // Layout Variations Logic
              const isTrending = cat.type === 'trending';
              const isTV = cat.type === 'tv';
              const isAnime = cat.type === 'animes';
              const isKids = cat.type === 'kids';
              const isTokusatsu = cat.type === 'tokusatsu';

              return (
                <section 
                  key={idx} 
                  id={`cat-${cat.type}`} 
                  className={`px-4 md:px-20 transition-all duration-700 cat-${cat.type} ${isKids ? 'py-12 bg-white/5 rounded-[60px] mx-4 md:mx-10' : ''}`}
                >
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 md:mb-16 gap-6">
                    <div className="flex items-center gap-4 md:gap-10">
                      <div className={`h-12 md:h-24 w-2 rounded-full shadow-lg ${isKids ? 'bg-pink-500 shadow-pink-500/50' : 'bg-cyan-500 shadow-cyan-500/60'}`} />
                      <div>
                        <h2 className={`text-3xl md:text-8xl font-black uppercase italic tracking-tighter leading-none ${isKids ? 'text-pink-500' : 'text-white'}`}>
                          {cat.nome}
                        </h2>
                        <p className="text-zinc-500 text-[10px] md:text-xs font-black uppercase tracking-[0.5em] mt-4">
                          {isTokusatsu ? 'Reviva os maiores tokusatsu dos anos 90' : 
                           isKids ? 'Diversão garantida para toda a família' : 
                           'Catálogo LordFlix Supreme'}
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => setViewCategory(cat)}
                      className="group flex items-center gap-4 bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-full transition-all active:scale-95 self-start md:self-auto"
                    >
                      <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white">Explorar</span>
                      <RefreshCw className="w-4 h-4 md:w-5 md:h-5 text-cyan-500 group-hover:rotate-180 transition-transform duration-700" />
                    </button>
                  </div>

                  {isTrending ? (
                    // LARGE HIGHLIGHT FOR TRENDING
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                      <div 
                        onClick={() => handleFilmeSelecionado(cat.filmes[0])}
                        className="relative aspect-video rounded-[40px] overflow-hidden cursor-pointer group shadow-2xl"
                      >
                        <img src={cat.filmes[0]?.bg} alt={cat.filmes[0]?.titulo} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                        <div className="absolute bottom-10 left-10 right-10">
                          <span className="bg-cyan-500 text-black px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 inline-block">Destaque da Semana</span>
                          <h3 className="text-4xl md:text-6xl font-black text-white uppercase italic tracking-tighter mb-4">{cat.filmes[0]?.titulo}</h3>
                          <p className="text-silver/60 text-sm md:text-lg font-medium line-clamp-2 max-w-2xl">{cat.filmes[0]?.resumo}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                        {cat.filmes.slice(1, 7).map((filme: any) => (
                          <MoviePoster 
                            key={filme.id} 
                            filme={filme} 
                            onClick={() => handleFilmeSelecionado(filme)}
                            handleAssistir={handleAssistir}
                            toggleWatchlist={toggleWatchlist}
                            watchlist={watchlist}
                          />
                        ))}
                      </div>
                    </div>
                  ) : isTV ? (
                    // CAROUSEL FOR SERIES (Horizontal Scroll)
                    <div className="flex gap-6 overflow-x-auto pb-10 scroll-horizontal snap-x">
                      {cat.filmes.map((filme: any) => (
                        <div key={filme.id} className="min-w-[200px] md:min-w-[300px] snap-start">
                          <MoviePoster 
                            filme={filme} 
                            onClick={() => handleFilmeSelecionado(filme)}
                            handleAssistir={handleAssistir}
                            toggleWatchlist={toggleWatchlist}
                            watchlist={watchlist}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    // GRID FOR OTHERS (With variations)
                    <div className={`grid gap-4 md:gap-10 ${
                      isAnime ? 'grid-cols-3 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10' : 
                      isKids ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' :
                      'grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                    }`}>
                      {(cat.filmes || []).slice(0, isAnime ? 20 : 12).map((filme: any) => (
                        <MoviePoster 
                          key={filme.id} 
                          filme={filme} 
                          onClick={() => handleFilmeSelecionado(filme)}
                          type={cat.type === 'classic' || cat.type === 'nostalgia' ? 'classic' : 'release'}
                          handleAssistir={handleAssistir}
                          toggleWatchlist={toggleWatchlist}
                          watchlist={watchlist}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {/* LORD VISION LIVE (SEÇÃO DE ELITE) */}
        <section className="px-8 md:px-20 relative overflow-hidden py-24">
          {/* BACKGROUND GLOW */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-end gap-8 mb-16 relative z-10">
            <div className="max-w-3xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="flex items-center gap-2 bg-red-600 px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.4)]">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white italic">Live Now</span>
                </div>
                <span className="text-cyan-500 font-black tracking-[0.4em] text-[10px] uppercase">LordFlix Broadcast</span>
              </div>
              <h2 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter text-white leading-none">LordFlix <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Live TV</span></h2>
              <p className="text-zinc-400 text-lg md:text-xl font-medium mt-8 leading-relaxed">A revolução da TV ao vivo. Transmissão via satélite com latência zero e qualidade 4K Ultra HD. Sinta a imersão total.</p>
            </div>
            <button 
              onClick={() => setShowLiveTV(true)}
              className="group relative bg-white text-black px-12 py-5 rounded-full font-black text-xs uppercase tracking-[0.4em] hover:bg-cyan-500 transition-all active:scale-95 shadow-[0_0_40px_rgba(255,255,255,0.2)] overflow-hidden"
            >
              <span className="relative z-10">Sintonizar Agora</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 relative z-10">
            {[
              { title: 'Lord Sports Premium', category: 'Esportes', img: 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?q=80&w=2069&auto=format&fit=crop' },
              { title: 'Lord Cinema Elite', category: 'Cinema', img: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=2059&auto=format&fit=crop' },
              { title: 'Lord News 24h', category: 'Notícias', img: 'https://images.unsplash.com/photo-1495020689067-958852a7765e?q=80&w=2070&auto=format&fit=crop' }
            ].map((item, i) => (
              <motion.div 
                key={i}
                whileHover={{ y: -15, scale: 1.02 }}
                onClick={() => setShowLiveTV(true)}
                className="group relative aspect-video rounded-[40px] overflow-hidden border-2 border-white/5 hover:border-cyan-500/50 transition-all duration-700 cursor-pointer shadow-2xl bg-zinc-900"
              >
                <img src={item.img} alt={item.title} className="w-full h-full object-cover opacity-40 group-hover:opacity-80 group-hover:scale-110 transition-all duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
                
                <div className="absolute top-6 right-6">
                  <div className="bg-black/60 backdrop-blur-2xl border border-white/10 px-4 py-2 rounded-full">
                    <span className="text-[8px] font-black text-white uppercase tracking-widest">1080p / 4K Ultra HD</span>
                  </div>
                </div>

                <div className="absolute bottom-8 left-8 right-8">
                  <span className="text-cyan-500 font-black text-[9px] uppercase tracking-[0.3em] mb-2 block">{item.category}</span>
                  <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{item.title}</h3>
                </div>

                {/* SHINE EFFECT */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              </motion.div>
            ))}
          </div>
        </section>

        {/* DASHBOARD DE MONITORAMENTO (AUTORIDADE) - Removido a pedido do usuário */}
        {/* BOTTOM NAVIGATION BAR (MOBILE APP-LIKE) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-2xl border-t border-white/10 px-8 py-4 flex justify-between items-center z-[100]">
          <button onClick={() => setView('home')} className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-cyan-500' : 'text-zinc-500'}`}>
            <Home className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setView('movies')} className={`flex flex-col items-center gap-1 ${view === 'movies' ? 'text-cyan-500' : 'text-zinc-500'}`}>
            <Film className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Filmes</span>
          </button>
          <button onClick={() => setView('tv')} className={`flex flex-col items-center gap-1 ${view === 'tv' ? 'text-cyan-500' : 'text-zinc-500'}`}>
            <Tv className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">TV</span>
          </button>
          <button onClick={() => setView('profile')} className={`flex flex-col items-center gap-1 ${view === 'profile' ? 'text-cyan-500' : 'text-zinc-500'}`}>
            <UserIcon className="w-6 h-6" />
            <span className="text-[8px] font-black uppercase tracking-widest">Perfil</span>
          </button>
        </div>
      </main>

      {/* 5.7 MODAL VER TUDO (CATEGORY DETAIL) */}
      <AnimatePresence>
        {viewCategory && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[170] bg-black/98 backdrop-blur-3xl flex flex-col"
          >
            <div className="p-8 md:p-16 border-b border-white/5 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-20">
              <div className="flex items-center gap-6">
                <div className="h-12 w-1.5 bg-cyan-500 rounded-full shadow-lg" />
                <div>
                  <h2 className="text-3xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none">{viewCategory.nome}</h2>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.4em] mt-2">Explorando o catálogo supremo</p>
                </div>
              </div>
              <button 
                onClick={() => setViewCategory(null)}
                className="bg-white/5 hover:bg-white/10 p-5 rounded-full transition-all group"
              >
                <X className="w-8 h-8 text-white group-hover:rotate-90 transition-transform" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 md:p-20 no-scrollbar">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-6 md:gap-10">
                {viewCategory.filmes.map((item: any) => (
                  <MoviePoster 
                    key={item.id} 
                    filme={item} 
                    onClick={() => {
                      setViewCategory(null);
                      handleFilmeSelecionado(item);
                    }} 
                    handleAssistir={handleAssistir}
                    toggleWatchlist={toggleWatchlist}
                    watchlist={watchlist}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {sagaSelecionada && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-10"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="max-w-7xl w-full h-full md:h-auto max-h-[90vh] bg-[#050505] rounded-[40px] overflow-hidden border border-white/5 shadow-2xl flex flex-col relative"
            >
              <div className="p-8 md:p-12 border-b border-white/5 flex justify-between items-center">
                <div>
                  <span className="text-retro-orange font-black text-[10px] uppercase tracking-[0.4em] mb-2 block">Coleção de Elite</span>
                  <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter uppercase">{sagaSelecionada.titulo}</h2>
                </div>
                <button 
                  onClick={() => setSagaSelecionada(null)}
                  className="bg-white/5 hover:bg-white/10 p-4 rounded-full transition-all"
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 md:p-12 no-scrollbar">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                  {sagaSelecionada.sagaItems.map((item: any) => (
                    <MoviePoster 
                      key={item.id} 
                      filme={item} 
                      onClick={() => {
                        setSagaSelecionada(null);
                        handleFilmeSelecionado(item);
                      }} 
                      handleAssistir={handleAssistir}
                      toggleWatchlist={toggleWatchlist}
                      watchlist={watchlist}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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

                <div className="flex flex-col md:flex-row gap-4 mb-12">
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

                {/* PARECIDO COM ESTE (RECOMENDAÇÃO INTELIGENTE) */}
                {filmeSelecionado.similar && filmeSelecionado.similar.length > 0 && (
                  <div className="mt-auto pt-10 border-t border-white/5">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-cyan-500 mb-6">Parecido com este</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      {filmeSelecionado.similar.map((sim: any) => (
                        <div 
                          key={sim.id} 
                          className="aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group relative"
                          onClick={() => handleFilmeSelecionado(sim)}
                        >
                          <img src={sim.img} alt={sim.titulo} className="w-full h-full object-cover transition-transform group-hover:scale-110" referrerPolicy="no-referrer" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            <span className="text-aluminum">Comece a</span> <span className="text-gold">Assistir Agora</span>
          </h2>
          <p className="text-silver/40 uppercase tracking-[0.3em] text-[10px] font-bold mb-12">
            Acesse o catálogo completo e as estreias exclusivas instantaneamente.
          </p>
          <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
            <button 
              onClick={() => {
                const el = document.getElementById('catalogo');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="flex-1 bg-gold text-black px-12 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white transition-all shadow-2xl shadow-gold/20"
            >
              Explorar Catálogo
            </button>
            <button 
              onClick={() => setView('profile')}
              className="flex-1 bg-white/5 border border-white/10 text-white px-12 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] hover:bg-white/10 transition-all"
            >
              Entrar na Plataforma
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
                <li onClick={() => { setView('movies'); window.scrollTo(0,0); }} className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">/filmes-online</li>
                <li onClick={() => { setView('tv'); window.scrollTo(0,0); }} className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">/series-online</li>
                <li onClick={() => { const el = document.getElementById('cat-animes'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">/anime-dublado</li>
                <li onClick={() => { const el = document.getElementById('cat-tokusatsu'); el?.scrollIntoView({ behavior: 'smooth' }); }} className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">/tokusatsu-classico</li>
                <li onClick={() => { setShowLiveTV(true); }} className="hover:text-cyan-500 cursor-pointer transition-all hover:translate-x-2">/tv-ao-vivo-gratis</li>
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
