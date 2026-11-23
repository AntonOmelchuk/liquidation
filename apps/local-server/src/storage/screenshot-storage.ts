import {
  MAX_SCREENSHOT_BYTES,
  RASTER_TYPE,
} from "@liquidation/domain/evidence/constants";
import { screenshotIdSchema } from "@liquidation/domain/evidence/screenshots";
import { HTTP_STATUS } from "@liquidation/domain/journal/constants";
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { FILE_ERROR, RASTER_SIGNATURE } from "../constants.ts";
import { JournalConflict, RequestError } from "../errors.ts";

function rasterType(bytes: Buffer) {
  if (
    bytes.length >= 33 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.toString("ascii", 12, 16) === RASTER_SIGNATURE.PNG_HEADER
  )
    return RASTER_TYPE.PNG;
  if (
    bytes.length > 4 &&
    bytes[0] === 255 &&
    bytes[1] === 216 &&
    bytes[2] === 255 &&
    bytes.at(-2) === 255 &&
    bytes.at(-1) === 217
  )
    return RASTER_TYPE.JPEG;
  if (
    bytes.length >= 20 &&
    bytes.toString("ascii", 0, 4) === RASTER_SIGNATURE.RIFF &&
    bytes.toString("ascii", 8, 12) === RASTER_SIGNATURE.WEBP
  )
    return RASTER_TYPE.WEBP;
  if (
    bytes.length >= 14 &&
    ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))
  )
    return RASTER_TYPE.GIF;
  return null;
}

function validatedBytes(data: Uint8Array) {
  if (data.byteLength > MAX_SCREENSHOT_BYTES)
    throw new RequestError(
      HTTP_STATUS.CONTENT_TOO_LARGE,
      "The screenshot is too large.",
    );
  const bytes = Buffer.from(data);
  if (!rasterType(bytes))
    throw new RequestError(
      HTTP_STATUS.UNSUPPORTED_MEDIA_TYPE,
      "Use PNG, JPEG, WebP or GIF screenshots.",
    );
  return bytes;
}

export function createScreenshotStorage(dataDirectory: string) {
  const directory = join(dataDirectory, "screenshots");

  async function read(id: string) {
    if (!screenshotIdSchema.safeParse(id).success) return null;
    try {
      const bytes = await readFile(join(directory, id));
      const type = rasterType(bytes);
      return type ? { bytes, type } : null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === FILE_ERROR.NOT_FOUND)
        return null;
      throw error;
    }
  }

  async function write(uploads: ReadonlyMap<string, Uint8Array>) {
    const created: string[] = [];
    const rollback = async () => {
      await Promise.allSettled(
        created.map((path) => rm(path, { force: true })),
      );
    };
    if (!uploads.size) return rollback;

    const validated = [...uploads].map(
      ([id, bytes]) =>
        [screenshotIdSchema.parse(id), validatedBytes(bytes)] as const,
    );
    await mkdir(directory, { recursive: true, mode: 0o700 });
    try {
      for (const [id, bytes] of validated) {
        const path = join(directory, id);
        const temporary = join(directory, `.upload-${randomUUID()}.tmp`);
        try {
          await writeFile(temporary, bytes, {
            flag: "wx",
            mode: 0o600,
            flush: true,
          });
          await link(temporary, path);
          created.push(path);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== FILE_ERROR.EXISTS)
            throw error;
          if (!(await readFile(path)).equals(bytes)) {
            throw new JournalConflict(
              "The screenshot ID already has different content.",
            );
          }
        } finally {
          await rm(temporary, { force: true }).catch(() => undefined);
        }
      }
    } catch (error) {
      await rollback();
      throw error;
    }

    return rollback;
  }

  return { read, write };
}
