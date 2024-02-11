import TreePath from "../cursor/treePath";
import { Language, LanguageConfig } from "./types";

const languageConfigs: Record<Language, LanguageConfig> = {
  [Language.Python]: {
    aggregations: {
      aggregatableNodeTypes: [
        { name: "argument_list", startToken: "(", delimiterToken: ",", endToken: ")" },
      ],
    },
    chains: {
      chainNodeType: "call",
      pathToCallRoot: new TreePath([0]),
      pathToNextChainLink: new TreePath([0, 0]),
      pathToArguments: new TreePath([1]),
    },
    blocks: {
      blockNodeType: "block",
    },
  },
  [Language.TypeScript]: {
    aggregations: {
      aggregatableNodeTypes: [
        { name: "arguments", startToken: "(", delimiterToken: ",", endToken: ")" },
      ],
    },
    chains: {
      chainNodeType: "call_expression",
      pathToCallRoot: new TreePath([0]),
      pathToNextChainLink: new TreePath([0, 0]),
      pathToArguments: new TreePath([1]),
    },
    blocks: {
      blockNodeType: "statement_block",
    },
  },
};

export default languageConfigs;
