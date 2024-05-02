export interface Extension {
  type: string;
  package: string;
}

export interface PackageExtension extends Extension {
  projections: ProjectionDefinition[];
}

export interface ProjectionExtension extends Extension {
  projection: string;
  parentParameter: string;
  subProjections: SubProjectionDefinition[];
}

export interface SubProjectionExtension extends Extension {
  projection: string;
  subProjection: string;
  parentParameter: string;
  subProjections: SubProjectionDefinition[];
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface ProjectionDefinition {
  // TODO
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
