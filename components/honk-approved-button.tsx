"use client";

import { useRef } from "react";

export function HonkApprovedButton() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function honk() {
    audioRef.current ??= new Audio("/honk.mp3");
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(() => {
      // Browser audio can be blocked until user interaction; this button is already the gesture path.
    });
  }

  return (
    <button type="button" onClick={honk} className="wood-sign hero-honk-button px-3 py-2 text-[11px]">
      Honk approved
    </button>
  );
}
