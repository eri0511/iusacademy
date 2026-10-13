import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { HttpModule } from '@nestjs/axios';

import { AnalisisIaV2Controller } from './analisis-ia-v2.controller';

import { AnalisisIaV2Service } from './analisis-ia-v2.service';

@Module({
  imports: [ConfigModule, HttpModule],

  controllers: [AnalisisIaV2Controller],

  providers: [AnalisisIaV2Service],
})
export class AnalisisIaV2Module {}
