import { NodeWasmPathProvider } from "@puredit/utils-node";
import { Parser } from "@puredit/parser";
import { Language } from "../common";
import { Path } from "../context-var-detection/blockVariableMap";
import AstCursor from "@puredit/parser/ast/cursor";

export async function parseCodeSamples(
  codeSamples: string[],
  language: Language,
  offsetPath: Path = []
) {
  const wasmPathProvider = new NodeWasmPathProvider(language);
  const parser = await Parser.load(language, wasmPathProvider);
  const codeAsts = codeSamples.map((sample) => parser.parse(sample));
  return codeAsts.map((ast) => {
    const cursor = new AstCursor(ast.walk());
    cursor.follow(offsetPath);
    return cursor.currentNode;
  });
}
