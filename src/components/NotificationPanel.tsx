import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Bell, X, Zap, Crown, Info, CheckCircle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'system' | 'vip' | 'info' | 'success';
  time: string;
  read: boolean;
}

interface NotificationPanelProps {
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationPanel = ({ onClose, notifications, onMarkAsRead }: NotificationPanelProps) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -20 }}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-20 right-8 w-full max-w-sm bg-zinc-950/95 backdrop-blur-3xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[200] overflow-hidden"
    >
      <div className="p-6 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-cyan-500/10 to-transparent">
        <div className="flex items-center gap-3">
          <Bell className="w-4 h-4 text-cyan-500" />
          <h3 className="text-xs font-black uppercase tracking-[0.3em] text-white">Central de Alertas</h3>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-4 h-4 text-silver/40" />
        </button>
      </div>

      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3 scrollbar-hide">
        {notifications.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto">
              <Bell className="w-6 h-6 text-silver/10" />
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-silver/20">Nenhuma nova notificação</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <motion.div 
              key={notif.id}
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              onClick={() => onMarkAsRead(notif.id)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer group ${notif.read ? 'bg-white/2 border-white/5 opacity-60' : 'bg-white/5 border-white/10 hover:border-cyan-500/30'}`}
            >
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.type === 'vip' ? 'bg-gold/20 text-gold' : 
                  notif.type === 'system' ? 'bg-cyan-500/20 text-cyan-500' : 
                  notif.type === 'success' ? 'bg-green-500/20 text-green-500' : 
                  'bg-white/10 text-silver'
                }`}>
                  {notif.type === 'vip' ? <Crown className="w-5 h-5" /> : 
                   notif.type === 'system' ? <Zap className="w-5 h-5" /> : 
                   notif.type === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                   <Info className="w-5 h-5" />}
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between items-start">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-white">{notif.title}</h4>
                    <span className="text-[8px] font-bold text-silver/20 uppercase">{notif.time}</span>
                  </div>
                  <p className="text-[10px] text-silver/60 leading-relaxed">{notif.message}</p>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>

      <div className="p-4 bg-white/2 border-t border-white/5 text-center">
        <button className="text-[8px] font-black uppercase tracking-[0.4em] text-cyan-500 hover:text-white transition-colors">
          Marcar todas como lidas
        </button>
      </div>
    </motion.div>
  );
};
