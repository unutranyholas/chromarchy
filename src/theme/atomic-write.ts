import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";

export function atomicWrite(file: string, content: string): void {
  const directory = path.dirname(file);
  fs.mkdirSync(directory, { recursive: true });
  const mode = fs.existsSync(file) ? fs.statSync(file).mode & 0o777 : 0o644;
  const temporary = path.join(
    directory,
    `.${path.basename(file)}.${process.pid}.${randomBytes(6).toString("hex")}`,
  );

  let descriptor: number | undefined;
  try {
    descriptor = fs.openSync(temporary, "wx", mode);
    fs.writeFileSync(descriptor, content, "utf8");
    fs.fsyncSync(descriptor);
    fs.closeSync(descriptor);
    descriptor = undefined;
    fs.renameSync(temporary, file);

    const directoryDescriptor = fs.openSync(directory, "r");
    try {
      fs.fsyncSync(directoryDescriptor);
    } finally {
      fs.closeSync(directoryDescriptor);
    }
  } finally {
    if (descriptor !== undefined) fs.closeSync(descriptor);
    fs.rmSync(temporary, { force: true });
  }
}
