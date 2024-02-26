import Generator from "yeoman-generator";
import path from "path";
import fs from "fs";

interface Options {
  packagePath?: string;
}

interface LanguageInfo {
  language: string;
}

interface PackageInfo {
  technicalName: string;
}

interface ProjectionInfo {
  displayName: string;
  technicalName: string;
  description: string;
}

export default class extends Generator<Options> {
  languageInfo: LanguageInfo;
  packageInfo: PackageInfo;
  projectionInfo: ProjectionInfo;

  constructor(args: string | string[], options: Options) {
    super(args, options);
    this.argument("packagePath", {
      type: String,
      required: false,
      description: "Path of the package to create the projection in.",
    });
  }

  async prompting() {
    if (!this.options.packagePath) {
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
      this.languageInfo = await this.prompt<LanguageInfo>(languagePrompts);

      const languagePath = path.resolve(
        __dirname,
        "../../../..",
        "packages",
        "projection-lib",
        this.languageInfo.language
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
      this.packageInfo = await this.prompt<PackageInfo>(packagePrompts);
      this.options.packagePath = path.resolve(languagePath, this.packageInfo.technicalName);
    }

    const projectionInfoPrompts: Generator.Question[] = [
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
    this.projectionInfo = await this.prompt<ProjectionInfo>(projectionInfoPrompts);
  }

  writing() {
    const destinationRoot = path.resolve(
      this.options.packagePath,
      this.projectionInfo.technicalName
    );
    this.destinationRoot(destinationRoot);

    this.fs.copyTpl(this.templatePath("index.tts"), this.destinationPath("index.ts"), {
      ...this.packageInfo,
      ...this.projectionInfo,
    });

    this.fs.copyTpl(
      this.templatePath("Widget.tsvelte"),
      this.destinationPath("Widget.svelte"),
      this.projectionInfo
    );
  }
}

function getAllDirectories(directoryPath: string): string[] {
  const entries = fs.readdirSync(directoryPath, { withFileTypes: true });
  const directories = entries.filter((entry) => entry.isDirectory());
  const directoryNames = directories.map((directory) => directory.name);
  return directoryNames;
}
