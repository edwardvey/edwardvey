/*
 * snake.ts
 * Generates a custom GitHub contributions snake animation spelling:
 * "Edward Vey | Software Engineer"
 */
import fs from "fs";

// Dimensions of GitHub calendar: 7 rows (Sunday=0) × ~52 columns
const ROWS = 7;
const COLS = 52;
const WEEK_OFFSET = 16; // adjust to center text horizontally

// 5x7 pixel font patterns for each character
const FONT: Record<string, boolean[][]> = {
  E: [
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, false],
    [true, true, true, true, true, true, true],
  ],
  d: [
    [false, false, true, true, true, false, false],
    [false, true, false, false, false, true, false],
    [false, true, false, false, false, true, false],
    [false, true, true, true, true, true, false],
    [false, false, false, false, false, false, false],
  ],
  w: [
    [true, false, false, false, false, false, true],
    [true, false, false, false, false, false, true],
    [true, false, true, false, true, false, true],
    [true, true, false, true, false, true, true],
    [true, false, false, false, false, false, true],
  ],
  a: [
    [false, true, true, true, true, true, false],
    [true, false, false, false, false, false, true],
    [true, false, false, false, false, false, true],
    [true, true, true, true, true, true, true],
    [true, false, false, false, false, false, true],
  ],
  r: [
    [true, true, true, true, true, false, false],
    [true, false, false, false, false, true, false],
    [true, true, true, true, true, false, false],
    [true, false, false, true, false, false, false],
    [true, false, false, false, true, false, false],
  ],
  V: [
    [true, false, false, false, false, false, true],
    [true, false, false, false, false, false, true],
    [true, false, false, false, false, false, true],
    [false, true, false, false, false, true, false],
    [false, false, true, false, true, false, false],
  ],
  e: [
    [false, true, true, true, false, false, false],
    [true, false, false, false, true, false, false],
    [true, true, true, true, true, false, false],
    [true, false, false, false, false, true, false],
    [false, true, true, true, true, false, false],
  ],
  y: [
    [true, false, false, false, false, false, true],
    [false, true, false, false, false, true, false],
    [false, false, true, false, true, false, false],
    [false, false, true, false, true, false, false],
    [false, false, true, false, true, false, false],
  ],
  "|": [
    [false, true, false, false, false, false, false],
    [false, true, false, false, false, false, false],
    [false, true, false, false, false, false, false],
    [false, true, false, false, false, false, false],
    [false, true, false, false, false, false, false],
  ],
  S: [
    [false, true, true, true, true, true, false],
    [true, false, false, false, false, false, false],
    [false, true, true, true, true, true, false],
    [false, false, false, false, false, true, false],
    [true, true, true, true, true, true, false],
  ],
  o: [
    [false, true, true, true, false, false, false],
    [true, false, false, false, true, false, false],
    [true, false, false, false, true, false, false],
    [true, false, false, false, true, false, false],
    [false, true, true, true, false, false, false],
  ],
  f: [
    [false, true, true, true, true, false, false],
    [true, false, false, false, false, false, false],
    [true, true, true, true, true, true, false],
    [true, false, false, false, false, false, false],
    [true, false, false, false, false, false, false],
  ],
  t: [
    [true, true, true, true, true, true, true],
    [false, false, true, false, false, false, false],
    [false, false, true, false, false, false, false],
    [false, false, true, false, false, false, false],
    [false, false, true, false, false, false, false],
  ],
  n: [
    [true, false, false, false, true, false, false],
    [true, true, false, false, true, false, false],
    [true, false, true, false, true, false, false],
    [true, false, false, true, true, false, false],
    [true, false, false, false, true, false, false],
  ],
  g: [
    [false, true, true, true, false, false, false],
    [true, false, false, false, true, false, false],
    [true, false, false, false, true, false, false],
    [false, true, true, true, true, false, false],
    [false, false, false, false, true, false, false],
  ],
  i: [
    [false, false, true, false, false, false, false],
    [false, false, false, false, false, false, false],
    [false, false, true, false, false, false, false],
    [false, false, true, false, false, false, false],
    [false, false, true, false, false, false, false],
  ],
};

// Single-column space between letters
const SPACE = [[false, false, false, false, false, false, false]];

// Build the full message matrix
const MESSAGE = "Edward Vey | Software Engineer".split("");
const LETTER_MATRIX: boolean[][] = MESSAGE.flatMap((ch) => [
  ...(FONT[ch] || SPACE),
  ...SPACE,
]);

interface Cell {
  x: number;
  y: number;
  fade?: boolean;
}

/**
 * Generate the path visiting all "on" cells first (to draw letters),
 * then fading all other cells.
 */
function generatePath(): Cell[] {
  const path: Cell[] = [];

  // 1. Highlight letter cells
  LETTER_MATRIX.forEach((colArr, i) => {
    colArr.forEach((on, row) => {
      if (on) path.push({ x: i + WEEK_OFFSET, y: row });
    });
  });

  // 2. Fade the rest
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const idx = x - WEEK_OFFSET;
      const isLetter =
        idx >= 0 && idx < LETTER_MATRIX.length && LETTER_MATRIX[idx][y];
      if (!isLetter) path.push({ x, y, fade: true });
    }
  }

  return path;
}

/**
 * Render an animated SVG based on the path.
 */
function renderSnakeSVG(path: Cell[]): string {
  const cellSize = 12;
  const width = COLS * cellSize;
  const height = ROWS * cellSize;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  svg += `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">\n`;

  // Base grid
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      svg += `  <rect x="${x * cellSize}" y="${
        y * cellSize
      }" width="${cellSize}" height="${cellSize}" fill="#ebedf0" />\n`;
    }
  }

  // Snake animation
  path.forEach((cell, idx) => {
    const px = cell.x * cellSize;
    const py = cell.y * cellSize;
    const delay = idx * 100;
    const targetOpacity = cell.fade ? 0.1 : 1;

    svg += `  <rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="#1b873e" fill-opacity="0">\n`;
    svg += `    <animate attributeName="fill-opacity" from="0" to="${targetOpacity}" begin="${delay}ms" dur="200ms" fill="freeze" />\n`;
    svg += `  </rect>\n`;
  });

  svg += "</svg>";
  return svg;
}

async function main() {
  const path = generatePath();
  const svg = renderSnakeSVG(path);
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/github-contribution-grid-snake.svg", svg, "utf8");
  console.log("SVG generated at dist/github-contribution-grid-snake.svg");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
