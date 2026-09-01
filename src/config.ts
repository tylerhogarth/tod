import { Result, TaggedError } from "better-result";
import { z } from "zod";
import { readFileIfExists } from "./fsx.ts";

export const configSchema = z.object({
  version: z.literal(1),
  communication: z.object({
    technicality: z.enum(["non-technical", "semi-technical", "technical"]),
    detail: z.enum(["concise", "balanced", "detailed"]),
    focus: z.enum(["outcomes", "balanced", "implementation"]),
    tone: z.enum(["terse", "conversational", "chatty"]),
  }),
});

export type Config = z.infer<typeof configSchema>;

export const defaultConfig: Config = {
  version: 1,
  communication: {
    technicality: "non-technical",
    detail: "balanced",
    focus: "outcomes",
    tone: "conversational",
  },
};

export class ConfigError extends TaggedError("Config")<{
  path: string;
  message: string;
}> {}

export function serialiseConfig(config: Config): string {
  return `${JSON.stringify(config, null, 2)}\n`;
}

/** Missing file resolves to defaults; a present-but-invalid file is an error. */
export function loadConfig(path: string): Result<Config, ConfigError> {
  const raw = readFileIfExists(path);
  if (raw === null) {
    return Result.ok(defaultConfig);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (cause) {
    return Result.err(
      new ConfigError({
        path,
        message: `not valid JSON: ${cause instanceof Error ? cause.message : String(cause)}`,
      }),
    );
  }
  const checked = configSchema.safeParse(parsed);
  if (!checked.success) {
    return Result.err(new ConfigError({ path, message: z.prettifyError(checked.error) }));
  }
  return Result.ok(checked.data);
}
