<script setup lang="ts">
useHead({ title: 'Política de privacidad — Paseito' })

const providers = [
  { name: 'Neon', use: 'Base de datos donde se guardan cuentas y anuncios.' },
  { name: 'Cloudinary', use: 'Almacenamiento y entrega de fotos y panorámicas 360°.' },
  { name: 'Resend', use: 'Envío de correos (verificación de correo y códigos de seguridad).' },
  { name: 'Google', use: 'Inicio de sesión opcional con tu cuenta de Google.' },
  { name: 'OpenStreetMap / Overpass', use: 'Mapas y detección de lugares cercanos a partir de la ubicación del anuncio.' },
]
</script>

<template>
  <main class="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14 text-[15px] leading-relaxed">
    <NuxtLink to="/" class="text-sm underline">&larr; Volver a Paseito</NuxtLink>
    <p class="mt-6 mb-4 rounded-xl border border-amber-400 bg-amber-50 p-3 text-sm text-amber-900">
      Borrador — revisar con un abogado antes de su publicación definitiva.
    </p>
    <h1 class="text-3xl font-black tracking-tight mb-2" style="font-family: var(--font-heading);">Política de privacidad</h1>
    <p class="text-sm mb-8" style="color: var(--color-muted);">Última actualización: [FECHA]</p>

    <div class="flex flex-col gap-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
      <section>
        <h2>1. Quién es el responsable</h2>
        <p>[NOMBRE LEGAL] opera Paseito y es responsable del tratamiento de tus datos. Contacto: [CORREO DE CONTACTO].</p>
      </section>

      <section>
        <h2>2. Qué datos guardamos</h2>
        <ul>
          <li><strong>Cuenta:</strong> nombre, correo, foto de perfil, teléfono y redes sociales si los añades, y la fecha en que aceptaste estos términos. Con Google recibimos tu nombre, correo y foto.</li>
          <li><strong>Anuncios:</strong> descripción, precio, fotos, panorámicas, ubicación y los contactos que decidas mostrar públicamente.</li>
          <li><strong>Sesión:</strong> datos técnicos de la sesión (dirección IP y navegador) para mantenerla segura.</li>
          <li><strong>Reportes:</strong> el motivo y los detalles que envíes; si has iniciado sesión, quedan asociados a tu cuenta.</li>
          <li><strong>Estadísticas de uso de anuncios:</strong> eventos anónimos (ver el apartado 9) que no incluyen IP ni identificador de usuario.</li>
        </ul>
      </section>

      <section>
        <h2>3. Para qué los usamos</h2>
        <p>Para prestar el servicio, mostrar tus anuncios, verificar tu correo, moderar contenido y mantener la seguridad. No vendemos tus datos.</p>
      </section>

      <section>
        <h2>4. Qué es público</h2>
        <p>Tu nombre, la foto de perfil, los contactos que elijas mostrar en un anuncio y el contenido del anuncio son visibles para cualquiera. La ubicación se muestra solo como un área aproximada de unos 300 metros; la coordenada exacta no se publica.</p>
      </section>

      <section>
        <h2>5. Proveedores que tratan datos</h2>
        <ul>
          <li v-for="p in providers" :key="p.name"><strong>{{ p.name }}:</strong> {{ p.use }}</li>
        </ul>
        <p class="mt-2">Estos proveedores pueden procesar datos fuera de tu país conforme a sus propias políticas.</p>
      </section>

      <section>
        <h2>6. Cuánto tiempo los conservamos</h2>
        <p>Mientras tu cuenta esté activa. Al eliminar tu cuenta anonimizamos tus datos personales y tus anuncios dejan de mostrarse; podemos conservar registros mínimos de moderación y reportes por seguridad y obligaciones legales. Los eventos anónimos de estadísticas se conservan 13 meses.</p>
      </section>

      <section>
        <h2>7. Tus derechos</h2>
        <p>Puedes acceder, corregir y eliminar tus datos desde "Mi cuenta", o solicitarlo escribiendo a [CORREO DE CONTACTO].</p>
      </section>

      <section>
        <h2>8. Cookies</h2>
        <p>Usamos una cookie de sesión necesaria para mantenerte conectado.</p>
      </section>

      <section>
        <h2>9. Estadísticas de anuncios</h2>
        <p>Para que los vendedores sepan si su anuncio funciona medimos, sin herramientas externas ni cookies de seguimiento:</p>
        <ul class="mt-2">
          <li>vistas del anuncio, aperturas del tour 360° y tiempo que el visor está visible;</li>
          <li>clics en los enlaces de contacto, con el canal (WhatsApp, Instagram, Facebook, TikTok o sitio web).</li>
        </ul>
        <p class="mt-2">En la base de datos solo se guarda el anuncio, el tipo de evento, el valor (segundos o canal) y la fecha. <strong>No guardamos tu dirección IP ni tu usuario.</strong> Para no contar varias veces la misma visita calculamos, en memoria del servidor, una huella irreversible de tu IP mezclada con una sal que cambia cada día; esa huella no se almacena y no permite seguirte de un día a otro. No registramos tus propias visitas cuando has iniciado sesión. Respetamos las señales Do Not Track y Global Privacy Control: si están activas, no enviamos ningún evento. Los eventos se conservan 13 meses y luego se eliminan.</p>
      </section>

      <section>
        <h2>10. Cambios</h2>
        <p>Si cambiamos esta política lo avisaremos en la plataforma. Consulta también los <NuxtLink to="/terminos" class="underline">Términos y condiciones</NuxtLink>.</p>
      </section>
    </div>
  </main>
</template>
