import { PLAYBOOK_ACTION } from "@liquidation/domain/playbooks/constants";
import { playbookCommand } from "@liquidation/domain/playbooks/playbook";
import { playbookReviewProgress } from "@liquidation/domain/playbooks/playbook-performance";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { NEW_DRAFT } from "../../../shared/constants.ts";
import { useLocale } from "../../../shared/messages.ts";
import { SCREENSHOT_ERROR } from "../../../shared/screenshots/constants.ts";
import {
  collectScreenshots,
  existingScreenshots,
} from "../../../shared/screenshots/draft.ts";
import { useScreenshotMessages } from "../../../shared/screenshots/messages.ts";
import { ScreenshotField } from "../../../shared/screenshots/screenshot-field.tsx";
import { ScreenshotGallery } from "../../../shared/screenshots/screenshot-gallery.tsx";
import { Panel } from "../../../shared/ui/layout.tsx";
import { JournalRequestError } from "../../journal/data/api.ts";
import { useJournal } from "../../journal/data/store.ts";
import { usePlaybookMessages } from "../messages.ts";
import type { PlaybookReviewsProps, ReviewFormProps } from "./types.ts";

function ReviewForm({ book, previous, finish }: ReviewFormProps) {
  const b = usePlaybookMessages();
  const { t } = useLocale();
  const screenshots = useScreenshotMessages();
  const addReview = useJournal((state) => state.updatePlaybook);
  const [revision] = useState(book.revision);
  const [reviewId] = useState(() => previous?.id ?? crypto.randomUUID());
  const [shots, setShots] = useState(() =>
    existingScreenshots(previous?.screenshotIds),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<
    | "invalidReview"
    | typeof SCREENSHOT_ERROR.UPLOAD_LIMIT
    | "saveError"
    | "conflict"
  >();
  const text = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    text.current?.focus();
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const data = new FormData(event.currentTarget);
    const command = playbookCommand.safeParse({
      action: previous
        ? PLAYBOOK_ACTION.EDIT_REVIEW
        : PLAYBOOK_ACTION.ADD_REVIEW,
      id: book.id,
      revision,
      reviewId,
      note: {
        text: data.get("text"),
        screenshotIds: shots.map(({ id }) => id),
      },
    });
    if (!command.success) {
      setError("invalidReview");
      return;
    }
    const files = collectScreenshots([shots]);
    if (!files) {
      setError(SCREENSHOT_ERROR.UPLOAD_LIMIT);
      return;
    }
    setSaving(true);
    setError(undefined);
    try {
      await addReview(command.data, files);
      finish();
    } catch (failure) {
      setError(
        failure instanceof JournalRequestError && failure.status === 409
          ? "conflict"
          : "saveError",
      );
      setSaving(false);
    }
  }

  return (
    <form className="timeline-form" onSubmit={save}>
      <fieldset disabled={saving}>
        <label className="wide">
          {b.reviewNotes}
          <textarea
            name="text"
            rows={4}
            ref={text}
            defaultValue={previous?.text}
            maxLength={4000}
          />
        </label>
        <div className="wide">
          <ScreenshotField
            value={shots}
            onChange={setShots}
            disabled={saving}
          />
        </div>
        {error && (
          <p className="wide error" role="alert">
            {error === SCREENSHOT_ERROR.UPLOAD_LIMIT
              ? screenshots.uploadLimit
              : b[error]}
          </p>
        )}
        <div className="wide record-form-actions">
          <button type="button" className="secondary" onClick={finish}>
            {t.cancel}
          </button>
          <button type="submit">{saving ? t.saving : b.saveReview}</button>
        </div>
      </fieldset>
    </form>
  );
}

export function PlaybookReviews({ book, count }: PlaybookReviewsProps) {
  const b = usePlaybookMessages();
  const { format } = useLocale();
  const [editing, setEditing] = useState<string | null>(null);
  const progress = playbookReviewProgress(book, count);
  const finish = () => setEditing(null);

  return (
    <Panel
      title={b.review}
      detail={
        <button
          type="button"
          className="secondary"
          disabled={Boolean(editing)}
          onClick={() => setEditing(NEW_DRAFT)}
        >
          {b.writeReview}
        </button>
      }
    >
      {progress && (
        <div className="review-progress">
          <span>
            {b.reviewProgress} · {format.integer.format(progress.progress)} /{" "}
            {format.integer.format(progress.size)}
          </span>
          {progress.due > 0 && (
            <strong className="review-due">
              {b.reviewDue} · {format.integer.format(progress.due)}
            </strong>
          )}
        </div>
      )}
      {editing === NEW_DRAFT && <ReviewForm book={book} finish={finish} />}
      {book.reviews.length ? (
        <ol className="plan-timeline">
          {book.reviews.toReversed().map((review) => (
            <li key={review.id}>
              <div className="plan-actions">
                <time dateTime={review.at}>
                  {format.date.format(Date.parse(review.at))}
                </time>
                {!editing && (
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setEditing(review.id)}
                  >
                    {b.editReview}
                  </button>
                )}
              </div>
              {editing === review.id ? (
                <ReviewForm book={book} previous={review} finish={finish} />
              ) : (
                <>
                  {review.text && <p>{review.text}</p>}
                  <ScreenshotGallery ids={review.screenshotIds} />
                </>
              )}
            </li>
          ))}
        </ol>
      ) : (
        !editing && <p>{b.noReviews}</p>
      )}
    </Panel>
  );
}
