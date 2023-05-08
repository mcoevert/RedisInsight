import axios from 'axios';
import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import config from 'src/utils/config';
import * as remoteConfig from 'src/remote-config.json';
import ERROR_MESSAGES from 'src/constants/error-messages';
import { FeatureRepository } from 'src/modules/feature/repositories/feature.repository';
import { NotificationEvents } from '../notification/constants';

const REMOTE_CONFIG = config.get('remote_config');

@Injectable()
export class FeatureService {

  private readonly logger: Logger;

  private readonly url: string;

  constructor(
    private repository: FeatureRepository,
    private eventEmitter: EventEmitter2,
  ) {
    this.url = REMOTE_CONFIG.url;
    this.logger = new Logger('FeaturesService');

    this.init();
  }

  init() {
    this.updateLatestJson();
    setInterval(this.updateLatestJson.bind(this), 1_000 * 60 * 60 * 4); // once in 4 hours
  }

  /**
   * Get latest remote config json from github resource and save it in sqlite3 db
   */
  private async updateLatestJson() {
    try {
      this.logger.log('Trying to update remote config...');

      try {
        const { data } = await axios.get(this.url, {
          responseType: 'text',
          transformResponse: [(raw) => raw],
        });

        await this.repository.update(JSON.stringify(JSON.parse(data)));

        this.logger.log('Successfully updated stored remote config');

        this.eventEmitter.emit(NotificationEvents.UpdateFeatureList, JSON.parse(data));
      } catch (error) {
        this.logger.error('Unable to download remote config', error);

        await this.repository.getOrCreate(JSON.stringify(remoteConfig));

        this.logger.log('Successfully updated stored hardcoded remote config');
      }
    } catch (error) {
      this.logger.error('Unable to update stored remote config', error);
    }
  }

  /**
   * Get control group field
   */
  public async getControlGroup() {
    try {
      this.logger.log('Trying to get controlGroup field');

      const entity = await (this.repository.get());
      return entity.controlGroup;
    } catch (error) {
      this.logger.error('Unable to get controlGroup field', error);
      throw new NotFoundException(ERROR_MESSAGES.CONTROL_GROUP_NOT_EXIST);
    }
  }

  public async list() {
    try {
      this.logger.log('Trying to get feature list');

      const entity = await (this.repository.get());

      return entity.config;
    } catch (error) {
      this.logger.error('Unable to get feature list', error);
      throw new InternalServerErrorException();
    }
  }
}
