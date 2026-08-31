import { S3Client } from "@aws-sdk/client-s3";

// S3Client nie rzuca w konstruktorze na brakujące dane, ale moduł jest
// importowany podczas builda (zbieranie danych stron), więc — analogicznie do
// stripe.ts — brak zmiennych R2 w środowisku (np. lokalnie przed
// skonfigurowaniem R2) nie może wywalać builda.
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID || "missing-account-id"}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID || "missing-access-key-id",
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "missing-secret-access-key",
  },
});

export const R2_BUCKET = process.env.CLOUDFLARE_R2_BUCKET_NAME || "missing-bucket-name";
export const R2_PUBLIC_URL = process.env.CLOUDFLARE_R2_PUBLIC_URL || "";
