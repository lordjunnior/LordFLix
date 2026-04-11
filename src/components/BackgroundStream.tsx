import React, { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface BackgroundStreamProps {
  streamUrl: string;
  active: boolean;
}

export default function BackgroundStream({ streamUrl, active }: BackgroundStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    if (!active || !streamUrl) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.src = '';
      }
      return;
    }

    const initPlayer = () => {
      if (videoRef.current) {
        if (Hls.isSupported()) {
          if (hlsRef.current) {
            hlsRef.current.destroy();
          }
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
          });
          hls.loadSource(streamUrl);
          hls.attachMedia(videoRef.current);
          hlsRef.current = hls;
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => {});
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = streamUrl;
          videoRef.current.addEventListener('loadedmetadata', () => {
            videoRef.current?.play().catch(() => {});
          });
        }
      }
    };

    initPlayer();

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [streamUrl, active]);

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-black">
      <video 
        ref={videoRef}
        className="w-full h-full object-cover opacity-40 blur-[60px] scale-125 transition-opacity duration-1000"
        muted
        playsInline
        loop
      />
      {/* VIGNETTE & OVERLAYS */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black opacity-80" />
      <div className="absolute inset-0 bg-black/40" />
      
      {/* SCANLINES EFFECT */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      
      {/* DYNAMIC NOISE */}
      <div className="absolute inset-0 opacity-[0.02] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
    </div>
  );
}
