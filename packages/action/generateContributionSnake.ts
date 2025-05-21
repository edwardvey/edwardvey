import { Octokit } from "@octokit/rest";
import { userContributionToGrid } from "./userContributionToGrid";
import { getBestRoute } from "@snk/solver/getBestRoute";
import { snake4 } from "@snk/types/__fixtures__/snake";
import { getPathToPose } from "@snk/solver/getPathToPose";
import type { DrawOptions as DrawOptions } from "@snk/svg-creator";
import type { AnimationOptions } from "@snk/gif-creator";

async function getGithubUserContribution(
  userName: string,
  options: { githubToken: string }
) {
  const octokit = new Octokit({ auth: options.githubToken });

  const { data: events } = await octokit.activity.listEventsForUser({
    username: userName,
    per_page: 100,
  });

  const contributions = Array(365).fill(0);
  const now = new Date();
  events.forEach((event) => {
    const eventDate = new Date(event.created_at);
    const daysAgo = Math.floor(
      (now.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysAgo >= 0 && daysAgo < 365) contributions[daysAgo]++;
  });

  return contributions.map((count, index) => ({
    x: Math.floor(index / 7),
    y: index % 7,
    date: new Date(now.setDate(now.getDate() - (364 - index)))
      .toISOString()
      .split("T")[0],
    count,
    level: count > 0 ? (count >= 4 ? 4 : Math.min(Math.ceil(count / 2), 3)) : 0,
  }));
}

export const generateContributionSnake = async (
  userName: string,
  outputs: ({
    format: "svg" | "gif";
    drawOptions: DrawOptions;
    animationOptions: AnimationOptions;
  } | null)[],
  options: { githubToken: string }
) => {
  console.log("🎣 fetching github user contribution");
  const cells = await getGithubUserContribution(userName, options);

  const grid = userContributionToGrid(cells);
  const snake = snake4;

  console.log("📡 computing best route");
  const chain = getBestRoute(grid, snake)!;
  chain.push(...getPathToPose(chain.slice(-1)[0], snake)!);

  return Promise.all(
    outputs.map(async (out, i) => {
      if (!out) return;
      const { format, drawOptions, animationOptions } = out;
      switch (format) {
        case "svg": {
          console.log(`🖌 creating svg (outputs[${i}])`);
          const { createSvg } = await import("@snk/svg-creator");
          return createSvg(grid, cells, chain, drawOptions, animationOptions);
        }
        case "gif": {
          console.log(`📹 creating gif (outputs[${i}])`);
          const { createGif } = await import("@snk/gif-creator");
          return await createGif(
            grid,
            cells,
            chain,
            drawOptions,
            animationOptions
          );
        }
      }
    })
  );
};
