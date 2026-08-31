import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { HitosAcademicosController } from './hitos-academicos.controller';

import { HitosAcademicosService } from './hitos-academicos.service';

@Module({
  imports: [AuthModule],

  controllers: [HitosAcademicosController],

  providers: [HitosAcademicosService],

  exports: [HitosAcademicosService],
})
export class HitosAcademicosModule {}
