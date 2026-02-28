"use client";

import React, { useEffect, useRef } from 'react';

interface VideoRoomProps {
  url: string;
  onLeave?: () => void;
}

const VideoRoom = ({ url, onLeave }: VideoRoomProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Aquí podrías inicializar el SDK de Daily si quisieras más control,
    // pero el Iframe Prebuilt es la forma más rápida y estable.
    console.log("Iniciando sesión en sala:", url);
  }, [url]);

  return (
    <div className="w-full h-[calc(100vh-120px)] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      <iframe
        ref={iframeRef}
        src={url}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full h-full border-none"
        title="Sesión de Terapia"
      />
    </div>
  );
};

export default VideoRoom;