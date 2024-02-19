import type Pattern from "./pattern/pattern";
import type { PatternsMap } from "./match/types";

/**
 * Converts an array fo PatterNodes to map that groups the patterns by their type.
 * @param patterns The array of patterns to group
 * @returns Pattern map (NodeType -> Array of PatternNodes of the respective type)
 */
export function createPatternMap(patterns: Pattern[]): PatternsMap {
  const patternMap: PatternsMap = {};
  for (const pattern of patterns) {
    const typesMatchedByRootNode = pattern.getTypesMatchedByRootNode();
    for (const typeMatchedByRootNode of typesMatchedByRootNode) {
      if (patternMap[typeMatchedByRootNode]) {
        patternMap[typeMatchedByRootNode].push(pattern);
      } else {
        patternMap[typeMatchedByRootNode] = [pattern];
      }
    }
  }
  return patternMap;
}
