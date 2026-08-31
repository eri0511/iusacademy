import { Injectable, Logger } from '@nestjs/common';

import pdfParse from 'pdf-parse';

import { OcrPdfService, type CallbackProgresoPdf } from './ocr-pdf.service';

@Injectable()
export class ProcesadorPdfService {
  private readonly logger = new Logger(ProcesadorPdfService.name);

  constructor(private readonly ocrPdfService: OcrPdfService) {}

  private limpiarTexto(texto: string): string {
    return texto
      .replace(/\u0000/g, '')
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/ *\n */g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  private async intentarTextoDigital(
    buffer: Buffer,

    onProgreso?: CallbackProgresoPdf,
  ): Promise<string | null> {
    try {
      await onProgreso?.(15);

      const resultado = await pdfParse(buffer, {
        max: 0,
      });

      await onProgreso?.(26);

      const texto = this.limpiarTexto(resultado.text ?? '');

      this.logger.log(
        [
          'Extracción digital terminada.',
          `Páginas: ${resultado.numpages ?? 0}.`,
          `Caracteres: ${texto.length}.`,
        ].join(' '),
      );

      if (texto.length < 10) {
        return null;
      }

      await onProgreso?.(90);

      return texto;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);

      this.logger.warn(`La extracción digital falló: ${mensaje}`);

      return null;
    }
  }

  async extraerTexto(
    buffer: Buffer,

    onProgreso?: CallbackProgresoPdf,
  ): Promise<string | null> {
    if (!buffer || buffer.length === 0) {
      this.logger.warn('No se recibió contenido para procesar el PDF.');

      return null;
    }

    await onProgreso?.(8);

    this.logger.log(`Procesando PDF de ${buffer.length} bytes.`);

    const textoDigital = await this.intentarTextoDigital(buffer, onProgreso);

    if (textoDigital) {
      this.logger.log('El PDF contiene una capa de texto. No se necesita OCR.');

      return textoDigital;
    }

    this.logger.warn(
      'No se encontró una capa de texto utilizable. Se iniciará OCR automáticamente.',
    );

    await onProgreso?.(28);

    try {
      const textoOcr = await this.ocrPdfService.extraerTexto(
        buffer,
        onProgreso,
      );

      if (!textoOcr) {
        this.logger.warn('No fue posible obtener texto mediante OCR.');

        return null;
      }

      return textoOcr;
    } catch (error) {
      const mensaje = error instanceof Error ? error.message : String(error);

      const stack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`El OCR del PDF falló: ${mensaje}`, stack);

      return null;
    }
  }
}
