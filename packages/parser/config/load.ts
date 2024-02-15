import languageConfigs from "./languageConfigs";
import type { AggregationsConfig, BlocksConfig, ChainsConfig, Language } from "./types";

export function loadAggregationsConfigFor(language: Language): AggregationsConfig {
  return languageConfigs[language].aggregations;
}

export function loadChainsConfigFor(language: Language): ChainsConfig {
  return languageConfigs[language].chains;
}

export function loadBlocksConfigFor(language: Language): BlocksConfig {
  return languageConfigs[language].blocks;
}
