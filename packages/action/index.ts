import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import { parseOutputsOptions } from "./outputsOptions";

(async () => {
  try {
    const userName =
      process.env.github_user_name || core.getInput("github_user_name");
    const outputsEnv = process.env.outputs || "";
    const githubToken =
      process.env.github_token || core.getInput("github_token");

    // Debug logging
    console.log(
      "Environment GITHUB_TOKEN starts with:",
      process.env.GITHUB_TOKEN?.slice(0, 5) || "undefined"
    );
    console.log(
      "Environment github_token starts with:",
      process.env.github_token?.slice(0, 5) || "undefined"
    );
    console.log(
      "Input github_token starts with:",
      core.getInput("github_token")?.slice(0, 5) || "undefined"
    );
    console.log("All environment variables:", process.env);

    if (!githubToken) {
      throw new Error("GitHub token is not provided");
    }

    const outputs = parseOutputsOptions(
      outputsEnv.split("\n").filter((line) => line.trim())
    );
    console.log("Parsed outputs:", outputs);

    const { generateContributionSnake } = await import(
      "./generateContributionSnake"
    );
    const results = await generateContributionSnake(userName, outputs, {
      githubToken,
    });

    outputs.forEach(
      (
        out: {
          filename: string;
          format: "svg" | "gif";
          drawOptions: any;
          animationOptions: any;
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
    console.error("Error details:", e);
  }
})();
