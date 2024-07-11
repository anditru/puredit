// Extensions
export type Extension = PackageExtension | ProjectionExtension;

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
export interface ProjectionExtension {
  type: string;
  package: string;
  parentProjection: string;
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

export type SubProjectionDefinition =
  | NewSubProjectionDefinition
  | AggregationPartReferenceDefinition;

/**
 * @additionalProperties false
 */
export interface NewSubProjectionDefinition {
  type: NewSubProjectionType;
  name: string;
  description: string;
  parameters: TemplateParameterDefinition[];
  template: string;
  segmentWidgets: string[];
}

export enum NewSubProjectionType {
  chainStart = "chainStart",
  chainLink = "chainLink",
  aggregationStart = "aggregationStart",
  aggregationPart = "aggregationPart",
}

export interface AggregationPartReferenceDefinition {
  type: string;
  referencedProjection: string;
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
  startSubProjection?: NewSubProjectionDefinition;
}

/**
 * @additionalProperties false
 */
export interface TemplateChainDefinition {
  type: string;
  name: string;
  startSubProjection: NewSubProjectionDefinition;
  linkSubProjections: NewSubProjectionDefinition[];
  minimumLength?: number;
}
