import * as fs from "fs";
import { getLanguageService } from "vscode-json-languageservice";

export function extensionLanguageService() {
  const declarativeProjectionSchema = fs.readFileSync(
    __dirname + "/declarativeProjectionSchema.json",
    "utf-8"
  );
  const languageService = getLanguageService({
    schemaRequestService: (uri) => {
      if (uri === "file:///config.schema.json") {
        return Promise.resolve(JSON.stringify(declarativeProjectionSchema));
      }
      return Promise.reject(`Invalid uri ${uri}`);
    },
  });
  languageService.configure({
    allowComments: false,
    schemas: [{ fileMatch: ["config.json"], uri: "config.schema.json" }],
  });
  return languageService;
}
