export class BlockVariableMap {
  private entries: VariableMapEntry[] = [];

  set(blockPath: Path, variables: Variable[]) {
    const maybeEntry = this.getEntry(blockPath);
    if (maybeEntry) {
      maybeEntry.variables = variables;
    } else {
      this.entries.push({
        blockPath,
        variables,
      });
    }
  }

  setIntersections(other: BlockVariableMap) {
    const otherEntries = other.getAllEntries();
    for (const otherEntry of otherEntries) {
      const maybeThisEntry = this.getEntry(otherEntry.blockPath);
      if (maybeThisEntry) {
        const intersection = this.getIntersection(maybeThisEntry.variables, otherEntry.variables);
        maybeThisEntry.variables = intersection;
      }
    }
  }

  deleteVariable(variablePath: Path) {
    for (const entry of this.entries) {
      for (const variable of entry.variables) {
        if (this.pathsEqual(variablePath, variable.path)) {
          const index = entry.variables.indexOf(variable);
          entry.variables.splice(index, 1);
          if (!entry.variables.length) {
            this.deleteBlock(entry.blockPath);
          }
        }
      }
    }
  }

  deleteBlock(blockPath: Path) {
    const entry = this.getEntry(blockPath);
    if (entry) {
      const index = this.entries.indexOf(entry);
      this.entries.splice(index, 1);
    }
  }

  get(blockPath: Path): Variable[] | undefined {
    const maybeEntry = this.getEntry(blockPath);
    if (maybeEntry) {
      return maybeEntry.variables;
    } else {
      return undefined;
    }
  }

  getAll(): Variable[] {
    return this.entries.flatMap((entry) => entry.variables);
  }

  getAllEntries() {
    return this.entries;
  }

  private getEntry(blockPath: Path) {
    return this.entries.find((entry) => this.pathsEqual(entry.blockPath, blockPath));
  }

  private pathsEqual(a: Path, b: Path): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  private getIntersection(a: Variable[], b: Variable[]): Variable[] {
    return [...a.filter((variableA) => !!b.find((variableB) => variableA.name === variableB.name))];
  }
}

interface VariableMapEntry {
  blockPath: Path;
  variables: Variable[];
}

export interface Variable {
  name: string;
  path: Path;
}

export type Path = number[];
