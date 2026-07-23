// Envío de correo transaccional vía Resend (API REST directa, sin SDK)
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY no configurada, correo no enviado:', subject)
    return
  }

  // ponytail: sin dominio propio verificado en Resend todavía — en producción
  // usar noreply@paseito.com una vez verificado; en dev, el remitente sandbox
  // de Resend (solo entrega a la casilla dueña de la cuenta de Resend).
  const from = process.env.RESEND_FROM_EMAIL || (
    process.env.NODE_ENV === 'production'
      ? 'Paseito <noreply@paseito.com>'
      : 'Paseito <onboarding@resend.dev>'
  )

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    console.error('[email] Error enviando con Resend:', res.status, await res.text())
  }
}
