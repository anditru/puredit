import BaseGenerator from "../common/baseGenerator";
import path from "path";
import * as recast from "recast";
import { identifier, importDeclaration, importSpecifier, stringLiteral } from "@babel/types";
import babelParser from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default;
import chalk from "chalk";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { Question } from "inquirer";

interface SubProjectionAnswers {
  displayName: string;
  technicalName: string;
  description: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class SubProjectionGenerator extends BaseGenerator {
  subProjectionAnswers: SubProjectionAnswers;

  projectionPath: string;
  relativeSubProjectionPath: string;

  constructor() {
    super(path.resolve(__dirname, "templates"));
  }

  async execute() {
    await this.showPrompts();
    await this.writeFiles();
  }

  async showPrompts() {
    const relativePathParts = [];
    let currentProjectionPath = process.env.INIT_CWD;
    console.log(currentProjectionPath);
    while (
      !this.fs.exists(path.resolve(currentProjectionPath, "main.ts")) &&
      currentProjectionPath !== "/"
    ) {
      relativePathParts.push(currentProjectionPath.split("/").pop());
      currentProjectionPath = path.resolve(currentProjectionPath, "..");
    }
    if (currentProjectionPath === "/") {
      console.log(
        `${chalk.bold.yellow("Warning:")} Failed to find projection main. ` +
          "Registration of sub projection will be skipped."
      );
    } else {
      this.projectionPath = currentProjectionPath;
    }

    const subProjectionAnswersPrompts: Question[] = [
      {
        type: "input",
        name: "displayName",
        message: "What shall be the display name for your sub projection?",
        default: "My Sub Projection",
      },
      {
        type: "input",
        name: "technicalName",
        message: "What shall be the technical name for your sub projection?",
        default: "mySubProjection",
      },
      {
        type: "input",
        name: "description",
        message: "Give a description for your sub projection.",
        default: "A fancy sub projection.",
      },
    ];
    this.subProjectionAnswers = await this.prompt<SubProjectionAnswers>(
      subProjectionAnswersPrompts
    );

    if (relativePathParts.length > 0) {
      this.relativeSubProjectionPath = `./${relativePathParts.reverse().join("/")}/${
        this.subProjectionAnswers.technicalName
      }/config`;
    } else {
      this.relativeSubProjectionPath = `./${this.subProjectionAnswers.technicalName}/config`;
    }
  }

  async writeFiles() {
    this.destinationRoot = path.resolve(
      process.env.INIT_CWD,
      this.subProjectionAnswers.technicalName
    );

    this.fs.copyTpl(
      this.templatePath("config.tts"),
      this.destinationPath("config.ts"),
      this.subProjectionAnswers
    );

    this.fs.copyTpl(
      this.templatePath("Widget.tsvelte"),
      this.destinationPath("Widget.svelte"),
      this.subProjectionAnswers
    );

    const mainPath = path.resolve(this.projectionPath, "main.ts");
    let mainText: string;
    try {
      mainText = this.fs.read(mainPath);
    } catch (error) {
      console.log(
        `${chalk.bold.yellow("Warning:")} Failed to read package index at ${mainPath}. ` +
          "Skipping registration of projection."
      );
      return;
    }

    const mainAst = recast.parse(mainText, {
      parser: {
        parse(source: string) {
          // eslint-disable-next-line @typescript-eslint/no-var-requires
          return babelParser.parse(source, {
            sourceType: "module",
            plugins: [["typescript", {}]],
          });
        },
      },
    });

    const importIndex = mainAst.program.body.findLastIndex(
      (node: any) => node.type === "ImportDeclaration"
    );
    const importDecl = importDeclaration(
      [
        importSpecifier(
          identifier(this.subProjectionAnswers.technicalName),
          identifier(this.subProjectionAnswers.technicalName)
        ),
      ],
      stringLiteral(this.relativeSubProjectionPath)
    );
    mainAst.program.body.splice(importIndex + 1, 0, importDecl);

    const that = this;
    traverse(mainAst, {
      ArrayExpression(path) {
        const parent = path.parent;
        if (
          parent.type === "ObjectProperty" &&
          parent.key.type === "Identifier" &&
          parent.key.name === "subProjections"
        ) {
          path.node.elements.push(identifier(that.subProjectionAnswers.technicalName));
        }
      },
    });

    const transformedMainText = recast.print(mainAst).code;
    this.fs.write(mainPath, transformedMainText);
    await this.fs.commit();
  }
}
