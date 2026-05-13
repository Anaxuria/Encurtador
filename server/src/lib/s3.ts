import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || "";
const accessKeyId = process.env.CLOUDFLARE_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.CLOUDFLARE_SECRET_ACCESS_KEY || "";
const bucket = process.env.CLOUDFLARE_BUCKET || "";
const publicBaseUrl = process.env.CLOUDFLARE_PUBLIC_URL || "";

const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function putCsvObject(
  keyPrefix: string,
  body: Buffer | Uint8Array | string,
) {
  const key = `${keyPrefix}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.csv`;
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: "text/csv",
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const url = `${publicBaseUrl.replace(/\/$/, "")}/${key}`;
  return { key, url };
}
