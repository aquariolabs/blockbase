export function configState(names: readonly string[], env: NodeJS.ProcessEnv): "off" | "ready" {
  const missing = names.filter((name) => !env[name]);
  if (missing.length === names.length) return "off";
  if (missing.length === 0) return "ready";
  throw new Error(`Incomplete configuration: ${missing.join(", ")}`);
}
