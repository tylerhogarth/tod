import type { HarnessError, InstallReport } from "../harness.ts";
import { type AgentError, formatError } from "../output.ts";
import { resolveHome } from "../paths.ts";

export function tildify(path: string, home: string = resolveHome()): string {
  return path.startsWith(home) ? `~${path.slice(home.length)}` : path;
}

export function harnessErrorToAgentError(error: HarnessError, home: string): AgentError {
  switch (error._tag) {
    case "NotInitialised":
      return {
        what: "tod is not initialised for this user",
        why: `${tildify(error.todDir, home)} does not exist`,
        fix: "run 'tod init' first",
      };
    case "Config":
      return {
        what: "tod configuration is invalid",
        why: `${tildify(error.path, home)}: ${error.message}`,
        fix: `repair ${tildify(error.path, home)} or delete it (it is recreated with defaults), then re-run`,
      };
    case "MalformedMarkers":
      return {
        what: `tod markers are malformed in ${tildify(error.path, home)}`,
        why: error.message,
        fix: "open the file, delete the broken tod marker lines and everything between them (leave all other content), then re-run",
      };
    case "OutOfBounds":
      return {
        what: "refused to write outside tod's boundary",
        why: `${tildify(error.path, home)} resolves outside the allowed folders`,
        fix: `tod only writes inside: ${error.boundary}. Check HOME and any symlinks on the path`,
      };
    case "Io":
      return {
        what: `could not write ${tildify(error.path, home)}`,
        why: error.message,
        fix: "check file permissions and free disk space, then re-run",
      };
  }
}

export function renderReport(report: InstallReport, home: string, summary: string): string {
  const lines: string[] = [];
  for (const file of report.files) {
    lines.push(`${file.outcome.padEnd(9)} ${tildify(file.path, home)}`);
  }
  for (const skipped of report.skippedAgents) {
    lines.push(`skipped   ${skipped}: config folder not found, no block installed`);
  }
  lines.push(summary);
  return `${lines.join("\n")}\n`;
}

export { formatError };
