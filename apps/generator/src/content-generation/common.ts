export enum Language {
  Python = "py",
  TypeScript = "ts",
}

export const supportedLanguages: Language[] = [Language.Python, Language.TypeScript];
export const newline = process.platform === "win32" ? "\r\n" : "\n";
export const doubleNewline = newline + newline;

export interface Range {
  from: number;
  to: number;
}

export class ProjectionContent {
  constructor(
    public parameterDeclarations: string,
    public templateString: string,
    public paramToSubProjectionsMap: Record<string, string[]>,
    public segmentWidgetContents: string[],
    public allSubProjections: string[],
    public requiredParamterTypes: string[]
  ) {}

  get widgetContents() {
    return this.segmentWidgetContents;
  }

  get parameterImports() {
    return `import { ${this.requiredParamterTypes.join(", ")} } from "@puredit/parser"`;
  }

  get widgetImports() {
    return `  import { highlightingFor } from "@codemirror/language";
  import { tags } from "@lezer/highlight";
  import TextInput from "@puredit/projections/controls/TextInput.svelte";`;
  }

  get importedWidgets() {
    return this.widgetContents
      .map((_, index) => `import Widget${index} from "./Widget${index}.svelte";`)
      .join("\n");
  }

  get importedSubProjections() {
    return this.allSubProjections
      .map((name) => `import { ${name} } from "./${name}/config";`)
      .join("\n");
  }

  get widgetTransformations() {
    return this.widgetContents
      .map((_, index) => `const widget${index} = svelteProjection(Widget${index});`)
      .join("\n");
  }

  get segmentWidgetArray() {
    const nameList = this.segmentWidgetContents.map((_, index) => `widget${index}`).join(", ");
    return `[ ${nameList} ]`;
  }

  get subProjectionArray() {
    const nameList = this.allSubProjections.map((name) => `    ${name}`).join(",\n");
    return `[
${nameList}
  ]`;
  }
}

export function isPrefixOf(prefix: number[], target: number[]): boolean {
  if (target.length < prefix.length) {
    return false;
  }
  for (let i = 0; i < prefix.length; i++) {
    if (prefix[i] !== target[i]) {
      return false;
    }
  }
  return true;
}

export function toTechnicalName(displayName: string) {
  const parts = displayName.split(":");
  const lastPart = parts[parts.length - 1];
  return lastPart
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s(.)/g, (part) => part.toUpperCase().trim())
    .replace(/\s/g, "")
    .replace(/^(.)/, (part) => part.toLowerCase());
}
