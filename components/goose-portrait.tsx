import Image from "next/image";
import { findGoose, type GooseKey } from "@/lib/goose-roster";

type GoosePortraitProps = {
  goose?: GooseKey | string | null;
  alt?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function GoosePortrait({ goose, alt, className = "", imageClassName = "", priority = false }: GoosePortraitProps) {
  const profile = findGoose(goose);

  return (
    <div className={`goose-portrait relative overflow-hidden ${className}`} aria-label={alt ?? profile.name}>
      <Image
        src={profile.image}
        alt={alt ?? profile.name}
        fill
        priority={priority}
        sizes="(max-width: 768px) 42vw, 220px"
        className={`object-contain object-center p-1 ${imageClassName}`}
      />
    </div>
  );
}
