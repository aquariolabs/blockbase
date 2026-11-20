export type ColumnRule =
  | { op: "keep" }
  | { op: "null" }
  | { op: "truncate" }
  | { op: "random-bytes" }
  | { op: "fake"; fake: (value: unknown) => unknown };

export type TableRule = { op: "truncate" } | { op: "columns"; columns: Record<string, ColumnRule> };

export type AnonymizeConfig = Record<string, TableRule>;

export type ColumnInfo = {
  name: string;
  notNull: boolean;
};
