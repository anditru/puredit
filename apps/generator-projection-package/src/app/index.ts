import Generator from "yeoman-generator";
import { green } from "chalk";
import yosay from "yosay";
import path from "path";

interface PackageAnswers {
  language: string;
  displayName: string;
  technicalName: string;
  description: string;
}

interface AdditionalFeaturesAnswers {
  projection: boolean;
}

export default class extends Generator<object> {
  packageAnswers: PackageAnswers;
  additionalFeaturesAnswers: AdditionalFeaturesAnswers;

  constructor(args: string | string[], options: object) {
    super(args, options);
  }

  async prompting() {
    this.log(yosay(`Welcome to the ${green("Projection Package")} generator!`));
    const packageAnswersPrompts: Generator.Question[] = [
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
        name: "displayName",
        message: "What shall be the display name for your package?",
        default: "My Projection Package",
      },
      {
        type: "input",
        name: "technicalName",
        message: "What shall be the technical name for your package?",
        default: "myProjectionPackage",
      },
      {
        type: "input",
        name: "description",
        message: "Give a description for your package.",
        default: "A package with projections.",
      },
    ];
    this.packageAnswers = await this.prompt<PackageAnswers>(packageAnswersPrompts);

    const additionalFeaturesPrompts: Generator.Question[] = [
      {
        type: "confirm",
        name: "projection",
        message: "Do you want to create a projection?",
      },
    ];
    this.additionalFeaturesAnswers = await this.prompt<AdditionalFeaturesAnswers>(
      additionalFeaturesPrompts
    );
  }

  writing() {
    const destinationRoot = path.resolve(
      __dirname,
      "../../../..",
      "packages",
      "projection-lib",
      this.packageAnswers.language,
      this.packageAnswers.technicalName
    );
    this.destinationRoot(destinationRoot);

    this.fs.copyTpl(
      this.templatePath("index.tts"),
      this.destinationPath("index.ts"),
      this.packageAnswers
    );

    if (this.additionalFeaturesAnswers.projection) {
      this.composeWith(require.resolve("../projection/index.js"), {
        packagePath: this.destinationRoot(),
      });
    }
  }
}
