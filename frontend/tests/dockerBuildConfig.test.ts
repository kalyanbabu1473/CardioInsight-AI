import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

function readRepoFile(relativePath: string): string {
  return readFileSync(path.join(repoRoot, relativePath), "utf8");
}

describe("Docker frontend API configuration", () => {
  it("builds with a same-origin /api base before the Vite build", () => {
    const dockerfile = readRepoFile("frontend/Dockerfile");
    const baseUrlArg = dockerfile.search(/^ARG VITE_API_BASE_URL=\/api$/m);
    const baseUrlEnv = dockerfile.search(/^ENV VITE_API_BASE_URL=\$VITE_API_BASE_URL$/m);
    const viteBuild = dockerfile.search(/npm run build/);

    expect(baseUrlArg).toBeGreaterThan(-1);
    expect(baseUrlEnv).toBeGreaterThan(baseUrlArg);
    expect(viteBuild).toBeGreaterThan(baseUrlEnv);
  });

  it("compose explicitly passes the nginx-proxied /api base", () => {
    const compose = readRepoFile("docker-compose.yml");
    expect(compose).toMatch(/VITE_API_BASE_URL:\s*["']?\/api["']?/);
  });
});
