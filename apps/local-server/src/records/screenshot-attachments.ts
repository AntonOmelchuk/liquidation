import { InvalidJournalInput } from "../errors.ts";

export function assertScreenshotAttachments(
  before: ReadonlySet<string>,
  after: ReadonlySet<string>,
  uploads: ReadonlyMap<string, Uint8Array>,
) {
  if ([...after].some((id) => !before.has(id) && !uploads.has(id))) {
    throw new InvalidJournalInput(
      "A referenced screenshot is missing from the request.",
    );
  }
  if ([...uploads.keys()].some((id) => !after.has(id))) {
    throw new InvalidJournalInput(
      "A screenshot is not attached to this record.",
    );
  }
}
