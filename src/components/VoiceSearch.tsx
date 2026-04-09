/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';

export const VoiceSearch = ({ onResult }: { onResult: (text: string) => void }) => {
  const [isListening, setIsListening] = useState(false);

  const startListening = () => {
    // @ts-ignore - SpeechRecognition is not in the standard TS types yet
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      // Usando uma abordagem mais elegante que alert() para o ambiente de iframe
      console.warn("Seu navegador não suporta busca por voz.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error("Erro no reconhecimento de voz:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <button 
      onClick={startListening}
      className={`voice-search-trigger transition-all duration-300 flex items-center justify-center ${isListening ? 'text-cyan-500 scale-110' : 'text-silver opacity-40 hover:opacity-100'}`}
      title={isListening ? "Ouvindo..." : "Clique para falar o nome do filme"}
    >
      {isListening ? (
        <span className="text-[10px] font-black uppercase tracking-tighter animate-pulse">Ouvindo</span>
      ) : (
        <div className="w-5 h-5 rounded-full overflow-hidden border border-white/20">
          <img src="https://picsum.photos/seed/mic/40/40" alt="Mic" className="w-full h-full object-cover grayscale" referrerPolicy="no-referrer" />
        </div>
      )}
    </button>
  );
};
