import { randomBytes } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import { resolveThemePaths, type RuntimeOptions } from "./paths";

interface LockOwner {
  pid: number;
  token: string;
}

function readOwner(lock: string): LockOwner {
  let value: unknown;
  try {
    value = JSON.parse(fs.readFileSync(path.join(lock, "owner.json"), "utf8"));
  } catch (error) {
    throw new Error(
      `Chromarchy mutation lock '${lock}' has malformed ownership data; remove it manually only after confirming no Chromarchy command is running`,
      { cause: error },
    );
  }
  const owner = value as Partial<LockOwner>;
  if (
    !Number.isSafeInteger(owner.pid) ||
    (owner.pid ?? 0) <= 0 ||
    typeof owner.token !== "string" ||
    owner.token.length === 0
  ) {
    throw new Error(
      `Chromarchy mutation lock '${lock}' has malformed ownership data; remove it manually only after confirming no Chromarchy command is running`,
    );
  }
  return owner as LockOwner;
}

function acquire(options: RuntimeOptions): { lock: string; token: string } {
  const paths = resolveThemePaths(options);
  fs.mkdirSync(paths.chromarchyState, { recursive: true });
  const token = randomBytes(16).toString("hex");
  try {
    fs.mkdirSync(paths.mutationLock);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    const owner = readOwner(paths.mutationLock);
    throw new Error(
      `Chromarchy mutation is already running or left a lock '${paths.mutationLock}' (pid ${owner.pid}); remove it manually only after confirming no Chromarchy command is running`,
    );
  }
  try {
    fs.writeFileSync(
      path.join(paths.mutationLock, "owner.json"),
      `${JSON.stringify({ pid: process.pid, token })}\n`,
    );
    return { lock: paths.mutationLock, token };
  } catch (error) {
    fs.rmSync(paths.mutationLock, { recursive: true, force: true });
    throw error;
  }
}

export function withMutationLock<T>(body: () => T, options: RuntimeOptions = {}): T {
  const ownership = acquire(options);
  try {
    return body();
  } finally {
    try {
      if (readOwner(ownership.lock).token === ownership.token) {
        fs.rmSync(ownership.lock, { recursive: true });
      }
    } catch {
      // Never remove a lock whose ownership changed or became unverifiable.
    }
  }
}
