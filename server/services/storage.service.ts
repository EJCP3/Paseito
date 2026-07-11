// Service — Storage (Cloudflare R2 / S3)
// Abstracción sobre el proveedor de almacenamiento
// TODO: Conectar con R2 real cuando se tengan las credenciales

/**
 * Genera una URL firmada para subida directa a R2/S3
 * En producción: usa AWS SDK con credenciales de R2
 * Por ahora: devuelve una URL de placeholder
 */
export async function generateUploadUrl(params: {
  fileName: string
  contentType: string
  listingId: string
}): Promise<{ uploadUrl: string; publicUrl: string }> {
  const config = useRuntimeConfig()

  // Si no hay credenciales de R2, devolver URL de placeholder
  if (!config.r2AccountId || !config.r2AccessKeyId) {
    console.warn('[Storage] R2 no configurado — usando URLs de placeholder')
    const publicUrl = `/panoramas/${params.listingId}/${params.fileName}`
    return {
      uploadUrl: '', // No hay URL de subida real
      publicUrl,
    }
  }

  // TODO: Implementar generación de presigned URL con @aws-sdk/s3-request-presigner
  // cuando se configuren las credenciales de R2:
  //
  // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
  // import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
  //
  // const client = new S3Client({
  //   region: 'auto',
  //   endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
  //   credentials: {
  //     accessKeyId: config.r2AccessKeyId,
  //     secretAccessKey: config.r2SecretAccessKey,
  //   },
  // })
  //
  // const key = `listings/${params.listingId}/${Date.now()}-${params.fileName}`
  // const command = new PutObjectCommand({
  //   Bucket: config.r2BucketName,
  //   Key: key,
  //   ContentType: params.contentType,
  // })
  //
  // const uploadUrl = await getSignedUrl(client, command, { expiresIn: 3600 })
  // const publicUrl = `https://pub-xxx.r2.dev/${key}`
  // return { uploadUrl, publicUrl }

  throw createError({
    statusCode: 501,
    statusMessage: 'Almacenamiento R2 no configurado. Agrega las credenciales en .env',
  })
}
