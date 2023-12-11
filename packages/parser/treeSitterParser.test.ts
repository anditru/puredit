import { createTreeSitterParser, Target } from "./treeSitterParser";

describe("parser", () => {
  it("can parse TypeScript code", async () => {
    const parser = await createTreeSitterParser(Target.TypeScript);
    expect(() => parser.parse("let x = 42;")).not.toThrow();
  });
  it("can parse Python code", async () => {
    const parser = await createTreeSitterParser(Target.Python);
    expect(() => parser.parse("import antigravity")).not.toThrow();
  });
});
