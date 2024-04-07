import BaseGenerator from "../common/baseGenerator";
import path from "path";
import * as recast from "recast";
import {
  exportSpecifier,
  identifier,
  importDeclaration,
  importSpecifier,
  stringLiteral,
} from "@babel/types";
import babelParser from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default;
import chalk from "chalk";
import { Question } from "inquirer";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { generateProjectionContentFromFile } from "./content-generation";
import { Language } from "./content-generation/common";

interface ProjectionAnswers {
  displayName?: string;
  technicalName?: string;
  description?: string;
}

const projectionQuestions: Record<string, Question> = {
  displayName: {
    type: "input",
    name: "displayName",
    message: "What shall be the display name for your projection?",
    default: "My Projection",
  },
  technicalName: {
    type: "input",
    name: "technicalName",
    message: "What shall be the technical name for your projection?",
    default: "myProjection",
  },
  description: {
    type: "input",
    name: "description",
    message: "Give a description for your projection.",
    default: "A fancy projection.",
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class ProjectionGenerator extends BaseGenerator {
  private projectionAnswers: ProjectionAnswers = {};
  private samplesFilePath?: string;
  private ignoreBlocks = false;
  private packagePath = path.resolve("./");

  constructor() {
    super(path.resolve(__dirname, "templates"));
  }

  async execute(
    displayName?: string,
    technicalName?: string,
    description?: string,
    samplesfilePath?: string,
    ignoreBlocks?: boolean
  ) {
    this.projectionAnswers.displayName = displayName;
    this.projectionAnswers.technicalName = technicalName;
    this.projectionAnswers.description = description;
    this.samplesFilePath = samplesfilePath;
    this.ignoreBlocks = ignoreBlocks || false;

    await this.showPrompts();
    await this.writeFiles();
  }

  private async showPrompts() {
    const questionsToAsk = Object.keys(this.projectionAnswers)
      .filter((field) => !this.projectionAnswers[field])
      .map((field) => projectionQuestions[field]);
    const projectionAnswers = await this.prompt<ProjectionAnswers>(questionsToAsk);
    Object.assign(this.projectionAnswers, projectionAnswers);
  }

  private async writeFiles() {
    this.destinationRoot = path.resolve(this.packagePath, this.projectionAnswers.technicalName);
    const language = this.parseLanguage();

    let mainImports = `import Widget from "./Widget.svelte";`;
    let declarationString = "";
    let templateString = `console.log("Hello World")`;
    let widgetArray = `[ widget ]`;
    let widgets = [];
    let widgetImports = "";
    let widgetTransformations = "const widget = svelteProjection(Widget);";
    if (this.samplesFilePath) {
      const projectionContent = await generateProjectionContentFromFile(
        this.samplesFilePath,
        language as Language,
        this.ignoreBlocks
      );
      widgets = projectionContent.widgets;
      widgetImports = `  import { highlightingFor } from "@codemirror/language";\n  import { tags } from "@lezer/highlight";\n  import TextInput from "@puredit/projections/TextInput.svelte";`;

      mainImports = widgets
        .map((_, index) => `import Widget${index} from "./Widget${index}.svelte";`)
        .join("\n");
      widgetTransformations = widgets
        .map((_, index) => `const widget${index} = svelteProjection(Widget${index});`)
        .join("\n");
      declarationString = projectionContent.declarationString;
      templateString = projectionContent.templateString;
      widgetArray = `[ ${widgets.map((_, index) => `widget${index}`).join(", ")} ]`;
    }

    this.fs.copyTpl(this.templatePath("main.tts"), this.destinationPath("main.ts"), {
      ...this.projectionAnswers,
      declarationString,
      templateString,
      mainImports,
      widgetTransformations,
      widgetArray,
    });

    if (widgets.length) {
      widgets.forEach((widget, index) =>
        this.fs.copyTpl(
          this.templatePath("Widget.tsvelte"),
          this.destinationPath(`Widget${index}.svelte`),
          {
            ...this.projectionAnswers,
            componentContent: widget,
            widgetImports,
          }
        )
      );
    } else {
      this.fs.copyTpl(this.templatePath("Widget.tsvelte"), this.destinationPath("Widget.svelte"), {
        ...this.projectionAnswers,
        componentContent: this.projectionAnswers.displayName,
        widgetImports,
      });
    }

    const packageIndexPath = path.resolve(this.destinationRoot, "../index.ts");
    let packageIndexText: string;
    try {
      packageIndexText = this.fs.read(packageIndexPath);
    } catch (error) {
      console.log(
        `${chalk.bold.yellow("Warning:")} Failed to read package index. ` +
          "Skipping registration of projection."
      );
      return;
    }

    const packageIndexAst = this.parsePackageIndexAst(packageIndexText);
    this.addImportStatementTo(packageIndexAst);
    this.addExportStatementTo(packageIndexAst);
    const transformedPackageIndexText = recast.print(packageIndexAst).code;

    this.fs.write(packageIndexPath, transformedPackageIndexText);
    await this.fs.commit();
  }

  private parseLanguage() {
    const packagePathParts = this.packagePath.split("/");
    const packageName = packagePathParts[packagePathParts.length - 1];
    return packageName.split("-")[0];
  }

  private parsePackageIndexAst(packageIndexText: string): any {
    return recast.parse(packageIndexText, {
      parser: {
        parse(source: string) {
          return babelParser.parse(source, {
            sourceType: "module",
            plugins: [["typescript", {}]],
          });
        },
      },
    });
  }

  private addImportStatementTo(packageIndexAst: any) {
    const importIndex = packageIndexAst.program.body.findLastIndex(
      (node: any) => node.type === "ImportDeclaration"
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
    packageIndexAst.program.body.splice(importIndex + 1, 0, importDecl);
  }

  private addExportStatementTo(packageIndexAst: any) {
    const that = this;
    traverse(packageIndexAst, {
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
  }
}
