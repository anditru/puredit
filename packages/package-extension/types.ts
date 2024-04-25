export interface ProjectionExtension {
  type: string;
  package: string;
  projection: string;
  parentParameter: string;
  subProjections: SubProjectionDefinition[];
}

export interface SubProjectionDefinition {
  type: string;
  name: string;
  description: string;
  arguments: TemplateArgumentDefinition[];
  template: string;
  projection: string;
}

export interface TemplateArgumentDefinition {
  name: string;
  types: string[];
}
