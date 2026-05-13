export const gooseHandleAdjectives = [
  "Absurd",
  "Based",
  "Bendy",
  "Blep",
  "Bonk",
  "Bozo",
  "Bumpy",
  "Chaotic",
  "Cheeky",
  "Clumsy",
  "Cranky",
  "Crunchy",
  "Dank",
  "Derpy",
  "Dizzy",
  "Doink",
  "Dramatic",
  "Drippy",
  "Fermented",
  "Flappy",
  "Foamy",
  "Funky",
  "Gobsmacked",
  "Greasy",
  "Grumpy",
  "Honky",
  "Janky",
  "Juicy",
  "King",
  "Loopy",
  "Meme",
  "Messy",
  "Moldy",
  "Noodle",
  "Pickled",
  "Pixel",
  "Rancid",
  "Rowdy",
  "Salty",
  "Scrungly",
  "Shiny",
  "Silly",
  "Slimy",
  "Slimey",
  "Spicy",
  "Stinky",
  "Sus",
  "Toasty",
  "Unhinged",
  "Wobbly"
];

export const defaultGooseHandle = "0xStinky-Goose";

function toHandleMiddle(value: string) {
  const trimmed = value.trim();
  const withoutPrefix = trimmed.replace(/^@?0x/i, "");
  const withoutSuffix = withoutPrefix.replace(/-?goose$/i, "");
  const words = withoutSuffix.match(/[a-z0-9]+/gi) ?? [];
  const middle = words
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
  return middle || "Stinky";
}

export function formatGooseHandle(value: string) {
  return `0x${toHandleMiddle(value)}-Goose`;
}

export function randomGooseHandle(random = Math.random) {
  const index = Math.floor(random() * gooseHandleAdjectives.length);
  return formatGooseHandle(gooseHandleAdjectives[index] ?? "Stinky");
}
