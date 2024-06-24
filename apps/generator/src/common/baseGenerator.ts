import path from "path";
import inquirer, { PromptModule } from "inquirer";
import { create as createMemFs } from "mem-fs";
import { create as createEditor, MemFsEditor, VinylMemFsEditorFile } from "mem-fs-editor";
import { Language, ProjectionContent } from "../content-generation/common";

export default abstract class BaseGenerator {
  public language: Language;
  public readonly fs: MemFsEditor<VinylMemFsEditorFile>;
  protected readonly sharedFs: boolean = true;
  protected readonly prompt: PromptModule;

  constructor(
    protected templateRoot: string,
    protected destinationRoot: string = ".",
    fs?: MemFsEditor<VinylMemFsEditorFile>
  ) {
    this.prompt = inquirer.createPromptModule();
    if (!fs) {
      const store = createMemFs();
      this.fs = createEditor(store);
      this.sharedFs = false;
    } else {
      this.fs = fs;
    }
  }

  abstract setLanguage(language: Language): BaseGenerator;
  abstract setDisplayName(displayName: string): BaseGenerator;
  abstract setTechnicalName(technicalName: string): BaseGenerator;
  abstract setDescription(description: string): BaseGenerator;

  abstract execute(): void;

  abstract showPrompts(): Promise<string>;
  abstract writeFiles(projectionContent?: ProjectionContent): Promise<void>;

  protected templatePath(target: string) {
    return path.resolve(this.templateRoot, target);
  }

  protected destinationPath(target: string) {
    return path.resolve(this.destinationRoot, target);
  }
}
