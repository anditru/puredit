// Extensions
export type Extension = PackageExtension | RootProjectionExtension | SubProjectionExtension;

/**
 * @additionalProperties false
 */
export interface PackageExtension {
  type: string;
  package: string;
  rootProjections: RootProjectionDefinition[];
}

/**
 * @additionalProperties false
 */
export interface RootProjectionExtension {
  type: string;
  package: string;
  rootProjection: string;
  parentParameter: string;
  subProjections: SubProjectionDefinition[];
}

/**
 * @additionalProperties false
 */
export interface SubProjectionExtension {
  type: string;
  package: string;
  rootProjection: string;
  subProjection: string;
  parentParameter: string;
  subProjections: SubProjectionDefinition[];
}

// Projections

/**
 * @additionalProperties false
 */
export interface RootProjectionDefinition {
  type: string;
  name: string;
  description: string;
  isExpression: boolean;
  parameters: TemplateParameterDefinition[];
  template: string;
  segmentWidgets: string[];
}

/**
 * @additionalProperties false
 */
export interface SubProjectionDefinition {
  type: SubProjectionType;
  name: string;
  description: string;
  parameters: TemplateParameterDefinition[];
  template: string;
  segmentWidgets: string[];
}

export enum SubProjectionType {
  chainStart = "chainStart",
  chainLink = "chainLink",
  aggregationStart = "aggregationStart",
  aggregationPart = "aggregationPart",
}

export type TemplateParameterDefinition =
  | TemplateArgumentDefinition
  | TemplateContextVariableDefinition
  | TemplateAggregationDefinition;

/**
 * @additionalProperties false
 */
export interface TemplateArgumentDefinition {
  type: string;
  name: string;
  nodeTypes: string[];
}

/**
 * @additionalProperties false
 */
export interface TemplateContextVariableDefinition {
  type: string;
  name: string;
}

/**
 * @additionalProperties false
 */
export interface TemplateAggregationDefinition {
  type: string;
  name: string;
  nodeType: string;
  partSubProjections: SubProjectionDefinition[];
  startSubProjection?: SubProjectionDefinition;
}

/**
 * @additionalProperties false
 */
export interface TemplateChainDefinition {
  type: string;
  name: string;
  startSubProjection: SubProjectionDefinition;
  linkSubProjections: SubProjectionDefinition[];
  minimumLength?: number;
}
