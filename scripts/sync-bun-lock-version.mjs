import { readFileSync, writeFileSync } from "node:fs";

const packageJson = JSON.parse(readFileSync("package.json", "utf8"));
const lockPath = "bun.lock";
const lock = readFileSync(lockPath, "utf8");
let foundRootWorkspace = false;

const nextLock = lock.replace(
  /("": \{\n\s+"name": "([^"]+)",)(?:\n\s+"version": "[^"]+",)?/,
  (_match, nameLine, workspaceName) => {
    foundRootWorkspace = true;

    if (workspaceName !== packageJson.name) {
      throw new Error(
        `bun.lock root workspace "${workspaceName}" does not match package "${packageJson.name}"`,
      );
    }

    return `${nameLine}\n      "version": "${packageJson.version}",`;
  },
);

if (!foundRootWorkspace) {
  throw new Error("Could not find the root workspace entry in bun.lock");
}

writeFileSync(lockPath, nextLock);
