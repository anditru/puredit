/**
 * @class PatternTreePath
 * Represents a path through a pattern tree as the sequence of numbers.
 * Each number represents the index of the child to go to next from the current node.
 */
export default class PatternPath {
  constructor(public readonly steps: number[]) {}
}
