import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ArchivosModule } from '../archivos/archivos.module';
import { RecursosController } from './recursos.controller';
import { RecursosService } from './recursos.service';

@Module({
  imports: [AuthModule, ArchivosModule],
  controllers: [RecursosController],
  providers: [RecursosService],
  exports: [RecursosService],
})
export class RecursosModule {}
