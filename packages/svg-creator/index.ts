import {
  copyGrid,
  getColor,
  isEmpty,
  isInside,
  setColorEmpty,
} from "@snk/types/grid";
import { getHeadX, getHeadY } from "@snk/types/snake";
import type { Snake } from "@snk/types/snake";
import type { Grid, Color, Empty } from "@snk/types/grid";
import type { Point } from "@snk/types/point";
import type { AnimationOptions } from "@snk/gif-creator";
import { createSnake } from "./snake";
import { createGrid } from "./grid";
import { createStack } from "./stack";
import { h, toAttribute } from "./xml-utils";
import { minifyCss } from "./css-utils";

export type DrawOptions = {
  colorDots: Record<Color, string>;
  colorEmpty: string;
  colorDotBorder: string;
  colorSnake: string;
  sizeCell: number;
  sizeDot: number;
  sizeDotBorderRadius: number;
  dark?: {
    colorDots: Record<Color, string>;
    colorEmpty: string;
    colorDotBorder?: string;
    colorSnake?: string;
  };
};

const getCellsFromGrid = ({ width, height }: Grid) =>
  Array.from({ length: width }, (_, x) =>
    Array.from({ length: height }, (_, y) => ({ x, y }))
  ).flat();

const createLivingCells = (
  grid0: Grid,
  chain: Snake[],
  cells: Point[] | null
) => {
  const livingCells: (Point & {
    t: number | null;
    color: Color | Empty;
  })[] = (cells ?? getCellsFromGrid(grid0)).map(({ x, y }) => ({
    x,
    y,
    t: null,
    color: getColor(grid0, x, y),
  }));

  const grid = copyGrid(grid0);
  for (let i = 0; i < chain.length; i++) {
    const snake = chain[i];
    const x = getHeadX(snake);
    const y = getHeadY(snake);

    if (isInside(grid, x, y) && !isEmpty(getColor(grid, x, y))) {
      setColorEmpty(grid, x, y);
      const cell = livingCells.find((c) => c.x === x && c.y === y)!;
      cell.t = i / chain.length;
    }
  }

  return livingCells;
};

export const createSvg = (
  grid: Grid,
  cells: Point[] | null,
  chain: Snake[],
  drawOptions: DrawOptions,
  animationOptions: Pick<AnimationOptions, "frameDuration">
) => {
  const width = (grid.width + 2) * drawOptions.sizeCell;
  const height = (grid.height + 5) * drawOptions.sizeCell;

  const duration = animationOptions.frameDuration * chain.length;

  const livingCells = createLivingCells(grid, chain, cells);

  const elements = [
    createGrid(livingCells, drawOptions, duration),
    createStack(
      livingCells,
      drawOptions,
      grid.width * drawOptions.sizeCell,
      (grid.height + 2) * drawOptions.sizeCell,
      duration
    ),
    createSnake(chain, drawOptions, duration),
  ];

  // Adjusted viewBox to ensure labels are visible
  const viewBox = [
    -drawOptions.sizeCell * 2, // Extend left for day labels
    -drawOptions.sizeCell * 3, // Extend up for month labels
    width + drawOptions.sizeCell * 2,
    height + drawOptions.sizeCell * 2,
  ].join(" ");

  const style =
    generateColorVar(drawOptions) +
    elements
      .map((e) => e.styles)
      .flat()
      .join("\n");

  // Add month labels on top, anchored to the current month (May 1, 2025) with adjusted spacing
  const monthLabels: string[] = [];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const currentDate = new Date(); // Current date: May 20, 2025, 06:54 PM BST
  const currentMonthIndex = currentDate.getMonth(); // 0-based index (May = 4)
  const totalDays = grid.width * 7; // 53 weeks * 7 days = 371 days
  const daysPerMonth = Math.floor(totalDays / 12); // ~30.92 days per month
  console.log(
    "::debug::Grid Width:",
    grid.width,
    "Total Days:",
    totalDays,
    "Days Per Month:",
    daysPerMonth,
    "Current Month Index:",
    currentMonthIndex
  );

  // Calculate offset for May 1, 2025 (approximate days from start to May 1)
  const startDate = new Date("2024-05-19"); // Approx grid start: Sunday, May 19, 2024
  const may1Date = new Date(currentDate.getFullYear(), 4, 1); // May 1, 2025
  const daysToMay1 = Math.floor(
    (may1Date.valueOf() - startDate.valueOf()) / (1000 * 60 * 60 * 24)
  ); // Days from May 19, 2024, to May 1, 2025
  const columnOffset = Math.min(
    Math.max(0, Math.floor((totalDays - daysToMay1) / 7)),
    grid.width - 1
  ); // Convert to column (0-52)
  const baseX = (grid.width - columnOffset) * drawOptions.sizeCell; // Start May 1 at this x
  console.log(
    "::debug::Days To May 1:",
    daysToMay1,
    "Column Offset:",
    columnOffset,
    "Base X:",
    baseX
  );

  // Space months evenly across the grid, starting June 2024 at left
  for (let i = 0; i < 12; i++) {
    const monthIndex = (currentMonthIndex - i + 12) % 12; // Wrap around
    const x = -i * (totalDays / 12) * (drawOptions.sizeCell / 7) + baseX; // Spread across days, converted to pixels
    const attrs = {
      x: x,
      y: -drawOptions.sizeCell * 0.5,
      "font-size": "40",
      "font-family": "Calibri",
      fill: "#333333",
      "text-anchor": "middle",
    };
    const label = `<text ${toAttribute(attrs)}>${months[monthIndex]}</text>`;
    monthLabels.push(label);
    console.log(
      "::debug::Month Label",
      i,
      "Index:",
      monthIndex,
      "X:",
      x,
      "Label:",
      label
    );
  }

  // Add day labels on the left (Mon, Wed, Fri), starting Mon at row 2
  const dayLabels: string[] = [];
  const days = ["Mon", "Wed", "Fri"];
  console.log("::debug::Grid Height:", grid.height);
  for (let day = 0; day < days.length; day++) {
    const y = (day * 2 + 2) * drawOptions.sizeCell; // Start Mon at row 2
    const attrs = {
      x: -drawOptions.sizeCell * 0.5,
      y: y - drawOptions.sizeCell * 0.3,
      "font-size": "40",
      "font-family": "Calibri",
      fill: "#333333",
      "text-anchor": "end",
    };
    const label = `<text ${toAttribute(attrs)}>${days[day]}</text>`;
    dayLabels.push(label);
    console.log("::debug::Day Label", day, ":", label);
  }

  // Debug: Log draw options and size cell
  console.log("::debug::Draw Options:", drawOptions);
  console.log("::debug::Size Cell:", drawOptions.sizeCell);

  // Build SVG with labels and inline style to enforce text color
  const svg = [
    h("svg", {
      viewBox,
      width,
      height,
      xmlns: "http://www.w3.org/2000/svg",
    }).replace("/>", ">"),
    "<desc>",
    "Generated with https://github.com/Platane/snk",
    "</desc>",
    "<style>",
    `text { fill: #333333 !important; font-family: Calibri; font-size: 12px; }`,
    optimizeCss(style),
    "</style>",
    ...elements.map((e) => e.svgElements).flat(),
    ...monthLabels,
    ...dayLabels,
    "</svg>",
  ].join("");

  // Debug: Check SVG content before and after optimization
  console.log(
    "::debug::SVG Before Optimize Contains Text:",
    svg.includes("<text")
  );
  const optimizedSvg = optimizeSvg(svg);
  console.log(
    "::debug::SVG After Optimize Contains Text:",
    optimizedSvg.includes("<text")
  );
  console.log("::debug::Month Labels Array:", monthLabels);
  console.log("::debug::Day Labels Array:", dayLabels);

  // Return unoptimized SVG for testing to preserve labels
  return svg; // Skip optimizeSvg for now
};

const optimizeCss = (css: string) => minifyCss(css);
const optimizeSvg = (svg: string) => svg;

const generateColorVar = (drawOptions: DrawOptions) =>
  `
    :root {
    --cb: ${drawOptions.colorDotBorder};
    --cs: ${drawOptions.colorSnake};
    --ce: ${drawOptions.colorEmpty};
    ${Object.entries(drawOptions.colorDots)
      .map(([i, color]) => `--c${i}:${color};`)
      .join("")}
    }
    ` +
  (drawOptions.dark
    ? `
    @media (prefers-color-scheme: dark) {
      :root {
        --cb: ${drawOptions.dark.colorDotBorder || drawOptions.colorDotBorder};
        --cs: ${drawOptions.dark.colorSnake || drawOptions.colorSnake};
        --ce: ${drawOptions.dark.colorEmpty};
        ${Object.entries(drawOptions.dark.colorDots)
          .map(([i, color]) => `--c${i}:${color};`)
          .join("")}
      }
    }
`
    : "");
