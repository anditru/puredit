import Generator from "yeoman-generator";
import path from "path";
import fs from "fs";

interface Options {
  packagePath?: string;
  inCurrentDirectory: boolean;
}

interface LanguageAnswers {
  language: string;
}

interface PackageAnswers {
  technicalName: string;
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
      const languagePrompts: Generator.Question[] = [
        {
          type: "list",
          name: "language",
          message: "For which language will your projection be?",
          choices: [
            { name: "TypeScript", value: "ts" },
            { name: "Python", value: "py" },
          ],
        },
      ];
      this.languageAnswers = await this.prompt<LanguageAnswers>(languagePrompts);

      const languagePath = path.resolve(
        __dirname,
        "../../../..",
        "packages",
        "projection-lib",
        this.languageAnswers.language
      );
      const projectionPackages = getAllDirectories(languagePath);

      const packagePrompts: Generator.Question[] = [
        {
          type: "list",
          name: "technicalName",
          message: "For which package will your projection be?",
          choices: projectionPackages.map((technicalName) => ({
            name: technicalName,
            value: technicalName,
          })),
        },
      ];
      this.packageAnswers = await this.prompt<PackageAnswers>(packagePrompts);
      this.packagePath = path.resolve(languagePath, this.packageAnswers.technicalName);
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
  }
}

function getAllDirectories(directoryPath: string): string[] {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  const directoryNames = directories.map((directory) => directory.name);
  return directoryNames;
}
