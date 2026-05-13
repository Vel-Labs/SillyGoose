import { CheckCircle2, Clock3, LockKeyhole } from "lucide-react";
import { findGoose } from "@/lib/goose-roster";
import { GoosePortrait } from "./goose-portrait";

type Props = {
  name: string;
  label: string;
  side?: "red" | "blue" | "gold";
  goose?: string;
  imagePosition?: string;
  featured?: boolean;
  verified?: boolean;
};

export function VerifiedPlayerBadge({ name, label, side = "gold", goose, featured = false, verified = true }: Props) {
  const profile = findGoose(goose ?? name);
  const color = side === "red" ? "badge-red" : side === "blue" ? "badge-blue" : "badge-gold";
  return (
    <div className={`verified-badge ${color} ${featured ? "verified-badge-featured" : ""}`}>
      <GoosePortrait goose={profile.key} className="min-h-[118px]" />
      <div>
        <div className="text-[11px] font-black uppercase text-parchment/65">{label}</div>
        <div className="brush-title text-xl text-white">{name}</div>
        <div className="mt-1 text-[11px] font-black uppercase text-parchment/70">{profile.role}</div>
        <div className="mt-2 text-xs font-black uppercase text-signal">Honk rating: {profile.rating.toLocaleString()}</div>
        <div className="mt-2 flex items-center gap-2 text-xs font-black uppercase text-parchment">
          {verified ? <CheckCircle2 className="h-4 w-4 text-green-400" /> : <Clock3 className="h-4 w-4 text-signal" />}
          {verified ? "Verified" : "Waiting for Security Key"}
          <LockKeyhole className="h-4 w-4 text-signal" />
        </div>
      </div>
    </div>
  );
}
