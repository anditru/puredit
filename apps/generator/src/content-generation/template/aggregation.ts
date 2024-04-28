import { Path } from "../context-var-detection/blockVariableMap";
import AstCursor from "@puredit/parser/ast/cursor";
import TemplateParameterWithSubProjections from "./parameterWithSubProjections";

export class TemplateAggregation extends TemplateParameterWithSubProjections {
  static lastId = -1;
  static issueId() {
    TemplateAggregation.lastId++;
    return TemplateAggregation.lastId;
  }

  public startSubProjectionName = "";
  public partSubProjectionNames: string[] = [];

  constructor(
    public readonly path: Path,
    public readonly type: string,
    public readonly parts: AggregationPart[],
    public readonly start?: AggregationPart
  ) {
    super(TemplateAggregation.issueId(), path);
  }

  toDeclarationString(): string {
    const variableName = this.toVariableName();
    const subProjectionsString = this.partSubProjectionNames
      .map((name) => `  ${name}.pattern,`)
      .join("\n");
    if (this.start) {
      return `const ${variableName} = agg("${variableName}", "${this.type}", [
${subProjectionsString}
], ${this.startSubProjectionName}.pattern);\n`;
    } else {
      return `const ${variableName} = agg("${variableName}", "${this.type}", [
${subProjectionsString}
]);\n`;
    }
  }

  toVariableName(): string {
    return `agg${this.id}`;
  }

  getEndIndex(astCursor: AstCursor) {
    astCursor.follow(this.path);
    return astCursor.currentNode.endIndex;
  }

  getSubprojectionsCode(astCursor: AstCursor, sample: string): string {
    let subProjectionsCodes = [];
    if (this.start) {
      subProjectionsCodes.push(this.start.extractText(astCursor, sample));
    }
    subProjectionsCodes = subProjectionsCodes.concat(
      this.parts.map((part) => part.extractText(astCursor, sample))
    );
    return subProjectionsCodes.join(" | ");
  }
}

export class AggregationPart {
  constructor(public readonly path: number[]) {}

  extractText(astCursor: AstCursor, codeSample: string) {
    astCursor.follow(this.path);
    const startIndex = astCursor.currentNode.startIndex;
    const endIndex = astCursor.currentNode.endIndex;
    astCursor.reverseFollow(this.path);
    return codeSample.slice(startIndex, endIndex);
  }
}
