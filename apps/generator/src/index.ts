#!/usr/bin/env tsx
import { ArgumentParser } from "argparse";
import PackageGenerator from "./package/packageGenerator";
import RootProjectionGenerator from "./rootProjection/rootProjectionGenerator";
import SubProjectionGenerator from "./subProjection/subProjectionGenerator";
import RootProjectionContentGenerator from "./content-generation/rootProjectionContentGenerator";

const parser = new ArgumentParser({
  description:
    "Generate projection packages, projections and subprojections from scratch or based on samples.",
});
const subParsers = parser.add_subparsers({
  help: "What to generate",
  dest: "entity",
});

subParsers.add_parser("package", {
  help: "Generate a projection package",
});

const rootProjectionParser = subParsers.add_parser("rootProjection", {
  help: "Generate a root projection",
});
rootProjectionParser.add_argument("--language", "-l", {
  required: false,
  help: "Language for the projection",
  dest: "language",
  type: "str",
});
rootProjectionParser.add_argument("--display-name", "-n", {
  required: false,
  help: "Display name for the projection",
  dest: "displayName",
  type: "str",
});
rootProjectionParser.add_argument("--technical-name", "-t", {
  required: false,
  help: "Technical name for the projection",
  dest: "technicalName",
  type: "str",
});
rootProjectionParser.add_argument("--description", "-d", {
  required: false,
  help: "Description for the projection",
  dest: "description",
  type: "str",
});
rootProjectionParser.add_argument("--samples-file", "-s", {
  required: false,
  help: "Path to the samples file",
  dest: "samplesFile",
  type: "str",
});
rootProjectionParser.add_argument("--ignore-blocks", "-ib", {
  required: false,
  default: false,
  help: "Ignore blocks in pattern generation",
  dest: "ignoreBlocks",
  action: "store_true",
});

subParsers.add_parser("subProjection", {
  help: "Generate a sub projection",
});

const args = parser.parse_args();
if (args.entity === "package") {
  const packageGenerator = new PackageGenerator();
  packageGenerator.execute();
} else if (args.entity === "rootProjection" && !args.samplesFile) {
  const projectionGenerator = new RootProjectionGenerator();
  projectionGenerator
    .setLanguage(args.language)
    .setDisplayName(args.displayName)
    .setTechnicalName(args.technicalName)
    .setDescription(args.description)
    .execute();
} else if (args.entity === "rootProjection" && args.samplesFile) {
  const projectionGenerator = new RootProjectionGenerator();
  const contentGenerator = new RootProjectionContentGenerator(projectionGenerator);
  contentGenerator.execute(
    args.samplesFile,
    args.ignoreBlocks,
    args.displayName,
    args.technicalName,
    args.description,
    args.language
  );
} else if (args.entity === "subProjection") {
  const subProjectionGenerator = new SubProjectionGenerator();
  subProjectionGenerator.execute();
} else {
  throw new Error(`Creation of ${args.entity} is not implemented`);
}
