import Color from "colorjs.io";

import { generatePalette } from "./palette/generate";
import { parseConfigJson } from "./palette/parse";
import { applyManagedPalette, undoPalette } from "./theme/apply";
import { getThemeState, undoStatus } from "./theme/state";
import { startGenerationWorker } from "./worker";

export const VERSION = "0.8.0";

export function smokeColor(): string {
  return new Color("oklch", [0.65, 0.2, 280]).to("srgb").toString({ format: "hex" });
}

function configArgument(args: readonly string[]): string {
  const index = args.indexOf("--config-json");
  const value = index >= 0 ? args[index + 1] : undefined;
  if (!value) throw new TypeError(`${args[0]} requires --config-json <json>`);
  return value;
}

export function main(args: readonly string[]): number {
  try {
    if (args.includes("--version")) {
      process.stdout.write(`${VERSION}\n`);
      return 0;
    }
    if (args.includes("--smoke")) {
      process.stdout.write(`${JSON.stringify({ ok: true, hex: smokeColor() })}\n`);
      return 0;
    }
    if (args[0] === "worker") {
      startGenerationWorker(process.stdin, process.stdout);
      return 0;
    }
    if (args[0] === "generate") {
      process.stdout.write(
        `${JSON.stringify(generatePalette(parseConfigJson(configArgument(args))))}\n`,
      );
      return 0;
    }
    if (args[0] === "open") {
      process.stdout.write(`${JSON.stringify(getThemeState())}\n`);
      return 0;
    }
    if (args[0] === "apply") {
      process.stdout.write(
        `${JSON.stringify(applyManagedPalette(parseConfigJson(configArgument(args))))}\n`,
      );
      return 0;
    }
    if (args[0] === "undo") {
      process.stdout.write(`${JSON.stringify(undoPalette())}\n`);
      return 0;
    }
    if (args[0] === "undo-status") {
      process.stdout.write(`${JSON.stringify(undoStatus())}\n`);
      return 0;
    }
    process.stderr.write(
      "Usage: chromarchy [--version|--smoke]|open|worker|generate --config-json <json>|apply --config-json <json>|undo|undo-status\n",
    );
    return 2;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    process.stderr.write(`chromarchy: ${message}\n`);
    return 1;
  }
}
