import {
  Column, Entity, PrimaryColumn,
} from 'typeorm';
import { Expose } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';
import { DataAsJsonString } from 'src/common/decorators';

@Entity('features')
export class FeatureEntity {
  @Column({ nullable: true })
  @Expose()
  @IsInt()
  @Min(1)
  @Max(100)
  @PrimaryColumn()
  controlGroup: number;

  @Column({ nullable: false })
  @Expose()
  @DataAsJsonString()
  config: string;

  constructor(entity: Partial<FeatureEntity>) {
    Object.assign(this, entity);
  }
}
