"use client";

import { CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { findGoose, type GooseKey } from "@/lib/goose-roster";
import { GoosePortrait } from "./goose-portrait";

type OperatorGooseProfileProps = {
  defaultGoose?: GooseKey;
  operatorName: string;
  variant?: "sidebar" | "hero";
};

export function OperatorGooseProfile({ defaultGoose = "captain", operatorName, variant = "sidebar" }: OperatorGooseProfileProps) {
  const [gooseKey, setGooseKey] = useState<GooseKey>(defaultGoose);
  const goose = findGoose(gooseKey);

  useEffect(() => {
    const syncPreferredGoose = () => {
      const stored = window.localStorage.getItem("silly-goose.preferred-goose") as GooseKey | null;
      setGooseKey(stored ? findGoose(stored).key : defaultGoose);
    };
    const onPreferredGoose = (event: Event) => {
      const nextGoose = (event as CustomEvent<{ goose?: GooseKey }>).detail?.goose;
      setGooseKey(findGoose(nextGoose).key);
    };

    syncPreferredGoose();
    window.addEventListener("storage", syncPreferredGoose);
    window.addEventListener("silly-goose:preferred-goose", onPreferredGoose);
    return () => {
      window.removeEventListener("storage", syncPreferredGoose);
      window.removeEventListener("silly-goose:preferred-goose", onPreferredGoose);
    };
  }, [defaultGoose]);

  if (variant === "hero") {
    return (
      <div className="rounded-sm border-4 border-signal bg-ink p-2 text-center text-parchment">
        <div className="brush-title mb-1 text-sm leading-none text-white">{goose.shortName}</div>
        <div className="relative">
          <GoosePortrait goose={goose.key} className="mx-auto h-[72px] w-full" priority imageClassName="goose-framed-image" />
          <div className="preferred-image-check" aria-label="Preferred goose">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-1 flex items-center gap-3">
      <GoosePortrait goose={goose.key} className="brand-goose-mark rounded-sm border-2 border-black bg-parchment" />
      <div>
        <div className="text-[10px] font-black uppercase text-green-400">Preferred goose</div>
        <div className="brush-title text-lg leading-none text-white">{goose.shortName || operatorName}</div>
      </div>
    </div>
  );
}
