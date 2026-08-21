const HEX_CORTO = /^#?([\da-f])([\da-f])([\da-f])$/i;
const HEX_LARGO = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;

export interface ColorRgb {
  r: number;
  g: number;
  b: number;
}

export function normalizarColorHex(color: string): string {
  const valor = color.trim();
  const corto = HEX_CORTO.exec(valor);

  if (corto) {
    return `#${corto[1]}${corto[1]}${corto[2]}${corto[2]}${corto[3]}${corto[3]}`
      .toUpperCase();
  }

  const largo = HEX_LARGO.exec(valor);

  if (!largo) {
    throw new TypeError(`Color hexadecimal inválido: ${color}`);
  }

  return `#${largo[1]}${largo[2]}${largo[3]}`.toUpperCase();
}

export function convertirHexARgb(color: string): ColorRgb {
  const hex = normalizarColorHex(color).slice(1);

  return {
    r: Number.parseInt(hex.slice(0, 2), 16),
    g: Number.parseInt(hex.slice(2, 4), 16),
    b: Number.parseInt(hex.slice(4, 6), 16),
  };
}

export function convertirHexAArgb(color: string, alfa = 'FF'): string {
  const alfaNormalizado = alfa.trim().toUpperCase();

  if (!/^[\dA-F]{2}$/.test(alfaNormalizado)) {
    throw new TypeError('El canal alfa debe tener dos caracteres hexadecimales');
  }

  return `${alfaNormalizado}${normalizarColorHex(color).slice(1)}`;
}

export function colorTextoContraste(colorFondo: string): '#000000' | '#FFFFFF' {
  const { r, g, b } = convertirHexARgb(colorFondo);
  const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminancia > 0.58 ? '#000000' : '#FFFFFF';
}
