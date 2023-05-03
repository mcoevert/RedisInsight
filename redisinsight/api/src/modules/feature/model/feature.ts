export enum FeatureType {
  Boolean = 'boolean',
  String = 'string',
}

export class Feature {
  name: string;

  type: FeatureType;

  value: boolean | string;
}
