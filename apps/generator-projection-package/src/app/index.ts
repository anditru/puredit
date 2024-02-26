import Generator from "yeoman-generator";
import { green } from "chalk";
import yosay from "yosay";
import path from "path";

interface PackageAnswers {
  language: string;
  name: string;
  description: string;
}

interface AdditionalFeaturesAnswers {
  projection: boolean;
}

const shortLanguages = {
  Python: "py",
  TypeScript: "ts",
};

export default class extends Generator<object> {
  packageAnswers: PackageAnswers;
  additionalFeaturesAnswers: AdditionalFeaturesAnswers;
  fullPackageName: string;

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
          { name: "TypeScript", value: "TypeScript" },
          { name: "Python", value: "Python" },
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
    this.packageAnswers = await this.prompt<PackageAnswers>(packageAnswersPrompts);
    this.fullPackageName = `${shortLanguages[this.packageAnswers.language]}-${
      this.packageAnswers.name
    }`;

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
      "projection-libs",
      this.fullPackageName
    );
    this.destinationRoot(destinationRoot);

    this.fs.copyTpl(this.templatePath("index.tts"), this.destinationPath("index.ts"));

    this.fs.copyTpl(this.templatePath("package.tjson"), this.destinationPath("package.json"), {
      ...this.packageAnswers,
      fullPackageName: this.fullPackageName,
    });

    this.fs.copyTpl(
      this.templatePath("parser.tts"),
      this.destinationPath("parser.ts"),
      this.packageAnswers
    );

    if (this.additionalFeaturesAnswers.projection) {
      this.composeWith(require.resolve("../projection/index.js"), {
        packagePath: this.destinationRoot(),
      });
    }
  }
}
