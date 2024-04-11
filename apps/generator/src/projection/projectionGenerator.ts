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
import { Language, ProjectionContent } from "../content-generation/common";

interface ProjectionAnswers {
  language?: Language;
  displayName?: string;
  technicalName?: string;
  description?: string;
}

const projectionQuestions: Record<string, Question> = {
  language: {
    type: "list",
    name: "language",
    message: "For which language will your projection be?",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "Python", value: "py" },
    ],
  },
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
  public readonly packagePath = path.resolve("./");
  private projectionAnswers: ProjectionAnswers = {};
  private projectionContent = {
    widgetContents: [],
    widgetImports: "",
    importedWidgets: `import Widget from "./Widget.svelte";`,
    importedSubProjections: "",
    parameterDeclarations: "",
    templateString: `console.log("Hello World")`,
    widgetTransformations: "const widget = svelteProjection(Widget);",
    segmentWidgetArray: `[ widget ]`,
    postfixWidgetName: "undefined",
    subProjectionArray: "[]",
  };

  constructor() {
    const templateRoot = path.resolve(__dirname, "templates");
    super(templateRoot);
  }

  setLanguage(language: Language) {
    this.language = language;
    this.projectionAnswers.language = language;
    return this;
  }

  setDisplayName(displayName: string) {
    this.projectionAnswers.displayName = displayName;
    return this;
  }

  setTechnicalName(technicalName: string) {
    this.projectionAnswers.technicalName = technicalName;
    return this;
  }

  setDescription(description: string) {
    this.projectionAnswers.description = description;
    return this;
  }

  async execute() {
    await this.showPrompts();
    await this.writeFiles();
  }

  async showPrompts(): Promise<string> {
    const questionsToAsk = Object.keys(projectionQuestions)
      .filter((field) => !this.projectionAnswers[field])
      .map((field) => projectionQuestions[field]);
    const projectionAnswers = await this.prompt<ProjectionAnswers>(questionsToAsk);
    Object.assign(this.projectionAnswers, projectionAnswers);
    this.language = this.projectionAnswers.language;
    return this.projectionAnswers.technicalName;
  }

  async writeFiles(projectionContent?: ProjectionContent): Promise<void> {
    if (projectionContent) {
      this.projectionContent = {
        widgetContents: projectionContent.widgetContents,
        widgetImports: projectionContent.widgetImports,
        importedWidgets: projectionContent.importedWidgets,
        importedSubProjections: projectionContent.importedSubProjections,
        parameterDeclarations: projectionContent.parameterDeclarations,
        templateString: projectionContent.templateString,
        widgetTransformations: projectionContent.widgetTransformations,
        segmentWidgetArray: projectionContent.segmentWidgetArray,
        postfixWidgetName: projectionContent.postfixWidgetName,
        subProjectionArray: projectionContent.subProjectionArray,
      };
    }

    this.destinationRoot = path.resolve(this.packagePath, this.projectionAnswers.technicalName);
    this.fs.copyTpl(this.templatePath("main.tts"), this.destinationPath("main.ts"), {
      ...this.projectionAnswers,
      ...this.projectionContent,
    });

    if (this.projectionContent.widgetContents.length) {
      this.projectionContent.widgetContents.forEach((widgetContent, index) =>
        this.fs.copyTpl(
          this.templatePath("Widget.tsvelte"),
          this.destinationPath(`Widget${index}.svelte`),
          {
            ...this.projectionAnswers,
            widgetImports: this.projectionContent.widgetImports,
            widgetContent,
          }
        )
      );
    } else {
      this.fs.copyTpl(this.templatePath("Widget.tsvelte"), this.destinationPath("Widget.svelte"), {
        ...this.projectionAnswers,
        componentContent: this.projectionAnswers.displayName,
        widgetImports: this.projectionContent.widgetImports,
        widgetContent: this.projectionAnswers.displayName,
      });
    }

    const packageIndexPath = path.resolve(this.destinationRoot, "../index.ts");
    try {
      const packageIndexText = this.fs.read(packageIndexPath);
      const packageIndexAst = this.parsePackageIndexAst(packageIndexText);
      this.registerInPackage(packageIndexPath, packageIndexAst);
    } catch (error) {
      console.log(`${chalk.bold.yellow("Warning:")} Failed to register projection in package`);
    }
    await this.fs.commit();
  }

  private registerInPackage(packageIndexPath: string, packageIndexAst: any) {
    this.addImportStatementTo(packageIndexAst);
    this.addExportStatementTo(packageIndexAst);
    const transformedPackageIndexText = recast.print(packageIndexAst).code;
    this.fs.write(packageIndexPath, transformedPackageIndexText);
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
