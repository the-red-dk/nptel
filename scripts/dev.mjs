import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const args = process.argv.slice(2);
const portArg = args.findIndex((arg) => arg === "-p" || arg === "--port");
const inlinePort = args.find((arg) => arg.startsWith("--port="))?.split("=")[1];
const positionalPortIndex = args.findIndex((arg, index) => /^\d+$/.test(arg) && index === 0);
const port = (portArg >= 0 ? args[portArg + 1] : inlinePort) ?? (positionalPortIndex >= 0 ? args[positionalPortIndex] : "3000");
const nextArgs = [...args];
if (positionalPortIndex >= 0 && portArg < 0 && !inlinePort) {
  nextArgs.splice(positionalPortIndex, 1, "--port", port);
}
const next = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "dev", ...nextArgs], {
  stdio: "inherit",
  env: { ...process.env, NEXT_DIST_DIR: `.next-dev-${port}` },
});
next.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
