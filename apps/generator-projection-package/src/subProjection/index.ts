import Generator from "yeoman-generator";
import path from "path";
import fs from "fs";
import * as parser from "@babel/parser";
import generate from "@babel/generator";
import { identifier, importDeclaration, importSpecifier, stringLiteral } from "@babel/types";
import traverse from "@babel/traverse";
import chalk from "chalk";

interface Options {
  projectionPath?: string;
  inCurrentDirectory: boolean;
}

interface PackageAnswers {
  fullPackageName: string;
}

interface ProjectionAnswers {
  technicalName: string;
}

interface SubProjectionAnswers {
  displayName: string;
  technicalName: string;
  description: string;
}

export default class extends Generator<Options> {
  packageAnswers: PackageAnswers;
  projectionAnswers: ProjectionAnswers;
  subProjectionAnswers: SubProjectionAnswers;

  projectionPath: string;

  constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("projectionPath", {
      type: String,
      alias: "p",
      description: "Path of the projection to create the sub projection for.",
    });
    this.option("inCurrentDirectory", {
      type: Boolean,
      alias: "c",
      default: false,
      description: "Generate in the current directory",
    });
  }

  async prompting() {
    if (this.options.projectionPath && this.options.inCurrentDirectory) {
      this.log.error(
        "Either option --projectionPath (p) can provide package path or --inCurrentDirectory (c) can be set to true but not both"
      );
      process.exit(-1);
    } else if (this.options.projectionPath && !this.options.inCurrentDirectory) {
      this.projectionPath = this.options.projectionPath;
    } else if (!this.options.projectionPath && this.options.inCurrentDirectory) {
      this.projectionPath = "./";
    } else if (!this.options.projectionPath && !this.options.inCurrentDirectory) {
      const packagesPath = path.resolve(__dirname, "../../../..", "packages", "projection-libs");
      const projectionPackages = getAllDirectories(packagesPath);
      const packagePrompts: Generator.Question[] = [
        {
          type: "list",
          name: "fullPackageName",
          message: "For which package will your projection be?",
          choices: projectionPackages.map((technicalName) => ({
            name: technicalName,
            value: technicalName,
          })),
        },
      ];
      this.packageAnswers = await this.prompt<PackageAnswers>(packagePrompts);

      const projectionsPath = path.resolve(packagesPath, this.packageAnswers.fullPackageName);
      const projections = getAllDirectories(projectionsPath);
      const projectionPrompts: Generator.Question[] = [
        {
          type: "list",
          name: "technicalName",
          message: "For which projection will your sub projection be?",
          choices: projections.map((technicalName) => ({
            name: technicalName,
            value: technicalName,
          })),
        },
      ];
      this.projectionAnswers = await this.prompt<ProjectionAnswers>(projectionPrompts);
      this.projectionPath = path.resolve(projectionsPath, this.projectionAnswers.technicalName);
    }

    const subProjectionAnswersPrompts: Generator.Question[] = [
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
  }

  writing() {
    const destinationRoot = path.resolve(
      this.projectionPath,
      this.subProjectionAnswers.technicalName
    );
    this.destinationRoot(destinationRoot);

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

    const mainPath = path.resolve(destinationRoot, "../main.ts");
    let mainText: string;
    try {
      mainText = this.fs.read(mainPath);
    } catch (error) {
      this.log(
        `${chalk.bold.yellow("Warning:")} Failed to read projection main at ${mainPath}. ` +
          "Skipping registration of sub projection."
      );
      return;
    }

    const mainAst = parser.parse(mainText, {
      sourceType: "module",
      plugins: [["typescript", {}]],
    });

    const importIndex = mainAst.program.body.findLastIndex(
      (node) => node.type === "ImportDeclaration"
    );
    const importDecl = importDeclaration(
      [
        importSpecifier(
          identifier(this.subProjectionAnswers.technicalName),
          identifier(this.subProjectionAnswers.technicalName)
        ),
      ],
      stringLiteral(`./${this.subProjectionAnswers.technicalName}/config`)
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

    const transformedIndexText = generate(mainAst).code;
    this.fs.write(mainPath, transformedIndexText);
  }
}

function getAllDirectories(directoryPath: string): string[] {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  const directoryNames = directories.map((directory) => directory.name);
  return directoryNames;
}
