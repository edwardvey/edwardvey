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

// Define the 7×N boolean matrix for each letter & symbol
// You need to fill in the boolean patterns for each character yourself
const LETTER_MATRIX: boolean[][] = [
  // Example pattern: a single column fully on
  // [true, true, true, true, true, true, true],
  // Replace these with your letter patterns
];

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

  // 1. Highlight letter cells in reading order
  for (let col = 0; col < LETTER_MATRIX.length; col++) {
    for (let row = 0; row < ROWS; row++) {
      if (LETTER_MATRIX[col][row]) {
        path.push({ x: col + WEEK_OFFSET, y: row });
      }
    }
  }

  // 2. Fade other cells
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const matrixCol = x - WEEK_OFFSET;
      const isLetter =
        matrixCol >= 0 &&
        matrixCol < LETTER_MATRIX.length &&
        LETTER_MATRIX[matrixCol][y];
      if (!isLetter) {
        path.push({ x, y, fade: true });
      }
    }
  }

  return path;
}

/**
 * Render an animated SVG based on the path.
 */
function renderSnakeSVG(path: Cell[]): string {
  const cellSize = 12; // pixel size of each cell
  const width = COLS * cellSize;
  const height = ROWS * cellSize;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
`;

  // Draw base grid
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      svg += `  <rect x="${x * cellSize}" y="${
        y * cellSize
      }" width="${cellSize}" height="${cellSize}" fill="#ebedf0" />\n`;
    }
  }

  // Draw snake steps
  path.forEach((cell, idx) => {
    const px = cell.x * cellSize;
    const py = cell.y * cellSize;
    const delay = idx * 100; // ms before this step animates
    const targetOpacity = cell.fade ? 0.1 : 1;

    svg += `  <rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="#1b873e" fill-opacity="0">
    <animate attributeName="fill-opacity" from="0" to="${targetOpacity}" begin="${delay}ms" dur="200ms" fill="freeze" />
  </rect>\n`;
  });

  svg += "</svg>";
  return svg;
}

/**
 * Main entrypoint: generate the SVG and write to disk.
 */
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
