import TreePath from "../cursor/treePath";

export enum Language {
  TypeScript = "ts",
  Python = "py",
}

export type LanguageConfig = {
  aggregations: AggregationsConfig;
  chains: ChainsConfig;
  blocks: BlocksConfig;
};

export type AggregationsConfig = {
  aggregatableNodeTypes: AggregatableNodeTypeConfig[];
};

export type AggregatableNodeTypeConfig = {
  name: string;
  startToken: string;
  delimiterToken: string;
  endToken: string;
};

export type ChainsConfig = {
  chainNodeType: string;
  pathToCallRoot: TreePath;
  pathToNextChainLink: TreePath;
  pathToArguments: TreePath;
};

export type BlocksConfig = {
  blockNodeType: string;
};
