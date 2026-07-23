// Plantillas de correo — HTML con estilos inline y layout de tablas
// (máxima compatibilidad con Gmail/Outlook, que ignoran <style> externos y CSS moderno)

const NEON = '#C1FF00'
const INK = '#0D0D0D'
const MUTED = '#666666'
const BORDER = '#E5E5E0'
const SURFACE = '#F5F5F1'

function wrapper(bodyHtml: string, previewText: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Paseito</title>
</head>
<body style="margin:0; padding:0; background-color:${SURFACE}; font-family:Helvetica, Arial, sans-serif;">
  <!-- Preview text (oculto, se ve en la bandeja de entrada) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${previewText}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${SURFACE}; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px; width:100%; background-color:#ffffff; border-radius:20px; border:1px solid ${BORDER}; overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="padding:32px 32px 0 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color:${NEON}; border-radius:12px; width:40px; height:40px; text-align:center; vertical-align:middle;">
                    <span style="font-size:20px; line-height:40px;">🐾</span>
                  </td>
                  <td style="padding-left:10px; font-size:20px; font-weight:700; color:${INK};">Paseito</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:24px 32px 32px 32px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px; background-color:${SURFACE}; border-top:1px solid ${BORDER};">
              <p style="margin:0; font-size:12px; color:${MUTED}; line-height:1.5;">
                Si no solicitaste esto, puedes ignorar este correo con tranquilidad.<br />
                © ${new Date().getFullYear()} Paseito
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function verificationEmailHtml({ name, url }: { name: string; url: string }) {
  const body = `
    <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:800; color:${INK};">Confirma tu correo</h1>
    <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#333333;">
      Hola ${name}, gracias por unirte a Paseito. Confirma tu correo para activar tu cuenta y poder publicar anuncios.
    </p>

    <table role="presentation" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background-color:${NEON}; border-radius:999px;">
          <a href="${url}" target="_blank" style="display:inline-block; padding:14px 28px; font-size:15px; font-weight:700; color:${INK}; text-decoration:none;">
            Confirmar correo
          </a>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0 0; font-size:13px; color:${MUTED}; line-height:1.5;">
      Si el botón no funciona, copia y pega este enlace en tu navegador:<br />
      <a href="${url}" style="color:#171717; word-break:break-all;">${url}</a>
    </p>
  `
  return wrapper(body, 'Confirma tu correo para activar tu cuenta en Paseito')
}

export function otpEmailHtml({ otp }: { otp: string }) {
  const body = `
    <h1 style="margin:0 0 12px 0; font-size:22px; font-weight:800; color:${INK};">Cambiar contraseña</h1>
    <p style="margin:0 0 24px 0; font-size:15px; line-height:1.6; color:#333333;">
      Usa este código para confirmar tu identidad y elegir una nueva contraseña. Vence en 5 minutos.
    </p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="background-color:${SURFACE}; border:1px solid ${BORDER}; border-radius:16px; padding:20px;">
          <span style="font-size:32px; font-weight:800; letter-spacing:10px; color:${INK}; font-family:'Courier New', monospace;">
            ${otp}
          </span>
        </td>
      </tr>
    </table>

    <p style="margin:24px 0 0 0; font-size:13px; color:${MUTED}; line-height:1.5;">
      Si no fuiste tú quien lo solicitó, ignora este correo — tu contraseña seguirá siendo la misma.
    </p>
  `
  return wrapper(body, `Tu código de verificación es ${otp}`)
}
