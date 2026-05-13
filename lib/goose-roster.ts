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
  role: string;
  catchphrase: string;
  crop: string;
  sprite: string;
  image: string;
  rating: number;
};

export const gooseRoster: GooseProfile[] = [
  { key: "afro", name: "Afro Goose with 3D Glasses", shortName: "3D Honk", role: "Depth Perception Menace", catchphrase: "Sees the fork coming.", crop: "8% 16%", sprite: "0% 0%", image: "/geese/afro.png", rating: 1224 },
  { key: "jefe", name: "El Jefe Goose", shortName: "El Jefe", role: "Flock Boss", catchphrase: "Runs the pond like a boardroom.", crop: "36% 16%", sprite: "33.333% 0%", image: "/geese/jefe.png", rating: 1157 },
  { key: "sword", name: "Blade Goose", shortName: "Blade Goose", role: "Cutlery Specialist", catchphrase: "Never brings bread to a sword fight.", crop: "63% 16%", sprite: "66.666% 0%", image: "/geese/sword.png", rating: 1188 },
  { key: "punk", name: "Punk Fork Goose", shortName: "Punk Fork", role: "Mosh Pit Referee", catchphrase: "Two forks, zero chill.", crop: "91% 16%", sprite: "100% 0%", image: "/geese/punk.png", rating: 1094 },
  { key: "beanie", name: "Intern Goose", shortName: "Intern", role: "Snack Procurement", catchphrase: "Has the deck, lost the breadcrumbs.", crop: "8% 78%", sprite: "0% 100%", image: "/geese/beanie.png", rating: 1003 },
  { key: "duke", name: "Duke Goose", shortName: "The Duke", role: "Ceremonial Menace", catchphrase: "Politely steals your square.", crop: "36% 78%", sprite: "33.333% 100%", image: "/geese/duke.png", rating: 1199 },
  { key: "captain", name: "Captain Goose", shortName: "Captain", role: "Pond Commander", catchphrase: "Keeps the flock in formation.", crop: "64% 78%", sprite: "66.666% 100%", image: "/geese/captain.png", rating: 1337 },
  { key: "spoon", name: "Spoon Goose", shortName: "Spoon Goose", role: "Soup Adjacent Threat", catchphrase: "The spoon is ceremonial. Mostly.", crop: "91% 78%", sprite: "100% 100%", image: "/geese/spoon.png", rating: 1066 }
];

export function findGoose(value?: string | null) {
  const normalized = value?.toLowerCase();
  return gooseRoster.find((goose) => goose.key === value || goose.name.toLowerCase() === normalized) ?? gooseRoster[0];
}
