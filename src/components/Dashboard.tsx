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
    <div className="glass-panel p-6 rounded-[24px] mt-10 border-white/5 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[8px] font-black text-silver/20 uppercase tracking-[0.4em]">Status da Rede</h3>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-cyan-500 rounded-full animate-pulse"></span>
          <span className="text-[8px] text-cyan-500 font-black tracking-widest uppercase">Live</span>
        </div>
      </div>

      <div className="h-24 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trafficData}>
            <defs>
              <linearGradient id="colorMbps" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="mbps" 
              stroke="#22d3ee" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorMbps)" 
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      
      <div className="flex justify-between mt-4 text-[8px] font-black uppercase tracking-widest text-silver/30">
        <span>2160p 4K</span>
        <span>H.265 HEVC</span>
        <span className="text-green-500">24ms Latência</span>
      </div>
    </div>
  );
};
