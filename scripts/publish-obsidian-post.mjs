#!/usr/bin/env node
import process from "node:process";
import {
  loadDotEnvLocal,
  publishObsidianPosts,
  resolveSourcePost,
} from "./lib/obsidian-publisher.mjs";

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const flags = new Set();
  const positional = [];

  for (const arg of argv) {
    if (arg.startsWith("--")) flags.add(arg);
    else positional.push(arg);
  }

  if (positional.length !== 1) {
    fail('Usage: npm run publish:obsidian -- "YYYY-MM-DD-slug.md" [--deploy]');
  }

  return { postArg: positional[0], deploy: flags.has("--deploy") };
}

async function main() {
  await loadDotEnvLocal();
  const { postArg, deploy } = parseArgs(process.argv.slice(2));
  const source = await resolveSourcePost(postArg);
  const result = await publishObsidianPosts([source.sourcePath], {
    commit: deploy,
    push: deploy,
    logger: (message) => console.log(message),
  });

  if (!deploy) {
    console.log("Build passed. Review the generated files, then commit and push when ready.");
    return;
  }

  if (result.committed) console.log("Committed publish changes.");
  if (result.pushed) console.log("Pushed current branch.");
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
