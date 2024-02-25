import type { Language } from "@puredit/language-config";
import type { RootProjection } from "@puredit/projections/types";

export type ProjectionPackageConfig = {
  name: string;
  description: string;
  projections: RootProjection[];
};

export type ProjectionPackageRegistry = Record<Language, Record<string, ProjectionPackageConfig>>;
