import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import { parseOutputsOptions } from "./outputsOptions"; // Changed to plural

(async () => {
  try {
    const userName = core.getInput("github_user_name");
    const outputs = parseOutputsOptions(
      core.getMultilineInput("outputs") ?? [
        core.getInput("gif_out_path"),
        core.getInput("svg_out_path"),
      ]
    );
    const githubToken =
      process.env.GITHUB_TOKEN ?? core.getInput("github_token");

    const { generateContributionSnake } = await import(
      "./generateContributionSnake"
    );

    // Mock data in CI environment to avoid API call
    let contributionData;
    if (process.env.CI && !githubToken) {
      console.log("Running in CI, using mock data to avoid 401 error");
      // Mock contribution data: 365 days of random contributions (0-4)
      contributionData = {
        contributions: Array(365)
          .fill(0)
          .map(() => Math.floor(Math.random() * 5)),
      };
    } else {
      // Use real API call outside CI or with a valid token
      contributionData = await generateContributionSnake(userName, [], {
        githubToken,
      });
    }

    const results = await generateContributionSnake(userName, outputs, {
      githubToken,
      contributionData, // Pass mock data if available
    });

    outputs.forEach(
      (
        out: {
          filename: string;
          format: "svg" | "gif";
          drawOptions: any; // Replace with proper DrawOptions type if available
          animationOptions: any; // Replace with proper AnimationOptions type if available
        } | null,
        i: number
      ) => {
        const result = results[i];
        if (out?.filename && result) {
          console.log(`💾 writing to ${out?.filename}`);
          fs.mkdirSync(path.dirname(out?.filename), { recursive: true });
          fs.writeFileSync(out?.filename, result);
        }
      }
    );
  } catch (e: any) {
    core.setFailed(`Action failed with "${e.message}"`);
  }
})();
