import { Github, KeyRound, Star, Twitter } from "lucide-react";

const repoUrl = "https://github.com/Vel-Labs/SillyGoose";

export function Attribution() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs font-black uppercase text-parchment">
      <span>Made by</span>
      <a className="inline-flex items-center gap-1 text-[#49b7ff] hover:text-signal" href="https://x.com/Velcrafting" target="_blank" rel="noreferrer">
        <Twitter className="h-4 w-4" /> Velcrafting
      </a>
      <span>for</span>
      <a className="inline-flex items-center gap-1 text-[#d0b2ff] hover:text-signal" href="https://github.com/Vel-Labs" target="_blank" rel="noreferrer">
        <Github className="h-4 w-4" /> Vel Labs
      </a>
      <span>powered by</span>
      <a className="inline-flex items-center gap-1 text-[#d0b2ff] hover:text-signal" href="https://github.com/LedgerHQ/device-sdk-ts/tree/develop/packages/device-management-kit" target="_blank" rel="noreferrer">
        <KeyRound className="h-4 w-4" /> Ledger DMK
      </a>
    </div>
  );
}

export function StarRepoButton() {
  return (
    <a className="star-repo-button" href={repoUrl} target="_blank" rel="noreferrer">
      <Star className="h-4 w-4" /> Star this repo
    </a>
  );
}
