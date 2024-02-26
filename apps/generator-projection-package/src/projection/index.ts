import Generator from "yeoman-generator";
import path from "path";
import fs from "fs";
import * as parser from "@babel/parser";
import generate from "@babel/generator";
import {
  exportSpecifier,
  identifier,
  importDeclaration,
  importSpecifier,
  stringLiteral,
} from "@babel/types";
import traverse from "@babel/traverse";
import chalk from "chalk";

interface Options {
  packagePath?: string;
  inCurrentDirectory: boolean;
}

interface LanguageAnswers {
  language: string;
}

interface PackageAnswers {
  fullPackageName: string;
}

interface ProjectionAnswers {
  displayName: string;
  technicalName: string;
  description: string;
}

export default class extends Generator<Options> {
  languageAnswers: LanguageAnswers;
  packageAnswers: PackageAnswers;
  projectionAnswers: ProjectionAnswers;

  packagePath: string;

  constructor(args: string | string[], options: Options) {
    super(args, options);
    this.option("packagePath", {
      type: String,
      alias: "p",
      description: "Path of the package to create the projection in.",
    });
    this.option("inCurrentDirectory", {
      type: Boolean,
      alias: "c",
      default: false,
      description: "Generate in the current directory",
    });
  }

  async prompting() {
    if (this.options.packagePath && this.options.inCurrentDirectory) {
      this.log.error(
        "Either option --packagePath (p) can provide package path or --inCurrentDirectory (c) can be set to true but not both"
      );
      process.exit(-1);
    } else if (this.options.packagePath && !this.options.inCurrentDirectory) {
      this.packagePath = this.options.packagePath;
    } else if (!this.options.packagePath && this.options.inCurrentDirectory) {
      this.packagePath = "./";
    } else if (!this.options.packagePath && !this.options.inCurrentDirectory) {
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
      this.packagePath = path.resolve(packagesPath, this.packageAnswers.fullPackageName);
    }

    const projectionAnswersPrompts: Generator.Question[] = [
      {
        type: "input",
        name: "displayName",
        message: "What shall be the display name for your projection?",
        default: "My Projection",
      },
      {
        type: "input",
        name: "technicalName",
        message: "What shall be the technical name for your porjection?",
        default: "myProjection",
      },
      {
        type: "input",
        name: "description",
        message: "Give a description for your projection.",
        default: "A fancy projection.",
      },
    ];
    this.projectionAnswers = await this.prompt<ProjectionAnswers>(projectionAnswersPrompts);
  }

  writing() {
    const destinationRoot = path.resolve(this.packagePath, this.projectionAnswers.technicalName);
    this.destinationRoot(destinationRoot);

    this.fs.copyTpl(this.templatePath("index.tts"), this.destinationPath("index.ts"), {
      ...this.packageAnswers,
      ...this.projectionAnswers,
    });

    this.fs.copyTpl(
      this.templatePath("Widget.tsvelte"),
      this.destinationPath("Widget.svelte"),
      this.projectionAnswers
    );

    const indexPath = path.resolve(destinationRoot, "../index.ts");
    let indexText: string;
    try {
      indexText = this.fs.read(indexPath);
    } catch (error) {
      this.log(
        `${chalk.bold.yellow("Warning:")} Failed to read package index at ${indexPath}.` +
          "Skipping registration of projection."
      );
      return;
    }

    const indexAst = parser.parse(indexText, {
      sourceType: "module",
      plugins: [["typescript", {}]],
    });

    const importIndex = indexAst.program.body.findLastIndex(
      (node) => node.type === "ImportDeclaration"
    );
    const importDecl = importDeclaration(
      [
        importSpecifier(
          identifier(this.projectionAnswers.technicalName),
          identifier(this.projectionAnswers.technicalName)
        ),
      ],
      stringLiteral(`./${this.projectionAnswers.technicalName}/main`)
    );
    indexAst.program.body.splice(importIndex + 1, 0, importDecl);

    const that = this;
    traverse(indexAst, {
      ArrayExpression(path) {
        path.node.elements.push(identifier(that.projectionAnswers.technicalName));
      },
      ExportNamedDeclaration(path) {
        path.node.specifiers.push(
          exportSpecifier(
            identifier(that.projectionAnswers.technicalName),
            identifier(that.projectionAnswers.technicalName)
          )
        );
      },
    });

    const transformedIndexText = generate(indexAst).code;
    this.fs.write(indexPath, transformedIndexText);
  }
}

function getAllDirectories(directoryPath: string): string[] {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  const directoryNames = directories.map((directory) => directory.name);
  return directoryNames;
}
