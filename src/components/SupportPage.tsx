import React from 'react';
import { ShieldCheck, Zap, Globe, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function SupportPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-12 px-4 selection:bg-cyan-500">
      {/* HEADER COM PNL AGUDA: Foco na Solução, não no Problema */}
      <header className="max-w-4xl mx-auto text-center mb-16">
        <h1 className="text-5xl md:text-6xl font-black mb-6 bg-gradient-to-r from-white via-cyan-400 to-blue-600 bg-clip-text text-transparent uppercase tracking-tighter">
          Performance Inabalável
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Sua conexão merece a velocidade da elite. Ajuste sua rota digital para desbloquear o potencial máximo do streaming 4K na <span className="text-white font-bold italic">LordFlix Supreme</span>.
        </p>
      </header>

      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* CARD 1: O PORQUÊ (Gatilho de Autoridade) */}
        <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-3xl hover:border-cyan-500/50 transition-all duration-500 group">
          <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Zap className="text-cyan-400 w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Por que otimizar seu DNS?</h2>
          <ul className="space-y-4">
            {[
              "Latência reduzida em até 40% para início imediato.",
              "Ignora bloqueios geográficos de provedores comuns.",
              "Camada extra de privacidade entre você e o filme."
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-gray-400">
                <CheckCircle2 className="text-cyan-500 w-5 h-5 shrink-0 mt-1" />
                <span>{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CARD 2: O TUTORIAL (Elegância Técnica) */}
        <div className="bg-gradient-to-br from-zinc-900 to-black border border-cyan-500/20 p-8 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.1)]">
          <div className="flex items-center gap-4 mb-8">
            <div className="bg-white/10 p-3 rounded-xl italic font-black text-cyan-400 italic">DNS</div>
            <h2 className="text-2xl font-bold italic">Cloudflare 1.1.1.1</h2>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">1</div>
                <div className="w-px h-full bg-white/10 my-1"></div>
              </div>
              <div>
                <p className="font-bold text-lg">Acesse sua Rede</p>
                <p className="text-gray-500">Configurações &gt; Rede e Internet &gt; DNS</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center text-black font-bold">2</div>
              </div>
              <div>
                <p className="font-bold text-lg">Configure os Protocolos</p>
                <div className="mt-2 space-y-2">
                  <code className="block bg-white/5 p-3 rounded-lg border border-white/10 text-cyan-300 font-mono">Principal: 1.1.1.1</code>
                  <code className="block bg-white/5 p-3 rounded-lg border border-white/10 text-cyan-300 font-mono">Secundário: 1.0.0.1</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA FINAL: Conversão Total */}
      <div className="mt-20 text-center">
        <button 
          onClick={onBack}
          className="bg-white text-black px-10 py-4 rounded-full font-black text-lg hover:bg-cyan-400 transition-all active:scale-95 flex items-center gap-3 mx-auto shadow-xl"
        >
          SISTEMA CONFIGURADO, VOLTAR AO FILME
          <ArrowRight className="w-5 h-5" />
        </button>
        <p className="mt-6 text-gray-500 text-sm flex items-center justify-center gap-2 italic">
          <ShieldCheck className="w-4 h-4" />
          Conexão Segura e Certificada pelo protocolo LordFlix
        </p>
      </div>
    </div>
  );
}
