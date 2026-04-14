/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';

const trafficData = [
  { time: '10:00', mbps: 45 },
  { time: '10:05', mbps: 52 },
  { time: '10:10', mbps: 48 },
  { time: '10:15', mbps: 61 },
  { time: '10:20', mbps: 55 },
  { time: '10:25', mbps: 68 },
  { time: '10:30', mbps: 59 },
];

export const MediaDashboard = () => {
  return (
    <div className="glass-panel p-8 rounded-[32px] mt-20 border-white/5 max-w-2xl mx-auto relative overflow-hidden group">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="flex justify-between items-start mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(6,182,212,0.5)]"></span>
              <span className="text-[10px] text-white font-black tracking-[0.3em] uppercase italic">Servidor São Paulo-01</span>
            </div>
            <div className="h-4 w-px bg-white/10"></div>
            <span className="text-[9px] text-silver/40 font-black uppercase tracking-[0.2em]">HEVC Main 10</span>
          </div>
        </div>
        <div className="px-4 py-1 border border-white/10 rounded-full">
          <span className="text-[8px] text-silver/60 font-black tracking-widest uppercase">Normal</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-8 mb-8 relative z-10">
        <div className="space-y-1">
          <p className="text-[8px] font-black text-silver/20 uppercase tracking-widest">Latência</p>
          <p className="text-xl font-mono font-black text-cyan-500">24<span className="text-[10px] ml-1">ms</span></p>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black text-silver/20 uppercase tracking-widest">Taxa de Bits</p>
          <p className="text-xl font-mono font-black text-white">45.8<span className="text-[10px] ml-1">Mbps</span></p>
        </div>
        <div className="space-y-1">
          <p className="text-[8px] font-black text-silver/20 uppercase tracking-widest">Buffer</p>
          <p className="text-xl font-mono font-black text-white">0.2<span className="text-[10px] ml-1">s</span></p>
        </div>
      </div>

      <div className="h-32 w-full relative z-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficData}>
            <defs>
              <linearGradient id="colorMbps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Tooltip 
              contentStyle={{ backgroundColor: '#050505', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '10px', fontFamily: 'monospace' }}
              itemStyle={{ color: '#22d3ee' }}
              cursor={{ stroke: 'rgba(34,211,238,0.2)', strokeWidth: 1 }}
            />
            <Area 
              type="monotone" 
              dataKey="mbps" 
              stroke="#22d3ee" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorMbps)" 
              animationDuration={2000}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between mt-8 pt-6 border-t border-white/5 text-[9px] font-black uppercase tracking-[0.2em] text-silver/30 relative z-10">
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-cyan-500 rounded-full"></span> 1080p / 4K</span>
          <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-cyan-500 rounded-full"></span> HDR10+</span>
        </div>
        <span className="group-hover:text-cyan-500 transition-colors">Conexão Otimizada Ativa</span>
      </div>
    </div>
  );
};
