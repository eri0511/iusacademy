import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  execFile,
} from 'node:child_process';

import {
  mkdtemp,
  readFile,
  rm,
  writeFile,
} from 'node:fs/promises';

import {
  tmpdir,
} from 'node:os';

import {
  join,
} from 'node:path';

import {
  promisify,
} from 'node:util';

import {
  createWorker,
} from 'tesseract.js';

export type CallbackProgresoPdf = (
  progreso:
    number,
) => void |
  Promise<void>;

const execFileAsync =
  promisify(
    execFile,
  );

@Injectable()
export class OcrPdfService {
  private readonly logger =
    new Logger(
      OcrPdfService.name,
    );

  private readonly pdfInfoPath =
    process.env.POPPLER_PDFINFO_PATH?.trim() ||
    'pdfinfo';

  private readonly pdfToPpmPath =
    process.env.POPPLER_PDFTOPPM_PATH?.trim() ||
    'pdftoppm';

  private limpiarTexto(
    texto:
      string,
  ): string {
    return texto
      .replace(
        /\u0000/g,
        '',
      )
      .replace(
        /\r\n/g,
        '\n',
      )
      .replace(
        /\r/g,
        '\n',
      )
      .replace(
        /[ \t]+/g,
        ' ',
      )
      .replace(
        / *\n */g,
        '\n',
      )
      .replace(
        /\n{3,}/g,
        '\n\n',
      )
      .trim();
  }

  private convertirError(
    error:
      unknown,
  ): Error {
    if (
      error instanceof Error
    ) {
      const codigo =
        (
          error as Error & {
            code?: string;
          }
        ).code;

      if (
        codigo ===
        'ENOENT'
      ) {
        return new Error(
          [
            'No se encontró Poppler en el sistema.',
            'Verifica que pdfinfo y pdftoppm estén disponibles en PATH',
            'o configura POPPLER_PDFINFO_PATH y POPPLER_PDFTOPPM_PATH.',
          ].join(
            ' ',
          ),
        );
      }

      return error;
    }

    return new Error(
      String(
        error,
      ),
    );
  }

  private async obtenerNumeroPaginas(
    rutaPdf:
      string,
  ): Promise<number> {
    try {
      const {
        stdout,
      } =
        await execFileAsync(
          this.pdfInfoPath,
          [
            rutaPdf,
          ],
          {
            windowsHide:
              true,

            timeout:
              60_000,

            maxBuffer:
              5 *
              1024 *
              1024,
          },
        );

      const coincidencia =
        stdout.match(
          /^Pages:\s+(\d+)/im,
        );

      if (
        !coincidencia
      ) {
        throw new Error(
          'Poppler no devolvió la cantidad de páginas del PDF.',
        );
      }

      const paginas =
        Number(
          coincidencia[
            1
          ],
        );

      if (
        !Number.isInteger(
          paginas,
        ) ||
        paginas <=
          0
      ) {
        throw new Error(
          'La cantidad de páginas obtenida del PDF no es válida.',
        );
      }

      return paginas;
    } catch (
      error
    ) {
      throw this.convertirError(
        error,
      );
    }
  }

  private async rasterizarPagina(
    rutaPdf:
      string,

    directorio:
      string,

    pagina:
      number,
  ): Promise<Buffer> {
    const prefijo =
      join(
        directorio,
        `pagina-${String(
          pagina,
        ).padStart(
          4,
          '0',
        )}`,
      );

    const rutaPng =
      `${prefijo}.png`;

    try {
      await execFileAsync(
        this.pdfToPpmPath,
        [
          '-f',
          String(
            pagina,
          ),

          '-l',
          String(
            pagina,
          ),

          '-singlefile',

          '-png',

          '-gray',

          '-r',
          '200',

          rutaPdf,
          prefijo,
        ],
        {
          windowsHide:
            true,

          timeout:
            120_000,

          maxBuffer:
            10 *
            1024 *
            1024,
        },
      );

      return await readFile(
        rutaPng,
      );
    } catch (
      error
    ) {
      throw this.convertirError(
        error,
      );
    }
  }

  async extraerTexto(
    buffer:
      Buffer,

    onProgreso?:
      CallbackProgresoPdf,
  ): Promise<string | null> {
    if (
      !buffer ||
      buffer.length ===
        0
    ) {
      return null;
    }

    const directorio =
      await mkdtemp(
        join(
          tmpdir(),
          'iusacademy-ocr-',
        ),
      );

    const rutaPdf =
      join(
        directorio,
        'documento.pdf',
      );

    let worker:
      Awaited<
        ReturnType<
          typeof createWorker
        >
      > |
      null =
      null;

    try {
      await onProgreso?.(
        30,
      );

      await writeFile(
        rutaPdf,
        buffer,
      );

      const totalPaginas =
        await this.obtenerNumeroPaginas(
          rutaPdf,
        );

      this.logger.log(
        `OCR con Poppler iniciado para PDF de ${totalPaginas} página(s).`,
      );

      await onProgreso?.(
        32,
      );

      worker =
        await createWorker(
          'spa',
          1,
      );

      const paginasTexto:
        string[] =
        [];

      for (
        let pagina =
          1;
        pagina <=
        totalPaginas;
        pagina +=
          1
      ) {
        this.logger.log(
          `Rasterizando y procesando OCR página ${pagina} de ${totalPaginas}.`,
        );

        try {
          const imagen =
            await this.rasterizarPagina(
              rutaPdf,
              directorio,
              pagina,
            );

          const resultado =
            await worker.recognize(
              imagen,
            );

          const textoPagina =
            this.limpiarTexto(
              resultado.data.text ??
                '',
            );

          if (
            textoPagina
          ) {
            paginasTexto.push(
              [
                `--- Página ${pagina} ---`,
                textoPagina,
              ].join(
                '\n',
              ),
            );
          } else {
            this.logger.warn(
              `La página ${pagina} no produjo texto OCR utilizable.`,
            );
          }
        } catch (
          error
        ) {
          const mensaje =
            error instanceof Error
              ? error.message
              : String(
                  error,
                );

          this.logger.warn(
            `No fue posible procesar la página ${pagina}: ${mensaje}`,
          );
        }

        const progreso =
          32 +
          Math.round(
            (
              pagina /
              totalPaginas
            ) *
              58,
          );

        await onProgreso?.(
          Math.min(
            90,
            progreso,
          ),
        );
      }

      const texto =
        this.limpiarTexto(
          paginasTexto.join(
            '\n\n',
          ),
        );

      if (
        texto.length <
        10
      ) {
        this.logger.warn(
          'El OCR con Poppler terminó, pero no pudo obtener texto utilizable.',
        );

        return null;
      }

      this.logger.log(
        [
          'OCR con Poppler finalizado.',
          `Páginas con texto: ${paginasTexto.length}/${totalPaginas}.`,
          `Caracteres extraídos: ${texto.length}.`,
        ].join(
          ' ',
        ),
      );

      await onProgreso?.(
        92,
      );

      return texto;
    } finally {
      if (
        worker
      ) {
        try {
          await worker.terminate();
        } catch (
          error
        ) {
          const mensaje =
            error instanceof Error
              ? error.message
              : String(
                  error,
                );

          this.logger.warn(
            `No fue posible cerrar limpiamente Tesseract: ${mensaje}`,
          );
        }
      }

      try {
        await rm(
          directorio,
          {
            recursive:
              true,

            force:
              true,
          },
        );
      } catch (
        error
      ) {
        const mensaje =
          error instanceof Error
            ? error.message
            : String(
                error,
              );

        this.logger.warn(
          `No fue posible limpiar el directorio temporal del OCR: ${mensaje}`,
        );
      }
    }
  }
}
