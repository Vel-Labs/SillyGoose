export type GooseKey =
  | "afro"
  | "jefe"
  | "sword"
  | "punk"
  | "beanie"
  | "duke"
  | "captain"
  | "spoon";

export type GooseProfile = {
  key: GooseKey;
  name: string;
  shortName: string;
  crop: string;
  sprite: string;
  rating: number;
};

export const gooseRoster: GooseProfile[] = [
  { key: "afro", name: "Afro Goose with 3D Glasses", shortName: "Verified Goose", crop: "8% 16%", sprite: "0% 0%", rating: 1224 },
  { key: "jefe", name: "El Jefe Goose", shortName: "El Jefe Goose", crop: "36% 16%", sprite: "33.333% 0%", rating: 1157 },
  { key: "sword", name: "Blade Goose", shortName: "Blade Goose", crop: "63% 16%", sprite: "66.666% 0%", rating: 1188 },
  { key: "punk", name: "Punk Fork Goose", shortName: "Punk Goose", crop: "91% 16%", sprite: "100% 0%", rating: 1094 },
  { key: "beanie", name: "Intern Goose", shortName: "Intern Goose", crop: "8% 78%", sprite: "0% 100%", rating: 1003 },
  { key: "duke", name: "Duke Goose", shortName: "Duke Goose", crop: "36% 78%", sprite: "33.333% 100%", rating: 1199 },
  { key: "captain", name: "Captain Goose", shortName: "Captain Goose", crop: "64% 78%", sprite: "66.666% 100%", rating: 1337 },
  { key: "spoon", name: "Spoon Goose", shortName: "Spoon Goose", crop: "91% 78%", sprite: "100% 100%", rating: 1066 }
];

export function findGoose(value?: string | null) {
  const normalized = value?.toLowerCase();
  return gooseRoster.find((goose) => goose.key === value || goose.name.toLowerCase() === normalized) ?? gooseRoster[0];
}
