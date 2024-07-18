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
import { Language, ProjectionContent, toTechnicalName } from "../content-generation/common";
import { MemFsEditor, VinylMemFsEditorFile } from "mem-fs-editor";

interface SubProjectionAnswers {
  language: Language;
  displayName: string;
  description: string;
}

interface SubProjectionConfig {
  language: Language;
  displayName: string;
  technicalName: string;
  description: string;
}

const subProjectionQuestions: Record<string, Question> = {
  language: {
    type: "list",
    name: "language",
    message: "For which language will your subprojection be?",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "Python", value: "py" },
    ],
  },
  displayName: {
    type: "input",
    name: "displayName",
    message: "What shall be the display name for your subprojection?",
    default: "MyPackage:MySubProjection",
  },
  description: {
    type: "input",
    name: "description",
    message: "Give a description for your subprojection.",
    default: "A fancy sub projection.",
  },
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class SubProjectionGenerator extends BaseGenerator {
  static highestId = -1;
  static issueId() {
    SubProjectionGenerator.highestId++;
    return SubProjectionGenerator.highestId;
  }
  private subProjectionConfig: SubProjectionConfig = {
    language: null,
    displayName: null,
    technicalName: null,
    description: null,
  };
  private projectionPath: string;
  private relativeSubProjectionPath: string;
  private projectionContent = {
    widgetContents: [],
    parserImports: `import { } from "@puredit/parser/"`,
    widgetImports: "",
    importedWidgets: `import Widget from "./Widget.svelte";`,
    importedSubProjections: "",
    parameterDeclarations: "",
    templateString: `console.log("Hello World")`,
    widgetTransformations: "const widget = svelteProjection(Widget);",
    segmentWidgetArray: `[ widget ]`,
  };

  constructor(fs?: MemFsEditor<VinylMemFsEditorFile>) {
    super(path.resolve(__dirname, "templates"), null, fs);
    this.projectionPath = process.env.INIT_CWD;
  }

  setLanguage(language: Language) {
    this.language = language;
    this.subProjectionConfig.language = language;
    return this;
  }

  setDisplayName(displayName: string) {
    this.subProjectionConfig.displayName = displayName;
    return this;
  }

  setTechnicalName(technicalName: string) {
    this.subProjectionConfig.technicalName = technicalName;
    return this;
  }

  setDescription(description: string) {
    this.subProjectionConfig.description = description;
    return this;
  }

  setProjectionPath(projectionPath: string) {
    this.projectionPath = projectionPath;
    return this;
  }

  async execute() {
    await this.showPrompts();
    await this.writeFiles();
  }

  async showPrompts(): Promise<string> {
    if (process.env.DEBUG) {
      const id = SubProjectionGenerator.issueId();
      this.subProjectionConfig = {
        language: Language.Python,
        displayName: `My Projection ${id}`,
        technicalName: `myProjection${id}`,
        description: `My description ${id}`,
      };
    } else {
      const questionsToAsk = Object.keys(subProjectionQuestions)
        .filter((field) => !this.subProjectionConfig[field])
        .map((field) => subProjectionQuestions[field]);
      const subProjectionAnswers = await this.prompt<SubProjectionAnswers>(questionsToAsk);
      Object.assign(this.subProjectionConfig, subProjectionAnswers);
    }
    this.language = this.subProjectionConfig.language;
    this.subProjectionConfig.technicalName = toTechnicalName(this.subProjectionConfig.displayName);
    this.relativeSubProjectionPath = `./${this.subProjectionConfig.technicalName}/config`;
    return this.subProjectionConfig.technicalName;
  }

  async writeFiles(projectionContent?: ProjectionContent): Promise<void> {
    if (projectionContent) {
      this.projectionContent = {
        widgetContents: projectionContent.widgetContents,
        parserImports: projectionContent.parameterImports,
        widgetImports: projectionContent.widgetImports,
        importedWidgets: projectionContent.importedWidgets,
        importedSubProjections: projectionContent.importedSubProjections,
        parameterDeclarations: projectionContent.parameterDeclarations,
        templateString: projectionContent.templateString,
        widgetTransformations: projectionContent.widgetTransformations,
        segmentWidgetArray: projectionContent.segmentWidgetArray,
      };
    }

    this.destinationRoot = path.resolve(
      this.projectionPath,
      this.subProjectionConfig.technicalName
    );

    this.fs.copyTpl(this.templatePath("config.tts"), this.destinationPath("config.ts"), {
      ...this.subProjectionConfig,
      ...this.projectionContent,
    });

    if (projectionContent && this.projectionContent.widgetContents.length) {
      this.projectionContent.widgetContents.forEach((widgetContent, index) =>
        this.fs.copyTpl(
          this.templatePath("Widget.tsvelte"),
          this.destinationPath(`Widget${index}.svelte`),
          {
            ...this.subProjectionConfig,
            widgetImports: this.projectionContent.widgetImports,
            widgetContent,
          }
        )
      );
    } else if (projectionContent && !this.projectionContent.widgetContents.length) {
      this.fs.copyTpl(this.templatePath("Widget.tsvelte"), this.destinationPath("Widget.svelte"), {
        ...this.subProjectionConfig,
        componentContent: this.subProjectionConfig.displayName,
        widgetImports: this.projectionContent.widgetImports,
        widgetContent: "",
      });
    } else {
      this.fs.copyTpl(this.templatePath("Widget.tsvelte"), this.destinationPath("Widget.svelte"), {
        ...this.subProjectionConfig,
        componentContent: this.subProjectionConfig.displayName,
        widgetImports: this.projectionContent.widgetImports,
        widgetContent: this.subProjectionConfig.displayName,
      });
    }

    if (!this.sharedFs) {
      const mainPath = path.resolve(this.projectionPath, "main.ts");
      let mainText: string;
      try {
        mainText = this.fs.read(mainPath);
      } catch (error) {
        console.log(
          `${chalk.bold.yellow("Warning:")} Failed to read projection index at ${mainPath}. ` +
            "Skipping registration of subprojection."
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
            identifier(this.subProjectionConfig.technicalName),
            identifier(this.subProjectionConfig.technicalName)
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
            path.node.elements.push(identifier(that.subProjectionConfig.technicalName));
          }
        },
      });

      const transformedMainText = recast.print(mainAst).code;
      this.fs.write(mainPath, transformedMainText);

      await this.fs.commit();
    }
  }
}
