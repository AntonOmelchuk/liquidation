import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "../messages.ts";
import { useScreenshotMessages } from "./messages.ts";
import type { ScreenshotDialogProps } from "./types.ts";

export function ScreenshotDialog({
  source,
  title,
  onClose,
}: ScreenshotDialogProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useId();
  const { t } = useLocale();
  const messages = useScreenshotMessages();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (dialog.current && !dialog.current.open) dialog.current.showModal();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="screenshot-viewer"
      aria-labelledby={heading}
      onCancel={(event) => event.stopPropagation()}
      onClose={(event) => {
        event.stopPropagation();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close();
      }}
    >
      <header className="screenshot-viewer-heading">
        <h2 id={heading}>{title}</h2>
        <button
          type="button"
          className="secondary"
          onClick={() => dialog.current?.close()}
        >
          {t.close}
        </button>
      </header>
      {failed ? (
        <p role="status">{messages.unavailable}</p>
      ) : (
        <img
          src={source}
          alt={title}
          draggable={false}
          onError={() => setFailed(true)}
        />
      )}
    </dialog>
  );
}
