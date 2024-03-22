import path from "path";
import inquirer, { PromptModule } from "inquirer";
import { create as createMemFs } from "mem-fs";
import { create as createEditor, MemFsEditor, VinylMemFsEditorFile } from "mem-fs-editor";

export default abstract class BaseGenerator {
  protected readonly prompt: PromptModule;
  protected readonly fs: MemFsEditor<VinylMemFsEditorFile>;

  constructor(protected templateRoot: string, protected destinationRoot: string = ".") {
    this.prompt = inquirer.createPromptModule();
    const store = createMemFs();
    this.fs = createEditor(store);
  }

  protected templatePath(target: string) {
    return path.resolve(this.templateRoot, target);
  }

  protected destinationPath(target: string) {
    return path.resolve(this.destinationRoot, target);
  }
}
