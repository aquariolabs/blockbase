const DATABASE_NAME = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function assertDatabaseName(name: string): void {
  if (!DATABASE_NAME.test(name)) {
    throw new Error("Database name must use lowercase letters, numbers, and hyphens.");
  }
}

export function snapshotDatabaseName(group: string): string {
  const name = `${group}-anon-snapshot`;
  assertDatabaseName(name);
  return name;
}

export function previewDatabaseName(group: string, prNumber: string): string {
  if (!/^[0-9]+$/.test(prNumber)) throw new Error("Pull request number must be numeric.");
  const name = `${group}-pr-${prNumber}`;
  assertDatabaseName(name);
  return name;
}

export function productionDatabaseExitCode(name: string): number {
  return name.endsWith("-production") ? 1 : 0;
}

export function assertNotProduction(name: string): void {
  if (productionDatabaseExitCode(name) === 1) {
    throw new Error(`Refusing to seed preview data from ${name}.`);
  }
}

export function seedSource(snapshotName: string, snapshotExists: boolean): string | null {
  assertNotProduction(snapshotName);
  if (!snapshotExists) return null;
  return snapshotName;
}

export function createDatabaseBody(input: { name: string; group: string; seed: string | null }): {
  name: string;
  group: string;
  seed?: { type: "database"; name: string };
} {
  assertDatabaseName(input.name);
  assertDatabaseName(input.group);
  assertNotProduction(input.name);
  const body: { name: string; group: string; seed?: { type: "database"; name: string } } = {
    name: input.name,
    group: input.group,
  };
  if (!input.seed) return body;
  assertNotProduction(input.seed);
  assertDatabaseName(input.seed);
  body.seed = { type: "database", name: input.seed };
  return body;
}
