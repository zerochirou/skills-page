import { getCloudflareContext } from "@opennextjs/cloudflare";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

interface AuthRuntimeEnv {
  DB?: D1Database;
  BETTER_AUTH_SECRET?: string;
  BETTER_AUTH_URL?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
}

export async function getAuth() {
  const { env } = await getCloudflareContext({ async: true });
  const cfEnv = env as AuthRuntimeEnv;
  const db = drizzle(cfEnv.DB as D1Database, { schema });

  const secret = cfEnv.BETTER_AUTH_SECRET ?? process.env.BETTER_AUTH_SECRET;
  const baseURL = cfEnv.BETTER_AUTH_URL ?? process.env.BETTER_AUTH_URL;
  const googleClientId = cfEnv.GOOGLE_CLIENT_ID ?? process.env.GOOGLE_CLIENT_ID;
  const googleClientSecret =
    cfEnv.GOOGLE_CLIENT_SECRET ?? process.env.GOOGLE_CLIENT_SECRET;
  const githubClientId = cfEnv.GITHUB_CLIENT_ID ?? process.env.GITHUB_CLIENT_ID;
  const githubClientSecret =
    cfEnv.GITHUB_CLIENT_SECRET ?? process.env.GITHUB_CLIENT_SECRET;

  return betterAuth({
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: {
      ...(googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : {}),
      ...(githubClientId && githubClientSecret
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {}),
    },
    trustedOrigins: [
      "http://localhost:3000",
      "https://skills.zerochirou.com",
      "https://skills-page.anonymn235.workers.dev",
      "https://*-skills-page.anonymn235.workers.dev",
      ...(baseURL ? [baseURL] : []),
    ],
    secret,
    baseURL,
  });
}
