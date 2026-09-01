import { Result, TaggedError } from "better-result";
import { z } from "zod";
import { readFileIfExists } from "./fsx.ts";

const scale = z.literal([1, 2, 3, 4, 5]);

export const configSchema = z.object({
  version: z.literal(2),
  /** 1 eager (assume and build) to 5 pushy (explore requirements together first). */
  requirementGathering: scale,
  /** 1 concise (outcomes and short summaries) to 5 detailed (decisions and mechanisms). */
  responseDetail: scale,
});

export type Config = z.infer<typeof configSchema>;
export type Scale = z.infer<typeof scale>;

export const defaultConfig: Config = {
  version: 2,
  requirementGathering: 3,
  responseDetail: 3,
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
