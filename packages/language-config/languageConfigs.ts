/**
 * @module
 * Stores the configuration object with the configuration properties for each
 * language currently supported by puredit.
 */

import { TreePath } from "@puredit/parser";
import {
  Language,
  aggregationPlaceHolder,
  aggregationStartPlaceHolder,
  type LanguageConfig,
} from "./types";

const languageConfigs: Record<Language, LanguageConfig> = {
  [Language.Python]: {
    lookAheadPaths: {
      attribute: new TreePath([2]),
      call: new TreePath([0, 2]),
    },
    nodeTypesToSplit: {
      function_definition: "body",
      class_definition: "body",
      module: "*",
      block: "*",
    },
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
          hasStartPattern: false,
          partPath: new TreePath([0, 0, 1, 1]),
        },
        dictionary: {
          startToken: "{",
          delimiterToken: ",",
          endToken: "}",
          contextTemplate: `{${aggregationPlaceHolder}}`,
          hasStartPattern: false,
          partPath: new TreePath([0, 0, 1]),
        },
        set: {
          startToken: "{",
          delimiterToken: ",",
          endToken: "}",
          contextTemplate: `{${aggregationPlaceHolder}}`,
          hasStartPattern: false,
          partPath: new TreePath([0, 0, 1]),
        },
        list: {
          startToken: "[",
          delimiterToken: ",",
          endToken: "]",
          contextTemplate: `[${aggregationPlaceHolder}]`,
          hasStartPattern: false,
          partPath: new TreePath([0, 0, 1]),
        },
        tuple: {
          startToken: "(",
          delimiterToken: ",",
          endToken: ")",
          contextTemplate: `(${aggregationPlaceHolder}, 1)`,
          hasStartPattern: false,
          partPath: new TreePath([0, 0, 1]),
        },
        subscript: {
          startToken: "[",
          delimiterToken: ",",
          endToken: "]",
          contextTemplate: `${aggregationStartPlaceHolder}[${aggregationPlaceHolder}]`,
          hasStartPattern: true,
          startPath: new TreePath([0, 0, 0]),
          partPath: new TreePath([0, 0, 2]),
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
    lookAheadPaths: {},
    nodeTypesToSplit: {},
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
          hasStartPattern: false,
          partPath: new TreePath([0, 0, 1, 1]),
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
