import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db } from '../firebase';
import { X, Crown, Shield, CreditCard, LogOut, User as UserIcon, Zap } from 'lucide-react';

interface ProfileDashboardProps {
  user: any;
  userRole: string;
  userStatus: string;
  onClose: () => void;
}

export const ProfileDashboard = ({ user, userRole, userStatus, onClose }: ProfileDashboardProps) => {
  const isVIP = userRole === 'vip' || userRole === 'admin';

  return (
    <motion.div 
      initial={{ opacity: 0, x: '100%' }}
      animate={{ opacity: 0.98, x: 0 }}
      exit={{ opacity: 0, x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed top-0 right-0 w-full max-w-md h-screen z-[250] bg-zinc-950 border-l border-white/5 shadow-[-50px_0_100px_rgba(0,0,0,0.5)] flex flex-col"
    >
      {/* HEADER */}
      <div className="p-8 flex justify-between items-center border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,0.2)]">
            <UserIcon className="w-5 h-5 text-black" />
          </div>
          <h2 className="text-xl font-black uppercase italic tracking-tighter text-aluminum">Perfil Elite</h2>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-6 h-6 text-silver/40" />
        </button>
      </div>

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto p-8 space-y-10">
        {/* USER INFO */}
        <div className="text-center space-y-4">
          <div className="relative inline-block">
            <img 
              src={user?.photoURL || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"} 
              className="w-24 h-24 rounded-[32px] object-cover border-2 border-white/10 mx-auto"
              referrerPolicy="no-referrer"
            />
            {isVIP && (
              <div className="absolute -top-2 -right-2 bg-gold p-1.5 rounded-lg shadow-lg">
                <Crown className="w-4 h-4 text-black" />
              </div>
            )}
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-widest">{user?.displayName || 'Membro LordFlix'}</h3>
            <p className="text-[10px] font-bold text-silver/30 uppercase tracking-[0.4em]">{user?.email}</p>
          </div>
        </div>

        {/* STATUS CARD */}
        <div className={`p-6 rounded-3xl border ${isVIP ? 'bg-gold/5 border-gold/20' : 'bg-white/5 border-white/10'}`}>
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-silver/40">Status da Conta</span>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${isVIP ? 'bg-gold text-black' : 'bg-zinc-800 text-silver'}`}>
              {userRole === 'admin' ? 'Supreme Admin' : isVIP ? 'Membro VIP' : 'Membro Comum'}
            </span>
          </div>
          <p className="text-xs text-silver/60 leading-relaxed">
            {isVIP 
              ? "Você possui acesso total ao sinal 4K, bitrate absoluto e zero anúncios. O império é seu."
              : "Você está no plano gratuito. Experimente o LordFlix VIP para remover anúncios e liberar o sinal 4K."}
          </p>
        </div>

        {/* BENEFITS / UPGRADE */}
        {!isVIP && (
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500 ml-2">Vantagens VIP</h4>
            <div className="grid grid-cols-1 gap-3">
              {[
                { icon: <Zap className="w-4 h-4" />, text: "Zero Anúncios (Pre-roll Skip)" },
                { icon: <Shield className="w-4 h-4" />, text: "Servidor VOD Premium (Real-Debrid)" },
                { icon: <Crown className="w-4 h-4" />, text: "Qualidade Ultra HD 4K Real" }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-cyan-500">{item.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-silver">{item.text}</span>
                </div>
              ))}
            </div>
            <button className="w-full py-5 bg-gold text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl hover:scale-[1.02] transition-all shadow-[0_10px_30px_rgba(212,175,55,0.2)] flex items-center justify-center gap-3">
              <CreditCard className="w-4 h-4" />
              Assinar LordFlix VIP
            </button>
          </div>
        )}

        {/* SETTINGS */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-silver/20 ml-2">Configurações</h4>
          <button 
            onClick={() => auth.signOut()}
            className="w-full p-4 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between group hover:bg-red-500/10 transition-all"
          >
            <div className="flex items-center gap-4">
              <LogOut className="w-4 h-4 text-red-500" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Encerrar Sessão</span>
            </div>
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-8 border-t border-white/5 text-center">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-silver/10">LordEngine v4.0 — Secure Profile</p>
      </div>
    </motion.div>
  );
};
