import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiModule } from './api/api.module';
import Configuration from './configs/global.configs';
import {DataSourceOptions} from "typeorm";
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
  ConfigModule.forRoot({
    isGlobal: true,
    load: [Configuration],
  }),
  TypeOrmModule.forRootAsync({
    imports: [ConfigModule],
    useFactory: (configService: ConfigService) => {
      return configService.get<DataSourceOptions>('database');
    },
    inject: [ConfigService],
  }),
    ApiModule,
  ],
})
export class AppModule {}
