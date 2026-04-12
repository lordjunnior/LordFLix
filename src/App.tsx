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
import { Shield, AlertCircle, Bell, Plus, Check as CheckIcon, History, Crown, X, RefreshCw, Search, Home, Film, Tv, User as UserIcon, Zap, Sparkles, Flame, Brain, Heart, Sword, Play as PlayIcon, Trophy, Star, Clapperboard, ChevronRight } from 'lucide-react';
import { Button } from "./components/ui/button";
import { Card, CardContent } from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import { Input } from "./components/ui/input";

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

// --- CORE AGGRESSIVE DATA (SEO, CTA, CTR, PNL) ---
const CORE_TITLES = [
  {
    id: 1001,
    title: "Cavaleiros do Zodíaco",
    seoTitle: "Cavaleiros do Zodíaco dublado completo no LordFlix",
    slug: "cavaleiros-do-zodiaco-dublado-completo",
    kind: "Anime",
    era: "Clássico",
    vibe: ["nostalgia", "epico", "dublado", "armaduras"],
    audience: ["anos90", "acao", "familia"],
    dubbed: true,
    kids: true,
    episodes: "114 episódios",
    duration: "longo",
    rating: 9.4,
    headline: "O anime que fez o Brasil correr pra TV.",
    description: "Se você viveu os anos 90, esse clássico dublado vai apertar sua nostalgia e te prender por horas.",
    ctrHook: "🔥 Um dos títulos com maior taxa de clique entre fãs de clássicos.",
    microCta: "▶ Assistir agora dublado",
    sectionTags: ["Nostalgia BR", "Heróis e Transformações", "Clássicos", "SEO Forte"],
    img: "https://image.tmdb.org/t/p/w500/96179.jpg", // Placeholder or real ID if known
    bg: "https://image.tmdb.org/t/p/original/96179.jpg",
  },
  {
    id: 1002,
    title: "Yu Yu Hakusho",
    seoTitle: "Yu Yu Hakusho dublado completo para assistir no LordFlix",
    slug: "yu-yu-hakusho-dublado-completo",
    kind: "Anime",
    era: "Clássico",
    vibe: ["nostalgia", "torneio", "dublado", "espiritual"],
    audience: ["anos90", "acao", "maratona"],
    dubbed: true,
    episodes: "112 episódios",
    duration: "medio",
    rating: 9.6,
    headline: "A dublagem que o Brasil nunca esqueceu.",
    description: "Porradaria, carisma e torneios que fazem o usuário clicar quase por impulso quando bate a nostalgia certa.",
    ctrHook: "⚡ Quem começa esse normalmente engata vários episódios.",
    microCta: "🔥 Ver o primeiro episódio",
    sectionTags: ["Nostalgia BR", "Porradaria e Torneio", "Clássicos", "SEO Forte"],
  },
  {
    id: 1003,
    title: "Dragon Ball Z",
    seoTitle: "Dragon Ball Z dublado online no LordFlix",
    slug: "dragon-ball-z-dublado-online",
    kind: "Anime",
    era: "Clássico",
    vibe: ["transformacao", "nostalgia", "dublado", "acao"],
    audience: ["anos90", "familia", "maratona"],
    dubbed: true,
    episodes: "291 episódios",
    duration: "longo",
    rating: 9.2,
    headline: "Transformações que ainda fazem qualquer fã parar tudo.",
    description: "Um clássico que ativa memória afetiva instantânea e aumenta muito o clique quando aparece na vitrine certa.",
    ctrHook: "💥 Forte poder de retenção em sessões longas.",
    microCta: "▶ Maratonar agora",
    sectionTags: ["Nostalgia BR", "Heróis e Transformações", "Clássicos"],
  },
  {
    id: 1004,
    title: "Jaspion",
    seoTitle: "Jaspion clássico dublado no LordFlix",
    slug: "jaspion-classico-dublado",
    kind: "Tokusatsu",
    era: "Clássico",
    vibe: ["nostalgia", "heroi", "metal", "transformacao"],
    audience: ["anos90", "familia", "acao"],
    dubbed: true,
    episodes: "46 episódios",
    duration: "curto",
    rating: 8.9,
    headline: "Só quem viveu os anos 90 entende esse impacto.",
    description: "Tokusatsu raiz com poder absurdo de clique quando é apresentado como relíquia obrigatória da infância brasileira.",
    ctrHook: "⚡ Gatilho de nostalgia muito forte no público 30+.",
    microCta: "⚡ Reviver agora",
    sectionTags: ["Nostalgia BR", "Tokusatsu", "Heróis e Transformações"],
  },
  {
    id: 1005,
    title: "Changeman",
    seoTitle: "Changeman dublado completo no LordFlix",
    slug: "changeman-dublado-completo",
    kind: "Tokusatsu",
    era: "Clássico",
    vibe: ["sentai", "nostalgia", "equipe", "acao"],
    audience: ["anos90", "familia"],
    dubbed: true,
    episodes: "55 episódios",
    duration: "medio",
    rating: 8.7,
    headline: "Heróis, poses icônicas e memória afetiva pura.",
    description: "Quando entra na prateleira certa, esse título converte pela sensação imediata de volta à infância.",
    ctrHook: "🔥 Excelente para sessões de descoberta nostálgica.",
    microCta: "▶ Ver agora",
    sectionTags: ["Nostalgia BR", "Tokusatsu"],
  },
  {
    id: 1006,
    title: "Attack on Titan",
    seoTitle: "Attack on Titan dublado para assistir online no LordFlix",
    slug: "attack-on-titan-dublado-online",
    kind: "Anime",
    era: "Moderno",
    vibe: ["sombrio", "epico", "plot", "acao"],
    audience: ["adulto", "maratona"],
    dubbed: true,
    episodes: "89 episódios",
    duration: "medio",
    rating: 9.7,
    headline: "Se você quer tensão real, aqui começa o vício.",
    description: "Fenômeno moderno com alta retenção para usuários que clicam por intensidade, urgência e plot twist.",
    ctrHook: "🚀 Um dos modernos mais fortes para maratona.",
    microCta: "🔥 Começar agora",
    sectionTags: ["Em alta no Brasil", "Obras-primas"],
  },
  {
    id: 1007,
    title: "Jujutsu Kaisen",
    seoTitle: "Jujutsu Kaisen dublado completo no LordFlix",
    slug: "jujutsu-kaisen-dublado-completo",
    kind: "Anime",
    era: "Moderno",
    vibe: ["acao", "sombrio", "hype", "luta"],
    audience: ["jovem", "acao"],
    dubbed: true,
    episodes: "47 episódios",
    duration: "medio",
    rating: 9.1,
    headline: "Ação moderna que segura clique e retenção.",
    description: "Perfeito para o usuário que quer luta, ritmo alto e recompensa rápida já no começo.",
    ctrHook: "⚔️ Forte CTR em sessões mobile.",
    microCta: "▶ Assistir dublado",
    sectionTags: ["Em alta no Brasil", "Porradaria e Torneio"],
  },
  {
    id: 1008,
    title: "Death Note",
    seoTitle: "Death Note dublado completo online no LordFlix",
    slug: "death-note-dublado-completo-online",
    kind: "Anime",
    era: "Moderno",
    vibe: ["inteligente", "sombrio", "plot", "mindgame"],
    audience: ["adulto", "maratona"],
    dubbed: true,
    episodes: "37 episódios",
    duration: "curto",
    rating: 9.5,
    headline: "Se você gosta de tensão inteligente, vai clicar nisso.",
    description: "Porta de entrada de conversão alta para quem quer algo rápido, forte e com sensação de genialidade.",
    ctrHook: "🧠 Excelente para converter visitante indeciso.",
    microCta: "🧠 Ver o primeiro episódio",
    sectionTags: ["Histórias Inteligentes", "Pra Começar sem Erro", "SEO Forte"],
  },
  {
    id: 1009,
    title: "Monster",
    seoTitle: "Monster anime completo para assistir no LordFlix",
    slug: "monster-anime-completo",
    kind: "Anime",
    era: "Cult",
    vibe: ["inteligente", "sombrio", "psicologico"],
    audience: ["adulto", "prestigio"],
    dubbed: false,
    episodes: "74 episódios",
    duration: "medio",
    rating: 9.4,
    headline: "Pra quem quer algo pesado e difícil de largar.",
    description: "Thriller psicológico premium com apelo forte para público que valoriza densidade e prestígio.",
    ctrHook: "🎯 Excelente para público de alto engajamento.",
    microCta: "▶ Começar agora",
    sectionTags: ["Histórias Inteligentes"],
  },
  {
    id: 1010,
    title: "Clannad: After Story",
    seoTitle: "Clannad After Story online no LordFlix",
    slug: "clannad-after-story-online",
    kind: "Anime",
    era: "Cult",
    vibe: ["emocional", "triste", "romance"],
    audience: ["adulto", "drama"],
    dubbed: false,
    episodes: "24 episódios",
    duration: "curto",
    rating: 9.0,
    headline: "Se você quer sentir de verdade, comece por aqui.",
    description: "Drama com apelo emocional altíssimo para sessões guiadas por catarse e identificação.",
    ctrHook: "💔 Forte retenção com audiência emocional.",
    microCta: "💔 Ver agora",
    sectionTags: ["Vai te Fazer Chorar"],
  },
  {
    id: 1011,
    title: "Your Name",
    seoTitle: "Your Name dublado online no LordFlix",
    slug: "your-name-dublado-online",
    kind: "Filme",
    era: "Moderno",
    vibe: ["emocional", "romance", "visual"],
    audience: ["casual", "filme"],
    dubbed: true,
    episodes: "Filme",
    duration: "curto",
    rating: 8.9,
    headline: "O filme certo para converter qualquer curioso em fã.",
    description: "Ideal para tráfego frio: curto, bonito, emocional e com enorme poder de recomendação boca a boca.",
    ctrHook: "🎬 Ótimo para novos usuários.",
    microCta: "🎬 Assistir hoje",
    sectionTags: ["Filmes Imperdíveis", "Pra Começar sem Erro"],
  },
  {
    id: 1012,
    title: "Kamen Rider Black",
    seoTitle: "Kamen Rider Black dublado no LordFlix",
    slug: "kamen-rider-black-dublado",
    kind: "Tokusatsu",
    era: "Clássico",
    vibe: ["heroi", "sombrio", "transformacao"],
    audience: ["anos90", "acao"],
    dubbed: true,
    episodes: "51 episódios",
    duration: "medio",
    rating: 8.8,
    headline: "Herói clássico com energia sombria e icônica.",
    description: "Funciona muito bem para recomendação cruzada entre tokusatsu clássico e anime de transformação.",
    ctrHook: "⚡ Bom desempenho em vitrines de heróis.",
    microCta: "⚡ Ver agora",
    sectionTags: ["Tokusatsu", "Heróis e Transformações"],
  },
];

const CORE_SECTIONS = [
  {
    key: "continue",
    title: "Continue agora antes que a nostalgia passe",
    subtitle: "Retome exatamente de onde você parou e mantenha o impulso da maratona.",
    icon: PlayIcon,
    filter: (t: any) => [1001, 1004, 1007].includes(t.id),
  },
  {
    key: "trending",
    title: "Os títulos que mais fazem o Brasil clicar hoje",
    subtitle: "Alta procura, alto replay e muito potencial de retenção.",
    icon: Flame,
    filter: (t: any) => t.sectionTags.includes("Em alta no Brasil"),
  },
  {
    key: "nostalgia",
    title: "Se você cresceu nos anos 90, isso aqui vai te prender",
    subtitle: "Curadoria feita para ativar memória afetiva e clique imediato.",
    icon: Tv,
    filter: (t: any) => t.sectionTags.includes("Nostalgia BR"),
  },
  {
    key: "tokusatsu",
    title: "Só quem viveu os anos 90 reconhece essas lendas",
    subtitle: "Tokusatsu clássico com apelo absurdo para o público brasileiro.",
    icon: Zap,
    filter: (t: any) => t.sectionTags.includes("Tokusatsu"),
  },
  {
    key: "acao",
    title: "Se você quer luta e torneio, comece por esses",
    subtitle: "Perfeito para clique impulsivo e recompensa rápida.",
    icon: Trophy,
    filter: (t: any) => t.sectionTags.includes("Porradaria e Torneio"),
  },
  {
    key: "smart",
    title: "Anime inteligente que prende até o último minuto",
    subtitle: "Para quem quer tensão, estratégia e maratona inevitável.",
    icon: Brain,
    filter: (t: any) => t.sectionTags.includes("Histórias Inteligentes"),
  },
  {
    key: "cry",
    title: "Se você quer sentir forte, clique nesses agora",
    subtitle: "Dramas com poder alto de envolvimento emocional.",
    icon: Heart,
    filter: (t: any) => t.sectionTags.includes("Vai te Fazer Chorar"),
  },
  {
    key: "heroes",
    title: "Heróis, armaduras e transformações que o Brasil ama",
    subtitle: "A vitrine certa para fãs de impacto visual e nostalgia poderosa.",
    icon: Star,
    filter: (t: any) => t.sectionTags.includes("Heróis e Transformações"),
  },
  {
    key: "films",
    title: "Filmes rápidos para converter curiosidade em vício",
    subtitle: "A escolha certa para usuários que precisam de uma entrada sem esforço.",
    icon: Clapperboard,
    filter: (t: any) => t.sectionTags.includes("Filmes Imperdíveis"),
  },
];

function scoreRecommendation(item: any, prefs: any) {
  let score = 0;

  if (prefs.dubbedOnly && item.dubbed) score += 24;
  if (prefs.dubbedOnly && !item.dubbed) score -= 18;
  if (prefs.nostalgiaMode && item.audience?.includes("anos90")) score += 28;
  if (prefs.preferredKinds?.includes(item.kind)) score += 18;
  if (prefs.vibes?.some((v: string) => item.vibe?.includes(v))) {
    score += prefs.vibes.filter((v: string) => item.vibe?.includes(v)).length * 11;
  }
  if (prefs.duration && item.duration === prefs.duration) score += 12;
  if (prefs.onlyClassics && item.era === "Clássico") score += 20;
  if (item.sectionTags?.includes("SEO Forte")) score += 7;

  score += parseFloat(item.rating || item.nota || 0);
  return score;
}

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

// --- COMPONENTE DE LINHA AGRESSIVA (SEO + CTR) ---
function SectionRow({ title, subtitle, icon: Icon, items, onAssistir }: any) {
  return (
    <section className="space-y-6 px-4 md:px-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Icon className="h-6 w-6 text-orange-400" />
            <h2 className="text-2xl font-black tracking-tighter text-white md:text-3xl uppercase italic">{title}</h2>
          </div>
          <p className="max-w-3xl text-sm font-medium text-zinc-400">{subtitle}</p>
        </div>
        <button className="hidden items-center gap-1 text-sm font-bold text-zinc-300 transition hover:text-white md:flex uppercase tracking-widest">
          Ver tudo <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item: any) => (
          <motion.div 
            key={item.id} 
            whileHover={{ y: -8, scale: 1.02 }} 
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
          >
            <Card className="overflow-hidden rounded-[32px] border-white/5 bg-zinc-900/40 backdrop-blur-md shadow-2xl shadow-black/40 group">
              <div className="relative aspect-[1.1/1] bg-gradient-to-b from-zinc-800 via-zinc-900 to-black p-6">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(251,146,60,0.15),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.12),transparent_35%)]" />
                
                {/* Imagem de Fundo (se houver) */}
                {item.bg && (
                  <img 
                    src={item.bg} 
                    alt="" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:opacity-40 transition-opacity duration-500"
                    referrerPolicy="no-referrer"
                  />
                )}

                <div className="relative flex h-full flex-col justify-between gap-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="bg-white/10 text-white border-none backdrop-blur-md">{item.kind}</Badge>
                    {item.dubbed && <Badge className="bg-orange-500 text-white border-none shadow-lg shadow-orange-500/20">Dublado 🇧🇷</Badge>}
                    <Badge variant="outline" className="text-zinc-400 border-zinc-700">{item.era}</Badge>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-black leading-none tracking-tighter text-white uppercase italic">{item.title}</h3>
                      <p className="text-xs font-bold text-orange-400 uppercase tracking-wider">{item.headline}</p>
                    </div>
                    <p className="line-clamp-2 text-sm font-medium leading-relaxed text-zinc-400 group-hover:text-zinc-200 transition-colors">
                      {item.description}
                    </p>
                    <div className="rounded-2xl border border-orange-500/10 bg-orange-500/5 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-orange-300/80">
                      {item.ctrHook}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span>{item.episodes}</span>
                      <span className="text-yellow-500">★ {item.rating}</span>
                    </div>
                  </div>
                </div>
              </div>
              <CardContent className="space-y-3 p-5 bg-black/40">
                <Button 
                  onClick={() => onAssistir(item)}
                  className="w-full rounded-2xl bg-white text-black font-black uppercase italic tracking-tighter hover:bg-orange-500 hover:text-white transition-all py-6"
                >
                  <PlayIcon className="mr-2 h-5 w-5 fill-current" /> {item.microCta}
                </Button>
                <div className="flex gap-2">
                  <Button variant="secondary" className="flex-1 rounded-xl bg-zinc-800/50 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-700">
                    <Plus className="mr-2 h-3 w-3" /> Salvar
                  </Button>
                  <Button variant="secondary" className="flex-1 rounded-xl bg-zinc-800/50 text-white font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-700">
                    <Sparkles className="mr-2 h-3 w-3" /> Parecidos
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

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
  const [prefs, setPrefs] = useState({
    dubbedOnly: true,
    nostalgiaMode: true,
    onlyClassics: false,
    duration: "",
    preferredKinds: ["Anime", "Tokusatsu"],
    vibes: ["nostalgia", "acao", "transformacao"],
  });
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
  const hero = filmeDestaque || CORE_TITLES[0];
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

  // --- LÓGICA DE FILTRO AGRESSIVO (SEO + CTR) ---
  const allTitles = useMemo(() => {
    const tmdbTitles = categorias.flatMap(c => c.filmes);
    const seen = new Set();
    const unique = [...CORE_TITLES];
    unique.forEach(t => seen.add(t.id));
    tmdbTitles.forEach(t => {
      if (!seen.has(t.id)) {
        unique.push({
          ...t,
          title: t.titulo, // Normalize title field
          description: t.resumo, // Normalize description field
          rating: parseFloat(t.nota || 0),
          kind: t.media_type === 'movie' ? 'Filme' : 'Série',
          era: parseInt(t.ano) < 2000 ? 'Clássico' : 'Moderno',
          sectionTags: t.type ? [t.type] : [],
          kids: !!t.kids
        });
        seen.add(t.id);
      }
    });
    return unique;
  }, [categorias]);

  const personalized = useMemo(() => {
    return allTitles
      .filter((item) => {
        const q = busca.toLowerCase().trim();
        if (perfil === 'kids' && !item.kids) return false;
        if (!q) return true;
        return (
          (item.title || "").toLowerCase().includes(q) ||
          (item.description || "").toLowerCase().includes(q) ||
          (item.headline || "").toLowerCase().includes(q) ||
          (item.seoTitle || "").toLowerCase().includes(q) ||
          (item.vibe || []).some((v: string) => v.includes(q)) ||
          (item.sectionTags || []).some((s: string) => s.toLowerCase().includes(q))
        );
      })
      .map((item) => ({ ...item, score: scoreRecommendation(item, prefs) }))
      .sort((a, b) => b.score - a.score);
  }, [allTitles, prefs, busca, perfil]);

  const categoriasFiltradas = useMemo(() => {
    const base = CORE_SECTIONS.map(section => {
      const items = personalized.filter(section.filter).slice(0, 8);
      return { ...section, filmes: items };
    }).filter(cat => cat.filmes.length > 0);

    // Injetar Minha Lista
    if (watchlist.length > 0) {
      base.unshift({ 
        key: "watchlist", 
        title: "Minha Lista", 
        subtitle: "Seus títulos salvos para assistir quando quiser.", 
        icon: Plus, 
        filmes: watchlist 
      } as any);
    }

    return base;
  }, [personalized, watchlist]);

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
      <nav className="fixed top-0 w-full z-[60] border-b border-white/5 bg-black/80 backdrop-blur-xl transition-all duration-500">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div className="flex items-center gap-8">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={() => setView('home')}
              className="flex flex-col cursor-pointer items-start"
            >
              <span className="text-2xl md:text-3xl font-black italic tracking-tighter">
                <span className="bg-gradient-to-r from-orange-400 via-red-500 to-fuchsia-500 bg-clip-text text-transparent">LordFlix</span>
              </span>
              <span className="hidden md:block text-[8px] uppercase tracking-[0.4em] font-black text-orange-500/80">
                Anime & Tokusatsu
              </span>
            </motion.div>
            <nav className="hidden items-center gap-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 lg:flex">
              {['Início', 'Explorar', 'Dublados', 'Clássicos', 'Tokusatsu', 'Filmes'].map((item) => (
                <button key={item} className="hover:text-white transition-colors relative group">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-orange-500 group-hover:w-full transition-all" />
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <Input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="assistir yu yu hakusho dublado, anime de luta..."
                className="w-80 rounded-2xl border-white/5 bg-zinc-900/50 pl-10 text-white placeholder:text-zinc-600 focus:border-orange-500/50 transition-all"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {userRole === 'admin' && (
                <button onClick={() => setShowAdminPanel(true)} className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 hover:scale-110 transition-transform">
                  <Shield className="w-5 h-5 text-white" />
                </button>
              )}
              <div 
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-fuchsia-500 flex items-center justify-center cursor-pointer hover:scale-105 transition-transform font-black text-white text-xs"
                onClick={() => setShowProfile(true)}
              >
                {user?.displayName?.split(' ').map(n => n[0]).join('') || 'LJ'}
              </div>
              <button onClick={() => auth.signOut()} className="hidden md:block text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-colors">Sair</button>
            </div>
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

      {/* 3. HERO SECTION (AGGRESSIVE CONVERSION HERO) */}
      <section className="relative min-h-screen w-full overflow-hidden flex flex-col justify-center bg-black pt-20">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.img 
              key={hero.id}
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5 }}
              src={hero.bg || "https://image.tmdb.org/t/p/original/96179.jpg"} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/40 to-transparent z-10" />
        </div>

        <div className="relative z-20 mx-auto max-w-7xl w-full px-4 md:px-8 py-12 grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex flex-col justify-center gap-8"
          >
            <div className="flex flex-wrap gap-3">
              <Badge className="bg-orange-500 text-white border-none px-4 py-1 font-black uppercase tracking-widest">🔥 Alta taxa de clique</Badge>
              {hero.dubbed && <Badge variant="secondary" className="bg-white/10 text-white border-none backdrop-blur-md">Dublado 🇧🇷</Badge>}
              <Badge variant="outline" className="text-zinc-400 border-zinc-800">{hero.era}</Badge>
              <Badge variant="outline" className="text-zinc-400 border-zinc-800">{hero.kind}</Badge>
            </div>

            <div className="space-y-6">
              <p className="text-sm font-black uppercase tracking-[0.3em] text-orange-400 italic">
                O streaming da nostalgia otaku no Brasil
              </p>
              <h1 className="text-5xl md:text-8xl font-black leading-[0.9] tracking-tighter text-white uppercase italic">
                {prefs.nostalgiaMode
                  ? "Se você viveu os anos 90, isso aqui vai te prender por horas."
                  : "Você entrou para clicar rápido no que realmente vale a pena assistir."}
              </h1>
              <p className="max-w-2xl text-xl font-medium leading-relaxed text-zinc-300">
                <span className="text-white font-black italic uppercase">{hero.title}</span> — {hero.description}
              </p>
              <div className="inline-block rounded-2xl border border-orange-500/20 bg-orange-500/5 px-6 py-4 text-sm font-black uppercase tracking-widest text-orange-300 italic">
                {hero.ctrHook}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={() => handleAssistir(hero)}
                className="rounded-2xl bg-white px-10 py-8 text-lg font-black uppercase italic tracking-tighter text-black hover:bg-orange-500 hover:text-white transition-all shadow-2xl shadow-white/10"
              >
                <PlayIcon className="mr-3 h-6 w-6 fill-current" /> {hero.microCta?.toUpperCase()}
              </Button>
              <Button 
                onClick={() => toggleWatchlist(hero)}
                variant="secondary" 
                className="rounded-2xl bg-zinc-900/80 border border-white/5 px-10 py-8 text-lg font-black uppercase italic tracking-tighter text-white hover:bg-zinc-800 transition-all"
              >
                <Plus className="mr-3 h-6 w-6" /> Salvar na minha lista
              </Button>
            </div>

            <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500 fill-current" /> {hero.rating}</span>
              <span>{hero.episodes}</span>
              <span className="text-zinc-700">SEO: {hero.slug}</span>
            </div>
          </motion.div>

          {/* MOTOR DE CONVERSÃO (PREFERÊNCIAS) */}
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col gap-6 rounded-[40px] border border-white/5 bg-zinc-900/40 p-8 backdrop-blur-2xl shadow-2xl"
          >
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Motor de conversão</p>
              <h3 className="mt-2 text-3xl font-black text-white uppercase italic tracking-tighter">Preferências de Clique</h3>
            </div>

            <div className="grid gap-4">
              {[
                { key: 'nostalgiaMode', label: 'Modo Infância Anos 90', desc: 'Ativa gatilhos de memória afetiva e prioriza clássicos.', color: 'orange' },
                { key: 'dubbedOnly', label: 'Priorizar Dublados', desc: 'Aumenta o potencial de clique em títulos populares no BR.', color: 'fuchsia' },
                { key: 'onlyClassics', label: 'Só Clássicos Agora', desc: 'Empurra a home para curadoria raiz e títulos icônicos.', color: 'yellow' }
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPrefs((prev: any) => ({ ...prev, [p.key]: !prev[p.key] }))}
                  className={`rounded-3xl border p-5 text-left transition-all duration-300 ${prefs[p.key as keyof typeof prefs] ? `border-${p.color}-500/50 bg-${p.color}-500/10 shadow-lg shadow-${p.color}-500/10` : "border-white/5 bg-black/20 hover:bg-white/5"}`}
                >
                  <div className="font-black uppercase italic tracking-tighter text-white">{p.label}</div>
                  <div className="text-[10px] font-medium text-zinc-500 mt-1">{p.desc}</div>
                </button>
              ))}
            </div>

            <div className="rounded-3xl bg-black/40 p-6 border border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-4">Recomendações de Elite</p>
              <div className="space-y-4">
                {personalized.slice(0, 4).map((item, idx) => (
                  <div key={item.id} className="flex items-center justify-between group cursor-pointer" onClick={() => handleFilmeSelecionado(item)}>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-black text-zinc-700 italic">{idx + 1}</span>
                      <div>
                        <p className="text-sm font-black text-white uppercase italic tracking-tighter group-hover:text-orange-500 transition-colors">{item.title}</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{item.kind} • Score {item.score.toFixed(1)}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-zinc-800 group-hover:text-white transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. CONTEÚDO PRINCIPAL (TRILHOS SUPREMOS) */}
      <main id="catalogo" className="relative z-10 -mt-20 space-y-24 pb-32">
        
        {/* CONTINUE ASSISTINDO (PNL: Reengajamento Imediato) */}
        {history.length > 0 && (
          <SectionRow 
            title="Continue Assistindo" 
            subtitle="Você parou aqui. Não deixe a história esfriar."
            icon={History}
            items={history}
            onAssistir={handleAssistir}
          />
        )}

        {/* TRILHOS DINÂMICOS (SEO + CTR) */}
        {categoriasFiltradas.map((cat: any) => (
          <SectionRow 
            key={cat.key}
            title={cat.title}
            subtitle={cat.subtitle}
            icon={cat.icon}
            items={cat.filmes}
            onAssistir={handleAssistir}
          />
        ))}

        {/* SEO PRONTO PARA RANQUEAR: CARDS DE AUTORIDADE */}
        <section className="px-4 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { title: "Onde assistir Jaspion dublado?", desc: "Na LordFlix você encontra a coleção completa remasterizada.", icon: Zap },
              { title: "Melhores animes anos 90", desc: "Nossa curadoria foca no que realmente marcou a sua infância.", icon: Sparkles },
              { title: "Tokusatsu no Brasil", desc: "A maior biblioteca de heróis japoneses com dublagem clássica.", icon: Shield }
            ].map((card, i) => (
              <div key={i} className="rounded-[40px] border border-white/5 bg-zinc-900/40 p-10 backdrop-blur-xl">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500">
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-4">{card.title}</h3>
                <p className="text-sm font-medium text-zinc-500 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>
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
