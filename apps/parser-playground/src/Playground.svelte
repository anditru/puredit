<script lang="ts">
  import { arg, block, createPatternMap, PatternMatching } from "@puredit/parser";
  import { matchToString, syntaxNodeToString } from "@puredit/parser/inspect";
  import { parser } from "./parser";
  import AstNode from "@puredit/parser/ast/node";

  let snippet = `
  db.change("students", (table) => {
    // hello
  });
  `;
  const snippetNode = parser.parse(snippet).rootNode;

  const patternMap = createPatternMap([
    parser.statementPattern("changeTable")`
      db.change(${arg("table", ["string"])}, (table) => ${block()});
    `,
    parser.statementPattern("replaceData")`
      table.column(${arg("column", ["string"])}).replace(
        ${arg("target", ["string"])},
        ${arg("replacement", ["string"])}
      );
    `,
    parser.statementPattern("trimData")`
      table.column(${arg("column", ["string"])}).trim(
        ${arg("direction", ["string"])},
      );
    `,
  ]);

  console.time("findPatterns");
  const patternMatching = new PatternMatching(patternMap, snippetNode.walk());
  const { matches } = patternMatching.execute();
  console.timeEnd("findPatterns");
  const matchStrings = matches.map((match) => matchToString(match, snippet)).join("\n");
</script>

<pre>{syntaxNodeToString(new AstNode(snippetNode), snippet)}</pre>
<pre>{matchStrings}</pre>

<style>
  pre {
    margin: 0;
    padding: 10px 50px;
    width: 100%;
    height: 100%;
    overflow: auto;

    background-color: #111;
    color: #fff;
  }
</style>
