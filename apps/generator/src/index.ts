#!/usr/bin/env tsx
import { ArgumentParser } from "argparse";
import PackageGenerator from "./package/packageGenerator";
import ProjectionGenerator from "./projection/projectionGenerator";
import SubProjectionGenerator from "./subProjection/subProjectionGenerator";

const parser = new ArgumentParser({
  description:
    "Generate projection packages, projection and subprojection from scratch or based on samples.",
});
const subParsers = parser.add_subparsers({
  help: "What to generate",
  dest: "entity",
});

subParsers.add_parser("package", {
  help: "Generate a projection package",
});

const projectionParser = subParsers.add_parser("projection", {
  help: "Generate a projection",
});
projectionParser.add_argument("--display-name", "-n", {
  required: false,
  help: "Display name for the projection",
  dest: "displayName",
  type: "str",
});
projectionParser.add_argument("--technical-name", "-t", {
  required: false,
  help: "Technical name fpr the projection",
  dest: "technicalName",
  type: "str",
});
projectionParser.add_argument("--description", "-d", {
  required: false,
  help: "Description for the projection",
  dest: "description",
  type: "str",
});
projectionParser.add_argument("--samples-file", "-s", {
  required: false,
  help: "Path to the samples file",
  dest: "samplesFile",
  type: "str",
});
projectionParser.add_argument("--ignore-blocks", "-ib", {
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
} else if (args.entity === "projection") {
  const projectionGenerator = new ProjectionGenerator();
  projectionGenerator.execute(
    args.displayName,
    args.technicalName,
    args.description,
    args.samplesFile,
    args.ignoreBlocks
  );
} else if (args.entity === "subProjection") {
  const subProjectionGenerator = new SubProjectionGenerator();
  subProjectionGenerator.execute();
} else {
  throw new Error(`Creation of ${args.entity} is not implemented`);
}
