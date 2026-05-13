"use client";

import { useRef } from "react";

export function SurrenderHonkButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function honk() {
    if (!audioRef.current) {
      audioRef.current = new Audio("/honk.mp3");
    }
    audioRef.current.currentTime = 0;
    void audioRef.current.play().catch(() => undefined);
  }

  return (
    <button
      type="button"
      onClick={honk}
      className="mt-auto parchment rotate-[-3deg] p-2 text-center text-ink transition hover:rotate-[-1deg] hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-signal"
      aria-label="Honk if you surrender"
    >
      <div className="text-2xl font-black uppercase leading-none text-ink">Honk</div>
      <div className="text-[10px] font-black uppercase">If you surrender</div>
    </button>
  );
}
