import { Language } from "@puredit/language-config";
import { createTreeSitterParser } from "./treeSitterParser";

describe("parser", () => {
  it("can parse TypeScript code", async () => {
    const parser = await createTreeSitterParser(Language.TypeScript);
    expect(() => parser.parse("let x = 42;")).not.toThrow();
  });
  it("can parse Python code", async () => {
    const parser = await createTreeSitterParser(Language.Python);
    expect(() => parser.parse("import antigravity")).not.toThrow();
  });
});
