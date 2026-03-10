import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  CopyObjectCommand,
  DeleteObjectCommand,
  PutObjectCommand,
  GetObjectCommand,
  ListBucketsCommand,
} from "@aws-sdk/client-s3";

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID!;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY!;

export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});

export interface R2File {
  key: string;
  size: number;
  lastModified: string;
  etag?: string;
}

export interface R2Bucket {
  name: string;
  creationDate?: string;
}

export async function listBuckets(): Promise<R2Bucket[]> {
  const command = new ListBucketsCommand({});
  const response = await r2Client.send(command);
  return (response.Buckets || []).map((b) => ({
    name: b.Name!,
    creationDate: b.CreationDate?.toISOString(),
  }));
}

export async function listFiles(
  bucket: string,
  prefix?: string,
  continuationToken?: string
): Promise<{ files: R2File[]; folders: string[]; nextToken?: string; totalFiles: number }> {
  const command = new ListObjectsV2Command({
    Bucket: bucket,
    Prefix: prefix || undefined,
    Delimiter: "/",
    ContinuationToken: continuationToken || undefined,
    MaxKeys: 100,
  });

  const response = await r2Client.send(command);

  const files: R2File[] = (response.Contents || [])
    .filter((obj) => obj.Key !== prefix) // exclude the folder placeholder itself
    .map((obj) => ({
      key: obj.Key!,
      size: obj.Size || 0,
      lastModified: obj.LastModified?.toISOString() || "",
      etag: obj.ETag,
    }));

  const folders: string[] = (response.CommonPrefixes || []).map(
    (p) => p.Prefix!
  );

  return {
    files,
    folders,
    nextToken: response.NextContinuationToken,
    totalFiles: response.KeyCount || 0,
  };
}

export async function deleteFiles(bucket: string, keys: string[]): Promise<void> {
  if (keys.length === 0) return;

  // S3 DeleteObjects supports max 1000 keys per request
  const batches: string[][] = [];
  for (let i = 0; i < keys.length; i += 1000) {
    batches.push(keys.slice(i, i + 1000));
  }

  for (const batch of batches) {
    const command = new DeleteObjectsCommand({
      Bucket: bucket,
      Delete: {
        Objects: batch.map((key) => ({ Key: key })),
        Quiet: true,
      },
    });
    await r2Client.send(command);
  }
}

export async function renameFile(
  bucket: string,
  oldKey: string,
  newKey: string
): Promise<void> {
  // Copy to new key then delete old
  const copyCommand = new CopyObjectCommand({
    Bucket: bucket,
    CopySource: `${bucket}/${oldKey}`,
    Key: newKey,
  });
  await r2Client.send(copyCommand);

  const deleteCommand = new DeleteObjectCommand({
    Bucket: bucket,
    Key: oldKey,
  });
  await r2Client.send(deleteCommand);
}

export async function uploadFile(
  bucket: string,
  key: string,
  body: Buffer | Uint8Array,
  contentType?: string
): Promise<void> {
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
  });
  await r2Client.send(command);
}

export interface PrefixStats {
  prefix: string;
  totalSize: number;
  fileCount: number;
}

export async function getPrefixStats(
  bucket: string,
  prefix: string
): Promise<PrefixStats> {
  let totalSize = 0;
  let fileCount = 0;
  let continuationToken: string | undefined;

  do {
    const command = new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: prefix || undefined,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    });
    const response = await r2Client.send(command);
    for (const obj of response.Contents || []) {
      totalSize += obj.Size || 0;
      fileCount++;
    }
    continuationToken = response.NextContinuationToken;
  } while (continuationToken);

  return { prefix, totalSize, fileCount };
}

export async function getMultiplePrefixStats(
  bucket: string,
  prefixes: string[]
): Promise<PrefixStats[]> {
  return Promise.all(prefixes.map((p) => getPrefixStats(bucket, p)));
}

export async function getFileContent(
  bucket: string,
  key: string
): Promise<{ body: ReadableStream; contentType?: string }> {
  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  const response = await r2Client.send(command);
  return {
    body: response.Body!.transformToWebStream(),
    contentType: response.ContentType,
  };
}
