import { Module, Type } from '@nestjs/common';
import { FeatureController } from 'src/modules/feature/feature.controller';
import { FeatureService } from 'src/modules/feature/feature.service';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { FeatureRepository } from './repositories/feature.repository';
import { LocalFeatureRepository } from './repositories/local.feature.repository';

@Module({})
export class FeatureModule {
  static register(
    featureRepository: Type<FeatureRepository> = LocalFeatureRepository,
  ) {
    return {
      module: FeatureModule,
      controllers: [FeatureController],
      providers: [
        FeatureService,
        {
          provide: FeatureRepository,
          useClass: featureRepository,
        },
      ],
      exports: [
        FeatureService,
      ],
      imports: [
        NotificationModule,
      ],
    };
  }
}
