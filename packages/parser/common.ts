import type { PatternMap, PatternNode } from "./types";

/**
 * Converts an array fo PatterNodes to map that groups the patterns by their type.
 * @param patterns The array of patterns to group
 * @returns Pattern map (NodeType -> Array of PatternNodes of the respective type)
 */
export function createPatternMap(patterns: PatternNode[]): PatternMap {
  const patternMap: PatternMap = {};
  for (const pattern of patterns) {
    if (patternMap[pattern.type]) {
      patternMap[pattern.type].push(pattern);
    } else {
      patternMap[pattern.type] = [pattern];
    }
  }
  return patternMap;
}

export function isErrorToken(name: string): boolean {
  return name === "ERROR";
}

export function isTopNode(node: PatternNode): boolean {
  return node.type === "program" || node.type === "module";
}
