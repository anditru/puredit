import { lezer } from "@lezer/generator/rollup";

export default {
  input: "./src/parser.js",
  output: [
    {
      format: "es",
      file: "./dist/index.js",
    },
    {
      format: "cjs",
      file: "./dist/index.cjs",
    },
  ],
  external: ["@lezer/lr"],
  plugins: [lezer()],
};
