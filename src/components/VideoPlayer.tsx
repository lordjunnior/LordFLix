/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';

export const LordPlayer = ({ src, title, onClose }: { src: string, title: string, onClose: () => void }) => {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isYouTube = src.includes('youtube.com');

  useEffect(() => {
    if (!isYouTube && !playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add('vjs-big-play-centered', 'vjs-lord-theme');
      videoRef.current.appendChild(videoElement);

      const player = playerRef.current = videojs(videoElement, {
        autoplay: true,
        controls: true,
        responsive: true,
        fluid: true,
        sources: [{ src, type: 'application/x-mpegURL' }], // Suporte a HLS/m3u8
        playbackRates: [0.5, 1, 1.5, 2],
        userActions: { hotkeys: true }
      });

      player.on('play', () => console.log("Cinema iniciado: " + title));
    }

    return () => {
      if (playerRef.current) {
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [src, title, isYouTube]);

  return (
    <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 md:p-10">
      <div className="relative w-full max-w-6xl group rounded-3xl overflow-hidden border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.2)]">
        {/* BOTÃO FECHAR */}
        <button 
          onClick={onClose}
          className="absolute top-6 right-6 z-50 bg-black/50 hover:bg-cyan-500 hover:text-black px-6 py-3 rounded-full transition-all backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white"
        >
          Fechar
        </button>

        {/* TÍTULO DO FILME NO TOPO DO PLAYER */}
        <div className="absolute top-0 left-0 w-full p-8 z-20 bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">{title}</h2>
          <div className="flex gap-4 mt-2">
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white font-bold">4K ULTRA HD</span>
            <span className="text-[10px] bg-white/10 px-2 py-1 rounded text-white font-bold">AUDIO: PT-BR</span>
          </div>
        </div>

        {isYouTube ? (
          <div className="aspect-video w-full">
            <iframe 
              src={src} 
              title={title}
              className="w-full h-full"
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen
            ></iframe>
          </div>
        ) : (
          <div data-vjs-player>
            <div ref={videoRef} />
          </div>
        )}

        {/* CUSTOM THEME FOR VIDEOJS */}
        <style dangerouslySetInnerHTML={{ __html: `
          .vjs-lord-theme .vjs-control-bar { 
            background: rgba(2, 2, 2, 0.9) !important; 
            height: 80px !important;
            backdrop-filter: blur(20px);
          }
          .vjs-lord-theme .vjs-play-control { font-size: 1.5em !important; }
          .vjs-lord-theme .vjs-big-play-button {
            background-color: #22d3ee !important;
            border: none !important;
            border-radius: 50% !important;
            width: 80px !important;
            height: 80px !important;
            line-height: 80px !important;
            top: 50% !important;
            left: 50% !important;
            margin-top: -40px !important;
            margin-left: -40px !important;
          }
          .vjs-lord-theme .vjs-slider { background-color: rgba(255,255,255,0.1) !important; }
          .vjs-lord-theme .vjs-load-progress { background: rgba(255,255,255,0.2) !important; }
          .vjs-lord-theme .vjs-play-progress { background: #22d3ee !important; }
        `}} />
      </div>
    </div>
  );
};
