/**
 * @class TreePath
 * Represents a path through a pattern tree or AST as the sequence of numbers.
 * Each number represents the index of the child to go to next from the current node.
 */
export default class TreePath {
  constructor(public readonly steps: number[]) {}

  getLastStep(): number {
    return this.steps[this.steps.length - 1];
  }

  getSliceBeforeLastStep(): TreePath {
    return new TreePath(this.steps.slice(0, this.steps.length - 1));
  }
}
