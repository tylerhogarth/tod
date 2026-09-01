// Builds the publishable CLI: a single node-target bundle with a shebang, so
// `npm install -g tod-ai` works on machines that have node but not bun.
const result = await Bun.build({
  entrypoints: ["src/cli.ts"],
  outdir: "dist",
  target: "node",
});
if (!result.success) {
  for (const message of result.logs) {
    console.error(message);
  }
  process.exit(1);
}
// Bun.build carries the entry file's bun shebang into the bundle; replace
// whatever is there so the installed bin always resolves node.
const bundlePath = "dist/cli.js";
let bundle = await Bun.file(bundlePath).text();
if (bundle.startsWith("#!")) {
  bundle = bundle.slice(bundle.indexOf("\n") + 1);
}
await Bun.write(bundlePath, `#!/usr/bin/env node\n${bundle}`);
console.log(`built ${bundlePath}`);
