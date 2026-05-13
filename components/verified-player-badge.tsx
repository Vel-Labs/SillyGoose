import { CheckCircle2, LockKeyhole } from "lucide-react";
import { findGoose } from "@/lib/goose-roster";

type Props = {
  name: string;
  label: string;
  side?: "red" | "blue" | "gold";
  goose?: string;
  imagePosition?: string;
  featured?: boolean;
};

export function VerifiedPlayerBadge({ name, label, side = "gold", goose, imagePosition, featured = false }: Props) {
  const profile = findGoose(goose ?? name);
  const crop = imagePosition ?? profile.sprite;
  const color = side === "red" ? "badge-red" : side === "blue" ? "badge-blue" : "badge-gold";
  return (
    <div className={`verified-badge ${color} ${featured ? "verified-badge-featured" : ""}`}>
      <div className="goose-portrait goose-sprite" style={{ backgroundPosition: crop }} />
      <div>
        <div className="text-[11px] font-black uppercase text-parchment/65">{label}</div>
        <div className="brush-title text-xl text-white">{name}</div>
        <div className="mt-2 text-xs font-black uppercase text-signal">Honk rating: {profile.rating.toLocaleString()}</div>
        <div className="mt-2 flex items-center gap-2 text-xs font-black uppercase text-parchment">
          <CheckCircle2 className="h-4 w-4 text-green-400" />
          Verified
          <LockKeyhole className="h-4 w-4 text-signal" />
        </div>
      </div>
    </div>
  );
}
