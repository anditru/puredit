export function parseProjections(projections: string[]) {
  return projections.map((projection) => projection.trim().split(" "));
}
