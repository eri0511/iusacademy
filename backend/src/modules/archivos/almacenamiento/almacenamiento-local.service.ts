import { Injectable } from '@nestjs/common';

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';

import { dirname, join, normalize, relative, sep } from 'node:path';

import { randomUUID } from 'node:crypto';

import {
  AlmacenamientoArchivos,
  ArchivoGuardado,
  ArchivoParaGuardar,
} from './almacenamiento.interface';

@Injectable()
export class AlmacenamientoLocalService implements AlmacenamientoArchivos {
  private readonly raiz = join(process.cwd(), 'uploads');

  async guardar(archivo: ArchivoParaGuardar): Promise<ArchivoGuardado> {
    const carpetaNormalizada = archivo.carpeta
      .replace(/\\/g, '/')
      .replace(/\.\./g, '')
      .replace(/^\/+/, '')
      .replace(/\/+/g, '/');

    const carpetaDestino = join(this.raiz, carpetaNormalizada);

    await mkdir(carpetaDestino, {
      recursive: true,
    });

    const nombreAlmacenado = `${Date.now()}-${randomUUID()}.${archivo.extension}`;

    const rutaAbsoluta = join(carpetaDestino, nombreAlmacenado);

    await writeFile(rutaAbsoluta, archivo.buffer);

    const rutaRelativa = relative(process.cwd(), rutaAbsoluta)
      .split(sep)
      .join('/');

    return {
      nombreAlmacenado,
      rutaAbsoluta,
      rutaRelativa,
      urlPublica: `/${rutaRelativa}`,
    };
  }

  async eliminar(rutaRelativa: string): Promise<void> {
    const rutaAbsoluta = normalize(join(process.cwd(), rutaRelativa));

    const relativaALaRaiz = relative(this.raiz, rutaAbsoluta);

    if (
      relativaALaRaiz.startsWith('..') ||
      relativaALaRaiz.includes(`..${sep}`)
    ) {
      return;
    }

    await rm(rutaAbsoluta, {
      force: true,
    });
  }

  async leer(rutaRelativa: string): Promise<Buffer> {
    const rutaAbsoluta = normalize(join(process.cwd(), rutaRelativa));

    const relativaALaRaiz = relative(this.raiz, rutaAbsoluta);

    if (
      relativaALaRaiz.startsWith('..') ||
      relativaALaRaiz.includes(`..${sep}`)
    ) {
      throw new Error('Ruta de archivo no permitida');
    }

    return readFile(rutaAbsoluta);
  }
}
