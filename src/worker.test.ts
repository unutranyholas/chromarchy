import { PassThrough } from "node:stream";

import { TEST_CONFIG } from "./test-fixtures";
import { startGenerationWorker } from "./worker";

it("generates multiple responses and survives an invalid request", async () => {
  const input = new PassThrough();
  const output = new PassThrough();
  const lines: string[] = [];
  const responses = new Promise<Record<string, unknown>[]>((resolve) => {
    output.on("data", (chunk) => {
      lines.push(...String(chunk).trim().split("\n"));
      if (lines.length === 3) resolve(lines.map((line) => JSON.parse(line)));
    });
  });

  startGenerationWorker(input, output);
  input.write(`${JSON.stringify({ id: 1, config: TEST_CONFIG })}\n`);
  input.write('{"id":2,"config":{}}\n');
  input.write(`${JSON.stringify({ id: 3, config: TEST_CONFIG })}\n`);

  await expect(responses).resolves.toMatchObject([
    { id: 1, result: { config: TEST_CONFIG } },
    { id: 2, error: expect.any(String) },
    { id: 3, result: { config: TEST_CONFIG } },
  ]);
  input.end();
});
