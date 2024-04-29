import { zip } from "@puredit/utils";
import ComplexTemplateParameter from "./template/complexParameter";
import inquirer from "inquirer";
import { ProjectionTree, ProjectionTreeGroup } from "./projection/parse";
import AstNode from "@puredit/parser/ast/node";

export class SubProjectionResolver {
  private static runIndex = 0;

  private subProjectionSolution = new Map();

  constructor(
    private readonly codeSamples: string[],
    private readonly codeAsts: AstNode[],
    private readonly projectionTrees: ProjectionTree[],
    private readonly complexTemplateParams: ComplexTemplateParameter[]
  ) {}

  async execute(): Promise<SubProjectionSolution> {
    const samplesPerParam = this.getSamplesPerParam();
    if (!samplesPerParam.length) {
      return this.subProjectionSolution;
    }
    if (this.complexTemplateParams.length === samplesPerParam.length) {
      this.resolveByOrder(samplesPerParam);
    } else if (process.env.DEBUG) {
      this.resolveFromEnv(samplesPerParam);
    } else {
      await this.resolveByUserInput(samplesPerParam);
    }
    return this.subProjectionSolution;
  }

  private getSamplesPerParam(): ProjectionTreeGroup[][] {
    const subProjectionsPerSample = this.projectionTrees.map((sample) =>
      sample.getProjectionTreeGroups()
    );
    const samplesPerParam = [];
    const numSamples = subProjectionsPerSample[0].length;
    for (let i = 0; i < numSamples; i++) {
      const samplesForOneParam = [];
      subProjectionsPerSample.forEach((subProjections) =>
        samplesForOneParam.push(subProjections[i])
      );
      samplesPerParam.push(samplesForOneParam);
    }
    return samplesPerParam;
  }

  private resolveByOrder(samplesPerParam: ProjectionTreeGroup[][]) {
    for (const [param, samplesForOne] of zip(this.complexTemplateParams, samplesPerParam)) {
      this.subProjectionSolution.set(param, samplesForOne);
    }
  }

  private resolveFromEnv(samplesPerParam: ProjectionTreeGroup[][]) {
    if (!process.env.SUBPROJECTION_RESOLUTION) {
      throw new Error(
        "Please provide subprojection solution in DEBUG mode " +
          "via env variable SUBPROJECTION_SOLUTION"
      );
    }
    let solutions: number[][];
    try {
      solutions = JSON.parse(process.env.SUBPROJECTION_RESOLUTION);
    } catch (error) {
      throw new Error("Env variable SUBPROJECTION_SOLUTION must contain valid JSON");
    }
    if (!Array.isArray(solutions)) {
      throw new Error("Env variable SUBPROJECTION_SOLUTION must conatain array of numbers");
    }
    solutions[SubProjectionResolver.runIndex].forEach((paramIndex, solutionIndex) => {
      const complexParam = this.complexTemplateParams[paramIndex];
      const samplesForParam = samplesPerParam[solutionIndex];
      this.subProjectionSolution.set(complexParam, samplesForParam);
    });
    SubProjectionResolver.runIndex++;
  }

  private async resolveByUserInput(samplesPerParam: ProjectionTreeGroup[][]) {
    console.log("Cannot automatically resolve chains and aggregations. Please provide input.");
    const unassignedParams = [...this.complexTemplateParams];
    for (const samplesForOne of samplesPerParam) {
      const choices = unassignedParams.map((param) => {
        const paramIndex = this.complexTemplateParams.indexOf(param);
        const subProjectionsCode = param.getSubProjectionsCode(
          this.codeAsts[0].walk(),
          this.codeSamples[0]
        );
        return {
          name: `${paramIndex}: ${subProjectionsCode}`,
          value: paramIndex,
        };
      });

      const dislpayedSamples = samplesForOne[0].projections
        .map((projection) =>
          projection.widgets.map((widget) => `${widget.getText() || "<empty>"}`).join(" [...] ")
        )
        .join("\n");
      const message = `Select the code samples for the following projection samples:\n${dislpayedSamples}\n`;

      const answer = await inquirer.prompt([
        {
          type: "list",
          name: "index",
          message,
          choices,
        },
      ]);

      const assignedParam = this.complexTemplateParams[answer.index];
      this.subProjectionSolution.set(assignedParam, samplesForOne);
      unassignedParams.splice(unassignedParams.indexOf(assignedParam), 1);
    }
  }
}

export type SubProjectionSolution = Map<ComplexTemplateParameter, ProjectionTreeGroup[]>;
