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

// Define the 7×N boolean matrix for each letter & symbol (columns represent weeks)
// Here, we concatenate letter patterns side-by-side: E, d, w, a, r, d, space, V, e, y, space, |, space, S, o, f, t, w, a, r, e, space, E, n, g, i, n, e, e, r
const LETTER_MATRIX: boolean[][] = [
  // Each inner array is 7 booleans (Sunday->Saturday) per column. Example for 'E' (5 columns):
  // [true, true, true, true, true, true, true], // full column
  // ... continue for each column of each character
  // Due to brevity, fill in your own boolean patterns here.
];

interface Cell {
  x: number;
  y: number;
  fade?: boolean;
}

// Generate the path visiting all "on" cells first, then fading the rest
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
      const isLetter = LETTER_MATRIX[x - WEEK_OFFSET]?.[y];
      if (!isLetter) {
        path.push({ x, y, fade: true });
      }
    }
  }

  return path;
}

// Render SVG for snake animation
function renderSnakeSVG(path: Cell[]): string {
  const cellSize = 12; // adjust for cell pixel size
  const width = COLS * cellSize;
  const height = ROWS * cellSize;

  // Build SVG elements
  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
`;

  // Draw calendar grid (cells)
  for (let x = 0; x < COLS; x++) {
    for (let y = 0; y < ROWS; y++) {
      const px = x * cellSize;
      const py = y * cellSize;
      svg += `  <rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="#ebedf0" />\n`;
    }
  }

  // Add snake steps
  path.forEach((cell, idx) => {
    const px = cell.x * cellSize;
    const py = cell.y * cellSize;
    const delay = idx * 100; // milliseconds per step
    const opacity = cell.fade ? 0.1 : 1;

    svg += `  <rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="#1b873e" fill-opacity="${opacity}">
    <animate attributeName="fill-opacity" from="0" to="${opacity}" begin="${delay}ms" dur="200ms" fill="freeze" />
  </rect>\n`;
  });

  svg += "</svg>";
  return svg;
}

// Main execution
typemodule.exports = async function main() {
  const path = generatePath();
  const svg = renderSnakeSVG(path);
  fs.mkdirSync("dist", { recursive: true });
  fs.writeFileSync("dist/github-contribution-grid-snake.svg", svg, "utf8");
};
