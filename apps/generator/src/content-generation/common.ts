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
    public postfixWidgetContent?: string
  ) {}

  get widgetContents() {
    return this.postfixWidgetContent
      ? this.segmentWidgetContents.concat(this.postfixWidgetContent)
      : this.segmentWidgetContents;
  }

  get widgetImports() {
    return `  import { highlightingFor } from "@codemirror/language";
  import { tags } from "@lezer/highlight";
  import TextInput from "@puredit/projections/TextInput.svelte";`;
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

  get postfixWidgetName() {
    return this.postfixWidgetContent ? `widget${this.segmentWidgetContents.length}` : "null";
  }

  get subProjectionArray() {
    const nameList = this.allSubProjections.map((name) => `    ${name}`).join(",\n");
    return `[
${nameList}
  ]`;
  }
}
