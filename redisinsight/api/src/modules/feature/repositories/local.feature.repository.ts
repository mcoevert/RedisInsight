import {
  Injectable, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToClass, serialize } from 'class-transformer';
import { classToClass } from 'src/utils';

import { FeatureRepository } from './feature.repository';
import { FeatureEntity } from '../entities/feature.entity';
import { Feature } from '../model/feature';

@Injectable()
export class LocalFeatureRepository extends FeatureRepository {
  private readonly logger = new Logger('FeatureRepository');

  constructor(
    @InjectRepository(FeatureEntity)
    private readonly repository: Repository<FeatureEntity>,
  ) {
    super();
  }

  /**
   * get entire entity
   */
  async get(): Promise<Feature> {
    this.logger.log('Getting feature entity');

    const entity = await this.repository.findOneBy({});
    return classToClass(Feature, entity);
  }

  /**
   * get or create entire entity
   * @param config
   */
  async getOrCreate(config?: string): Promise<Feature> {
    this.logger.log('Creating feature entity');

    const entity = await this.repository.findOneBy({});

    if (!entity) {
      this.logger.log('Creating feature entity');
      const controlGroup = Math.ceil(Math.random() * 100)

      const model = await this.repository.save(plainToClass(FeatureEntity, {
        config: serialize(config),
        controlGroup,
      }));

      return classToClass(Feature, model)
    }

    return classToClass(Feature, entity);
  }

  async update(config: string): Promise<Feature> {
    await this.getOrCreate(config);

    const entity = await this.repository.update(
      {},
      plainToClass(FeatureEntity, { config: serialize(config) }),
    );

    return classToClass(Feature, entity);
  }
}
