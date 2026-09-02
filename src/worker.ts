import { createInterface } from "node:readline";
import type { Readable, Writable } from "node:stream";

import { generatePalette } from "./palette/generate";
import { parseConfig } from "./palette/parse";

export function startGenerationWorker(input: Readable, output: Writable): void {
  createInterface({ input, crlfDelay: Infinity }).on("line", (line) => {
    let id: number | null = null;
    try {
      const request = JSON.parse(line) as { id?: unknown; config?: unknown };
      if (!Number.isSafeInteger(request.id))
        throw new TypeError("Worker request id must be an integer");
      id = request.id as number;
      output.write(
        `${JSON.stringify({ id, result: generatePalette(parseConfig(request.config)) })}\n`,
      );
    } catch (error) {
      output.write(
        `${JSON.stringify({
          id,
          error: error instanceof Error ? error.message : String(error),
        })}\n`,
      );
    }
  });
}
