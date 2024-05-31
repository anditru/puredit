import { Extension } from "@puredit/declarative-projections";

export async function parseExtensions(filePath: string): Promise<Extension[]> {
  const file = await fetch(filePath);
  const content = await file.json();
  return content;
}
