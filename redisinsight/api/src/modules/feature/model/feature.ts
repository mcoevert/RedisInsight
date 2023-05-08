import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export enum Condition {
  EQL = 'eql'
}

export interface FeatureFilter {
  name: string;
  value: any;
  condition: Condition;
}

export class FeatureData {
  flag: boolean;
  name: string;
  perc?: number[][];
  filter?: FeatureFilter;
}

export class Features {
  [key: string]: FeatureData
}

export class FeatureConfig {
  version: string;

  features: Features;
}

export class Feature {
  @ApiProperty({
    description: 'Control group number for A/B testing',
    type: Number,
    default: '1',
  })
  @Expose()
  controlGroup: number;

  @ApiProperty({
    description: 'Remote config version',
    type: String,
    default: '1',
  })
  @Expose()
  version: string;

  @ApiProperty({
    description: 'Remote config',
    isArray: true,
    type: () => FeatureConfig,
  })
  @Expose()
  @Type(() => FeatureConfig)
  config: FeatureConfig;
}
