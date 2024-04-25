import { ProjectionExtension } from "@puredit/package-extension";

export async function parseExtensions(filePath: string): Promise<ProjectionExtension[]> {
  const file = await fetch(filePath);
  const content = await file.json();
  return content;
}
