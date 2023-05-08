import { Feature } from 'src/modules/feature/model/feature';

export abstract class FeatureRepository {
  abstract get(): Promise<Feature>;
  abstract getOrCreate(config: string): Promise<Feature>;
  abstract update(config: string): Promise<Feature>;
}
