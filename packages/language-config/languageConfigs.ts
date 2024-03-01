import { TreePath } from "@puredit/parser";
import { Language, aggregationPlaceHolder, type LanguageConfig } from "./types";

const languageConfigs: Record<Language, LanguageConfig> = {
  [Language.Python]: {
    arguments: {
      draftTypeMapping: {
        string: `""`,
        integer: "1",
        list: "[]",
        default: "__empty_<type>",
      },
    },
    aggregations: {
      aggregatableNodeTypes: {
        argument_list: {
          startToken: "(",
          delimiterToken: ",",
          endToken: ")",
          contextTemplate: `someFunction(${aggregationPlaceHolder})`,
        },
        dictionary: {
          startToken: "{",
          delimiterToken: ",",
          endToken: "}",
          contextTemplate: `{${aggregationPlaceHolder}}`,
        },
        set: {
          startToken: "{",
          delimiterToken: ",",
          endToken: "}",
          contextTemplate: `{${aggregationPlaceHolder}}`,
        },
        list: {
          startToken: "[",
          delimiterToken: ",",
          endToken: "]",
          contextTemplate: `[${aggregationPlaceHolder}]`,
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
      draft: "pass # instructions go here",
    },
  },
  [Language.TypeScript]: {
    arguments: {
      draftTypeMapping: {
        string: `""`,
        number: "1",
        list: "[]",
        default: "__empty_<type>",
      },
    },
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
      draft: "{\n  // instructions go here\n}",
    },
  },
};

export default languageConfigs;
