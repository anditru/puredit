import type { Tree } from "web-tree-sitter";
import { Diff } from "mdiff";
import { assert, zip } from "@puredit/utils";
import { ProjectionSegment, ProjectionVariable } from "./projection/scan";
import AstCursor from "@puredit/parser/ast/cursor";
import TemplateArgument from "./template/argument";

export function connectArguments(
  codeSamples: Tree[],
  projectionSamples: string[][],
  argumentPaths: number[][],
  projection: ProjectionSegment[]
): number[] {
  const solutions: number[][] = [];

  for (const [codeSample, projectionSample] of zip(codeSamples, projectionSamples)) {
    const diff = new Diff(projectionSample, projection);
    const projectionArguments: string[] = [];
    const projectionArgumentIndices: number[] = [];
    diff.scanDiff((fromA, toA, fromB, toB) => {
      assert(fromB === toB - 1, "invalid projection");
      assert((projection[fromB] as any).type === "variable", "unknown projection segment");
      projectionArguments.push(projectionSample.slice(fromA, toA).join(" "));
      projectionArgumentIndices.push(fromB);
    });

    for (let i = 0; i < argumentPaths.length; i++) {
      const cursor = new AstCursor(codeSample.walk());
      assert(
        cursor.follow(argumentPaths[i]),
        "wrong combination of code samples and variable path"
      );
      let value = cursor.currentNode.text;
      if (cursor.currentNode.type === "string") {
        value = value.slice(1, value.length - 1);
      }
      const candidates: number[] = [];
      for (let j = 0; j < projectionArguments.length; j++) {
        if (projectionArguments[j] === value) {
          candidates.push(projectionArgumentIndices[j]);
        }
      }
      if (solutions.length > i) {
        solutions[i] = union(solutions[i], candidates);
      } else {
        solutions.push(candidates);
      }
    }
  }

  const result: number[] = [];
  for (let i = 0; i < argumentPaths.length; i++) {
    assert(
      solutions[i].length <= 1,
      `no unique solution for variable at index ${i}, please provide more/better samples`
    );
    if (solutions[i].length) {
      result.push(solutions[i][0]);
    } else {
      result.push(-1);
    }
  }
  return result;
}

function union(a: number[], b: number[]): number[] {
  return a.filter((x) => b.includes(x));
}

export function setArgumentNames(
  projection: ProjectionSegment[],
  connections: number[],
  templateArguments: TemplateArgument[]
) {
  let i = 0;
  for (const connection of connections) {
    const name = templateArguments[i++].toVariableName();
    if (connection >= 0) {
      const segment = projection[connection] as ProjectionVariable;
      assert(segment.type === "variable", "projection segment is not a variable");
      segment.names.push(name);
    }
  }
}
