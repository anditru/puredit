import languageConfigs from "./languageConfigs";
import type {
  AggregatableNodeTypeConfig,
  AggregationsConfig,
  ArgumentsConfig,
  BlocksConfig,
  ChainableNodeTypeConfig,
  ChainsConfig,
  Language,
} from "./types";

export function loadArgumentsConfigFor(language: Language): ArgumentsConfig {
  return languageConfigs[language].arguments;
}

export function loadAggregationsConfigFor(language: Language): AggregationsConfig {
  return languageConfigs[language].aggregations;
}

export function loadAggregationDelimiterTokensFor(language: Language): string[] {
  const aggregationsConfig = loadAggregationsConfigFor(language);
  return Object.values(aggregationsConfig.aggregatableNodeTypes).map(
    (aggregatableNodeTypeConfig) => aggregatableNodeTypeConfig.delimiterToken
  );
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
