import { ProjectionRegistry } from "@puredit/projections";
import {
  Extension,
  PackageExtension,
  RootProjectionExtension,
  SubProjectionExtension,
} from "./types";
import { Parser } from "@puredit/parser";
import RootProjectionExtensionCompiler from "./projectionExtensionCompiler";
import PackageExtensionCompiler from "./packageExtensionCompiler";
import { ALLOWED_EXTENSION_TYPES } from "./common";

export class ProjectionCompiler {
  private readonly packageExtensionCompiler: PackageExtensionCompiler;
  private readonly projectionExtensionCompiler: RootProjectionExtensionCompiler;

  constructor(
    parser: Parser,
    projectionRegistry: ProjectionRegistry,
    private readonly reportError: (error: string) => void
  ) {
    this.packageExtensionCompiler = new PackageExtensionCompiler(parser, projectionRegistry);
    this.projectionExtensionCompiler = new RootProjectionExtensionCompiler(
      parser,
      projectionRegistry
    );
  }

  compile(extensions: Extension[]) {
    try {
      this.processExtensions(extensions);
    } catch (error: any) {
      this.reportError("Error in declarative projections: " + error.message);
      throw error;
    }
  }

  private processExtensions(extensions: Extension[]) {
    for (const extension of extensions) {
      switch (extension.type) {
        case "packageExtension":
          this.packageExtensionCompiler.compile(extension as PackageExtension);
          break;
        case "rootProjectionExtension":
          this.projectionExtensionCompiler.compile(extension as RootProjectionExtension);
          break;
        case "subProjectionExtension":
          this.projectionExtensionCompiler.compile(extension as SubProjectionExtension);
          break;
        default:
          throw new Error(
            `Invalid extension type ${extension.type}! Allowed values are ${ALLOWED_EXTENSION_TYPES}.`
          );
      }
    }
  }
}
