/**
 * @class PatternTreePath
 * Represents a path through a pattern tree as the sequence of numbers.
 * Each number represents the index of the child to go to next from the current node.
 */
export default class PatternPath {
  constructor(public readonly steps: number[]) {}

  getLastStep(): number {
    return this.steps[this.steps.length - 1];
  }

  getSliceBeforeLastStep(): PatternPath {
    return new PatternPath(this.steps.slice(0, this.steps.length));
  }
}
