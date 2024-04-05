import { NodeWasmPathProvider } from "@puredit/node-utils";
import { Parser } from "@puredit/parser";
import { Language } from "../common";

export async function parseCodeSamples(codeSamples: string[], language: Language) {
  const wasmPathProvider = new NodeWasmPathProvider(language);
  const parser = await Parser.load(language, wasmPathProvider);
  return codeSamples.map((sample) => parser.parse(sample));
}
