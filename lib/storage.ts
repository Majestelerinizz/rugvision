import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

export type SavedModel = {
  fileName: string;
  url: string;
};

export interface StorageDriver {
  saveModel(
    fileName: string,
    data: Buffer,
    contentType: string
  ): Promise<SavedModel>;
  readModel(fileName: string): Promise<Buffer | null>;
}

class LocalStorageDriver implements StorageDriver {
  private modelsDir() {
    return path.join(process.cwd(), "public", "models");
  }

  async saveModel(
    fileName: string,
    data: Buffer,
    _contentType: string
  ): Promise<SavedModel> {
    void _contentType;
    const dir = this.modelsDir();
    await mkdir(dir, { recursive: true });
    const safeName = path.basename(fileName);
    await writeFile(path.join(dir, safeName), data);
    return { fileName: safeName, url: `/models/${safeName}` };
  }

  async readModel(fileName: string): Promise<Buffer | null> {
    const safeName = path.basename(fileName);
    try {
      return await readFile(path.join(this.modelsDir(), safeName));
    } catch {
      return null;
    }
  }
}

class S3StorageDriver implements StorageDriver {
  private client: S3Client;
  private bucket: string;
  private publicBase: string;
  private prefix: string;

  constructor() {
    const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET;
    const region = process.env.S3_REGION || "auto";
    const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
    const accessKeyId =
      process.env.S3_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey =
      process.env.S3_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY;

    if (!bucket || !accessKeyId || !secretAccessKey) {
      throw new Error(
        "S3/R2 storage: S3_BUCKET (veya R2_BUCKET) ve access key env degiskenleri zorunlu."
      );
    }

    this.bucket = bucket;
    this.prefix = (process.env.S3_PREFIX || "models").replace(/\/$/, "");
    this.publicBase = (
      process.env.S3_PUBLIC_URL ||
      process.env.R2_PUBLIC_URL ||
      ""
    ).replace(/\/$/, "");

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: Boolean(endpoint),
    });
  }

  private objectKey(fileName: string) {
    const safeName = path.basename(fileName);
    return `${this.prefix}/${safeName}`;
  }

  private publicUrl(fileName: string) {
    const safeName = path.basename(fileName);
    if (this.publicBase) {
      return `${this.publicBase}/${this.prefix}/${safeName}`;
    }
    return `/${this.prefix}/${safeName}`;
  }

  async saveModel(
    fileName: string,
    data: Buffer,
    contentType: string
  ): Promise<SavedModel> {
    const safeName = path.basename(fileName);
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: this.objectKey(safeName),
        Body: data,
        ContentType: contentType,
      })
    );
    return { fileName: safeName, url: this.publicUrl(safeName) };
  }

  async readModel(fileName: string): Promise<Buffer | null> {
    const safeName = path.basename(fileName);
    try {
      const res = await this.client.send(
        new GetObjectCommand({
          Bucket: this.bucket,
          Key: this.objectKey(safeName),
        })
      );
      if (!res.Body) return null;
      const bytes = await res.Body.transformToByteArray();
      return Buffer.from(bytes);
    } catch {
      return null;
    }
  }
}

function createStorageDriver(): StorageDriver {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  switch (driver) {
    case "s3":
    case "r2":
      return new S3StorageDriver();
    case "local":
    default:
      return new LocalStorageDriver();
  }
}

export const storage: StorageDriver = createStorageDriver();
