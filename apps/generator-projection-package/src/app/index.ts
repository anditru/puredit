import Generator from "yeoman-generator";
import { green } from "chalk";
import yosay from "yosay";
import path from "path";

interface PackageInfo {
  language: string;
  displayName: string;
  technicalName: string;
  description: string;
}

interface AdditionalFeatures {
  projection: boolean;
}

export default class extends Generator<object> {
  packageInfo: PackageInfo;
  additionalFeatures: AdditionalFeatures;

  constructor(args: string | string[], options: object) {
    super(args, options);
  }

  async prompting() {
    this.log(yosay(`Welcome to the ${green("Projection Package")} generator!`));
    const packageInfoPrompts: Generator.Question[] = [
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
    this.packageInfo = await this.prompt<PackageInfo>(packageInfoPrompts);

    const additionalFeaturesPrompts: Generator.Question[] = [
      {
        type: "confirm",
        name: "projection",
        message: "Do you want to create a projection?",
      },
    ];
    this.additionalFeatures = await this.prompt<AdditionalFeatures>(additionalFeaturesPrompts);
  }

  writing() {
    const destinationRoot = path.resolve(
      __dirname,
      "../../../..",
      "packages",
      "projection-lib",
      this.packageInfo.language,
      this.packageInfo.technicalName
    );
    this.destinationRoot(destinationRoot);

    this.fs.copyTpl(
      this.templatePath("index.tts"),
      this.destinationPath("index.ts"),
      this.packageInfo
    );

    if (this.additionalFeatures.projection) {
      this.composeWith(require.resolve("../projection/index.js"), {
        packagePath: this.destinationRoot(),
      });
    }
  }
}
