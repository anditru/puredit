import Ajv from "ajv";
import * as fs from "fs";

const schemaString = fs.readFileSync(__dirname + "/declarativeProjectionSchema.json", "utf-8");
const schema = JSON.parse(schemaString);
const ajv = new Ajv({
  allErrors: true,
});
export const validateSchema = ajv.compile(schema);
