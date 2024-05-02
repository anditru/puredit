import BaseGenerator from "../common/baseGenerator";
import path from "path";
import { Question } from "inquirer";
import { Language } from "@puredit/language-config";
import { fileURLToPath } from "url";
import { dirname } from "path";

interface PackageAnswers {
  language: Language;
  name: string;
  description: string;
}

interface PackageConfig {
  languageName: string;
  name: string;
  description: string;
}

const languageNames = {
  [Language.Python]: "Python",
  [Language.TypeScript]: "TypeScript",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default class PackageGenerator extends BaseGenerator {
  packageConfig: PackageConfig;
  fullPackageName: string;

  constructor() {
    super(path.resolve(__dirname, "templates"));
  }

  async execute() {
    await this.showPrompts();
    await this.writeFiles();
  }

  async showPrompts() {
    const packageAnswersPrompts: Question[] = [
      {
        type: "list",
        name: "language",
        message: "For which language will your package be?",
        choices: [
          { name: "TypeScript", value: "ts" },
          { name: "Python", value: "py" },
        ],
      },
      {
        type: "input",
        name: "name",
        message: "What shall be the name for your package?",
        default: "my-package",
      },
      {
        type: "input",
        name: "description",
        message: "Give a description for your package.",
        default: "A package with projections.",
      },
    ];
    const answers = await this.prompt<PackageAnswers>(packageAnswersPrompts);
    this.packageConfig = {
      languageName: languageNames[answers.language],
      name: answers.name,
      description: answers.description,
    };
    this.language = answers.language;
    this.fullPackageName = `${answers.language}-${this.packageConfig.name}`;
    return this.fullPackageName;
  }

  async writeFiles() {
    const destinationRoot = path.resolve(
      __dirname,
      "../../../..",
      "packages",
      "projection-libs",
      this.fullPackageName
    );
    this.destinationRoot = destinationRoot;

    this.fs.copyTpl(this.templatePath("index.tts"), this.destinationPath("index.ts"));

    this.fs.copyTpl(this.templatePath("package.tjson"), this.destinationPath("package.json"), {
      ...this.packageConfig,
      fullPackageName: this.fullPackageName,
    });

    this.fs.copyTpl(
      this.templatePath("parser.tts"),
      this.destinationPath("parser.ts"),
      this.packageConfig
    );

    await this.fs.commit();
  }
}
