import * as TJS from "typescript-json-schema";
import { resolve } from "path";
import fs from "fs";

const staticPart = {
  type: "array",
  items: {
    oneOf: [
      {
        $ref: "#/definitions/PackageExtension",
      },
      {
        $ref: "#/definitions/RootProjectionExtension",
      },
      {
        $ref: "#/definitions/SubProjectionExtension",
      },
    ],
  },
};
const types = {
  PackageExtension: "packageExtension",
  RootProjectionExtension: "rootProjectionExtension",
  SubProjectionExtension: "subProjectionExtension",
  RootProjectionDefinition: "rootProjection",
  TemplateArgumentDefinition: "argument",
  TemplateContextVariableDefinition: "contextVariable",
  TemplateAggregationDefinition: "aggregation",
};
const enums = {
  SubProjectionDefinition: ["chainLink", "aggregationPart"],
};

const program = TJS.getProgramFromFiles([resolve("../types.ts")]);
const schema = TJS.generateSchema(program, "*");
Object.keys(types).forEach((key) => {
  schema!.definitions![key].properties.type.const = types[key];
});
Object.keys(enums).forEach((key) => {
  schema!.definitions![key].properties.type.enum = enums[key];
});
Object.keys(schema!.definitions!).forEach((definitionKey) => {
  const definition = schema!.definitions![definitionKey];
  if (definition.type !== "object") {
    return;
  }
  console.log(definition);
  const properties = Object.keys(definition.properties);
  definition["required"] = properties;
});
const completeSchema = Object.assign({}, schema, staticPart);
fs.writeFileSync("./extensionSchema.json", JSON.stringify(completeSchema, null, 2));
