import type { TreePath } from "@puredit/parser";

export enum Language {
  TypeScript = "ts",
  Python = "py",
}

export type LanguageConfig = {
  arguments: ArgumentsConfig;
  aggregations: AggregationsConfig;
  chains: ChainsConfig;
  blocks: BlocksConfig;
  comments: CommentsConfig;
};

export type ArgumentsConfig = {
  draftTypeMapping: DraftTypeMapping;
};

export type DraftTypeMapping = Record<string, string>;

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
  pathToFirstLink: TreePath;
  chainableNodeTypes: Record<string, ChainableNodeTypeConfig>;
};

export type ChainableNodeTypeConfig = {
  pathToLinkBegin: TreePath;
  pathToNextLink: TreePath;
};

export type BlocksConfig = {
  blockNodeType: string;
  draft: string;
};

export type CommentsConfig = {
  commentTypes: Record<string, CommentTypeConfig>;
};

export type CommentTypeConfig = {
  startTokenRegexes: string[];
};

export const typePlaceHolder = "<type>";
