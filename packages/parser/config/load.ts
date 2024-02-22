import languageConfigs from "./languageConfigs";
import type {
  AggregatableNodeTypeConfig,
  AggregationsConfig,
  BlocksConfig,
  ChainableNodeTypeConfig,
  ChainsConfig,
  Language,
} from "./types";

export function loadAggregationsConfigFor(language: Language): AggregationsConfig {
  return languageConfigs[language].aggregations;
}

export function loadAggregatableNodeTypeConfigFor(
  language: Language,
  nodeType: string
): AggregatableNodeTypeConfig {
  return languageConfigs[language].aggregations.aggregatableNodeTypes[nodeType];
}

export function loadChainsConfigFor(language: Language): ChainsConfig {
  return languageConfigs[language].chains;
}

export function loadChainableNodeTypeConfigFor(
  language: Language,
  nodeType: string
): ChainableNodeTypeConfig {
  return languageConfigs[language].chains.chainableNodeTypes[nodeType];
}

export function loadChainableNodeTypesFor(language: Language): string[] {
  return Object.keys(languageConfigs[language].chains.chainableNodeTypes);
}

export function loadBlocksConfigFor(language: Language): BlocksConfig {
  return languageConfigs[language].blocks;
}
