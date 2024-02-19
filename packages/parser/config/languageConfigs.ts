import TreePath from "../cursor/treePath";
import { Language, aggregationPlaceHolder, type LanguageConfig } from "./types";

const languageConfigs: Record<Language, LanguageConfig> = {
  [Language.Python]: {
    aggregations: {
      aggregatableNodeTypes: {
        argument_list: {
          startToken: "(",
          delimiterToken: ",",
          endToken: ")",
          contextTemplate: `someFunction(${aggregationPlaceHolder})`,
        },
      },
    },
    chains: {
      chainNodeType: "call",
      pathToCallRoot: new TreePath([0]),
      pathToCallBegin: new TreePath([0, 1]),
      pathToNextChainLink: new TreePath([0, 0]),
    },
    blocks: {
      blockNodeType: "block",
    },
  },
  [Language.TypeScript]: {
    aggregations: {
      aggregatableNodeTypes: {
        arguments: {
          startToken: "(",
          delimiterToken: ",",
          endToken: ")",
          contextTemplate: `someFunction(${aggregationPlaceHolder})`,
        },
      },
    },
    chains: {
      chainNodeType: "call_expression",
      pathToCallRoot: new TreePath([0]),
      pathToCallBegin: new TreePath([0, 1]),
      pathToNextChainLink: new TreePath([0, 0]),
    },
    blocks: {
      blockNodeType: "statement_block",
    },
  },
};

export default languageConfigs;
