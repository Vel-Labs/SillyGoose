export type GooseKey =
  | "afro"
  | "jefe"
  | "sword"
  | "punk"
  | "beanie"
  | "duke"
  | "captain"
  | "spoon"
  | "ai";

export type GooseProfile = {
  key: GooseKey;
  name: string;
  shortName: string;
  role: string;
  catchphrase: string;
  quote: string;
  stats: Array<{
    label: string;
    value: string;
  }>;
  crop: string;
  sprite: string;
  image: string;
  rating: number;
};

export const gooseRoster: GooseProfile[] = [
  {
    key: "afro",
    name: "Afro Goose with 3D Glasses",
    shortName: "3D Honk",
    role: "Depth Perception Menace",
    catchphrase: "Sees the fork coming.",
    quote: "\"I read the room in two dimensions and still choose chaos.\"",
    stats: [
      { label: "Snack Vision", value: "stereoscopic" },
      { label: "Alibi Depth", value: "unreliable" },
      { label: "Vibe Lens", value: "red/blue" }
    ],
    crop: "8% 16%",
    sprite: "0% 0%",
    image: "/geese/framed/afro.png",
    rating: 1224
  },
  {
    key: "jefe",
    name: "El Jefe Goose",
    shortName: "El Jefe",
    role: "Flock Boss",
    catchphrase: "Runs the pond like a boardroom.",
    quote: "\"Circle back after you fear me.\"",
    stats: [
      { label: "Meeting Control", value: "hostile" },
      { label: "Hat Authority", value: "undisputed" },
      { label: "Knife Budget", value: "approved" }
    ],
    crop: "36% 16%",
    sprite: "33.333% 0%",
    image: "/geese/framed/jefe.png",
    rating: 1157
  },
  {
    key: "sword",
    name: "Blade Goose",
    shortName: "Blade Goose",
    role: "Cutlery Specialist",
    catchphrase: "Never brings bread to a sword fight.",
    quote: "\"This is not a knife. It is a meeting agenda.\"",
    stats: [
      { label: "Blade Admin", value: "certified" },
      { label: "Bread Mercy", value: "0%" },
      { label: "Quest Log", value: "sideways" }
    ],
    crop: "63% 16%",
    sprite: "66.666% 0%",
    image: "/geese/framed/sword.png",
    rating: 1188
  },
  {
    key: "punk",
    name: "Punk Fork Goose",
    shortName: "Punk Fork",
    role: "Mosh Pit Referee",
    catchphrase: "Two forks, zero chill.",
    quote: "\"I decline the calendar invite and the concept of lawns.\"",
    stats: [
      { label: "Fork Count", value: "too many" },
      { label: "Volume", value: "municipal" },
      { label: "Curfew", value: "refused" }
    ],
    crop: "91% 16%",
    sprite: "100% 0%",
    image: "/geese/framed/punk.png",
    rating: 1094
  },
  {
    key: "beanie",
    name: "Intern Goose",
    shortName: "Intern",
    role: "Snack Procurement",
    catchphrase: "Has the deck, lost the breadcrumbs.",
    quote: "\"I made the spreadsheet worse but the vibes are sourced.\"",
    stats: [
      { label: "Deck Status", value: "final_v7" },
      { label: "Snack P&L", value: "missing" },
      { label: "Confidence", value: "loud" }
    ],
    crop: "8% 78%",
    sprite: "0% 100%",
    image: "/geese/framed/beanie.png",
    rating: 1003
  },
  {
    key: "duke",
    name: "Duke Goose",
    shortName: "The Duke",
    role: "Ceremonial Menace",
    catchphrase: "Politely steals your square.",
    quote: "\"A little pageantry. A little trespassing.\"",
    stats: [
      { label: "Manners", value: "weaponized" },
      { label: "Estate Size", value: "one puddle" },
      { label: "Tiny Bow", value: "devastating" }
    ],
    crop: "36% 78%",
    sprite: "33.333% 100%",
    image: "/geese/framed/duke.png",
    rating: 1199
  },
  {
    key: "captain",
    name: "King Goose",
    shortName: "King Goose",
    role: "Pond Sovereign",
    catchphrase: "Rules the board from the pond throne.",
    quote: "\"The crown is heavy because it is full of bad ideas.\"",
    stats: [
      { label: "Royal Decrees", value: "mostly honks" },
      { label: "Crown Tilt", value: "strategic" },
      { label: "Pond Equity", value: "controlling" }
    ],
    crop: "64% 78%",
    sprite: "66.666% 100%",
    image: "/geese/framed/captain.png",
    rating: 1337
  },
  {
    key: "spoon",
    name: "Spoon Goose",
    shortName: "Spoon Goose",
    role: "Soup Adjacent Threat",
    catchphrase: "The spoon is ceremonial. Mostly.",
    quote: "\"I came prepared for soup and emotional damage.\"",
    stats: [
      { label: "Soup Radar", value: "tingling" },
      { label: "Utensil Type", value: "ambiguous" },
      { label: "Broth Trust", value: "earned" }
    ],
    crop: "91% 78%",
    sprite: "100% 100%",
    image: "/geese/framed/spoon.png",
    rating: 1066
  },
  {
    key: "ai",
    name: "Terminator Goose",
    shortName: "AI Goose",
    role: "Deterministic Pond Machine",
    catchphrase: "Calculates. Honks. Refuses mercy.",
    quote: "\"Your move has been reviewed by the flock algorithm.\"",
    stats: [
      { label: "Threat Scan", value: "active" },
      { label: "Bread Logic", value: "cold" },
      { label: "Mercy", value: "null" }
    ],
    crop: "91% 16%",
    sprite: "100% 0%",
    image: "/geese/framed/punk.png",
    rating: 1404
  }
];

export function findGoose(value?: string | null) {
  const normalized = value?.toLowerCase();
  return gooseRoster.find((goose) => goose.key === value || goose.name.toLowerCase() === normalized) ?? gooseRoster[0];
}
