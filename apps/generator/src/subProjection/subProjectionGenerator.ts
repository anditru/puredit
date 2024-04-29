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
import { Language, ProjectionContent } from "../content-generation/common";
import { MemFsEditor, VinylMemFsEditorFile } from "mem-fs-editor";

interface SubProjectionAnswers {
  language: Language;
  displayName: string;
  technicalName: string;
  description: string;
}

const subProjectionAnswersPrompts: Question[] = [
  {
    type: "list",
    name: "language",
    message: "For which language will your subprojection be?",
    choices: [
      { name: "TypeScript", value: "ts" },
      { name: "Python", value: "py" },
    ],
  },
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class SubProjectionGenerator extends BaseGenerator {
  static highestId = -1;
  static issueId() {
    SubProjectionGenerator.highestId++;
    return SubProjectionGenerator.highestId;
  }
  private subProjectionAnswers: SubProjectionAnswers;
  private projectionPath: string;
  private relativeSubProjectionPath: string;
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
  };

  constructor(fs?: MemFsEditor<VinylMemFsEditorFile>) {
    super(path.resolve(__dirname, "templates"), null, fs);
    this.projectionPath = process.env.INIT_CWD;
  }

  setLanguage(language: Language) {
    this.language = language;
    this.subProjectionAnswers.language = language;
    return this;
  }

  setDisplayName(displayName: string) {
    this.subProjectionAnswers.displayName = displayName;
    return this;
  }

  setTechnicalName(technicalName: string) {
    this.subProjectionAnswers.technicalName = technicalName;
    return this;
  }

  setDescription(description: string) {
    this.subProjectionAnswers.description = description;
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
      this.subProjectionAnswers = {
        language: Language.Python,
        displayName: `My Projection ${id}`,
        technicalName: `myProjection${id}`,
        description: `My description ${id}`,
      };
    } else {
      this.subProjectionAnswers = await this.prompt<SubProjectionAnswers>(
        subProjectionAnswersPrompts
      );
    }
    this.language = this.subProjectionAnswers.language;
    this.relativeSubProjectionPath = `./${this.subProjectionAnswers.technicalName}/config`;
    return this.subProjectionAnswers.technicalName;
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
      };
    }

    this.destinationRoot = path.resolve(
      this.projectionPath,
      this.subProjectionAnswers.technicalName
    );

    this.fs.copyTpl(this.templatePath("config.tts"), this.destinationPath("config.ts"), {
      ...this.subProjectionAnswers,
      ...this.projectionContent,
    });

    if (projectionContent && this.projectionContent.widgetContents.length) {
      this.projectionContent.widgetContents.forEach((widgetContent, index) =>
        this.fs.copyTpl(
          this.templatePath("Widget.tsvelte"),
          this.destinationPath(`Widget${index}.svelte`),
          {
            ...this.subProjectionAnswers,
            widgetImports: this.projectionContent.widgetImports,
            widgetContent,
          }
        )
      );
    } else if (projectionContent && !this.projectionContent.widgetContents.length) {
      this.fs.copyTpl(this.templatePath("Widget.tsvelte"), this.destinationPath("Widget.svelte"), {
        ...this.subProjectionAnswers,
        componentContent: this.subProjectionAnswers.displayName,
        widgetImports: this.projectionContent.widgetImports,
        widgetContent: "",
      });
    } else {
      this.fs.copyTpl(this.templatePath("Widget.tsvelte"), this.destinationPath("Widget.svelte"), {
        ...this.subProjectionAnswers,
        componentContent: this.subProjectionAnswers.displayName,
        widgetImports: this.projectionContent.widgetImports,
        widgetContent: this.subProjectionAnswers.displayName,
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
}
