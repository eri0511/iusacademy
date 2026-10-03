import { Injectable } from '@nestjs/common';

type TipoTareaAnalizable =
  | 'ENTREGA_ARCHIVOS'
  | 'RESPUESTA_ESCRITA'
  | 'DOCUMENTO_COLABORATIVO'
  | 'REDACCION_JURIDICA'
  | 'EXPOSICION'
  | 'CASO_PRACTICO'
  | 'MIXTA'
  | 'PRESENCIAL';

type ContenidoRespuestaEscrita = {
  formato?: unknown;
  secciones?: unknown;
  citas?: unknown;
};

type SeccionRedaccionJuridica = {
  titulo?: unknown;
  contenido?: unknown;
};

type ContenidoRedaccionJuridica = {
  formato?: unknown;
  tipoPieza?: unknown;
  tituloDocumento?: unknown;
  secciones?: unknown;
  citas?: unknown;
};

type BloqueDocumentoColaborativo = {
  titulo?: unknown;
  contenido?: unknown;
  autorId?: unknown;
  autorNombre?: unknown;
};

type ContenidoDocumentoColaborativo = {
  formato?: unknown;
  tituloDocumento?: unknown;
  tipoPieza?: unknown;
  bloques?: unknown;
  citas?: unknown;
};

type RespuestaCasoPractico = {
  preguntaId?: unknown;
  titulo?: unknown;
  pregunta?: unknown;
  respuesta?: unknown;
};

type ContenidoCasoPractico = {
  formato?: unknown;
  tituloCaso?: unknown;
  respuestas?: unknown;
  conclusion?: unknown;
  citas?: unknown;
};

type ComponenteTareaAnalizable = {
  id: number;
  tipo: string;
  titulo: string;
};

type ContenidoMixto = {
  formato?: unknown;
  componentes?: unknown;
};

type CompilarEntregaParametros = {
  tipo: TipoTareaAnalizable;
  contenido: string | null;
  componentes?: ComponenteTareaAnalizable[];
};

@Injectable()
export class AdaptadorContenidoEntregaService {
  compilarEntrega(
    parametros: CompilarEntregaParametros,
  ): string | null {
    const contenido = parametros.contenido?.trim() ?? '';

    if (!contenido) {
      return null;
    }

    switch (parametros.tipo) {
      case 'RESPUESTA_ESCRITA':
        return (
          this.compilarRespuestaEscrita(contenido) ??
          contenido
        );

      case 'REDACCION_JURIDICA':
        return (
          this.compilarRedaccionJuridica(contenido) ??
          contenido
        );

      case 'DOCUMENTO_COLABORATIVO':
        return (
          this.compilarDocumentoColaborativo(contenido) ??
          contenido
        );

      case 'CASO_PRACTICO':
        return (
          this.compilarCasoPractico(contenido) ??
          contenido
        );

      case 'MIXTA':
        return (
          this.compilarMixta(
            contenido,
            parametros.componentes ?? [],
          ) ??
          contenido
        );

      case 'ENTREGA_ARCHIVOS':
      case 'EXPOSICION':
      case 'PRESENCIAL':
        return null;

      default:
        return contenido;
    }
  }

  compilarRespuestaEscrita(
    contenido: string,
  ): string | null {
    const estado = this.parsearJson(contenido);

    if (!estado) {
      return null;
    }

    const respuesta =
      estado as ContenidoRespuestaEscrita;

    if (
      respuesta.formato !== 'RESPUESTA_ESCRITA' ||
      !respuesta.secciones ||
      typeof respuesta.secciones !== 'object' ||
      Array.isArray(respuesta.secciones)
    ) {
      return null;
    }

    const secciones =
      respuesta.secciones as Record<string, unknown>;

    const partes: string[] = [];

    this.agregarSeccion(
      partes,
      'RELACIÓN JURÍDICA',
      secciones['relacionJuridica'],
    );

    this.agregarSeccion(
      partes,
      'NORMAS APLICABLES',
      secciones['normas'],
    );

    this.agregarSeccion(
      partes,
      'ARGUMENTACIÓN',
      secciones['argumentacion'],
    );

    this.agregarSeccion(
      partes,
      'CONCLUSIÓN',
      secciones['conclusion'],
    );

    return partes.length > 0
      ? partes.join('\n\n')
      : null;
  }

  compilarRedaccionJuridica(
    contenido: string,
  ): string | null {
    const estado = this.parsearJson(contenido);

    if (!estado) {
      return null;
    }

    const redaccion =
      estado as ContenidoRedaccionJuridica;

    if (
      redaccion.formato !== 'REDACCION_JURIDICA' ||
      !Array.isArray(redaccion.secciones)
    ) {
      return null;
    }

    const partes: string[] = [];

    if (
      typeof redaccion.tipoPieza === 'string' &&
      redaccion.tipoPieza.trim()
    ) {
      partes.push(
        `TIPO DE DOCUMENTO\n${redaccion.tipoPieza.trim()}`,
      );
    }

    if (
      typeof redaccion.tituloDocumento === 'string' &&
      redaccion.tituloDocumento.trim()
    ) {
      partes.push(
        `TÍTULO DEL DOCUMENTO\n${redaccion.tituloDocumento.trim()}`,
      );
    }

    for (const item of redaccion.secciones) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item)
      ) {
        continue;
      }

      const seccion =
        item as SeccionRedaccionJuridica;

      const titulo =
        typeof seccion.titulo === 'string'
          ? seccion.titulo.trim()
          : '';

      const texto =
        typeof seccion.contenido === 'string'
          ? seccion.contenido.trim()
          : '';

      if (!texto) {
        continue;
      }

      partes.push(
        titulo
          ? `${titulo.toUpperCase()}\n${texto}`
          : texto,
      );
    }

    return partes.length > 0
      ? partes.join('\n\n')
      : null;
  }

  compilarDocumentoColaborativo(
    contenido: string,
  ): string | null {
    const estado = this.parsearJson(contenido);

    if (!estado) {
      return null;
    }

    const documento =
      estado as ContenidoDocumentoColaborativo;

    if (
      documento.formato !== 'DOCUMENTO_COLABORATIVO' ||
      !Array.isArray(documento.bloques)
    ) {
      return null;
    }

    const partes: string[] = [];

    if (
      typeof documento.tipoPieza === 'string' &&
      documento.tipoPieza.trim()
    ) {
      partes.push(
        `TIPO DE DOCUMENTO\n${documento.tipoPieza.trim()}`,
      );
    }

    if (
      typeof documento.tituloDocumento === 'string' &&
      documento.tituloDocumento.trim()
    ) {
      partes.push(
        `TÍTULO DEL DOCUMENTO\n${documento.tituloDocumento.trim()}`,
      );
    }

    for (const item of documento.bloques) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item)
      ) {
        continue;
      }

      const bloque =
        item as BloqueDocumentoColaborativo;

      const titulo =
        typeof bloque.titulo === 'string'
          ? bloque.titulo.trim()
          : '';

      const texto =
        typeof bloque.contenido === 'string'
          ? bloque.contenido.trim()
          : '';

      if (!texto) {
        continue;
      }

      let encabezado = titulo
        ? titulo.toUpperCase()
        : 'BLOQUE';

      const autor =
        typeof bloque.autorNombre === 'string'
          ? bloque.autorNombre.trim()
          : '';

      if (autor) {
        encabezado += `\nAUTOR: ${autor}`;
      }

      partes.push(
        `${encabezado}\n${texto}`,
      );
    }

    return partes.length > 0
      ? partes.join('\n\n')
      : null;
  }

  compilarCasoPractico(
    contenido: string,
  ): string | null {
    const estado = this.parsearJson(contenido);

    if (!estado) {
      return null;
    }

    const caso =
      estado as ContenidoCasoPractico;

    if (
      caso.formato !== 'CASO_PRACTICO' ||
      !Array.isArray(caso.respuestas)
    ) {
      return null;
    }

    const partes: string[] = [];

    if (
      typeof caso.tituloCaso === 'string' &&
      caso.tituloCaso.trim()
    ) {
      partes.push(
        `CASO PRÁCTICO\n${caso.tituloCaso.trim()}`,
      );
    }

    let numero = 1;

    for (const item of caso.respuestas) {
      if (
        !item ||
        typeof item !== 'object' ||
        Array.isArray(item)
      ) {
        continue;
      }

      const respuesta =
        item as RespuestaCasoPractico;

      const titulo =
        typeof respuesta.titulo === 'string'
          ? respuesta.titulo.trim()
          : '';

      const pregunta =
        typeof respuesta.pregunta === 'string'
          ? respuesta.pregunta.trim()
          : '';

      const texto =
        typeof respuesta.respuesta === 'string'
          ? respuesta.respuesta.trim()
          : '';

      if (!texto) {
        continue;
      }

      const encabezado =
        titulo ||
        pregunta ||
        `RESPUESTA ${numero}`;

      partes.push(
        `${encabezado.toUpperCase()}\n${texto}`,
      );

      numero += 1;
    }

    this.agregarSeccion(
      partes,
      'CONCLUSIÓN',
      caso.conclusion,
    );

    return partes.length > 0
      ? partes.join('\n\n')
      : null;
  }

  compilarMixta(
    contenido: string,
    componentes: ComponenteTareaAnalizable[],
  ): string | null {
    const estado = this.parsearJson(contenido);

    if (!estado) {
      return null;
    }

    const mixta =
      estado as ContenidoMixto;

    if (
      mixta.formato !== 'MIXTA' ||
      !mixta.componentes ||
      typeof mixta.componentes !== 'object' ||
      Array.isArray(mixta.componentes)
    ) {
      return null;
    }

    const mapa =
      mixta.componentes as Record<string, unknown>;

    const partes: string[] = [];

    for (const componente of componentes) {
      if (
        componente.tipo === 'ARCHIVOS' ||
        componente.tipo === 'PRESENCIAL'
      ) {
        continue;
      }

      const valor =
        mapa[String(componente.id)];

      if (typeof valor !== 'string') {
        continue;
      }

      const contenidoComponente =
        valor.trim();

      if (!contenidoComponente) {
        continue;
      }

      const compilado =
        this.compilarContenidoComponenteMixto(
          componente.tipo,
          contenidoComponente,
        );

      if (!compilado) {
        continue;
      }

      partes.push(
        [
          `COMPONENTE: ${componente.titulo}`,
          `TIPO: ${componente.tipo}`,
          compilado,
        ].join('\n'),
      );
    }

    return partes.length > 0
      ? partes.join('\n\n')
      : null;
  }

  private compilarContenidoComponenteMixto(
    tipo: string,
    contenido: string,
  ): string | null {
    if (!contenido.trim()) {
      return null;
    }

    if (tipo === 'REDACCION_JURIDICA') {
      return (
        this.compilarRedaccionJuridica(contenido) ??
        contenido.trim()
      );
    }

    if (tipo === 'DOCUMENTO_COLABORATIVO') {
      return (
        this.compilarDocumentoColaborativo(contenido) ??
        contenido.trim()
      );
    }

    if (tipo === 'CASO_PRACTICO') {
      return (
        this.compilarCasoPractico(contenido) ??
        contenido.trim()
      );
    }

    if (tipo === 'TEXTO') {
      return (
        this.compilarRespuestaEscrita(contenido) ??
        contenido.trim()
      );
    }

    return contenido.trim();
  }

  private parsearJson(
    contenido: string,
  ): Record<string, unknown> | null {
    if (!contenido?.trim()) {
      return null;
    }

    try {
      const valor =
        JSON.parse(contenido) as unknown;

      if (
        !valor ||
        typeof valor !== 'object' ||
        Array.isArray(valor)
      ) {
        return null;
      }

      return valor as Record<string, unknown>;
    } catch {
      return null;
    }
  }

  private agregarSeccion(
    partes: string[],
    titulo: string,
    contenido: unknown,
  ) {
    if (typeof contenido !== 'string') {
      return;
    }

    const texto =
      contenido.trim();

    if (!texto) {
      return;
    }

    partes.push(
      `${titulo}\n${texto}`,
    );
  }
}