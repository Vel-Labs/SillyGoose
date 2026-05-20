"use client";

import { useRef, useState, type CSSProperties } from "react";

const confetti = Array.from({ length: 22 }, (_, index) => ({
  id: index,
  left: 8 + ((index * 17) % 84),
  delay: (index % 6) * 0.045,
  drift: ((index % 7) - 3) * 18,
  color: ["#f4a51c", "#22c55e", "#38bdf8", "#f43f5e", "#fff7df"][index % 5]
}));

type CelebrationOptions = {
  sound?: boolean;
};

export function useCelebrationBurst() {
  const [burst, setBurst] = useState<{ id: number; label: string } | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function celebrate(label: string, options: CelebrationOptions = {}) {
    setBurst({ id: Date.now(), label });
    if (options.sound !== false) {
      audioRef.current ??= new Audio("/honk.mp3");
      audioRef.current.currentTime = 0;
      void audioRef.current.play().catch(() => undefined);
    }
  }

  const celebration = burst ? (
    <div key={burst.id} className="celebration-burst" aria-live="polite" aria-label={`${burst.label} confirmed`}>
      <div className="celebration-honk">
        <span>HONK</span>
        <strong>{burst.label}</strong>
      </div>
      <div className="celebration-confetti" aria-hidden="true">
        {confetti.map((piece) => (
          <span
            key={piece.id}
            style={{
              "--confetti-left": `${piece.left}%`,
              "--confetti-delay": `${piece.delay}s`,
              "--confetti-drift": `${piece.drift}px`,
              "--confetti-color": piece.color
            } as CSSProperties}
          />
        ))}
      </div>
    </div>
  ) : null;

  return { celebrate, celebration };
}
