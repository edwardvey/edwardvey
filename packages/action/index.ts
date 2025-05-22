import * as fs from "fs";
import * as path from "path";
import * as core from "@actions/core";
import { parseOutputsOptions } from "./outputsOptions";
import { generateContributionSnake } from "./generateContributionSnake"; // Switch to static import for consistency

const main = async () => {
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

    const customDrawOptions = {
      fontSizeAxis: 40,
      fontFamilyAxis: "Verdana, Arial, sans-serif",
    };

    const validOutputs = outputs
      .map((out) => {
        if (!out || !out.format) return null; // Skip if out is null or format is missing
        return {
          ...out,
          drawOptions: { ...out.drawOptions, ...customDrawOptions },
        };
      })
      .filter(
        (
          out
        ): out is {
          filename: string; // Add filename to the type predicate
          format: "svg" | "gif";
          drawOptions: any;
          animationOptions: any;
        } => out !== null
      );

    const results = await generateContributionSnake(userName, validOutputs, {
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
};

main();
