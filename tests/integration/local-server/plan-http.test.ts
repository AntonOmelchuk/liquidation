import { JOURNAL_ROUTES } from "@liquidation/domain/journal/constants";
import { journalSchema } from "@liquidation/domain/journal/journal";
import type { PlanCommand, PlanSetup } from "@liquidation/domain/plans/types";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";

import { journalHandler } from "../../../apps/local-server/src/http/journal-handler.ts";
import { createJournal } from "../../../apps/local-server/src/journal.ts";

const previewPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/1kAAAAASUVORK5CYII=",
  "base64",
);

test("serves plan screenshots and preserves the original analysis when a plan is edited", async () => {
  const directory = await mkdtemp(join(tmpdir(), "liquidation-plan-photos-"));
  const server = createServer(journalHandler(createJournal(directory)));
  try {
    server.listen(0, "127.0.0.1");
    await once(server, "listening");
    const origin = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    const id = randomUUID();
    const originalShot = randomUUID();
    const invalidShot = randomUUID();
    const replacementShot = randomUUID();
    const updateShot = randomUUID();
    const setup: PlanSetup = {
      title: "План на NYKZ",
      symbol: "EURUSD",
      direction: "short",
      narrative: "bearish",
      startsOn: "2026-11-23",
      endsOn: "2026-11-27",
      entryCondition: "Зачекати на підтвердження.",
      analysis: [
        {
          id: randomUUID(),
          timeframe: "H4",
          text: "Контекст",
          screenshotIds: [originalShot],
        },
      ],
    };

    function post(command: PlanCommand, shot?: string, bytes = previewPng) {
      const url = origin + JOURNAL_ROUTES.plans;
      if (!shot) {
        return fetch(url, {
          method: "POST",
          body: JSON.stringify(command),
          headers: { "Content-Type": "application/json" },
        });
      }
      const receipt = new FormData();
      receipt.set("command", JSON.stringify(command));
      receipt.set(
        `shot:${shot}`,
        new Blob([new Uint8Array(bytes)], { type: "image/png" }),
        "chart.png",
      );
      return fetch(url, { method: "POST", body: receipt });
    }

    const create: PlanCommand = { action: "create", id, setup };
    expect((await post(create)).status).toBe(422);
    expect((await post(create, originalShot)).status).toBe(200);
    expect((await post(create, originalShot)).status).toBe(200);

    let shotResponse = await fetch(
      origin + JOURNAL_ROUTES.planScreenshot + originalShot,
    );
    expect(shotResponse.headers.get("content-type")).toBe("image/png");
    expect(shotResponse.headers.get("x-content-type-options")).toBe("nosniff");
    expect(Buffer.from(await shotResponse.arrayBuffer())).toEqual(previewPng);

    const edit = {
      action: "edit" as const,
      id,
      revision: 1,
      review: { status: "worked" as const },
      setup: { ...setup, analysis: undefined },
    };
    expect(
      (
        await post(
          {
            ...edit,
            setup: { ...edit.setup, screenshotIds: [invalidShot] },
          },
          invalidShot,
          Buffer.from("This file is not a raster screenshot."),
        )
      ).status,
    ).toBe(415);
    expect(
      (
        await post(
          {
            ...edit,
            setup: { ...edit.setup, screenshotIds: [replacementShot] },
          },
          replacementShot,
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await post(
          {
            action: "add-update",
            id,
            revision: 2,
            eventId: randomUUID(),
            note: { text: "Рівень перевірено", screenshotIds: [updateShot] },
          },
          updateShot,
        )
      ).status,
    ).toBe(200);

    const persisted = await createJournal(directory).read();
    expect(persisted.plans[0]).toMatchObject({
      revision: 3,
      originalSetup: setup,
      review: edit.review,
      setup: { screenshotIds: [replacementShot] },
      events: [{ kind: "update", note: { screenshotIds: [updateShot] } }],
    });
    expect(
      journalSchema.parse(
        await (await fetch(origin + JOURNAL_ROUTES.plans)).json(),
      ).plans,
    ).toHaveLength(1);
    expect((await post(edit)).status).toBe(409);
    expect(
      (await fetch(origin + JOURNAL_ROUTES.planScreenshot + invalidShot))
        .status,
    ).toBe(404);
    shotResponse = await fetch(
      origin + JOURNAL_ROUTES.planScreenshot + originalShot,
    );
    expect(shotResponse.status).toBe(200);
  } finally {
    if (server.listening) {
      server.close();
      await once(server, "close");
    }
    await rm(directory, { recursive: true, force: true });
  }
});
