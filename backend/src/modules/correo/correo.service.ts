import {
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import * as nodemailer from 'nodemailer';

@Injectable()
export class CorreoService {
  constructor(
    private readonly configService: ConfigService,
  ) {}

  private crearTransportador() {
    const correo =
      this.configService.get<string>('MAIL_USER');

    const passwordAplicacion =
      this.configService.get<string>(
        'MAIL_APP_PASSWORD',
      );

    if (!correo || !passwordAplicacion) {
      throw new InternalServerErrorException(
        'El servicio de correo no está configurado',
      );
    }

    return nodemailer.createTransport({
      service: 'gmail',

      auth: {
        user: correo,
        pass: passwordAplicacion,
      },
    });
  }

  async enviarEnlaceActivacion(datos: {
  destinatario: string;
  nombre: string;
  enlaceActivacion: string;
  fechaExpiracion: Date;
}) {
  const correoRemitente =
    this.configService.get<string>('MAIL_USER');

  const fechaFormateada =
    datos.fechaExpiracion.toLocaleString(
      'es-BO',
      {
        dateStyle: 'long',
        timeStyle: 'short',
        timeZone: 'America/La_Paz',
      },
    );

  const transportador =
    this.crearTransportador();

  const resultado =
    await transportador.sendMail({
      from:
        `"IusAcademy" <${correoRemitente}>`,

      to: datos.destinatario,

      subject:
        'Activa tu cuenta de IusAcademy',

      text: `
Hola ${datos.nombre}:

Se creó una cuenta de IusAcademy asociada a este correo institucional.

Activa tu cuenta y crea tu contraseña ingresando al siguiente enlace:

${datos.enlaceActivacion}

El enlace vencerá el ${fechaFormateada}.

Si no solicitaste esta cuenta, comunícate con el administrador de IusAcademy.
      `.trim(),

      html: `
        <div
          style="
            margin: 0;
            padding: 36px 18px;
            background: #fbf3e8;
            font-family: Arial, sans-serif;
          "
        >
          <div
            style="
              max-width: 600px;
              margin: 0 auto;
              overflow: hidden;
              background: #fffdf9;
              border: 1px solid rgba(241,139,75,.25);
              border-radius: 24px;
              box-shadow: 0 20px 50px rgba(148,81,22,.12);
            "
          >
            <div
              style="
                padding: 28px 32px;
                background: linear-gradient(135deg,#fff7ec,#ffe3c2);
              "
            >
              <p
                style="
                  margin: 0 0 7px;
                  color: #c46a2c;
                  font-size: 12px;
                  font-weight: bold;
                  letter-spacing: 2px;
                "
              >
                IUSACADEMY
              </p>

              <h1
                style="
                  margin: 0;
                  color: #0f172a;
                  font-size: 28px;
                "
              >
                Activa tu cuenta
              </h1>
            </div>

            <div style="padding: 30px 32px;">
              <p
                style="
                  color: #6b6b6b;
                  line-height: 1.7;
                "
              >
                Hola <strong>${datos.nombre}</strong>,
                se creó una cuenta institucional de IusAcademy
                asociada a este correo.
              </p>

              <p
                style="
                  color: #6b6b6b;
                  line-height: 1.7;
                "
              >
                Para activarla y crear tu contraseña definitiva,
                presiona el siguiente botón:
              </p>

              <div
                style="
                  margin: 30px 0;
                  text-align: center;
                "
              >
                <a
                  href="${datos.enlaceActivacion}"
                  style="
                    display: inline-block;
                    padding: 14px 30px;
                    border-radius: 999px;
                    background: linear-gradient(135deg,#f18b4b,#f39a5c);
                    color: #ffffff;
                    font-weight: bold;
                    text-decoration: none;
                  "
                >
                  Activar mi cuenta
                </a>
              </div>

              <div
                style="
                  padding: 16px;
                  background: #fff8ef;
                  border: 1px solid #f1c79f;
                  border-radius: 14px;
                "
              >
                <p
                  style="
                    margin: 0;
                    color: #6b6b6b;
                    font-size: 13px;
                    line-height: 1.6;
                  "
                >
                  Este enlace vencerá el
                  <strong>${fechaFormateada}</strong>.
                  Después de activarlo ya no podrá utilizarse nuevamente.
                </p>
              </div>

              <p
                style="
                  margin-top: 24px;
                  color: #6b6b6b;
                  font-size: 13px;
                  line-height: 1.6;
                "
              >
                Si el botón no funciona, copia y pega este enlace:
              </p>

              <p
                style="
                  word-break: break-all;
                  color: #c46a2c;
                  font-size: 12px;
                "
              >
                ${datos.enlaceActivacion}
              </p>

              <p
                style="
                  margin-top: 26px;
                  color: #9ca3af;
                  font-size: 12px;
                "
              >
                Recibes este mensaje porque el administrador de
                IusAcademy creó una cuenta asociada a tu correo.
              </p>
            </div>
          </div>
        </div>
      `,
    });

  console.log('Resultado del correo de activación:', {
    messageId: resultado.messageId,
    accepted: resultado.accepted,
    rejected: resultado.rejected,
    response: resultado.response,
  });

  return resultado;
}

}