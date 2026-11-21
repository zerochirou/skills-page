import fs from "node:fs";
import path from "node:path";
import { defineConfig } from "drizzle-kit";

function getLocalD1DbPath(): string | undefined {
  const d1Dir = path.resolve(
    ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"
  );
  if (!fs.existsSync(d1Dir)) return undefined;

  const sqliteFile = fs
    .readdirSync(d1Dir)
    .find((file) => file.endsWith(".sqlite") && file !== "metadata.sqlite");

  return sqliteFile ? path.join(d1Dir, sqliteFile) : undefined;
}

const localD1Path = getLocalD1DbPath();

export default defineConfig({
  dialect: "sqlite",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  ...(localD1Path ? { dbCredentials: { url: localD1Path } } : {}),
});
