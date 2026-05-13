import { Github, KeyRound, Twitter } from "lucide-react";

export function Attribution() {
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-black uppercase text-parchment/80">
      <span>Made by</span>
      <a className="inline-flex items-center gap-1 text-[#1d9bf0] hover:text-signal" href="https://x.com/Velcrafting" target="_blank" rel="noreferrer">
        <Twitter className="h-4 w-4" /> Velcrafting
      </a>
      <span>for</span>
      <a className="inline-flex items-center gap-1 text-[#b58cff] hover:text-signal" href="https://github.com/Vel-Labs" target="_blank" rel="noreferrer">
        <Github className="h-4 w-4" /> Vel Labs
      </a>
      <span>powered by</span>
      <a className="inline-flex items-center gap-1 text-[#b58cff] hover:text-signal" href="https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/device-management-kit" target="_blank" rel="noreferrer">
        <KeyRound className="h-4 w-4" /> Ledger DMK
      </a>
    </div>
  );
}
