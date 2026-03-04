"use client";

import React, { useEffect, useRef } from 'react';

interface VideoRoomProps {
  url: string;
  onLeave?: () => void;
}

const VideoRoom = ({ url, onLeave }: VideoRoomProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Añadimos el parámetro lang=es a la URL para forzar el idioma en el Prebuilt UI
  const localizedUrl = url.includes('?') ? `${url}&lang=es` : `${url}?lang=es`;

  useEffect(() => {
    console.log("Iniciando sesión en sala (Español forzado):", localizedUrl);
  }, [localizedUrl]);

  return (
    <div className="w-full h-[calc(100vh-120px)] bg-slate-900 rounded-2xl overflow-hidden shadow-2xl">
      <iframe
        ref={iframeRef}
        src={localizedUrl}
        allow="camera; microphone; fullscreen; display-capture; autoplay"
        className="w-full h-full border-none"
        title="Sesión de Terapia"
      />
    </div>
  );
};

export default VideoRoom;