import Pattern from "../pattern";
import PatternDecorator from "./patternDecorator";
import { createPatternMap } from "../../common";
import { PatternMap, PatternsMap } from "../../match/types";
import TemplateChain from "../../template/parameters/templateChain";

export default class ChainDecorator extends PatternDecorator {
  constructor(
    pattern: Pattern,
    private startPatternMap: PatternMap,
    private linkPatternMap: PatternsMap
  ) {
    super(pattern);
  }

  getStartPatternFor(chainName: string): Pattern {
    const startPattern = this.startPatternMap[chainName];
    if (!startPattern) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return startPattern;
  }

  getStartPatternMapFor(chainName: string): PatternsMap {
    const startPattern = this.getStartPatternFor(chainName);
    return createPatternMap([startPattern]);
  }

  getAllLinkPatterns(): Pattern[] {
    return Object.values(this.linkPatternMap).reduce(
      (allLinkPatterns: Pattern[], currentLinkPatterns: Pattern[]) => {
        return allLinkPatterns.concat(currentLinkPatterns);
      },
      []
    );
  }

  getLinkPatternMapFor(chainName: string): PatternsMap {
    const linkPatterns = this.linkPatternMap[chainName];
    if (!linkPatterns) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    return createPatternMap(linkPatterns);
  }

  addLinkPattern(chainName: string, pattern: Pattern) {
    const linkPatterns = this.linkPatternMap[chainName];
    if (!linkPatterns) {
      throw new Error(`Chain with name ${chainName} not found`);
    }
    linkPatterns.push(pattern);
  }

  getChain(name: string): TemplateChain | undefined {
    return this.template.params.find(
      (param) => param instanceof TemplateChain && param.name === name
    ) as TemplateChain;
  }

  hasChains(): boolean {
    return !!this.startPatternMap && !!this.linkPatternMap;
  }
}
