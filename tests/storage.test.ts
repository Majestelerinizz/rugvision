import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

describe("storage local driver", () => {
  it("saveModel and readModel round-trip", async () => {
    const prev = process.env.STORAGE_DRIVER;
    process.env.STORAGE_DRIVER = "local";

    const tmp = await mkdtemp(path.join(os.tmpdir(), "rugvision-storage-"));
    const prevCwd = process.cwd();
    process.chdir(tmp);
    await import("node:fs/promises").then((fs) =>
      fs.mkdir(path.join(tmp, "public", "models"), { recursive: true })
    );

    try {
      const { storage } = await import("../lib/storage");
      const data = Buffer.from("test-glb-content");
      const saved = await storage.saveModel("test-rug.glb", data, "model/gltf-binary");
      assert.equal(saved.fileName, "test-rug.glb");
      assert.equal(saved.url, "/models/test-rug.glb");

      const read = await storage.readModel("test-rug.glb");
      assert.ok(read);
      assert.equal(read.toString(), "test-glb-content");

      const onDisk = await readFile(path.join(tmp, "public", "models", "test-rug.glb"));
      assert.equal(onDisk.toString(), "test-glb-content");
    } finally {
      process.chdir(prevCwd);
      await rm(tmp, { recursive: true, force: true });
      if (prev === undefined) delete process.env.STORAGE_DRIVER;
      else process.env.STORAGE_DRIVER = prev;
    }
  });
});
