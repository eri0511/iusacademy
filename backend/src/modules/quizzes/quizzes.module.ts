import { Module } from '@nestjs/common';

import { ArchivosModule } from '../archivos/archivos.module';

import { QuizzesController } from './quizzes.controller';

import { QuizzesService } from './quizzes.service';

import { QuizDatasetService } from './quiz-dataset.service';

import { QuizGeneradorService } from './quiz-generador.service';

@Module({
  imports: [ArchivosModule],

  controllers: [QuizzesController],

  providers: [QuizzesService, QuizDatasetService, QuizGeneradorService],

  exports: [QuizzesService, QuizDatasetService, QuizGeneradorService],
})
export class QuizzesModule {}
