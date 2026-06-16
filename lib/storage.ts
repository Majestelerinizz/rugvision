import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Model dosyalari icin depolama soyutlamasi.
// Su an yerel disk kullanilir; Faz 3'te STORAGE_DRIVER ile R2/S3/B2 eklenecek.
// Kod tarafi degismez; sadece yeni bir driver eklenip secilir.

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
}

class LocalStorageDriver implements StorageDriver {
  async saveModel(fileName: string, data: Buffer): Promise<SavedModel> {
    const dir = path.join(process.cwd(), "public", "models");
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, fileName), data);
    return { fileName, url: `/models/${fileName}` };
  }
}

// TODO (Faz 3 - Adim 2): R2/S3 driver
// class S3StorageDriver implements StorageDriver { ... }

function createStorageDriver(): StorageDriver {
  const driver = (process.env.STORAGE_DRIVER || "local").toLowerCase();
  switch (driver) {
    case "local":
    default:
      return new LocalStorageDriver();
  }
}

export const storage: StorageDriver = createStorageDriver();
