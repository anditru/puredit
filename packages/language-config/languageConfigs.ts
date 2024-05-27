import { TreePath } from "@puredit/parser";
import {
  Language,
  aggregationPlaceHolder,
  aggregationStartPlaceHolder,
  type LanguageConfig,
} from "./types";

const languageConfigs: Record<Language, LanguageConfig> = {
  [Language.Python]: {
    arguments: {
      draftTypeMapping: {
        string: `""`,
        integer: "1",
        list: "[]",
        default: "_<type>",
      },
    },
    aggregations: {
      aggregatableNodeTypes: {
        argument_list: {
          startToken: "(",
          delimiterToken: ",",
          endToken: ")",
          contextTemplate: `someFunction(${aggregationPlaceHolder})`,
          specialStartPattern: false,
        },
        dictionary: {
          startToken: "{",
          delimiterToken: ",",
          endToken: "}",
          contextTemplate: `{${aggregationPlaceHolder}}`,
          specialStartPattern: false,
        },
        set: {
          startToken: "{",
          delimiterToken: ",",
          endToken: "}",
          contextTemplate: `{${aggregationPlaceHolder}}`,
          specialStartPattern: false,
        },
        list: {
          startToken: "[",
          delimiterToken: ",",
          endToken: "]",
          contextTemplate: `[${aggregationPlaceHolder}]`,
          specialStartPattern: false,
        },
        tuple: {
          startToken: "(",
          delimiterToken: ",",
          endToken: ")",
          contextTemplate: `(${aggregationPlaceHolder}, 1)`,
          specialStartPattern: false,
        },
        subscript: {
          startToken: "[",
          delimiterToken: ",",
          endToken: "]",
          contextTemplate: `${aggregationStartPlaceHolder}[${aggregationPlaceHolder}]`,
          specialStartPattern: true,
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
    comments: {
      statementNodeType: "expression_statement",
      commentTypes: {
        comment: {
          startTokenRegexes: ["#"],
        },
      },
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
          specialStartPattern: false,
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
    comments: {
      statementNodeType: "expression_statement",
      commentTypes: {
        comment: {
          startTokenRegexes: ["//", "/*"],
        },
      },
    },
  },
};

export default languageConfigs;
