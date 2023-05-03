import { Module } from '@nestjs/common';
import { FeatureController } from 'src/modules/feature/feature.controller';
import { FeatureService } from 'src/modules/feature/feature.service';

@Module({})
export class FeatureModule {
  static register() {
    return {
      module: FeatureModule,
      controllers: [FeatureController],
      providers: [FeatureService],
    };
  }
}
