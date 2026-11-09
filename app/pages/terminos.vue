<script setup lang="ts">
useHead({ title: 'Términos y condiciones — Paseito' })
</script>

<template>
  <main class="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 text-[15px] leading-relaxed">
    <NuxtLink to="/" class="text-sm underline">&larr; Volver a Paseito</NuxtLink>
    <p class="mt-6 mb-4 rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
      Borrador — revisar con un abogado antes de su publicación definitiva.
    </p>
    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">Términos y condiciones</h1>
    <p class="text-sm mb-8" style="color: var(--color-muted);">Última actualización: [FECHA]</p>

    <div class="flex flex-col gap-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
      <section>
        <h2>1. Qué es Paseito</h2>
        <p>Paseito es una plataforma operada por [NOMBRE LEGAL] que permite publicar y consultar anuncios de inmuebles (apartamentos, casas y villas) con fotos y recorridos virtuales 360°. Paseito es un medio de publicación: no es parte de las negociaciones, ventas ni alquileres que se acuerden entre usuarios, ni garantiza su resultado.</p>
      </section>

      <section>
        <h2>2. Uso de la plataforma</h2>
        <ul>
          <li>Debes ser mayor de edad y proporcionar datos veraces al crear tu cuenta.</li>
          <li>Eres responsable de la seguridad de tu cuenta y de lo que se haga desde ella.</li>
          <li>No está permitido el uso fraudulento, el spam, la suplantación de identidad ni los intentos de vulnerar la seguridad del servicio.</li>
          <li>Podemos suspender cuentas o pausar anuncios que incumplan estos términos o la ley.</li>
        </ul>
      </section>

      <section>
        <h2>3. Contenido de los anuncios</h2>
        <p>Quien publica es el único responsable de que sus anuncios sean veraces, estén actualizados y no infrinjan derechos de terceros (fotos, marcas, propiedad). Al publicar, nos concedes una licencia no exclusiva para mostrar ese contenido dentro de Paseito. Los anuncios pueden ser reportados por cualquier visitante; el equipo de moderación puede pausarlos o eliminarlos, indicando el motivo al dueño.</p>
      </section>

      <section>
        <h2>4. Contacto público del vendedor</h2>
        <p>Para publicar un anuncio debes autorizar expresamente que los medios de contacto que elijas (por ejemplo WhatsApp, redes sociales o sitio web) sean visibles públicamente en ese anuncio. Puedes retirar el anuncio en cualquier momento desde tu cuenta.</p>
      </section>

      <section>
        <h2>5. Ubicación aproximada</h2>
        <p>La ubicación de un anuncio se muestra al público como un área aproximada de unos 300 metros, no como la dirección exacta. Los lugares cercanos mostrados provienen de datos de OpenStreetMap y pueden contener errores.</p>
      </section>

      <section>
        <h2>6. Cuentas, suspensión y borrado</h2>
        <p>Puedes eliminar tu cuenta cuando quieras desde "Mi cuenta"; tus datos personales se anonimizan y tus anuncios dejan de mostrarse. Podemos suspender una cuenta ante incumplimientos; mientras esté suspendida no podrá iniciar sesión.</p>
      </section>

      <section>
        <h2>7. Limitación de responsabilidad</h2>
        <p>El servicio se ofrece "tal cual". En la medida permitida por la ley, [NOMBRE LEGAL] no responde por la exactitud de los anuncios, por transacciones entre usuarios ni por interrupciones del servicio.</p>
      </section>

      <section>
        <h2>8. Cambios</h2>
        <p>Podemos actualizar estos términos; los cambios relevantes se avisarán en la plataforma. Seguir usando Paseito tras el aviso implica aceptarlos.</p>
      </section>

      <section>
        <h2>9. Contacto</h2>
        <p>Para dudas o reclamaciones: [CORREO DE CONTACTO]. Consulta también nuestra <NuxtLink to="/privacidad" class="underline">Política de privacidad</NuxtLink>.</p>
      </section>
    </div>
  </main>
</template>
