import type TreePath from "../cursor/treePath";

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
  aggregatableNodeTypes: Record<string, AggregatableNodeTypeConfig>;
};

export type AggregatableNodeTypeConfig = {
  startToken: string;
  delimiterToken: string;
  endToken: string;
  contextTemplate: string;
};

export const aggregationPlaceHolder = "__agg__";

export type ChainsConfig = {
  chainNodeType: string;
  pathToCallRoot: TreePath;
  pathToCallBegin: TreePath;
  pathToNextChainLink: TreePath;
};

export type BlocksConfig = {
  blockNodeType: string;
};
