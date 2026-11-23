export class JournalConflict extends Error {}
export class InvalidJournalInput extends Error {}

export class RequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
