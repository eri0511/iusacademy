import { Module } from '@nestjs/common';

import { AuthModule } from '../auth/auth.module';

import { ArchivosModule } from '../archivos/archivos.module';

import { BibliotecaController } from './biblioteca.controller';

import { BibliotecaService } from './biblioteca.service';

import { BibliotecaGestionGuard } from './biblioteca-gestion.guard';
@Module({
  imports: [AuthModule, ArchivosModule],
  controllers: [BibliotecaController],
  providers: [BibliotecaService, BibliotecaGestionGuard],
})
export class BibliotecaModule {}
