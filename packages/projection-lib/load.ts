import type { Language } from "@puredit/language-config";
import type { RootProjection, SubProjection } from "@puredit/projections";
import { projectionPackageRegistry } from "./registry";

export function loadProjectionPackages(language: Language, ...names: string[]) {
  let projections: RootProjection[] = [];
  let subProjections: SubProjection[] = [];

  for (const name of names) {
    const projectionPackage = projectionPackageRegistry[language][name];
    if (!projectionPackage) {
      throw new Error(`No package ${name} for language ${language} found`);
    }
    projections = projections.concat(projectionPackage.projections);

    for (const projection of projectionPackage.projections) {
      if (projection.subProjections) {
        subProjections = subProjections.concat(projection.subProjections);
      }
    }
  }
  return {
    projections,
    subProjections,
  };
}
