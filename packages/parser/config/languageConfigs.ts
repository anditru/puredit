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
      pathToFirstLink: new TreePath([0]),
      chainableNodeTypes: {
        call: {
          pathToLinkBegin: new TreePath([0, 1]),
          pathToNextLink: new TreePath([0, 0]),
        },
        attribute: {
          pathToLinkBegin: new TreePath([1]),
          pathToNextLink: new TreePath([0]),
        },
      },
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
      pathToFirstLink: new TreePath([0]),
      chainableNodeTypes: {
        call_expression: {
          pathToLinkBegin: new TreePath([0, 1]),
          pathToNextLink: new TreePath([0, 0]),
        },
        member_expression: {
          pathToLinkBegin: new TreePath([1]),
          pathToNextLink: new TreePath([0]),
        },
      },
    },
    blocks: {
      blockNodeType: "statement_block",
    },
  },
};

export default languageConfigs;
