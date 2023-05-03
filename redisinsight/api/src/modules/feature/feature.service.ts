import { Injectable } from '@nestjs/common';

@Injectable()
export class FeatureService {
  public async list() {
    return {
      features: {
        liveRecommendations: {
          flag: true,
          // variant?: string,
        },
      },
    };
  }
}
