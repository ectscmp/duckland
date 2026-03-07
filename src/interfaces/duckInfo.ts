interface duckInfo {
  name: string;
  assembler: string;
  adjectives: string[];
  body: duckParts;
  derpy: boolean; //default to true, remove comment after edits
  bio: string;
  date: Date;
  approved: boolean;
  stats: duckStats;
}

interface duckStats {
  strength: number;
  health: number;
  focus: number;
  intelligence: number;
  kindness: number;
}

type duckColor = `#${string}`;

interface duckParts {
  head: duckColor;
  frontLeft: duckColor;
  frontRight: duckColor;
  rearLeft: duckColor;
  rearRight: duckColor;
}

export { type duckInfo, type duckStats, type duckParts, type duckColor };
