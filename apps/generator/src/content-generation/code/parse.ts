import { NodeWasmPathProvider } from "@puredit/utils-node";
import { Parser } from "@puredit/parser";
import { Language } from "../common";
import AstNode from "@puredit/parser/ast/node";

export async function parseCodeSamples(codeSamples: string[], language: Language) {
  const wasmPathProvider = new NodeWasmPathProvider(language);
  const parser = await Parser.load(language, wasmPathProvider);
  const codeAsts = codeSamples.map((sample) => parser.parse(sample));
  return codeAsts.map((ast) => new AstNode(ast.walk().currentNode()));
}
