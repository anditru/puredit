import languageConfigs from "./languageConfigs";
import type {
  AggregatableNodeTypeConfig,
  AggregationsConfig,
  BlocksConfig,
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

export function loadBlocksConfigFor(language: Language): BlocksConfig {
  return languageConfigs[language].blocks;
}
