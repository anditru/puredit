import { newline } from "../common";

export function parseProjections(projections: string[]) {
  return projections.map((projection) => {
    const tokens = tokenize(projection);
    const parser = new Parser();
    return parser.parse(tokens)[0];
  });
}

export class ProjectionTree {
  constructor(
    public readonly widgets: WidgetSample[],
    public readonly subProjectionGroups: ProjectionTreeGroup[]
  ) {}

  getProjectionTokens(): string[] {
    return this.widgets.flatMap((widget) => widget.tokens);
  }

  getWidgetBoundries(): number[] {
    const widgetBoundries = [];
    let currentBoundry = -1;
    for (const widget of this.widgets) {
      currentBoundry += widget.tokens.length;
      widgetBoundries.push(currentBoundry);
    }
    return widgetBoundries;
  }

  getProjectionTreeGroups(): ProjectionTreeGroup[] {
    return this.subProjectionGroups.flatMap((group) => group.getProjectionTreeGroups());
  }
}

export class ProjectionTreeGroup {
  constructor(public readonly projections: ProjectionTree[]) {}

  getProjectionTreeGroups() {
    return [
      this,
      ...this.projections.flatMap((projection) => projection.getProjectionTreeGroups()),
    ];
  }
}

export class WidgetSample {
  constructor(public readonly tokens: string[]) {}

  getText() {
    return this.tokens.join(" ");
  }
}

const indent = "    ";
const indentToken = "<indent>";
const dedentToken = "<dedent>";
const newlineToken = "<newline>";

function tokenize(projection: string) {
  // eslint-disable-next-line no-useless-escape
  const trailingSpacesPattern = `\.[\\s^${newline}]+${newline}`;
  projection = projection.replaceAll(new RegExp(trailingSpacesPattern, "g"), `.${newline}`);
  const lines = projection.split(newline);
  const tokenizedLines = lines
    .map((line) => line.replaceAll(indent, `${indentToken} `))
    .map((line) => line.split(/\s+/))
    .map((tokens) => {
      let sanitizedTokens = [];
      for (let token of tokens) {
        const extractedTokens = [];
        while ([",", "."].includes(getLastChar(token))) {
          extractedTokens.push(getLastChar(token));
          token = token.slice(0, token.length - 1);
        }
        if (token !== "") {
          sanitizedTokens.push(token);
        }
        extractedTokens.reverse();
        sanitizedTokens = sanitizedTokens.concat(extractedTokens);
      }
      sanitizedTokens.push(newlineToken);
      return sanitizedTokens;
    });

  for (let i = tokenizedLines.length - 1; i > 0; i--) {
    const prevIndents = countIndents(tokenizedLines[i - 1]);
    const currentIndents = countIndents(tokenizedLines[i]);
    if (currentIndents > prevIndents) {
      tokenizedLines[i].splice(0, currentIndents, indentToken);
    } else if (currentIndents < prevIndents) {
      tokenizedLines[i].splice(0, currentIndents, dedentToken);
    } else {
      tokenizedLines[i].splice(0, currentIndents);
    }
  }

  return tokenizedLines.flat();
}

function getLastChar(token: string) {
  return token.charAt(token.length - 1);
}

function countIndents(tokens: string[]) {
  return tokens.filter((token) => token === indentToken).length;
}

class Parser {
  private tokens = [];
  private tokenPointer = 0;
  private projectionSamples: ProjectionTree[] = [];

  parse(tokens: string[]) {
    this.tokens = tokens;
    this.projectionSamples.push(this.parseProjectionSample());
    while (!this.eofReached()) {
      this.advance();
      this.projectionSamples.push(this.parseProjectionSample());
    }
    return this.projectionSamples;
  }

  private parseProjectionSample(): ProjectionTree {
    const widgetSamples: WidgetSample[] = [];
    const subProjectionSampleGroups: ProjectionTreeGroup[] = [];
    while (this.currentToken !== ".") {
      const nextWidgetTokens = this.getNextWidgetTokens();
      widgetSamples.push(new WidgetSample(nextWidgetTokens));
      if (this.currentToken === indentToken) {
        const dedentIndex = this.getCorrespondingDedentIndex();
        const subProjectionsTokens = this.tokens.slice(this.tokenPointer + 1, dedentIndex);
        const subParser = new Parser();
        const subProjectionSamples = subParser.parse(subProjectionsTokens);
        subProjectionSampleGroups.push(new ProjectionTreeGroup(subProjectionSamples));
        this.goTo(dedentIndex + 1);
      }
    }
    return new ProjectionTree(widgetSamples, subProjectionSampleGroups);
  }

  private getNextWidgetTokens(): string[] {
    const nextWidgetTokens = [];
    while (![indentToken, "."].includes(this.currentToken)) {
      nextWidgetTokens.push(this.currentToken);
      this.advance();
    }
    return this.clean(nextWidgetTokens);
  }

  private getCorrespondingDedentIndex(): number {
    let distance = 0;
    let numOpenIndents = 1;
    while (this.currentToken !== dedentToken || numOpenIndents > 0) {
      try {
        this.advance();
      } catch (error) {
        throw new UnbalancedIndents();
      }
      distance++;
      if (this.currentToken === indentToken) {
        numOpenIndents++;
      } else if (this.currentToken === dedentToken) {
        numOpenIndents--;
      }
    }
    this.goBack(distance);
    return this.tokenPointer + distance;
  }

  private clean(tokens: string[]) {
    return tokens.filter((token) => ![newlineToken, indentToken, dedentToken, "."].includes(token));
  }

  private advance() {
    if (!this.tokens[this.tokenPointer + 1]) {
      throw new OutOfBounds();
    }
    this.tokenPointer++;
  }

  private goTo(index: number) {
    this.tokenPointer = index;
  }

  private goBack(steps: number) {
    this.tokenPointer -= steps;
  }

  private eofReached(): boolean {
    let distance = 0;
    do {
      try {
        this.advance();
      } catch (error) {
        this.goBack(distance);
        return true;
      }
      distance++;
    } while ([dedentToken, newlineToken].includes(this.currentToken));
    this.goBack(distance);
    return false;
  }

  private get currentToken() {
    return this.tokens[this.tokenPointer];
  }
}

class OutOfBounds extends Error {}
class UnbalancedIndents extends Error {}
