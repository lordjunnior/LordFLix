import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, onSnapshot, updateDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { 
  Shield, 
  Activity, 
  Eye, 
  Megaphone, 
  Power, 
  Users, 
  TrendingUp, 
  Ghost,
  X,
  Check,
  AlertTriangle,
  Crown
} from 'lucide-react';

interface AdminConfig {
  global_announcement: string;
  maintenance_mode: boolean;
  active_streams_limit: number;
  current_server_provider: string;
}

interface UserData {
  uid: string;
  email: string;
  role: string;
  status: string;
  photoURL?: string;
}

export const AdminPanel = ({ onClose }: { onClose: () => void }) => {
  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [announcement, setAnnouncement] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubConfig = onSnapshot(doc(db, 'config', 'admin'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as AdminConfig);
        setAnnouncement(snapshot.data().global_announcement);
      }
      setLoading(false);
    }, (error) => handleFirestoreError(error, OperationType.GET, 'config/admin'));

    const fetchUsers = async () => {
      try {
        const q = query(collection(db, 'users'), limit(10));
        const snapshot = await getDocs(q);
        setUsers(snapshot.docs.map(d => d.data() as UserData));
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'users');
      }
    };

    fetchUsers();
    return () => unsubConfig();
  }, []);

  const updateConfig = async (updates: Partial<AdminConfig>) => {
    try {
      await updateDoc(doc(db, 'config', 'admin'), updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'config/admin');
    }
  };

  const toggleMaintenance = () => {
    if (config) updateConfig({ maintenance_mode: !config.maintenance_mode });
  };

  const saveAnnouncement = () => {
    updateConfig({ global_announcement: announcement });
  };

  const toggleVIP = async (uid: string, currentRole: string) => {
    try {
      const newRole = currentRole === 'vip' ? 'user' : 'vip';
      await updateDoc(doc(db, 'users', uid), { role: newRole });
      setUsers(users.map(u => u.uid === uid ? { ...u, role: newRole } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const shadowBanUser = async (uid: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'shadow_banned' ? 'active' : 'shadow_banned';
      await updateDoc(doc(db, 'users', uid), { status: newStatus });
      // Refresh local list
      setUsers(users.map(u => u.uid === uid ? { ...u, status: newStatus } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${uid}`);
    }
  };

  if (loading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 md:p-10"
    >
      <div className="w-full max-w-6xl h-[85vh] bg-zinc-900 border border-white/10 rounded-[40px] overflow-hidden flex flex-col shadow-[0_0_100px_rgba(34,211,238,0.1)]">
        {/* HEADER */}
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(34,211,238,0.3)]">
              <Shield className="w-6 h-6 text-black" />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-aluminum">Central de Inteligência</h2>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-cyan-500">Power Level: Infinite</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-colors">
            <X className="w-6 h-6 text-silver/40" />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* COL 1: COMANDO GLOBAL */}
          <div className="space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <Megaphone className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xs font-black uppercase tracking-widest text-silver">The Voice of Lord</h3>
              </div>
              <textarea 
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="w-full h-32 bg-black/40 border border-white/10 rounded-2xl p-4 text-xs text-silver outline-none focus:border-cyan-500 transition-colors resize-none"
                placeholder="Digite a notificação global..."
              />
              <button 
                onClick={saveAnnouncement}
                className="w-full mt-4 py-4 bg-cyan-500 text-black font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-cyan-400 transition-all"
              >
                Transmitir Agora
              </button>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Power className="w-5 h-5 text-red-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-silver">Kill Switch</h3>
                </div>
                <button 
                  onClick={toggleMaintenance}
                  className={`w-14 h-8 rounded-full relative transition-colors ${config?.maintenance_mode ? 'bg-red-500' : 'bg-zinc-700'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${config?.maintenance_mode ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <p className="text-[9px] text-silver/40 uppercase leading-relaxed">
                Ativa o modo de manutenção global. Todos os usuários serão bloqueados instantaneamente.
              </p>
            </div>
          </div>

          {/* COL 2: MONITORAMENTO & SHADOW BAN */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-silver">Membros Online</h3>
                </div>
                <span className="text-[10px] font-black text-cyan-500 bg-cyan-500/10 px-3 py-1 rounded-full uppercase">
                  {users.length} Ativos
                </span>
              </div>
              
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.uid} className="flex items-center justify-between p-4 bg-black/20 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-[10px] font-black overflow-hidden border border-white/5">
                        {user.photoURL ? (
                          <img src={user.photoURL} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          user.email[0].toUpperCase()
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-silver">{user.email}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-[8px] font-black uppercase tracking-widest text-silver/30">{user.role}</p>
                          {user.role === 'vip' && <Crown className="w-3 h-3 text-gold" />}
                          {user.role === 'admin' && <Shield className="w-3 h-3 text-cyan-500" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleVIP(user.uid, user.role)}
                        className={`p-2 rounded-lg transition-colors ${user.role === 'vip' ? 'bg-gold/20 text-gold' : 'bg-white/5 text-silver/40 hover:text-gold'}`}
                        title="Toggle VIP"
                      >
                        <Crown className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => shadowBanUser(user.uid, user.status)}
                        className={`p-2 rounded-lg transition-colors ${user.status === 'shadow_banned' ? 'bg-orange-500/20 text-orange-500' : 'bg-white/5 text-silver/40 hover:text-orange-500'}`}
                        title="Shadow Ban"
                      >
                        <Ghost className="w-4 h-4" />
                      </button>
                      <button className="p-2 bg-white/5 text-silver/40 hover:text-red-500 rounded-lg transition-colors">
                        <AlertTriangle className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
                <div className="flex items-center gap-3 mb-6">
                  <TrendingUp className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-silver">Heatmap de Audiência</h3>
                </div>
                <div className="h-32 flex items-end gap-2 px-2">
                  {[40, 70, 45, 90, 65, 80, 50].map((h, i) => (
                    <div key={i} className="flex-1 bg-cyan-500/20 rounded-t-lg relative group">
                      <motion.div 
                        initial={{ height: 0 }}
                        animate={{ height: `${h}%` }}
                        className="absolute bottom-0 left-0 w-full bg-cyan-500 rounded-t-lg shadow-[0_0_15px_rgba(34,211,238,0.3)]"
                      />
                    </div>
                  ))}
                </div>
                <p className="mt-4 text-[9px] text-center font-black uppercase tracking-widest text-silver/20">Picos de Acesso (24h)</p>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-center items-center text-center">
                <Eye className="w-8 h-8 text-cyan-400 mb-4" />
                <h3 className="text-xs font-black uppercase tracking-widest text-silver mb-2">User View Simulator</h3>
                <p className="text-[9px] text-silver/40 uppercase mb-6">Navegue como um Membro Comum</p>
                <button className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-silver hover:bg-white/10 transition-all">
                  Ativar Simulação
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
