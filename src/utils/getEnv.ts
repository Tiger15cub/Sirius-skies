import { config as loadEnvConfig } from "dotenv";
import { resolve as resolvePath } from "path";

/**
 * Determines the appropriate environment file based on NODE_ENV.
 * In development, uses ".dev.env"; otherwise, uses ".env".
 */
const envSuffix = (): string =>
  process.env.NODE_ENV === "development" ? ".dev.env" : ".env";

const resolveEnvFilePath = (): string => {
  const envFileSuffix = envSuffix();
  return resolvePath(process.cwd(), envFileSuffix);
};

loadEnvConfig({ path: resolveEnvFilePath() });

/**
 * Retrieves the value of the specified environment variable.
 *
 * @param name - The name of the environment variable.
 * @param fallback - The fallback value to use if the environment variable is not set.
 * @returns The value of the environment variable.
 * @throws Error if the environment variable is not set and no fallback is provided.
 */
export function getEnv<T = string>(name: string, fallback?: T): T {
  const value = (process.env[name] as T | undefined) ?? fallback;

  if (value === undefined) {
    throw new Error(`Environment variable ${name} has not been set.`);
  }

  return value;
}
